import { Track } from "../Track";
import Main from "../Main";
import { MixerContext } from "../../machines/mixerMachine";
import { TrackContext } from "../../machines/trackMachine";
import Transport from "../Transport";

export default function Mixer() {
  const tracks = MixerContext.useSelector((s) => s.context.sourceSong?.tracks);
  const channels = MixerContext.useSelector((s) => s.context.channels);
  const parent = MixerContext.useSelector((s) => s.context.parent);
  // const state = MixerContext.useSelector((s) => s);
  // console.log("state", state.value);

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
