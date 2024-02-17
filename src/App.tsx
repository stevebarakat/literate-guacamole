import Mixer from "@/components/Mixer";
import { SongSelector } from "@/components/SongSelector";
import { Meter } from "tone";
import "@/styles/global.css";
import { MixerContext } from "./components/Mixer/mixerMachine";
import Spinner from "./components/Loader";

const volume = -32;
const currentTime = "00:00:00";
const meter = undefined;
const meterLevel = undefined;
const sourceSong = undefined;
const channels = [undefined];
const meters = [undefined];

export type InitialContext = {
  currentTime: string;
  volume: number;
  meter: Meter | undefined;
  meterLevel: number | undefined;
  sourceSong?: SourceSong | undefined;
  channels: (Channel | undefined)[];
  meters: (Meter | undefined)[];
};

const initialContext: InitialContext = {
  volume,
  meter,
  meterLevel,
  currentTime,
  sourceSong,
  meters,
  channels,
};

function App() {
  return (
    <MixerContext.Provider
      options={{
        input: initialContext,
      }}
    >
      <Spinner />
      <Mixer />
      <SongSelector />
    </MixerContext.Provider>
  );
}

export default App;
