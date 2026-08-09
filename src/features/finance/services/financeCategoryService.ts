import { db, type FinanceCategory, type FinanceCategoryFlow, type FinanceTransaction } from "../../../database/db";
import { financeCategories as defaultCatalog } from "../financeCatalog";

function nowISO() { return new Date().toISOString(); }
function normalizeName(value: string) { return value.trim().replace(/\s+/g, " "); }
function normalized(value?: string) { return value?.trim().toLocaleLowerCase() ?? ""; }

export function visibleFinanceCategories(categories: FinanceCategory[]) {
  return categories.filter((item) => !item.deletedAt).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

const expenseAliases: Record<string, string> = {
  hygiene: "Personal Care",
  gym: "Fitness",
  maintenance: "Transportation",
  giving: "Gifts",
  other: "Miscellaneous",
  "growth hobbies": "Miscellaneous",
};
const investmentAliases: Record<string, string> = { brokerage: "Vanguard Brokerage", vanguard: "Vanguard Brokerage" };

function mappedName(flowType: FinanceCategoryFlow, candidates: Array<string | undefined>) {
  const names = defaultCatalog.filter((item) => item.flowType === flowType);
  for (const candidate of candidates) {
    const key = normalized(candidate); if (!key) continue;
    const alias = flowType === "expense" ? expenseAliases[key] : flowType === "investment" ? investmentAliases[key] : undefined;
    const match = names.find((item) => normalized(item.name) === normalized(alias ?? candidate));
    if (match) return match.name;
  }
  return undefined;
}

function transactionFlow(item: FinanceTransaction): FinanceCategoryFlow | undefined {
  if (item.type === "expense" || item.type === "income" || item.type === "investment") return item.type;
  if (item.type === "transfer") return "saving";
  return undefined;
}

let categoryInitialization: Promise<void> | null = null;

async function initializeFinanceCategories() {
  const existing = await db.financeCategories.toArray();
  const needsCatalogMigration = existing.length === 0 || existing.some((item) => !item.flowType);
  if (!needsCatalogMigration) return;

  const timestamp = nowISO();
  await db.transaction("rw", db.financeAccounts, db.financeCategories, db.financeSubcategories, db.financeTransactions, db.financeBudgetAllocations, async () => {
    const legacyCategories = await db.financeCategories.toArray();
    const legacySubcategories = await db.financeSubcategories.toArray();
    const legacyAllocations = await db.financeBudgetAllocations.toArray();
    const accounts = await db.financeAccounts.toArray();
    const categoryById = new Map(legacyCategories.map((item) => [item.id!, item]));
    const subcategoryById = new Map(legacySubcategories.map((item) => [item.id!, item]));

    await db.financeCategories.clear();
    await db.financeSubcategories.clear();
    await db.financeBudgetAllocations.clear();

    const newCategoryIds = new Map<string, number>();
    for (const [index, item] of defaultCatalog.entries()) {
      const id = await db.financeCategories.add({ ...item, sortOrder: index, createdAt: timestamp, updatedAt: timestamp });
      newCategoryIds.set(`${item.flowType}:${normalized(item.name)}`, id);
    }

    const resolveTransactionName = (item: FinanceTransaction) => {
      const flowType = transactionFlow(item); if (!flowType) return undefined;
      const legacyCategory = item.categoryId ? categoryById.get(item.categoryId)?.name : item.category;
      const legacySubcategory = item.subcategoryId ? subcategoryById.get(item.subcategoryId)?.name : item.subcategory;
      if (flowType === "saving") {
        const destination = accounts.find((account) => account.id === item.toAccountId)?.name;
        return mappedName("saving", [destination, legacySubcategory, legacyCategory]);
      }
      return mappedName(flowType, [legacySubcategory, item.investmentHolding, item.merchant, legacyCategory]);
    };

    await db.financeTransactions.toCollection().modify((item) => {
      const flowType = transactionFlow(item);
      const name = resolveTransactionName(item);
      item.categoryId = flowType && name ? newCategoryIds.get(`${flowType}:${normalized(name)}`) : undefined;
      item.category = name ?? (flowType ? "Needs category" : undefined);
      item.subcategoryId = undefined;
      item.subcategory = undefined;
      item.updatedAt = timestamp;
    });

    const allocations = new Map<string, { month: string; categoryId: number; baseAmount: number; rolloverAmount: number }>();
    for (const allocation of legacyAllocations.filter((item) => !item.deletedAt)) {
      const legacySubcategory = allocation.subcategoryId ? subcategoryById.get(allocation.subcategoryId) : undefined;
      const legacyCategory = legacySubcategory ? categoryById.get(legacySubcategory.categoryId) : allocation.categoryId ? categoryById.get(allocation.categoryId) : undefined;
      const flowType: FinanceCategoryFlow = legacyCategory?.name === "Investments" ? "investment" : legacyCategory?.name === "Income" ? "income" : legacyCategory?.name === "Savings" ? "saving" : "expense";
      const name = mappedName(flowType, [legacySubcategory?.name, legacyCategory?.name]);
      const categoryId = name ? newCategoryIds.get(`${flowType}:${normalized(name)}`) : undefined;
      if (!categoryId) continue;
      const key = `${allocation.month}:${categoryId}`; const current = allocations.get(key);
      allocations.set(key, { month: allocation.month, categoryId, baseAmount: (current?.baseAmount ?? 0) + allocation.baseAmount, rolloverAmount: (current?.rolloverAmount ?? 0) + allocation.rolloverAmount });
    }
    if (allocations.size) await db.financeBudgetAllocations.bulkAdd([...allocations.values()].map((item) => ({ ...item, createdAt: timestamp, updatedAt: timestamp })));
  });
}

export function ensureFinanceCategories() {
  categoryInitialization ??= initializeFinanceCategories().finally(() => { categoryInitialization = null; });
  return categoryInitialization;
}

export async function createFinanceCategory(name: string, flowType: FinanceCategoryFlow) {
  const value = normalizeName(name); if (!value) throw new Error("Category name is required.");
  const duplicate = await db.financeCategories.filter((item) => !item.deletedAt && item.flowType === flowType && normalized(item.name) === normalized(value)).first();
  if (duplicate) throw new Error("That category already exists in this group.");
  const timestamp = nowISO();
  const flowCategories = await db.financeCategories.filter((item) => item.flowType === flowType && !item.deletedAt).toArray();
  const sortOrder = Math.max(-1, ...flowCategories.map((item) => item.sortOrder)) + 1;
  return db.financeCategories.add({ name: value, flowType, sortOrder, createdAt: timestamp, updatedAt: timestamp });
}

export async function renameFinanceCategory(id: number, name: string) {
  const current = await db.financeCategories.get(id); if (!current) throw new Error("Category not found.");
  const value = normalizeName(name); if (!value) throw new Error("Category name is required.");
  const duplicate = await db.financeCategories.filter((item) => item.id !== id && !item.deletedAt && item.flowType === current.flowType && normalized(item.name) === normalized(value)).first();
  if (duplicate) throw new Error("That category already exists in this group.");
  await db.transaction("rw", db.financeCategories, db.financeTransactions, async () => {
    await db.financeCategories.update(id, { name: value, updatedAt: nowISO() });
    await db.financeTransactions.where("categoryId").equals(id).modify({ category: value, updatedAt: nowISO() });
  });
}

export async function moveFinanceCategory(id: number, direction: -1 | 1) {
  const current = await db.financeCategories.get(id); if (!current) return;
  const categories = visibleFinanceCategories(await db.financeCategories.toArray()).filter((item) => item.flowType === current.flowType);
  const index = categories.findIndex((item) => item.id === id); const target = categories[index + direction];
  if (index < 0 || !target) return;
  await db.transaction("rw", db.financeCategories, async () => {
    const timestamp = nowISO();
    await db.financeCategories.update(id, { sortOrder: target.sortOrder, updatedAt: timestamp });
    await db.financeCategories.update(target.id!, { sortOrder: categories[index].sortOrder, updatedAt: timestamp });
  });
}

export async function archiveFinanceCategory(id: number) { await db.financeCategories.update(id, { deletedAt: nowISO(), updatedAt: nowISO() }); }
export async function restoreFinanceCategory(id: number) { await db.financeCategories.update(id, { deletedAt: undefined, updatedAt: nowISO() }); }
