import Fader from "./Fader";
import VuMeter from "../Meter";
import ChannelLable from "../ChannelLabel";
import { Destination } from "tone";

export default function Main() {
  return (
    <div className="channel-wrap">
      <div className="channel main">
        <Fader>
          <VuMeter channel={Destination} options={{ height: 223 }} />
        </Fader>
        <ChannelLable name="Main" />
      </div>
    </div>
  );
}
