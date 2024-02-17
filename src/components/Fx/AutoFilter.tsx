import { AutoFilterContext } from "@/components/Fx/autoFilterMachine";
import { AutoFilter as af } from "tone";

type Props = {
  autoFilter: af;
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
      <div className="flex-y">
        <label htmlFor="baseFrequency">Base Frequency:</label>
        <input
          min={0}
          max={100}
          step={0.1}
          type="range"
          name="baseFrequency"
          id="baseFrequency"
          onChange={(e) =>
            send({
              type: "AUTOFILTER.CHANGE_BASE_FREQUENCY",
              baseFrequency: parseFloat(e.currentTarget.value),
              autoFilter,
            })
          }
        />
      </div>
      <div className="flex-y">
        <label htmlFor="frequency">Frequency:</label>
        <input
          min={0}
          max={100}
          step={0.1}
          type="range"
          name="frequency"
          id="frequency"
          onChange={(e) =>
            send({
              type: "AUTOFILTER.CHANGE_FREQUENCY",
              frequency: parseFloat(e.currentTarget.value),
              autoFilter,
            })
          }
        />
      </div>
      <div className="flex-y">
        <label htmlFor="depth">Depth:</label>
        <input
          min={0}
          max={1}
          step={0.01}
          type="range"
          name="depth"
          id="depth"
          onChange={(e) =>
            send({
              type: "AUTOFILTER.CHANGE_DEPTH",
              depth: parseFloat(e.currentTarget.value),
              autoFilter,
            })
          }
        />
      </div>
      <div className="flex-y">
        <label htmlFor="octaves">Octaves:</label>
        <input
          min={0}
          max={10}
          step={0.01}
          type="range"
          name="octaves"
          id="octaves"
          onChange={(e) =>
            send({
              type: "AUTOFILTER.CHANGE_OCTAVES",
              octaves: parseFloat(e.currentTarget.value),
              autoFilter,
            })
          }
        />
      </div>
      <div className="flex-y">
        <label htmlFor="type">Type:</label>
        <ul>
          <li>
            <input
              type="number"
              name="sawtooth"
              id="sawtooth"
              min={1}
              max={32}
              onChange={(e) =>
                send({
                  type: "AUTOFILTER.CHANGE_TYPE",
                  filterType: `sawtooth${e.currentTarget.value}`,
                  autoFilter,
                })
              }
            />
          </li>
          <li>
            <input
              type="number"
              name="sine"
              id="sine"
              min={1}
              max={32}
              onChange={(e) =>
                send({
                  type: "AUTOFILTER.CHANGE_TYPE",
                  filterType: `sine${e.currentTarget.value}`,
                  autoFilter,
                })
              }
            />
          </li>
          <li>
            <input
              type="number"
              name="triangle"
              id="triangle"
              min={1}
              max={32}
              onChange={(e) =>
                send({
                  type: "AUTOFILTER.CHANGE_TYPE",
                  filterType: `triangle${e.currentTarget.value}`,
                  autoFilter,
                })
              }
            />
          </li>
          <li>
            <input
              type="number"
              name="square"
              id="square"
              min={1}
              max={32}
              onChange={(e) =>
                send({
                  type: "AUTOFILTER.CHANGE_TYPE",
                  filterType: `square${e.currentTarget.value}`,
                  autoFilter,
                })
              }
            />
          </li>
        </ul>
      </div>
    </div>
  );
}

export default AutoFilter;
