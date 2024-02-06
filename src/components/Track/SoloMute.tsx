import { TrackContext } from "@/machines/trackMachine";
import { Toggle } from "../Buttons";

function SoloMute() {
  const { send } = TrackContext.useActorRef();
  const { id } = TrackContext.useSelector((state) => state.context.track);
  const { context } = TrackContext.useSelector((state) => state);

  return (
    <div className="flex gap8">
      <Toggle
        id={`trackSolo${id}`}
        checked={context.channel.solo}
        onChange={(e) =>
          send({
            type: "TRACK.TOGGLE_SOLO",
            checked: e.currentTarget.checked,
          })
        }
      >
        S
      </Toggle>
      <Toggle
        id={`trackMute${id}`}
        checked={context.channel.muted}
        onChange={(e) => {
          send({
            type: "TRACK.TOGGLE_MUTE",
            checked: e.currentTarget.checked,
          });
        }}
      >
        M
      </Toggle>
    </div>
  );
}

export default SoloMute;
