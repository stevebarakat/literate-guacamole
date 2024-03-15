import { Track } from "../Track";
import Main from "../Main";
import Transport from "@/components/Transport";
import { MixerContext } from "../../machines/mixerMachine";
import { TrackContext } from "@/machines/trackMachine";

export default function Mixer() {
  const tracks = MixerContext.useSelector((s) => s.context.sourceSong?.tracks);
  const channels = MixerContext.useSelector((s) => s.context.channels);

  const isLoaded = MixerContext.useSelector((state) => state.matches("ready"));

  // const state = MixerContext.useSelector((state) => state);
  // console.log("state.context", state.context);

  if (!isLoaded) return null;

  return (
    <>
      <div className="channels">
        {tracks?.map((track: SourceTrack, i: number) => (
          <TrackContext.Provider
            key={track.id}
            options={{ input: { track, channel: channels[i] } }}
          >
            <Track trackId={i} />
          </TrackContext.Provider>
        ))}
        <Main />
      </div>
      <Transport />
    </>
  );
}
