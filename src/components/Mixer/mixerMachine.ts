import { animationFrameScheduler, interval } from "rxjs";
import { Transport as t, Channel, Destination, Player, start } from "tone";
import {
  assertEvent,
  assign,
  createMachine,
  fromObservable,
  fromPromise,
  stopChild,
} from "xstate";
import { scale, logarithmically } from "@/utils";
import { createActorContext } from "@xstate/react";
import { trackMachine } from "../Track/trackMachine";
import { clockMachine } from "../Transport/clockMachine";

type InitialContext = {
  currentTime: number;
  volume: number;
  sourceSong?: SourceSong | undefined;
  players: (Player | undefined)[];
  channels: (Channel | undefined)[];
  audioBuffers: (AudioBuffer | undefined)[];
};

export const mixerMachine = createMachine(
  {
    id: "mixerMachine",

    context: {
      volume: -32,
      currentTime: 0,
      sourceSong: undefined,
      players: [undefined],
      channels: [undefined],
      audioBuffers: [undefined],
    },

    initial: "not ready",

    entry: "disposeTracks",
    states: {
      "not ready": {},

      error: {
        entry: "disposeTracks",
      },

      building: {
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
              END: {
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
        | { type: "START" }
        | { type: "PAUSE" }
        | { type: "RESET" }
        | { type: "SEEK"; direction: string; amount: number }
        | { type: "CHANGE_VOLUME"; volume: number }
        | { type: "END" },
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
          context.players[i] = new Player(buffer)
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
      stopSong: () => stopChild("ticker"),
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
      builder: fromPromise(({ input }) =>
        createAudioBuffers(input.sourceSong.tracks)
      ),
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
