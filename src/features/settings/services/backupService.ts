import Dexie from "dexie";

import { db } from "../../../database/db";

export const MOMENTUM_BACKUP_FORMAT = "momentum-backup";
export const MOMENTUM_BACKUP_VERSION = 1;

export const BACKED_UP_LOCAL_STORAGE_KEYS = [
  "momentum.finance.hideBalances",
  "momentum.planner.pillar",
  "momentum-journal-draft",
  "momentum.focus.soundscape",
] as const;

type StorageKey = (typeof BACKED_UP_LOCAL_STORAGE_KEYS)[number];

export interface BackupStorage {
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

export interface MomentumBackupManifest {
  createdAt: string;
  databaseName: string;
  schemaVersion: number;
  tableCounts: Record<string, number>;
  totalRecords: number;
  localPreferenceKeys: StorageKey[];
}

export interface MomentumBackupPackage {
  format: typeof MOMENTUM_BACKUP_FORMAT;
  backupVersion: typeof MOMENTUM_BACKUP_VERSION;
  manifest: MomentumBackupManifest;
  data: Record<string, unknown[]>;
  localPreferences: Partial<Record<StorageKey, string>>;
}

export interface RestoreResult {
  restoredRecords: number;
  safetyBackup: MomentumBackupPackage;
}

export interface RestoreOptions {
  onSafetyBackup?: (backup: MomentumBackupPackage) => void;
}

function browserStorage(): BackupStorage | undefined {
  if (typeof window === "undefined") return undefined;
  return window.localStorage;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function currentTableNames(database: Dexie) {
  return database.tables.map((table) => table.name).sort();
}

function migrateMomentumBackup(value: unknown, database: Dexie): unknown {
  if (!isRecord(value) || value.format !== MOMENTUM_BACKUP_FORMAT) return value;
  if (!isRecord(value.manifest) || !isRecord(value.data)) return value;

  const isPreFocusBackup =
    value.backupVersion === MOMENTUM_BACKUP_VERSION &&
    value.manifest.schemaVersion === 26 &&
    database.verno === 27 &&
    !("focusSessions" in value.data);

  if (!isPreFocusBackup) return value;

  const migrated = structuredClone(value);
  if (!isRecord(migrated) || !isRecord(migrated.manifest) || !isRecord(migrated.data)) {
    return value;
  }
  migrated.data.focusSessions = [];
  if (isRecord(migrated.manifest.tableCounts)) {
    migrated.manifest.tableCounts.focusSessions = 0;
  }
  migrated.manifest.schemaVersion = 27;
  return migrated;
}

function assertString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} is missing or invalid.`);
  }
}

function assertFiniteNumber(
  value: unknown,
  label: string,
): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} is missing or invalid.`);
  }
}

export async function createMomentumBackup(
  database: Dexie = db,
  storage: BackupStorage | undefined = browserStorage(),
): Promise<MomentumBackupPackage> {
  await database.open();

  const data: Record<string, unknown[]> = {};

  await database.transaction("r", database.tables, async () => {
    for (const table of database.tables) {
      data[table.name] = await table.toArray();
    }
  });

  const tableCounts = Object.fromEntries(
    Object.entries(data).map(([tableName, records]) => [
      tableName,
      records.length,
    ]),
  );
  const localPreferences: Partial<Record<StorageKey, string>> = {};

  if (storage) {
    for (const key of BACKED_UP_LOCAL_STORAGE_KEYS) {
      const value = storage.getItem(key);
      if (value !== null) localPreferences[key] = value;
    }
  }

  return {
    format: MOMENTUM_BACKUP_FORMAT,
    backupVersion: MOMENTUM_BACKUP_VERSION,
    manifest: {
      createdAt: new Date().toISOString(),
      databaseName: database.name,
      schemaVersion: database.verno,
      tableCounts,
      totalRecords: Object.values(tableCounts).reduce(
        (total, count) => total + count,
        0,
      ),
      localPreferenceKeys: Object.keys(localPreferences) as StorageKey[],
    },
    data,
    localPreferences,
  };
}

export function validateMomentumBackup(
  value: unknown,
  database: Dexie = db,
): MomentumBackupPackage {
  value = migrateMomentumBackup(value, database);
  if (!isRecord(value)) throw new Error("This is not a Momentum backup file.");
  if (value.format !== MOMENTUM_BACKUP_FORMAT) {
    throw new Error("This file was not created by Momentum.");
  }
  if (value.backupVersion !== MOMENTUM_BACKUP_VERSION) {
    throw new Error("This backup version is not supported yet.");
  }
  if (!isRecord(value.manifest)) {
    throw new Error("The backup manifest is missing.");
  }
  if (!isRecord(value.data)) throw new Error("The backup data is missing.");
  if (!isRecord(value.localPreferences)) {
    throw new Error("The backup preferences are invalid.");
  }

  const manifest = value.manifest;
  assertString(manifest.createdAt, "Backup date");
  assertString(manifest.databaseName, "Database name");
  assertFiniteNumber(manifest.schemaVersion, "Schema version");
  assertFiniteNumber(manifest.totalRecords, "Record total");

  if (manifest.schemaVersion !== database.verno) {
    const relation = manifest.schemaVersion > database.verno
      ? "a newer"
      : "an older";
    throw new Error(
      `This backup uses ${relation} Momentum data version and cannot be restored safely.`,
    );
  }
  if (!isRecord(manifest.tableCounts)) {
    throw new Error("The backup table counts are invalid.");
  }
  if (!Array.isArray(manifest.localPreferenceKeys)) {
    throw new Error("The backup preference list is invalid.");
  }

  const expectedTables = currentTableNames(database);
  const actualTables = Object.keys(value.data).sort();

  if (
    expectedTables.length !== actualTables.length ||
    expectedTables.some((name, index) => name !== actualTables[index])
  ) {
    throw new Error("The backup does not contain the complete Momentum database.");
  }

  let calculatedTotal = 0;
  for (const tableName of expectedTables) {
    const records = value.data[tableName];
    const declaredCount = manifest.tableCounts[tableName];
    if (!Array.isArray(records)) {
      throw new Error(`The ${tableName} data is invalid.`);
    }
    if (declaredCount !== records.length) {
      throw new Error(`The ${tableName} record count does not match.`);
    }
    calculatedTotal += records.length;
  }

  if (calculatedTotal !== manifest.totalRecords) {
    throw new Error("The backup record total does not match its contents.");
  }

  const allowedKeys = new Set<string>(BACKED_UP_LOCAL_STORAGE_KEYS);
  for (const [key, storedValue] of Object.entries(value.localPreferences)) {
    if (!allowedKeys.has(key) || typeof storedValue !== "string") {
      throw new Error("The backup contains an unsupported preference.");
    }
  }
  for (const key of manifest.localPreferenceKeys) {
    if (!allowedKeys.has(String(key)) || !(key in value.localPreferences)) {
      throw new Error("The backup preference list does not match its contents.");
    }
  }

  return value as unknown as MomentumBackupPackage;
}

export function parseMomentumBackup(
  json: string,
  database: Dexie = db,
): MomentumBackupPackage {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }
  return validateMomentumBackup(parsed, database);
}

export async function restoreMomentumBackup(
  candidate: unknown,
  database: Dexie = db,
  storage: BackupStorage | undefined = browserStorage(),
  options: RestoreOptions = {},
): Promise<RestoreResult> {
  const backup = validateMomentumBackup(candidate, database);
  const safetyBackup = await createMomentumBackup(database, storage);
  options.onSafetyBackup?.(safetyBackup);

  await database.transaction("rw", database.tables, async () => {
    for (const table of database.tables) await table.clear();
    for (const table of database.tables) {
      const records = backup.data[table.name];
      if (records.length > 0) await table.bulkPut(records);
    }
  });

  if (storage) {
    for (const key of BACKED_UP_LOCAL_STORAGE_KEYS) storage.removeItem(key);
    for (const [key, storedValue] of Object.entries(backup.localPreferences)) {
      storage.setItem(key, storedValue);
    }
  }

  return {
    restoredRecords: backup.manifest.totalRecords,
    safetyBackup,
  };
}

function filenameTimestamp(date: Date) {
  return date.toISOString().replace(/:/g, "-").replace(/\.\d{3}Z$/, "Z");
}

export function downloadMomentumBackup(
  backup: MomentumBackupPackage,
  purpose: "backup" | "safety" = "backup",
) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `momentum-${purpose}-${filenameTimestamp(new Date(backup.manifest.createdAt))}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
