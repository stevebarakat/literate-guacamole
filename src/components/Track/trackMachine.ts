import { scale, logarithmically } from "@/utils";
import { createActorContext } from "@xstate/react";
import { interval, animationFrameScheduler } from "rxjs";
import { produce } from "immer";
import { FeedbackDelay, PitchShift } from "tone";
import { createMachine, assign, fromObservable, assertEvent } from "xstate";

export const trackMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QBcBOBDAxgawLJYAsBLAOzADpUx0IBPcgMwA8AFdMgGwHkAHMEgMQAVAEoBBAMIBpckK4BxeQBkAogH0AYgA01LMQDkVSgNoAGALqJQPAPawiyIjZJWQTRACYAHF-IeAnABsXoEArADMXv4eAIz+oQA0ILSIkQDsfjEepmnZHqFesfEAvsVJaFh4hKQUVDT0zGycEhx2kMLi0rIKyuraugZGZpZIILb2js6u7gjevgHBYZHRcYnJnv4ZsdkRHgAsoTHBMXul5Rg4+JjEZJTUdB2SMhIAEgby6gBqXEoAqrgqYaucYOJwuUYzEL+chhQKmA5wmJpTZrFIIOGBcimbGmfaFUKBfJeM4gCqXaq3OoPURPci-FgAETEQj6On0YgBAGUgaMQZNwaBIYFobD4QTTEiUUk0Wk0r4cfDwkE0nswiSyVVrjU7vVHl1Xu91Hp9DzrHZQVMIYgoTDxQiJci0qjrdD-G7lXtsTFTF5TOF1RdNTdavdaHqZHJFKo1JyflxTWNzfzptbhba4fbJU7pZ5AjFyO7-CFQns4ntcqcyqTA1dgzrqZ0Iz1o7hfiyE3ywSmEDbRZnHc6EHtwnssQqCV5wnK1SSSDYIHBXBrazVgUmu1aEFkc1uPGPsWklR40oFwgUzwHKivKaG1xMN4LEHCd0FMh536YgkFS6rL+StTe9SMKw7BgNwfACom96Wo+W4+ju4R+m+pjBLKERIl4oR-kG2pUg0IHNK0sCQHeFqQTMBTQt6-jhKsHhwriXgIUh2woV4aG0XKWGlMUQA */
    id: "trackMachine",
    context: ({ input }) => ({
      volume: -32,
      pan: 0,
      // track: input.track,
      // channel: input.channel,
      fx: [],
      fxNames: [],
    }),
    initial: "ready",
    states: {
      ready: {
        initial: "fxPanelOpen",
        states: {
          fxPanelOpen: {
            on: {
              "TRACK.TOGGLE_FX_PANEL": {
                target: "fxPanelClosed",
              },
            },
          },
          fxPanelClosed: {
            on: {
              "TRACK.TOGGLE_FX_PANEL": {
                target: "fxPanelOpen",
              },
            },
          },
        },
        on: {
          "TRACK.CHANGE_VOLUME": {
            actions: {
              type: "setVolume",
            },
          },
          "TRACK.UPDATE_FX_NAMES": {
            actions: ["setFxNames"],
          },
          "TRACK.CHANGE_PAN": {
            actions: {
              type: "setPan",
            },
          },
          "TRACK.TOGGLE_SOLO": {
            actions: {
              type: "toggleSolo",
            },
          },
          "TRACK.TOGGLE_MUTE": {
            actions: {
              type: "toggleMute",
            },
          },
        },
      },
    },
    types: {
      events: {} as
        | { type: "TRACK.CHANGE_VOLUME"; volume: number }
        | {
            type: "TRACK.UPDATE_FX_NAMES";
            fxName: string;
            fxId: number;
            action: string;
          }
        | { type: "TRACK.CHANGE_PAN"; pan: number }
        | { type: "TRACK.TOGGLE_FX_PANEL" }
        | { type: "TRACK.TOGGLE_SOLO"; checked: boolean }
        | { type: "TRACK.TOGGLE_MUTE"; checked: boolean },
      input: {} as {
        track: SourceTrack;
        channel: Channel | undefined;
      },
    },
  },
  {
    actions: {
      setVolume: assign(({ context, event }) => {
        assertEvent(event, "TRACK.CHANGE_VOLUME");
        const volume = parseFloat(event.volume.toFixed(2));
        const scaled = scale(logarithmically(volume));
        produce(context, (draft) => {
          draft.channel.volume.value = scaled;
        });
        return { volume };
      }),

      setPan: assign(({ context, event }) => {
        assertEvent(event, "TRACK.CHANGE_PAN");
        const pan = event.pan.toFixed(2);
        produce(context, (draft) => {
          draft.channel.pan.value = pan;
        });
        return { pan };
      }),
      setFxNames: assign(({ context, event }) => {
        assertEvent(event, "TRACK.UPDATE_FX_NAMES");

        if (event.action === "add") {
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
          context.fx[event.fxId].dispose();
          return {
            fxNames: context.fxNames.toSpliced(event.fxId, 1),
            fx: context.fx.toSpliced(event.fxId, 1),
          };
        }
      }),
      toggleMute: assign(({ context, event }) => {
        assertEvent(event, "TRACK.TOGGLE_MUTE");
        const checked = event.checked;
        produce(context, (draft) => {
          draft.channel.mute = checked;
        });
      }),
      toggleSolo: assign(({ context, event }) => {
        assertEvent(event, "TRACK.TOGGLE_SOLO");
        const checked = event.checked;
        produce(context, (draft) => {
          draft.channel.solo = checked;
        });
      }),
    },
    actors: {
      ticker: fromObservable(() => interval(0, animationFrameScheduler)),
    },
    guards: {},
    delays: {},
  }
);

export const TrackContext = createActorContext(trackMachine);
