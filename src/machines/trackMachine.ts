import { scale, logarithmically } from "@/utils";
import { createActorContext } from "@xstate/react";
import { produce } from "immer";
import { FeedbackDelay, PitchShift } from "tone";
import { setup, assign, assertEvent } from "xstate";

export const trackMachine = setup({
  types: {
    context: {} as {
      track: SourceTrack;
      channel: Channel | undefined;
      volume: number;
      pan: number;
      fxNames: string[];
      fx: (PitchShift | FeedbackDelay)[];
    },

    events: {} as
      | { type: "TOGGLE_SOLO"; channel: Channel }
      | { type: "TOGGLE_MUTE"; channel: Channel }
      | { type: "CHANGE_VOLUME"; volume: number }
      | {
          type: "CHANGE_FX";
          fxName: string;
          fxId: number;
          action: string;
        }
      | { type: "CHANGE_PAN"; pan: number },
    input: {} as {
      track: SourceTrack;
      channel: Channel | undefined;
    },
  },
  actions: {
    setVolume: assign(({ context, event }) => {
      assertEvent(event, "CHANGE_VOLUME");
      const volume = parseFloat(event.volume.toFixed(2));
      const scaled = scale(logarithmically(volume));
      produce(context, (draft) => {
        draft.channel!.volume.value = scaled;
      });
      return { volume };
    }),

    setPan: assign(({ context, event }) => {
      assertEvent(event, "CHANGE_PAN");
      const pan = Number(event.pan.toFixed(2));
      produce(context, (draft) => {
        draft.channel!.pan.value = pan;
      });
      return { pan };
    }),
    setFx: assign(({ context, event }) => {
      assertEvent(event, "CHANGE_FX");
      console.log("SET FX!!!");
      console.log("event", event);

      if (event.action === "add") {
        console.log("ADDING FX!!!");
        const spliced = context.fxNames.toSpliced(event.fxId, 1);
        const fxSpliced = context.fx.toSpliced(event.fxId, 1);
        context.fx[event.fxId]?.dispose();

        switch (event.fxName) {
          case "delay":
            return {
              fxNames: [...spliced, event.fxName],
              fx: [...fxSpliced, new FeedbackDelay().toDestination()],
            };

          case "pitchShift":
            return {
              fxNames: [...spliced, event.fxName],
              fx: [...fxSpliced, new PitchShift().toDestination()],
            };

          default:
            break;
        }
      } else {
        console.log("REMOVING FX!!!");
        context.fx[event.fxId].dispose();
        return {
          fxNames: context.fxNames.toSpliced(event.fxId, 1),
          fx: context.fx.toSpliced(event.fxId, 1),
        };
      }
    }),
    toggleMute: function ({ event }) {
      assertEvent(event, "TOGGLE_MUTE");
      event.channel.mute = !event.channel?.mute;
    },
    toggleSolo: function ({ event }) {
      assertEvent(event, "TOGGLE_SOLO");
      event.channel.solo = !event.channel?.solo;
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QBcBOBDAxgawLJYAsBLAOzADpYB7AGyvNK2SIDcwBiAFQHkBxXgDIBRAPoBlbgO4BtAAwBdRKAAOVWEWZUSSkAA9EAWgCMAdlnkAbEYCcAVgsBmaxfu2HAFhMAaEAE9ERrIAHORBLp4mDrYmAEy21jEAvok+aFh4hKQU1HTkTKwcPPzC4pIyCjqq6praSHqGHg7kCTEODrIxsrZdtj7+CEZBJs3OQR0OMdYmQUbuyakYOPiYxGTkALYArsgUjJjMbFx8gqK4AKqcQnKKdVUaRFo6+ght5g4mjg4zJtMm8X0BYKhcI-KKxeKDeYgNJLTJrLY7PL7ApHYqnC5XCq3NT3R51Z5GbrkSYWIZTGLuGZtGIAgZDEak8aTaazWxQmEZFZZdgAYQAEgBBAByvFEADEABrXSo4mpPRAxRXkdzuTpBWxBdxWWQqml+RDuWTDIxWQIxCwxMkTdmLTmrDj84WikQABWF0ux1QetVAzwMk1syuCJusTmsdhMJtphuNpo6FqtSRS0Nty3tvMFItEADVJGdcJibipZd75QgDIbyLFI9EpqHbOb3NGjeQTUYzQmTKGjMlkyQqBA4DoOWmsjKvXjfYZ3E5morXp1urZevry2NWx4G42YiZDUEkwt0qO1jkqOPcT76uWnEY5612ouerTAsDbBEwXFrDY2cmR3DsrQ9B7AcYDnnK+INF0d4Ll0T6ru2FiWA4piRmMsTWO41hBDaR7-pQgFIiBYGlhB5ZGOarbfo4ziuB4QS0oqwxBPuGHLu0XyWnMv6pnhCKgZ6F5lmaxKjF2sSUkY1LPuYYRvqC0SfpC3G4Vy8LbLsJD5GwxGTleNjmCSZLiVSEzPiaSEoYMRqTJhJg4bCqkUHxhEFDpl7PO8iFDJ83y-P8q6MaELHuGxsgcZqvaJEAA */
  context: ({ input }) => ({
    track: input.track,
    channel: input.channel,
    volume: -32,
    pan: 0,
    fx: [],
    fxNames: [],
  }),
  id: "trackMachine",
  type: "parallel",
  on: {
    CHANGE_FX: {
      actions: {
        type: "setFx",
      },
    },
    CHANGE_PAN: {
      actions: {
        type: "setPan",
      },
    },
    CHANGE_VOLUME: {
      actions: {
        type: "setVolume",
      },
    },
  },
  states: {
    solo: {
      initial: "inactive",
      states: {
        inactive: {
          on: {
            TOGGLE_SOLO: {
              target: "active",
              actions: {
                type: "toggleSolo",
              },
            },
          },
        },
        active: {
          on: {
            TOGGLE_SOLO: {
              target: "inactive",
              actions: {
                type: "toggleSolo",
              },
            },
          },
        },
      },
    },
    mute: {
      initial: "inactive",
      states: {
        inactive: {
          on: {
            TOGGLE_MUTE: {
              target: "active",
              actions: {
                type: "toggleMute",
              },
            },
          },
        },
        active: {
          on: {
            TOGGLE_MUTE: {
              target: "inactive",
              actions: {
                type: "toggleMute",
              },
            },
          },
        },
      },
    },
  },
});

export const TrackContext = createActorContext(trackMachine);
