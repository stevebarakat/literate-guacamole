import { TrackContext } from "@/components/Track/trackMachine";
import { ToggleContext } from "@/machines/toggleMachine";
import Solo from "./Solo";
import Mute from "./Mute";

function SoloMute() {
  const { id } = TrackContext.useSelector((state) => state.context.track);
  const channel = TrackContext.useSelector((state) => state.context.channel);

  return (
    <div className="flex gap8">
      <ToggleContext.Provider>
        <Solo id={id} channel={channel} />
      </ToggleContext.Provider>
      <ToggleContext.Provider>
        <Mute id={id} channel={channel} />
      </ToggleContext.Provider>
    </div>
  );
}

export default SoloMute;
