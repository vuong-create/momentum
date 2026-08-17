import { useMemo, useState } from "react";

import type { ChineseEntry, ChineseEntryType } from "../../../database/db";
import ChinesePronunciationStudio from "./ChinesePronunciationStudio";
import { speakTraditionalChinese } from "../services/pronunciationService";

type EntryFilter = "all" | ChineseEntryType;

type ChineseDatabaseProps = {
  entries: ChineseEntry[];
  onAdd: () => void;
  onOpen: (entry: ChineseEntry) => void;
  onToggleFavorite: (entry: ChineseEntry) => Promise<void>;
};

type SortOrder = "newest" | "alphabetical" | "practice";

export default function ChineseDatabase({ entries, onAdd, onOpen, onToggleFavorite }: ChineseDatabaseProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<EntryFilter>("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [collectionFilter, setCollectionFilter] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [pronunciationEntryId, setPronunciationEntryId] = useState<number | null>(
    entries[0]?.id ?? null
  );
  const pronunciationEntry = entries.find(({ id }) => id === pronunciationEntryId) ?? entries[0];
  const sources = useMemo(
    () => [...new Set(entries.flatMap((entry) => entry.source ? [entry.source] : []))].sort(),
    [entries]
  );
  const collections = useMemo(
    () => [...new Set(entries.flatMap((entry) => entry.collections ?? []))].sort(),
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
        ...(entry.collections ?? []),
      ].filter(Boolean).join(" ").toLocaleLowerCase().includes(search);
      const matchesType = typeFilter === "all" || entry.entryType === typeFilter;
      const matchesSource = sourceFilter === "all" || entry.source === sourceFilter;
      const matchesCollection = collectionFilter === "all" || entry.collections?.includes(collectionFilter);
      return matchesSearch && matchesType && matchesSource && matchesCollection && (!favoritesOnly || entry.favorite);
    }).sort((first, second) => {
      if (sortOrder === "alphabetical") return first.traditional.localeCompare(second.traditional, "zh-Hant");
      if (sortOrder === "practice") return (first.lastPracticedAt ?? "").localeCompare(second.lastPracticedAt ?? "");
      return second.createdAt.localeCompare(first.createdAt);
    });
  }, [collectionFilter, entries, favoritesOnly, query, sortOrder, sourceFilter, typeFilter]);

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

      <ChinesePronunciationStudio entries={entries} selectedEntryId={pronunciationEntry?.id ?? null} onSelectEntry={setPronunciationEntryId} />

      <div className="chinese-database-toolbar">
        <label className="chinese-database-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Chinese, pinyin, meaning, or tags" aria-label="Search Chinese database" /></label>
        <fieldset>
          {(["all", "word", "phrase"] as EntryFilter[]).map((filter) => (
            <button key={filter} type="button" className={typeFilter === filter ? "is-selected" : ""} onClick={() => setTypeFilter(filter)}>{filter === "all" ? "All" : filter === "word" ? "Words" : "Phrases"}</button>
          ))}
        </fieldset>
        <button type="button" className={`chinese-favorite-filter${favoritesOnly ? " is-selected" : ""}`} onClick={() => setFavoritesOnly((current) => !current)}>★ Favorites</button>
        {sources.length > 0 && (
          <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} aria-label="Filter by source">
            <option value="all">All sources</option>
            {sources.map((source) => <option key={source} value={source}>{source}</option>)}
          </select>
        )}
        {collections.length > 0 && (
          <select value={collectionFilter} onChange={(event) => setCollectionFilter(event.target.value)} aria-label="Filter by collection">
            <option value="all">All collections</option>
            {collections.map((collection) => <option key={collection} value={collection}>{collection}</option>)}
          </select>
        )}
        <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)} aria-label="Sort entries">
          <option value="newest">Newest</option><option value="alphabetical">A–Z</option><option value="practice">Needs practice</option>
        </select>
      </div>

      <div className="chinese-database-meta"><span>{filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"}</span><small>{favoritesOnly || collectionFilter !== "all" ? "Focused view" : "Personal language archive"}</small></div>

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
                <small>{entry.collections?.slice(0, 2).join(" · ") || entry.tags.slice(0, 2).join(" · ") || entry.source || entry.entryType}</small>
              </button>
              <button type="button" className={`chinese-entry-favorite${entry.favorite ? " is-favorite" : ""}`} onClick={() => onToggleFavorite(entry)} aria-label={entry.favorite ? `Remove ${entry.traditional} from favorites` : `Favorite ${entry.traditional}`}>★</button>
              <button type="button" className="chinese-entry-speak" onClick={() => hearEntry(entry)} aria-label={`Hear ${entry.traditional}`}>♪</button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
