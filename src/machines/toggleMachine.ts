import { createMachine } from "xstate";

export const toggleMachine = createMachine({
  id: "toggle",
  initial: "active",
  states: {
    inactive: {
      on: {
        TOGGLE: () => {
          console.log("message");
          return "active";
        },
      },
    },
    active: {
      on: {
        TOGGLE: () => {
          console.log("message");
          return "active";
        },
      },
    },
  },
});
