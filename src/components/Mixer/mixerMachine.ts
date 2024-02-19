import { animationFrameScheduler, interval } from "rxjs";
import {
  Transport as t,
  Channel,
  Destination,
  Meter,
  Player,
  getContext,
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
import { roxanne } from "@/assets/songs/roxanne";
type Input = { input: InitialContext };

const audioContext = getContext();

export const mixerMachine = createMachine(
  {
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

      loading: {
        invoke: {
          src: "loader",
          input: ({ context }) => ({ sourceSong: context.sourceSong }),
          onDone: [
            {
              target: "building",
              actions: assign(({ event }) => ({ audioBuffers: event.output })),
            },
          ],
          onError: {
            target: "error",
          },
        },
      },

      building: {
        entry: "buildMixer",
        onDone: { target: "ready" },
      },

      ready: {
        on: {
          "SONG.RESET": {
            guard: "canStop?",
            target: ".stopped",

            actions: {
              type: "reset",
            },

            description: `Stop playing and return playhead to beginning of song.`,
          },
          "SONG.SEEK": {
            guard: "canSeek?",

            actions: {
              type: "seek",
            },

            description: `Move the playhead position forward or backward (the given amount of seconds).`,
          },
          "SONG.CHANGE_VOLUME": {
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
              "SONG.START": {
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
              "SONG.PAUSE": {
                target: "stopped",

                actions: {
                  type: "pause",
                },

                guard: "canStop?",
                description: `Stop playing song.`,
              },
              "SONG.END": {
                actions: "stopClock",

                description: `The song has reached its end position. Stop **ticker** actor and target **stopped** state.`,
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
        | { type: "LOAD.AUDIO"; song: SourceSong }
        | { type: "BUILD.MIXER"; song: SourceSong }
        | { type: "SONG.START" }
        | { type: "SONG.PAUSE" }
        | { type: "SONG.RESET" }
        | { type: "SONG.SEEK"; direction: string; amount: number }
        | { type: "SONG.CHANGE_VOLUME"; volume: number }
        | { type: "SONG.END" },
    },

    description: `A multitrack audio mixer with effects.`,

    on: {
      "LOAD.AUDIO": {
        target: ".loading",
        actions: "setSourceSong",
      },
      "BUILD.MIXER": {
        target: ".building",
      },
    },
  },
  {
    actions: {
      setSourceSong: assign(({ event }) => {
        assertEvent(event, "LOAD.AUDIO");
        return { sourceSong: event.song };
      }),
      buildMixer: assign(({ context, event }) => {
        console.log("EVENT!", event);
        console.log("CONTEXT!!", context);
        // assertEvent(event, "BUILD.MIXER");
        let players: Player[] = [];
        let meters: Meter[] = [];
        let channels: Channel[] = [];
        context.sourceSong?.tracks.forEach((track, i) => {
          meters = [...meters, new Meter()];
          channels = [...channels, new Channel().toDestination()];
          players = [
            ...players,
            new Player(track.path)
              .chain(channels[i], meters[i])
              .sync()
              .start(0, context.sourceSong?.startPosition),
          ];
        });
        const meter = new Meter();
        Destination.connect(meter);
        return {
          sourceSong: context.sourceSong,
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
        assertEvent(event, "SONG.SEEK");
        if (event.direction === "forward") {
          t.seconds = t.seconds + 10;
        } else {
          t.seconds = t.seconds - 10;
        }
      },
      stopSong: () => stopChild("ticker"),
      setMainVolume: assign(({ event }) => {
        assertEvent(event, "SONG.CHANGE_VOLUME");
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
      loader: fromPromise(({ input }) =>
        createAudioBuffers(input.sourceSong.tracks)
      ),
      ticker: fromObservable(() => interval(0, animationFrameScheduler)),
    },
    guards: {
      "canSeek?": ({ context, event }) => {
        assertEvent(event, "SONG.SEEK");
        return event.direction === "forward"
          ? t.seconds < context.sourceSong!.endPosition - event.amount
          : t.seconds > event.amount;
      },

      "canStop?": () => t.seconds !== 0,
      "canPlay?": () => !(t.state === "started"),
    },
  }
);

async function fetchAndDecodeAudio(path: string) {
  const response = await fetch(path);
  return audioContext?.decodeAudioData(await response.arrayBuffer());
}

async function createAudioBuffers(tracks: SourceTrack[]) {
  if (!tracks) return;
  let loaded = 0;
  let audioBuffers: (AudioBuffer | undefined)[] = [];
  for (const track of tracks) {
    try {
      const buffer: AudioBuffer | undefined = await fetchAndDecodeAudio(
        track.path
      );
      audioBuffers = [buffer, ...audioBuffers];
    } catch (err) {
      if (err instanceof Error)
        console.error(`Error: ${err.message} for file at: ${track.path} `);
    } finally {
      const files = tracks.length * 0.01;
      loaded = loaded + 1 / files;
      console.log("loaded", loaded);
      console.log("audioBuffers", audioBuffers);
    }
  }
  loaded = 100;
  return audioBuffers;
}

export const MixerContext = createActorContext(mixerMachine);
