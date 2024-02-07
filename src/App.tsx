import Mixer from "@/components/Mixer";
import { SongSelector } from "@/components/SongSelector";
import { MixerContext } from "@/machines";
import { Meter } from "tone";
import "@/styles/global.css";

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
      <SongSelector />
      <Mixer />
    </MixerContext.Provider>
  );
}

export default App;