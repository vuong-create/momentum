import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { pillarThemes } from "../../../app/theme";
import type { Pillar, XPEvent } from "../../../database/db";
import { getXPBreakdown } from "../XPService";

import "./xp-breakdown-modal.css";

type XPBreakdownModalProps = {
  events: XPEvent[];
  open: boolean;
  onClose: () => void;
};

const pillarMarks: Record<Pillar, string> = {
  chinese: "文",
  athletics: "●",
  cooking: "○",
  finance: "¥",
  happiness: "✎",
  core: "◆",
};

function getPillarLabel(pillar: Pillar) {
  return pillar === "core" ? "Core" : pillarThemes[pillar].label;
}

function formatEventDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function XPBreakdownModal({
  events,
  open,
  onClose,
}: XPBreakdownModalProps) {
  const [selectedPillar, setSelectedPillar] = useState<Pillar | "all">("all");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const summary = useMemo(() => getXPBreakdown(events), [events]);

  const visibleEvents = useMemo(
    () =>
      summary.recentEvents
        .filter((event) =>
          selectedPillar === "all"
            ? true
            : event.scope !== "momentum" && event.pillar === selectedPillar
        )
        .slice(0, 8),
    [selectedPillar, summary.recentEvents]
  );

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  const target = document.querySelector(".experience-root") ?? document.body;
  const { globalProgression } = summary;

  return createPortal(
    <div className="xp-breakdown-layer">
      <button
        type="button"
        className="xp-breakdown-backdrop"
        onClick={onClose}
        aria-label="Close Momentum progression"
      />

      <section
        className="xp-breakdown-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="xp-breakdown-title"
      >
        <header className="xp-breakdown-header">
          <div>
            <span className="text-label">Momentum progression</span>
            <h2 id="xp-breakdown-title" className="font-pixel">
              Your Momentum
            </h2>
            <p>One life, measured through the areas you choose to build.</p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className="xp-breakdown-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="xp-global-card">
          <div className="xp-global-level">
            <span>Global level</span>
            <strong>{globalProgression.level}</strong>
            <small>{summary.globalTitle}</small>
          </div>

          <div className="xp-global-progress">
            <div className="xp-global-progress-copy">
              <div>
                <strong>{summary.totalXP.toLocaleString()} XP</strong>
                <span>Lifetime Momentum</span>
              </div>
              <small>{globalProgression.xpToNextLevel} XP to Level {globalProgression.level + 1}</small>
            </div>

            <div className="xp-progress-track" aria-label={`${Math.round(globalProgression.percentage)}% to the next Momentum level`}>
              <span style={{ width: `${globalProgression.percentage}%` }} />
            </div>

            <div className="xp-contribution-heading">
              <span>Lifetime contribution</span>
              {summary.momentumOnlyXP > 0 && <small>{summary.momentumOnlyXP} bonus XP</small>}
            </div>

            <div className="xp-contribution-bar" aria-label="XP contribution by pillar">
              {summary.contributions.map((contribution) => (
                contribution.xp > 0 && (
                  <span
                    key={contribution.pillar}
                    className={pillarThemes[contribution.pillar].className}
                    style={{ width: `${contribution.percentage}%` }}
                    title={`${getPillarLabel(contribution.pillar)}: ${contribution.xp} XP`}
                  />
                )
              ))}
              {summary.momentumOnlyXP > 0 && (
                <span
                  className="xp-contribution-bonus"
                  style={{ width: `${(summary.momentumOnlyXP / summary.totalXP) * 100}%` }}
                  title={`Momentum bonuses: ${summary.momentumOnlyXP} XP`}
                />
              )}
            </div>
          </div>
        </div>

        <div className="xp-pillar-heading">
          <div>
            <span className="text-label">Pillar levels</span>
            <p>Engagement in each part of your life.</p>
          </div>
          <small>Select a pillar to filter history</small>
        </div>

        <div className="xp-pillar-grid">
          {summary.contributions.map((contribution) => {
            const theme = pillarThemes[contribution.pillar];
            const isSelected = selectedPillar === contribution.pillar;

            return (
              <button
                type="button"
                key={contribution.pillar}
                className={[
                  "xp-pillar-card",
                  theme.className,
                  isSelected ? "is-selected" : "",
                ].filter(Boolean).join(" ")}
                onClick={() => setSelectedPillar(isSelected ? "all" : contribution.pillar)}
                aria-pressed={isSelected}
              >
                <span className="xp-pillar-mark" aria-hidden="true">{pillarMarks[contribution.pillar]}</span>
                <span className="xp-pillar-copy">
                  <strong>{getPillarLabel(contribution.pillar)}</strong>
                  <small>{contribution.xp} XP · {contribution.eventCount} {contribution.eventCount === 1 ? "activity" : "activities"}</small>
                </span>
                <span className="xp-pillar-level">Lv {contribution.progression.level}</span>
                <span className="xp-pillar-track" aria-hidden="true">
                  <span style={{ width: `${contribution.progression.percentage}%` }} />
                </span>
              </button>
            );
          })}
        </div>

        <section className="xp-history">
          <header>
            <div>
              <span className="text-label">Recent XP</span>
              <p>{selectedPillar === "all" ? "All Momentum activity" : getPillarLabel(selectedPillar)}</p>
            </div>
            {selectedPillar !== "all" && (
              <button type="button" onClick={() => setSelectedPillar("all")}>Show all</button>
            )}
          </header>

          <div className="xp-history-list">
            {visibleEvents.length === 0 ? (
              <div className="xp-history-empty">
                <strong>No XP here yet.</strong>
                <span>Meaningful completed activities will appear here.</span>
              </div>
            ) : (
              visibleEvents.map((event) => {
                const eventPillar = event.scope === "momentum" || !event.pillar
                  ? null
                  : event.pillar;

                return (
                  <article key={event.id ?? `${event.source}-${event.date}`}>
                    <span className={eventPillar ? pillarThemes[eventPillar].className : "xp-history-momentum"} aria-hidden="true">
                      {eventPillar ? pillarMarks[eventPillar] : "M"}
                    </span>
                    <div>
                      <strong>{event.description || "Momentum activity"}</strong>
                      <small>{eventPillar ? getPillarLabel(eventPillar) : "Momentum bonus"} · {formatEventDate(event.date)}</small>
                    </div>
                    <b>+{event.amount} XP</b>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </section>
    </div>,
    target
  );
}
