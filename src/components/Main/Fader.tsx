import { MixerContext } from "@/machines/mixerMachine";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

function Fader({ children }: Props) {
  const meter = children;
  const { send } = MixerContext.useActorRef();
  const { volume } = MixerContext.useSelector((state) => state.context);

  return (
    <>
      <div className="window">{(volume + 100).toFixed(0)}</div>
      {meter}
      <div className="vol-wrap">
        <input
          type="range"
          id="mainVol"
          className="range-y volume"
          style={{ width: 220, top: 110 }}
          min={-100}
          max={0}
          step={0.1}
          value={volume}
          onChange={(e) => {
            const value = parseFloat(e.currentTarget.value);
            send({
              type: "CHANGE_VOLUME",
              volume: value,
            });
          }}
          onDoubleClick={() => send({ type: "CHANGE_VOLUME", volume: -32 })}
        />
      </div>
    </>
  );
}

export default Fader;
