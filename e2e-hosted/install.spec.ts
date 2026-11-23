import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('hosting rewrite, manifest, icons and deep links are configured', async ({ page, request }) => {
  const hosting = JSON.parse(readFileSync('vercel.json', 'utf8'));
  expect(hosting.rewrites).toContainEqual({ source: '/(.*)', destination: '/index.html' });
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest).toMatchObject({ name: 'Momentum', display: 'standalone', start_url: '/', scope: '/' });
  for (const icon of manifest.icons) {
    const response = await request.get(icon.src);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('image/png');
  }
  for (const path of ['/finance', '/athletics', '/chinese', '/settings']) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
    await page.reload();
    await expect(page.locator('h1')).toBeVisible();
  }
  await expect(page.getByRole('region', { name: 'Install Momentum' })).toContainText('Install first');
});

test('an update preserves an open draft and reloads only with consent', async ({ page }) => {
  await page.route('**/version.json', route => route.fulfill({ json: { buildId: 'new-release' } }));
  await page.goto('/');
  const notice = page.getByRole('status', { name: 'Momentum update' });
  await expect(notice).toBeVisible();
  const input = page.getByRole('textbox', { name: 'Add a task for today' });
  await input.fill('Unfinished draft');
  page.once('dialog', dialog => dialog.dismiss());
  await notice.getByRole('button', { name: 'Reload app' }).click();
  await expect(input).toHaveValue('Unfinished draft');
  await notice.getByRole('button', { name: 'Later' }).click();
  await expect(notice).toHaveCount(0);
  await expect(input).toHaveValue('Unfinished draft');
});

test('reload for an update keeps saved tasks', async ({ page }) => {
  await page.route('**/version.json', route => route.fulfill({ json: { buildId: 'new-release' } }));
  await page.goto('/');
  const input = page.getByRole('textbox', { name: 'Add a task for today' });
  await input.fill('Keep this saved task');
  await input.press('Enter');
  await expect(page.getByRole('button', { name: 'Complete Keep this saved task', exact: true })).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Reload app', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Complete Keep this saved task', exact: true })).toBeVisible();
});
