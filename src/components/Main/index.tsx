import Fader from "./Fader";
import VuMeter from "../Meter";
import { MixerContext } from "@/machines";
import ChannelLable from "../ChannelLabel";

export default function Main() {
  const { meterLevel } = MixerContext.useSelector((state) => state.context);

  return (
    <div className="channel main">
      <Fader>
        <VuMeter meterLevel={meterLevel} options={{ height: 223 }} />
      </Fader>
      <ChannelLable name="Main" />
    </div>
  );
}
