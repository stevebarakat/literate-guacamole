import { TrackContext } from "@/machines/trackMachine";

type Props = {
  trackId: number;
  param: "volume" | "pan" | "soloMute";
};

function PlaybackMode({ trackId, param }: Props) {
  const { send } = TrackContext.useActorRef();
  const { currentTrack } = TrackContext.useSelector((state) => state.context);
  const playbackMode = currentTrack[`${param}Mode`];

  function setPlaybackMode(e: React.FormEvent<HTMLSelectElement>): void {
    send({
      type: "CHANGE_PLAYBACK_MODE",
      value: e.currentTarget.value,
      param,
    });
  }

  return (
    <div className="flex gap4 center">
      {/* {playbackMode} */}
      <select
        name="playbackMode"
        id={`${param}Mode-select-${trackId}`}
        onChange={setPlaybackMode}
        value={playbackMode}
      >
        <option value="off">off</option>
        <option value="read">read</option>
        <option value="write">write</option>
      </select>
    </div>
  );
}

export default PlaybackMode;
