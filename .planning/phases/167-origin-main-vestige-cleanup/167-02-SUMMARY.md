---
phase: 167-origin-main-vestige-cleanup
plan: 02
subsystem: api
tags: [sveltekit, universal-adapter, env, render, docker-compose, flat-cache, vestige-removal]

requires:
  - phase: 167-origin-main-vestige-cleanup
    provides: 167-01 commit ① and 167-phase-base.txt (PHASE_BASE 8c519ac97)
provides:
  - commit ② (837b895c4) removes the /api/cache proxy, cachifyUrl, hasAuthHeaders, disableCache, cacheProxy, the backend-URL pair, PUBLIC_CACHE_ENABLED, the four CACHE_* constants, BACKEND_API_TOKEN, flat-cache and every env/deployment-template mention, as one revertable commit
  - UniversalAdapter.fetch passes the caller URL to the request fetch unchanged
  - present-tense docblocks on the three +layout.server.ts files, each citing scripts/assert-no-session-in-loads.mjs
affects: [167-03, 167-04, 167-06, 168, 169]

actuals:
  tokens: 15585
  tasks: 3
  commits: 1
plan_head_before: e92cb2c83159deb933d19855d3ee9735362cafa3
plan_head_after: 837b895c46ff899bf1fb5218efdcaad601412b78

tech-stack:
  added: []
  patterns:
    - "Single-commit vestige removal: route, constants, mocks, manifest, lockfile and templates in one revertable commit"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/api/base/universalAdapter.ts
    - apps/frontend/src/lib/api/base/universalAdapter.type.ts
    - apps/frontend/src/lib/api/base/universalAdapter.test.ts
    - apps/frontend/src/lib/api/base/universalApiRoutes.ts
    - apps/frontend/src/lib/server/constants.ts
    - apps/frontend/src/lib/utils/constants.ts
    - apps/frontend/src/routes/+layout.server.ts
    - apps/frontend/src/routes/admin/+layout.server.ts
    - apps/frontend/src/routes/candidate/+layout.server.ts
    - render.example.yaml
    - .env.example
    - yarn.lock

key-decisions:
  - "D-11 sample path: /api/auth/logout (a live route) replaces /api/cache in route.test.ts and voterAppPath.test.ts"
  - "Admin and candidate docblocks now name the projection spec routes/admin/layout.server.test.ts instead of promising a spec 'named below'"
  - "The root docblock gained one sentence citing scripts/assert-no-session-in-loads.mjs, which the acceptance criteria require of all three docblocks"
  - "VEST-03 is left open: its adapter-todo notes clause is plan 167-06's"

patterns-established:
  - "A docblock touched for one stale reference is rewritten as a whole into present tense (Comment Hygiene)"

requirements-completed: [VEST-02]

coverage:
  - id: D1
    description: "No /api/cache route: the route directory is gone, and the production build has no cache endpoint and no \"/api/cache\" in manifest.js"
    requirement: VEST-03
    verification:
      - kind: other
        ref: "test ! -e apps/frontend/src/routes/api/cache -> exit 0; test ! -e apps/frontend/.svelte-kit/output/server/entries/endpoints/api/cache -> exit 0; grep -c '\"/api/cache\"' .svelte-kit/output/server/manifest.js -> 0 (frontend build hash 266d56819dc46311 executed on this tree)"
        status: pass
    human_judgment: false
  - id: D2
    description: "UniversalAdapter.fetch calls the request fetch exactly once with the caller URL unchanged; FetchOptions has only authToken"
    requirement: VEST-03
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/api/base/universalAdapter.test.ts#fetch > should make successful fetch request (toHaveBeenCalledTimes(1) + toHaveBeenCalledWith('http://openvaa.org/api', {}))"
        status: pass
    human_judgment: false
  - id: D3
    description: "BACKEND_API_TOKEN, the CACHE_* keys and the backend-URL pair are gone from both constants modules and all 7 auth test mocks; the neighbouring keys survive and the server-constants diff is deletion-only (0 added, 5 removed)"
    requirement: VEST-02
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/frontend test:unit -> exit 0 (126 files, 2018 tests), including the 7 auth test files"
        status: pass
      - kind: other
        ref: "git grep population for BACKEND_API_TOKEN|CACHE_*|PUBLIC_(BROWSER|SERVER)_BACKEND_URL|PUBLIC_CACHE_ENABLED under apps/frontend/src -> exit 1"
        status: pass
    human_judgment: false
  - id: D4
    description: "Whole-tree zero hits for every removed identifier outside .planning, apps/docs, yarn.lock, .yarn and security/audit-baseline.json"
    requirement: VEST-03
    verification:
      - kind: other
        ref: "Task 3 step 6 git grep -> exit 1, no output"
        status: pass
    human_judgment: false
  - id: D5
    description: "flat-cache dropped from apps/frontend/package.json, with a removal-only lockfile change"
    requirement: VEST-03
    verification:
      - kind: other
        ref: "yarn install exit 0; yarn.lock diff: 11 resolutions removed (incl. flat-cache@npm:6.1.20), 0 added"
        status: pass
    human_judgment: false
  - id: D6
    description: "The three +layout.server.ts docblocks read in the present tense, keep the no-token rule, the { userId, expiresAt } vocabulary and the guard reference"
    verification:
      - kind: other
        ref: "grep for 'used to|cache disk|MEASURED on a running server|Until this file|D10' -> 0 per file; assert-no-session-in-loads -> 1 per file; yarn lint:check exit 0 (no-session guard 0 violations)"
        status: pass
    human_judgment: true
    rationale: "Comment Hygiene's historical-narrative rule can only be checked by reading; the reviewer should read the three rewritten docblocks"

duration: 7min
completed: 2026-10-02
status: complete
---

# Phase 167 Plan 02: Cache-proxy and backend-URL removal Summary

**Commit ② removes the `/api/cache` proxy and everything that only served it in one revertable commit (34 files, +33/−606). That covers the route, `cachifyUrl`, `hasAuthHeaders`, `disableCache`, `cacheProxy`, `PUBLIC_CACHE_ENABLED`, the four `CACHE_*` constants, the backend-URL pair, `BACKEND_API_TOKEN`, `flat-cache` and every env and deployment template entry. `UniversalAdapter.fetch` now passes the caller's URL straight to the request fetch.**

## Performance

- **Duration:** about 7 min
- **Started:** 2026-10-02T05:55:06Z
- **Completed:** 2026-10-02T06:02Z
- **Tasks:** 3 (one commit, per D-24 ②)
- **Files modified:** 34 (5 deleted, 29 edited)

## Accomplishments

- The request path no longer branches on a cache. `UniversalAdapter.fetch` destructures only `authToken`, and both error messages interpolate `url`. The class and method docstrings describe the current behaviour.
- The route `routes/api/cache/+server.ts`, `cachifyUrl.ts` and `authHeaders.ts` are deleted, along with their tests. `UNIVERSAL_API_ROUTES` loses `cacheProxy`, and `FetchOptions` loses `disableCache`.
- In the constants modules, the public one loses the backend-URL pair and `PUBLIC_CACHE_ENABLED`. The private one loses `BACKEND_API_TOKEN` and the four `CACHE_*` keys (a deletion-only diff). `LOCAL_DATA_DIR` and the `*_FRONTEND_URL` pair are kept.
- The same keys are removed from all 7 auth test mocks and both Supabase test mocks. The route tests now sample `/api/auth/logout`.
- `flat-cache` is gone from the frontend manifest. The lockfile change only removes entries: 11 resolutions out, none in.
- Template cleanup:
  - `.env.example`: the cache block is removed.
  - Root compose: the `PUBLIC_CACHE_ENABLED` line is removed.
  - Frontend compose: the cache volume is removed.
  - `render.example.yaml`: the five cache keys and the `disk:` block are removed.
  - The routes README and the CLAUDE.md deployment sentence no longer mention the cache.
- The three `+layout.server.ts` docblocks are rewritten in the present tense. Each keeps the rule that a load never returns a token-bearing member, and each cites `scripts/assert-no-session-in-loads.mjs`.

## Task Commits

All three tasks land in one commit, by plan design (D-24 ②):

1. **Task 1: Requests go straight to fetch (tracer)**, uncommitted by design; gates green (check 0 errors / 0 warnings, unit 2018/2018)
2. **Task 2: Private constants, mock keys, sample paths, flat-cache**, uncommitted by design; gates green
3. **Task 3: Templates, docblocks, gates and commit ②**: `837b895c4` (refactor)

**Plan metadata:** see the docs commit that follows this SUMMARY.

## Gates (exit codes read directly, never through a pipe)

| Gate | Exit |
|---|---|
| `yarn lint:check` (incl. comment-hygiene, env-pair-registry, no-session-in-loads: all 0 violations) | 0 |
| `yarn format:check` | 0 |
| `yarn test:unit` | 0 |
| `yarn build` | 0 (frontend build hash `266d56819dc46311` was a real cache miss executed during `test:unit` on this exact tree; the `yarn build` hit replayed it) |
| Whole-tree zero-hit grep | 1 (no hits) |
| Build output: no `api/cache` endpoint, `"/api/cache"` count in `manifest.js` | absent / 0 |

## Files Created/Modified

- `apps/frontend/src/lib/api/base/universalAdapter.ts`: `fetch` with no cache branch
- `apps/frontend/src/lib/api/base/universalAdapter.type.ts`: `FetchOptions` = `{ authToken? }`
- `apps/frontend/src/lib/api/base/universalAdapter.test.ts`: the caching suite and the constants mock are removed. The `fetch` suite is renamed and pins the call count at exactly 1.
- `apps/frontend/src/lib/api/base/universalApiRoutes.ts`: no `cacheProxy`
- `apps/frontend/src/lib/api/adapters/apiRoute/dataProvider/apiRouteDataProvider.ts`: no `disableCache` arguments
- `apps/frontend/src/lib/server/constants.ts`, `apps/frontend/src/lib/utils/constants.ts`: the removed keys are gone
- 7 auth test files and 2 Supabase test files: mock keys removed
- `apps/frontend/src/lib/routes/route.test.ts`, `voterAppPath.test.ts`: sample path is now `/api/auth/logout`
- `apps/frontend/package.json`, `yarn.lock`: `flat-cache` removed
- `.env.example`, `docker-compose.dev.yml`, `apps/frontend/docker-compose.dev.yml`, `render.example.yaml`: cache entries removed
- `apps/frontend/src/routes/README.md`, `CLAUDE.md`: cache mentions removed
- `apps/frontend/src/routes/{,admin/,candidate/}+layout.server.ts`: docblocks rewritten
- Deleted: `routes/api/cache/+server.ts`, `lib/api/utils/cachifyUrl.ts` and its test, `lib/api/utils/authHeaders.ts` and its test

## Decisions Made

- `/api/auth/logout` is the live API path used as the test sample (D-11, Claude's discretion).
- The admin and candidate docblocks now name `routes/admin/layout.server.test.ts`. That spec drives both loads and enumerates the key set. This replaces the dangling "the spec named below" promise.
- The root docblock's title now reads "the Supabase cookies a universal load rebuilds its client from". The old title also claimed "the request's session", which this load does not return.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] Pinned the exact call count in the renamed `fetch` suite**
- **Found during:** Task 1
- **Issue:** The must-have "[edge VEST-03 empty] … calls the request fetch exactly once … the renamed `fetch` suite asserts it" was not asserted. The existing case checked `toHaveBeenCalledWith` but did not check the call count.
- **Fix:** Added `expect(mockFetch).toHaveBeenCalledTimes(1)` to `should make successful fetch request`.
- **Files modified:** `apps/frontend/src/lib/api/base/universalAdapter.test.ts`
- **Committed in:** `837b895c4`

**2. [Rule 2 - Missing critical] Root docblock now cites the no-session guard**
- **Found during:** Task 3
- **Issue:** The acceptance criteria require each of the three docblocks to contain `assert-no-session-in-loads`. The root docblock never cited it.
- **Fix:** Added one sentence stating that `scripts/assert-no-session-in-loads.mjs` fails the lint chain if any server load returns the verified-session binding. This is an existing fact, and the root file is one of the guard's corpus anchors.
- **Files modified:** `apps/frontend/src/routes/+layout.server.ts`
- **Committed in:** `837b895c4`

---

**Total deviations:** 2 auto-fixed (both Rule 2, both needed to meet the plan's own must-haves and acceptance criteria)
**Impact on plan:** None on scope.

## Issues Encountered

- zsh does not word-split an unquoted `$VAR`, so the first `for f in $FILES` key-deletion loop passed all 8 paths as one argument and edited nothing. I re-ran it as a `while read` loop. No file was half-edited.

## Notes for later plans

- **Phase 168 operator note (deployment page):** Existing Render services can detach the `/var/data/cache` disk. They can also delete these env vars: `PUBLIC_CACHE_ENABLED`, `CACHE_DIR`, `CACHE_TTL`, `CACHE_LRU_SIZE`, `CACHE_EXPIRATION_INTERVAL`, `BACKEND_API_TOKEN`, `PUBLIC_BROWSER_BACKEND_URL` and `PUBLIC_SERVER_BACKEND_URL`. Local `.env` copies can drop the `# Cache settings` block. Keys that are left in place are inert, because nothing reads them under `$env/dynamic/*`. `apps/docs` still mentions the cache and is Phase 168's surface (D-01 fact 21).
- **Phase 169 note:** The two `flat-cache` rows in `security/audit-baseline.json` stay, because ESLint's `file-entry-cache` still pulls `flat-cache` in. Their `via` text still names `flat-cache@6.1.20`, which is stale but harmless. The reviewed baseline update should refresh it.
- **D-26:** The E2E run that D-26 requires for the `UniversalAdapter.fetch` change was not part of this plan's gates. It belongs to the phase's gate plan.
- **UNCONFIRMED:** The two security properties below come from reading the code. No run demonstrated either one. The path is removed either way.
  - Threat T-167-04: the route performed a server-side fetch of a caller-chosen absolute URL.
  - D-01 fact 8: cookie-authenticated responses could be cached by URL.

## User Setup Required

None. The operator note above is optional cleanup for existing deployments.

## Next Phase Readiness

- Plans 167-03 to 167-06 can proceed from `837b895c4`. The working tree is clean apart from the pre-existing untracked `gate-evidence/` directory (D-23 handles it in a later plan).
- VEST-03 stays open until 167-06 adds the dated notes to the two adapter todos (D-10).

---
*Phase: 167-origin-main-vestige-cleanup*
*Completed: 2026-10-02*

## Self-Check: PASSED

- Commit `837b895c4` exists on `fix/888-review-findings`, with subject `refactor[frontend]: remove the /api/cache proxy, the backend-URL pair and BACKEND_API_TOKEN`.
- The five deleted files are absent from HEAD. `render.example.yaml`, `.env.example` and both constants modules are present.
