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
    /** @xstate-layout N4IgpgJg5mDOIC5QFsCWAPMAnAsgQwGMALVAOzADpUIAbMAYgGUB5AOQHEKAZZgQQBEA2gAYAuolAAHAPaxUAF1TTSEkOkQA2AKxaKAdgCMWgMwazAJgMBOACxaAHABoQAT0RGbFew-N7jWvQd7Xy0AX1DnNExcQhJyChppPAgyKHoIZUoyADdpAGtKKOx8YjJKROTUhBzpAjxFZRFRJtUZOQaVJDVELRsrCl7jGz0rLQ0DYQMDZzcEO11ve2Nl4Q1JvXs9cMiMYtiyhKSU0jTsLGksCkkaeoAzC+QKIpjS+IrjqGrSXLqOppaum0FEpOqB1AgjPYDBRjOY7PZxsJguZvDNEPMvA5lsZVutNtsQM8SnFykdIBRYPJpJJJJAmGxOIwACq8ABKTIBUlkwOUqnB9lsA38NiGvShJi0aIQVhxmPsNg0eg2wT0dgJRP2bzJEApVJpdJYHAorIAoowTRyxK1uR0+YgALQGPTCCjCGzmYxOgwouy2GxSqwGTyLGw2N1LKyBqzq3YvEmHZLkynU2kQelG80mgDSnJAQNtXXB3qMFHMvQ9Nns8p0dgDQblofDxkj1hj0WJB3eSb1qfTnAAwgAJXgcE0AfQAaswuABVHAm3P5kF2iFrfSLLTmSZaAz+ZZ14MORuV5tRtt7V6kxM6yl4LDyA0MigABV4M-Ni5ty8LmmdFAMawaMMmwjJsVgBrKIaKsqvhqhEhKxh2WrXrqd4PmmhqcKa5qWuIgJfryP5zHY64OOMW4bOYcKSq4iAyi6UFKlWsFhPBGqXgmEDdmhj4Zia2afu035gogxjBAMWhusIsKTNJ7pSlMGxypJxh6OYQEaKM55xp22qofevEDsOo6TtOc4Lla+FCYRIkIJpeheJ6GhlmMmkaKpClOvYynSWpGlaWxiGaleXE3vIPEYU+JqsPwJpCJZXLWaC3QIEprmqWsUwTN6Ti0RCXk+ap6kKgF8GkNIXHwF07EktaSUrva6kaK67qeoYPpaH6Ur2n0FCKrJBgIi5ZZbIF7bBVQtBgHVPLJeCaz9D4ASGENnXGFKYYwuYLYys5ViBFuNjaUhlBnBcM0FrZRhpcKARlk2ehSr0CxYoESzliKx0Te8qQXcJKU7v0YYohMljSSEUpwoeSwAf4UwolRX0cV2EB-TZKWNYNLUel6HVdXlz1yp6Tq+WJo07ONyN6cm+qo1Zs0rt6vilrYSKeoGGxjFKIzmA2wirP1ehAUj8Yo-p6Fo3NiCGMYFChoNVi+PRwgbApSLNVBzbCKMz3hOEQA */
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

        description: `Waiting for song to be loaded.`,
      },
      error: {
        target: "idle",
        entry: "disposeTracks",
        description: `The players instance failed to load at least one of the tracks (e.g. bad url). Dispose the existing players and target the **idle** state.`,
      },
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
          onError: "error",
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
        on: {
          "SONG.CHANGE_VOLUME": {
            actions: {
              type: "setMainVolume",
            },
          },
          "SONG.RESET": {
            guard: "canReset?",
            target: ".stopped",
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
        },
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
              "SONG.ENDED": {
                actions: {
                  type: "endSong",
                },
              },
            },
          },
        },
      },
    },
    types: {
      context: {} as InitialContext,
      events: {} as
        | { type: "SONG.LOAD"; song: SourceSong }
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
      endSong: () => stopChild("ticker"),
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
