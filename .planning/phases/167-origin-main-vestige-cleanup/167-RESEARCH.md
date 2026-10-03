# Phase 167: Origin/main Vestige Cleanup - Research

**Researched:** 2026-10-01
**Domain:** Repo hygiene. Covers test strengthening with negative controls, removal of a dead server route and its env plumbing, dependency-manifest correction, an ESLint flat-config switch, a Svelte 4 → 5 runes port, and planning-state reconciliation.
**Confidence:** HIGH (every in-repo claim was measured at HEAD `ec0cd7810` on `fix/888-review-findings`; the few inferences are tagged)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

*Copied verbatim from `167-CONTEXT.md` § `<decisions>`, including § Claude's Discretion.*


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

### Deferred Ideas (OUT OF SCOPE)

*Copied verbatim from `167-CONTEXT.md` § Deferred Ideas.*

- **The writer's second `getUser()`** in `_getBasicUserData` (fact 3). Filed as a standing todo (D-02). It
  belongs with the adapter-selection redesign and needs its own controls and E2E walk.
- **A cache layer for static-data deployments.** If one is ever wanted, design it with the local adapter
  (recorded in the two adapter todos, D-10). The removed `/api/cache` is not the starting point.
- **Getting `yarn audit:deps` to exit 0.** Phase 169 (D-25).
- **`typedoc-plugin-markdown`.** Kept, and Phase 168 decides it (D-15).
- **The two tracked `260930-kxi` gate-evidence files.** Untouched residue (D-23 NOTE).

</user_constraints>

<phase_requirements>
## Phase Requirements

The roadmap says "Requirements: TBD — registered at planning". Proposed IDs follow, one per roadmap success criterion, as amended by the locked decisions. The prefix `VEST` is new. When registering them in `.planning/REQUIREMENTS.md` § Traceability, **recount the counters from the table rows, do not increment them.** The command of record in that file is
`awk '/^## Traceability$/{f=1;next} /^### Phase → requirement rollup$/{f=0} f && /^\| / && !/^\| Requirement \|/ && !/^\|[-: |]*\|$/' .planning/REQUIREMENTS.md | wc -l`. It gives 110 today and should give 119 after registration. Also update the rollup `Total`, the coverage line, and ROADMAP § Phase 167 `**Requirements**:` in the **same** commit.

| ID | Description (proposed wording) | Decisions | Research support |
|----|-------------------------------|-----------|------------------|
| VEST-01 | `safeGetSession.test.ts` pins the exact `getUser` **and** `getSession` count in every case and fails, with a named error, on any other client member access. The strengthened assertions were observed failing against the V1 (no memo) and V2 (extra read) working-copy variants, and the shipped source is unchanged | D-06, D-07, D-08 | § Pattern 1, the verified count table, the V1/V2 replacement texts |
| VEST-02 | `BACKEND_API_TOKEN` is gone from `constants.ts` and all 7 auth test mocks | D-09 (② commit) | § Cache-proxy removal inventory |
| VEST-03 | The `/api/cache` proxy, `PUBLIC_BROWSER_BACKEND_URL` / `PUBLIC_SERVER_BACKEND_URL`, `PUBLIC_CACHE_ENABLED`, the four `CACHE_*` constants, `disableCache`, `flat-cache` and the env/deployment-template cache entries are removed. Test sample paths no longer name `/api/cache`. Both adapter todos carry the dated note | D-09, D-10, D-11 | § Cache-proxy removal inventory (includes **6 surfaces fact 9 missed**) |
| VEST-04 | No workspace declares a dependency it does not use, and `@openvaa/llm` declares the `js-yaml` it imports. `eslint-plugin-svelte` is kept and imported explicitly, and the lint output is unchanged before and after. The `security/audit-baseline.json` lodash row and note count are hand-edited in the same commit as the `@testing-library/jest-dom` removal | D-05, D-12–D-20 | § D-12 config switch (**the literal `svelte.configs.prettier` crashes on the installed v2.46.1**), § Lint-red protocol (**docs ESLint cannot load at HEAD**), § js-yaml move |
| VEST-05 | `apps/docs` `OpenVAALogo.svelte` and `PeerNavigation.svelte` use runes. All ten sweep-#14 patterns plus `$app/stores`, run with `git grep -P`, return 0 | D-03, D-04, D-21 | § Runes ports (**the literal `fill-*` class strings must survive**), § Sweep #14 commands |
| VEST-06 | The env-dir todo is closed to `done/` with its resolution note, and the `vite.config.ts` comment describes today's loading | D-22 | § env-dir todo |
| VEST-07 | `gate-evidence/` was inspected (categories only, no values), deleted and confirmed absent, and VESTIGES/SUMMARY each record the deletion | D-23 | § gate-evidence |
| VEST-08 | Reconciliation: the D-02 and residue todos are filed, the VESTIGES deferred rows are marked `fixed` with hashes, and every touched comment is read against Comment Hygiene with **no new** hygiene-report hits | D-02, D-10, D-27, D-28 | § Hygiene gate (**`--assert-clean` is red at HEAD**) |
| VEST-09 | Gates: typecheck, `lint:check`, `format:check`, `test:unit`, `yarn build` (frontend + docs), docs `svelte-check`, the audit "no new advisory" set comparison, and one full E2E run under the cardinal rule | D-25, D-26 | § Validation Architecture, § Audit comparison method |
</phase_requirements>

## Summary

The 21-fact baseline holds at HEAD `ec0cd7810` with two count corrections. **Fact 9:** `PUBLIC_CACHE_ENABLED` is mocked in **8** test files, not 7. The extra ones are `supabaseFeedbackWriter.test.ts` and `supabaseAdapter.test.ts`, and `universalAdapter.test.ts` is the eighth. **Fact 16:** `yarn audit:deps` now reports **9** NEW high+ advisory ids. The "7 vs 9" difference is **advisory-database drift, not a tree change**. Re-auditing the VESTIGES base lockfile (`72b336729`) today also returns 9; the two extra ids are the `devalue` advisories `GHSA-j22f-vq7h-c4qm` and `GHSA-mcm9-63f2-9j32`, published between the VESTIGES run and now. The package list in VESTIGES § "Not a vestige" (`@vitest/browser`, `vitest`, `tar`, …) does **not** match its own logs. Those logs list only `brace-expansion` and `undici`.

Research also found **four planning-blocking facts** that the discussion did not have:

1. **D-12's literal edit crashes.** The frontend resolves `eslint-plugin-svelte` **2.46.1**, the catalog `^2.46.1`. In v2, `svelte.configs.prettier` is a *legacy eslintrc object*, so `...svelte.configs.prettier` fails at config load with `TypeError: svelte.configs.prettier is not iterable`. That error was observed and the exit code was 2. The v2 flat export is `svelte.configs['flat/prettier']`. With it, the full frontend lint findings are byte-identical (854 files, 0 errors, 1 warning, both ways). `--print-config` is identical for `.ts` files and, for `.svelte` files, differs only in how the *same* processor object is serialised. `apps/docs` gets away with `svelte.configs.prettier` because it resolves v3.13.1, where that name *is* the flat config.
2. **The docs app cannot be linted the way D-14/D-16 assume.** `apps/docs` has no `lint` script, so `yarn workspace @openvaa/docs lint` does not exist and `turbo run lint` (inside `yarn lint:check`) never lints docs. Its `eslint.config.js` also **fails to load** with `ERR_INTERNAL_ASSERTION`, on both Node 22.22.1 (CI's version) and 24.14.1. The trigger is the static `eslint-config-prettier` import alongside `@openvaa/shared-config/eslint`. This is the pre-existing REVIEW-CFG-08 defect. A non-committed probe config, which loads `eslint-config-prettier` through `createRequire`, loads cleanly, and the lint-red injection then fails naming **both** rules (observed). The docs lint-red check must run through that probe.
3. **`hygiene-grep-report.sh --assert-clean` is red at HEAD.** 7 rows fail, with 316 planning references across 147 files. D-27 must therefore gate on **delta ≤ 0**: `--save-baseline` at phase start, then compare. Absolute `--assert-clean` cannot pass. `node scripts/assert-comment-hygiene.mjs` (in `lint:check`) is green.
4. **The cache feature reaches six surfaces that fact 9 does not list.** They are `UNIVERSAL_API_ROUTES.cacheProxy`; `authHeaders.ts` / `hasAuthHeaders` and its test, whose only reader is the cache branch; `apps/frontend/src/routes/README.md`; `CLAUDE.md` § Deployment ("and the cache disk"); three `+layout.server.ts` docblocks that cite "`render.example.yaml` provisions a cache disk"; and the `universalAdapter.ts` docstrings that describe caching.

**Primary recommendation:** Plan the three plans exactly as D-28 states. Use `svelte.configs['flat/prettier']` (not `.prettier`) in the frontend. Run the docs lint-red check through a `createRequire` probe config. Gate comment hygiene and `audit:deps` as before/after deltas, measured with the exported-tree audit method so advisory-DB drift cannot fake a regression. Treat the extra cache surfaces as part of commit ②.

## Project Constraints (from CLAUDE.md)

- **Comment Hygiene** (`CLAUDE.md` § Comment Hygiene): every added or changed comment under `apps/`, `packages/`, `tests/` must have no historical narrative ("used to", "was changed", "previously"), no planning references beyond bare `see phase N`, nothing addressed to the reviewer, and be concise. **A touched comment is judged as a whole.** Editing one parenthetical in a docblock that already says "This load used to return …" obliges rewriting that narrative too (relevant to the three layout docblocks).
- **E2E Hard Rule (cardinal failure):** no task completes while any E2E test fails, there are no flaky exemptions, and "did not run" counts as a failure.
- **E2E preflight:** the served app must prove it is this checkout and this project. Use `tests/scripts/e2e-run.sh`, which owns its dev server.
- **TypeScript strictly:** avoid `any`. The deliberate `any` in the D-16 probe is temporary and always reverted.
- **Never commit sensitive data.** D-23's gate-evidence record is categories only.
- **Code review checklist:** `.agents/code-review-checklist.md` before any plan is called done.
- **Docker Compose** (`docker-compose.dev.yml`) is for production build testing only. `render.example.yaml` is the reference deployment, and `CLAUDE.md` § Deployment describes it (and must be updated by commit ②).
- Memory rules binding execution: content anchors, never line numbers; **never read a gate's status through a pipe** (`cmd > log 2>&1; status=$?`); a red early link in the `lint:check` `&&` chain hides later guards; `format:check` is separate from `lint:check`; `.planning` commits in this worktree use `--no-verify`; full E2E runs must be backgrounded and polled (foreground runs kill the executor at 600 s); `tests/e2e-runs/` must not be deleted.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Session verification round-trip pinning (`safeGetSession`) | Frontend Server (SSR hook) | — | `createSafeGetSession` is built per request in `hooks.server.ts`; the test is a unit test of that server module |
| `/api/cache` route, `flat-cache`, `CACHE_*` (removed) | Frontend Server (API route) | CDN/Static (Render disk) | A SvelteKit `+server.ts` that wrote to a mounted disk; removal touches both the route and the deployment template |
| `cachifyUrl` / `isCacheEnabled` branch (removed) | Browser + SSR (universal adapter) | — | `UniversalAdapter.fetch` runs in both tiers; its remaining callers are relative `/api/admin/jobs/…` reads and the auth endpoints |
| Backend-URL pair, `BACKEND_API_TOKEN` (removed) | Frontend Server (env constants) | — | `$env/dynamic/public` / `$env/dynamic/private` constants modules |
| Dependency manifests, `yarn.lock`, audit baseline | Build tooling | — | No runtime tier; affects install, bundling (`tsup` externals) and the CI audit gate |
| ESLint configs | Build tooling | — | Lint-time only |
| Docs `OpenVAALogo` / `PeerNavigation` runes ports | Browser / Client (docs SPA) | — | `apps/docs` is adapter-static with a `404.html` fallback; the components render client-side |
| Env loading comment (`vite.config.ts`) | Build tooling | Frontend Server | Documents how Vite and SvelteKit read the repo-root `.env` |

## Standard Stack

**This phase installs no new package and bumps no version.** It removes declarations, moves one declaration (`js-yaml` / `@types/js-yaml` into `@openvaa/llm` via `catalog:`), and edits configs. Versions below are what is installed today, and they are what the edits must work against.

### Core (installed, verified this session)
| Package | Resolved for | Version | Why it matters |
|---------|-------------|---------|----------------|
| `eslint-plugin-svelte` | `apps/frontend` (nested `apps/frontend/node_modules`) | **2.46.1** | Catalog `eslint-plugin-svelte: ^2.46.1` [VERIFIED: `.yarnrc.yml:32`]. Flat config name is `configs['flat/prettier']` |
| `eslint-plugin-svelte` | `apps/docs` (hoisted root) | **3.13.1** | `apps/docs/package.json` `"eslint-plugin-svelte": "^3.13.1"` [VERIFIED: `apps/docs/package.json:49`]. Here `configs.prettier` is the flat array |
| `eslint` | root | 9.39.2 | catalog `eslint: ^9.39.2` |
| `svelte` | root | 5.53.12 | Class-array (`class={[a, b]}`) and `$app/state` both supported; docs already uses both (`NavigationItem.svelte`, `Navigation.svelte`) |
| `@sveltejs/kit` | root | 2.55.0 | `$app/state` available (Kit ≥ 2.12) |
| `tsup` | root | 8.5.1 | Externalises exactly `dependencies` + `peerDependencies` (see the js-yaml section) |
| `js-yaml` | lockfile | 4.3.2 (descriptor `js-yaml@npm:^4.1.0, js-yaml@npm:^4.1.1`) | Catalog `js-yaml: ^4.1.0` [VERIFIED: `.yarnrc.yml:36`]; already locked, so the move adds no resolution |
| `@types/js-yaml` | lockfile | catalog `^4.0.9` [VERIFIED: `.yarnrc.yml:37`] | moves to `@openvaa/llm` devDependencies |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `svelte.configs['flat/prettier']` (v2 name) | Bump frontend `eslint-plugin-svelte` to v3 so `svelte.configs.prettier` works | **Out of scope.** Version bumps are Phase 169 (CONTEXT § Not in this phase). The flat name on v2 is what D-12 means: "the explicit-import shape". |
| Probe config for the docs lint-red check | Fix `apps/docs/eslint.config.js` (load `eslint-config-prettier` via `createRequire`, or drop the redundant leading `prettier` that `sharedConfig` already applies) | A committed fix is a config change no decision covers, and it touches REVIEW-CFG-08 (deferred to the operator). Recommend the probe, plus a residue todo. See Open Question 2. |

**Installation:** `yarn install` after the manifest edits (commits ③ and ④), with no new package. CI and Docker install with `--immutable`, so the regenerated `yarn.lock` **must** be committed in the same commit as the manifest change.

## Package Legitimacy Audit

Seam run: `gsd-tools query package-legitimacy check --ecosystem npm js-yaml @types/js-yaml`. These are the only packages whose declarations the phase *adds*. Everything else is a removal.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| js-yaml | npm | registry-latest 5.4.2 published 2026-09-13 | ~353M/wk | github.com/nodeca/js-yaml | [SUS] (`too-new`) | **Approved, no install event.** The `too-new` signal is about the registry's *latest* (5.x). This phase declares `catalog:` = `^4.1.0`, which resolves to **4.3.2**, already in `yarn.lock` and already installed at root. No new version is fetched. `postinstall: null`. |
| @types/js-yaml | npm | 2023-11-07 | ~22M/wk | github.com/DefinitelyTyped/DefinitelyTyped | [OK] | Approved |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** `js-yaml`, which is flagged for a version this phase does not install. The protocol's checkpoint applies "before installing this package". Nothing new is installed, and D-28 locks all three plans autonomous, so **replace the checkpoint with an automated assertion**: after `yarn install`, the `yarn.lock` diff must contain **no** `js-yaml@npm:` resolution change; only the workspace dependency lines move. `git diff -U0 yarn.lock | grep -E '^[-+]  (version|resolution): "js-yaml'` must print nothing.

## Architecture Patterns

### System Architecture Diagram (data flow of what commit ② removes)

```
Browser / SSR load
   │  dataWriter.getActiveJobs() / getPastJobs() / getJobProgress()   (only GETs left on UniversalAdapter.fetch)
   ▼
UniversalAdapter.fetch(url, init, {authToken, disableCache})
   │
   ├── isCacheEnabled = PUBLIC_CACHE_ENABLED && !disableCache && GET && !hasAuthHeaders(headers)   ◄── REMOVED
   │        └─ true → cachifyUrl(url) = "/api/cache?resource=<encoded url>"                        ◄── REMOVED
   │                       │
   │                       ▼
   │              routes/api/cache/+server.ts  (unauthenticated: API routes bypass the hook gate)  ◄── REMOVED
   │                 new URL(resource) → 400 on relative URLs
   │                 PUBLIC_BROWSER_BACKEND_URL ('') startsWith → always true → rewrite to PUBLIC_SERVER_BACKEND_URL
   │                 FlatCache(CACHE_DIR='/var/data/cache', CACHE_TTL, CACHE_LRU_SIZE, CACHE_EXPIRATION_INTERVAL)
   │                 event.fetch(new URL(resource)) → cache.setKey(sha256(resource)) → json
   │
   └── false → event.fetch(url)  ──► relative /api/admin/jobs/… , /api/auth/logout, /api/oidc/token …   (KEPT, now unconditional)

Deployment: render.example.yaml  disk{mountPath:/var/data/cache} + CACHE_* keys ◄── REMOVED
            docker-compose.dev.yml (root) PUBLIC_CACHE_ENABLED env              ◄── REMOVED
            apps/frontend/docker-compose.dev.yml  cache:/var/data/cache volume ◄── REMOVED
```

### Recommended plan/commit structure (D-24, D-28)

```
167-01  safeGetSession test         → commit ① test[frontend]
167-02  env plumbing + deps + runes → commits ② refactor[frontend], ③ fix[deps], ④ chore[deps], ⑤ refactor[docs], ⑥ docs[frontend]
167-03  gates + gate-evidence + reconciliation → .planning commits only (--no-verify)
```

Put the D-12 config edit in ④ (D-12 allows it as its own commit). Before any 167-02 edit, take **three before-snapshots**, because each one is needed for a later comparison and cannot be retaken once the tree changes:
1. the frontend lint JSON and `--print-config` set (D-12);
2. the hygiene report `--save-baseline` TSV (D-27);
3. the NEW-advisory GHSA set (D-25). The pre-phase *commit* can also be re-audited at the end with the exported-tree method, which is the preferred source.

### Pattern 1: Strengthened `safeGetSession.test.ts` (D-06, D-07)

**Verified counts.** Measured this session by driving the real `safeGetSession.ts` (and the two variants) from a scratch `tsx` harness that replicates each test case's fixture. Use these as the `toHaveBeenCalledTimes(n)` values in **every** case.

| # | Case (`it(...)` title prefix) | HEAD getUser | HEAD getSession | V1 (no memo) getUser / getSession | V2 (extra read) getUser / getSession |
|---|---|---|---|---|---|
| 1 | verifies a token once … | 1 | 3 | **2** / 4 | 1 / **4** |
| 2 | shares one verification between concurrent calls | 1 | 3 | **2** / 4 | 1 / **4** |
| 3 | returns nulls without verifying … then verifies a session that appears later | 1 (0 after first call) | 3 (1 after first call) | 1 / 3 | 1 / **4** |
| 4 | verifies again when the access token changes | 2 | 4 | 2 / 4 | 2 / **6** |
| 5 | pairs the user only with the token getUser() verified … | 2 (2 after first call) | 5 (4 after first call) | **3** / 6 | 2 / **7** (6 after first call) |
| 6 | returns nulls when every verification replaces … | 2 | 4 | 2 / 4 | 2 / **6** |
| 7 | returns nulls when verification errors … | 2 | 3 | 2 / 3 | 2 / **4** |
| 8 | propagates a thrown verification … | 2 | 3 | 2 / 3 | 2 / **4** |
| 9 | verifies afresh on every call once the request has ended | 3 | 6 | 3 / 6 | 3 / **9** |
| 10 | keeps no memo between two helpers … | 2 | 4 | 2 / 4 | 2 / **6** |

[VERIFIED: scratch harness over `apps/frontend/src/lib/supabase/safeGetSession.ts` read this session; the HEAD row matches the one count the file already asserts, case 1 `toHaveBeenCalledTimes(3)`]

**What the controls will show.**
- **V1** turns cases 1, 2 and 5 red on `getUser`, exactly as D-08 predicts. Every other case stays green.
- **V2** leaves every `getUser` count unchanged and changes `getSession` in **all 10 cases**.
- **Standing acceptance rule (REQUIREMENTS § Standing acceptance rule, "twice — once against the old assertion to demonstrate blindness, once against the new"):** run V2 against the **unmodified HEAD test file** as well. It goes red in **case 1 only**, because that is the only `getSession` assertion today. Against the strengthened file it goes red in **10**. The 1-vs-10 contrast is the evidence D-08 asks for: the new assertions catch something the old ones did not.

**V1 / V2 exact working-copy edits.** Both were applied to a copy and verified to change behaviour as above. Neither is ever committed.

```text
V1 (no memo) — delete these two lines from `function verify(accessToken: string)`:
    const cached = verifiedUsers.get(accessToken);
    if (cached) return cached;

V2 (extra read) — in `async function verifyStored(accessToken: string)`, after
    if (error || !user) return null;
insert
    await supabase.auth.getSession();
```
[VERIFIED: `apps/frontend/src/lib/supabase/safeGetSession.ts:62-63` quotes `const cached = verifiedUsers.get(accessToken);` / `if (cached) return cached;`; `:49` quotes `if (error || !user) return null;`]

**Proxy fixture (D-06 step 2).** Keep `fakeClient`. Wrap the client so any access other than `auth.getSession` / `auth.getUser` throws a **named** error **and** is recorded. Recording matters because the doc's concern is "a test that caught the error would hide it": an `afterEach` assertion on the record survives a future `try/catch` in production code.

```typescript
// Sketch for safeGetSession.test.ts; names are the planner's choice.
class UnexpectedClientAccess extends Error {
  name = 'UnexpectedClientAccess';
}

/** Every client member touched other than `auth.getSession` and `auth.getUser`, in access order. */
const unexpectedAccesses: Array<string> = [];

function strict<T extends object>(target: T, path: string, allowed: ReadonlySet<PropertyKey>): T {
  return new Proxy(target, {
    get(obj, prop, receiver) {
      if (allowed.has(prop)) return Reflect.get(obj, prop, receiver);
      // Symbols (inspect, toStringTag) and `then` (thenable probing) are not round trips.
      if (typeof prop === 'symbol' || prop === 'then') return undefined;
      unexpectedAccesses.push(`${path}.${String(prop)}`);
      throw new UnexpectedClientAccess(`${path}.${String(prop)}`);
    }
  });
}

function fakeClient(initial: Session | null) {
  const storage: { session: Session | null } = { session: initial };
  const getSession = vi.fn(async () => ({ data: { session: storage.session } }));
  const getUser = vi.fn<() => Promise<{ data: { user: User | null }; error: Error | null }>>();
  const auth = strict({ getSession, getUser }, 'supabase.auth', new Set(['getSession', 'getUser']));
  const supabase = strict({ auth }, 'supabase', new Set(['auth'])) as unknown as SupabaseClient<SupabaseDatabase>;
  return { supabase, storage, getSession, getUser };
}

beforeEach(() => { unexpectedAccesses.length = 0; });
afterEach(() => { expect(unexpectedAccesses).toEqual([]); });
```

**Recommended third control (V3), in addition to D-08.** The Proxy is a *new* guard, and the standing acceptance rule requires every new check to be observed failing. D-08 names V1 and V2 only. A V3 working copy that adds one stray client call inside `verifyStored`, such as `supabase.auth.refreshSession` or `supabase.from('candidates')`, should turn every case that reaches `verifyStored` red with `UnexpectedClientAccess`. Record it like V1/V2. This is additive and uses D-08's own mechanism (a temporary working copy, never committed), so it does not reopen D-08. See Open Question 1.

**Record per run** (D-08): the command, the exit code read directly, and the failing test names. Command:
`cd apps/frontend && yarn vitest run src/lib/supabase/safeGetSession.test.ts > "$LOG" 2>&1; echo "exit=$?"`. It takes about 0.5 s and was observed green at HEAD with 10 passed. Afterwards: `git diff --exit-code -- apps/frontend/src/lib/supabase/safeGetSession.ts`, which must exit 0.

### Pattern 2: Cache-proxy removal inventory (commit ②, D-09, D-11)

Every row below was read at HEAD. **Bold rows are not in fact 9 / D-09's list** but go dead or false when the listed items go. The planner should include them; see Open Question 3 for `authHeaders`.

| File | Action |
|------|--------|
| `apps/frontend/src/routes/api/cache/+server.ts` | delete |
| `apps/frontend/src/lib/api/utils/cachifyUrl.ts`, `cachifyUrl.test.ts` | delete |
| **`apps/frontend/src/lib/api/base/universalApiRoutes.ts`** | remove `` cacheProxy: `${API_ROOT}/cache`, `` [VERIFIED: `universalApiRoutes.ts:11`]. `cachifyUrl` is its only reader |
| **`apps/frontend/src/lib/api/utils/authHeaders.ts`, `authHeaders.test.ts`** | dead once the `isCacheEnabled` branch goes: `hasAuthHeaders` is imported only by `universalAdapter.ts` (`git grep -n hasAuthHeaders -- apps packages`). Recommend delete |
| `apps/frontend/src/lib/api/base/universalAdapter.ts` | remove the `cachifyUrl`, `hasAuthHeaders` and `constants` imports, the `isCacheEnabled` / `maybeCachedUrl` logic (fetch `url` directly), `disableCache` from the destructure, and **rewrite the class docstring ("wrapped in possible caching") and the `fetch` docstring** (its "`GET` requests are cached if:" list). Touched comments must pass hygiene |
| `apps/frontend/src/lib/api/base/universalAdapter.type.ts` | remove `disableCache?: boolean;` and its doc |
| `apps/frontend/src/lib/api/adapters/apiRoute/dataProvider/apiRouteDataProvider.ts` | drop `disableCache: true` from the two `apiGet` calls (`appSettings`, `appCustomization`). Typecheck fails if forgotten |
| `apps/frontend/src/lib/api/base/universalAdapter.test.ts` | delete `describe('fetch (with caching enabled)'` (9 tests); delete the now-unneeded `vi.mock('$lib/utils/constants', …)` block; rename `describe('fetch (without caching)'` to `'fetch'` |
| `apps/frontend/src/lib/server/constants.ts` | remove `BACKEND_API_TOKEN` and the four `CACHE_*` entries [VERIFIED: `server/constants.ts:4,14-17`]. **Keep** `LOCAL_DATA_DIR` |
| `apps/frontend/src/lib/utils/constants.ts` | remove `PUBLIC_BROWSER_BACKEND_URL`, `PUBLIC_SERVER_BACKEND_URL`, `PUBLIC_CACHE_ENABLED` [VERIFIED: `utils/constants.ts:4,5,15`]. **Keep** the `*_FRONTEND_URL` pair (other readers) |
| 7 auth mocks: `__tests__/{authorize,callback,token}-endpoint.test.ts`, `decryptAndVerifyIdToken.test.ts`, `providers/{authorize-fail-closed,idura,signicat}.test.ts` | remove `BACKEND_API_TOKEN` and the 4 `CACHE_*` keys (all 7); remove `PUBLIC_*_BACKEND_URL` and `PUBLIC_CACHE_ENABLED` (the first 5 only; `idura`/`signicat` have neither) |
| **`supabaseFeedbackWriter.test.ts`, `supabaseAdapter.test.ts`** | `mockConstants: { PUBLIC_PROJECT_ID: '', PUBLIC_CACHE_ENABLED: false }` becomes `{ PUBLIC_PROJECT_ID: '' }` |
| `apps/frontend/src/lib/routes/route.test.ts`, `voterAppPath.test.ts` | `'/api/cache'` becomes a live path. `'/api/auth/logout'` exists (`routes/api/auth/logout/+server.ts`) and is a valid route id for `isApiRoute` |
| `apps/frontend/package.json` | remove `"flat-cache": "^6.1.20"` (dependencies) |
| `.env.example` | remove the whole `# Cache settings` banner block and its 5 assignments [VERIFIED: `.env.example:119-127`] |
| `docker-compose.dev.yml` (root) | remove `PUBLIC_CACHE_ENABLED: ${PUBLIC_CACHE_ENABLED:-false}`. Leave the `PUBLIC_SUPABASE_URL` line intact, because `packages/dev-seed/tests/localSupabaseUrl.test.ts` captures it by regex |
| `apps/frontend/docker-compose.dev.yml` | remove `# Cache volume` + `- cache:/var/data/cache` |
| `render.example.yaml` | remove the 5 cache keys and the `disk:` block [VERIFIED: `render.example.yaml:28-37,58-61`] |
| **`apps/frontend/src/routes/README.md`** | drop "and `api/cache`" from the endpoint list |
| **`CLAUDE.md` § Deployment** | drop "and the cache disk" |
| **`apps/frontend/src/routes/+layout.server.ts`, `routes/admin/+layout.server.ts`, `routes/candidate/+layout.server.ts`** | each docblock says "(`render.example.yaml` provisions a cache disk for this service)", which is false after the removal. Removing the parenthetical *touches* a paragraph that opens "This load used to return …", which is historical narrative, so rewrite that paragraph hygienically (e.g. "Returning `locals.safeGetSession()`'s whole `Session` would put a refresh token into …") |
| `security/audit-baseline.json` flat-cache rows (`flatted` 1114526, 1115357) | **stay** (D-09). `flatted` remains via `file-entry-cache → flat-cache@4.0.1` (`yarn why flatted`). Their `via` text will still name `flat-cache@6.1.20`, which is stale but harmless; Phase 169's `--update-baseline` regenerates it. Note it for 169 |

**Zero-hit check after commit ②.** It exits 1, meaning no match:
```bash
git grep -n -E "CACHE_(DIR|TTL|LRU_SIZE|EXPIRATION_INTERVAL)|PUBLIC_CACHE_ENABLED|/var/data/cache|disableCache|cachifyUrl|cacheProxy|hasAuthHeaders|flat-cache|api/cache|cache disk|BACKEND_API_TOKEN|PUBLIC_(BROWSER|SERVER)_BACKEND_URL" \
  -- ':!.planning' ':!apps/docs' ':!yarn.lock' ':!.yarn' ':!security/audit-baseline.json'; echo "exit=$?"
```
`apps/docs` is Phase 168's surface (fact 21). `audit-baseline.json` keeps its flat-cache rows.

### Pattern 3: D-12 explicit import, using the name that loads on v2.46.1

```javascript
// apps/frontend/eslint.config.mjs — head after the edit
import { default as sharedConfig } from '@openvaa/shared-config/eslint';
import tsParser from '@typescript-eslint/parser';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import parser from 'svelte-eslint-parser';

// …ADAPTER_BOUNDARY_ALLOWLIST etc. unchanged…

export default [
  ...sharedConfig,
  ...svelte.configs['flat/prettier'],
  {
```
This deletes `import path from 'node:path'`, `import { fileURLToPath } from 'node:url'`, `import { FlatCompat } from '@eslint/eslintrc'`, `import js from '@eslint/js'`, the `__filename` / `__dirname` lines and the `const compat = new FlatCompat({…})` block [VERIFIED: `apps/frontend/eslint.config.mjs:1-16,188`]. Before deleting `path` and `fileURLToPath`, confirm with `grep -n "path\.\|fileURLToPath\|__dirname" apps/frontend/eslint.config.mjs` that nothing else in the 400-line file uses them. At HEAD only lines 1–2 and 10–13 do.

**Why not `svelte.configs.prettier`:** observed this session with a probe copy of the config:
```
TypeError: svelte.configs.prettier is not iterable
    at file:///…/apps/frontend/.d12probe-legacy.eslint.config.mjs…
(exit 2)
```
`Object.keys(svelte.configs)` on the frontend's resolution is `['base','recommended','prettier','all','flat/base','flat/recommended','flat/prettier','flat/all']`. `configs.prettier` is `{ extends: [...base.js], rules: {...} }` (an object), while `configs['flat/prettier']` is an array of 3 named flat configs (`svelte:base:setup-plugin`, `svelte:base:setup-for-svelte`, `svelte:prettier:turn-off-rules`). [VERIFIED: node probe against `apps/frontend/node_modules/eslint-plugin-svelte/lib/index.js` 2.46.1]

**Before/after comparison protocol (D-12; Claude's Discretion allows the findings diff plus the print-config diff). Already dry-run this session, and both diffs came out clean:**
```bash
S=<scratch dir>; cd apps/frontend
# BEFORE (unmodified config). Read every exit code directly.
yarn workspace @openvaa/frontend lint -f json -o "$S/lint-before.json"; echo "lint exit=$?"
for f in src/lib/components/openVAALogo/OpenVAALogo.svelte src/lib/supabase/safeGetSession.ts \
         src/routes/+layout.server.ts src/lib/contexts/app/appContext.svelte.ts \
         src/lib/supabase/safeGetSession.test.ts; do
  ../../node_modules/.bin/eslint --flag v10_config_lookup_from_file --print-config "$f" > "$S/before-$(echo "$f" | tr / _).json"; echo "print $f exit=$?"
done
# … edit the config …   then the same commands into after-*.json
# Normalise findings to "relpath:line:col rule severity message", sort, diff → must be empty.
# Diff print-config per file → .ts files identical; .svelte files differ ONLY in
#   "processor": "eslint-plugin-svelte@2.46.1"  vs  "processor": "svelte/svelte"
# which are the same processor object (plugin.processors.svelte.meta = {name:"eslint-plugin-svelte",version:"2.46.1"}).
```
Dry-run results at HEAD: 854 files, 172 `.svelte`, 0 errors and 1 warning both ways (`candidateContext.svelte.test.ts` `unused-imports/no-unused-vars`). The findings diff is empty. Print-config for `.ts` is identical, and for `.svelte` the only diff is the processor serialisation line [VERIFIED: probe run this session]. The effective `.svelte` parser is `svelte-eslint-parser@1.6.0` in both, set by the frontend's own `files: ['**/*.svelte']` block, which comes later and overrides the plugin's bundled 0.43.0.

**Also green after the edit:** the four `src/lib/_guards/eslint-*-guard.test.ts` files construct `new ESLint({ flags: ['v10_config_lookup_from_file'] })` against the real config, so `yarn workspace @openvaa/frontend test:unit` exercises the edited config end to end.

**D-12 knock-on (planner states it):** after the edit, `@eslint/eslintrc` and `@eslint/js` have **no importer in `apps/frontend`**. The only `git grep` hits are the two deleted import lines. `packages/shared-config` declares both itself [VERIFIED: `packages/shared-config/package.json` `dependencies`]. **Recommendation: remove both from `apps/frontend/package.json` in commit ④**, under D-05's reasoning and with D-16's lint-red check. This leaves no residue todo for D-12.

### Pattern 4: Lint-red protocol (D-16), with the docs-app blocker resolved

**Frontend** (after removing `@typescript-eslint/eslint-plugin`, `@eslint/eslintrc`, `@eslint/js`): create a temporary `apps/frontend/src/lib/zzLintRedProbe.ts` with an unsorted import pair and a `: any` annotation. Run `yarn workspace @openvaa/frontend lint > "$LOG" 2>&1; echo "exit=$?"`, which must exit 1 and name `simple-import-sort/imports` **and** `@typescript-eslint/no-explicit-any`. Delete the file, re-run, and expect exit 0. Both rules are active at error level for `.ts` and `.svelte` today: `@typescript-eslint/no-explicit-any` is `[2, {ignoreRestArgs: true}]` and `simple-import-sort/imports` is `[2, {groups: …}]` [VERIFIED: `--print-config` this session].

**Docs: the decided command does not exist and the config cannot load.**
- `apps/docs/package.json` scripts have `lint:local` (`eslint .`) and `lint:full`, but **no `lint`** [VERIFIED: `apps/docs/package.json` scripts]. `turbo run lint` therefore skips docs, so `yarn lint:check` has never linted docs.
- `eslint .` in `apps/docs` exits **2** at config load on Node 24.14.1 **and** 22.22.1 (`.github/workflows/main.yaml` `node-version: 22.22.1`):
  ```
  Error [ERR_INTERNAL_ASSERTION]: This is caused by either a bug in Node.js or incorrect usage of Node.js internals.
      at assert (node:internal/assert:11:11)
      at cjsLoader (node:internal/modules/esm/translators:308:5)            # 22.22.1
      at async dynamicImportConfig (…/node_modules/eslint/lib/config/config-loader.js:186:17)
  ```
  Bisected: static `import … from '@openvaa/shared-config/eslint'` together with static `import … from 'eslint-config-prettier'` triggers it, and each alone loads [VERIFIED: node import probes this session]. `sharedConfig` itself `compat.extends(…, 'prettier')`, which `require`s the same CJS module the ESM loader is importing.
- Even when it loads, a full `eslint .` over docs reports 13,021 errors, mostly `quotes` and `no-unused-expressions` in `.svelte-kit/generated/**`. The docs config has no `.svelte-kit` ignore, so a whole-app lint is not a usable signal.

**Recommended docs lint-red procedure** (all temporary, never committed):
```javascript
// apps/docs/.lint-red-probe.eslint.config.js — identical entries to eslint.config.js, but
// eslint-config-prettier is loaded through createRequire, which avoids the loader assertion.
import { createRequire } from 'node:module';
import { default as sharedConfig } from '@openvaa/shared-config/eslint';
import svelte from 'eslint-plugin-svelte';
const prettier = createRequire(import.meta.url)('eslint-config-prettier');

export default [prettier, ...svelte.configs.prettier, ...sharedConfig];
```
```bash
cd apps/docs
../../node_modules/.bin/eslint -c .lint-red-probe.eslint.config.js src/lib/utils/navigation.ts; echo "baseline exit=$?"   # observed 0
# add src/lib/utils/zzLintRedProbe.ts:  import { b } from './navigation'; import { a } from './a'; export const x: any = [a, b];
../../node_modules/.bin/eslint -c .lint-red-probe.eslint.config.js src/lib/utils/zzLintRedProbe.ts; echo "red exit=$?"
#   observed: 1:1 error simple-import-sort/imports · 4:17 error @typescript-eslint/no-explicit-any · exit 1
rm src/lib/utils/zzLintRedProbe.ts .lint-red-probe.eslint.config.js
```
[VERIFIED: run this session at HEAD, before any removal]. Run it **before** and **after** the six D-14 removals plus `yarn install`. The plugins resolve from `packages/shared-config`, which declares `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser` and `eslint-plugin-simple-import-sort` itself, so the expected result is unchanged. The before/after pair proves it. Record that the real `apps/docs/eslint.config.js` fails to load both before and after, with the same error. It is pre-existing and unchanged by this phase.

### Pattern 5: js-yaml move (commit ③, D-13)

- `packages/llm/package.json`: add `"js-yaml": "catalog:"` to `dependencies` and `"@types/js-yaml": "catalog:"` to `devDependencies`. `promptRegistry.ts` has `import * as yaml from 'js-yaml';` [VERIFIED: `packages/llm/src/prompts/promptRegistry.ts:3`].
- **This changes `llm`'s build output, and the change is how to verify the fix.** `tsup` treats exactly `dependencies` + `peerDependencies` as external. The installed tsup 8.5.1 builds its external list in `getProductionDeps` from `Object.keys(data.dependencies)` and `Object.keys(data.peerDependencies)` [VERIFIED: `node_modules/tsup/dist/chunk-VGC3FXLU.js` `getProductionDeps`]. Today `packages/llm/dist/index.js` **inlines** js-yaml: it contains `function YAMLException2` and no `from "js-yaml"` [VERIFIED: grep of current dist]. After the edit and `yarn workspace @openvaa/llm build`:
  `grep -c 'YAMLException' packages/llm/dist/index.js` → **0** and `grep -cE "from ['\"]js-yaml['\"]" packages/llm/dist/index.js` → **≥ 1**.
- Then `yarn workspace @openvaa/llm test:unit` and `yarn workspace @openvaa/frontend build`. The frontend SSR bundle now imports `js-yaml` at runtime, and it resolves to the root-hoisted 4.3.2, which `@eslint/eslintrc` and `@changesets/parse` also depend on.
- Commit ④ removes `js-yaml` / `@types/js-yaml` from `packages/question-info` and `packages/argument-condensation`. **Also edit `packages/argument-condensation/README.md` § Dependencies**, whose bullet "`js-yaml`: YAML parsing for reading prompt configuration files." becomes false.

### Pattern 6: Runes ports (commit ⑤, D-03, D-21)

**PeerNavigation.** Model it on `apps/docs/src/lib/components/Navigation.svelte`, which already uses `$app/state` and `const x = $derived(…)`:
```svelte
<script lang="ts">
  import { page } from '$app/state';
  import { getPeerNavigation } from '$lib/utils/navigation';

  const peerNav = $derived(getPeerNavigation(page.url));
</script>
```

**OpenVAALogo.** Keep the docs-specific values. **Do not copy the frontend twin's body wholesale**:
- default size `'h-28 pt-4'` (the frontend twin uses `h-24`) [VERIFIED: docs `OpenVAALogo.svelte:44`];
- default color `'primary'` (D-21);
- **keep the literal `' fill-primary inline'` / `' fill-secondary inline'` / `' fill-neutral inline'` strings.** In `apps/docs` these are the **only** occurrences of `fill-primary|fill-secondary|fill-neutral` (`git grep` outside the component returns nothing), and Tailwind v4 generates utilities only for class names it finds literally in source. The interpolated `` `fill-${color}` `` alone would ship a logo with no fill rule [CITED: tailwindcss.com/docs/detecting-classes-in-source-files].
```svelte
<script lang="ts">
  import type { OpenVAALogoProps } from './OpenVAALogo.type';

  let { title = 'OpenVAA', color = 'primary', size = 'md', class: className, ...restProps }: OpenVAALogoProps = $props();

  const classes = $derived.by(() => {
    let c: string;
    switch (size) {
      case 'xs': c = 'h-14 pt-1'; break;
      case 'sm': c = 'h-20 pt-2'; break;
      case 'lg': c = 'h-32 pt-6'; break;
      default: c = 'h-28 pt-4';
    }
    switch (color) {
      case 'primary': c += ' fill-primary inline'; break;
      case 'secondary': c += ' fill-secondary inline'; break;
      case 'neutral': c += ' fill-neutral inline'; break;
      default:
    }
    if (color != null) c += ` fill-${color} inline`;
    return c;
  });
</script>

<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 458.05 91.74" {...restProps} class={[classes, className]}>
```
Keeping both the switch and the trailing append reproduces today's class string **byte for byte**, so the call-site check below can be exact. Also fix the docstring: the component header says ``Default: `'neutral'` ``, and **`OpenVAALogo.type.ts` says `@default 'neutral'` for `color` too** [VERIFIED: `apps/docs/src/lib/components/openVAALogo/OpenVAALogo.type.ts:21`]. Both become `'primary'`. Optionally add the twin's "- Any valid attributes of a `<svg>` element." bullet, since the spread now makes it true.

**"Nothing they render changes": an automated check.** Server-render the component with `svelte/compiler` + `svelte/server` from a scratch script (dry-run this session at HEAD):
```
{}                                   => class="h-28 pt-4 fill-primary inline fill-primary inline"      (Header)
{"color":"secondary","size":"sm"}    => class="h-20 pt-2 fill-secondary inline fill-secondary inline"  (Footer)
{"class":"extra","aria-hidden":"true"} => class="h-28 pt-4 fill-primary inline fill-primary inline"    (rest props dropped today: fact 18)
```
After the port, the first two must be byte-identical. The third must now carry `aria-hidden="true"` and `extra`. The docs build output has only a `404.html` (SPA fallback), so a prerendered-HTML diff is not available, and the render probe is the substitute. Docs has no `test:unit` script, so **do not add a committed docs test**: `scripts/assert-unit-test-coverage.mjs` Check 1 would then demand a `test:unit` script.

### Pattern 7: Sweep #14 measurement (D-04)

Run at HEAD this session (`git version 2.50.1 (Apple Git-155)`):
```bash
for pat in 'export let ' '^\s*\$:' '(^|[^a-zA-Z])on:[a-z]+=' '<slot' 'createEventDispatcher' \
           '\$\$props|\$\$restProps|\$\$slots' 'svelte/legacy' '<svelte:component' '<svelte:fragment' \
           'beforeUpdate|afterUpdate' '\$\$Props'; do
  n=$(git grep -n -P "$pat" -- '*.svelte' ':!.planning' | wc -l | tr -d ' '); echo "[$pat] $n"; done
git grep -n -F '$app/stores' -- apps packages | wc -l
```
HEAD counts: `export let ` 3 (OpenVAALogo) · `^\s*\$:` **2** (OpenVAALogo, PeerNavigation) · `$$Props` 4 (OpenVAALogo) · `$app/stores` 1 (PeerNavigation) · every other pattern 0. The `-E '^\s*\$:'` form returns **0** on this host, the false zero of fact 17, confirmed. After ⑤, every count is 0. Note that `wc -l` on an empty `git grep` gives 0 while `git grep` itself exits 1, so record counts, not exit codes. `$$Props` is not one of the ten #14 patterns, but criterion 5 names it, so include it as an eleventh row.

### Pattern 8: env-dir todo and the `vite.config.ts` comment (commit ⑥, D-22)

The stale sentence [VERIFIED: `apps/frontend/vite.config.ts:17`]: "The project id is carried from the root `.env` into `process.env`, which is where SvelteKit's own `loadEnv` over `apps/frontend` picks it up and exposes it through `$env/dynamic/public`." Today `kit.env.dir` is `repoRoot` (`svelte.config.js` `env: { dir: repoRoot }`), so SvelteKit reads the **root** `.env` too, and the bridge exists because a `process.env` entry overrides the file *even when empty* (`svelte.config.js` comment). A hygienic replacement says what loads what now, for example: "SvelteKit reads this same root `.env` (`kit.env.dir`), but a `process.env` entry overrides the file even when empty, so the two project ids are copied in from the file wherever the shell left them empty. Only those two keys cross over; see `vite.projectIdEnv.ts`." Do not write "used to" or "over `apps/frontend`". The todo moves to `.planning/todos/done/` with the three-point resolution note D-22 specifies.

### Pattern 9: Audit "adds no advisory" comparison (D-25), immune to advisory-DB drift

The advisory database moves within hours. The same lockfile gave 7 NEW at VESTIGES time and 9 now. A before-set captured at plan start and an after-set captured hours later can therefore differ for reasons unrelated to the phase. **Measure both sides at the same moment** by auditing an export of the pre-phase commit. Running `yarn npm audit` needs only manifests, the lockfile and the yarn release, not an install [VERIFIED: run this session; both exports audited successfully]:
```bash
BASE=<pre-phase sha, i.e. the post-166 tip recorded at 167-01 start>; X=<scratch>/audit-base; rm -rf "$X"; mkdir -p "$X"
git archive "$BASE" -- package.json yarn.lock .yarnrc.yml .yarn/releases scripts/assert-dependency-audit.mjs security \
  $(git ls-tree -r --name-only "$BASE" | grep -E '(^|/)package\.json$' | grep -v '^package\.json$') | tar -x -C "$X"
(cd "$X" && node scripts/assert-dependency-audit.mjs > ../audit-before.log 2>&1; echo "before exit=$?")
yarn audit:deps > <scratch>/audit-after.log 2>&1; echo "after exit=$?"
extract() { awk '/^\[NEW\]/{f=1} /^Note:|^Summary:/{f=0} f && /\[(high|critical)\]/{print $3, $4}' "$1" | sort -u; }
diff <(extract <scratch>/audit-before.log | awk '{print $2}' | sort -u) <(extract <scratch>/audit-after.log | awk '{print $2}' | sort -u)
# Gate: comm -13 before after (GHSAs only in AFTER) is empty.
```
**Both scripts exit 1 (red); that is expected, and the gate is the set comparison.** Also record the `Note: … no longer appear` id list from both logs. It should gain `1115806` (lodash) after D-19, plus any other accepted ids that left with the removed packages. Leave those other rows for Phase 169 and record them.

Snapshot of the NEW set at HEAD `ec0cd7810` on 2026-10-01, ~22:00 local (for the record, superseded by the at-execution measurement):
`brace-expansion` 1240104, 1240105, 1240107 (GHSA-qhr7-859c-m2p7) · 1240108, 1240109, 1240111 (GHSA-6j4f-fj2g-mc7p) · `devalue` 1240870 (GHSA-j22f-vq7h-c4qm) · 1240872 (GHSA-mcm9-63f2-9j32) · `undici` 1240042 (GHSA-rfgv-xxqx-mfg5). That is 9 ids, 5 GHSAs. The baseline lists 70 and 66 of them are seen [VERIFIED: `yarn audit:deps` run this session, exit 1].

### Pattern 10: Baseline hand-edit (D-20)

After removing `@testing-library/jest-dom` and running `yarn install`, `yarn why lodash` should print nothing. Today its only path is `@testing-library/jest-dom@npm:6.6.3 → lodash@npm:4.17.21` [VERIFIED]. Then `yarn audit:deps` must list `1115806` under "no longer appear". Delete the row `"id": 1115806, "package": "lodash", … "ghsa": "GHSA-r5fr-rjxr-66jc", … "via": "@testing-library/jest-dom@6.6.3"` [VERIFIED: `security/audit-baseline.json:269-275`]. Change the note's `"These 70 findings (64 high, 6 critical)"` to **`"These 69 findings (63 high, 6 critical)"`**: the row is `high`, and the file has 64 high and 6 critical rows today [VERIFIED: `security/audit-baseline.json:5` and a severity count]. Check with
`node -e "const b=require('./security/audit-baseline.json');const c={};b.accepted.forEach(r=>c[r.severity]=(c[r.severity]||0)+1);console.log(b.accepted.length,c)"` → `69 { high: 63, critical: 6 }`. Then run `yarn workspace @openvaa/dev-seed test:unit` (the shape test) and `yarn format:check`, since the JSON is Prettier-formatted. **Never `--update-baseline`.**

### Anti-Patterns to Avoid
- **`...svelte.configs.prettier` in the frontend.** It crashes on v2.46.1; use `['flat/prettier']`.
- **`yarn workspace @openvaa/docs lint`.** The script does not exist, and `yarn lint:check` green says nothing about docs.
- **Gating on `hygiene-grep-report.sh --assert-clean` exit 0.** It is red at HEAD; gate on the delta.
- **Comparing an audit "before" taken at plan start with an "after" taken hours later.** DB drift fakes a regression; audit the exported pre-phase tree at the same moment.
- **Dropping the literal `fill-*` strings from `OpenVAALogo`.** Tailwind stops emitting them in docs.
- **Committing any probe or variant:** V1/V2/V3 copies, the lint-red file, the docs probe config. Each must leave `git status --porcelain` clean.
- **Piping a gate through `grep`/`tail` and reading `$?`.**

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Counting client calls | a custom call-log wrapper | `vi.fn` spies + `toHaveBeenCalledTimes(n)` (D-07) | Already the fixture's mechanism |
| Detecting stray client access | a second fixture file | a `Proxy` around the existing `fakeClient` (D-06) | One fixture, one truth |
| Before-set for the audit gate | parsing old logs from `gate-evidence/` | `git archive <base>` + `assert-dependency-audit.mjs` | Same-moment measurement; `gate-evidence/` is deleted by D-23 anyway |
| Comment-hygiene delta | ad-hoc greps | `hygiene-grep-report.sh --save-baseline` then `hygiene-grep-report.sh <baseline.tsv>` (delta columns) | The script already prints `base` and `delta` |
| Baseline edit | `--update-baseline` | a hand edit (D-20) | `--update-baseline` writes `REVIEW REQUIRED` rows → `auditBaselineShape.test.ts` red |
| Equivalence of the logo port | eyeballing the docs site | `svelte/server` render probe (scratch, uncommitted) | Exact class-string comparison |

## Runtime State Inventory

This is a removal and refactor phase. After every file in the repo is updated, the following still carry the removed names:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Any **deployed** Render instance that provisioned the `disk` at `/var/data/cache` still holds `flat-cache` files. Developers' Docker named volume `cache` exists only if they ran `apps/frontend/docker-compose.dev.yml`. No database or Supabase row stores these names (verified by grep: nothing under `apps/supabase` matches the removed names) | **Operator note, not a code task:** existing deployments can detach the disk and delete the 5 cache env vars and `BACKEND_API_TOKEN` / `PUBLIC_*_BACKEND_URL` from their Render service. Record it in the phase summary for Phase 168's deployment page |
| Live service config | Render dashboard env vars on existing deployments (`PUBLIC_CACHE_ENABLED`, `CACHE_*`, `BACKEND_API_TOKEN`, `PUBLIC_*_BACKEND_URL`). They are not in git, and they are harmless once unread, because SvelteKit's `$env/dynamic/*` simply exposes unused keys | none in code; same operator note |
| OS-registered state | None. No task scheduler, launchd or pm2 entry references these names (none exists for this repo's frontend) | none |
| Secrets / env vars | Developers' local root `.env` files (copied from `.env.example`) still contain the cache block. CI: `.github/workflows/main.yaml` only `cp .env.example`, with no secret named after these keys (`git grep` of `.github` for the removed names returns nothing). `BACKEND_API_TOKEN` was in no env template at all (fact 4) | none: unread keys are inert. Optionally mention in the summary that devs may delete the block |
| Build artifacts | `apps/frontend/.svelte-kit/types/src/routes/api/cache/` and `apps/frontend/build/` (stale route) are regenerated by `svelte-kit sync` / `yarn build`. `node_modules/flat-cache@6.1.20` and the removed packages are pruned by `yarn install`. `packages/llm/dist/index.js` changes shape after ③ (js-yaml becomes external) and is rebuilt by `yarn build` | run `yarn install` and `yarn build` in the gates (already in D-26) |

## Common Pitfalls

### Pitfall 1: The D-12 name mismatch between plugin majors
**What goes wrong:** copying `apps/docs`'s `...svelte.configs.prettier` into the frontend crashes lint at config load (exit 2). A hurried reading could take that for "lint red because of the change" rather than "config did not load".
**Why it happens:** the frontend is on eslint-plugin-svelte **2.46.1** (catalog) and docs on **3.13.1**. v3 renamed the flat configs to the unprefixed names.
**How to avoid:** use `svelte.configs['flat/prettier']`. Phase 169's v3 bump will then rename it.
**Warning signs:** `TypeError: svelte.configs.prettier is not iterable`.

### Pitfall 2: The docs lint "gate" that never ran
**What goes wrong:** D-14 says "run `yarn workspace @openvaa/docs lint` and `yarn lint:check`". The first command does not exist. The second never touches docs. A config that fails to load exits 2, which "fails" a lint-red check for the wrong reason.
**How to avoid:** use the probe config (Pattern 4). Require that the red run **names both rule ids** and exits **1**, not 2. Also require that the un-injected baseline run exits 0.

### Pitfall 3: Advisory-DB drift masquerading as a phase regression
**What goes wrong:** the NEW set grows between the start and end of the phase (7 → 9 within one day here), and the gate blames the phase.
**How to avoid:** Pattern 9's same-moment export audit.

### Pitfall 4: Hygiene gate red before the phase
**What goes wrong:** `--assert-clean` exits 1 at HEAD (316 refs / 147 files), so a literal D-27 reading can never be satisfied.
**How to avoid:** `--save-baseline` before 167-02, compare after, and require every row's `delta ≤ 0`. Files the phase *touches* still carry their pre-existing hits: `apps/frontend/eslint.config.mjs` is full of `D-F4`/`157-…` references, but D-12 edits only its import header, so no new hits arise. Read each touched comment as well (D-27), because historical narrative is invisible to the script.

### Pitfall 5: Hidden Tailwind dependency in the logo port
**What goes wrong:** simplifying to the frontend twin's `` `fill-${color}` `` drops the only literal `fill-primary` etc. in `apps/docs`, and the logo renders unfilled.
**How to avoid:** keep the switch literals (Pattern 6). Confirm with a docs build and grep the emitted CSS for `.fill-primary`: `grep -l 'fill-primary' apps/docs/build/_app/immutable/assets/*.css`.

### Pitfall 6: The phantom `globals` import in shared-config
**What goes wrong:** `packages/shared-config/eslint.config.mjs` imports `globals` but does not declare it. It resolves the root-hoisted `globals@16.5.0`, which comes from docs' `"globals": "^16.5.0"` **and** from `eslint-plugin-svelte@3.13.1`'s own `globals: ^16.0.0`. Removing docs' entry (D-14) should leave root at 16.5.0 through the plugin, but hoisting is the package manager's choice.
**How to avoid:** record `node -p "require('./node_modules/globals/package.json').version"` before and after `yarn install`. If it changes, the D-12/D-14 lint comparisons must still show no finding change (no-undef is off in shared-config, so a globals change is unlikely to alter findings). Declaring `globals` in shared-config is out of scope, so file it as residue if it matters (Open Question 4).

### Pitfall 7: `yarn.lock` not committed with the manifests
**What goes wrong:** CI and the Docker image install with `--immutable` and fail.
**How to avoid:** commits ③ and ④ each include the `yarn.lock` produced by `yarn install` right after their manifest edits. Check that `git status --porcelain yarn.lock` is empty after each commit.

### Pitfall 8: E2E executor watchdog
**What goes wrong:** a foreground full-suite run (~11 min) kills the executor at 600 s of silence.
**How to avoid:** `run_in_background: true`, tee to a log, poll every 60–90 s. Use `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/167-gate`, which runs `db:reset`, spawns and owns one fresh dev server (default port 5273, because 5173 is held by a Docker sibling on this host) and asserts the preflight. Authoritative counts come from the run directory's JSON report, with `total == expected` and 0 skipped/flaky/unexpected.

## Code Examples

The patterns above carry the load-bearing snippets: the Proxy fixture, the V1/V2 edits, the D-12 header, the docs probe config, the runes ports and the audit export. They are not repeated here.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `compat.extends('plugin:svelte/prettier')` via `@eslint/eslintrc` FlatCompat | Native flat export: `configs['flat/prettier']` (plugin v2.x), `configs.prettier` (v3.x) | eslint-plugin-svelte added `flat/*` in v2.36; v3 made the unprefixed names flat | D-12 on v2.46.1 must use `flat/prettier` |
| `import { page } from '$app/stores'` + `$page` | `import { page } from '$app/state'` + `page.url` | SvelteKit 2.12 | PeerNavigation port |
| `export let` / `type $$Props` / `$:` | `$props()` with rest, `$derived` / `$derived.by` | Svelte 5 | OpenVAALogo port |
| `class={str}` string concatenation | `class={[a, b]}` (clsx-style) | Svelte 5.16 | Inline class merge without `concatClass` (D-21) |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `/api/cache` was an unauthenticated server-side fetch of any absolute URL, i.e. SSRF-shaped, cacheable to disk and keyed by URL. This was inferred by reading `+server.ts` and `hooks.server.ts` (`isApiRoute` → `resolve(event)` before any gate) and was **not exercised** | Security Domain | Low. It only strengthens D-09's rationale; nothing in the plan depends on it. Do not cite it as observed |
| A2 | Root `globals` stays 16.5.0 after D-14, because `eslint-plugin-svelte@3.13.1` keeps a `^16.0.0` dependency | Pitfall 6 | Low; the before/after lint comparison catches any effect |
| A3 | `apps/frontend/docker-compose.dev.yml` declares the named volume `cache` with no top-level `volumes:` key, so `docker compose` would reject that file today. Removing the line fixes a latent error. Not run through `docker compose config` | Pattern 2 | None; the line is removed either way |
| A4 | Tailwind v4 does not generate utilities from interpolated class names | Pattern 6 | Medium if wrong in the other direction (it is the documented behaviour). The CSS grep check in Pitfall 5 settles it at execution |
| A5 | Fact 8 (400 on relative URLs with `PUBLIC_CACHE_ENABLED=true`) stays **unconfirmed by a run**, as CONTEXT records | Summary | None; D-09 removes the path |

## Open Questions

1. **A V3 (Proxy) negative control.**
   - What we know: D-08 locks V1 and V2. The standing acceptance rule says every new guard must be observed failing, and the Proxy (D-06(2)) is a new guard.
   - Recommendation: add V3 as a third temporary working copy in 167-01, recorded like V1/V2. It is additive, uses D-08's mechanism, and needs no operator stop.
2. **What to do about the docs ESLint config crash (REVIEW-CFG-08).**
   - What we know: it crashes on CI's Node too. Docs is never linted by any gate. A one-line `createRequire` change (or dropping the redundant leading `prettier`) would make it load.
   - Recommendation: **do not fix it in 167.** No decision covers it, and REVIEW-CFG-08 is deferred to the operator. Use the probe for D-16 and file a residue todo naming the bisected cause and the 13,021-error `.svelte-kit` ignore gap, so the fix has a home.
3. **`authHeaders.ts` / `hasAuthHeaders` removal.**
   - What we know: its only importer is the cache branch D-09 removes. It is not in fact 9.
   - Recommendation: delete it and its test in commit ②. Leaving a helper whose only reader is its own test recreates a vestige, which is D-09's own argument against keeping `PUBLIC_CACHE_ENABLED`. Do the same for `UNIVERSAL_API_ROUTES.cacheProxy`, the README line, the CLAUDE.md phrase and the three layout docblocks.
4. **shared-config's undeclared `globals`.**
   - Recommendation: out of scope (a declaration addition no decision covers). Record the root version before and after. If it moves, file a residue todo ("declare `globals` in `@openvaa/shared-config`", the same class as fact 12).
5. **The D-12 manifest knock-on.**
   - Recommendation (Claude's Discretion): **remove `@eslint/eslintrc` and `@eslint/js` from `apps/frontend`** in commit ④ with the D-16 lint-red check. Their importers are deleted by the config edit, and `shared-config` declares both.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | everything | ✓ | v24.14.1 active; v22.22.1 (CI's) at `~/.nvm/versions/node/v22.22.1` | — |
| Yarn | install, workspace scripts | ✓ | 4.13.0 (`.yarn/releases`) | — |
| Network to npm registry | `yarn audit:deps`, `yarn install` | ✓ | audit ran this session | none; the audit gate needs it |
| Docker + Supabase CLI | E2E (`db:reset`) | assumed ✓ (prior phases ran E2E here; memory notes a second Supabase stack on the host) | — | none. Check `docker info` at 167-03 start |
| Playwright browsers | E2E | assumed ✓ (prior runs) | 1.58.2 | `yarn playwright install` |
| `timeout` (coreutils) | — | ✗ (macOS) | — | use `run_in_background` + polling instead |

**Missing dependencies with no fallback:** none known. Confirm Docker at execution.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (catalog `vitest: ^3.2.4`) for frontend/packages; Playwright 1.58.2 for E2E |
| Config file | `apps/frontend/vitest.config.ts`, `vitest.workspace.ts`, `tests/playwright.config.ts` |
| Quick run command | `cd apps/frontend && yarn vitest run src/lib/supabase/safeGetSession.test.ts` (~0.5 s) |
| Full suite command | `yarn test:unit` (runs `assert:unit-coverage` first, then `turbo run test:unit`) |

### Phase Requirements → Test Map
Every command's exit code is read directly (`cmd > "$LOG" 2>&1; echo "exit=$?"`).

| Req ID | Behavior | Test Type | Automated Command | Failure signal | File Exists? |
|--------|----------|-----------|-------------------|----------------|-------------|
| VEST-01 | exact `getUser`/`getSession` counts in all 10 cases; Proxy names stray access | unit + negative control | `cd apps/frontend && yarn vitest run src/lib/supabase/safeGetSession.test.ts` | green build: exit 0, 10 passed. V1: exit 1 with cases 1, 2, 5 failing on `getUser`. V2 vs HEAD test: exit 1, case 1 only. V2 vs new test: exit 1, 10 cases on `getSession`. V3: `UnexpectedClientAccess`. Final: `git diff --exit-code -- apps/frontend/src/lib/supabase/safeGetSession.ts` exits 0 | ✅ (strengthen in place) |
| VEST-02 | `BACKEND_API_TOKEN` gone | grep | `git grep -n BACKEND_API_TOKEN -- ':!.planning' ':!apps/docs'` | any hit (exit 0) = fail; expect exit 1 | n/a |
| VEST-03 | cache proxy + pair removed; tests renamed | grep + unit + typecheck | the Pattern 2 zero-hit grep (expect exit 1); `git grep -n "'/api/cache'" -- apps/frontend/src` (expect exit 1); `yarn workspace @openvaa/frontend typecheck`; `yarn workspace @openvaa/frontend test:unit` | grep exit 0, or typecheck/unit non-zero | ✅ |
| VEST-04a | each removed dep has no importer | grep per dep | `git grep -l -F "<dep>" -- <ws> ':!<ws>/package.json'` for each removed entry (expect exit 1); `yarn why <dep>` shows no workspace edge | any hit | n/a |
| VEST-04b | lint config unchanged in effect (D-12) | before/after diff | Pattern 3 findings diff + `--print-config` diff | non-empty findings diff; any print-config diff besides the processor serialisation line | n/a |
| VEST-04c | rules still fire after ESLint-dep removals (D-16) | lint-red | frontend: `yarn workspace @openvaa/frontend lint` with the probe file; docs: Pattern 4 probe | red run not exit 1, or missing either rule id; clean run not exit 0 | n/a |
| VEST-04d | js-yaml declared where imported | build + unit | `yarn workspace @openvaa/llm build && grep -c YAMLException packages/llm/dist/index.js` (expect 0) `&& grep -cE "from ['\"]js-yaml['\"]" packages/llm/dist/index.js` (expect ≥ 1); `yarn workspace @openvaa/llm test:unit`; lockfile check for no `js-yaml` resolution diff | inline YAMLException still present; unit red; resolution diff | ✅ |
| VEST-04e | baseline row and note consistent | unit + script | `yarn workspace @openvaa/dev-seed test:unit`; the Pattern 10 node one-liner → `69 { high: 63, critical: 6 }`; `yarn audit:deps` lists `1115806` under "no longer appear" before the edit and not at all after | shape test red; counts disagree with note | ✅ |
| VEST-05 | runes ports, sweep #14 zero | grep + svelte-check + build + render probe | Pattern 7 loop (all 0); `yarn workspace @openvaa/docs check` (0 errors, 0 warnings; HEAD: 611 files 0/0); `yarn workspace @openvaa/docs build`; render probe class strings byte-identical for `{}` and `{color:'secondary',size:'sm'}` | any non-zero count; check errors/warnings; class-string diff | n/a |
| VEST-06 | todo closed; comment current | file presence + read | `test -f .planning/todos/done/2026-08-28-vite-envdir-root-would-fix-six-empty-constants.md && ! test -f .planning/todos/pending/2026-08-28-vite-envdir-root-would-fix-six-empty-constants.md`; `grep -c "over \`apps/frontend\`" apps/frontend/vite.config.ts` → 0 | file in pending; stale phrase present | n/a |
| VEST-07 | gate-evidence gone | filesystem | `test ! -e .planning/quick/261001-n8y-remove-the-legacy-src-lib-i18n-translati/gate-evidence && git status --porcelain -- .planning/quick/261001-n8y-remove-the-legacy-src-lib-i18n-translati/gate-evidence` → empty | directory exists or porcelain non-empty | n/a |
| VEST-08 | no new hygiene hits; todos and VESTIGES reconciled | script delta + read | `bash .claude/skills/ship-review-stack/sources/hygiene-grep-report.sh <before.tsv>`: every gate row `delta ≤ 0`; `yarn assert:comment-hygiene` exit 0 | any positive delta; guard non-zero | n/a |
| VEST-09 | full gate set | gates | `yarn typecheck`; `yarn lint:check`; `yarn format:check`; `yarn test:unit`; `yarn build` (turbo builds frontend **and** docs); `yarn workspace @openvaa/docs check`; Pattern 9 audit comparison; `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/167-gate` (background + poll) | any non-zero exit (audit: any GHSA only in AFTER); E2E: any unexpected, flaky, skipped or did-not-run | n/a |

### Sampling Rate
- **Per task commit:** the quick command(s) of the requirement touched, plus `yarn workspace @openvaa/frontend typecheck` for any frontend edit.
- **Per plan:** `yarn test:unit` and `yarn lint:check`. If `lint:check` is red, run the later chain links directly before concluding anything about them.
- **Phase gate (167-03):** the full VEST-09 set, with E2E last and one clean run.

### Wave 0 Gaps
None. Existing test infrastructure covers every requirement. The only test-file change is the in-place strengthening of `safeGetSession.test.ts`. No docs test file may be added, because of the `assert:unit-coverage` Check 1.

## Security Domain

`security_enforcement` is absent from `.planning/config.json`, so it is treated as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes (test-only) | `safeGetSession` verify-then-read order is unchanged (D-02 keeps auth paths untouched); the strengthened test pins its round trips |
| V3 Session Management | yes (test-only) | per-request memo dropped at `endRequest`; cases 9–10 pin "no memo across requests" |
| V4 Access Control | yes | removes an API route that bypassed the hook gate (`isApiRoute` → `resolve(event)`) |
| V5 Input Validation | yes | the removed route validated `resource` only with `new URL()`. There was no host allow-list (A1) |
| V6 Cryptography | no | — |
| V14 Configuration | yes | removes dead env keys and a deployment disk; manifests declare what they import (js-yaml) |

### Known Threat Patterns for this change

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthenticated server-side fetch of attacker-chosen absolute URL (`/api/cache?resource=`), always mounted regardless of `PUBLIC_CACHE_ENABLED` (A1: by reading) | Information disclosure / SSRF | **Removed by D-09** |
| Cross-user cache poisoning: cookie-authenticated same-origin responses cached by URL key (fact 8, unconfirmed) | Information disclosure | Removed by D-09 |
| Probe or variant file accidentally committed (V1/V2/V3, lint-red file, docs probe config) | Tampering | `git status --porcelain` empty and `git diff --exit-code` on `safeGetSession.ts` after each control |
| Secret values copied out of `gate-evidence/` into planning artefacts | Information disclosure | D-23: categories only, never values. Scan with counts (`grep -rlE … | wc -l`), never print matches |
| Phantom dependency resolved through hoisting (`llm` → `js-yaml`) breaking for published consumers | Tampering / availability | D-13 declares it, and the tsup dist check proves it is external |

## Sources

### Primary (HIGH confidence)
- Codebase at HEAD `ec0cd7810`, read this session: `safeGetSession.ts` / `.test.ts`, `routes/api/cache/+server.ts`, `cachifyUrl.ts`, `authHeaders.ts`, `universalAdapter.ts` / `.type.ts` / `.test.ts`, `universalApiRoutes.ts`, both `constants.ts`, the 7 auth mocks, `.env.example`, both `docker-compose.dev.yml`, `render.example.yaml`, `apps/frontend/eslint.config.mjs`, `apps/docs/eslint.config.js`, `packages/shared-config/{package.json,eslint.config.mjs}`, all affected `package.json`s, `.yarnrc.yml`, `security/audit-baseline.json`, `scripts/assert-dependency-audit.mjs`, `auditBaselineShape.test.ts`, docs `OpenVAALogo.svelte` / `.type.ts` / `PeerNavigation.svelte`, `svelte.config.js`, `vite.config.ts`, `CLAUDE.md`, the three `+layout.server.ts` docblocks, `routes/README.md`, `packages/llm/src/prompts/promptRegistry.ts`, `argument-condensation/README.md`
- Executed this session: `yarn audit:deps` (HEAD) and the export audits of HEAD and of `72b336729`; frontend lint and print-config under the original and the D-12 configs; docs config load on Node 22.22.1 and 24.14.1 with import bisection; docs lint-red probe; scratch harness for the safeGetSession counts with V1/V2; Svelte server-render probe of the docs logo; `yarn workspace @openvaa/docs check`; `hygiene-grep-report.sh --assert-clean`; `assert-comment-hygiene.mjs`; `assert-env-pair-registry.mjs`; `yarn why` for each removal candidate; `package-legitimacy check`
- Installed package source: `apps/frontend/node_modules/eslint-plugin-svelte` 2.46.1 config exports; `node_modules/tsup/dist/chunk-VGC3FXLU.js` `getProductionDeps`

### Secondary (MEDIUM confidence)
- [CITED: tailwindcss.com/docs/detecting-classes-in-source-files]: class detection is literal-text scanning

### Tertiary (LOW confidence)
- None relied upon

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. No new packages; installed versions read from disk.
- Architecture: HIGH. Every removal surface comes from a full-repo grep plus reading each hit.
- Pitfalls: HIGH. Pitfalls 1–4 were each reproduced this session, 5–6 are reasoned with a cheap execution-time check, and 7–8 come from project memory.

**Research date:** 2026-10-01
**Valid until:** re-derive all counts at the post-166 tip (the content-anchor rule). The audit snapshot is valid for hours only, which is the reason for Pattern 9.
