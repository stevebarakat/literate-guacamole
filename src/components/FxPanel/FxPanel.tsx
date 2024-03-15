import { DelayContext } from "@/components/Fx/delayMachine";
import { PitchContext } from "@/components/Fx/pitchShiftMachine";
import { Rnd } from "react-rnd";
import PitchShifter from "../Fx/PitchShifter";
import Delay from "../Fx/Delay";
import { useState, useEffect } from "react";
import { FxHeader } from "../FxPanel";
import { TrackContext } from "@/machines/trackMachine";
import { ToggleContext } from "@/machines/toggleMachine";

const defaults = {
  className: "fx-panel",
  cancel: "input",
  minWidth: "150px",
  minHeight: "fit-content",
};

function FxPanel({ trackId }: { trackId: number }) {
  const isOpen = ToggleContext.useSelector((state) => state.matches("active"));
  const { track, fx, fxNames } = TrackContext.useSelector((s) => s.context);

  const [delayIndex, setDelayIndex] = useState(-1);
  const [pitchIndex, setPitchIndex] = useState(-1);

  useEffect(() => {
    setDelayIndex(fxNames?.indexOf("delay"));
    setPitchIndex(fxNames?.indexOf("pitchShift"));
  }, [fxNames]);

  if (!isOpen) return;

  return (
    <>
      {fxNames?.map((name: string) => {
        switch (name) {
          case "delay":
            return (
              <Rnd key="delay" {...defaults}>
                <FxHeader track={track} trackId={trackId} />
                <DelayContext.Provider key="delay">
                  <Delay delay={delayIndex !== -1 ? fx[delayIndex] : fx[-1]} />
                </DelayContext.Provider>
              </Rnd>
            );
          case "pitchShift":
            return (
              <Rnd key="pitchShift" {...defaults}>
                <FxHeader track={track} trackId={trackId} />
                <PitchContext.Provider key="pitchShift">
                  <PitchShifter
                    pitchShift={pitchIndex !== -1 ? fx[pitchIndex] : fx[-1]}
                  />
                </PitchContext.Provider>
              </Rnd>
            );
          default:
            break;
        }
      })}
    </>
  );
}

export default FxPanel;
