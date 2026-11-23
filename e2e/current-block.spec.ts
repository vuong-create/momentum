import { test, expect } from "@playwright/test";

test("move a completed workout, add a session, delete and undo", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-18T12:00:00-05:00") });
  await page.goto("/athletics");
  await page.evaluate(async () => {
    // Isolated browser-test database, never the user's daily-driver origin.
    const path = "/src/features/athletics/services/trainingBlockService.ts";
    const service = await import(/* @vite-ignore */ path);
    const templateId = await service.ensureAthleticsBlockTemplates();
    await service.scheduleAthleticsTrainingBlock(templateId, { name: "Browser block", startDate: "2026-11-01", weekCount: 4 });
  });
  await page.reload();
  await page.getByRole("button", { name: "Upper A on 2026-11-03", exact: true }).click();
  await page.getByRole("button", { name: "Mark complete ✓", exact: true }).click();
  await page.getByRole("button", { name: "Upper A on 2026-11-03", exact: true }).dragTo(page.getByRole("group", { name: "Sessions on 2026-11-04", exact: true }));
  const moved = page.getByRole("button", { name: "Upper A on 2026-11-04", exact: true });
  await expect(moved).toHaveClass(/status-completed/);
  await moved.click();
  await page.getByLabel("Move to date").fill("2026-11-05");
  await page.getByRole("button", { name: "Move session", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Thursday, November 5");
  await page.getByRole("button", { name: "Delete session", exact: true }).click();
  await page.getByRole("button", { name: "Confirm delete", exact: true }).click();
  await expect(page.getByRole("button", { name: "Upper A on 2026-11-05", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByRole("button", { name: "Upper A on 2026-11-05", exact: true })).toHaveClass(/status-completed/);
  await page.getByRole("button", { name: "Add session on 2026-11-18", exact: true }).click();
  const form = page.getByRole("form", { name: "Add block session" });
  await form.getByLabel("Name", { exact: true }).fill("Extra gym");
  await form.getByRole("button", { name: "Add session", exact: true }).click();
  await expect(page.getByRole("button", { name: "Extra gym on 2026-11-18", exact: true })).toBeVisible();
  await page.screenshot({ path: "/tmp/momentum-current-block.png", fullPage: true });
  await page.reload();
  await expect(page.getByRole("button", { name: "Upper A on 2026-11-05", exact: true })).toHaveClass(/status-completed/);
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await expect(page.getByRole("button", { name: /Complete Extra gym/ })).toBeVisible();
});
