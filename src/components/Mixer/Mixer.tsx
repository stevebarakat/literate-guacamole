import { Track } from "../Track";
import Main from "../Main";
import Transport from "@/components/Transport";
import { TrackContext } from "@/components/Track/trackMachine";
import { MixerContext } from "./mixerMachine";

export default function Mixer() {
  const tracks = MixerContext.useSelector((s) => s.context.sourceSong?.tracks);
  const channels = MixerContext.useSelector((s) => s.context.channels);

  const isLoaded = MixerContext.useSelector((state) => state.matches("ready"));
  if (!isLoaded) return null;

  return (
    <>
      <div className="channels">
        {tracks?.map((track: SourceTrack, i: number) => (
          <TrackContext.Provider
            key={track.id}
            options={{
              input: {
                track,
                channel: channels[i],
              },
            }}
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
