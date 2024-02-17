import { TrackContext } from "@/components/Track/trackMachine";
import { Pan, Fader, SoloMute } from ".";
import VuMeter from "../Meter";
import ChannelLabel from "../ChannelLabel";
import { FxPanel } from "../FxPanel";
import FxSelector from "../FxSelector";

export default function Track({ trackId }: { trackId: number }) {
  // Get these separately to prevent others from re-rendering when meterLevel changes
  const meterLevel = TrackContext.useSelector(
    (state) => state.context.meterLevel
  );
  const {
    track: { name },
    fx,
    channel,
  } = TrackContext.useSelector((state) => state.context);

  fx && channel.chain(...fx);

  return (
    <>
      <FxPanel trackId={trackId} />
      <div className="channel-wrap">
        <FxSelector trackId={trackId} />
        <div className="channel">
          <Pan />
          <Fader>
            <VuMeter meterLevel={meterLevel} />
          </Fader>
          <SoloMute />
          <ChannelLabel name={name} />
        </div>
      </div>
    </>
  );
}
