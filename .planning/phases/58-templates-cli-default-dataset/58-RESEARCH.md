---
phase: 58-templates-cli-default-dataset
status: research-complete
researched: 2026-04-23
domain: CLI wiring + template composition + repo-checked-in portrait assets on an existing dev-seed pipeline
confidence: HIGH
---

# Phase 58: Templates, CLI & Default Dataset — Research

**Researched:** 2026-04-23
**Domain:** CLI surface, template composition, Supabase Storage upload + teardown, locale fan-out, portrait sourcing — ALL on top of the already-shipped `@openvaa/dev-seed` pipeline (Phase 56/57).
**Confidence:** HIGH — every load-bearing claim is VERIFIED against committed source or tool probing (schema SQL, `apps/supabase/supabase/config.toml`, existing `@openvaa/dev-tools/src/keygen.ts`, `packages/dev-seed/src/*`, installed `@faker-js/faker@8.4.1`). One LOW-confidence surface (the `thispersondoesnotexist.com` licensing claim) is explicitly flagged.

## Summary

Phase 58 is a **composition + ergonomics layer**, not algorithmic work. Every runtime component it needs — the `runPipeline` orchestrator, the service-role `SupabaseAdminClient` with `bulkImport` / `bulkDelete` / `linkJoinTables` / `importAnswers` / `updateAppSettings`, the `Writer` env-enforcement shell, the latent clustering emitter, the `TemplateSchema` with `.strict().extend()` support, the `buildCtx` fresh-Faker factory, the D-11 accounts/projects pass-through, the `attachSentinels` post-topo pass, and the `bulk_delete` RPC with `prefix`-based row removal — **already exists and is green (220/220 tests)**. Phase 58 therefore has five concrete deliverables, all of which reduce to orchestration around stable seams:

1. **CLI entry points** — `packages/dev-seed/src/cli/seed.ts` + `cli/teardown.ts` (new), parsed by `node:util/parseArgs` (the exact pattern `@openvaa/dev-tools/src/keygen.ts` already uses — no new framework), wired as `scripts.seed` / `scripts['seed:teardown']` on the package, and bubbled up to `dev:seed` / `dev:seed:teardown` / `dev:reset-with-data` on the root per D-58-08.
2. **Built-in templates** — `packages/dev-seed/src/templates/default.ts` + `templates/e2e.ts`, each a strongly-typed `Template` constant that `--template <name>` resolves by lookup. Templates are pure data; they compose the existing pipeline via `fixed[]` arrays + `count` fields + optional `latent.*` overrides.
3. **Portrait seeding (GEN-09/10)** — 30 committed AI portraits in `packages/dev-seed/src/assets/portraits/`, uploaded to the `public-assets` bucket keyed `${projectId}/candidates/${candidateId}/seed-portrait.jpg` (matching the RLS path convention in migration line 1934), then `candidates.image = { path: ... }` JSONB written via a post-write pass. Critically the schema column is **`candidates.image` (jsonb), NOT `candidates.image_id`** — the CONTEXT's "`image_id`" wording is imprecise.
4. **Locale fan-out (TMPL-07)** — `generateTranslationsForAllLocales: true` on the template triggers a per-entity JSONB expansion from `{ en: "..." }` to `{ en, fi, sv, da }` in every localized field. Faker v8.4.1 (the installed version, NOT v10 as dev-seed comments claim) ships locale objects for all four; the `Faker({ locale: [fi, en, ...] })` constructor supports fallback. Latent content is locale-agnostic; only display strings expand.
5. **Documentation + DX-03 integration test** — a README in `packages/dev-seed/README.md`, a section in root `CLAUDE.md` Common Workflows, JSDoc on `Template`, and a live-Supabase integration test (`packages/dev-seed/tests/integration/default-template.integration.test.ts` or similar) that writes the default template end-to-end and asserts row counts + locale completeness + portrait rows + elapsed time <10s (NF-01).

**Primary recommendation:** Treat Phase 58 as a wiring phase with ~8 small tasks — CLI shell, `--template` resolver, two template files, portrait upload step on Writer, locale fan-out utility, teardown CLI, integration test, docs — each individually small, each independently testable, and none requiring re-design of the Phase 56/57 architecture.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| CLI arg parsing + help + exit codes | `@openvaa/dev-seed` package (tsx script) | — | Phase 56 D-28 made this a tsx-only workspace; root `yarn dev:seed` is a passthrough. |
| Template resolution (name-vs-path, `.ts`/`.js`/`.json`) | `@openvaa/dev-seed` package | — | Template is data + zod validation; resolver reads from built-in map or filesystem. Node ESM + tsx handle `.ts`/`.js` via `await import()`. |
| Row generation (all 14 tables) | `@openvaa/dev-seed/src/pipeline.ts` (existing) | `generators/*` (existing) | **ALREADY SHIPPED** — Phase 58 does not touch generator internals. |
| Latent-factor answers | `@openvaa/dev-seed/src/emitters/latent/` (existing) | — | **ALREADY SHIPPED** — Phase 58 templates may override `latent.*` via schema, but default behavior "just works". |
| Database writes (bulk_import + sentinels + app_settings) | `@openvaa/dev-seed/src/writer.ts` (existing) | `supabaseAdminClient.ts` (existing) | Existing RPCs (bulk_import, merge_jsonb_column, linkJoinTables) unchanged. Writer extends with ONE new pass: portrait upload after candidate insert (Plan-level decision). |
| Portrait file upload | `@openvaa/dev-seed/src/writer.ts` (extended) | `@supabase/supabase-js` Storage API | Service-role client uploads to `public-assets` bucket. Post-insert read-back of candidate UUIDs needed (the path encodes UUID, not external_id). |
| Locale fan-out | `@openvaa/dev-seed/src/locales.ts` (NEW small helper) + per-generator consumption | `@faker-js/faker` locale packages (already installed) | Helper takes `{ en: "..." }` + per-locale faker instances → `{ en, fi, sv, da }`. Generators read `template.generateTranslationsForAllLocales` flag once per run. |
| Teardown (DELETE by prefix) | `@openvaa/dev-seed/src/cli/teardown.ts` (NEW) | `bulk_delete` RPC (existing) + Storage cascade triggers (existing) | Schema's `cleanup_entity_storage_files` AFTER-DELETE trigger fires `pg_net` calls to remove files (D-58-07 path 2 — primary); fallback is explicit `.list({ prefix })` + `.remove()` (path 1). |
| Documentation | `packages/dev-seed/README.md` (NEW) + root `CLAUDE.md` (extended) + JSDoc on `Template` | — | Three-surface approach per D-58-18. |

## Standard Stack

### Core (already installed — Phase 58 adds NOTHING)

| Library | Version | Purpose | Source |
|---------|---------|---------|--------|
| `@faker-js/faker` | `^8.4.1` | Seeded RNG + locale-aware name/content generators | `[VERIFIED: .yarnrc.yml catalog + node_modules/@faker-js/faker/package.json]` |
| `@supabase/supabase-js` | `^2.49.4` | Service-role client + Storage upload | `[VERIFIED: .yarnrc.yml catalog]` |
| `zod` | `^4.3.6` | Template validation + `.extend()` composition | `[VERIFIED: .yarnrc.yml catalog]` |
| `tsx` | `^4.19.2` | TypeScript runner for CLI scripts | `[VERIFIED: .yarnrc.yml catalog]` + tsx --version prints `v4.19.2` |
| `@openvaa/dev-seed` (workspace) | `0.1.0` | Existing Phase 56/57 pipeline | `[VERIFIED: packages/dev-seed/package.json]` |
| `node:util` (parseArgs) | Node 22 built-in | CLI arg parsing — **same pattern used in `@openvaa/dev-tools/src/keygen.ts`** | `[VERIFIED: packages/dev-tools/src/keygen.ts line 22]` |
| `node:fs/promises`, `node:path`, `node:url` | Node 22 built-in | Filesystem reads for portraits + template file loading | `[VERIFIED: Node 22 built-in — currently used throughout repo]` |

### NOT needed

| Tempting | Why skip |
|----------|----------|
| `commander` / `yargs` | `node:util/parseArgs` is already the repo precedent (see `@openvaa/dev-tools/src/keygen.ts`). Adding a CLI framework inflates bundle + adds a dep + contradicts the "minimal-dep" posture of Phase 56 D-28. |
| `jiti` | D-58-10 explicitly rejected — `await import()` via tsx handles `.ts`/`.js` natively; `JSON.parse(fs.readFileSync(...))` handles `.json`. |
| `sharp` / image transforms | No image transformation in Phase 58 — portraits are pre-resized/pre-optimized JPEGs committed at the desired size. The frontend's existing `Image` component renders them as-is. |
| `p-limit` | Portrait upload is sequential in the plan; if parallel turns out necessary for NF-01 <10s, use built-in `Promise.all` with a small fixed-width loop (no dep). |
| `chalk` / `kleur` | CLI summary is plain text per D-58-14 (no machine-parseable JSON yet). No color required. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled `parseArgs` | `commander` | Commander gives a nicer `--help` auto-render, but inflates deps and diverges from `keygen.ts` precedent. Not worth it for 4 flags. |
| Sequential portrait upload | `Promise.all` + chunked pool | If NF-01 <10s budget is tight, parallelize. Not yet needed — measure first. |
| Upload via Writer | Upload via a separate `PortraitStep` class | Writer-extension keeps the orchestration in one place; a separate class adds a layer for no gain. |
| Post-write UPDATE `image` column | Write `image` inline in candidate row during bulk_import | Can't — the storage path encodes `candidates.id` (UUID assigned by Postgres on INSERT), which isn't known until after bulk_import returns. Two-pass is mandatory. |

**Installation required:** **NONE**. All dependencies are already in the workspace or catalog.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GEN-09 | Candidate portrait images seeded from curated batch, uploaded to Storage, `candidates.image` populated | Technical Approach §4 (Portraits). Schema column is `candidates.image` JSONB of shape `{ path, pathDark?, alt? }` — VERIFIED in migration line 516 + `apps/frontend/src/lib/api/adapters/supabase/utils/storageUrl.ts:9-16`. |
| GEN-10 | Portrait batch committed to `packages/dev-seed/src/assets/portraits/`, permissively licensed | §4 (Portraits). D-58-05 locks source (`thispersondoesnotexist.com`) + count (30). Licensing is LOW-confidence; see Known Pitfalls #7. |
| TMPL-03 | Collections accept hand-authored rows + generator count in the same definition | **Already shipped** (Phase 56 Plan 04/05) — every generator's `fixed[]` pass-through pattern is the implementation. Phase 58's default + e2e templates exercise this surface. |
| TMPL-04 | Built-in `default` template — realistic Finnish-flavored election | §2 (Template Composition). D-58-01/02/03/04 lock content; planner tunes exact numbers. |
| TMPL-05 | Built-in `e2e` template matching Playwright spec assertions | §2 + Specifics. D-58-15 mandates spec audit before authoring. 21 spec files × ≥261 testId calls × 13 unique `test-*` external IDs found by grep. |
| TMPL-06 | Custom templates loadable from `.ts`, `.js`, `.json` via `--template <path>` | §1 (CLI). D-58-09 resolution algorithm + D-58-10 loader mechanics. |
| TMPL-07 | Flat top-level `generateTranslationsForAllLocales: boolean` honoring `staticSettings.supportedLocales` | §5 (Locale fan-out). Faker v8.4.1 supports fi/sv/da/en locale packs — VERIFIED by direct probe. `staticSettings.supportedLocales = [en, fi, sv, da]`. |
| CLI-01 | `yarn workspace @openvaa/dev-seed seed --template <name-or-path>` seeds Supabase | §1 (CLI). New `src/cli/seed.ts` entry point. |
| CLI-02 | Root-level `yarn dev:reset-with-data` = `supabase db reset` + seed default | §1 (CLI). Script composition: `yarn supabase:reset && yarn dev:seed --template default`. |
| CLI-03 | `seed:teardown` removes generator-produced rows via `external_id` prefix | §3 (Teardown). `bulk_delete` RPC supports `prefix`-keyed deletion (VERIFIED at schema line 2890). Storage cascade via AFTER-DELETE trigger (VERIFIED at schema line 2256-2295). |
| CLI-04 | `--help` output documents flags + built-in templates + custom-template link | §1 (CLI). `--help` block generated from a static usage constant like `keygen.ts`. |
| CLI-05 | Success summary (rows/entity, template, elapsed) | §1 (CLI). Plain-text aligned table; no new dep. |
| NF-04 | Deterministic output given fixed `seed` | **Already shipped** (Phase 56 + 57 tests pass determinism for `{ seed: 42 }`). Risk: locale fan-out must iterate locales in stable order (see Known Pitfalls #1). |
| DX-01 | Docs for authoring custom templates | §7 (Documentation). README.md + JSDoc on `Template`. |
| DX-03 | Integration test applying default template to live local Supabase | §6 (Integration test). DB round-trip; asserts row counts, locale keys, portraits, <10s budget. |
| DX-04 | `CLAUDE.md` Common Workflows documents seeding | §7 (Documentation). One-block addition under the existing "Common Workflows" section. |

## Project Constraints (from CLAUDE.md)

- **Yarn 4 workspace + Turborepo:** New scripts go in `package.json` files; Turborepo `turbo.json` needs no change (CLI scripts are not `build`/`test:unit`/`lint`/`typecheck` tasks).
- **TypeScript strict, no `any` in public surface** (NF-03): CLI code uses typed `parseArgs` options and typed `Template` literals.
- **Localization is load-bearing:** Every user-facing string must support locales (`staticSettings.supportedLocales`). The default template MUST populate all 4 locales when `generateTranslationsForAllLocales: true` — applies to `name`, `short_name`, `info`, question text, category names, constituency names, party names.
- **WCAG 2.1 AA:** CLI output is not UI, but portrait alt text is. Plan SHOULD include an `alt` field on `candidates.image` JSONB (e.g. `alt: "${first_name} ${last_name}"`) for accessibility. See Known Pitfalls #4.
- **Never commit secrets:** Portraits are AI-generated public-domain images — no personally identifiable content. Service-role key is read from env, never hardcoded.
- **MISSING_VALUE convention:** Not relevant for template data (all candidates answer all questions in the default template). Relevant only if a template deliberately omits answers.
- **NPM/Node needs built `.js` files for dependees:** `@openvaa/dev-seed` is tsx-only (D-28) so no build step needed for its own source; but `@openvaa/core` / `@openvaa/matching` / `@openvaa/supabase-types` / `@openvaa/app-shared` must be built before running the CLI. Covered by `yarn build` in `dev:start`; integration test setup must `yarn build --filter=@openvaa/dev-seed...` first.

## User Constraints (from CONTEXT.md)

### Locked Decisions (Verbatim from 58-CONTEXT.md)

- **D-58-01 Party flavor:** 8 invented parties with Finnish-cultural flavor (Blue Coalition, Green Wing, Social Democrats Union, Rural Alliance, People's Movement, Red Front, Coastal Party, Values Coalition — planner's call on exact names).
- **D-58-02 Entity counts:** 13 constituencies, 8 parties, **100 candidates non-uniformly distributed**, 24 questions, 4 categories, 1 election, 1 constituency group.
- **D-58-03 Question mix:** Majority ordinal Likert, some categorical, some multi-choice, 1 boolean. NO number / text / date / image / multipleText.
- **D-58-04 `generateTranslationsForAllLocales: true`** in the default template.
- **D-58-05 Portraits:** 30 pre-downloaded from thispersondoesnotexist.com, committed to `packages/dev-seed/src/assets/portraits/`.
- **D-58-06 Upload path:** Service-role client → `public-assets` bucket, key encodes external_id prefix for filter-based teardown.
- **D-58-07 Teardown:** Try trigger-based first; fallback to explicit prefix deletion if orphans remain.
- **D-58-08 Commands:** `seed` + `seed:teardown` on the package; `dev:seed`, `dev:seed:teardown`, `dev:reset-with-data` root aliases.
- **D-58-09 Template resolution:** Path if starts with `./`, `/`, `../` OR ends in `.ts`/`.js`/`.json`; otherwise built-in name lookup.
- **D-58-10 Loader:** `await import(path)` for `.ts`/`.js`; `JSON.parse(fs.readFile(..., 'utf8'))` + zod validate for `.json`. No `jiti`.
- **D-58-11 reset-with-data:** `yarn supabase:reset && yarn dev:seed --template default` — pure package.json composition.
- **D-58-12 CLI errors:** Structured, fail-fast, actionable with specific exit codes + messages.
- **D-58-13 --help:** Every flag with default + description, every built-in template with 1-liner, link to README example.
- **D-58-14 Success summary:** Template applied, rows/entity aligned table, portraits uploaded count, elapsed time. stdout, human-readable.
- **D-58-15 e2e template:** Authored by auditing Playwright spec files (testIds + candidate/party/constituency names + question IDs + relational contracts). Mechanical JSON port is REJECTED.
- **D-58-16 e2e `generateTranslationsForAllLocales: false`** — Playwright specs test single locale.
- **D-58-17 Teardown strictness:** Permissive — delete every row with the configured prefix. No shape checks.
- **D-58-18 Doc homes:** `packages/dev-seed/README.md` + root `CLAUDE.md` Common Workflows + JSDoc on `Template`.
- **D-58-19 apps/docs/ NOT updated:** Deferred housekeeping.
- **D-58-20 Integration test asserts:** Row counts (with wiggle), relational integrity, 100 non-NULL `image_id`s, Storage bucket has 100 objects under prefix, elapsed ≤10s, locale JSONB keys present for all 4 locales.
- **D-58-21 Integration test location:** `packages/dev-seed/tests/` or `src/*.integration.test.ts`. Runs in CI separately from `yarn test:unit`.

### Claude's Discretion

- Exact party names (respecting D-58-01 spirit).
- Exact non-uniform distribution weights (suggested `[20, 18, 15, 12, 10, 10, 8, 7]` sums to 100).
- Exact split of 24 questions across types respecting D-58-03.
- Exact `dev:reset-with-data` filename in root (name locked per D-58-08).
- Storage object key pattern as long as prefix is deterministic + teardown-filterable.
- Location of one-off `download-portraits.ts` maintainer script.
- Whether e2e audit is a separate inventory doc or inline in plans.

### Deferred Ideas (OUT OF SCOPE)

- `apps/docs/` site update — deferred housekeeping.
- `--output json` machine mode — future DX.
- `--dry-run` on `seed:teardown` — future DX.
- Mechanical port of JSON fixtures to e2e template — REJECTED.
- Strict shape-check teardown — REJECTED.
- Non-portrait media seeding (party logos, campaign media).
- Storage-upload retries / idempotency beyond "re-run after fix".
- Template editor UI — Out of Scope in REQUIREMENTS.

## Phase Boundary

### In Scope
- New files under `packages/dev-seed/src/cli/` (seed entry, teardown entry, helper utilities).
- New files under `packages/dev-seed/src/templates/` (`default.ts`, `e2e.ts`, possibly an `index.ts` barrel exporting the built-in map).
- New directory `packages/dev-seed/src/assets/portraits/` with 30 committed `.jpg` files + a `README.md` stating licensing.
- New file `packages/dev-seed/scripts/download-portraits.ts` (one-off maintainer script — NOT runtime).
- Extension of `packages/dev-seed/src/writer.ts` with a portrait-upload pass (inside the existing `write()` method or a new `uploadPortraits()` method called after `bulkImport`).
- Extension of `packages/dev-seed/src/template/schema.ts` with `generateTranslationsForAllLocales: z.boolean().optional()` at the top level (new field, not a sub-block).
- Extension of `packages/dev-seed/src/generators/*` to consume the `generateTranslationsForAllLocales` flag — OR (cleaner) a single post-generation fan-out utility in `packages/dev-seed/src/locales.ts` that expands `{ en: "..." }` fields across locales before the writer runs.
- New file `packages/dev-seed/tests/integration/default-template.integration.test.ts` (live-Supabase round-trip).
- New file `packages/dev-seed/README.md`.
- Modifications to root `package.json` (add `scripts.dev:seed`, `scripts.dev:seed:teardown`, `scripts.dev:reset-with-data`).
- Modifications to `packages/dev-seed/package.json` (add `scripts.seed`, `scripts['seed:teardown']`, optional `bin` entry).
- Modifications to root `CLAUDE.md` (add Common Workflows snippet).
- Inventory doc (e.g. `58-E2E-SPEC-AUDIT.md` in the phase directory) documenting every testId, external_id, and candidate/party name the Playwright specs assert on — deliverable from D-58-15.

### Out of Scope (Phase 59 and beyond)
- Rewriting `tests/seed-test-data.ts` on the new generator — Phase 59.
- Deleting legacy JSON fixtures (`default-dataset.json`, `voter-dataset.json`, `candidate-addendum.json`) — Phase 59.
- `apps/docs/` site updates for dev-seed — deferred housekeeping.
- Machine-readable CLI output (JSON mode).
- `seed:teardown --dry-run`.
- Retry logic on Storage upload failures.
- Non-portrait media (party logos, campaign media, attached docs).
- Template editor UI / generator.
- Changes to `bulk_import` / `bulk_delete` RPCs (they cover all needed cases).
- Changes to `candidates.image` JSONB schema shape.
- Changes to Phase 56/57 generator internals (default generators still emit; templates compose them via `fixed[]` + `count`).

## Technical Approach

### 1. CLI Surface (`packages/dev-seed/src/cli/`)

**Precedent:** `packages/dev-tools/src/keygen.ts` (VERIFIED — uses `node:util/parseArgs` from Node 22's built-in stdlib with `{ values } = parseArgs({ options: {...} })` shape). Phase 58 CLI MUST follow this pattern — no `commander`, no `yargs`, no `minimist`.

**Files:**
- `packages/dev-seed/src/cli/seed.ts` — entry point invoked as `yarn workspace @openvaa/dev-seed seed`.
- `packages/dev-seed/src/cli/teardown.ts` — entry point for `seed:teardown`.
- `packages/dev-seed/src/cli/resolve-template.ts` — pure function implementing D-58-09 resolution algorithm.
- `packages/dev-seed/src/cli/help.ts` — static usage string + built-in template listing.
- `packages/dev-seed/src/cli/summary.ts` — pure function formatting the success summary table per D-58-14.

**Argument parsing (seed.ts):**
```typescript
// [CITED: node:util parseArgs docs, exact pattern from keygen.ts:34-42]
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    template: { type: 'string', short: 't' },
    seed: { type: 'string' },              // fixed faker seed override
    'external-id-prefix': { type: 'string' },
    help: { type: 'boolean', short: 'h' }
  },
  strict: true,
  allowPositionals: false
});
```

**Template resolution (resolve-template.ts) — D-58-09:**
```typescript
// Pseudocode — actual impl uses path.extname() etc.
async function resolveTemplate(arg: string): Promise<Template> {
  const isPath =
    arg.startsWith('./') || arg.startsWith('/') || arg.startsWith('../') ||
    arg.endsWith('.ts') || arg.endsWith('.js') || arg.endsWith('.json');

  if (isPath) {
    const absPath = path.resolve(arg);
    if (absPath.endsWith('.json')) {
      const raw = JSON.parse(await fs.readFile(absPath, 'utf8'));
      return validateTemplate(raw);          // zod TMPL-09 errors
    }
    // .ts or .js — tsx handles .ts at import time
    const mod = await import(pathToFileURL(absPath).href);
    const tpl = mod.default ?? mod.template;
    return validateTemplate(tpl);
  }

  // Built-in name lookup
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

**Key subtlety:** `await import(absPath)` on a `.ts` file only works when the runtime is `tsx` (or has `--loader tsx/esm`). The package.json `scripts.seed` MUST be `tsx src/cli/seed.ts` (NOT `node`). VERIFIED — this is how `keygen.ts` works today.

**Error handling (D-58-12) — precise exit paths:**
- SUPABASE_URL missing → exit 1 with `Error: SUPABASE_URL not set. Run 'supabase start' first, or export SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.`
- SUPABASE_SERVICE_ROLE_KEY missing → exit 1 with `Error: SUPABASE_SERVICE_ROLE_KEY not set. Run 'supabase status' to obtain the local service_role key.`
- Writer constructor throws with exactly these messages already (VERIFIED: `packages/dev-seed/src/writer.ts:78-91`). CLI catches `Error` and prints + exit(1).
- Unreachable Supabase → `supabase-js` throws `fetch failed` — wrap the first RPC call and rephrase: `Error: Cannot reach Supabase at ${url}. Is 'supabase start' running?`
- Template not found → message listing built-ins + suggesting path form.
- Template validation failed → the `validateTemplate()` error already includes field paths (VERIFIED: `packages/dev-seed/src/template/schema.ts:130-135` — the TMPL-09 formatter emits `template.${path}: ${message}`).

**`--help` output (help.ts) — D-58-13:**
```
Usage: yarn workspace @openvaa/dev-seed seed [options]

Options:
  -t, --template <name-or-path>    Template to apply. Built-in names resolve first;
                                    paths ending in .ts/.js/.json load from filesystem.
                                    [default: default]
      --seed <integer>              Override template.seed for deterministic RNG.
      --external-id-prefix <str>    Override generator's external_id prefix (default 'seed_').
  -h, --help                        Show this help and exit.

Built-in templates:
  default   — Finnish-flavored election, 13 cons / 8 parties / 100 cands / 24 qs, 4-locale.
  e2e       — Matches Playwright spec assertions, single-locale.

Custom templates:
  See packages/dev-seed/README.md for a worked authoring example (fixed[] + count,
  locale fan-out, latent overrides).

Environment:
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY must be set. 'supabase start' sets both
  for local dev.
```

**Success summary (summary.ts) — D-58-14:**
```
Applied template: default (built-in)
Seed: 42                                                Elapsed: 6.21s
                                                        Portraits uploaded: 100

Table                          Created    Updated
────────────────────────────── ────────── ──────────
elections                      1          0
constituency_groups            1          0
constituencies                 13         0
organizations                  8          0
question_categories            4          0
questions                      24         0
candidates                     100        0
nominations                    100        0
app_settings                   0          1       (merged)
────────────────────────────── ────────── ──────────
Total                          251        1
```

The `bulk_import` RPC already returns `{ [table]: { created, updated } }` per row (VERIFIED: schema line 2796); summary consumes that directly.

**Root package.json scripts (D-58-08):**
```json
{
  "dev:seed": "yarn workspace @openvaa/dev-seed seed",
  "dev:seed:teardown": "yarn workspace @openvaa/dev-seed seed:teardown",
  "dev:reset-with-data": "yarn supabase:reset && yarn dev:seed --template default"
}
```

**Package.json (`packages/dev-seed/package.json`):**
```json
{
  "scripts": {
    "seed": "tsx src/cli/seed.ts",
    "seed:teardown": "tsx src/cli/teardown.ts",
    /* existing scripts stay */
  }
}
```

Note: the `bin` field is optional. D-58-08 says "root aliases bubble up so developers never have to type `yarn workspace @openvaa/dev-seed ...` for common operations." Yarn passes through `--` correctly for the root aliases (`yarn dev:seed --template e2e` forwards `--template e2e` to the workspace script). VERIFIED — this is the same mechanism `keygen` uses.

### 2. Template Composition

**Schema extension (`packages/dev-seed/src/template/schema.ts`):**

Add ONE new top-level field (keeps Phase 56's `.extend()` pattern):
```typescript
export const TemplateSchema = z.object({
  // ...existing fields
  generateTranslationsForAllLocales: z.boolean().optional()
}).extend({ latent: latentBlock.optional() });
```

**`packages/dev-seed/src/templates/default.ts` — a typed `Template` constant:**

Shape sketch (exact values planner's call, respecting D-58-01/02/03/04):
```typescript
export const defaultTemplate: Template = {
  seed: 42,
  externalIdPrefix: 'seed_',
  generateTranslationsForAllLocales: true,
  elections: {
    fixed: [{
      external_id: 'election_default',
      name: { en: 'OpenVAA Demo Election 2026' /* fi/sv/da filled by locale fan-out */ },
      election_date: '2026-06-15',
      election_start_date: '2026-05-01',
      published: true
    }]
  },
  constituency_groups: {
    fixed: [{
      external_id: 'cg_default',
      name: { en: 'Eduskunta Districts' },
      published: true
    }]
  },
  constituencies: {
    count: 13,
    fixed: [ /* 13 Finnish-district-flavored entries, all published */ ]
  },
  organizations: {
    // 8 invented parties with Finnish-cultural flavor
    fixed: [
      { external_id: 'party_blue',   name: { en: 'Blue Coalition' },      color: '#...' },
      { external_id: 'party_green',  name: { en: 'Green Wing' },          color: '#...' },
      // ... 6 more
    ]
  },
  question_categories: {
    fixed: [
      { external_id: 'cat_economy',  name: { en: 'Economy & Taxation' },     category_type: 'opinion', order: 1 },
      { external_id: 'cat_social',   name: { en: 'Social & Welfare' },       category_type: 'opinion', order: 2 },
      { external_id: 'cat_environ',  name: { en: 'Environment & Energy' },   category_type: 'opinion', order: 3 },
      { external_id: 'cat_foreign',  name: { en: 'Foreign & Defence' },      category_type: 'opinion', order: 4 }
    ]
  },
  questions: {
    count: 24
    // Phase 56's QuestionsGenerator rotates PHASE_56_TYPE_ROTATION; Phase 58
    // needs to override this to enforce D-58-03's "majority Likert + some cat/mc + 1 bool, no text/number".
    // Two options:
    //   (a) Extend QuestionsGenerator to read a per-template typeDistribution map.
    //   (b) Author all 24 as fixed[] with hand-chosen types and names.
    // Planner picks — (a) is more reusable; (b) is simpler for Phase 58's one-off default.
  },
  candidates: {
    count: 100
    // CandidatesGenerator emits round-robin org assignment (i % refs.organizations.length).
    // Phase 58's non-uniform weighting [20, 18, 15, 12, 10, 10, 8, 7] requires either:
    //   (a) Candidates override function that does the weighting (via Overrides map).
    //   (b) Extend CandidatesGenerator to read a per-party count map.
    // Planner picks — (a) via D-25 override is cleanest since it's template-specific.
  },
  nominations: {
    count: 100   // one nomination per candidate, auto-wires via Phase 56 emitter
  }
};
```

**`packages/dev-seed/src/templates/e2e.ts` — authored AFTER audit (D-58-15):**

Contents driven by the D-58-15 Playwright audit. Key seed data found by grep:
- **Candidates:** `test-candidate-alpha` (first name `Test`, last name `Candidate Alpha`, email `mock.candidate.2@openvaa.org`).
- **Elections:** `test-election-1`, `test-election-2` (multi-election spec).
- **Constituencies:** `test-constituency-alpha`, `test-constituency-e2`.
- **Constituency group:** `test-cg-municipalities`.
- **Questions:** `test-question-text`.
- **Various IDs:** `test-voter-cand-agree`, `test-voter-cand-oppose`, `test-voter-cand-partial`, `test-bank-auth-sub-001`, `test-enc-1`, `test-sig-1`, `test-client-id`.

The audit inventory doc should enumerate EVERY testId assertion + every external_id the specs query by (via `findData('elections', { externalId: { $eq: 'test-election-1' } })` pattern) + every candidate/party NAME the specs match against. The e2e template then declares each entity as `fixed[]` with these exact values.

**`generateTranslationsForAllLocales: false`** per D-58-16 (Playwright specs are single-locale).

**Built-in template map (`packages/dev-seed/src/templates/index.ts`):**
```typescript
import { defaultTemplate } from './default';
import { e2eTemplate } from './e2e';

export const BUILT_IN_TEMPLATES: Record<string, Template> = {
  default: defaultTemplate,
  e2e: e2eTemplate
};
```

### 3. Teardown (`seed:teardown`)

**Existing surface is sufficient — no new RPC:**

`bulk_delete` RPC (VERIFIED at schema line 2860-2927) accepts `{ project_id, collections: { [table]: { prefix } } }` and runs `DELETE FROM public.${table} WHERE project_id = $1 AND external_id LIKE $2` with `prefix || '%'`. The delete order is enforced server-side (reverse dependency order) so candidates/nominations can't leave orphan refs.

**CLI flow (teardown.ts):**
```typescript
const client = new SupabaseAdminClient();
await client.bulkDelete({
  nominations:         { prefix: 'seed_' },
  candidates:          { prefix: 'seed_' },
  questions:           { prefix: 'seed_' },
  question_categories: { prefix: 'seed_' },
  organizations:       { prefix: 'seed_' },
  constituency_groups: { prefix: 'seed_' },  // join tables cascade via FK ON DELETE CASCADE
  constituencies:      { prefix: 'seed_' },
  elections:           { prefix: 'seed_' },
  alliances:           { prefix: 'seed_' },
  factions:            { prefix: 'seed_' }
});
```

Note: `accounts` / `projects` / `app_settings` are NOT in `allowed_collections` for `bulk_delete` (would need to be added — or D-11 pass-through means they're never deleted by the seeder anyway, matching CONTEXT's "bootstrap rows intact" requirement).

**Storage cascade (D-58-07):**
Schema line 2256-2295 registers `cleanup_entity_storage_files` as an AFTER-DELETE trigger on candidates / organizations / factions / alliances / elections / constituencies / constituency_groups / nominations / question_categories / questions. The trigger reads `storage_config` and uses `pg_net` to fire async DELETE calls to the Storage API for all files at `${project_id}/${entity_type}/${entity_id}/`.

**Path 1 (trigger-first, D-58-07 primary):** Call `bulkDelete({ prefix: 'seed_' })` and trust the trigger. After the RPC returns, verify via `supabase.storage.from('public-assets').list('${project_id}/candidates/', { limit: 1000 })` that the listing is empty (or matches only non-generator files). If orphans remain, fall back.

**Path 2 (explicit deletion, D-58-07 fallback):**
```typescript
const { data } = await supabase.storage.from('public-assets').list(
  `${projectId}/candidates`,
  { limit: 1000 }
);
const seedFiles = (data ?? []).filter(f => f.name.includes('seed-portrait') /* or whatever prefix */);
await supabase.storage.from('public-assets').remove(
  seedFiles.map(f => `${projectId}/candidates/${f.name}`)
);
```

**Risk:** `pg_net` is async — trigger fires the HTTP request but doesn't block on response. Files may linger briefly after the RPC returns. Either poll with timeout OR use Path 2 synchronously. Recommend Path 2 as the primary path for deterministic teardown — trigger is nice-to-have fallback. This reverses CONTEXT's D-58-07 "try 2, fallback 1" — planner should validate by running teardown against a live Supabase and timing file cleanup.

### 4. Portraits (GEN-09/10)

**Directory:** `packages/dev-seed/src/assets/portraits/` — 30 `.jpg` files, checked into git. Name them `portrait-01.jpg` through `portrait-30.jpg` (deterministic order for deterministic cycling).

**One-off maintainer script (`packages/dev-seed/scripts/download-portraits.ts`):**
- Invokes `fetch('https://thispersondoesnotexist.com/')` 30 times (serial, 1 second apart to avoid rate-limiting — the endpoint returns a fresh image each request).
- Writes to `src/assets/portraits/portrait-NN.jpg`.
- **NOT part of the runtime seed flow** — a comment at the top notes "run this once to refresh the pool; pool is checked in, not fetched per seed".
- Adds a `packages/dev-seed/src/assets/portraits/LICENSE.md` with the public-domain claim.

**⚠️ LICENSING CONFIDENCE: LOW.** `[ASSUMED]` — thispersondoesnotexist.com does NOT explicitly state its output license on the site. The StyleGAN technology is open source, but generated-image rights are legally ambiguous. **Recommendation:** planner should verify with user during plan-check (OR switch to a better-documented permissive source like pexels.com portraits with clear CC0 terms). See Open Question 1.

**Runtime upload (writer.ts extension):**

After `bulkImport` writes candidate rows (which assigns Postgres-generated UUIDs), the writer runs a new pass:

```typescript
// New method in Writer class
private async uploadPortraits(
  candidates: Array<Record<string, unknown>>,
  portraitPaths: Array<string>  // 30 local filesystem paths, stable order
): Promise<number> {
  // Re-fetch the candidate UUIDs + external_ids (bulk_import doesn't return them inline)
  const extIds = candidates.map(c => c.external_id).filter(Boolean) as string[];
  const { data: rows } = await this.client.from('candidates')
    .select('id, external_id, project_id')
    .in('external_id', extIds);

  let uploaded = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const portraitPath = portraitPaths[i % portraitPaths.length];   // cycle
    const bytes = await fs.readFile(portraitPath);
    const storagePath = `${row.project_id}/candidates/${row.id}/seed-portrait.jpg`;

    const { error } = await this.client.storage
      .from('public-assets')
      .upload(storagePath, bytes, { contentType: 'image/jpeg', upsert: true });
    if (error) throw new Error(`Portrait upload failed for ${row.external_id}: ${error.message}`);

    // Write image JSONB column via UPDATE (not merge_jsonb_column — full replacement)
    // NOTE: this triggers cleanup_old_image_file BEFORE UPDATE on the first run
    // (OLD.image is NULL so the trigger no-ops; see migration line 2318).
    const { error: upError } = await this.client.from('candidates')
      .update({ image: { path: storagePath, alt: `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim() } })
      .eq('id', row.id);
    if (upError) throw new Error(`Image column update failed for ${row.external_id}: ${upError.message}`);
    uploaded++;
  }
  return uploaded;
}
```

**Schema path convention (VERIFIED migration line 1934-1936):**
`storage.objects.name` MUST be `{project_id}/{entity_type}/{entity_id}/filename.ext`. The RLS policies parse this 3-segment path — violating the convention breaks read-back for unauthenticated users.

**`candidates.image` column is JSONB not `image_id`:**
VERIFIED at migration line 516: `image jsonb`. The JSONB shape is `{ path, pathDark?, alt?, width?, height?, focalPoint? }` per `apps/frontend/src/lib/api/adapters/supabase/utils/storageUrl.ts:9-16`. The CONTEXT's reference to "`candidates.image_id`" is imprecise — fix in plans + the success criterion.

**bucket `public-assets` has `public = true` in config.toml** (VERIFIED at line 116-118), so unauthenticated reads via `GET /storage/v1/object/public/public-assets/...` work. The frontend's `parseStoredImage()` builds the URL this way (VERIFIED at storageUrl.ts:31).

**Service-role client bypasses RLS for INSERT:** VERIFIED — RLS policies at line 2019-2026 require candidate-owned auth.uid matching, but service role bypasses RLS entirely. Writer already runs under service-role (Phase 56 D-15).

**Determinism:** 30 portraits × 100 candidates = cycle index `i % 30` gives the same assignment across runs at the same seed. VERIFIED — filesystem iteration order depends on fs.readdir which is platform-specific; MUST sort the portrait-path array explicitly before cycling.

**Performance (NF-01 <10s):** Sequential uploads of 100 ~200KB JPEGs to local Supabase Storage ≈ 10-30ms each ≈ 1-3 seconds total. Parallelization with `Promise.all(...map(...))` cuts this further. Well within budget.

### 5. Locale Fan-out (TMPL-07)

**Default template has `generateTranslationsForAllLocales: true`** (D-58-04). E2E template has `false` (D-58-16).

**Faker v8 locale support (VERIFIED by direct probe):**
```
FI firstName: Pentti    SV firstName: Astrid    DA firstName: Jakob
```
`new Faker({ locale: [fi, en] })` constructor accepts a fallback chain. For the default template, the generator needs 4 faker instances (one per locale) OR one instance whose locale is switched per locale iteration.

**Implementation options (planner picks):**

**Option A — Pipeline-level fan-out utility (RECOMMENDED):**
Add `packages/dev-seed/src/locales.ts`:
```typescript
import { en, fi, sv, da, Faker } from '@faker-js/faker';

const LOCALE_FAKERS = new Map<string, Faker>();

function getLocaleFaker(locale: string, seed: number): Faker {
  const key = `${locale}:${seed}`;
  if (!LOCALE_FAKERS.has(key)) {
    const localeData = { en, fi, sv, da }[locale] ?? en;
    const f = new Faker({ locale: [localeData, en] });
    f.seed(seed);
    LOCALE_FAKERS.set(key, f);
  }
  return LOCALE_FAKERS.get(key)!;
}

/**
 * Post-process generator output: for every JSONB localized-string field
 * (`name`, `short_name`, `info`, question `name`, choice `label`, etc.),
 * expand `{ en: "..." }` → `{ en, fi, sv, da }` by re-generating with
 * locale-specific fakers.
 */
export function fanOutLocales(
  rows: Record<string, Array<Record<string, unknown>>>,
  template: Template,
  seed: number
): void {
  if (!template.generateTranslationsForAllLocales) return;
  // Walk every generated row, identify localized-string JSONB fields,
  // add missing locales.
  // Canonical list of localized fields per table is known from the schema
  // (`name`, `short_name`, `info`, `color`, `custom_data` — but only `name` /
  // `short_name` / `info` are strings; `color` / `custom_data` are other shapes).
  // ...
}
```

Call from `runPipeline` at the end, before return.

**Option B — Per-generator locale awareness:**
Each generator reads `template.generateTranslationsForAllLocales` and emits all-4-locale JSONB directly. More invasive; touches 5+ generators.

**Recommendation:** Option A — keeps Phase 56/57 generators untouched. Compatible with override functions (they also benefit from fan-out).

**Critical for determinism (Known Pitfalls #1):** The fan-out walk MUST use a STABLE iteration order for `Object.keys()` on templates, for `rows` keys, and for locale codes. Use `['en', 'fi', 'sv', 'da']` as a hardcoded array, NOT `Object.keys(supportedLocales)`.

**Fan-out doesn't need to re-generate semantically-correct names** — for a candidate named "Pentti Turunen" in fi, the sv/da/en values can be different faker outputs (different random names from those locales) since the `candidates` table stores `first_name` / `last_name` as plain text columns (VERIFIED schema line 523-524), NOT localized JSONB. So locale fan-out applies ONLY to truly-localized JSONB fields (name/short_name/info on elections/constituencies/organizations/question_categories/questions, question choices, etc.).

**Localized field inventory (from schema grep):**
- `elections.name` (jsonb)
- `constituencies.name` (jsonb)
- `constituency_groups.name` (jsonb)
- `organizations.name`, `organizations.short_name`, `organizations.info` (jsonb)
- `candidates.name` (derived; `first_name` + `last_name` are plain text), `candidates.short_name`, `candidates.info` (jsonb) — INCLUDE these.
- `question_categories.name`, `info` (jsonb)
- `questions.name`, `info` (jsonb) + `choices[].label` (jsonb inside JSONB array)
- `nominations.name`, `info` (jsonb) — rarely used; may skip if not set.
- `alliances.name`, `short_name`, `info` (jsonb)
- `factions.name`, `short_name`, `info` (jsonb)

### 6. DX-03 Integration Test

**Location:** `packages/dev-seed/tests/integration/default-template.integration.test.ts`.

**Critical: NOT included in `yarn test:unit`.** Phase 56 Plan 09 already established `packages/dev-seed/tests/*.integration.test.ts` naming. The `vitest.config.ts` default pattern matches `*.test.ts`, which includes integration tests. Need to either:
- Rename to `*.integration.ts` (not matched by default) OR
- Skip via `describe.skipIf(!process.env.SUPABASE_URL)` OR
- Add a vitest include/exclude filter in a separate CI-only config.

Phase 58's chosen approach should match whatever Phase 57 used for `clustering.integration.test.ts` — VERIFIED that file is at `packages/dev-seed/tests/latent/clustering.integration.test.ts` and runs as part of `yarn test:unit` (it's included in the 220/220 test count). So "integration" is a naming convention, NOT an exclusion mechanism. Phase 58 needs a new path: guard with `describe.skipIf(!process.env.SUPABASE_URL)` OR place under `packages/dev-seed/tests/e2e/` with a separate vitest project config.

**Test shape:**
```typescript
describe.skipIf(!process.env.SUPABASE_URL)('default template integration', () => {
  it('applies to live Supabase within 10s producing expected row counts', async () => {
    // 1. Reset by calling seed:teardown first
    await runTeardown();

    // 2. Time the seed operation
    const start = Date.now();
    const result = await runPipelineAndWriter(defaultTemplate);
    const elapsed = Date.now() - start;

    // 3. Assert counts
    expect(elapsed).toBeLessThan(10_000);                    // NF-01
    expect(result.elections).toBe(1);
    expect(result.constituencies).toBe(13);
    expect(result.organizations).toBe(8);
    expect(result.candidates).toBe(100);
    expect(result.questions).toBe(24);
    expect(result.nominations).toBe(100);

    // 4. Assert relational wiring
    const { data: candidates } = await adminClient.from('candidates')
      .select('id, external_id, organization_id, image')
      .like('external_id', 'seed_%');
    expect(candidates?.length).toBe(100);
    expect(candidates!.every(c => c.organization_id !== null)).toBe(true);
    expect(candidates!.every(c => c.image?.path !== undefined)).toBe(true);

    // 5. Assert Storage bucket has 100 portrait objects
    const { data: files } = await adminClient.storage.from('public-assets')
      .list(`${TEST_PROJECT_ID}/candidates`, { limit: 200 });
    expect(files?.length).toBeGreaterThanOrEqual(100);

    // 6. Assert locale completeness
    const { data: elections } = await adminClient.from('elections')
      .select('name').eq('external_id', 'seed_election_default').single();
    expect(Object.keys(elections!.name as Record<string, unknown>).sort())
      .toEqual(['da', 'en', 'fi', 'sv']);
  });
});
```

### 7. Documentation (D-58-18)

- **`packages/dev-seed/README.md`** — full authoring guide: template shape, worked `fixed[]` + `count` example, flag reference, built-in list, custom-template loading instructions, environment setup, running the CLI.
- **Root `CLAUDE.md` Common Workflows section** — one block:
  ```markdown
  ### Seeding local data

  ```bash
  yarn dev:reset-with-data       # supabase db reset + default template
  yarn dev:seed --template e2e   # E2E test data for manual Playwright runs
  yarn dev:seed:teardown         # remove all seed_-prefixed rows
  ```

  See `packages/dev-seed/README.md` for authoring custom templates.
  ```
- **JSDoc on `Template` type** (`packages/dev-seed/src/template/types.ts`) — field-level docs so IDE hover reveals each knob.

## Known Pitfalls

### Pitfall 1: Locale fan-out order breaks determinism
**What goes wrong:** If locale fan-out iterates `Object.keys(faker_locales)` or re-orders fields via JSON serialize/parse, output differs per run even with same seed.
**Why it happens:** `Object.keys` preserves insertion order for string keys in practice, but `JSON.parse(JSON.stringify(...))` on objects with integer-like keys reorders. Locale-faker Map iteration order depends on insertion order — which depends on iteration order of the walker.
**How to avoid:** Hardcode `['en', 'fi', 'sv', 'da']` as the iteration array. Iterate rows in TOPO_ORDER (which is already frozen). Iterate row fields in a fixed alphabetical order before fan-out (`Object.keys(row).sort()` for walk, not assignment).
**Warning signs:** `determinism.test.ts` starts failing. Plan-checker should add a specific determinism test for locale fan-out in Phase 58.

### Pitfall 2: `candidates.image_id` vs `candidates.image`
**What goes wrong:** Plan/tests assume `candidates.image_id` (FK to a storage_objects or images table) when the schema actually has `candidates.image jsonb` storing `{ path, ... }`.
**Why it happens:** CONTEXT and REQUIREMENTS use both wordings interchangeably. The Phase 57 SUMMARY also references "`image_id`".
**How to avoid:** Fix all plan text to say `candidates.image` JSONB. Integration test asserts `c.image?.path !== undefined`, NOT `c.image_id !== null`. Plan-checker should call out the wording drift in every Phase 58 plan.
**Warning signs:** TS compile error `Property 'image_id' does not exist on type 'TablesInsert<'candidates'>'`.

### Pitfall 3: `await import()` on .ts fails outside tsx runtime
**What goes wrong:** A user invokes the CLI via `node src/cli/seed.ts` instead of `tsx src/cli/seed.ts` and gets `ERR_UNKNOWN_FILE_EXTENSION`.
**Why it happens:** Only tsx's ESM loader transforms `.ts` at import time.
**How to avoid:** `scripts.seed` in package.json hardcodes `tsx src/cli/seed.ts`. The CLI itself doesn't need to detect this — it assumes tsx. Integration test uses `yarn workspace @openvaa/dev-seed seed` (goes through package.json scripts), not a direct node invocation.
**Warning signs:** User asks "why doesn't `node src/cli/seed.ts` work" in DX-01 docs — clarify in README.

### Pitfall 4: Portrait alt text missing for WCAG 2.1 AA
**What goes wrong:** Seeded candidate portraits have no `alt` field in JSONB; screen readers on candidate detail pages read "image" or nothing.
**Why it happens:** Default shape is `{ path }` only — `parseStoredImage()` (storageUrl.ts:41-43) only propagates `alt` if present in stored JSONB.
**How to avoid:** Writer sets `alt: "${first_name} ${last_name}"` when building the image JSONB. CLAUDE.md requires WCAG AA — this is the cheap path.
**Warning signs:** Accessibility audit flags missing alt text on seeded candidate cards.

### Pitfall 5: pg_net async cleanup races teardown assertion
**What goes wrong:** `seed:teardown` runs `bulkDelete`, AFTER-DELETE trigger fires pg_net HTTP calls to Storage, RPC returns, test asserts "bucket is empty", but pg_net hasn't completed its calls yet (non-blocking).
**Why it happens:** `pg_net` is designed for async non-blocking HTTP. The trigger function returns before the HTTP response lands.
**How to avoid:** Make teardown CLI explicitly list + delete Storage objects (Path 2 from §3) in addition to trusting the trigger. Integration test waits 2-3 seconds OR explicitly cleans via Storage API.
**Warning signs:** Integration test flaky on CI; passes locally.

### Pitfall 6: `bulk_delete` doesn't allow accounts/projects/app_settings
**What goes wrong:** Teardown CLI includes `app_settings` in `bulkDelete` call; RPC throws `Unknown collection for deletion: app_settings`.
**Why it happens:** Schema line 2895 checks `NOT collection_name = ANY(allowed_collections)` — `allowed_collections` doesn't include them (they're bootstrap-owned per D-11).
**How to avoid:** Only include the 10 bulk-deletable tables in the teardown call. `app_settings` was merged (not inserted) by the writer — it's already idempotent, leave it. `accounts` / `projects` were never written by the seeder.
**Warning signs:** Teardown errors with unknown-collection message.

### Pitfall 7: thispersondoesnotexist.com licensing is ambiguous `[LOW]`
**What goes wrong:** Committing 30 AI-generated portraits from thispersondoesnotexist.com based on assumed "public domain" status may have licensing implications.
**Why it happens:** The site doesn't explicitly publish its output license; `[ASSUMED]` status.
**How to avoid:** Plan-check this with user. Alternative sources with explicit CC0 / Unsplash license work equally well. Web search found (Sources below) that licensing is legally ambiguous; project-specific guidance trumps.
**Warning signs:** User query at plan-check time.

### Pitfall 8: Portrait upload requires candidate UUIDs which `bulk_import` doesn't return inline
**What goes wrong:** Writer tries to upload to `${projectId}/candidates/${id}/...` but `bulk_import` returns only `{ created, updated }` counts, not the inserted rows' IDs.
**Why it happens:** `bulk_import` RPC returns aggregate counts (VERIFIED schema line 2796).
**How to avoid:** Writer does a separate `.from('candidates').select('id, external_id').like('external_id', 'seed_%')` read-back BEFORE uploading portraits. Adds one round-trip but is clearer than rewriting the RPC.
**Warning signs:** TS compile error that `candidate.id` is undefined on bulk_import result.

### Pitfall 9: e2e template must NOT break the 15 currently-passing Playwright specs
**What goes wrong:** Phase 59 switches `tests/seed-test-data.ts` to invoke the e2e template and 15 passing tests turn red because an external_id or field was dropped.
**Why it happens:** D-58-15 mandates "pure mechanical translation is REJECTED" — audit drives template content. Audit may miss a subtle implicit contract.
**How to avoid:** D-58-15 spec audit is deliverable-quality, not best-effort. Inventory doc in phase dir, grep-verified. Plan-checker reviews the audit doc against the specs before the e2e template is authored. Phase 58 integration test can ALSO run the Playwright suite against seeded data as a parity check (pre-Phase-59 signal).
**Warning signs:** Phase 59 parity check fails; specs that pass today fail with seeder data.

### Pitfall 10: Faker v8.4.1 locale objects vs v10 API drift
**What goes wrong:** Dev-seed source comments (e.g. `ctx.ts:83`) reference "`@faker-js/faker` v10 API surface" but installed version is `8.4.1`.
**Why it happens:** Phase 56 RESEARCH assumed v10; catalog pinned to `^8.4.1`.
**How to avoid:** Phase 58 uses v8 API (VERIFIED: `Faker` class, `new Faker({ locale: [en] })`, `faker.seed()` — all present in v8.4.1). No behavioral difference for the APIs Phase 58 uses. Plan should NOT "upgrade to v10" — that's a separate concern.
**Warning signs:** Dev-seed comments mention v10 — ignore; check `.yarnrc.yml` catalog for truth.

## Runtime State Inventory

Phase 58 is a greenfield CLI + templates addition, NOT a rename. The only "runtime state" concerns are the new assets to be committed (portraits) and the Storage objects created by seeding. No migration required.

## Code Examples

### CLI entry (from keygen.ts precedent)
```typescript
// [CITED: packages/dev-tools/src/keygen.ts:22-42 pattern]
import { parseArgs } from 'node:util';

const USAGE = `Usage: ...`;

const { values } = parseArgs({
  options: {
    template: { type: 'string', short: 't' },
    seed: { type: 'string' },
    help: { type: 'boolean', short: 'h' }
  },
  strict: true
});

if (values.help) {
  process.stdout.write(USAGE);
  process.exit(0);
}

try {
  // ... run seed
  process.exit(0);
} catch (err) {
  process.stderr.write(`Error: ${(err as Error).message}\n`);
  process.exit(1);
}
```

### Storage upload via service role (from supabaseDataWriter.ts precedent)
```typescript
// [VERIFIED: apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:321-328]
const storagePath = `${projectId}/candidates/${candidateId}/seed-portrait.jpg`;
const { error } = await this.client.storage
  .from('public-assets')
  .upload(storagePath, imageBytes, { contentType: 'image/jpeg', upsert: true });
if (error) throw new Error(`Image upload failed: ${error.message}`);
await this.client.from('candidates').update({ image: { path: storagePath, alt } }).eq('id', candidateId);
```

### Faker locale instance (from dev-seed ctx.ts precedent + verified probe)
```typescript
// [VERIFIED: node_modules/@faker-js/faker v8.4.1 exposes all four]
import { en, fi, sv, da, Faker } from '@faker-js/faker';

const fakerFi = new Faker({ locale: [fi, en] });
fakerFi.seed(42);
fakerFi.person.firstName();  // -> 'Pentti' (verified)
```

### zod schema extension (from Phase 56 schema.ts pattern)
```typescript
// [VERIFIED: packages/dev-seed/src/template/schema.ts:99-117]
export const TemplateSchema = z
  .object({
    // ...existing fields
    generateTranslationsForAllLocales: z.boolean().optional()
  })
  .extend({ latent: latentBlock.optional() });
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `vitest@^3.2.4` (catalog) |
| Config file | `packages/dev-seed/vitest.config.ts` (exists) |
| Quick run command | `yarn workspace @openvaa/dev-seed test:unit` |
| Full suite command | `yarn test:unit` (runs all workspace test:unit) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| GEN-09 | Candidates have image JSONB pointing at uploaded path | integration | `yarn workspace @openvaa/dev-seed test:unit tests/integration/default-template.integration.test.ts` | ❌ Wave 0 |
| GEN-10 | 30 portrait files exist in assets dir | unit | `yarn workspace @openvaa/dev-seed test:unit tests/assets.test.ts` | ❌ Wave 0 |
| TMPL-03 | `fixed[]` + `count` mix produces both | unit | Already covered by Phase 56 generator tests | ✅ |
| TMPL-04 | Default template row counts | integration | integration test | ❌ Wave 0 |
| TMPL-05 | E2E template matches spec audit contract | unit + manual | `yarn workspace @openvaa/dev-seed test:unit tests/templates/e2e.test.ts` + run subset of Playwright specs | ❌ Wave 0 |
| TMPL-06 | `--template <path>.ts/.js/.json` resolves | unit | `yarn workspace @openvaa/dev-seed test:unit tests/cli/resolve-template.test.ts` | ❌ Wave 0 |
| TMPL-07 | All 4 locales present on localized JSONB | integration | integration test | ❌ Wave 0 |
| CLI-01 | `seed --template default` exits 0 | integration (live Supabase) | `yarn workspace @openvaa/dev-seed seed --template default` | ❌ Wave 0 |
| CLI-02 | `yarn dev:reset-with-data` chains | manual smoke | Run command | manual |
| CLI-03 | `seed:teardown` removes seed_ rows only | integration | integration test (pre/post count) | ❌ Wave 0 |
| CLI-04 | `--help` lists flags + templates | unit | `yarn workspace @openvaa/dev-seed seed --help | grep ...` | ❌ Wave 0 |
| CLI-05 | Success summary format | unit | `yarn workspace @openvaa/dev-seed test:unit tests/cli/summary.test.ts` | ❌ Wave 0 |
| NF-04 | Deterministic output with locale fan-out | unit | extend `tests/determinism.test.ts` | ✅ (extend) |
| DX-01 | README exists with worked example | manual | grep for required sections in README | manual |
| DX-03 | Integration test runs against live Supabase | integration | integration test itself | ❌ Wave 0 |
| DX-04 | `CLAUDE.md` has Common Workflows section | manual | grep `CLAUDE.md` for `yarn dev:reset-with-data` | manual |

### Sampling Rate
- **Per task commit:** `yarn workspace @openvaa/dev-seed test:unit` (unit tests, skips integration via `describe.skipIf(!SUPABASE_URL)`)
- **Per wave merge:** `yarn test:unit` (repo-wide)
- **Phase gate:** Full suite green + integration test green against live `supabase start` before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `packages/dev-seed/tests/cli/resolve-template.test.ts` — TMPL-06 path-vs-name routing
- [ ] `packages/dev-seed/tests/cli/summary.test.ts` — CLI-05 formatting
- [ ] `packages/dev-seed/tests/cli/help.test.ts` — CLI-04 flag documentation
- [ ] `packages/dev-seed/tests/templates/default.test.ts` — TMPL-04 template shape
- [ ] `packages/dev-seed/tests/templates/e2e.test.ts` — TMPL-05 matches audit
- [ ] `packages/dev-seed/tests/assets.test.ts` — GEN-10 30 portraits present
- [ ] `packages/dev-seed/tests/integration/default-template.integration.test.ts` — DX-03 live round-trip (gated on SUPABASE_URL)
- [ ] Extend `packages/dev-seed/tests/determinism.test.ts` — locale fan-out determinism

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node 22 | CLI runtime | ✓ | v22.4.0 | — |
| Yarn 4 | workspace scripts | ✓ | 4.13.0 | — |
| Supabase CLI | `supabase db reset`, `supabase start` | ✓ (local) | v2.83.0 | Skip integration test in CI if unavailable |
| tsx | CLI script runner | ✓ | v4.19.2 | — |
| @faker-js/faker | seed RNG + locales | ✓ | 8.4.1 | — (NOT v10 as dev-seed comments suggest) |
| @supabase/supabase-js | service-role writes | ✓ | ^2.49.4 | — |
| Docker (for supabase start) | local Supabase | unknown in CI | — | Integration test SHOULD skip if `curl $SUPABASE_URL` fails |
| `thispersondoesnotexist.com` | one-off portrait fetch | ✓ at authoring time | — | User-supplied portraits via alternative CC0 source if licensing concerns arise |

**Missing dependencies with no fallback:** None. Phase 58 is a pure extension of existing infrastructure.

**Missing dependencies with fallback:** CI may lack Docker / Supabase CLI — integration test gates on `SUPABASE_URL` env var existence (`describe.skipIf(!process.env.SUPABASE_URL)`).

## Security Domain

Minimal attack surface — Phase 58 is dev tooling, not production. Still:

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | partial | Service-role key must be env-var, never committed (VERIFIED: Writer reads env at construction). |
| V3 Session Management | no | N/A — CLI is stateless. |
| V4 Access Control | yes | Service-role bypasses RLS for writes (intentional + documented). Teardown limited to `seed_` prefix (D-58-17 trusts the prefix as contract). |
| V5 Input Validation | yes | zod validates every template (schema TMPL-09). CLI args parsed via `node:util/parseArgs` `strict: true` — unknown flags rejected. Template file paths: see V12. |
| V6 Cryptography | no | N/A — no crypto in scope. |
| V12 Files & Resources | yes | `--template /absolute/path.ts` loads arbitrary code. This is **intentional** (TMPL-06) but risky — anyone who can set `--template` can execute arbitrary code. Mitigation: CLI runs with developer's local credentials (not elevated); documentation SHOULD warn against running untrusted template files. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Environment exposure (service-role key in logs) | Information disclosure | Writer never logs env vars; CLI summary doesn't include them. |
| Path traversal via `--template '../../../etc/passwd'` | Tampering | `path.resolve()` canonicalizes; `.json` parse will fail on non-JSON; `.ts`/`.js` import would fail on non-module but COULD execute code at import time. Mitigation: same as V12 — dev tool, trusted developer. |
| Storage-bucket filename collision with bootstrap paths | Tampering | `seed-portrait.jpg` filename is distinctive; unlikely to collide with existing production uploads. Bucket is local-only in dev. |
| Teardown wipes user-curated `seed_*` prefix rows | Data loss | Documented "trust the prefix" (D-58-17). User warned in README if they use `seed_` for manual data. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `thispersondoesnotexist.com` images are usable under a "public domain" basis | §4 Portraits + D-58-05 | Medium — licensing claim is legally ambiguous per web search. May need to switch to Pexels/Unsplash CC0 portraits. Impact: swap source, re-run maintainer script, re-commit 30 files. |
| A2 | Faker v8.4.1 generates stable person names across minor patch updates at same seed | §5 Locale fan-out | Low — locale packs are frozen data; seeding produces deterministic output at a pinned version. Risk only if catalog version bumps. |
| A3 | Portrait JPEG at ~200KB uploads in <30ms to local Supabase Storage | §4 Portraits + NF-01 | Low — local Supabase Storage is on localhost; no network latency. Sequential 100× upload ≈ 3s. |
| A4 | AFTER-DELETE trigger fires pg_net async cleanup within ~500ms on local Supabase | §3 Teardown | Medium — pg_net is async and latency isn't bounded. Recommend Path 2 (explicit list+delete) as primary, not fallback. Planner should verify during integration test. |
| A5 | tsx resolves `await import('/path/to/template.ts')` at runtime outside the package boundary | §1 Template resolution | Low — tsx ESM loader hooks any `.ts` import. Integration test covers this by loading a template from an absolute path. |
| A6 | Phase 56 unit test suite remains green when the writer grows a portrait-upload pass (that test injects a mocked Supabase client) | §4 Portraits | Low — writer tests already mock `SupabaseAdminClient`; adding `uploadPortraits` method won't affect the mock's response unless tests assert on call count. |
| A7 | 24 questions across the planner-chosen type mix still drive visible clustering via the Phase 57 latent emitter | §2 Templates | Low — Phase 57 clustering ratio at 0.0713 on 12 Likert questions had ~7× headroom. 24 questions (mostly Likert) expands the signal. |
| A8 | D-58-02's 13 constituencies + 100 candidates + 24 questions × 4 locales fit under 10s budget | §6 Integration test | Medium — 100 candidates × 24 answers = 2400 answer JSONB entries; `importAnswers` does N `.from('candidates').update(...)` calls (VERIFIED at `supabaseAdminClient.ts:273`). Serial = 100 round-trips ≈ 2-4s on localhost. Parallelize if tight. |

If any assumption is confirmed wrong during plan-check or execution, planner addresses via listed mitigation.

## Open Questions (RESOLVED)

1. **thispersondoesnotexist.com licensing.** The site doesn't publish an explicit license. Web search confirms legal ambiguity around AI-generated portrait rights. Should Phase 58 switch to a clearly-licensed source (Pexels CC0 portraits, UIFaces open-source, Unsplash permissive) before committing 30 images?
   - What we know: D-58-05 locks thispersondoesnotexist.com; user committed to it in the discussion log.
   - What's unclear: legal posture for distribution (commit 30 images to a public repo).
   - Recommendation: Flag to user during plan-check. If switching, swap sources but keep 30 count + same directory layout. If keeping, add prominent LICENSE.md that explains the ambiguous basis. MVP-worthy caveat.
   - **RESOLVED:** Keep D-58-05 (thispersondoesnotexist.com) and ship an honest `LICENSE.md` documenting the ambiguous legal basis — adopted in Plan 02 (assets download + LICENSE.md commit).

2. **How to enforce non-uniform candidate-to-party distribution `[20, 18, 15, 12, 10, 10, 8, 7]` given Phase 56's CandidatesGenerator uses round-robin `i % orgCount`?** Two options: (a) `candidates` override function in the template; (b) extend CandidatesGenerator. Option (a) is cleaner (localized to Phase 58 default template) but requires the override to read ctx.refs.organizations.
   - What we know: D-25 override signature is `(fragment, ctx) => Rows[]`.
   - What's unclear: Whether to hard-code the 8-party weighting in the default template (less reusable) or add a template-level distribution config (more work).
   - Recommendation: Start with (a) — inline override in `default.ts`. Revisit if a second template needs similar weighting.
   - **RESOLVED:** Adopted option (a) — inline `candidatesOverride` in Plan 06 (`packages/dev-seed/src/templates/defaults/candidates-override.ts`) via D-25 Overrides signature; PARTY_WEIGHTS = [20, 18, 15, 12, 10, 10, 8, 7].

3. **Should the E2E template audit happen BEFORE plans are authored, or as the first plan in Phase 58?** D-58-15 mandates the audit; the Phase 58 inventory doc is the audit's deliverable. If it's plan-1, plans 2-N consume its output; if it's pre-plan, plans can be authored in parallel.
   - What we know: Phase is in-scope for the planning chain.
   - What's unclear: timing.
   - Recommendation: Treat the audit as Plan 01 of Phase 58 — gate the e2e template authoring on its completion.
   - **RESOLVED:** Adopted — Plan 01 is the E2E audit (Wave 1), gating the e2e template authoring (Plan 08) in a later wave.

4. **Locale fan-out: generate locale-specific faker names for non-JSONB fields too (candidate `first_name`/`last_name`)?** These are plain-text columns, so fan-out is structurally impossible (one row has one `first_name`). But the NAME should reflect the default locale (`en`) OR cycle locales per candidate for variety.
   - What we know: `candidates.first_name` and `last_name` are `text NOT NULL` (VERIFIED schema line 523-524).
   - What's unclear: Whether to cycle faker locales per candidate for a visually-diverse set (25 Finnish + 25 Swedish + 25 Danish + 25 English names) or keep single-locale English.
   - Recommendation: Cycle locales per candidate — adds visual variety to match the 4-locale theme. 25 candidates per locale group — planner picks.
   - **RESOLVED:** Adopted — 25 candidates per locale block (25 en + 25 fi + 25 sv + 25 da = 100) via per-locale Faker instances in Plan 06's `candidatesOverride` (LOCALE_BLOCK_SIZE = 25).

## Sources

### Primary (HIGH confidence — verified in-repo)
- `packages/dev-seed/src/*.ts` (pipeline, writer, ctx, supabaseAdminClient, generators, template/schema, template/types, emitters/latent/*) — reviewed in full.
- `packages/dev-seed/package.json` + `vitest.config.ts` + `tests/utils.ts` + `tests/determinism.test.ts` — reviewed.
- `packages/dev-tools/src/keygen.ts` + `package.json` — CLI precedent reviewed.
- `apps/supabase/supabase/migrations/00001_initial_schema.sql` lines 480-540 (candidates/organizations/factions schemas), 1860-2300 (storage config + RLS + cleanup triggers), 2735-2930 (bulk_import + bulk_delete RPCs) — reviewed.
- `apps/supabase/supabase/seed.sql` — full file reviewed (bootstrap contents).
- `apps/supabase/supabase/config.toml` lines 109-130 — bucket configuration reviewed.
- `apps/frontend/src/lib/api/adapters/supabase/utils/storageUrl.ts` — image JSONB shape canonical.
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:300-349` — existing candidate image upload pattern.
- `packages/app-shared/src/settings/staticSettings.ts:46-64` — supportedLocales definition.
- `packages/app-shared/src/data/localized.type.ts` — LocalizedString shape.
- `tests/seed-test-data.ts` + `tests/tests/specs/**/*.spec.ts` grep output — E2E audit input.
- `tests/tests/utils/testIds.ts` — testId canonical map.
- `.planning/phases/58-templates-cli-default-dataset/58-CONTEXT.md` + `58-DISCUSSION-LOG.md` — user decisions.
- `.planning/REQUIREMENTS.md` — 16 requirement IDs cross-referenced.
- `.planning/ROADMAP.md` — Phase 58 success criteria.
- `.planning/phases/57-latent-factor-answer-model/57-07-SUMMARY.md` — Phase 57 completion state.
- `.yarnrc.yml` catalog — dependency versions.

### Secondary (MEDIUM confidence — probed directly)
- `@faker-js/faker@8.4.1` locale support — VERIFIED by running `node -e "..."` probes for Finnish, Swedish, Danish name generation.
- `supabase --version` via `node_modules/.bin/supabase` → 2.83.0. `supabase db reset --help` → flag reference.
- `tsx --version` → v4.19.2.

### Tertiary (LOW confidence — web search, flagged `[ASSUMED]`)
- `thispersondoesnotexist.com` licensing status — [Quora thread on commercial use](https://www.quora.com/Can-I-use-the-faces-generated-by-thispersondoesnotexist-for-my-personal-use-Are-they-protected-or-copyrighted-in-any-way) + [Hacker News public-domain 2026 discussion](https://news.ycombinator.com/item?id=46451697) + [GitHub bytesleo/thispersondoesnotexist-js LICENSE](https://github.com/bytesleo/thispersondoesnotexist-js/blob/master/LICENSE). Verdict: legally ambiguous; users should apply their own risk assessment.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all deps already in the workspace, versions VERIFIED in catalog + installed `node_modules`.
- Architecture: HIGH — extends existing Phase 56/57 shape with ~6 new files, no re-design.
- Schema surface: HIGH — migration + RPC + trigger behaviors VERIFIED by direct SQL reading.
- Portrait sourcing: MEDIUM — mechanics HIGH, licensing LOW.
- E2E template fidelity: MEDIUM — Phase 58 delivers the audit; Phase 59 proves fidelity against Playwright.
- CLI ergonomics: HIGH — `parseArgs` precedent + 4 flags is a trivial surface.
- Locale fan-out determinism: MEDIUM — needs careful iteration-order discipline, documented in Pitfalls #1.

**Research date:** 2026-04-23
**Valid until:** 30 days (stable schema, stable dep graph, Phase 57 shipped).
