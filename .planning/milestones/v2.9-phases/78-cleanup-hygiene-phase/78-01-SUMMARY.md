---
phase: 78-cleanup-hygiene-phase
plan: 01
subsystem: tooling-hygiene
tags: [clean-01, dev-to-db-rename, dev-clean, vite-cache-wipe, deprecated-aliases, hygiene]
requirements: [CLEAN-01]
type: execute
wave: 1
depends_on: []
provides:
  - "Canonical `db:*` Supabase script family in root `package.json`"
  - "New `dev:clean` script (vite + svelte-kit cache wipe)"
  - "Deprecated `dev:*` alias forwarders preserved through v2.10"
  - "Updated CLAUDE.md Supabase Commands documentation"
affects: [package.json, CLAUDE.md, .planning/todos/]
tech-stack:
  added: []
  patterns:
    - "deprecated-alias forwarder shape: `echo '[deprecated] ...' >&2 && yarn <canonical>`"
    - "chain semantics: `supabase:reset && dev:clean` (reset before cache wipe; never reversed)"
key-files:
  created:
    - .planning/phases/78-cleanup-hygiene-phase/78-01-SUMMARY.md
  modified:
    - package.json
    - CLAUDE.md
    - .planning/todos/completed/2026-05-10-rename-package-scripts-dev-to-db.md (moved from pending/ + resolution addendum)
decisions:
  - "Eight `dev:*` Supabase scripts renamed to `db:*`; top-level `yarn dev` (frontend dev server) untouched (source todo + CONTEXT D-01)."
  - "All 8 old `dev:*` names kept as deprecated aliases emitting `[deprecated]` warning + forwarding (CONTEXT D-02; back-compat for in-flight Phases 76/77 and existing .planning/ cross-refs)."
  - "`db:reset` / `db:reset-with-data` chain `dev:clean` AFTER `supabase:reset` via `&&` (CONTEXT D-03)."
  - "Alias removal scheduled for v2.10+ cleanup (CONTEXT line 516)."
metrics:
  duration_seconds: 153
  tasks_completed: 2
  files_modified: 3
  completed: 2026-05-12
commits:
  - 27e42f52d feat(78-01) rename dev:* supabase scripts to db:*; add dev:clean
  - b054aed37 docs(78-01) update CLAUDE.md Supabase Commands for db:* rename + dev:clean
---

# Phase 78 Plan 01: CLEAN-01 dev:* → db:* Rename + dev:clean Summary

Renamed the 8 Supabase-facing `dev:*` root-package scripts to canonical `db:*` names, shipped a new `dev:clean` script that wipes the v2.8-close vite-cache gotcha targets, chained `dev:clean` into both `db:reset` and `db:reset-with-data`, preserved the old names as deprecation-warning forwarders through v2.10, and synchronised `CLAUDE.md`.

## Rename Map (8 renames + 1 new + 8 aliases)

| Old (now deprecated alias)  | New (canonical)        | Body                                                                                              |
| --------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------- |
| `dev:start`                 | `db:start`             | `yarn build && yarn supabase:start && yarn workspace @openvaa/frontend dev` (unchanged)           |
| `dev:down`                  | `db:down`              | `yarn supabase:stop` (unchanged)                                                                  |
| `dev:stop`                  | `db:stop`              | `yarn supabase:stop` (unchanged)                                                                  |
| `dev:reset`                 | `db:reset`             | `yarn supabase:reset && yarn dev:clean` (chain added per D-03)                                    |
| `dev:reset-with-data`       | `db:reset-with-data`   | `yarn supabase:reset && yarn db:seed --template default && yarn dev:clean` (chain added per D-03) |
| `dev:seed`                  | `db:seed`              | `yarn workspace @openvaa/dev-seed seed` (unchanged)                                               |
| `dev:seed:teardown`         | `db:seed:teardown`     | `yarn workspace @openvaa/dev-seed seed:teardown` (unchanged)                                      |
| `dev:status`                | `db:status`            | `yarn supabase:status` (unchanged)                                                                |
| (none)                      | `dev:clean` (NEW)      | `rm -rf apps/frontend/.svelte-kit apps/frontend/node_modules/.vite`                               |

Each of the 8 deprecated aliases now emits:
```
[deprecated] yarn dev:<old> is now yarn db:<new>; alias will be removed after v2.10
```
to stderr, then forwards to the canonical `db:*` (yarn's natural trailing-arg forwarding preserves `--template`, `--likert-only`, etc.).

Top-level `yarn dev` (`yarn supabase:start && yarn _dev:concurrent`, frontend dev server) is unchanged per source todo + RESEARCH.

## Task Execution

### Task 1 — `package.json` rename + new `dev:clean` + chains + deprecated aliases
- **Commit:** `27e42f52d`
- **Files modified:** `package.json`
- **Verification (automated invariant):** `node -e "..."` confirms all 8 canonical `db:*` keys + `dev:clean` + 8 deprecated `dev:*` keys present; `db:reset` and `db:reset-with-data` bodies contain `dev:clean`; `dev:reset` alias body contains `deprecated`; top-level `dev` unchanged. **PASS.**
- **CI workflow scan:** `grep -rE "yarn dev:(reset|seed|status|start|down|stop|clean)" .github/workflows/` -> exit 1, no matches (CONTEXT D-04 re-verified; 6 workflow files inspected: claude-code-review.yml, claude-solve-issue.yml, claude.yml, docs.yml, main.yaml, release.yml).

### Task 2 — Smoke tests + CLAUDE.md update
- **Commit:** `b054aed37`
- **Files modified:** `CLAUDE.md`
- **PART A smoke tests** (captured before editing CLAUDE.md):

  | Test | Result | Notes |
  | --- | --- | --- |
  | `yarn db:status` | exit 0; prints "supabase local development setup is running" + dev tools panel | Routes correctly through canonical name to `yarn supabase:status`. |
  | `yarn dev:clean` | exit 0; `apps/frontend/.svelte-kit` GONE, `apps/frontend/node_modules/.vite` GONE | Both pre-existing cache dirs wiped. |
  | `yarn dev:status` (deprecated alias) | stderr line 1: `[deprecated] yarn dev:status is now yarn db:status; alias will be removed after v2.10`; then forwards to `db:status` and prints supabase status | Confirms warning emission + forwarder chain. |
  | `node -e "..."` invariant | OK | All script keys + chain semantics + deprecation markers verified. |
  | `db:reset` body inspection | `yarn supabase:reset && yarn dev:clean` | Non-destructive shape check (not invoked — would wipe local DB). |
  | `db:reset-with-data` body inspection | `yarn supabase:reset && yarn db:seed --template default && yarn dev:clean` | Non-destructive shape check; flag-forwarding preserved via yarn's trailing-arg semantics. |

- **PART B CLAUDE.md edits:** 4 sections touched:
  1. `## Development Commands > Setup` — 4 lines (`yarn dev:down/stop/reset/status` -> `yarn db:*`).
  2. `### Supabase Commands` — full rewrite; 9 canonical commands + deprecated-aliases bullet listing the 8 old names + v2.10 removal note.
  3. `### Running tests after changes` — `yarn dev:reset` -> `yarn db:reset`.
  4. `### Seeding local data` — 4 lines (`yarn dev:reset-with-data / dev:seed / dev:seed:teardown` -> `yarn db:*`).
  5. **Troubleshooting "Database issues"** — `yarn dev:reset` -> `yarn db:reset` (+ note that the cache wipe is now bundled).
- **Verify invariant:** `grep -q "yarn db:reset" && grep -q "yarn db:reset-with-data" && grep -q "yarn dev:clean" && grep -q "Deprecated aliases" CLAUDE.md` — OK.
- **Residual `dev:*` Supabase-pattern matches in CLAUDE.md:** only the documentation-listing line ("Deprecated aliases ... `dev:start`, `dev:down`, ...") — intentional, no orphan command-table refs remain.

## Source Todo Resolution

`.planning/todos/pending/2026-05-10-rename-package-scripts-dev-to-db.md` moved to `.planning/todos/completed/` with a resolution addendum documenting the outcome, source commits, smoke results, and the v2.10+ alias-removal follow-up.

## CI Workflow Scan Result

Per CONTEXT D-04 + RESEARCH scout §1, no `.github/workflows/*.yml` references to the renamed scripts at scout time. Re-verified at task time:

```
grep -rE "yarn dev:(reset|seed|status|start|down|stop|clean)" .github/workflows/ -> exit 1 (no matches)
```

6 workflow files inspected; zero updates needed.

## Deviations from Plan

None — plan executed exactly as written, including the optional CI grep + source-todo move (the source todo move was implied by "resolve the source todo at task close" in the executor prompt and the CONTEXT-tracked follow-up).

## Followups

- **v2.10+ cleanup:** Remove the 8 deprecated `dev:*` aliases from root `package.json`. Already tracked at CONTEXT line 516 — no new todo file needed; surface at v2.10 milestone-close audit.
- **Plan 05 & Plan 07 dependency note:** Both downstream plans can now invoke `yarn db:*` / `yarn dev:clean` directly. Plan 05 retains the documented fallback to `dev:*` aliases per CONTEXT D-01 wording.

## Self-Check: PASSED

- File `.planning/phases/78-cleanup-hygiene-phase/78-01-SUMMARY.md` — FOUND (this file).
- File `package.json` — FOUND, modified at commit `27e42f52d`.
- File `CLAUDE.md` — FOUND, modified at commit `b054aed37`.
- File `.planning/todos/completed/2026-05-10-rename-package-scripts-dev-to-db.md` — FOUND with resolution addendum.
- File `.planning/todos/pending/2026-05-10-rename-package-scripts-dev-to-db.md` — confirmed REMOVED from pending/.
- Commit `27e42f52d` — visible in git log (`feat(78-01): rename dev:* supabase scripts to db:*; add dev:clean`).
- Commit `b054aed37` — visible in git log (`docs(78-01): update CLAUDE.md Supabase Commands for db:* rename + dev:clean`).
