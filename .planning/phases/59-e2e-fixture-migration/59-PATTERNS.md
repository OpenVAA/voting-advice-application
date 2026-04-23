# Phase 59: E2E Fixture Migration - Pattern Map

**Mapped:** 2026-04-23
**Files analyzed:** 17 new / modified / deleted files
**Analogs found:** 11 with analog / 17

## Scope Clarification (Load-Bearing)

CONTEXT.md enumerates three JSON fixtures for deletion (`default-dataset.json`,
`voter-dataset.json`, `candidate-addendum.json`) plus orphan overlays. A grep
pass shows these fixtures are imported from far more than just `seed-test-data.ts`
and the variant setup files — they are also imported at **module-load time** by:

- `tests/tests/utils/testCredentials.ts` — reads
  `defaultDataset.candidates[0].email` to derive `TEST_CANDIDATE_EMAIL`
- 5 spec files — read candidate emails, externalIds, and filter candidate lists
  at top-level:
  - `tests/tests/specs/candidate/candidate-registration.spec.ts` (lines 28, 29, 115)
  - `tests/tests/specs/candidate/candidate-profile.spec.ts` (lines 33, 34)
  - `tests/tests/specs/voter/voter-detail.spec.ts` (line 27)
  - `tests/tests/specs/voter/voter-matching.spec.ts` (lines 41, 42, 62, 66, 121-124)
  - `tests/tests/specs/voter/voter-results.spec.ts` (lines 25, 28)
- 2 debug scripts (`tests/debug-questions.ts`, `tests/debug-setup.ts`)

All of these blow up at TypeScript-compile time if the JSON files are deleted
without replacement. D-59-09's `yarn build` gate catches the fallout, but the
planner must decide the replacement strategy upfront. Two viable paths:

1. **Re-export equivalent constants from the e2e template module.** The
   `e2eTemplate` already ships at `packages/dev-seed/src/templates/e2e.ts` with
   `fixed[]` rows whose `external_id`s match the audit contracts. Add a sibling
   re-export module (e.g. `packages/dev-seed/src/templates/e2e-refs.ts`) that
   surfaces the named objects (`testCandidateAlpha`, `testUnregisteredOne`, etc.)
   as typed TypeScript constants, and update the 8 importer files to consume
   those instead of JSON indices.
2. **Inline the constants directly in each importer.** Replace
   `defaultDataset.candidates[0].email` with a hardcoded
   `'mock.candidate.2@openvaa.org'` and similar. Smaller diff but couples every
   spec to literal values; less resilient if the e2e template evolves.

Path 1 is the better match for D-58-15 + D-59-05 (single source of truth at the
template), but **Phase 59 CONTEXT.md doesn't lock this choice**. Planner's call
which route. Either way, these 8 files appear in "modified" and must be covered
by a plan.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `tests/seed-test-data.ts` (REWRITE) | standalone script (utility/CLI wrapper) | batch (dev command) | `packages/dev-seed/src/cli/seed.ts` | exact (already the intended wrapper shape) |
| `tests/tests/setup/data.setup.ts` (REWRITE) | Playwright setup project | request-response (playwright fixture) | `packages/dev-seed/src/cli/seed.ts` (programmatic call pattern) + self (D-58-15 e2e template consumer) | role-match |
| `tests/tests/setup/data.teardown.ts` (REWRITE) | Playwright teardown project | event-driven (after-all) | `packages/dev-seed/src/cli/teardown.ts` (`runTeardown`) | exact (call the public API) |
| `tests/tests/setup/variant-*.setup.ts` (3 files, REWRITE or DELETE) | Playwright variant setup | request-response | same as `data.setup.ts` + audit overlay semantics | role-match |
| `tests/tests/setup/variant-data.teardown.ts` (REWRITE) | Playwright teardown | event-driven | same as `data.teardown.ts` | exact |
| `tests/tests/utils/testCredentials.ts` (MODIFY) | config (static constants) | — | `packages/dev-seed/src/templates/e2e.ts` (e2e template `fixed[]` source of truth) | role-match |
| `tests/tests/specs/**/*.spec.ts` (5 files, MODIFY) | test spec | event-driven (playwright) | (pattern change only — swap JSON reads for template-derived constants) | — |
| `tests/debug-setup.ts`, `tests/debug-questions.ts` (MODIFY or DELETE) | one-off maintainer scripts | batch | `tests/seed-test-data.ts` (rewritten) + `packages/dev-seed/src/cli/seed.ts` | role-match |
| `tests/tests/utils/mergeDatasets.ts` (DELETE after variant setups rewritten) | utility (JSON merge) | transform | — | candidate for deletion |
| `tests/tests/data/default-dataset.json` (DELETE) | data fixture | — | — | — |
| `tests/tests/data/voter-dataset.json` (DELETE) | data fixture | — | — | — |
| `tests/tests/data/candidate-addendum.json` (DELETE) | data fixture | — | — | — |
| `tests/tests/data/overlays/*.json` (3 files, audit for DELETE) | data fixture (overlay) | — | — | — |
| `.planning/phases/59-.../baseline/playwright-report.json` | committed test artifact | — | `packages/dev-seed/tests/integration/default-template.integration.test.ts` (committed integration contract) | weak (committed artifact pattern) |
| `.planning/phases/59-.../baseline/summary.md` | docs (phase artifact) | — | `.planning/phases/58-templates-cli-default-dataset/58-E2E-AUDIT.md` (hand-authored phase-dir doc) | role-match |
| `.planning/phases/59-.../baseline/wait-for-healthy.sh` (or equivalent) | script (health-check shell) | request-response | `packages/dev-seed/src/cli/seed.ts` normalize-error pattern (`fetch failed` → actionable) | weak |
| Diff script (e.g. `.planning/phases/59-.../scripts/diff-playwright-reports.ts`) | utility (parser + filter) | transform | `packages/dev-seed/src/cli/summary.ts` (formatter) + `packages/dev-seed/tests/utils.ts` (pure helpers) | role-match |
| `.planning/phases/59-.../deps-check.txt` | committed artifact (tool output) | — | — | NONE (new — first dep-graph artifact in project) |
| `.planning/phases/59-.../59-VERIFICATION.md` | docs (verification report) | — | `.planning/phases/56-generator-foundations-plumbing/56-VERIFICATION.md` + `.planning/phases/58-templates-cli-default-dataset/58-VERIFICATION.md` | exact (repo convention) |
| `tests/tests/utils/supabaseAdminClient.ts` | NOT MODIFIED (read-only for VERIFICATION.md) | — | self (audit target for D-59-11 public surface table) | — |

## Pattern Assignments

### `tests/seed-test-data.ts` (REWRITE: standalone dev script)

**Analog:** `packages/dev-seed/src/cli/seed.ts` + `tests/seed-test-data.ts` (current shape)

**Current shape** (tests/seed-test-data.ts:15-45, 88 lines total):

```typescript
import candidateAddendum from './tests/data/candidate-addendum.json' with { type: 'json' };
import defaultDataset from './tests/data/default-dataset.json' with { type: 'json' };
import voterDataset from './tests/data/voter-dataset.json' with { type: 'json' };
import { SupabaseAdminClient } from './tests/utils/supabaseAdminClient';

const TEST_DATA_PREFIX = 'test-';
// ... TEST_CANDIDATE_EMAIL / TEST_CANDIDATE_PASSWORD ...

async function seed() {
  const client = new SupabaseAdminClient();
  console.log('Cleaning existing test data...');
  await client.bulkDelete({ nominations: { prefix: TEST_DATA_PREFIX }, ... });
  await client.bulkImport(defaultDataset as Record<string, unknown[]>);
  await client.importAnswers(defaultDataset as Record<string, unknown[]>);
  await client.linkJoinTables(defaultDataset as Record<string, unknown[]>);
  // ... repeats for voter + addendum
  await client.updateAppSettings({...});
  await client.unregisterCandidate('...');
  await client.forceRegister(...);
}
seed().catch((e) => { console.error('Seed failed:', e); process.exit(1); });
```

**Target shape per D-59-05** (~15-20 lines):

```typescript
#!/usr/bin/env npx tsx
/**
 * Standalone script for manual E2E data setup.
 * Usage: cd tests && npx tsx seed-test-data.ts
 * Prereqs: `supabase start` (or `yarn supabase:start`).
 */

import 'dotenv/config';
import { BUILT_IN_TEMPLATES, BUILT_IN_OVERRIDES, fanOutLocales, runPipeline, Writer } from '@openvaa/dev-seed';

async function seed() {
  const template = BUILT_IN_TEMPLATES.e2e;
  const overrides = BUILT_IN_OVERRIDES.e2e ?? {};
  const seed = template.seed ?? 42;
  const prefix = template.externalIdPrefix ?? '';

  const writer = new Writer();
  const rows = runPipeline(template, overrides);
  fanOutLocales(rows, template, seed);
  await writer.write(rows, prefix);
}

seed().catch((e) => { console.error('Seed failed:', e); process.exit(1); });
```

**Notes for Phase 59:**
- `dotenv/config` is the current file's pattern via `tests/playwright.config.ts:2,6`. Match it so the script reads the root `.env` identically.
- The public API used above is **already exported** from `packages/dev-seed/src/index.ts:48-75`: `BUILT_IN_TEMPLATES`, `BUILT_IN_OVERRIDES`, `runPipeline`, `fanOutLocales`, `Writer`. No new surface needed.
- Post-rewrite the file does NOT do: `unregisterCandidate`, `forceRegister`, `updateAppSettings`. These are now handled by the e2e template's `app_settings.fixed[]` (app settings) and Playwright setup files (auth registration). The rewrite is **data-seeding only**.
- If the script is kept as a "manual dev ergonomics" convenience (as the current file header says), consider whether `yarn dev:seed --template e2e` (existing CLI) supersedes it entirely. D-59-05 implies this file stays; planner confirms.

---

### `tests/tests/setup/data.setup.ts` (REWRITE: Playwright setup project)

**Analog:** `packages/dev-seed/src/cli/seed.ts` (programmatic API usage) + `tests/seed-test-data.ts` (Playwright-setup-shaped wrapper)

**Current shape** (tests/tests/setup/data.setup.ts:1-88):

```typescript
import { expect, test as setup } from '@playwright/test';
import candidateAddendum from '../data/candidate-addendum.json' with { type: 'json' };
import defaultDataset from '../data/default-dataset.json' with { type: 'json' };
import voterDataset from '../data/voter-dataset.json' with { type: 'json' };
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';
import { TEST_CANDIDATE_PASSWORD } from '../utils/testCredentials';

const TEST_DATA_PREFIX = 'test-';

setup('import test dataset', async () => {
  const client = new SupabaseAdminClient();
  const deleteResult = await client.bulkDelete({
    nominations: { prefix: TEST_DATA_PREFIX },
    candidates: { prefix: TEST_DATA_PREFIX },
    questions: { prefix: TEST_DATA_PREFIX },
    question_categories: { prefix: TEST_DATA_PREFIX },
    organizations: { prefix: TEST_DATA_PREFIX },
    constituency_groups: { prefix: TEST_DATA_PREFIX },
    constituencies: { prefix: TEST_DATA_PREFIX },
    elections: { prefix: TEST_DATA_PREFIX }
  });
  expect(deleteResult, 'Failed to delete existing test data').toBeTruthy();

  await client.bulkImport(defaultDataset as Record<string, unknown[]>);
  await client.importAnswers(defaultDataset as Record<string, unknown[]>);
  await client.linkJoinTables(defaultDataset as Record<string, unknown[]>);
  // ... repeats for voter + addendum ...
  await client.updateAppSettings({ questions: {...}, results: {...}, ... });

  await client.unregisterCandidate('test.unregistered@openvaa.org');
  await client.unregisterCandidate('test.unregistered2@openvaa.org');
  await client.unregisterCandidate('mock.candidate.2@openvaa.org');
  await client.forceRegister('test-candidate-alpha', 'mock.candidate.2@openvaa.org', TEST_CANDIDATE_PASSWORD);
});
```

**Target shape** (sketch; planner refines):

```typescript
import { expect, test as setup } from '@playwright/test';
import { BUILT_IN_TEMPLATES, BUILT_IN_OVERRIDES, fanOutLocales, runPipeline, Writer } from '@openvaa/dev-seed';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';
import { TEST_CANDIDATE_PASSWORD } from '../utils/testCredentials';

setup('import test dataset', async () => {
  const template = BUILT_IN_TEMPLATES.e2e;
  const overrides = BUILT_IN_OVERRIDES.e2e ?? {};
  const seed = template.seed ?? 42;
  const prefix = template.externalIdPrefix ?? '';

  const writer = new Writer();
  const rows = runPipeline(template, overrides);
  fanOutLocales(rows, template, seed);
  await writer.write(rows, prefix);

  // Auth wiring (NOT in dev-seed per D-24 split; stays here).
  const client = new SupabaseAdminClient();
  await client.unregisterCandidate('test.unregistered@openvaa.org');
  await client.unregisterCandidate('test.unregistered2@openvaa.org');
  await client.unregisterCandidate('mock.candidate.2@openvaa.org');
  await client.forceRegister('test-candidate-alpha', 'mock.candidate.2@openvaa.org', TEST_CANDIDATE_PASSWORD);
});
```

**Notes for Phase 59:**
- The writer's `write()` already includes an implicit pre-delete step (per Phase 58 Writer internals — check `packages/dev-seed/src/writer.ts` lines 150-ish). If it doesn't, prepend a `runTeardown(prefix, client)` call (exported from `@openvaa/dev-seed` per index.ts:52).
- **The rewrite removes `bulkDelete`** — the e2e template-backed writer handles fresh-start semantics. Confirm by reading Writer's `write()` signature; if it's idempotent (upserts on `(project_id, external_id)` via `bulk_import`), re-running is safe and teardown only needs to happen between full sessions.
- `updateAppSettings({ questions: {...}, ...})` is REMOVED from setup — the e2e template's `app_settings.fixed[]` carries these via `updateAppSettings` in the writer (per Phase 58 D-11b). Verify `packages/dev-seed/src/templates/e2e.ts` contains the settings shape that the current setup writes.
- `TEST_CANDIDATE_PASSWORD` stays in `tests/tests/utils/testCredentials.ts` — it's a tests-domain constant, not a template field.
- Auth registration stays here because `forceRegister` is a tests/-only method per D-24. The subclass `SupabaseAdminClient` re-exports it unchanged.

---

### `tests/tests/setup/data.teardown.ts` (REWRITE: Playwright teardown project)

**Analog:** `packages/dev-seed/src/cli/teardown.ts` (`runTeardown` function) — **exact match**

**Current shape** (tests/tests/setup/data.teardown.ts:1-32):

```typescript
import { expect, test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';

const TEST_DATA_PREFIX = 'test-';

teardown('delete test dataset', async () => {
  const client = new SupabaseAdminClient();
  await client.unregisterCandidate('test.unregistered@openvaa.org');
  await client.unregisterCandidate('test.unregistered2@openvaa.org');

  const deleteResult = await client.bulkDelete({
    nominations: { prefix: TEST_DATA_PREFIX },
    candidates: { prefix: TEST_DATA_PREFIX },
    questions: { prefix: TEST_DATA_PREFIX },
    question_categories: { prefix: TEST_DATA_PREFIX },
    organizations: { prefix: TEST_DATA_PREFIX },
    constituency_groups: { prefix: TEST_DATA_PREFIX },
    constituencies: { prefix: TEST_DATA_PREFIX },
    elections: { prefix: TEST_DATA_PREFIX }
  });
  expect(deleteResult, 'Failed to delete test data').toBeTruthy();
});
```

**Target shape via the package API** (`runTeardown` signature at
`packages/dev-seed/src/cli/teardown.ts:104`):

```typescript
import { expect, test as teardown } from '@playwright/test';
import { runTeardown, SupabaseAdminClient } from '@openvaa/dev-seed';
import { SupabaseAdminClient as TestsAdminClient } from '../utils/supabaseAdminClient';

const PREFIX = 'test-'; // must match e2e template's externalIdPrefix
// (Note: current e2e template has externalIdPrefix: '' per D-58-16 / 58-VERIFICATION.md
// row 59 — but CONTEXT.md / D-59-06 says teardown uses prefix 'seed_' or similar.
// Planner must reconcile: either (a) the e2e template changes to use 'test-' or 'seed_',
// or (b) the runTeardown prefix changes. Minimum 2-char guard per T-58-07-02 rules
// out '' as a teardown prefix regardless.)

teardown('delete test dataset', async () => {
  // Auth unregister stays in tests/ (D-24).
  const testsClient = new TestsAdminClient();
  await testsClient.unregisterCandidate('test.unregistered@openvaa.org');
  await testsClient.unregisterCandidate('test.unregistered2@openvaa.org');

  // Data teardown via package API.
  const { rowsDeleted, storageRemoved } = await runTeardown(PREFIX, new SupabaseAdminClient());
  expect(rowsDeleted, 'runTeardown deleted zero rows').toBeGreaterThan(0);
  // storageRemoved may be 0 if no portraits were seeded by the e2e template.
});
```

**`runTeardown` signature from the package** (`packages/dev-seed/src/cli/teardown.ts:92-105`):

```typescript
export interface TeardownResult {
  rowsDeleted: number;
  storageRemoved: number;
}

export async function runTeardown(prefix: string, client: TeardownClient): Promise<TeardownResult>;
```

**Notes for Phase 59:**
- **Prefix mismatch is load-bearing.** The current fixtures use `test-` as the
  `external_id` prefix; the e2e template per Phase 58 uses `''` (empty) per
  D-58-16 so Playwright specs can literal-match `test-candidate-alpha` rather
  than a prefixed version. `runTeardown` refuses `''` (2-char minimum per
  T-58-07-02, enforced at `teardown.ts:108-110`). Planner MUST decide one of:
  1. Change the e2e template's `externalIdPrefix` to `test-` (or `seed_`) and
     update the Playwright spec assertions that reference literal `test-…`
     externalIds. OR
  2. Ship a teardown variant that takes an explicit ids list (not prefix-based)
     for the e2e case. OR
  3. Accept the 2-char minimum means e2e prefix must be `test-` and adjust the
     e2e template accordingly.
  Option 3 is the smallest delta to existing specs and the teardown safety
  guard. This is a **D-59-06 scope detail the planner must lock**.
- Subclass import collides with the dev-seed base — rename one of them (e.g. `TestsAdminClient`) to disambiguate.

---

### `tests/tests/setup/variant-*.setup.ts` (3 files)

**Analog:** `packages/dev-seed/src/templates/e2e.ts` (TMPL-03 `fixed[]` pattern)

**Current shape** (all 3 variant setup files follow an identical pattern — see `variant-constituency.setup.ts`):

```typescript
import defaultDataset from '../data/default-dataset.json' with { type: 'json' };
import voterDataset from '../data/voter-dataset.json' with { type: 'json' };
import overlay from '../data/overlays/constituency-overlay.json' with { type: 'json' };
import { mergeDatasets } from '../utils/mergeDatasets';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';

setup('import constituency dataset', async () => {
  const client = new SupabaseAdminClient();
  await client.bulkDelete({ /* same 8-table reverse-order shape */ });
  const merged = mergeDatasets(mergeDatasets(defaultDataset, voterDataset), overlay);
  await client.bulkImport(merged as Record<string, unknown[]>);
  await client.importAnswers(merged as Record<string, unknown[]>);
  await client.linkJoinTables(merged as Record<string, unknown[]>);
  await client.updateAppSettings({...});
});
```

**Two target patterns** (planner picks one):

**Option A — Variant templates as filesystem files.** Create
`tests/tests/setup/templates/constituency-variant.ts` etc. following the
`packages/dev-seed/src/templates/e2e.ts` pattern; point `runPipeline` at them.
Matches the D-58-10 filesystem-template loader path. Keeps variants close to the
specs that use them.

**Option B — Inline TMPL-03 template literals.** Each variant setup file
declares the `Template` inline (mixing `fixed[]` + `count`) and calls
`runPipeline(template, overrides)`. Fewer files to maintain; couples the
template shape to the setup call site.

**Pattern source for either option** — the e2e template at
`packages/dev-seed/src/templates/e2e.ts` demonstrates the `fixed[]` pattern
across all entity tables with relational wiring via `external_id` refs.
Specifically, see how elections reference `_constituencyGroups` sentinels
(e2e.ts lines with `_constituencyGroups: [...]` markers — planner greps for
exact positions).

**Notes for Phase 59:**
- The overlay merge pattern (`mergeDatasets(mergeDatasets(default, voter), overlay)`) is unique to variant setups. After the rewrite, `mergeDatasets.ts` at `tests/tests/utils/mergeDatasets.ts` is dead code — delete it.
- Variant tests currently exercise specific constituency configurations (multi-election, constituency hierarchy, startfromcg). The e2e audit (58-E2E-AUDIT.md) did NOT include variant specs per D-58-15 scope — only the default voter-app specs. Phase 59 planner must audit whether the e2e template covers the variant specs' contracts or whether variants need dedicated templates.
- If variant specs cascade-fail today (in the 55 cascade pool per 59-CONTEXT.md D-59-04), Phase 59 does not need to make them green — only to ensure they don't REGRESS from passing to failing. If they currently pass, they must still pass post-swap.

---

### `tests/tests/utils/testCredentials.ts` (MODIFY)

**Analog:** `packages/dev-seed/src/templates/e2e.ts` (source of truth for
candidate fixture identities) + self

**Current shape** (tests/tests/utils/testCredentials.ts:1-12):

```typescript
import defaultDataset from '../data/default-dataset.json' with { type: 'json' };

export const TEST_CANDIDATE_EMAIL = defaultDataset.candidates[0].email;
export const TEST_CANDIDATE_PASSWORD = 'Password1!';
```

**Target shape (Path 1 — re-export from package):**

```typescript
// Sources:
// - email comes from @openvaa/dev-seed e2e template's fixed candidate[0]
// - password is a tests/-only constant set by data.setup.ts's forceRegister call
import { BUILT_IN_TEMPLATES } from '@openvaa/dev-seed';

export const TEST_CANDIDATE_EMAIL =
  (BUILT_IN_TEMPLATES.e2e.candidates?.fixed?.[0] as { email?: string } | undefined)?.email
  ?? 'mock.candidate.2@openvaa.org'; // fallback matches e2e template invariant
export const TEST_CANDIDATE_PASSWORD = 'Password1!';
```

**Target shape (Path 2 — hardcode):**

```typescript
// Constants mirror e2e template fixed[] candidate[0]; keep in sync if the
// template changes.
export const TEST_CANDIDATE_EMAIL = 'mock.candidate.2@openvaa.org';
export const TEST_CANDIDATE_PASSWORD = 'Password1!';
```

**Notes for Phase 59:**
- Path 1 is preferable (DRY; the template is the source of truth per D-58-15).
- Path 2 is simpler and matches the 58-VERIFICATION.md invariant "test-candidate-alpha first position, mock.candidate.2@openvaa.org auth contract preserved" — the email is already load-bearing and unchanging.

---

### 5 spec files (MODIFY): read-out patterns from JSON fixtures

**Files:** `candidate-registration.spec.ts`, `candidate-profile.spec.ts`,
`voter-detail.spec.ts`, `voter-matching.spec.ts`, `voter-results.spec.ts`

**Pattern usage (grep evidence above):**

- `candidateAddendum.candidates[0].email`, `...[0].externalId`, `...[1].email`, `...[1].externalId`
- `defaultDataset.candidates[0].email`
- `defaultDataset.candidates.find((c) => c.externalId === 'test-candidate-alpha')!`
- `defaultDataset.questions.filter((q) => q.type === 'singleChoiceOrdinal')`
- `voterDataset.candidates.filter(...)`, `voterDataset.candidates.find(...)`
- `defaultDataset.candidates.length`, `defaultDataset.organizations.length`

**Target pattern — swap JSON reads for typed template-derived imports:**

```typescript
// Before:
import defaultDataset from '../../data/default-dataset.json' with { type: 'json' };
const alphaCandidate = defaultDataset.candidates.find((c) => c.externalId === 'test-candidate-alpha')!;

// After (Path 1 — re-export from package; planner ships a sibling module):
import { e2eCandidates } from '@openvaa/dev-seed/templates/e2e-refs'; // or equivalent entry
const alphaCandidate = e2eCandidates.find((c) => c.external_id === 'test-candidate-alpha')!;

// After (Path 2 — read from BUILT_IN_TEMPLATES):
import { BUILT_IN_TEMPLATES } from '@openvaa/dev-seed';
const alphaCandidate = BUILT_IN_TEMPLATES.e2e.candidates!.fixed!.find(
  (c) => (c as { external_id: string }).external_id === 'test-candidate-alpha'
)!;
```

**Notes for Phase 59:**
- Note the **property-name case change**: current JSON uses `externalId` (camelCase); `Template.candidates.fixed[]` uses `external_id` (snake_case, matching `TablesInsert<'candidates'>`). Every spec access that says `.externalId` must change to `.external_id`. This is a mechanical edit but it's across 5 files.
- Same applies to `email` — the JSON shape likely has `email` but the template row shape has it in `candidates` as per schema. Planner verifies the e2e template's candidate row shape includes `email` as a column (it does per Supabase schema — see migration).
- `type === 'singleChoiceOrdinal'` filters in voter-matching.spec.ts filter by question type. The e2e template ships questions with matching types; planner verifies the type strings match (schema column is `question_types.type`).
- Several spec reads (`defaultDataset.candidates.length`) count rows. Post-swap, `BUILT_IN_TEMPLATES.e2e.candidates.fixed.length` yields the same number IF the template's fixed[] matches the fixture candidate count. If it's an aggregate (default + voter), the spec must source from the combined e2e set.

---

### `.planning/phases/59-.../baseline/playwright-report.json` + `baseline/summary.md`

**Analog for committed artifact pattern:**
`packages/dev-seed/tests/integration/default-template.integration.test.ts` (a committed test that captures a live contract) + `.planning/phases/58-templates-cli-default-dataset/58-E2E-AUDIT.md` (a committed phase-dir doc).

**Playwright JSON reporter wiring pattern** (tests/playwright.config.ts:63):

```typescript
reporter: [['html', { outputFolder: path.join(TESTS_DIR, '../playwright-report') }]],
```

To produce the baseline JSON per D-59-03, invoke (verbatim from 59-CONTEXT.md):

```bash
yarn dev:reset
yarn dev &
# wait for Supabase API (:54321) + Vite dev server (:5173) to respond
yarn test:e2e --reporter=json,list --workers=1
```

Playwright `--reporter` accepts CLI flag overrides per
`playwright test --help` — no config change required. Pipe the JSON to
`.planning/phases/59-.../baseline/playwright-report.json`:

```bash
yarn test:e2e --reporter=json,list --workers=1 > .planning/phases/59-e2e-fixture-migration/baseline/playwright-report.json
```

**`summary.md` target shape** (hand-authored or scripted per Claude's
Discretion; analog is `58-E2E-AUDIT.md`'s section-structured format):

```markdown
# Phase 59 Baseline — E2E Snapshot from `main`

**Captured:** 2026-04-23
**Baseline commit:** {SHA}
**Invocation:** `yarn test:e2e --reporter=json,list --workers=1`
**Total runtime:** {N}s

## 15 Passing Tests (the locked set — must stay green post-swap)
- spec/file.spec.ts › test name
- ...

## 19 Data-Race Failing Tests (the shifting pool — may flake differently)
- spec/file.spec.ts › test name
- ...

## 55 Cascade Failing Tests
- spec/file.spec.ts › test name
- ...
```

**Notes for Phase 59:**
- **Baseline capture is D-59-01's first commit of the phase.** Run against current `main` before any swap work begins. The 15/19/55 split is known — these counts must match the report contents.
- CI's existing `tests/playwright-report/` upload (`.github/workflows/main.yaml:167`) is a 90-day artifact; the committed `.planning/` copy is permanent (D-59-02 rationale).

---

### Diff script (e.g. `scripts/diff-playwright-reports.ts` under phase dir)

**Analog:** `packages/dev-seed/src/cli/summary.ts` (pure formatter consumed by CLI) + `packages/dev-seed/tests/utils.ts` (pure helpers)

**`cli/summary.ts` pattern** (packages/dev-seed/src/cli/summary.ts):

```typescript
export interface SummaryInput {
  templateName: string;
  seed: number;
  elapsedMs: number;
  portraits: number;
  rowCounts: Record<string, number>;
}

export function formatSummary(input: SummaryInput): string {
  // ... aligned-table construction, pure function, stdout-safe
}
```

**Target pattern for the diff script:**

```typescript
#!/usr/bin/env tsx
/**
 * Compare two Playwright JSON reports (baseline vs post-swap).
 *
 * Filters the 19 known data-race test names (D-59-13) and reports the delta
 * per D-59-04's rule: every previously-passing test must still pass; no tests
 * may enter the data-race pool from the pass or cascade sets.
 *
 * Usage:
 *   tsx scripts/diff-playwright-reports.ts <baseline.json> <post-swap.json>
 * Exit 0 = gate satisfied. Exit 1 = regression detected.
 */

import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

const DATA_RACE_TESTS = [
  // ... 19 test names copied from baseline/summary.md
];

interface PlaywrightReport { /* ... */ }

// 1. parse both reports
// 2. partition tests: pass, fail, skip
// 3. subtract DATA_RACE_TESTS from both sides
// 4. emit delta: (baseline.pass ∩ post.fail) and (baseline.cascade ∩ post.pass-turned-fail)
// 5. exit non-zero if delta non-empty
```

**Analogs for subpatterns:**

- `parseArgs` from `node:util`: see `packages/dev-seed/src/cli/seed.ts:59-68` — strict options, no positionals.
- Pure function style (no `process.*` side-effects in the core): see `packages/dev-seed/src/cli/summary.ts` + `packages/dev-seed/src/cli/teardown.ts:104-137` (split `runTeardown` vs CLI wrapper).
- Filter-then-diff: no direct analog in the repo; write from scratch. Consider `jq` as an alternative per 59-CONTEXT.md — a 10-line `jq` filter in a shell script matches D-59's minimalism. Planner's call.

**Notes for Phase 59:**
- If the 19 data-race test names are load-bearing, embed them in the script from `baseline/summary.md` at authoring time (single source: the summary). A script that re-reads `baseline/summary.md` and parses its markdown is brittle; direct inlining is fine for a one-off.
- Script's exit code gates D-59-04's parity rule; CI runs this after the post-swap test run.

---

### `.planning/phases/59-.../deps-check.txt` (D-59-11 dep-graph artifact)

**Analog:** NONE in the repo — first dep-graph artifact. Closest analogs for tooling choice:

| Tool | Repo status | Notes |
|------|-------------|-------|
| `madge` | Not in catalog | Single command; common choice; `npx madge --circular --extensions ts packages/dev-seed/src` |
| `dependency-cruiser` | Not in catalog | More features than needed; overkill |
| `yarn workspaces foreach -A run typecheck` | **Available** — `yarn test:unit`, `yarn lint:check` already use similar patterns | TypeScript project references surface cycles as compile errors; zero new tool |
| TypeScript project references | **Already configured** via `packages/*/tsconfig.json` → `references: [{path: "../core/tsconfig.json"}]` | A cyclical reference would fail `yarn build` today |

**Recommended approach for D-59-11:**

Since the repo already uses TypeScript project references (CLAUDE.md §Module Resolution), and `yarn build` via Turborepo enforces acyclic dependency order, the simplest zero-new-tool verification is:

```bash
# Verify no cyclic deps by running the full build — Turborepo aborts on cycles
yarn build 2>&1 | tee deps-check.txt

# Additionally capture the project-reference graph for the VERIFICATION table
find packages/dev-seed packages/core packages/data packages/matching \
  packages/filters packages/app-shared packages/supabase-types \
  -name tsconfig.json -exec sh -c 'echo "=== $0 ==="; cat "$0"' {} \; \
  >> deps-check.txt
```

If the planner wants an explicit cycle-scanner, a one-off `npx madge --circular --extensions ts packages/dev-seed/src tests/tests/utils` is lightweight (madge has no config; zero repo churn). Capture stdout to `deps-check.txt`.

**Notes for Phase 59:**
- D-59-11 mandates the artifact; Claude's Discretion is the exact tool. Whichever is picked, the output goes to `.planning/phases/59-.../deps-check.txt` and is referenced from VERIFICATION.md.
- The D-24 split is already load-bearing for this check — the dev-seed base + tests/ subclass pattern is what verification must confirm didn't introduce cycles. Key edges to probe:
  - `@openvaa/dev-seed` → `@openvaa/core`, `@openvaa/matching`, `@openvaa/supabase-types` (forward only per CLAUDE.md dependency flow)
  - `tests/` → `@openvaa/dev-seed` (forward only)
  - `@openvaa/dev-seed` MUST NOT depend on `tests/` (would invert the split)

---

### `.planning/phases/59-.../59-VERIFICATION.md`

**Analog:** `.planning/phases/58-templates-cli-default-dataset/58-VERIFICATION.md` (very close scope — ROADMAP-driven success criteria + artifact table) + `.planning/phases/56-generator-foundations-plumbing/56-VERIFICATION.md` (simpler structure, closer to Phase 59's size).

**YAML frontmatter pattern** (from 56-VERIFICATION.md:1-13):

```yaml
---
phase: 59-e2e-fixture-migration
verified: 2026-04-NNTHH:MM:SSZ
status: passed | human_needed | failed
score: N/M success criteria verified
overrides_applied: 0
human_verification:
  - test: "..."
    expected: "..."
    why_human: "..."
re_verification:
  previous_status: none
  previous_score: n/a
  gaps_closed: []
  gaps_remaining: []
  regressions: []
---
```

**Top-level section structure** (from 58-VERIFICATION.md:25-146):

1. `# Phase 59: E2E Fixture Migration Verification Report`
2. `## Goal Achievement` with sub-sections:
   - `### Success Criteria (from ROADMAP.md)` — 4 rows (one per ROADMAP SC) with Status + Evidence columns
   - `### Required Artifacts` — table listing every new/modified/deleted file
   - `### Key Link Verification` — edges (e.g., `runTeardown → SupabaseAdminClient.bulkDelete`)
   - `### Requirements Coverage` — E2E-01 through E2E-04 rows with status + evidence
3. `## D-24 Admin Client Split Rationale` (D-59-11 mandatory section):
   - Restate the split boundary
   - Public surface table: `@openvaa/dev-seed` methods vs `tests/` methods
   - Link to `deps-check.txt`
   - Confirmation of zero new cycles
4. `## Parity Gate` (D-59-04):
   - Baseline vs post-swap delta (should be empty modulo 19-race pool)
   - Link to `baseline/playwright-report.json` + post-swap report
5. `## Out-of-Scope Notes` (D-59-13) — 19 data-race + 55 cascade failures deferred

**Notes for Phase 59:**
- VERIFICATION.md is authored during or after execution, not during planning — but the plan should scaffold the file with `status: pending` and the checklist table shape.
- D-59-11's public-surface table is the NEW content unique to Phase 59 — it documents what moved and what stayed per D-24.

## Shared Patterns

### Programmatic dev-seed API usage

**Source:** `packages/dev-seed/src/index.ts` (public barrel) + `packages/dev-seed/tests/integration/default-template.integration.test.ts:36-44` (working example of the full API chain)

**Apply to:** `tests/seed-test-data.ts`, `tests/tests/setup/data.setup.ts`, `tests/tests/setup/variant-*.setup.ts`, `tests/debug-setup.ts`

**Canonical chain** (integration test lines 125-137):

```typescript
import {
  BUILT_IN_OVERRIDES,
  BUILT_IN_TEMPLATES,
  fanOutLocales,
  runPipeline,
  SupabaseAdminClient,
  TEST_PROJECT_ID,
  Writer
} from '@openvaa/dev-seed';

const template = BUILT_IN_TEMPLATES.e2e; // or .default
const overrides = BUILT_IN_OVERRIDES.e2e ?? {};
const seed = (template as { seed?: number }).seed ?? 42;
const prefix = (template as { externalIdPrefix?: string }).externalIdPrefix ?? 'seed_';

const writer = new Writer();
const rows = runPipeline(template, overrides);
fanOutLocales(rows, template, seed);
await writer.write(rows, prefix);
```

This is the same pattern every new/modified seed-data consumer should use.

---

### Env / dotenv loading

**Source:** `packages/dev-seed/src/cli/seed.ts:42-57`

**Apply to:** `tests/seed-test-data.ts` (standalone script)

```typescript
// Load repo-root .env if present (Node 22+ built-in). Silent no-op if missing.
try {
  process.loadEnvFile(new URL('../../../../.env', import.meta.url).pathname);
} catch {
  // no .env at repo root — env must be exported manually
}
// Fall back to PUBLIC_SUPABASE_URL when SUPABASE_URL is absent.
if (!process.env.SUPABASE_URL && process.env.PUBLIC_SUPABASE_URL) {
  process.env.SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
}
```

Alternative (used by existing `tests/playwright.config.ts:2,6`): `dotenv.config()`.
The playwright-side code is already using `dotenv`; match the side you're on.

---

### CLI script structure (tsx, parseArgs, try/catch)

**Source:** `packages/dev-seed/src/cli/teardown.ts:166-203` (direct-invocation guard + try/catch)

**Apply to:** Diff script, if implemented as tsx rather than jq/shell.

```typescript
const isDirectInvocation =
  typeof process.argv[1] === 'string' &&
  (process.argv[1].endsWith('script-name.ts') || process.argv[1].endsWith('script-name.js'));

if (isDirectInvocation) {
  const { values } = parseArgs({ options: { /* ... */ }, strict: true, allowPositionals: false });
  try {
    // ... orchestration ...
    process.exit(0);
  } catch (err) {
    const message = (err as Error)?.message ?? String(err);
    process.stderr.write(`Error: ${message}\n`);
    process.exit(1);
  }
}
```

This keeps the pure logic importable for unit tests while gating the
side-effectful CLI block on direct execution.

---

### VERIFICATION.md authoring

**Source:** `.planning/phases/56-generator-foundations-plumbing/56-VERIFICATION.md` + `.planning/phases/58-templates-cli-default-dataset/58-VERIFICATION.md`

**Apply to:** `.planning/phases/59-.../59-VERIFICATION.md`

Both prior phases share:

1. YAML frontmatter with `phase`, `verified`, `status`, `score`, `overrides_applied`, `re_verification`.
2. Goal quote + meta (Verified date, Status, Re-verification flag).
3. `## Goal Achievement` > `### Success Criteria (from ROADMAP.md)` table with columns `# | Truth/SC | Status | Evidence`.
4. `### Required Artifacts` table with columns `Artifact | Expected | Status | Details`.
5. `### Key Link Verification` table with columns `From | To | Via | Status | Details`.
6. `### Requirements Coverage` table.
7. Phase-specific bottom sections (Phase 58 has Data-Flow Trace + Behavioral Spot-Checks; Phase 59 should have Parity Gate + D-24 Admin Client Split).

## No Analog Found

Files with no close match in the codebase (planner uses patterns from
elsewhere or ships greenfield):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `.planning/phases/59-.../baseline/playwright-report.json` | committed test artifact | — | No prior phase committed a raw Playwright JSON report. The analog for the pattern (committing a long-lived artifact) is `packages/dev-seed/src/assets/portraits/*.jpg` + `LICENSE.md` from Phase 58, but the shape is different. |
| `.planning/phases/59-.../baseline/wait-for-healthy.sh` | health-check script | — | No existing `wait-for-healthy` script; closest analog is the retry-message phrasing in `packages/dev-seed/src/cli/seed.ts:202-209`. CI workflow at `.github/workflows/main.yaml:112-175` may have a shell snippet (planner greps for `curl` / `retry` / `wait`). |
| `.planning/phases/59-.../scripts/diff-playwright-reports.{ts,sh}` | filter + delta | transform | No existing diff tool for Playwright reports. `packages/dev-seed/src/cli/summary.ts` is the closest pure-function-formatter analog but it produces output from a single input. |
| `.planning/phases/59-.../deps-check.txt` | committed tool output | — | No prior dep-graph artifact; first of its kind. See §"Deps-check" above for tooling candidates. |

## Metadata

**Analog search scope:**
- `packages/dev-seed/src/` (15 .ts files scanned; index.ts + cli/{seed,teardown,resolve-template,summary}.ts + tests/integration/*.ts read in full)
- `tests/` (seed-test-data.ts + tests/utils/supabaseAdminClient.ts + tests/utils/testCredentials.ts + tests/setup/*.ts + playwright.config.ts read in full; all spec file imports greped)
- `.planning/phases/56-.../`, `.planning/phases/57-.../`, `.planning/phases/58-.../` VERIFICATION.md + PATTERNS.md surveys
- Root `package.json` + `.github/workflows/main.yaml` (for CI + script namespace context)
- No node_modules or build artifacts

**Files scanned (not counting read in full):** ~30 files via grep; 14 files read in full.

**Pattern extraction date:** 2026-04-23
