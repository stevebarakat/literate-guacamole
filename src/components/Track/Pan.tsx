import { TrackContext } from "@/machines/trackMachine";

function Pan() {
  const { send } = TrackContext.useActorRef();
  const { pan } = TrackContext.useSelector((state) => state.context);

  return (
    <div className="pan">
      <input
        type="range"
        className="simple-range"
        min={-1}
        max={1}
        step={0.01}
        value={pan}
        onChange={(e) => {
          const value = parseFloat(e.target.value);
          send({ type: "CHANGE_PAN", pan: value });
        }}
        onDoubleClick={() => send({ type: "CHANGE_PAN", pan: 0 })}
      />
      <div>
        <span>L</span>
        <span>R</span>
      </div>
    </div>
  );
}

export default Pan;
