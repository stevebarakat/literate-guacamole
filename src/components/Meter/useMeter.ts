import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Meter } from "tone";

const MAX_BOX_COUNT = 100;

// Colors
const hiOn = "hsla(250, 80%, 70%, 0.9)";
const hiOff = "hsla(250, 80%, 70%, 0.5)";
const midOn = "hsla(285, 90%, 70%, 0.9)";
const midOff = "hsla(285, 90%, 70%, 0.5)";
const lowOn = "hsla(330, 100%, 70%, 0.9)";
const lowOff = "hsla(330, 100%, 70%, 0.5)";

type Props = {
  channel: Channel | Destination | undefined;
  canvas: React.MutableRefObject<HTMLCanvasElement | null>;
  options: MeterOptions | undefined;
};

function useMeter({ channel, canvas, options }: Props) {
  const [meterVals, setMeterVals] = useState<number>();
  const meter = useRef<Meter | undefined>();
  const pencil = useRef<number | null>(null);
  const animation = useRef<number | null>(null);

  console.log("channel", channel);

  useEffect(() => {
    meter.current = new Meter({ channels: 2 });
    channel?.connect(meter.current);
  }, [channel]);

  useEffect(() => {
    const draw = canvas.current?.getContext("2d");

    const boxGap = (options?.gap && options.gap * 0.1) ?? 0.1;
    const boxCount = options?.total ?? 50;
    const boxCountMid = options?.midCount ?? 20;
    const boxCountHi = options?.highCount ?? 10;
    const width = options?.width ?? 12;
    const height = (options?.height || 200) - 4;

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

    function createMeter() {
      if (!canvas.current || draw == null)
        throw new Error("Could not get canvas context");
      const meterValue: number = Number(canvas.current.dataset.meterlevel) + 85;

      // Draw the container
      draw.save();
      draw.beginPath();
      draw.rect(0, 0, width, height);
      draw.fillStyle = "rgb(12,22,32)";
      draw.fill();
      draw.restore();

      // Draw the boxes
      draw.save();
      draw.translate(boxGapX, boxGapY);
      for (let i = 0; i < boxCount; i++) {
        const id = Math.abs(i - (boxCount - 1)) + 1;

        draw.beginPath();
        draw.rect(0, 0, boxWidth, boxHeight);
        draw.fillStyle = getBoxColor(id, meterValue);
        draw.fill();
        draw.translate(0, boxHeight + boxGapY);
      }
      draw.restore();
      pencil.current = requestAnimationFrame(createMeter);
    }

    requestAnimationFrame(createMeter);

    return () => {
      pencil.current && cancelAnimationFrame(pencil.current);
    };
  }, [options, canvas]);

  const animateMeter = useCallback(() => {
    const vals = meter.current?.getValue();
    if (typeof vals === "number") return;
    vals?.forEach((val) => {
      setMeterVals(val);
    });

    animation.current = requestAnimationFrame(animateMeter);
  }, []);

  useMemo(() => requestAnimationFrame(animateMeter), [animateMeter]);

  return meterVals;
}

export default useMeter;
