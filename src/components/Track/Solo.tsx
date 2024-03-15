import { MixerContext } from "@/machines/mixerMachine";
import { Toggle } from "../Buttons";

function Solo({ trackId }: { trackId: number }) {
  const id = MixerContext.useSelector(
    (state) => state.context.sourceSong?.tracks[trackId].id
  );

  const { send } = MixerContext.useActorRef();
  const isActive = MixerContext.useSelector((state) => state.context.active);

  return (
    <Toggle
      id={`trackSolo${id}`}
      checked={isActive}
      onChange={() => {
        send({
          type: "TOGGLE",
          trackId,
        });
      }}
    >
      S
    </Toggle>
  );
}

export default Solo;
