import { mixerMachine } from "@/machines/mixerMachine";
import { scale, logarithmically } from "@/utils";
import { createActorContext } from "@xstate/react";
import { interval, animationFrameScheduler } from "rxjs";
import { produce } from "immer";
import { FeedbackDelay, PitchShift } from "tone";
import { createMachine, assign, fromObservable, assertEvent } from "xstate";

export const trackMachine = createMachine(
  {
    id: "trackMachine",
    context: ({ input }) => ({
      volume: -32,
      pan: 0,
      track: input.track,
      channel: input.channel,
      fx: [],
      fxNames: [],
    }),
    initial: "ready",

    states: {
      ready: {
        on: {
          CHANGE_VOLUME: {
            actions: {
              type: "setVolume",
            },
          },
          UPDATE_FX_NAMES: {
            actions: ["setFxNames"],
          },
          CHANGE_PAN: {
            actions: {
              type: "setPan",
            },
          },
        },
      },
    },
    types: {
      events: {} as
        | { type: "CHANGE_VOLUME"; volume: number }
        | {
            type: "UPDATE_FX_NAMES";
            fxName: string;
            fxId: number;
            action: string;
          }
        | { type: "CHANGE_PAN"; pan: number },
      input: {} as {
        track: SourceTrack;
        channel: Channel | undefined;
      },
    },
  },
  {
    actions: {
      setVolume: assign(({ context, event }) => {
        assertEvent(event, "CHANGE_VOLUME");
        const volume = parseFloat(event.volume.toFixed(2));
        const scaled = scale(logarithmically(volume));
        produce(context, (draft) => {
          draft.channel.volume.value = scaled;
        });
        return { volume };
      }),

      setPan: assign(({ context, event }) => {
        assertEvent(event, "CHANGE_PAN");
        const pan = event.pan.toFixed(2);
        produce(context, (draft) => {
          draft.channel.pan.value = pan;
        });
        return { pan };
      }),
      setFxNames: assign(({ context, event }) => {
        assertEvent(event, "UPDATE_FX_NAMES");

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
    },
    actors: {
      ticker: fromObservable(() => interval(0, animationFrameScheduler)),
    },
    guards: {},
    delays: {},
  }
);

export const TrackContext = createActorContext(trackMachine);
