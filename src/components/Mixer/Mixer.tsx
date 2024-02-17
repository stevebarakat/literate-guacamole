import { Track } from "../Track";
import Main from "../Main";
import Transport from "@/components/Transport";
import { TrackContext } from "@/components/Track/trackMachine";
import { MixerContext } from "./mixerMachine";

export default function Mixer() {
  const tracks = MixerContext.useSelector(
    (state) => state.context.sourceSong?.tracks
  );
  const { channels, meters } = MixerContext.useSelector(
    (state) => state.context
  );

  if (!tracks) return null;

  return (
    <>
      <div className="channels">
        {tracks.map((track: SourceTrack, i: number) => {
          return (
            <TrackContext.Provider
              key={track.id}
              options={{
                input: {
                  track,
                  meter: meters[i],
                  channel: channels[i],
                },
              }}
            >
              <Track trackId={i} />
            </TrackContext.Provider>
          );
        })}
        <Main />
      </div>
      <Transport />
    </>
  );
}
