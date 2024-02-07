import { createActorContext } from "@xstate/react";
import { AutoFilter } from "tone";
import { createMachine, assign, assertEvent } from "xstate";

export const autoFilterMachine = createMachine(
  {
    id: "autoFilterMachine",
    context: {
      mix: 0.5,
    },
    initial: "ready",
    states: {
      ready: {
        on: {
          "AUTOFILTER.CHANGE_MIX": {
            actions: {
              type: "setMix",
            },
          },
        },
      },
    },
    types: {
      events: {} as
        | {
            type: "AUTOFILTER.CHANGE_MIX";
            mix: number;
            autoFilter: AutoFilter;
          }
        | {
            type: "AUTOFILTER.CHANGE_FREQUENCY";
            frequency: number;
            autoFilter: AutoFilter;
          }
        | {
            type: "AUTOFILTER.CHANGE_DEPTH";
            depth: number;
            autoFilter: AutoFilter;
          }
        | {
            type: "AUTOFILTER.CHANGE_OCTAVE";
            octaves: number;
            autoFilter: AutoFilter;
          }
        | {
            type: "AUTOFILTER.CHANGE_TYPE";
            filterType: string;
            autoFilter: AutoFilter;
          },
    },
  },
  {
    actions: {
      setMix: assign(({ event }) => {
        assertEvent(event, "AUTOFILTER.CHANGE_MIX");
        const mix = event.mix;
        event.autoFilter.wet.value = mix;
        return { mix };
      }),
    },
  }
);

export const AutoFilterContext = createActorContext(autoFilterMachine);
