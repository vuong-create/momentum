import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";

import type {
  BookSpineTone,
  LibraryBook,
  LibraryBookStatus,
} from "../../../database/db";
import type { LibraryBookInput } from "../services/libraryService";

type JournalLibraryProps = {
  books: LibraryBook[];
  onSave: (book: LibraryBook | null, input: LibraryBookInput) => Promise<void>;
  onDelete: (book: LibraryBook) => Promise<void>;
  onJournalize: (book: LibraryBook) => Promise<void>;
};

const statusLabels: Record<LibraryBookStatus, string> = {
  "want-to-read": "Want to read",
  reading: "Reading",
  finished: "Finished",
};

const spineTones: BookSpineTone[] = ["stone", "umber", "sage", "navy", "wine"];

function BookModal({
  book,
  onClose,
  onSave,
  onDelete,
  onJournalize,
}: {
  book: LibraryBook | null;
  onClose: () => void;
  onSave: JournalLibraryProps["onSave"];
  onDelete: JournalLibraryProps["onDelete"];
  onJournalize: JournalLibraryProps["onJournalize"];
}) {
  const [title, setTitle] = useState(book?.title ?? "");
  const [author, setAuthor] = useState(book?.author ?? "");
  const [status, setStatus] = useState<LibraryBookStatus>(book?.status ?? "want-to-read");
  const [startedDate, setStartedDate] = useState(book?.startedDate ?? "");
  const [finishedDate, setFinishedDate] = useState(book?.finishedDate ?? "");
  const [reflection, setReflection] = useState(book?.reflection ?? "");
  const [favoriteQuote, setFavoriteQuote] = useState(book?.favoriteQuote ?? "");
  const [spineTone, setSpineTone] = useState<BookSpineTone>(book?.spineTone ?? "stone");
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await onSave(book, {
        title,
        author,
        status,
        startedDate,
        finishedDate,
        reflection,
        favoriteQuote,
        linkedJournalEntryId: book?.linkedJournalEntryId,
        spineTone,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const target = document.querySelector(".experience-root") ?? document.body;

  return createPortal(
    <div className="journal-modal-layer">
      <button type="button" className="journal-modal-backdrop" onClick={onClose} aria-label="Close book" />
      <form className="journal-entry-modal journal-book-modal" onSubmit={handleSubmit}>
        <header>
          <div>
            <span className="text-label">Personal library</span>
            <h2>{book ? "Open this book" : "Add a book"}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </header>

        <div className="journal-entry-modal-body">
          <div className="journal-book-fields">
            <label><span>Title</span><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Book title" /></label>
            <label><span>Author</span><input value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="Author, optional" /></label>
          </div>

          <fieldset className="journal-book-status">
            <legend>Place on shelf</legend>
            {Object.entries(statusLabels).map(([value, label]) => (
              <button key={value} type="button" className={status === value ? "is-selected" : ""} onClick={() => setStatus(value as LibraryBookStatus)}>{label}</button>
            ))}
          </fieldset>

          <div className="journal-book-fields">
            {status !== "want-to-read" && <label><span>Started</span><input type="date" value={startedDate} onChange={(event) => setStartedDate(event.target.value)} /></label>}
            {status === "finished" && <label><span>Finished</span><input type="date" value={finishedDate} onChange={(event) => setFinishedDate(event.target.value)} /></label>}
          </div>

          <label className="journal-entry-modal-text"><span>Reflection</span><textarea rows={5} value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="What stayed with you?" /></label>
          <label className="journal-entry-modal-text"><span>Favorite line</span><textarea rows={3} value={favoriteQuote} onChange={(event) => setFavoriteQuote(event.target.value)} placeholder="A line worth keeping, optional" /></label>

          <fieldset className="journal-spine-tones">
            <legend>Book cloth</legend>
            {spineTones.map((tone) => <button key={tone} type="button" className={`journal-tone-${tone} ${spineTone === tone ? "is-selected" : ""}`} onClick={() => setSpineTone(tone)} aria-label={`${tone} book cloth`} />)}
          </fieldset>

          {book?.linkedJournalEntryId && <p className="journal-book-linked">Reflection saved in your Journal.</p>}
        </div>

        <footer>
          {book ? <button type="button" className={confirmingDelete ? "is-confirming" : ""} onClick={async () => {
            if (!confirmingDelete) { setConfirmingDelete(true); return; }
            await onDelete(book);
            onClose();
          }}>{confirmingDelete ? "Confirm remove" : "Remove book"}</button> : <span />}
          <span />
          {book && reflection.trim() && !book.linkedJournalEntryId && <button type="button" onClick={async () => {
            await onJournalize({
              ...book,
              title: title.trim(),
              author: author.trim() || undefined,
              status,
              startedDate: startedDate || undefined,
              finishedDate: status === "finished" ? finishedDate || undefined : undefined,
              reflection: reflection.trim(),
              favoriteQuote: favoriteQuote.trim() || undefined,
              spineTone,
            });
            onClose();
          }}>Save reflection to Journal</button>}
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={!title.trim() || saving}>{saving ? "Saving…" : "Save book"}</button>
        </footer>
      </form>
    </div>,
    target
  );
}

export default function JournalLibrary({ books, onSave, onDelete, onJournalize }: JournalLibraryProps) {
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null | undefined>(undefined);
  const reading = useMemo(() => books.filter((book) => book.status === "reading"), [books]);
  const finished = useMemo(() => books.filter((book) => book.status === "finished"), [books]);
  const wantToRead = useMemo(() => books.filter((book) => book.status === "want-to-read"), [books]);

  return (
    <div className="journal-library">
      <header className="journal-library-header">
        <div><span className="text-label">Books that shape you</span><h2 className="font-pixel">My Library</h2><p>A quiet record of what you have read and what is waiting for you.</p></div>
        <div className="journal-library-summary"><span><strong>{finished.length}</strong> read</span><span><strong>{reading.length}</strong> open</span><button type="button" onClick={() => setSelectedBook(null)}>＋ Add book</button></div>
      </header>

      <section className="journal-reading-section">
        <header><span className="text-label">On your nightstand</span><h3>Currently Reading</h3></header>
        <div className="journal-reading-grid">
          {reading.length > 0 ? reading.map((book) => (
            <button key={book.id} type="button" className={`journal-reading-book journal-tone-${book.spineTone}`} onClick={() => setSelectedBook(book)}>
              <i aria-hidden="true" />
              <span><small>In progress</small><strong>{book.title}</strong><em>{book.author || "Unknown author"}</em></span>
              <b>Open →</b>
            </button>
          )) : <button type="button" className="journal-library-empty-book" onClick={() => setSelectedBook(null)}><strong>No book open right now.</strong><span>Add what you are reading when you are ready.</span></button>}
        </div>
      </section>

      <section className="journal-bookshelf-section">
        <header><div><span className="text-label">Finished pages</span><h3>Read Shelf</h3></div><span>{finished.length} {finished.length === 1 ? "book" : "books"}</span></header>
        <div className="journal-bookshelf">
          <div className="journal-book-spines">
            {finished.length > 0 ? finished.map((book, index) => (
              <button key={book.id} type="button" className={`journal-book-spine journal-tone-${book.spineTone} journal-spine-height-${index % 3}`} onClick={() => setSelectedBook(book)} title={`${book.title}${book.author ? ` — ${book.author}` : ""}`}>
                <span>{book.title}</span><small>{book.author}</small>
              </button>
            )) : <span className="journal-empty-shelf">Finished books will gather here.</span>}
          </div>
          <div className="journal-shelf-board" aria-hidden="true" />
        </div>
      </section>

      <section className="journal-want-list">
        <header><div><span className="text-label">For another season</span><h3>Want to Read</h3></div><button type="button" onClick={() => setSelectedBook(null)}>Add to list</button></header>
        {wantToRead.length > 0 ? <div>{wantToRead.map((book) => <button key={book.id} type="button" onClick={() => setSelectedBook(book)}><span>{book.title}</span><small>{book.author || "Unknown author"}</small><b>→</b></button>)}</div> : <p>Your reading list is open.</p>}
      </section>

      {selectedBook !== undefined && <BookModal book={selectedBook} onClose={() => setSelectedBook(undefined)} onSave={onSave} onDelete={onDelete} onJournalize={onJournalize} />}
    </div>
  );
}
