import { useEffect, useState } from "react";
import { FeedbackDelay, PitchShift } from "tone";
import { TrackContext } from "@/machines/trackMachine";
import { Pan, Fader, SoloMute } from ".";
import VuMeter from "../Meter";
import ChannelLable from "../ChannelLabel";
import { upperFirst } from "lodash";
import Delay from "../Fx/Delay";
import PitchShifter from "../Fx/PitchShifter";
import { Rnd } from "react-rnd";
import { DelayContext } from "@/machines/delayMachine";
import { PitchContext } from "@/machines/pitchShiftMachine";
import { array } from "@/utils";
import FxPanel from "./FxPanel";
// import * as Popover from "@radix-ui/react-popover";

export default function Track({ trackId }: { trackId: number }) {
  const { send } = TrackContext.useActorRef();

  // Get these separately to prevent others from re-rendering when meterLevel changes
  const meterLevel = TrackContext.useSelector(
    (state) => state.context.meterLevel
  );
  const {
    track: { name },
    fx,
    fxNames,
    channel,
  } = TrackContext.useSelector((state) => state.context);

  fx && channel.chain(...fx);

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
    <>
      <FxPanel trackId={trackId} />
      <div className="channel">
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

        <Pan />
        <Fader>
          <VuMeter meterLevel={meterLevel} />
        </Fader>
        <SoloMute />
        <ChannelLable name={name} />
      </div>
    </>
  );
}
