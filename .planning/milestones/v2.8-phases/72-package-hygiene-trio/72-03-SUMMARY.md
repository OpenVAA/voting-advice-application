---
phase: 72
plan: 03
subsystem: tooling
tags: [package-hygiene, lint, supabase, script-rename]
requires:
  - apps/supabase/package.json `lint` script (renamed)
  - root package.json `supabase:lint` script (renamed)
  - CLAUDE.md §"Supabase Commands" line 63
provides:
  - apps/supabase/package.json `lint:sql` script (matches monorepo `lint:<noun>` family)
  - root package.json `supabase:lint:sql` script
  - Disambiguated SQL lint pipeline — `yarn lint:check` no longer pulls SQL linter
affects:
  - apps/supabase/package.json
  - package.json (root)
  - CLAUDE.md
tech-stack:
  added: []
  patterns:
    - hard-rename-no-deprecated-alias (D-02)
    - script-existence-driven-turbo-fanout
key-files:
  created: []
  modified:
    - apps/supabase/package.json
    - package.json
    - CLAUDE.md
decisions:
  - "Hard rename per D-02 — no deprecated alias retained (yarn supabase:lint now errors)"
  - "Naming: lint:sql matches existing lint:<noun> family in same file (lint:schema)"
  - "No turbo.json edit needed — Turborepo fan-out is script-existence-driven"
  - "No CI workflow edit needed — zero references to yarn supabase:lint in .github/workflows/"
metrics:
  duration: "~3m"
  completed_date: "2026-05-09"
  tasks_completed: 3
  files_modified: 3
  files_created: 0
---

# Phase 72 Plan 03: `@openvaa/supabase` Lint-Script Hard Rename Summary

**One-liner:** Hard-renamed `@openvaa/supabase`'s SQL-only `lint` script (and its root forwarder) to `lint:sql` / `supabase:lint:sql` per D-02; `yarn lint:check` no longer invokes the SQL linter, the `lint:<noun>` naming family is now consistent, and `yarn supabase:lint` produces a clear "script not found" error to surface muscle-memory mismatches.

## Plan Goal

Disambiguate the SQL lint pipeline from the JS lint pipeline. The old `lint` name (plus the root forwarder `supabase:lint`) wrongly suggested SQL lint was part of the same pipeline as every other workspace's `lint` script (which runs ESLint via `eslint --flag v10_config_lookup_from_file src/`). After this rename, `yarn lint:check` is exclusively the JS/TS lint pipeline; `yarn supabase:lint:sql` is a deliberately-callable SQL-specific target.

Per CONTEXT.md D-02: hard rename only, no deprecated alias. Anyone with muscle memory hits a clear `Couldn't find a script named "supabase:lint".` error and updates their command.

## What Changed (4 lines across 3 files)

| File | Line(s) | Before | After |
|------|---------|--------|-------|
| `apps/supabase/package.json` | 12 | `"lint": "supabase db lint --schema public --fail-on warning",` | `"lint:sql": "supabase db lint --schema public --fail-on warning",` |
| `apps/supabase/package.json` | 14 | `"lint:all": "yarn lint && yarn lint:schema",` | `"lint:all": "yarn lint:sql && yarn lint:schema",` |
| `package.json` (root) | 38 | `"supabase:lint": "yarn workspace @openvaa/supabase lint:all"` | `"supabase:lint:sql": "yarn workspace @openvaa/supabase lint:all"` |
| `CLAUDE.md` | 63 | `yarn supabase:lint            # Run SQL linter on all migrations` | `yarn supabase:lint:sql        # Run SQL linter on all migrations (sqlfluff + Splinter advisors)` |

Net diff: 4 insertions, 4 deletions (mechanical rename). No lines added or removed elsewhere.

## Tasks

### Task 1 — Rename `apps/supabase/package.json` `lint` → `lint:sql` and update `lint:all` self-reference
- Renamed `scripts.lint` → `scripts.lint:sql` (preserves the command verbatim).
- Updated `scripts.lint:all` self-reference per RESEARCH Pitfall 3 (`yarn lint && ...` → `yarn lint:sql && ...`).
- No deprecated alias added (per D-02).
- **Commit:** `8de7929d7`

### Task 2 — Rename root `package.json` `supabase:lint` → `supabase:lint:sql` and update CLAUDE.md
- Renamed root forwarder key (value unchanged: `yarn workspace @openvaa/supabase lint:all`).
- Updated `CLAUDE.md` §"Supabase Commands" line 63 to reference the new name; enriched the inline comment to document what the SQL linter actually runs (`sqlfluff + Splinter advisors`).
- Coordinated with Plan 72-01's anchor at CLAUDE.md line 125 (§"Module Resolution & Dependencies") — non-overlapping edit, both wave-1 plans landed cleanly.
- **Commit:** `915430ca2`

### Task 3 — End-to-end verification (no file modifications)
- All grep gates from VALIDATION.md §"Per-Task Verification Map" passed (see "Verification Gates" below).
- `yarn lint:check` confirmed — `supabase db lint` no longer appears in the output (LINT-01 SC-3 / ROADMAP SC-3 satisfied).
- Verified `turbo.json` and `.github/workflows/` are NOT in the plan's git diff (RESEARCH-verified non-edits held).
- No commit (verification-only).

## Verification Gates

All gates from PLAN.md `<verification>` block + `<success_criteria>` ran green:

```
=== 1. Old root script removed ===
got=0 expect=0  OK
=== 2. New root script added ===
got=1 expect=1  OK
=== 3. Old workspace script removed ===
got=0 expect=0  OK
=== 4. New workspace script added ===
got=1 expect=1  OK
=== 5. lint:all self-reference updated ===
    "lint:all": "yarn lint:sql && yarn lint:schema",  OK
=== 6. CLAUDE.md updated ===
supabase:lint:sql got=1 expect>=1  OK
old form got=0 expect=0  OK
=== 7. yarn lint:check no longer invokes SQL linter ===
grep -c "supabase db lint" /tmp/72-03-lint-check.log = 0  OK
=== 8. turbo.json diff ===
0 lines  OK
=== 9. .github/workflows/ diff ===
0 lines  OK
=== 10. active code refs to old supabase:lint ===
git grep -nE '"supabase:lint"' -- ':!.planning/**' ':!CLAUDE.md'  → no hits  OK
git grep -nE 'yarn supabase:lint(\s|$)' -- ':!.planning/**' ':!CLAUDE.md'  → no hits  OK
```

### D-02 hard-rename proof — exact error message produced

`yarn supabase:lint` now errors with:

```
Usage Error: Couldn't find a script named "supabase:lint".

$ yarn run [--inspect] [--inspect-brk] [-T,--top-level] [-B,--binaries-only] [--require #0] <scriptName> ...
```

This is the intended behavior — surfaces muscle-memory mismatches as a clear error per D-02. No deprecated alias retained.

### `turbo.json` and `.github/workflows/` are NOT in the plan's git diff

```
$ git diff --name-only HEAD~2..HEAD
CLAUDE.md
apps/supabase/package.json
package.json
$ git diff HEAD~2..HEAD -- turbo.json | wc -l
       0
$ git diff HEAD~2..HEAD -- .github/workflows/ | wc -l
       0
```

Confirmed: only the three files listed in the plan's `files_modified` frontmatter were modified.

### Turborepo lint fan-out post-rename

Per RESEARCH §"Implicit call sites" + Pitfall 7, Turborepo's `lint` task is script-existence-driven. After the rename, `@openvaa/supabase` no longer has a `lint` script, so `turbo run lint` treats it as a no-op. Inspection:

```
$ yarn turbo run lint --dry=json | jq '.tasks[] | select(.package == "@openvaa/supabase")'
{
  "taskId": "@openvaa/supabase#lint",
  "command": "<NONEXISTENT>",
  "package": "@openvaa/supabase",
  "dependencies": [],
  ...
}
```

Turborepo retains a placeholder task entry but executes nothing (`<NONEXISTENT>` command). The load-bearing acceptance criterion — "`yarn lint:check 2>&1 | grep -c 'supabase db lint'` returns 0" — is satisfied. The placeholder entry is a Turborepo internal detail and doesn't affect runtime behavior; it's the same shape as any other workspace that has no `lint` script defined.

### `yarn lint:check` runtime status

`yarn lint:check` exits 1 due to the **95 pre-existing `apps/frontend` ESLint errors** (Phase 71 / TYPING-01 deferred work per Phase 68 Option C). This is **out of scope** for LINT-01 — the plan's acceptance criterion is specifically that `supabase db lint` does NOT run as part of `yarn lint:check`, regardless of whether `yarn lint:check` itself exits green or red on its own merits. Confirmed: 10 of 11 turbo lint tasks succeed; only `@openvaa/frontend#lint` fails (pre-existing). `@openvaa/supabase#lint` is no longer in the failed task list.

## Deviations from Plan

**None — plan executed exactly as written.**

The plan was carefully scoped: 4 lines across 3 files, no auto-fix needed, no architectural decisions encountered. RESEARCH had pre-verified the non-edit list (`turbo.json`, `.github/workflows/*.yml`); both held. The 95 pre-existing frontend ESLint errors surfaced during the verification step are explicitly out of scope (Phase 71 owns TYPING-01).

## Authentication Gates

None required.

## Cross-Plan Coordination Notes

**CLAUDE.md interaction with Plan 72-01:** Both Wave 1 plans (72-01 and 72-03) modify `CLAUDE.md`. Verified non-overlapping edits before applying:

- **Plan 72-01** added an anchor at line 125 (§"Module Resolution & Dependencies"): `**Canonical package paradigm:** New packages/<name>/ workspaces follow the shape of @openvaa/core ...`
- **Plan 72-03** edited line 63 (§"Supabase Commands"): `yarn supabase:lint` → `yarn supabase:lint:sql`

The two edits are in different sections, did not collide, and the file at HEAD reflects both correctly.

## Deferred Items

The live SQL-lint run (requires `yarn supabase:start` + Postgres) is **deferred to the phase-close manual verification** per VALIDATION.md §"Manual-Only Verifications". The automated gate proves the rename is wired correctly without running the actual linter. The 4 pre-existing SQL `warning extra` entries from Supabase migrations (Phase 68 deferred-tech-debt §3 — `is_localized_string`, `_bulk_upsert_record`, `resolve_email_variables`) remain captured in the project's todo backlog and are out of Phase 72 scope.

## Threat Surface Scan

No new security-relevant surface introduced. The `lint:sql` script value is byte-equivalent to the previous `lint` value — same `supabase db lint --schema public --fail-on warning` command, same external CLI, same arguments. The rename is a script-name change only; no new commands, no shell-injection vectors. STRIDE register entries T-72-03-01..04 from PLAN.md hold unchanged.

## Self-Check: PASSED

**Files claimed modified — all present in git diff (HEAD~2..HEAD):**
- `apps/supabase/package.json` — FOUND
- `package.json` — FOUND
- `CLAUDE.md` — FOUND

**Commits claimed — verified in `git log --oneline -5`:**
- `8de7929d7` — refactor(72-03): rename supabase lint script to lint:sql — FOUND
- `915430ca2` — refactor(72-03): rename root supabase:lint to supabase:lint:sql + update CLAUDE.md — FOUND

**Plan-level success criteria:**
- [x] All 3 tasks executed and committed (Tasks 1+2 commits; Task 3 verification-only)
- [x] SUMMARY.md created at `.planning/phases/72-package-hygiene-trio/72-03-SUMMARY.md`
- [x] `cat apps/supabase/package.json | jq -e '.scripts.lint == null'` exits 0
- [x] `cat apps/supabase/package.json | jq -re '.scripts."lint:sql"'` matches `^supabase db lint --schema public --fail-on warning$`
- [x] `cat apps/supabase/package.json | jq -re '.scripts."lint:all"'` includes `yarn lint:sql`
- [x] `cat package.json | jq -e '.scripts."supabase:lint" == null'` exits 0
- [x] `cat package.json | jq -re '.scripts."supabase:lint:sql"'` exists
- [x] `grep -q "yarn supabase:lint:sql" CLAUDE.md` exits 0
- [x] `grep -cE 'yarn supabase:lint(\s|$)' CLAUDE.md` returns 0
- [x] `git diff --stat turbo.json` shows zero changes (HEAD~2..HEAD)
- [x] `git diff --stat .github/` shows zero changes (HEAD~2..HEAD)
- [x] `yarn lint:check` no longer touches SQL (`grep -c "supabase db lint"` returns 0); pre-existing 95 frontend errors out of scope
- [x] `yarn supabase:lint:sql` is enumerated by `yarn run` and forwards to `lint:all`
