---
phase: 72-package-hygiene-trio
verified: 2026-05-09T14:08:00Z
status: human_needed
score: 4/4 must-haves verified (SC-1, SC-2, SC-3 fully VERIFIED; SC-4 PASS-WITH-CAVEAT — pre-existing TYPING-01 lint debt routed to Phase 71; Playwright parity baseline routed to manual phase-close gate per VALIDATION.md)
overrides_applied: 0
re_verification:
  previous_status: null
  previous_score: null
  gaps_closed: []
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "v2.7-close Playwright parity baseline"
    expected: "yarn test:e2e (after yarn dev:reset + yarn dev) continues to pass with no regressions from Phase 72 package-level changes"
    why_human: "Requires yarn dev (Supabase + Vite) running plus full Playwright browser orchestration; out of scope for static verification. Captured in VALIDATION.md §Manual-Only Verifications and SUMMARY.md as deferred to phase-close."
  - test: "Live SQL-lint run via the renamed script"
    expected: "yarn supabase:lint:sql (after yarn supabase:start) executes and exits per the underlying lint:all chain (lint:sql + lint:schema), with the previous SQL warnings (Phase 68 §3 deferred-tech-debt) being the only output"
    why_human: "Requires yarn supabase:start + Postgres; the rename wiring is statically verified, but a live invocation of supabase db lint is the ground-truth check. Captured in 72-03-SUMMARY.md as deferred to phase-close."
  - test: "CI workflow feature-branch verification"
    expected: "Push branch to remote; GitHub Actions main.yaml runs through (yarn lint:check exits per pre-existing TYPING-01 baseline; supabase db lint NOT invoked silently; no surprise CI failure from the rename)"
    why_human: "CI files may have references that static grep missed (workflow includes, action templates, etc.). Captured in VALIDATION.md §Manual-Only Verifications."
---

# Phase 72: Package Hygiene Trio — Verification Report

**Phase Goal:** Three independent package-level cleanups land together — `@openvaa/app-shared` paradigm normalisation; `apps/frontend/src/lib/utils/merge.ts` shim retirement; `@openvaa/supabase` lint-script disambiguation (SQL vs JS pipelines).
**Verified:** 2026-05-09T14:08:00Z
**Status:** human_needed (4/4 SCs verified in code; 3 deferred manual gates per VALIDATION.md)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (mapped to ROADMAP SC-1..SC-4)

| # | Truth (ROADMAP SC) | Status | Evidence |
|---|-------------------|--------|----------|
| 1 | **SC-1** — `@openvaa/app-shared` paradigm normalised against canonical 4 | ✓ VERIFIED | All 6 sub-checks pass: zero `.js` extensions, truthful `description`, README rewritten (no `@openvaa/strapi`, has `## Dual ESM + CommonJS build`), tsbuildinfo deleted, `packages/README.md` exists with canonical paradigm reference (`@openvaa/core` named 5×, `tiebreaker` 2×), CLAUDE.md anchor at line 125 |
| 2 | **SC-2** — `mergeSettings` shim retired; zero `$lib/utils/merge` references | ✓ VERIFIED | `apps/frontend/src/lib/utils/merge.ts` DELETED; strict grep returns 0; broader grep (Pitfall 2 mitigation, catches `vi.mock`/comments) returns 0; both `layoutContext.svelte.ts` (lines 1, 9) and `layoutContext.type.ts` (line 1) import directly from `@openvaa/app-shared`; D-07 audit shows zero other shape-equiv shims in `apps/frontend/src/lib/utils/` |
| 3 | **SC-3** — `@openvaa/supabase` lint-script hard-renamed | ✓ VERIFIED | `apps/supabase/package.json:scripts.lint` removed (jq null); `lint:sql` defined with verbatim command; `lint:all` self-reference updated to `yarn lint:sql && yarn lint:schema`; root `package.json:scripts."supabase:lint"` removed; `supabase:lint:sql` defined; CLAUDE.md line 63 has new form, zero old-form references; `yarn supabase:lint` errors with `Couldn't find a script named "supabase:lint"` (D-02 hard rename took effect); `turbo.json` and `.github/workflows/` ZERO diff vs phase start `a00f924bd` |
| 4 | **SC-4** — `yarn build` + `yarn test:unit` + `yarn lint:check` all green; Playwright parity baseline holds | ⚠️ PASS-WITH-CAVEAT | `yarn build` 14/14 succeeded (FULL TURBO cached); `yarn test:unit` 19/19 succeeded (646 frontend + 484 dev-seed + others); `yarn lint:check` exits 1 BUT Phase 72 introduced ZERO new errors (verified by checking out `a00f924bd` and re-running: same 122 problems, 95 errors, 27 warnings) — these are pre-existing `apps/frontend` TYPING-01 errors deferred per Phase 68 Option C, owned by Phase 71. Critically, `supabase db lint` NOT in lint-check output (LINT-01 SC-3 wiring intact). Playwright parity baseline + live SQL-lint deferred to phase-close manual gate per VALIDATION.md §Manual-Only Verifications |

**Score:** 4/4 truths verified (SC-1, SC-2, SC-3 fully; SC-4 with the pre-existing-debt caveat that is explicitly out-of-scope per CONTEXT.md `<deferred>` and Phase 68 Option C)

### Required Artifacts (per PLAN frontmatter — all 3 plans)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/app-shared/src/index.ts` | Flat barrel re-exports without `.js` extensions | ✓ VERIFIED | grep -rE returns 0; 14 export lines, all extensionless |
| `packages/app-shared/package.json` | Truthful `description` + preserved divergences | ✓ VERIFIED | description present (273 chars, mentions ESM+CJS+future-compat hedge); `private:true`, `main:./dist/index.cjs`, `exports[].require`, `dependencies.@openvaa/data`, `scripts.test:unit` all preserved |
| `packages/app-shared/README.md` | Truthful dual-build justification, no `@openvaa/strapi` | ✓ VERIFIED | Zero `@openvaa/strapi` matches; has `## Dual ESM + CommonJS build` section at line 23; mentions `future-compatibility hedge` |
| `packages/README.md` (NEW) | Canonical paradigm reference per D-03 | ✓ VERIFIED | Created; names `@openvaa/core` 5×; mentions `tiebreaker` 2×; has `@openvaa/app-shared` justified-divergence section |
| `CLAUDE.md` anchor (Option A) | Short anchor in §Module Resolution & Dependencies pointing to packages/README.md | ✓ VERIFIED | Line 125: `**Canonical package paradigm:** ... See `packages/README.md` for the full reference.` Net +2 lines (359 → 361); under bloat ceiling |
| `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts` | Direct `@openvaa/app-shared` imports | ✓ VERIFIED | Line 1: `import { mergeSettings } from '@openvaa/app-shared'` (value); Line 9: `import type { DeepPartial, VideoContent } from '@openvaa/app-shared'` (cosmetic merge per SUMMARY) |
| `apps/frontend/src/lib/contexts/layout/layoutContext.type.ts` | Direct `@openvaa/app-shared` import for DeepPartial | ✓ VERIFIED | Line 1: `import type { DeepPartial, VideoContent } from '@openvaa/app-shared'` (cosmetic merge with existing VideoContent import) |
| `apps/frontend/src/lib/utils/merge.ts` | DELETED | ✓ VERIFIED | File absent from worktree; not in git ls-files; deletion committed in `6615fedc9` |
| `apps/supabase/package.json` | `lint` → `lint:sql` + lint:all chain updated | ✓ VERIFIED | jq confirms `.scripts.lint == null` and `.scripts."lint:sql"` exists with `supabase db lint --schema public --fail-on warning`; `.scripts."lint:all"` reads `yarn lint:sql && yarn lint:schema` |
| `package.json` (root) | `supabase:lint` → `supabase:lint:sql` | ✓ VERIFIED | jq confirms old key null and new key `yarn workspace @openvaa/supabase lint:all` |
| `CLAUDE.md` §Supabase Commands | Updated to `yarn supabase:lint:sql` | ✓ VERIFIED | Line 63: `yarn supabase:lint:sql        # Run SQL linter on all migrations (sqlfluff + Splinter advisors)`; old form regex `yarn supabase:lint(\s|$)` returns 0 hits |
| `packages/app-shared/dist/index.{js,cjs,d.ts}` | Dual ESM+CJS build outputs | ✓ VERIFIED | `ls packages/app-shared/dist/` shows all 3: `index.cjs`, `index.d.ts`, `index.js` (D-06 dual build preserved) |
| `packages/app-shared/tsconfig.tsbuildinfo` | DELETED (stale strapi-era artifact) | ✓ VERIFIED | File absent at package root; tsc writes incremental cache to `dist/tsconfig.tsbuildinfo` per `tsconfig.json:5` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `CLAUDE.md` §Module Resolution & Dependencies | `packages/README.md` | 1-paragraph anchor mentioning canonical paradigm | ✓ WIRED | Line 125 contains the anchor with `packages/README.md` link |
| `packages/app-shared/src/index.ts` | `packages/app-shared/src/**/*.ts` | ESM relative imports without `.js` extension | ✓ WIRED | All 14 export lines flat, extensionless; matches `@openvaa/core` convention |
| `packages/app-shared/package.json:description` | `packages/app-shared/README.md` (dual-build justification) | Truthful one-sentence description; longer rationale in README | ✓ WIRED | description references README; README §"Dual ESM + CommonJS build" present |
| `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts` | `@openvaa/app-shared` (mergeSettings, DeepPartial) | Direct package import (workspace resolution) | ✓ WIRED | Lines 1 + 9 import directly; `yarn workspace @openvaa/frontend build` exits 0 (resolution validated) |
| `apps/frontend/src/lib/contexts/layout/layoutContext.type.ts` | `@openvaa/app-shared` (DeepPartial) | Direct package import (workspace resolution) | ✓ WIRED | Line 1 imports directly |
| `package.json` (root) `supabase:lint:sql` | `@openvaa/supabase` `lint:all` | yarn workspace forwarding | ✓ WIRED | Value verbatim: `yarn workspace @openvaa/supabase lint:all` |
| `@openvaa/supabase` `lint:all` | `lint:sql` + `lint:schema` | internal yarn-script chain | ✓ WIRED | `lint:all` reads `yarn lint:sql && yarn lint:schema` (Pitfall 3 mitigation applied) |
| Turborepo `lint` task fan-out | Workspaces with a `lint` script defined | Script-existence-driven enumeration (no @openvaa/supabase lint task after rename) | ✓ WIRED | `yarn turbo run lint --dry=json` shows `@openvaa/supabase#lint command=<NONEXISTENT>` (placeholder; runs nothing); `yarn lint:check` does NOT contain `supabase db lint` in output (grep returns 0) |

### Data-Flow Trace (Level 4)

Phase 72 is a refactor/rename phase — no dynamic-data rendering artifacts. Level 4 N/A.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| @openvaa/app-shared dual build produces both formats | `yarn workspace @openvaa/app-shared build && ls packages/app-shared/dist/index.{js,cjs,d.ts}` | All 3 files present | ✓ PASS |
| @openvaa/app-shared unit tests pass post-paradigm-normalisation | `yarn workspace @openvaa/app-shared test:unit` | 21 tests passed in 3 files (mergeSettings, passwordValidation, isEmoji) | ✓ PASS |
| @openvaa/frontend builds without merge.ts shim | `yarn workspace @openvaa/frontend build` | `✔ done` — adapter-node build successful | ✓ PASS |
| `yarn build` (root) — full turbo | `yarn build` | 14/14 successful, 14/14 cached, FULL TURBO 105ms | ✓ PASS |
| `yarn test:unit` (root) — all workspaces | `yarn test:unit` | 19/19 successful (646 frontend + 484 dev-seed + others) | ✓ PASS |
| `yarn supabase:lint` produces hard-rename error (D-02) | `yarn supabase:lint` | `Usage Error: Couldn't find a script named "supabase:lint".` | ✓ PASS |
| `yarn lint:check` does NOT invoke supabase db lint (LINT-01 SC-3) | `yarn lint:check 2>&1 \| grep -c "supabase db lint"` | `0` | ✓ PASS |
| Turborepo lint fan-out skips renamed supabase script | `yarn turbo run lint --dry=json \| jq` | `@openvaa/supabase#lint` shows `command=<NONEXISTENT>` (placeholder, no execution) | ✓ PASS |
| `yarn lint:check` overall exit | `yarn lint:check` | exits 1 — 95 errors / 27 warnings ALL in `@openvaa/frontend` (TYPING-01 territory; Phase 71 owns) | ⚠️ PRE-EXISTING |
| Verify lint failures are pre-existing (not Phase 72-introduced) | `git checkout a00f924bd -- apps/frontend && (cd apps/frontend && yarn lint)` | Same `122 problems (95 errors, 27 warnings)` — IDENTICAL to current HEAD | ✓ PASS (PRE-EXISTING CONFIRMED) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SHARED-01 | 72-01 | `@openvaa/app-shared` paradigm normalisation against canonical 4 | ✓ SATISFIED | All SC-1 sub-checks pass; dual build preserved; canonical-paradigm doc + CLAUDE.md anchor land |
| SHARED-02 | 72-02 | `mergeSettings` re-export shim retired; consumers import directly | ✓ SATISFIED | Shim deleted; both grep regex (strict + broader Pitfall 2) return 0; D-07 audit clean |
| LINT-01 | 72-03 | `@openvaa/supabase` lint-script hard rename (SQL vs JS disambiguation) | ✓ SATISFIED | Both package.json renames + CLAUDE.md update + verified hard-rename error + `yarn lint:check` no longer touches SQL |

### Anti-Patterns Found

Files modified across Phase 72 commits scanned:
- `packages/app-shared/src/index.ts`, `packages/app-shared/src/data/{isImage,isLocalized,isEmoji}.ts`, `packages/app-shared/package.json`, `packages/app-shared/README.md`
- `packages/README.md` (new), `CLAUDE.md`
- `apps/frontend/src/lib/contexts/layout/layoutContext.{svelte.ts,type.ts}`
- `apps/supabase/package.json`, `package.json`

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | — | — | — | No anti-patterns found in Phase 72 diff. Stale `@openvaa/strapi` reference in app-shared/README.md was REMOVED (the cleanup IS the anti-pattern fix). No TODO/FIXME/PLACEHOLDER inserted. No empty implementations. No hardcoded empty data. No console.log-only handlers. |

### Human Verification Required

Three items deferred to phase-close manual gate per VALIDATION.md §Manual-Only Verifications and 72-03-SUMMARY.md "Deferred Items":

#### 1. v2.7-close Playwright parity baseline

**Test:** Run `yarn dev:reset && yarn dev` (start Supabase + Vite); in another terminal run `yarn test:e2e`.
**Expected:** All Playwright tests pass at the v2.7-close baseline (no new regressions from Phase 72's package-level changes).
**Why human:** Requires Supabase + Vite running concurrently and Playwright browser orchestration. Out of scope for static verification.

#### 2. Live SQL-lint run via renamed script

**Test:** Run `yarn supabase:start`, then `yarn supabase:lint:sql`.
**Expected:** Script forwards through `lint:all` → both `lint:sql` (sqlfluff via `supabase db lint`) and `lint:schema` (`scripts/lint-schema.mjs`) execute. Output should contain only the previously-known 4 SQL `warning extra` entries from Phase 68 deferred-tech-debt §3 (`is_localized_string`, `_bulk_upsert_record`, `resolve_email_variables` × 2). No NEW SQL warnings introduced by Phase 72.
**Why human:** Requires Postgres running via `yarn supabase:start`. Static rename wiring is verified; live invocation is the ground-truth check.

#### 3. CI workflow feature-branch verification

**Test:** Push the phase branch to remote (e.g., `git push origin feat-gsd-roadmap`); observe GitHub Actions runs.
**Expected:** `main.yaml` workflow runs through; `yarn lint:check` exits per the pre-existing TYPING-01 baseline (95 frontend errors, owned by Phase 71); no surprise CI failure from the rename. Note: the project may already have CI failing on TYPING-01 deferred work — the gate is "no NEW failure introduced by Phase 72," not "CI green."
**Why human:** CI may have references that static grep missed (workflow includes, action templates, composite actions). Captured in VALIDATION.md §Manual-Only Verifications.

### Gaps Summary

**No code-side gaps found.** All 4 ROADMAP success criteria are satisfied by the Phase 72 diff:

- **SC-1 (SHARED-01)** — fully VERIFIED. Paradigm normalisation complete; canonical paradigm doc (`packages/README.md`) created; CLAUDE.md anchor added (Option A); dual ESM+CJS build preserved with truthful justification (no stale `@openvaa/strapi` reference).
- **SC-2 (SHARED-02)** — fully VERIFIED. Shim deleted; zero remaining import or non-import references to `$lib/utils/merge`; consumers rewritten to `@openvaa/app-shared`; D-07 audit confirmed no other shape-equivalent shims.
- **SC-3 (LINT-01)** — fully VERIFIED. Hard rename atomic across all 3 active call sites (`apps/supabase/package.json`, root `package.json`, `CLAUDE.md`); `turbo.json` and `.github/workflows/` ZERO diff vs phase start `a00f924bd` (RESEARCH-verified non-edits held); `yarn lint:check` no longer pulls SQL linter; `yarn supabase:lint` errors deliberately per D-02.
- **SC-4 (verification gate)** — PASS-WITH-CAVEAT. `yarn build` (14/14 cached green), `yarn test:unit` (19/19 green, 646 frontend + 484 dev-seed tests pass), and the lint-pipeline disambiguation are all verified. `yarn lint:check` exits 1 due to **95 pre-existing `apps/frontend` ESLint errors deferred under Phase 68 Option C and explicitly owned by Phase 71** — the verifier independently confirmed these errors are byte-identical at phase-start commit `a00f924bd` (checkout + re-run yielded the same `122 problems (95 errors, 27 warnings)`). Phase 72 introduced **ZERO new lint errors**. The Playwright parity baseline + live SQL-lint run + CI feature-branch verification are explicitly routed to the phase-close manual gate per VALIDATION.md §Manual-Only Verifications.

**Status rationale:** `human_needed` rather than `passed` because three legitimate manual-verification items (Playwright parity, live SQL-lint, CI feature-branch) are documented as out-of-scope-for-static-verification per VALIDATION.md and SUMMARY.md. They do not invalidate any code-side claim; they are the routine post-rename smoke checks that any infrastructure refactor schedules at phase-close.

---

*Verified: 2026-05-09T14:08:00Z*
*Verifier: Claude (gsd-verifier)*
