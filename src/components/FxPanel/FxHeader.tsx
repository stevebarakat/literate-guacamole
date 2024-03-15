import { ToggleContext } from "@/machines/toggleMachine";
import { X } from "lucide-react";

type Props = {
  track: SourceTrack;
  trackId: number;
};

function FxHeader({ track, trackId }: Props) {
  const { send } = ToggleContext.useActorRef();

  function togglePanel() {
    send({ type: "TOGGLE" });
  }

  return (
    <>
      <div className="fx-panel-inner">
        <div className="fx-panel-label">
          <div className="circle">{trackId + 1}</div>
          {track.name}
          <button className="close-panel-btn" onClick={togglePanel}>
            <X />
          </button>
        </div>
      </div>
      <hr />
    </>
  );
}

export default FxHeader;
