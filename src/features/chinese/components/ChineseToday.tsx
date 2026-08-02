import { useState, type FormEvent } from "react";

import type {
  ChineseActivity,
  ChineseActivityType,
  ChineseEntry,
} from "../../../database/db";
import {
  chineseActivityCatalog,
  getChineseActivityDefinition,
} from "../activityCatalog";
import type { ChineseEntryInput } from "../services/chineseEntryService";
import { speakTraditionalChinese } from "../services/pronunciationService";

type ChineseTodayProps = {
  entries: ChineseEntry[];
  todayActivities: ChineseActivity[];
  plannedTypes: Set<ChineseActivityType>;
  currentStreak: number;
  loggingType: ChineseActivityType | null;
  justLoggedType: ChineseActivityType | null;
  onLog: (type: ChineseActivityType) => Promise<void>;
  onUndoActivity: (activity: ChineseActivity) => Promise<void>;
  onQuickAdd: (input: ChineseEntryInput) => Promise<void>;
  onOpenEntry: (entry: ChineseEntry) => void;
};

export default function ChineseToday({
  entries,
  todayActivities,
  plannedTypes,
  currentStreak,
  loggingType,
  justLoggedType,
  onLog,
  onUndoActivity,
  onQuickAdd,
  onOpenEntry,
}: ChineseTodayProps) {
  const [traditional, setTraditional] = useState("");
  const [meaning, setMeaning] = useState("");
  const [savingEntry, setSavingEntry] = useState(false);
  const focusEntry = entries[0];

  async function handleQuickAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!traditional.trim() || !meaning.trim() || savingEntry) return;

    setSavingEntry(true);
    try {
      await onQuickAdd({ traditional, meaning });
      setTraditional("");
      setMeaning("");
    } finally {
      setSavingEntry(false);
    }
  }

  return (
    <div className="chinese-today">
      <section className="chinese-today-hero">
        <div className="chinese-anki-card">
          <span className="text-label">Start with recall</span>
          <div className="chinese-anki-mark" aria-hidden="true">卡</div>
          <div>
            <h2>Anki review</h2>
            <p>Open your deck, then log it here when the review is done.</p>
          </div>
          <a href="anki://" className="chinese-anki-open">Open Anki <span>↗</span></a>
          <button type="button" className="chinese-anki-done" onClick={() => onLog("anki")} disabled={loggingType === "anki"}>
            {loggingType === "anki" ? "Logging…" : todayActivities.some((activity) => activity.type === "anki") ? "Log another review" : "✓ Anki done"}
          </button>
        </div>

        <aside className="chinese-pronunciation-card">
          <span className="text-label">Pronunciation focus</span>
          {focusEntry ? (
            <>
              <button type="button" className="chinese-pronunciation-main" onClick={() => speakTraditionalChinese(focusEntry.traditional)}>
                <strong>{focusEntry.traditional}</strong>
                <span>{focusEntry.pinyin || "Tap to hear"}</span>
                <i aria-hidden="true">♪</i>
              </button>
              <p>{focusEntry.meaning}</p>
              <small>Tap to hear Taiwanese Mandarin</small>
            </>
          ) : (
            <div className="chinese-pronunciation-empty">
              <strong>聲音</strong>
              <p>Add your first word or phrase to begin pronunciation practice.</p>
            </div>
          )}
        </aside>
      </section>

      <section className="chinese-quick-log">
        <header>
          <div><span className="text-label">Today</span><h2>Keep Chinese in the day</h2></div>
          <p>{currentStreak > 0 ? `${currentStreak} day streak · ` : ""}{todayActivities.length} logged today</p>
        </header>
        <div className="chinese-quick-grid">
          {chineseActivityCatalog.filter(({ type }) => type !== "anki").map((definition) => {
            const count = todayActivities.filter((activity) => activity.type === definition.type).length;
            const isLogging = loggingType === definition.type;
            const justLogged = justLoggedType === definition.type;
            return (
              <button
                type="button"
                key={definition.type}
                className={[justLogged ? "is-confirmed" : "", plannedTypes.has(definition.type) ? "has-plan" : ""].filter(Boolean).join(" ")}
                onClick={() => onLog(definition.type)}
                disabled={isLogging}
              >
                <span className="chinese-quick-mark">{justLogged ? "✓" : definition.mark}</span>
                <span><strong>{definition.label}</strong><small>{plannedTypes.has(definition.type) ? "Planned today" : definition.description}</small></span>
                <b>{count > 0 ? count : `+${definition.xp}`}</b>
              </button>
            );
          })}
        </div>
      </section>

      <section className="chinese-today-lower">
        <div className="chinese-today-activity">
          <header><div><span className="text-label">Activity</span><h2>Today’s Chinese</h2></div></header>
          {todayActivities.length === 0 ? (
            <div className="chinese-empty-small"><strong>Nothing logged yet.</strong><span>One meaningful moment is enough to make today active.</span></div>
          ) : (
            <div className="chinese-today-activity-list">
              {todayActivities.map((activity) => {
                const definition = getChineseActivityDefinition(activity.type);
                return (
                  <article key={activity.id}>
                    <span>{definition.mark}</span>
                    <div><strong>{definition.label}</strong><small>{activity.plannedActivityId ? "Completed from your plan" : "Spontaneous activity"}</small></div>
                    <time>{new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(activity.createdAt))}</time>
                    <button type="button" onClick={() => onUndoActivity(activity)} aria-label={`Undo ${definition.label}`}>×</button>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <form className="chinese-quick-entry" onSubmit={handleQuickAdd}>
          <header><span className="text-label">Collect</span><h2>Keep a useful phrase</h2><p>Traditional Chinese and meaning are all you need.</p></header>
          <label><span>Traditional Chinese</span><input value={traditional} onChange={(event) => setTraditional(event.target.value)} placeholder="隨便" /></label>
          <label><span>Meaning</span><input value={meaning} onChange={(event) => setMeaning(event.target.value)} placeholder="whatever / as you like" /></label>
          <button type="submit" disabled={!traditional.trim() || !meaning.trim() || savingEntry}>{savingEntry ? "Saving…" : "Save to Database"}</button>
        </form>
      </section>

      <section className="chinese-recent">
        <header><div><span className="text-label">Recently added</span><h2>Language worth keeping</h2></div><small>{entries.length} saved</small></header>
        {entries.length === 0 ? (
          <div className="chinese-empty-wide"><strong>你的中文，從這裡開始。</strong><span>Your personal language collection will live here.</span></div>
        ) : (
          <div className="chinese-recent-grid">
            {entries.slice(0, 10).map((entry) => (
              <article key={entry.id}>
                <button type="button" onClick={() => onOpenEntry(entry)}>
                  <strong>{entry.traditional}</strong><span>{entry.pinyin}</span><p>{entry.meaning}</p>
                </button>
                <button type="button" onClick={() => speakTraditionalChinese(entry.traditional)} aria-label={`Hear ${entry.traditional}`}>♪</button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
