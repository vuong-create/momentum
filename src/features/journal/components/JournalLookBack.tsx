import { useState } from "react";

import type { JournalEntry } from "../../../database/db";
import { getOnThisDayEntries, getRandomMemory } from "../services/journalService";
import JournalEntryCard from "./JournalEntryCard";

type JournalLookBackProps = {
  entries: JournalEntry[];
  now: Date;
  onOpen: (entry: JournalEntry) => void;
};

export default function JournalLookBack({ entries, now, onOpen }: JournalLookBackProps) {
  const [randomMemoryId, setRandomMemoryId] = useState<number | undefined>();
  const randomMemory = entries.find((entry) => entry.id === randomMemoryId) ?? entries[0];
  const onThisDay = getOnThisDayEntries(entries, now);
  const recent = entries.slice(0, 3);

  return (
    <div className="journal-lookback">
      <section className="journal-memory-section journal-on-this-day">
        <header><div><span className="text-label">From years before</span><h2 className="font-pixel">On This Day</h2></div><span>{onThisDay.length}</span></header>
        {onThisDay.length > 0 ? <div className="journal-memory-grid">{onThisDay.map((entry) => <JournalEntryCard key={entry.id} entry={entry} onOpen={onOpen} />)}</div> : <div className="journal-empty-state"><strong>This page is still becoming history.</strong><span>Past entries from this date will appear here in future years.</span></div>}
      </section>

      <section className="journal-random-memory">
        <div><span className="text-label">Rediscover</span><h2 className="font-pixel">Random Memory</h2></div>
        {randomMemory ? <JournalEntryCard entry={randomMemory} onOpen={onOpen} /> : <div className="journal-empty-state"><strong>No memories yet.</strong><span>Write a page when something feels worth keeping.</span></div>}
        <button type="button" disabled={entries.length < 2} onClick={() => setRandomMemoryId(getRandomMemory(entries, randomMemory?.id)?.id)}>Another memory</button>
      </section>

      <section className="journal-memory-section">
        <header><div><span className="text-label">Nearby pages</span><h2 className="font-pixel">Recent Entries</h2></div></header>
        <div className="journal-memory-grid">{recent.map((entry) => <JournalEntryCard key={entry.id} entry={entry} onOpen={onOpen} />)}</div>
      </section>
    </div>
  );
}
