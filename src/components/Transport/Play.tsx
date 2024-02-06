import { MixerContext } from "@/machines";
import { TransportButton } from "../Buttons";
import { Play as PlayIcon, Pause as PauseIcon } from "lucide-react";

function Play() {
  const { send } = MixerContext.useActorRef();
  const canPause = MixerContext.useSelector((state) =>
    state.matches({ song: { loaded: "started" } })
  );

  return (
    <TransportButton
      onClick={() =>
        canPause ? send({ type: "SONG.PAUSE" }) : send({ type: "SONG.START" })
      }
    >
      {canPause ? <PauseIcon /> : <PlayIcon />}
    </TransportButton>
  );
}

export default Play;
