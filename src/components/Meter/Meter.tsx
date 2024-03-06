import { useRef, useEffect, useCallback, useState } from "react";
import { Meter } from "tone";
const MAX_BOX_COUNT = 100;

// Colors
const hiOn = "hsla(250, 80%, 70%, 0.9)";
const hiOff = "hsla(250, 80%, 70%, 0.5)";
const midOn = "hsla(285, 90%, 70%, 0.9)";
const midOff = "hsla(285, 90%, 70%, 0.5)";
const lowOn = "hsla(330, 100%, 70%, 0.9)";
const lowOff = "hsla(330, 100%, 70%, 0.5)";

type Options = {
  width?: number;
  height?: number;
  gap?: number;
  highCount?: number;
  midCount?: number;
  total?: number;
};

type MeterProps = {
  channel: Channel | Destination;
  options?: Options;
};

function VuMeter({ channel, options }: MeterProps) {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const painter = useRef<number | null>(null);
  const meter = useRef<Meter | undefined>();

  const width = options?.width ?? 12;
  const height = (options?.height || 200) - 4;

  useEffect(() => {
    meter.current = new Meter();
    channel?.connect(meter.current);
  }, [channel]);

  useEffect(() => {
    const paint = canvas.current?.getContext("2d");
    if (paint == null) throw new Error("Could not get canvas context");

    const boxGap = (options?.gap && options.gap * 0.1) ?? 0.1;
    const boxCount = options?.total ?? 50;
    const boxCountMid = options?.midCount ?? 20;
    const boxCountHi = options?.highCount ?? 10;

    // Gap between boxes and box height
    const boxHeight = height / (boxCount + (boxCount + 1) * boxGap);
    const boxGapY = boxHeight * boxGap;

    const boxWidth = width - boxGapY * 2;
    const boxGapX = (width - boxWidth) / 2;

    // Get the color of a box given it's ID and the current value
    const getBoxColor = (id: number, val: number) => {
      if (id > boxCount - boxCountHi) {
        return id <= Math.ceil((val / MAX_BOX_COUNT) * boxCount) ? hiOn : hiOff;
      }
      if (id > boxCount - boxCountHi - boxCountMid) {
        return id <= Math.ceil((val / MAX_BOX_COUNT) * boxCount)
          ? midOn
          : midOff;
      }
      return id <= Math.ceil((val / MAX_BOX_COUNT) * boxCount) ? lowOn : lowOff;
    };

    const createMeter = function () {
      if (!canvas.current) return;
      const meterValue: number = Number(canvas.current.dataset.meterlevel) + 85;

      // Draw the container
      paint.save();
      paint.beginPath();
      paint.rect(0, 0, width, height);
      paint.fillStyle = "rgb(12,22,32)";
      paint.fill();
      paint.restore();

      // Draw the boxes
      paint.save();
      paint.translate(boxGapX, boxGapY);
      for (let i = 0; i < boxCount; i++) {
        const id = Math.abs(i - (boxCount - 1)) + 1;

        paint.beginPath();
        paint.rect(0, 0, boxWidth, boxHeight);
        paint.fillStyle = getBoxColor(id, meterValue);
        paint.fill();
        paint.translate(0, boxHeight + boxGapY);
      }
      paint.restore();
      painter.current = requestAnimationFrame(createMeter);
    };

    requestAnimationFrame(createMeter);

    return () => {
      painter.current && cancelAnimationFrame(painter.current);
    };
  }, [options, width, height]);

  const [meterVals, setMeterVals] = useState<Float32Array>(
    () => new Float32Array()
  );
  const animation = useRef<number | null>(null);

  // loop recursively to amimateMeters
  const animateMeter = useCallback(() => {
    const val = meter.current?.getValue();
    if (typeof val === "number") {
      setMeterVals(val);
    }
    animation.current = requestAnimationFrame(animateMeter);
  }, []);

  useEffect(() => {
    animation.current = requestAnimationFrame(animateMeter);
    return () => {
      animation.current && cancelAnimationFrame(animation.current);
    };
  }, []);

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
