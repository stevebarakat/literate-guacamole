import { DelayContext } from "@/components/Fx/delayMachine";
import { FeedbackDelay } from "tone";

type Props = {
  delay: FeedbackDelay;
};

function Delay({ delay }: Props) {
  const { send } = DelayContext.useActorRef();

  return (
    <div>
      <h3>Delay</h3>
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
              type: "DELAY.CHANGE_MIX",
              mix: parseFloat(e.currentTarget.value),
              delay,
            })
          }
        />
      </div>
      <div className="flex-y">
        <label htmlFor="delayTime">Delay Time:</label>
        <input
          min={0}
          max={1}
          step={0.01}
          type="range"
          name="delayTime"
          id="delayTime"
          onChange={(e) =>
            send({
              type: "DELAY.CHANGE_TIME",
              delayTime: parseFloat(e.currentTarget.value),
              delay,
            })
          }
        />
      </div>
      <div className="flex-y">
        <label htmlFor="feedback">Feedback:</label>
        <input
          min={0}
          max={1}
          step={0.01}
          type="range"
          name="feedback"
          id="feedback"
          onChange={(e) =>
            send({
              type: "DELAY.CHANGE_FEEDBACK",
              feedback: parseFloat(e.currentTarget.value),
              delay,
            })
          }
        />
      </div>
    </div>
  );
}

export default Delay;
