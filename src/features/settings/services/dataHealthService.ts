import { DATA_RELATIONS } from "./dataRelations";
import type Dexie from "dexie";

import { db } from "../../../database/db";
import {
  createMomentumBackup,
  validateMomentumBackup,
} from "./backupService";

type StoredRecord = Record<string, unknown>;

export interface DataHealthIssue {
  id: string;
  label: string;
  count: number;
}

export interface DataHealthReport {
  status: "healthy" | "attention";
  checkedAt: string;
  schemaVersion: number;
  tableCount: number;
  totalRecords: number;
  backupReady: boolean;
  issues: DataHealthIssue[];
}


function idSet(records: StoredRecord[]) {
  return new Set(
    records
      .map((record) => record.id)
      .filter((id): id is number | string => typeof id === "number" || typeof id === "string"),
  );
}

export async function auditMomentumData(
  database: Dexie = db,
): Promise<DataHealthReport> {
  await database.open();

  const recordsByTable: Record<string, StoredRecord[]> = {};
  await database.transaction("r", database.tables, async () => {
    for (const table of database.tables) {
      recordsByTable[table.name] = await table.toArray() as StoredRecord[];
    }
  });

  const issues: DataHealthIssue[] = [];
  for (const relation of DATA_RELATIONS) {
    const sources = recordsByTable[relation.sourceTable] ?? [];
    const targets = idSet(recordsByTable[relation.targetTable] ?? []);
    const count = sources.filter((record) => {
      const value = record[relation.sourceField];
      return value !== undefined && value !== null && !targets.has(value as number | string);
    }).length;

    if (count > 0) {
      issues.push({
        id: `${relation.sourceTable}.${relation.sourceField}`,
        label: relation.label,
        count,
      });
    }
  }

  let backupReady = true;
  try {
    const backup = await createMomentumBackup(database, undefined);
    validateMomentumBackup(structuredClone(backup), database);
  } catch {
    backupReady = false;
    issues.unshift({
      id: "backup-package",
      label: "The current data could not produce a verified backup",
      count: 1,
    });
  }

  const totalRecords = Object.values(recordsByTable).reduce(
    (total, records) => total + records.length,
    0,
  );

  return {
    status: issues.length ? "attention" : "healthy",
    checkedAt: new Date().toISOString(),
    schemaVersion: database.verno,
    tableCount: database.tables.length,
    totalRecords,
    backupReady,
    issues,
  };
}
