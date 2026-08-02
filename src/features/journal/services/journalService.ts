import { db } from "../../../database/db";
import type { JournalEntry } from "../../../database/db";

export type JournalEntryInput = {
  title?: string;
  text: string;
  entryDate?: string;
};

export function toJournalDateKey(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export async function createJournalEntry(input: JournalEntryInput) {
  const text = input.text.trim();
  if (!text) throw new Error("A journal entry needs text.");
  const now = new Date().toISOString();

  return db.journalEntries.add({
    title: input.title?.trim() || undefined,
    text,
    entryDate: input.entryDate ?? toJournalDateKey(),
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateJournalEntry(
  id: number,
  patch: Partial<Pick<JournalEntry, "title" | "text" | "entryDate">>
) {
  const entry = await db.journalEntries.get(id);
  if (!entry || entry.deletedAt) throw new Error("Journal entry was not found.");
  if (patch.text !== undefined && !patch.text.trim()) {
    throw new Error("A journal entry needs text.");
  }

  await db.journalEntries.update(id, {
    ...(patch.title !== undefined
      ? { title: patch.title.trim() || undefined }
      : {}),
    ...(patch.text !== undefined
      ? { text: patch.text.trim() }
      : {}),
    ...(patch.entryDate !== undefined
      ? { entryDate: patch.entryDate }
      : {}),
    updatedAt: new Date().toISOString(),
  });
}

export async function softDeleteJournalEntry(id: number) {
  await db.journalEntries.update(id, {
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function restoreJournalEntry(id: number) {
  await db.journalEntries.update(id, {
    deletedAt: undefined,
    updatedAt: new Date().toISOString(),
  });
}

export function visibleJournalEntries(entries: JournalEntry[]) {
  return entries
    .filter((entry) => !entry.deletedAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getOnThisDayEntries(
  entries: JournalEntry[],
  referenceDate = new Date()
) {
  const monthDay = toJournalDateKey(referenceDate).slice(5);
  const year = referenceDate.getFullYear();

  return visibleJournalEntries(entries).filter(
    (entry) =>
      entry.entryDate.slice(5) === monthDay &&
      Number(entry.entryDate.slice(0, 4)) < year
  );
}

export function getRandomMemory(
  entries: JournalEntry[],
  excludedId?: number
) {
  const candidates = visibleJournalEntries(entries).filter(
    (entry) => entry.id !== excludedId
  );
  if (candidates.length === 0) return visibleJournalEntries(entries)[0];
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export const reflectionPrompts = [
  "What was good about today?",
  "What has been on your mind lately?",
  "What are you looking forward to?",
  "What made you laugh today?",
  "What do you want to remember about today?",
  "What are you grateful for right now?",
];
