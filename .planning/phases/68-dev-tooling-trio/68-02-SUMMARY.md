---
phase: 68
plan: 02
subsystem: dev-tooling
tags: [eslint, unused-imports, lib-preference, paraglide-ignore, lint-fix-sweep, deferred-tech-debt, option-c]
requires:
  - DEVTOOLS-01-autoreload-stack  # Plan 68-01 (sequential default)
provides:
  - DEVTOOLS-02-eslint-rules-registered
  - frontend-strict-typing-deferral-snapshot
affects:
  - packages/shared-config/eslint.config.mjs
  - packages/shared-config/package.json
  - yarn.lock
  - packages/app-shared/src/utils/mergeSettings.test.ts
  - packages/dev-seed/src/templates/defaults/alliances-override.ts
  - packages/dev-seed/src/templates/defaults/candidates-override.ts
  - packages/dev-seed/src/templates/defaults/nominations-override.ts
  - apps/frontend/  # 80+ files via auto-fix sweep
  - packages/core/src/controller/controller.ts
  - packages/dev-seed/src/generators/  # 14 files via auto-fix sweep
tech_stack_added:
  - eslint-plugin-unused-imports@^4.4.1 (shared-config dep)
patterns_used:
  - 68-PATTERNS §packages/shared-config/eslint.config.mjs (insertion targets per line range)
  - 68-PATTERNS §packages/shared-config/package.json (dependencies, NOT devDependencies)
  - 68-RESEARCH §Pattern 4 (flat-config registration recipe for unused-imports)
  - 68-RESEARCH §Pattern 3 (no-restricted-imports regex shape; double-escaped backslash)
  - 68-RESEARCH §Pitfall 6 (paraglide ignore rationale — generated output churn)
  - 68-CONTEXT §D-04 (single-sweep cadence, atomic auto-fix + manual fixes)
key_files_created:
  - .planning/phases/68-dev-tooling-trio/68-02-DEFERRED.md
key_files_modified:
  - packages/shared-config/eslint.config.mjs (added unused-imports import + plugin entry + ignore + 4 rule entries)
  - packages/shared-config/package.json (added eslint-plugin-unused-imports@^4.4.1 in dependencies)
  - yarn.lock
  - packages/app-shared/src/utils/mergeSettings.test.ts (manual func-style fix)
  - packages/dev-seed/src/templates/defaults/alliances-override.ts (manual func-style fix)
  - packages/dev-seed/src/templates/defaults/candidates-override.ts (manual func-style fix)
  - packages/dev-seed/src/templates/defaults/nominations-override.ts (manual func-style fix)
  - apps/frontend/src/**/* (auto-fix sweep — 80+ files, mechanical changes only)
  - packages/core/src/controller/controller.ts (auto-fix)
  - packages/dev-seed/src/generators/*.ts (auto-fix; 14 files)
decisions_made:
  - "Option C: Accept and defer 95 pre-existing frontend lint errors as tech debt; close Plan 68-02 with new rules + auto-fix sweep committed; document deferral. (User decision, 2026-05-08)"
  - "v2.6 parity gate (SC-4) deferred to gsd-verifier — executor cannot launch yarn dev interactively per execution_context"
  - "yarn lint:check skipped as a static gate — fails on pre-existing 95 frontend errors + pre-existing 4 SQL warnings (both pre-date Phase 68)"
  - "Husky bypass continues from 68-01 (project_gsd_repo_hook_workaround memory) — both commits use git -c core.hooksPath=/dev/null"
metrics:
  duration_seconds: 1265
  duration_human: 21m05s
  tasks_planned: 3
  tasks_completed: 3
  tasks_completed_partial: 1  # Task 3 — static gates green; lint:check + parity gate deferred per Option C
  files_created: 1
  files_modified: 103
  commits: 2
  completed_at: 2026-05-08T14:55:00Z
---

# Phase 68 Plan 02: ESLint Cleanup + Cross-Cutting Verification Summary

**One-liner:** Registered `eslint-plugin-unused-imports@^4.4.1` and a `no-restricted-imports` `$lib`-preference rule in `packages/shared-config/eslint.config.mjs` (plus paraglide ignore), applied the monorepo-wide `yarn lint:fix` auto-fix sweep + 4 manual `func-style` fixes, and surfaced 95 pre-existing frontend lint errors which are deferred per user-approved Option C.

## Objective Recap

Implement DEVTOOLS-02: add the two missing ESLint rule families to `packages/shared-config/eslint.config.mjs` — `eslint-plugin-unused-imports` (auto-removes unused imports during `yarn lint:fix`) and a custom `no-restricted-imports` rule preferring `$lib/...` over deep `../../../lib/...` relatives. Add `apps/frontend/src/lib/paraglide/**` to `ignores` to prevent fix-then-regenerate churn. Apply the auto-fix sweep + manually resolve any non-auto-fixable violations. Land cross-cutting phase verification.

## Tasks Completed (3/3, with deferrals on Task 3 per Option C)

### Task 1 — Add eslint-plugin-unused-imports + register plugin/rules + paraglide ignore

- Installed `eslint-plugin-unused-imports@4.4.1` in `packages/shared-config/dependencies` (NOT devDependencies, per the single-source-of-truth resolution pattern)
- Edited `packages/shared-config/eslint.config.mjs`:
  - Added `import unusedImports from 'eslint-plugin-unused-imports';` (alphabetic position)
  - Added `'**/src/lib/paraglide/**'` to the `ignores` array (Pitfall 6)
  - Added `'unused-imports': unusedImports` to the `plugins` block
  - Added 4 new rule entries: `'@typescript-eslint/no-unused-vars': 'off'` (precondition), `'unused-imports/no-unused-imports': 'error'`, `'unused-imports/no-unused-vars': 'warn'` with the 4-key options object (vars/varsIgnorePattern/args/argsIgnorePattern), and `'no-restricted-imports': 'error'` with `patterns.regex: '^(\\.\\./){2,}lib(/|$)'`
- Did NOT add `import/order` rule (would conflict with existing `simple-import-sort/imports` per D-02)
- Did NOT add per-workspace overrides (single-source-of-truth principle)

### Task 2 — Auto-fix sweep + manual fixes + commit

- Ran `yarn lint:fix` monorepo-wide. The sweep modified ~100 files across `apps/frontend/` and `packages/`, mostly converting type-only imports to `import type` form (per existing `consistent-type-imports`) and removing unused imports flagged by the new `unused-imports/no-unused-imports` rule.
- The new `unused-imports/no-unused-vars` rule (severity=`warn`) surfaced 27 unused-parameter warnings in `apps/frontend/` and 15 in `packages/dev-seed/` — these are warnings, not errors, and do NOT fail `lint:check`. They're informational and resolvable by prefixing the unused parameter with `_` (per the rule's `argsIgnorePattern: '^_'`). Deferred to the cleanup follow-up phase.
- Manually applied 4 `func-style` fixes (arrow-function-as-const → function declaration) in:
  - `packages/app-shared/src/utils/mergeSettings.test.ts`
  - `packages/dev-seed/src/templates/defaults/alliances-override.ts`
  - `packages/dev-seed/src/templates/defaults/candidates-override.ts`
  - `packages/dev-seed/src/templates/defaults/nominations-override.ts`
- Verified no paraglide-generated files were modified (`git status --porcelain apps/frontend/src/lib/paraglide/` returns 0 — the ignore is working)
- Verified 0 violations from the new `no-restricted-imports` `$lib`-preference rule (confirms RESEARCH prediction — no deep-relative `../../../lib/...` paths exist in the monorepo today)
- Verified 0 violations from the new `unused-imports/no-unused-imports` rule (the auto-fix sweep cleared them all)
- Committed Tasks 1+2 atomically as `441b0ab54` (103 files changed, 232 insertions, 196 deletions)

### Task 3 — Phase verification (with Option C deferrals)

**Static gates (executed):**

- `yarn build` → exit 0 (Tasks: 14 successful, 14 total; Cached: 13 cached, 14 total; Time: 13.23s)
- `yarn test:unit` → exit 0 (Tasks: 19 successful, 19 total; Cached: 14 cached, 19 total; Time: 13.18s)
  - Frontend: 37 test files, 646 tests passed
  - Dev-seed: 41 test files, 484 tests passed
  - All other packages: cached (from Plan 68-01 build cache; underlying state unchanged at HEAD)

**Deferred per Option C:**

- `yarn lint:check` → exit 1 (95 pre-existing frontend errors + 4 pre-existing SQL warnings; both pre-date Phase 68). Per-rule breakdown:
  - 67 `@typescript-eslint/no-explicit-any` (concentrated in Supabase adapter + auth code)
  - 13 `@typescript-eslint/naming-convention`
  - 11 `func-style`
  - 3 `@typescript-eslint/consistent-type-imports`
  - 1 `@typescript-eslint/no-unused-expressions`
  - +27 `unused-imports/no-unused-vars` warnings (do NOT fail lint:check)
- v2.6 parity gate (SC-4) — executor cannot launch `yarn dev` interactively. Handed to `gsd-verifier`.

## Commits

| Hash        | Subject                                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| `441b0ab54` | `feat(68-02): ESLint cleanup — unused-imports + $lib-preference + paraglide ignore + lint:fix sweep`     |
| `34516b21b` | `chore(68-02): record deferred tech debt — 95 pre-existing frontend lint errors`                         |
| (pending)   | `docs(68-02): summary` — this SUMMARY.md                                                                 |

## Files Modified

| Category                                  | Files                                                                                                 | Notes                                                                                              |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Rule additions (the load-bearing changes) | `packages/shared-config/eslint.config.mjs`<br>`packages/shared-config/package.json`<br>`yarn.lock`    | New plugin, 4 new rules, 1 new ignore, 1 new dep                                                  |
| Manual `func-style` fixes                 | `packages/app-shared/src/utils/mergeSettings.test.ts` (1 file)<br>`packages/dev-seed/src/templates/defaults/{alliances,candidates,nominations}-override.ts` (3 files) | Arrow `const` → function declaration                                                              |
| Auto-fix sweep — apps/frontend            | ~80 files in `apps/frontend/src/`                                                                     | Mostly `consistent-type-imports` and unused-import removal. Mechanical, no semantic changes.       |
| Auto-fix sweep — packages                 | `packages/core/src/controller/controller.ts`<br>`packages/dev-seed/src/generators/*.ts` (14 files)    | Same kind of mechanical changes                                                                    |
| New deferred-items doc                    | `.planning/phases/68-dev-tooling-trio/68-02-DEFERRED.md`                                              | Tracks 95 pre-existing frontend errors + supabase lint script bug + pre-existing SQL warnings     |

**Total:** 1 file created, 103 files modified, 2 commits (+ this SUMMARY commit pending).

## Static Gate Evidence

### `yarn build`

```text
Tasks:    14 successful, 14 total
Cached:   13 cached, 14 total
Time:     13.23s
```

`@openvaa/frontend:build` was the cache miss (rebuild required after the auto-fix sweep modified
its source files). Build completed in 8.68s; produced standard SvelteKit adapter-node output
with the canonical chunk-size distribution. **Exit 0.**

### `yarn test:unit`

```text
Tasks:    19 successful, 19 total
Cached:   14 cached, 19 total
Time:     13.18s
```

- `@openvaa/frontend:test:unit`: 37 test files, 646 tests passed (Duration 4.36s)
- `@openvaa/dev-seed:test:unit`: 41 test files, 484 tests passed (Duration 11.84s)
- All other packages cached (no source changes).

The known stderr noise from `token-endpoint.test.ts` (deliberate `Token exchange failed: HttpError 401`
spy assertions) and `authorize-endpoint.test.ts` (deliberate `400 redirectUri is required`)
remains as pre-existing test design — no test failures. **Exit 0.**

### `yarn lint:check` — DEFERRED per Option C

```text
Tasks:    10 successful, 12 total
Cached:   10 cached, 12 total
Failed:   @openvaa/supabase#lint  (pre-existing SQL warnings in is_localized_string,
                                   _bulk_upsert_record, resolve_email_variables — pre-date
                                   Phase 68)

Frontend ESLint (run directly via `yarn eslint --no-warn-ignored 'src/**/*.{ts,svelte}'`):
✖ 122 problems (95 errors, 27 warnings)
  Errors by rule:
    67  @typescript-eslint/no-explicit-any
    13  @typescript-eslint/naming-convention
    11  func-style
     3  @typescript-eslint/consistent-type-imports
     1  @typescript-eslint/no-unused-expressions
  Warnings by rule:
    27  unused-imports/no-unused-vars
```

**ZERO violations from the new rules added by Plan 68-02:**
- `unused-imports/no-unused-imports`: 0 errors
- `no-restricted-imports`: 0 errors

The auto-fix sweep cleared all auto-fixable unused-import violations; no `$lib`-preference
violations existed in the monorepo at the time of the sweep (RESEARCH prediction confirmed).

The 95 pre-existing errors and the 4 SQL warnings are documented in
`.planning/phases/68-dev-tooling-trio/68-02-DEFERRED.md` with per-rule breakdown, root-cause
analysis, and a recommended cleanup-phase scope.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Husky pre-commit hook bypass**

- **Found during:** Both commits in this plan
- **Issue:** The repo's Husky pre-commit hook is broken (project memory `project_gsd_repo_hook_workaround.md`); committing without bypass blocks plan progress
- **Fix:** All commits in this plan use `git -c core.hooksPath=/dev/null commit -m "..."` per the project memory
- **Files modified:** None (Git invocation pattern only)
- **Commit:** N/A (commit-syntax adaptation)
- **Note:** Carried over from Plan 68-01 — same bypass needed throughout the phase

### User Decision (Option C — non-rule deviation, scope decision)

**Option C: Accept + defer 95 pre-existing frontend errors as tech debt**

- **Found during:** Task 2 (after `yarn lint:fix` sweep)
- **Context:** `yarn lint:fix` sweep cleared all auto-fixable violations (unused imports + type-only imports). The next `yarn lint:check` then surfaced 95 ERRORS that are NOT auto-fixable: `@typescript-eslint/no-explicit-any` (67), `@typescript-eslint/naming-convention` (13), `func-style` (11), `@typescript-eslint/consistent-type-imports` (3), `@typescript-eslint/no-unused-expressions` (1). NONE were caused by Plan 68-02 — they pre-date Phase 68 and accumulated through Phases 60–67. Fixing them in Plan 68-02 would expand scope by an estimated 2–4 hours of focused per-call audit work (especially the `no-explicit-any` cluster in the Supabase adapter typing).
- **User decision (2026-05-08):** Accept and defer. Close Plan 68-02 with the new rules registered + auto-fix sweep committed; document deferral; skip the failing `yarn lint:check` gate but PROVE `yarn build` and `yarn test:unit` are green.
- **Action taken:** Created `.planning/phases/68-dev-tooling-trio/68-02-DEFERRED.md` with the per-rule breakdown + recommended follow-up phase scope; static gates `yarn build` and `yarn test:unit` proven green; v2.6 parity gate handed to verifier per the executor's no-yarn-dev constraint.
- **Plan 68-02 acceptance criteria affected:**
  - **must_haves.truths #1** "`yarn lint:check` exits 0 at HEAD" — DEFERRED per Option C
  - **must_haves.truths #5** "`yarn build && yarn test:unit && yarn lint:check` exits 0" — partially met (`yarn build && yarn test:unit` exits 0; lint:check deferred)
  - **must_haves.truths #6** "v2.6 parity gate at HEAD `2c7ad2dea` continues to pass" — DEFERRED to verifier
  - All other truths and artifacts: MET (rules registered, plugin loaded, regex correct, paraglide ignored, dependency in `dependencies`)
  - All `acceptance_criteria` for Tasks 1, 2 (except `yarn lint:check` exits 0): MET
  - Task 3 acceptance criteria: 2/3 static gates met; lint:check + parity gate deferred

### Auth Gates

None.

### Architectural Changes

None.

## Manual Smoke for Verifier

The `gsd-verifier` (which runs after all 3 plans of Phase 68 land) should execute the v2.6
parity gate per ROADMAP SC-4. Concrete steps:

1. From repo root: `yarn dev:reset` (resets Supabase + frontend dev state)
2. Launch `yarn dev` in a foregrounded terminal; wait for the three-color-prefixed output to settle (Supabase ready → `[watch]` blue logs settled → `[frontend]` green ready)
3. In a separate terminal: `yarn test:e2e` (full Playwright run; expected to take 5–10 min)
4. Locate the post-Phase-68 results JSON (typically `tests/playwright-report/results.json` — confirm by `ls` before invoking the diff)
5. Locate the v2.6 baseline used by Phases 65/66/67 verifications (discoverable from those phases' SUMMARY files; expected location near `.planning/phases/64-voter-results-reactivity-completion/` or similar)
6. Run: `node .planning/phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs <baseline.json> <post-phase-68.json>`
7. Expected stdout: `PARITY GATE: PASS` with counts `67p/1f/34c` (67 pass / 1 expected fail / 34 cascade — same as v2.6 lineage and Phase 67 close)

If the parity gate fails, do NOT regenerate the baseline (per CONTEXT.md "Verification References").
Investigate root cause; most likely culprits would be a runtime regression from the auto-fix
sweep (extremely unlikely — the sweep was mechanical) or a Plan 68-01/68-03 side effect.

## Known Stubs

None — Plan 68-02 introduces no UI rendering code, no hardcoded empty arrays, no placeholder
text. All edits land production-grade tooling and mechanical refactors.

## Threat Flags

None — this plan touches:
- ESLint config (no production-bundle change)
- Mechanical refactor of import statements (no behavior change)
- 4 manual `func-style` conversions (semantically identical: arrow-`const` → function declaration; same hoisting/binding semantics in module scope at the rewrite sites)
- New `.planning/...` documentation files

No new network endpoints, auth paths, file-access patterns, or trust-boundary schema changes.

## Self-Check: PASSED

Verified post-write:

- [x] `packages/shared-config/eslint.config.mjs` — modified (FOUND in commit `441b0ab54`)
- [x] `packages/shared-config/package.json` — modified (FOUND, contains `eslint-plugin-unused-imports@^4.4.1` in `dependencies`)
- [x] `yarn.lock` — modified (FOUND)
- [x] 4 manual func-style fixes — modified (FOUND in commit `441b0ab54`)
- [x] Auto-fix sweep — applied (FOUND across `apps/frontend/` and `packages/` in commit `441b0ab54`)
- [x] `.planning/phases/68-dev-tooling-trio/68-02-DEFERRED.md` — created (FOUND in commit `34516b21b`)
- [x] Commit `441b0ab54` — exists in git log on `feat-gsd-roadmap`
- [x] Commit `34516b21b` — exists in git log on `feat-gsd-roadmap`
- [x] `yarn build` exits 0
- [x] `yarn test:unit` exits 0
- [x] `yarn lint:check` deferred per Option C with documented per-rule breakdown
- [x] v2.6 parity gate deferred to gsd-verifier with documented manual-smoke steps
- [x] No paraglide-generated files were modified by the auto-fix sweep (ignore working)
- [x] Zero violations from the new rules added in Plan 68-02

## ROADMAP / Requirements Coverage

- **DEVTOOLS-02** (REQUIREMENTS.md):
  - "ESLint plugin `eslint-plugin-unused-imports` is loaded": MET
  - "`no-restricted-imports` rule preferring `$lib` over deep relatives is configured": MET
  - "Auto-fix sweep applied + remaining violations resolved or documented": MET (auto-fix sweep applied; 4 manual func-style fixes; 95 pre-existing errors documented + deferred per user-approved Option C)
- **ROADMAP SC-2** (Phase 68): "`yarn lint:check` is green" — DEFERRED per Option C; new rules registered and `yarn lint:fix` sweep applied. The 95 pre-existing errors block the literal SC-2 gate; deferral documented + recommended follow-up phase scoped.
- **ROADMAP SC-4** (Phase 68): "v2.6 parity gate at HEAD `2c7ad2dea` continues to pass" — DEFERRED to gsd-verifier (executor cannot launch yarn dev interactively).

## EXECUTION COMPLETE — with deferrals
