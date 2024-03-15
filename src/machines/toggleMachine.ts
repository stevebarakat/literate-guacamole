import { createActorContext } from "@xstate/react";
import { createMachine } from "xstate";

export const toggleMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QBcD2UoBswFkCGAxgBYCWAdmAHTmHIkBuYAxACoDyA4hwDICiA2gAYAuolAAHVLBJ1UZMSAAeiAIwAOAKwAaEAE9VawQF8jOtBmz5i5KrQbN2XPkNFIQk6bPlvlCddr1EAE5jEx0yVAg4BXMsXEJSCgUPGRI5BV8VACYdfT8ssJBYywSbajI7RmSpVPSfRABmLIB2XOCANkLi+OsKSkqwas8071BfdsE2hCDOkyMgA */
  id: "toggleMachine",
  initial: "active",
  states: {
    inactive: { on: { TOGGLE: "active" } },
    active: { on: { TOGGLE: "inactive" } },
  },
});

export const ToggleContext = createActorContext(toggleMachine);
