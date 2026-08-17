# Phase 63: E2E Template Extension & Greening - Pattern Map

**Mapped:** 2026-04-24
**Files analyzed:** 13 (utility hoist 3, dev-seed template 1, variant templates 3, setup files 4, parity-gate artifacts 2)
**Analogs found:** 13 / 13 (every change has a strong in-repo analog)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages/app-shared/src/utils/mergeSettings.ts` (NEW) | utility | transform | `apps/frontend/src/lib/utils/merge.ts` (verbatim source) + `packages/app-shared/src/utils/passwordValidation.ts` (sibling-shape) | exact (verbatim hoist) |
| `packages/app-shared/src/utils/mergeSettings.test.ts` (NEW) | test | unit | `packages/app-shared/src/utils/passwordValidation.test.ts` | exact |
| `packages/app-shared/src/index.ts` (MODIFY) | config / barrel | re-export | existing barrel lines 1-13 (e.g. `export * from './utils/passwordValidation.js';`) | exact |
| `apps/frontend/src/lib/utils/merge.ts` (REFACTOR to re-export) | utility | re-export | own existing body (replaced by `export { mergeSettings, type DeepPartial } from '@openvaa/app-shared'`) | trivial |
| `packages/dev-seed/package.json` (MODIFY) | config | n/a | `packages/app-shared/package.json` `dependencies` block (sibling shape) | exact |
| `packages/dev-seed/src/templates/e2e.ts` (MODIFY: add `app_settings.fixed[]`, export `E2E_BASE_APP_SETTINGS`) | config / template authoring | declarative-data | own existing fragment shape (`elections.fixed[]`, `candidates.fixed[]`, etc.) at lines 84-110 | exact (same shape, new entity) |
| `tests/tests/setup/templates/variant-constituency.ts` (MODIFY: add `app_settings.fixed[]`) | config / template authoring | declarative-data | own current spread pattern with `baseFixed('table')` at lines 82-103 | exact |
| `tests/tests/setup/templates/variant-multi-election.ts` (MODIFY) | config / template authoring | declarative-data | `tests/tests/setup/templates/variant-constituency.ts` (sibling) | exact |
| `tests/tests/setup/templates/variant-startfromcg.ts` (MODIFY) | config / template authoring | declarative-data | `tests/tests/setup/templates/variant-constituency.ts` (sibling) | exact |
| `tests/tests/setup/data.setup.ts` (MODIFY: delete `updateAppSettings` block, add post-seed assertion) | test / setup harness | request-response (admin RPC) | own current body lines 31-84 (Phase 59 shape; Pattern 1 below shows the in-place delete) | exact |
| `tests/tests/setup/variant-constituency.setup.ts` (MODIFY) | test / setup harness | request-response | `tests/tests/setup/data.setup.ts` (sibling) | exact |
| `tests/tests/setup/variant-multi-election.setup.ts` (MODIFY) | test / setup harness | request-response | sibling | exact |
| `tests/tests/setup/variant-startfromcg.setup.ts` (MODIFY) | test / setup harness | request-response | sibling | exact |
| `.planning/phases/63-…/post-v2.6/playwright-report.json` (NEW artifact) | data-artifact | file-I/O | `.planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json` | exact |
| `.planning/phases/63-…/post-v2.6/diff.md` (NEW artifact) | report | file-I/O | Phase 60-05's parity-gate output (referenced) + diff-script header in `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` | role-match |

## Pattern Assignments

### `packages/app-shared/src/utils/mergeSettings.ts` (utility, transform)

**Analog A (verbatim source):** `apps/frontend/src/lib/utils/merge.ts`
**Analog B (sibling shape in destination):** `packages/app-shared/src/utils/passwordValidation.ts`

**Body to copy verbatim** (`apps/frontend/src/lib/utils/merge.ts:1-46`):

```ts
export type DeepPartial<TObject> = {
  [K in keyof TObject]?: TObject[K] extends object ? DeepPartial<TObject[K]> : TObject[K];
};

/**
 * Deep merge two plain (non-constructed) objects with settings.
 * NB. The function does not support constructed objects (f.e. dates) and arrays containing functions.
 * For `AppSettings`, use the `mergeAppSettings` function in `$lib/utils/settings.ts` instead.
 *
 * @param target - The target.
 * @param source - The source.
 * @returns A new plain object that contains a deep merge of target and source.
 */
export function mergeSettings<TTarget extends object, TSource extends object>(
  target: TTarget,
  source: TSource
): TTarget & TSource {
  const result = deepMergeRecursively({}, target);
  return deepMergeRecursively(result, source);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function deepMergeRecursively<TTarget extends object, TSource extends object>(
  target: TTarget,
  source: TSource
): TTarget & TSource {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!(key in target)) {
        (target as any)[key] = {};
      }
      (target as any)[key] = deepMergeRecursively((target as any)[key], source[key]);
    } else if (typeof source[key] === 'function') {
      (target as any)[key] = source[key];
    } else {
      (target as any)[key] = structuredClone(source[key]);
    }
  }
  return target as TTarget & TSource;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
```

**Doc-comment update:** drop the line "For `AppSettings`, use the `mergeAppSettings` function in `$lib/utils/settings.ts` instead." (frontend-specific reference is wrong from `@openvaa/app-shared`). Replace with: "Hoisted to `@openvaa/app-shared` in Phase 63 so both `@openvaa/dev-seed` and the frontend can import a single source of truth (D-02). Note that `mergeAppSettings` in `apps/frontend/src/lib/utils/settings.ts` is a separate, **shallow** merge with different semantics — do not confuse the two."

**Sibling-shape (destination) pattern** — `packages/app-shared/src/utils/passwordValidation.ts:1-12`:

```ts
export const minPasswordLength = 8;
const repetitionLimit = 4;

export interface ValidationDetail { ... }
export interface PasswordValidation { ... }
```

(Pattern: pure-function utility, named `export`, no DOM/storage/network surface, JSDoc on every public symbol. New `mergeSettings.ts` keeps the same conventions.)

---

### `packages/app-shared/src/utils/mergeSettings.test.ts` (test, unit)

**Analog:** `packages/app-shared/src/utils/passwordValidation.test.ts`

**Imports + describe pattern** (lines 1-4):

```ts
import { describe, expect, test } from 'vitest';
import { mergeSettings } from './mergeSettings';

describe('mergeSettings', () => {
  test('Should ...', () => { ... });
});
```

**Test-case style** (lines 4-23) — `test('Should …', () => { … expect(result.<path>).toBe(...) … });` — pairs descriptive `Should` titles with `expect(...).toBe(...)` / `expect(...).toEqual(...)` assertions.

**Required cases** (per RESEARCH §Code Examples lines 593-625):
1. Deep-merges nested objects (overlay extends target without clobbering siblings).
2. Overlay wins on primitive collisions.
3. Replaces arrays wholesale (no element merge).
4. Does not mutate inputs.
5. Initializes missing nested target keys.
6. Preserves function values from overlay.

(Coverage suffices for `@openvaa/app-shared` precedent; `passwordValidation.test.ts` runs ~10 short cases — same density.)

---

### `packages/app-shared/src/index.ts` (config / barrel)

**Analog:** own existing lines 1-13.

**Existing pattern** — every util gets a single re-export line (note `.js` suffix is required by the package's ESM build):

```ts
export * from './utils/passwordValidation.js';
```

**Add line:**

```ts
export * from './utils/mergeSettings.js';
```

Insert alphabetically (after `passwordValidation` if planner prefers strict ordering — current file orders by sub-directory then filename, so the new line goes at the end of the `utils/` block).

---

### `apps/frontend/src/lib/utils/merge.ts` (utility, re-export)

**Replacement body** (replaces all 46 existing lines):

```ts
/**
 * Re-export of @openvaa/app-shared's deep-merge utility (Phase 63 hoist, D-02).
 * Kept as a re-export so existing `$lib/utils/merge` import sites compile unchanged.
 */
export { mergeSettings, type DeepPartial } from '@openvaa/app-shared';
```

**Verification check (planner action item):** before the replacement lands, grep `apps/frontend/src` for `from '$lib/utils/merge'` and `from '../utils/merge'` to confirm all import sites resolve symbol names (`mergeSettings`, `DeepPartial`) that the re-export exposes. (No new symbols expected.)

---

### `packages/dev-seed/package.json` (config)

**Analog:** `packages/app-shared/package.json` `dependencies` block (sibling that already depends on `@openvaa/data` via `workspace:^`).

**Existing pattern in `packages/dev-seed/package.json`:**

```json
"dependencies": {
  "@faker-js/faker": "catalog:",
  "@openvaa/core": "workspace:^",
  "@openvaa/matching": "workspace:^",
  "@openvaa/supabase-types": "workspace:^",
  "@supabase/supabase-js": "catalog:",
  "zod": "catalog:"
}
```

**Add line** (alphabetical position is between `@openvaa/core` and `@openvaa/matching`):

```json
"@openvaa/app-shared": "workspace:^",
```

After editing, run `yarn install` (refresh workspace symlinks) + `yarn build --filter=@openvaa/app-shared` (Pitfall 7 mitigation).

---

### `packages/dev-seed/src/templates/e2e.ts` (config / template authoring)

**Analog (sibling fragments):** `packages/dev-seed/src/templates/e2e.ts:84-110` (`elections.fixed[]`) — the exact field shape every fragment uses.

**Existing fragment-shape pattern** (e.g. `elections` lines 84-110):

```ts
elections: {
  count: 0,
  fixed: [
    {
      external_id: 'test-election-1',
      name: { en: 'Test Election 2025' },
      // … snake_case fields matching TablesInsert<'elections'> …
    }
  ]
},
```

**New `app_settings` block** — add after `nominations` (last fragment, line 933) following the same shape. **Critical naming reconciliation (Pitfall 2 + research §Pattern 1):** the writer (`packages/dev-seed/src/writer.ts:176`) reads `row.settings` (snake_case, matching the DB column). The CONTEXT D-01 wording calls the field `value`; reconcile by **using `settings` directly** (no translation layer):

```ts
// Top of file — additive named export so variant templates can compose against it.
export const E2E_BASE_APP_SETTINGS = {
  questions: {
    categoryIntros: { show: false },
    questionsIntro: { allowCategorySelection: false, show: false },
    showResultsLink: true
  },
  results: {
    cardContents: {
      candidate: ['submatches'],
      organization: ['candidates']
    },
    sections: ['candidate', 'organization']
  },
  entities: {
    hideIfMissingAnswers: { candidate: false },
    showAllNominations: true
  },
  notifications: { voterApp: { show: false } },
  analytics: { trackEvents: false }
} as const;

// Inside e2eTemplate:
app_settings: {
  count: 0,
  fixed: [
    {
      external_id: 'test-app-settings',
      settings: E2E_BASE_APP_SETTINGS
    }
  ]
}
```

(Keys + values copied verbatim from `tests/tests/setup/data.setup.ts:53-72` — that legacy block IS the spec contract for the base e2e template.)

**External-id rule** (Pitfall 6 + RESEARCH §Runtime State Inventory): prefix MUST start with `test-` so `runTeardown('test-', client)` matches it; the `AppSettingsGenerator` further prefixes with `externalIdPrefix` (which is `''` for e2e per line 78), so the literal `'test-app-settings'` survives end-to-end.

---

### `tests/tests/setup/templates/variant-constituency.ts` (config / template authoring)

**Analog (sibling):** `tests/tests/setup/templates/variant-constituency.ts:78-103` (existing `baseFixed('table')` spread pattern for elections, organizations, etc.).

**Existing pattern** (lines 92-103) — variant uses `[...baseFixed('constituency_groups'), <new rows>]` to spread base + add overlay:

```ts
constituency_groups: {
  count: 0,
  fixed: [
    ...baseFixed('constituency_groups'),
    { external_id: 'test-cg-regions', name: { en: 'Regions' }, sort_order: 10, is_generated: false }
  ]
},
```

**For `app_settings`, the single-row UNIQUE(project_id) constraint changes the shape — variants do NOT spread `baseFixed`; instead they emit a single row whose `settings` is `mergeSettings(BASE, OVERLAY)`** (RESEARCH §Pattern 2):

```ts
import { BUILT_IN_TEMPLATES, type Template } from '@openvaa/dev-seed';
import { mergeSettings } from '@openvaa/app-shared';
// Re-export added in e2e.ts; if @openvaa/dev-seed re-exports it via index, prefer:
import { E2E_BASE_APP_SETTINGS } from '@openvaa/dev-seed';

const CONSTITUENCY_OVERLAY = {
  // variant-constituency omits the `results` block in its legacy
  // updateAppSettings call (data.setup.ts has results, this one doesn't).
  // The base already declares `results.*` — to MATCH the legacy shape, we
  // need to either (a) deep-merge with no overlay (which keeps base.results)
  // or (b) set results to the variant's known-different shape.
  // Per the legacy variant-constituency.setup.ts:41-53 the variant has NO
  // `results` key in its updateAppSettings payload — but merge_jsonb_column
  // is additive (Pitfall 3), so legacy behavior is "base merged with no
  // results block". Authoring the same here means OVERLAY is empty.
} as const;

// In the variant template:
app_settings: {
  count: 0,
  fixed: [
    {
      external_id: 'test-app-settings-constituency',
      settings: mergeSettings(E2E_BASE_APP_SETTINGS, CONSTITUENCY_OVERLAY)
    }
  ]
}
```

**External-id naming** (RESOLVED Q1 in RESEARCH): variant-scoped (`'test-app-settings-constituency'`) for readability — last-write-wins on the actual row, but the `external_id` field in DB makes triage easier.

---

### `tests/tests/setup/templates/variant-multi-election.ts` (config / template authoring)

**Analog:** sibling `variant-constituency.ts` (above) + the legacy `variant-multi-election.setup.ts:43-59` body (which IS the overlay payload).

**Overlay derivation** — diff the variant's existing `updateAppSettings(...)` against `E2E_BASE_APP_SETTINGS`:

| Setting key | Base (e2e) | Variant payload | Overlay needed? |
|---|---|---|---|
| `questions`, `entities`, `notifications`, `analytics` | present | present, identical | no (deep-merge will keep base) |
| `results.cardContents` / `results.sections` | present | absent | n/a — `merge_jsonb_column` keeps base values |
| `results.showFeedbackPopup` / `results.showSurveyPopup` | absent | `0` / `0` | YES — overlay adds them |

```ts
const MULTI_ELECTION_OVERLAY = {
  results: { showFeedbackPopup: 0, showSurveyPopup: 0 }
} as const;

// In the variant template:
app_settings: {
  count: 0,
  fixed: [
    {
      external_id: 'test-app-settings-multi-election',
      settings: mergeSettings(E2E_BASE_APP_SETTINGS, MULTI_ELECTION_OVERLAY)
    }
  ]
}
```

---

### `tests/tests/setup/templates/variant-startfromcg.ts` (config / template authoring)

**Analog:** sibling + the legacy `variant-startfromcg.setup.ts:44-56`.

**Overlay** — exact payload diff against base shows the variant has no `results` block in its current updateAppSettings call (matches variant-constituency). `startFromConstituencyGroup` is intentionally NOT set here because it requires the constituency-group's DB UUID (set at runtime by the spec; per `variant-startfromcg.setup.ts:21-23`).

```ts
const STARTFROMCG_OVERLAY = {} as const;

// In the variant template:
app_settings: {
  count: 0,
  fixed: [
    {
      external_id: 'test-app-settings-startfromcg',
      settings: mergeSettings(E2E_BASE_APP_SETTINGS, STARTFROMCG_OVERLAY)
    }
  ]
}
```

---

### `tests/tests/setup/data.setup.ts` (test / setup harness)

**Analog:** own current body (Phase 59 shape) at `tests/tests/setup/data.setup.ts:1-84`.

**Lines to delete** — entire `// 3. App settings (legacy preservation; ...` block at lines 51-72 (22 lines):

```ts
// DELETE THIS ENTIRE BLOCK (lines 51-72):
// 3. App settings (legacy preservation; see note above). Once the e2e
//    template grows an `app_settings.fixed[]` block, delete this call.
await client.updateAppSettings({
  questions: { categoryIntros: { show: false }, ... },
  results: { cardContents: { ... }, sections: [...] },
  entities: { hideIfMissingAnswers: { candidate: false }, showAllNominations: true },
  notifications: { voterApp: { show: false } },
  analytics: { trackEvents: false }
});
```

**Header doc-comment update** — replace lines 22-29 ("app_settings NOTE" paragraph) with a forward-pointer:

```ts
/**
 * app_settings is now declared in `@openvaa/dev-seed`'s e2e template
 * (`packages/dev-seed/src/templates/e2e.ts` `app_settings.fixed[]`). The
 * writer's Pass-5 routes it through `merge_jsonb_column` automatically.
 * Phase 63 (E2E-02) deleted the legacy `updateAppSettings(...)` call.
 */
```

**Post-seed assertion to add** (D-10) — after `await writer.write(rows, prefix);` at line 49, before the auth wiring loop (line 76):

**Analog for the read-back query:** `packages/dev-seed/src/supabaseAdminClient.ts:487-495` (existing `updateAppSettings` already does the same `from('app_settings').select(...).eq('project_id', this.projectId).single()` to find the row — pattern is mirrored to read `settings`).

```ts
// 3. (D-10) Post-seed assertion — verify settings persisted as expected.
//    Sub-set match (toMatchObject) per RESOLVED Q2 — merge_jsonb_column is
//    additive (Pitfall 3); we verify our keys made it, not exclusive equality.
{
  const expected = template.app_settings?.fixed?.[0]?.settings;
  if (!expected) throw new Error('post-seed assertion: e2e template missing app_settings.fixed[0].settings — Phase 63 regression?');
  // SupabaseAdminClient (tests/) is a subclass; expose a read helper or use the
  // underlying client. Planner picks shape — recommendation: add a tiny
  // `getAppSettings(): Promise<Record<string, unknown> | null>` helper alongside
  // the existing `updateAppSettings(...)` method (mirrors the same query path).
  const persisted = await client.getAppSettings();
  expect(persisted, 'post-seed app_settings row').toBeTruthy();
  expect(persisted).toMatchObject(expected as Record<string, unknown>);
}
```

**No-change blocks** (DO NOT touch — load-bearing):
- Auth wiring loop at lines 76-83 (TEST_UNREGISTERED_EMAILS forEach + forceRegister + `expect(true, ...)` post-condition).
- `runTeardown(PREFIX, client)` at line 43 — pre-clear stale state.
- Pipeline + writer chain at lines 46-49.

---

### `tests/tests/setup/variant-constituency.setup.ts` / `variant-multi-election.setup.ts` / `variant-startfromcg.setup.ts` (test / setup harness)

**Analog:** sibling `data.setup.ts` (above).

**Lines to delete:**
- variant-constituency: lines 40-53 (legacy `updateAppSettings(...)` block — 14 lines).
- variant-multi-election: lines 39-59 (block — 21 lines, includes `results.showFeedbackPopup/showSurveyPopup`).
- variant-startfromcg: lines 41-56 (block — 16 lines).

**Header doc-comment update** in each — drop the "app_settings note" paragraph and replace with a one-liner:

```ts
/**
 * app_settings now declared in this variant's filesystem template
 * (`templates/variant-<name>.ts` `app_settings.fixed[]`). Phase 63 (E2E-02)
 * deleted the legacy `updateAppSettings(...)` call from this setup file.
 */
```

**Post-seed assertion** — same shape as data.setup.ts above; the `expected` value comes from the variant's own template `app_settings.fixed[0].settings` (which has the merged base+overlay value baked in).

**No-change blocks:**
- `runTeardown(PREFIX, client)` line.
- Pipeline + writer chain.
- `expect(template.candidates?.fixed?.length ?? 0, ...).toBeGreaterThan(0);` sanity check at the end.

---

### `.planning/phases/63-…/post-v2.6/playwright-report.json` (data-artifact)

**Analog:** `.planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json` (188 KB; same path shape; same source — Playwright's `--reporter=json`).

**Capture invocation** (RESEARCH §Pattern 4, Code Examples lines 711-761) — verbatim from Phase 60-05:

```bash
mkdir -p .planning/phases/63-e2e-template-extension-greening/post-v2.6
yarn playwright test -c ./tests/playwright.config.ts \
  --workers=1 \
  --reporter=json \
  > .planning/phases/63-e2e-template-extension-greening/post-v2.6/playwright-report.json \
  2> .planning/phases/63-e2e-template-extension-greening/post-v2.6/playwright.stderr.txt
```

**Post-capture cleanup** (Pitfall 1 — dotenv banner pollutes JSON) — Python regex strip:

```python
import re
p = '.planning/phases/63-e2e-template-extension-greening/post-v2.6/playwright-report.json'
content = open(p).read()
m = re.search(r'^\{$', content, re.MULTILINE)
if m and m.start() > 0:
    open(p, 'w').write(content[m.start():])
import json; json.load(open(p))   # smoke
```

---

### `.planning/phases/63-…/post-v2.6/diff.md` (report)

**Analog:** Phase 60 `60-05-SUMMARY.md` (referenced by RESEARCH; not opened — uses the same parity-gate output structure).

**Generation** — pipe the diff script's output:

```bash
npx -y tsx .planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts \
  .planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json \
  .planning/phases/63-e2e-template-extension-greening/post-v2.6/playwright-report.json \
  2>&1 | tee .planning/phases/63-e2e-template-extension-greening/post-v2.6/diff.md
```

**Required executor footer** (per CONTEXT.md D-06, D-07 + research §Architecture step 4):
1. Verdict frontmatter (`PARITY GATE: PASS` or `FAIL`).
2. Reclamation table (Phase 60 LAYOUT-02 direct + cascade; Phase 61 QUESTION-04 direct + cascade; Phase 62 results-related deltas).
3. Residual classification per D-06: every non-reclaimed expected flip either (a) framework-level pointer (Svelte / Playwright / Supabase issue link or repro line) OR (b) blocker.
4. Residual-fix budget consumed (out of 2-3 max per D-07); planner-side decisions documented.
5. Commit unconditionally (RESOLVED Q4) — frontmatter records verdict; milestone-close consumes either way.

**Self-identity smoke first** (Pitfall 5 — verify diff script behavior):

```bash
npx -y tsx .planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts \
  .planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json \
  .planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json
# expected: PARITY GATE: PASS
```

---

## Shared Patterns

### Settings deep-merge (`mergeSettings`) — single source of truth

**Source:** `apps/frontend/src/lib/utils/merge.ts` (current) → `packages/app-shared/src/utils/mergeSettings.ts` (after hoist).
**Apply to:** every variant template file that composes `mergeSettings(E2E_BASE_APP_SETTINGS, OVERLAY)`; the frontend continues using it via the re-export shim.
**Anti-pattern reminder** (RESEARCH §Anti-Patterns to Avoid): do NOT use `apps/frontend/src/lib/utils/settings.ts`'s `mergeAppSettings` — that is a SHALLOW merge with different semantics; using it would clobber nested settings groups (e.g. `results.cardContents.candidate`).

### Pre-clear teardown then pipeline + writer

**Source:** `tests/tests/setup/data.setup.ts:43-49` (canonical chain).
**Apply to:** all 4 setup files (data, variant-constituency, variant-multi-election, variant-startfromcg).
**Pattern (must keep verbatim):**

```ts
const client = new SupabaseAdminClient();
await runTeardown(PREFIX, client);
const rows = runPipeline(template, overrides);
fanOutLocales(rows, template, seed);
const writer = new Writer();
await writer.write(rows, prefix);
```

The new post-seed assertion goes immediately after `await writer.write(rows, prefix);` (replacing the deleted legacy `updateAppSettings(...)` block) and before any per-file extras (auth wiring in data.setup.ts; sanity-check `expect(template.candidates?.fixed?.length ...)` in variant setups).

### Workspace barrel re-export pattern

**Source:** `packages/app-shared/src/index.ts` lines 1-13 — single line per util module, `.js` suffix mandatory (ESM build target).
**Apply to:** the new `mergeSettings` export.

### App-shared utility unit-test conventions

**Source:** `packages/app-shared/src/utils/passwordValidation.test.ts` lines 1-23.
**Apply to:** the new `mergeSettings.test.ts`. Convention: `describe(<symbol>, () => { test('Should …', () => { ... }) })`, vitest globals via top-of-file `import { describe, expect, test } from 'vitest';`.

### Parity-gate canonical invocation

**Source:** RESEARCH §Pattern 4 + `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` (header comment lines 32-37 documents the canonical CLI).
**Apply to:** the parity run + diff sequence (data-artifact + report files above).
**Mandatory flags:** `-c ./tests/playwright.config.ts --workers=1 --reporter=json` (workers=1 is load-bearing for determinism per Phase 60 D-11).

## No Analog Found

None. Every Phase 63 file has either an exact source-of-truth (the merge utility, the parity scripts/baseline) or a strong sibling within the same directory (variant templates, setup files).

## Metadata

**Analog search scope:**
- `apps/frontend/src/lib/utils/` (merge.ts source)
- `packages/app-shared/src/{index.ts, utils/}` (destination + sibling shape)
- `packages/dev-seed/src/{templates/, generators/, writer.ts, supabaseAdminClient.ts, template/schema.ts}` (template + writer plumbing)
- `tests/tests/setup/{data.setup.ts, variant-*.setup.ts, templates/variant-*.ts}` (migration targets + variant template precedents)
- `.planning/phases/59-e2e-fixture-migration/{scripts/, post-swap/}` (parity-gate canonical scripts and v2.5 baseline)
- `.planning/phases/60-layout-runes-migration-hydration-fix/` (Phase 60-05 capture flow, referenced via RESEARCH)

**Files scanned:** 14 in-repo files Read for excerpts; ~30 referenced by line range from RESEARCH.

**Pattern extraction date:** 2026-04-24

---

## PATTERN MAPPING COMPLETE

**Phase:** 63 - E2E Template Extension & Greening
**Files classified:** 13
**Analogs found:** 13 / 13

### Coverage
- Files with exact analog: 13
- Files with role-match-only analog: 0
- Files with no analog: 0

### Key Patterns Identified
- All variant templates already use a base-spread pattern (`...baseFixed('table')` + new rows); `app_settings` is the single-row exception that uses `mergeSettings(BASE, OVERLAY)` instead.
- `@openvaa/app-shared` has an established utility-shape precedent (`passwordValidation.{ts,test.ts}` + barrel re-export) — `mergeSettings` slots in cleanly with no new conventions.
- Setup files share a verbatim 5-line pipeline+writer chain (`runTeardown` → `runPipeline` → `fanOutLocales` → `new Writer()` → `writer.write`); the legacy `updateAppSettings` call sits BETWEEN the writer and any per-file extras and gets cleanly excised.
- The parity-gate workflow (Pattern 4) is identical to Phase 60-05; the only delta is the output path (`post-v2.6/` instead of `post-change/`).

### File Created
`/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/phases/63-e2e-template-extension-greening/63-PATTERNS.md`

### Ready for Planning
Pattern mapping complete. Planner can now reference analog patterns in PLAN.md files (Plan 63-01 utility hoist; Plan 63-02 template extension + setup migration; Plan 63-03 parity gate + baseline capture).
