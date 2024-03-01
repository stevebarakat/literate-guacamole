import { Track } from "../Track";
import Main from "../Main";
import Transport from "@/components/Transport";
import { TrackContext } from "@/components/Track/trackMachine";
import { MixerContext } from "./mixerMachine";

export default function Mixer() {
  // const tracks = MixerContext.useSelector(
  //   (state) => state.context.sourceSong?.tracks
  // );
  // const { channels } = MixerContext.useSelector((state) => state.context);

  const state = MixerContext.useSelector((s) => s);

  console.log("state.context.trackMachineRefs", state.context.trackMachineRefs);

  return null;

  const isLoaded = MixerContext.useSelector((state) => state.matches("ready"));
  if (!isLoaded) return null;

  return (
    <>
      <div className="channels">
        return (
        {tracks.map((track: SourceTrack, i: number) => {
          return (
            <TrackContext.Provider
              key={track.id}
              options={{
                input: {
                  track: data[i].track,
                  channel: data[i].channel,
                },
              }}
            >
              <Track trackId={i} />
            </TrackContext.Provider>
          );
        })}
        );
        <Main />
      </div>
      <Transport />
    </>
  );
}
