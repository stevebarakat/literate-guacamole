import { animationFrameScheduler, interval } from "rxjs";
import {
  Transport as t,
  Channel,
  Destination,
  Player,
  start,
  loaded,
} from "tone";
import {
  assertEvent,
  assign,
  setup,
  fromObservable,
  fromPromise,
  stopChild,
} from "xstate";
import { scale, logarithmically } from "@/utils";
import { trackMachine } from "../Track/trackMachine";
import { clockMachine } from "../Transport/clockMachine";
import { createActorContext } from "@xstate/react";

type InitialContext = {
  currentTime: number;
  volume: number;
  sourceSong?: SourceSong | undefined;
  players: (Player | undefined)[];
  channels: (Channel | undefined)[];
  audioBuffers: (AudioBuffer | undefined)[];
};

export const mixerMachine = setup({
  types: {
    context: {} as InitialContext,
    events: {} as
      | { type: "BUILD.MIXER"; song: SourceSong }
      | { type: "START" }
      | { type: "PAUSE" }
      | { type: "RESET" }
      | { type: "SEEK"; direction: string; amount: number }
      | { type: "CHANGE_VOLUME"; volume: number }
      | { type: "END" },
  },
  actions: {
    setSourceSong: assign(({ event }) => {
      assertEvent(event, "BUILD.MIXER");
      return { sourceSong: event.song };
    }),

    buildMixer: assign(({ context, spawn, self }) => {
      start();

      let trackMachineRefs: unknown = [];
      const clockMachineRef = spawn(clockMachine, {
        id: "clock-machine",
        input: {
          sourceSong: context.sourceSong,
        },
      });
      context.sourceSong?.tracks.forEach((track, i) => {
        context.players[i] = new Player(track.path)
          .sync()
          .start(0, context.sourceSong?.startPosition);
        context.channels[i] = new Channel().toDestination();
        context.players[i]?.connect(context.channels[i]!);
        trackMachineRefs = [
          ...trackMachineRefs,
          spawn(trackMachine, {
            id: `track-${i}`,
            input: {
              parent: self,
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
    "canSeek?": ({ context, event }) => {
      assertEvent(event, "SEEK");
      return event.direction === "forward"
        ? t.seconds < context.sourceSong!.endPosition - event.amount
        : t.seconds > event.amount;
    },

    "canStop?": () => t.seconds !== 0,
    "canPlay?": () => !(t.state === "started"),
  },
}).createMachine({
  context: {
    volume: -32,
    currentTime: 0,
    sourceSong: undefined,
    players: [undefined],
    channels: [undefined],
    audioBuffers: [undefined],
  },
  id: "mixerMachine",
  initial: "not ready",
  on: {
    "BUILD.MIXER": {
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
    "not ready": {},
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
        id: "mixerMachine.building:invocation[0]",
        input: {},
        onDone: {
          target: "ready",
        },
        onError: {
          target: "error",
          actions: ({ event }) => {
            console.error(event.error);
          },
        },
        src: "builder",
      },
    },
    ready: {
      initial: "stopped",
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
            END: {
              actions: {
                type: "stopClock",
              },
            },
          },
        },
      },
    },
  },
});

export const MixerContext = createActorContext(mixerMachine);
