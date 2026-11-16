import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test("phone transaction entry preserves decimals after reload", async ({ page }) => {
  await page.goto("/finance");
  await page.getByRole("button", { name: "○ Accounts", exact: true }).click();
  await page.getByRole("button", { name: "＋ Add account", exact: true }).click();
  await page.getByRole("textbox", { name: "Account name" }).fill("Phone checking");
  await page.getByRole("button", { name: "Save account", exact: true }).click();
  await page.getByRole("button", { name: "≡ Transactions", exact: true }).click();
  const composer = page.locator(".finance-transaction-composer");
  await composer.getByLabel("Merchant").fill("Phone coffee");
  await composer.getByLabel("Amount").fill("4.75");
  await composer.getByLabel("Notes").fill("Mobile entry");
  await composer.getByLabel("Notes").press("Enter");
  const row = page.locator(".finance-transaction-table>article").filter({ hasText: "Phone coffee" });
  await expect(row).toContainText("4.75");
  await page.reload();
  await expect(row).toContainText("4.75");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test("phone navigation supports task capture and direct destinations", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Mobile navigation" });
  await expect(nav).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeHidden();
  await expect(page.getByText("On this device · not synced")).toBeVisible();
  const input = page.getByRole("textbox", { name: "Add a task for today" });
  await input.fill("Phone task");
  await input.press("Enter");
  await expect(page.getByRole("button", { name: "Complete Phone task", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Complete Phone task", exact: true })).toBeVisible();
  for (const label of ["Finance", "Athletics", "Cooking", "Chinese", "Library", "Today"]) {
    await nav.getByRole("link", { name: label, exact: true }).click();
    await expect(nav.getByRole("link", { name: label, exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.locator(".route-loading")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
  await page.getByRole("navigation", { name: "Other pages" }).getByRole("link", { name: "Settings" }).click();
  await expect(page).toHaveURL(/settings$/);
});

test("phone grocery edits persist and preserve check-off behavior", async ({ page }, testInfo) => {
  await page.goto("/cooking");
  await page.getByRole("button", { name: /Groceries/ }).click();
  const input = page.getByRole("textbox", { name: "Add grocery item" });
  await input.fill("Milk"); await input.press("Enter");
  await page.getByRole("button", { name: "Edit Milk", exact: true }).click();
  const editor = page.getByRole("form", { name: "Edit Milk" });
  await editor.getByRole("textbox", { name: "Name", exact: true }).fill("Oat milk");
  await editor.getByRole("spinbutton", { name: "Quantity" }).fill("1.5");
  await editor.getByRole("textbox", { name: "Unit" }).fill("liters");
  await editor.getByRole("button", { name: "Save item" }).click();
  await expect(page.getByText("1.5 liters", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Edit Oat milk", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Check Oat milk", exact: true }).click();
  await expect(page.getByRole("button", { name: "Uncheck Oat milk", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("mobile-groceries.png"), fullPage: true });
});
