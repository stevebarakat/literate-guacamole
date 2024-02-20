import { MixerContext } from "@/components/Mixer/mixerMachine";

const Loader = () => {
  const state = MixerContext.useSelector((state) => state);
  const isBuilding = MixerContext.useSelector(
    (state) => state.matches("building") || state.matches("100%")
  );
  if (!isBuilding) return null;

  const song = state.context.sourceSong;

  return (
    <div className="loader">
      <span>
        Loading: {song?.artist} - {song?.title}
      </span>
      <progress id="progress" max={100} value={0} />
    </div>
  );
};

export default Loader;
