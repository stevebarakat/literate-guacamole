import { scale, logarithmically } from "@/utils";
import { createActorContext } from "@xstate/react";
import { interval, animationFrameScheduler } from "rxjs";
import { Meter } from "tone";
import { produce } from "immer";
import { FeedbackDelay, PitchShift, AutoFilter } from "tone";
import { createMachine, assign, fromObservable, assertEvent } from "xstate";

export const trackMachine = createMachine(
  {
    id: "trackMachine",
    context: ({ input }) => ({
      volume: -32,
      pan: 0,
      track: input.track,
      channel: input.channel,
      meter: input.meter,
      meterLevel: new Float32Array(),
      fx: [],
      fxNames: [],
    }),
    initial: "ready",
    states: {
      ready: {
        invoke: {
          src: "ticker",
          onSnapshot: {
            actions: assign(({ context }) => ({
              meterLevel: context.meter.getValue(),
            })),
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
        | { type: "TRACK.TOGGLE_SOLO"; checked: boolean }
        | { type: "TRACK.TOGGLE_MUTE"; checked: boolean },
      input: {} as {
        track: SourceTrack;
        channel: Channel | undefined;
        meter: Meter | undefined;
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
          context.fx[event.fxId]?.disconnect();

          switch (event.fxName) {
            case "delay":
              return {
                fxNames: [...spliced, event.fxName],
                fx: [...fxSpliced, new FeedbackDelay().toDestination()],
              };
              break;
            // case "autoFilter":
            //   return send({
            //     type: "TRACK.UPDATE_FX_NAMES",
            //     fxNames: [...spliced, fxName],
            //     fx: [...fxSpliced, new AutoFilter().start().toDestination()],
            //   });

            // case "pitchShift":
            //   return send({
            //     type: "TRACK.UPDATE_FX_NAMES",
            //     fxNames: [...spliced, fxName],
            //     fx: [...fxSpliced, new PitchShift().toDestination()],
            //   });
            default:
              break;
          }
        } else {
          context.fx[event.fxId].dispose();
          // context.fxNames = context.fxNames.toSpliced(event.fxId, 1);
          // context.fx = context.fx.toSpliced(event.fxId, 1);
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
