---
phase: 167-origin-main-vestige-cleanup
verified: 2026-10-02T10:00:00Z
status: passed
score: 9/9 must-haves verified
covered_files:
  - ".env.example"
  - ".planning/phases/167-origin-main-vestige-cleanup/167-01-PLAN.md"
  - ".planning/phases/167-origin-main-vestige-cleanup/167-01-SUMMARY.md"
  - ".planning/phases/167-origin-main-vestige-cleanup/167-02-PLAN.md"
  - ".planning/phases/167-origin-main-vestige-cleanup/167-02-SUMMARY.md"
  - ".planning/phases/167-origin-main-vestige-cleanup/167-03-PLAN.md"
  - ".planning/phases/167-origin-main-vestige-cleanup/167-03-SUMMARY.md"
  - ".planning/phases/167-origin-main-vestige-cleanup/167-04-PLAN.md"
  - ".planning/phases/167-origin-main-vestige-cleanup/167-04-SUMMARY.md"
  - ".planning/phases/167-origin-main-vestige-cleanup/167-05-PLAN.md"
  - ".planning/phases/167-origin-main-vestige-cleanup/167-05-SUMMARY.md"
  - ".planning/phases/167-origin-main-vestige-cleanup/167-06-PLAN.md"
  - ".planning/phases/167-origin-main-vestige-cleanup/167-06-SUMMARY.md"
  - "CLAUDE.md"
  - "apps/docs/package.json"
  - "apps/docs/src/lib/components/PeerNavigation.svelte"
  - "apps/docs/src/lib/components/openVAALogo/OpenVAALogo.svelte"
  - "apps/docs/src/lib/components/openVAALogo/OpenVAALogo.type.ts"
  - "apps/frontend/docker-compose.dev.yml"
  - "apps/frontend/eslint.config.mjs"
  - "apps/frontend/package.json"
  - "apps/frontend/src/lib/api/adapters/apiRoute/dataProvider/apiRouteDataProvider.ts"
  - "apps/frontend/src/lib/api/adapters/supabase/feedbackWriter/supabaseFeedbackWriter.test.ts"
  - "apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.test.ts"
  - "apps/frontend/src/lib/api/base/universalAdapter.test.ts"
  - "apps/frontend/src/lib/api/base/universalAdapter.ts"
  - "apps/frontend/src/lib/api/base/universalAdapter.type.ts"
  - "apps/frontend/src/lib/api/base/universalApiRoutes.ts"
  - "apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts"
  - "apps/frontend/src/lib/api/utils/auth/__tests__/callback-endpoint.test.ts"
  - "apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts"
  - "apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.test.ts"
  - "apps/frontend/src/lib/api/utils/auth/providers/authorize-fail-closed.test.ts"
  - "apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts"
  - "apps/frontend/src/lib/api/utils/auth/providers/signicat.test.ts"
  - "apps/frontend/src/lib/routes/route.test.ts"
  - "apps/frontend/src/lib/routes/voterAppPath.test.ts"
  - "apps/frontend/src/lib/server/constants.ts"
  - "apps/frontend/src/lib/supabase/safeGetSession.test.ts"
  - "apps/frontend/src/lib/utils/constants.ts"
  - "apps/frontend/src/routes/+layout.server.ts"
  - "apps/frontend/src/routes/README.md"
  - "apps/frontend/src/routes/admin/+layout.server.ts"
  - "apps/frontend/src/routes/candidate/+layout.server.ts"
  - "apps/frontend/vite.config.ts"
  - "docker-compose.dev.yml"
  - "packages/argument-condensation/README.md"
  - "packages/argument-condensation/package.json"
  - "packages/llm/package.json"
  - "packages/question-info/package.json"
  - "render.example.yaml"
  - "security/audit-baseline.json"
covered_digest: "v2:sha256:82efb8938d9eb0f042df3520acdc393380029ff0f175cef85fef46db80dce2bb"
behavior_unverified: 0
overrides_applied: 0
re_verification: false
deferred:
  - truth: "No workspace declares a dependency it does not use (typedoc-plugin-markdown in apps/docs has no importer)"
    addressed_in: "Phase 168"
    evidence: "167-CONTEXT D-15 keeps it for Phase 168's typedoc decision; Phase 168 plan 168-01.1 'repair or delete the broken docs scripts ... remove the dependencies that lose their last consumer'"
  - truth: "Docs pages still name BACKEND_API_TOKEN, PUBLIC_BROWSER/SERVER_BACKEND_URL, PUBLIC_CACHE_ENABLED and the /api/cache route"
    addressed_in: "Phase 168"
    evidence: "Phase 168 goal: every docs page describes the system that exists; ROADMAP Phase 167 text says docs pages go to Phase 168"
---

# Phase 167: Origin/main Vestige Cleanup Verification Report

**Phase Goal:** No origin/main-era vestige survives in code, tests, manifests or planning state, and the session-lookup cost of `safeGetSession` is pinned by a test.
**Verified:** 2026-10-02
**Status:** passed
**Re-verification:** No, initial verification
**Base:** `8c519ac97`. HEAD `ef7bbfff4`. Non-`.planning` diff between the E2E-gated commit `275250054` and HEAD is empty, so the E2E run covers the shipped code.

## Goal Achievement

### Observable Truths (ROADMAP success criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `safeGetSession` has a test asserting no needless round trips, observed failing against a chattier variant | VERIFIED | `safeGetSession.test.ts`: all 10 cases use exact `toHaveBeenCalledTimes(n)` on `getUser` and `getSession`; strict Proxy client throws `UnexpectedClientAccess` on any other member and `afterEach` asserts the record is empty. Own run: 10/10 pass. Own mutations on the source (restored, `git status` clean): removing the memo (`if (cached) return cached`) fails 3 tests; adding one extra `getSession()` read after `getUser` fails 10 tests. `safeGetSession.ts` unchanged vs base. |
| 2 | `BACKEND_API_TOKEN` gone from constants and the 7 auth test mocks | VERIFIED | `git grep BACKEND_API_TOKEN` outside `.planning`, `apps/docs` and `*.md`: 0 hits. Constants diff shows the line removed; 7 test files each lose the mock key. Remaining hits are 3 lines in two docs pages (Phase 168). |
| 3 | Backend-URL pair / `/api/cache` resolved | VERIFIED | Removed branch chosen: `routes/api/cache/+server.ts`, `cachifyUrl(.test).ts`, `authHeaders(.test).ts`, the pair, `PUBLIC_CACHE_ENABLED`, four `CACHE_*` constants, `flat-cache`, `.env.example` cache block, `render.example.yaml` cache vars/disk, both docker-compose cache entries all removed. `git grep` for `api/cache`, `cachifyUrl`, `cacheProxy`, `hasAuthHeaders`, `disableCache`, `flat-cache` in apps/frontend, packages, scripts, tests, infra: 0 hits (only ESLint's own nested `flat-cache` rows in the audit baseline). `UniversalAdapter.fetch` is a plain fetch with Bearer support. Both adapter todos carry the dated 2026-10-02 note and stay open. |
| 4 | Unused deps removed, baseline updated in same commit, coverage-v8 decided | VERIFIED (one recorded exception, see Deferred) | Removed: docs 11 devDeps; frontend `@testing-library/jest-dom`, `@eslint/eslintrc`, `@eslint/js`, `@typescript-eslint/eslint-plugin`, `flat-cache`, `@vitest/coverage-v8` (decision: removed; no coverage config or import anywhere); question-info `js-yaml` + types; argument-condensation `dotenv`, `js-yaml`, types; llm `jsonrepair` removed and `js-yaml` + `@types/js-yaml` declared (its `promptRegistry.ts` imports it). 0 importers for any removed name. `eslint-plugin-svelte` imported explicitly in frontend `eslint.config.mjs` (`svelte.configs['flat/prettier']`, FlatCompat dropped). `audit-baseline.json`: lodash row 1115806 deleted, note 70 -> 69 (64 -> 63 high), my count: 69 rows, 63 high, 6 critical. `yarn.lock` adds only descriptor-merge lines and the llm js-yaml/types lines, no new resolution. My unused-dependency script over every workspace finds only type packages/CLI tools and `typedoc-plugin-markdown`. |
| 5 | docs `OpenVAALogo.svelte` uses runes | VERIFIED | `$props()`, `$derived.by`; `git grep -P` over `apps/docs/src` (non-md) for `export let`, `$$Props`, `$$props`, `$$restProps`, `$$slots`, `$app/stores`, `createEventDispatcher`, `on:`, `<slot`, `beforeUpdate`, `afterUpdate`, `$:` returns 0. `PeerNavigation.svelte` also ported (`$app/state`, `$derived`). Both call sites (`Header`, `Footer`) pass no `class`, so forwarding `...restProps`/`class` changes nothing there. `docs svelte-check`: 0 errors, 0 warnings. |
| 6 | env-dir todo checked against `svelte.config.js` and closed | VERIFIED | `kit.env.dir = repoRoot` confirmed. Todo moved to `todos/done/` with `resolved: 2026-10-02` and a three-point resolution; the stale `vite.config.ts` comment rewritten to the root `.env` loading. |
| 7 | `gate-evidence/` inspected, deleted, never committed | VERIFIED | Directory absent; `git ls-files` shows no `261001-n8y` gate-evidence path; the two tracked `260930-kxi` files untouched (diff vs base empty). 167-06-SUMMARY records counts-only scan (65 files; 0 PEM/AKIA hits; one 2-line pattern hit that is tracked docs placeholder content), no value reproduced. VESTIGES line 8 and 261001-n8y SUMMARY line 84 record the deletion. |
| 8 | Linked todos moved to `done/`; touched comments pass hygiene | VERIFIED | Env-dir todo is the only one the phase discharges (git status R). Three new follow-up todos filed (`declare-globals-in-shared-config`, `tracked-260930-kxi-gate-evidence-files`, `writer-second-getuser-round-trip`). VESTIGES rows 46, 54, 55 marked fixed with hashes. `yarn assert:comment-hygiene`: 1757 files, 0 violations. |
| 9 | Gates incl. full E2E | VERIFIED | `tests/e2e-runs/167-gate/results.json`: expected 171, skipped 0, unexpected 0, flaky 0, workers 6, retries 0, exit 0, head `275250054`, db_reset true. Own runs: frontend vitest 126 files / 2018 tests pass; frontend `yarn lint` exit 0 (1 warning in an untouched file); frontend and docs typecheck 0 errors / 0 warnings; `assert:declared-binaries` and `assert:env-pair-registry` 0 violations. `yarn audit:deps` and production builds were not re-run (network / time); 167-04 and 167-06 SUMMARIES report them green and the baseline arithmetic is checked above. |

**Score:** 9/9 truths verified, 0 behavior-unverified.

### Requirements Coverage

| Requirement | Source Plan | Status | Evidence |
|-------------|-------------|--------|----------|
| VEST-01 | 167-01 | SATISFIED | Truth 1 |
| VEST-02 | 167-02 | SATISFIED | Truth 2 |
| VEST-03 | 167-02, 167-06 | SATISFIED | Truth 3 (docs pages go to 168) |
| VEST-04 | 167-03, 167-04 | SATISFIED with recorded exception | Truth 4; `typedoc-plugin-markdown` kept for Phase 168 (D-15) |
| VEST-05 | 167-05, 167-06 | SATISFIED | Truth 5 |
| VEST-06 | 167-05, 167-06 | SATISFIED | Truth 6 |
| VEST-07 | 167-06 | SATISFIED | Truth 7 |
| VEST-08 | 167-06 | SATISFIED | Truth 8 |
| VEST-09 | 167-06 | SATISFIED | Truth 9 |

All nine IDs are claimed by at least one plan frontmatter, appear in REQUIREMENTS.md (`[x]`, traceability "Complete"), and none are orphaned.

### Anti-Patterns Found

None blocking. No TBD/FIXME/XXX debt markers introduced in touched code (comment-hygiene guard clean).

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| safeGetSession pins counts | vitest run safeGetSession.test.ts | 10/10 pass | PASS |
| Memo removed is caught | mutate source, rerun | 3 fail, source restored | PASS |
| Extra getSession read is caught | mutate source, rerun | 10 fail, source restored | PASS |
| Frontend unit suite | vitest run | 2018/2018 | PASS |

### Warnings (non-blocking, informational)

1. **Deferred to Phase 168:** `apps/docs` pages still mention `BACKEND_API_TOKEN`, the backend-URL pair, `PUBLIC_CACHE_ENABLED` and `/api/cache` (deployment, authentication, data-api, accessing-data-and-state-management, environmental-variables). Phase 168 owns the whole docs rewrite. `typedoc-plugin-markdown` is the one declared-but-unused dependency left, kept deliberately (D-15).
2. **Shared-config `globals` drift:** removing docs' `globals@^16` moved the root resolution to 15.14.0 for `@openvaa/shared-config`, which imports it without declaring it. Recorded in 167-04-SUMMARY and filed as `2026-10-02-declare-globals-in-shared-config.md`.
3. **Docs ESLint cannot load** (`ERR_INTERNAL_ASSERTION`, exit 2), reproduced here; identical before and after per 167-04, pre-existing, not in `lint:check`, owned by Phase 168 (168-01.1). Lint rules still firing after the removals was proven with a probe config in 167-04.
4. `OpenVAALogo` now forwards `class` and rest attributes (a superset of the old behavior) and its documented default colour was corrected from `neutral` to `primary` to match the code; no call site is affected.

## Human Verification Required

None.

---

_Verified: 2026-10-02_
_Verifier: Claude (gsd-verifier)_
