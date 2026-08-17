# Phase 67: Default Seed Alliances - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning
**Milestone:** v2.7 Svelte 5 Polish + Supabase-Adapter Loose Ends (Phase 3 of 4)

<domain>
## Phase Boundary

Add **2 alliances** to the default seed template (`packages/dev-seed/src/templates/default.ts` + `packages/dev-seed/src/templates/defaults/`) so that `yarn dev:reset-with-data` produces a populated alliances surface in the voter app. Specifically: hand-author 2 alliances grouping 6 of 8 parties into ideological blocs; emit `alliance_nominations` linking the contributing party org-noms in every constituency; verify the supabase adapter's reverse-fill of `organizationNominationIds` on Alliance parents (the v2.6 P64 Plan 01 path that was previously dev-blind) returns non-empty arrays.

**Goal anchor:** ROADMAP SC-1 through SC-4 (all four) — default template emits ~2-3 alliances + alliance_nominations; voter results page shows populated alliances surface; supabase adapter reverse-fill returns non-empty `organizationNominationIds` on Alliance parents; `@openvaa/matching` and `@openvaa/filters` handle alliances correctly with seeded data (no runtime errors, no empty match-breakdown sections).

**In scope:**
- Create `packages/dev-seed/src/templates/defaults/alliances-override.ts` mirroring the existing `nominations-override.ts` / `candidates-override.ts` / `questions-override.ts` pattern
- Hand-author **2 alliances** with neutral invented names (per D-58-01 "no real party names, no encoded political positions"):
  - **Alliance L (Left bloc):** members = `{SDU, RF, GW}` — Social Democrats Union, Red Front, Green Wing
  - **Alliance R (Right bloc):** members = `{BC, VC, RA}` — Blue Coalition, Values Coalition, Rural Alliance
  - Standalone (no alliance): `PM` (People's Movement), `CP` (Coastal Party) — exercises the "party with no alliance" UI path
- Emit `alliance_nominations` for both alliances in **every constituency** (5 of 5) — full reverse-fill exercise
- Wire alliance entities + nominations into `defaultTemplate` via the override pattern (`defaultOverrides.alliances`)
- Manual UI smoke: `yarn dev:reset-with-data && yarn dev`, verify alliances tab populated in voter results page, filter/group by alliance works
- Adapter sanity check: log/inspect `organizationNominationIds` on Alliance parents during seed run — confirm non-empty arrays (the previously dev-blind path)
- 4-locale generation via `generateTranslationsForAllLocales: true` (already set in `defaultTemplate`)

**Out of scope:**
- New unit tests in `@openvaa/matching` or `@openvaa/filters` for Alliance-entity handling — manual UI smoke is the validation surface (D-03)
- Programmatic alliance grouping based on latent-factor positions — explicit reject (hand-authored only)
- Real-world Finnish coalition names (e.g., `Punavihreä yhteistyö`) — D-58-01 rule forbids
- Per-constituency alliance variation (some constituencies missing some alliances) — explicit reject (full reverse-fill exercise per D-02)
- Adding alliances to the `e2e` template — default template only; e2e stays minimal for fast test runs
- UI changes to the alliances surface — the surface already exists per ROADMAP context; Phase 67 only seeds data through it

</domain>

<decisions>
## Implementation Decisions

### Alliance Grouping

- **D-01: Hand-authored 2 alliances; 6 of 8 parties grouped; 2 parties standalone.**
  - **Alliance L:** `{party_social, party_red, party_green}` (SDU, RF, GW) — Left bloc
  - **Alliance R:** `{party_blue, party_values, party_rural}` (BC, VC, RA) — Right bloc
  - **Standalone:** `party_people` (PM), `party_coast` (CP) — no alliance membership; exercises the party-without-alliance UI path
  Reasoning: matches the user's intent to (a) keep groupings sensible/intuitive (color hue + name affinity), (b) drop the centrist bloc so some parties have no alliance, (c) stay within the ROADMAP's "~2-3 alliances" spec (we picked 2 for cleanliness).

### Per-Constituency Variation

- **D-02: Same alliances in every constituency.** Both Alliance L and Alliance R get an `alliance_nomination` in all 5 constituencies (`c_01` through `c_05`). Total: **10 alliance nominations** (2 alliances × 5 constituencies). Each alliance nomination links to the party `organization_nomination`s for that constituency. Maximum exercise of the v2.6 P64 reverse-fill code path (`organizationNominationIds` on Alliance parents). Note: today there are 40 org noms (8 parties × 5 const); after Phase 67 there'll be 40 org noms + 10 alliance noms = 50 noms above the candidate-noms (327).

### Validation Surface

- **D-03: Manual UI smoke + adapter sanity check; no new unit tests.**
  - **UI smoke:** `yarn dev:reset-with-data && yarn dev` → navigate voter app → verify alliances tab populated on results page → filter/group by alliance works → no empty-tab dev-blind state
  - **Adapter sanity:** during seed pipeline run, log `organizationNominationIds` on each Alliance parent (or assert via a small script post-seed). Confirms the previously dev-blind v2.6 P64 reverse-fill path now returns non-empty arrays.
  - **No new unit tests** in `@openvaa/matching` or `@openvaa/filters`. Rationale: existing tests cover Alliance entity types abstractly; adding seed-coupled tests would couple package tests to dev-seed shape.

### Alliance Naming + Locales

- **D-04: Invented neutral names; 4-locale generation.**
  - **Alliance L name:** `{ en: 'Progressive Front' }` (planner refines; suggested: `Progressive Front` / `Progressive Bloc`)
  - **Alliance R name:** `{ en: 'Conservative Bloc' }` (planner refines; suggested: `Conservative Bloc` / `Conservative Coalition`)
  - Short names: `{ en: 'PF' }` / `{ en: 'CB' }` (or planner's call)
  - Color: planner picks; suggest blended/neutral hues distinct from member parties (e.g., dark slate for L, dark gray for R) so the alliance entity is visually distinguishable
  - Per the existing `defaultTemplate.generateTranslationsForAllLocales: true`, the EN-only `name` blocks auto-translate to the project's 4 supported locales at seed time
  - External IDs: `seed_alliance_L` and `seed_alliance_R` (or planner's call following the `seed_party_*` pattern)
  - **NO real-world Finnish coalition names** — D-58-01 rule

### Plan Split

- **D-05: 2 plans (per ROADMAP).** Suggested:
  - **Plan 67-01: Seed authoring** — Create `alliances-override.ts`, wire into `defaultTemplate` + `defaultOverrides`, emit alliance entities + alliance_nominations for both alliances in all 5 constituencies, regenerate locales via the existing `generateTranslationsForAllLocales: true` pipeline
  - **Plan 67-02: Validation + UI smoke** — `yarn dev:reset-with-data && yarn dev`, voter UI smoke (alliances tab + filtering), adapter sanity check (log `organizationNominationIds`), v2.6 parity gate run, phase verification report
  Sequential; no parallelism opportunities.

### Claude's Discretion

- Exact alliance names + short names + colors (D-04) — planner picks consistent with the 8-party color palette + locale conventions. Anchor: D-58-01 (no real names, no political positions encoded).
- Exact shape of `alliances-override.ts` — mirror `nominations-override.ts` patterns (overrides, fixed[], etc.) but planner picks the implementation form
- How to wire the override into `defaultOverrides` — likely `alliances: alliancesOverride` alongside the existing `candidates`, `nominations`, `questions` keys; if `Overrides` type doesn't yet have an `alliances` field, the planner extends it (small TS change)
- Whether to seed `factions` (sub-party groupings) too — explicit NO; alliances are the in-scope surface; factions stay empty
- Adapter sanity check implementation form — could be a one-time script in `packages/dev-seed/scripts/`, a console.log in `supabaseDataProvider.ts` gated on `process.env.NODE_ENV === 'development'`, or a manual SQL query against the seeded DB. Planner picks the lightest form

### Folded Todos

- **`2026-04-28-add-alliances-to-default-test-data.md`** — folded as the entire scope of D-01 through D-04. Closed by Phase 67 completion.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope & Requirements
- `.planning/ROADMAP.md` §Phase 67 — Goal, dependencies (Phase 66), success criteria
- `.planning/REQUIREMENTS.md` §SEED (SEED-01) — full alliance acceptance text
- `.planning/STATE.md` §Roadmap Evolution — v2.7 milestone scope rationale

### Source Todos (folded into this phase)
- `.planning/todos/pending/2026-04-28-add-alliances-to-default-test-data.md` — full alliance-seeding investigation + acceptance criteria

### Prior-Phase Context (LOCKED — do not contradict)
- `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/64-CONTEXT.md` — Phase 64 D-01 reverse-fill architecture LOCKED; Phase 67 exercises the alliance branch of this same code path
- `.planning/milestones/v2.5-phases/58-templates-cli-default-dataset/58-CONTEXT.md` (if archived) — D-58-01 (no real party names, no encoded political positions), D-58-02 (5 constituencies), D-58-03 (questions shape), D-58-04 (4-locale generation) — alliance authoring follows the same conventions

### Files Targeted by Phase 67
- `packages/dev-seed/src/templates/defaults/alliances-override.ts` — **NEW FILE**; mirrors the pattern of `nominations-override.ts` / `candidates-override.ts` / `questions-override.ts`
- `packages/dev-seed/src/templates/default.ts` — wire `alliances: alliancesOverride` into `defaultOverrides`; possibly add an `alliances: { count: 0, fixed: [...] }` block to `defaultTemplate` (or rely entirely on the override; planner picks)
- `packages/dev-seed/src/types.ts` — possibly extend the `Overrides` type with an `alliances` field if not already present

### Reference Files (read-only, for shape composition)
- `packages/dev-seed/src/templates/defaults/nominations-override.ts` — the closest analog; mirror its structure for `alliance_nominations` emission
- `packages/dev-seed/src/templates/defaults/candidates-override.ts` — secondary analog for the entity-emission pattern
- `packages/data/src/objects/nominations/variants/allianceNomination.ts` — `AllianceNomination` shape requirements + parent/child semantics
- `packages/data/src/objects/entities/variants/alliance.ts` — `Alliance` entity shape
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` lines ~365-419 — the v2.6 P64 reverse-fill pass that Phase 67 empirically exercises (alliance branch)

### Verification References
- `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte` — voter results page; alliances tab/surface lives here
- `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` — v2.6 parity gate; Phase 67 re-runs but does NOT regenerate constants
- v2.6 parity baseline at HEAD `2c7ad2dea` — Phase 67 must not regress

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`packages/dev-seed/src/templates/default.ts`** — 252 lines; canonical authoring entry point. Existing patterns for `elections`, `constituency_groups`, `constituencies`, `organizations` (the 8 parties), `question_categories`, `questions`, `candidates`, `nominations`, `app_settings`. Phase 67 follows this pattern for `alliances`.
- **`defaults/nominations-override.ts`** — closest analog for the alliance_nominations emission shape (parent-of-org-nominations relationship with constituency context)
- **`generateTranslationsForAllLocales: true`** — already set in `defaultTemplate` (line 38). 4-locale auto-generation works for all `name`/`short_name` blocks; alliance authoring uses EN-only and gets locale expansion for free.
- **`PARTY_CONSTITUENCY_MATRIX` in `nominations-override.ts`** — defines which parties have org-noms in which constituencies. Today: dense 8×5 matrix (every party in every constituency). Alliance noms compose off this; if a constituency has no nom for one of the alliance's member parties, the alliance nom for that constituency links only the available members (or skips that constituency — planner decides; default: link whatever's available since the matrix is dense).
- **External ID prefix `seed_`** — already set in `defaultTemplate` (line 37). All Phase 67 entities + nominations get this prefix automatically via the seed pipeline.
- **v2.6 P64 supabase adapter reverse-fill** at `supabaseDataProvider.ts:365-419` — already implemented for the Alliance branch but never empirically exercised. Phase 67 IS the empirical exercise; no adapter code changes needed.

### Established Patterns

- **`{ external_id, name: { en: ... }, short_name: { en: ... }, color: {...}, sort_order, is_generated: false }`** — entity authoring shape used for the 8 parties (`organizations` block, lines 86-154). Alliances follow the same shape.
- **`fixed: [...]` with `count: 0`** — `count: 0` suppresses synthetic emission; `fixed[]` fully describes the table. Used for elections, constituency_groups, constituencies, organizations, question_categories, app_settings. Alliances follow this pattern.
- **`defaultOverrides` exports** — `candidatesOverride` / `nominationsOverride` / `questionsOverride` from `./defaults/` files. Phase 67 adds `alliancesOverride` from `./defaults/alliances-override.ts`.
- **No latent-factor wiring for alliances** — Phase 57 latent emitter targets candidate answers, not entity-grouping shapes. Alliance authoring is purely structural.

### Integration Points

- **`@openvaa/data` `Alliance` + `AllianceNomination` types** — already exist; Phase 67 emits data through them, no model changes
- **Voter results page (`+layout.svelte`)** — alliances tab/surface already exists per ROADMAP context; Phase 67 only populates data through it
- **`@openvaa/matching` Alliance handling** — already implemented per `data` package; Phase 67 verifies via UI smoke (D-03)
- **`@openvaa/filters` Alliance entity-type switches** — already implemented per `data` package; Phase 67 verifies via UI smoke (D-03)

</code_context>

<specifics>
## Specific Ideas

- **2 alliances, not 3** (D-01) — cleaner UI demo + 2 standalone parties exercises the no-alliance UI path
- **Alliance member groupings by color/name affinity** (D-01):
  - L (Left): SDU (red) + RF (dark red) + GW (green/teal) — labor + green-progressive cluster
  - R (Right): BC (blue) + VC (purple) + RA (dark green) — establishment + values cluster
  - Standalone: PM (orange — populist) + CP (light blue — regional) — neither bloc fits cleanly
- **Same alliances in every constituency** (D-02) — 10 alliance noms total; max reverse-fill exercise
- **NO real Finnish coalition names** (D-58-01 rule) — invented neutral names like `Progressive Front` / `Conservative Bloc`
- **Manual UI smoke is sufficient validation** (D-03) — explicitly NO new unit tests in matching/filters; existing abstract tests cover entity-type handling
- **`alliances-override.ts` is a NEW file** — flag for the planner so the file is created, not edited

</specifics>

<deferred>
## Deferred Ideas

- **Programmatic alliance grouping via latent-factor clusters** — explicit reject in D-01. Captured as a future option if alliance-shape needs to scale beyond the default seed (e.g., a new template with 30 parties).
- **Per-constituency alliance variation** (some alliances absent in some constituencies) — explicit reject in D-02. Future test scenario if regional-alliance UI surfaces emerge.
- **Adding alliances to the `e2e` template** — out of v2.7 scope. e2e template stays minimal for fast Playwright runs; alliance-specific E2E tests would be a separate milestone.
- **New unit tests in `@openvaa/matching` / `@openvaa/filters`** for Alliance handling — explicit reject in D-03. Revisit if Phase 67 UI smoke surfaces a runtime bug in either package.
- **Faction seeding** — explicit reject in D-05 Claude's discretion. `factions` table stays empty; alliances are the in-scope grouping surface.
- **Alliance latent-factor positions** — alliances don't have "answers" in the matching sense; their position is derived from member-party positions. No latent override needed.
- **Multi-alliance party membership** — current data model assumes a party belongs to ≤1 alliance. If multi-membership emerges as a real-world case, schema + adapter changes are a separate milestone.

### Reviewed Todos (not folded)

- None — Phase 67 scope is precisely the alliance-seeding todo. No additional pending todos surfaced as in-scope during scout.

</deferred>

---

*Phase: 67-default-seed-alliances*
*Context gathered: 2026-04-29*
