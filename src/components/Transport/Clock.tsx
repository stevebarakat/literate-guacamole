import { MixerContext } from "@/machines";
import "./clock.css";

function Clock() {
  const { currentTime } = MixerContext.useSelector((state) => state.context);

  return (
    <div className="clock">
      <div className="ghost">88:88:88</div>
      {currentTime}
    </div>
  );
}

export default Clock;
