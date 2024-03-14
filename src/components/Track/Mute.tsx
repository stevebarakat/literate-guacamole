import { MixerContext } from "@/machines/toggleMachine";
import { Toggle } from "../Buttons";

function Mute() {
  const { id } = MixerContext.useSelector((state) => state.context.track);
  const channel = MixerContext.useSelector((state) => state.context.channel);

  const { send } = MixerContext.useActorRef();
  const isActive = MixerContext.useSelector((state) => state.context.active);

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
