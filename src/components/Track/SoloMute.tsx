import { TrackContext } from "@/components/Track/trackMachine";
import { createActor } from "xstate";
import { Toggle } from "../Buttons";
import { toggleMachine } from "@/machines/toggleMachine";
import { useMachine } from "@xstate/react";

function SoloMute() {
  // const { send } = TrackContext.useActorRef();
  const { id } = TrackContext.useSelector((state) => state.context.track);
  const channel = TrackContext.useSelector((state) => state.context.channel);
  const [state, send] = useMachine(toggleMachine);
  const toggleActor = createActor(toggleMachine);
  toggleActor.start();

  // console.log("toggleActor", toggleActor);

  // console.log("state.value", state.value);

  return (
    <div className="flex gap8">
      <Toggle
        id={`trackSolo${id}`}
        checked={state.context.active}
        onChange={(e) => {
          channel.solo = e.currentTarget.checked;
          send({
            type: "TOGGLE",
          });
        }}
      >
        S
      </Toggle>
      <Toggle
        id={`trackMute${id}`}
        className="mute"
        checked={state.context.active}
        onChange={(e) => {
          channel.mute = e.currentTarget.checked;
          send({
            type: "TOGGLE",
          });
        }}
      >
        M
      </Toggle>
    </div>
  );
}

export default SoloMute;
