import { Track } from "../Track";
import Main from "../Main";
import Transport from "@/components/Transport";
import { MixerContext } from "../../machines/mixerMachine";

export default function Mixer() {
  const tracks = MixerContext.useSelector((s) => s.context.sourceSong?.tracks);

  const isLoaded = MixerContext.useSelector((state) => state.matches("ready"));
  if (!isLoaded) return null;

  return (
    <>
      <div className="channels">
        {tracks?.map((track: SourceTrack, i: number) => (
          <Track key={track.id} trackId={i} />
        ))}
        <Main />
      </div>
      <Transport />
    </>
  );
}
