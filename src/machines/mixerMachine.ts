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
    /** @xstate-layout N4IgpgJg5mDOIC5QFsCWAPMAnAsgQwGMALVAOzADoAjAV1QBsIyoBiCAe3IrIDd2BrSrQYRsAbQAMAXUSgADu1ioALqk6yQ6RACYJAFgDsAGhABPRAEZtANj0BfOybSZchEl2GNmLbFnZYKOXo8ZQAzf2RqOkZxaQ0FJVV1JE0dbXSTcwQATm0AVgcnDGx8YjJKLDA8CFMKWGV2OTlIFgBlABUAQQAldskZFISVNVINLQQLCwAOKYo9PQBmAwXs6b0p7Sm8zMsDXQoJKws8g2s8k4kJKcKQZxK3copK6tr6vCxlFoAFToBVVoAov14ophslQONsnptHNFstVlN1pttmZdvtDtpjqdzgZLtdHLdiq4ylxnjUWN0AYC+nFBqCkqMUuMrLYKAZJvNDAsLAttDsJoY8hR8otshJeRI8hZ7AS7sT3BUquTAQCANLAumJEZjSzWbLGVEIXQGAqyomlBVPJWmFgAYQAEp0AHIAcQBAH0AGoAeQAMr8cEDafJ6dqmZZsgsUVljaaii4LY9lFhCPxE1xWux6OxuKRCKoeGAWO1vS6Xb6gwMQ1rwakEFNVvy9NZtDc5enKMnUx2KJnsxR86hC8XS+XKyCa4yIYgDHpsk2W23zQ8uF2CGmV5QcDRPrnB8OS2WKxrq2Cp3WpRYF62zQnNxQ1xuSVud5R90XD2OTyAhgydQgFj1a8lzvZ8HxTdcOxYX4vgAEU6doPQAMQADXdJ1OkDVpv1-MNpwQXFrH5XIb3je4wMfKCHWdN0vT9ANx01M9-yjIjDRIkDyIVNoAQrW12ndVpvVdHDQ1rZlshbfkDA2Tj5UeMh3xHI9GNPP9wwQPRjn5bRAIWOSeyUz9j2DH8xPPcZtGWHS9IM+8yVqSj7z7HNFIIAsP1HEyqzMyd-wsdkLAoPTAOsFY53mfkAokbIKEjPZxWbdk8msOywIc8Du2crMcyMrzVN85iNOOPVgrC0LwqhPQotxWL4t0BYkpKtLLQypywO3Xc3I85Sv1M3DxJ0K5Yr1Rr5lWPJtD0aNdWyWK8imCRdN0AL1ihFrHjaiCn0tTq33codPJU0S-OKqEDAoUbOQmqbJqivV5sW5bDlnBsZTI+TSWtTLIM3aC4IQ5C0IwrCTqK-DdMlA48nmDZ5hhqwarFCgFqWiVVrejavpeH6dvKO1HVdD0fX9QMwfUiGFnFChJkjKYwusXEJDYrJjgWWZLnWS48jFPVUtvLjNu+9ruOoon3R+J1ybwutdJ5aHYam6atL5Q0LDOOqlgapqUqxzttqownaMl6XBpyRt2PSBwCVIdhRHgFJ203Cdwdl-J+TjQlQMtW3lG6a0XYpusrERD2LAkPWKF8fxA5lyzdBmgj5kjzwmFIKBY7NixsjyCQouZ0ivcF7GakzizEDe2ElhWNYNi2KLs6FVHnox9aBc+xUcfqRpmggMv-MOCQq-hWvkXuzYDiOE4zguK5I4yt4PkgfvioxYea8ROvE+mawh4xLEZ6Z-EPp7EXyhXiHrLVqYLEjs+Mxyi+61xK9DSswunYog3sv7brDqf8YpwWaICWBHdup9v5gRcgOA6hYAEzlxB7Sad9IG7VfPAgCmIdJ7BQVlDqr49ywLABg9mwCAK4lwb9fBu53wkLFEgj+y50rC1QefJiQdmRcjKgsCqUIqpRS0kPZu6NXptxPvZFheDLQuQwccTE3DeERWqmrKUmsEqNUZs1cBEicb3xfJ8WRDYRqRmunI6aqtWa50emjFaoj3pFw7oQjyGDtD0LflZW+2iwK0PYXHHQUIdLTX0l41qkiqHSJyk4-+vis4LWsAo6wYU+GRTVtYAKcUtaJU0brEJQtdGsIfv2Hxak-ETB5kPEKiTKopNZgYOaGT1E635uI5h+SpGPD2lEuBMTy4TEknoS6JjxpmLuqkiQF1hG2LWvYz+oS2nhI6QQ4phUOERmsLMK6wzJrmJqg2FGT0RHTOtnYIAA */
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
