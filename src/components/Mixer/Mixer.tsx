import { Track } from "../Track";
import Main from "../Main";
import Transport from "@/components/Transport";
import { TrackContext } from "@/components/Track/trackMachine";
import { MixerContext } from "./mixerMachine";

export default function Mixer() {
  const refs = MixerContext.useSelector((s) => s.context.trackMachineRefs);

  const tracks = refs && refs.map((ref) => ref.options.input.track);
  const channels = refs && refs.map((ref) => ref.options.input.channel);

  // return null;
  const isLoaded = MixerContext.useSelector((state) => state.matches("ready"));
  if (!isLoaded) return null;

  return (
    <>
      <div className="channels">
        {tracks.map((track: SourceTrack, i: number) => (
          <TrackContext.Provider
            key={track.id}
            options={{
              input: {
                track,
                trackId: i,
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
