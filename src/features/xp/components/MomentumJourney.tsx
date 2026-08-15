import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import { db, type MilestoneSnapshot } from "../../../database/db";
import { MOMENTUM_MILESTONE_LEVELS } from "../progressionService";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function MomentumJourney() {
  const results = useLiveQuery(() => db.weeklyProgressResults.orderBy("weekStart").reverse().toArray(), []) ?? [];
  const snapshots = useLiveQuery(() => db.milestoneSnapshots.orderBy("level").toArray(), []) ?? [];
  const [selected, setSelected] = useState<MilestoneSnapshot | null>(null);
  const snapshotByLevel = new Map(snapshots.map((snapshot) => [snapshot.level, snapshot]));
  const perfectWeeks = results.filter((result) => result.perfectWeek).length;

  return (
    <div className="momentum-journey">
      <section className="momentum-journey-summary">
        <article><span>Weeks recorded</span><strong>{results.length}</strong></article>
        <article><span>Perfect Weeks</span><strong>{perfectWeeks}</strong></article>
        <article><span>Milestones</span><strong>{snapshots.length} / {MOMENTUM_MILESTONE_LEVELS.length}</strong></article>
      </section>

      <section className="momentum-milestones">
        <header><div><span className="text-label">Milestone path</span><p>A permanent record of meaningful Momentum.</p></div></header>
        <div>
          {MOMENTUM_MILESTONE_LEVELS.map((level) => {
            const snapshot = snapshotByLevel.get(level);
            return (
              <button type="button" key={level} disabled={!snapshot} className={snapshot ? "is-earned" : ""} onClick={() => snapshot && setSelected(snapshot)}>
                <span>{snapshot ? "✦" : "◇"}</span>
                <strong>Level {level}</strong>
                <small>{snapshot ? formatDate(snapshot.achievedAt) : "Ahead"}</small>
              </button>
            );
          })}
        </div>
      </section>

      {selected && (
        <section className="momentum-milestone-snapshot">
          <header><div><span className="text-label">Journey snapshot</span><h3>Level {selected.level} · {selected.title}</h3></div><button type="button" onClick={() => setSelected(null)}>×</button></header>
          <p>Reached {formatDate(selected.achievedAt)} with {selected.lifetimeXP.toLocaleString()} lifetime XP.</p>
          <div>
            <article><span>Plans completed</span><strong>{selected.completedPlans}</strong></article>
            <article><span>Perfect Weeks</span><strong>{selected.perfectWeeks}</strong></article>
            <article><span>Chinese</span><strong>{selected.chineseActivities}</strong></article>
            <article><span>Athletics</span><strong>{selected.athleticsActivities}</strong></article>
            <article><span>Meals cooked</span><strong>{selected.mealsCooked}</strong></article>
            <article><span>Library entries</span><strong>{selected.libraryEntries}</strong></article>
            <article><span>Finance activity</span><strong>{selected.financeActivities}</strong></article>
          </div>
        </section>
      )}

      <section className="momentum-week-history">
        <header><div><span className="text-label">Weekly results</span><p>Sunday through Saturday, without penalties.</p></div></header>
        {results.length === 0 ? (
          <div className="xp-history-empty"><strong>No completed weeks yet.</strong><span>Your first weekly result will appear after Saturday.</span></div>
        ) : (
          <div>
            {results.slice(0, 12).map((result) => (
              <article key={result.weekStart} className={result.perfectWeek ? "is-perfect" : ""}>
                <span>{result.perfectWeek ? "✦" : `${result.percentage}%`}</span>
                <div><strong>{formatDate(`${result.weekStart}T00:00:00`)}</strong><small>{result.completedCount} of {result.eligibleCount} completed</small></div>
                <b>{result.bonusXP > 0 ? `+${result.bonusXP} XP` : "No bonus"}</b>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
