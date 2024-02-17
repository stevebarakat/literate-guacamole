import { createActorContext } from "@xstate/react";
import { AutoWah } from "tone";
import { createMachine, assign, assertEvent } from "xstate";

export const autoWahMachine = createMachine(
  {
    id: "autoWahMachine",
    context: {
      mix: 0.5,
      baseFrequency: 1,
    },
    initial: "ready",
    states: {
      ready: {
        on: {
          "AUTOWAH.CHANGE_MIX": {
            actions: {
              type: "setMix",
            },
          },
          "AUTOWAH.CHANGE_BASE_FREQUENCY": {
            actions: {
              type: "setBaseFrequency",
            },
          },
        },
      },
    },
    types: {
      events: {} as
        | {
            type: "AUTOWAH.CHANGE_MIX";
            mix: number;
            autoWah: AutoWah;
          }
        | {
            type: "AUTOWAH.CHANGE_BASE_FREQUENCY";
            baseFrequency: number;
            autoWah: AutoWah;
          },
    },
  },
  {
    actions: {
      setMix: assign(({ event }) => {
        assertEvent(event, "AUTOWAH.CHANGE_MIX");
        const mix = event.mix;
        event.autoWah.wet.value = mix;
        return { mix };
      }),
      setBaseFrequency: assign(({ event }) => {
        assertEvent(event, "AUTOWAH.CHANGE_BASE_FREQUENCY");
        const baseFrequency = event.baseFrequency;
        event.autoWah.baseFrequency = baseFrequency;
        return { baseFrequency };
      }),
    },
  }
);

export const AutoWahContext = createActorContext(autoWahMachine);
