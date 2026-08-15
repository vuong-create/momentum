import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLiveQuery } from "dexie-react-hooks";

import { pillarThemes } from "../../../app/theme";
import { db, type Difficulty, type Pillar } from "../../../database/db";
import {
  buildTaskLedgerEntries,
  filterTaskLedgerEntries,
  type TaskLedgerFilters,
  type TaskLedgerSource,
  type TaskLedgerStatus,
} from "../services/taskLedgerService";

type TaskLedgerProps = { onOpenActivity: (activityId: number) => void };

const initialFilters: TaskLedgerFilters = {
  query: "",
  month: "",
  pillar: "all",
  difficulty: "all",
  status: "completed",
  source: "all",
  cookingIdentity: "all",
  order: "newest",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function sourceLabel(source: TaskLedgerSource) {
  return { manual: "Manual", preset: "Day preset", recurring: "Recurring", pillar: "Pillar-linked" }[source];
}

export default function TaskLedger({ onOpenActivity }: TaskLedgerProps) {
  const [open, setOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<TaskLedgerFilters>(initialFilters);
  const [limit, setLimit] = useState(50);
  const data = useLiveQuery(async () => Promise.all([
    db.plannedActivities.toArray(),
    db.activityEvents.toArray(),
    db.xpEvents.toArray(),
  ]), []);
  const entries = useMemo(() => data ? buildTaskLedgerEntries(...data) : [], [data]);
  const completedCount = entries.filter((entry) => entry.everCompleted).length;
  const filtered = useMemo(() => filterTaskLedgerEntries(entries, filters), [entries, filters]);
  const visible = filtered.slice(0, limit);
  const activeXP = filtered.reduce((sum, entry) => sum + (entry.xpVoided ? 0 : entry.xp), 0);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function update<K extends keyof TaskLedgerFilters>(key: K, value: TaskLedgerFilters[K]) {
    setLimit(50);
    setFilters((current) => ({ ...current, [key]: value }));
  }

  const target = document.querySelector(".experience-root") ?? document.body;
  return (
    <>
      <section className="task-ledger-launcher">
        <div>
          <span className="text-label">Activity archive</span>
          <strong>Every task, kept quietly in one place.</strong>
          <small>{completedCount} completed · {entries.length} total</small>
        </div>
        <button type="button" onClick={() => setOpen(true)}>All Tasks <span>→</span></button>
      </section>
      {open && createPortal(
        <div className="task-ledger-layer">
          <button className="task-ledger-backdrop" type="button" aria-label="Close task ledger" onClick={() => setOpen(false)} />
          <section className="task-ledger" role="dialog" aria-modal="true" aria-labelledby="task-ledger-title">
            <header>
              <div><span className="text-label">Planner archive</span><h2 id="task-ledger-title" className="font-pixel">All Tasks</h2><p>A permanent view of what was planned, finished, reopened, or dismissed.</p></div>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)}>×</button>
            </header>
            <div className="task-ledger-summary">
              <span><strong>{filtered.length}</strong> tasks shown</span>
              <span><strong>{activeXP}</strong> active XP</span>
              <span><strong>{filtered.filter((entry) => (entry.activity.rescheduleCount ?? 0) > 0).length}</strong> rescheduled</span>
              <button type="button" className={showFilters ? "is-selected" : ""} onClick={() => setShowFilters((value) => !value)}>Filter {showFilters ? "−" : "+"}</button>
            </div>
            {showFilters && (
              <div className="task-ledger-filters">
                <input value={filters.query} onChange={(event) => update("query", event.target.value)} placeholder="Search title or notes" aria-label="Search tasks" />
                <input type="month" value={filters.month} onChange={(event) => update("month", event.target.value)} aria-label="Month" />
                <select value={filters.status} onChange={(event) => update("status", event.target.value as TaskLedgerStatus | "all")} aria-label="Status">
                  <option value="completed">Completed history</option><option value="all">All statuses</option><option value="active">Active</option><option value="reopened">Reopened</option><option value="dismissed">Dismissed</option><option value="deleted">Deleted</option>
                </select>
                <select value={filters.pillar} onChange={(event) => update("pillar", event.target.value as Pillar | "all")} aria-label="Pillar">
                  <option value="all">All pillars</option>{Object.entries(pillarThemes).map(([key, theme]) => <option key={key} value={key}>{theme.shortLabel}</option>)}
                </select>
                <select value={filters.source} onChange={(event) => update("source", event.target.value as TaskLedgerSource | "all")} aria-label="Source">
                  <option value="all">All sources</option><option value="manual">Manual</option><option value="preset">Day preset</option><option value="recurring">Recurring</option><option value="pillar">Pillar-linked</option>
                </select>
                <select value={filters.difficulty} onChange={(event) => update("difficulty", event.target.value as Difficulty | "all")} aria-label="Effort">
                  <option value="all">All effort</option><option value="easy">Quick</option><option value="medium">Standard</option><option value="hard">Major</option>
                </select>
                <select value={filters.cookingIdentity} onChange={(event) => update("cookingIdentity", event.target.value as TaskLedgerFilters["cookingIdentity"])} aria-label="Cooking type">
                  <option value="all">All cooking types</option><option value="meal">Meals</option><option value="task">Prep / kitchen tasks</option><option value="unclassified">Needs classification</option>
                </select>
                <select value={filters.order} onChange={(event) => update("order", event.target.value as "newest" | "oldest")} aria-label="Sort order"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select>
                <button type="button" onClick={() => { setLimit(50); setFilters(initialFilters); }}>Reset</button>
              </div>
            )}
            <div className="task-ledger-table" role="table" aria-label="Task history">
              <div className="task-ledger-row task-ledger-head" role="row"><span>Date</span><span>Task</span><span>Pillar / type</span><span>Source</span><span>XP</span><span>Status</span></div>
              {visible.map((entry) => (
                <button type="button" className="task-ledger-row" role="row" key={entry.activity.id} onClick={() => { setOpen(false); onOpenActivity(entry.activity.id!); }}>
                  <span>{formatDate(entry.ledgerDate)}</span>
                  <span><strong>{entry.activity.title}</strong>{entry.activity.notes && <small>{entry.activity.notes}</small>}</span>
                  <span>{pillarThemes[entry.activity.pillar].shortLabel}{entry.cookingIdentity && <small>{entry.cookingIdentity === "task" ? "Prep / kitchen" : entry.cookingIdentity}</small>}</span>
                  <span>{sourceLabel(entry.source)}</span>
                  <span className={entry.xpVoided ? "is-voided" : ""}>{entry.xp ? `+${entry.xp}` : "—"}</span>
                  <span className={`task-ledger-status is-${entry.status}`}>{entry.status}</span>
                </button>
              ))}
              {visible.length === 0 && <div className="task-ledger-empty">No tasks match this view.</div>}
            </div>
            {visible.length < filtered.length && <button type="button" className="task-ledger-more" onClick={() => setLimit((value) => value + 50)}>Show 50 more</button>}
          </section>
        </div>, target)}
    </>
  );
}
