import { db } from "../../../database/db";
import type {
  LibraryWishlistItem,
  LibraryWishlistStatus,
} from "../../../database/db";

export type WishlistItemInput = {
  name: string;
  url?: string;
  notes?: string;
  status: LibraryWishlistStatus;
};

export function normalizeWishlistUrl(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const url = new URL(candidate);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error("Link must use http or https.");
  }
  return url.toString();
}

export async function createWishlistItem(input: WishlistItemInput) {
  if (!input.name.trim()) throw new Error("A wish needs a name.");
  const now = new Date().toISOString();
  return db.libraryWishlistItems.add({
    name: input.name.trim(),
    url: normalizeWishlistUrl(input.url),
    notes: input.notes?.trim() || undefined,
    status: input.status,
    sortOrder: Date.now(),
    createdAt: now,
    updatedAt: now,
    acquiredAt: input.status === "acquired" ? now : undefined,
  });
}

export async function updateWishlistItem(id: number, input: WishlistItemInput) {
  const item = await db.libraryWishlistItems.get(id);
  if (!item || item.deletedAt) throw new Error("Wish was not found.");
  if (!input.name.trim()) throw new Error("A wish needs a name.");
  const now = new Date().toISOString();
  await db.libraryWishlistItems.update(id, {
    name: input.name.trim(),
    url: normalizeWishlistUrl(input.url),
    notes: input.notes?.trim() || undefined,
    status: input.status,
    acquiredAt: input.status === "acquired" ? item.acquiredAt ?? now : undefined,
    updatedAt: now,
  });
}

export async function setWishlistItemStatus(id: number, status: LibraryWishlistStatus) {
  const item = await db.libraryWishlistItems.get(id);
  if (!item || item.deletedAt) return;
  const now = new Date().toISOString();
  await db.libraryWishlistItems.update(id, {
    status,
    acquiredAt: status === "acquired" ? item.acquiredAt ?? now : undefined,
    updatedAt: now,
  });
}

export async function softDeleteWishlistItem(id: number) {
  const now = new Date().toISOString();
  await db.libraryWishlistItems.update(id, { deletedAt: now, updatedAt: now });
}

export async function restoreWishlistItem(id: number) {
  await db.libraryWishlistItems.update(id, {
    deletedAt: undefined,
    updatedAt: new Date().toISOString(),
  });
}

export function visibleWishlistItems(items: LibraryWishlistItem[]) {
  return items
    .filter((item) => !item.deletedAt)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}
