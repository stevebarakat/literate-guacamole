import { createActorContext } from "@xstate/react";
import { produce } from "immer";
import { setup, assertEvent, assign } from "xstate";

export const panMachine = setup({
  types: {
    context: {} as { channel: Channel; pan: number },
    input: {} as { channel: Channel },
    events: {} as
      | { type: "CHANGE_PAN"; pan: number }
      | { type: "READ" }
      | { type: "WRITE" }
      | { type: "TURN_OFF" },
  },
  actions: {
    setPan: assign(({ context, event }) => {
      assertEvent(event, "CHANGE_PAN");
      const pan = Number(event.pan.toFixed(2));
      produce(context, (draft) => {
        draft.channel.pan.value = pan;
      });
      return { pan };
    }),
  },
}).createMachine({
  context: ({ input }) => ({
    pan: 0,
    channel: input?.channel,
  }),
  id: "panMachine",
  initial: "off",
  states: {
    off: {
      on: {
        CHANGE_PAN: {
          actions: {
            type: "setPan",
          },
        },
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
        TURN_OFF: {
          target: "off",
        },
      },
    },
    writing: {
      on: {
        READ: {
          target: "reading",
        },
        TURN_OFF: {
          target: "off",
        },
      },
    },
  },
});
export const PanContext = createActorContext(panMachine);
