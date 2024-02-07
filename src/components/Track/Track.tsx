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
import { useEffect, useState } from "react";
import { FeedbackDelay, PitchShift } from "tone";
// import * as Popover from "@radix-ui/react-popover";

export default function Track({ trackId }: { trackId: number }) {
  // Get these separately to prevent ChannelLabel from re-rendering when meterLevel changes
  const { name } = TrackContext.useSelector((state) => state.context.track);
  const meterLevel = TrackContext.useSelector(
    (state) => state.context.meterLevel
  );
  const { fx, fxNames, channel } = TrackContext.useSelector(
    (state) => state.context
  );
  const { send } = TrackContext.useActorRef();

  fx && channel.chain(...fx);

  // console.log("fxNames", fxNames);

  const showDelay = fxNames.includes("delay");
  const showPitchShifter = fxNames.includes("pitchShift");
  const showPanel = showDelay || showPitchShifter;

  function handleSetFxNames(
    e: React.FormEvent<HTMLSelectElement>,
    action: string
  ) {
    const fxName = e.currentTarget.value;
    const id = e.currentTarget.id.at(-1);

    if (action === "remove") {
      if (!id) return;
      const fxId = parseInt(id, 10);

      const spliced = fxNames.toSpliced(fxId, 1);
      const fxSpliced = fx.toSpliced(fxId, 1);

      switch (fxName) {
        case "nofx":
          fx[fxId].dispose();
          return send({
            type: "TRACK.UPDATE_FX_NAMES",
            fxNames: [...spliced],
            fx: [...fxSpliced],
          });
        default:
          break;
      }
    } else {
      if (!id) return;
      const fxId = parseInt(id, 10);

      const spliced = fxNames.toSpliced(fxId, 1);
      const fxSpliced = fx.toSpliced(fxId, 1);

      switch (fxName) {
        case "delay":
          return send({
            type: "TRACK.UPDATE_FX_NAMES",
            fxNames: [...spliced, fxName],
            fx: [...fxSpliced, new FeedbackDelay().toDestination()],
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
    }
  }

  // console.log("fx", fx);
  const [delayIndex, setDelayIndex] = useState(-1);
  const [pitchIndex, setPitchIndex] = useState(-1);

  useEffect(() => {
    setDelayIndex(fxNames?.findIndex((value) => value === "delay"));
    setPitchIndex(fxNames?.findIndex((value) => value === "pitchShift"));
  }, [fxNames, trackId]);

  return (
    <>
      {showPanel && (
        <Rnd
          className="fx-panel"
          cancel="input"
          minWidth="fit-content"
          height="auto"
        >
          <ul>
            {showDelay && (
              <DelayContext.Provider>
                <li>
                  <Delay delay={delayIndex !== -1 && fx[delayIndex]} />
                </li>
              </DelayContext.Provider>
            )}

            {showPitchShifter && (
              <PitchContext.Provider>
                <li>
                  <PitchShifter
                    pitchShift={pitchIndex !== -1 && fx[pitchIndex]}
                  />
                </li>
              </PitchContext.Provider>
            )}
          </ul>
        </Rnd>
      )}
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
                : `- ${upperFirst(fxNames[fxId])}`}
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
