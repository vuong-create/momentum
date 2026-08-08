import type { JournalEntry } from "../../../database/db";
import { formatJournalDate } from "../dateFormatting";
import { getJournalCategory } from "../journalPrompts";

type JournalEntryCardProps = {
  entry: JournalEntry;
  onOpen: (entry: JournalEntry) => void;
};

export default function JournalEntryCard({ entry, onOpen }: JournalEntryCardProps) {
  const category = getJournalCategory(entry.category);

  return (
    <article className="journal-entry-card">
      <button type="button" onClick={() => onOpen(entry)}>
        <span className="journal-entry-card-meta">
          <span className="journal-entry-date">{formatJournalDate(entry.entryDate)}</span>
          {category && <span className={`journal-category-badge journal-category-${category.id}`}>{category.mark} {category.label}</span>}
        </span>
        {entry.title && <h3>{entry.title}</h3>}
        <p>{entry.text}</p>
        <small>
          {new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }).format(new Date(entry.createdAt))}
          <span>Open entry →</span>
        </small>
      </button>
    </article>
  );
}
