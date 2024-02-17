import { TrackContext } from "./trackMachine";
import { X } from "lucide-react";

type Props = {
  track: SourceTrack;
  trackId: number;
};

function FxHeader({ track, trackId }: Props) {
  const { send } = TrackContext.useActorRef();

  function togglePanel() {
    send({ type: "TRACK.TOGGLE_FX_PANEL" });
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
