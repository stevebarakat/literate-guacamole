import { array } from "@/utils";
import { upperFirst } from "lodash";
import { FeedbackDelay, PitchShift, AutoFilter } from "tone";
import { TrackContext } from "./Track/trackMachine";

function FxSelector({ trackId }: { trackId: number }) {
  const { send } = TrackContext.useActorRef();
  const { fx, fxNames } = TrackContext.useSelector((state) => state.context);

  function handleSetFxNames(
    e: React.FormEvent<HTMLSelectElement>,
    action: string
  ) {
    const fxName = e.currentTarget.value;
    const fxId = Number(e.currentTarget.id.at(-1));

    if (action === "add") {
      const spliced = fxNames.toSpliced(fxId, 1);
      const fxSpliced = fx.toSpliced(fxId, 1);
      fx[fxId]?.disconnect();

      switch (fxName) {
        case "delay":
          return send({
            type: "TRACK.UPDATE_FX_NAMES",
            fxNames: [...spliced, fxName],
            fx: [...fxSpliced, new FeedbackDelay().toDestination()],
          });
        case "autoFilter":
          return send({
            type: "TRACK.UPDATE_FX_NAMES",
            fxNames: [...spliced, fxName],
            fx: [...fxSpliced, new AutoFilter().start().toDestination()],
          });

        case "pitchShift":
          return send({
            type: "TRACK.UPDATE_FX_NAMES",
            fxNames: [...spliced, fxName],
            fx: [...fxSpliced, new PitchShift().toDestination()],
          });
        default:
          break;
      }
    } else {
      fx[fxId].dispose();
      return send({
        type: "TRACK.UPDATE_FX_NAMES",
        fxNames: fxNames.toSpliced(fxId, 1),
        fx: fx.toSpliced(fxId, 1),
      });
    }
  }

  return array(fxNames.length + 1).map((_: void, fxId: number) => (
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
      <option value={"autoFilter"} disabled={fxNames.includes("autoFilter")}>
        Auto Filter
      </option>
      <option value={"pitchShift"} disabled={fxNames.includes("pitchShift")}>
        Pitch Shift
      </option>
    </select>
  ));
}

export default FxSelector;
