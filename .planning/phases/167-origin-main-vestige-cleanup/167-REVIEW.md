---
phase: 167-origin-main-vestige-cleanup
reviewed: 2026-10-02T00:00:00Z
depth: standard
files_reviewed: 46
files_reviewed_list:
  - .env.example
  - CLAUDE.md
  - apps/docs/package.json
  - apps/docs/src/lib/components/PeerNavigation.svelte
  - apps/docs/src/lib/components/openVAALogo/OpenVAALogo.svelte
  - apps/docs/src/lib/components/openVAALogo/OpenVAALogo.type.ts
  - apps/frontend/docker-compose.dev.yml
  - apps/frontend/eslint.config.mjs
  - apps/frontend/package.json
  - apps/frontend/src/lib/api/adapters/apiRoute/dataProvider/apiRouteDataProvider.ts
  - apps/frontend/src/lib/api/adapters/supabase/feedbackWriter/supabaseFeedbackWriter.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.test.ts
  - apps/frontend/src/lib/api/base/universalAdapter.test.ts
  - apps/frontend/src/lib/api/base/universalAdapter.ts
  - apps/frontend/src/lib/api/base/universalAdapter.type.ts
  - apps/frontend/src/lib/api/base/universalApiRoutes.ts
  - apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts
  - apps/frontend/src/lib/api/utils/auth/__tests__/callback-endpoint.test.ts
  - apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts
  - apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.test.ts
  - apps/frontend/src/lib/api/utils/auth/providers/authorize-fail-closed.test.ts
  - apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts
  - apps/frontend/src/lib/api/utils/auth/providers/signicat.test.ts
  - apps/frontend/src/lib/api/utils/authHeaders.test.ts
  - apps/frontend/src/lib/api/utils/authHeaders.ts
  - apps/frontend/src/lib/api/utils/cachifyUrl.test.ts
  - apps/frontend/src/lib/api/utils/cachifyUrl.ts
  - apps/frontend/src/lib/routes/route.test.ts
  - apps/frontend/src/lib/routes/voterAppPath.test.ts
  - apps/frontend/src/lib/server/constants.ts
  - apps/frontend/src/lib/supabase/safeGetSession.test.ts
  - apps/frontend/src/lib/utils/constants.ts
  - apps/frontend/src/routes/+layout.server.ts
  - apps/frontend/src/routes/README.md
  - apps/frontend/src/routes/admin/+layout.server.ts
  - apps/frontend/src/routes/api/cache/+server.ts
  - apps/frontend/src/routes/candidate/+layout.server.ts
  - apps/frontend/vite.config.ts
  - docker-compose.dev.yml
  - packages/argument-condensation/README.md
  - packages/argument-condensation/package.json
  - packages/llm/package.json
  - packages/question-info/package.json
  - render.example.yaml
  - security/audit-baseline.json
  - yarn.lock
findings:
  critical: 0
  warning: 2
  info: 4
  total: 6
status: issues_found
---

# Phase 167: Code Review Report

**Reviewed:** 2026-10-02
**Depth:** standard
**Files Reviewed:** 46
**Status:** issues_found

## Summary

I reviewed the diff `8c519ac97..HEAD` for the 46 non-planning files. The six areas the caller flagged hold up:

- **`UniversalAdapter.fetch`.** After the cache-branch removal it is correct. `url` is passed straight through, the three error messages use `url` consistently, and the `authToken` bearer header path is unchanged. No caller still passes `disableCache`. `FetchOptions` is narrowed to `authToken` only, and `get`/`post` forward their leftover options into it unchanged.
- **Leftover env keys.** None remain outside `apps/docs` and `.planning`. A whole-tree grep for `BACKEND_API_TOKEN`, `CACHE_*`, `PUBLIC_CACHE_ENABLED`, `PUBLIC_{BROWSER,SERVER}_BACKEND_URL`, `cacheProxy`, `disableCache`, `hasAuthHeaders`, `cachifyUrl`, `api/cache` and `/var/data/cache` finds only the docs pages that CONTEXT assigns to Phase 168. `.env.example`, both compose files, `render.example.yaml`, the Dockerfile, the turbo configs and CI workflows are clean.
- **`safeGetSession` Proxy test.** The pinned `getSession` counts match the helper's real call pattern, and the suite passes: 43 files and 702 tests across `src/lib/api`, `src/lib/routes` and `src/lib/supabase`.
- **ESLint switch.** I ran `eslint --print-config` against the pre-phase and current `apps/frontend/eslint.config.mjs` for a `.ts` and a `.svelte` file. The `.ts` output is byte-identical. The `.svelte` output differs only in the processor label (`eslint-plugin-svelte@2.46.1` vs `svelte/svelte`). The rule set is unchanged.
- **Dependency removals.** No removed dependency is still imported, named in a config string or invoked as a script binary.
  - `jsonrepair`, `dotenv` (argument-condensation), `flat-cache`, `@testing-library/jest-dom`, `@vitest/coverage-v8`, `vitest-browser-svelte`, `@tailwindcss/forms`, `rehype-autolink-headings` and `unist-util-visit` have no importer left.
  - `assert-declared-binaries` reports 0 violations.
  - Root still declares `dotenv`, which `tests/playwright.config.ts` and `tests/seed-test-data.ts` import.
  - `js-yaml` and `@types/js-yaml` are now declared in the package that imports them, `@openvaa/llm`.
- **Guards.** `assert:comment-hygiene`, `assert:env-pair-registry`, `assert:declared-binaries`, `assert:no-session-in-loads` and `assert:edge-env-defaults` all exit clean.

Two documentation and maintainability defects and four minor items remain.

## Warnings

### WR-01: `audit-baseline.json` js-yaml and flatted rows now describe dependents that no longer exist

**File:** `security/audit-baseline.json:193-194, 220-221, 148, 157`
**Issue:** The phase moved `js-yaml` out of `@openvaa/argument-condensation` and into `@openvaa/llm`, and removed `flat-cache@6.1.20` from the tree. The baseline rows were not touched, except for the lodash row that was dropped. This leaves two kinds of stale attribution.
- **js-yaml.** Ids 1123911 and 1138115 still say `via: "@eslint/eslintrc@3.3.3, @openvaa/argument-condensation (workspace)"`. The shared rationale still says "plus @openvaa/argument-condensation, an experimental package not shipped in the app". argument-condensation no longer depends on `js-yaml`. The actual dependent is `@openvaa/llm`, which `apps/frontend/src/lib/server/llm/llmProvider.ts` imports at runtime in the server bundle, so "not shipped in the app" is now wrong as written. The accepted risk is probably still acceptable. `promptRegistry.ts` parses only repo-local `.yaml` prompt files. But the written justification, which is the only record a later reviewer sees, is false.
- **flatted.** Ids 1114526 and 1115357 list `flat-cache@6.1.20`, which no longer resolves in `yarn.lock`. Only `flat-cache@4.0.1` remains. CONTEXT D-09 said these rows "stay"; that is true of the 4.0.1 half only.

The gate subtracts by advisory id, so nothing turns red, which is why this slips through. The count in the `note` (69 findings: 63 high and 6 critical) does match the rows.
**Fix:** In a reviewed baseline edit, change the js-yaml `via` to `@eslint/eslintrc@3.3.3, @openvaa/llm (workspace)`. Reword the rationale to say the dependent is `@openvaa/llm`, which parses only its own checked-in prompt YAML. Drop `flat-cache@6.1.20` from the two flatted `via` strings.

### WR-02: Removing docs' `globals` silently changed the lint environment of every workspace

**File:** `apps/docs/package.json` (removed `"globals": "^16.5.0"`); consumer `packages/shared-config/eslint.config.mjs:10`
**Issue:** `@openvaa/shared-config` imports `globals` but does not declare it. It resolved through hoisting. Removing the docs entry moved the root `node_modules/globals` from 16.5.0 to 15.14.0. I confirmed 15.14.0 at the root, and only `apps/frontend` declares `globals` now. The 167-04 SUMMARY records the effect: the effective `languageOptions.globals` shrank from 1193 to 1151 keys for every workspace that lints through shared-config. It judged the change harmless and filed `.planning/todos/pending/2026-10-02-declare-globals-in-shared-config.md`.

This is a real behaviour change to the shared lint config that rode along with a hygiene edit. The version a phantom import resolves is still decided by whichever workspace manifest hoists last. The next dependency removal or addition can move it again with no signal.
**Fix:** Declare `"globals": "catalog:"` in `packages/shared-config/package.json` and run `yarn install`. That pins the import to the catalog's 15.14.0 and makes the change deliberate. It also removes the phantom edge the todo describes.

## Info

### IN-01: `OpenVAALogo` computes the fill class twice

**File:** `apps/docs/src/lib/components/openVAALogo/OpenVAALogo.svelte:51-62`
**Issue:** The `switch (color)` appends `' fill-primary inline'`, `' fill-secondary inline'` or `' fill-neutral inline'`. The `if (color != null)` block directly below it then appends `` ` fill-${color} inline` `` for every non-null colour. So every predefined colour produces a duplicated `fill-X inline fill-X inline` class string. The runes port copied this from the Svelte 4 original. The switch is not dead. Its literal strings are what let Tailwind's scanner emit the `fill-*` utilities, which the template-literal branch alone would not.
**Fix:** Keep the switch for the scanner and make the generic branch an `else`.
```ts
switch (color) {
  case 'primary': c += ' fill-primary inline'; break;
  case 'secondary': c += ' fill-secondary inline'; break;
  case 'neutral': c += ' fill-neutral inline'; break;
  default: if (color != null) c += ` fill-${color} inline`;
}
```

### IN-02: The strict-client Proxy traps only `get`

**File:** `apps/frontend/src/lib/supabase/safeGetSession.test.ts:34-45`
**Issue:** `strict()` records and throws on reading an unlisted member. It does not trap `set`, `has`, `ownKeys` or `deleteProperty`. `Object.keys(supabase)`, `'from' in supabase` and `supabase.from = …` on the client all pass silently. Only the `get` path that the helper uses today is pinned. The "zero other client calls" claim is therefore narrower than the comment on `unexpectedAccesses` suggests. The `afterEach` assertion also records an access that the helper might swallow in a `try/catch`, which is good. It would double-report a failure for a test that already failed.
**Fix:** Optionally add `has`, `set` and `ownKeys` traps that push to `unexpectedAccesses`, or narrow the wording to "reads of members other than...".

### IN-03: The docs app's ESLint config is not exercised by any gate

**File:** `apps/docs/package.json:11-17` (scripts); `apps/docs/eslint.config.js`
**Issue:** `apps/docs` has `lint:local` and `lint:full` but no `lint` script, so `turbo run lint` and `yarn lint:check` skip it. Invoking `eslint` there directly crashes with `ERR_INTERNAL_ASSERTION`, which the 167-04 SUMMARY records as pre-existing. The six lint-related devDependency removals in this phase (`@eslint/js`, `@typescript-eslint/*`, `typescript-eslint`, `globals`, `eslint-plugin-simple-import-sort`, `@eslint/compat`) were therefore checked only through a temporary probe config, not through any standing check. The config still imports only `eslint-config-prettier`, `eslint-plugin-svelte` and `@openvaa/shared-config`, all declared, so I found no breakage.
**Fix:** Out of scope here; the SUMMARY routes it to Phase 168 (D-15). Fix the Node assertion and add a `lint` script so the docs app joins `lint:check`.

### IN-04: Undeclared imports already present at the phase base

**File:** `packages/argument-condensation/src/core/condensation/responseValidators/responseWithArguments.ts:1`; `packages/question-info/src/core/infoGeneration.type.ts:1`; `apps/docs/scripts/generate-component-docs.ts:6`
**Issue:** While auditing the removals I cross-checked every package's imports against its `package.json`. Three phantom dependencies surfaced. None was introduced by this phase, and I confirmed each against `8c519ac97`. `zod` is imported by argument-condensation but not declared there. `@openvaa/app-shared` is imported by question-info but not declared there. `glob` is imported by `apps/docs/scripts/*.ts` but not declared there. They are the same class as WR-02: they work only through hoisting, and a removal elsewhere can break them.
**Fix:** Declare `zod` (`catalog:`) in argument-condensation, `@openvaa/app-shared` (`workspace:^`) in question-info, and `glob` in docs.

---

_Reviewed: 2026-10-02_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
