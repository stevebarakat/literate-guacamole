import { createActorContext } from "@xstate/react";
import { PitchShift } from "tone";
import {
  localStorageSet,
  roundFourth,
  localStorageGet,
  mapToObject,
  objectToMap,
} from "@/utils";
import { animationFrameScheduler, from, interval } from "rxjs";
import { Transport as t } from "tone";
import { assign, assertEvent, fromObservable, setup } from "xstate";

export const pitchShiftMachine = setup({
  types: {
    context: {} as {
      mix: number;
      pitch: number;
      data: Map<number, { id: number; value: number; time: number }>;
    },
    events: {} as
      | { type: "READ" }
      | { type: "WRITE"; id: number }
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
    readData: ({ context, event }) => {
      assertEvent(event, "READ");
      console.log("context", context);
      console.log("event", event);
      const setParam = (data: { time: number; value: number }) => {
        t.schedule(() => {
          console.log("data.value", data.value);
          context.pitch = data.value;
        }, data.time);
      };
      const pitchData = localStorageGet("pitchData");
      const pitchMap = objectToMap(pitchData);
      for (const value of pitchMap) {
        setParam(value[1]);
      }
    },
  },
  actors: {
    WRITER: fromObservable(() => interval(0, animationFrameScheduler)),
  },
}).createMachine({
  context: {
    mix: 0.5,
    pitch: 0,
    data: new Map(),
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
      entry: "readData",
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
      invoke: {
        src: "WRITER",
        onSnapshot: [
          {
            actions: assign(({ context, event }) => {
              // console.log("context", context);
              const data = context.data;
              t.scheduleRepeat(
                () => {
                  const time: number = roundFourth(t.seconds);
                  data.set(time, {
                    id: event.trackId,
                    time,
                    value: context.pitch,
                  });
                  const newData = mapToObject(data);
                  localStorageSet("pitchData", newData);
                },
                0.25,
                0
              );
            }),
          },
        ],
      },
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
