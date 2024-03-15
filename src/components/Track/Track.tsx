import { MixerContext } from "@/machines/mixerMachine";
import { Pan, Fader, SoloMute } from ".";
import Meter from "../Meter";
import ChannelLabel from "../ChannelLabel";
import { FxPanel } from "../FxPanel";
import { FxSelector } from "../Selectors";
import { ToggleContext } from "@/machines/toggleMachine";
import { TrackContext } from "@/machines/trackMachine";

export default function Track({ trackId }: { trackId: number }) {
  // const context = MixerContext.useSelector(
  //   (state) => state.context.trackMachineRefs[trackId].getSnapshot().context
  // );

  const { context } = TrackContext.useSelector((s) => s);
  console.log("context", context);

  const { channel, track, fx } = context;

  console.log("fx", fx);

  fx && channel?.chain(...fx);

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
          <SoloMute trackId={trackId} />
          <ChannelLabel name={track?.name || `track ${trackId + 1}`} />
        </div>
      </div>
    </>
  );
}
