# Phase 167: Origin/main Vestige Cleanup - Context

**Gathered:** 2026-10-01
**Status:** Ready for planning

**Source of decisions:** `.planning/v2.15-166-169-DISCUSSION-POINTS.md` § *Phase 167 — Origin/main Vestige
Cleanup*. This is one checkbox document shared by Phases 166–169, and the operator filled it in one pass
(recorded in `e65bed5cf`, *docs(166-169): record the filled discussion decisions*). Its rule: when no box in a
decision is ticked, the `★ RECOMMENDED` option is chosen. A ticked box overrules the ★, and `**EDIT:**` /
`**NOTE:**` text under a decision beats every box. **Phase 167 has one tick:** in **167-D1** (the frontend's
`eslint-plugin-svelte`) the operator ticked option **(b)**, "keep it and switch to an explicit
`import svelte from 'eslint-plugin-svelte'`, as `apps/docs` does". That **overrules the ★ (a)** and brings the
cost the doc names: a before/after lint-output comparison showing nothing changed (D-12). The other 25 Phase 167
decisions take their ★ option as written. Free text: **one NOTE**, under 167-E3. It says the two tracked
`260930-kxi` gate-evidence files are outside criterion 7 and stay untouched. It is honoured in D-23. There is no
`**EDIT:**` text in the section.

<domain>
## Phase Boundary

This phase handles the code-side deferrals of the `261001-n8y` origin/main vestige sweep. It covers:

- pinning `safeGetSession`'s round trips with a test that has been observed to fail;
- removing `BACKEND_API_TOKEN` and the **whole** `/api/cache` proxy, together with the
  `PUBLIC_BROWSER_BACKEND_URL` / `PUBLIC_SERVER_BACKEND_URL` pair;
- correcting the dependency manifests: removing unused entries, and declaring `js-yaml` in `@openvaa/llm`,
  the package that imports it;
- porting the docs app's two remaining Svelte 4 files to runes;
- closing the stale env-dir todo;
- inspecting and deleting the untracked `gate-evidence/` directory.

The roadmap's nine success criteria are in `.planning/ROADMAP.md` § *Phase 167* (marked "draft, to be firmed at
planning"). The decisions below firm them up, and **several of them contradict the roadmap's wording**. The
factual baseline (D-01) shows the roadmap was wrong in ten places.

**Not in this phase:**

- the writer's second `getUser()` in `SupabaseDataWriter._getBasicUserData` (filed as a todo, D-02);
- any change to the auth path across the adapter boundary;
- the docs pages that describe what this phase removes (Phase 168);
- dependency **version** bumps, and getting `yarn audit:deps` to exit 0 (both Phase 169);
- removing `typedoc-plugin-markdown` (kept for Phase 168, D-15);
- the Svelte 4 prose in the docs code-style-guide page (Phase 168);
- the two **tracked** `260930-kxi` gate-evidence files (the 167-E3 NOTE, D-23).

</domain>

<decisions>
## Implementation Decisions

Each decision's ID in the discussion doc is given in parentheses. All of them are locked, and the planner does
not reopen them. The doc keeps the rejected options and their costs. Read it when a plan seems to need one, but
none of those options is live.

### 0 — Factual baseline

- **D-01 (167-0.1):** All 21 facts in the 167-0 table are accepted as the phase's factual baseline and are
  restated here, so no planner has to re-derive them before planning. Facts 1, 3, 6, 13, 14, 16 and 17 overturn
  roadmap wording and must not be lost. Fact 8 is **UNCONFIRMED by a run**. Following the content-anchor rule,
  the planner re-derives every *count* at run time. These numbers were measured at `89a4bd9ff` and are a snapshot.

  | # | Roadmap / VESTIGES claim | What the tree shows (at `89a4bd9ff`) | Anchor |
  |---|---|---|---|
  | 1 | Criterion 1: add a round-trip test, or cite one if it exists | **A test exists.** `safeGetSession.test.ts` has 10 cases (`d778fca2b`). All 10 assert the `getUser` count. **Only the first** asserts the `getSession` count (`toHaveBeenCalledTimes(3)`). No negative-control run is recorded for it. | `apps/frontend/src/lib/supabase/safeGetSession.test.ts` (`it('verifies a token once …')`, `fakeClient`) |
  | 2 | (implicit) DB calls are covered | The stub client exposes only `auth.getSession` and `auth.getUser`. A `.from(…)` or `.rpc(…)` call would throw a TypeError, so zero DB calls holds **by accident**, and nothing asserts it | `fakeClient`: `{ auth: { getSession, getUser } } as unknown as SupabaseClient` |
  | 3 | (not in roadmap) | **A second, unmemoised `getUser()` on the same request.** `_getBasicUserData` calls `getUser()` and then `getSession()` on its own. The protected candidate layout calls `locals.safeGetSession()` and then `getCandidateUserData`, so the request makes **at least 2 `getUser` round trips** | `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` (`protected async _getBasicUserData`) · `apps/frontend/src/routes/candidate/(protected)/+layout.server.ts` |
  | 4 | `BACKEND_API_TOKEN`: the constant and 7 auth test mocks | **Confirmed.** It has no reader and no env-template entry. Two docs pages mention it (Phase 168) | `apps/frontend/src/lib/server/constants.ts` · `__tests__/{authorize,callback,token}-endpoint.test.ts`, `decryptAndVerifyIdToken.test.ts`, `providers/{authorize-fail-closed,idura,signicat}.test.ts` |
  | 5 | (not in roadmap) | 5 of those same tests also mock the backend-URL pair: the 3 endpoint tests, `decryptAndVerifyIdToken.test.ts` and `authorize-fail-closed.test.ts` | `git grep -n -E "PUBLIC_(BROWSER\|SERVER)_BACKEND_URL"` |
  | 6 | Criterion 3: `/api/cache` may still proxy a live backend | **It does not.** The pair's only reader is `/api/cache/+server.ts`. Every data read goes through the Supabase client. The only GETs through `UniversalAdapter.fetch` are the admin job reads (`getActiveJobs`, `getPastJobs`, `getJobProgress`), on **relative** `/api/admin/jobs/…` URLs. `createDataProvider` always builds a `SupabaseDataProvider` | `apps/frontend/src/routes/api/cache/+server.ts` · `lib/api/base/universalDataWriter.ts` · `lib/api/base/universalApiRoutes.ts` (`API_ROOT = '/api'`) · `lib/api/dataProvider.ts` |
  | 7 | (latent defect) | Both URLs are `''` and `startsWith('')` is always true, so the `PUBLIC_BROWSER_FRONTEND_URL` rewrite branch can never run | `+server.ts` (`if (resource.startsWith(publicConstants.PUBLIC_BROWSER_BACKEND_URL))`) |
  | 8 | (latent defect, **UNCONFIRMED by a run**) | With `PUBLIC_CACHE_ENABLED=true`, a relative GET becomes `/api/cache?resource=%2Fapi%2F…`. `new URL(resource)` throws, so the request gets a **400** and admin job polling breaks. Even if it did not throw, cookie-authenticated responses would be cached by URL, because `hasAuthHeaders` checks only `authorization` / `proxy-authorization`. The flag defaults to `false` | `lib/api/utils/cachifyUrl.ts` · `+server.ts` (`new URL(resource)`) · `lib/api/utils/authHeaders.ts` (`AUTH_HEADERS`) · `.env.example` |
  | 9 | Scope of "remove the route" | **The cache feature is bigger than the route.** It also includes: `cachifyUrl` and its test; the `isCacheEnabled` branch and the caching suite in `universalAdapter.test.ts`; `disableCache` (4 files); `PUBLIC_CACHE_ENABLED` (`constants.ts` and 7 mocks); the four private `CACHE_*` constants (7 mocks); the `flat-cache` runtime dependency; the `.env.example` cache block; the root and `apps/frontend` `docker-compose.dev.yml` (`cache:` volume); and `render.example.yaml` (keys and disk). The `flat-cache` rows in `audit-baseline.json` come from ESLint and **stay** | `git grep -n -E "CACHE_(DIR\|TTL\|LRU_SIZE\|EXPIRATION_INTERVAL)\|/var/data/cache\|disableCache\|PUBLIC_CACHE_ENABLED"` · `security/audit-baseline.json` (`"via": "flat-cache@4.0.1, flat-cache@6.1.20"`) |
  | 10 | `universalAdapter.test.ts` tests the route | **It does not.** It tests the adapter's URL rewriting against absolute `http://openvaa.org/api` URLs, and the route itself has no test. `route.test.ts` and `voterAppPath.test.ts` use `'/api/cache'` only as a sample path | `lib/api/base/universalAdapter.test.ts` (`describe('fetch (with caching enabled)'`) · `lib/routes/route.test.ts` · `voterAppPath.test.ts` |
  | 11 | The docs devDependencies, `jsonrepair`, `dotenv`, and `js-yaml` + `@types/js-yaml` in question-info have no importer | **Confirmed.** `dotenv` belongs to `packages/argument-condensation`, and `jsonrepair` is a **runtime** dependency of `packages/llm` | `git grep -l -F <dep> -- <ws> ':!<ws>/package.json'` per entry |
  | 12 | (not in roadmap) | **`packages/llm` imports `js-yaml` without declaring it.** It resolves only through hoisting. `argument-condensation` declares `js-yaml` + `@types/js-yaml` and never imports them (its README is the only mention) | `packages/llm/src/prompts/promptRegistry.ts` (`import * as yaml from 'js-yaml'`) · `packages/{llm,question-info,argument-condensation}/package.json` |
  | 13 | Criterion 4: the frontend's `eslint-plugin-svelte` is unused | **Disproved.** The frontend loads it by name through `compat.extends('plugin:svelte/prettier')`. Removing it breaks lint, or leaves lint working only through hoisting | `apps/frontend/eslint.config.mjs` (`...compat.extends('plugin:svelte/prettier'),`) |
  | 14 | Removing `@testing-library/jest-dom` "ripples into the CI audit gate" | **Disproved.** Its only footprint is the accepted lodash row `GHSA-r5fr-rjxr-66jc` (via `@testing-library/jest-dom@6.6.3`). An accepted id that has left the audit is reported as a **note**, not a failure | `scripts/assert-dependency-audit.mjs` (`const stale = …`, `process.exit(fresh.length > 0 ? 1 : 0)`) · `security/audit-baseline.json` |
  | 15 | `@vitest/coverage-v8` may be an ad-hoc tool | Nothing references it. It is pinned `^3.2.4` **outside the catalog** (the catalog pins `vitest: ^3.2.4`). `assert:unit-coverage` has nothing to do with it | `apps/frontend/package.json` · `.yarnrc.yml` · `scripts/assert-unit-test-coverage.mjs` |
  | 16 | Criterion 9: `yarn audit:deps` passes "with the baseline change" | **It is red before the phase starts.** 7 new high+ advisories sit outside the baseline (the cross-phase summary in the doc counts 9 advisories, so re-derive the count). `--update-baseline` would write them as `REVIEW REQUIRED`, and `auditBaselineShape.test.ts` fails while any such row exists. The baseline `note` hard-codes "These 70 findings" | `scripts/assert-dependency-audit.mjs` (`REVIEW_RATIONALE`) · `packages/dev-seed/tests/auditBaselineShape.test.ts` · VESTIGES § Not a vestige |
  | 17 | Criterion 5: after the logo port, "sweep #14 returns zero" | **The sweep's `$:` count was a false zero.** `-E '^\s*\$:'` matches nothing on this host. `-P` finds **2** files: `OpenVAALogo.svelte` and **`apps/docs/src/lib/components/PeerNavigation.svelte`**, which has `$: peerNav = …` and the repo's last `import { page } from '$app/stores'` | `git grep -n -P '^\s*\$:' -- '*.svelte'` · `git grep -n "\$app/stores" -- apps` |
  | 18 | `OpenVAALogo.svelte` uses `export let` / `$$Props` | Confirmed: 3 `export let`, `type $$Props`, 3 uses. Also: the docstring says the default is `'neutral'` but the code uses `'primary'`, and rest props are **never spread** onto the `<svg>`. `apps/docs` has no `concatClass`. The frontend twin already uses runes | `apps/docs/src/lib/components/openVAALogo/OpenVAALogo.svelte` · `apps/frontend/src/lib/components/openVAALogo/OpenVAALogo.svelte` |
  | 19 | The env-dir todo may be stale | **Stale.** `kit.env.dir` has been `repoRoot` since `2a2cce8ed` (2026-09-23). What remains: (a) the backend-URL pair (settled by D-08), and (b) a `vite.config.ts` comment that still says `loadEnv` runs "over `apps/frontend`". The `svelte.config.js` comment records why widening the private side is safe | `apps/frontend/svelte.config.js` (`env: { dir: repoRoot }`) · `apps/frontend/vite.config.ts` (the comment above `resolveProjectIdEnv`) |
  | 20 | `gate-evidence/` may hold local keys | 65 files (1.6 MB), **untracked and not gitignored**. A secret-pattern scan found 0 matches. A human still has to read it at execution (D-23). Two `260930-kxi` gate-evidence files **are tracked**; they are outside criterion 7 | `.planning/quick/261001-n8y-remove-the-legacy-src-lib-i18n-translati/gate-evidence/` · `git ls-files .planning/quick/ \| grep gate-evidence` |
  | 21 | (Phase 168 surface) | Docs pages describing what this phase removes: `developers-guide/deployment`, `backend/authentication`, `frontend/environmental-variables`, `frontend/data-api`, `frontend/accessing-data-and-state-management` | `git grep` of each name under `apps/docs` |

### A — Scope boundary

- **D-02 (167-A1, ⚠ DECIDE):** The writer's second `getUser()` (fact 3) is **out of scope**. File it as a
  standing todo under `.planning/todos/pending/` and name it in the phase summary. Making
  `_getBasicUserData` reuse the identity `locals.safeGetSession` has verified is an auth-path change across the
  adapter boundary, and the adapter-selection todo is redesigning that boundary. It needs its own controls and an
  E2E walk. No request-level test pins today's count of 2.
  — **Reversibility:** cheap. The todo is the hand-off, and nothing in this phase builds on the double call.
- **D-03 (167-A2):** Port **`apps/docs/src/lib/components/PeerNavigation.svelte`** to runes alongside the logo:
  `$: peerNav = getPeerNavigation($page.url)` becomes `$derived`, and `import { page } from '$app/stores'`
  becomes `import { page } from '$app/state'` (read as `page.url`). Criterion 5's "sweep #14 returns zero" then
  holds under the corrected measurement (D-04).
- **D-04 (167-A3):** At verification, sweep #14 is measured by re-running **all ten** #14 patterns with
  **`git grep -n -P`**, plus a `\$app/stores` pattern. Record each command and count in the summary. Do not use
  the VESTIGES `-E` form, which returned a false zero on this host.
- **D-05 (167-A4):** The phase also removes the two unused entries the roadmap list omits, with the same
  verification as the listed entries: (1) `js-yaml` + `@types/js-yaml` from `packages/argument-condensation`,
  and (2) `@typescript-eslint/eslint-plugin` from `apps/frontend` (its config never imports it, and
  `shared-config` imports it itself). The ESLint removal gets D-16's lint-red check.

### B — The `safeGetSession` test (criterion 1)

- **D-06 (167-B1, ⚠ DECIDE):** **Cite `apps/frontend/src/lib/supabase/safeGetSession.test.ts` as criterion 1's
  test and strengthen it in place.** There is no second test file. Three steps: (1) assert the exact
  `getSession` count in **every** case, not only the first; (2) make `fakeClient` return a `Proxy` that throws a
  **named error** when anything other than `auth.getSession` / `auth.getUser` is accessed, so "no DB round trip"
  becomes an explicit assertion (fact 2); (3) run the D-08 negative controls.
- **D-07 (167-B2):** "Round trip" means **any call on the client**. Pin both `getUser` and `getSession` exactly
  with `toHaveBeenCalledTimes(n)`, never `toHaveBeenCalled()`, and pin **zero** calls on any other member (via
  the D-06 Proxy). Reason: `getUser` is always a network call, and auth-js's `getSession` refreshes (another
  network call) when the token is inside the expiry margin.
- **D-08 (167-B3):** The negative controls use **two temporary working-copy variants of
  `apps/frontend/src/lib/supabase/safeGetSession.ts`, never committed**.
  - **V1, no memo:** `verify()` always calls `verifyStored`. Expected: "verifies a token once", "shares one
    verification between concurrent calls" and the refresh case go red on the `getUser` count.
  - **V2, extra read:** `verifyStored` calls `getSession()` one more time. Expected: the new `getSession` counts
    from D-06(1) go red while the `getUser` counts stay green. This shows the new assertions catch something the
    old ones did not.

  For each run, record the command, exit code and failing test names in the summary. Then confirm the suite is
  green and that `git diff --exit-code -- apps/frontend/src/lib/supabase/safeGetSession.ts` is clean. No
  committed `vi.mock` harness.

### C — The backend-URL pair and `/api/cache` (criteria 2–3)

- **D-09 (167-C1, ⚠ DECIDE):** **Remove the whole cache proxy**: the route, the pair and every item in fact 9.
  Concretely:
  - `apps/frontend/src/routes/api/cache/+server.ts`;
  - `lib/api/utils/cachifyUrl.ts` and its test;
  - the `isCacheEnabled` branch in `UniversalAdapter.fetch` and the `fetch (with caching enabled)` suite in
    `universalAdapter.test.ts`;
  - the `disableCache` option (4 files);
  - `PUBLIC_CACHE_ENABLED`, `PUBLIC_BROWSER_BACKEND_URL` and `PUBLIC_SERVER_BACKEND_URL` (in `constants.ts`
    and every test mock);
  - the four private `CACHE_*` constants (`CACHE_DIR`, `CACHE_TTL`, `CACHE_LRU_SIZE`,
    `CACHE_EXPIRATION_INTERVAL`) and their mocks;
  - the `flat-cache` entry in `apps/frontend/package.json`;
  - the `.env.example` cache block;
  - the `cache:` volume in the root and `apps/frontend` `docker-compose.dev.yml`;
  - the cache keys and the `/var/data/cache` disk in `render.example.yaml`.

  `BACKEND_API_TOKEN` (criterion 2) goes in the same change. The `flat-cache` rows in
  `security/audit-baseline.json` **stay**, because ESLint pulls `flat-cache` in. This is the phase's largest
  diff (about 15 files, including two deployment templates), and Phase 168 must describe the result.
  Criterion 3's first branch ("still proxies a live backend") is answered **no** by fact 6.
  — **Reversibility:** moderate. The removal is one revertable commit (D-24 ②). Any future cache for
  static-data deployments is to be designed with the local adapter (D-10), not restored from here.
- **D-10 (167-C2):** Add a **dated note** to both `.planning/todos/pending/2026-08-28-reintroduce-the-local-data-adapter.md`
  and `.planning/todos/pending/2026-09-27-adapter-selection-entrypoints.md`, and **keep both open**. The note
  says the cache proxy was removed in Phase 167, and that any cache for static-data deployments should be
  designed with the local adapter. Neither todo is discharged.
- **D-11 (167-C3):** In `apps/frontend/src/lib/routes/route.test.ts` and `voterAppPath.test.ts`, replace the
  sample path `'/api/cache'` with a live API path such as `'/api/auth/logout'`. Tests should not name a route
  that no longer exists, and a later `api/cache` sweep should not hit them.

### D — Dependencies (criterion 4)

- **D-12 (167-D1, ★ OVERRULED by the operator's tick):** Criterion 4 lists the frontend's
  `eslint-plugin-svelte` for removal, but it is used (fact 13). It **stays**, and the frontend config
  **switches to an explicit import, as `apps/docs/eslint.config.js` does**:
  - add `import svelte from 'eslint-plugin-svelte'`;
  - replace `...compat.extends('plugin:svelte/prettier')` in `apps/frontend/eslint.config.mjs`'s default
    export with `...svelte.configs.prettier`.

  A grep can then find the usage. **The cost the operator accepted:** a before/after **lint-output
  comparison** that proves the effective result did not change. Run `yarn workspace @openvaa/frontend lint`
  (and `yarn lint:check`) before and after the edit, read exit codes directly (never through a pipe), and diff
  the reported findings. Optionally also diff `eslint --print-config` on a representative `.svelte` and `.ts`
  file. Record the commands and the empty diff in the summary. Take the entry off criterion 4's removal list
  and record why: it is used, and now visibly so.
  **Knock-on that the discussion did not decide.** After the switch, the frontend config's `FlatCompat`
  instance has no remaining use. That orphans `import { FlatCompat } from '@eslint/eslintrc'`, the
  `import js from '@eslint/js'` that only feeds it, and the `path` / `fileURLToPath` / `__dirname` setup. Delete
  the dead code in the config edit. Whether the `@eslint/eslintrc` (and possibly `@eslint/js`) manifest entries
  then go in this phase is not decided. Under D-05's reasoning (same class of leftover, same sweep) they would
  go, with D-16's lint-red check. The planner states which way it goes, and anything left becomes a residue
  todo (D-28).
  — **Reversibility:** cheap. It is a one-line config change inside the D-24 ④ commit (or its own commit if
  the planner prefers, since it is a config edit, not a removal).
- **D-13 (167-D2, ⚠ DECIDE):** **Move `js-yaml` to the package that imports it.**
  - Add `js-yaml` (`catalog:`) to `packages/llm/package.json` `dependencies` and `@types/js-yaml` to its
    `devDependencies`.
  - Remove both from `packages/question-info`, and from `packages/argument-condensation` (D-05).

  This is a **correctness fix** rather than a removal: the packages are headed for npm publishing, and an
  undeclared import fails for consumers. Verify with `yarn workspace @openvaa/llm build` and the llm unit
  tests. It gets its own `fix[deps]` commit (D-24 ③).
- **D-14 (167-D3):** Remove **all six** docs-app ESLint duplicates from `apps/docs/package.json`: `@eslint/js`,
  `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint-plugin-simple-import-sort`, `globals`
  and `typescript-eslint`. Then run `yarn workspace @openvaa/docs lint` and `yarn lint:check`, and do the
  **lint-red check** described in D-16.
- **D-15 (167-D4):** Remove the docs app's other unused devDependencies: `@eslint/compat`, `@tailwindcss/forms`,
  `rehype-autolink-headings`, `unist-util-visit` and `vitest-browser-svelte`. **`typedoc-plugin-markdown` is
  kept** for Phase 168's typedoc decision (criterion 6 of 168;
  `.planning/todos/pending/2026-08-28-broken-docs-script-references.md`).
- **D-16 (lint-red check, from 167-D3 and 167-A4):** For the docs app, add a deliberate `simple-import-sort`
  violation and a `@typescript-eslint/no-explicit-any` hit to a docs file. Confirm lint **fails and names both
  rules**, then revert. Do the same for the frontend after removing `@typescript-eslint/eslint-plugin` (D-05),
  and for any frontend ESLint manifest entry removed under D-12's knock-on. A green lint alone could mean the
  rules were dropped, and a config that fails to load can look like a clean one. Read exit statuses directly.
- **D-17 (167-D5):** **Remove `@vitest/coverage-v8`** from `apps/frontend/package.json`. Nothing references it,
  and its pin sits outside the catalog, so it would drift from Phase 169's vitest bump. Anyone who wants local
  coverage can run `vitest --coverage`, which names the missing provider. Record the reason in the summary.
- **D-18 (167-D6):** **Remove `jsonrepair`** (a runtime dependency of `packages/llm`) and **`dotenv`** (a
  devDependency of `packages/argument-condensation`). Neither has an importer or a script. The root `dotenv`
  (used by `tests/playwright.config.ts` and `tests/seed-test-data.ts`) is not touched.
- **D-19 (removal of `@testing-library/jest-dom`, criterion 4):** Remove it from `apps/frontend` as the roadmap
  lists. Its audit footprint is handled by D-20. (The discussion doc gave this entry no option of its own. It is
  restated here because criterion 4 names it and D-20 depends on it.)
- **D-20 (167-D7):** **Hand-edit `security/audit-baseline.json`** in the **same commit** as the dependency
  removal:
  1. After the removal, run `yarn audit:deps` and confirm `GHSA-r5fr-rjxr-66jc` is listed under "no longer
     appear".
  2. If it is, delete the lodash row whose only `via` is `@testing-library/jest-dom`. If lodash is still
     reachable another way, the row stays.
  3. Update the `note`'s "70 findings" count to match.

  **Never run `--update-baseline`.** It would add the unrelated pre-existing advisories as `REVIEW REQUIRED`
  rows and turn `packages/dev-seed/tests/auditBaselineShape.test.ts` red (fact 16).

### E — Svelte 5 port, the env-dir todo, `gate-evidence/`

- **D-21 (167-E1):** Port `apps/docs/src/lib/components/openVAALogo/OpenVAALogo.svelte` to `$props()` with
  `...restProps` and `$derived.by`, and **spread `restProps` onto the `<svg>`**. Keep the **`'primary'`** default
  and fix the docstring to say `'primary'`. Merge `class` inline: there is no `concatClass` in `apps/docs`, and
  no util is added. Both call sites (`Header.svelte`, `Footer.svelte`) pass only `color` / `size`, so nothing
  they render changes. No `export let` and no `$$Props` remain.
- **D-22 (167-E2):** **Close** `.planning/todos/pending/2026-08-28-vite-envdir-root-would-fix-six-empty-constants.md`.
  Move it to `done/` with a resolution note covering three points: `env.dir` was set to `repoRoot` in
  `2a2cce8ed`; the backend pair is resolved by D-09; and the private-side widening is accepted, citing the
  `svelte.config.js` comment ("`$env/*/public` exposes only `PUBLIC_`-prefixed keys"). Also **fix the stale
  `vite.config.ts` comment** above `resolveProjectIdEnv`. Under Comment Hygiene, the new comment says what loads
  what today and says nothing about how it changed.
- **D-23 (167-E3, with its NOTE):** Handle
  `.planning/quick/261001-n8y-remove-the-legacy-src-lib-i18n-translati/gate-evidence/` at execution, in this
  order:
  1. Re-run the secret-pattern scan.
  2. Read the files most likely to hold env values: `g-db-status.log`, `t3-yarn-install.log` and
     `sweep/env-*.txt`.
  3. Record the result in the summary **as categories only, never values**.
  4. `rm -rf` the directory and confirm `git status --porcelain` shows nothing for that path.
  5. Add one line to `261001-n8y-VESTIGES.md` and one to `261001-n8y-SUMMARY.md` saying the evidence directory
     they cite was deleted, and in which phase.

  **No `.gitignore` rule is added.** **NOTE (operator, binding):** the two **tracked** `260930-kxi`
  gate-evidence files are outside criterion 7. Leave them alone. They leave this phase as residue (D-28).

### F — Commits, gates, plan shape

- **D-24 (167-F1):** Make **six code commits, each revertable on its own**:
  - ① `test[frontend]`: the strengthened `safeGetSession` counts (D-06–D-08).
  - ② `refactor[frontend]`: remove the cache proxy, the backend-URL pair and `BACKEND_API_TOKEN`, including
    the env and deployment templates (D-09, D-11). These are all env plumbing in the same 7 mocks.
  - ③ `fix[deps]`: declare `js-yaml` in `@openvaa/llm` (D-13).
  - ④ `chore[deps]`: the unused-dependency removals, the baseline row and `yarn.lock` (D-05, D-14, D-15, D-17,
    D-18, D-19, D-20, and D-12's manifest knock-on if it is taken).
  - ⑤ `refactor[docs]`: port `OpenVAALogo` and `PeerNavigation` to runes (D-03, D-21).
  - ⑥ `docs[frontend]`: correct the `vite.config.ts` env comment (D-22).

  `.planning` commits are separate and use `git commit --no-verify` (main-repo hook note; check afterwards that
  the blob is non-empty).
- **D-25 (167-F2, ⚠ DECIDE):** **The `audit:deps` gate is "this phase adds no advisory".** Compare the set of
  high+ GHSA ids **before** and **after** the phase, using the method VESTIGES used for
  `t3-audit-deps-base.log` against `t3-audit-deps.log`. The gate is green when the two sets match or the after
  set is smaller. Getting `yarn audit:deps` itself to exit 0 is **Phase 169's** job. Record both sets in the
  summary, because the after set is Phase 169's starting point. This replaces criterion 9's
  "`yarn audit:deps` (with the baseline change)" wording.
- **D-26 (167-F3):** The full gate set:
  - typecheck;
  - `yarn lint:check`;
  - `yarn format:check`;
  - `yarn test:unit` across the repo;
  - `yarn build` for **both** frontend **and** docs;
  - docs `svelte-check`;
  - then the full E2E suite once under the cardinal rule: `db:reset`, one fresh dev server on :5173, and "did
    not run" counts as a failure.

  D-09 edits `UniversalAdapter.fetch`, which the admin job reads and the auth endpoints use, so the E2E run is
  required.
- **D-27 (167-F4):** **Full reconciliation at close:**
  - move the env-dir todo to `done/` (D-22);
  - add the notes to the two adapter todos (D-10);
  - file the D-02 todo, and any D-05 / D-12 residue, as **todos**, not prose;
  - mark each deferred row that VESTIGES lists as `fixed`, with a commit hash, without rewriting the rest of
    VESTIGES;
  - check every touched comment against Comment Hygiene by reading it, **and** run
    `hygiene-grep-report.sh --assert-clean`.
- **D-28 (167-F5, ⚠ DECIDE):** **Three sequential plans, all autonomous:**
  - **167-01:** `safeGetSession` (D-06–D-08; commit ①).
  - **167-02:** env plumbing, dependencies, the runes ports and the comment (D-03, D-05, D-09–D-22; commits
    ②–⑥).
  - **167-03:** gates (D-25, D-26), `gate-evidence` (D-23) and reconciliation (D-27).

  There is no checkpoint: D-02 keeps auth paths unchanged.
  **Residue that leaves the phase as todos:** the writer's second `getUser()` (D-02); the two tracked
  `260930-kxi` gate-evidence files (D-23 NOTE); and any D-12 manifest knock-on that is not taken here.

*Note on D-entry numbering:* D-19 states the `@testing-library/jest-dom` removal, which criterion 4 names but
the doc gave no option of its own. The 26 discussion decisions (0.1, A1–A4, B1–B3, C1–C3, D1–D7, E1–E3, F1–F5)
map to D-01–D-18 and D-20–D-28. D-16 restates the shared lint-red check from 167-D3 / 167-A4 so plans can cite
it once.

### Claude's Discretion

The discussion doc leaves these to the planner:

- The live API path that replaces `'/api/cache'` in D-11. `'/api/auth/logout'` is the doc's example ("such
  as"), not a requirement.
- Which docs file receives the temporary lint-red violations (D-16). They are always reverted.
- How the D-12 before/after lint comparison is captured: findings diff alone, or plus `--print-config` diffs.
  It must show nothing changed and read exit codes, not piped output.
- Whether D-12's orphaned `@eslint/eslintrc` / `@eslint/js` manifest entries are removed in this phase or filed
  as residue. The doc did not anticipate this. State the choice in the plan.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The phase's own contract
- `.planning/ROADMAP.md` § *Phase 167: Origin/main Vestige Cleanup*: the nine draft success criteria. Where the
  decisions above contradict them (criteria 1, 3, 4, 5, 9), the decisions win.
- `.planning/v2.15-166-169-DISCUSSION-POINTS.md` § *Phase 167* and § *Cross-phase picture*: the 26 decisions
  in full, with rejected options and their costs.
- `.planning/quick/261001-n8y-remove-the-legacy-src-lib-i18n-translati/261001-n8y-VESTIGES.md`: the source
  sweep, with the deferred rows this phase marks `fixed`, the #14 sweep patterns, and § Not a vestige (the
  pre-existing advisory set).
- `.planning/quick/261001-n8y-remove-the-legacy-src-lib-i18n-translati/261001-n8y-SUMMARY.md`: gets the
  gate-evidence deletion line (D-23).
- `.planning/REQUIREMENTS.md` § *Standing acceptance rule*: prove the guard fails before claiming it guards.
  This governs D-08 and D-16.

### Todos the phase touches
- `.planning/todos/pending/2026-08-28-vite-envdir-root-would-fix-six-empty-constants.md`: closed (D-22).
- `.planning/todos/pending/2026-08-28-reintroduce-the-local-data-adapter.md`: gets a note and stays open (D-10).
- `.planning/todos/pending/2026-09-27-adapter-selection-entrypoints.md`: gets a note and stays open (D-10).
- `.planning/todos/pending/2026-08-28-broken-docs-script-references.md`: the reason `typedoc-plugin-markdown`
  stays (D-15). Owned by Phase 168.

### Standing project rules that bind this phase
- `CLAUDE.md` § *Comment Hygiene*, and `scripts/assert-comment-hygiene.mjs` /
  `.claude/skills/ship-review-stack/sources/hygiene-grep-report.sh` (D-22, D-27).
- `CLAUDE.md` § *E2E Hard Rule (cardinal failure)*: governs D-26.
- `.agents/code-review-checklist.md`: checked before any plan is called done.
- Memory rules: content anchors, never line numbers; never read a gate's status through a pipe; `.planning`
  commits in this repo use `--no-verify`; E2E needs one fresh dev server on :5173 plus `db:reset`.

### Production files the decisions name
- `apps/frontend/src/lib/supabase/safeGetSession.ts` and `safeGetSession.test.ts` (D-06–D-08).
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` (`_getBasicUserData`): read
  only. It is the D-02 todo's subject.
- `apps/frontend/src/routes/api/cache/+server.ts`, `src/lib/api/utils/cachifyUrl.ts`,
  `src/lib/api/utils/authHeaders.ts`, `src/lib/api/base/universalAdapter.ts` and `universalAdapter.test.ts`,
  `src/lib/server/constants.ts`, the public constants module, the 7 auth tests listed in fact 4,
  `.env.example`, `docker-compose.dev.yml` (root and `apps/frontend`), `render.example.yaml` (D-09).
- `apps/frontend/src/lib/routes/route.test.ts`, `voterAppPath.test.ts` (D-11).
- `apps/frontend/eslint.config.mjs` and `apps/docs/eslint.config.js` (the pattern to copy:
  `import svelte from 'eslint-plugin-svelte'` and `...svelte.configs.prettier`) (D-12).
- `packages/llm/package.json`, `packages/llm/src/prompts/promptRegistry.ts`, and
  `packages/{question-info,argument-condensation}/package.json` (D-05, D-13, D-18).
- `apps/docs/package.json` and `apps/frontend/package.json` (D-14, D-15, D-17, D-19).
- `security/audit-baseline.json`, `scripts/assert-dependency-audit.mjs`,
  `packages/dev-seed/tests/auditBaselineShape.test.ts` (D-20, D-25).
- `apps/docs/src/lib/components/openVAALogo/OpenVAALogo.svelte` (and its frontend twin as the runes reference),
  `apps/docs/src/lib/components/PeerNavigation.svelte` (D-03, D-21).
- `apps/frontend/svelte.config.js` (`env: { dir: repoRoot }`) and `apps/frontend/vite.config.ts` (the comment
  above `resolveProjectIdEnv`) (D-22).

</canonical_refs>

<code_context>
## Existing Code Insights

The figures come from the discussion doc's scout at `89a4bd9ff` on `fix/888-review-findings`. This worktree's
HEAD at writing is `e65bed5cf`. **Re-derive every population at run time, and plan against the tip after Phase
166 lands.**

### Reusable Assets
- **`fakeClient` in `safeGetSession.test.ts`.** D-06 wraps it in a `Proxy` rather than writing a second
  fixture.
- **`apps/docs/eslint.config.js`** already has the explicit-import shape D-12 copies
  (`export default [prettier, ...svelte.configs.prettier, ...sharedConfig]`).
- **The frontend `OpenVAALogo.svelte`** is a finished runes version (`$props()` with `...restProps`,
  `$derived.by`) to model D-21 on, minus `concatClass`.
- **VESTIGES' `t3-audit-deps-base.log` / `t3-audit-deps.log` comparison** is the method for D-25.

### Established Patterns
- **The audit gate's stale-row handling:** an accepted id that has left the audit is a note, not a failure
  (`assert-dependency-audit.mjs`). This is why D-20 is about tidiness and does not keep CI green.
- **`--update-baseline` writes `REVIEW REQUIRED` rows** for unexplained advisories, and the dev-seed shape test
  rejects them. This is why D-20 is a hand edit.
- **Negative-control records:** command, exit code and failing test names, recorded verbatim in the summary
  (D-08, D-16).

### Integration Points
- **`UniversalAdapter.fetch`** is used by the admin job reads (relative `/api/admin/jobs/…`) and the auth
  endpoints. D-09's edit to its cache branch is why D-26 includes full E2E.
- **`apps/frontend/eslint.config.mjs`'s `FlatCompat` block** is only there to serve
  `compat.extends('plugin:svelte/prettier')`. D-12 removes that use, and the knock-on is described in D-12.
- **Phase 166 overlap: none expected.** 166 does not touch the 7 auth-test mocks, `constants.ts` or the cache
  route. Still re-check at the post-166 tip.

### Known hazard: not work for this phase
- **Fact 8 is UNCONFIRMED.** The 400 on relative URLs with `PUBLIC_CACHE_ENABLED=true` was derived by reading
  only. D-09 removes the path either way, so it is not reproduced. Do not cite it as observed.

</code_context>

<specifics>
## Specific Ideas

- **The operator's one overrule (167-D1 → (b)), verbatim from the doc:** "Keep it and switch to an explicit
  `import svelte from 'eslint-plugin-svelte'`, as `apps/docs` does, so a grep can find the usage. Cost: a
  lint-config edit that needs a before/after lint-output comparison to show nothing changed."
- **The NOTE under 167-E3, verbatim:** "the two tracked `260930-kxi` gate-evidence files are not part of
  criterion 7. Leave them alone unless you write an `**EDIT:**` here." No EDIT was written.
- The gate-evidence record is **categories only, no values**, and the same applies to anything quoted from
  those files in any planning artefact.

</specifics>

<deferred>
## Deferred Ideas

- **The writer's second `getUser()`** in `_getBasicUserData` (fact 3). Filed as a standing todo (D-02). It
  belongs with the adapter-selection redesign and needs its own controls and E2E walk.
- **A cache layer for static-data deployments.** If one is ever wanted, design it with the local adapter
  (recorded in the two adapter todos, D-10). The removed `/api/cache` is not the starting point.
- **Getting `yarn audit:deps` to exit 0.** Phase 169 (D-25).
- **`typedoc-plugin-markdown`.** Kept, and Phase 168 decides it (D-15).
- **The two tracked `260930-kxi` gate-evidence files.** Untouched residue (D-23 NOTE).

## Cross-phase notes

- **Execution is serial: 166 → 167 → 168 → 169.** 167 runs after 166 and plans against the post-166 tip.
  Planning may happen in parallel, but commit shared `.planning` docs before spawning parallel planners.
- **What Phase 168 depends on from 167:**
  - **D-09 (167-C1)** means the docs drop the cache proxy entirely: `PUBLIC_CACHE_ENABLED`, `CACHE_*`,
    `/api/cache` and `flat-cache` in `frontend/data-api` and `frontend/accessing-data-and-state-management`,
    and `deployment` including its Render disk step. They also drop `BACKEND_API_TOKEN` and
    `PUBLIC_*_BACKEND_URL` in `deployment`, `backend/authentication` and `frontend/environmental-variables`.
  - The env pages describe a single repo-root `.env` that both public and private variables come from (D-22).
  - 168 treats 167's `OpenVAALogo` / `PeerNavigation` runes ports as its base, not as work to redo.
  - The code-style-guide page's `$$restProps` / `concatClass` example is Svelte 4 prose for 168 to rewrite.
  - **typedoc tension, flagged for 168's planner.** 168-D2 took its ★ (a): repair the scripts and delete the
    typedoc scripts. Its text assumes "Phase 167 may remove [`typedoc`] with `typedoc-plugin-markdown`". But
    167-D4 (D-15) **keeps** `typedoc-plugin-markdown` so as not to pre-empt 168, and does not remove `typedoc`.
    Since 167 runs first, removing **`typedoc` and `typedoc-plugin-markdown`** falls to Phase 168's tooling plan
    once its D2(a) work lands (or to Phase 169's no-consumer sweep). 167 does not remove them.
- **What Phase 169 depends on from 167:**
  - **D-25 (167-F2):** the after-phase high+ GHSA set is 169's starting point. The gate is still red when 167
    closes, and 169-F1 handles the baseline going empty.
  - **D-20:** the baseline `note` count was hand-edited, so 169's `--update-baseline` must recheck the prose
    count.
  - **D-13:** `js-yaml` is declared in `@openvaa/llm`, where it is imported.
  - **D-17:** `@vitest/coverage-v8` is gone, so vitest moves alone.
  - **D-14, D-15, D-17, D-18, D-19:** a smaller dependency set. `@testing-library/jest-dom`, `@eslint/compat`
    and `vitest-browser-svelte` are 3 of the majors 169 no longer bumps, and `@vitest/coverage-v8` is a fourth.
  - 169's auth gate re-runs the strengthened `safeGetSession` round-trip test (D-06).

</deferred>

---

*Phase: 167-Origin/main Vestige Cleanup*
*Context gathered: 2026-10-01*
