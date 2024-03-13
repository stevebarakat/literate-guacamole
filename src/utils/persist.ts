import { mixerMachine } from "@/machines/mixerMachine";
import { createActor } from "xstate";

const feedbackActor = createActor(mixerMachine).start();

// Get state to be persisted
const persistedState = feedbackActor.getPersistedSnapshot();
console.log("persistedState", persistedState);

// Persist state
localStorage.setItem("feedback", JSON.stringify(persistedState));

// Restore state
const restoredState = JSON.parse(localStorage.getItem("feedback"));

export const restoredFeedbackActor = createActor(mixerMachine, {
  snapshot: restoredState,
}).start();
