import { array } from "@/utils";
import { upperFirst } from "lodash";
import { TrackContext } from "../Track/trackMachine";

function FxSelector({ trackId }: { trackId: number }) {
  const { send } = TrackContext.useActorRef();
  const { fxNames } = TrackContext.useSelector((state) => state.context);

  function handleSetFxNames(
    e: React.FormEvent<HTMLSelectElement>,
    action: string
  ) {
    const fxName = e.currentTarget.value;
    const fxId = Number(e.currentTarget.id.at(-1));

    send({ type: "TRACK.UPDATE_FX_NAMES", fxId, fxName, action });
  }

  const state = TrackContext.useSelector((s) => s);
  const isOpen = state.matches("ready.fxPanelOpen");

  return (
    <>
      {fxNames.length > 0 && (
        <button
          className="toggle-fx-btn"
          onClick={() => send({ type: "TRACK.TOGGLE_FX_PANEL" })}
        >
          {isOpen ? "Close Fx" : "Open Fx"}
        </button>
      )}

      {array(fxNames.length + 1).map((_: void, fxId: number) => (
        <select
          key={fxId}
          id={`track${trackId}fx${fxId}`}
          name="fx-select"
          onChange={(e) =>
            e.target.value !== "nofx"
              ? handleSetFxNames(e, "add")
              : handleSetFxNames(e, "remove")
          }
          value={fxNames[fxId]}
        >
          <option value={"nofx"}>
            {fxNames[fxId] === undefined
              ? "Add Fx"
              : `❌ ${upperFirst(fxNames[fxId])}`}
          </option>
          <option value={"delay"} disabled={fxNames.includes("delay")}>
            Delay
          </option>
          <option
            value={"pitchShift"}
            disabled={fxNames.includes("pitchShift")}
          >
            Pitch Shift
          </option>
        </select>
      ))}
    </>
  );
}

export default FxSelector;
