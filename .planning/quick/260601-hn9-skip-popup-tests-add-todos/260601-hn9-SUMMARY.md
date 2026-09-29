---
status: complete
quick_task: 260601-hn9
title: Skip notification popup permutation tests + record two pending todos
subsystem: tests / planning-todos
tags: [e2e, playwright, test-skip, todos, runes-migration, analytics-settings]
requires: []
provides:
  - "perm-per-app-notifications spec skipped (describe.skip, bodies intact)"
  - "pending todo A — re-enable + verify popup management post-runes-migration"
  - "pending todo B — analytics dynamic setting + consent/analytics-event e2e"
affects:
  - "tests/tests/specs/perm/perm-per-app-notifications.spec.ts"
key_files:
  created:
    - .planning/todos/pending/2026-06-01-reenable-perm-per-app-notifications-after-runes-migration.md
    - .planning/todos/pending/2026-06-01-convert-analytics-to-dynamic-setting-add-consent-e2e.md
  modified:
    - tests/tests/specs/perm/perm-per-app-notifications.spec.ts
decisions:
  - "Skip via test.describe.skip (not delete) — preserve test bodies + coverage intent for post-migration re-enable"
  - "Left diff-playwright-reports.ts parity arrays + playwright.config.ts untouched — these 2 tests post-date the v2.10 ship anchor and are in neither PASS_LOCKED nor SKIPPED_TESTS"
metrics:
  duration: ~5min
  completed: 2026-06-01
  tasks: 2
  files: 3
---

# Quick Task 260601-hn9: Skip Notification Popup Tests + Record Todos Summary

Skipped the 2 notification popup permutation tests via `test.describe.skip` (bodies intact) so the suite reports them SKIPPED instead of unstable, and filed two pending todos: re-enable + verify popup management after the full Svelte runes migration, and convert the analytics setting to a dynamic setting with consent/analytics-event e2e coverage.

## What Was Done

**Task 1 — Skip the describe block (commit `1d1249c07`):**
- Changed `test.describe('perm-per-app-notifications', ...)` to `test.describe.skip(...)` in `tests/tests/specs/perm/perm-per-app-notifications.spec.ts`.
- Both test bodies (`voter route shows voter notification only`, `candidate route shows candidate notification only`) left unchanged.
- Added an inline skip comment above the block explaining the runes-migration rationale and pointing to the Todo A file path (bidirectional cross-reference).

**Task 2 — File two pending todos (commit `5da1c09a8`):**
- `2026-06-01-reenable-perm-per-app-notifications-after-runes-migration.md` (Todo A) — re-enable the skipped tests + audit popup management end-to-end after the migration. References the spec file path (closing the cross-reference loop) and the related 2026-05-21 mount-lifecycle todo.
- `2026-06-01-convert-analytics-to-dynamic-setting-add-consent-e2e.md` (Todo B) — reclassify analytics from `StaticSettings` to `DynamicSettings` per CLAUDE.md Settings Architecture, plus a consent/analytics-event e2e. References `packages/app-shared/src/settings/staticSettings.ts` + the CLAUDE.md section.

Both todos follow the established pending-todo format (H1 title; `**Filed:**` / `**Source:**` / `**Home phase:**` / `**Effort:**` metadata; `## Why deferred`; `## Cross-references`).

## Deviations from Plan

None — plan executed exactly as written.

## Untouched-by-design

- `tests/scripts/diff-playwright-reports.ts` — confirmed unmodified. These 2 tests are in neither `PASS_LOCKED_TESTS` nor `SKIPPED_TESTS` (they post-date the v2.10 ship anchor), so skipping them does not regress parity and does not require array edits.
- `tests/playwright.config.ts` — confirmed unmodified. The spec project still runs and reports 2 SKIPPED.
- Pre-existing unrelated working-tree changes (`LogoutButton.svelte`, candidate `+layout.svelte`) were left unstaged as instructed.

## Self-Check: PASSED

- FOUND: tests/tests/specs/perm/perm-per-app-notifications.spec.ts (contains `test.describe.skip`)
- FOUND: .planning/todos/pending/2026-06-01-reenable-perm-per-app-notifications-after-runes-migration.md
- FOUND: .planning/todos/pending/2026-06-01-convert-analytics-to-dynamic-setting-add-consent-e2e.md
- FOUND: commit 1d1249c07 (Task 1)
- FOUND: commit 5da1c09a8 (Task 2)
