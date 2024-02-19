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
    /** @xstate-layout N4IgpgJg5mDOIC5QFsCWAPMAnAsgQwGMALVAOzADoAjAV1QBsIyoBiCAe3IrIDd2BrSmky5CJLrQZNSUBL3YE8AF1ScA2gAYAupq2JQAB3axUKzvpDpEAWgDMAdlsVbARgCcAFg0uAHB89ugfYANCAAnoiubhRu9gBs9hoATD4ArD6BLvEAvtmhwtj4xGSUkozMLNhY7FgUBvTKAGY1yBQFosUSdOUycqR8imakuroWRiZDFlYISS5JFPYeqW6p9hmpHilJoREILhqpFB4+CamuPi62Hh5xSbn5GIViJRRYYHgQYRSwSuwGBpAWABlADyADkAOIUIEAFQAggAlGGjJAgcamVSkKaIFyXCgJNxJDSeJJuWxuA4uHaIHy2OJHQm2JK2NIaOI3Hz3EDtIriShvD5fH54LBKQGgyEUAAKcIAqkCAKIowzGDHmVHTFL41LuJk+C6XexU8I43HRa643zeLypW1cnnPLgCz7fJQisUQYHgqEKsEAEQVfuVaNVkw1iA2TjitlSpMuvg87h81IQZJcFB8RNmtg0N1usftjw6fNe70+XslCIViuR2jGocx2IQdns8xZtw0TMSq3JcRT8XTraWHeOyzccULIl5L2dYQrUMVCoA0sH0WHQNM7McKPtfI4TvEDisUy4lhojklmb4XHF9rbUpOnp1+WW5xKoQBhAAScMhCoA+gAaiCAAyso4EqdaomujbhggXj0rMpJJB4LIkkkIQmnsZ4XpethdgcpIeI+xYlCwABCsoAJIgX6FA4FRAAaCoIquDbqhukSpPSt5xMscRpHSVzbFh1g3ue-izG47hEnEyQYbkeQgKQ7AQHAFgOs+9YTLBnHNhyzgnESBE9uOKbWKSPgZoSWT6p4VwJiR05cCpSgAASztpapYnBLbpucFIUrMiQOOZLgbPiNn2PYgSXisaROY6lBVDUXnrpYOJ+Du5I+Eaxy5blx5YUk3EUCV7itrE0bMvYiXPtQ3TSFAaW6RlzZ0lZBxsjq9i2p2twnue6waCNOaeJ2hF1SWnnQexPl6dYmznu2xkYQcjhmVhOrzHM1zsp2GSeFNM6vq6fwAhALUcW1Fl4ksni5VcyyxhsKaxMtVw3DerbBXcSmadNp3CqKkBXfNbX4YOyTErizJEtFb1uFZ-iZghMV5rYinZEAA */
    id: "mixerMachine",

    context: ({ input: initialContext }: Input) => ({
      ...initialContext,
    }),

    initial: "not ready",

    states: {
      "not ready": {
        description: `The initial state of the app. Nothing happens in this state other than waiting for mixer to begin **building**.`,
      },

      error: {
        entry: "disposeTracks",
        description: `Dispose the existing tracks and display an **error** message prompting user to choose a different song.`,
      },

      building: {
        entry: ["buildMixer"],

        invoke: {
          src: "loader",
          onDone: [
            {
              target: "ready",
              description: `Mixer successfully finished **building** and **ready** to use.`,
            },
          ],
          onError: {
            target: "error",
            description: `An **error** occurred loading one of the audio files (e.g. bad url).`,
          },
        },

        description: `Get **ready**, load and connect audio buffers and nodes.`,
      },

      ready: {
        on: {
          RESET: {
            guard: "canStop?",
            target: ".stopped",

            actions: {
              type: "reset",
            },

            description: `Stop playing and return playhead to beginning of song.`,
          },
          SEEK: {
            guard: "canSeek?",

            actions: {
              type: "seek",
            },

            description: `Move the playhead position forward or backward (the given amount of seconds).`,
          },
          CHANGE_VOLUME: {
            actions: {
              type: "setMainVolume",
            },

            description: `Change the playback volume (the given amount of dB).`,
          },
        },

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
              START: {
                target: "started",
                guard: "canPlay?",

                actions: {
                  type: "play",
                },

                description: `Start playing song.`,
              },
            },

            description: `Song is not playing.`,
          },
          started: {
            on: {
              PAUSE: {
                target: "stopped",

                actions: {
                  type: "pause",
                },

                guard: "canStop?",
                description: `Stop playing song.`,
              },
              END: {
                actions: "stopClock",

                description: `The song has reached its end position.

Stop **ticker** actor and target **stopped** state.`,
              },
            },

            description: `Song is playing.`,
          },
        },

        description: `Mixer displaying in UI, begins in **stopped** state, **ready** to be **started**.`,
      },
    },

    types: {
      context: {} as InitialContext,
      events: {} as
        | { type: "BUILD.MIXER"; song: SourceSong }
        | { type: "ASSIGN" }
        | { type: "START" }
        | { type: "PAUSE" }
        | { type: "RESET" }
        | { type: "SEEK"; direction: string; amount: number }
        | { type: "CHANGE_VOLUME"; volume: number }
        | { type: "TRACKS.DISPOSE" }
        | { type: "END" },
    },

    description: `A multitrack audio mixer with effects.`,

    on: {
      "BUILD.MIXER": {
        target: ".building",
        description: `Initializes audio context and targets **building** state. Triggered by user selecting a song to mix. IMPORTANT: Browsers will not play audio until a user initializes the audio context by clicking on something.`,
      },
    },
  },
  {
    actions: {
      buildMixer: assign(({ event }) => {
        console.log("message");
        assertEvent(event, "BUILD.MIXER");
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
          players,
          meters,
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
      stopSong: () => stopChild("ticker"),
      setMainVolume: assign(({ event }) => {
        assertEvent(event, "CHANGE_VOLUME");
        const scaled = scale(logarithmically(event.volume));
        Destination.volume.value = scaled;
        return { volume: event.volume };
      }),
      disposeTracks: assign(({ context }) => {
        context.channels?.forEach((channel: Channel | undefined, i: number) => {
          channel?.dispose();
          context.players[i]?.dispose();
          context.meters[i]?.dispose();
          context.meter?.dispose();
        });
        return {
          channels: [],
          players: [],
          meters: [],
          meter: undefined,
        };
      }),
    },
    actors: {
      loader: fromPromise(async () => await loaded()),
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
