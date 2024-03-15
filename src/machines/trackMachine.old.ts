import { scale, logarithmically } from "@/utils";
import { createActorContext } from "@xstate/react";
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
            actions: "setVolume",
          },
          CHANGE_FX: {
            actions: "setFx",
          },
          CHANGE_PAN: {
            actions: "setPan",
          },
        },
      },
    },
    types: {
      events: {} as
        | { type: "CHANGE_VOLUME"; volume: number }
        | {
            type: "CHANGE_FX";
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
      setFx: assign(({ context, event }) => {
        assertEvent(event, "CHANGE_FX");

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
  }
);

export const TrackContext = createActorContext(trackMachine);
