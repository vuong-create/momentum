import { useRef, useState } from "react";

import {
  createMomentumBackup,
  downloadMomentumBackup,
  parseMomentumBackup,
  restoreMomentumBackup,
} from "../services/backupService";
import type { MomentumBackupPackage } from "../services/backupService";
import {
  auditMomentumData,
  type DataHealthReport,
} from "../services/dataHealthService";

type BackupState =
  | { kind: "idle" }
  | { kind: "working"; message: string }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

const RECORD_GROUPS = [
  {
    label: "Planner & progress",
    tables: [
      "plannedActivities",
      "activityEvents",
      "xpEvents",
      "activityTemplates",
      "recurrenceRules",
      "streakRecords",
      "dayPresets",
      "focusSessions",
      "weeklyProgressResults",
      "milestoneSnapshots",
      "progressionState",
    ],
  },
  {
    label: "Life pillars",
    tables: [
      "journalEntries",
      "libraryBooks",
      "chineseEntries",
      "chineseActivities",
      "chineseMediaResources",
      "athleticsTemplates",
      "athleticsWorkouts",
      "cookingRecipes",
      "groceryItems",
      "cookingMealLogs",
    ],
  },
  {
    label: "Finance",
    tables: [
      "financeAccounts",
      "financeTransactions",
      "financeCategories",
      "financeSubcategories",
      "financeBudgetMonths",
      "financeBudgetAllocations",
      "financeGoals",
      "financeMonthlyReviews",
      "financeNetWorthSnapshots",
      "financeImportBatches",
    ],
  },
  {
    label: "Notes & preferences",
    tables: ["notes", "savedQuotes", "appSettings"],
  },
] as const;

function formatBackupDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function recordsInGroup(
  backup: MomentumBackupPackage,
  tables: readonly string[],
) {
  return tables.reduce(
    (total, table) => total + (backup.manifest.tableCounts[table] ?? 0),
    0,
  );
}

export default function DataBackupPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<BackupState>({ kind: "idle" });
  const [restoreCandidate, setRestoreCandidate] =
    useState<MomentumBackupPackage | null>(null);
  const [restoreConfirmed, setRestoreConfirmed] = useState(false);
  const [restoreComplete, setRestoreComplete] = useState(false);
  const [healthReport, setHealthReport] = useState<DataHealthReport | null>(null);

  async function checkDataHealth() {
    setState({ kind: "working", message: "Reading your local records…" });
    try {
      const report = await auditMomentumData();
      setHealthReport(report);
      setState({ kind: "idle" });
    } catch (error) {
      setHealthReport(null);
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "The data check could not finish.",
      });
    }
  }

  async function exportBackup() {
    setState({ kind: "working", message: "Preparing your backup…" });
    try {
      const backup = await createMomentumBackup();
      downloadMomentumBackup(backup);
      setState({
        kind: "success",
        message: `${backup.manifest.totalRecords.toLocaleString()} records saved to a portable backup.`,
      });
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "The backup could not be created.",
      });
    }
  }

  async function chooseBackup(file: File | undefined) {
    if (!file) return;
    setRestoreCandidate(null);
    setRestoreConfirmed(false);
    setState({ kind: "working", message: "Checking this backup…" });
    try {
      const candidate = parseMomentumBackup(await file.text());
      setRestoreCandidate(candidate);
      setState({ kind: "idle" });
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "This backup could not be read.",
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function restoreBackup() {
    if (!restoreCandidate || !restoreConfirmed) return;
    setState({ kind: "working", message: "Restoring Momentum…" });
    try {
      const result = await restoreMomentumBackup(
        restoreCandidate,
        undefined,
        undefined,
        {
          onSafetyBackup: (backup) => downloadMomentumBackup(backup, "safety"),
        },
      );
      setRestoreComplete(true);
      setState({
        kind: "success",
        message: `${result.restoredRecords.toLocaleString()} records restored. A safety copy of your previous data was downloaded first.`,
      });
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "Momentum could not restore this backup.",
      });
    }
  }

  function cancelRestore() {
    setRestoreCandidate(null);
    setRestoreConfirmed(false);
    setState({ kind: "idle" });
  }

  return (
    <section className="settings-panel settings-data-panel">
      <div className="settings-panel-heading">
        <div>
          <span className="text-label">Data</span>
          <h2>Backup & restore</h2>
        </div>
        <span className="settings-panel-index">03</span>
      </div>

      <div className="settings-data-intro">
        <div className="settings-data-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div>
          <strong>Your Momentum, in your hands.</strong>
          <p>
            Export one portable file containing your planner, pillars, XP,
            finance history, journal, library, and preferences. Nothing is
            uploaded to a server.
          </p>
        </div>
      </div>

      <div className="settings-data-actions">
        <div>
          <span className="settings-action-number">01</span>
          <strong>Check data health</strong>
          <p>Read every local store and verify a backup in memory. Nothing is changed.</p>
        </div>
        <button
          type="button"
          className="settings-data-button"
          disabled={state.kind === "working"}
          onClick={checkDataHealth}
        >
          Check now
        </button>
      </div>

      {healthReport && (
        <div
          className={`settings-health-report is-${healthReport.status}`}
          role="status"
          aria-live="polite"
        >
          <span className="settings-health-symbol" aria-hidden="true">
            {healthReport.status === "healthy" ? "✓" : "!"}
          </span>
          <div>
            <strong>
              {healthReport.status === "healthy"
                ? "Your local data is healthy."
                : "A few links need attention."}
            </strong>
            <p>
              {healthReport.totalRecords.toLocaleString()} records across {healthReport.tableCount} stores
              {healthReport.backupReady ? " · backup verified" : " · backup verification failed"}
              {` · data version ${healthReport.schemaVersion}`}
            </p>
            {healthReport.issues.length > 0 && (
              <ul>
                {healthReport.issues.map((issue) => (
                  <li key={issue.id}>
                    <span>{issue.label}</span>
                    <b>{issue.count}</b>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="settings-data-actions">
        <div>
          <span className="settings-action-number">02</span>
          <strong>Create a backup</strong>
          <p>Save a dated copy you can keep anywhere.</p>
        </div>
        <button
          type="button"
          className="settings-data-button is-primary"
          disabled={state.kind === "working"}
          onClick={exportBackup}
        >
          Export backup
        </button>
      </div>

      <div className="settings-data-actions">
        <div>
          <span className="settings-action-number">03</span>
          <strong>Restore from a backup</strong>
          <p>Momentum checks the file before anything changes.</p>
        </div>
        <button
          type="button"
          className="settings-data-button"
          disabled={state.kind === "working" || restoreComplete}
          onClick={() => fileInputRef.current?.click()}
        >
          Choose file
        </button>
        <input
          ref={fileInputRef}
          className="settings-backup-file-input"
          type="file"
          accept="application/json,.json"
          onChange={(event) => chooseBackup(event.target.files?.[0])}
        />
      </div>

      {restoreCandidate && !restoreComplete && (
        <div className="settings-restore-preview" role="region" aria-label="Restore preview">
          <div className="settings-restore-heading">
            <div>
              <span className="text-label">Verified backup</span>
              <h3>{formatBackupDate(restoreCandidate.manifest.createdAt)}</h3>
            </div>
            <span>{restoreCandidate.manifest.totalRecords.toLocaleString()} records</span>
          </div>

          <div className="settings-restore-counts">
            {RECORD_GROUPS.map((group) => (
              <div key={group.label}>
                <span>{group.label}</span>
                <strong>{recordsInGroup(restoreCandidate, group.tables).toLocaleString()}</strong>
              </div>
            ))}
          </div>

          <p className="settings-restore-warning">
            Restoring replaces the data currently on this device. Momentum
            will download a safety backup of your current data first.
          </p>

          <label className="settings-restore-confirmation">
            <input
              type="checkbox"
              checked={restoreConfirmed}
              onChange={(event) => setRestoreConfirmed(event.target.checked)}
            />
            <span>I understand that my current data will be replaced.</span>
          </label>

          <div className="settings-restore-buttons">
            <button type="button" onClick={cancelRestore}>Cancel</button>
            <button
              type="button"
              className="is-destructive"
              disabled={!restoreConfirmed || state.kind === "working"}
              onClick={restoreBackup}
            >
              Restore this backup
            </button>
          </div>
        </div>
      )}

      {state.kind !== "idle" && (
        <p className={`settings-backup-status is-${state.kind}`} role="status">
          {state.message}
        </p>
      )}

      {restoreComplete && (
        <button
          type="button"
          className="settings-reload-button"
          onClick={() => window.location.reload()}
        >
          Reload Momentum
        </button>
      )}
    </section>
  );
}
