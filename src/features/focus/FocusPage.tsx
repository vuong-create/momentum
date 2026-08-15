import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate, useParams } from "react-router-dom";

import { pillarThemes, type PillarKey } from "../../app/theme";
import { db } from "../../database/db";
import useExperience from "../../experience/useExperience";
import PillarIcon from "../activities/components/PillarIcon";
import { completePlannedActivity } from "../activities/services/activityService";
import {
  advanceFocusPhase,
  endFocusSession,
  getRemainingSeconds,
  pauseFocusSession,
  resumeFocusSession,
  startFocusSession,
} from "./services/focusService";
import {
  playFocusSoundscape,
  stopFocusSoundscape,
  type FocusSoundscape,
} from "./services/focusSoundscape";

import "./focus.css";

const SOUND_LABELS: Record<FocusSoundscape, string> = {
  silent: "Stillness",
  rain: "Soft rain",
  "warm-noise": "Warm noise",
};

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function phaseLabel(phase: "focus" | "short-break" | "long-break") {
  if (phase === "focus") return "Focus";
  if (phase === "long-break") return "Long break";
  return "Short break";
}

export default function FocusPage() {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const experience = useExperience();
  const numericActivityId = Number(activityId);
  const [duration, setDuration] = useState(25);
  const [now, setNow] = useState(() => new Date());
  const [soundscape, setSoundscape] = useState<FocusSoundscape>(() =>
    (localStorage.getItem("momentum.focus.soundscape") as FocusSoundscape | null) ?? "silent"
  );
  const [working, setWorking] = useState(false);
  const advancingRef = useRef(false);

  const activityResult = useLiveQuery(
    async () => ({
      value: Number.isFinite(numericActivityId)
        ? await db.plannedActivities.get(numericActivityId)
        : undefined,
    }),
    [numericActivityId],
  );
  const sessionResult = useLiveQuery(
    async () => ({
      value: Number.isFinite(numericActivityId)
        ? await db.focusSessions
        .where("activityId")
        .equals(numericActivityId)
        .filter((item) => item.status === "active" || item.status === "paused")
        .last()
        : undefined,
    }),
    [numericActivityId],
  );
  const activity = activityResult?.value;
  const session = sessionResult?.value;
  const history = useLiveQuery(
    () => Number.isFinite(numericActivityId)
      ? db.focusSessions
        .where("activityId")
        .equals(numericActivityId)
        .reverse()
        .filter((item) => item.status === "completed")
        .limit(4)
        .toArray()
      : [],
    [numericActivityId],
    [],
  );

  const remaining = session ? getRemainingSeconds(session, now) : duration * 60;
  const progress = session
    ? Math.min(100, Math.max(0, 100 - (remaining / session.phaseDurationSeconds) * 100))
    : 0;
  const theme = activity ? pillarThemes[activity.pillar as PillarKey] : pillarThemes.core;

  useEffect(() => {
    if (session?.status !== "active") return;
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [session?.status]);

  useEffect(() => {
    if (!session?.id || session.status !== "active" || remaining > 0 || advancingRef.current) return;
    advancingRef.current = true;
    void advanceFocusPhase(session.id).then(() => {
      experience.playFeedback("focus-phase");
      advancingRef.current = false;
    });
  }, [experience, remaining, session]);

  useEffect(() => {
    if (session?.status === "active" && experience.soundsEnabled) {
      playFocusSoundscape(soundscape);
    } else {
      stopFocusSoundscape();
    }
    return stopFocusSoundscape;
  }, [experience.soundsEnabled, session?.status, soundscape]);

  useEffect(() => {
    function keyboardControls(event: KeyboardEvent) {
      if (event.code !== "Space" || !session?.id) return;
      const target = event.target as HTMLElement;
      if (/^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(target.tagName)) return;
      event.preventDefault();
      void (session.status === "active"
        ? pauseFocusSession(session.id)
        : resumeFocusSession(session.id));
    }
    window.addEventListener("keydown", keyboardControls);
    return () => window.removeEventListener("keydown", keyboardControls);
  }, [session]);

  async function begin() {
    if (!activity || working) return;
    setWorking(true);
    try {
      await startFocusSession(activity, duration);
      setNow(new Date());
    } finally {
      setWorking(false);
    }
  }

  async function toggleTimer() {
    if (!session?.id || working) return;
    setWorking(true);
    try {
      if (session.status === "active") await pauseFocusSession(session.id);
      else await resumeFocusSession(session.id);
      setNow(new Date());
    } finally {
      setWorking(false);
    }
  }

  async function finishSession() {
    if (!session?.id || working) return;
    setWorking(true);
    try {
      await endFocusSession(session.id);
      stopFocusSoundscape();
      experience.playFeedback("focus-phase");
    } finally {
      setWorking(false);
    }
  }

  async function completeActivity() {
    if (!activity?.id || activity.completed || working) return;
    setWorking(true);
    try {
      await completePlannedActivity(activity.id);
      experience.playFeedback("task-completed");
    } finally {
      setWorking(false);
    }
  }

  function chooseSoundscape(next: FocusSoundscape) {
    setSoundscape(next);
    localStorage.setItem("momentum.focus.soundscape", next);
  }

  const totalFocusedMinutes = useMemo(
    () => history.reduce((total, item) => total + item.focusedSeconds, 0) / 60,
    [history],
  );

  if (!activityResult || !sessionResult) {
    return <main className="focus-page"><p className="focus-loading">Preparing your focus space…</p></main>;
  }

  if (!activity || activity.deletedAt) {
    return (
      <main className="focus-page focus-empty">
        <span className="text-label">Focus</span>
        <h1 className="font-pixel">Activity unavailable</h1>
        <button type="button" onClick={() => navigate(-1)}>Return</button>
      </main>
    );
  }

  return (
    <main className={`focus-page ${theme.className}`}>
      <header className="focus-header">
        <button type="button" onClick={() => navigate(-1)}>← Return</button>
        <span className="text-label">Focus mode</span>
        <span>{session ? `${session.completedCycles} cycles` : "Ready"}</span>
      </header>

      <section className="focus-stage">
        <div className="focus-activity">
          <span className="focus-pillar"><PillarIcon pillar={activity.pillar as PillarKey} /></span>
          <div>
            <span>{theme.label}</span>
            <h1>{activity.title}</h1>
          </div>
        </div>

        {!session ? (
          <div className="focus-setup">
            <p>Choose a quiet block. The timer stays attached to this activity.</p>
            <div className="focus-duration-options" aria-label="Focus duration">
              {[25, 50].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  className={duration === minutes ? "is-selected" : ""}
                  onClick={() => setDuration(minutes)}
                >
                  <strong>{minutes}</strong><span>minutes</span>
                </button>
              ))}
            </div>
            <button type="button" className="focus-begin" disabled={working} onClick={begin}>
              Begin focus
            </button>
          </div>
        ) : (
          <div className="focus-timer-area">
            <div
              className="focus-timer-ring"
              style={{ "--focus-progress": `${progress * 3.6}deg` } as React.CSSProperties}
            >
              <div>
                <span>{phaseLabel(session.phase)}</span>
                <strong className="font-pixel">{formatClock(remaining)}</strong>
                <small>{session.status === "active" ? "In progress" : "Paused"}</small>
              </div>
            </div>

            <div className="focus-timer-actions">
              <button type="button" className="focus-toggle" disabled={working} onClick={toggleTimer}>
                {session.status === "active" ? "Pause" : "Continue"}
              </button>
              <button type="button" disabled={working} onClick={() => session.id && advanceFocusPhase(session.id)}>
                Skip phase
              </button>
              <button type="button" disabled={working} onClick={finishSession}>End session</button>
            </div>
            <p className="focus-shortcut">Space to pause or continue</p>
          </div>
        )}
      </section>

      <section className="focus-lower-grid">
        <div className="focus-sound-panel">
          <div><span className="text-label">Soundscape</span><h2>Quiet company</h2></div>
          <div className="focus-sound-options">
            {(Object.keys(SOUND_LABELS) as FocusSoundscape[]).map((option) => (
              <button
                key={option}
                type="button"
                className={soundscape === option ? "is-selected" : ""}
                disabled={!experience.soundsEnabled && option !== "silent"}
                onClick={() => chooseSoundscape(option)}
              >
                <span />{SOUND_LABELS[option]}
              </button>
            ))}
          </div>
          {!experience.soundsEnabled && <p>Sounds are disabled in Settings.</p>}
        </div>

        <div className="focus-history-panel">
          <div><span className="text-label">This activity</span><h2>{Math.round(totalFocusedMinutes)} focused minutes</h2></div>
          {history.length === 0 ? (
            <p>Your completed sessions will collect here.</p>
          ) : (
            <ul>{history.map((item) => <li key={item.id}><span>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(item.startedAt))}</span><strong>{item.focusedSeconds < 60 ? "<1 min" : `${Math.round(item.focusedSeconds / 60)} min`}</strong></li>)}</ul>
          )}
          {!session && (
            <button type="button" disabled={activity.completed || working} onClick={completeActivity}>
              {activity.completed ? "Activity complete" : "Complete activity"}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
