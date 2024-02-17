type Props = {
  track: SourceTrack;
  trackId: number;
  onClick: () => void;
};

function FxHeader({ track, trackId, onClick }: Props) {
  return (
    <>
      <div className="fx-panel-inner">
        <div className="fx-panel-label">
          <div className="circle">{trackId + 1}</div>
          {track.name}
          <button onClick={onClick}>X</button>
        </div>
      </div>
      <hr />
    </>
  );
}

export default FxHeader;
