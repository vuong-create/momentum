import { db, type ChineseEntry, type ChineseEntryType } from "../../../database/db";
import { generatePinyin } from "./pinyinService";

export interface ChineseEntryInput {
  traditional: string;
  pinyin?: string;
  meaning: string;
  entryType?: ChineseEntryType;
  example?: string;
  notes?: string;
  tags?: string[];
  source?: string;
}

function normalizeTags(tags: string[] = []) {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
}

function normalizeInput(input: ChineseEntryInput) {
  const traditional = input.traditional.trim();
  const meaning = input.meaning.trim();

  if (!traditional || !meaning) {
    throw new Error("Traditional Chinese and meaning are required.");
  }

  return {
    traditional,
    pinyin: input.pinyin?.trim() || generatePinyin(traditional),
    meaning,
    entryType: input.entryType ?? "word",
    example: input.example?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    tags: normalizeTags(input.tags),
    source: input.source?.trim() || undefined,
  };
}

export async function createChineseEntry(input: ChineseEntryInput) {
  const now = new Date().toISOString();

  return db.chineseEntries.add({
    ...normalizeInput(input),
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateChineseEntry(id: number, input: ChineseEntryInput) {
  const entry = await db.chineseEntries.get(id);

  if (!entry || entry.deletedAt) throw new Error("Chinese entry was not found.");

  await db.chineseEntries.update(id, {
    ...normalizeInput(input),
    updatedAt: new Date().toISOString(),
  });
}

export async function softDeleteChineseEntry(id: number) {
  await db.chineseEntries.update(id, {
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function restoreChineseEntry(id: number) {
  await db.chineseEntries.update(id, {
    deletedAt: undefined,
    updatedAt: new Date().toISOString(),
  });
}

export function visibleChineseEntries(entries: ChineseEntry[]) {
  return entries
    .filter((entry) => !entry.deletedAt)
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}
