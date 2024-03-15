import Clock from "./Clock";
import Reset from "./Reset";
import Seek from "./Seek";
import Play from "./Play";
import { ClockContext } from "../../machines/clockMachine";
import { MixerContext } from "../../machines/mixerMachine";

const Transport = () => {
  const { sourceSong } = MixerContext.useSelector((state) => state.context);
  return (
    <div className="flex gap4">
      <ClockContext.Provider
        options={{
          input: {
            sourceSong,
          },
        }}
      >
        <div className="flex gap2">
          <Reset />
          <Seek direction="backward" amount={10} />
          <Play />
          <Seek direction="forward" amount={10} />
        </div>

        <Clock />
      </ClockContext.Provider>
    </div>
  );
};

export default Transport;
