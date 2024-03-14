import { MixerContext } from "@/machines/toggleMachine";
import { Toggle } from "../Buttons";

function Solo() {
  const { id } = MixerContext.useSelector((state) => state.context.track);
  const channel = MixerContext.useSelector((state) => state.context.channel);

  const { send } = MixerContext.useActorRef();
  const isActive = MixerContext.useSelector((state) => state.context.active);

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
