# Hosted desktop app

Production address: https://momentum-nu-sand.vercel.app

## Release workflow

GitHub remains the source of truth. Approved changes merge into main; the connected Vercel project builds with npm run build and serves dist. Preview branches are for testing, not daily-driver data. Nothing in this change enables automatic merging.

vercel.json rewrites client-side routes to index.html, preserving direct navigation and refreshes. After deployment, verify /finance, /athletics, /chinese and /settings directly on the production address. Local preview tests verify the production bundle and configuration, not Vercel's live routing infrastructure.

Each production build emits version.json with the same identifier embedded in the JavaScript bundle. An open app checks while visible, on focus (throttled), and every five minutes. A changed identifier offers Later or Reload app. Reload requires confirmation because unfinished forms may contain unsaved drafts. No forced refresh or service worker is installed. The first deployment containing this code cannot notify older builds that lack the update checker.

## Mac installation and migration

1. Export a full backup from the existing localhost app; keep an extra safe copy.
2. Once the release is live and verified, open the stable production address in Safari on macOS Sonoma 14 or later. Choose File > Add to Dock. Chrome/Edge also offer app installation through their browser UI.
3. Open Momentum from the Dock. Restore the backup **inside that app**. Safari web apps have storage separate from the browser tab, so do not assume a browser-tab restore carries over.
4. Check task history, transaction counts and totals, accounts/budgets, workout dates, recipes/photos, Library records, habits and XP. Quit/reopen and confirm the records persist.
5. Keep localhost and the original backup intact until verification is complete. Avoid entering new records into both copies during the transition.

Hosting ships code, not personal data. Dexie/IndexedDB remains local to this origin and browser/app profile. This release adds no account, cloud database, analytics, sync or automatic backup. Clearing website data can remove local records. A new domain or different browser/app profile needs a separate restore. Continue exporting backups.

This first installed release requires internet to load; offline caching is deliberately deferred. A hosted app is not a native macOS binary. Updating application code does not change the storage origin, but future database migrations still require review and backups. Rolling back code alone cannot reverse a data migration.

## Icons and checks

The install icon uses the existing polyhedron logo. PNG sizes 180, 192 and 512 are committed; regenerate with node scripts/render-app-icons.mjs (requires the development Playwright browser). Normal hosting builds do not launch a browser.

Verification: npm run build, npm run lint, npm test, npm run test:e2e, and npx playwright test --config playwright.hosted.config.ts. Browser checks run against isolated local test storage, not real user records.
