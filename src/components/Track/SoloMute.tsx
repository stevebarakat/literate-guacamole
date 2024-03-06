import { ToggleContext } from "@/machines/toggleMachine";
import Solo from "./Solo";
import Mute from "./Mute";

function SoloMute() {
  return (
    <div className="flex gap8">
      <ToggleContext.Provider>
        <Solo />
        <Mute />
      </ToggleContext.Provider>
    </div>
  );
}

export default SoloMute;
