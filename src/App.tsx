import Mixer from "@/components/Mixer";
import { SongSelector } from "@/components/Selectors";
import "@/styles/global.css";
import { MixerContext } from "./components/Mixer/mixerMachine";
import { Loader } from "./components/Loader";
import Error from "./components/Loader/Error";

function App() {
  return (
    <MixerContext.Provider>
      <Loader />
      <Mixer />
      <Error />
      <SongSelector />
    </MixerContext.Provider>
  );
}

export default App;
