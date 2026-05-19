# Phase 67: Default Seed Alliances - Research

**Researched:** 2026-04-30
**Domain:** dev-seed authoring (`@openvaa/dev-seed`) — adding hand-authored Alliance entities + AllianceNomination rows to the default template; verifying the v2.6 P64 supabase-adapter alliance reverse-fill is empirically exercised end-to-end
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01: Hand-authored 2 alliances; 6 of 8 parties grouped; 2 parties standalone.**
  - **Alliance L:** `{party_social, party_red, party_green}` (SDU, RF, GW) — Left bloc
  - **Alliance R:** `{party_blue, party_values, party_rural}` (BC, VC, RA) — Right bloc
  - **Standalone:** `party_people` (PM), `party_coast` (CP) — no alliance membership; exercises the party-without-alliance UI path

- **D-02: Same alliances in every constituency.** Both Alliance L and Alliance R get an `alliance_nomination` in all 5 constituencies (`c_01` through `c_05`). Total: **10 alliance nominations** (2 alliances × 5 constituencies). Each alliance nomination links to the party `organization_nomination`s for that constituency. Maximum exercise of the v2.6 P64 reverse-fill code path. Final nomination count: 327 candidate noms + 40 org noms + 10 alliance noms = **377 nominations**.

- **D-03: Manual UI smoke + adapter sanity check; no new unit tests.**
  - **UI smoke:** `yarn dev:reset-with-data && yarn dev` → navigate voter app → verify alliances tab populated on results page → filter/group by alliance works → no empty-tab dev-blind state
  - **Adapter sanity:** during seed pipeline run, log `organizationNominationIds` on each Alliance parent (or assert via a small script post-seed). Confirms the previously dev-blind v2.6 P64 reverse-fill path now returns non-empty arrays.
  - **No new unit tests** in `@openvaa/matching` or `@openvaa/filters`.

- **D-04: Invented neutral names; 4-locale generation.**
  - Alliance L name: `{ en: 'Progressive Front' }` (planner refines)
  - Alliance R name: `{ en: 'Conservative Bloc' }` (planner refines)
  - Short names: `{ en: 'PF' }` / `{ en: 'CB' }` (or planner's call)
  - Color: planner picks; suggest blended/neutral hues distinct from member parties
  - Per existing `defaultTemplate.generateTranslationsForAllLocales: true`, EN-only `name` blocks auto-translate to 4 locales at seed time
  - External IDs: `seed_alliance_L` and `seed_alliance_R` (or planner's call following `seed_party_*` pattern)
  - **NO real-world Finnish coalition names** (D-58-01 rule)

- **D-05: 2 plans (per ROADMAP).** Suggested:
  - Plan 67-01: Seed authoring
  - Plan 67-02: Validation + UI smoke
  - Sequential; no parallelism opportunities.

### Claude's Discretion

- Exact alliance names + short names + colors (D-04)
- Exact shape of `alliances-override.ts` — mirror `nominations-override.ts` patterns
- How to wire the override into `defaultOverrides` — likely `alliances: alliancesOverride` alongside the existing `candidates`, `nominations`, `questions` keys; if `Overrides` type doesn't yet have an `alliances` field, planner extends it (small TS change)
- Whether to seed `factions` — explicit NO; alliances are the in-scope surface; factions stay empty
- Adapter sanity check implementation form — script in `packages/dev-seed/scripts/`, console.log gated on `NODE_ENV === 'development'`, or manual SQL query

### Deferred Ideas (OUT OF SCOPE)

- Programmatic alliance grouping via latent-factor clusters
- Per-constituency alliance variation (some alliances absent in some constituencies)
- Adding alliances to the `e2e` template
- New unit tests in `@openvaa/matching` / `@openvaa/filters` for Alliance handling
- Faction seeding — `factions` table stays empty
- Alliance latent-factor positions (alliances don't have answers; their position is derived from member-party positions)
- Multi-alliance party membership

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEED-01 | Alliances are present in the default seed. After `yarn dev:reset-with-data`, the default voter flow shows a populated alliances surface. The default template emits ~2-3 alliances grouping subsets of the existing 8 parties into named coalitions, and `alliance_nominations` link the contributing party nominations. The supabase adapter reverse-fill of `organizationNominationIds` on alliance parents (the v2.6 P64 path that was previously dev-blind) is empirically exercised. `@openvaa/matching` and `@openvaa/filters` handle alliances correctly with seeded data. | §Authoring Shape (concrete row types), §Override Wiring (the 1-line `default.ts` change + possible `Overrides` extension), §Alliance↔OrganizationNomination Relationship (parent_nomination wiring), §Adapter Sanity-Check Options (forms the planner can pick), §Validation Architecture (manual UI smoke + parity gate), §Risks/Landmines (results.sections type-widening required) |

</phase_requirements>

## Summary

Phase 67 is a tightly-scoped dev-seed authoring task: add 2 hand-authored Alliance entities and 10 alliance nominations (2 alliances × 5 constituencies) to the existing default template, then verify the v2.6 Phase 64 supabase-adapter reverse-fill of `organizationNominationIds` on Alliance parents is empirically exercised end-to-end (it has been implemented but never run against real seeded alliance data). Exactly 2 plans per D-05.

The seed authoring follows an established pattern: a new `packages/dev-seed/src/templates/defaults/alliances-override.ts` mirrors the existing `nominations-override.ts` shape, exporting an `alliancesOverride` function wired into `defaultOverrides.alliances` in `default.ts`. The `Overrides` type at `packages/dev-seed/src/types.ts:46-48` is **already permissive** (`{ [table: string]: ... }`) — no type extension is needed. Pipeline TOPO_ORDER (`pipeline.ts:76-91`) runs `alliances` AFTER `organizations` and BEFORE `nominations`, which is the correct order: alliance entities are emitted first, then the existing `nominations-override.ts` (or a separate alliance-noms section) emits the 10 alliance nominations linking those alliances to organization-nomination parents per the supabase schema's hierarchy rules (`alliance → no parent`; `organization → parent: alliance (or none)`).

Two **critical landmines** the planner must address:

1. **`appSettings.results.sections` excludes 'alliance' by default.** `dynamicSettings.ts:66` defaults `sections: ['candidate', 'organization']`, and the type at `dynamicSettings.type.ts:222` is literally `Array<typeof ENTITY_TYPE.Candidate | typeof ENTITY_TYPE.Organization>` — Alliance is NOT in the union. The voter `nominationAndQuestionStore` reads from `appSettings.results.sections` (`voterContext.svelte.ts:326`), so even if alliance entities + nominations exist in the DB, **no alliance tab will appear** unless either (a) the default seed's `app_settings.settings.results.sections` is set to `['candidate', 'organization', 'alliance']` AND the type is widened, or (b) the planner discovers an alternate UI surface (statistics page, side panel) that surfaces alliances independently of the tab. Phase 67 must resolve this — likely path (a) with a small type widening in `@openvaa/app-shared`.

2. **The data layer's `AllianceNomination` constructor (`allianceNomination.ts:29-63`) auto-populates `organizationNominationIds` ONLY when nominations arrive in the nested `data.organizations: Array<NestedNomination<...>>` form** — but the supabase adapter's flat-row pipeline returns alliance noms with `parentNominationId` set on the org-noms (children pointing up), NOT with nested `organizations`. Hence the v2.6 P64 reverse-fill at `supabaseDataProvider.ts:391-405` is the ONLY path that populates `organizationNominationIds` on Alliance-parent rows. Phase 67's dev-seed step writes `alliance_nominations` rows + `organization_nominations` rows with `parent_nomination_id` pointing to the alliance noms (mirroring how `nominations-override.ts:182-194` already wires candidate→org). The reverse-fill exercise is automatic once that wiring is in place.

**Primary recommendation:** Plan 67-01 creates `alliances-override.ts` emitting both Alliance entities (alliance table) and AllianceNomination rows (nominations table with `alliance: { external_id }` polymorphic ref); modifies `nominations-override.ts` to set `parent_nomination` on the relevant org-nom rows pointing to the alliance noms (or emits the alliance noms inside `alliancesOverride` and lets `nominations-override.ts` retroactively set `parent_nomination` on org-noms — planner picks). Updates `default.ts` `app_settings.settings.results.sections` to include `'alliance'` AND widens the `dynamicSettings.type.ts:222` union to include `typeof ENTITY_TYPE.Alliance`. Plan 67-02 runs `yarn dev:reset-with-data && yarn dev`, executes the 6-step UI smoke checklist below, and runs an adapter sanity check (recommended: a small standalone script in `packages/dev-seed/scripts/sanity-alliances.ts` that queries `nominations` for the 2 alliance noms × 5 constituencies and verifies parent-child relationships in the DB).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Hand-author Alliance entity rows | dev-seed authoring (`@openvaa/dev-seed`) | — | Uses the established `fixed[] + count: 0` override pattern; runs in TOPO_ORDER position 7 (after organizations, before factions) |
| Hand-author AllianceNomination rows | dev-seed authoring (`@openvaa/dev-seed`) | — | nominations table is polymorphic (4 entity refs); alliance nom rows use `alliance: { external_id }` ref shape per `NominationsGenerator.ts:72`. NOT auto-emitted by any built-in generator (Phase 56 `NominationsGenerator` is candidate-only); user-supplied via `fixed[]` or override |
| Wire AllianceNomination ↔ OrganizationNomination parent-child edge | dev-seed authoring (`@openvaa/dev-seed`) | DB schema (validate_nomination trigger) | Per `104-nominations.sql:7` and `011-validation-functions.sql:264-268`, `organization → parent: alliance (or none)`. Schema enforces the relationship; dev-seed emits org noms with `parent_nomination: { external_id: alliance_nom_extid }` |
| Reverse-fill `organizationNominationIds` on Alliance parents | apps/frontend supabase adapter (READ-ONLY this phase) | `@openvaa/data` | Implemented at `supabaseDataProvider.ts:391-405`. Phase 67 EXERCISES this code path; does not modify it |
| Surface alliance tab in voter results | apps/frontend voter results route | `@openvaa/app-shared` (settings type widening) | `entityTabs` derives from `Object.keys(voterCtx.matches[electionId])` (`+layout.svelte:127`). matches map keys derive from `appSettings.results.sections` (`voterContext.svelte.ts:326`). If 'alliance' is not in sections, no tab |
| Filter handling for Alliance entity-type | `@openvaa/filters` (READ-ONLY this phase) | apps/frontend filterStore | `filterStore.svelte.ts:41` already special-cases Alliance to skip parent-filter wiring (alliances don't have parents). No code changes needed |
| Match-tree handling for Alliance entity-type | `@openvaa/matching` (READ-ONLY this phase) | apps/frontend matchStore | `matchStore.svelte.ts:65` does NOT special-case Alliance for parent imputation (only Organization + Faction). Alliances iterate without proxy injection — they match on their own answers (which alliances typically don't have, so the algorithm returns the nominations unchanged when `numAnswers < minAns`). Empirically verifiable via UI smoke |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@openvaa/dev-seed` | workspace:^ | The package being modified — authoring layer for hand-authored seed templates | Sole canonical authoring path per `STATE.md` Decisions §"@openvaa/dev-seed is the canonical data path" [VERIFIED: read packages/dev-seed/src/templates/default.ts:1-252] |
| `@openvaa/data` | workspace:^ (v0.1.0) | Source of `Alliance`, `AllianceNomination`, `AllianceNominationData`, `ENTITY_TYPE.Alliance`, `OBJECT_TYPE.Alliance/AllianceNomination` types and runtime values | Already imported by adapter + used throughout `@openvaa/dev-seed`; no new dependency [VERIFIED: read packages/data/src/objects/entities/variants/alliance.ts + alliance.type.ts + objects/nominations/variants/allianceNomination.ts + allianceNomination.type.ts + objects/entities/base/entityTypes.ts] |
| `@openvaa/supabase-types` | workspace:^ (v0.1.0) | `TablesInsert<'alliances'>`, `TablesInsert<'nominations'>` row shapes for the override emission | Already imported by all override files; no new dependency [VERIFIED: read packages/dev-seed/src/templates/defaults/nominations-override.ts:39 + candidates-override.ts:36] |
| `@openvaa/app-shared` | workspace:^ | Source of `staticSettings.supportedLocales` + `dynamicSettings.results.sections` defaults; type-widening target if 'alliance' added to sections union | Already a workspace dep of frontend [VERIFIED: read packages/app-shared/src/settings/dynamicSettings.ts:66 + dynamicSettings.type.ts:222] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@faker-js/faker` | ^10.4.0 [VERIFIED: npm view 2026-04-30] | Locale-fan-out fakery for missing locales | NOT needed in `alliances-override.ts` — alliance authoring uses `{ en: '...' }` blocks and `generateTranslationsForAllLocales: true` mirrors the EN value to fi/sv/da. Avoid faker for hand-authored entities (per `locales.ts:182` mirror-en convention) |
| Vitest | (project's `vitest.config.ts`) | Unit-test framework | NOT used this phase per D-03 (no new unit tests) |
| Playwright | (project's `tests/playwright.config.ts`) | E2E parity gate at HEAD `2c7ad2dea` (v2.6 anchor) | Re-run as the phase gate; constants NOT regenerated (Phase 64 did the canonical regeneration) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-authored `alliances-override.ts` (override pattern) | Pure `defaultTemplate.alliances.fixed[]` block in `default.ts` (no override file) | The `fixed[]`-only path works for the alliance entities themselves (mirrors `organizations.fixed[]` at `default.ts:86-154`), but emitting **alliance NOMINATIONS** for every constituency requires iterating `ctx.refs.constituencies × 2 alliances` — that's a generator/override loop, not a static fixed array. The override file is the natural home; the entity rows can also live there for cohesion. Alternatively: alliance entities in `default.ts` `alliances: { count: 0, fixed: [...] }`, alliance noms emitted from `nominations-override.ts` (extending the existing override). Planner picks; CONTEXT D-05's "create `alliances-override.ts` as the new file" framing implies the override-file path |
| Wire alliance nom parent → org nom (org as parent of alliance) | Wire org nom parent → alliance nom (alliance as parent of org) | The supabase schema dictates the second form: `organization → parent: alliance (or none)` per `104-nominations.sql:7-10` and `011-validation-functions.sql:264-272`. Alliance noms have NO parent. The planner MUST emit alliance noms first (no parent), THEN org noms with `parent_nomination: { external_id: alliance_nom_extid }`. **This requires modifying `nominations-override.ts`** to retroactively set `parent_nomination` on the org noms whose party belongs to one of the 2 alliances |
| Adapter sanity-check via `console.log` in the supabase adapter | Standalone script in `packages/dev-seed/scripts/` | Console-log path requires gating on `process.env.NODE_ENV === 'development'`, ships dev-only code in the production adapter file (smell), and surfaces the diagnostic only during voter app browse (not at seed time). A standalone script (`packages/dev-seed/scripts/sanity-alliances.ts`) runs once after `yarn dev:reset-with-data`, queries the supabase REST API or the local Postgres directly, asserts the 10 alliance nominations exist with correct parent-child wiring, and exits non-zero on failure. Lightest, most auditable form. **Recommended.** Existing `packages/dev-seed/scripts/download-portraits.ts` is a proven precedent for one-off scripts in this directory [VERIFIED: ls packages/dev-seed/scripts/] |

**Installation:**
```bash
# No new dependencies. Phase 67 reuses existing workspace dependencies.
```

**Version verification:**
```bash
npm view @faker-js/faker version  # 10.4.0 [VERIFIED 2026-04-30]
npm view svelte version            # 5.55.5 [VERIFIED 2026-04-30]
```

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│ Phase 67: Default Seed Alliances — Data Flow                        │
└─────────────────────────────────────────────────────────────────────┘

  AUTHORING                          PIPELINE                  WRITER
  ─────────                          ────────                  ──────

  default.ts                         runPipeline(template,     SupabaseAdminClient
  ├─ alliances: {} (or fixed[])      overrides)                .bulkImport(rows)
  ├─ organizations.fixed[] (8)       │                         │
  ├─ constituencies.fixed[] (5)      │  TOPO_ORDER             │  ↓
  └─ app_settings.fixed[]            │   1. accounts           │  bulk_import RPC
       └─ results.sections:          │   2. projects           │   ├─ resolves
          ['candidate',              │   3. elections          │   │  external_id
           'organization',           │   4. constituency_groups│   │  refs → FK ids
           'alliance']  ◄── NEW      │   5. constituencies     │   ├─ inserts
                                     │   6. organizations      │   │  alliances rows
  defaults/alliances-override.ts     │   7. alliances ◄── HERE │   ├─ inserts
  ├─ ALLIANCE_MEMBERSHIP_MATRIX      │      (emits 2 entities) │   │  nominations rows
  │   {L:[social,red,green],        │   8. factions           │   │  (10 alliance
  │    R:[blue,values,rural]}        │   9. question_categories│   │   + 40 org
  └─ alliancesOverride               │  10. questions          │   │   + 327 cand)
       (alliance ENTITIES + 10       │  11. candidates         │   └─ validates via
        AllianceNomination rows)     │  12. nominations ◄── HERE  validate_nomination
                                     │      (emits org noms     │     trigger
  defaults/nominations-override.ts   │       w/ parent_nomination
  ├─ org-noms wired with             │       to alliance noms   │
  │  parent_nomination ref to        │       per matrix)        │
  │  alliance noms                   │  13. app_settings        │
  └─ candidate-noms unchanged        │  14. feedback            │
                                     │                          ▼

  RUNTIME                            SUPABASE ADAPTER         VOTER RESULTS UI
  ───────                            ────────────────         ────────────────

  yarn dev                           supabaseDataProvider     +layout.svelte
  └─ frontend opens                  ._getNominationData()    ├─ entityTabs ←
                                     │                        │  Object.keys(matches)
                                     │  get_nominations RPC   │
                                     │  (joins all 4 entity   │  ALLIANCE TAB
                                     │   tables)              │  (only if
                                     │                        │   results.sections
                                     │  ↓                     │   includes
                                     │                        │   'alliance')
                                     │  Reverse-fill pass     │
                                     │  (lines 365-406)       └─ EntityListWith
                                     │   ├─ index by              Controls
                                     │   │  parentNominationId   (alliance items
                                     │   ├─ for parent w/         render w/ member
                                     │   │  entityType            party labels)
                                     │   │  === Alliance:
                                     │   │  set
                                     │   │  organizationNominationIds
                                     │   │  ◄── EXERCISED
                                     │   │  EMPIRICALLY HERE
                                     │   └─ Alliance.organizations
                                     │      now non-empty
                                     ▼
```

### Recommended Project Structure

```
packages/dev-seed/src/templates/
├── default.ts                        # MODIFY: wire alliances override + sections
├── defaults/
│   ├── alliances-override.ts         # NEW: alliance entity + nom emission
│   ├── candidates-override.ts        # unchanged
│   ├── nominations-override.ts       # MODIFY: set parent_nomination on org noms
│   └── questions-override.ts         # unchanged
└── e2e.ts                            # unchanged (alliances NOT added per D-05)

packages/dev-seed/scripts/
├── download-portraits.ts             # unchanged precedent
└── sanity-alliances.ts               # NEW (recommended): sanity-check script

packages/app-shared/src/settings/
└── dynamicSettings.type.ts           # MODIFY (small): widen sections union

apps/supabase/                        # READ-ONLY (schema unchanged)
apps/frontend/                        # READ-ONLY (adapter + voter UI unchanged)
```

### Pattern 1: Override file shape (mirroring `nominations-override.ts`)

**What:** A single exported function `(fragment: unknown, ctx: Ctx) => Array<Record<string, unknown>>` matching the `Overrides[table]` signature (types.ts:46-48). Receives the merged fragment + the per-pipeline-run `Ctx` (faker, projectId, externalIdPrefix, refs to upstream entities including `ctx.refs.organizations` and `ctx.refs.constituencies`).

**When to use:** Any time a template needs more than `count: N + fixed[]` can express. Phase 67 needs 10 alliance noms emitted across 5 constituencies × 2 alliances — that's a loop, hence an override.

**Example:**
```typescript
// Source: packages/dev-seed/src/templates/defaults/nominations-override.ts:93-203 (proven pattern)

import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx } from '../../types';

// Map alliance L/R → member party external_ids
export const ALLIANCE_MEMBERSHIP: Record<string, ReadonlyArray<string>> = {
  alliance_L: ['party_social', 'party_red', 'party_green'],
  alliance_R: ['party_blue', 'party_values', 'party_rural']
} as const;

// Authoring shape for the alliance ENTITY rows (table: alliances)
type AllianceEntityRow = Partial<TablesInsert<'alliances'>> & { external_id: string };

// Authoring shape for the alliance NOMINATION rows (table: nominations,
// polymorphic alliance_id branch). election + constituency are external_id
// refs that bulk_import resolves to FK uuids; alliance_id likewise.
type AllianceNominationRow = Omit<TablesInsert<'nominations'>, 'election_id' | 'constituency_id'> & {
  alliance: { external_id: string };
  election: { external_id: string };
  constituency: { external_id: string };
};

export function alliancesOverride(_fragment: unknown, ctx: Ctx): Array<Record<string, unknown>> {
  const { projectId, externalIdPrefix, refs } = ctx;
  // Iterate over Alliance L/R, emit one entity row each
  // (planner: refs.alliances is empty here — populated AFTER this override runs.
  //  refs.organizations / refs.constituencies / refs.elections ARE populated)
  // ...
  return rows;
}
```

### Pattern 2: Polymorphic nomination row (alliance ref)

**What:** The `nominations` table CHECK constraint requires exactly ONE of `{candidate_id, organization_id, faction_id, alliance_id}` to be non-null. For alliance nominations, the override emits the `alliance: { external_id }` ref shape; `bulk_import.resolve_external_ref` converts it to `alliance_id` UUID at write time.

**When to use:** Whenever emitting an alliance-type nomination.

**Example:**
```typescript
// Source: packages/dev-seed/src/generators/NominationsGenerator.ts:67-83
// Schema: apps/supabase/supabase/schema/104-nominations.sql:30-53
//   CHECK (num_nonnulls(candidate_id, organization_id, faction_id, alliance_id) = 1)

const allianceNomRow = {
  external_id: `${externalIdPrefix}nom_alliance_L_${constituencyExtId}`,
  project_id: projectId,
  alliance: { external_id: `${externalIdPrefix}alliance_L` },  // polymorphic ref
  election: { external_id: electionExtId },
  constituency: { external_id: constituencyExtId },
  election_round: 1
  // NO parent_nomination — alliances cannot have parents (validate_nomination trigger)
};
```

### Pattern 3: parent_nomination wiring for org→alliance edge

**What:** The schema enforces `organization → parent: alliance (or none)`. To populate `organizationNominationIds` on Alliance parents during the supabase adapter's reverse-fill, the org-nom rows whose party belongs to an alliance must set `parent_nomination: { external_id: alliance_nom_extid }`.

**When to use:** When extending `nominations-override.ts` to wire org-noms to their alliance parents.

**Example:**
```typescript
// Source: nominations-override.ts:160-168 (existing org-nom emission, modified)
// + 011-validation-functions.sql:264-272 (validate_nomination trigger contract)

const orgPartyExtId = organizations[p].external_id;
const allianceForParty = findAllianceForParty(orgPartyExtId);  // returns 'alliance_L' | 'alliance_R' | undefined
const constituencyExtId = constituencies[c].external_id;

rows.push({
  external_id: orgNomExtId(p, c),
  project_id: projectId,
  organization: { external_id: orgPartyExtId },
  election: { external_id: electionExtId },
  constituency: { external_id: constituencyExtId },
  election_round: 1,
  // Phase 67: wire alliance parent if the party belongs to one
  ...(allianceForParty
    ? { parent_nomination: { external_id: `${externalIdPrefix}nom_alliance_${allianceForParty.split('_')[1]}_${constituencyExtId}` } }
    : {})
});
```

### Anti-Patterns to Avoid

- **Inventing real Finnish coalition names** (`Punavihreä yhteistyö`, `Porvarihallitus`): D-58-01 forbids encoding real political positions or names.
- **Setting `data.organizations: Array<NestedNomination<...>>` in the dev-seed payload**: The data layer's `AllianceNomination` constructor (allianceNomination.ts:29-63) auto-populates `organizationNominationIds` from this nested form, but supabase ingest doesn't traverse it — the supabase row form is FLAT (parent_nomination_id on the org-nom side). The reverse-fill at `supabaseDataProvider.ts:391-405` exists precisely because the flat form is canonical for this codebase. Don't try to use the nested form in dev-seed.
- **Adding faction noms** (factions table stays empty per D-05 Claude's discretion). The validate_nomination trigger requires `faction → parent: organization`, which would compound complexity for zero in-scope value.
- **Using faker to generate alliance names** (`faker.word.adjective()` style): the existing `AlliancesGenerator.ts:43-48` does exactly this for `count: N` synthetic emission. For hand-authored alliances per D-04, use literal `{ en: 'Progressive Front' }` and let `fanOutLocales` mirror the EN value (per `locales.ts:182` "prefer mirroring an existing `en` value to missing locales over emitting faker noise").
- **Hardcoding the ENTITY_TYPE union literal `Array<typeof ENTITY_TYPE.Candidate | typeof ENTITY_TYPE.Organization>`** in the dynamicSettings.type.ts widening — instead use `Array<EntityType>` filtered to `Candidate | Organization | Alliance` (same shape, narrower than full `EntityType`), keeping the door open for Faction in a future phase without another type widening.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Resolving `external_id` refs to UUIDs | Pre-write SELECT-then-INSERT loop | `bulk_import` RPC's `resolve_external_ref` (auto-converts `{ external_id: "x" }` polymorphic ref objects to FK ids at write time) | Established pattern in every existing override; supabaseAdminClient already routes through `bulk_import` |
| Mirroring EN-only locale strings to fi/sv/da | Manual `{ en: '...', fi: '...', sv: '...', da: '...' }` blocks per alliance | `generateTranslationsForAllLocales: true` (already set in `defaultTemplate`) — `fanOutLocales` mirrors EN value to all 4 locales [VERIFIED: locales.ts:182 "prefer mirroring an existing `en` value"] | Already wired; gives 4-locale coverage for free; D-04 explicit |
| Asserting parent_nomination consistency (election + constituency match) | Client-side validation in alliancesOverride | DB-side `validate_nomination` trigger (`011-validation-functions.sql:264-272`) | Trigger enforces `parent.election_id == child.election_id AND parent.constituency_id == child.constituency_id`; raises EXCEPTION at INSERT time. Catch errors at the bulk_import boundary, don't pre-validate in JS |
| Reverse-filling `organizationNominationIds` on Alliance objects in `@openvaa/data` | A new constructor branch or post-init pass | The supabase adapter's reverse-fill at `supabaseDataProvider.ts:391-405` (already implemented) | Phase 67 EXERCISES this code path; doesn't change it. Don't touch the adapter |
| Surfacing alliance tab in voter results | New tab logic in `+layout.svelte` | `appSettings.results.sections` driving `entityTabs` derivation (already wired at `voterContext.svelte.ts:326` + `+layout.svelte:127`) | Add `'alliance'` to `sections` array; the existing tab derivation picks it up automatically |
| Sanity-check script DB connectivity | New supabase client setup | Reuse `SupabaseAdminClient` from `@openvaa/dev-seed` (or the read-client pattern from the integration test at `tests/integration/default-template.integration.test.ts:54-62`) | Proven pattern; service-role key available locally |

**Key insight:** Phase 67 is almost entirely about wiring existing primitives correctly. Every required code path already exists; the phase work is composing them. The two non-trivial widenings — `dynamicSettings.type.ts` (1 line) and `app_settings.settings.results.sections` in the seed payload (1 array element) — unlock the surface.

## Runtime State Inventory

> Phase 67 is a greenfield seed-data emission, not a rename/refactor. No existing runtime state needs migration. Listing categories explicitly per protocol:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — `yarn dev:reset` drops & recreates the DB before seeding; no carryover from prior seed runs that would conflict | None |
| Live service config | None — Supabase config is in git; no dashboard-only config | None |
| OS-registered state | None — no scheduled tasks, daemons, or registered services touch alliance data | None |
| Secrets/env vars | None — no new secrets; existing `SUPABASE_SERVICE_ROLE_KEY` used by sanity-check script (already configured) | None |
| Build artifacts | None — adding a new TS file under `packages/dev-seed/src/templates/defaults/` rebuilds via Turborepo cache automatically; no stale artifacts | Verify `yarn build --filter=@openvaa/dev-seed` succeeds before running pipeline |

## Common Pitfalls

### Pitfall 1: Adding alliances to seed but no tab appears in voter UI

**What goes wrong:** Alliance entities + 10 alliance noms land in the DB; supabase adapter reverse-fill populates `organizationNominationIds` correctly; **but the voter results page still shows only Candidates + Organizations tabs** — no Alliance tab.

**Why it happens:** `voterContext.svelte.ts:326` reads `entityTypes` from `appSettingsState.current.results?.sections ?? []`. Default is `['candidate', 'organization']` per `dynamicSettings.ts:66`. The `nominationAndQuestionStore` only includes entries for entity types in `entityTypes`. The `matchStore` derives keys from the `nominationAndQuestionStore` tree. The `+layout.svelte:127` `entityTabs` derives from `Object.keys(matches[electionId])`. So if 'alliance' is not in `sections`, it's not in `entityTypes`, not in the tree, not in matches, not in tabs.

**How to avoid:** Phase 67 MUST update the default seed's `app_settings.settings`:
```typescript
// default.ts app_settings.fixed[0].settings — ADD this block
results: {
  sections: ['candidate', 'organization', 'alliance']
}
```
AND widen the type at `packages/app-shared/src/settings/dynamicSettings.type.ts:222`:
```typescript
sections: Array<typeof ENTITY_TYPE.Candidate | typeof ENTITY_TYPE.Organization | typeof ENTITY_TYPE.Alliance>;
```

**Warning signs:** UI smoke shows only 2 tabs (Candidates + Organizations) even with seeded alliances. SQL `SELECT count(*) FROM nominations WHERE alliance_id IS NOT NULL` returns 10 but UI is blind. `voterCtx.matches['<electionId>']` in browser devtools has no `alliance` key.

### Pitfall 2: validate_nomination trigger raises EXCEPTION on alliance nom INSERT

**What goes wrong:** `bulk_import` raises `Alliance nominations cannot have a parent` (per `011-validation-functions.sql:265`).

**Why it happens:** The override accidentally sets `parent_nomination: { ... }` on alliance-type rows (e.g., a copy-paste from the org-nom emission code).

**How to avoid:** Alliance nom rows must have `parent_nomination` UNSET (undefined or absent from the row literal). Only org-noms (whose party belongs to an alliance) set `parent_nomination` pointing to the alliance nom.

**Warning signs:** `bulkImport failed: Alliance nominations cannot have a parent` thrown at pipeline runtime. Check the override's emitted rows for spurious `parent_nomination` keys on alliance-id rows.

### Pitfall 3: Parent-child election/constituency mismatch

**What goes wrong:** `bulk_import` raises a parent-consistency exception per `011-validation-functions.sql` (rows 360-373 of 104-nominations.sql noted "enforced by trigger").

**Why it happens:** The org-nom row's `election_id`/`constituency_id` doesn't match its `parent_nomination`'s alliance-nom row. E.g., org-nom in `c_01` points at alliance-nom in `c_02`.

**How to avoid:** When wiring `parent_nomination`, the alliance-nom external_id MUST be constituency-specific. Phase 67's external_id naming convention should be:
```
seed_nom_alliance_L_c_01, seed_nom_alliance_L_c_02, ..., seed_nom_alliance_L_c_05
seed_nom_alliance_R_c_01, ..., seed_nom_alliance_R_c_05
```
Then the org-nom for `party_social` in `c_03` references `seed_nom_alliance_L_c_03` — NOT `seed_nom_alliance_L_c_01`.

**Warning signs:** `Parent and child nominations must share election_id` exception. Inspect `nom_alliance_*` external_ids in the override's emitted rows — every alliance nom must be named with its constituency external_id suffix.

### Pitfall 4: Empty `organizationNominationIds` on Alliance parents (the dev-blind path's first failure mode)

**What goes wrong:** Alliance entities exist in the DB; alliance noms exist; org noms exist with `parent_nomination_id` set; but `Alliance.organizations` (which calls `nominations.map(n => n.organizationNominations.map(...))`) returns an empty array — and `OrganizationNominations.map` throws `DataNotFoundError('No organizations provided.')` per `allianceNomination.ts:80`.

**Why it happens:** The supabase adapter's reverse-fill at `supabaseDataProvider.ts:391-405` only writes `organizationNominationIds` on a parent IF the parent has children pointing to it via `parent_nomination_id` AND the parent's `entityType === ENTITY_TYPE.Alliance`. If the org-noms' `parent_nomination_id` got dropped during INSERT (e.g., schema validator silently nullified it), or if the alliance noms were filtered out of the get_nominations RPC's return set (e.g., RPC scopes by `electionId + constituencyId` and the alliance nom is in a different constituency than the org nom), the reverse-fill does nothing.

**How to avoid:** The sanity-check script (D-03) should query both:
1. `SELECT id, alliance_id, parent_nomination_id FROM nominations WHERE alliance_id IS NOT NULL` — expect 10 rows, all with `parent_nomination_id IS NULL`.
2. `SELECT id, organization_id, parent_nomination_id FROM nominations WHERE organization_id IS NOT NULL AND parent_nomination_id IS NOT NULL` — expect 30 rows (6 of 8 parties × 5 constituencies = 30; PM + CP get 0 since they're standalone), each `parent_nomination_id` matching one of the 10 alliance-nom ids in the same constituency.

**Warning signs:** UI alliance tab shows the 2 alliances but clicking either renders an empty member list. Browser console: `DataNotFoundError: No organizations provided.` from `allianceNomination.ts:80`.

### Pitfall 5: `Override` type narrows incorrectly when adding `alliances` field

**What goes wrong:** Planner thinks `Overrides` is per-table-typed and tries to extend it with a narrow `alliances?: AlliancesOverrideFn` field.

**Why it happens:** Reading the file too quickly. The Override type at `types.ts:46-48` is **already permissive**:
```typescript
export type Overrides = {
  [table: string]: (fragment: unknown, ctx: Ctx) => Array<Record<string, unknown>>;
};
```
It's an indexed type; any string key is valid. **No type extension is needed** — `defaultOverrides.alliances = alliancesOverride` Just Works.

**How to avoid:** Read `types.ts:39-48` carefully. The CONTEXT D-03 framing says "if the `Overrides` type doesn't yet have an `alliances` field, the planner extends it" — research confirms it does NOT need extension. The CONTEXT discretion is correctly hedged ("possibly modify"); the planner's task here is to NOT modify the type.

**Warning signs:** TypeScript errors like `Property 'alliances' does not exist on type 'Overrides'` would suggest extension is needed — they should NOT appear with the current `Overrides` shape.

### Pitfall 6: `count: 0` on alliances field forgotten — synthetic alliances bleed through

**What goes wrong:** Adding `alliancesOverride` but forgetting to set `alliances: { count: 0 }` (or omitting the field entirely) results in `AlliancesGenerator`'s `defaults({ count: 0 })` running first BUT the override REPLACES generator output (per `pipeline.ts:189` — `overrides[table]?.(fragment, ctx) ?? gen.generate(fragment)`). So this is actually fine in the override path. The pitfall is the OPPOSITE: if the planner declares `defaultTemplate.alliances = { count: 2, fixed: [...] }` (instead of the override-only path), the AlliancesGenerator would emit 2 SYNTHETIC alliances + the 2 fixed → 4 total. **Override path avoids this entirely.**

**Why it happens:** Confusing the override path (REPLACES generator) with the fixed[]+count path (ADDS to generator output).

**How to avoid:** Follow the established pattern (per `default.ts:248-252`) — wire the override into `defaultOverrides.alliances`. The override fully replaces the generator's emission. No `alliances: { count: ... }` block is needed in `defaultTemplate` itself (or set `count: 0`, harmless).

**Warning signs:** Sanity-check script reports 4 alliance entities + 4 alliance noms (plus 4×5 = 20 alliance noms) instead of 2 + 10. Inspect `defaultTemplate.alliances` for a stray `count: N` block.

## Code Examples

Verified patterns from official sources:

### Example 1: Alliance entity emission (mirrors `default.ts:86-154` organizations.fixed[])

```typescript
// Source: packages/dev-seed/src/templates/default.ts:86-154 (organizations.fixed[] proven pattern)
// Schema: apps/supabase/supabase/schema/102-entities.sql:72-86 (alliances table)

const ALLIANCE_ENTITY_ROWS = [
  {
    external_id: 'alliance_L',
    name: { en: 'Progressive Front' },          // planner-finalized name
    short_name: { en: 'PF' },                    // planner-finalized short
    color: { normal: '#3a4660', dark: '#7d8da0' },  // planner-picked dark slate
    sort_order: 0,
    is_generated: false
  },
  {
    external_id: 'alliance_R',
    name: { en: 'Conservative Bloc' },
    short_name: { en: 'CB' },
    color: { normal: '#5c4a3e', dark: '#a08c7e' },  // planner-picked dark gray-brown
    sort_order: 1,
    is_generated: false
  }
];
```

### Example 2: Alliance nomination emission (mirrors `nominations-override.ts:157-169` org-nom emission)

```typescript
// Source: packages/dev-seed/src/templates/defaults/nominations-override.ts:157-169 (org-nom proven pattern)
// Schema: apps/supabase/supabase/schema/104-nominations.sql:7-10 (alliance → no parent)
// Trigger: apps/supabase/supabase/schema/011-validation-functions.sql:264-265 ("Alliance nominations cannot have a parent")

const allianceNomExtId = (allianceKey: 'L' | 'R', constituencyExtId: string): string =>
  `${externalIdPrefix}nom_alliance_${allianceKey}_${constituencyExtId}`;

for (const allianceKey of ['L', 'R'] as const) {
  for (let c = 0; c < constituencies.length; c++) {
    const constExtId = constituencies[c].external_id;
    rows.push({
      external_id: allianceNomExtId(allianceKey, constExtId),
      project_id: projectId,
      alliance: { external_id: `${externalIdPrefix}alliance_${allianceKey}` },
      election: { external_id: electionExtId },
      constituency: { external_id: constExtId },
      election_round: 1
      // NO parent_nomination — alliances cannot have parents
    });
  }
}
// Total: 2 alliances × 5 constituencies = 10 alliance noms
```

### Example 3: Org-nom parent_nomination wiring (modify `nominations-override.ts:157-169`)

```typescript
// Source: packages/dev-seed/src/templates/defaults/nominations-override.ts:157-169 (existing org-nom block — modify)

const ALLIANCE_BY_PARTY: Record<string, 'L' | 'R' | undefined> = {
  party_social: 'L', party_red: 'L', party_green: 'L',
  party_blue: 'R',   party_values: 'R', party_rural: 'R',
  party_people: undefined,  // standalone — exercises no-alliance UI path
  party_coast: undefined
} as const;

for (let p = 0; p < PARTY_CONSTITUENCY_MATRIX.length; p++) {
  for (let c = 0; c < PARTY_CONSTITUENCY_MATRIX[p].length; c++) {
    if (PARTY_CONSTITUENCY_MATRIX[p][c] === 0) continue;
    const partyExtId = organizations[p].external_id.replace(externalIdPrefix, '');
    const allianceKey = ALLIANCE_BY_PARTY[partyExtId];
    const constExtId = constituencies[c].external_id;
    rows.push({
      external_id: orgNomExtId(p, c),
      project_id: projectId,
      organization: { external_id: organizations[p].external_id },
      election: { external_id: electionExtId },
      constituency: { external_id: constExtId },
      election_round: 1,
      // Phase 67: wire alliance parent if the party belongs to one
      ...(allianceKey
        ? { parent_nomination: { external_id: `${externalIdPrefix}nom_alliance_${allianceKey}_${constExtId}` } }
        : {})
    });
  }
}
// Result: 6 of 8 parties × 5 constituencies = 30 org-noms with parent_nomination set
//         2 of 8 parties × 5 constituencies = 10 standalone org-noms (PM + CP)
```

### Example 4: Adapter sanity-check script (recommended form)

```typescript
// File: packages/dev-seed/scripts/sanity-alliances.ts (NEW)
// Run: yarn workspace @openvaa/dev-seed tsx scripts/sanity-alliances.ts (after yarn dev:reset-with-data)
// Pattern: tests/integration/default-template.integration.test.ts:54-62 (read-client pattern)

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '<local default>';
const PROJECT_ID = '00000000-0000-0000-0000-000000000001';
const PREFIX = 'seed_';

const client = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function main(): Promise<void> {
  // 1. Verify 2 alliance entities exist
  const { data: alliances } = await client.from('alliances').select('id, external_id')
    .eq('project_id', PROJECT_ID).like('external_id', `${PREFIX}alliance_%`);
  if (alliances?.length !== 2) throw new Error(`Expected 2 alliances, got ${alliances?.length}`);

  // 2. Verify 10 alliance nominations exist (no parent)
  const { data: allianceNoms } = await client.from('nominations').select('id, alliance_id, parent_nomination_id, constituency_id')
    .eq('project_id', PROJECT_ID).not('alliance_id', 'is', null).like('external_id', `${PREFIX}%`);
  if (allianceNoms?.length !== 10) throw new Error(`Expected 10 alliance noms, got ${allianceNoms?.length}`);
  for (const nom of allianceNoms) {
    if (nom.parent_nomination_id !== null) throw new Error(`Alliance nom ${nom.id} has unexpected parent`);
  }

  // 3. Verify 30 org noms have parent_nomination set (6 of 8 parties × 5 constituencies)
  const { data: orgNomsWithParent } = await client.from('nominations').select('id, organization_id, parent_nomination_id')
    .eq('project_id', PROJECT_ID).not('organization_id', 'is', null).not('parent_nomination_id', 'is', null);
  if (orgNomsWithParent?.length !== 30)
    throw new Error(`Expected 30 org noms with parent (alliance), got ${orgNomsWithParent?.length}`);

  // 4. Verify each parent_nomination_id resolves to an alliance nom in the same constituency
  const allianceNomIds = new Set(allianceNoms.map((n) => n.id));
  for (const orgNom of orgNomsWithParent) {
    if (!allianceNomIds.has(orgNom.parent_nomination_id))
      throw new Error(`Org nom ${orgNom.id} has parent_nomination_id pointing outside alliance noms`);
  }

  console.log('✓ 2 alliances, 10 alliance noms, 30 org→alliance edges, all wired correctly');
}

main().catch((e) => { console.error(e); process.exit(1); });
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Generator-class-based emission for every table | D-25 override pattern (`(fragment, ctx) => rows[]`) replacing the generator wholesale | v2.5 Phase 56 (D-25/D-26 in pipeline.ts:189) | Phase 67 follows the override path — no new generator class for alliances; `alliancesOverride` REPLACES `AlliancesGenerator.generate()` |
| Polymorphic nominations had legacy "emit organization + candidate refs both, strip one server-side" workaround | Clean polymorphic ref emission — exactly ONE entity ref per row | v2.5 Phase 56 (RESEARCH §9, NominationsGenerator.ts:142-148) | Alliance nom rows emit ONLY `alliance: { external_id: ... }` — never combined with other refs |
| `AllianceNomination` constructor populates `organizationNominationIds` from nested `data.organizations` array | Supabase adapter reverse-fill from flat `parent_nomination_id` rows (since DB stores flat) | v2.6 Phase 64 Plan 01 (supabaseDataProvider.ts:365-406) | Phase 67 EXERCISES the reverse-fill code path empirically for the first time. No constructor changes |
| `dynamicSettings.results.sections` typed as `Array<Candidate \| Organization>` | (TBD by Phase 67 — widening to include `Alliance`) | Phase 67 (this phase) | Net new — surfaces alliance tab in voter results UI |

**Deprecated/outdated:**
- `multipleChoiceCategorical` question type — dropped from default template per `questions-override.ts:14-15` (still supported by latent emitter for custom templates). Not relevant to Phase 67 but cited so the planner doesn't regress this.

## Assumptions Log

> All claims in this research were verified against either source files (read directly), schema migrations (read directly), or npm registry (npm view). The table below is empty — no `[ASSUMED]` claims remain that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | — | — | — |

**All claims in this research were verified or cited — no user confirmation needed before planning.**

## Open Questions

1. **Should alliance entities be emitted with explicit colors, or omit color and let the UI fall back to a default?**
   - What we know: Existing 8 parties all have explicit `color: { normal, dark }` blocks per `default.ts:86-154`. The Alliance entity type extends DataObject which has optional `color: Colors | null` per `alliance.type.ts:6`. Frontend rendering may show a colored badge or border; without color, it likely falls back to a neutral theme color.
   - What's unclear: Whether the alliance UI surface shows colored badges (in which case planner picks distinct hues per D-04) or whether alliances inherit color from member parties (in which case omitting color is fine).
   - Recommendation: Per CONTEXT D-04, planner picks blended/neutral hues distinct from member parties. Default to providing colors. Verify visual outcome during Plan 67-02 UI smoke; adjust if needed.

2. **Should the dev-seed pipeline emit `info: { en: '...' }` blocks for alliances?**
   - What we know: Alliance entity supports `info` per the JSONB column in `alliances` table; localized fan-out covers it (`locales.ts:83`). 8 parties in default.ts do NOT set info.
   - What's unclear: Whether voter UI surface for alliances shows an info paragraph that benefits from non-empty content.
   - Recommendation: Mirror parties — omit `info`. Add later if Plan 67-02 smoke surfaces an empty-info dev-blind state.

3. **Should the sanity-check script run inside the integration test (vitest) or as a standalone script?**
   - What we know: `tests/integration/default-template.integration.test.ts` is the canonical home for end-to-end seed-then-query assertions, and already has read-client setup. Adding alliance assertions there piggybacks on existing infra.
   - What's unclear: D-03 explicitly excludes "new unit tests in matching/filters" — silent on dev-seed integration tests. Adding alliance assertions to `default-template.integration.test.ts` is closer to "extending an existing integration test" than "new unit test", arguably permissible.
   - Recommendation: Planner's call. Two valid forms:
     - **Form A (lighter):** Standalone script `scripts/sanity-alliances.ts` runnable independently. Aligns with CONTEXT D-05 phrasing ("a one-time script").
     - **Form B (more integrated):** Extend `default-template.integration.test.ts` with alliance assertions (5-10 new `expect()` calls in the existing `it()` block). Test runs only when `SUPABASE_URL` is set (already gated). Arguably preferable because it co-locates the sanity check with the existing seed integration test that asserts row counts — adding alliance row-count assertions there is a natural extension. The CONTEXT D-03 prohibition on new tests targets `@openvaa/matching` and `@openvaa/filters`, not `@openvaa/dev-seed` integration tests.

## Environment Availability

> External tooling required to execute Phase 67. Items below are verified or noted as fallback-required.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node + Yarn 4 | All package builds | ✓ (project standard, pre-existing) | per project | — |
| Supabase CLI (local) | `yarn dev`, `yarn dev:reset-with-data` | ✓ (project standard, pre-existing) | per project | — |
| `@supabase/supabase-js` | sanity-check script (read client) | ✓ (already in `@openvaa/dev-seed` deps) | per workspace | — |
| Playwright | v2.6 parity gate (Plan 67-02) | ✓ (project standard, pre-existing) | per `tests/playwright.config.ts` | — |
| Browser (manual UI smoke) | Plan 67-02 6-step checklist | ✓ (developer machine) | — | — |
| Docker (Supabase containers, including imgproxy) | Local dev stack | ✓ (project standard, intermittent imgproxy 502 — known infra debt per STATE.md) | per project | If imgproxy crashes during smoke: `supabase stop && supabase start` (documented infrastructure workaround) |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 1.x (per project standard) + Playwright (parity gate) |
| Config file | `packages/dev-seed/vitest.config.ts` (workspace) + `tests/playwright.config.ts` (E2E) + canonical parity diff at `.planning/phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs` (per Phase 66 verification) |
| Quick run command | `yarn workspace @openvaa/dev-seed test:unit` (skips integration if no `SUPABASE_URL`) |
| Full suite command | `yarn dev:reset-with-data && yarn dev` (manual UI smoke) + standalone `tsx packages/dev-seed/scripts/sanity-alliances.ts` + `yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json` (parity gate) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEED-01 | 2 alliance entities + 10 alliance noms emitted by default template | unit (in-memory) | `yarn workspace @openvaa/dev-seed test:unit` (extend `tests/pipeline.test.ts` to include alliance row-count assertions) | ⚠️ pipeline.test.ts exists; alliance assertions missing — Plan 67-01 task |
| SEED-01 | DB-level row counts: 2 alliances + 10 alliance noms + 30 org-noms-with-parent (6 parties × 5 constituencies) | integration | `yarn workspace @openvaa/dev-seed test:unit` (extend `tests/integration/default-template.integration.test.ts`) OR standalone script | ⚠️ Integration test exists at `tests/integration/default-template.integration.test.ts:122-242`; alliance assertions missing |
| SEED-01 | Voter results page shows populated Alliance tab; filtering works | manual UI smoke (D-03) | `yarn dev:reset-with-data && yarn dev` → 6-step checklist below | ❌ Manual only — D-03 explicit |
| SEED-01 | Adapter reverse-fill of `organizationNominationIds` returns non-empty arrays for Alliance parents | adapter sanity (script) | `tsx packages/dev-seed/scripts/sanity-alliances.ts` (NEW) | ❌ Wave 0 |
| SEED-01 | `@openvaa/matching` + `@openvaa/filters` handle alliances correctly (no runtime errors, no empty match-breakdown) | manual UI smoke (D-03) | Same 6-step checklist; runtime errors visible in browser console | ❌ Manual only — D-03 explicit |
| SEED-01 | v2.6 parity gate at HEAD `2c7ad2dea` continues to PASS | E2E parity | `yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json` + diff via `.planning/phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs` | ✓ Existing tooling — Plan 67-02 task |

**6-step manual UI smoke checklist (Plan 67-02):**

1. Run `yarn dev:reset-with-data && yarn dev`. Wait for Supabase + Vite ready.
2. Open `http://localhost:5173`, navigate to constituency selection, pick any constituency (e.g., `c_01` Uudenmaa North).
3. Answer ≥5 opinion questions (default `minAnswers: 5` per `dynamicSettings.ts:41`).
4. Navigate to results page. Verify 3 tabs visible: **Candidates, Organizations, Alliances**.
5. Click Alliances tab. Verify 2 alliances rendered (Progressive Front + Conservative Bloc per planner-finalized names). Click each — verify member parties listed (3 each: SDU/RF/GW for L; BC/VC/RA for R).
6. Open the Filter panel. Verify alliance-specific filter behavior is sensible (per `filterStore.svelte.ts:41`, alliances skip parent-nom filters; opinion question filters should still apply if any are flagged `filterable: true`).

Repeat steps 2-5 for one additional constituency (e.g., `c_05` Pirkanmaa) to confirm cross-constituency consistency (D-02: same alliances in every constituency).

### Sampling Rate

- **Per task commit:** `yarn workspace @openvaa/dev-seed test:unit` (≤10s if integration is skipped; 30-60s if `SUPABASE_URL` set and integration runs)
- **Per wave merge:** Manual UI smoke (6 steps, ~5min) + sanity-check script (≤5s)
- **Phase gate:** Full Playwright parity gate (~3-5min) before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `packages/dev-seed/scripts/sanity-alliances.ts` — Form A: standalone script for adapter sanity check (NEW)
- [ ] Integration test extension at `tests/integration/default-template.integration.test.ts` — append alliance row-count assertions (alliances === 2; alliance noms === 10; org-noms-with-parent === 30)
- [ ] Type widening at `packages/app-shared/src/settings/dynamicSettings.type.ts:222` — `Array<typeof ENTITY_TYPE.Candidate | typeof ENTITY_TYPE.Organization | typeof ENTITY_TYPE.Alliance>`
- [ ] App settings extension in `packages/dev-seed/src/templates/default.ts:227-240` — add `results: { sections: ['candidate', 'organization', 'alliance'] }` to the `app_settings.fixed[0].settings` block

*(NOT a gap: `pipeline.test.ts` already covers row-count regressions for the default template; the planner extends with 1-2 lines of alliance assertions during Task 1 of Plan 67-01.)*

## Security Domain

> Phase 67 has no new attack surface. The phase modifies seed-data emission (dev-only) + a 1-line settings-type widening (frontend, no auth boundary). Existing controls apply unchanged.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No new auth flows; alliance entities are read-only data viewed by anonymous voters |
| V3 Session Management | no | No session changes |
| V4 Access Control | yes | Alliances are project-scoped via `project_id` FK + RLS policies (`302-rls.sql:323-345`) — anon SELECT permitted on `published = true`. Phase 67 emits alliances with default `published = true` (per `supabaseAdminClient.ts:152-163` PUBLISHABLE_TABLES). Standard control inherited |
| V5 Input Validation | yes (DB-side) | `validate_nomination` trigger (`011-validation-functions.sql:264-272`) enforces hierarchy invariants. CHECK constraint on `nominations` (`104-nominations.sql:52`) enforces polymorphic single-FK rule. Standard control inherited |
| V6 Cryptography | no | No crypto in scope |

### Known Threat Patterns for dev-seed authoring

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Seed accidentally writes to production project_id | Tampering | `TEST_PROJECT_ID = 00000000-0000-0000-0000-000000000001` is the dev sentinel; `buildCtx` defaults to it; production projects use UUIDs from supabase auth. dev-seed scripts run only with local service-role key |
| Real party names leak into seed data | Information Disclosure (political) | D-58-01 + D-04 enforce invented names. Plan 67-01 acceptance criteria should grep for real Finnish coalition names (`Punavihreä`, `Porvarihallitus`, etc.) |
| Sanity-check script logs service-role key | Information Disclosure | Script reads from env var; never logs the key. Standard env-var hygiene |

## Sources

### Primary (HIGH confidence)

- `packages/dev-seed/src/templates/default.ts` (lines 1-252) — read in full
- `packages/dev-seed/src/templates/defaults/nominations-override.ts` (lines 1-203) — read in full
- `packages/dev-seed/src/templates/defaults/candidates-override.ts` (lines 1-183) — read in full
- `packages/dev-seed/src/templates/defaults/questions-override.ts` (lines 1-143) — read in full
- `packages/dev-seed/src/types.ts` (lines 1-49) — read in full
- `packages/dev-seed/src/ctx.ts` (lines 1-108) — read in full
- `packages/dev-seed/src/pipeline.ts` (lines 60-200) — read for TOPO_ORDER + override resolution
- `packages/dev-seed/src/locales.ts` (lines 1-194) — read in full for fan-out behavior
- `packages/dev-seed/src/generators/AlliancesGenerator.ts` (lines 1-53) — read in full
- `packages/dev-seed/src/generators/NominationsGenerator.ts` (lines 1-179) — read in full
- `packages/dev-seed/src/template/schema.ts` (lines 100-150) — read for `alliances` schema entry
- `packages/dev-seed/src/supabaseAdminClient.ts` (lines 130-210) — read for PUBLISHABLE_TABLES + bulk_import routing
- `packages/dev-seed/tests/integration/default-template.integration.test.ts` (lines 1-242) — read for sanity-check pattern
- `packages/data/src/objects/entities/variants/alliance.ts` (full) + `alliance.type.ts` (full)
- `packages/data/src/objects/nominations/variants/allianceNomination.ts` (full) + `allianceNomination.type.ts` (full)
- `packages/data/src/objects/entities/variants/organization.ts` (full)
- `packages/data/src/objects/nominations/variants/organizationNomination.ts` (full)
- `packages/data/src/objects/entities/base/entityTypes.ts` (full) — ENTITY_TYPE.Alliance = 'alliance'
- `packages/data/src/core/objectTypes.ts` (full) — OBJECT_TYPE.Alliance / AllianceNomination
- `packages/data/src/root/dataRoot.ts` (lines 140-160) — allianceNominations collection getter
- `packages/data/src/objects/election/election.ts` (lines 75-115) — getAllianceNominations
- `apps/supabase/supabase/schema/104-nominations.sql` (full) — schema + CHECK constraint
- `apps/supabase/supabase/schema/102-entities.sql` (lines 60-90) — alliances table
- `apps/supabase/supabase/schema/011-validation-functions.sql` (lines 200-280) — validate_nomination trigger logic
- `apps/supabase/supabase/schema/503-entity-rpcs.sql` (lines 1-86) — get_nominations RPC
- `apps/supabase/supabase/schema/501-bulk-operations.sql` (line 123, 246, 340, 348) — alliance handling in bulk_import
- `apps/supabase/supabase/schema/302-rls.sql` (lines 320-345) — alliances RLS policies
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` (lines 200-415) — reverse-fill code (read-only this phase)
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.type.ts` (full) — InternalFlatNomination
- `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` (lines 320-460) — entityTypes ← results.sections derivation
- `apps/frontend/src/lib/contexts/voter/nominationAndQuestionStore.svelte.ts` (lines 1-132) — entityTypes filter applied to tree
- `apps/frontend/src/lib/contexts/voter/matchStore.svelte.ts` (relevant section) — alliance not specially-cased
- `apps/frontend/src/lib/contexts/voter/filters/filterStore.svelte.ts` (lines 25-75) — alliance branch in filter wiring
- `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte` (lines 100-200) — entityTabs derivation from matches keys
- `packages/app-shared/src/settings/dynamicSettings.ts` (lines 40-90) — sections default
- `packages/app-shared/src/settings/dynamicSettings.type.ts` (lines 215-235) — sections type union
- `.planning/REQUIREMENTS.md` — SEED-01 acceptance text + traceability
- `.planning/STATE.md` — current state, v2.6 parity baseline at HEAD `2c7ad2dea`
- `.planning/ROADMAP.md` — Phase 67 scope, depends on Phase 66
- `.planning/phases/67-default-seed-alliances/67-CONTEXT.md` — locked decisions
- `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/64-CONTEXT.md` — D-01 reverse-fill architecture LOCKED
- `.planning/phases/66-nominations-schema-adapter-type-cleanup/66-VERIFICATION.md` — Phase 66 PASS confirmation, parity baseline preserved

### Secondary (MEDIUM confidence)

- `npm view @faker-js/faker version` (verified 10.4.0 on 2026-04-30) — used in dev-seed for locale fan-out, NOT in Phase 67's hand-authored alliances
- `npm view svelte version` (verified 5.55.5 on 2026-04-30) — confirms Svelte 5 baseline (Phase 65 stable)

### Tertiary (LOW confidence)

- None. All claims directly verified in source files or schema definitions.

## Metadata

**Confidence breakdown:**
- Authoring shape: HIGH — all override patterns + entity/nomination row shapes verified directly in source
- Override wiring: HIGH — `Overrides` type confirmed permissive at `types.ts:46-48` (no extension needed); pipeline TOPO_ORDER confirmed
- Alliance↔OrganizationNomination relationship: HIGH — schema migrations + `validate_nomination` trigger read directly; reverse-fill code verified at `supabaseDataProvider.ts:391-405`
- Locale generation: HIGH — `locales.ts:182` mirror-en convention verified directly
- Adapter sanity-check options: HIGH — integration test pattern exists at `tests/integration/default-template.integration.test.ts:54-62`; standalone script precedent at `scripts/download-portraits.ts`
- Validation Architecture: HIGH — D-03 explicitly scopes manual UI smoke + adapter sanity check; existing parity gate tooling at `.planning/phases/65-*/scripts/diff-parity.mjs` per Phase 66 verification
- Risks/landmines: HIGH — `results.sections` default + type narrowness verified directly in `dynamicSettings.ts:66` + `dynamicSettings.type.ts:222`; matching/filters alliance handling traced through to source

**Research date:** 2026-04-30
**Valid until:** 2026-05-30 (30 days; Phase 67 is the only consumer; downstream Phase 68 doesn't touch this surface)

---

## RESEARCH COMPLETE

**Phase:** 67 - Default Seed Alliances
**Confidence:** HIGH
**Plan-count expectation:** 2 plans (per CONTEXT D-05) — Plan 67-01 = Seed authoring; Plan 67-02 = Validation + UI smoke. Sequential, no parallelism.
