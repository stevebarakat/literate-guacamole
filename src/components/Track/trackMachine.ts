import { scale, logarithmically } from "@/utils";
import { createActorContext } from "@xstate/react";
import { interval, animationFrameScheduler } from "rxjs";
import { produce } from "immer";
import { Channel, FeedbackDelay, PitchShift, Player } from "tone";
import { createMachine, assign, fromObservable, assertEvent } from "xstate";
import { toggleMachine } from "@/machines/toggleMachine";

export const trackMachine = createMachine(
  {
    id: "trackMachine",
    context: ({ input }) => ({
      volume: -32,
      pan: 0,
      track: input.track,
      channel: undefined,
      buffer: input.buffer,
      trackId: input.trackId,
      fx: [],
      fxNames: [],
    }),
    initial: "ready",
    entry: assign(({ context, spawn }) => {
      console.log("context.trackId", context.trackId);
      const channel = new Channel().toDestination();
      const player = new Player(context.buffer).sync().start();
      player.connect(channel);
      const toggleMachineRef = spawn(toggleMachine, {
        systemId: `toggle-machine-${crypto.randomUUID()}`,
        id: `toggle-machine-${context.trackId}`,
        input: {
          sourceSong: context.sourceSong,
        },
      });
      return {
        toggleMachineRef,
        channel,
      };
    }),
    states: {
      ready: {
        initial: "fxPanelOpen",
        states: {
          fxPanelOpen: {
            on: {
              "TRACK.TOGGLE_FX_PANEL": {
                target: "fxPanelClosed",
              },
            },
          },
          fxPanelClosed: {
            on: {
              "TRACK.TOGGLE_FX_PANEL": {
                target: "fxPanelOpen",
              },
            },
          },
        },
        on: {
          "TRACK.CHANGE_VOLUME": {
            actions: {
              type: "setVolume",
            },
          },
          "TRACK.UPDATE_FX_NAMES": {
            actions: ["setFxNames"],
          },
          "TRACK.CHANGE_PAN": {
            actions: {
              type: "setPan",
            },
          },
          "TRACK.TOGGLE_SOLO": {
            actions: {
              type: "toggleSolo",
            },
          },
          "TRACK.TOGGLE_MUTE": {
            actions: {
              type: "toggleMute",
            },
          },
        },
      },
    },
    types: {
      events: {} as
        | { type: "TRACK.CHANGE_VOLUME"; volume: number }
        | {
            type: "TRACK.UPDATE_FX_NAMES";
            fxName: string;
            fxId: number;
            action: string;
          }
        | { type: "TRACK.CHANGE_PAN"; pan: number }
        | { type: "TRACK.TOGGLE_FX_PANEL" }
        | { type: "TRACK.TOGGLE_SOLO"; checked: boolean }
        | { type: "TRACK.TOGGLE_MUTE"; checked: boolean },
      input: {} as {
        track: SourceTrack;
        trackId: number;
        buffer: AudioBuffer | undefined;
      },
    },
  },
  {
    actions: {
      setVolume: assign(({ context, event }) => {
        assertEvent(event, "TRACK.CHANGE_VOLUME");
        const volume = parseFloat(event.volume.toFixed(2));
        const scaled = scale(logarithmically(volume));
        produce(context, (draft) => {
          draft.channel.volume.value = scaled;
        });
        return { volume };
      }),

      setPan: assign(({ context, event }) => {
        assertEvent(event, "TRACK.CHANGE_PAN");
        const pan = event.pan.toFixed(2);
        produce(context, (draft) => {
          draft.channel.pan.value = pan;
        });
        return { pan };
      }),
      setFxNames: assign(({ context, event }) => {
        assertEvent(event, "TRACK.UPDATE_FX_NAMES");

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
      toggleMute: assign(({ context, event }) => {
        assertEvent(event, "TRACK.TOGGLE_MUTE");
        const checked = event.checked;
        produce(context, (draft) => {
          draft.channel.mute = checked;
        });
      }),
      toggleSolo: assign(({ context, event }) => {
        assertEvent(event, "TRACK.TOGGLE_SOLO");
        const checked = event.checked;
        produce(context, (draft) => {
          draft.channel.solo = checked;
        });
      }),
    },
    actors: {
      ticker: fromObservable(() => interval(0, animationFrameScheduler)),
    },
    guards: {},
    delays: {},
  }
);

export const TrackContext = createActorContext(trackMachine);
