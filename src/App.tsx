import Mixer from "@/components/Mixer";
import { SongSelector } from "@/components/Selectors";
import { Meter, Player } from "tone";
import "@/styles/global.css";
import { MixerContext } from "./components/Mixer/mixerMachine";
import { Loader } from "./components/Loader";
import Error from "./components/Loader/Error";

const volume = -32;
const currentTime = "00:00:00";
const meter = undefined;
const meterLevel = undefined;
const sourceSong = undefined;
const channels = [undefined];
const meters = [undefined];
const players = [undefined];
const audioBuffers = [undefined];

export type InitialContext = {
  currentTime: string;
  volume: number;
  meter: Meter | undefined;
  meterLevel: number | undefined;
  sourceSong?: SourceSong | undefined;
  channels: (Channel | undefined)[];
  meters: (Meter | undefined)[];
  players: (Player | undefined)[];
  audioBuffers: (AudioBuffer | undefined)[];
};

const initialContext: InitialContext = {
  volume,
  meter,
  meterLevel,
  currentTime,
  sourceSong,
  meters,
  players,
  channels,
  audioBuffers,
};

function App() {
  return (
    <MixerContext.Provider
      options={{
        input: initialContext,
      }}
    >
      <Loader />
      <Mixer />
      <Error />
      <SongSelector />
    </MixerContext.Provider>
  );
}

export default App;
