# Phase 58: Templates, CLI & Default Dataset - Pattern Map

**Mapped:** 2026-04-23
**Files analyzed:** 20 new / modified files
**Analogs found:** 14 with analog / 20

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages/dev-seed/src/cli/seed.ts` | CLI entry-point | request-response (CLI) | `packages/dev-tools/src/keygen.ts` | role-match (exact pattern) |
| `packages/dev-seed/src/cli/teardown.ts` | CLI entry-point | request-response (CLI) | `packages/dev-tools/src/keygen.ts` | role-match (exact pattern) |
| `packages/dev-seed/src/cli/resolve-template.ts` | utility (pure function) | transform | — | NONE (new surface) |
| `packages/dev-seed/src/cli/help.ts` | CLI helper (static text) | request-response | `packages/dev-tools/src/keygen.ts` (USAGE const) | role-match |
| `packages/dev-seed/src/cli/summary.ts` | utility (formatter) | transform | — | NONE (new surface) |
| `packages/dev-seed/src/templates/default.ts` | config (data literal) | batch | `packages/dev-seed/tests/template.test.ts` (Template shape) | role-match (uses the schema) |
| `packages/dev-seed/src/templates/e2e.ts` | config (data literal) | batch | `tests/tests/data/default-dataset.json` (for audit target contracts) | weak (audit-driven) |
| `packages/dev-seed/src/templates/index.ts` | barrel / map | — | `packages/dev-seed/src/index.ts` (barrel pattern) | role-match |
| `packages/dev-seed/src/locales.ts` | utility (pure function) | transform | `packages/dev-seed/src/ctx.ts` (fresh-Faker factory) | role-match (Faker construction only) |
| `packages/dev-seed/src/writer.ts` (EXTEND) | service (orchestrator) | CRUD + file-I/O | `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:260-349` | exact (storage upload pattern) |
| `packages/dev-seed/src/template/schema.ts` (EXTEND) | schema definition | validation | `packages/dev-seed/src/template/schema.ts:99-117` (self) | exact (extend pattern) |
| `packages/dev-seed/src/template/types.ts` (EXTEND JSDoc) | type declaration | — | (no analog — pure doc edit) | NONE |
| `packages/dev-seed/src/index.ts` (EXTEND barrel) | barrel export | — | `packages/dev-seed/src/index.ts:48-64` (self) | exact |
| `packages/dev-seed/package.json` (EXTEND scripts) | config | — | `packages/dev-tools/package.json` scripts.keygen pattern | role-match |
| `package.json` (EXTEND root scripts) | config | — | root `package.json:29-34` (`supabase:*` aliases) | exact |
| `packages/dev-seed/tests/integration/default-template.integration.test.ts` | test (integration) | event-driven (vitest) | `packages/dev-seed/tests/latent/clustering.integration.test.ts` | role-match (integration guard) |
| `packages/dev-seed/tests/cli/resolve-template.test.ts` | test (unit) | event-driven (vitest) | `packages/dev-seed/tests/template.test.ts` | role-match |
| `packages/dev-seed/tests/cli/summary.test.ts` | test (unit) | event-driven (vitest) | `packages/dev-seed/tests/generators/OrganizationsGenerator.test.ts` | role-match |
| `packages/dev-seed/tests/templates/default.test.ts` | test (unit) | event-driven (vitest) | `packages/dev-seed/tests/template.test.ts` | role-match |
| `packages/dev-seed/tests/templates/e2e.test.ts` | test (unit) | event-driven (vitest) | `packages/dev-seed/tests/template.test.ts` | role-match |
| `packages/dev-seed/tests/assets.test.ts` | test (unit, filesystem) | file-I/O | — | NONE (new surface — fs.readdir + count check) |
| `packages/dev-seed/scripts/download-portraits.ts` | one-off maintainer script | file-I/O | `packages/dev-tools/src/keygen.ts` (node: imports) | role-match |
| `packages/dev-seed/src/assets/portraits/*.jpg` | static assets | — | (committed binaries; no code analog) | NONE |
| `packages/dev-seed/src/assets/portraits/LICENSE.md` | docs | — | (no analog in repo) | NONE |
| `packages/dev-seed/README.md` | docs | — | (no analog package README; follow repo-wide Markdown conventions) | NONE |
| `CLAUDE.md` (EXTEND Common Workflows) | docs | — | `CLAUDE.md:235-270` (self Common Workflows) | exact |

## Pattern Assignments

### `packages/dev-seed/src/cli/seed.ts` (CLI entry-point, request-response)

**Analog:** `packages/dev-tools/src/keygen.ts`

**Imports + top-level parseArgs pattern** (keygen.ts lines 22-42):
```typescript
import { parseArgs } from 'node:util';

const USAGE = `Usage: keygen --type <signing|encryption> --kid <id> [--alg <name>] [--size <bits>]
  --type         'signing' or 'encryption'
  --kid <id>     Key ID to embed in both JWKs (e.g. openvaa-signing-1)
  ...`;

const { values } = parseArgs({
  options: {
    type: { type: 'string' },
    kid: { type: 'string' },
    alg: { type: 'string' },
    size: { type: 'string' },
    help: { type: 'boolean', short: 'h' }
  }
});
```

**Help exit short-circuit** (keygen.ts lines 44-47):
```typescript
if (values.help) {
  process.stdout.write(USAGE);
  process.exit(0);
}
```

**Required-arg validation + stderr + exit 1** (keygen.ts lines 49-66):
```typescript
if (!values.type || !values.kid) {
  process.stderr.write(USAGE);
  process.exit(1);
}

if (values.type !== 'signing' && values.type !== 'encryption') {
  process.stderr.write(`Invalid --type: ${values.type}. Use 'signing' or 'encryption'.\n`);
  process.exit(1);
}
```

**Top-level await pattern (tsx-only runtime)** (keygen.ts lines 68-86):
```typescript
// Top-level await is fine — package.json sets "type": "module" and tsx resolves.
const { privateKey, publicKey } = await jose.generateKeyPair(alg, { ... });
process.stdout.write(`${JSON.stringify(privateJwk)}\n`);
```

**Notes for Phase 58:**
- Package.json script MUST be `tsx src/cli/seed.ts` (NOT `node`); top-level `await import()` on `.ts` template files only works in tsx runtime.
- Options for Phase 58 CLI per D-58-13: `{ template: { type: 'string', short: 't' }, seed: { type: 'string' }, 'external-id-prefix': { type: 'string' }, help: { type: 'boolean', short: 'h' } }` — same shape as `keygen.ts`, four flags.
- Error-handling wrapper: wrap the seed orchestration in `try/catch (err: Error)` and emit `Error: ${err.message}\n` to stderr + `process.exit(1)` per D-58-12. `keygen.ts` doesn't have a try/catch because its synchronous work can't throw ops errors; seed.ts will — mirror Writer's constructor error style (`writer.ts:78-91`).

---

### `packages/dev-seed/src/cli/teardown.ts` (CLI entry-point, request-response)

**Analog:** `packages/dev-tools/src/keygen.ts` (CLI shape) + `tests/seed-test-data.ts:28-37` (bulkDelete call shape)

**Delete-collections call** (seed-test-data.ts lines 28-37):
```typescript
await client.bulkDelete({
  nominations: { prefix: TEST_DATA_PREFIX },
  candidates: { prefix: TEST_DATA_PREFIX },
  questions: { prefix: TEST_DATA_PREFIX },
  question_categories: { prefix: TEST_DATA_PREFIX },
  organizations: { prefix: TEST_DATA_PREFIX },
  constituency_groups: { prefix: TEST_DATA_PREFIX },
  constituencies: { prefix: TEST_DATA_PREFIX },
  elections: { prefix: TEST_DATA_PREFIX }
});
```

**Critical: `allowed_collections` per schema line 2853-2858** — bulk_delete ONLY accepts these 11 names:
```
elections, constituency_groups, constituencies, organizations,
alliances, factions, candidates, question_categories, questions,
nominations, app_settings
```
Any other name (e.g. `feedback`, `accounts`, `projects`) triggers `RAISE EXCEPTION 'Unknown collection for deletion: %'`. Plan MUST NOT include `accounts`/`projects`/`feedback` in teardown call (Pitfall #6 in RESEARCH).

**Storage path 2 (explicit list + remove) pattern** from RESEARCH §3 and `supabaseDataWriter.ts` idiom:
```typescript
const { data: files } = await this.client.storage
  .from('public-assets')
  .list(`${projectId}/candidates`, { limit: 1000 });
const seedFiles = (files ?? []).filter(f => f.name === 'seed-portrait.jpg');
await this.client.storage.from('public-assets').remove(
  seedFiles.map(f => `${projectId}/candidates/${f.name}`)
);
```

---

### `packages/dev-seed/src/cli/resolve-template.ts` (utility, transform)

**Analog:** NONE (new surface — template resolution is Phase 58 specific)

**Pattern from RESEARCH §1 (D-58-09 resolution algorithm):**
```typescript
async function resolveTemplate(arg: string): Promise<Template> {
  const isPath =
    arg.startsWith('./') || arg.startsWith('/') || arg.startsWith('../') ||
    arg.endsWith('.ts') || arg.endsWith('.js') || arg.endsWith('.json');

  if (isPath) {
    const absPath = path.resolve(arg);
    if (absPath.endsWith('.json')) {
      const raw = JSON.parse(await fs.readFile(absPath, 'utf8'));
      return validateTemplate(raw);  // TMPL-09 field-path errors
    }
    const mod = await import(pathToFileURL(absPath).href);
    const tpl = mod.default ?? mod.template;
    return validateTemplate(tpl);
  }

  const builtIn = BUILT_IN_TEMPLATES[arg];
  if (!builtIn) {
    throw new Error(
      `Unknown template: '${arg}'. Built-in templates: ${Object.keys(BUILT_IN_TEMPLATES).join(', ')}. ` +
      `For a custom template, pass a path like './my-template.ts' or '/abs/path.json'.`
    );
  }
  return builtIn;
}
```

**Validation delegation:** calls `validateTemplate()` from `packages/dev-seed/src/template/schema.ts:130-135` — TMPL-09 field-path error formatter already emits `template.${path}: ${message}` per line:
```typescript
const msg = result.error.issues.map((iss) => `  template.${iss.path.join('.')}: ${iss.message}`).join('\n');
throw new Error(`Template validation failed:\n${msg}`);
```

---

### `packages/dev-seed/src/templates/default.ts` (config, batch)

**Analog:** `packages/dev-seed/src/template/types.ts` (Template type source) + `packages/dev-seed/tests/template.test.ts` (shape exemplars)

**Minimal Template shape** (template.test.ts lines 60-73):
```typescript
const template = {
  elections: { count: 1 },
  constituency_groups: { count: 1 },
  constituencies: { count: 1 },
  organizations: { count: 1 },
  alliances: { count: 1 },
  factions: { count: 1 },
  candidates: { count: 1 },
  question_categories: { count: 1 },
  questions: { count: 1 },
  nominations: { count: 1 },
  app_settings: { count: 1 },
  feedback: { count: 1 }
};
```

**`fixed[]` row shape for organizations** (`OrganizationsGenerator.ts:36-42` reveals the prefix/project_id handling):
```typescript
// Fragment item has partial-row + required external_id
{ external_id: 'party_blue', name: { en: 'Blue Coalition' }, color: '#1a4d8f' }
// Generator prepends prefix; project_id defaults to ctx.projectId if omitted
```

**Candidate row shape with organization ref** (`CandidatesGenerator.ts:107-123`):
```typescript
{
  external_id: 'cand_0000',  // generator prepends prefix
  project_id: projectId,
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
  sort_order: i,
  is_generated: true,
  organization: { external_id: 'party_blue' }  // bulk_import resolves to organization_id
}
```

**Typed export shape:**
```typescript
import type { Template } from '../template/types';

export const defaultTemplate: Template = {
  seed: 42,
  externalIdPrefix: 'seed_',
  generateTranslationsForAllLocales: true,  // Phase 58 new field
  elections: { fixed: [{ external_id: 'election_default', name: { en: '...' } }] },
  // ...
};
```

**Non-uniform candidate→party weighting** — per RESEARCH Open Q 2: use a template-local override via the D-25 `Overrides` signature (`packages/dev-seed/src/types.ts:46-48`):
```typescript
export type Overrides = {
  [table: string]: (fragment: unknown, ctx: Ctx) => Array<Record<string, unknown>>;
};
```

The CLI wires `runPipeline(template, overrides)` — planner defines `defaultOverrides` next to `defaultTemplate` or inline.

---

### `packages/dev-seed/src/templates/index.ts` (barrel / map)

**Analog:** `packages/dev-seed/src/index.ts:48-64` (barrel pattern)

**Barrel export + built-in map pattern:**
```typescript
import { defaultTemplate } from './default';
import { e2eTemplate } from './e2e';
import type { Template } from '../template/types';

export const BUILT_IN_TEMPLATES: Record<string, Template> = {
  default: defaultTemplate,
  e2e: e2eTemplate
};

export { defaultTemplate } from './default';
export { e2eTemplate } from './e2e';
```

---

### `packages/dev-seed/src/locales.ts` (utility, transform)

**Analog:** `packages/dev-seed/src/ctx.ts:78-108` (fresh-Faker factory pattern) + RESEARCH §5 code example

**Faker locale construction** (ctx.ts lines 84-85):
```typescript
const faker = new Faker({ locale: [en] });
faker.seed(template.seed ?? 42);
```

**Deterministic locale iteration** — Pitfall #1 (RESEARCH) mandates HARDCODED array order:
```typescript
// Hardcoded array — do NOT iterate Object.keys(supportedLocales) or a Map.
const LOCALES = ['en', 'fi', 'sv', 'da'] as const;
```

**Per-locale Faker instances, memoized by key:**
```typescript
import { en, fi, sv, da, Faker } from '@faker-js/faker';

const LOCALE_DATA = { en, fi, sv, da };

function getLocaleFaker(locale: string, seed: number): Faker {
  const localeData = LOCALE_DATA[locale as keyof typeof LOCALE_DATA] ?? en;
  const f = new Faker({ locale: [localeData, en] });  // fallback chain
  f.seed(seed);
  return f;
}
```

**Post-generation fan-out walk** — applies ONLY to JSONB localized-string fields listed in RESEARCH §5 "Localized field inventory". Plain-text `first_name`/`last_name` are NOT fanned out.

---

### `packages/dev-seed/src/writer.ts` (EXTEND, service orchestrator, CRUD + file-I/O)

**Analog:** `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:306-345` (existing storage-upload pattern, load-bearing)

**Storage upload + JSONB image update pattern** (supabaseDataWriter.ts lines 312-328):
```typescript
const imageWithFile = image as ImageWithFile;
if (imageWithFile.file && typeof File !== 'undefined' && imageWithFile.file instanceof File) {
  // Upload image file to Storage
  const { data: candidateRow, error: fetchError } = await this.supabase
    .from('candidates')
    .select('project_id')
    .eq('id', id)
    .single();
  if (fetchError || !candidateRow)
    throw new Error(`Failed to fetch candidate project_id: ${fetchError?.message ?? 'not found'}`);
  const file = imageWithFile.file;
  const ext = file.name.split('.').pop() ?? 'jpg';
  const storagePath = `${candidateRow.project_id}/candidates/${id}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await this.supabase.storage
    .from('public-assets')
    .upload(storagePath, file, { cacheControl: '3600', upsert: true });
  if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
  updateFields.image = { path: storagePath };
}
```

**Canonical storage path convention** (Pitfall #2 in RESEARCH + schema line 1934):
`${project_id}/${entity_type}/${entity_id}/filename.ext`

Phase 58 candidate portraits: `${projectId}/candidates/${candidateId}/seed-portrait.jpg`

**Existing Writer orchestration pattern** (`writer.ts:126-168`):
```typescript
async write(data: Record<string, Array<Record<string, unknown>>>): Promise<void> {
  const bulkData: Record<string, Array<Record<string, unknown>>> = { ...data };
  delete bulkData.accounts;
  delete bulkData.projects;
  const feedbackRows = bulkData.feedback;
  delete bulkData.feedback;
  const appSettingsRows = bulkData.app_settings;
  delete bulkData.app_settings;

  await this.client.bulkImport(bulkData);
  await this.client.importAnswers(bulkData);
  await this.client.linkJoinTables(bulkData);
  // ... app_settings / feedback / portrait pass goes HERE (after linkJoinTables)
}
```

**Phase 58 insertion point:** new `uploadPortraits()` method called AFTER `linkJoinTables` (candidates are already in the DB with UUIDs assigned).

**Re-read candidate UUIDs** (Pitfall #8 — bulk_import returns counts, not rows):
```typescript
const extIds = candidates.map(c => c.external_id).filter(Boolean) as string[];
const { data: rows } = await this.client.from('candidates')
  .select('id, external_id, project_id, first_name, last_name')
  .in('external_id', extIds);
```

**Env enforcement reuses existing constructor pattern** (writer.ts lines 78-91) — no changes; portrait upload runs under the same service-role client.

**Portrait determinism:** sort portrait paths with `portraitPaths.sort()` before cycling (Pitfall #1 in RESEARCH — `fs.readdir` order is platform-specific).

**Alt text for WCAG AA** (Pitfall #4):
```typescript
image: { path: storagePath, alt: `${row.first_name} ${row.last_name}`.trim() }
```

---

### `packages/dev-seed/src/template/schema.ts` (EXTEND)

**Analog:** `packages/dev-seed/src/template/schema.ts:99-117` (self — the existing `.extend()` pattern)

**Existing `.extend()` composition** (schema.ts lines 99-117):
```typescript
export const TemplateSchema = z
  .object({
    seed: z.number().int().optional(),
    externalIdPrefix: z.string().optional(),
    projectId: z.string().regex(UUID_SHAPE, 'Invalid UUID').optional(),
    elections: perEntityFragment.optional(),
    // ... 11 more per-entity fragments
    feedback: perEntityFragment.optional()
  })
  .extend({ latent: latentBlock.optional() });
```

**Phase 58 extension** — add one flat top-level boolean (TMPL-07):
```typescript
export const TemplateSchema = z
  .object({
    seed: z.number().int().optional(),
    // ... existing fields ...
    generateTranslationsForAllLocales: z.boolean().optional()  // NEW
  })
  .extend({ latent: latentBlock.optional() });
```

**IMPORTANT:** Phase 56 comment at schema.ts:6-11 explicitly predicts Phase 58 schema extension — follow the same `.extend()` pattern, NOT `.merge()` (deprecated in zod v4).

---

### `packages/dev-seed/src/index.ts` (EXTEND barrel)

**Analog:** self (lines 48-64) — existing barrel pattern

**Phase 58 additions** (follow existing comment-block + runtime/type grouping):
```typescript
// Runtime exports
export { defaultTemplate, e2eTemplate } from './templates';
export { BUILT_IN_TEMPLATES } from './templates';
// (do NOT export CLI entry points — they are scripts, not library surface)
```

---

### Root `package.json` (EXTEND scripts)

**Analog:** root `package.json:29-34` (existing `supabase:*` workspace-alias pattern)

**Existing workspace-alias pattern:**
```json
{
  "supabase:start": "yarn workspace @openvaa/supabase start",
  "supabase:stop": "yarn workspace @openvaa/supabase stop",
  "supabase:reset": "yarn workspace @openvaa/supabase reset",
  "supabase:status": "yarn workspace @openvaa/supabase status"
}
```

**Phase 58 additions** (D-58-08, D-58-11):
```json
{
  "dev:seed": "yarn workspace @openvaa/dev-seed seed",
  "dev:seed:teardown": "yarn workspace @openvaa/dev-seed seed:teardown",
  "dev:reset-with-data": "yarn supabase:reset && yarn dev:seed --template default"
}
```

**Chained-command precedent** (root package.json:9): `"dev:start": "yarn build && yarn supabase:start && yarn workspace @openvaa/frontend dev"` — the `&&` idiom is already established; `dev:reset-with-data` follows the same shape.

---

### `packages/dev-seed/package.json` (EXTEND scripts)

**Analog:** `packages/dev-tools/` package.json pattern (inferred from keygen.ts workspace script invocation)

**Phase 58 scripts** (keeps existing scripts.build/lint/typecheck/test:unit):
```json
{
  "scripts": {
    "build": "echo 'Nothing to build.'",
    "lint": "eslint --flag v10_config_lookup_from_file src/",
    "typecheck": "tsc --noEmit",
    "test:unit": "vitest run --passWithNoTests",
    "seed": "tsx src/cli/seed.ts",
    "seed:teardown": "tsx src/cli/teardown.ts"
  }
}
```

**Critical:** use `tsx` (already in devDependencies line 30), not `node`. Top-level `await import()` on `.ts` template files requires tsx's loader.

---

### `packages/dev-seed/tests/integration/default-template.integration.test.ts` (test, integration)

**Analog:** `packages/dev-seed/tests/latent/clustering.integration.test.ts` (naming convention + guard pattern)

**Guard on env var** (RESEARCH §6 — Phase 57 integration tests run unconditionally; Phase 58 integration test needs a SUPABASE_URL gate):
```typescript
import { describe, expect, it } from 'vitest';

describe.skipIf(!process.env.SUPABASE_URL)('default template integration', () => {
  it('applies to live Supabase within 10s producing expected row counts', async () => {
    // ...
  });
});
```

**Test body skeleton** (RESEARCH §6 integration test shape):
```typescript
const start = Date.now();
const result = await runPipelineAndWriter(defaultTemplate);
const elapsed = Date.now() - start;

expect(elapsed).toBeLessThan(10_000);  // NF-01
expect(result.elections).toBe(1);
expect(result.candidates).toBe(100);

const { data: candidates } = await adminClient.from('candidates')
  .select('id, external_id, organization_id, image')
  .like('external_id', 'seed_%');
expect(candidates!.every(c => c.image?.path !== undefined)).toBe(true);  // NOT image_id

const { data: elections } = await adminClient.from('elections')
  .select('name').eq('external_id', 'seed_election_default').single();
expect(Object.keys(elections!.name as Record<string, unknown>).sort())
  .toEqual(['da', 'en', 'fi', 'sv']);
```

---

### `packages/dev-seed/tests/cli/resolve-template.test.ts` (test, unit)

**Analog:** `packages/dev-seed/tests/template.test.ts`

**Vitest shape + error-match pattern** (template.test.ts lines 27-37):
```typescript
import { describe, expect, it } from 'vitest';
import { validateTemplate } from '../src/template/schema';

describe('validateTemplate', () => {
  it('TMPL-09: nested field-path error', () => {
    expect(() => validateTemplate({ candidates: { count: 'not-a-number' } }))
      .toThrow(/template\.candidates\.count/);
  });
});
```

Phase 58 follows the same shape: describe-per-helper, `.toThrow(/regex/)` for error messages, one assertion per `it()`.

---

### `packages/dev-seed/tests/cli/summary.test.ts` (test, unit)

**Analog:** `packages/dev-seed/tests/generators/OrganizationsGenerator.test.ts`

**Pure-function unit-test pattern** (OrganizationsGenerator.test.ts lines 12-44):
```typescript
import { describe, expect, it } from 'vitest';
import { OrganizationsGenerator } from '../../src/generators/OrganizationsGenerator';
import { makeCtx } from '../utils';

describe('OrganizationsGenerator', () => {
  it('produces deterministic output across runs with same seed', () => {
    const run1 = new OrganizationsGenerator(makeCtx()).generate({ count: 3 });
    const run2 = new OrganizationsGenerator(makeCtx()).generate({ count: 3 });
    expect(run1).toEqual(run2);
  });
});
```

For CLI summary: pure input → formatted string test. One `it()` per format concern (aligned columns, elapsed formatting, totals row).

---

### `CLAUDE.md` (EXTEND Common Workflows)

**Analog:** self (`CLAUDE.md:235-270` — existing Common Workflows section)

**Existing section pattern** (CLAUDE.md:244-255):
```markdown
### Running tests after changes

\`\`\`bash
# Quick check
yarn test:unit

# Full E2E (requires Supabase running)
yarn dev:reset
yarn dev
# Wait for services to be healthy
yarn test:e2e
\`\`\`
```

**Phase 58 addition** (per D-58-18 DX-04, inserts as a new sub-section under `## Common Workflows`):
```markdown
### Seeding local data

\`\`\`bash
yarn dev:reset-with-data       # supabase db reset + default template
yarn dev:seed --template e2e   # E2E test data for manual Playwright runs
yarn dev:seed:teardown         # remove all seed_-prefixed rows
\`\`\`

See `packages/dev-seed/README.md` for authoring custom templates.
```

---

## Shared Patterns

### Service-role Supabase client (env-enforced)

**Source:** `packages/dev-seed/src/writer.ts:77-98`
**Apply to:** All CLI entry points (seed.ts, teardown.ts) + integration test
**Do:** Construct `new Writer()` — the Writer constructor THROWS with actionable messages when `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` is missing (D-58-12 requires the CLI surface these errors to stderr + exit 1; the Writer's existing errors ALREADY match D-58-12's exact wording).

```typescript
constructor(opts: WriterOptions = {}) {
  if (!process.env.SUPABASE_URL) {
    throw new Error(
      'SUPABASE_URL env var is required but not set. ' +
        'Did you forget to run `supabase start`? ' +
        'Expected format: http://127.0.0.1:54321'
    );
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY env var is required but not set. ' +
        'Run `supabase status` to obtain the local service_role key.'
    );
  }
  // ...
}
```

**CLI wrapping:** wrap in `try { ... } catch (err: Error) { process.stderr.write(...); process.exit(1); }`.

### bulkDelete prefix filtering (reverse-dependency order)

**Source:** `tests/seed-test-data.ts:28-37` + schema `allowed_collections` constraint at `apps/supabase/supabase/migrations/00001_initial_schema.sql:2853-2858`
**Apply to:** `teardown.ts`, `integration/default-template.integration.test.ts`
**Constraint:** Do NOT include `accounts`, `projects`, or `feedback` — they are not in `allowed_collections` and trigger `RAISE EXCEPTION 'Unknown collection for deletion: %'`. See Pitfall #6.

### Fresh-Faker per run (Pattern A — RESEARCH §5)

**Source:** `packages/dev-seed/src/ctx.ts:84-85` + `packages/dev-seed/tests/utils.ts:18-23`
**Apply to:** `locales.ts` (each locale-Faker), `download-portraits.ts` (if any random generation), `default.ts` overrides (if any internal RNG)
**Anti-pattern:** module-level `faker.seed()` — shared-state trap that breaks determinism tests (`tests/determinism.test.ts`).

```typescript
const faker = new Faker({ locale: [en] });
faker.seed(42);
```

### Storage path convention (3-segment RLS-compliant)

**Source:** `apps/supabase/supabase/migrations/00001_initial_schema.sql:1934-1936` (RLS policy parses this) + `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:275, 323`
**Apply to:** Writer portrait-upload pass
**Path shape:** `${project_id}/${entity_type}/${entity_id}/${filename}`
**Phase 58 concrete:** `${projectId}/candidates/${candidateId}/seed-portrait.jpg`

### JSONB image column shape (not image_id!)

**Source:** `apps/frontend/src/lib/api/adapters/supabase/utils/storageUrl.ts:9-16` (canonical `StoredImage` type)
**Apply to:** Writer portrait upload + integration test assertions
**Shape:** `{ path: string, pathDark?: string, alt?: string, width?: number, height?: number, focalPoint?: { x, y } }`
**CRITICAL per RESEARCH Pitfall #2:** CONTEXT says "`image_id`" — schema has `image JSONB`. Integration test asserts `candidate.image?.path !== undefined`.

### zod `.extend()` composition (v4 idiom)

**Source:** `packages/dev-seed/src/template/schema.ts:99-117`
**Apply to:** Phase 58 schema extension for `generateTranslationsForAllLocales`
**Anti-pattern:** `.merge()` — deprecated in zod v4 (explicit comment at `schema.ts:10`).

### Vitest skipIf env guard for integration tests

**Source:** RESEARCH §6 + `describe.skipIf()` vitest API
**Apply to:** `packages/dev-seed/tests/integration/default-template.integration.test.ts`
**Constraint:** Phase 57's `clustering.integration.test.ts` runs in the default `yarn test:unit` count (220/220). Phase 58 integration test hits LIVE Supabase — must guard with `describe.skipIf(!process.env.SUPABASE_URL)` so `yarn test:unit` in the default CI path (no `supabase start`) does not fail.

### Deterministic iteration order

**Source:** Phase 56 `TOPO_ORDER` constant at `pipeline.ts:76-91` + RESEARCH Pitfall #1
**Apply to:** `locales.ts` fan-out walk, portrait file enumeration
**Rule:** Hardcode arrays (`const LOCALES = ['en', 'fi', 'sv', 'da'] as const`); call `.sort()` on `fs.readdir()` output before iterating.

## No Analog Found

Files with no close match in the codebase (planner should use RESEARCH.md patterns and define inline):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `packages/dev-seed/src/cli/resolve-template.ts` | utility | transform | No prior `await import()` + zod-validate pattern in the repo. RESEARCH §1 code sketch is the canonical source. |
| `packages/dev-seed/src/cli/summary.ts` | utility | transform | No prior formatted-table pretty-printer utility. Plain text per D-58-14 — simple `String.padStart`/`padEnd` loop. |
| `packages/dev-seed/src/locales.ts` | utility | transform | No prior JSONB fan-out utility. Pattern defined in RESEARCH §5 Option A; iteration-order discipline per Pitfall #1. |
| `packages/dev-seed/src/templates/e2e.ts` | config | batch | Template is authored from Playwright spec audit (D-58-15) — content is audit-driven; no mechanical translation (D-58-15 explicitly REJECTS that). The shape is the same Template type; only content is bespoke. |
| `packages/dev-seed/tests/assets.test.ts` | test (fs) | file-I/O | No prior "asset-directory inventory" test. New minimal pattern: `fs.readdir` + count + filename regex. |
| `packages/dev-seed/src/assets/portraits/*.jpg` | static assets | — | Binary artefacts; no code analog. |
| `packages/dev-seed/src/assets/portraits/LICENSE.md` | licensing doc | — | No prior package-local LICENSE stub in the repo. Plain Markdown acknowledging public-domain-on-assumption status + link to source (thispersondoesnotexist.com) per RESEARCH Open Q 1. |
| `packages/dev-seed/scripts/download-portraits.ts` | one-off script | file-I/O (fetch + fs.writeFile) | No prior "repo-committed batch fetcher" pattern. RESEARCH §4 sketch is source. Shape: 30× `fetch()` + `fs.writeFile`, ~1 second apart (rate-limit politeness). |
| `packages/dev-seed/README.md` | package README | — | Root/docs READMEs don't share structure; planner picks sections per D-58-18 (authoring guide + worked example + flag reference + built-in list). |

## Metadata

**Analog search scope:**
- `packages/dev-tools/` (CLI precedent)
- `packages/dev-seed/src/**` (Phase 56/57 orchestration, schema, generators)
- `packages/dev-seed/tests/**` (unit + integration test conventions)
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/` (Storage upload pattern)
- `apps/frontend/src/lib/api/adapters/supabase/utils/` (StoredImage shape)
- `apps/supabase/supabase/migrations/00001_initial_schema.sql` (bulk_delete constraints, storage path convention)
- `apps/supabase/supabase/seed.sql` (bootstrap rows teardown must leave intact)
- `tests/seed-test-data.ts` (current legacy seeder — pattern for bulk operations)
- Root `package.json`, `CLAUDE.md` (script + docs structure)
- `packages/app-shared/src/settings/staticSettings.ts` (supportedLocales)

**Files scanned:** ~22 files read (full or targeted); ~7 via targeted Grep/Read with offset

**Key findings:**
- **Phase 58 CLI shape is 1:1 with `packages/dev-tools/src/keygen.ts`** — four flags, `parseArgs`, USAGE const, `process.exit(0|1)`, stderr for errors. This is the established repo precedent per Phase 56 D-28.
- **Portrait upload = frontend dataWriter pattern, service-role variant.** `supabaseDataWriter.ts:312-328` is the reference; Writer reuses the SAME path convention (`${projectId}/candidates/${candidateId}/filename`) and SAME `{ path, alt }` JSONB shape.
- **Teardown = bulkDelete with prefix + 11-table allowlist.** `tests/seed-test-data.ts:28-37` already demonstrates the exact shape; Phase 58 inherits it. Teardown MUST NOT include `accounts`/`projects`/`feedback` (not in schema `allowed_collections`).
- **Schema extension = `.extend()`, not `.merge()`** — Phase 56 comment at `schema.ts:10` explicitly predicts Phase 58 extension and names the correct operator.
- **Integration test guard = `describe.skipIf(!process.env.SUPABASE_URL)`** — Phase 57's `clustering.integration.test.ts` runs unconditionally (it's pure math, no DB); Phase 58's integration hits live Supabase and must guard.
- **Determinism discipline is the biggest new-surface risk.** RESEARCH Pitfall #1 + Pattern A from ctx.ts:84-85 — hardcode locale arrays, sort filesystem listings, never re-seed module-level faker.

**Pattern extraction date:** 2026-04-23
