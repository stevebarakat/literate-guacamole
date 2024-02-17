import { setup } from "xstate";

export const toggleMachine = setup({
  types: {
    events: {} as { type: "TOGGLE" },
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
  id: "toggleMachine",
  initial: "inactive",
  states: {
    inactive: {
      on: {
        TOGGLE: {
          target: "active",
        },
      },
    },
    active: {
      on: {
        TOGGLE: {
          target: "inactive",
        },
      },
    },
  },
});
