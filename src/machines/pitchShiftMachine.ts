import { createActorContext } from "@xstate/react";
import { PitchShift } from "tone";
import { createMachine, assign, assertEvent } from "xstate";

export const pitchShiftMachine = createMachine(
  {
    context: {
      mix: 0.5,
      pitch: 0,
      feedback: 5,
      delayTime: 5,
    },
    initial: "ready",
    states: {
      ready: {
        on: {
          "PITCH.CHANGE_MIX": {
            actions: {
              type: "setMix",
            },
          },
          "PITCH.CHANGE_PITCH": {
            actions: {
              type: "setPitch",
            },
          },
          "PITCH.CHANGE_TIME": {
            actions: {
              type: "setDelayTime",
            },
          },
          "PITCH.CHANGE_FEEDBACK": {
            actions: {
              type: "setFeedback",
            },
          },
        },
      },
    },
    types: {
      events: {} as
        | { type: "PITCH.CHANGE_MIX"; mix: number; pitchShift: PitchShift }
        | {
            type: "PITCH.CHANGE_TIME";
            delayTime: number;
            pitchShift: PitchShift;
          }
        | {
            type: "PITCH.CHANGE_FEEDBACK";
            feedback: number;
            pitchShift: PitchShift;
          }
        | {
            type: "PITCH.CHANGE_PITCH";
            pitch: number;
            pitchShift: PitchShift;
          },
    },
  },
  {
    actions: {
      setMix: assign(({ event }) => {
        assertEvent(event, "PITCH.CHANGE_MIX");
        const mix = event.mix;
        event.pitchShift.wet.value = mix;
        return { mix };
      }),
      setDelayTime: assign(({ event }) => {
        assertEvent(event, "PITCH.CHANGE_TIME");
        const delayTime = event.delayTime;
        event.pitchShift.delayTime.value = delayTime;
        return { delayTime };
      }),
      setFeedback: assign(({ event }) => {
        console.log("event", event);
        assertEvent(event, "PITCH.CHANGE_FEEDBACK");
        const feedback = event.feedback;
        event.pitchShift.feedback.value = feedback;
        return { feedback };
      }),
      setPitch: assign(({ event }) => {
        assertEvent(event, "PITCH.CHANGE_PITCH");
        const pitch = event.pitch;
        event.pitchShift.pitch = pitch;
        return { pitch };
      }),
    },
    actors: {},
    guards: {},
    delays: {},
  }
);

export const PitchContext = createActorContext(pitchShiftMachine);
