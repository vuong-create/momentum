import { useMemo, useState } from "react";

import type { ChineseEntry } from "../../../database/db";
import { buildChinesePracticeQueue } from "../services/chineseEntryService";
import { speakTraditionalChinese } from "../services/pronunciationService";

type Props = {
  entries: ChineseEntry[];
  onMark: (entry: ChineseEntry, status: "keep-practicing" | "comfortable") => Promise<void>;
};

export default function ChinesePractice({ entries, onMark }: Props) {
  const [collection, setCollection] = useState("all");
  const [activeEntryId, setActiveEntryId] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const collections = useMemo(() => [...new Set(entries.flatMap((entry) => entry.collections ?? []))].sort(), [entries]);
  const queue = useMemo(() => buildChinesePracticeQueue(entries).filter((entry) => collection === "all" || entry.collections?.includes(collection)), [collection, entries]);
  const entry = queue.find((candidate) => candidate.id === activeEntryId) ?? queue[0];
  const position = Math.max(0, queue.findIndex((candidate) => candidate.id === entry?.id));

  async function mark(status: "keep-practicing" | "comfortable") {
    if (!entry) return;
    const nextEntry = queue.length > 1 ? queue[(position + 1) % queue.length] : entry;
    await onMark(entry, status);
    setActiveEntryId(nextEntry.id ?? null);
    setRevealed(false);
  }

  return (
    <section className="chinese-practice">
      <header className="chinese-section-header">
        <div><span className="text-label">Hear · Recall · Use</span><h2>Practice Queue</h2><p>A calm review space. Practice status is guidance, not a score.</p></div>
        {collections.length > 0 && <select value={collection} onChange={(event) => { setCollection(event.target.value); setActiveEntryId(null); setRevealed(false); }}><option value="all">All collections</option>{collections.map((name) => <option key={name} value={name}>{name}</option>)}</select>}
      </header>
      {entry ? (
        <div className="chinese-practice-card">
          <div className="chinese-practice-position"><span>{String(position + 1).padStart(2, "0")} / {String(queue.length).padStart(2, "0")}</span><small>{entry.favorite ? "★ Favorite" : entry.collections?.[0] ?? "Personal database"}</small></div>
          <strong>{entry.traditional}</strong>
          {revealed ? <div className="chinese-practice-answer"><span>{entry.pinyin || "Pinyin not added"}</span><p>{entry.meaning}</p>{entry.example && <small>{entry.example}</small>}</div> : <button type="button" className="chinese-practice-reveal" onClick={() => setRevealed(true)}>Reveal meaning</button>}
          <div className="chinese-practice-actions">
            <button type="button" onClick={() => speakTraditionalChinese(entry.traditional, { rate: 0.82 })}>♪ Hear</button>
            <i />
            <button type="button" onClick={() => mark("keep-practicing")}>Keep practicing</button>
            <button type="button" className="is-primary" onClick={() => mark("comfortable")}>Comfortable</button>
          </div>
        </div>
      ) : <div className="chinese-database-empty"><strong>Your Practice Queue is ready when your database is.</strong><span>Add a word or phrase first.</span></div>}
      <p className="chinese-practice-footnote">Queue reviews do not create XP or alter your Chinese streak.</p>
    </section>
  );
}
