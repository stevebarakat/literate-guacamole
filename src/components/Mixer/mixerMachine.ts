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
    /** @xstate-layout N4IgpgJg5mDOIC5QFsCWAPMAnAsgQwGMALVAOzADpUIAbMAYgGUB5AOQHEKAZZgQQBEA2gAYAuolAAHAPaxUAF1TTSEkOkQBOAEwUAbAEYAHFq36tu3RuEBmAKwAaEAE9EpgOwVr14Vp+GLhvoabm4AvqGOaJi4hCTkFDTSeBBkUPQQypRkAG7SANaUicnYIuJIIDJyisqq6giGHpbCbl4ALLb6Ia3WWo4uCK1WnhpB1rqGXhpjYREgUdj4xGSFSSmkadhY0lgUkjR48gBm28gJqyViqpUKSirlde22FK0G3hqGrW76umMOzohjYR6LS2azdYRWYS6WyGcKRDALWLLM7FCAUWDyaSSSSQJhsTiMAAqvAASoTSldZDcavdEIZms9dG4tBoXoEXtZDH06e9ng1Pq1WkZhCLWnC5giYkt4kUIJB0ZjsbiWBwKCSAKKMdXky7la7VO6gOoAWlsrQo31swiM-lawkMU16-wQ+jB+j0wk+LOs+hhrVhs3mUriK1RCrwWHkyvxFAACrwAKpail6qkG2p02xPYzvYyfCztNzcl3WL4ez76b4vZpiwOSxYhlFytEYiNRiB41Va9UAaRTUjTtwzLsF1goLLcU2r3yhxbMbkMz2sU7cWa09Jm8OiDeRsvlrcj0dV6tY-HVQl1A6qQ9pLtBunHHw0Gls40GIKd-Ur+iBuhslaZN13i0cUgx3GVzhbRUcQ7FUCXVXt+wqQcaSNRAfw8QwzRza1DAaV9i2CB8QlwrRBTcH5WhAuttyRCCwwPdtO04DUtR1Mor2pQ01HQ9cNAoYwSMorw3H9Od2nNZkvBhEURmEGFQPrOjQ2bZiKAAYQACV4Dh1QAfQANWYLgExwdUkP1G80JdP8HxhJljB-LDOlaYtBSebQF2aMi3ChKiZlmUhpDleByjA5TKWvVCeIQY1fSBS1cNte1HWLMdX0rZkoRZa1RM3CVaOlLJaDASKuOHFkBKzSdPVsd5BheQix2+TLrTGbQpg0RTCsbTZtjK9Nbxac0vH0F4fkrF8ejSmwKHtdcJnIn1QVrLdESKptUgGqyYri90-y0LwHS6LwyI0GbzV0EE7AhXxl30br1sbPcIG26KTR-HREptXQ7QdabnSZc1tC0EJzC+boLEe4Nd0ghUsRgt7uLqWxJzmnzSzqw6Xz+L9vh0TqGlZSs-IDNaYfo5tw0PV7Uyi5HeJCChXw3StBmMUE5yMHRDtuq1TDqrxwnCIA */
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
        description: `The players instance failed to load at least one of the tracks (e.g. bad url). Dispose the existing tracks and target the **idle** state.`,
      },
      loading: {
        entry: {
          type: "buildMixer",
        },
        invoke: {
          src: "loader",

          onDone: {
            target: "loaded",
          },

          onError: "error",
          id: "loader"
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
          ]
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

                description: `Stop playback and reset

playhead to start position.`
              }
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

              "SONG.SEEK": {
                guard: "canSeek?",

                actions: {
                  type: "seek",
                },

                description: `Skip song position forward or backward

the given amount of seconds.`
              },

              "SONG.ENDED": {
                actions: {
                  type: "endSong",
                },
              },

              "SONG.RESET": {
                target: "started",
                internal: true,
                cond: "canReset?",

                description: `Stop playback and reset

playhead to start position.`,

                actions: "reset"
              }
            },
          }
        },

        on: {
          "SONG.CHANGE_VOLUME": {
            target: undefined,
            actions: "setMainVolume"
          }
        }
      },
    },
    types: {
      context: {} as InitialContext,
      events: {} as // | { type: "INITIALIZE.AUDIO" }
      // | { type: "SONG.ASSIGN" }
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
