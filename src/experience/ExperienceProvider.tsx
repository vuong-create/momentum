import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../database/db";
import {
  defaultAppSettings,
  SETTINGS_ID,
  updateAppSettings,
} from "../features/settings/services/settingsService";

import {
  ExperienceContext,
  type ExperienceContextValue,
} from "./ExperienceContext";
import {
  playFeedbackSound,
  type FeedbackCue,
} from "./audio/audioEngine";
import { getAmbience } from "./presence/ambience";
import { getDateKey, getTimePeriod } from "./presence/clock";
import { getDailyGreeting } from "./presence/greetings";

import "./experience.css";

type ExperienceProviderProps = {
  children: ReactNode;
};

function getReducedMotionPreference() {
  return window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
}

export default function ExperienceProvider({
  children,
}: ExperienceProviderProps) {
  const [now, setNow] = useState(() => new Date());
  const [reducedMotion, setReducedMotion] = useState(
    getReducedMotionPreference
  );

  const storedSettings = useLiveQuery(
    () => db.appSettings.get(SETTINGS_ID),
    []
  );
  const settings = storedSettings ?? defaultAppSettings;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    function handleChange(event: MediaQueryListEvent) {
      setReducedMotion(event.matches);
    }

    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const setSoundsEnabled = useCallback(async (enabled: boolean) => {
    await updateAppSettings({ soundsEnabled: enabled });
  }, []);

  const setAnimationsEnabled = useCallback(async (enabled: boolean) => {
    await updateAppSettings({ animationsEnabled: enabled });
  }, []);

  const playFeedback = useCallback(
    (cue: FeedbackCue) => {
      if (settings.soundsEnabled) playFeedbackSound(cue);
    },
    [settings.soundsEnabled]
  );

  const previewFeedback = useCallback((cue: FeedbackCue) => {
    playFeedbackSound(cue);
  }, []);

  const value = useMemo<ExperienceContextValue>(() => {
    const period = getTimePeriod(now);
    const ambience = getAmbience(period);
    const dateKey = getDateKey(now);

    return {
      now,
      period,
      ambience,
      greeting: getDailyGreeting(period, dateKey),
      reducedMotion,
      soundsEnabled: settings.soundsEnabled,
      animationsEnabled: settings.animationsEnabled,
      motionEnabled: settings.animationsEnabled && !reducedMotion,
      setSoundsEnabled,
      setAnimationsEnabled,
      playFeedback,
      previewFeedback,
    };
  }, [
    now,
    playFeedback,
    previewFeedback,
    reducedMotion,
    setAnimationsEnabled,
    setSoundsEnabled,
    settings.animationsEnabled,
    settings.soundsEnabled,
  ]);

  return (
    <ExperienceContext.Provider value={value}>
      <div
        className={[
          "experience-root",
          value.ambience.className,
          value.motionEnabled ? "" : "experience-motion-disabled",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div
          className="experience-light experience-light-primary"
          aria-hidden="true"
        />
        <div
          className="experience-light experience-light-secondary"
          aria-hidden="true"
        />
        <div className="experience-content">{children}</div>
      </div>
    </ExperienceContext.Provider>
  );
}
