import { db } from "../../../database/db";
import type { SavedQuote } from "../../../database/db";

type BuiltInQuoteInput = {
  id: string;
  text: string;
  author: string;
};

export async function toggleBuiltInQuote(input: BuiltInQuoteInput) {
  const existing = await db.savedQuotes
    .where("quoteKey")
    .equals(input.id)
    .first();

  if (existing?.id && !existing.deletedAt) {
    await softDeleteQuote(existing.id);
    return false;
  }

  const now = new Date().toISOString();
  if (existing?.id) {
    await db.savedQuotes.update(existing.id, {
      text: input.text,
      author: input.author,
      deletedAt: undefined,
      updatedAt: now,
      savedAt: now,
      isBuiltIn: true,
    });
  } else {
    await db.savedQuotes.add({
      quoteKey: input.id,
      text: input.text,
      author: input.author,
      savedAt: now,
      createdAt: now,
      updatedAt: now,
      favorite: false,
      isBuiltIn: true,
    });
  }
  return true;
}

export async function createPersonalQuote(input: {
  text: string;
  author?: string;
  source?: string;
}) {
  if (!input.text.trim()) throw new Error("A quote needs text.");
  const now = new Date().toISOString();
  const quoteKey = `personal-${crypto.randomUUID()}`;

  return db.savedQuotes.add({
    quoteKey,
    text: input.text.trim(),
    author: input.author?.trim() || "Unknown",
    source: input.source?.trim() || undefined,
    savedAt: now,
    createdAt: now,
    updatedAt: now,
    favorite: false,
    isBuiltIn: false,
  });
}

export async function toggleQuoteFavorite(id: number) {
  const quote = await db.savedQuotes.get(id);
  if (!quote || quote.deletedAt) return;
  await db.savedQuotes.update(id, {
    favorite: !quote.favorite,
    updatedAt: new Date().toISOString(),
  });
}

export async function softDeleteQuote(id: number) {
  await db.savedQuotes.update(id, {
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function restoreQuote(id: number) {
  await db.savedQuotes.update(id, {
    deletedAt: undefined,
    updatedAt: new Date().toISOString(),
  });
}

export function visibleQuotes(quotes: SavedQuote[]) {
  return quotes
    .filter((quote) => !quote.deletedAt)
    .sort((a, b) => {
      if (Boolean(a.favorite) !== Boolean(b.favorite)) {
        return a.favorite ? -1 : 1;
      }
      return b.savedAt.localeCompare(a.savedAt);
    });
}
