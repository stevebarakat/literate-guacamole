import { delayMachine } from "./delayMachine";
import { createActor } from "xstate";

// Get the state from localStorage (if it exists)
const stateString = localStorage.getItem("some-state");

// Create the state from the string (if it exists)
const restoredState = stateString ? JSON.parse(stateString) : undefined;

export const persistActor = createActor(delayMachine, {
  // Restore the state (if it exists)
  snapshot: restoredState,
});

persistActor.subscribe(() => {
  // Persist the state to localStorage
  const persistedState = persistActor.getPersistedSnapshot();
  localStorage.setItem("some-state", JSON.stringify(persistedState));
});

persistActor.start();
