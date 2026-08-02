import { useState, type FormEvent } from "react";

import type {
  ChineseActivity,
  ChineseActivityType,
  ChineseEntry,
  ChineseMediaResource,
} from "../../../database/db";
import { chineseActivityCatalog } from "../activityCatalog";
import type { ChineseEntryInput } from "../services/chineseEntryService";
import type { ChineseMediaInput } from "../services/chineseMediaService";
import { speakTraditionalChinese } from "../services/pronunciationService";
import ChineseMediaShelf from "./ChineseMediaShelf";

type ChineseTodayProps = {
  entries: ChineseEntry[];
  mediaResources: ChineseMediaResource[];
  todayActivities: ChineseActivity[];
  plannedTypes: Set<ChineseActivityType>;
  currentStreak: number;
  loggingType: ChineseActivityType | null;
  justLoggedType: ChineseActivityType | null;
  onLog: (type: ChineseActivityType) => Promise<void>;
  onQuickAdd: (input: ChineseEntryInput) => Promise<void>;
  onAddMedia: (input: ChineseMediaInput) => Promise<void>;
  onRemoveMedia: (resource: ChineseMediaResource) => Promise<void>;
  onOpenEntry: (entry: ChineseEntry) => void;
};

export default function ChineseToday({
  entries,
  mediaResources,
  todayActivities,
  plannedTypes,
  currentStreak,
  loggingType,
  justLoggedType,
  onLog,
  onQuickAdd,
  onAddMedia,
  onRemoveMedia,
  onOpenEntry,
}: ChineseTodayProps) {
  const [traditional, setTraditional] = useState("");
  const [meaning, setMeaning] = useState("");
  const [savingEntry, setSavingEntry] = useState(false);

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

      <section className="chinese-today-hero chinese-anki-row">
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
      </section>

      <section className="chinese-today-lower">
        <ChineseMediaShelf resources={mediaResources} onAdd={onAddMedia} onRemove={onRemoveMedia} />

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
