import { createActorContext } from "@xstate/react";
import { PitchShift } from "tone";
import { createMachine, assign, assertEvent } from "xstate";

export const pitchShiftMachine = createMachine(
  {
    id: "pitchShiftMachine",
    context: {
      mix: 0.5,
      pitch: 0,
    },
    initial: "ready",
    states: {
      ready: {
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
      },
    },
    types: {
      events: {} as
        | { type: "CHANGE_PITCH"; pitch: number; pitchShift: PitchShift }
        | { type: "CHANGE_MIX"; mix: number; pitchShift: PitchShift },
    },
  },
  {
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
    actors: {},
    guards: {},
    delays: {},
  }
);

export const PitchContext = createActorContext(pitchShiftMachine);
