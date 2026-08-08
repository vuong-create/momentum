import type { JournalEntryCategory } from "../../../database/db";
import { journalCategories } from "../journalPrompts";

type JournalCategorySelectProps = {
  value?: JournalEntryCategory;
  onChange: (category?: JournalEntryCategory) => void;
  compact?: boolean;
};

export default function JournalCategorySelect({
  value,
  onChange,
  compact = false,
}: JournalCategorySelectProps) {
  return (
    <div
      className={`journal-category-select ${compact ? "is-compact" : ""}`}
      role="group"
      aria-label="Entry category"
    >
      {journalCategories.map((category) => (
        <button
          key={category.id}
          type="button"
          className={value === category.id ? "is-selected" : ""}
          onClick={() => onChange(value === category.id ? undefined : category.id)}
          aria-pressed={value === category.id}
        >
          <span aria-hidden="true">{category.mark}</span>
          {category.label}
        </button>
      ))}
    </div>
  );
}
