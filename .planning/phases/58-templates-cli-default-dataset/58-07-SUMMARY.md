---
phase: 58-templates-cli-default-dataset
plan: 07
subsystem: dev-seed
tags: [dev-seed, teardown, cli, root-scripts, phase-58-wave-4, d-58-07, d-58-08, d-58-11, d-58-17, pitfall-5, pitfall-6, tdd]

# Dependency graph
requires:
  - plan: 58-05
    provides: CLI shell patterns (parseArgs, USAGE const, D-58-12 error rephrasing) — teardown.ts mirrors seed.ts structure
  - plan: 58-04
    provides: SupabaseAdminClient portrait-upload surface — Plan 07 extends the same class with list/remove for Path 2 cleanup
  - phase: 56-generator-foundations-plumbing
    provides: SupabaseAdminClient.bulkDelete (Pitfall #6 RPC shape), TEST_PROJECT_ID constant, module-level env fallbacks (supabaseAdminClient.ts:34-42)
provides:
  - packages/dev-seed/src/cli/teardown.ts — seed:teardown CLI entry + exported runTeardown(prefix, client) pure orchestrator
  - packages/dev-seed/src/cli/teardown-help.ts — TEARDOWN_USAGE constant (CLI-04 / D-58-13)
  - packages/dev-seed/src/supabaseAdminClient.ts — listCandidatePortraitPaths + removePortraitStorageObjects methods
  - packages/dev-seed/package.json — scripts.seed:teardown = "tsx src/cli/teardown.ts"
  - package.json (root) — dev:seed / dev:seed:teardown / dev:reset-with-data scripts (D-58-08 + D-58-11)
  - Barrel re-exports: runTeardown, TEARDOWN_USAGE, TeardownResult (type)
affects:
  - 58-09 integration test — can (a) call runTeardown between runs for clean-slate, (b) subprocess-exec yarn dev:seed:teardown for end-to-end coverage, (c) chain yarn dev:reset-with-data when a full reset is needed
  - 58-10 README — documents the prefix guard (T-58-07-02) + D-58-17 permissive contract + the three root aliases
  - Plan 59 fixture rewrite — teardown CLI is the canonical clean-slate step before re-seeding from the new templates

# Tech tracking
tech-stack:
  added: []  # No new deps — uses node:util (builtin) + existing @supabase/supabase-js + existing vitest
  patterns:
    - "Pure orchestration split: runTeardown(prefix, client) exported separately from the top-level CLI block — keeps unit tests pure (no process.exit/env/subprocess), integration test (Plan 09) exercises the CLI entry via subprocess"
    - "Direct-invocation guard: const isDirectInvocation = process.argv[1].endsWith('teardown.ts'/'.js') — lets tests `import { runTeardown } from '../../src/cli/teardown'` without triggering parseArgs against the test runner's argv"
    - "Storage Path 2 2-level list enumeration (RESEARCH §3 primary): list candidate-UUID dirs, then list files under each, then remove — deterministic teardown regardless of the pg_net async trigger (Pitfall #5)"
    - "Pitfall #6 guardrail encoded as ALLOWED_TEARDOWN_TABLES `as const` tuple — only 10 tables (excludes accounts/projects/feedback/app_settings); bulkDelete object built by iterating this tuple"
    - "T-58-07-02 prefix length guard (>= 2 chars) enforced inside runTeardown before any RPC call — throws with actionable message; unit-testable"
    - "Missing-bucket / missing-path treated as empty by listCandidatePortraitPaths — initial state after supabase:reset has no candidates dir; `/not found|does not exist/i.test(msg)` => return [] (not throw)"

key-files:
  created:
    - packages/dev-seed/src/cli/teardown.ts
    - packages/dev-seed/src/cli/teardown-help.ts
    - packages/dev-seed/tests/cli/teardown.test.ts
  modified:
    - packages/dev-seed/src/supabaseAdminClient.ts (+2 methods: listCandidatePortraitPaths, removePortraitStorageObjects)
    - packages/dev-seed/src/index.ts (barrel re-exports: runTeardown, TEARDOWN_USAGE, TeardownResult)
    - packages/dev-seed/package.json (+ seed:teardown script)
    - package.json (+ dev:seed, dev:seed:teardown, dev:reset-with-data scripts)

key-decisions:
  - "Direct-invocation guard pattern instead of the extract-runTeardown-via-dynamic-import approach: the test file imports runTeardown statically from `../../src/cli/teardown`, which would re-evaluate the top-level CLI block. Added `isDirectInvocation = process.argv[1].endsWith('teardown.ts')` check around the parseArgs/SupabaseAdminClient block so import-for-test paths don't trigger the CLI side-effects. Keeps the file single-source (no separate runTeardown.ts module) and the CLI entry recognizable as teardown.ts."
  - "Client parameter typed as minimal TeardownClient interface, not SupabaseAdminClient class: lets tests substitute a plain vitest-fn fake without constructing a real SupabaseAdminClient (which would call createClient()). The CLI entry still passes a real SupabaseAdminClient and TypeScript accepts the structural subtype."
  - "Missing-path-as-empty (not throw) for listCandidatePortraitPaths: after `supabase:reset` with no seed yet, `${projectId}/candidates/` directory won't exist; treating that as empty rather than throwing makes `yarn dev:seed:teardown` idempotent (safe to run on already-clean state). Non-'not found' errors still throw with prefixed message."
  - "T-58-07-02 guard threshold = 2 characters: `LIKE ''%` matches every non-null external_id; single-char prefix (`'s'` or `'t'`) could accidentally match user-curated data too. 2-char minimum matches the real-world `seed_` / `test_` prefix shape while refusing obvious footguns."
  - "Pre-existing lint errors in packages/dev-seed/src/templates/*.ts left untouched: out-of-scope per deviation rules (not introduced by this plan); logged here for visibility. Plan 10 (documentation) is the natural home to clean them up."

requirements-completed: [CLI-02, CLI-03]

# Metrics
duration: ~5 min
completed: 2026-04-23
---

# Phase 58 Plan 07: Teardown CLI + Root-Level Scripts Summary

**`yarn workspace @openvaa/dev-seed seed:teardown` removes every row with `external_id LIKE ${prefix}%` from the 10 allowed_collections content tables (Pitfall #6 guardrail — excludes accounts/projects/feedback/app_settings), then deterministically reclaims candidate portrait objects from Storage via Path 2 list+remove (Pitfall #5 — doesn't rely on the async pg_net trigger). Three root aliases wire `dev:seed`, `dev:seed:teardown`, and `dev:reset-with-data` (= `yarn supabase:reset && yarn dev:seed --template default` per D-58-11).**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-23T08:36:34Z
- **Completed:** 2026-04-23T08:41:~Z
- **Tasks:** 2 (Task 1 TDD = RED + GREEN; Task 2 GREEN-only wiring)
- **Files changed:** 7 (3 created, 4 modified); +314 / -3 lines across 3 commits
- **Test delta:** +24 tests (312 → 336 passed; 36 files green, zero regressions)

## Accomplishments

- Shipped **`packages/dev-seed/src/cli/teardown.ts`** — split into pure orchestrator `runTeardown(prefix, client): Promise<TeardownResult>` + thin CLI wrapper (parseArgs + process.exit) gated by `isDirectInvocation`. `ALLOWED_TEARDOWN_TABLES` is a 10-entry `as const` tuple enforcing the Pitfall #6 guardrail; `countDeletedRows` sums `{ deleted: N }` entries from the `bulk_delete` RPC response. D-58-12 error rephrasing for `fetch failed` / `ECONNREFUSED` / `ENOTFOUND`.
- Shipped **`packages/dev-seed/src/cli/teardown-help.ts`** — `TEARDOWN_USAGE` template literal documenting `--prefix`, `--help`, env vars, and the D-58-17 permissive-prefix contract.
- Extended **`packages/dev-seed/src/supabaseAdminClient.ts`** with two new methods (after Plan 04's portrait upload surface):
  - `listCandidatePortraitPaths()` — 2-level enumeration of `${projectId}/candidates/` dir in `public-assets` bucket; skips `.emptyFolderPlaceholder`; treats "not found" as empty (initial state); throws with `listCandidatePortraitPaths:` prefix on other errors.
  - `removePortraitStorageObjects(paths)` — no-op on empty array; bulk `.remove(paths)` call; returns count removed; throws with `removePortraitStorageObjects failed:` prefix on error.
- Shipped **`packages/dev-seed/tests/cli/teardown.test.ts`** with 24 tests across 3 blocks:
  - `SupabaseAdminClient storage cleanup surface` (8 tests) — list returns paths, empty/missing state, placeholder skip, error throw with prefixed message; remove count return, empty-array no-op, error throw.
  - `runTeardown (CLI-03 / D-58-07 / D-58-17 / Pitfall #5 + #6)` (10 tests) — exactly-10-tables Pitfall #6 guardrail, prefix flow-through (default + custom override), execution order (bulkDelete → list → remove), row-count summation, empty-result resilience, T-58-07-02 guard (empty prefix + single char), bulkDelete error re-throw.
  - `TEARDOWN_USAGE (CLI-04 / D-58-13)` (6 tests) — Usage line, flag documentation, env-var documentation, default-prefix mention, permissive note.
- `packages/dev-seed/package.json` gains `"seed:teardown": "tsx src/cli/teardown.ts"`.
- Root `package.json` gains **`dev:seed`**, **`dev:seed:teardown`**, **`dev:reset-with-data`** (D-58-08 namespace + D-58-11 composition `yarn supabase:reset && yarn dev:seed --template default`).
- Barrel (`src/index.ts`) re-exports `runTeardown`, `TEARDOWN_USAGE`, and type `TeardownResult` — Plan 09 integration test can import these via `@openvaa/dev-seed` for unit-level checks.
- Full dev-seed suite 336/336 green across 36 files; typecheck clean; lint clean on all files this plan created/modified.

## Task Commits

| # | Type | Hash | Description |
|---|------|------|-------------|
| 1 | RED (Task 1) | `4b89889ae` | test(58-07): add failing tests for teardown CLI + storage cleanup surface |
| 2 | GREEN (Task 1) | `53f1ee737` | feat(58-07): implement teardown CLI + storage cleanup surface |
| 3 | GREEN (Task 2) | `2cee89301` | feat(58-07): wire seed:teardown + dev:seed / dev:seed:teardown / dev:reset-with-data scripts |

_TDD gate compliance (Task 1):_ RED commit (`4b89889ae`) precedes GREEN commit (`53f1ee737`); verified via `git log --oneline`. Task 2 is wiring-only (plan `type="auto"` without `tdd="true"`); verification relies on `yarn dev:seed --help` / `yarn dev:seed:teardown --help` smoke checks + the `node -e` script-composition grep for `dev:reset-with-data`.

## Files Created / Modified

- **`packages/dev-seed/src/cli/teardown.ts`** (NEW, 181 lines) — `#!/usr/bin/env tsx` shebang; parseArgs in strict mode; `ALLOWED_TEARDOWN_TABLES` 10-entry tuple; `runTeardown` pure orchestrator with prefix length guard; `isDirectInvocation` gate around CLI side-effects; D-58-12 error rephrasing.
- **`packages/dev-seed/src/cli/teardown-help.ts`** (NEW, 37 lines) — `export const TEARDOWN_USAGE` template literal; documents `--prefix` (default `seed_`, 2-char minimum), `--help`, env vars, D-58-17 permissive contract.
- **`packages/dev-seed/tests/cli/teardown.test.ts`** (NEW, 413 lines) — 24 tests; vi.mock of `@supabase/supabase-js` with configurable per-path list results + remove result; `makeFakeClient` factory returns a lightweight `FakeClient` shape matching `TeardownClient` interface for `runTeardown` tests.
- **`packages/dev-seed/src/supabaseAdminClient.ts`** (+90 lines) — added `listCandidatePortraitPaths()` + `removePortraitStorageObjects(paths)`. Preserves existing Plan 04 portrait surface; new methods append at class bottom with `// Storage cleanup surface` section header.
- **`packages/dev-seed/src/index.ts`** (+3 lines) — barrel re-exports: `runTeardown` from `./cli/teardown`, `TEARDOWN_USAGE` from `./cli/teardown-help`, type `TeardownResult` from `./cli/teardown`.
- **`packages/dev-seed/package.json`** (+1 line) — `"seed:teardown": "tsx src/cli/teardown.ts"` after the existing `"seed"` entry.
- **`package.json`** (root; +3 lines) — `dev:reset-with-data`, `dev:seed`, `dev:seed:teardown` inserted between `dev:reset` and `dev:status` (preserves existing grouping).

## Decisions Made

- **Direct-invocation guard over extract-to-module.** The plan `<action>` Step D suggested exporting `runTeardown` and having the CLI entry call it, but left implementation open on whether to keep one file or split. Kept one file — `teardown.ts` exports `runTeardown` + `TeardownResult` and contains the CLI entry, gated by `isDirectInvocation = process.argv[1].endsWith('teardown.ts'|'.js')`. The test file statically imports `runTeardown` from `../../src/cli/teardown`; the check prevents `parseArgs(process.argv.slice(2))` from firing against the vitest runner's argv. Trade-off: one extra check vs. a second module file; chose the check to keep the CLI entry self-contained and recognizable as `teardown.ts`.
- **`TeardownClient` structural interface, not `SupabaseAdminClient` class.** `runTeardown`'s `client` param is typed as a 3-method interface (`bulkDelete`, `listCandidatePortraitPaths`, `removePortraitStorageObjects`). Tests pass a plain `{ bulkDelete: vi.fn(), ... }` object without instantiating `SupabaseAdminClient` (which would call `createClient` and hit env-var fallbacks unnecessarily for unit tests). The CLI wrapper still constructs a real `SupabaseAdminClient` and passes it structurally — TypeScript accepts the subtype. Keeps tests fast and free of Supabase mock wiring at the `runTeardown` level.
- **Missing path treated as empty in `listCandidatePortraitPaths`.** After `yarn supabase:reset` with no seed applied yet, `${projectId}/candidates/` dir doesn't exist in `public-assets`. `.list()` returns an error matching `/not found|does not exist/i`. Returning `[]` in that case makes `yarn dev:seed:teardown` idempotent and safe to run on an already-clean state. Any other error (connection refused, auth failure) still throws with a prefixed message so the CLI can surface it via D-58-12 rephrasing.
- **Prefix length guard at 2 chars, not just non-empty.** The threat model's T-58-07-02 mitigation said "at least 2 characters"; stuck with that threshold. Rationale: single-char prefixes (`s`, `t`) could accidentally match non-seed data (e.g., a `'standby'` external_id); 2-char minimum matches the real-world `seed_` / `test_` shape while refusing the obvious footguns (`''`, `'s'`). The guard fires before any RPC call so no partial deletion occurs on guard trip.
- **`isDirectInvocation` uses `process.argv[1]` rather than `import.meta.url === ...`.** The ESM-native "am I the entry point" check is `import.meta.url === pathToFileURL(process.argv[1]).href`, but that adds an `url` import and requires both `.ts` and `.js` shape awareness. `process.argv[1].endsWith('teardown.ts' | 'teardown.js')` is simpler and sufficient for tsx execution (where `.ts` is the entry) and for hypothetical post-build `.js` form. Works for the two runtime modes this file sees.

## Deviations from Plan

**Rule 3 — blocking issue (test-time CLI side-effects):**

The plan's Step D reasoning block recommended extracting `runTeardown` into its own function + leaving `process.exit` at the CLI entry, but the import of `runTeardown` from the test file would still re-evaluate the top-level CLI block. Added an `isDirectInvocation` check to gate the parseArgs/SupabaseAdminClient/process.exit block. Without this guard, every `import { runTeardown }` in tests would trigger parseArgs against vitest's `process.argv`, breaking the whole test file.

- **Fix applied:** `const isDirectInvocation = typeof process.argv[1] === 'string' && (...endsWith('teardown.ts') || ...endsWith('teardown.js'))`. The entire CLI block sits inside `if (isDirectInvocation) { ... }`.
- **Commit:** `53f1ee737` (Task 1 GREEN).
- **Impact:** zero behavioral change for end users — `tsx src/cli/teardown.ts` still hits the CLI block; tests can import `runTeardown` and `TEARDOWN_USAGE` statically without subprocess-execing. Documented inline in `teardown.ts`.

**Rule 2 — CLAUDE.md enforcement (import ordering + func-style):**

First lint run flagged `simple-import-sort/imports` on `teardown.ts` and `func-style` / `import/first` on `teardown.test.ts`. Per CLAUDE.md §"Common Workflows", lint must pass. Fixed:

- `teardown.ts` imports autofixed by eslint (`yarn exec eslint --flag v10_config_lookup_from_file --fix`).
- `teardown.test.ts` — converted `const makeBuilder = (): any => ({...})` to `function makeBuilder(): any { return {...}; }` to satisfy `func-style`; added `// eslint-disable-next-line import/first` comments to the two intentionally-after-vi.mock imports (standard vitest pattern; seed.test.ts / writer.test.ts also place imports after vi.mock).
- **Commit:** `53f1ee737` (folded into GREEN commit rather than a separate style-only commit).

**No other deviations.** Plan `<action>` blocks followed verbatim for:
- Pitfall #6 10-table guardrail (accounts/projects/feedback/app_settings excluded, verified via `grep -c`).
- D-58-11 `dev:reset-with-data` composition (exact string `yarn supabase:reset && yarn dev:seed --template default` — verified via `node -e`).
- D-58-17 permissive contract (trust the prefix — no shape check; documented in TEARDOWN_USAGE).
- T-58-07-02 prefix length guard (threshold 2 chars, enforced pre-RPC, unit-tested with empty + single-char inputs).
- Storage Path 2 ordering (list AFTER bulkDelete — RESEARCH §3 primary, Pitfall #5 rationale — unit-tested via order-tracking mock).

## Deferred Issues

**Pre-existing lint errors (out-of-scope — not introduced by this plan):**

`yarn workspace @openvaa/dev-seed lint` still reports 5 errors from Plan 06's `src/templates/` files:
- `src/templates/default.ts:29` — `simple-import-sort/imports`
- `src/templates/defaults/candidates-override.ts:91` — `func-style`
- `src/templates/defaults/questions-override.ts:78` — `@typescript-eslint/consistent-type-imports`
- `src/templates/defaults/questions-override.ts:98` — `func-style`
- `src/templates/index.ts:17` — `simple-import-sort/imports`

Per the deviation SCOPE BOUNDARY: these live in files this plan doesn't touch and aren't caused by changes in this plan. Logged to `.planning/phases/58-templates-cli-default-dataset/deferred-items.md` for visibility; Plan 10 (documentation/housekeeping) is the natural home to clean them up.

## Issues Encountered

- **Worktree base mismatch on startup.** Agent spawned on `9e0399286` (feat-gsd-roadmap HEAD), but plan requires `08e94be42` (Wave 3 tracking commit). Resolved via `git reset --hard 08e94be42` per `<worktree_branch_check>`; `yarn install` then populated node_modules (initial `yarn workspace` invocation failed with "Couldn't find the node_modules state file").
- **Pre-existing dependency build required.** Baseline `yarn workspace @openvaa/dev-seed test:unit` failed until `@openvaa/core` and `@openvaa/matching` were built (`yarn build --filter=@openvaa/core --filter=@openvaa/matching`); 312 baseline tests then passed. Known Plan 05 issue, same resolution.
- **Lint autofix surfaced 6 pre-existing errors alongside our 1 new one.** `yarn workspace @openvaa/dev-seed lint` on the unmodified base already had 5 errors across 4 files under `src/templates/` (see Deferred Issues). Only fixed the 1 in `src/cli/teardown.ts` that this plan introduced. The pre-existing 5 are tracked in `deferred-items.md`.

## User Setup Required

None — pure library code + CLI shell + root script aliases. Three new `yarn` entry points (`dev:seed`, `dev:seed:teardown`, `dev:reset-with-data`) work immediately after `yarn install` and depend only on `supabase start` being up (for live teardown/seed runs).

## Next Phase Readiness

- **Plan 58-08 (e2e template):** Unaffected by Plan 07 — `BUILT_IN_TEMPLATES['e2e']` slots into the map Plan 06 created; `dev:seed:teardown` handles cleanup between e2e runs.
- **Plan 58-09 (integration test):** Can (a) `import { runTeardown } from '@openvaa/dev-seed'` for unit-level clean-slate assertions, (b) `yarn workspace @openvaa/dev-seed seed:teardown` subprocess-exec for end-to-end, (c) `yarn dev:reset-with-data` for a full reset+seed between test runs. The `TeardownResult` return shape (`{ rowsDeleted, storageRemoved }`) gives the integration test concrete numbers to assert against after a known-seed run.
- **Plan 58-10 (README + CLAUDE.md):** Must document:
  1. The D-58-17 "use a distinct prefix for hand-curated data" warning under `dev:seed:teardown`.
  2. The T-58-07-02 prefix length guard (>= 2 chars — why, and the error message).
  3. The three root aliases + the composition of `dev:reset-with-data` per D-58-11.
  4. The Pitfall #5 Path 2 rationale (why teardown does explicit Storage cleanup rather than trusting the pg_net trigger) — relevant for any future contributor reading the teardown code.

## Threat Flags

None — this plan's scope stays entirely inside the `<threat_model>` register. All STRIDE threats (T-58-07-01 through T-58-07-06) have dispositions of either `mitigate` (implemented: T-58-07-02 prefix guard, T-58-07-06 summary-on-success/stderr-on-error) or `accept` (documented trade-offs: T-58-07-01 service-role posture parity with Writer, T-58-07-03 public-path disclosure already visible, T-58-07-04 seed_ prefix contract, T-58-07-05 Storage list timeout bounded by API).

No new security-relevant surface introduced beyond what the `<threat_model>` register covers: teardown reuses the existing service-role client, the `public-assets` bucket is already part of Plan 04's trust envelope, and `bulk_delete` is an existing RPC with server-side `allowed_collections` enforcement.

## TDD Gate Compliance

Task 1 plan frontmatter marks `tdd="true"`. Gate sequence verified in git log:

1. **RED** (`4b89889ae`) — `test(58-07): add failing tests for teardown CLI + storage cleanup surface` — vitest reported `Cannot find module '../../src/cli/teardown'` (expected; source files not yet created).
2. **GREEN** (`53f1ee737`) — `feat(58-07): implement teardown CLI + storage cleanup surface` — all 24 tests pass; full suite 336/336 green.
3. **REFACTOR** — none needed; single-pass GREEN with lint cleanup folded in.

Task 2 is non-TDD wiring-only per plan spec; verification is `--help` smoke checks + `node -e` script composition grep. No TDD gate required for Task 2.

## Self-Check: PASSED

**File existence:**
- FOUND: `packages/dev-seed/src/cli/teardown.ts`
- FOUND: `packages/dev-seed/src/cli/teardown-help.ts`
- FOUND: `packages/dev-seed/tests/cli/teardown.test.ts`
- FOUND: `packages/dev-seed/src/supabaseAdminClient.ts` (with new methods; `grep -c "listCandidatePortraitPaths\|removePortraitStorageObjects"` returns 6, >= 2)
- FOUND: `packages/dev-seed/src/index.ts` (barrel re-exports present)
- FOUND: `packages/dev-seed/package.json` (scripts.seed:teardown present)
- FOUND: `package.json` (root scripts present)

**Commit existence (`git log --oneline | grep`):**
- FOUND: `4b89889ae test(58-07): add failing tests for teardown CLI + storage cleanup surface`
- FOUND: `53f1ee737 feat(58-07): implement teardown CLI + storage cleanup surface`
- FOUND: `2cee89301 feat(58-07): wire seed:teardown + dev:seed / dev:seed:teardown / dev:reset-with-data scripts`

**Acceptance criteria grep checks (all PASS):**
- `grep -q "export async function runTeardown" packages/dev-seed/src/cli/teardown.ts` — PASS
- `ALLOWED_TEARDOWN_TABLES` contains exactly 10 entries (verified: `grep -c "^  '" teardown.ts` = 10) — PASS
- `! grep -qE "'accounts'|'projects'|'feedback'" packages/dev-seed/src/cli/teardown.ts` — PASS (none present)
- `grep -q "prefix.length < 2" packages/dev-seed/src/cli/teardown.ts` — PASS (T-58-07-02 guard)
- `grep -q "tsx src/cli/teardown.ts" packages/dev-seed/package.json` — PASS
- `grep -q "\"dev:seed\": \"yarn workspace @openvaa/dev-seed seed\"" package.json` — PASS
- `grep -q "\"dev:seed:teardown\": \"yarn workspace @openvaa/dev-seed seed:teardown\"" package.json` — PASS
- `grep -q "yarn supabase:reset && yarn dev:seed --template default" package.json` — PASS

**Verification command results:**
- `yarn workspace @openvaa/dev-seed test:unit tests/cli/teardown.test.ts` — 24 passed in 1 file
- `yarn workspace @openvaa/dev-seed test:unit` (full suite) — 336 passed across 36 files, zero regressions
- `yarn workspace @openvaa/dev-seed typecheck` — exit 0
- `yarn exec eslint --flag v10_config_lookup_from_file packages/dev-seed/src/cli/teardown.ts packages/dev-seed/src/cli/teardown-help.ts packages/dev-seed/tests/cli/teardown.test.ts` — exit 0 (clean on all files this plan created/modified)
- `yarn dev:seed --help` — exit 0, USAGE printed (first line `Usage: yarn workspace @openvaa/dev-seed seed [options]`)
- `yarn dev:seed:teardown --help` — exit 0, TEARDOWN_USAGE printed (first line `Usage: yarn workspace @openvaa/dev-seed seed:teardown [options]`)
- `node -e "console.log(JSON.parse(require('fs').readFileSync('package.json')).scripts['dev:reset-with-data'])"` — prints `yarn supabase:reset && yarn dev:seed --template default` (D-58-11 exact composition)

---
*Phase: 58-templates-cli-default-dataset*
*Plan: 07*
*Completed: 2026-04-23*
