import { animationFrameScheduler, interval } from "rxjs";
import { Transport as t, Channel, Destination, Player } from "tone";
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
    id: "mixerMachine",

    context: ({ input: initialContext }: Input) => ({
      ...initialContext,
    }),

    initial: "not ready",

    states: {
      "not ready": {},

      error: {
        entry: "disposeTracks",
      },

      building: {
        entry: "disposeTracks",
        invoke: {
          src: "builder",
          input: ({ context }) => ({ sourceSong: context.sourceSong }),
          onDone: {
            target: "100%",
            actions: ["setAudioBuffers", "buildMixer"],
          },
          onError: {
            target: "error",
            actions: ({ event }) => {
              console.error(event.error);
            },
          },
        },
      },

      "100%": {
        after: {
          1000: { target: "ready" },
        },
      },

      ready: {
        on: {
          "SONG.RESET": {
            guard: "canStop?",
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
          "SONG.CHANGE_VOLUME": {
            actions: {
              type: "setMainVolume",
            },
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
              actions: assign(() => {
                const currentTime = formatMilliseconds(t.seconds);
                return {
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
            },
          },
          started: {
            on: {
              "SONG.PAUSE": {
                target: "stopped",

                actions: {
                  type: "pause",
                },

                guard: "canStop?",
              },
              "SONG.END": {
                actions: "stopClock",
              },
            },
          },
        },
      },
    },

    types: {
      context: {} as InitialContext,
      events: {} as
        | { type: "BUILD.MIXER"; song: SourceSong }
        | { type: "SONG.START" }
        | { type: "SONG.PAUSE" }
        | { type: "SONG.RESET" }
        | { type: "SONG.SEEK"; direction: string; amount: number }
        | { type: "SONG.CHANGE_VOLUME"; volume: number }
        | { type: "SONG.END" },
    },

    on: {
      "BUILD.MIXER": {
        target: ".building",
        actions: "setSourceSong",
      },
    },
  },
  {
    actions: {
      setSourceSong: assign(({ event }) => {
        assertEvent(event, "BUILD.MIXER");
        return { sourceSong: event.song };
      }),
      setAudioBuffers: assign(({ event }) => ({
        audioBuffers: event.output.reverse(),
      })),
      buildMixer: assign(({ context }) => {
        let players: Player[] = [];
        let channels: Channel[] = [];
        context.audioBuffers.forEach((buffer, i) => {
          channels = [...channels, new Channel().toDestination()];
          players = [
            ...players,
            new Player(buffer)
              .chain(channels[i])
              .sync()
              .start(0, context.sourceSong?.startPosition),
          ];
        });
        return {
          sourceSong: context.sourceSong,
          channels,
          players,
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
        });
        return {
          channels: [],
          players: [],
        };
      }),
    },
    actors: {
      builder: fromPromise(({ input }) =>
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

async function fetchAndDecodeAudio(path: string, progress: number) {
  const progRef = document.getElementById("progress") as HTMLInputElement;
  if (progRef && progress === 0) progRef.value = progress.toString();
  const response = await fetch(path);
  const audioContext = new AudioContext();
  return audioContext.decodeAudioData(await response.arrayBuffer());
}

async function createAudioBuffers(tracks: SourceTrack[]) {
  if (!tracks) return;
  let progress = 0;
  let audioBuffers: (AudioBuffer | undefined)[] = [];

  for (const track of tracks) {
    try {
      const buffer: AudioBuffer | undefined = await fetchAndDecodeAudio(
        track.path,
        progress
      );
      audioBuffers = [buffer, ...audioBuffers];
    } catch (err) {
      if (err instanceof Error) throw new Error(err.message);
    } finally {
      const files = tracks.length * 0.01;
      progress = progress + 1 / files;
      const progRef = document.getElementById("progress") as HTMLInputElement;
      if (progRef) progRef.value = Math.ceil(progress).toString();
    }
  }
  progress = 0;
  return audioBuffers;
}

export const MixerContext = createActorContext(mixerMachine);
