import { ToggleContext } from "@/machines/toggleMachine";
import { Toggle } from "../Buttons";

type Props = {
  id: string;
  channel: Channel;
};

function Mute({ id, channel }: Props) {
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
