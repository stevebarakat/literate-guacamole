import { MixerContext } from "@/components/Mixer/mixerMachine";

const Loader = () => {
  const state = MixerContext.useSelector((state) => state);
  const isLoading = MixerContext.useSelector((state) =>
    state.matches("loading")
  );
  if (!isLoading) return null;

  const song = state.context.sourceSong;

  return (
    <div className="loader">
      <span>
        Loading: {song?.artist} - {song?.title}
      </span>
      <progress id="progress" max={100} value={0} />
      <output id="output"></output>
    </div>
  );
};

export default Loader;
