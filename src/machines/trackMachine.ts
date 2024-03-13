import { scale, logarithmically } from "@/utils";
import { createActorContext } from "@xstate/react";
import { interval, animationFrameScheduler } from "rxjs";
import { produce } from "immer";
import { FeedbackDelay, PitchShift } from "tone";
import { assign, fromObservable, assertEvent, setup } from "xstate";
import { toggleMachine } from "./toggleMachine";

type TrackContextType = {
  volume: number;
  pan: number;
  track: SourceTrack;
  channel: Channel | Destination;
  fx: (FeedbackDelay | PitchShift)[];
  fxNames: ("delay" | "pitchShift")[];
};
export const trackMachine = setup({
  types: {
    input: {} as { track: SourceTrack; channel: Channel | undefined },
    context: {} as TrackContextType,
    events: {} as
      | { type: "SPAWN_TOGGLES" }
      | { type: "CHANGE_VOLUME"; volume: number }
      | {
          type: "UPDATE_FX_NAMES";
          fxName: string;
          fxId: number;
          action: string;
        }
      | { type: "CHANGE_PAN"; pan: number },
  },
  actions: {
    spawnToggles: assign(({ context, spawn }) => {
      const soloToggleRef = spawn(toggleMachine, {
        id: "solo-toggle",
        input: {
          channel: context.channel,
        },
      });
      const muteToggleRef = spawn(toggleMachine, {
        id: "mute-toggle",
        input: {
          channel: context.channel,
        },
      });
      return {
        soloToggleRef,
        muteToggleRef,
      };
    }),
    setVolume: assign(({ context, event }) => {
      assertEvent(event, "CHANGE_VOLUME");
      const volume = parseFloat(event.volume.toFixed(2));
      const scaled = scale(logarithmically(volume));
      produce(context, (draft) => {
        draft.channel!.volume.value = scaled;
      });
      return { volume };
    }),

    setPan: assign(({ context, event }) => {
      assertEvent(event, "CHANGE_PAN");
      const pan = Number(event.pan.toFixed(2));
      produce(context, (draft) => {
        draft.channel!.pan.value = pan;
      });
      return { pan };
    }),
    setFxNames: assign(({ context, event }) => {
      assertEvent(event, "UPDATE_FX_NAMES");

      if (event.action === "add") {
        const spliced = context.fxNames.toSpliced(event.fxId, 1);
        const fxSpliced = context.fx.toSpliced(event.fxId, 1);
        context.fx[event.fxId].dispose();

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
}).createMachine({
  context: ({ input }) => ({
    volume: -32,
    pan: 0,
    track: input?.track,
    channel: input?.channel,
    fx: [],
    fxNames: [],
  }),
  id: "trackMachine",
  initial: "ready",
  states: {
    ready: {
      entry: "spawnToggles",
      on: {
        CHANGE_VOLUME: {
          actions: {
            type: "setVolume",
          },
        },
        UPDATE_FX_NAMES: {
          actions: {
            type: "setFxNames",
          },
        },
        CHANGE_PAN: {
          actions: {
            type: "setPan",
          },
        },
      },
    },
  },
});
export const TrackContext = createActorContext(trackMachine);
