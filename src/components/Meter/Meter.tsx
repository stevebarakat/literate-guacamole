import { useRef } from "react";
import useMeter from "./useMeter";

function VuMeter({ channel, options }: MeterProps) {
  const canvas = useRef<HTMLCanvasElement | null>(null);

  const width = options?.width ?? 12;
  const height = (options?.height || 200) - 4;
  const meterVals = useMeter({ channel, canvas, options });

  return (
    <canvas
      className="meter-wrap"
      ref={canvas}
      width={width}
      height={height}
      data-meterlevel={meterVals}
    />
  );
}

export default VuMeter;
