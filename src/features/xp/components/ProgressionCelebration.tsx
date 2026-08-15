import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import type { ProgressionHomeExperience } from "../progressionService";

import "./progression-celebration.css";

type ProgressionCelebrationProps = {
  experience: ProgressionHomeExperience | null;
  onContinue: () => void;
};

function formatWeek(start: string, end: string) {
  const format = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  return `${format.format(new Date(`${start}T00:00:00`))} – ${format.format(new Date(`${end}T00:00:00`))}`;
}

export default function ProgressionCelebration({
  experience,
  onContinue,
}: ProgressionCelebrationProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!experience) return;
    buttonRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onContinue();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [experience, onContinue]);

  if (!experience || (!experience.weeklyResult && !experience.levelUp)) return null;
  const weekly = experience.weeklyResult;
  const level = experience.levelUp;
  const perfect = Boolean(weekly?.perfectWeek);
  const target = document.querySelector(".experience-root") ?? document.body;

  return createPortal(
    <div className="progression-celebration-layer">
      <div className={`progression-celebration ${perfect ? "is-perfect" : ""} ${level ? "is-level-up" : ""}`} role="dialog" aria-modal="true" aria-labelledby="progression-celebration-title">
        <span className="progression-celebration-aura" aria-hidden="true" />
        <span className="text-label">{level ? "Momentum recognized" : "Weekly reflection"}</span>
        <h2 id="progression-celebration-title" className="font-pixel">
          {level ? `Level ${level.level}` : perfect ? "Perfect Week" : "Week Complete"}
        </h2>
        {level && <p className="progression-level-change">Level {level.previousLevel} <span>→</span> {level.level} · {level.title}</p>}

        {weekly && (
          <div className="progression-week-result">
            <small>{formatWeek(weekly.weekStart, weekly.weekEnd)}</small>
            <strong>{weekly.completedCount} <span>of</span> {weekly.eligibleCount}</strong>
            <p>{weekly.percentage}% of planned activities completed</p>
            <div className="progression-week-track" aria-label={`${weekly.percentage}% weekly completion`}><i style={{ width: `${weekly.percentage}%` }} /></div>
            <footer>
              <span>Weekly bonus</span>
              <strong>{weekly.bonusXP > 0 ? `+${weekly.bonusXP} XP` : "No bonus"}</strong>
              <span>XP earned this week</span>
              <strong>+{weekly.totalWeekXP} XP</strong>
            </footer>
          </div>
        )}

        <button ref={buttonRef} type="button" onClick={onContinue}>Continue</button>
      </div>
    </div>,
    target,
  );
}
