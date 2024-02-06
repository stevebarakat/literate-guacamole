import { TrackContext } from "@/machines/trackMachine";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

function Fader({ children }: Props) {
  const { send } = TrackContext.useActorRef();
  const { volume } = TrackContext.useSelector((state) => state.context);

  return (
    <>
      {children}
      <div className="vol-wrap">
        <input
          type="range"
          min={-99.99}
          max={0}
          className="range-y volume"
          style={{ width: 200, top: 120 }}
          value={volume}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            send({ type: "TRACK.CHANGE_VOLUME", volume: value });
          }}
          onDoubleClick={() =>
            send({ type: "TRACK.CHANGE_VOLUME", volume: -32 })
          }
        />
      </div>
    </>
  );
}

export default Fader;
