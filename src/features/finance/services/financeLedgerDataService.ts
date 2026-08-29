import type { FinanceAccount, FinanceCategory, FinanceTransaction } from "../../../database/db";
import { isTransactionHiddenFromLedger, transactionSignedAmount } from "./financeCalculations";

export type FinanceLedgerIssueKind = "duplicate" | "merchant" | "missing" | "invalid";
export type FinanceLedgerIssueSeverity = "error" | "review";

export interface FinanceLedgerIssue {
  id: string;
  kind: FinanceLedgerIssueKind;
  severity: FinanceLedgerIssueSeverity;
  title: string;
  detail: string;
  transactionIds: number[];
}

export interface FinanceLedgerAudit {
  transactionCount: number;
  issues: FinanceLedgerIssue[];
  errorCount: number;
  reviewCount: number;
}

function cleanText(value: string | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function normalizedMerchant(value: string) {
  return cleanText(value).toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

function transactionLabel(item: FinanceTransaction) {
  return `${item.date || "No date"} · ${cleanText(item.merchant) || "No merchant"}`;
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

function editDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = previous[0]; previous[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const above = previous[rightIndex];
      previous[rightIndex] = Math.min(previous[rightIndex] + 1, previous[rightIndex - 1] + 1, diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return previous[right.length];
}

function duplicateKey(item: FinanceTransaction) {
  const route = item.type === "transfer" || item.type === "investment"
    ? `${item.fromAccountId ?? ""}>${item.toAccountId ?? ""}`
    : String(item.accountId ?? "");
  return [item.date, item.type, item.amount.toFixed(2), normalizedMerchant(item.merchant), route, item.categoryId ?? item.category ?? ""].join("|");
}

export function auditFinanceTransactions(transactions: FinanceTransaction[], accounts: FinanceAccount[], categories: FinanceCategory[]): FinanceLedgerAudit {
  const active = transactions.filter((item) => !item.deletedAt);
  const accountMap = new Map(accounts.map((item) => [item.id, item]));
  const categoryMap = new Map(categories.map((item) => [item.id, item]));
  const issues: FinanceLedgerIssue[] = [];

  active.forEach((item, index) => {
    const transactionIds = item.id === undefined ? [] : [item.id];
    const prefix = `${item.id ?? index}-${item.date}`;
    if (!isValidDate(item.date)) issues.push({ id: `${prefix}-date`, kind: "invalid", severity: "error", title: "Invalid date", detail: `${transactionLabel(item)} has a date that cannot be read.`, transactionIds });
    if (!Number.isFinite(item.amount) || item.amount <= 0) issues.push({ id: `${prefix}-amount`, kind: "invalid", severity: "error", title: "Invalid amount", detail: `${transactionLabel(item)} needs an amount greater than zero.`, transactionIds });
    if (!cleanText(item.merchant)) issues.push({ id: `${prefix}-merchant`, kind: "missing", severity: "review", title: "Merchant is missing", detail: `${item.date || "Undated transaction"} does not have a merchant or description.`, transactionIds });

    const routed = item.type === "transfer" || item.type === "investment";
    const accountIds = routed ? [item.fromAccountId, item.toAccountId] : [item.accountId];
    accountIds.forEach((accountId, routeIndex) => {
      if (accountId === undefined) {
        issues.push({ id: `${prefix}-account-${routeIndex}`, kind: "missing", severity: "error", title: routed ? "Transfer route is incomplete" : "Account is missing", detail: `${transactionLabel(item)} is not connected to ${routed ? (routeIndex === 0 ? "a source account" : "a destination account") : "an account"}.`, transactionIds });
      } else if (!accountMap.has(accountId) || accountMap.get(accountId)?.deletedAt) {
        issues.push({ id: `${prefix}-account-${routeIndex}`, kind: "missing", severity: "error", title: "Account reference is unavailable", detail: `${transactionLabel(item)} points to an account that no longer exists.`, transactionIds });
      }
    });
    if (routed && item.fromAccountId !== undefined && item.fromAccountId === item.toAccountId) issues.push({ id: `${prefix}-route`, kind: "invalid", severity: "error", title: "Source and destination match", detail: `${transactionLabel(item)} moves money to the same account.`, transactionIds });

    if (item.type !== "adjustment") {
      const category = item.categoryId === undefined ? undefined : categoryMap.get(item.categoryId);
      if (!category || category.deletedAt) issues.push({ id: `${prefix}-category`, kind: "missing", severity: "review", title: "Category needs review", detail: `${transactionLabel(item)} is not connected to an active category.`, transactionIds });
      else {
        const expectedFlow = item.type === "transfer" ? "saving" : item.type;
        if (category.flowType !== expectedFlow) issues.push({ id: `${prefix}-flow`, kind: "invalid", severity: "review", title: "Category type may not match", detail: `${transactionLabel(item)} is a ${item.type}, but “${category.name}” is configured for ${category.flowType}.`, transactionIds });
      }
    }
  });

  const duplicateGroups = new Map<string, FinanceTransaction[]>();
  active.forEach((item) => { const key = duplicateKey(item); duplicateGroups.set(key, [...(duplicateGroups.get(key) ?? []), item]); });
  [...duplicateGroups.values()].filter((group) => group.length > 1).forEach((group, index) => {
    issues.push({ id: `duplicate-${index}`, kind: "duplicate", severity: "review", title: `${group.length} possible duplicate transactions`, detail: `${transactionLabel(group[0])} appears more than once with the same amount, category, and account route.`, transactionIds: group.flatMap((item) => item.id === undefined ? [] : [item.id]) });
  });

  const merchantForms = new Map<string, Set<string>>();
  active.forEach((item) => {
    const normalized = normalizedMerchant(item.merchant); const display = cleanText(item.merchant);
    if (normalized && display) merchantForms.set(normalized, new Set([...(merchantForms.get(normalized) ?? []), display]));
  });
  [...merchantForms.entries()].filter(([, forms]) => forms.size > 1).forEach(([key, forms]) => {
    const labels = [...forms].sort();
    issues.push({ id: `merchant-format-${key}`, kind: "merchant", severity: "review", title: "Merchant formatting varies", detail: `${labels.join(" / ")} appear to be the same merchant.`, transactionIds: active.filter((item) => normalizedMerchant(item.merchant) === key).flatMap((item) => item.id === undefined ? [] : [item.id]) });
  });

  const merchants = [...merchantForms.keys()].filter((item) => item.length >= 4);
  const fuzzySeen = new Set<string>();
  for (let leftIndex = 0; leftIndex < merchants.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < merchants.length; rightIndex += 1) {
      const left = merchants[leftIndex]; const right = merchants[rightIndex];
      if (left[0] !== right[0] || Math.abs(left.length - right.length) > 2) continue;
      const threshold = Math.max(left.length, right.length) >= 8 ? 2 : 1;
      if (editDistance(left, right) > threshold) continue;
      const pairKey = [left, right].sort().join("|"); if (fuzzySeen.has(pairKey)) continue; fuzzySeen.add(pairKey);
      const leftLabel = [...merchantForms.get(left)!][0]; const rightLabel = [...merchantForms.get(right)!][0];
      issues.push({ id: `merchant-spelling-${pairKey}`, kind: "merchant", severity: "review", title: "Possible merchant spelling variation", detail: `“${leftLabel}” and “${rightLabel}” are very similar. Confirm whether they should use one name.`, transactionIds: active.filter((item) => [left, right].includes(normalizedMerchant(item.merchant))).flatMap((item) => item.id === undefined ? [] : [item.id]) });
    }
  }

  issues.sort((left, right) => (left.severity === right.severity ? left.title.localeCompare(right.title) : left.severity === "error" ? -1 : 1));
  return { transactionCount: active.length, issues, errorCount: issues.filter((item) => item.severity === "error").length, reviewCount: issues.filter((item) => item.severity === "review").length };
}

function csvCell(value: unknown) {
  const text = value === undefined || value === null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildFinanceTransactionsCsv(transactions: FinanceTransaction[], accounts: FinanceAccount[], categories: FinanceCategory[]) {
  const accountMap = new Map(accounts.map((item) => [item.id, item.name]));
  const categoryMap = new Map(categories.map((item) => [item.id, item.name]));
  const headers = ["Date", "Type", "Merchant", "Amount", "Signed Amount", "Category", "Account", "From Account", "To Account", "Notes", "Investment Holding", "Hidden From Ledger", "Created At"];
  const rows = transactions.filter((item) => !item.deletedAt).sort((left, right) => left.date.localeCompare(right.date) || left.createdAt.localeCompare(right.createdAt)).map((item) => [
    item.date, item.type, item.merchant, item.amount.toFixed(2), transactionSignedAmount(item).toFixed(2), categoryMap.get(item.categoryId) ?? item.category ?? "", accountMap.get(item.accountId) ?? "", accountMap.get(item.fromAccountId) ?? "", accountMap.get(item.toAccountId) ?? "", item.notes ?? "", item.investmentHolding ?? "", isTransactionHiddenFromLedger(item) ? "Yes" : "No", item.createdAt,
  ]);
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}
