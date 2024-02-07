import Clock from "./Clock";
import Reset from "./Reset";
import Seek from "./Seek";
import Play from "./Play";

const Transport = () => (
  <div className="flex gap4">
    <div className="flex gap2">
      <Reset />
      <Seek direction="backward" amount={10} />
      <Play />
      <Seek direction="forward" amount={10} />
    </div>
    <Clock />
  </div>
);

export default Transport;
