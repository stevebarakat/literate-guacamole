import { animationFrameScheduler, interval } from "rxjs";
import { Transport as t, Channel, Destination, Player, start } from "tone";
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
import { trackMachine } from "../Track/trackMachine";
import { clockMachine } from "../Transport/clockMachine";
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

        // invoke: {
        //   src: "ticker",
        //   id: "ticker",
        //   onSnapshot: [
        //     {
        //       target: ".stopped",
        //       guard: ({ context }) =>
        //         Boolean(
        //           context.sourceSong &&
        //             t.seconds > context.sourceSong.endPosition
        //         ),
        //     },
        //     {
        //       actions: assign(() => {
        //         const currentTime = formatMilliseconds(t.seconds);
        //         return {
        //           currentTime,
        //         };
        //       }),
        //     },
        //   ],
        // },

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
        audioBuffers: event.output,
      })),
      buildMixer: assign(({ context, spawn }) => {
        start();

        let trackMachineRefs = [];
        const clockMachineRef = spawn(clockMachine, {
          id: "clock-machine",
          input: {
            sourceSong: context.sourceSong,
          },
        });
        context.audioBuffers.forEach((buffer, i) => {
          trackMachineRefs = [
            ...trackMachineRefs,
            spawn(trackMachine, {
              id: `track-${i}`,
              input: {
                // channel: channels[i],
                buffer,
                track: context.sourceSong!.tracks[i],
                trackId: i,
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
      disposeTracks: assign(() => ({
        buffer: undefined,
      })),
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
      audioBuffers = [...audioBuffers, buffer];
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
