import { animationFrameScheduler, interval } from "rxjs";
import {
  Transport as t,
  Channel,
  Destination,
  Meter,
  Player,
  loaded,
  start,
} from "tone";
import {
  assertEvent,
  assign,
  createMachine,
  fromCallback,
  fromObservable,
  fromPromise,
  stopChild,
} from "xstate";
import { scale, logarithmically, formatMilliseconds } from "@/utils";
import { InitialContext } from "@/App";
import { createActorContext } from "@xstate/react";
type Input = { input: InitialContext };

export const mixerMachine = createMachine(
  {
    id: "mixerMachine",
    context: ({ input: initialContext }: Input) => ({
      ...initialContext,
    }),
    type: "parallel",
    states: {
      audioContext: {
        initial: "unavailable",
        states: {
          unavailable: {
            invoke: {
              src: "INITIALIZER",
            },
            on: {
              "INITIALIZE.AUDIO": {
                target: "available",
              },
            },
          },
          available: {
            type: "final",
          },
        },
      },
      song: {
        initial: "idle",
        states: {
          idle: {},
          loading: {
            entry: {
              type: "buildMixer",
            },
            invoke: {
              src: "LOADER",
              onDone: [
                {
                  target: "loaded",
                },
              ],
              onError: {
                target: "idle",
                actions: ["TRACKS.DISPOSE"],
                description: `The players instance failed to load at least one of the tracks (e.g. bad url). Dispose the existing players and fallback into the **idle** state.`,
              },
            },
          },
          loaded: {
            invoke: {
              src: "TICKER",
              id: "ticker",
              onSnapshot: [
                {
                  target: ".stopped",
                  guard: ({ context }) =>
                    Boolean(
                      context.sourceSong &&
                        t.seconds > context.sourceSong.endPosition
                    ),
                },
                {
                  actions: assign(({ context }) => {
                    const currentTime = formatMilliseconds(t.seconds);

                    let meterLevel = context.meter?.getValue();
                    if (typeof meterLevel !== "number") {
                      meterLevel = 0;
                    }
                    return {
                      meterLevel,
                      currentTime,
                    };
                  }),
                },
              ],
            },
            exit: ["reset", "disposeTracks"],
            initial: "stopped",
            states: {
              stopped: {
                on: {
                  "SONG.START": {
                    target: "started",
                    guard: "canPlay?",
                    actions: {
                      type: "play",
                    },
                  },
                  "SONG.RESET": {
                    guard: "canReset?",
                    target: "stopped",
                    actions: {
                      type: "reset",
                    },
                  },
                  "SONG.SEEK": {
                    guard: "canSeek?",
                    actions: {
                      type: "seek",
                    },
                  },
                  "SONG.CHANGE_VOLUME": {
                    actions: {
                      type: "setMainVolume",
                    },
                  },
                },
              },
              started: {
                on: {
                  "SONG.PAUSE": {
                    target: "stopped",
                    actions: {
                      type: "pause",
                    },
                  },
                  "SONG.RESET": {
                    target: "stopped",
                    actions: {
                      type: "reset",
                    },
                  },
                  "SONG.SEEK": {
                    guard: "canSeek?",
                    actions: {
                      type: "seek",
                    },
                  },
                  "SONG.CHANGE_VOLUME": {
                    actions: {
                      type: "setMainVolume",
                    },
                  },

                  "SONG.ENDED": {
                    actions: stopChild("ticker"),
                  },
                },
              },
            },
          },
        },
        on: {
          "SONG.LOAD": {
            target: ".loading",
          },
        },
      },
    },
    types: {
      context: {} as InitialContext,
      events: {} as
        | { type: "INITIALIZE.AUDIO" }
        | { type: "SONG.LOAD"; song: SourceSong }
        | { type: "SONG.ASSIGN" }
        | { type: "SONG.START" }
        | { type: "SONG.PAUSE" }
        | { type: "SONG.RESET" }
        | { type: "SONG.SEEK"; direction: string; amount: number }
        | { type: "SONG.CHANGE_VOLUME"; volume: number }
        | { type: "TRACKS.DISPOSE" }
        | { type: "SONG.ENDED" },
    },
  },
  {
    actions: {
      buildMixer: assign(({ event }) => {
        assertEvent(event, "SONG.LOAD");
        let players: Player[] = [];
        let meters: Meter[] = [];
        let channels: Channel[] = [];
        event.song.tracks.forEach((track, i) => {
          meters = [...meters, new Meter()];
          channels = [...channels, new Channel().toDestination()];
          players = [
            ...players,
            new Player(track.path)
              .chain(channels[i], meters[i])
              .sync()
              .start(0, event.song.startPosition),
          ];
        });
        const meter = new Meter();
        Destination.connect(meter);
        return {
          sourceSong: event.song,
          meter,
          channels,
          meters,
        };
      }),
      reset: () => t.stop(),
      play: () => t.start(),
      pause: () => t.pause(),
      seek: ({ event }) => {
        assertEvent(event, "SONG.SEEK");
        if (event.direction === "forward") {
          t.seconds = t.seconds + 10;
        } else {
          t.seconds = t.seconds - 10;
        }
      },
      setMainVolume: assign(({ event }) => {
        assertEvent(event, "SONG.CHANGE_VOLUME");
        const scaled = scale(logarithmically(event.volume));
        Destination.volume.value = scaled;
        return { volume: event.volume };
      }),
      disposeTracks: assign(({ context }) => {
        context.channels?.forEach((channel: Channel | undefined) =>
          channel?.dispose()
        );
        return {
          channels: [],
        };
      }),
    },
    actors: {
      INITIALIZER: fromCallback(({ sendBack }) => {
        function handler() {
          start();
          sendBack({ type: "INITIALIZE.AUDIO" });
        }
        document.body.addEventListener("click", handler);
        return () => {
          document.body.removeEventListener("click", handler);
        };
      }),
      LOADER: fromPromise(async () => await loaded()),
      TICKER: fromObservable(() => interval(0, animationFrameScheduler)),
    },
    guards: {
      "canSeek?": ({ context, event }) => {
        assertEvent(event, "SONG.SEEK");
        return event.direction === "forward"
          ? t.seconds < context.sourceSong!.endPosition - event.amount
          : t.seconds > event.amount;
      },

      "canReset?": () => t.seconds !== 0,
      "canPlay?": () => !(t.state === "started"),
    },
    delays: {},
  }
);

export const MixerContext = createActorContext(mixerMachine);
