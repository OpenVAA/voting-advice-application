# Phase 167: Origin/main Vestige Cleanup - Pattern Map

**Mapped:** 2026-10-01
**Files analyzed:** ~40 (grouped below by role)
**Analogs found:** 7 / 7 file groups (all analogs are git-tracked; verified with `git ls-files`)

Content anchors are used throughout (memory rule: never line numbers in plans). Line numbers shown here are
orientation-only at HEAD; re-derive at execution.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `apps/frontend/src/lib/supabase/safeGetSession.test.ts` | test | request-response (auth round trips) | itself (`fakeClient`, case 1 `getSession` assertion) | exact (in-place strengthen) |
| `apps/frontend/eslint.config.mjs` | config | build tooling | `apps/docs/eslint.config.js` (explicit `import svelte`) | role-match, **name differs** (v2 vs v3 plugin) |
| `apps/frontend/src/routes/api/cache/+server.ts`, `lib/api/utils/cachifyUrl.ts(+test)`, `lib/api/utils/authHeaders.ts(+test)` | route / utility | request-response | n/a (delete) | — |
| `apps/frontend/src/lib/api/base/universalAdapter.ts`, `.type.ts`, `.test.ts`, `universalApiRoutes.ts`, `apiRouteDataProvider.ts` | service | request-response | itself (remove branch) | exact |
| `apps/frontend/src/lib/server/constants.ts`, `lib/utils/constants.ts` + 9 test mocks (7 auth + `supabaseFeedbackWriter.test.ts`, `supabaseAdapter.test.ts`) | config / test | env | itself | exact |
| `route.test.ts`, `voterAppPath.test.ts` | test | transform | live route `apps/frontend/src/routes/api/auth/logout/+server.ts` | exact |
| `.env.example`, root + `apps/frontend` `docker-compose.dev.yml`, `render.example.yaml`, `apps/frontend/src/routes/README.md`, `CLAUDE.md` § Deployment, 3 `+layout.server.ts` docblocks | config / docs | — | n/a (removals; hygiene rewrite) | — |
| `packages/llm/package.json` (add js-yaml) | config (manifest) | — | `packages/question-info/package.json` (`"js-yaml": "catalog:"`) | exact |
| `packages/{question-info,argument-condensation}/package.json`, `apps/docs/package.json`, `apps/frontend/package.json`, `argument-condensation/README.md` | config (manifest) | — | n/a (removals) | — |
| `security/audit-baseline.json` | config (data) | — | itself (row 1115806 + `note`) | exact |
| `apps/docs/src/lib/components/openVAALogo/OpenVAALogo.svelte` + `OpenVAALogo.type.ts` | component | — | `apps/frontend/src/lib/components/openVAALogo/OpenVAALogo.svelte` | exact (minus `concatClass`) |
| `apps/docs/src/lib/components/PeerNavigation.svelte` | component | — | `apps/docs/src/lib/components/Navigation.svelte` | exact |
| `apps/frontend/vite.config.ts` (comment) | config | — | `apps/frontend/svelte.config.js` (`env: { dir: repoRoot }` comment) | role-match |
| `.planning/todos/...` (close env-dir, notes on 2 adapter todos, new D-02 todo) | planning | — | existing `.planning/todos/pending/*.md` | exact |

## Pattern Assignments

### `safeGetSession.test.ts` (test) — D-06/D-07/D-08

**Analog:** itself. Current fixture (anchor `function fakeClient(initial: Session | null)`):
```typescript
function fakeClient(initial: Session | null) {
  const storage: { session: Session | null } = { session: initial };
  const getSession = vi.fn(async () => ({ data: { session: storage.session } }));
  const getUser = vi.fn<() => Promise<{ data: { user: User | null }; error: Error | null }>>();
  const supabase = { auth: { getSession, getUser } } as unknown as SupabaseClient<SupabaseDatabase>;
  return { supabase, storage, getSession, getUser };
}
```
Imports today: `import { describe, expect, it, vi } from 'vitest';` — add `afterEach, beforeEach`.

**Assertion pattern to replicate in all 10 cases** (only case 1 has it now, anchor `it('verifies a token once`):
```typescript
expect(getUser).toHaveBeenCalledTimes(1);
// One read per call, plus the one read that follows the single verification.
expect(getSession).toHaveBeenCalledTimes(3);
```
Cases 2–10 currently destructure only `{ supabase, getUser }` / `{ supabase, storage, getUser }` — add `getSession`.
Exact counts per case: RESEARCH § Pattern 1 table (HEAD column), e.g. case 5 = getUser 2 / getSession 5, case 9 = 3 / 6.

**Proxy guard:** wrap `{ getSession, getUser }` and `{ auth }` in a `strict(target, path, allowed)` Proxy throwing a named
`UnexpectedClientAccess` error and recording into `unexpectedAccesses`; `beforeEach` clears, `afterEach` asserts `[]`.
Pass `symbol` and `then` through as `undefined`. Full sketch: RESEARCH § Pattern 1 "Proxy fixture".

**Negative controls (never committed):** V1 delete `const cached = verifiedUsers.get(accessToken); if (cached) return cached;`
in `verify()`; V2 insert `await supabase.auth.getSession();` after `if (error || !user) return null;` in `verifyStored`;
optional V3 stray `supabase.from('candidates')`. Command:
`cd apps/frontend && yarn vitest run src/lib/supabase/safeGetSession.test.ts > "$LOG" 2>&1; echo "exit=$?"`, then
`git diff --exit-code -- apps/frontend/src/lib/supabase/safeGetSession.ts`.

---

### `apps/frontend/eslint.config.mjs` (config) — D-12

**Analog:** `apps/docs/eslint.config.js` (whole file):
```javascript
import { default as sharedConfig } from '@openvaa/shared-config/eslint';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';

export default [prettier, ...svelte.configs.prettier, ...sharedConfig];
```
**Do NOT copy `svelte.configs.prettier` literally** — frontend resolves eslint-plugin-svelte 2.46.1 where it is an
eslintrc object (`TypeError: ... not iterable`, exit 2). Use `...svelte.configs['flat/prettier']`.

**Lines to delete** (current head of the file):
```javascript
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
...
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});
```
and replace anchor `...compat.extends('plugin:svelte/prettier'),` with `...svelte.configs['flat/prettier'],`.
Keep import order sorted (`@openvaa/...`, `@typescript-eslint/parser`, `eslint-plugin-svelte`, `globals`, `svelte-eslint-parser`).
Before/after protocol: RESEARCH § Pattern 3 (lint JSON diff + `--print-config` diff; `.svelte` differs only in processor serialisation).
Knock-on recommendation: remove `@eslint/eslintrc` and `@eslint/js` from `apps/frontend/package.json` in commit ④ (shared-config declares both).

---

### `UniversalAdapter.fetch` and the cache surfaces (service) — D-09

**Analog:** itself. Code to remove in `apps/frontend/src/lib/api/base/universalAdapter.ts`:
```typescript
import { constants } from '$lib/utils/constants';
import { hasAuthHeaders } from '../utils/authHeaders';
import { cachifyUrl } from '../utils/cachifyUrl';
...
    { authToken, disableCache }: FetchOptions = {}
...
    const isCacheEnabled =
      constants.PUBLIC_CACHE_ENABLED &&
      !disableCache &&
      ...
      !hasAuthHeaders(fullHeaders);
    const maybeCachedUrl = isCacheEnabled ? cachifyUrl(url) : url;
```
→ fetch `url` directly; rewrite the class docstring ("wrapped in possible caching") and the `fetch` docstring list
(anchor "The `disableCache` option is not set"). Full removal inventory incl. 6 surfaces fact 9 missed
(`universalApiRoutes.ts` `cacheProxy`, `authHeaders.ts(+test)`, `routes/README.md`, `CLAUDE.md` § Deployment,
3 `+layout.server.ts` docblocks): RESEARCH § Pattern 2. Zero-hit `git grep` check is in the same section.

**Test mocks pattern:** `vi.mock('$lib/server/constants', …)` / `vi.mock('$lib/utils/constants', …)` objects in the 7 auth
tests — delete only the keys (`BACKEND_API_TOKEN`, `CACHE_DIR|TTL|LRU_SIZE|EXPIRATION_INTERVAL`, `PUBLIC_*_BACKEND_URL`,
`PUBLIC_CACHE_ENABLED`); in `supabaseFeedbackWriter.test.ts` / `supabaseAdapter.test.ts`
`mockConstants: { PUBLIC_PROJECT_ID: '', PUBLIC_CACHE_ENABLED: false }` → `{ PUBLIC_PROJECT_ID: '' }`.
`universalAdapter.test.ts`: delete `describe('fetch (with caching enabled)'` and its `vi.mock('$lib/utils/constants'`; rename
`describe('fetch (without caching)'` → `'fetch'`.

---

### Manifests (config) — D-05, D-13–D-19

**Analog for the add (`packages/llm/package.json`):** `packages/question-info/package.json` uses
`"@types/js-yaml": "catalog:"` (devDependencies) and `"js-yaml": "catalog:"` (dependencies). Target block today:
```json
"dependencies": {
  "@ai-sdk/google": "^2.0.20",
  "@ai-sdk/openai": "^2.0.31",
  "@openvaa/app-shared": "workspace:^",
  "@openvaa/core": "workspace:^",
  "ai": "^5.0.0",
  "jsonrepair": "^3.13.0",
  "openai": "^4.96.0",
  "zod": "catalog:"
}
```
Insert `"js-yaml": "catalog:"` alphabetically (after `ai`) in commit ③; remove `jsonrepair` in commit ④. Alphabetical key
order, `catalog:` for catalog-pinned deps (`.yarnrc.yml` catalog: `js-yaml ^4.1.0`, `@types/js-yaml ^4.0.9`).
Verification: `packages/llm/dist/index.js` stops inlining (`YAMLException` count 0, `from "js-yaml"` ≥ 1); lockfile has no
`js-yaml@npm:` resolution change. Commit `yarn.lock` with each manifest change (`--immutable` in CI).

---

### `security/audit-baseline.json` (data) — D-20

**Analog:** itself. Row to delete (anchor `"id": 1115806`):
```json
{
  "id": 1115806,
  "package": "lodash",
  "severity": "high",
  "ghsa": "GHSA-r5fr-rjxr-66jc",
  "issue": "lodash vulnerable to Code Injection via `_.template` imports key names",
  "via": "@testing-library/jest-dom@6.6.3",
  ...
}
```
`note` prefix `"These 70 findings (64 high, 6 critical)"` → `"These 69 findings (63 high, 6 critical)"`. Keep the rest of the
note and every other field verbatim (no `recorded` change). Never `--update-baseline`. Check with the `node -e` severity count
(RESEARCH § Pattern 10), `yarn workspace @openvaa/dev-seed test:unit`, `yarn format:check`.

---

### `apps/docs/.../OpenVAALogo.svelte` (component) — D-21

**Analog:** `apps/frontend/src/lib/components/openVAALogo/OpenVAALogo.svelte`:
```svelte
<script lang="ts">
  import { concatClass } from '$lib/utils/components';
  import type { OpenVAALogoProps } from './OpenVAALogo.type';

  let { title = 'OpenVAA', color = 'neutral', size = 'md', ...restProps }: OpenVAALogoProps = $props();

  // Create class names
  let classes = $derived.by(() => {
    let c: string;
    switch (size) {
      case 'xs': c = 'h-14 pt-1'; break;
      ...
      default: c = 'h-24 pt-4';
    }
    if (color != null) { c += ` fill-${color} inline`; }
    return c;
  });
</script>

<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 458.05 91.74" {...concatClass(restProps, classes)}>
```
Differences required for docs: no `concatClass` (destructure `class: className`, use `{...restProps} class={[classes, className]}`);
default `color = 'primary'`, default size `'h-28 pt-4'`; **keep the literal `' fill-primary inline'` / `' fill-secondary inline'` /
`' fill-neutral inline'` switch** (Tailwind v4 source detection) plus the trailing append for byte-identical output.
Docstring bullet "Any valid attributes of a `<svg>` element." can be copied from the twin; fix `Default: 'neutral'` → `'primary'`
in the component header and `@default 'neutral'` in `OpenVAALogo.type.ts`. Sketch: RESEARCH § Pattern 6.

---

### `apps/docs/.../PeerNavigation.svelte` (component) — D-03

**Analog:** `apps/docs/src/lib/components/Navigation.svelte`:
```svelte
  import { page } from '$app/state';
  ...
  const url = $derived(page.url);
```
Current (to replace):
```svelte
  import { page } from '$app/stores';
  import { getPeerNavigation } from '$lib/utils/navigation';

  $: peerNav = getPeerNavigation($page.url);
```
→ `import { page } from '$app/state';` and `const peerNav = $derived(getPeerNavigation(page.url));`. Markup unchanged.

---

### `apps/frontend/vite.config.ts` comment — D-22

**Analog:** the `apps/frontend/svelte.config.js` comment beside `env: { dir: repoRoot }` (says `$env/*/public` exposes only
`PUBLIC_`-prefixed keys; `process.env` overrides the file even when empty). Replace the sentence anchored on
"SvelteKit's own `loadEnv` over `apps/frontend`" with a present-tense statement (suggested text in RESEARCH § Pattern 8).
No "used to"/"previously".

## Shared Patterns

### Comment Hygiene
**Source:** `CLAUDE.md` § Comment Hygiene; `scripts/assert-comment-hygiene.mjs`; `.claude/skills/ship-review-stack/sources/hygiene-grep-report.sh`
**Apply to:** every touched docblock (`universalAdapter.ts`, 3 `+layout.server.ts`, `vite.config.ts`, OpenVAALogo header).
Touched comment judged as a whole; gate on delta (`--save-baseline` before, compare after) since `--assert-clean` is red at HEAD.

### Gate exit codes
**Apply to:** all verification: `cmd > "$LOG" 2>&1; echo "exit=$?"` — never through a pipe.

### Temporary probes
**Apply to:** V1/V2/V3 variants, lint-red files (`apps/frontend/src/lib/zzLintRedProbe.ts`), docs probe config
`apps/docs/.lint-red-probe.eslint.config.js` (loads `eslint-config-prettier` via `createRequire`; the real docs config fails to
load with ERR_INTERNAL_ASSERTION and docs has no `lint` script). Each must end with clean `git status --porcelain`.

### Planning commits
`.planning` commits separate, `git commit --no-verify`, verify blob non-empty.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| Deleted files (`api/cache/+server.ts`, `cachifyUrl.ts`, `authHeaders.ts` + tests) | route/utility | — | Pure deletions; no pattern needed |
| `.env.example`, `docker-compose.dev.yml` x2, `render.example.yaml` | config | — | Block removals; keep root compose `PUBLIC_SUPABASE_URL` line intact (regex-captured by `packages/dev-seed/tests/localSupabaseUrl.test.ts`) |

## Metadata

**Analog search scope:** `apps/frontend/src/lib/{supabase,api,components}`, `apps/docs/src/lib/components`, `apps/docs/eslint.config.js`, `packages/*/package.json`, `security/`
**Files scanned:** ~15
**Pattern extraction date:** 2026-10-01
