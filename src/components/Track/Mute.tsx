import { Toggle } from "../Buttons";
import { TrackContext } from "@/machines/trackMachine";

function Mute() {
  const { channel, track } = TrackContext.useSelector((state) => state.context);

  const { send } = TrackContext.useActorRef();
  const isActive = TrackContext.useSelector((state) =>
    state.matches({ mute: "active" })
  );

  return (
    <Toggle
      id={`trackMute${track.id}`}
      checked={isActive}
      onChange={() => {
        if (!channel) return;
        send({
          type: "TOGGLE_MUTE",
          channel,
        });
      }}
    >
      M
    </Toggle>
  );
}

export default Mute;
