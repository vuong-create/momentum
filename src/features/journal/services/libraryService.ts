import { db } from "../../../database/db";
import type {
  BookSpineTone,
  LibraryBook,
  LibraryBookStatus,
} from "../../../database/db";

export type LibraryBookInput = {
  title: string;
  author?: string;
  status: LibraryBookStatus;
  startedDate?: string;
  finishedDate?: string;
  reflection?: string;
  favoriteQuote?: string;
  linkedJournalEntryId?: number;
  spineTone?: BookSpineTone;
};

const spineTones: BookSpineTone[] = ["stone", "umber", "sage", "navy", "wine"];

export async function createLibraryBook(input: LibraryBookInput) {
  if (!input.title.trim()) throw new Error("A book needs a title.");
  const now = new Date().toISOString();
  const count = await db.libraryBooks.count();

  return db.libraryBooks.add({
    title: input.title.trim(),
    author: input.author?.trim() || undefined,
    status: input.status,
    startedDate: input.startedDate || undefined,
    finishedDate: input.status === "finished" ? input.finishedDate || undefined : undefined,
    reflection: input.reflection?.trim() || undefined,
    favoriteQuote: input.favoriteQuote?.trim() || undefined,
    linkedJournalEntryId: input.linkedJournalEntryId,
    spineTone: input.spineTone ?? spineTones[count % spineTones.length],
    sortOrder: Date.now(),
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateLibraryBook(id: number, input: LibraryBookInput) {
  const book = await db.libraryBooks.get(id);
  if (!book || book.deletedAt) throw new Error("Book was not found.");
  if (!input.title.trim()) throw new Error("A book needs a title.");

  await db.libraryBooks.update(id, {
    title: input.title.trim(),
    author: input.author?.trim() || undefined,
    status: input.status,
    startedDate: input.startedDate || undefined,
    finishedDate: input.status === "finished" ? input.finishedDate || undefined : undefined,
    reflection: input.reflection?.trim() || undefined,
    favoriteQuote: input.favoriteQuote?.trim() || undefined,
    linkedJournalEntryId: input.linkedJournalEntryId,
    spineTone: input.spineTone ?? book.spineTone,
    updatedAt: new Date().toISOString(),
  });
}

export async function softDeleteLibraryBook(id: number) {
  await db.libraryBooks.update(id, {
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function restoreLibraryBook(id: number) {
  await db.libraryBooks.update(id, {
    deletedAt: undefined,
    updatedAt: new Date().toISOString(),
  });
}

export function visibleLibraryBooks(books: LibraryBook[]) {
  return books
    .filter((book) => !book.deletedAt)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}
