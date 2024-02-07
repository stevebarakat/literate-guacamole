import { TrackContext } from "@/machines";
import { array } from "@/utils";
import { upperFirst } from "lodash";
import { FeedbackDelay, PitchShift } from "tone";

function FxSelector({ trackId }: { trackId: number }) {
  const { send } = TrackContext.useActorRef();
  const {
    track: { name },
    fx,
    fxNames,
    channel,
  } = TrackContext.useSelector((state) => state.context);

  function handleSetFxNames(
    e: React.FormEvent<HTMLSelectElement>,
    action: string
  ) {
    const fxName = e.currentTarget.value;
    const id = e.currentTarget.id.at(-1);

    if (action === "add") {
      switch (fxName) {
        case "delay":
          return send({
            type: "TRACK.UPDATE_FX_NAMES",
            fxNames: [...fxNames, fxName],
            fx: [...fx, new FeedbackDelay().toDestination()],
          });
        case "pitchShift":
          return send({
            type: "TRACK.UPDATE_FX_NAMES",
            fxNames: [...fxNames, fxName],
            fx: [...fx, new PitchShift().toDestination()],
          });
        default:
          break;
      }
    } else if (id) {
      const fxId = parseInt(id, 10);
      const spliced = fxNames.toSpliced(fxId, 1);
      const fxSpliced = fx.toSpliced(fxId, 1);

      switch (fxName) {
        case "nofx":
          fx[fxId].dispose();
          return send({
            type: "TRACK.UPDATE_FX_NAMES",
            fxNames: spliced,
            fx: fxSpliced,
          });
        default:
          break;
      }
    }
  }

  return (
    <div>
      {" "}
      {array(fxNames.length + 1).map((_: void, fxId: number) => (
        <select
          key={fxId}
          id={`track${trackId}fx${fxId}`}
          className="fx-select"
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
    </div>
  );
}

export default FxSelector;
