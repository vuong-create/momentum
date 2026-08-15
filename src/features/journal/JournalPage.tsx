import { useCallback, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import { db, type JournalEntry, type LibraryBook, type LibraryWishlistItem, type SavedQuote } from "../../database/db";
import useExperience from "../../experience/useExperience";
import ActivityUndoToast from "../activities/components/ActivityUndoToast";
import useActivityUndo from "../activities/hooks/useActivityUndo";
import JournalEntryModal from "./components/JournalEntryModal";
import JournalHistory from "./components/JournalHistory";
import JournalLibrary from "./components/JournalLibrary";
import JournalLookBack from "./components/JournalLookBack";
import JournalQuotes from "./components/JournalQuotes";
import JournalToday from "./components/JournalToday";
import JournalWishlist from "./components/JournalWishlist";
import {
  createJournalEntry,
  restoreJournalEntry,
  softDeleteJournalEntry,
  updateJournalEntry,
  visibleJournalEntries,
  type JournalEntryInput,
} from "./services/journalService";
import {
  createLibraryBook,
  restoreLibraryBook,
  softDeleteLibraryBook,
  updateLibraryBook,
  visibleLibraryBooks,
  type LibraryBookInput,
} from "./services/libraryService";
import {
  createPersonalQuote,
  restoreQuote,
  softDeleteQuote,
  toggleBuiltInQuote,
  toggleQuoteFavorite,
  visibleQuotes,
} from "./services/quoteService";
import {
  createWishlistItem,
  restoreWishlistItem,
  setWishlistItemStatus,
  softDeleteWishlistItem,
  updateWishlistItem,
  visibleWishlistItems,
  type WishlistItemInput,
} from "./services/wishlistService";

import "./journal.css";

type JournalView = "today" | "journal" | "library" | "wishlist" | "look-back" | "quotes";

const journalTabs: { id: JournalView; label: string }[] = [
  { id: "today", label: "Write" },
  { id: "journal", label: "Journal" },
  { id: "library", label: "Books" },
  { id: "wishlist", label: "Wish List" },
  { id: "look-back", label: "Look Back" },
  { id: "quotes", label: "Quotes" },
];

function getInitialView(): JournalView {
  const stored = sessionStorage.getItem("momentum.journal.tab");
  return journalTabs.some((tab) => tab.id === stored) ? stored as JournalView : "today";
}

export default function JournalPage() {
  const experience = useExperience();
  const undo = useActivityUndo();
  const [view, setView] = useState<JournalView>(getInitialView);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const allEntries = useLiveQuery(() => db.journalEntries.toArray(), []) ?? [];
  const allQuotes = useLiveQuery(() => db.savedQuotes.toArray(), []) ?? [];
  const allBooks = useLiveQuery(() => db.libraryBooks.toArray(), []) ?? [];
  const allWishlistItems = useLiveQuery(() => db.libraryWishlistItems.toArray(), []) ?? [];
  const entries = visibleJournalEntries(allEntries);
  const quotes = visibleQuotes(allQuotes);
  const books = visibleLibraryBooks(allBooks);
  const wishlistItems = visibleWishlistItems(allWishlistItems);

  function selectView(nextView: JournalView) {
    setView(nextView);
    sessionStorage.setItem("momentum.journal.tab", nextView);
  }

  async function saveNewEntry(input: JournalEntryInput) {
    await createJournalEntry(input);
    experience.playFeedback("library-saved");
  }

  async function saveEntry(entry: JournalEntry, patch: Partial<Pick<JournalEntry, "title" | "text" | "entryDate" | "category" | "promptId">> & { text: string; entryDate: string }) {
    if (!entry.id) return;
    const previous = {
      title: entry.title,
      text: entry.text,
      entryDate: entry.entryDate,
      category: entry.category,
      promptId: entry.promptId,
    };
    await updateJournalEntry(entry.id, patch);
    experience.playFeedback("library-saved");
    undo.show({ message: "Journal entry updated", undo: () => updateJournalEntry(entry.id!, previous) });
  }

  async function deleteEntry(entry: JournalEntry) {
    if (!entry.id) return;
    await softDeleteJournalEntry(entry.id);
    experience.playFeedback("library-removed");
    undo.show({ message: "Journal entry removed", undo: () => restoreJournalEntry(entry.id!) });
  }

  async function addQuote(input: { text: string; author?: string; source?: string }) {
    await createPersonalQuote(input);
    experience.playFeedback("library-saved");
  }

  async function favoriteQuote(quote: SavedQuote) {
    if (!quote.id) return;
    await toggleQuoteFavorite(quote.id);
    experience.playFeedback("library-saved");
  }

  async function deleteQuote(quote: SavedQuote) {
    if (!quote.id) return;
    await softDeleteQuote(quote.id);
    experience.playFeedback("library-removed");
    undo.show({ message: "Quote removed", undo: () => restoreQuote(quote.id!) });
  }

  async function saveBook(book: LibraryBook | null, input: LibraryBookInput) {
    if (book?.id) {
      await updateLibraryBook(book.id, input);
      experience.playFeedback("library-saved");
      return;
    }
    await createLibraryBook(input);
    experience.playFeedback("library-saved");
  }

  async function deleteBook(book: LibraryBook) {
    if (!book.id) return;
    await softDeleteLibraryBook(book.id);
    experience.playFeedback("library-removed");
    undo.show({ message: "Book removed from Library", undo: () => restoreLibraryBook(book.id!) });
  }

  async function journalizeBook(book: LibraryBook) {
    if (!book.id || !book.reflection?.trim()) return;
    const entryId = await createJournalEntry({
      title: `Book: ${book.title}`,
      text: [book.reflection.trim(), book.favoriteQuote?.trim() ? `Favorite line: “${book.favoriteQuote.trim()}”` : ""].filter(Boolean).join("\n\n"),
      entryDate: book.finishedDate || book.startedDate,
      category: "books",
    });
    await updateLibraryBook(book.id, {
      title: book.title,
      author: book.author,
      status: book.status,
      startedDate: book.startedDate,
      finishedDate: book.finishedDate,
      reflection: book.reflection,
      favoriteQuote: book.favoriteQuote,
      linkedJournalEntryId: entryId,
      spineTone: book.spineTone,
    });
    experience.playFeedback("library-saved");
    undo.show({
      message: "Book reflection saved to Journal",
      undo: async () => {
        await softDeleteJournalEntry(entryId);
        await updateLibraryBook(book.id!, {
          title: book.title,
          author: book.author,
          status: book.status,
          startedDate: book.startedDate,
          finishedDate: book.finishedDate,
          reflection: book.reflection,
          favoriteQuote: book.favoriteQuote,
          linkedJournalEntryId: undefined,
          spineTone: book.spineTone,
        });
      },
    });
  }

  async function saveWishlistItem(item: LibraryWishlistItem | null, input: WishlistItemInput) {
    if (item?.id) await updateWishlistItem(item.id, input);
    else await createWishlistItem(input);
    experience.playFeedback("library-saved");
  }

  async function deleteWishlistItem(item: LibraryWishlistItem) {
    if (!item.id) return;
    await softDeleteWishlistItem(item.id);
    experience.playFeedback("library-removed");
    undo.show({ message: "Wish removed from Library", undo: () => restoreWishlistItem(item.id!) });
  }

  async function changeWishlistStatus(item: LibraryWishlistItem, status: LibraryWishlistItem["status"]) {
    if (!item.id) return;
    await setWishlistItemStatus(item.id, status);
    experience.playFeedback("library-saved");
  }

  const closeEntry = useCallback(() => setSelectedEntry(null), []);

  return (
    <div className="journal-page">
      <header className="journal-header">
        <div>
          <span className="text-label">Your inner world</span>
          <h1 className="font-pixel">Library</h1>
          <p>Write · Remember · Collect</p>
        </div>
        <div className="journal-header-kept"><span>{entries.length}</span><small>{entries.length === 1 ? "memory kept" : "memories kept"}</small></div>
      </header>

      <nav className="journal-tabs" aria-label="Library sections">
        {journalTabs.map((tab) => (
          <button key={tab.id} type="button" className={view === tab.id ? "is-selected" : ""} onClick={() => selectView(tab.id)}>
            {tab.label}
            {tab.id === "library" && books.length > 0 && <span>{books.length}</span>}
            {tab.id === "wishlist" && wishlistItems.length > 0 && <span>{wishlistItems.length}</span>}
            {tab.id === "quotes" && quotes.length > 0 && <span>{quotes.length}</span>}
          </button>
        ))}
      </nav>

      <main className="journal-content">
        {view === "today" && <JournalToday now={experience.now} savedQuotes={allQuotes} onSave={saveNewEntry} onToggleQuote={async (quote) => { await toggleBuiltInQuote(quote); experience.playFeedback("library-saved"); }} />}
        {view === "journal" && <JournalHistory entries={entries} onOpen={setSelectedEntry} />}
        {view === "library" && <JournalLibrary books={books} onSave={saveBook} onDelete={deleteBook} onJournalize={journalizeBook} />}
        {view === "wishlist" && <JournalWishlist items={wishlistItems} onSave={saveWishlistItem} onDelete={deleteWishlistItem} onStatusChange={changeWishlistStatus} />}
        {view === "look-back" && <JournalLookBack entries={entries} now={experience.now} onOpen={setSelectedEntry} />}
        {view === "quotes" && <JournalQuotes quotes={quotes} onAdd={addQuote} onFavorite={favoriteQuote} onDelete={deleteQuote} />}
      </main>

      <JournalEntryModal entry={selectedEntry} onClose={closeEntry} onSave={saveEntry} onDelete={deleteEntry} />
      <ActivityUndoToast notice={undo.notice} onDismiss={undo.dismiss} onUndo={undo.undo} />
    </div>
  );
}
