import { db, type FinanceCategory, type FinanceSubcategory } from "../../../database/db";
import { financeCategories as defaultCatalog } from "../financeCatalog";

function nowISO() { return new Date().toISOString(); }
function normalizeName(value: string) { return value.trim().replace(/\s+/g, " "); }

export function visibleFinanceCategories(categories: FinanceCategory[]) {
  return categories.filter((item) => !item.deletedAt).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export function visibleFinanceSubcategories(subcategories: FinanceSubcategory[], includeArchived = false) {
  return subcategories.filter((item) => includeArchived || !item.deletedAt).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

let categoryInitialization: Promise<void> | null = null;

async function initializeFinanceCategories() {
  const timestamp = nowISO();
  await db.transaction("rw", db.financeCategories, db.financeSubcategories, db.financeTransactions, db.financeBudgetAllocations, async () => {
    if (await db.financeCategories.count() === 0) {
      for (const [categoryIndex, category] of defaultCatalog.entries()) {
        const categoryId = await db.financeCategories.add({ name: category.name, sortOrder: categoryIndex, createdAt: timestamp, updatedAt: timestamp });
        for (const [subcategoryIndex, name] of category.subcategories.entries()) {
          await db.financeSubcategories.add({ categoryId, name, sortOrder: subcategoryIndex, isDefault: category.name === "Miscellaneous" && name === "Other", createdAt: timestamp, updatedAt: timestamp });
        }
      }
    }

    const categories = (await db.financeCategories.toArray()).sort((a, b) => a.id! - b.id!);
    for (const duplicate of categories) {
      const canonical = categories.find((item) => item.id !== duplicate.id && item.name.toLocaleLowerCase() === duplicate.name.toLocaleLowerCase() && item.id! < duplicate.id!);
      if (!canonical) continue;
      const duplicateSubs = await db.financeSubcategories.where("categoryId").equals(duplicate.id!).toArray();
      const canonicalSubs = await db.financeSubcategories.where("categoryId").equals(canonical.id!).toArray();
      for (const subcategory of duplicateSubs) {
        const canonicalSub = canonicalSubs.find((item) => item.name.toLocaleLowerCase() === subcategory.name.toLocaleLowerCase());
        if (canonicalSub) {
          await db.financeTransactions.where("subcategoryId").equals(subcategory.id!).modify({ categoryId: canonical.id, subcategoryId: canonicalSub.id });
          const duplicateAllocations = await db.financeBudgetAllocations.where("subcategoryId").equals(subcategory.id!).toArray();
          for (const allocation of duplicateAllocations) {
            const existing = await db.financeBudgetAllocations.where("[month+subcategoryId]").equals([allocation.month, canonicalSub.id!]).first();
            if (existing) await db.financeBudgetAllocations.delete(allocation.id!); else await db.financeBudgetAllocations.update(allocation.id!, { subcategoryId: canonicalSub.id!, updatedAt: timestamp });
          }
          await db.financeSubcategories.delete(subcategory.id!);
        } else await db.financeSubcategories.update(subcategory.id!, { categoryId: canonical.id!, updatedAt: timestamp });
      }
      await db.financeTransactions.where("categoryId").equals(duplicate.id!).modify({ categoryId: canonical.id });
      await db.financeCategories.delete(duplicate.id!);
    }

    const finalCategories = await db.financeCategories.toArray();
    const finalSubcategories = await db.financeSubcategories.toArray();
    await db.financeTransactions.toCollection().modify((transaction) => {
      const legacyCategory = transaction.category;
      if (transaction.categoryId || !legacyCategory) return;
      const category = finalCategories.find((item) => item.name.toLocaleLowerCase() === legacyCategory.toLocaleLowerCase());
      const subcategory = category && finalSubcategories.find((item) => item.categoryId === category.id && item.name.toLocaleLowerCase() === transaction.subcategory?.toLocaleLowerCase());
      transaction.categoryId = category?.id;
      transaction.subcategoryId = subcategory?.id;
    });
  });
}

export function ensureFinanceCategories() {
  categoryInitialization ??= initializeFinanceCategories().finally(() => { categoryInitialization = null; });
  return categoryInitialization;
}

export async function createFinanceCategory(name: string) {
  const normalized = normalizeName(name); if (!normalized) throw new Error("Category name is required.");
  const duplicate = await db.financeCategories.filter((item) => !item.deletedAt && item.name.toLocaleLowerCase() === normalized.toLocaleLowerCase()).first();
  if (duplicate) throw new Error("That category already exists.");
  const timestamp = nowISO(); const sortOrder = await db.financeCategories.filter((item) => !item.deletedAt).count();
  return db.financeCategories.add({ name: normalized, sortOrder, createdAt: timestamp, updatedAt: timestamp });
}

export async function renameFinanceCategory(id: number, name: string) {
  const normalized = normalizeName(name); if (!normalized) throw new Error("Category name is required.");
  const duplicate = await db.financeCategories.filter((item) => item.id !== id && !item.deletedAt && item.name.toLocaleLowerCase() === normalized.toLocaleLowerCase()).first();
  if (duplicate) throw new Error("That category already exists.");
  await db.financeCategories.update(id, { name: normalized, updatedAt: nowISO() });
}

export async function createFinanceSubcategory(categoryId: number, name: string) {
  const normalized = normalizeName(name); if (!normalized) throw new Error("Subcategory name is required.");
  const duplicate = await db.financeSubcategories.filter((item) => item.categoryId === categoryId && !item.deletedAt && item.name.toLocaleLowerCase() === normalized.toLocaleLowerCase()).first();
  if (duplicate) throw new Error("That subcategory already exists here.");
  const timestamp = nowISO(); const sortOrder = await db.financeSubcategories.filter((item) => item.categoryId === categoryId && !item.deletedAt).count();
  return db.financeSubcategories.add({ categoryId, name: normalized, sortOrder, isDefault: false, createdAt: timestamp, updatedAt: timestamp });
}

export async function updateFinanceSubcategory(id: number, patch: { name?: string; categoryId?: number }) {
  const current = await db.financeSubcategories.get(id); if (!current) throw new Error("Subcategory not found.");
  const categoryId = patch.categoryId ?? current.categoryId;
  const name = patch.name === undefined ? current.name : normalizeName(patch.name);
  if (!name) throw new Error("Subcategory name is required.");
  const duplicate = await db.financeSubcategories.filter((item) => item.id !== id && item.categoryId === categoryId && !item.deletedAt && item.name.toLocaleLowerCase() === name.toLocaleLowerCase()).first();
  if (duplicate) throw new Error("That subcategory already exists here.");
  await db.financeSubcategories.update(id, { name, categoryId, updatedAt: nowISO() });
}

export async function moveFinanceCategory(id: number, direction: -1 | 1) {
  const categories = visibleFinanceCategories(await db.financeCategories.toArray());
  const index = categories.findIndex((item) => item.id === id); const target = categories[index + direction];
  if (index < 0 || !target) return;
  await db.transaction("rw", db.financeCategories, async () => {
    await db.financeCategories.update(id, { sortOrder: target.sortOrder, updatedAt: nowISO() });
    await db.financeCategories.update(target.id!, { sortOrder: categories[index].sortOrder, updatedAt: nowISO() });
  });
}

export async function setDefaultFinanceSubcategory(id: number) {
  await db.transaction("rw", db.financeSubcategories, async () => {
    await db.financeSubcategories.toCollection().modify((item) => { item.isDefault = item.id === id; if (item.id === id) item.deletedAt = undefined; item.updatedAt = nowISO(); });
  });
}

export async function archiveFinanceCategory(id: number) {
  const timestamp = nowISO();
  await db.transaction("rw", db.financeCategories, db.financeSubcategories, async () => {
    await db.financeCategories.update(id, { deletedAt: timestamp, updatedAt: timestamp });
    await db.financeSubcategories.where("categoryId").equals(id).modify({ deletedAt: timestamp, updatedAt: timestamp });
  });
}
export async function restoreFinanceCategory(id: number) {
  const timestamp = nowISO();
  await db.transaction("rw", db.financeCategories, db.financeSubcategories, async () => {
    await db.financeCategories.update(id, { deletedAt: undefined, updatedAt: timestamp });
    await db.financeSubcategories.where("categoryId").equals(id).modify({ deletedAt: undefined, updatedAt: timestamp });
  });
}
export async function archiveFinanceSubcategory(id: number) { await db.financeSubcategories.update(id, { deletedAt: nowISO(), isDefault: false, updatedAt: nowISO() }); }
export async function restoreFinanceSubcategory(id: number) { await db.financeSubcategories.update(id, { deletedAt: undefined, updatedAt: nowISO() }); }
