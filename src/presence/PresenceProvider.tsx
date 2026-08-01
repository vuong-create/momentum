import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getDateKey,
  getTimePeriod,
  type TimePeriod,
} from "./clock";

import {
  getAmbience,
  type Ambience,
} from "./ambience";

import { getDailyGreeting } from "./greetings";

import "./presence.css";

export type PresenceContextValue = {
  now: Date;
  period: TimePeriod;
  ambience: Ambience;
  greeting: string;
  reducedMotion: boolean;
};

export const PresenceContext =
  createContext<PresenceContextValue | null>(null);

type PresenceProviderProps = {
  children: ReactNode;
};

function getReducedMotionPreference() {
  return window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
}

export default function PresenceProvider({
  children,
}: PresenceProviderProps) {
  const [now, setNow] = useState(() => new Date());

  const [reducedMotion, setReducedMotion] = useState(
    getReducedMotionPreference
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    function handleChange(event: MediaQueryListEvent) {
      setReducedMotion(event.matches);
    }

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleChange
      );
    };
  }, []);

  const value = useMemo<PresenceContextValue>(() => {
    const period = getTimePeriod(now);
    const ambience = getAmbience(period);
    const dateKey = getDateKey(now);

    return {
      now,
      period,
      ambience,
      greeting: getDailyGreeting(period, dateKey),
      reducedMotion,
    };
  }, [now, reducedMotion]);

  return (
    <PresenceContext.Provider value={value}>
      <div
        className={[
          "presence-root",
          value.ambience.className,
          reducedMotion
            ? "presence-reduced-motion"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div
          className="presence-light presence-light-primary"
          aria-hidden="true"
        />

        <div
          className="presence-light presence-light-secondary"
          aria-hidden="true"
        />

        <div className="presence-content">
          {children}
        </div>
      </div>
    </PresenceContext.Provider>
  );
}