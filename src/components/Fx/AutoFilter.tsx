import { AutoFilterContext } from "@/machines/autoFilterMachine";
import { type AutoFilter as AF } from "tone";

type Props = {
  autoFilter: AF;
};

function AutoFilter({ autoFilter }: Props) {
  const { send } = AutoFilterContext.useActorRef();

  return (
    <div>
      <h3>AutoFilter</h3>
      <div className="flex-y">
        <label htmlFor="mix">Mix:</label>
        <input
          min={0}
          max={1}
          step={0.01}
          type="range"
          name="mix"
          id="mix"
          onChange={(e) =>
            send({
              type: "AUTOFILTER.CHANGE_MIX",
              mix: parseFloat(e.currentTarget.value),
              autoFilter,
            })
          }
        />
      </div>
    </div>
  );
}

export default AutoFilter;
