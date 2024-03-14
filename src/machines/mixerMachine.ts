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
    /** @xstate-layout N4IgpgJg5mDOIC5QFsCWAPMAnAsgQwGMALVAOzADoAjAV1QBsIyoBiCAe3IrIDd2BrSrQYRsAbQAMAXUSgADu1ioALqk6yQ6RAFYAnADYANCACeiAOwAOcwF8bxtJlyESXYY2YtsWdlgpz6PGUAM19kajpGcWkNBSVVdSRNC0sJYzMEABZtCTsHDGx8YjJKLDA8CBMKWGV2OTlIFgBlABUAQQAlFskZJLiVNVINLQRLAEYx9MQxgGYxyzyQR0KXEooyiqqavCxlRoAFNoBVJoBRHtjFAcTQEe19bSmEWfnF5edirg3Klg7Ts+6MT6VwSQySd3GTzGEks+jeBQ+rlK5R+Z1OAGkLsD4oNhildBRdON7uYZpYAEzjcmPUzTPQLexLBFFJHrFEmFgAYQAEm0AHIAcVOAH0AGoAeQAMkccOcgfIQbjwTptOSKGNtKlLJkJGNMuTdDNMlD6fCnCySs1TpLTpyWsKmuLBViFTibskEABaeZPcnmbRmlafSjKLCEfgW8gsI77AAibRaIoAYgANYV8tqypoukD9UF457k-QUVJ+smGiQzbQ6mkZfSWGbqywU-TmCTmTK6XSZTKBxFrUPhyNgLm8wUiw58nN5pW3RDextjfSZcz6Ga6CQGTITcnG2kIeuL5tFtsdrs9vvDiiDggR1ZRnn8oViqUyuW9V3XMFzhAzGYSChzA3Tsu27fRdwkPc6wbJsW1PECL0Zd4rzIQhVB4EcWnFAUBRtadFXdEZvXMEsq3JGZ9E3StNWsIx93mfQCTXCRyQ1cjDQmXskOZe9KDQ1AMJYLCcLw+VcwI78PTGckAKXFc1w3LcdyhIDMgoZjWNVdc5j1S9eO4Uh+IwgACAAKAg6hMABKITsNw99LjdSSiLGEiGy0yiNyrZtV19aEAKLSD-xXWFyUpPTgwoIywDMiy5Gs2yRIc7EvwLaTZOXVd103ZdlP3GTqQoQLMmCqxwPC7jzX0m870ipp2HodgDOixL7Pwpy0uyCgYU3VUrG0TVzFYqE9RI6TskrdcN1eSqg1ZGqr3qxqooIdDMLs0SP3EjrlQQSlGx63Q+ssAbrHJKF2zVcacj-LtdQZfIqsihb9JwGg9ma1aBPWpL2tS3a9W0ChO0BzVoXSw0TQkIHyoGvRLqOgNZv7LgXsit6Ppa4S2rEmdCMQfbgd0UHxl1GTdChEqANhgaNyGxG7EZUh2FEeAkmQ3jHP+n9PX0OiMl05Gr2Z5QOnZLn812mYOyeOYkceua1m8XwJdnD1zA130hoi1l3CYUgoFV-GEG0WYnk1eWmSe1lvgyT9JZ-U3zCeWEuIVlHkU2apanqSAjecxA1xmKEwrhIX9Nt72dj2CB-YLNda2mbIHqtxXUbDW9hzj3bO261Ijr9E7Bs0l2O3VXcbqm+6xh1tZUK+jDs55tV3PIzzqJ8-npiAxsNLY7TONrrhoqbqT5nVTKFJy7dpKhUL1P-TT2J0t3U4968M9q1klvYUeRl0EjDuO06hsmfcD8XCvJru+Ya-DyL67W2LLKsvf5xbsiKKo7zaN9Fi1OKqVUKFV3ZXmis-eKr8UoOzHpYCe8lspKVnvlTcjZAGQTKmFFOHNnqb0Wg1Jqj9vpv2eJRPOvVC4n2GvRdsYxy4TVutNbBPFcFDn0jvFaa0SGUjoUfShxcRo6noZXG+zDrYDjwa9d6YASEHyJiTcG5Ng70TJHQmm8N6YDSHiGSR6NpGfS4dAtWIwlwARBtkMGZNUGUwNOpMKcM6YGi0ffeaujWQYz4g3GRRjjY8PkRY0mENKZEjsdSWmCNnF2CAA */
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
            actions: "inline:mixerMachine.building#error.platform.mixerMachine.building:invocation[0][-1]#transition[0]",
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
        initial: "stopped",

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
        },
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
            }
          }
        },

        on: {
          UPDATE_FX_NAMES: {
            target: undefined,
            actions: "setFxNames"
          },

          CHANGE_PAN: {
            target: "trackMachine",
            internal: true,
            actions: "setPan"
          },

          CHANGE_VOLUME: {
            target: "trackMachine",
            internal: true,
            actions: "setVolume"
          }
        },

        type: "parallel",
        initial: "Mute"
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

    type: "parallel",
    initial: "inactive"
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
