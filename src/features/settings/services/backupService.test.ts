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

  it("round-trips an uploaded cookbook cover with its recipe", async () => {
    const now = "2026-08-16T12:00:00.000Z";
    const coverImageDataUrl = "data:image/webp;base64,dGVzdA==";
    await db.cookingRecipes.add({
      name: "Chicken dish",
      coverImageDataUrl,
      defaultServings: 2,
      ingredients: [],
      instructions: [],
      tags: [],
      favorite: false,
      createdAt: now,
      updatedAt: now,
    });
    const backup = await createMomentumBackup(db, new MemoryStorage());
    await clearDatabase();
    await restoreMomentumBackup(backup, db, new MemoryStorage());
    expect((await db.cookingRecipes.toArray())[0]).toMatchObject({ name: "Chicken dish", coverImageDataUrl });
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
      "momentum.focus.soundscape",
    ]);
  });

  it("migrates a schema 26 backup into the Focus schema safely", async () => {
    const backup = await createMomentumBackup(db, new MemoryStorage());
    const legacy = structuredClone(backup);
    legacy.manifest.schemaVersion = 26;
    delete legacy.data.focusSessions;
    delete legacy.manifest.tableCounts.focusSessions;

    const migrated = validateMomentumBackup(legacy, db);

    expect(migrated.manifest.schemaVersion).toBe(30);
    expect(migrated.data.focusSessions).toEqual([]);
    expect(migrated.manifest.tableCounts.focusSessions).toBe(0);
  });

  it("migrates schema 27 sound preferences into Sound v2", async () => {
    await db.appSettings.put({
      id: "preferences", soundsEnabled: true, animationsEnabled: true,
      soundVolume: 0.6, interfaceSoundsEnabled: true, actionSoundsEnabled: true,
      celebrationSoundsEnabled: true, soundscapeVolume: 0.35, updatedAt: "",
    });
    const backup = await createMomentumBackup(db, new MemoryStorage());
    const legacy = structuredClone(backup);
    legacy.manifest.schemaVersion = 27;
    const settings = legacy.data.appSettings[0] as Record<string, unknown>;
    delete settings.soundVolume;
    delete settings.interfaceSoundsEnabled;

    const migrated = validateMomentumBackup(legacy, db);
    expect(migrated.manifest.schemaVersion).toBe(30);
    expect(migrated.data.appSettings[0]).toEqual(expect.objectContaining({
      soundVolume: 0.6, interfaceSoundsEnabled: true,
    }));
  });

  it("migrates schema 28 backups with empty progression and day preset tables", async () => {
    const backup = await createMomentumBackup(db, new MemoryStorage());
    const legacy = structuredClone(backup);
    legacy.manifest.schemaVersion = 28;
    for (const table of ["dayPresets", "weeklyProgressResults", "milestoneSnapshots", "progressionState"]) {
      delete legacy.data[table];
      delete legacy.manifest.tableCounts[table];
    }

    const migrated = validateMomentumBackup(legacy, db);
    expect(migrated.manifest.schemaVersion).toBe(30);
    expect(migrated.data.dayPresets).toEqual([]);
    expect(migrated.data.weeklyProgressResults).toEqual([]);
    expect(migrated.data.milestoneSnapshots).toEqual([]);
    expect(migrated.data.progressionState).toEqual([]);
    expect(migrated.data.libraryWishlistItems).toEqual([]);
  });

  it("migrates schema 29 backups with an empty Wish List", async () => {
    const backup = await createMomentumBackup(db, new MemoryStorage());
    const legacy = structuredClone(backup);
    legacy.manifest.schemaVersion = 29;
    delete legacy.data.libraryWishlistItems;
    delete legacy.manifest.tableCounts.libraryWishlistItems;

    const migrated = validateMomentumBackup(legacy, db);
    expect(migrated.manifest.schemaVersion).toBe(30);
    expect(migrated.data.libraryWishlistItems).toEqual([]);
    expect(migrated.manifest.tableCounts.libraryWishlistItems).toBe(0);
  });

  it("round-trips progression and day presets without changing their records", async () => {
    const now = "2026-08-15T12:00:00.000Z";
    await db.dayPresets.add({
      id: 8,
      name: "Normal Work Day",
      items: [{
        id: "walk",
        title: "Go on a walk",
        pillar: "athletics",
        difficulty: "easy",
      }],
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    });
    await db.weeklyProgressResults.add({
      id: 3,
      weekStart: "2026-08-09",
      weekEnd: "2026-08-15",
      eligibleCount: 4,
      completedCount: 4,
      percentage: 100,
      bonusXP: 200,
      totalWeekXP: 252,
      perfectWeek: true,
      settledAt: now,
      updatedAt: now,
    });
    await db.milestoneSnapshots.add({
      id: 2,
      level: 5,
      achievedAt: now,
      lifetimeXP: 700,
      title: "Steady",
      pillarXP: { athletics: 200 },
      completedPlans: 18,
      perfectWeeks: 1,
      chineseActivities: 2,
      athleticsActivities: 5,
      mealsCooked: 3,
      libraryEntries: 4,
      financeActivities: 1,
    });
    await db.progressionState.put({
      id: "global",
      lastRecognizedLevel: 5,
      updatedAt: now,
    });
    const backup = await createMomentumBackup(db, new MemoryStorage());

    await clearDatabase();
    await restoreMomentumBackup(backup, db, new MemoryStorage());

    expect(await db.dayPresets.get(8)).toEqual(backup.data.dayPresets[0]);
    expect(await db.weeklyProgressResults.get(3)).toEqual(backup.data.weeklyProgressResults[0]);
    expect(await db.milestoneSnapshots.get(2)).toEqual(backup.data.milestoneSnapshots[0]);
    expect(await db.progressionState.get("global")).toEqual(backup.data.progressionState[0]);
  });
});
