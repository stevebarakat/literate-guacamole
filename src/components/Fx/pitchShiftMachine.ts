import { createActorContext } from "@xstate/react";
import { PitchShift } from "tone";
import { setup, assign, assertEvent } from "xstate";

export const pitchShiftMachine = setup({
  types: {
    context: {} as {
      mix: number;
      pitch: number;
      feedback: number;
      delayTime: number;
    },
    events: {} as
      | { type: "READ" }
      | { type: "WRITE" }
      | { type: "BYPASS" }
      | { type: "CHANGE_MIX"; mix: number; pitchShift: PitchShift }
      | {
          type: "CHANGE_PITCH";
          pitch: number;
          pitchShift: PitchShift;
        },
  },
  actions: {
    setMix: assign(({ event }) => {
      assertEvent(event, "CHANGE_MIX");
      const mix = event.mix;
      event.pitchShift.wet.value = mix;
      return { mix };
    }),
    setPitch: assign(({ event }) => {
      assertEvent(event, "CHANGE_PITCH");
      const pitch = event.pitch;
      event.pitchShift.pitch = pitch;
      return { pitch };
    }),
  },
}).createMachine({
  context: {
    mix: 0.5,
    pitch: 0,
    feedback: 5,
    delayTime: 5,
  },
  id: "pitchShiftMachine",
  initial: "off",
  on: {
    CHANGE_MIX: {
      actions: {
        type: "setMix",
      },
    },
    CHANGE_PITCH: {
      actions: {
        type: "setPitch",
      },
    },
  },
  states: {
    off: {
      on: {
        READ: {
          target: "reading",
        },
        WRITE: {
          target: "writing",
        },
      },
    },
    reading: {
      on: {
        WRITE: {
          target: "writing",
        },
        BYPASS: {
          target: "off",
        },
      },
    },
    writing: {
      on: {
        READ: {
          target: "reading",
        },
        BYPASS: {
          target: "off",
        },
      },
    },
  },
});

export const PitchContext = createActorContext(pitchShiftMachine);
