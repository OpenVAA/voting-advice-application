# Phase 56: Generator Foundations & Plumbing - Pattern Map

**Mapped:** 2026-04-22
**Files analyzed:** ~28 new files + 3 modified files
**Analogs found:** 23 strong / 28 new files (5 are greenfield with documented library patterns)

## Decision → File Index

Maps every locked decision (D-01 … D-28) onto the file(s) that implement it. Planner uses this as a traceability checklist when slicing plans.

| Decision | Implemented in |
|---|---|
| D-01 (new package `@openvaa/dev-seed`) | `packages/dev-seed/package.json` |
| D-02 (`dev:foo` CLI namespace) | *Phase 58 — no Phase 56 file* |
| D-03 (doc sync for `@openvaa/dev-tools` → `@openvaa/dev-seed` refs) | `.planning/REQUIREMENTS.md` (+ Roadmap/Project — called out, minimal here) |
| D-04 (class-per-generator `generate(fragment)`) | All 14 `packages/dev-seed/src/generators/*.ts` |
| D-05 (override map, full-replace) | `packages/dev-seed/src/pipeline.ts` + `src/index.ts` (type export) |
| D-06 (fixed topo order) | `packages/dev-seed/src/pipeline.ts` (TOPO_ORDER const) |
| D-07 (ctx: faker + projectId + refs + logger) | `packages/dev-seed/src/ctx.ts` |
| D-08 (per-generator `defaults(ctx)`) | All 14 generator classes; merged in `pipeline.ts` |
| D-09 (reuse `bulk_import` RPC) | `packages/dev-seed/src/writer.ts` (delegates to `supabaseAdminClient.ts`) |
| D-10 (reuse `importAnswers` + `linkJoinTables`) | `packages/dev-seed/src/writer.ts` |
| D-11 (accounts/projects pass-through; feedback direct upsert; joins via `linkJoinTables`) | `packages/dev-seed/src/writer.ts` + `src/ctx.ts` (bootstrap refs) |
| D-12 (NF-05 = `bulk_import` single-txn; JSDoc doc-only) | `packages/dev-seed/src/writer.ts` JSDoc |
| D-13/D-14 (SUPERSEDED by D-24) | — |
| D-15 (env-var check at writer ctor, not at import) | `packages/dev-seed/src/writer.ts` (ctor) + `tests/writer.test.ts` |
| D-16 (zod schema + `z.infer<>`) | `packages/dev-seed/src/template/schema.ts` |
| D-17 (Template type in `@openvaa/dev-seed`) | `packages/dev-seed/src/template/types.ts` + `src/index.ts` re-export |
| D-18 (minimal `.optional()` schema; `.extend()` in P57/P58) | `packages/dev-seed/src/template/schema.ts` |
| D-19 (random-valid stub emitter) | `packages/dev-seed/src/emitters/answers.ts` (`defaultRandomValidEmit`) |
| D-20 (shape-valid only; subdimension = matching's job) | `packages/dev-seed/src/emitters/answers.ts` (comment-only; no code) |
| D-21 (P57 fallback note) | *No P56 file — noted in the emitter's JSDoc for P57 handoff* |
| D-22 (pure I/O per-generator tests) | `packages/dev-seed/tests/generators/*.test.ts` (14 files) |
| D-23 (writer test = env check + call shape with mock) | `packages/dev-seed/tests/writer.test.ts` |
| D-24 (admin-client SPLIT, not move) | `packages/dev-seed/src/supabaseAdminClient.ts` + rewritten `tests/tests/utils/supabaseAdminClient.ts` |
| D-25 (override signature `(fragment, ctx) => Rows[]`) | `packages/dev-seed/src/pipeline.ts` + REQUIREMENTS.md amendment |
| D-26 (generators capture `ctx` at construction; `defaults(ctx)` stays per-call) | All generator classes + `pipeline.ts` bridge |
| D-27 (`ctx.answerEmitter ?? defaultRandomValidEmit` seam) | `packages/dev-seed/src/ctx.ts` + `src/emitters/answers.ts` + `src/generators/CandidatesGenerator.ts` |
| D-28 (private workspace package; mirror dev-tools) | `packages/dev-seed/package.json` + `tsconfig.json` |
| TMPL-08 (deterministic seed) | `packages/dev-seed/tests/determinism.test.ts` |
| TMPL-09 (field-path validation error) | `packages/dev-seed/tests/template.test.ts` |

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `packages/dev-seed/package.json` | config | build/workspace | `packages/dev-tools/package.json` | exact |
| `packages/dev-seed/tsconfig.json` | config | build/workspace | `packages/dev-tools/tsconfig.json` + `packages/matching/tsconfig.json` | exact (hybrid) |
| `packages/dev-seed/vitest.config.ts` | config | test-discovery | `packages/matching/vitest.config.ts` | exact |
| `packages/dev-seed/src/index.ts` | package entry | exports | *no direct analog (greenfield, <20 lines)* | none — trivial |
| `packages/dev-seed/src/supabaseAdminClient.ts` | service / writer | request-response (RPC + REST) | `tests/tests/utils/supabaseAdminClient.ts` (split source) | exact (narrowing) |
| `packages/dev-seed/src/template/schema.ts` | validator | transform (input → parsed Template) | `packages/argument-condensation/src/core/condensation/responseValidators/responseWithArguments.ts` + `packages/question-info/src/utils/schemaGenerator.ts` | role-match |
| `packages/dev-seed/src/template/types.ts` | type | — | same as schema.ts (re-export via `z.infer<>`) | role-match |
| `packages/dev-seed/src/ctx.ts` | factory / utility | transform | *no direct analog — greenfield; library patterns from RESEARCH §5* | none (documented) |
| `packages/dev-seed/src/pipeline.ts` | orchestrator | batch / transform | `apps/supabase/supabase/migrations/00001_initial_schema.sql` `bulk_import` `processing_order` (lines 2751–2756) — TOPO ORDER source of truth | partial (conceptual) |
| `packages/dev-seed/src/writer.ts` | service / facade | request-response + batch | `tests/tests/utils/supabaseAdminClient.ts` write-path call sites | role-match (facade) |
| `packages/dev-seed/src/emitters/answers.ts` | utility (pure) | transform | *no direct analog — greenfield* | none |
| `packages/dev-seed/src/generators/*Generator.ts` (14 files) | generator (class) | transform (fragment → Rows[]) | `packages/data/src/objects/entities/variants/candidate.ts` (class shape) + RESEARCH §4 + §9 | role-match |
| `packages/dev-seed/tests/generators/*.test.ts` (14 files) | test | pure I/O | `packages/matching/tests/distance.test.ts` + `packages/data/src/objects/entities/variants/candidate.test.ts` | exact |
| `packages/dev-seed/tests/pipeline.test.ts` | test | pure I/O | `packages/matching/tests/distance.test.ts` | role-match |
| `packages/dev-seed/tests/writer.test.ts` | test | mocked request-response | `packages/matching/tests/distance.test.ts` (structure only; mocking is greenfield) | partial |
| `packages/dev-seed/tests/determinism.test.ts` | test | pure I/O (cross-cutting) | `packages/matching/tests/missingValue.test.ts` (single-concern cross-cutting test) | role-match |
| `packages/dev-seed/tests/template.test.ts` | test | pure I/O (validation errors) | `packages/matching/tests/distance.test.ts` (assert-throw pattern) | partial |
| `tests/tests/utils/supabaseAdminClient.ts` | service (rewrite) | request-response | self (origin — trimmed/re-exported from dev-seed) | exact |
| root `package.json` | config (one-line diff) | workspace | self (existing devDeps block) | exact |
| `.planning/REQUIREMENTS.md` | docs (one-line amendment) | — | self (GEN-03 row) | exact |

## Pattern Assignments

### `packages/dev-seed/package.json` (config, build/workspace)

**Analog:** `packages/dev-tools/package.json` (full file — 25 lines)

**Shape to mirror verbatim** (lines 1–24):

```jsonc
{
  "private": true,
  "name": "@openvaa/dev-tools",
  "version": "0.1.0",
  "description": "Internal developer tooling for OpenVAA maintainers (key generation, JWKS utilities).",
  "type": "module",
  "scripts": {
    "build": "echo 'Nothing to build.'",
    "lint": "eslint --flag v10_config_lookup_from_file src/",
    "typecheck": "tsc --noEmit",
    "pem-to-jwk": "tsx src/pem-to-jwk.ts",
    "keygen": "tsx src/keygen.ts"
  },
  "dependencies": {
    "jose": "^6.2.1"
  },
  "devDependencies": {
    "@openvaa/shared-config": "workspace:^",
    "@types/node": "catalog:",
    "eslint": "catalog:",
    "tsx": "catalog:",
    "typescript": "catalog:"
  }
}
```

**Points of divergence (dev-seed-specific):**
- Name: `@openvaa/dev-seed`; description: `"Template-driven dev data generator for OpenVAA local development."`
- **Add `"test:unit": "vitest run"` to scripts** — required for Turborepo's `test:unit` task to pick up the package (Pitfall 6 in RESEARCH.md; dev-tools has no tests so lacks this script).
- **Add `vitest: "catalog:"` to devDependencies**.
- **Replace `jose` runtime dep with**: `@openvaa/supabase-types: "workspace:^"`, `@supabase/supabase-js: "catalog:"` (per D-14, implied by D-24), `@faker-js/faker: "catalog:"`, `zod: "catalog:"` (per D-16).
- **Do NOT remove**: `private`, `type: module`, lint/typecheck/build scripts — all preserved verbatim per D-28.
- **Do NOT add**: `files`, `exports`, `publishConfig`, `license`, `module`, `types` — explicitly forbidden by D-28.
- **Do NOT keep dev-tools-only scripts** (`pem-to-jwk`, `keygen`).

---

### `packages/dev-seed/tsconfig.json` (config, build/workspace)

**Analog (primary, package shape):** `packages/dev-tools/tsconfig.json` (full file — 15 lines)

```jsonc
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@openvaa/shared-config/ts",
  "compilerOptions": {
    "lib": ["es2022"],
    "rootDir": "./src",
    "outDir": "./dist",
    "noEmit": true,
    "composite": false,
    "declarationMap": false,
    "types": ["node"]
  },
  "include": ["src/**/*"]
}
```

**Analog (secondary, `references` pattern):** `packages/matching/tsconfig.json` line 13

```jsonc
"references": [{ "path": "../core/tsconfig.json" }]
```

**Points of divergence:**
- **Add `references: [{ "path": "../supabase-types/tsconfig.json" }]`** — required for the IDE to resolve `TablesInsert<'X'>` without a build step (per CLAUDE.md "Module Resolution" note + RESEARCH §7).
- `noEmit: true` and `composite: false` are correct for a tsx-only package (D-28). Do NOT mirror matching's `declaration: true` / `emitDeclarationOnly: true` — those are for publishable packages.
- `include: ["src/**/*"]` excludes tests by default; add `tests/**/*` if per-package `typecheck` should cover tests (dev-tools does NOT — tests run via vitest's own type-check).

---

### `packages/dev-seed/vitest.config.ts` (config, test-discovery)

**Analog:** `packages/matching/vitest.config.ts` (full file — 5 lines)

```ts
/**
 * This empty config file is necessary ror `/vitest.workspace.ts` to recognize this module as a test workspace.
 */

export default {};
```

**Points of divergence:**
- **Copy verbatim.** Fix the typo (`ror` → `for`) if desired, but not required.
- Root `vitest.workspace.ts` contains `['packages/**/vitest.config.ts']` (1 line — verified). This empty marker is the minimum needed for `yarn test:unit:watch` to pick up dev-seed tests.
- **Crucial pairing:** `packages/dev-seed/package.json` must ALSO declare `"test:unit": "vitest run"` so Turborepo's `yarn test:unit` discovery path works (different mechanism from the workspace-discovery path). See RESEARCH §8 "Dual-path test discovery" and Pitfall 6.

---

### `packages/dev-seed/src/supabaseAdminClient.ts` (service, request-response)

**Analog:** `tests/tests/utils/supabaseAdminClient.ts` — THIS IS THE ORIGIN FILE being split per D-24. Lines 1–514 (everything up through `updateAppSettings`) move/get narrowed; lines 515–858 (auth + E2E helpers) stay in `tests/`.

**Imports pattern (lines 20–21):**
```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PROPERTY_MAP, TABLE_MAP } from '@openvaa/supabase-types';
```

**Constants to move (lines 23–60):**
```ts
export const TEST_PROJECT_ID = '00000000-0000-0000-0000-000000000001';
const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://localhost:54321';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? '<demo jwt>';
const COLLECTION_MAP: Record<string, string> = { ...TABLE_MAP, parties: 'organizations', questionTypes: 'question_types' };
const FIELD_MAP: Record<string, string> = { ...PROPERTY_MAP, documentId: 'id' };
function resolveCollectionName(collection: string): string { return COLLECTION_MAP[collection] ?? collection; }
function resolveFieldName(field: string): string { return FIELD_MAP[field] ?? field; }
```

**Constructor pattern (lines 87–96):**
```ts
export class SupabaseAdminClient {
  private client: SupabaseClient;
  private projectId: string;

  constructor(url?: string, serviceRoleKey?: string, projectId?: string) {
    this.client = createClient(url ?? SUPABASE_URL, serviceRoleKey ?? SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    this.projectId = projectId ?? TEST_PROJECT_ID;
  }
```

**Core `bulkImport` pattern to preserve verbatim (lines 158–198):**
```ts
async bulkImport(data: Record<string, unknown[]>): Promise<Record<string, unknown>> {
  const NON_COLUMN_FIELDS = new Set(['answersByExternalId']);
  const COLLECTION_NON_COLUMNS: Record<string, Set<string>> = { candidates: new Set(['email']) };
  const cleaned: Record<string, unknown[]> = {};
  for (const [collection, records] of Object.entries(data)) {
    const tableName = resolveCollectionName(collection);
    const extraStrip = COLLECTION_NON_COLUMNS[tableName];
    cleaned[tableName] = (records as Array<Record<string, unknown>>).map((record) => {
      const stripped: Record<string, unknown> = {};
      const isNomination = tableName === 'nominations';
      const hasCandidateRef = isNomination && ('candidate' in record || 'candidateExternalId' in record);
      for (const [key, value] of Object.entries(record)) {
        if (key.startsWith('_') || NON_COLUMN_FIELDS.has(key) || extraStrip?.has(key)) continue;
        if (isNomination && key === 'organization' && hasCandidateRef) continue;
        const snakeKey = resolveFieldName(key);
        if (value && typeof value === 'object' && !Array.isArray(value) && 'externalId' in (value as Record<string, unknown>)) {
          stripped[snakeKey] = { external_id: (value as Record<string, unknown>).externalId };
        } else {
          stripped[snakeKey] = value;
        }
      }
      return stripped;
    });
  }
  const { data: result, error } = await this.client.rpc('bulk_import', { p_data: cleaned as Record<string, unknown> });
  if (error) throw new Error(`bulkImport failed: ${error.message}`);
  return result as Record<string, unknown>;
}
```

**Methods to KEEP in dev-seed base (per D-24):**
- `bulkImport` (lines 158–198)
- `bulkDelete` (lines 207–218)
- `importAnswers` (lines 234–305)
- `linkJoinTables` (lines 322–480)
- `updateAppSettings` (lines 495–514)
- Constructor (lines 87–96)
- `COLLECTION_MAP` / `FIELD_MAP` / `TEST_PROJECT_ID` / `resolveCollectionName` / `resolveFieldName` (lines 26–85)

**Methods to DROP from dev-seed base (stay in tests/ shell — D-24):**
- `fixGoTrueNulls` / `safeListUsers` (lines 103–145)
- `findData` / `query` / `update` (lines 530–612)
- `setPassword` / `forceRegister` / `unregisterCandidate` / `sendEmail` / `sendForgotPassword` / `deleteAllTestUsers` (lines 628–857)
- Legacy aliases `parties`, `questionTypes`, `documentId` in the maps — these are only used by `findData` / `query`, so they can be moved to the tests/ subclass when splitting. Safer: keep them on the base (zero-cost shim) to avoid breaking consumers that somehow relied on them. Planner's call.

**Points of divergence from current behavior:**
- **Env-var fallback behavior MUST change per D-15** — the current fallback (`process.env.SUPABASE_URL ?? 'http://localhost:54321'` on line 31 and the demo-JWT fallback on line 37–39) is WRONG for dev-seed. The writer constructor (NOT this file's constants) is where `throw new Error(...)` goes. See `writer.ts` section below. The constants here can retain their fallbacks for backward compat with the tests/ shell, OR be replaced with `SUPABASE_URL = process.env.SUPABASE_URL` (no fallback) + the ctor validates. Planner picks — RESEARCH §2 and D-15 are the authority.
- **Constructor should NOT live in the base file** if env enforcement is at `writer.ts` — or the base ctor retains current fallback-tolerant behavior, and the writer wraps it with a pre-flight check. Cleanest path: keep ctor fallback-tolerant in the base (backward-compat for tests/ E2E); writer.ts does the env check before instantiating. This matches D-15 "writer constructor, NOT module import."
- **Polymorphism workaround (lines 172–180)** — RESEARCH §9 recommends dropping this on the dev-seed side by emitting only the authoritative FK ref in generators. Planner decision: keep the workaround in `bulkImport` for defense-in-depth (it's cheap), OR remove it to catch dev-seed-emission bugs loudly. Recommend: KEEP (backward-compat with tests/ fixtures that still emit both).

---

### `packages/dev-seed/src/template/schema.ts` (validator, transform)

**Analog (zod pattern):** `packages/argument-condensation/src/core/condensation/responseValidators/responseWithArguments.ts` (full file — 27 lines)

```ts
import { z } from 'zod';
import type { ResponseWithArguments } from '../../types/llm/responseWithArguments';

export const ResponseWithArgumentsSchema = z.object({
  arguments: z.array(
    z.object({
      id: z.string(),
      text: z.string()
    })
  ),
  reasoning: z.string()
}) satisfies z.ZodType<ResponseWithArguments>;
```

**Analog (dynamic / composed schema pattern):** `packages/question-info/src/utils/schemaGenerator.ts` lines 1–20

```ts
import { z } from 'zod';

const infoSectionSchema = z.object({
  title: z.string(),
  content: z.string()
});

const termSchema = z.object({
  triggers: z.array(z.string()),
  title: z.string(),
  content: z.string()
});
```

**Canonical Phase 56 schema per D-18 + RESEARCH §6 (target shape, lines 1–28):**

```ts
import { z } from 'zod';

const perEntityFragment = z.object({
  count: z.number().int().nonnegative().optional(),
  fixed: z.array(z.record(z.string(), z.unknown())).optional()
}).optional();

export const TemplateSchema = z.object({
  seed: z.number().int().optional(),
  externalIdPrefix: z.string().optional(),
  projectId: z.string().uuid().optional(),
  elections: perEntityFragment,
  constituency_groups: perEntityFragment,
  constituencies: perEntityFragment,
  organizations: perEntityFragment,
  alliances: perEntityFragment,
  factions: perEntityFragment,
  candidates: perEntityFragment,
  question_categories: perEntityFragment,
  questions: perEntityFragment,
  nominations: perEntityFragment,
  app_settings: perEntityFragment,
  feedback: perEntityFragment
});

export type Template = z.infer<typeof TemplateSchema>;
```

**Points of divergence from analogs:**
- Unlike `responseWithArguments.ts`, dev-seed derives the TS type via `z.infer<>` (D-16) rather than `satisfies z.ZodType<T>` — no pre-existing hand-written type exists to satisfy.
- Unlike `schemaGenerator.ts`, the dev-seed schema is STATIC (not composed at runtime from params) — fragments mirror the fixed topo-ordered 13-entity list per D-18.
- **Every field `.optional()`** per D-18. Do NOT use `.default()` anywhere in the schema — defaults live in per-generator `defaults(ctx)` per D-08.
- **`.extend()` not `.merge()`** for Phase 57/58 extensions per zod v4 migration (RESEARCH §6 Pattern 2). Not implemented here — just a note for P57.
- **Field-pointing errors** come from `result.error.issues[].path` in zod v4. The `validateTemplate` helper (RESEARCH §6 Pattern 3) formats these; test file `tests/template.test.ts` asserts the path appears in the message.

---

### `packages/dev-seed/src/template/types.ts` (type export)

**Analog:** Same as `schema.ts` — the type is derived, not hand-written.

**Pattern:**
```ts
export type { Template } from './schema';
```

or inline in `schema.ts` and re-exported from `src/index.ts`. Planner picks; layout is Claude's Discretion per CONTEXT.md.

**Divergence:** D-17 says consumers use `import type {Template} from '@openvaa/dev-seed'`. The top-level `src/index.ts` must re-export it.

---

### `packages/dev-seed/src/ctx.ts` (factory / utility)

**Analogs:** None direct — greenfield per RESEARCH §5. Library pattern from `@faker-js/faker` v8 docs:

**Target pattern (Pattern A, recommended — RESEARCH §5):**

```ts
import { Faker, en } from '@faker-js/faker';
import type { Template } from './template/types';

export interface Ctx {
  faker: Faker;
  projectId: string;
  externalIdPrefix: string;
  refs: {
    accounts: Array<{ id: string; external_id?: string }>;
    projects: Array<{ id: string; external_id?: string }>;
    elections: Array<{ external_id: string }>;
    // ... all 13 entities
  };
  logger: (msg: string) => void;
  answerEmitter?: AnswerEmitter;  // D-27 seam
}

export function buildCtx(template: Template): Ctx {
  return {
    faker: new Faker({ locale: [en], seed: template.seed ?? 42 }),
    projectId: template.projectId ?? '00000000-0000-0000-0000-000000000001',
    externalIdPrefix: template.externalIdPrefix ?? 'seed_',
    refs: {
      accounts: [{ id: '00000000-0000-0000-0000-000000000001' }],  // bootstrap from seed.sql
      projects: [{ id: '00000000-0000-0000-0000-000000000001' }],
      // remaining arrays start empty — populated as generators run
      elections: [], constituency_groups: [], constituencies: [],
      organizations: [], alliances: [], factions: [], candidates: [],
      question_categories: [], questions: [], nominations: [],
      app_settings: [], feedback: []
    },
    logger: () => {}
  };
}
```

**Divergence from library defaults:**
- Use Pattern A (`new Faker({ seed })`) NOT Pattern B (`faker.seed(n)` on module-level singleton) — Pattern B has shared-state bugs in vitest parallel tests (RESEARCH §5 gotcha).
- `ctx.answerEmitter` is a TOP-LEVEL optional function pointer per D-27 (single function pointer, no interface ceremony). Planner may nest under `ctx.emitters.answer` if preferred (Claude's Discretion).
- Bootstrap refs for `accounts` / `projects` come from seed.sql — hardcoded UUIDs are fine for Phase 56 (seed.sql owns them); D-11 says these tables are never written by dev-seed.
- `ctx.faker` is constructed ONCE per pipeline run per D-07. All 14 generators share the SAME instance. This means a generator's output depends on call order of prior generators (determinism caveat — RESEARCH §5).

---

### `packages/dev-seed/src/pipeline.ts` (orchestrator, batch/transform)

**Analog (TOPO ORDER source of truth):** `apps/supabase/supabase/migrations/00001_initial_schema.sql` lines 2751–2756

```sql
processing_order text[] := ARRAY[
  'elections', 'constituency_groups', 'constituencies',
  'organizations', 'alliances', 'factions', 'candidates',
  'question_categories', 'questions',
  'nominations', 'app_settings'
];
```

**Target pipeline pattern (RESEARCH §"Code Examples" + D-25/D-26 bridge):**

```ts
import type { Template, Overrides, Ctx } from './types';
import { ElectionsGenerator } from './generators/ElectionsGenerator';
// ... 13 more imports

const TOPO_ORDER = [
  'elections', 'constituency_groups', 'constituencies',
  'organizations', 'alliances', 'factions', 'candidates',
  'question_categories', 'questions', 'nominations', 'app_settings',
  'feedback'  // D-11: run last, handled by writer via direct upsert
] as const;

const GENERATOR_CLASSES = {
  elections: ElectionsGenerator,
  constituency_groups: ConstituencyGroupsGenerator,
  // ... 12 more
} as const;

export function runPipeline(template: Template, overrides: Overrides = {}, ctx = buildCtx(template)): Record<string, unknown[]> {
  const output: Record<string, unknown[]> = {};
  for (const table of TOPO_ORDER) {
    const Gen = GENERATOR_CLASSES[table];
    const gen = new Gen(ctx);  // D-26: ctx captured at construction
    const fragment = { ...gen.defaults(ctx), ...(template[table] ?? {}) };  // D-08 merge order: template OVER defaults
    // D-25 override signature + D-26 bridge:
    const rows = overrides[table]?.(fragment, ctx) ?? gen.generate(fragment);
    output[table] = rows;
    // D-07 ref-map population (minimal external_id stub):
    ctx.refs[table] = rows.map((r) => ({ external_id: r.external_id }));
  }
  return output;
}
```

**Points of divergence:**
- **Add `feedback` to the TOPO_ORDER** at the end — it's NOT in `bulk_import`'s `processing_order` (per D-11) but it IS a dev-seed generator. The writer routes feedback rows outside `bulk_import` via direct upsert.
- **Do NOT call the writer here** — pipeline returns raw rows as a dict. Writer is a separate concern (see `writer.ts`). This lets unit tests assert pipeline output without mocking Supabase (D-22 "pure I/O").
- **`app_settings` — see RESEARCH §4.15 + Pitfall 5:** the planner must decide whether `app_settings` rows flow through bulk_import (triggers UNIQUE-on-project_id conflict with seed.sql) or through `updateAppSettings` (direct merge). Recommended: route through `updateAppSettings` in the writer (option A), treat `app_settings` generator output as `{ settings: {...}, customization: {...} }` blobs (not bulk-imported rows).
- **Merge order correction** — D-08 says `resolveFragment(template, ctx)` MERGES TEMPLATE OVER DEFAULTS (template wins). Generator's `defaults(ctx)` returns the fallback; spread template second.

---

### `packages/dev-seed/src/writer.ts` (service / facade, request-response + batch)

**Analog:** `tests/tests/utils/supabaseAdminClient.ts` call sequence (across methods) — writer doesn't have a single-file analog; it composes calls already defined on the base class.

**Env enforcement pattern to DIVERGE from (lines 31–39 of source):**

```ts
// ❌ The EXISTING fallback behavior in supabaseAdminClient.ts (lines 31–39):
const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://localhost:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '<demo jwt fallback>';
```

**What dev-seed's `writer.ts` MUST do differently (per D-15):**

```ts
// ✅ Target pattern in packages/dev-seed/src/writer.ts:
import { SupabaseAdminClient } from './supabaseAdminClient';

export class Writer {
  private client: SupabaseAdminClient;

  constructor(opts: { projectId?: string } = {}) {
    if (!process.env.SUPABASE_URL) {
      throw new Error('SUPABASE_URL env var is required but not set. Did you forget to run `supabase start`?');
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY env var is required but not set.');
    }
    this.client = new SupabaseAdminClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, opts.projectId);
  }

  /**
   * NF-05 rollback: bulk_import runs as a single PostgREST transaction
   * (SECURITY INVOKER, migration line 2738). A mid-collection FK or
   * constraint violation aborts the RPC and nothing commits. importAnswers
   * and linkJoinTables each run as separate transactions; failures there
   * leave bulk_import rows committed (documented; acceptable per D-12).
   */
  async write(data: Record<string, unknown[]>): Promise<void> {
    const bulkData = { ...data };
    // D-11 routing: tables not in bulk_import's processing_order handled elsewhere
    delete bulkData.feedback;
    delete bulkData.accounts;
    delete bulkData.projects;
    // app_settings: recommended to route through updateAppSettings (RESEARCH §4.15 Pitfall 5)
    const appSettings = bulkData.app_settings;
    delete bulkData.app_settings;

    await this.client.bulkImport(bulkData);
    await this.client.importAnswers(bulkData);
    await this.client.linkJoinTables(bulkData);

    if (appSettings) {
      for (const row of appSettings as Array<{ settings?: Record<string, unknown> }>) {
        if (row.settings) await this.client.updateAppSettings(row.settings);
      }
    }
    if (data.feedback) {
      // D-11: direct upsert for feedback (no external_id; not idempotent)
      for (const fb of data.feedback as Array<Record<string, unknown>>) {
        // TODO: planner decides whether feedback ships in Phase 56 (Claude's Discretion)
      }
    }
  }
}
```

**Points of divergence (writer-specific):**
- **No fallbacks for env vars** per D-15. The throw must happen at CONSTRUCTION, not at module import (pure generators stay env-free so `yarn test:unit` has no env fixture requirement — Pitfall 6 + D-15).
- **D-11 routing pattern** — the 5 tables NOT in `bulk_import`'s `processing_order` (accounts, projects, feedback, both join tables) are handled outside `bulkImport`:
  - `accounts` / `projects`: stripped before RPC (pass-through refs; no writes);
  - `feedback`: direct upsert (or scope out per CONTEXT "Claude's Discretion");
  - Join tables: NEVER appear at top level — `linkJoinTables` reads `_constituencyGroups` / `_constituencies` / `_elections` sentinels off their parent rows.
- **`app_settings` route recommended through `updateAppSettings`** — RESEARCH Pitfall 5 documents the UNIQUE-on-project_id conflict with seed.sql. Planner should confirm this choice.
- **JSDoc NF-05 documentation is load-bearing** per D-12 — the rollback guarantee is from `bulk_import`'s single-txn behavior, NOT from client-side orchestration. The JSDoc must say this explicitly.

---

### `packages/dev-seed/src/emitters/answers.ts` (utility, pure)

**Analog:** None direct. Greenfield per D-19 / D-27.

**Target pattern (RESEARCH §Open Question 4 — locks the Phase 57 seam):**

```ts
import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx } from '../ctx';

export type AnswerEmitter = (
  candidate: TablesInsert<'candidates'>,
  questions: Array<TablesInsert<'questions'>>,
  ctx: Ctx
) => Record<string /* question external_id */, { value: unknown; info?: unknown }>;

/**
 * Phase 56 stub: emits random-valid answer per question (D-19).
 * - Likert (singleChoiceOrdinal): uniform random integer 1..5
 * - categorical (singleChoiceCategorical, multipleChoiceCategorical): random choice id(s)
 * - boolean: random true/false
 * - number / text / date / image / multipleText: shape-valid random value
 *
 * Phase 57 replaces this by setting ctx.answerEmitter to a latent-factor implementation.
 * See D-21: P57 emitter can fall back to random-valid for categorical when no loadings supplied.
 */
export const defaultRandomValidEmit: AnswerEmitter = (candidate, questions, ctx) => {
  const out: Record<string, { value: unknown }> = {};
  for (const q of questions) {
    const qExtId = q.external_id;
    if (!qExtId) continue;
    // branch on q.type — emit shape-valid value using ctx.faker
    // ... (planner fills in per question_type enum from database.ts:1148–1156)
  }
  return out;
};
```

**Points of divergence (no prior art to diverge from):**
- **D-27 seam shape** — single function pointer, NO interface. Phase 57 drops a new function into `ctx.answerEmitter`; the candidate generator does not change.
- **D-20 — shape-valid ONLY.** The generator does NOT know about subdimensions — that's matching's job. Random-valid for categorical = pick a random `choice.id` from `q.choices[].id`.
- **Use `ctx.faker`, not module-level faker** per RESEARCH §5 Pattern A.

---

### `packages/dev-seed/src/generators/*Generator.ts` (14 generator classes, transform)

**Analog (class shape):** `packages/data/src/objects/entities/variants/candidate.ts` lines 7–48

```ts
export class Candidate
  extends Entity<typeof ENTITY_TYPE.Candidate, CandidateData>
  implements DataAccessor<CandidateData>
{
  readonly objectType = OBJECT_TYPE.Candidate;

  get firstName(): string { return this.data.firstName; }
  get lastName(): string { return this.data.lastName; }
  get name(): string { return this.data.name || this.root.formatCandidateName({ object: this }); }
  // ...
}
```

**Analog (generator scaffold, from RESEARCH §"Code Examples" minimal skeleton):**

```ts
// packages/dev-seed/src/generators/CandidatesGenerator.ts
import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx } from '../ctx';
import { defaultRandomValidEmit } from '../emitters/answers';

export type CandidatesFragment = {
  count?: number;
  fixed?: Array<Partial<TablesInsert<'candidates'>> & { external_id: string }>;
};

export class CandidatesGenerator {
  constructor(private ctx: Ctx) {}  // D-26: ctx at construction

  defaults(_ctx: Ctx): CandidatesFragment {  // D-08: per-call method
    return { count: 5 };
  }

  generate(fragment: CandidatesFragment): Array<TablesInsert<'candidates'>> {
    const { faker, projectId, externalIdPrefix, refs } = this.ctx;
    const rows: Array<TablesInsert<'candidates'>> = [];

    // fixed[] pass-through (modulo prefix)
    for (const fixed of fragment.fixed ?? []) {
      rows.push({
        ...fixed,
        external_id: `${externalIdPrefix}${fixed.external_id}`,
        project_id: projectId
      });
    }

    // generated rows
    for (let i = 0; i < (fragment.count ?? 0); i++) {
      const party = refs.organizations[i % (refs.organizations.length || 1)];
      const row: TablesInsert<'candidates'> = {
        external_id: `${externalIdPrefix}cand_${String(i).padStart(4, '0')}`,
        project_id: projectId,
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName()
      };
      if (party) {
        // @ts-expect-error — bulk_import accepts {external_id} refs in place of FK columns
        row.organization = { external_id: party.external_id };
      }
      // D-27 answer emitter hook:
      const emit = this.ctx.answerEmitter ?? defaultRandomValidEmit;
      // @ts-expect-error — answersByExternalId is a sentinel field for importAnswers
      row.answersByExternalId = emit(row, this.ctx.refs.questions as unknown as TablesInsert<'questions'>[], this.ctx);
      rows.push(row);
    }

    return rows;
  }
}
```

**Points of divergence from the Candidate entity analog:**
- The data-model Candidate class uses **`get` accessors** on immutable data (single source of truth per CLAUDE.md "Data Model Philosophy"). Dev-seed generators are **stateless factories** — no `get`, just a `generate` method. The only shared DNA is "class-per-entity, one file per entity" OO shape.
- The data-model Candidate class has `root` + `data` from `Entity<T>`. Dev-seed generators have `ctx` from the constructor — similar "inject context at construction" pattern.
- **Dev-seed generators are NEW files, not extensions of the data-model classes.** They emit `TablesInsert<'X'>` rows (DB-shaped), not `Candidate` objects (data-model-shaped).

**Per-entity sentinel-field cheat sheet (from RESEARCH §4):**

| Generator | Refs via `{external_id}` | Sentinel fields (for linkJoinTables / importAnswers) |
|---|---|---|
| ElectionsGenerator | — | `_constituencyGroups: { externalId: string[] }` |
| ConstituencyGroupsGenerator | — | `_constituencies: { externalId: string[] }` |
| ConstituenciesGenerator | `parent: { external_id }` (self-FK) | — |
| OrganizationsGenerator | — | — |
| AlliancesGenerator | — | — |
| FactionsGenerator | — | — |
| CandidatesGenerator | `organization: { external_id }` | `answersByExternalId: { [qExtId]: { value } }` |
| QuestionCategoriesGenerator | — | `_elections: { externalId: string[] }` |
| QuestionsGenerator | `category: { external_id }` | — |
| NominationsGenerator | `candidate` / `organization` / `faction` / `alliance` (EXACTLY ONE), `election`, `constituency`, `parent_nomination` | — (see §9 polymorphism rules) |
| AppSettingsGenerator | — | — (note: routed via `updateAppSettings`, not `bulk_import`) |
| FeedbackGenerator | — | — (note: direct upsert; no external_id; Claude's Discretion — may be empty stub) |
| AccountsGenerator / ProjectsGenerator | — | Pass-through bootstrap refs only — do NOT emit rows (D-11) |

---

### `packages/dev-seed/tests/generators/*.test.ts` (14 test files)

**Analog (vitest structure):** `packages/matching/tests/distance.test.ts` lines 1–30 + `packages/data/src/objects/entities/variants/candidate.test.ts` lines 1–18

**Analog (describe/test pattern from matching):**
```ts
import { describe, expect, test } from 'vitest';
import { /* thing under test */ } from '../src/...';

describe('metric: kernels', () => {
  // tests
});
```

**Analog (expect-based assertion from data):**
```ts
test('Should have all candidates and their data', () => {
  entityData.forEach((objData) => {
    const obj = root.getEntity(ENTITY_TYPE.Candidate, objData.id);
    expect(obj.id, 'To have entity').toBe(objData.id);
    // ...
  });
});
```

**Target test pattern (RESEARCH §8 minimum viable, D-22 acceptance (a)–(e)):**

```ts
import { describe, it, expect } from 'vitest';
import { Faker, en } from '@faker-js/faker';
import { CandidatesGenerator } from '../../src/generators/CandidatesGenerator';

describe('CandidatesGenerator', () => {
  const makeCtx = (overrides = {}) => ({
    faker: new Faker({ locale: [en], seed: 42 }),
    projectId: '00000000-0000-0000-0000-000000000001',
    externalIdPrefix: 'seed_',
    refs: { organizations: [{ external_id: 'seed_party_01' }], questions: [] /* ... */ },
    logger: () => {},
    ...overrides
  });

  it('honors count from fragment', () => {
    const gen = new CandidatesGenerator(makeCtx());
    const rows = gen.generate({ count: 5 });
    expect(rows).toHaveLength(5);
  });

  it('applies externalIdPrefix (D-22.b)', () => {
    const gen = new CandidatesGenerator(makeCtx());
    const rows = gen.generate({ count: 1 });
    expect(rows[0].external_id).toMatch(/^seed_/);
  });

  it('produces deterministic output for same seed (D-22.e)', () => {
    const run1 = new CandidatesGenerator(makeCtx()).generate({ count: 3 });
    const run2 = new CandidatesGenerator(makeCtx()).generate({ count: 3 });
    expect(run1).toEqual(run2);
  });

  it('passes through fixed[] unchanged modulo prefix (D-22.d)', () => {
    const gen = new CandidatesGenerator(makeCtx());
    const rows = gen.generate({
      count: 0,
      fixed: [{ first_name: 'Alice', last_name: 'Example', external_id: 'my_cand' }]
    });
    expect(rows).toEqual([
      expect.objectContaining({ first_name: 'Alice', last_name: 'Example', external_id: 'seed_my_cand' })
    ]);
  });
});
```

**Points of divergence:**
- **Use `it` OR `test` — pick one** per D-22 convention. Matching uses `test`; data uses `test`; the skeleton above uses `it`. Either is fine; be consistent across all 14 test files.
- **`makeCtx()` factory helper** is NOT in the existing analogs — it's greenfield for dev-seed. Factory-function-based test fixture is standard vitest practice. Consider extracting to `tests/utils.ts` so all 14 generator tests reuse it.
- **D-22 acceptance (a) "row shape matches `TablesInsert<'X'>`"** — not directly assertable at runtime in TS; TypeScript compilation covers it (typecheck script). Alternative: pick 2–3 required columns per entity and `expect.objectContaining(...)` them.
- **NO DB IMPORTS** per D-22 "pure I/O, no DB" — do NOT import `SupabaseAdminClient` / `Writer` here.

---

### `packages/dev-seed/tests/pipeline.test.ts` (test, pure I/O)

**Analog:** Same as generator tests (vitest structure).

**Target assertions (per CONTEXT "Specifics"):**
1. **`{}` template produces non-empty output for every entity** — RESEARCH §Specifics + CONTEXT "`{}` template is a first-class test case."
2. **Override fully replaces built-in** — D-05/D-25: `runPipeline({}, { candidates: () => [] })` → `candidates: []` in output.
3. **Topo order populates refs**: nominations generator sees populated `ctx.refs.candidates` (must run AFTER candidates).
4. **Override signature `(fragment, ctx) => Rows[]`** per D-25 — test that the override function receives BOTH args.
5. **`{}` template default path hits `defaultRandomValidEmit`** — per CONTEXT "`{}` template coverage includes `ctx.answerEmitter` default."

---

### `packages/dev-seed/tests/writer.test.ts` (test, mocked request-response)

**Analog:** vitest structure from matching. Mocking is greenfield — vitest's `vi.mock()` / `vi.fn()` not currently used in `packages/matching` / `packages/data`.

**Target assertions (per D-23):**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Writer } from '../src/writer';

describe('Writer', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('throws at construction when SUPABASE_URL is missing (D-15)', () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'x';
    expect(() => new Writer()).toThrow(/SUPABASE_URL/);
  });

  it('throws at construction when SUPABASE_SERVICE_ROLE_KEY is missing (D-15)', () => {
    process.env.SUPABASE_URL = 'http://localhost:54321';
    expect(() => new Writer()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it('calls bulkImport → importAnswers → linkJoinTables in that order (D-23)', async () => {
    process.env.SUPABASE_URL = 'http://localhost:54321';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'x';
    // vi.mock the SupabaseAdminClient module or inject a spy client
    // assert call order via vi.fn() sequence
  });
});
```

**Points of divergence:**
- **Env var manipulation in tests is new pattern** — use `beforeEach` / `afterEach` to save and restore `process.env`. Standard Node.js test practice.
- **Mocking `SupabaseAdminClient`** — use `vi.mock('../src/supabaseAdminClient')` OR allow constructor injection of a mock client (the latter is cleaner and more testable; planner may refactor `Writer` constructor to accept `client?: SupabaseAdminClient` param for testability).

---

### `packages/dev-seed/tests/determinism.test.ts` (test, pure I/O, cross-cutting)

**Analog (cross-cutting single-concern test):** `packages/matching/tests/missingValue.test.ts` lines 1–40

```ts
import { COORDINATE } from '@openvaa/core';
import { expect, test } from 'vitest';
import { imputeMissingValue, MISSING_VALUE_METHOD } from '../src/missingValue';

const neutral = COORDINATE.Neutral;

test('imputeMissingValue', () => {
  expect(imputeMissingValue({ reference: neutral, options: { method: MISSING_VALUE_METHOD.Neutral } })).toEqual(neutral);
  // ...
});
```

**Target test pattern (per CONTEXT "Specifics" + TMPL-08):**

```ts
import { describe, it, expect } from 'vitest';
import { runPipeline } from '../src/pipeline';

describe('determinism (TMPL-08)', () => {
  it('produces byte-identical output across two runs with the same seed', () => {
    const template = { seed: 42 };
    const run1 = runPipeline(template);
    const run2 = runPipeline(template);
    expect(JSON.stringify(run1)).toEqual(JSON.stringify(run2));
  });

  it('produces different output with different seeds', () => {
    const run1 = runPipeline({ seed: 42 });
    const run2 = runPipeline({ seed: 43 });
    expect(JSON.stringify(run1)).not.toEqual(JSON.stringify(run2));
  });
});
```

**Divergence:** The matching analog tests a PURE function; determinism.test.ts tests a FULL PIPELINE run. Still pure (no DB), but loads more of the package. Both runs must share ZERO state — `new Faker({ seed })` on a fresh ctx per run (RESEARCH §5 Pattern A) guarantees this.

---

### `packages/dev-seed/tests/template.test.ts` (test, validation errors)

**Analog:** matching's test shape + zod's `safeParse` semantics (RESEARCH §6 Pattern 3).

**Target pattern (per TMPL-09):**

```ts
import { describe, it, expect } from 'vitest';
import { TemplateSchema, validateTemplate } from '../src/template/schema';

describe('Template validation (TMPL-09)', () => {
  it('accepts {} template', () => {
    expect(() => validateTemplate({})).not.toThrow();
  });

  it('error message includes field path (TMPL-09)', () => {
    try {
      validateTemplate({ candidates: { count: 'not-a-number' } });
      expect.fail('should have thrown');
    } catch (e) {
      expect((e as Error).message).toMatch(/candidates\.count/);
    }
  });

  it('accepts nested fixed[] with arbitrary shapes', () => {
    expect(() => validateTemplate({
      candidates: { fixed: [{ first_name: 'Alice', external_id: 'my_cand' }] }
    })).not.toThrow();
  });
});
```

**Divergence:** No direct analog for "validation error contains field path" in the existing codebase. zod v4's `error.issues[].path` + a simple `.join('.')` in the error formatter (RESEARCH §6 Pattern 3) covers this cleanly.

---

### `tests/tests/utils/supabaseAdminClient.ts` (REWRITE, request-response)

**Analog:** Self — the current file (858 lines) being trimmed per D-24.

**Target rewrite pattern (approximate, ~400 lines):**

```ts
import { SupabaseAdminClient as DevSeedAdminClient, TEST_PROJECT_ID } from '@openvaa/dev-seed';

// Re-export the base constant + class for backward-compat with existing E2E imports:
export { TEST_PROJECT_ID };
export type { FindDataResult } from '@openvaa/dev-seed';

/**
 * E2E admin client: extends the dev-seed base with auth/email + legacy E2E helpers.
 * The bulk-write surface (bulkImport, importAnswers, linkJoinTables, bulkDelete,
 * updateAppSettings) lives in @openvaa/dev-seed per D-24.
 */
export class SupabaseAdminClient extends DevSeedAdminClient {
  // Auth helpers (lines 103–145 + 628–857 of the origin file):
  private async fixGoTrueNulls(): Promise<void> { /* ... */ }
  private async safeListUsers(): Promise<...> { /* ... */ }
  async setPassword(...) { /* ... */ }
  async forceRegister(...) { /* ... */ }
  async unregisterCandidate(...) { /* ... */ }
  async sendEmail(...) { /* ... */ }
  async sendForgotPassword(...) { /* ... */ }
  async deleteAllTestUsers(...) { /* ... */ }

  // Legacy E2E query helpers (lines 530–612 of origin):
  async findData(...) { /* ... */ }
  async query(...) { /* ... */ }
  async update(...) { /* ... */ }
}
```

**Points of divergence:**
- **Subclass OR composition** — per CONTEXT "Claude's Discretion," planner picks the lighter diff. Subclass above is simpler because the existing call sites (`tests/seed-test-data.ts` and all `tests/tests/**/*.spec.ts`) call methods on a single `SupabaseAdminClient` object — preserving that shape requires subclass.
- **Preserve import path `./utils/supabaseAdminClient`** — CONTEXT "Integration Points" says existing E2E call sites keep importing from the same path. The file is REWRITTEN, not deleted or renamed.
- **Need access to `private client` / `private projectId`** — the base's `client` field is `private`. Either change it to `protected` in the dev-seed base (minimal diff; also lets subclasses use the Supabase REST client for auth/query helpers), OR keep `private` and have the subclass create its own Supabase client (duplicates client creation; NOT recommended). Planner: change `private client` → `protected client` in the base.

---

### Root `package.json` (one-line modification)

**Analog:** Self (lines 36–60 of existing root `package.json`).

**Target diff (per RESEARCH §7 "Correction to D-24"):**

```jsonc
// Existing devDependencies block (lines 36–60):
"devDependencies": {
  "@changesets/changelog-github": "^0.6.0",
  // ... existing entries
  "@openvaa/shared-config": "workspace:^",
  "@openvaa/supabase-types": "workspace:^",
  // ADD THIS LINE:
  "@openvaa/dev-seed": "workspace:^",
  // ... rest
}
```

**Points of divergence:** CONTEXT D-24 states "Tests workspace adds `"@openvaa/dev-seed": "workspace:^"`." This is INCORRECT as stated because `tests/` has no `package.json` (verified — `tests/` is not a workspace, it runs via root). RESEARCH §7 "Correction to D-24" is authoritative: the dep goes in ROOT `package.json` devDependencies.

---

### `.planning/REQUIREMENTS.md` (one-line amendment)

**Analog:** Self (the GEN-03 row as currently written).

**Target amendment (per CONTEXT "Specifics" + D-25):**

- Current GEN-03 signature: `{ [table]: (fragment) => Rows }`
- Updated GEN-03 signature: `{ [table]: (fragment, ctx) => Rows[] }`

**Divergence:** Minor doc sync chore — same file, one row updated. Planner may bundle this with a broader `@openvaa/dev-tools` → `@openvaa/dev-seed` doc-sync pass per D-03 (GEN-05, GEN-10, CLI-01/02/03, DX-04 all mention the wrong package name). If bundled, the diff is larger but all inside REQUIREMENTS.md — still a doc-only change.

## Shared Patterns

### Shared: Supabase row typing

**Source:** `packages/supabase-types/src/index.ts` exports `TablesInsert<'X'>`, `Tables<'X'>`, `TablesUpdate<'X'>`.

**Apply to:** ALL 14 generator files; the `supabaseAdminClient.ts` method signatures.

```ts
import type { TablesInsert } from '@openvaa/supabase-types';

// Every generator returns TablesInsert<T>[] for its table:
export class CandidatesGenerator {
  generate(fragment: CandidatesFragment): Array<TablesInsert<'candidates'>> { /* ... */ }
}
```

**Why:** GEN-02 + NF-03 — no hand-redeclared row shapes, no `any` in public surface. Planner must ensure every generator's return type is `TablesInsert<T>[]`.

---

### Shared: Sentinel field convention (`_`-prefixed + `answersByExternalId`)

**Source:** `tests/tests/utils/supabaseAdminClient.ts` line 179 (stripping logic) + lines 324–478 (reading logic in `linkJoinTables`).

**Apply to:** ElectionsGenerator (`_constituencyGroups`), ConstituencyGroupsGenerator (`_constituencies`), QuestionCategoriesGenerator (`_elections`), CandidatesGenerator (`answersByExternalId`).

**Pattern:** Generator emits sentinel fields alongside regular columns on the SAME row. `bulkImport` strips them before RPC (line 179); `linkJoinTables` / `importAnswers` read them from the same input object in a second pass. Single-input-dataset two-pass pattern (RESEARCH §2 "Two-pass post-insert pattern").

---

### Shared: External-ID-based refs (`{external_id: "..."}`)

**Source:** `apps/supabase/supabase/migrations/00001_initial_schema.sql` lines 2531–2575 (`resolve_external_ref`) + `tests/tests/utils/supabaseAdminClient.ts` lines 184–185 (`{externalId} → {external_id}` conversion).

**Apply to:** CandidatesGenerator (`organization` ref), QuestionsGenerator (`category` ref), ConstituenciesGenerator (`parent` ref), NominationsGenerator (all 7 refs).

**Pattern:** Generator emits `{ organization: { external_id: "seed_party_01" } }` in place of `{ organization_id: "<uuid>" }`. `_bulk_upsert_record` (migration line 2640) resolves to UUID via `resolve_external_ref`. Missing ref → RPC abort (RESEARCH §1).

**Divergence note:** Generators emit `{external_id: "..."}` snake_case OR `{externalId: "..."}` camelCase; `bulkImport` converts either form. Convention recommended: emit **snake_case** (`external_id`) to bypass the conversion layer and surface typos earlier. Planner picks.

---

### Shared: Seeded faker per pipeline run

**Source:** RESEARCH §5 Pattern A + `@faker-js/faker` v8 docs.

**Apply to:** `ctx.ts` (factory) + every generator that reads `ctx.faker`.

```ts
// ctx.ts:
this.faker = new Faker({ locale: [en], seed: template.seed ?? 42 });
```

**Why:** TMPL-08 deterministic output. Module-level `faker.seed(n)` (Pattern B) has shared-state bugs in vitest parallel tests (Pitfall 4).

---

### Shared: vitest discovery (both paths)

**Source:** `package.json:16-17` + `vitest.workspace.ts` + `turbo.json` lines 1–24.

**Apply to:** `packages/dev-seed/vitest.config.ts` + `packages/dev-seed/package.json`.

**Pattern:** BOTH files must exist. `vitest.config.ts` enables root workspace discovery (`yarn test:unit:watch`); `package.json: "test:unit": "vitest run"` enables Turborepo discovery (`yarn test:unit`). Dropping either half → silent test misses (RESEARCH Pitfall 6).

## No Analog Found

Files with no close codebase match (planner uses RESEARCH.md + library docs):

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `packages/dev-seed/src/ctx.ts` | factory | transform | No existing "seeded-faker + projectId + refs + logger" ctx pattern in the monorepo. Greenfield per RESEARCH §5/§"Code Examples." |
| `packages/dev-seed/src/emitters/answers.ts` | utility | transform | Greenfield per D-19/D-27. No prior "random-valid answer emitter" in the codebase. |
| `packages/dev-seed/tests/writer.test.ts` (mocking) | test | mocked RPC | `vi.mock()` not used in `packages/matching` / `packages/data` tests; standard vitest practice but new to this monorepo's package tests. |

## Metadata

**Analog search scope:**
- `packages/dev-tools/` (package shape, scripts, tsconfig)
- `packages/matching/` (vitest config, test patterns, tsconfig references)
- `packages/data/src/objects/entities/variants/` (class-per-entity pattern)
- `packages/argument-condensation/src/core/condensation/responseValidators/` (zod schema)
- `packages/question-info/src/utils/` (zod dynamic schema)
- `tests/tests/utils/supabaseAdminClient.ts` (source of the split per D-24)
- `apps/supabase/supabase/migrations/00001_initial_schema.sql` (bulk_import contract, processing_order TOPO source)
- Root `package.json`, `vitest.workspace.ts`, `turbo.json`, `.yarnrc.yml`

**Files scanned:** ~25 (focused on direct analogs per early-stopping rule; no broader search — strong matches found in first pass).

**Pattern extraction date:** 2026-04-22

## PATTERN MAPPING COMPLETE
