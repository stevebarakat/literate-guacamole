import { scale, logarithmically } from "@/utils";
import { createActorContext } from "@xstate/react";
import { interval, animationFrameScheduler } from "rxjs";
import { FeedbackDelay, PitchShift, Meter } from "tone";
import { produce } from "immer";
import { createMachine, assign, fromObservable, assertEvent } from "xstate";

export const trackMachine = createMachine(
  {
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
          src: "TICKER",
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
          "TRACK.TOGGLE_DELAY": {
            actions: {
              type: "toggleDelay",
            },
          },
          "TRACK.TOGGLE_PITCHSHIFT": {
            actions: {
              type: "togglePitchShift",
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
            fx: FeedbackDelay[];
          }
        | { type: "TRACK.CHANGE_PAN"; pan: number }
        | { type: "TRACK.TOGGLE_SOLO"; checked: boolean }
        | { type: "TRACK.TOGGLE_MUTE"; checked: boolean }
        | { type: "TRACK.TOGGLE_PITCHSHIFT"; checked: boolean }
        | { type: "TRACK.TOGGLE_DELAY"; checked: boolean },
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
      toggleDelay: assign(({ context, event }) => {
        assertEvent(event, "TRACK.TOGGLE_DELAY");
        // const checked = context.fxNames.includes("delay");
        // console.log("checked", checked);
        // const delay: FeedbackDelay | undefined = undefined;
        // const values = Object.values(context.fx).filter((value) => {
        //   return typeof value !== "undefined";
        // });
        // if (checked) {
        //   delay = new FeedbackDelay().toDestination();
        //   context.channel.chain(...values, delay);
        // } else {
        //   context.fx.delay?.dispose();
        //   delay = undefined;
        // }
        // return { fx: { ...context.fx, delay } };
      }),
      togglePitchShift: assign(({ context, event }) => {
        assertEvent(event, "TRACK.TOGGLE_PITCHSHIFT");
        const checked = event.checked;
        let pitchShift: PitchShift | undefined = new PitchShift();
        if (checked) {
          pitchShift = new PitchShift().toDestination();
          const values = Object.values(context.fx).filter(
            (value) => typeof value !== "undefined"
          );
          context.channel.chain(...values, pitchShift);
        } else {
          context.fx.pitchShift?.dispose();
          pitchShift = undefined;
        }
        return { fx: { ...context.fx, pitchShift } };
      }),
    },
    actors: {
      TICKER: fromObservable(() => interval(0, animationFrameScheduler)),
    },
    guards: {},
    delays: {},
  }
);

export const TrackContext = createActorContext(trackMachine);
