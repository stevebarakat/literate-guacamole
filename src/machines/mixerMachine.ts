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
import { assertEvent, assign, createMachine, fromPromise } from "xstate";
import { scale, logarithmically } from "@/utils";
import { clockMachine } from "./clockMachine";
import { createActorContext } from "@xstate/react";
import { produce } from "immer";

type InitialContext = {
  currentTime: number;
  mainVolume: number;
  volume: number;
  sourceSong?: SourceSong | undefined;
  players: (Player | undefined)[];
  channels: (Channel | undefined)[];
  clockMachineRef: any;
  trackMachineRefs: any[];
};

export const mixerMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QFsCWAPMAnAsgQwGMALVAOzADoAjAV1QBsIyoBiCAe3IrIDd2BrSrQYRsAbQAMAXUSgADu1ioALqk6yQ6RAEYAbABYArBQAcAJjOGJATgm7L1s-oA0IAJ6IDZihZMnt1tr+AMzaAOyGAL6RrmiYuIQkXMKMzCzYWOxYFHL0eMoAZlnI1HSM4tIaCkqq6kiaOrrB3s2WNnYOTq4eCIba3hIR+kHtEiZRMSBx2PjEZJRYYHgQbhTKWIT8s0mUAMrs9OzcpISqPGAsACoA8gDitwAyAKKSMvXVKmqkGloIegGmXQ2fTWMIgszBFzuHTNYIUYLWXS2My6PRhCK6aKxDAzRLzCiLZardabbb4-aHCinVDnK53R4vSrvRSfOqgX7afTowHA0HgyHdGEQ+GI5Go3TowyYybTBJzLiElZrDYELZ4rg4GjKShkam0m73Z6vKos2rfeoc6zWEw86wgsGOAXQv6hOEIpESFFojFYqY4uU7AlLJUk1VkjVayh6i4GhnG5k1L4-HTjXS2+38qE9bSukUer0Sn0y-3hhbB4kqtXyi4AYQAEgBBABytyeAH0AGrXB4AVRwjLe8lNSYtiAswTCFEMJhsM7MtlBlkFf0G+gonsMwyRhmC-n0wV9stLQaJytJ6ouPYACgARBuXdsAMQAGm2mw3+7t40PE2yGghx2sKcZ2tT0FzCJdnRzMxJw3LdrB3PcD2LeJj0VCtz2rFh62bVs2yvZtvxAD4zWTACnEnadZzAmwIMMZdtACNM4L0BDd05ZDsVQi8TxWFgACUnl2J5LiIkiR3ZRATAMChdDkpxIQkfQmmXaxgjhewJAkTdgj6MI7AmLjcWrXi3BYYSngAaTE4c-w5Lk0xMLkJHCMZDGnMEGN0HdZIcCd-BsQxEUPEsePQ7DGxbdsu17fsbN-c1JL+MJOVMZzXPGDys0aHz7CC-ztEC4KUOMwNSHYZR+PLcynmeGtLjbXZrhbeLWUS-9FwoNTbGUpwuUCXRlx3OEwl0sJxjtWwJpC7iTPQs9SFgBQsGUY9YGUdg5DkSAWAInthNa0jRwQExAlkqw-B3KUIkYhi0QoIJXWnAIzBMMJpSMgN8XmklFuW1aePWvAVp23ZLgbfjRKZH82rI064W0C7xl0iU+jMBjdO8AbXve+Txn0aJJnK0R4HqI8LxNBKyLktcbG8wYnKBK1rGXSwBiGEZbDcmbSvxcrKvLSnYeO8a1xuly7BBByWeddztAoCCprMMC9EGHmvq4DIsiFo6kqCM6KNCQLRqUkwhshB62IhQqLH0Jz1ePFImFIKAdYk-9+hBeEbuGMZPX07LegsS2d2tz0nHtkqNbLIk3bsxAUoGRErFFpmrWXFKbU07T9z0gyHbC8szzDCmE2FvX2PTPlHUDm213dMVvSlAu5qL0Mq0DCl2Dj9r7PnKuHQhWuczdUVPXFSUPr9WbAx+ytjy745ox7sjOTtAfMwY6280bwtm6jtC2-nnjF+XsvdY9kEbWk3lB6dbNhlH-MJ6LT7D9Pdvj01bUV+OkZr6ZhmGud1hQN3Hk3Ke5NW4f2PiZb+OoTgEDOGAX+es3pwhvpNO+tcLDyzAQWSeLdZ5H0woGeBVIkE0hQefd2HI3qTkwUAoeDF9ASCfrvQhB9C4wLwH9LIANqyoP-O9CQ65k4M2UjYdOUE7BAUejmZ6jg3qQNCtAkMGw+ErTWhtLakAhG-BnDaOmKdGZSJltmGC3gr5BEUXbRGRDvokM0QIwMQMQYQH0ToP2CtDDKyctJSEQIzZQScKImcSkOgBBzGMQmkQgA */
    id: "mixerMachine",

    context: {
      volume: -32,
      mainVolume: -32,
      currentTime: 0,
      sourceSong: undefined,
      players: [undefined],
      channels: [undefined],
      clockMachineRef: undefined,
      trackMachineRefs: [],
    },

    entry: "disposeTracks",

    on: {
      SELECT_SONG: {
        target: ".building",
        actions: "setSourceSong",
      },
    },
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

          onDone: { target: "ready" },

          onError: {
            target: "error",
            actions: "logError",
          },

          id: "builder",
        },
      },

      ready: {
        on: {
          RESET: {
            guard: "canStop?",
            target: ".transportMachine",

            actions: {
              type: "reset",
            },
          },

          CHANGE_MAIN_VOLUME: {
            actions: {
              type: "setMainVolume",
            },
          },
        },

        exit: ["reset", "disposeTracks"],
        states: {
          mixerMachine: {
            type: "parallel",

            states: {
              Solo: {
                initial: "inactive",

                states: {
                  inactive: {
                    on: {
                      TOGGLE: "active",
                    },
                  },

                  active: {
                    on: {
                      TOGGLE: "inactive",
                    },
                  },
                },
              },
              Mute: {
                initial: "inactive",

                states: {
                  inactive: {
                    on: {
                      TOGGLE: "active",
                    },
                  },

                  active: {
                    on: {
                      TOGGLE: "inactive",
                    },
                  },
                },
              },
            },

            on: {
              CHANGE_VOLUME: {
                target: undefined,
                actions: "setVolume",
              },
              UPDATE_FX_NAMES: {
                target: undefined,
                actions: "setFxNames",
              },
              CHANGE_PAN: {
                target: undefined,
                actions: "setPan",
              },
            },
          },

          transportMachine: {
            on: {
              SEEK: {
                guard: "canSeek?",

                actions: {
                  type: "seek",
                },
              },
            },
            states: {
              stopped: {
                on: {
                  START: {
                    target: "started",
                    guard: "canPlay?",
                    actions: "play",
                  },
                },
              },
              started: {
                on: {
                  PAUSE: {
                    target: "stopped",
                    guard: "canStop?",
                    actions: "pause",
                  },
                },
              },
            },

            initial: "stopped",
          },
        },

        type: "parallel",
      },
    },

    types: {
      context: {} as InitialContext,
      events: {} as
        | { type: "SELECT_SONG"; song: SourceSong }
        | { type: "START" }
        | { type: "PAUSE" }
        | { type: "RESET" }
        | { type: "TOGGLE" }
        | {
            type: "UPDATE_FX_NAMES";
            fxName: string;
            fxId: number;
            action: string;
          }
        | { type: "SEEK"; direction: string; amount: number }
        | { type: "CHANGE_MAIN_VOLUME"; volume: number }
        | { type: "CHANGE_PAN"; pan: number }
        | { type: "CHANGE_VOLUME"; volume: number },
    },

    initial: "notReady",
  },
  {
    actions: {
      setSourceSong: assign(({ event }) => {
        assertEvent(event, "SELECT_SONG");
        return { sourceSong: event.song };
      }),

      buildMixer: assign(({ context, spawn }) => {
        start();

        console.log("building mixer!");

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
            spawn(mixerMachine, {
              id: `track-${i}`,
              input: {
                channel: context.channels[i],
                track: context.sourceSong!.tracks[i],
                fxNames: [],
                fx: [],
              },
            }),
          ];
        });
        console.log("trackMachineRefs", trackMachineRefs);
        return {
          trackMachineRefs,
          clockMachineRef,
        };
      }),
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
      setMainVolume: assign(({ event }) => {
        assertEvent(event, "CHANGE_MAIN_VOLUME");
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
