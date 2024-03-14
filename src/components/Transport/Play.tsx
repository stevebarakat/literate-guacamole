import { MixerContext } from "@/machines/mixerMachine";
import { TransportButton } from "../Buttons";
import { Play as PlayIcon, Pause as PauseIcon } from "lucide-react";
import { ClockContext } from "../../machines/clockMachine";

function Play() {
  const { send } = MixerContext.useActorRef();
  const { currentTime, sourceSong } = ClockContext.useSelector(
    (state) => state.context
  );
  const canPause = MixerContext.useSelector((state) =>
    state.matches({ ready: { transportMachine: "started" } })
  );

  if (sourceSong && currentTime > sourceSong.endPosition) {
    send({ type: "RESET" });
  }

  return (
    <TransportButton
      onClick={() =>
        canPause ? send({ type: "PAUSE" }) : send({ type: "START" })
      }
    >
      {canPause ? <PauseIcon /> : <PlayIcon />}
    </TransportButton>
  );
}

export default Play;
