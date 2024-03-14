import type {
  FeedbackDelay,
  PitchShift,
  Reverb,
  Volume,
  Channel as ToneChannel,
  AutoFilter,
} from "tone";
import type { Destination as ToneDestination } from "tone/build/esm/core/context/Destination";
import { Transport as ToneTransport } from "tone/build/esm/core/clock/Transport";
import { defaultTrackData } from "@/assets/songs/defaultData";

declare global {
  type Destination = ToneDestination;
  type Transport = ToneTransport;
  type Channel = ToneChannel;
  type DefaultTrackData = typeof defaultTrackData;

  type Fx = (AutoFilter | Reverb | FeedbackDelay | PitchShift)[];

  type TrackFx = {
    nofx: Volume | null;
    reverb: Reverb | null;
    delay: FeedbackDelay | null;
    pitchShift: PitchShift | null;
  };

  type SourceSong = {
    id: string;
    slug: string;
    title: string;
    artist: string;
    year: string;
    studio: string;
    location: string;
    bpm: number;
    startPosition: number;
    endPosition: number;
    tracks: SourceTrack[];
  };

  type SourceTrack = {
    id: string;
    name: string;
    path: string;
  };

  type SoloMuteType = {
    solo: boolean;
    mute: boolean;
  };

  type TrackSettings = {
    id: string;
    name: string;
    songSlug: string;

    // MAIN
    volume: number;
    pan: number;
    soloMute: SoloMuteType;

    // // AUTOMATION
    // volumeMode: string;
    // panMode: string;
    // soloMuteMode: string;

    // // FX
    // fxNames: string[];
    // delaySettings: DelaySettings;
    // reverbSettings: ReverbSettings;
    // pitchShiftSettings: PitchShiftSettings;

    // // PANELS
    // panelPosition: { x: number; y: number };
    // panelSize: { width: string; height: string };
    // panelActive: boolean;
  };

  type DelaySettings = {
    bypassed: boolean | undefined;
    mix: number | undefined;
    delayTime: number | undefined;
    feedback: number | undefined;
  };

  type ReverbSettings = {
    bypassed: boolean | undefined;
    mix: number | undefined;
    preDelay: number | undefined;
    decay: number | undefined;
  };

  type PitchShiftSettings = {
    bypassed: boolean | undefined;
    mix: number | undefined;
    pitch: number | undefined;
  };

  type MeterProps = {
    channel: Channel | Destination | undefined;
    options?: MeterOptions;
  };

  type MeterOptions = {
    width?: number;
    height?: number;
    gap?: number;
    highCount?: number;
    midCount?: number;
    total?: number;
  };
}
