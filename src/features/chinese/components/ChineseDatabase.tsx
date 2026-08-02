import { useMemo, useState } from "react";

import type { ChineseEntry, ChineseEntryType } from "../../../database/db";
import { speakTraditionalChinese } from "../services/pronunciationService";

type EntryFilter = "all" | ChineseEntryType;

type ChineseDatabaseProps = {
  entries: ChineseEntry[];
  onAdd: () => void;
  onOpen: (entry: ChineseEntry) => void;
};

export default function ChineseDatabase({ entries, onAdd, onOpen }: ChineseDatabaseProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<EntryFilter>("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const sources = useMemo(
    () => [...new Set(entries.flatMap((entry) => entry.source ? [entry.source] : []))].sort(),
    [entries]
  );
  const filteredEntries = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return entries.filter((entry) => {
      const matchesSearch = !search || [
        entry.traditional,
        entry.pinyin,
        entry.meaning,
        entry.example,
        entry.notes,
        ...entry.tags,
      ].filter(Boolean).join(" ").toLocaleLowerCase().includes(search);
      const matchesType = typeFilter === "all" || entry.entryType === typeFilter;
      const matchesSource = sourceFilter === "all" || entry.source === sourceFilter;
      return matchesSearch && matchesType && matchesSource;
    });
  }, [entries, query, sourceFilter, typeFilter]);

  return (
    <section className="chinese-database">
      <header className="chinese-section-header">
        <div><span className="text-label">Personal language</span><h2>Words & phrases</h2><p>Traditional Chinese that is useful, personal, and worth finding again.</p></div>
        <button type="button" onClick={onAdd}>＋ Add entry</button>
      </header>

      <div className="chinese-database-toolbar">
        <label className="chinese-database-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Chinese, pinyin, meaning, or tags" aria-label="Search Chinese database" /></label>
        <fieldset>
          {(["all", "word", "phrase"] as EntryFilter[]).map((filter) => (
            <button key={filter} type="button" className={typeFilter === filter ? "is-selected" : ""} onClick={() => setTypeFilter(filter)}>{filter === "all" ? "All" : filter === "word" ? "Words" : "Phrases"}</button>
          ))}
        </fieldset>
        {sources.length > 0 && (
          <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} aria-label="Filter by source">
            <option value="all">All sources</option>
            {sources.map((source) => <option key={source} value={source}>{source}</option>)}
          </select>
        )}
      </div>

      <div className="chinese-database-meta"><span>{filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"}</span><small>Newest first</small></div>

      {filteredEntries.length === 0 ? (
        <div className="chinese-database-empty"><strong>{entries.length === 0 ? "Start with something you heard today." : "No entries match this view."}</strong><span>{entries.length === 0 ? "Two fields, then you’re done." : "Try a broader search or clear a filter."}</span>{entries.length === 0 && <button type="button" onClick={onAdd}>Add first entry</button>}</div>
      ) : (
        <div className="chinese-entry-table">
          <div className="chinese-entry-table-head"><span>Traditional</span><span>Pinyin</span><span>Meaning</span><span>Context</span><span /></div>
          {filteredEntries.map((entry) => (
            <article key={entry.id}>
              <button type="button" className="chinese-entry-open" onClick={() => onOpen(entry)}>
                <strong>{entry.traditional}</strong>
                <span>{entry.pinyin || "—"}</span>
                <p>{entry.meaning}</p>
                <small>{entry.tags.slice(0, 2).join(" · ") || entry.source || entry.entryType}</small>
              </button>
              <button type="button" className="chinese-entry-speak" onClick={() => speakTraditionalChinese(entry.traditional)} aria-label={`Hear ${entry.traditional}`}>♪</button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
