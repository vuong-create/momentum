import { db, type FinanceAccountType, type FinanceCategory, type FinanceTransaction, type FinanceTransactionType } from "../../../database/db";

type ImportType = Exclude<FinanceTransactionType, "adjustment">;

export interface FinanceCsvRow {
  sourceRow: number;
  date: string;
  type: ImportType;
  amount: number;
  merchant: string;
  notes?: string;
  sourceAccount: string;
  sourceCategory: string;
  suggestedCategory: string;
  needsReview: boolean;
  fingerprint: string;
}

export interface FinanceCsvIssue { sourceRow: number; message: string; }
export interface FinanceCsvPreview {
  fileName: string;
  fileFingerprint: string;
  year: number;
  rows: FinanceCsvRow[];
  issues: FinanceCsvIssue[];
  accounts: string[];
  sourceCategories: string[];
}

export interface FinanceImportOptions {
  accountMappings: Record<string, { accountId?: number; createType?: FinanceAccountType }>;
  categoryMappings: Record<string, string>;
  rowCategoryOverrides?: Record<number, string>;
  savingsAccountId?: number;
  createSavingsAccount?: boolean;
}

const monthNumbers: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function normalize(value: unknown) { return String(value ?? "").trim(); }
function money(value: string) {
  const text = normalize(value); if (!text || /^\$?\s*-\s*$/.test(text)) return 0;
  const negative = text.includes("(") && text.includes(")"); const parsed = Number(text.replace(/[$,()\s]/g, ""));
  return Number.isFinite(parsed) ? Math.round((negative ? -parsed : parsed) * 100) / 100 : Number.NaN;
}

export function parseCsv(text: string) {
  const rows: string[][] = []; let row: string[] = []; let field = ""; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") { row.push(field); field = ""; }
    else if (character === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += character;
  }
  if (field || row.length) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  return rows;
}

function inferType(sourceType: string, sourceCategory: string): ImportType | null {
  const type = sourceType.toLocaleLowerCase(); const category = sourceCategory.toLocaleLowerCase();
  if (type === "expense") return "expense";
  if (type === "income") return "income";
  if (type === "investment") return "investment";
  if (type === "long-term saving" || type === "saving" || category === "hysa") return "transfer";
  if (["neo", "sj", "sjvbc"].includes(category)) return "income";
  if (category) return "expense";
  return null;
}

function suggestCategory(sourceCategory: string, merchant: string, notes: string) {
  const exact: Record<string, string> = {
    rent: "Rent", groceries: "Groceries", dining: "Dining", apartment: "Household",
    hygiene: "Personal Care", "clothes/shoes": "Clothing", "gym membership": "Fitness",
    gifts: "Gifts", gas: "Gas", chump: "Chump", vanguard: "Vanguard Brokerage",
    neo: "NEO", sj: "SJVBC", sjvbc: "SJVBC", hysa: "HYSA",
  };
  const key = sourceCategory.toLocaleLowerCase(); if (exact[key]) return { name: exact[key], review: false };
  const context = `${merchant} ${notes}`.toLocaleLowerCase();
  if (key === "growth hobbies") {
    if (/italki|canto|chinese|mandarin|language/.test(context)) return { name: "Language Learning", review: false };
    if (/ecv|mlvba|volleyball|tournament|league|revco|rowan|horsham/.test(context)) return { name: "Volleyball", review: false };
    if (/knee|gym|fitness/.test(context)) return { name: "Fitness", review: true };
    return { name: "Miscellaneous", review: true };
  }
  if (key === "entertainment") {
    if (/hbo|subscription|yearly/.test(context)) return { name: "Subscriptions", review: false };
    if (/parking/.test(context)) return { name: "Transportation", review: true };
    return { name: "Entertainment", review: false };
  }
  if (key === "kelsey") return { name: /hotel/.test(context) ? "Travel" : /gift|valentine|wilbur/.test(context) ? "Gifts" : "Miscellaneous", review: true };
  return { name: sourceCategory || "Miscellaneous", review: true };
}

export function inferAccountType(name: string): FinanceAccountType {
  const value = name.toLocaleLowerCase();
  if (/card|boa/.test(value)) return "credit";
  if (/cash|gift/.test(value)) return "cash";
  return "checking";
}

export function previewFinanceCsv(text: string, fileName: string, explicitYear?: number): FinanceCsvPreview {
  const matrix = parseCsv(text); const headers = (matrix[0] ?? []).map((item) => normalize(item).toLocaleLowerCase());
  const required = ["month", "day", "category", "sub-category", "amount", "merchant", "notes", "account"];
  const missing = required.filter((header) => !headers.includes(header));
  if (missing.length) throw new Error(`This CSV is missing: ${missing.join(", ")}.`);
  const fileYear = Number(fileName.match(/(?:19|20)\d{2}/)?.[0]); const year = explicitYear ?? (fileYear >= 1900 ? fileYear : new Date().getFullYear());
  const issues: FinanceCsvIssue[] = []; const rows: FinanceCsvRow[] = [];
  matrix.slice(1).forEach((values, index) => {
    const sourceRow = index + 2; const record = Object.fromEntries(headers.map((header, column) => [header, normalize(values[column])]));
    if (!Object.values(record).some(Boolean)) return;
    const month = monthNumbers[record.month.toLocaleLowerCase()]; const day = Number(record.day); const amount = money(record.amount); const sourceCategory = record["sub-category"]; const type = inferType(record.category, sourceCategory);
    if (!month || !Number.isInteger(day) || day < 1 || day > new Date(year, month, 0).getDate()) { issues.push({ sourceRow, message: "Invalid month or day" }); return; }
    if (!Number.isFinite(amount) || amount <= 0) { issues.push({ sourceRow, message: "Amount is blank, zero, or invalid" }); return; }
    if (!type || !sourceCategory || !record.account) { issues.push({ sourceRow, message: "Transaction type, category, or account is missing" }); return; }
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`; const suggestion = suggestCategory(sourceCategory, record.merchant, record.notes);
    const fingerprint = stableHash([date, type, amount.toFixed(2), record.merchant.toLocaleLowerCase(), record.account.toLocaleLowerCase(), sourceCategory.toLocaleLowerCase(), record.notes.toLocaleLowerCase()].join("|"));
    rows.push({ sourceRow, date, type, amount, merchant: record.merchant || "Untitled", notes: record.notes || undefined, sourceAccount: record.account, sourceCategory, suggestedCategory: suggestion.name, needsReview: suggestion.review || !record.category, fingerprint });
  });
  return { fileName, fileFingerprint: stableHash(text), year, rows, issues, accounts: [...new Set(rows.map((row) => row.sourceAccount))], sourceCategories: [...new Set(rows.map((row) => row.sourceCategory))] };
}

function nowISO() { return new Date().toISOString(); }
export async function importFinanceCsv(preview: FinanceCsvPreview, categories: FinanceCategory[], options: FinanceImportOptions) {
  const activeBatch = await db.financeImportBatches.where("fileFingerprint").equals(preview.fileFingerprint).filter((item) => !item.revertedAt).first();
  if (activeBatch) throw new Error("This exact file has already been imported.");
  const categoryByName = new Map(categories.filter((item) => !item.deletedAt).map((item) => [item.name.toLocaleLowerCase(), item]));
  const timestamp = nowISO(); let importedCount = 0; let skippedCount = preview.issues.length;
  return db.transaction("rw", db.financeAccounts, db.financeTransactions, db.financeImportBatches, async () => {
    const accountIds = new Map<string, number>(); const createdAccountIds: number[] = [];
    for (const sourceName of preview.accounts) {
      const mapping = options.accountMappings[sourceName]; if (!mapping) throw new Error(`Choose an account for ${sourceName}.`);
      if (mapping.accountId) accountIds.set(sourceName, mapping.accountId);
      else {
        const existing = await db.financeAccounts.filter((item) => !item.deletedAt && item.name.toLocaleLowerCase() === sourceName.toLocaleLowerCase()).first();
        const id = existing?.id ?? await db.financeAccounts.add({ name: sourceName, type: mapping.createType ?? inferAccountType(sourceName), openingBalance: 0, createdAt: timestamp, updatedAt: timestamp });
        if (!existing) createdAccountIds.push(id);
        accountIds.set(sourceName, id);
      }
    }
    let savingsAccountId = options.savingsAccountId;
    if (!savingsAccountId && preview.rows.some((row) => row.type === "transfer") && options.createSavingsAccount) {
      const existing = await db.financeAccounts.filter((item) => !item.deletedAt && item.name.toLocaleLowerCase() === "hysa").first();
      savingsAccountId = existing?.id ?? await db.financeAccounts.add({ name: "HYSA", type: "savings", openingBalance: 0, createdAt: timestamp, updatedAt: timestamp });
      if (!existing && savingsAccountId !== undefined) createdAccountIds.push(savingsAccountId);
    }
    if (preview.rows.some((row) => row.type === "transfer") && !savingsAccountId) throw new Error("Choose the destination account for HYSA transfers.");
    const batchId = await db.financeImportBatches.add({ fileName: preview.fileName, fileFingerprint: preview.fileFingerprint, importYear: preview.year, importedCount: 0, skippedCount, createdAccountIds, createdAt: timestamp });
    const existingFingerprints = new Set((await db.financeTransactions.where("importFingerprint").anyOf(preview.rows.map((row) => row.fingerprint)).toArray()).filter((item) => !item.deletedAt).map((item) => item.importFingerprint));
    const records: FinanceTransaction[] = [];
    for (const row of preview.rows) {
      if (existingFingerprints.has(row.fingerprint)) { skippedCount += 1; continue; }
      const targetName = options.rowCategoryOverrides?.[row.sourceRow] ?? options.categoryMappings[row.sourceCategory] ?? row.suggestedCategory;
      const category = categoryByName.get(targetName.toLocaleLowerCase()); if (!category) throw new Error(`Map ${row.sourceCategory} to an active Momentum category.`);
      const accountId = accountIds.get(row.sourceAccount)!;
      records.push({ date: row.date, amount: row.amount, type: row.type, merchant: row.merchant, accountId: row.type === "transfer" ? undefined : accountId, fromAccountId: row.type === "transfer" ? accountId : undefined, toAccountId: row.type === "transfer" ? savingsAccountId : undefined, categoryId: category.id, category: category.name, notes: row.notes, tags: [], investmentHolding: row.type === "investment" ? row.notes : undefined, importBatchId: batchId, importFingerprint: row.fingerprint, createdAt: timestamp, updatedAt: timestamp });
    }
    if (records.length) await db.financeTransactions.bulkAdd(records); importedCount = records.length;
    await db.financeImportBatches.update(batchId, { importedCount, skippedCount });
    return { batchId, importedCount, skippedCount };
  });
}

export async function revertFinanceImport(batchId: number) {
  const timestamp = nowISO();
  await db.transaction("rw", db.financeAccounts, db.financeTransactions, db.financeImportBatches, async () => {
    const batch = await db.financeImportBatches.get(batchId);
    await db.financeTransactions.where("importBatchId").equals(batchId).modify({ deletedAt: timestamp, updatedAt: timestamp });
    for (const accountId of batch?.createdAccountIds ?? []) {
      const stillUsed = await db.financeTransactions.filter((item) => !item.deletedAt && (item.accountId === accountId || item.fromAccountId === accountId || item.toAccountId === accountId)).first();
      if (!stillUsed) await db.financeAccounts.update(accountId, { deletedAt: timestamp, updatedAt: timestamp });
    }
    await db.financeImportBatches.update(batchId, { revertedAt: timestamp });
  });
}
