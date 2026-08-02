import { useState, type FormEvent } from "react";

import type { SavedQuote } from "../../../database/db";

type JournalQuotesProps = {
  quotes: SavedQuote[];
  onAdd: (input: { text: string; author?: string; source?: string }) => Promise<void>;
  onFavorite: (quote: SavedQuote) => Promise<void>;
  onDelete: (quote: SavedQuote) => Promise<void>;
};

export default function JournalQuotes({ quotes, onAdd, onFavorite, onDelete }: JournalQuotesProps) {
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [source, setSource] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [adding, setAdding] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim() || adding) return;
    setAdding(true);
    try {
      await onAdd({ text, author, source });
      setText(""); setAuthor(""); setSource("");
    } finally { setAdding(false); }
  }

  const visible = favoritesOnly ? quotes.filter((quote) => quote.favorite) : quotes;

  return (
    <div className="journal-quotes-layout">
      <form className="journal-quote-composer" onSubmit={handleSubmit}>
        <span className="text-label">Keep a line</span>
        <h2 className="font-pixel">Add a Quote</h2>
        <textarea value={text} onChange={(event) => setText(event.target.value)} rows={5} placeholder="A line worth returning to…" aria-label="Quote text" />
        <div><input value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="Author" aria-label="Quote author" /><input value={source} onChange={(event) => setSource(event.target.value)} placeholder="Source, optional" aria-label="Quote source" /></div>
        <button type="submit" disabled={!text.trim() || adding}>{adding ? "Saving…" : "Save quote"}</button>
      </form>

      <section className="journal-quotes-collection">
        <header><div><span className="text-label">Collected perspective</span><h2 className="font-pixel">Quotes</h2></div><button type="button" className={favoritesOnly ? "is-selected" : ""} onClick={() => setFavoritesOnly((current) => !current)}>★ Favorites</button></header>
        <div className="journal-quote-grid">
          {visible.length > 0 ? visible.map((quote) => (
            <article key={quote.id} className={quote.favorite ? "is-favorite" : ""}>
              <blockquote className="font-quote">“{quote.text}”</blockquote>
              <cite className="font-quote">— {quote.author}{quote.source ? `, ${quote.source}` : ""}</cite>
              <footer><span>{quote.isBuiltIn ? "Momentum" : "Personal"}</span><button type="button" onClick={() => onFavorite(quote)}>{quote.favorite ? "★" : "☆"}</button><button type="button" onClick={() => onDelete(quote)}>Remove</button></footer>
            </article>
          )) : <div className="journal-empty-state"><strong>No quotes here yet.</strong><span>Save one from Home or add a line of your own.</span></div>}
        </div>
      </section>
    </div>
  );
}
