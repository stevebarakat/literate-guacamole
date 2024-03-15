import Mixer from "@/components/Mixer";
import { SongSelector } from "@/components/Selectors";
import "@/styles/global.css";
import { MixerContext } from "./machines/mixerMachine";
import { Loader } from "./components/Loader";
import Error from "./components/Loader/Error";

function App() {
  return (
    <MixerContext.Provider
    // options={{
    //   inspect: (ev) => {
    //     console.log("snapshot", ev.snapshot?.value);
    //   },
    // }}
    >
      <Loader />
      <Mixer />
      <Error />
      <SongSelector />
    </MixerContext.Provider>
  );
}

export default App;
