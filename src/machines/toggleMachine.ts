import { createActorContext } from "@xstate/react";
import { createMachine } from "xstate";

export const toggleMachine = createMachine({
  id: "toggle",
  initial: "active",
  states: {
    inactive: { on: { TOGGLE: "active" } },
    active: { on: { TOGGLE: "inactive" } },
  },
});

export const ToggleContext = createActorContext(toggleMachine);
