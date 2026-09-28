# Phase 71: Frontend Strict-Typing Cleanup — Pattern Map

**Mapped:** 2026-05-09
**Phase shape:** typing-cleanup over 95 enumerated errors (no new files; all sites are MODIFY-in-place against the cluster lists in `71-RESEARCH.md`).
**Files keyed by:** rule cluster (per D-01 plan split), not by file.
**Analog coverage:** 5 / 5 clusters have lint-clean exemplars in the codebase.

> **Cross-reference:** the per-file:line error inventory lives in `71-RESEARCH.md` §Cluster Analysis (Cluster 1 sub-clusters 1a–1c, Cluster 2, Cluster 3, Cluster 4). This document supplies the **paste-ready code excerpts** for each cluster's `<read_first>` planner directive.

---

## Convention Findings (load-bearing for D-04)

Verified by `git grep` at HEAD `feat-gsd-roadmap`:

| Convention | Status in codebase | Implication for Phase 71 |
| --- | --- | --- |
| `// reason: <one-line>` | **Zero matches** in `apps/frontend/src/` and `packages/` | **D-04 introduces this fresh.** Plan-71-01 anchor docs should call it out so it's grep-able for future sweeps. |
| File-level `/* eslint-disable <rule> -- <reason> */` | 2 matches: `apps/frontend/src/hooks.server.ts:1`, `apps/frontend/src/hooks.ts:1` (both for `func-style`) | **Canonical exemplar** for the SvelteKit type-binding disable wording. |
| `// eslint-disable-next-line @typescript-eslint/no-explicit-any` (no inline reason) | 3 matches: `popupComponent.type.ts:26`, `components.ts:34`, `buildRoute.ts:58` | Existing precedent for un-justified disables. **D-04 explicitly requires Phase 71 disables to carry a `// reason:` line — these legacy sites stay un-touched.** |
| `// eslint-disable-next-line @typescript-eslint/no-unused-expressions` | 3 matches: `ConstituencySelector.svelte:74-76`, `register/+page.svelte:49` | Existing precedent for `$effect`-block disables; Plan-71-04's `void entities;` fix avoids needing this. |

**Existing `func-style` disable wording (lift verbatim where applicable):**

```ts
// Source: apps/frontend/src/hooks.server.ts:1 + apps/frontend/src/hooks.ts:1
/* eslint-disable func-style -- SvelteKit hooks use typed const exports by convention */
```

For the Phase 71 inline (next-line) form per D-02 fallback:

```ts
// eslint-disable-next-line func-style -- reason: SvelteKit RequestHandler type-binding requires const-form annotation
export const GET: RequestHandler = async ({ url, locals }) => { … };
```

---

## Cluster 1 — `no-explicit-any` (67 errors)

### Sub-cluster 1a — Test mocks (44 errors, 4 files)

**Closest analog:** `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts` itself — the file already defines the `createMockSupabaseClient` factory and the `mockSupabase: ReturnType<typeof createMockSupabaseClient>` pattern (lines 38–75). The 38 `as any` casts are the residue of a partial migration; the type infrastructure is **already in place** in the same file.

**Imports to copy** (top of the test file, append to existing imports):

```ts
// Source: VERIFIED — apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts:5–6
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@openvaa/supabase-types';
```

**Existing factory + mock-type pattern (already in `supabaseDataProvider.test.ts:38–75` — DO NOT rewrite, just consume):**

```ts
// Source: VERIFIED — apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts:38-75
function createMockSupabaseClient() {
  const mockResponses: Record<string, { data: unknown; error: unknown }> = {};
  const mockRpcResponses: Record<string, { data: unknown; error: unknown }> = {};
  function createChain(table: string) { /* … */ }
  const client = {
    from: vi.fn((table: string) => createChain(table)),
    rpc: vi.fn((fnName: string, _params?: Record<string, unknown>) => { /* … */ }),
    _mockResponses: mockResponses,
    _mockRpcResponses: mockRpcResponses
  };
  return client;
}

let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
```

**New helper to introduce once at the top of each test file (after imports):**

```ts
type MockClient = ReturnType<typeof createMockSupabaseClient>;
// reason: createMockSupabaseClient is structural-only; SupabaseClient<Database> has 50+ methods we don't mock
const asSupabaseMock = (m: MockClient) => m as unknown as SupabaseClient<Database>;
```

**Replace pattern (BEFORE → AFTER):**

```ts
// BEFORE — apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts:80-85
provider.init({
  fetch: vi.fn(),
  serverClient: mockSupabase as any,           // ← all 38 sites in this file follow this shape
  locale: 'en',
  defaultLocale: 'en'
});

// AFTER
provider.init({
  fetch: vi.fn(),
  serverClient: asSupabaseMock(mockSupabase),
  locale: 'en',
  defaultLocale: 'en'
});
```

**For `(result as any).foo` assertion casts** (e.g., lines 136-139, 230-231, 1374-1392, 1408-1479):

```ts
// BEFORE
expect((result as any).notifications.candidateApp.title).toBe('FI');

// AFTER — narrow with a local intersection type instead of `any`:
const r = result as Partial<DynamicSettings> & {
  notifications?: { candidateApp?: { title?: string; content?: string } };
};
expect(r.notifications?.candidateApp?.title).toBe('FI');
```

**Files this pattern applies to:**
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts` (38)
- `apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.test.ts` (5)
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts` (1)
- `apps/frontend/src/lib/api/adapters/supabase/utils/storageUrl.test.ts` (1 — fixture cast on `Json | null` / `Partial<StoredImage>` shape; does not need `asSupabaseMock`)

---

### Sub-cluster 1b — Production adapter code (17 errors, 2 files)

**Closest analog:** the same file's lines that already use `as Record<string, unknown>` instead of `any` — `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:88` (`const raw = (data?.customization ?? {}) as Record<string, unknown>;`) and the file's own imports at line 1–30 already pull domain types from `@openvaa/data` and `@openvaa/app-shared`. The file is its own exemplar: lines 95-99 use the typed-narrow pattern, lines 101-103 still carry `as any`.

**Imports to add at top of `supabaseDataProvider.ts` and `supabaseDataWriter.ts`:**

```ts
// Source: VERIFIED — packages/supabase-types/src/index.ts:1
import type { Json, Tables } from '@openvaa/supabase-types';
```

**Replace pattern for image / JSONB columns:**

```ts
// BEFORE — supabaseDataProvider.ts:101-103
result.publisherLogo = parseStoredImage(raw.publisherLogo as any, supabaseUrl);
result.poster        = parseStoredImage(raw.poster        as any, supabaseUrl);
result.candPoster    = parseStoredImage(raw.candPoster    as any, supabaseUrl);

// AFTER — Json is the structural superset; parseStoredImage runtime-guards on `path`
result.publisherLogo = parseStoredImage(raw.publisherLogo as Json | null, supabaseUrl);
result.poster        = parseStoredImage(raw.poster        as Json | null, supabaseUrl);
result.candPoster    = parseStoredImage(raw.candPoster    as Json | null, supabaseUrl);
```

**Replace pattern for `(n: any) => …` map callbacks** (`supabaseDataWriter.ts:220`):

```ts
// BEFORE
.map((n: any) => …)

// AFTER — use the SDK's inferred row type or Tables<'name'>['Row']
.map((n: Tables<'nominations'>['Row']) => …)
```

**Existing typed-narrow exemplar at line 88** (project's idiom for opaque JSONB blobs):

```ts
// Source: VERIFIED — apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:88
const raw = (data?.customization ?? {}) as Record<string, unknown>;
```

Use this idiom for any site where the column is genuinely opaque (rare after `Json | null` covers JSONB).

**Files this pattern applies to:**
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` (14 — lines 101, 102, 103, 154, 187, 210, 320, 351, 352, 447, 448, 478, 486, 527)
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` (3 — lines 205, 220, 349)

---

### Sub-cluster 1c — Route layout `data: any` props (5 errors, 5 files)

**Closest analog:** any SvelteKit route layout in the codebase that already imports from `./$types`. Spot-check at planner-time via `grep -rE "from './\\\$types'" apps/frontend/src/routes/ | head -5`. The pattern is SvelteKit-standard; `app.d.ts` already augments `App.Locals` so `LayoutData` resolves correctly.

**Replace pattern:**

```svelte
<!-- Source: SvelteKit standard — app.d.ts already augments App.Locals; ./$types is auto-generated -->
<script lang="ts">
  import type { LayoutData } from './$types';
  import type { Snippet } from 'svelte';
  // … other imports

  // BEFORE:
  // let { data, children }: { data: any; children: Snippet } = $props();
  // AFTER:
  let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>
```

**Pre-flight check for each site:** verify the colocated `+layout.ts` (or `+layout.server.ts`) exists and returns the fields downstream code reads. If `LayoutData` resolves to `Record<string, never>`, escalate (do not fall back to ad-hoc inline types).

**Files this pattern applies to:**
- `apps/frontend/src/routes/(voters)/(located)/+layout.svelte` (line 31)
- `apps/frontend/src/routes/(voters)/nominations/+layout.svelte` (line 21)
- `apps/frontend/src/routes/admin/(protected)/+layout.svelte` (line 17)
- `apps/frontend/src/routes/admin/(protected)/argument-condensation/+layout.svelte` (line 20)
- `apps/frontend/src/routes/admin/(protected)/question-info/+layout.svelte` (line 20)

---

## Cluster 2 — `naming-convention` (13 errors)

> **Reframe per researcher correction:** none of the 13 errors are DB-row snake_case sites (the boundary is already enforced via `mapRow()` + `COLUMN_MAP`). All 13 are **type-parameter `T` violations** (rule `^T[A-Z]`) plus one `_Unused` type-alias violation. Plan-71-02 is a mechanical token rename — D-02's "fix at source" applies but the work is `T → TX`, not snake_case → camelCase.

### Closest analog (already lint-clean, lift the rename pattern verbatim)

**File:** `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts` lines 10–22 — **already uses `TBase`/`TClass` type parameters that satisfy `^T[A-Z]`**. This is the exemplar for "what good looks like":

```ts
// Source: VERIFIED — apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts:10-22
type Constructor<TClass = UniversalAdapter> = abstract new (...args: Array<any>) => TClass;

export function supabaseAdapterMixin<TBase extends Constructor>(
  base: TBase
): Constructor<SupabaseAdapter> & TBase {
  abstract class WithMixin extends base { … }
}
```

### Rename pattern (BEFORE → AFTER)

```ts
// BEFORE — apps/frontend/src/lib/api/adapters/supabase/utils/mapRow.ts:9
export function mapRow<T extends Record<string, unknown>>(row: T): Record<string, unknown> { … }

// AFTER (T → TRow per RESEARCH.md §Cluster Analysis Cluster 2)
export function mapRow<TRow extends Record<string, unknown>>(row: TRow): Record<string, unknown> { … }
```

**Per-site rename table** lives in `71-RESEARCH.md` §Cluster Analysis Cluster 2 (13 rows: file → line → old → new). Plan-71-02 lifts it verbatim into its `## Error List`.

### Special case: `_Unused` type alias

```ts
// Source: VERIFIED — apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.helpers.ts:43-47
// (preserves TEntity slot for downstream consumers — kept for future generic extension)
export type _Unused<TEntity> = TEntity;
```

**Resolution:** delete lines 43-47 entirely. Researcher verified zero downstream consumers via `git grep "_Unused\b"`. No rename needed.

### Special case: `_TElement`

```ts
// Source: apps/frontend/src/lib/components/input/Input.type.ts:55
export type InputPropsBase<TValue, _TElement extends string = 'input'> = …
```

**Resolution per D-02:** rename `_TElement → TElement` (drop the unused-marker underscore; the rule applies to the leading-underscore-then-T pattern). Verify single in-file reference and update.

### Files this pattern applies to (13 sites)

| File | Line:col | Old → New |
| --- | --- | --- |
| `lib/api/adapters/supabase/utils/mapRow.ts` | 9:24, 22:28, 34:25 | `T` → `TRow` / `TObj` / `TRow` |
| `lib/components/input/Input.type.ts` | 55:36 | `_TElement` → `TElement` |
| `lib/contexts/filter/filterContext.svelte.test.ts` | 75:9 | `T` → `TVal` |
| `lib/contexts/voter/voterContext.svelte.ts` | 91:21 | `T` → `TItem` |
| `lib/dynamic-components/entityList/EntityListWithControls.helpers.ts` | 18:26, 19:27 | `T` → `TFn` |
| `lib/dynamic-components/entityList/EntityListWithControls.helpers.ts` | 47:13 | `_Unused` → **delete the line** |
| `lib/dynamic-components/entityList/EntityListWithControls.svelte` | 108:28 | `T` → `TFn` |
| `lib/dynamic-components/entityList/EntityListWithControls.test.ts` | 23:9, 40:9, 49:9 | `T` → `TVal` |

---

## Cluster 3 — `func-style` (11 errors)

### Mechanical sub-cluster (5 sites — clean conversion)

**Closest analog:** `apps/frontend/src/lib/api/adapters/supabase/utils/mapRow.ts:9, 22, 34` — uses `export function … {}` form throughout. The file is the canonical "what good looks like" template for any utility module.

```ts
// Source: VERIFIED — apps/frontend/src/lib/api/adapters/supabase/utils/mapRow.ts:9
export function mapRow<TRow extends Record<string, unknown>>(row: TRow): Record<string, unknown> {
  // …
}
```

**Replace pattern:**

```ts
// BEFORE — e.g., storageUrl.ts:31
const toUrl = (p: string) => `${supabaseUrl}/storage/v1/object/public/${p}`;

// AFTER
function toUrl(p: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${p}`;
}
```

**Mechanical sites (5):**
- `lib/api/adapters/supabase/utils/storageUrl.ts:31` (`toUrl`)
- `lib/contexts/app/getRoute.svelte.ts:36` (`buildFn`)
- `lib/contexts/filter/filterContext.svelte.ts:83` (`handler`)
- `lib/contexts/utils/StackedState.svelte.test.ts:81` (`mergeUpdater`)
- `lib/contexts/utils/persistedState.svelte.test.ts:36` (`createMockStorage`)
- `lib/dynamic-components/entityList/EntityListWithControls.svelte:91` (`handler`)
- `routes/+layout.svelte:164` (`handler` inside `$effect`)

### Type-binding sub-cluster (4 sites — inline-justified disable)

**Closest analog:** `apps/frontend/src/hooks.server.ts:1` — file-level `func-style` disable with `--` justification. **Lift the wording.**

```ts
// Source: VERIFIED — apps/frontend/src/hooks.server.ts:1 (canonical project-existing pattern)
/* eslint-disable func-style -- SvelteKit hooks use typed const exports by convention */
import { redirect } from '@sveltejs/kit';
// …
export const handle: Handle = async ({ event, resolve }) => { … };
```

For Phase 71's per-line form (use `// eslint-disable-next-line` for site-local disables vs. file-level):

```ts
// AFTER — paste-ready for results/+layout.ts:23, results/[[…]]/+page.ts:28, +server.ts:19, +server.ts:12
import type { LayoutLoad } from './$types';

// eslint-disable-next-line func-style -- reason: SvelteKit LayoutLoad type-binding requires const-form annotation
export const load: LayoutLoad = async ({ params, url }) => { … };
```

**Type-binding sites (4):**
- `routes/(voters)/(located)/results/+layout.ts:23` (`load: LayoutLoad`)
- `routes/(voters)/(located)/results/[[…]]/+page.ts:28` (`load: PageLoad`)
- `routes/candidate/auth/callback/+server.ts:19` (`GET: RequestHandler`)
- `routes/candidate/auth/logout/+server.ts:12` (`POST: RequestHandler`)

**Reason-text mapping** (per-site):
- `LayoutLoad` site → `reason: SvelteKit LayoutLoad type-binding requires const-form annotation`
- `PageLoad` site → `reason: SvelteKit PageLoad type-binding requires const-form annotation`
- `RequestHandler` sites → `reason: SvelteKit RequestHandler type-binding requires const-form annotation`

---

## Cluster 4 — Long-tail (4 errors)

### Sub-cluster 4a — `consistent-type-imports` (3 errors)

**Closest analog:** `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts:5-8` — already uses the lifted `import type { Foo } from '…'` form throughout:

```ts
// Source: VERIFIED — apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts:5-8
import type { Database } from '@openvaa/supabase-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UniversalAdapter } from '$lib/api/base/universalAdapter';
import type { SupabaseAdapter, SupabaseAdapterConfig } from './supabaseAdapter.type';
```

**Replace pattern:**

```ts
// BEFORE — Button.type.ts:8
badge?: import('svelte').Snippet;

// AFTER
import type { Snippet } from 'svelte';
// …
badge?: Snippet;
```

**Procedure:** run `yarn workspace @openvaa/frontend lint:fix -- <three-file-list>` first (auto-fixable in most cases). Manually lift any residue.

**Files this pattern applies to:**
- `apps/frontend/src/lib/components/button/Button.type.ts` (line 8)
- `apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts` (line 90)
- `apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.test.ts` (line 42)

### Sub-cluster 4b — `no-unused-expressions` (1 error)

**Closest analog:** `apps/frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte:74-76` — uses `// eslint-disable-next-line @typescript-eslint/no-unused-expressions` for the same Svelte 5 `$effect`-dependency-registration pattern. **However**, the cleaner Phase 71 fix is `void <expr>;` which avoids the disable entirely.

**Replace pattern:**

```svelte
<!-- BEFORE — apps/frontend/src/lib/dynamic-components/entityList/EntityListControls.svelte:71-74 -->
$effect(() => {
  entities;            // ← line 72: bare expression for $effect dep registration
  updateFilters();
});

<!-- AFTER — explicit void marks the dep-only read; no rule disable needed -->
$effect(() => {
  void entities;
  updateFilters();
});
```

**Files this pattern applies to:**
- `apps/frontend/src/lib/dynamic-components/entityList/EntityListControls.svelte` (line 72)

---

## Shared Patterns (apply across plans)

### `// reason: <one-line>` justification format (D-04)

**Convention status:** **fresh in Phase 71** (zero matches at HEAD). All 4 plans introduce the convention; the planner should anchor it in Plan-71-01's `## Conventions` section so future grep finds it.

**Format** (single-line, lowercase prefix, immediately preceding the disable or the cast):

```ts
// reason: <why this boundary admits unbounded shapes>
const x = raw as unknown as TargetShape;
```

**Combined with `eslint-disable-next-line` (D-02 fallback):**

```ts
// eslint-disable-next-line func-style -- reason: SvelteKit RequestHandler type-binding requires const-form annotation
export const GET: RequestHandler = async ({ url, locals }) => { … };
```

**Distinct from sibling conventions** (so each is independently grep-able):
- v2.7 P65: `// bind: keep —`
- Phase 70: `// svelte-warning: accepted —`
- Phase 71: `// reason: <one-line>`

### Type-source imports (apply across Plan-71-01 sub-batches)

```ts
// For Sub-cluster 1a (test mocks)
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@openvaa/supabase-types';

// For Sub-cluster 1b (production adapter code)
import type { Json, Tables } from '@openvaa/supabase-types';

// For Sub-cluster 1c (route layouts)
import type { LayoutData } from './$types'; // PageData for +page.svelte sites
```

### Verification command pattern (per task)

```bash
yarn workspace @openvaa/frontend lint:check 2>&1 | grep "<rule-being-fixed>" | wc -l
# expect this number to drop monotonically toward 0
```

---

## No Analog Found

*(None.)*

Every cluster has a lint-clean exemplar already in the codebase:
- Cluster 1a (test mocks): the same test file's `createMockSupabaseClient` factory + `ReturnType<typeof …>` pattern.
- Cluster 1b (production adapter `as any`): the file's own `as Record<string, unknown>` pattern at line 88.
- Cluster 1c (route `data: any`): SvelteKit-standard `./$types` virtual module (every other route layout already uses it).
- Cluster 2 (T-naming): `supabaseAdapter.ts:10-22` `TBase`/`TClass` exemplar.
- Cluster 3 mechanical (func-style): `mapRow.ts:9, 22, 34` `export function` exemplar.
- Cluster 3 type-binding (func-style disable): `hooks.server.ts:1` + `hooks.ts:1` file-level disable wording.
- Cluster 4a (import-type lift): `supabaseAdapter.ts:5-8` clean lifted `import type` block.
- Cluster 4b (`$effect` dep registration): `void <expr>;` is idiomatic Svelte 5 (no disable needed).

---

## Metadata

**Analog search scope:**
- `apps/frontend/src/lib/api/adapters/supabase/` (the boundary cluster)
- `apps/frontend/src/hooks.{server,}.ts` (existing func-style disables)
- `apps/frontend/src/lib/utils/` + `apps/frontend/src/lib/contexts/` (existing inline disables)
- `packages/supabase-types/src/` (type sources)
- `packages/shared-config/eslint.config.mjs` (rule defs — read indirectly via RESEARCH.md)

**Files scanned:** ~12 (targeted reads per cluster; broader inventory in `71-RESEARCH.md`).
**Pattern extraction date:** 2026-05-09.

---

## PATTERN MAPPING COMPLETE

**Phase:** 71 - frontend-strict-typing-cleanup
**Files classified:** N/A (cluster-keyed, not file-keyed; 95 errors across ~30 distinct files enumerated in RESEARCH.md §Cluster Analysis)
**Analogs found:** 5 / 5 clusters

### Coverage
- Clusters with exact analog: 5 (every cluster has a lint-clean exemplar in-tree)
- Clusters with role-match analog: 0
- Clusters with no analog: 0

### Key Patterns Identified
- **Test-mock helper triad:** `createMockSupabaseClient` factory + `ReturnType<typeof …>` mock-type alias + new `asSupabaseMock(m)` `unknown`-cast helper retires all 44 test-file `any`s with a single helper introduction.
- **`Json | null` cast** is the project's canonical replacement for `as any` on JSONB columns; `parseStoredImage` accepts the structural superset.
- **`./$types` `LayoutData`/`PageData`** retires every route `data: any` site without ad-hoc inline types.
- **`hooks.server.ts:1` is the canonical `func-style` disable wording exemplar** — inline-next-line form for the 4 SvelteKit-typed-export sites mirrors the file-level pattern.
- **`// reason: <one-line>` is fresh in Phase 71** (zero existing matches); planner should anchor the convention in Plan-71-01.
- **`void <expr>;`** is the disable-free Svelte 5 idiom for the single `no-unused-expressions` site, avoiding the legacy `eslint-disable-next-line` precedent at `ConstituencySelector.svelte:74-76`.

### File Created
`/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/phases/71-frontend-strict-typing-cleanup/71-PATTERNS.md`

### Ready for Planning
Pattern mapping complete. Planner can now reference cluster-keyed analog excerpts in PLAN.md `<read_first>` directives — the per-file:line error inventory remains in `71-RESEARCH.md` §Cluster Analysis (canonical), and this PATTERNS.md supplies the paste-ready code shapes for each cluster.
