# Momentum

A local-first personal operating system for planning, Chinese learning, Athletics,
Cooking, Finance, and Library. Built with React, TypeScript, Vite, and Dexie.

## Run locally

Use Node.js 22.12+ and npm. From the repository directory:

```sh
npm ci
npm run dev
```

Open the address printed by Vite. After pulling changes that add dependencies,
run `npm ci` again before starting the app.

## Data and backups

Personal data lives in IndexedDB in the browser profile and site origin where
you use Momentum. GitHub stores application code, not your ledger, journal,
recipes, or tasks. Different browsers, ports, and hostnames have separate
databases. Use the same address consistently.

Export a full backup in Settings before switching origins or clearing browser
data. Restore validates the package and core records before replacement and
creates a safety copy. Backups contain private personal information. There is
currently no cloud sync, installed extension, or mobile app.

## Verification

```sh
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests use a dedicated local server on port 4175 and fresh isolated browser
contexts. They do not access your everyday browser profile or personal database.
They cover Athletics editing and scheduling, completion from Home, seven-day
layout, task persistence, and backup export.

## Structure

- `src/features/`: pillar screens, services, and tests.
- `src/database/db.ts`: persisted records and additive migrations.
- `src/features/activities/`: shared Planner activity lifecycle.
- `src/features/settings/services/`: backups, validation, and data health.
- `src/experience/`: sound, presence, and motion preferences.
- `src/styles/`: shared design tokens and base styles.
- `e2e/`: browser workflow tests.
- `docs/`: product and architecture references; current implementation notes
  take precedence over historical proposals.

## Development

Inspect GitHub main before implementation. Use a new branch, preserve personal
records, verify affected workflows, and check PR state before publishing further
changes. Planner activities own completion; pillar plans link to those records.
Business rules belong in services. Commit multi-record changes together where
practical and preserve Momentum's existing icons, typefaces, and visual identity.
