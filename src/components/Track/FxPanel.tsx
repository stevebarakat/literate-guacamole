import { DelayContext } from "@/machines/delayMachine";
import { PitchContext } from "@/machines/pitchShiftMachine";
import { Rnd } from "react-rnd";
import PitchShifter from "../Fx/PitchShifter";
import Delay from "../Fx/Delay";
import { useState, useEffect } from "react";
import { TrackContext } from "@/machines";

function FxPanel({ trackId }: { trackId: number }) {
  const {
    track: { name },
    fx,
    fxNames,
  } = TrackContext.useSelector((state) => state.context);

  const [delayIndex, setDelayIndex] = useState(-1);
  const [pitchIndex, setPitchIndex] = useState(-1);
  useEffect(() => {
    setDelayIndex(fxNames?.findIndex((value: string) => value === "delay"));
    setPitchIndex(
      fxNames?.findIndex((value: string) => value === "pitchShift")
    );
  }, [fxNames]);

  const showDelay = fxNames.includes("delay");
  const showPitchShifter = fxNames.includes("pitchShift");
  const showPanel = showDelay || showPitchShifter;

  return (
    showPanel && (
      <Rnd
        className="fx-panel"
        cancel="input"
        minWidth="fit-content"
        height="auto"
      >
        <div className="fx-panel-inner">
          <div className="fx-panel-label">
            {name}
            <div className="circle">{trackId + 1}</div>
          </div>
        </div>
        <hr />
        <ul>
          {fxNames.map((name: string) => {
            switch (name) {
              case "delay":
                return (
                  <DelayContext.Provider key="delay">
                    <li>
                      <Delay delay={delayIndex !== -1 && fx[delayIndex]} />
                    </li>
                  </DelayContext.Provider>
                );
              case "pitchShift":
                return (
                  <PitchContext.Provider key="pitchShift">
                    <li>
                      <PitchShifter
                        pitchShift={pitchIndex !== -1 && fx[pitchIndex]}
                      />
                    </li>
                  </PitchContext.Provider>
                );
              default:
                break;
            }
          })}
        </ul>
      </Rnd>
    )
  );
}

export default FxPanel;
