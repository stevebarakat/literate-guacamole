import { Track } from "../Track";
import Main from "../Main";
import Transport from "@/components/Transport";
import { TrackContext } from "@/components/Track/trackMachine";
import Spinner from "../Loader";
import { MixerContext } from "./mixerMachine";

export default function Mixer() {
  const tracks = MixerContext.useSelector(
    (state) => state.context.sourceSong?.tracks
  );
  const { channels, meters } = MixerContext.useSelector(
    (state) => state.context
  );

  const state = MixerContext.useSelector((state) => state);
  const loaded = state.matches({ song: "loaded" });

  if (!tracks) return null;

  return loaded ? (
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
  ) : (
    <Spinner />
  );
}
