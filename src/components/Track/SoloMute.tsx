import { MixerContext } from "@/machines/mixerMachine";
import Solo from "./Solo";
import Mute from "./Mute";

function SoloMute({ trackId }: { trackId: number }) {
  return (
    <div className="flex gap8">
      <MixerContext.Provider>
        <Solo trackId={trackId} />
        <Mute trackId={trackId} />
      </MixerContext.Provider>
    </div>
  );
}

export default SoloMute;
