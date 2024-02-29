import { createActorContext } from "@xstate/react";
import { FeedbackDelay } from "tone";
import { createMachine, assign, assertEvent } from "xstate";

export const delayMachine = createMachine(
  {
    id: "delayMachine",
    context: {
      mix: 0.5,
      feedback: 0,
      delayTime: 0.5,
    },
    initial: "ready",
    states: {
      ready: {
        on: {
          "DELAY.CHANGE_MIX": {
            actions: {
              type: "setMix",
            },
          },
          "DELAY.CHANGE_TIME": {
            actions: {
              type: "setDelayTime",
            },
          },
          "DELAY.CHANGE_FEEDBACK": {
            actions: {
              type: "setFeedback",
            },
          },
        },
      },
    },
    types: {
      events: {} as
        | {
            type: "DELAY.CHANGE_FEEDBACK";
            feedback: number;
            delay: FeedbackDelay;
          }
        | { type: "DELAY.CHANGE_TIME"; delayTime: number; delay: FeedbackDelay }
        | { type: "DELAY.CHANGE_MIX"; mix: number; delay: FeedbackDelay },
    },
  },
  {
    actions: {
      setMix: assign(({ event }) => {
        assertEvent(event, "DELAY.CHANGE_MIX");
        const mix = event.mix;
        event.delay.wet.value = mix;
        return { mix };
      }),
      setDelayTime: assign(({ event }) => {
        assertEvent(event, "DELAY.CHANGE_TIME");
        const delayTime = event.delayTime;
        event.delay.delayTime.value = delayTime;
        return { delayTime };
      }),
      setFeedback: assign(({ event }) => {
        assertEvent(event, "DELAY.CHANGE_FEEDBACK");
        const feedback = event.feedback;
        event.delay.feedback.value = feedback;
        return { feedback };
      }),
    },
    actors: {},
    guards: {},
    delays: {},
  }
);

export const DelayContext = createActorContext(delayMachine);
