import { createActorContext } from "@xstate/react";
import { AutoFilter } from "tone";
import { createMachine, assign, assertEvent } from "xstate";

export const autoFilterMachine = createMachine(
  {
    id: "autoFilterMachine",
    context: {
      mix: 0.5,
      frequency: 1,
      baseFrequency: 1,
      depth: 1,
      octaves: 1,
      filterType: "sine",
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
          "AUTOFILTER.CHANGE_FREQUENCY": {
            actions: {
              type: "setFrequency",
            },
          },
          "AUTOFILTER.CHANGE_BASE_FREQUENCY": {
            actions: {
              type: "setBaseFrequency",
            },
          },
          "AUTOFILTER.CHANGE_DEPTH": {
            actions: {
              type: "setDepth",
            },
          },
          "AUTOFILTER.CHANGE_OCTAVES": {
            actions: {
              type: "setOctaves",
            },
          },
          "AUTOFILTER.CHANGE_TYPE": {
            actions: {
              type: "setFilterType",
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
            type: "AUTOFILTER.CHANGE_BASE_FREQUENCY";
            baseFrequency: number;
            autoFilter: AutoFilter;
          }
        | {
            type: "AUTOFILTER.CHANGE_DEPTH";
            depth: number;
            autoFilter: AutoFilter;
          }
        | {
            type: "AUTOFILTER.CHANGE_OCTAVES";
            octaves: number;
            autoFilter: AutoFilter;
          }
        | {
            type: "AUTOFILTER.CHANGE_TYPE";
            filterType: OscillatorType;
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
      setBaseFrequency: assign(({ event }) => {
        assertEvent(event, "AUTOFILTER.CHANGE_BASE_FREQUENCY");
        const baseFrequency = event.baseFrequency;
        event.autoFilter.baseFrequency = baseFrequency;
        return { baseFrequency };
      }),
      setFrequency: assign(({ event }) => {
        assertEvent(event, "AUTOFILTER.CHANGE_FREQUENCY");
        const frequency = event.frequency;
        event.autoFilter.frequency.value = frequency;
        return { frequency };
      }),
      setDepth: assign(({ event }) => {
        assertEvent(event, "AUTOFILTER.CHANGE_DEPTH");
        const depth = event.depth;
        event.autoFilter.depth.value = depth;
        return { depth };
      }),
      setOctaves: assign(({ event }) => {
        assertEvent(event, "AUTOFILTER.CHANGE_OCTAVES");
        const octaves = event.octaves;
        event.autoFilter.octaves = octaves;
        return { octaves };
      }),
      setFilterType: assign(({ event }) => {
        assertEvent(event, "AUTOFILTER.CHANGE_TYPE");
        const filterType = event.filterType;
        event.autoFilter.type = filterType;
        return { filterType };
      }),
    },
  }
);

export const AutoFilterContext = createActorContext(autoFilterMachine);
