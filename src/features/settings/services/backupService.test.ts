import "fake-indexeddb/auto";

import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../../database/db";

import {
  BACKED_UP_LOCAL_STORAGE_KEYS,
  createMomentumBackup,
  parseMomentumBackup,
  restoreMomentumBackup,
  validateMomentumBackup,
} from "./backupService";
import type { BackupStorage } from "./backupService";

class MemoryStorage implements BackupStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

async function clearDatabase() {
  await db.open();
  await db.transaction("rw", db.tables, async () => {
    for (const table of db.tables) await table.clear();
  });
}

beforeEach(clearDatabase);

afterAll(async () => {
  db.close();
  await db.delete();
});

describe("backup service", () => {
  it("exports every current table and only intentional local preferences", async () => {
    const storage = new MemoryStorage();
    storage.setItem("momentum.finance.hideBalances", "true");
    storage.setItem("unrelated-secret", "do-not-export");
    await db.notes.add({
      text: "Remember this",
      createdAt: "2026-08-15T10:00:00.000Z",
      updatedAt: "2026-08-15T10:00:00.000Z",
    });

    const backup = await createMomentumBackup(db, storage);

    expect(Object.keys(backup.data).sort()).toEqual(
      db.tables.map((table) => table.name).sort(),
    );
    expect(backup.manifest.tableCounts.notes).toBe(1);
    expect(backup.manifest.totalRecords).toBe(1);
    expect(backup.localPreferences).toEqual({
      "momentum.finance.hideBalances": "true",
    });
    expect(Object.keys(backup.localPreferences)).not.toContain("unrelated-secret");
  });

  it("rejects malformed, incomplete, and incompatible backups", async () => {
    const backup = await createMomentumBackup(db, new MemoryStorage());
    const incomplete = structuredClone(backup);
    delete incomplete.data.notes;
    const mismatched = structuredClone(backup);
    mismatched.manifest.totalRecords = 10;
    const future = structuredClone(backup);
    future.manifest.schemaVersion += 1;

    expect(() => parseMomentumBackup("not json", db)).toThrow("valid JSON");
    expect(() => validateMomentumBackup(incomplete, db)).toThrow("complete");
    expect(() => validateMomentumBackup(mismatched, db)).toThrow("total");
    expect(() => validateMomentumBackup(future, db)).toThrow("newer");
  });

  it("replaces stored data, restores preferences, and preserves a safety copy", async () => {
    const storage = new MemoryStorage();
    storage.setItem("momentum.planner.pillar", "chinese");
    await db.notes.add({
      id: 7,
      text: "Restored note",
      createdAt: "2026-08-10T10:00:00.000Z",
      updatedAt: "2026-08-10T10:00:00.000Z",
    });
    const restorePoint = await createMomentumBackup(db, storage);

    await clearDatabase();
    storage.removeItem("momentum.planner.pillar");
    storage.setItem("momentum.finance.hideBalances", "false");
    await db.notes.add({
      id: 99,
      text: "Current note",
      createdAt: "2026-08-15T10:00:00.000Z",
      updatedAt: "2026-08-15T10:00:00.000Z",
    });
    const safetyCallback = vi.fn();

    const result = await restoreMomentumBackup(
      restorePoint,
      db,
      storage,
      { onSafetyBackup: safetyCallback },
    );

    expect(await db.notes.toArray()).toEqual([
      expect.objectContaining({ id: 7, text: "Restored note" }),
    ]);
    expect(storage.getItem("momentum.planner.pillar")).toBe("chinese");
    expect(storage.getItem("momentum.finance.hideBalances")).toBeNull();
    expect(result.restoredRecords).toBe(1);
    expect(result.safetyBackup.data.notes).toEqual([
      expect.objectContaining({ id: 99, text: "Current note" }),
    ]);
    expect(safetyCallback).toHaveBeenCalledWith(result.safetyBackup);
  });

  it("does not touch existing data when validation fails", async () => {
    await db.notes.add({
      text: "Still safe",
      createdAt: "2026-08-15T10:00:00.000Z",
      updatedAt: "2026-08-15T10:00:00.000Z",
    });
    const invalid = await createMomentumBackup(db, new MemoryStorage());
    invalid.manifest.tableCounts.notes = 100;

    await expect(
      restoreMomentumBackup(invalid, db, new MemoryStorage()),
    ).rejects.toThrow("record count");
    expect(await db.notes.count()).toBe(1);
  });

  it("keeps the local preference allowlist intentionally small", () => {
    expect(BACKED_UP_LOCAL_STORAGE_KEYS).toEqual([
      "momentum.finance.hideBalances",
      "momentum.planner.pillar",
      "momentum-journal-draft",
    ]);
  });
});
