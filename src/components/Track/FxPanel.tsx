import { DelayContext } from "@/machines/delayMachine";
import { PitchContext } from "@/machines/pitchShiftMachine";
import { Rnd } from "react-rnd";
import PitchShifter from "../Fx/PitchShifter";
import Delay from "../Fx/Delay";
import { useState, useEffect } from "react";
import { TrackContext } from "@/machines";
import AutoFilter from "../Fx/AutoFilter";
import { AutoFilterContext } from "@/machines/autoFilterMachine";

function FxPanel({ trackId }: { trackId: number }) {
  const { track, fx, fxNames } = TrackContext.useSelector(
    (state) => state.context
  );

  const [delayIndex, setDelayIndex] = useState(-1);
  const [autoFilterIndex, setAutoFilterIndex] = useState(-1);
  const [pitchIndex, setPitchIndex] = useState(-1);

  useEffect(() => {
    setDelayIndex(fxNames?.findIndex((value: string) => value === "delay"));
    setAutoFilterIndex(
      fxNames?.findIndex((value: string) => value === "autoFilter")
    );
    setPitchIndex(
      fxNames?.findIndex((value: string) => value === "pitchShift")
    );
  }, [fxNames]);

  const showDelay = fxNames.includes("delay");
  const showPitchShifter = fxNames.includes("pitchShift");
  const showAutoFilter = fxNames.includes("autoFilter");
  const showPanel = showDelay || showPitchShifter || showAutoFilter;

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
            {track.name}
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
              case "autoFilter":
                return (
                  <AutoFilterContext.Provider key="autoFilter">
                    <li>
                      <AutoFilter
                        autoFilter={
                          autoFilterIndex !== -1 && fx[autoFilterIndex]
                        }
                      />
                    </li>
                  </AutoFilterContext.Provider>
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
