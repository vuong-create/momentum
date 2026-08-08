import { useMemo, useRef, useState, type FormEvent } from "react";

import type { JournalEntryCategory, SavedQuote } from "../../../database/db";
import { getDailyQuote, momentumQuotes } from "../../home/quotes";
import { journalCategories, journalPrompts } from "../journalPrompts";
import { toJournalDateKey, type JournalEntryInput } from "../services/journalService";
import JournalCategorySelect from "./JournalCategorySelect";

type JournalTodayProps = {
  now: Date;
  savedQuotes: SavedQuote[];
  onSave: (input: JournalEntryInput) => Promise<void>;
  onToggleQuote: (quote: { id: string; text: string; author: string }) => Promise<void>;
};

export default function JournalToday({ now, savedQuotes, onSave, onToggleQuote }: JournalTodayProps) {
  const dateKey = toJournalDateKey(now);
  const initialQuote = getDailyQuote(dateKey);
  const [quoteIndex, setQuoteIndex] = useState(() => momentumQuotes.findIndex((quote) => quote.id === initialQuote.id));
  const [promptCategory, setPromptCategory] = useState<JournalEntryCategory | "all">("all");
  const [selectedPromptId, setSelectedPromptId] = useState<string>();
  const [category, setCategory] = useState<JournalEntryCategory>();
  const [title, setTitle] = useState("");
  const [text, setText] = useState(() => localStorage.getItem("momentum-journal-draft") ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const quote = momentumQuotes[quoteIndex];
  const quoteSaved = savedQuotes.some((savedQuote) => savedQuote.quoteKey === quote.id && !savedQuote.deletedAt);
  const visiblePrompts = useMemo(
    () => promptCategory === "all" ? journalPrompts : journalPrompts.filter((prompt) => prompt.category === promptCategory),
    [promptCategory]
  );

  function updateText(nextText: string) {
    setText(nextText);
    localStorage.setItem("momentum-journal-draft", nextText);
  }

  function applyPrompt(promptId: string) {
    const prompt = journalPrompts.find((option) => option.id === promptId);
    if (!prompt) return;
    if (selectedPromptId === prompt.id && text.trim()) {
      textareaRef.current?.focus();
      return;
    }

    const nextText = text.trim()
      ? `${text.trimEnd()}\n\n${prompt.template}`
      : prompt.template;

    setSelectedPromptId(prompt.id);
    setCategory(prompt.category);
    setTitle((current) => current.trim() ? current : prompt.suggestedTitle);
    updateText(nextText);
    window.setTimeout(() => textareaRef.current?.focus(), 0);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim() || saving) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim() || undefined,
        text: text.trim(),
        entryDate: dateKey,
        category,
        promptId: selectedPromptId,
      });
      setTitle("");
      setText("");
      setCategory(undefined);
      setSelectedPromptId(undefined);
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
          <JournalCategorySelect value={category} onChange={setCategory} compact />
        </header>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(event) => updateText(event.target.value)}
          placeholder="Write freely, or choose a prompt…"
          aria-label="Journal entry"
        />
        <footer>
          <span>{text.trim() ? `${text.trim().split(/\s+/).length} words` : "A quiet page is welcome too."}</span>
          {saved && <small>✓ Entry saved</small>}
          <button type="submit" disabled={!text.trim() || saving}>{saving ? "Saving…" : "Save entry"}</button>
        </footer>
      </form>

      <aside className="journal-today-margin">
        <section className="journal-prompt-library">
          <header>
            <div>
              <span className="text-label">Prompt library</span>
              <h3>Choose a way in.</h3>
            </div>
            <small>A template will appear on your page.</small>
          </header>
          <div className="journal-prompt-filters" role="group" aria-label="Filter prompts">
            <button type="button" className={promptCategory === "all" ? "is-selected" : ""} onClick={() => setPromptCategory("all")}>All</button>
            {journalCategories.map((option) => (
              <button key={option.id} type="button" className={promptCategory === option.id ? "is-selected" : ""} onClick={() => setPromptCategory(option.id)} aria-label={option.label}>{option.mark}</button>
            ))}
          </div>
          <div className="journal-prompt-list">
            {visiblePrompts.map((prompt) => (
              <button
                key={prompt.id}
                type="button"
                className={selectedPromptId === prompt.id ? "is-selected" : ""}
                onClick={() => applyPrompt(prompt.id)}
              >
                <span>{journalCategories.find((option) => option.id === prompt.category)?.mark}</span>
                <span><strong>{prompt.label}</strong><small>{prompt.question}</small></span>
                <i aria-hidden="true">→</i>
              </button>
            ))}
          </div>
        </section>

        <section className="journal-quote-note">
          <span className="text-label">Today’s quote</span>
          <blockquote className="font-quote">“{quote.text}”</blockquote>
          <cite className="font-quote">— {quote.author}</cite>
          <div>
            <button type="button" onClick={() => onToggleQuote(quote)}>{quoteSaved ? "♥ Saved" : "♡ Save"}</button>
            <button type="button" onClick={() => setQuoteIndex((current) => (current + 1) % momentumQuotes.length)}>Another</button>
          </div>
        </section>
      </aside>
    </div>
  );
}
