# Phase 58: Templates, CLI & Default Dataset - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship the user-facing surface of `@openvaa/dev-seed`:

- Built-in `default` template — a runnable, realistic Finnish-cultural-flavored
  election dataset with portraits, locale-complete content, and latent-model
  candidate answers
- Built-in `e2e` template — derived from a Playwright-spec testId audit,
  matching the contracts the existing specs depend on
- CLI surface on `@openvaa/dev-seed` (`seed`, `seed:teardown`) + root
  aliases (`dev:seed`, `dev:seed:teardown`, `dev:reset-with-data`)
- Portrait seeding (GEN-09/10): 30 public-domain portraits checked into
  `packages/dev-seed/src/assets/portraits/`, uploaded to Supabase Storage
  on seed and reclaimed on teardown
- `generateTranslationsForAllLocales` wiring (TMPL-07) honoring
  `staticSettings.supportedLocales` (en/fi/sv/da)
- DX-01 authoring docs + DX-03 integration test + DX-04 CLAUDE.md
  Common-Workflows entry

Explicitly **out of scope** (later phases / deferred):
- Rewriting `tests/seed-test-data.ts` on the new generator → Phase 59
- Deleting legacy JSON fixtures → Phase 59
- Apps/docs site page for dev-seed template authoring → deferred,
  future housekeeping milestone

**Carried forward (no re-asking):**
- Phase 56 `56-CONTEXT.md` — D-01/D-28 package shape, D-02 `dev:foo`
  root-script namespace, D-09 reuse existing `bulk_import`/`bulk_delete`,
  D-15 writer-level env-var enforcement (`SUPABASE_URL` /
  `SUPABASE_SERVICE_ROLE_KEY`), D-18 schema-extension pattern,
  D-24 split admin client (dev-seed base + tests/ shell).
- Phase 57 `57-CONTEXT.md` — the latent-factor emitter wired via
  `ctx.answerEmitter` is the default behavior for synthetic candidates
  in the `default` template (clustering + correlations "just work"
  on `yarn dev:reset-with-data` runs).
- Milestone STATE.md — scope boundary (non-system public tables only),
  10s seed budget (NF-01), service-role writes only, portraits carved
  out via GEN-09/10.
- `staticSettings.supportedLocales = ['en', 'fi', 'sv', 'da']` (from
  `packages/app-shared/src/settings/staticSettings.ts`). TMPL-07's
  `generateTranslationsForAllLocales: true` emits translations for all
  four.

</domain>

<decisions>
## Implementation Decisions

### Default Template — Content
- **D-58-01:** **8 invented parties with Finnish-cultural flavor** — names
  evocative of Finnish political parties without using real ones. Examples
  (planner's call on exact names):
  `Kokoomustaiset`-style → Blue Coalition; `Vihreät`-style → Green Wing;
  `SDP`-style → Social Democrats Union; `Keskusta`-style → Rural
  Alliance; `Perussuomalaiset`-style → People's Movement; `Vasemmisto`-style →
  Red Front; `RKP`-style → Coastal Party; `KD`-style → Values Coalition.
  No real party name, no encoded real-world political positions —
  parties are labels + colors + latent centroids.
- **D-58-02:** Entity counts in the default template:
  - 13 constituencies (mirrors Finnish Eduskunta district count)
  - 8 parties (per D-58-01)
  - **100 candidates, non-uniformly distributed across parties** —
    larger parties have more candidates (e.g. weighted roughly
    `[20, 18, 15, 12, 10, 10, 8, 7]` or whatever planner settles on;
    the shape is "non-uniform, realistic-looking" not a fixed quota)
  - 24 questions across 4 categories
  - 1 election, 1 constituency group that contains all 13 constituencies
- **D-58-03:** Question-type mix in the default template:
  - **Majority ordinal Likert** (exercises Phase 57's latent model directly)
  - **Some categorical** (exercises per-choice loadings from D-57-09)
  - **Some multi-choice** (exercises threshold logic)
  - **1 boolean** (exercises the boolean fallback path)
  - **No `number`, `text`, `date`, `image`, or `multipleText` questions** —
    those types fall back to `defaultRandomValidEmit` (D-57-10) and add
    no clustering signal; keeping them out of the default template
    focuses the first-run visual impression on the latent model.
  Exact split (e.g. 18 Likert / 4 categorical / 1 multi-choice / 1 boolean
  for 24 total) is planner's call, respecting the "majority Likert,
  everything else a taste" spirit.
- **D-58-04:** **`generateTranslationsForAllLocales: true` in the default
  template** — first-run developers see the app in all four locales
  (en/fi/sv/da). Latent model and content are locale-agnostic; only
  localized string fields (question text, party names, constituency
  names, etc.) expand 4× in JSONB. Must still fit the NF-01 <10s budget —
  the planner's integration test validates this.

### Portraits (GEN-09/10)
- **D-58-05:** **30 portraits** pre-downloaded from
  `thispersondoesnotexist.com` (AI-generated, public domain), checked
  into `packages/dev-seed/src/assets/portraits/`. Total pool of 30
  covers 100 candidates with ~3.3 reuses per face — visually sparse
  enough that no single portrait dominates a constituency. Licensing
  note in the package README: public domain, no attribution required.
  Plan includes a one-off fetch script that the maintainer runs locally
  to produce the batch; the fetched images are committed.
- **D-58-06:** Portrait upload goes **via the existing service-role
  Supabase client to the `public-assets` bucket**, keyed as
  `candidates/{external_id}.jpg` (or whatever naming the planner picks
  that encodes the external_id prefix). After bulk_import completes for
  `candidates`, the writer iterates generator-emitted rows, uploads the
  cycled portrait, and updates `candidates.image_id` with the resulting
  file reference. Matches how production candidate portraits flow and
  aligns with D-09's reuse-existing-infra philosophy.
- **D-58-07:** **Teardown tries the trigger-based path first; falls back
  to explicit prefix deletion if the trigger doesn't cascade cleanly.**
  Schema already has a file-cleanup trigger on candidate delete (from
  the schema migration); `seed:teardown`'s candidate-row `bulk_delete`
  should cascade to Storage objects automatically. Phase 58 first tries
  deletion with trigger-only cleanup, checks for orphaned files in the
  bucket afterward, and if orphans are found, adds an explicit
  list-and-delete step filtering on the `${externalIdPrefix}*` key prefix.
  Planner verifies during implementation which path is needed; ship
  whichever actually works.

### CLI Surface (CLI-01, CLI-02, CLI-03, CLI-04, CLI-05)
- **D-58-08:** Command names + locations:
  - On `@openvaa/dev-seed`: `seed`, `seed:teardown`
  - Root aliases (per D-02 `dev:foo` namespace): **`dev:seed`,
    `dev:seed:teardown`, `dev:reset-with-data`** — all three bubble up
    so developers never have to type `yarn workspace @openvaa/dev-seed ...`
    for common operations.
- **D-58-09:** `--template` argument resolution: **name-first, path-
  fallback**. Resolution algorithm:
  1. If argument starts with `./`, `/`, or `../` → treat as filesystem path
  2. If argument ends in `.ts`, `.js`, or `.json` → treat as filesystem path
  3. Otherwise → look up as a built-in template name
  4. If built-in lookup fails, error lists built-ins and suggests path form
- **D-58-10:** Loader for template files:
  - `.ts` / `.js` — `await import(path)` (tsx handles .ts transform at
    runtime per D-28)
  - `.json` — `JSON.parse(await fs.readFile(path, 'utf8'))` with a
    validation pass through the zod schema before use
  - No new catalog dep (no `jiti` or equivalent) per Phase 56 constraint
- **D-58-11:** `dev:reset-with-data` composition: **`yarn supabase:reset
  && yarn dev:seed --template default`** — two-step chain. Reset invokes
  Supabase CLI's reset (which runs migrations + seed.sql bootstrap),
  then the generator layers the default template on top. No new shell
  script; pure package.json scripts composition.
- **D-58-12:** CLI error handling is **structured, fail-fast,
  actionable**:
  - Missing env → `Error: SUPABASE_URL not set. Run 'supabase start' first, or export SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.` (exit 1)
  - Supabase unreachable → `Error: Cannot reach Supabase at ${url}. Is 'supabase start' running?` (exit 1)
  - Template not found → lists available built-ins + suggests path form
  - Template validation fails → prints zod error with field path (per
    Phase 56 D-16)
- **D-58-13:** `--help` output lists: every flag with default + description,
  every built-in template with 1-line description, link (path) to the
  worked custom-template example in the package README.
- **D-58-14:** Success summary (CLI-05) prints:
  - Template applied (name or resolved path)
  - Rows created per entity (aligned table)
  - Portraits uploaded (count)
  - Elapsed time (e.g. "Completed in 6.2s")
  Output goes to stdout; designed to be readable but not machine-parsed
  (no JSON mode in Phase 58 — see deferred).

### `e2e` Built-in Template (TMPL-05)
- **D-58-15:** Authored by **auditing all Playwright spec files** in
  `tests/tests/` and collecting:
  - Every `data-testid` the specs assert against
  - Every candidate name / party name / constituency name the specs
    expect to exist
  - Every question id / question text referenced
  - Relational contracts (which candidate belongs to which party in
    which constituency)
  The e2e template is then hand-written as a declarative config where
  each of those entities appears in `fixed[]` arrays, preserving the
  contracts verbatim. Pure mechanical translation of the JSON fixtures
  is REJECTED (see deferred) — the audit catches hidden assumptions
  baked into the current fixtures that the new template should NOT
  inherit.
- **D-58-16:** `generateTranslationsForAllLocales` is **`false` in the
  e2e template** — Playwright specs run against a single locale and
  the 4× JSONB payload is pure overhead for them. Overridable if a
  spec ever needs multi-locale data.

### Teardown Safety (CLI-03)
- **D-58-17:** Teardown is **permissive** on the prefix check — delete
  every row whose `external_id` starts with the configured
  `externalIdPrefix` (default `seed_`). No shape verification, no
  "is this really generator-emitted" check. Trusts the prefix as the
  contract per GEN-04. A user who mixes manual data with the same
  prefix gets what they asked for. Aligns with Phase 56 D-12's
  "lean on existing infra" philosophy and keeps the teardown path
  simple.

### Documentation (DX-01, DX-04)
- **D-58-18:** Three doc homes:
  1. **`packages/dev-seed/README.md`** — full template-authoring guide,
     worked example (mixing `fixed[]` + `count`), flag reference, list
     of built-in templates
  2. **`CLAUDE.md` "Common Workflows" section** — short snippet covering
     `yarn dev:reset-with-data` + the `seed --template <path>` entry
     point, pointing to the package README for depth
  3. **Inline JSDoc on the `Template` TypeScript type** (in
     `packages/dev-seed/src/template/types.ts`) — field-level docs so
     IDE hover reveals what each knob does
- **D-58-19:** `apps/docs/` (the SvelteKit docs site) is NOT updated in
  Phase 58 — deferred to a future housekeeping milestone (see deferred).
  The project docs site is separately-shipped and the dev-seed content
  is not user-facing product documentation; the package README is the
  canonical contributor-facing home.

### DX-03 Integration Test
- **D-58-20:** Apply the default template against a live local Supabase
  (`supabase start` in the CI job), assert:
  - All 16 non-system public tables have expected row counts (allowing
    the "~" wiggle room from D-58-02)
  - Relational wiring: every candidate has a valid `organization_id`
    (or NULL for independents if any), every nomination has valid
    `candidate_id` × `election_id` × `constituency_id`
  - Portraits uploaded: 100 candidates have non-NULL `image_id`, and
    Storage bucket contains 100 objects under the configured prefix
    (regardless of pool size, each candidate gets one)
  - Elapsed time <= 10s (NF-01 gate)
  - Locale JSONB contains keys for all 4 supported locales (TMPL-07)
- **D-58-21:** This test lives in `packages/dev-seed/tests/` (or
  `packages/dev-seed/src/*.integration.test.ts` — planner's call) and
  is NOT included in `yarn test:unit`. It runs in CI as a separate
  step that depends on `supabase start` being up (add a new CI job
  or piggyback on the existing E2E job's Supabase setup).

### Claude's Discretion
- Exact party names for the 8 invented parties (respecting D-58-01
  "Finnish flavor, no real names").
- Exact non-uniform distribution weights across parties (e.g.
  `[20, 18, 15, 12, 10, 10, 8, 7]` vs some other weighting that sums to
  100).
- Exact split of question types across the 24 questions (planner picks
  the ratio respecting D-58-03's "majority Likert" spirit).
- Exact filename for `dev:reset-with-data` target in root `package.json`
  — but the name itself is locked per D-58-08.
- Storage object key pattern (`candidates/{external_id}.jpg` vs
  `seed/candidates/{external_id}.jpg` vs other) — as long as the prefix
  is deterministic and `seed:teardown` can filter on it.
- Location of the one-off `download-portraits.ts` maintainer script
  (e.g. `packages/dev-seed/scripts/` vs top-level).
- Whether the e2e-template audit happens first as a separate inventory
  doc checked into the phase dir, or is baked into planning work
  inline.

### Folded Todos
None — milestone-internal scope; no cross-phase todos expected.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone & Prior Phase Context
- `.planning/ROADMAP.md` §"Phase 58: Templates, CLI & Default Dataset" —
  goal, 6 success criteria
- `.planning/REQUIREMENTS.md` — GEN-09, GEN-10, TMPL-03, TMPL-04, TMPL-05,
  TMPL-06, TMPL-07, CLI-01, CLI-02, CLI-03, CLI-04, CLI-05, NF-04,
  DX-01, DX-03, DX-04
- `.planning/phases/56-generator-foundations-plumbing/56-CONTEXT.md` —
  load-bearing for D-01/D-28 package shape, D-02 `dev:foo` namespace,
  D-09 bulk_import reuse, D-15 env enforcement, D-18 schema extension
- `.planning/phases/57-latent-factor-answer-model/57-CONTEXT.md` — the
  latent emitter is the default behavior the `default` template relies on

### Phase 56 Foundations (touch-points for Phase 58)
- `packages/dev-seed/src/writer.ts` — env enforcement, bulk_import wiring
  (extend with portrait-upload step for candidates post-insert)
- `packages/dev-seed/src/pipeline.ts` — entry-point pipeline (extend with
  CLI adapter + `latent` emitter wiring)
- `packages/dev-seed/src/template/schema.ts` — zod schema that Phase 58
  extends with `generateTranslationsForAllLocales`, portrait-config
  fields if needed, and the `default`/`e2e` template definitions
- `packages/dev-seed/src/template/types.ts` — `Template` type; gets
  JSDoc additions per D-58-18
- `packages/dev-seed/src/index.ts` — public re-exports (add CLI entry
  point, built-in templates)
- `packages/dev-seed/package.json` — add `bin` for CLI invocation,
  `scripts.seed`, `scripts['seed:teardown']`

### Frontend & Settings
- `packages/app-shared/src/settings/staticSettings.ts` §`supportedLocales`
  — ['en', 'fi', 'sv', 'da']; TMPL-07's `true` default honors all four
- `packages/app-shared/src/settings/staticSettings.ts` §theme colors /
  brand colors — party colors in the default template should pull from
  or align with the existing palette (planner picks)

### Supabase Schema (existing surfaces Phase 58 uses)
- `apps/supabase/supabase/migrations/00001_initial_schema.sql`
  §`candidates.image_id` column — target field for portrait upload
- `apps/supabase/supabase/migrations/00001_initial_schema.sql`
  §storage.objects RLS policies on `public-assets` — portraits upload
  via service-role client, so the policies aren't blocking, but the
  bucket name is load-bearing
- `apps/supabase/supabase/migrations/00001_initial_schema.sql`
  §`storage_config` + cleanup trigger on candidate delete — D-58-07
  teardown path verification
- `apps/supabase/supabase/seed.sql` — bootstrap rows the generator
  layers on top (accounts, projects, app_settings, storage_config);
  teardown MUST leave these intact

### Existing Fixtures (reference for D-58-15 audit)
- `tests/tests/data/default-dataset.json` (1 election, 1 const group,
  1 constituency, 3 categories, 12 questions, 2 organizations, 5
  candidates, 7 nominations)
- `tests/tests/data/voter-dataset.json`
- `tests/tests/data/candidate-addendum.json`
- `tests/tests/data/overlays/` — variant overlays; audit for testId
  dependencies
- `tests/tests/data/assets/` — reference media (test-poster.jpg,
  test-video.mp4, etc.) — not to be mistaken for candidate portraits
- `tests/seed-test-data.ts` (88 lines) — reads fixtures + calls
  SupabaseAdminClient; Phase 59 rewrites this, but Phase 58 reads it
  to understand what the `e2e` template must produce

### Playwright Spec Audit Targets (D-58-15)
- `tests/tests/*.spec.ts` (or similar path — planner confirms) — every
  spec file contributes testId requirements to the e2e template audit

### External Portrait Source
- `https://thispersondoesnotexist.com/` — public-domain AI portrait
  source (D-58-05). One-off fetch script produces 30 images committed
  to `packages/dev-seed/src/assets/portraits/`.

### Root Scripts + Package Plumbing
- Root `package.json` — existing `dev:start`, `dev:stop`, `dev:reset`,
  `dev:status`, `supabase:*` scripts are the pattern Phase 58 follows
  for `dev:seed`, `dev:seed:teardown`, `dev:reset-with-data`
- Root `CLAUDE.md` — §"Common Workflows" gets the DX-04 snippet per
  D-58-18

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Phase 56 generator + writer + pipeline** already produce valid rows
  for every non-system public table; Phase 58's `default` template is
  fundamentally "call the pipeline with carefully-chosen fragment
  counts + `fixed[]` arrays" — no new generator code required.
- **Phase 57 latent emitter** is already wired via
  `ctx.answerEmitter`; Phase 58's default template doesn't override it
  and gets clustered answers for free.
- **`SupabaseAdminClient` base in dev-seed** (from D-24) — portrait
  upload uses the same service-role client. Existing method(s) for
  Storage upload may need adding if not yet present; verify
  `supabase-js` Storage API surface is accessible via the existing base.
- **Existing `storage_config` cleanup trigger** — D-58-07's primary
  teardown path relies on this; schema already wires it.
- **Root `package.json` script namespace** (`dev:*`, `supabase:*`) —
  Phase 58 extends the pattern; no invention.
- **`zod` in catalog** — schema extension + JSON template validation
  per D-58-10 step 2.

### Established Patterns
- **Fragment passthrough for `fixed[]` rows** — Phase 56 generators
  already handle the mixed `{ count, fixed }` shape. The default +
  e2e templates rely on this without new code.
- **`external_id` prefix** — locked at ctx build time; teardown uses
  the same prefix for filtering (GEN-04 + CLI-03).
- **tsx-first runtime** — the CLI is a tsx script; no build step.
- **Workspace scripts as root aliases** — `dev:start` already wraps
  `yarn build && yarn supabase:start && yarn workspace @openvaa/frontend dev`.
  D-58-08's root aliases follow the same template.

### Integration Points
- **Root `package.json`**: add three new scripts per D-58-08.
- **`packages/dev-seed/package.json`**: add `bin` entry for CLI,
  `scripts.seed`, `scripts['seed:teardown']`.
- **`packages/dev-seed/src/assets/portraits/`**: new directory,
  30 committed files.
- **`packages/dev-seed/src/templates/default.ts`**: new file, the
  built-in default template.
- **`packages/dev-seed/src/templates/e2e.ts`**: new file, the built-in
  e2e template (authored after audit per D-58-15).
- **`packages/dev-seed/src/cli.ts`** (or similar): new entry point
  referenced by `bin`.
- **`CLAUDE.md`** (root): one snippet added to Common Workflows per
  D-58-18.
- **CI** (`.github/workflows/` or similar): DX-03 integration test
  needs a job that runs `supabase start`; either a new step or
  piggyback on existing E2E setup — planner confirms CI layout.

</code_context>

<specifics>
## Specific Ideas

- **Non-uniform party distribution for 100 candidates** — realistic
  feel. Example weighting: `[20, 18, 15, 12, 10, 10, 8, 7]` sums to
  100. Planner may tune but the _shape_ (sorted descending, no two
  parties identical, tail party < 10% of largest) is the important part.
- **Party color palette** — pulls from `staticSettings.ts` or adds new
  brand-aligned colors. 8 distinct hues; no two should be close enough
  to confuse in the political compass 2D scatter.
- **Latent centroids for the default template** — auto-generated via
  Phase 57's farthest-point sampler per D-57-03; no explicit template
  overrides. Let the algorithm place them.
- **Portrait fetch script** is a one-off maintainer tool — not part of
  the runtime seed flow. Committed next to the assets; a comment at
  the top notes "run this once to refresh the pool; pool is checked
  in, not fetched per seed".
- **Storage upload failure is a seed-blocking error**, not a warning —
  if portraits can't upload, the run aborts (exit 1). Consumer can
  rerun after fixing Storage.
- **Playwright spec audit (D-58-15) is load-bearing** — this is the
  one place Phase 58 cannot ship on "reasonable defaults" alone;
  the concrete testId list drives the e2e template's `fixed[]` content.
  Plan a dedicated audit sub-task with an inventory doc as output.
- **CLAUDE.md Common Workflows entry** — add under "Starting a new
  feature" or create a new "Seeding local data" sub-section:
  `yarn dev:reset-with-data` (one-liner); pointer to package README
  for authoring custom templates.
- **e2e template translations OFF (D-58-16)** — Playwright specs
  generally test a single locale; the 4× expansion is pure overhead
  for them. If a spec needs multi-locale, override via a variant
  template in Phase 59.
- **DX-03 test runs against `yarn supabase:start` locally** — same
  Supabase surface production uses. No separate test-DB configuration.

</specifics>

<deferred>
## Deferred Ideas

- **`apps/docs/` site update for dev-seed template authoring** —
  deferred to a future housekeeping milestone. The SvelteKit docs site
  is shipped separately and the dev-seed surface is
  contributor-facing, not product-facing. Package README is the
  canonical home until the docs-site gets its next broad update.
- **JSON output mode for CLI (`--output json`)** — CI/machine-readable
  output deferred; the human-readable summary (D-58-14) covers the
  Phase 58 need.
- **`--dry-run` flag for `seed:teardown`** — useful for one-off
  verification but not required for normal ops; add only if real
  usage surfaces demand.
- **Mechanical port of JSON fixtures to e2e template** — rejected
  (D-58-15). The Playwright spec audit is the right source of truth
  for what the e2e template must contain.
- **Strict shape-check teardown** — rejected (D-58-17). Trust the
  prefix as the contract; users who mix manual + generated data with
  the same prefix are on the hook.
- **Non-portrait media seeding** — out of scope per milestone
  REQUIREMENTS.md (only candidate portraits carved out via GEN-09).
  Revisit only if a future phase needs party logos, campaign media,
  etc.
- **Storage-upload retries / idempotency** — Phase 58 treats upload
  failure as fatal (Specifics). Idempotent re-upload (e.g.
  skip-if-exists) deferred; not in success criteria.
- **`Template` editor UI / generator** — explicitly Out of Scope in
  REQUIREMENTS.md "Out of Scope" section.

</deferred>

---

*Phase: 58-templates-cli-default-dataset*
*Context gathered: 2026-04-22*
