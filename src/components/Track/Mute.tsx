import { ToggleContext } from "@/machines/toggleMachine";
import { Toggle } from "../Buttons";
import { TrackContext } from "./trackMachine";

function Mute() {
  const { id } = TrackContext.useSelector((state) => state.context.track);
  const channel = TrackContext.useSelector((state) => state.context.channel);

  const { send } = ToggleContext.useActorRef();
  const isActive = ToggleContext.useSelector((state) => state.context.active);

  return (
    <Toggle
      id={`trackMute${id}`}
      checked={isActive}
      onChange={(e) => {
        channel.mute = e.currentTarget.checked;
        send({
          type: "TOGGLE",
        });
      }}
    >
      M
    </Toggle>
  );
}

export default Mute;
