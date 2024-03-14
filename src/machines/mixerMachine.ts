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
    /** @xstate-layout N4IgpgJg5mDOIC5QFsCWAPMAnAsgQwGMALVAOzADoAjAV1QBsIyoBiCAe3IrIDd2BrSrQYRsAbQAMAXUSgADu1ioALqk6yQ6RACYJAFgDsAGhABPRAEZtANj0BfOybSZchEl2GNmLbFnZYKOXo8ZQAzf2RqOkZxaQ0FJVV1JE0dbXSTcwQATm0AVgcnDGx8YjJKLDA8CFMKWGV2OTlIFgBlABUAQQAldskZFISVNVINLQQLCwAOKczLA11CkGcSt3KKSura+rwsZRaABU6AVVaAUX74xWHk0HHsvW05iYWJJZXXMq5NmpZus-OfTig2uSVGKXGVmseWeFkMBUcy2Kn3cFSqv3OZwA0pcQYkRmNLNZssYzDoJAYEUUXKVURt0aYWABhAASnQAcgBxM4AfQAagB5AAyxxwF2B8lBBIhlmyAGYYWSELpKe9kbTym0zkKzkz2jzWgKubjJfjbqkJtlrE8lQYpto1TS1t8GRRlFhCPwNVxWux6OxuKRCKoeGAWO0BZzOTqTSAhmDCS9JrCDBY3oiPt60Vs3R6CF7nZRff6KMHUKHw5Ho+KBqabuC7pY8sSU2nHasvtmarnPVmKDgaPtA2WKxGozGJXGpebxrpshIUxJ09SO3SfrV3b3C-3B5QR2Gx9XY-HpY3LXpZkqLAYl+2Uet1z381mWMcDgARTrtXkAMQAGjy7KdGKrTHtODYWtocoSIqWTXtkFh3n2j6bs+hbMmyXK8oKIpimBZoQbO0FyrCeRylMSHbiheYFp2GEctyPJHOy+H1omUEWCRV7WNY6aIqQ7CiPAKSZoWVwEYmUx6NYzzSQ6GbqtuAnKN0DLiWxMoTNoUnPHkbYKU6nYUL4-jqQmmnpDBzwGHo9gGau6yeEwpBQGZp4WhY2R5AuV4SNalFGeubkzogUwPLCjwGAFa6uvUjTNBAwWEZYEhprC1oUfZ94ujmOx7JASWJmmViwlMvHRQ+rqobRqKFZpcIGFxcF6fJK7ZV2G40X2xbsHVZ4WHk2gWKRN4VTl3bVd1foBmQ+59R5eRlel0xjR1T41esPWlgQIZgPNkJ5POpW3llyFVV124Dvs+2ykupHladVHnVuRlXZQs07eWe14hp-VWrBRISJlbVnTmk2Xbu227TdlotleBjzg4DhAA */
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
      notReady: {},

      error: {
        entry: "disposeTracks",
      },

      building: {
        entry: "buildMixer",

        invoke: {
          src: "builder",
          input: ({ context }) => ({ sourceSong: context.sourceSong }),

          onDone: {
            target: "ready",
          },

          onError: {
            target: "error",
            actions: "logError",
          },

          id: "builder"
        }
      },

      ready: {
        on: {
          RESET: {
            guard: "canStop?",
            target: ".stopped",

            actions: {
              type: "reset",
            },
          },
          SEEK: {
            guard: "canSeek?",

            actions: {
              type: "seek",
            },
          },
          CHANGE_VOLUME: {
            actions: {
              type: "setMainVolume",
            },
          },
        },

        exit: ["reset", "disposeTracks"],
        states: {
          stopped: {
            on: {
              START: {
                target: "started",
                guard: "canPlay?",

                actions: {
                  type: "play",
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

                guard: "canStop?",
              },
            },
          },

          trackMachine: {
            type: "parallel",

            states: {
              Solo: {
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
              Mute: {
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
              UPDATE_FX_NAMES: {
                target: undefined,
                actions: "setFxNames"
              },
              CHANGE_PAN: {
                target: undefined,
                actions: "setPan"
              }
            }
          }
        },

        type: "parallel",
      },

      trackMachine: {
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
          },

          Solo: {
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

          Mute: {
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
            },

            initial: "inactive"
          },

          "Solo (copy)": {
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

          "Mute (copy)": {
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
          UPDATE_FX_NAMES: {
            target: undefined,
            actions: "setFxNames"
          }
        },

        type: "parallel",
        initial: "Solo (copy)"
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

      Mute: {
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

    on: {
      SELECT_SONG: {
        target: ".building",
        actions: "setSourceSong",
      },
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
