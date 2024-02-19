import { MixerContext } from "@/components/Mixer/mixerMachine";
import { TransportButton } from "../Buttons";
import { Square as ResetIcon } from "lucide-react";

function Reset() {
  const { send } = MixerContext.useActorRef();

  const canReset = MixerContext.useSelector((state) =>
    state.can({ type: "SONG.RESET" })
  );

  return (
    <TransportButton
      disabled={!canReset}
      onClick={() => send({ type: "SONG.RESET" })}
    >
      <ResetIcon />
    </TransportButton>
  );
}

export default Reset;
