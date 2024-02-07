import { MixerContext } from "@/components/Mixer/mixerMachine";
import "./styles.css";

const Spinner = () => {
  const state = MixerContext.useSelector((state) => state);
  const isLoading = !state.matches("ready");
  const song = state.context.sourceSong;

  if (!isLoading) return null;
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

export default Spinner;
