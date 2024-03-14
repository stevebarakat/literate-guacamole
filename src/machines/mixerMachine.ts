import { animationFrameScheduler, interval } from "rxjs";
import {
  Transport as t,
  Channel,
  Destination,
  Player,
  start,
  loaded,
  FeedbackDelay,
  PitchShift,
} from "tone";
import {
  assertEvent,
  assign,
  setup,
  fromObservable,
  fromPromise,
  stopChild,
  createMachine,
} from "xstate";
import { scale, logarithmically } from "@/utils";
import { trackMachine } from "./trackMachine";
import { clockMachine } from "./clockMachine";
import { createActorContext } from "@xstate/react";
import { produce } from "immer";

export const mixerMachine = setup({
  types: {
    context: {} as {},
    events: {} as
      | { type: "CHANGE_PAN" }
      | { type: "CHANGE_VOLUME" }
      | { type: "UPDATE_FX_NAMES" },
  },
  actions: {
    setVolume: assign(({ context, event }) => {
      assertEvent(event, "CHANGE_VOLUME");
      const volume = parseFloat(event.volume.toFixed(2));
      const scaled = scale(logarithmically(volume));
      produce(context, (draft) => {
        draft.channel.volume.value = scaled;
      });
      return { volume };
    }),

    setPan: assign(({ context, event }) => {
      assertEvent(event, "CHANGE_PAN");
      const pan = event.pan.toFixed(2);
      produce(context, (draft) => {
        draft.channel.pan.value = pan;
      });
      return { pan };
    }),
    setFxNames: assign(({ context, event }) => {
      assertEvent(event, "UPDATE_FX_NAMES");

      if (event.action === "add") {
        const spliced = context.fxNames.toSpliced(event.fxId, 1);
        const fxSpliced = context.fx.toSpliced(event.fxId, 1);
        context.fx[event.fxId]?.dispose();

        switch (event.fxName) {
          case "delay":
            return {
              fxNames: [...spliced, event.fxName],
              fx: [...fxSpliced, new FeedbackDelay().toDestination()],
            };

          case "pitchShift":
            return {
              fxNames: [...spliced, event.fxName],
              fx: [...fxSpliced, new PitchShift().toDestination()],
            };

          default:
            break;
        }
      } else {
        context.fx[event.fxId].dispose();
        return {
          fxNames: context.fxNames.toSpliced(event.fxId, 1),
          fx: context.fx.toSpliced(event.fxId, 1),
        };
      }
    }),
    setSourceSong: assign(({ event }) => {
      assertEvent(event, "SELECT_SONG");
      return { sourceSong: event.song };
    }),

    buildMixer: assign(({ context, spawn }) => {
      start();

      let trackMachineRefs = [];
      const clockMachineRef = spawn(clockMachine, {
        id: "clock-machine",
        input: {
          sourceSong: context.sourceSong,
        },
      });
      context.sourceSong.tracks.forEach((track, i) => {
        context.players[i] = new Player(track.path)
          .sync()
          .start(0, context.sourceSong?.startPosition);
        context.channels[i] = new Channel().toDestination();
        context.players[i]?.connect(context.channels[i]);
        trackMachineRefs = [
          ...trackMachineRefs,
          spawn(trackMachine, {
            id: `track-${i}`,
            input: {
              channel: context.channels[i],
              track: context.sourceSong!.tracks[i],
            },
          }),
        ];
      });
      return {
        trackMachineRefs,
        clockMachineRef,
      };
    }),
    reset: () => t.stop(),
    play: () => t.start(),
    pause: () => t.pause(),
    seek: ({ event }) => {
      assertEvent(event, "SEEK");
      if (event.direction === "forward") {
        t.seconds = t.seconds + 10;
      } else {
        t.seconds = t.seconds - 10;
      }
    },
    stopClock: () => stopChild("ticker"),
    setMainVolume: assign(({ event }) => {
      assertEvent(event, "CHANGE_VOLUME");
      const scaled = scale(logarithmically(event.volume));
      Destination.volume.value = scaled;
      return { volume: event.volume };
    }),
    disposeTracks: assign(({ context }) => {
      context.players?.forEach((player: Player | undefined, i: number) => {
        player?.dispose();
        context.channels[i]?.dispose();
      });
      return {
        channels: [],
        players: [],
      };
    }),
  },
  actors: {
    builder: fromPromise(async () => await loaded()),
    ticker: fromObservable(() => interval(0, animationFrameScheduler)),
  },
  guards: {
    "canPlay?": function ({ context, event }) {
      // Add your guard condition here
      return true;
    },
    "canStop?": function ({ context, event }) {
      // Add your guard condition here
      return true;
    },
    "canSeek?": function ({ context, event }) {
      // Add your guard condition here
      return true;
    },
  },
  schemas: {
    events: {
      CHANGE_PAN: {
        type: "object",
        properties: {},
      },
      CHANGE_VOLUME: {
        type: "object",
        properties: {},
      },
      UPDATE_FX_NAMES: {
        type: "object",
        properties: {},
      },
    },
  },
}).createMachine({
  context: {
    players: [],
    channels: [],
    currentTime: 0,
  },
  id: "mixerMachine",
  initial: "notReady",
  on: {
    SELECT_SONG: {
      target: "#mixerMachine.building",
      actions: {
        type: "setSourceSong",
      },
    },
  },
  entry: {
    type: "disposeTracks",
  },
  states: {
    notReady: {},
    error: {
      entry: {
        type: "disposeTracks",
      },
    },
    building: {
      entry: {
        type: "buildMixer",
      },
      invoke: {
        src: "builder",
        input: ({ context }) => ({ sourceSong: context.sourceSong }),
        onDone: {
          target: "ready",
        },
        onError: {
          target: "error",
          actions: ({ event }) => {
            console.error(event.error);
          },
        },
      },
    },
    ready: {
      type: "parallel",
      on: {
        RESET: {
          target: "#mixerMachine.ready.stopped",
          actions: {
            type: "reset",
          },
          guard: {
            type: "canStop?",
          },
        },
        SEEK: {
          actions: {
            type: "seek",
          },
          guard: {
            type: "canSeek?",
          },
        },
        CHANGE_VOLUME: {
          actions: {
            type: "setMainVolume",
          },
        },
      },
      exit: [
        {
          type: "reset",
        },
        {
          type: "disposeTracks",
        },
      ],
      states: {
        stopped: {
          on: {
            START: {
              target: "started",
              actions: {
                type: "play",
              },
              guard: {
                type: "canPlay?",
              },
            },
          },
        },
        started: {
          on: {
            PAUSE: {
              target: "stopped",
              actions: {
                type: "pause",
              },
              guard: {
                type: "canStop?",
              },
            },
          },
        },
        trackMachine: {
          type: "parallel",
          on: {
            UPDATE_FX_NAMES: {
              actions: {
                type: "setFxNames",
              },
            },
            CHANGE_VOLUME: {
              actions: {
                type: "setVolume",
              },
            },
            CHANGE_PAN: {
              actions: {
                type: "setPan",
              },
            },
          },
          states: {
            Solo: {
              initial: "inactive",
              states: {
                inactive: {
                  on: {
                    TOGGLE: {
                      target: "active",
                    },
                  },
                },
                active: {
                  on: {
                    TOGGLE: {
                      target: "inactive",
                    },
                  },
                },
              },
            },
            Mute: {
              initial: "inactive",
              states: {
                inactive: {
                  on: {
                    TOGGLE: {
                      target: "active",
                    },
                  },
                },
                active: {
                  on: {
                    TOGGLE: {
                      target: "inactive",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});

export const MixerContext = createActorContext(mixerMachine);
