import { TrackContext, trackMachine } from "@/machines/trackMachine";
import { Pan, Fader, SoloMute } from ".";
import Meter from "../Meter";
import ChannelLabel from "../ChannelLabel";
import { FxPanel } from "../FxPanel";
import { FxSelector } from "../Selectors";
import { ToggleContext } from "@/machines/toggleMachine";
import { useMachine } from "@xstate/react";

export default function Track({ trackId }: { trackId: number }) {
  const { track, fx, channel } = TrackContext.useSelector(
    (state) => state.context
  );

  fx && channel?.chain(...fx);

  const [state] = useMachine(trackMachine);
  // console.log("state.value", state.value);
  // console.log("state.context", state.context);
  return (
    <>
      <div className="channel-wrap">
        <ToggleContext.Provider>
          <FxPanel trackId={trackId} />
          <FxSelector trackId={trackId} />
        </ToggleContext.Provider>
        <div className="channel">
          <Pan />
          <Fader>
            <Meter channel={channel} />
          </Fader>
          <SoloMute />
          <ChannelLabel name={track.name} />
        </div>
      </div>
    </>
  );
}
