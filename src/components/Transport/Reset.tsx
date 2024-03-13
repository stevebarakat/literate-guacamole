import { MixerContext } from "@/machines/mixerMachine";
import { TransportButton } from "../Buttons";
import { Square as ResetIcon } from "lucide-react";

function Reset() {
  const { send } = MixerContext.useActorRef();

  const canReset = MixerContext.useSelector((state) =>
    state.can({ type: "RESET" })
  );

  return (
    <TransportButton
      disabled={!canReset}
      onClick={() => send({ type: "RESET" })}
    >
      <ResetIcon />
    </TransportButton>
  );
}

export default Reset;
