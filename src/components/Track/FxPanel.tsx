import { DelayContext } from "@/components/Fx/delayMachine";
import { PitchContext } from "@/components/Fx/pitchShiftMachine";
import { Rnd } from "react-rnd";
import PitchShifter from "../Fx/PitchShifter";
import Delay from "../Fx/Delay";
import { useState, useEffect } from "react";
import AutoFilter from "../Fx/AutoFilter";
import { AutoFilterContext } from "@/components/Fx/autoFilterMachine";
import { TrackContext } from "./trackMachine";

function FxPanel({ trackId }: { trackId: number }) {
  const { track, fx, fxNames } = TrackContext.useSelector(
    (state) => state.context
  );

  const [delayIndex, setDelayIndex] = useState(-1);
  const [autoFilterIndex, setAutoFilterIndex] = useState(-1);
  const [pitchIndex, setPitchIndex] = useState(-1);

  useEffect(() => {
    setDelayIndex(fxNames?.indexOf("delay"));
    setAutoFilterIndex(fxNames?.indexOf("autoFilter"));
    setPitchIndex(fxNames?.indexOf("pitchShift"));
  }, [fxNames]);

  return (
    <>
      {fxNames.map((name: string) => {
        switch (name) {
          case "delay":
            return (
              <Rnd
                key="delay"
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
                <DelayContext.Provider key="delay">
                  <Delay delay={delayIndex !== -1 && fx[delayIndex]} />
                </DelayContext.Provider>
              </Rnd>
            );
          case "autoFilter":
            return (
              <Rnd
                key="autoFilter"
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
                <AutoFilterContext.Provider key="autoFilter">
                  <AutoFilter
                    autoFilter={autoFilterIndex !== -1 && fx[autoFilterIndex]}
                  />
                </AutoFilterContext.Provider>
              </Rnd>
            );
          case "pitchShift":
            return (
              <Rnd
                key="pitchShift"
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
                <PitchContext.Provider key="pitchShift">
                  <PitchShifter
                    pitchShift={pitchIndex !== -1 && fx[pitchIndex]}
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
