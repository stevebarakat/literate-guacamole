// import { MixerContext } from "@/machines/mixerMachine";
import { Pan, Fader, SoloMute } from ".";
import Meter from "../Meter";
import ChannelLabel from "../ChannelLabel";
import { FxPanel } from "../FxPanel";
import { FxSelector } from "../Selectors";
import { MixerContext } from "@/machines/toggleMachine";
import { useMachine } from "@xstate/react";
import { mixerMachine } from "@/machines/mixerMachine";
import { FeedbackDelay, PitchShift } from "tone";

export default function Track({ trackId }: { trackId: number }) {
  const [state] = useMachine(mixerMachine);
  const context = state.context;
  console.log("state", state.value);
  console.log("context", context);
  const fx: (PitchShift | FeedbackDelay)[] = [];
  const channel = context.channels[trackId];
  const track = context.sourceSong?.tracks[trackId];

  fx && channel?.chain(...fx);

  return (
    <>
      <div className="channel-wrap">
        {/* <MixerContext.Provider>
          <FxPanel trackId={trackId} />
          <FxSelector trackId={trackId} />
        </MixerContext.Provider> */}
        <div className="channel">
          <Pan />
          <Fader>
            <Meter channel={channel} />
          </Fader>
          {/* <SoloMute /> */}
          <ChannelLabel name={track?.name || `track ${trackId + 1}`} />
        </div>
      </div>
    </>
  );
}
