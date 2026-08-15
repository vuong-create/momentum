import { createContext } from "react";

import type { Ambience } from "./presence/ambience";
import type { TimePeriod } from "./presence/clock";
import type { FeedbackCue } from "./audio/audioEngine";

export type ExperienceContextValue = {
  now: Date;
  period: TimePeriod;
  ambience: Ambience;
  greeting: string;
  reducedMotion: boolean;
  soundsEnabled: boolean;
  animationsEnabled: boolean;
  soundVolume: number;
  interfaceSoundsEnabled: boolean;
  actionSoundsEnabled: boolean;
  celebrationSoundsEnabled: boolean;
  soundscapeVolume: number;
  motionEnabled: boolean;
  setSoundsEnabled: (enabled: boolean) => Promise<void>;
  setAnimationsEnabled: (enabled: boolean) => Promise<void>;
  updateSoundPreferences: (patch: { soundVolume?: number; interfaceSoundsEnabled?: boolean; actionSoundsEnabled?: boolean; celebrationSoundsEnabled?: boolean; soundscapeVolume?: number }) => Promise<void>;
  playFeedback: (cue: FeedbackCue) => void;
  previewFeedback: (cue: FeedbackCue) => void;
};

export const ExperienceContext =
  createContext<ExperienceContextValue | null>(null);
