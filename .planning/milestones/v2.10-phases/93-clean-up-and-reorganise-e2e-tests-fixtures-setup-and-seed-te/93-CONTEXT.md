# Phase 93: Clean up and reorganise E2E tests, fixtures, setup, and seed templates - Context

**Gathered:** 2026-06-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Reorganise the existing E2E suite and seed templates into a clear, **role-based** structure (voter / candidate / shared / perm) so the layout is self-documenting, and consolidate seed templates under a single `e2e/` family. This is a **structural / rename / relocation** phase — it moves and renames existing assets and rewires the wiring that references them. It does **NOT** add new test coverage or new specs (that is out of scope and belongs in other phases).

Five workstreams from ROADMAP.md §"Phase 93":
1. **Fixtures** — relocate fixtures into `shared/` / `voter/`; keep `views` separate (it IS used elsewhere); extract `minimalVoterResultsPage` from the voter journey fixture.
2. **Setup** — reorganise `tests/setup/` into `voter/*`, `candidate/*`, `shared/*`, `perm/*`.
3. **Test renames** — remove **all** mentions of "mega"; rename journeys to `voter-journey` / `candidate-journey`.
4. **A11y spec** — rewrite the a11y spec to seed from the base dataset (formerly `baseV1`) instead of the old `e2e` dataset.
5. **Seed templates** — organise into `e2e/perm/*` + `e2e/base.ts`; delete the old `e2e.ts` and replace it with `baseV1`'s content renamed to `e2e/base`.

**Invariant:** the full suite (and `lint:check` / typecheck) must stay green at every commit. Every rename must be applied transitively to ALL references (imports, playwright project keys + `testMatch` regexes, dev-seed `resolve-template`, docs, `external_id` prefixes, freshness-guard allowlist).

</domain>

<decisions>
## Implementation Decisions

### Seed `e2e/` restructure (Workstream 5 + a11y)
- **D-01:** **Invocable template name = `e2e/base`.** `baseV1`'s content moves to `packages/dev-seed/src/templates/e2e/base.ts`; the old `e2e.ts` content is deleted. `resolve-template.ts` maps `e2e/base` → `e2e/base.ts`. The old bare `e2e` template name is **retired** (not kept as an alias). Update every consumer of `--template e2e`: `tests/README.md`, `tests/seed-test-data.ts`, `packages/dev-seed/src/cli/resolve-template.ts`, `CLAUDE.md` doc references, and `packages/dev-seed/src/templates/index.ts`.
- **D-02:** Permutation templates move under `packages/dev-seed/src/templates/e2e/perm/*` (from today's `templates/permutations/*`). Layout becomes `e2e/base.ts` + `e2e/perm/*` (+ shared helper). Update the templates barrel + `resolve-template` mappings.
- **D-03:** **Retarget the dev-seed template tests** `packages/dev-seed/tests/templates/e2e.test.ts` + `e2e-app-settings.test.ts` to assert the **new** base dataset (formerly `baseV1`) and rename the files accordingly (e.g. `base.test.ts` / `base-app-settings.test.ts`). Do NOT delete — they preserve template-level coverage against the surviving dataset. Researcher must first check whether `baseV1` already has equivalent dev-seed tests so coverage is neither lost nor duplicated.
- **D-04:** **A11y data source = reuse the base setup chain.** The a11y spec depends on the **same** base (`e2e/base`, formerly `baseV1`) seed/setup project the voter-journey uses — a project-dependency swap + spec data updates, **no new setup/teardown files**. (Researcher confirms sharing the base chain does not cause DB-ordering/teardown conflicts with voter-journey; only then fall back to a dedicated a11y setup.)
- **D-05:** **Canonical `external_id` prefix for the merged base dataset = `test-e2e-base-`** (replaces the divergent `test-e2e-` / `test-baseV1-` pair). Update the Phase 92 WS5 freshness-guard allowlist (`setupFromTemplate.ts` + `data.setup.ts` mirror) and any hardcoded prefix references in seed writer / setup files.

### Setup taxonomy + old-dataset fate (Workstream 2)
- **D-06:** **Merge the two base-seeding paths into ONE.** `data.setup.ts` / `data.teardown.ts` currently seed the old `e2e` dataset (backing visual / bank / perf), while `baseV1.setup.ts` seeds `baseV1`. Since both now point at the same dataset (`e2e/base`), collapse them into a single base setup/teardown project (formerly `baseV1`) and **repoint** the visual / bank / perf / auth dependencies to it. Eliminate the now-duplicate `data-setup`/`data-teardown` chain.
- **D-07:** **`tests/setup/shared/`** holds all cross-role infra: `auth.setup.ts`, `setupFromTemplate.ts`, the merged base setup + teardown, and any data helpers. **`tests/setup/perm/`** holds the `perm-*` setup/teardown pairs. **`tests/setup/candidate/`** holds the candidate-journey setup (formerly `candidate-mega.setup.ts`). **`tests/setup/voter/`** holds any voter-journey-specific setup. (`shared/` = cross-app/cross-role infra; role dirs hold role-specific setup.)
- **D-08:** **Full playwright.config rewrite.** Update `testMatch` regexes for the new subdir paths AND rename project keys to the new naming (`data-setup-candidate-journey`, `base`, etc. — see D-10/D-11). Verify the complete project dependency graph still resolves and runs green after the moves + renames.

### Rename breadth (Workstream 3)
- **D-09:** **Remove "mega" EVERYWHERE — zero tokens remain.** Rename: specs (→ `voter-journey.spec.ts` / `candidate-journey.spec.ts`), fixture files (`candidate-mega.ts`, `voter-mega.fixture.ts`), setup basenames (`candidate-mega.setup.ts`), playwright project names (`data-setup-candidate-mega` → `data-setup-candidate-journey`), internal identifiers/comments, **and** `external_id` data prefixes (e.g. `test-candidate-mega-` → `test-candidate-journey-`). Apply the prefix renames consistently to the seed writer + freshness-guard allowlist so row-scoping/guard invariants hold.
- **D-10:** **Rename `baseV1` → `base` for consistency.** `baseV1.setup.ts`/`baseV1.teardown.ts` → `base.setup.ts`/`base.teardown.ts`; project keys `data-setup-baseV1` → `data-setup-base` (or `base`); the template export `baseV1` → `base` (file at `e2e/base.ts` per D-01). Update ALL `baseV1` references across config / setup / seed / docs.
- **D-11:** **Canonical journey naming = `voter-journey` / `candidate-journey`** applied uniformly across specs, fixture composition roots (`voter-journey.fixture.ts` / `candidate-journey.ts`), setup files, and playwright project keys.

### Fixture placement (Workstream 1)
- **D-12:** **All root-level voter-app fixtures → `tests/tests/fixtures/voter/`**: `entityDetails.fixture.ts`, `entityFilters.fixture.ts`, `resultsPage.fixture.ts`, `views.ts`, and the voter-journey composition root (`voter-journey.fixture.ts`). Rationale: they model voter-app UI surfaces; perm specs importing them is fine (perm is a test *family*, not a separate app). **`shared/` is reserved for genuinely cross-app helpers only.**
- **D-13:** **`shared/` moves (per ROADMAP):** candidate `emailBucket.fixture.ts`, `langSelectorFixture.fixture.ts`, `multilingualTextFieldFixture.fixture.ts` → `tests/tests/fixtures/shared/`.
- **D-14:** **`voter/` move (per ROADMAP):** candidate `voterNavFixture.fixture.ts` → `tests/tests/fixtures/voter/`.
- **D-15:** **`views` stays separate** — the roadmap's "consolidate `views` with `voter-mega` *if not used elsewhere*" resolves to **DO NOT consolidate**: scout confirms `views.ts` is imported by 6 perm specs + `resultsPage.fixture.ts` + `candidate-mega.ts`. It moves to `voter/` (D-12) intact.
- **D-16:** **`minimalVoterResultsPage` → `tests/tests/fixtures/voter/minimalVoterResultsPage.fixture.ts`** (extracted from the voter journey fixture; consumed by `perm-hide-if-missing-answers` + `perm-disable-allow-open`). **Rewrite only if needed** — keep current behavior; only rewrite to support the minimal perm datasets if extraction surfaces an actual coupling to full-journey data (roadmap's "only if needed").

### Claude's Discretion
- Exact file/symbol names within the chosen conventions, the precise order of the rename+move commit sequence, and how the playwright project dependency graph is re-expressed — left to research/planning, provided the suite + lint + typecheck stay green at every commit and no "mega"/`baseV1`/old-`e2e` token survives.
- Whether the dev-seed `seed_` default prefix (unrelated to the test prefixes) needs any touch — only if it intersects the freshness-guard allowlist work.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase definition
- `.planning/ROADMAP.md` §"Phase 93: Clean up and reorganise E2E tests, fixtures, setup, and seed templates" — the five workstreams (scope anchor).
- `.planning/phases/92-e2e-test-infrastructure-hardening-typecheck-all-tests-and-el/92-CONTEXT.md` — immediate predecessor; function-fixture paradigm, testIds-canonical access, `goToPage`/`expectPageVisible`, timeout buckets, and the WS5 freshness-guard/`external_id`-prefix mechanism this phase's prefix renames must stay consistent with.

### Fixtures (WS1)
- `tests/tests/fixtures/` — current layout (candidate/, shared/, voter/, root files) being reorganised.
- `tests/tests/fixtures/views.ts` — voter/results composition root; stays separate (D-15), moves to `voter/`.
- `tests/tests/fixtures/voter-mega.fixture.ts` — voter journey composition root; source of the `minimalVoterResultsPage` extraction (D-16); renamed to `voter-journey.fixture.ts`.
- `tests/tests/fixtures/candidate/candidate-mega.ts` — candidate composition root; renamed to `candidate-journey.ts`.
- `tests/tests/fixtures/resultsPage.fixture.ts`, `entityDetails.fixture.ts`, `entityFilters.fixture.ts` — root voter-app fixtures → `voter/`.

### Setup + playwright wiring (WS2)
- `tests/playwright.config.ts` — project graph (project keys, `testMatch` regexes, dependency chains, `data-setup`/`data-setup-baseV1` families). Full rewrite per D-08/D-10.
- `tests/tests/setup/` — current flat layout to be split into `shared/` `voter/` `candidate/` `perm/`.
- `tests/tests/setup/data.setup.ts` / `data.teardown.ts` — old `e2e`-dataset projects to be MERGED into the base chain (D-06).
- `tests/tests/setup/baseV1.setup.ts` / `baseV1.teardown.ts` — base seed/teardown; renamed to `base.*` (D-10).
- `tests/tests/setup/setupFromTemplate.ts` — shared seeding helper + freshness-guard probe (allowlist update for new prefixes, D-05/D-09).
- `tests/tests/setup/auth.setup.ts` — candidate storageState setup; moves to `shared/`, dependency repointed to merged base.

### Seed templates (WS5)
- `packages/dev-seed/src/templates/baseV1.ts` — becomes `e2e/base.ts` (D-01).
- `packages/dev-seed/src/templates/e2e.ts` — **deleted** (content discarded, D-01).
- `packages/dev-seed/src/templates/permutations/*` — move under `e2e/perm/*` (D-02).
- `packages/dev-seed/src/templates/index.ts` — templates barrel; remap exports.
- `packages/dev-seed/src/cli/resolve-template.ts` — template-name resolution; map `e2e/base` + `e2e/perm/*`, retire bare `e2e`.
- `packages/dev-seed/tests/templates/e2e.test.ts` + `e2e-app-settings.test.ts` — retarget to base dataset + rename (D-03).
- `packages/dev-seed/src/ctx.ts` / `writer.ts` / `supabaseAdminClient.ts` — `externalIdPrefix` mechanics for the prefix renames (D-05/D-09).
- `tests/seed-test-data.ts`, `tests/README.md` — `--template e2e` consumers to update (D-01).

### Specs (WS3 + WS4)
- `tests/tests/specs/voter/voter-mega-journey.spec.ts` → `voter-journey.spec.ts`.
- `tests/tests/specs/candidate/candidate-mega-journey.spec.ts` → `candidate-journey.spec.ts`.
- `tests/tests/specs/a11y/a11y-smoke.spec.ts` — rewire to base dataset / base setup chain (D-04).
- `tests/tests/specs/perm/*` — consumers of `views`, `minimalVoterResultsPage`; import paths updated.
- `tests/tests/specs/visual/visual-regression.spec.ts`, `tests/tests/specs/candidate/candidate-bank-auth.spec.ts`, `tests/tests/specs/perf/performance-budget.spec.ts` — depend on the merged base chain (D-06).

### Conventions
- `CLAUDE.md` — `// reason:` inline-rationale convention; `db:seed --template` docs to update; testId + fixture conventions from Phases 88–92.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Function-fixture paradigm + composition roots** (`candidate-mega.ts`, `voter-mega.fixture.ts`, `views.ts`) — carried from Phase 92; the established shape. This phase relocates/renames them, not restructures their internals.
- **`external_id` prefix row-scoping** (`${prefix}%`) + the Phase 92 freshness-guard allowlist — the existing idiom the prefix renames (D-05/D-09) extend.
- **`resolve-template.ts` + templates barrel** — single chokepoints for the template name/path remap.

### Established Patterns
- Role-based test taxonomy already partially present (`specs/voter/`, `specs/candidate/`, `specs/perm/`, `fixtures/candidate/`, `fixtures/voter/`, `fixtures/shared/`) — this phase completes it for `fixtures/` root files and all of `setup/`.
- playwright project graph wires setup→spec by project key + `testMatch` regex (basename-matched, so relocation into subdirs survives, but project-name strings + dependency keys still need the rename per D-08).
- `views.ts` is a genuine shared-voter dependency (6 perm specs + resultsPage + candidate root) — the "consolidate if unused" condition fails; keep separate.

### Integration Points
- **Renames ripple wide:** imports across all specs/fixtures, playwright project keys + `testMatch`, dev-seed `resolve-template`/barrel/tests, `external_id` prefixes, freshness-guard allowlist (both mirror sites), and `CLAUDE.md`/README docs. Greenness must hold at each commit.
- **Base-chain merge (D-06)** touches every project that currently depends on `data-setup` (visual / bank / perf / auth) — repoint to the merged base project.
- **Prefix change (D-05/D-09)** intersects the Phase 92 WS5 freshness guard — keep the allowlist authoritative.

</code_context>

<specifics>
## Specific Ideas

- The new seed family shape is explicitly `e2e/base.ts` + `e2e/perm/*`; the **old `e2e.ts` content is discarded**, not migrated — `baseV1` becomes the one canonical base dataset.
- Naming must be **fully consistent end-to-end**: template `e2e/base` ⇄ setup `base.*` ⇄ project key `base`/`data-setup-base` ⇄ prefix `test-e2e-base-`; journeys `voter-journey`/`candidate-journey` ⇄ prefix `test-{role}-journey-`. No `mega`, no `baseV1`, no bare-`e2e` tokens left anywhere.
- `shared/` semantics held firm = **cross-app** helpers only (email, langSelector, multilingualText); voter-app page fixtures consumed by perm specs are still **voter/**.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

### Reviewed Todos (not folded)
The phase todo-matcher surfaced four hits that are **spurious keyword matches** (same as Phase 92), all unrelated to E2E test-file reorganisation — reviewed and NOT folded:
- `2026-03-28-generalize-candidate-app-to-party-app.md` — frontend party-app generalization (keyword "candidate"); separate feature phase.
- `2026-03-28-investigate-migrating-candidate-answer-store.md` — candidate answer-store robustness (keyword "candidate"); separate phase.
- `2026-04-25-normalise-app-shared-paradigm.md` — `@openvaa/app-shared` package paradigm (keyword "shared"); unrelated package work.
- `2026-04-25-remove-mergesettings-reexports.md` — frontend `mergeSettings` re-export removal (keywords "remove/phase"); unrelated.

</deferred>

---

*Phase: 93-clean-up-and-reorganise-e2e-tests-fixtures-setup-and-seed-te*
*Context gathered: 2026-06-03*
