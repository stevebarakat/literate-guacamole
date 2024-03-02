import { formatMilliseconds } from "@/utils";
import { Transport as t } from "tone";
import { interval, animationFrameScheduler } from "rxjs";
import { assign, fromObservable, setup } from "xstate";
import { createActorContext } from "@xstate/react";

export const clockMachine = setup({
  types: {
    input: {} as { sourceSong: SourceSong },
    context: {} as { currentTime: string; sourceSong: SourceSong },
  },
  actors: {
    ticker: fromObservable(() => interval(0, animationFrameScheduler)),
  },
}).createMachine({
  context: ({ input }) => ({
    sourceSong: input.sourceSong,
    currentTime: "00:00:00",
  }),
  id: "clockMachine",
  initial: "ready",
  states: {
    ready: {
      invoke: {
        src: "ticker",
        id: "ticker",
        onSnapshot: [
          {
            // target: "stopped",

            guard: ({ context }) =>
              Boolean(
                context.sourceSong && t.seconds > context.sourceSong.endPosition
              ),
          },
          {
            actions: assign(() => {
              const currentTime = formatMilliseconds(t.seconds);
              return {
                currentTime,
              };
            }),
          },
        ],
      },
    },
  },
});

export const ClockContext = createActorContext(clockMachine);
