---
phase: 56-generator-foundations-plumbing
plan: 04
subsystem: dev-tooling
tags: [dev-seed, generators, foundation-entities, topo-order, sentinel-fields, supabase-types]

requires:
  - phase: 56-generator-foundations-plumbing
    provides: "Ctx type + buildCtx factory + Fragment<TRow> type (Plans 01/02/03)"
  - phase: 56-generator-foundations-plumbing
    provides: "SupabaseAdminClient base with bulkImport/linkJoinTables sentinel handling (Plan 02)"
provides:
  - "ElectionsGenerator, ConstituencyGroupsGenerator, ConstituenciesGenerator (foundation entities with optional self-FK)"
  - "OrganizationsGenerator, AlliancesGenerator, FactionsGenerator (leaf foundation entities, no content FKs)"
  - "AccountsGenerator, ProjectsGenerator (pass-through per D-11 — return [], log warning on fragment)"
  - "Canonical generator-class pattern: ctor captures ctx (D-26), defaults(ctx) per-call (D-08), generate(fragment) returns TablesInsert rows"
affects: [56-05, 56-06, 56-07, 57-*, 58-*]

tech-stack:
  added: []  # No new deps — uses @openvaa/supabase-types, @faker-js/faker, Ctx/Fragment from prior plans
  patterns:
    - "Generator class shape: private ctx ctor capture + defaults(ctx) per-call + generate(fragment) typed return"
    - "fixed[] pass-through with external_id prefix re-application (GEN-02/GEN-04)"
    - "Self-FK via ref-object widening: TablesInsert<'T'> & { parent?: { external_id } } internally, cast back at return"
    - "Pass-through generators: explicit return [] + ctx.logger warning when user supplies non-empty fragment (D-11)"
    - "Sentinel enrichment deferred to Plan 07's post-topo pass — generators stay sentinel-free for clean unit tests"

key-files:
  created:
    - "packages/dev-seed/src/generators/ElectionsGenerator.ts"
    - "packages/dev-seed/src/generators/ConstituencyGroupsGenerator.ts"
    - "packages/dev-seed/src/generators/ConstituenciesGenerator.ts"
    - "packages/dev-seed/src/generators/OrganizationsGenerator.ts"
    - "packages/dev-seed/src/generators/AlliancesGenerator.ts"
    - "packages/dev-seed/src/generators/FactionsGenerator.ts"
    - "packages/dev-seed/src/generators/AccountsGenerator.ts"
    - "packages/dev-seed/src/generators/ProjectsGenerator.ts"
  modified: []

key-decisions:
  - "Sentinel fields (_constituencyGroups, _constituencies) are NOT emitted by the generators themselves — they are populated by Plan 07's post-topo enrichment pass so the full ctx.refs graph is known."
  - "Default counts: elections=1, constituency_groups=1, constituencies=2, organizations=4, alliances=0, factions=0. Alliances/factions default off because they are uncommon in VAA datasets; templates enable them explicitly."
  - "ConstituenciesGenerator uses an internal widened row type (TablesInsert<'constituencies'> & { parent?: {external_id} }) to carry the self-FK ref sentinel, cast back to TablesInsert at return. The cast is load-bearing: bulk_import accepts parent refs, but the generated TablesInsert type only models DB columns."
  - "auth_user_id on organizations is left unset per Phase 56 no-auth scope (RESEARCH §4.8). Phase 60+ (if ever) owns organization-user linking."
  - "ESLint suppression via `// eslint-disable-next-line @typescript-eslint/no-unused-vars` on each `defaults(ctx)` method, matching the codebase convention (packages/core/src/controller/controller.ts:72 precedent). The ctx parameter stays on the signature to preserve the D-08 contract for Phase 57/58 generators that will actually read it."

patterns-established:
  - "Canonical foundation-generator pattern: 6 of 6 real generators (Elections, ConstituencyGroups, Constituencies, Organizations, Alliances, Factions) follow the exact same ctor/defaults/generate/fixed-loop/count-loop shape — Plan 05 content generators and Plan 06 nominations can replicate it."
  - "Pass-through generator pattern: AccountsGenerator + ProjectsGenerator return [] unconditionally but still follow the class/ctor/defaults/generate shape so Plan 07's pipeline class map can uniformly do `new Gen(ctx).generate(fragment)` without an accounts/projects special case."
  - "Self-FK optional-parent pattern: ConstituenciesGenerator picks a parent from a prior row in the same batch (backward-only index) ~30% of the time; cycle-free by construction without needing a post-pass check."
  - "External-id-prefix convention: every row (fixed or generated) carries `external_id = ${ctx.externalIdPrefix}${suffix}` so Phase 58's teardown (CLI-03) can prefix-filter dev-seed rows cleanly."

requirements-completed: [GEN-01, GEN-02, GEN-04, NF-03]

duration: 9m 15s
completed: 2026-04-22
---

# Phase 56 Plan 04: Foundation Generators Summary

**Eight foundation-layer generator classes (6 real + 2 pass-through per D-11) implementing the canonical D-04/D-08/D-26 pattern that Plans 05/06/07 extend.**

## Performance

- **Duration:** 9m 15s
- **Started:** 2026-04-22T14:21:48Z
- **Completed:** 2026-04-22T14:31:03Z
- **Tasks:** 3 completed
- **Files modified:** 8 (all newly created)

## Accomplishments

- Delivered 8 generator classes covering the foundation layer of the D-06 topo order (elections → constituency_groups → constituencies → organizations → alliances → factions plus accounts/projects pass-through).
- Established the canonical generator shape Plans 05/06 will replicate: `constructor(private ctx)` + `defaults(ctx): Fragment` + `generate(fragment): TablesInsert<'X'>[]`.
- Kept sentinel fields (`_constituencyGroups` / `_constituencies`) out of generator output so unit tests can assert raw `TablesInsert` shape without filtering; Plan 07's post-topo pass will populate them.
- Enforced the D-11 "accounts/projects are bootstrap-only" invariant in code: both pass-through generators explicitly `return []` and `ctx.logger`-warn when a user supplies a non-empty fragment.
- Zero `any` types in the public surface (NF-03); every row typed against `TablesInsert<'X'>` from `@openvaa/supabase-types` (GEN-02).

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement ElectionsGenerator + ConstituencyGroupsGenerator + ConstituenciesGenerator** — `0ae66ce9c` (feat)
2. **Task 2: Implement OrganizationsGenerator + AlliancesGenerator + FactionsGenerator** — `2cb452157` (feat)
3. **Task 3: Implement AccountsGenerator + ProjectsGenerator (pass-through per D-11)** — `e951f360e` (feat)

**Follow-up:** `19f05905e` (docs) — reworded sentinel references in ElectionsGenerator/ConstituencyGroupsGenerator JSDoc so acceptance-criteria grep (`! grep -q "_constituencyGroups"`) passes.

## Files Created/Modified

- `packages/dev-seed/src/generators/ElectionsGenerator.ts` — emits `TablesInsert<'elections'>` with localized name/short_name, election_type='general', future `election_date`, `is_generated: true`. Default count=1.
- `packages/dev-seed/src/generators/ConstituencyGroupsGenerator.ts` — emits `TablesInsert<'constituency_groups'>` with localized name. Default count=1.
- `packages/dev-seed/src/generators/ConstituenciesGenerator.ts` — emits `TablesInsert<'constituencies'>` with optional `parent: { external_id }` self-FK ref (~30% of generated rows adopt an earlier row). Default count=2.
- `packages/dev-seed/src/generators/OrganizationsGenerator.ts` — emits `TablesInsert<'organizations'>` (parties) with localized name/short_name, faker-derived color. `auth_user_id` left unset (Phase 56 no-auth). Default count=4.
- `packages/dev-seed/src/generators/AlliancesGenerator.ts` — emits `TablesInsert<'alliances'>` with localized name. Default count=0 (templates enable explicitly).
- `packages/dev-seed/src/generators/FactionsGenerator.ts` — emits `TablesInsert<'factions'>` with localized name. Default count=0 (faction hierarchy lives in nominations, not here).
- `packages/dev-seed/src/generators/AccountsGenerator.ts` — pass-through per D-11 (returns `[]`; warns on non-empty fragment).
- `packages/dev-seed/src/generators/ProjectsGenerator.ts` — pass-through per D-11 (returns `[]`; warns on non-empty fragment).

## Verification

- `yarn workspace @openvaa/dev-seed typecheck` — exit 0.
- `yarn workspace @openvaa/dev-seed lint` — exit 0.
- `yarn workspace @openvaa/dev-seed test:unit` — exit 0 (no tests yet; Plan 08 adds per-generator unit tests).
- `ls packages/dev-seed/src/generators/ | wc -l` — 8 (matches plan expectation).

Manual spot-checks:
- Every `*Generator.ts` class has `constructor(private ctx: Ctx)` — verified via grep for all 8 files.
- Every real generator (6 files, excl. accounts/projects) applies `${externalIdPrefix}` via template literal — verified via grep.
- No `_constituencyGroups` / `_constituencies` sentinel strings appear in ElectionsGenerator.ts / ConstituencyGroupsGenerator.ts (cleaned up in commit `19f05905e`).
- No `auth_user_id:` string appears in OrganizationsGenerator.ts (cleaned up in Task 2).
- No `: any` types in any of the 8 files — verified via grep.
- AccountsGenerator.ts + ProjectsGenerator.ts explicitly `return []` and call `this.ctx.logger(...)` on non-empty fragment — verified via grep.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ESLint `no-unused-vars` fired on `defaults(_ctx: Ctx)` method parameters**

- **Found during:** Task 1 (first lint run after writing Elections/ConstituencyGroups/Constituencies generators).
- **Issue:** `@typescript-eslint/no-unused-vars` in `@typescript-eslint/recommended` does NOT honor the `argsIgnorePattern: '^_'` convention by default — `defaults(_ctx: Ctx) { return { count: 1 }; }` produced three "defined but never used" errors even though the `_` prefix was intentional Phase-56-specific signaling.
- **Fix:** Replaced `_ctx` with `ctx` and added `// eslint-disable-next-line @typescript-eslint/no-unused-vars` above each `defaults(ctx: Ctx)` method in all 8 generator classes (including Accounts/Projects). The signature preserves the D-08 contract for Phase 57/58 generators that will actually read ctx; the suppression comment matches the established codebase convention (see `packages/core/src/controller/controller.ts:72`).
- **Files modified:** All 8 generator files.
- **Commits:** `0ae66ce9c` (Task 1 — Elections/ConstituencyGroups/Constituencies), `2cb452157` (Task 2 — Organizations/Alliances/Factions), `e951f360e` (Task 3 — Accounts/Projects).

**2. [Rule 3 - Blocking] JSDoc mentions of sentinel field names tripped acceptance-criteria grep**

- **Found during:** Post-Task 3 success-criteria verification.
- **Issue:** Plan's acceptance criteria say `! grep -q "_constituencyGroups" ElectionsGenerator.ts && ! grep -q "_constituencies" ConstituencyGroupsGenerator.ts` — meant to ensure the sentinel field is not emitted as a row field. My initial JSDoc comments documented the sentinel-skipping policy by referencing the literal field names, which made the grep fire false-positive.
- **Fix:** Reworded both JSDoc blocks to describe the sentinels by role ("constituency-groups join sentinel", "constituencies join sentinel") with cross-refs to RESEARCH §4.3/§4.4 where the exact field names are defined. No code-behavior change.
- **Files modified:** `ElectionsGenerator.ts`, `ConstituencyGroupsGenerator.ts`.
- **Commit:** `19f05905e`.

### Decisions Made

- **Default counts for uncommon entities (alliances, factions):** set to 0 so `{}`-template smoke-tests don't surface surprise rows; templates that want alliances/factions enable them explicitly via `{ alliances: { count: N } }`. Rationale baked into generator JSDoc.
- **Self-FK probability for constituencies:** 30% (`faker.number.int({ min: 1, max: 10 }) <= 3`) — arbitrary but deterministic given the seeded faker; enough to exercise the parent-ref plumbing in downstream generators/tests without making output hard to visually scan.
- **Color emission for organizations:** `faker.color.rgb()` returns a string; the DB column is `Json | null`; per `packages/supabase-types/src/database.ts:1` the `Json` type accepts bare strings, so no cast needed. This differs from the plan's sample which had a `color` note — verified the simplest form works.
- **Faker v8.4.1 API compatibility:** verified `faker.lorem.words({ min, max })`, `faker.date.future({ years })`, `faker.location.country/state`, `faker.word.adjective/noun`, `faker.color.rgb()`, `faker.company.name()`, `faker.number.int({ min, max })`, and `faker.datatype.boolean()` all exist in v8.4.1 before using them (spot-checked `node_modules/@faker-js/faker/dist/types/modules/*/index.d.ts`).

## Known Stubs

**1. `published: false` inheritance (not a stub the generator introduces, but a downstream visibility gap)**

- **Location:** All 6 real foundation generators — none emit `published: true`.
- **Issue:** `elections`, `constituency_groups`, `constituencies`, `organizations`, `alliances`, `factions` all have `published boolean NOT NULL DEFAULT false` (migration lines 1144-1153). Anon RLS only surfaces rows where `published = true` (partial indexes at 1159-1163). So dev-seed rows will not be visible to the voter app until `published` is set.
- **Reason this is deferred:** The plan's `<action>` explicitly enumerates which fields to emit and does not include `published`. Plan 56's scope is foundations/plumbing; the `published` handling is likely a template-authoring concern (Phase 58) or a per-row `fixed[]` override concern. The existing E2E fixture `tests/tests/data/default-dataset.json` sets `"published": true` on every row, so Phase 59's fixture-migration plan will need to surface this — either via a `published: true` default in the template's built-in dataset, or via an explicit generator-level flip.
- **Resolved by:** Phase 58 (TMPL-01/02 template system) when the `default` template is authored, OR a deliberate Phase 56 Plan 05/06 revisit if Plan 07's pipeline tests reveal the visibility gap.

## Threat Model Compliance

Plan's threat register covers T-56-16 through T-56-20:

- **T-56-16 (Tampering, fixed[] external_id):** Mitigated — every generator applies `${externalIdPrefix}${fx.external_id}` to user-supplied `fixed[]` rows, so teardown's prefix filter can cleanly reclaim generator-produced rows (see ElectionsGenerator.ts L41-46 and the same pattern in all 5 other real generators).
- **T-56-17 (Info Disclosure, faker data):** Accepted as documented — deterministic but non-sensitive (company names, locations, adjectives, party labels). No real PII.
- **T-56-18 (Spoofing, constituencies self-FK):** Mitigated — ConstituenciesGenerator only references prior-batch rows (`rows.length > 0` + backward-only index), cannot forge a ref to a nonexistent constituency.
- **T-56-19 (Elevation, pass-through):** Mitigated — AccountsGenerator/ProjectsGenerator explicitly `return []` AND `ctx.logger` a warning when the user tries to add rows. D-11 boundary is enforced in code, not just documentation.
- **T-56-20 (DoS, unbounded count):** Accepted — dev-only tool, no production surface.

## Next Steps

- Plan 05 adds content generators (CandidatesGenerator, QuestionCategoriesGenerator, QuestionsGenerator, AppSettingsGenerator, FeedbackGenerator) following the same canonical pattern. Content generators DO emit content FKs (`organization: { external_id }`, `category: { external_id }`) and sentinel fields (`answersByExternalId`, `_elections`).
- Plan 06 adds NominationsGenerator with the polymorphic entity ref handling per RESEARCH §9.
- Plan 07 wires all 14 generators into the pipeline + writer, implements the post-topo sentinel-enrichment pass that populates `_constituencyGroups` / `_constituencies` / `_elections` on the rows this plan produced, and implements the D-11 `feedback` / `app_settings` routing.
- Plan 08 adds per-generator unit tests (D-22 pure I/O) plus pipeline/writer/determinism/template tests.

## Self-Check: PASSED

- File `packages/dev-seed/src/generators/ElectionsGenerator.ts` — FOUND
- File `packages/dev-seed/src/generators/ConstituencyGroupsGenerator.ts` — FOUND
- File `packages/dev-seed/src/generators/ConstituenciesGenerator.ts` — FOUND
- File `packages/dev-seed/src/generators/OrganizationsGenerator.ts` — FOUND
- File `packages/dev-seed/src/generators/AlliancesGenerator.ts` — FOUND
- File `packages/dev-seed/src/generators/FactionsGenerator.ts` — FOUND
- File `packages/dev-seed/src/generators/AccountsGenerator.ts` — FOUND
- File `packages/dev-seed/src/generators/ProjectsGenerator.ts` — FOUND
- Commit `0ae66ce9c` (Task 1) — FOUND
- Commit `2cb452157` (Task 2) — FOUND
- Commit `e951f360e` (Task 3) — FOUND
- Commit `19f05905e` (sentinel-doc cleanup) — FOUND
