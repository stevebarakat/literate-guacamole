import { Toggle } from "../Buttons";
import { TrackContext } from "@/machines/trackMachine";

function Solo() {
  const { channel, track } = TrackContext.useSelector((state) => state.context);

  const { send } = TrackContext.useActorRef();
  const isActive = TrackContext.useSelector((state) =>
    state.matches({ solo: "active" })
  );

  return (
    <Toggle
      id={`trackSolo${track.id}`}
      checked={isActive}
      onChange={() => {
        if (!channel) return;
        send({
          type: "TOGGLE_SOLO",
          channel,
        });
      }}
    >
      S
    </Toggle>
  );
}

export default Solo;
