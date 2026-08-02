import { useMemo, useState, type DragEvent } from "react";

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
  const [pronunciationEntryId, setPronunciationEntryId] = useState<number | null>(
    entries[0]?.id ?? null
  );
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const pronunciationEntry = entries.find(({ id }) => id === pronunciationEntryId) ?? entries[0];
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

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsDraggingOver(false);
    const id = Number(event.dataTransfer.getData("application/x-momentum-chinese-entry"));
    if (entries.some((entry) => entry.id === id)) setPronunciationEntryId(id);
  }

  function hearEntry(entry: ChineseEntry) {
    setPronunciationEntryId(entry.id ?? null);
    speakTraditionalChinese(entry.traditional);
  }

  return (
    <section className="chinese-database">
      <header className="chinese-section-header">
        <div><span className="text-label">Personal language</span><h2>Words & phrases</h2><p>Traditional Chinese that is useful, personal, and worth finding again.</p></div>
        <button type="button" onClick={onAdd}>＋ Add entry</button>
      </header>

      <section
        className={`chinese-pronunciation-workspace${isDraggingOver ? " is-dragging-over" : ""}`}
        onDragEnter={(event) => { event.preventDefault(); setIsDraggingOver(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsDraggingOver(false);
          }
        }}
        onDrop={handleDrop}
        aria-label="Pronunciation workspace"
      >
        <div>
          <span className="text-label">Pronunciation studio</span>
          <p>Drag any database entry here, or use its sound button.</p>
        </div>
        {pronunciationEntry ? (
          <button type="button" onClick={() => hearEntry(pronunciationEntry)}>
            <span>
              <strong>{pronunciationEntry.traditional}</strong>
              <i>{pronunciationEntry.pinyin || "Pinyin not added"}</i>
              <small>{pronunciationEntry.meaning}</small>
            </span>
            <b aria-hidden="true">♪</b>
          </button>
        ) : (
          <div className="chinese-pronunciation-workspace-empty">
            <strong>拖到這裡</strong>
            <span>Add an entry, then drop it here to hear it.</span>
          </div>
        )}
      </section>

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
            <article
              key={entry.id}
              draggable
              className={entry.id === pronunciationEntry?.id ? "is-pronouncing" : ""}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "copy";
                event.dataTransfer.setData("application/x-momentum-chinese-entry", String(entry.id));
                event.dataTransfer.setData("text/plain", entry.traditional);
              }}
            >
              <button type="button" className="chinese-entry-open" onClick={() => onOpen(entry)}>
                <strong>{entry.traditional}</strong>
                <span>{entry.pinyin || "—"}</span>
                <p>{entry.meaning}</p>
                <small>{entry.tags.slice(0, 2).join(" · ") || entry.source || entry.entryType}</small>
              </button>
              <button type="button" className="chinese-entry-speak" onClick={() => hearEntry(entry)} aria-label={`Hear ${entry.traditional}`}>♪</button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
