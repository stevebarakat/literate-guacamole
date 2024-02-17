import { MixerContext } from "@/components/Mixer/mixerMachine";
import "./styles.css";

const Spinner = () => {
  const state = MixerContext.useSelector((state) => state);
  const isLoading = MixerContext.useSelector((state) =>
    state.matches("loading")
  );
  console.log("state.value", state.value);
  if (!isLoading) return null;

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

export default Spinner;
