import { useRef, useState, type FormEvent } from "react";

import type { SavedQuote } from "../../../database/db";
import { getDailyQuote, momentumQuotes } from "../../home/quotes";
import { reflectionPrompts, toJournalDateKey } from "../services/journalService";

type JournalTodayProps = {
  now: Date;
  savedQuotes: SavedQuote[];
  onSave: (input: { title?: string; text: string; entryDate: string }) => Promise<void>;
  onToggleQuote: (quote: { id: string; text: string; author: string }) => Promise<void>;
};

export default function JournalToday({ now, savedQuotes, onSave, onToggleQuote }: JournalTodayProps) {
  const dateKey = toJournalDateKey(now);
  const initialQuote = getDailyQuote(dateKey);
  const [quoteIndex, setQuoteIndex] = useState(() => momentumQuotes.findIndex((quote) => quote.id === initialQuote.id));
  const [promptIndex, setPromptIndex] = useState(() => now.getDate() % reflectionPrompts.length);
  const [title, setTitle] = useState("");
  const [text, setText] = useState(() => localStorage.getItem("momentum-journal-draft") ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const quote = momentumQuotes[quoteIndex];
  const quoteSaved = savedQuotes.some((savedQuote) => savedQuote.quoteKey === quote.id && !savedQuote.deletedAt);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim() || saving) return;
    setSaving(true);
    try {
      await onSave({ title: title.trim() || undefined, text: text.trim(), entryDate: dateKey });
      setTitle("");
      setText("");
      localStorage.removeItem("momentum-journal-draft");
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="journal-today-layout">
      <form className="journal-notebook" onSubmit={handleSubmit}>
        <div className="journal-notebook-binding" aria-hidden="true" />
        <header>
          <span>Today’s page</span>
          <h2 className="font-quote">{new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(now)}</h2>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Optional title" aria-label="Optional journal title" />
        </header>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            localStorage.setItem("momentum-journal-draft", event.target.value);
          }}
          placeholder="Start writing…"
          aria-label="Journal entry"
        />
        <footer>
          <span>{text.trim() ? `${text.trim().split(/\s+/).length} words` : "A quiet page is welcome too."}</span>
          {saved && <small>✓ Entry saved</small>}
          <button type="submit" disabled={!text.trim() || saving}>{saving ? "Saving…" : "Save entry"}</button>
        </footer>
      </form>

      <aside className="journal-today-margin">
        <section className="journal-quote-note">
          <span className="text-label">Today’s quote</span>
          <blockquote className="font-quote">“{quote.text}”</blockquote>
          <cite className="font-quote">— {quote.author}</cite>
          <div>
            <button type="button" onClick={() => onToggleQuote(quote)}>{quoteSaved ? "♥ Saved" : "♡ Save"}</button>
            <button type="button" onClick={() => setQuoteIndex((current) => (current + 1) % momentumQuotes.length)}>Another</button>
          </div>
        </section>

        <section className="journal-prompt-card">
          <span className="text-label">A gentle prompt</span>
          <p className="font-quote">{reflectionPrompts[promptIndex]}</p>
          <div>
            <button type="button" onClick={() => textareaRef.current?.focus()}>Write</button>
            <button type="button" onClick={() => setPromptIndex((current) => (current + 1) % reflectionPrompts.length)}>Another</button>
          </div>
        </section>
      </aside>
    </div>
  );
}
