import "fake-indexeddb/auto";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../database/db";
import {
  createJournalEntry,
  getOnThisDayEntries,
  restoreJournalEntry,
  softDeleteJournalEntry,
  updateJournalEntry,
  visibleJournalEntries,
} from "./journalService";
import {
  createPersonalQuote,
  toggleBuiltInQuote,
  toggleQuoteFavorite,
  visibleQuotes,
} from "./quoteService";
import {
  createLibraryBook,
  restoreLibraryBook,
  softDeleteLibraryBook,
  updateLibraryBook,
  visibleLibraryBooks,
} from "./libraryService";
import {
  createWishlistItem,
  normalizeWishlistUrl,
  restoreWishlistItem,
  setWishlistItemStatus,
  softDeleteWishlistItem,
  updateWishlistItem,
  visibleWishlistItems,
} from "./wishlistService";

beforeEach(async () => {
  await db.transaction("rw", db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()));
  });
});

afterAll(async () => {
  db.close();
  await db.delete();
});

describe("journal services", () => {
  it("keeps Wish List links optional and tracks acquired items", async () => {
    const linkedId = await createWishlistItem({
      name: "  Reading lamp  ",
      url: "example.com/lamp",
      notes: "  Warm light  ",
      status: "considering",
    });
    const unlinkedId = await createWishlistItem({
      name: "Ceramic mug",
      status: "considering",
    });

    expect(await db.libraryWishlistItems.get(linkedId)).toMatchObject({
      name: "Reading lamp",
      url: "https://example.com/lamp",
      notes: "Warm light",
      status: "considering",
    });
    expect((await db.libraryWishlistItems.get(unlinkedId))?.url).toBeUndefined();

    await setWishlistItemStatus(linkedId, "acquired");
    expect(await db.libraryWishlistItems.get(linkedId)).toMatchObject({ status: "acquired" });
    expect((await db.libraryWishlistItems.get(linkedId))?.acquiredAt).toBeTruthy();

    await updateWishlistItem(unlinkedId, {
      name: "Ceramic cup",
      url: "https://shop.example/cup",
      status: "considering",
    });
    await softDeleteWishlistItem(unlinkedId);
    expect(visibleWishlistItems(await db.libraryWishlistItems.toArray())).toHaveLength(1);
    await restoreWishlistItem(unlinkedId);
    expect(visibleWishlistItems(await db.libraryWishlistItems.toArray())).toHaveLength(2);
    expect(normalizeWishlistUrl(undefined)).toBeUndefined();
    expect(() => normalizeWishlistUrl("javascript:alert(1)")).toThrow("http or https");
  });

  it("creates, edits, deletes, and restores one journal entry", async () => {
    const id = await createJournalEntry({
      title: "  A good day  ",
      text: "  Dinner with friends.  ",
      entryDate: "2026-08-01",
      category: "gratitude",
      promptId: "three-good-things",
    });
    await updateJournalEntry(id, {
      text: "Dinner and volleyball.",
      category: "memory",
    });
    expect(await db.journalEntries.get(id)).toMatchObject({
      title: "A good day",
      text: "Dinner and volleyball.",
      category: "memory",
      promptId: "three-good-things",
    });
    await softDeleteJournalEntry(id);
    expect(visibleJournalEntries(await db.journalEntries.toArray())).toHaveLength(0);
    await restoreJournalEntry(id);
    expect(visibleJournalEntries(await db.journalEntries.toArray())).toHaveLength(1);
  });

  it("keeps categories optional and allows an entry to return to uncategorized", async () => {
    const id = await createJournalEntry({
      text: "A free page",
      category: "reflection",
    });
    await updateJournalEntry(id, { category: undefined });
    const entry = await db.journalEntries.get(id);
    expect(entry?.text).toBe("A free page");
    expect(entry?.category).toBeUndefined();
  });

  it("derives On This Day without creating memory records", async () => {
    await createJournalEntry({ text: "Last year", entryDate: "2025-08-01" });
    await createJournalEntry({ text: "Today", entryDate: "2026-08-01" });
    await createJournalEntry({ text: "Different day", entryDate: "2025-08-02" });
    const memories = getOnThisDayEntries(
      await db.journalEntries.toArray(),
      new Date(2026, 7, 1)
    );
    expect(memories.map((entry) => entry.text)).toEqual(["Last year"]);
  });

  it("stores built-in and personal quotes in one collection", async () => {
    await toggleBuiltInQuote({ id: "test", text: "Keep going.", author: "Someone" });
    const personalId = await createPersonalQuote({
      text: "A personal line",
      author: "Evan",
      source: "Notebook",
    });
    await toggleQuoteFavorite(personalId);
    const quotes = visibleQuotes(await db.savedQuotes.toArray());
    expect(quotes).toHaveLength(2);
    expect(quotes[0]).toMatchObject({ favorite: true, isBuiltIn: false });
  });

  it("tracks a book through reading and finished shelves", async () => {
    const id = await createLibraryBook({
      title: "Norwegian Wood",
      author: "Haruki Murakami",
      status: "reading",
      startedDate: "2026-07-20",
    });
    await updateLibraryBook(id, {
      title: "Norwegian Wood",
      author: "Haruki Murakami",
      status: "finished",
      startedDate: "2026-07-20",
      finishedDate: "2026-08-01",
      reflection: "Quiet and memorable.",
    });
    expect(await db.libraryBooks.get(id)).toMatchObject({
      status: "finished",
      finishedDate: "2026-08-01",
    });
    await softDeleteLibraryBook(id);
    expect(visibleLibraryBooks(await db.libraryBooks.toArray())).toHaveLength(0);
    await restoreLibraryBook(id);
    expect(visibleLibraryBooks(await db.libraryBooks.toArray())).toHaveLength(1);
  });
});
