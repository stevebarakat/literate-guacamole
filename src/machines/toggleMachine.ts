import { createActorContext } from "@xstate/react";
import { setup } from "xstate";

export const toggleMachine = setup({
  types: {
    context: {} as {},
    events: {} as { type: "TOGGLE" },
  },
  actions: {
    toggle: function ({ context, event }) {
      console.log("message");
    },
  },
  schemas: {
    events: {
      TOGGLE: {
        type: "object",
        properties: {},
      },
    },
  },
}).createMachine({
  context: {},
  id: "toggle",
  initial: "active",
  states: {
    active: {
      on: {
        TOGGLE: {
          target: "inactive",
          actions: {
            type: "toggle",
          },
        },
      },
    },
    inactive: {
      on: {
        TOGGLE: {
          target: "active",
          actions: {
            type: "toggle",
          },
        },
      },
    },
  },
});

export const ToggleContext = createActorContext(toggleMachine);
