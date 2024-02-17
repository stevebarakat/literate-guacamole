import { DelayContext } from "@/components/Fx/delayMachine";
import { PitchContext } from "@/components/Fx/pitchShiftMachine";
import { Rnd } from "react-rnd";
import PitchShifter from "../Fx/PitchShifter";
import Delay from "../Fx/Delay";
import { useState, useEffect } from "react";
import { TrackContext } from "./trackMachine";

const defaults = {
  className: "fx-panel",
  cancel: "input",
  minWidth: "150px",
  minHeight: "fit-content",
};

function FxPanel({ trackId }: { trackId: number }) {
  const { track, fx, fxNames } = TrackContext.useSelector(
    (state) => state.context
  );
  const { send } = TrackContext.useActorRef();

  const [delayIndex, setDelayIndex] = useState(-1);
  const [pitchIndex, setPitchIndex] = useState(-1);

  useEffect(() => {
    setDelayIndex(fxNames?.indexOf("delay"));
    setPitchIndex(fxNames?.indexOf("pitchShift"));
  }, [fxNames]);

  function togglePanel() {
    send({ type: "TRACK.TOGGLE_FX_PANEL" });
  }

  const state = TrackContext.useSelector((s) => s);
  const isOpen = state.matches({ ready: "fxPanelOpen" });
  if (!isOpen) return;

  return (
    <>
      {fxNames.map((name: string) => {
        switch (name) {
          case "delay":
            return (
              <Rnd key="delay" {...defaults}>
                <div className="fx-panel-inner">
                  <div className="fx-panel-label">
                    {track.name}
                    <button
                      onClick={togglePanel}
                      id={trackId.toString()}
                      className="circle"
                    >
                      {trackId + 1}
                    </button>
                  </div>
                </div>
                <hr />
                <DelayContext.Provider key="delay">
                  <Delay delay={delayIndex !== -1 && fx[delayIndex]} />
                </DelayContext.Provider>
              </Rnd>
            );
          case "pitchShift":
            return (
              <Rnd key="pitchShift" {...defaults}>
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
