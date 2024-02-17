import { animationFrameScheduler, interval } from "rxjs";
import {
  Transport as t,
  Channel,
  Destination,
  Meter,
  Player,
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
import { scale, logarithmically, formatMilliseconds } from "@/utils";
import { InitialContext } from "@/App";
import { createActorContext } from "@xstate/react";
type Input = { input: InitialContext };

export const mixerMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QFsCWAPMAnAsgQwGMALVAOzADpUIAbMAYgGUB5AOQHEKAZZgQQBEA2gAYAuolAAHAPaxUAF1TTSEkOkQBOAMxaKAdgCsegGwAOLYeEAWYQYBMAGhABPRAEZTdisJ8+rxuw07Y2EdAF8wpzRMXEIScgoaaTwIMih6CGVKMgA3aQBrSmjsfGIySiSUtIRc6QI8RWURUWbVGTlGlSQ1RE89CgNTIw1jMw0rPVsnVwQrc29fYys3Ny0DA2NwyJBi2LKEytTSdOwsaSwKSRoGgDNz5Apd0viK5KOoGtI8+s7m1u72golF1QOoEB4DBoKFpRhpQnYYWZTNNEHNdL5hEsVmsNlsohgSnFyok3pAKLB5NJJJJIEw2JxGAAVXgAJUZ-yksiBylUYJWei8Rj0hjcxhMxjcdj0KIQGkGC2Ebg0plMy2M9gi+Jiz2JhzJFKpNIgdI4FBZAFFGOb2WI2lzOrz3MJkS5NFYvL43Ho3AYLDDxpqdgS9i8SSl9ZTqbSWKareaANIckCAh3dPlWbQUQLq+yKrR5l0zcYenxen1+4wB7ZPIkHUkQcmRo0mzgAYQAErwOOaAPoANWYXAAqjhzUmU8DHbMtKYKJ5TKKNG4rGtxoW3SXFd7fXp-VZAzX9q9ww2KXgsPJo-SKAAFXhDq3j+2TtNu2d2YTZgw+JYTKwyuVZ09ZVVVFDVq2DHU6xPRtz0vY0Y04C0rRtcQAWfHlXwQAVdHnL1zBhOwFw0AD5WAlU1XArVCSPMMIAjOCr1jc0EyfDoX1BRBRmEAYggFeFxm0aVXXBD9jAVBEJj0ZUJgPSDa2PejT3kRiEOvDsu3YXsB2HUc2O5EEellQw513YtKwMd0tDcGVJUxCStCkmS9Dk7UFLohiLyYzhzVYfhzSEW10PYzDOIQNZxJCUxK2srQ5RCYSZjs8TfEk4VnIibZSGkej4G6Q8XjtELDL5RwRMlBUMSqnwXIgtzaOoOgioMqcNG9aFlSIuxLMlQx1wQUwoQ0YaRjmSVHImDRXJo0NTnOZrUzCiFxKFYUVz0QaVxlIx0VLTEVRVRVTGmkNdTeNIFo4ozpP6KwrAMXqdFMDbEsQKVN2sPQbHu2xVROqDFMgS7QqMkJtt3BU3H2g6jv+9y9WUw0geClqsJ9WxoRhGx4U-e6tBlTweM9az+Lxqa6pms6YLPLyIGBkrNCXCg5ndYRhrsZcxXx8qVisSHBICbRRUysIgA */
    id: "mixerMachine",
    context: ({ input: initialContext }: Input) => ({
      ...initialContext,
    }),
    initial: "idle",
    states: {
      idle: {
        on: {
          "SONG.LOAD": {
            target: "loading",
          },
        },
      },
      error: { target: "idle", entry: "disposeTracks" },
      loading: {
        entry: {
          type: "buildMixer",
        },
        invoke: {
          src: "loader",
          onDone: [
            {
              target: "loaded",
            },
          ],
          onError: {
            target: "error",
          },
        },
      },
      loaded: {
        invoke: {
          src: "ticker",
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
                actions: "inline:mixerMachine.loaded.started#SONG.ENDED[-1]#transition[0]",
              },
            },
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
      loader: fromPromise(async () => await loaded()),
      ticker: fromObservable(() => interval(0, animationFrameScheduler)),
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
  }
);

export const MixerContext = createActorContext(mixerMachine);
