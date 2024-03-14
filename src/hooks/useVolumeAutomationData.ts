import { useEffect, useCallback, useState } from "react";
import { Transport as t } from "tone";
import {
  localStorageGet,
  localStorageSet,
  logarithmically,
  roundFourth,
  scale,
} from "@/utils";
import { MixerContext } from "@/machines/mixerMachine";

type Props = {
  trackId: number;
  channel: Channel;
  track: TrackSettings;
};

type ReadProps = Omit<Props, "volume">;

type WriteProps = {
  trackId: number;
  value: number;
  track: TrackSettings;
};

function useVolumeAutomationData({ trackId, channel, track }: Props) {
  const volume = MixerContext.useSelector((state) => state.context.volume);

  useWrite({ trackId, value: volume, track });
  useRead({ trackId, channel, track });

  return null;
}

const data = new Map<number, { id: number; value: number; time: number }>();

// !!! --- WRITE --- !!! //
function useWrite({ trackId, value, track }: WriteProps) {
  const automationMode = track.volumeMode;

  useEffect(() => {
    if (automationMode !== "write") return;

    const loop = t.scheduleRepeat(
      () => {
        const time: number = roundFourth(t.seconds);
        data.set(time, { id: trackId, time, value });
        const mapToObject = (map: typeof data) =>
          Object.fromEntries(map.entries());
        const newData = mapToObject(data);
        localStorageSet("volumeData", newData);
      },
      0.25,
      0
    );
    return () => {
      t.clear(loop);
    };
  }, [trackId, value, automationMode]);

  return data;
}

// !!! --- READ --- !!! //
function useRead({ track, channel }: ReadProps) {
  const automationMode = track.volumeMode;
  const { send } = MixerContext.useActorRef();

  const setVolume = useCallback(
    (value: number): void => {
      send({
        type: "CHANGE_VOLUME",
        volume: value,
      });
    },
    [send]
  );

  const setParam = useCallback(
    (data: { time: number; value: number }) => {
      t.schedule(() => {
        if (automationMode !== "read") return;

        const scaled = scale(logarithmically(data.value));
        channel.volume.value = scaled;

        setVolume(data.value);
      }, data.time);
    },
    [setVolume, automationMode, channel]
  );

  const volumeData = localStorageGet("volumeData");

  useEffect(() => {
    if (automationMode !== "read" || !volumeData) return;
    const objectToMap = (obj: object) => new Map(Object.entries(obj));
    const newVolData = objectToMap(volumeData);
    for (const value of newVolData) {
      setParam(value[1]);
    }
  }, [volumeData, setParam, automationMode]);

  return null;
}
export default useVolumeAutomationData;
