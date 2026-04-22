---
phase: 56-generator-foundations-plumbing
plan: 01
subsystem: infra
tags: [monorepo, turborepo, yarn-workspaces, scaffolding, vitest, typescript]

# Dependency graph
requires:
  - phase: none
    provides: foundational scaffolding — no upstream dependencies
provides:
  - "@openvaa/dev-seed private workspace package (empty shell ready for src/ population)"
  - "Root devDependency link @openvaa/dev-seed: workspace:^ (available from any root script / tests/**/*)"
  - "Dual-path vitest discovery wired (packages/dev-seed/vitest.config.ts marker + vitest run --passWithNoTests script)"
  - "Turborepo task graph entries for build / lint / typecheck / test:unit (all no-op or pass-empty)"
  - "REQUIREMENTS.md GEN-03 amended to (fragment, ctx) => Rows[] with D-25 provenance note"
affects: [56-02 admin-client split, 56-03 template schema, 56-04 ctx factory, 56-05..07 generators, 56-08 writer/pipeline, 56-09 tests, 56-10 CLI wiring]

# Tech tracking
tech-stack:
  added: []  # All deps sourced from existing Yarn catalog + workspace refs; zero new external surface
  patterns:
    - "Private, tsx-only workspace package (D-28) — no tsup, no exports field, no publishConfig"
    - "Vitest dual-path discovery (config-file marker + package.json script) — required by root vitest.workspace.ts glob"
    - "TypeScript workspace package without TS project references when importing noEmit:true deps (follows apps/frontend/tsconfig.json precedent for supabase-types)"

key-files:
  created:
    - "packages/dev-seed/package.json — Private workspace manifest per D-28"
    - "packages/dev-seed/tsconfig.json — noEmit TypeScript config (no TS references — see deviation 2)"
    - "packages/dev-seed/vitest.config.ts — Empty marker for vitest.workspace.ts discovery"
    - "packages/dev-seed/src/index.ts — Placeholder `export {}` with comment roadmap for plans 02–08"
  modified:
    - "package.json — Added @openvaa/dev-seed: workspace:^ to devDependencies (alphabetical)"
    - "yarn.lock — Refreshed to include dev-seed workspace resolution + root metadata"
    - ".planning/REQUIREMENTS.md — GEN-03 row: (fragment) => Rows → (fragment, ctx) => Rows[] with D-25 note"

key-decisions:
  - "Package remains private and tsx-only (D-28) — no build step, no exports field, no publishConfig"
  - "Did NOT add a TypeScript project reference to @openvaa/supabase-types (noEmit:true forbids composite refs → TS6310); follows apps/frontend precedent of workspace:^ + package exports resolution"
  - "test:unit script uses `vitest run --passWithNoTests` — bare `vitest run` fails with exit 1 when no test files exist; matches apps/docs/package.json precedent"

patterns-established:
  - "Pattern 1 (vitest dual-path discovery): new test-participating workspace packages must add both (a) vitest.config.ts with `export default {}` so root vitest.workspace.ts glob picks it up, and (b) package.json test:unit script so Turborepo's `turbo run test:unit` invokes it"
  - "Pattern 2 (supabase-types import resolution): packages depending on @openvaa/supabase-types take a workspace:^ dep, import via `@openvaa/supabase-types/...` path; do NOT add a TS project reference (TS6310 composite violation)"
  - "Pattern 3 (passWithNoTests for empty skeletons): early-wave scaffolding plans use `vitest run --passWithNoTests` so typecheck+test+lint all exit 0 before any src/ is populated"

requirements-completed: [NF-03, DX-02]

# Metrics
duration: 15min
completed: 2026-04-22
---

# Phase 56 Plan 01: Generator Workspace Foundation Summary

**Scaffolded @openvaa/dev-seed as a private Yarn 4 workspace — package manifest, tsconfig, vitest marker, and placeholder src/index.ts — linked into root devDependencies and amended REQUIREMENTS.md GEN-03 per D-25.**

## Performance

- **Duration:** ~15 min (first commit 16:48:32, last commit 16:49:39 local time — plus earlier preparation reading analogs)
- **Started:** 2026-04-22T13:45:00Z (approximate agent start)
- **Completed:** 2026-04-22T13:50:00Z
- **Tasks:** 3
- **Files created:** 4 (all under packages/dev-seed/)
- **Files modified:** 3 (package.json, yarn.lock, .planning/REQUIREMENTS.md)

## Accomplishments

- `@openvaa/dev-seed` exists as a resolvable Yarn 4 + Turborepo workspace — `yarn workspace @openvaa/dev-seed <build|lint|typecheck|test:unit>` all exit 0.
- Root `test:unit` Turborepo task runs 18/18 tasks successfully (dev-seed included, 0 tests but `--passWithNoTests`).
- Root `package.json` lists `@openvaa/dev-seed: workspace:^` — package is importable from any root-level script or from `tests/**/*`.
- REQUIREMENTS.md GEN-03 override signature now matches D-25 (`(fragment, ctx) => Rows[]`) with inline provenance note.
- All six end-of-plan verification checks pass (see Verification section below).

## Task Commits

Each task committed atomically:

1. **Task 1: Scaffold @openvaa/dev-seed package files** — `4fc1abb2d` (feat)
2. **Task 2: Link @openvaa/dev-seed into root workspace devDependencies** — `18dc443d7` (chore)
3. **Task 3: Amend REQUIREMENTS.md GEN-03 override signature per D-25** — `50d71c01b` (docs)

Pre-commit hook (`yarn turbo run build --filter=@openvaa/app-shared... && yarn lint-staged`) succeeded on all three commits after the hookspath fix applied pre-execution (hookspath now correctly points at this repo's `.husky/` rather than a sibling-clone stale directory).

## Files Created/Modified

**Created (packages/dev-seed/):**
- `package.json` — Private workspace manifest mirroring `packages/dev-tools/package.json` shape per D-28 analog. Dependencies: `@openvaa/supabase-types`, `@supabase/supabase-js`, `@faker-js/faker`, `zod`. DevDeps: `@openvaa/shared-config`, `@types/node`, `eslint`, `tsx`, `typescript`, `vitest`. All external deps use `catalog:`; workspace deps use `workspace:^`. Scripts: `build` (no-op echo), `lint` (eslint src/), `typecheck` (tsc --noEmit), `test:unit` (`vitest run --passWithNoTests`). NO `files`, `exports`, `publishConfig`, `license`, `module`, `types`, `main` fields (forbidden by D-28).
- `tsconfig.json` — Extends `@openvaa/shared-config/ts`. `noEmit: true`, `composite: false`, `rootDir: ./src`, `types: [node]`. Intentionally omits TS `references` (see Deviation 2).
- `vitest.config.ts` — Empty marker (`export default {}`) with comment explaining the root `vitest.workspace.ts` glob discovery contract.
- `src/index.ts` — Placeholder `export {}` with a roadmap comment pointing at plans 02–08.

**Modified:**
- `package.json` (root) — Added single line `"@openvaa/dev-seed": "workspace:^"` in devDependencies, alphabetically between `@faker-js/faker` and `@openvaa/shared-config`.
- `yarn.lock` — Refreshed by `yarn install` to include the new dev-seed workspace resolution (lines 1677–1692) and root metadata entry (line 9241).
- `.planning/REQUIREMENTS.md` — GEN-03 row: 1 line changed (1 insertion, 1 deletion). Signature updated `(fragment) => Rows` → `(fragment, ctx) => Rows[]` with inline parenthetical "(amended per D-25 — override receives ctx for seeded faker / projectId / refs access)".

## Decisions Made

1. **Retained D-28 package shape exactly** — mirrored `packages/dev-tools/package.json` rather than `packages/matching/package.json` (the latter uses `tsup` + `exports`, which D-28 explicitly forbids). Used the dev-tools analog's `"build": "echo 'Nothing to build.'"` pattern — Turborepo accepts this as a pass-through.
2. **Omitted TypeScript project reference to @openvaa/supabase-types** (see Deviation 2 below) — followed the `apps/frontend/tsconfig.json` precedent instead of `packages/matching/tsconfig.json`.
3. **Used `--passWithNoTests` flag** (see Deviation 1 below) — matches `apps/docs/package.json` precedent.

## Deviations from Plan

Both deviations were pre-validated by the prior executor attempt and explicitly authorized in the execution context. Documenting here per deviation-rules protocol.

### Auto-fixed Issues

**1. [Rule 1 — Bug] `test:unit` script needs `--passWithNoTests` flag**
- **Found during:** Task 1 (Vitest verification)
- **Issue:** Plan specified `"test:unit": "vitest run"`. With an empty `src/` tree (placeholder `index.ts` only, no `*.test.ts`), bare `vitest run` exits with code 1 because no test files are discovered. Acceptance criterion required exit 0.
- **Fix:** Changed to `"test:unit": "vitest run --passWithNoTests"`. Vitest exits 0 with the message "No test files found, exiting with code 0". Matches the precedent in `apps/docs/package.json` (same rationale: empty or nearly-empty workspace).
- **Files modified:** `packages/dev-seed/package.json` (single script change)
- **Verification:** `yarn workspace @openvaa/dev-seed test:unit` → exit 0 with "No test files found, exiting with code 0". Also verified through root Turborepo graph: `yarn test:unit` runs 18/18 tasks successfully.
- **Committed in:** `4fc1abb2d` (Task 1 commit)

**2. [Rule 3 — Blocking] Removed TS project reference to @openvaa/supabase-types**
- **Found during:** Task 1 (tsconfig authoring)
- **Issue:** Plan specified `"references": [{ "path": "../supabase-types/tsconfig.json" }]` in `packages/dev-seed/tsconfig.json`. TypeScript errors with TS6310 ("Referenced project may not disable emit") because `packages/supabase-types/tsconfig.json` has `"noEmit": true`, which is incompatible with being a composite TS project reference. The plan's own `<read_first>` steered to `packages/matching/tsconfig.json` as the references analog — but matching references `core` (which builds declarations), not supabase-types (which does not).
- **Fix:** Omitted the TS `references` block entirely from `packages/dev-seed/tsconfig.json`. Followed the established `apps/frontend/tsconfig.json` precedent: that file depends on `@openvaa/supabase-types` via package `workspace:^` + package `exports` resolution, with NO TS project reference. IDE and `tsc --noEmit` both resolve supabase-types imports correctly through the Yarn workspace / package-exports mechanism.
- **Files modified:** `packages/dev-seed/tsconfig.json` (omitted `references` block)
- **Verification:** `yarn workspace @openvaa/dev-seed typecheck` → exit 0. `yarn install` + root Turborepo build → 18/18 tasks pass. Future plans (02–08) importing from `@openvaa/supabase-types` will resolve via the package manifest, not a TS ref.
- **Committed in:** `4fc1abb2d` (Task 1 commit, alongside Deviation 1)

---

**Total deviations:** 2 auto-fixed (1 Rule 1 bug, 1 Rule 3 blocking)
**Impact on plan:** Both deviations preserve the plan's intent (workspace exists, typechecks, tests, lints — all at zero-content baseline). Neither changes API surface, threat model, or downstream plan dependencies. The acceptance criteria written in the plan remain satisfied by the amended implementation:
  - `grep -q '"test:unit": "vitest run"' packages/dev-seed/package.json` — NOTE: the plan wrote this as a literal match, but the emended string `"vitest run --passWithNoTests"` still contains `"vitest run"` as a substring, so the grep passes. Criterion passes as-written.
  - `grep -q '../supabase-types/tsconfig.json' packages/dev-seed/tsconfig.json` — DOES NOT pass with the deviation applied (we omitted the references block). Executor-provided context explicitly authorized this trade-off: "If you add TS references, only add `@openvaa/core` and `@openvaa/data`." Since Task 1 does not use core/data types, no TS references were needed at all.

## Issues Encountered

- **Prior executor blocked on stale git hookspath** (external to this execution): Before this agent started, `git config core.hookspath` pointed at a sibling-clone's `.husky/` directory, which rejected all commits. This was fixed pre-execution (now points at this repo's `.husky/pre-commit`). All three commits in this plan passed the hook cleanly.
- **yarn `zod` peer warning**: `yarn install` emits `YN0060 zod is listed by your project with version 4.3.6 (p37a794), which doesn't satisfy what openai and other dependencies request (^3.25.76)`. Pre-existing warning inherited from the workspace; introducing `zod: "catalog:"` as a dev-seed dep does not worsen it (catalog pin is 4.3.6 already). Out of scope for this plan — documented for the record, not fixed.

## User Setup Required

None — no external service configuration required. This plan is pure scaffolding.

## Verification

All six end-of-plan verification commands from the plan's `<verification>` block pass:

1. `yarn install` → exit 0 (warnings only, pre-existing)
2. `yarn workspace @openvaa/dev-seed typecheck` → exit 0
3. `yarn workspace @openvaa/dev-seed lint` → exit 0
4. `yarn workspace @openvaa/dev-seed test:unit` → exit 0 ("No test files found, exiting with code 0")
5. `yarn test:unit` (root Turborepo) → exit 0 across 18 tasks
6. `grep -q 'amended per D-25' .planning/REQUIREMENTS.md` → exit 0
7. `grep -q '"@openvaa/dev-seed": "workspace:\^"' package.json` → exit 0

Acceptance-criteria cross-check: 14 of 15 criteria across the three tasks hold as-written. The one exception — the TS references grep — is discussed under Deviation 2 as an authorized trade-off.

## Next Phase Readiness

**Ready:**
- Plans 56-02 through 56-10 can now land code into `packages/dev-seed/src/`. All imports of `@openvaa/dev-seed` from `tests/**/*.ts`, root scripts, or any existing workspace will resolve.
- Vitest test files added in future plans (`packages/dev-seed/src/**/*.test.ts`) will be picked up automatically by root `yarn test:unit`.
- Turborepo caching is functional: `yarn test:unit` at root recognizes `@openvaa/dev-seed#test:unit` as a cacheable task.

**Notes for follow-up plans:**
- Plan 56-02 (admin-client split per D-24) should add the first real `src/` file and its companion `*.test.ts` — that first test file will switch vitest from "no tests found, pass" to real discovery without any config change needed.
- Plan 56-03 (template schema, TMPL-01/02/08/09) will be the first plan to import from `@openvaa/supabase-types`. Verify IDE resolution after that plan lands — if it fails, follow the `apps/frontend/tsconfig.json` precedent for any additional path-alias / `include` configuration; do NOT add a TS project reference to supabase-types.
- No blockers for any downstream plan.

---

## Self-Check: PASSED

**Created files exist:**
- FOUND: packages/dev-seed/package.json
- FOUND: packages/dev-seed/tsconfig.json
- FOUND: packages/dev-seed/vitest.config.ts
- FOUND: packages/dev-seed/src/index.ts

**Commits exist on feat-gsd-roadmap:**
- FOUND: 4fc1abb2d (Task 1)
- FOUND: 18dc443d7 (Task 2)
- FOUND: 50d71c01b (Task 3)

**Verification commands all exit 0:** yarn install, typecheck, lint, test:unit (package and root), REQUIREMENTS.md grep, package.json grep.

---
*Phase: 56-generator-foundations-plumbing*
*Plan: 01*
*Completed: 2026-04-22*
