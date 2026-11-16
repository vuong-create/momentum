import { test, expect } from "@playwright/test";

test("sidebar reorders by drag and keyboard and remembers the order", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  const finance = nav.getByRole("link", { name: "Finance", exact: true });
  await finance.dragTo(nav.getByRole("link", { name: "Home", exact: true }));
  await expect(nav.getByRole("link").first()).toHaveAttribute("aria-label", "Finance");
  await expect(page).toHaveURL(/\/$/);
  await page.reload();
  await expect(nav.getByRole("link").first()).toHaveAttribute("aria-label", "Finance");
  await finance.focus();
  await finance.press("Alt+ArrowDown");
  await expect(nav.getByRole("link").nth(1)).toHaveAttribute("aria-label", "Finance");
  await finance.click();
  await expect(page).toHaveURL(/\/finance$/);
  await expect(nav.locator(".dock-item-active")).toHaveAttribute("aria-label", "Finance");
  await expect(page.getByRole("link", { name: "Settings", exact: true })).toBeVisible();
});
