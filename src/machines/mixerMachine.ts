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
  createMachine,
  fromObservable,
  fromPromise,
  stopChild,
} from "xstate";
import { scale, logarithmically } from "@/utils";
import { trackMachine } from "./trackMachine";
import { clockMachine } from "./clockMachine";
import { createActorContext } from "@xstate/react";

type InitialContext = {
  currentTime: number;
  volume: number;
  sourceSong?: SourceSong | undefined;
  players: (Player | undefined)[];
  channels: (Channel | undefined)[];
};

export const mixerMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QFsCWAPMAnAsgQwGMALVAOzADpSB7AFwCUw8IBPAYgGUBRAGS4GEAKgH0OAeQByAcQDaABgC6iUAAdqsVLVTVSykOkQAOACwBmCgCYA7AFYAbHLtW5N0xeMBOADQgWiT4aWZhYAjMZ21lZRNgC+MT5omLiEJOQUAEYArqgANhBkUGwQOpRkAG7UANaUWbkQ2PJKSCBqGlo6egYIIXLhFB7uxsZWdoZWhh52Pn4IzhYUNnJjTmYmLsZxCRjY+MRkNdl5BWzYWNRYFCo5eLQAZufIGYf1WI16rZraus1dHoaBFg8IQsplcvQsNg8NmmRkhCzMISsplMdhCNhGmxAiR2KX2FCwTFYFFgtGoKhUkDYAAUeABBACab2aH3a31AXWB-wW-1cwLsNhCHm8vkQ4zk-TkVg8UqWExCaMx2OSezSBOYLGJtDwWFolKptIAqtwmap1J8Oj9EGi5OZTMCog4XAMrDDZosKCZ0UtJh4XPZFdtlalKGrWGx6FxuIITS0zazOlbBYFQW4RnabALDK6ejZApM7MZgciJqEA0ldsH8YT2NwuABpGMsr4J7rGCyBex-Cx2Aa+ybZkKmDwLRGOhwFqxxeIgGj1eDNJUV-bvOPNy0IAC0xizIs33bkZZxKsoNAY1ZXbTX7NFITsHsMvUcEw826sFldNgs83cbjCESiUQbNOi64mkpznBe5psvoopyOKhhfnI1jWGM7jCjMJjDs4ExOkKSK2IeQZ4rURykFAkHxuuzjGAsfyDm+P4TKYroFjRcHLFYqzGOshFLqq57MquFrXt07jirmhi8t2ApCh+cESlKMr-ECg68aBIbVpqZIUhAFFXjBolAhQspSfygroTeNG+opvrKfKFhqceVbqpq2q6rpgmXsJBl-uYPZuIshjyreISuoYQ4UD0UIZuM4xCrEU5AA */
    id: "mixerMachine",

    context: {
      volume: -32,
      currentTime: 0,
      sourceSong: undefined,
      players: [undefined],
      channels: [undefined],
    },

    entry: "disposeTracks",

    states: {
      notReady: {
        on: {
          SELECT_SONG: {
            target: "building",
            actions: "setSourceSong",
          }
        }
      },

      error: {
        entry: "disposeTracks",
        type: "final"
      },

      building: {
        entry: "buildMixer",

        invoke: {
          src: "builder",
          input: ({ context }) => ({ sourceSong: context.sourceSong }),

          onDone: "ready",

          onError: {
            target: "error",
            actions: "logError",
          },

          id: "builder"
        }
      },

      ready: {
        on: {
          CHANGE_VOLUME: {
            actions: {
              type: "setMainVolume",
            },
          }
        },

        exit: ["reset", "disposeTracks"],
        states: {
          stopped: {},

          started: {},

          trackMachine: {
            type: "parallel",

            states: {
              solo: {
                initial: "inactive",

                states: {
                  inactive: {
                    on: {
                      TOGGLE: "active"
                    }
                  },

                  active: {
                    on: {
                      TOGGLE: "inactive"
                    }
                  }
                }
              },
              mute: {
                initial: "inactive",

                states: {
                  inactive: {
                    on: {
                      TOGGLE: "active"
                    }
                  },

                  active: {
                    on: {
                      TOGGLE: "inactive"
                    }
                  }
                }
              }
            },

            on: {
              CHANGE_VOLUME: {
                target: undefined,
                actions: "setVolume"
              },
              CHANGE_PAN: {
                target: undefined,
                actions: "setPan"
              },
              CHANGE_FX: {
                target: undefined,
                actions: "setFxNames"
              }
            }
          },

          transportMachine: {
            states: {
              stopped: {
                on: {
                  START: {
                    target: "started",
                    cond: "canPlay?",
                    actions: "play"
                  },

                  PAUSE: {
                    target: "started",
                    cond: "canStop?",
                    actions: "pause"
                  }
                }
              },

              started: {}
            },

            initial: "stopped",

            on: {
              SEEK: [{
                target: undefined,
                cond: "canSeek?",
                actions: "seek"
              }, {
                target: "transportMachine",
                internal: true,
                cond: "canSeek?"
              }]
            }
          }
        },

        type: "parallel",
      },

      inactive: {
        on: {
          TOGGLE: "active"
        }
      },

      active: {
        on: {
          TOGGLE: "inactive"
        }
      },

      "inactive (copy)": {
        on: {
          TOGGLE: "active (copy)"
        }
      },

      "active (copy)": {
        on: {
          TOGGLE: "inactive (copy)"
        }
      },

      Solo: {
        states: {
          inactive: {
            on: {
              TOGGLE: "active"
            }
          },

          active: {
            on: {
              TOGGLE: "inactive"
            }
          }
        }
      },

      ready: {
        states: {
          stopped: {
            on: {
              PLAY: {
                target: "started",
                cond: "canPlay?"
              }
            }
          },
          started: {
            on: {
              PAUSE: {
                target: "stopped",
                cond: "canStop?"
              }
            }
          }
        },

        initial: "stopped",
        entry: ["reset", "disposeTracks"],

        on: {
          RESET: {
            target: undefined,
            cond: "canStop?",
            actions: "reset"
          },
          SEEK: {
            target: undefined,
            cond: "canSeek?",
            actions: "seek"
          }
        }
      }
    },

    types: {
      context: {} as InitialContext,
      events: {} as
        | { type: "SELECT_SONG"; song: SourceSong }
        | { type: "START" }
        | { type: "PAUSE" }
        | { type: "RESET" }
        | { type: "SEEK"; direction: string; amount: number }
        | { type: "CHANGE_VOLUME"; volume: number },
    },

    initial: "notReady"
  },
  {
    actions: {
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
      "canSeek?": ({ context, event }) => {
        assertEvent(event, "SEEK");
        return event.direction === "forward"
          ? t.seconds < context.sourceSong!.endPosition - event.amount
          : t.seconds > event.amount;
      },

      "canStop?": () => t.seconds !== 0,
      "canPlay?": () => !(t.state === "started"),
    },
  }
);

export const MixerContext = createActorContext(mixerMachine);
