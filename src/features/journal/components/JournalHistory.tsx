import { useMemo, useState } from "react";

import type { JournalEntry } from "../../../database/db";
import { toJournalDateKey } from "../services/journalService";
import JournalEntryCard from "./JournalEntryCard";

type JournalHistoryProps = {
  entries: JournalEntry[];
  onOpen: (entry: JournalEntry) => void;
};

export default function JournalHistory({ entries, onOpen }: JournalHistoryProps) {
  const [query, setQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const entryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    entries.forEach((entry) => counts.set(entry.entryDate, (counts.get(entry.entryDate) ?? 0) + 1));
    return counts;
  }, [entries]);

  const filtered = entries.filter((entry) => {
    const matchesDate = !selectedDate || entry.entryDate === selectedDate;
    const normalized = query.trim().toLowerCase();
    const matchesQuery = !normalized || `${entry.title ?? ""} ${entry.text}`.toLowerCase().includes(normalized);
    return matchesDate && matchesQuery;
  });

  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstDay + 1;
    if (day < 1 || day > daysInMonth) return null;
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    return { day, dateKey: toJournalDateKey(date) };
  });

  function moveMonth(direction: -1 | 1) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
    setSelectedDate(null);
  }

  return (
    <div className="journal-history-layout">
      <aside className="journal-calendar-card">
        <header>
          <button type="button" onClick={() => moveMonth(-1)} aria-label="Previous month">←</button>
          <strong>{new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(month)}</strong>
          <button type="button" onClick={() => moveMonth(1)} aria-label="Next month">→</button>
        </header>
        <div className="journal-calendar-weekdays">{["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
        <div className="journal-calendar-grid">
          {cells.map((cell, index) => cell ? (
            <button key={cell.dateKey} type="button" className={`${entryCounts.has(cell.dateKey) ? "has-entry" : ""} ${selectedDate === cell.dateKey ? "is-selected" : ""}`} onClick={() => setSelectedDate((current) => current === cell.dateKey ? null : cell.dateKey)}>
              {cell.day}
              {entryCounts.has(cell.dateKey) && <i />}
            </button>
          ) : <span key={`empty-${index}`} />)}
        </div>
        <footer><span>{entries.length}</span> {entries.length === 1 ? "entry" : "entries"} remembered</footer>
      </aside>

      <section className="journal-history-list">
        <header>
          <div><span className="text-label">Your pages</span><h2 className="font-pixel">Journal</h2></div>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search memories…" aria-label="Search journal entries" />
        </header>
        {selectedDate && <button type="button" className="journal-date-filter" onClick={() => setSelectedDate(null)}>Showing {new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(`${selectedDate}T00:00:00`))} ×</button>}
        <div className="journal-entry-list">
          {filtered.length > 0 ? filtered.map((entry) => <JournalEntryCard key={entry.id} entry={entry} onOpen={onOpen} />) : (
            <div className="journal-empty-state"><strong>No pages found.</strong><span>Your memories will gather here naturally.</span></div>
          )}
        </div>
      </section>
    </div>
  );
}
