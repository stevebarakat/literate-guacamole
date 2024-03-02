import "./clock.css";
import { ClockContext } from "./clockMachine";

function Clock() {
  const { currentTime } = ClockContext.useSelector((state) => state.context);

  return (
    <div className="clock">
      <div className="ghost">88:88:88</div>
      {currentTime}
    </div>
  );
}

export default Clock;
