import {
  db,
  type ChineseMediaResource,
  type ChineseMediaType,
} from "../../../database/db";

export interface ChineseMediaInput {
  title?: string;
  url: string;
  type: ChineseMediaType;
}

function normalizeUrl(value: string) {
  const candidate = value.trim();
  const withProtocol = /^https?:\/\//i.test(candidate)
    ? candidate
    : `https://${candidate}`;
  const url = new URL(withProtocol);

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error("Use an http or https link.");
  }

  return url.toString();
}

function getFallbackTitle(url: string) {
  const parsed = new URL(url);
  const path = decodeURIComponent(parsed.pathname)
    .split("/")
    .filter(Boolean)
    .at(-1)
    ?.replace(/[-_]+/g, " ");

  return path || parsed.hostname.replace(/^www\./, "");
}

export async function createChineseMediaResource(input: ChineseMediaInput) {
  const url = normalizeUrl(input.url);
  const now = new Date().toISOString();

  return db.chineseMediaResources.add({
    title: input.title?.trim() || getFallbackTitle(url),
    url,
    type: input.type,
    createdAt: now,
    updatedAt: now,
  });
}

export async function softDeleteChineseMediaResource(id: number) {
  await db.chineseMediaResources.update(id, {
    deletedAt: new Date().toISOString(),
  });
}

export async function restoreChineseMediaResource(id: number) {
  await db.chineseMediaResources.update(id, {
    deletedAt: undefined,
    updatedAt: new Date().toISOString(),
  });
}

export function visibleChineseMediaResources(resources: ChineseMediaResource[]) {
  return resources
    .filter((resource) => !resource.deletedAt)
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}
