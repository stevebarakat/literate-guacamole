import { Transport as t } from "tone";
import { interval, animationFrameScheduler } from "rxjs";
import { assign, fromObservable, setup } from "xstate";
import { createActorContext } from "@xstate/react";

export const clockMachine = setup({
  types: {
    input: {} as { sourceSong: SourceSong | undefined },
    context: {} as { currentTime: number; sourceSong: SourceSong | undefined },
  },
  actors: {
    ticker: fromObservable(() => interval(0, animationFrameScheduler)),
  },
}).createMachine({
  context: ({ input }) => ({
    sourceSong: input.sourceSong,
    currentTime: 0,
  }),
  id: "clockMachine",
  initial: "ticking",
  states: {
    ticking: {
      invoke: {
        src: "ticker",
        id: "ticker",
        onSnapshot: [
          {
            actions: assign(() => ({
              currentTime: t.seconds,
            })),
          },
          {
            guard: ({ context }) =>
              Boolean(context.currentTime > context.sourceSong!.endPosition),
          },
        ],
      },
    },
  },
});

export const ClockContext = createActorContext(clockMachine);
