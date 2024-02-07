import { scale, logarithmically } from "@/utils";
import { createActorContext } from "@xstate/react";
import { interval, animationFrameScheduler } from "rxjs";
import { Meter } from "tone";
import { produce } from "immer";
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
            fxNames: string[];
            fx: Fx;
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
      setFxNames: assign(({ event }) => {
        assertEvent(event, "TRACK.UPDATE_FX_NAMES");
        return { fxNames: event.fxNames, fx: event.fx };
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