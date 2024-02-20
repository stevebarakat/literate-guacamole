import { DelayContext } from "@/components/Fx/delayMachine";
import { PitchContext } from "@/components/Fx/pitchShiftMachine";
import { Rnd } from "react-rnd";
import PitchShifter from "../Fx/PitchShifter";
import Delay from "../Fx/Delay";
import { useState, useEffect } from "react";
import { TrackContext } from "../Track/trackMachine";
import { FxHeader } from "../FxPanel";

const defaults = {
  className: "fx-panel",
  cancel: "input",
  minWidth: "150px",
  minHeight: "fit-content",
};

function FxPanel({ trackId }: { trackId: number }) {
  const state = TrackContext.useSelector((s) => s);
  const { track, fx, fxNames } = state.context;

  const [delayIndex, setDelayIndex] = useState(-1);
  const [pitchIndex, setPitchIndex] = useState(-1);

  useEffect(() => {
    setDelayIndex(fxNames?.indexOf("delay"));
    setPitchIndex(fxNames?.indexOf("pitchShift"));
  }, [fxNames]);

  const isOpen = state.matches("ready.fxPanelOpen");
  if (!isOpen) return;

  return (
    <>
      {fxNames.map((name: string) => {
        switch (name) {
          case "delay":
            return (
              <Rnd key="delay" {...defaults}>
                <FxHeader track={track} trackId={trackId} />
                <DelayContext.Provider key="delay">
                  <Delay delay={delayIndex !== -1 && fx[delayIndex]} />
                </DelayContext.Provider>
              </Rnd>
            );
          case "pitchShift":
            return (
              <Rnd key="pitchShift" {...defaults}>
                <FxHeader track={track} trackId={trackId} />
                <PitchContext.Provider key="pitchShift">
                  <PitchShifter
                    pitchShift={pitchIndex !== -1 && fx[pitchIndex]}
                    trackId={trackId}
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
