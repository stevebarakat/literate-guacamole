import { MixerContext } from "@/machines/mixerMachine";
import { Toggle } from "../Buttons";

function Mute({ trackId }: { trackId: number }) {
  const id = MixerContext.useSelector(
    (state) => state.context.sourceSong?.tracks[trackId].id
  );
  const channel = MixerContext.useSelector(
    (state) => state.context.channels[trackId]
  );

  const { send } = MixerContext.useActorRef();
  const isActive = MixerContext.useSelector((state) => state.matches("active"));

  return (
    <Toggle
      id={`trackMute${id}`}
      checked={isActive}
      onChange={(e) => {
        if (!channel) return;
        channel.mute = e.currentTarget.checked;
        send({
          type: "TOGGLE",
          trackId,
        });
      }}
    >
      M
    </Toggle>
  );
}

export default Mute;
