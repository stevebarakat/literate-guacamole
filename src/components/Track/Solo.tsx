import { ToggleContext } from "@/machines/toggleMachine";
import { Toggle } from "../Buttons";
import { TrackContext } from "../../machines/trackMachine";

function Solo() {
  const { id } = TrackContext.useSelector((state) => state.context.track);
  const channel = TrackContext.useSelector((state) => state.context.channel);

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
