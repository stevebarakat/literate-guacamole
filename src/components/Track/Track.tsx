import { TrackContext } from "@/components/Track/trackMachine";
import { Pan, Fader, SoloMute } from ".";
import Meter from "../Meter";
import ChannelLabel from "../ChannelLabel";
import { FxPanel } from "../FxPanel";
import { FxSelector } from "../Selectors";

export default function Track({ trackId }: { trackId: number }) {
  const { track, fx, channel } = TrackContext.useSelector(
    (state) => state.context
  );

  fx && channel.chain(...fx);

  return (
    <>
      <FxPanel trackId={trackId} />
      <div className="channel-wrap">
        <FxSelector trackId={trackId} />
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
