import { db } from "../../../database/db";
import type {
  LibraryMediaType,
  LibraryWatchItem,
  LibraryWatchStatus,
} from "../../../database/db";

export type WatchItemInput = {
  title: string;
  mediaType: LibraryMediaType;
  status: LibraryWatchStatus;
  releaseYear?: number;
  url?: string;
  platform?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  playbackPosition?: string;
  notes?: string;
};

export function normalizeWatchUrl(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(candidate);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Link must use http or https.");
  return url.toString();
}

export function parsePlaybackTimestamp(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (!/^\d{1,3}:[0-5]\d(?::[0-5]\d)?$/.test(trimmed)) {
    throw new Error("Timestamp should look like 42:15 or 1:08:30.");
  }
  const parts = trimmed.split(":").map(Number);
  return parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0] * 3600 + parts[1] * 60 + parts[2];
}

export function formatPlaybackTimestamp(seconds?: number) {
  if (seconds === undefined || seconds < 0) return "";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`
    : `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function normalizePositiveInteger(value?: number) {
  return value && Number.isInteger(value) && value > 0 ? value : undefined;
}

function normalizeInput(input: WatchItemInput) {
  const releaseYear = normalizePositiveInteger(input.releaseYear);
  const currentYear = new Date().getFullYear() + 5;
  if (releaseYear && (releaseYear < 1888 || releaseYear > currentYear)) throw new Error("Add a valid release year.");
  return {
    title: input.title.trim(), mediaType: input.mediaType, status: input.status, releaseYear,
    url: normalizeWatchUrl(input.url), platform: input.platform?.trim() || undefined,
    seasonNumber: input.mediaType === "show" ? normalizePositiveInteger(input.seasonNumber) : undefined,
    episodeNumber: input.mediaType === "show" ? normalizePositiveInteger(input.episodeNumber) : undefined,
    playbackPositionSeconds: parsePlaybackTimestamp(input.playbackPosition),
    notes: input.notes?.trim() || undefined,
  };
}

function statusDates(status: LibraryWatchStatus, item?: LibraryWatchItem) {
  const now = new Date().toISOString();
  return {
    startedAt: status === "want-to-watch" ? item?.startedAt : item?.startedAt ?? now,
    finishedAt: status === "finished" ? item?.finishedAt ?? now : undefined,
  };
}

export async function createWatchItem(input: WatchItemInput) {
  const normalized = normalizeInput(input);
  if (!normalized.title) throw new Error("A movie or show needs a title.");
  const now = new Date().toISOString();
  return db.libraryWatchItems.add({ ...normalized, ...statusDates(normalized.status), sortOrder: Date.now(), createdAt: now, updatedAt: now });
}

export async function updateWatchItem(id: number, input: WatchItemInput) {
  const item = await db.libraryWatchItems.get(id);
  if (!item || item.deletedAt) throw new Error("Watchlist item was not found.");
  const normalized = normalizeInput(input);
  if (!normalized.title) throw new Error("A movie or show needs a title.");
  await db.libraryWatchItems.update(id, { ...normalized, ...statusDates(normalized.status, item), updatedAt: new Date().toISOString() });
}

export async function setWatchItemStatus(id: number, status: LibraryWatchStatus) {
  const item = await db.libraryWatchItems.get(id);
  if (!item || item.deletedAt) return;
  await db.libraryWatchItems.update(id, { status, ...statusDates(status, item), updatedAt: new Date().toISOString() });
}

export async function softDeleteWatchItem(id: number) {
  const now = new Date().toISOString();
  await db.libraryWatchItems.update(id, { deletedAt: now, updatedAt: now });
}

export async function restoreWatchItem(id: number) {
  await db.libraryWatchItems.update(id, { deletedAt: undefined, updatedAt: new Date().toISOString() });
}

export function visibleWatchItems(items: LibraryWatchItem[]) {
  const order: Record<LibraryWatchStatus, number> = { watching: 0, "want-to-watch": 1, finished: 2 };
  return items.filter((item) => !item.deletedAt).sort((a, b) => order[a.status] - order[b.status] || a.sortOrder - b.sortOrder);
}
