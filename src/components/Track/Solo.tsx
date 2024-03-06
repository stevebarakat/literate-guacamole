import { ToggleContext } from "@/machines/toggleMachine";
import { Toggle } from "../Buttons";

type Props = {
  id: string;
  channel: Channel;
};

function Solo({ id, channel }: Props) {
  const { send } = ToggleContext.useActorRef();
  const isActive = ToggleContext.useSelector((state) => state.context.active);

  return (
    <Toggle
      id={`trackSolo${id}`}
      checked={isActive}
      onChange={(e) => {
        channel.solo = e.currentTarget.checked;
        send({
          type: "TOGGLE",
        });
      }}
    >
      S
    </Toggle>
  );
}

export default Solo;
