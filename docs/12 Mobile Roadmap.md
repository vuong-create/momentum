# Momentum mobile — foundation and connection plan

## Scope agreed November 2026

One product and shared business logic, with phone-specific navigation and layouts.
No Inbox or extra sorting workflow. Phone priorities: task entry/completion,
transaction entry, existing workout viewing/completion, and grocery-list editing.
Full workout logging, body weight, steps and nutrition are future Athletics work.

## Implemented foundation

- Phone bottom navigation: Today, Finance, Athletics, Cooking, Chinese, Library.
- Existing secondary destinations remain directly accessible; no new menu screen.
- Safe-area spacing and readable phone inputs; desktop dock and ordering remain.
- Grocery name, quantity and unit editing through the existing service/database.
- Explicit device-local status. No login, backend, sync or native app is shipped.
- No database migration or automatic personal-data upload.

## Next prerequisite: choose and provision a sync backend

Evaluate Dexie Cloud against an explicit backend plus offline-sync layer.
Do not select paid plans, upload personal data, or create external accounts without
user approval. Confirm personal-only use versus future public release, hosting
ownership, acceptable costs, authentication and recovery before implementation.

Test with synthetic records first. Current numeric IDs and foreign keys need a
reviewed globally unique identity strategy. Preserve relationships, event history,
completion dates, deletions and financial values. Handle recurrence generation
and XP awards idempotently across devices. Test simultaneous edits, offline retries,
deletions, clock differences, device loss and older app versions.

## Safe rollout gates

1. Export and verify a backup from the user's real origin; rehearse migration on a copy.
2. Prove task creation/edit/completion across two isolated clients, including conflicts.
3. Add linked workouts, groceries and finance after their sync invariants pass.
4. Verify record counts and financial totals before enabling the user's account.
5. Retain independent backups and a rollback plan; sync is not backup.

Changing from localhost to a hosted URL or native shell creates separate storage.
Never present an empty new origin as a completed migration. Mobile edits are not
currently visible on desktop. Do not use backup replacement as a concurrent sync strategy.

## Packaging

Start by validating the shared web interface on actual iPhone hardware. Capacitor
is the proposed later iOS shell, not yet installed. Hosting, Home Screen/offline
launch support, native signing, and distribution remain unimplemented.
IndexedDB saves while an already-loaded page is offline; this does not promise
offline launch, background sync, or protection from cleared browser storage.

Native widgets, Apple Health, notifications and share extensions need separate
platform work. Avoid a second copy of task, finance or XP rules.
