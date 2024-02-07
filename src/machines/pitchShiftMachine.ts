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
        },
      },
    },
    types: {
      events: {} as
        | { type: "PITCH.CHANGE_MIX"; mix: number; pitchShift: PitchShift }
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
