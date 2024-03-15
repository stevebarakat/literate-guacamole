import { PitchContext } from "@/components/Fx/pitchShiftMachine";
import { FeedbackDelay, PitchShift } from "tone";

type Props = {
  pitchShift: PitchShift | FeedbackDelay | undefined;
};

function PitchShifter({ pitchShift }: Props) {
  const { send } = PitchContext.useActorRef();

  return (
    <div>
      <h3>PitchShifter</h3>

      <div className="flex-y">
        <label htmlFor="mix">Mix:</label>
        <input
          min={0}
          max={1}
          step={0.01}
          type="range"
          name="mix"
          id="mix"
          onChange={(e) =>
            send({
              type: "CHANGE_MIX",
              mix: parseFloat(e.currentTarget.value),
              pitchShift,
            })
          }
        />
      </div>
      <div className="flex-y">
        <label htmlFor="pitch">Pitch:</label>
        <input
          min={-36}
          max={36}
          step={1}
          type="range"
          name="pitch"
          id="pitch"
          onChange={(e) =>
            send({
              type: "CHANGE_PITCH",
              pitch: parseFloat(e.currentTarget.value),
              pitchShift,
            })
          }
        />
      </div>
    </div>
  );
}

export default PitchShifter;
