import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-02T12:00:00-05:00") });
});

test("save the visible draft, schedule it, and complete its workout from Home", async ({ page }) => {
  await page.goto("/athletics");
  await page.getByRole("button", { name: "B Build / Edit Block" }).click();
  await page.getByRole("combobox", { name: "Block to edit" }).waitFor();
  const editor = page.locator(".athletics-builder");
  await editor.getByRole("textbox", { name: "Block name", exact: true }).fill("November Reliability");
  await expect(page.getByRole("button", { name: "Review & Schedule" })).toBeDisabled();
  await page.getByRole("article").filter({ hasText: "Upper A" }).click();
  await page.getByLabel("Place on").selectOption("0"); // Monday in the stored template.
  await page.getByRole("button", { name: "Save Block", exact: true }).click();
  await expect(page.getByRole("button", { name: "Review & Schedule" })).toBeEnabled();
  await page.getByRole("button", { name: "Review & Schedule" }).click();
  const preview = page.locator(".athletics-schedule-preview");
  await expect(preview.locator("article").nth(1)).toContainText("Upper A");
  await expect(preview.locator("article").nth(2)).toHaveText(/Tue, Nov 3Rest/);
  await page.getByLabel("Week begins Sunday").fill("2026-11-01");
  await page.getByRole("button", { name: "Replace unfinished sessions & schedule" }).click();
  await expect(page.locator(".athletics-block-header")).toContainText("November Reliability");
  await expect(page.locator(".athletics-block-week").first().locator(".athletics-block-day")).toHaveCount(7);
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await page.getByRole("button", { name: "Complete Upper A · Chest + Back Hypertrophy", exact: true }).click();
  await page.getByRole("link", { name: "Athletics", exact: true }).click();
  await expect(page.locator(".athletics-block-week").first().locator("button.status-completed")).toContainText("Upper A");
});

test("all seven editor days stay inside the desktop workspace", async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 800 });
  await page.goto("/athletics");
  await page.getByRole("button", { name: "B Build / Edit Block" }).click();
  const board = page.getByRole("region", { name: "Sunday through Saturday training week" });
  await expect(board.locator(".athletics-week-dropzone")).toHaveCount(7);
  const boardBounds = await board.boundingBox();
  const saturdayBounds = await board.locator(".athletics-week-dropzone").last().boundingBox();
  expect(saturdayBounds!.x + saturdayBounds!.width).toBeLessThanOrEqual(boardBounds!.x + boardBounds!.width + 1);
});

test("Home tasks survive a reload and backup export contains them", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Add a task for today" }).fill("Browser backup check");
  await page.getByRole("textbox", { name: "Add a task for today" }).press("Enter");
  await expect(page.getByRole("button", { name: "Complete Browser backup check", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Complete Browser backup check", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export.*backup/i }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let json = "";
  for await (const chunk of stream!) json += chunk.toString();
  const backup = JSON.parse(json);
  expect(backup.data.plannedActivities.some((activity: { title: string }) => activity.title === "Browser backup check")).toBe(true);
  await page.locator("input[type=file]").setInputFiles({ name: "test-backup.json", mimeType: "application/json", buffer: Buffer.from(json) });
  await expect(page.getByRole("region", { name: "Restore preview" })).toBeVisible();
  await page.getByRole("checkbox", { name: "I understand that my current data will be replaced." }).check();
  const safetyDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Restore this backup" }).click();
  expect((await safetyDownload).suggestedFilename()).toContain("momentum-safety-");
  await expect(page.getByText(/records restored\./)).toBeVisible();
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await expect(page.getByRole("button", { name: "Complete Browser backup check", exact: true })).toBeVisible();
});

test("ledger entry keeps decimal amounts and edits after reload", async ({ page }) => {
  await page.goto("/finance");
  await page.getByRole("button", { name: "○ Accounts", exact: true }).click();
  await page.getByRole("button", { name: "＋ Add account", exact: true }).click();
  await page.getByRole("textbox", { name: "Account name" }).fill("Test checking");
  await page.getByRole("button", { name: "Save account", exact: true }).click();
  await page.getByRole("button", { name: "≡ Transactions", exact: true }).click();
  const composer = page.locator(".finance-transaction-composer");
  await composer.getByLabel("Merchant").fill("Test merchant");
  await composer.getByLabel("Amount").fill("12.34");
  await composer.getByLabel("Notes").fill("Original note");
  await composer.getByLabel("Notes").press("Enter");
  const row = page.locator(".finance-transaction-table>article").filter({ hasText: "Test merchant" });
  await expect(row).toContainText("12.34");
  await row.getByRole("button", { name: "Edit", exact: true }).click();
  await composer.getByLabel("Amount").fill("15.67");
  await composer.getByLabel("Notes").fill("Updated note");
  await composer.getByRole("button", { name: "Update" }).click();
  await expect(row).toContainText("15.67");
  await page.reload();
  await expect(row).toContainText("15.67");
  await expect(row).toContainText("Updated note");
});
