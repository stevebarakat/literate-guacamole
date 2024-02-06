import { MixerContext } from "@/machines";
import { TransportButton } from "../Buttons";
import { FastForward as FastFwdIcon, Rewind as RewindIcon } from "lucide-react";

type Props = {
  direction: string;
  amount: number;
};
export default function Seek({ direction, amount }: Props) {
  const { send } = MixerContext.useActorRef();
  const canSkip = MixerContext.useSelector((state) =>
    state.can({ type: "SONG.SEEK", direction, amount })
  );

  return (
    <TransportButton
      disabled={!canSkip}
      onClick={() => {
        send({ type: "SONG.SEEK", direction, amount });
      }}
    >
      {direction === "forward" ? <FastFwdIcon /> : <RewindIcon />}
    </TransportButton>
  );
}
