import { formatMilliseconds } from "@/utils";
import "./clock.css";
import { ClockContext } from "../../machines/clockMachine";

function Clock() {
  const { currentTime } = ClockContext.useSelector((state) => state.context);

  return (
    <div className="clock">
      <div className="ghost">88:88:88</div>
      {formatMilliseconds(currentTime)}
    </div>
  );
}

export default Clock;
