import { MixerContext } from "@/machines/mixerMachine";

const Loader = () => {
  const state = MixerContext.useSelector((state) => state);
  const isBuilding = MixerContext.useSelector((state) =>
    state.matches("building")
  );
  if (!isBuilding) return null;

  const song = state.context.sourceSong;

  return (
    <div className="loader">
      <span>
        Loading: {song?.artist} - {song?.title}
      </span>
      <div className="spinner">
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
      </div>
    </div>
  );
};

export default Loader;
