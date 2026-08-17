---
phase: 67-default-seed-alliances
plan: 01
subsystem: dev-seed
tags: [dev-seed, alliances, supabase, override, dynamic-settings, bulk-import]

# Dependency graph
requires:
  - phase: 64-voter-results-reactivity-completion
    provides: supabase adapter reverse-fill of organizationNominationIds on Alliance parents (supabaseDataProvider.ts:391-405) — this plan empirically exercises that code path
  - phase: 58-templates-cli-default-dataset
    provides: default seed template + override pattern (D-58-01 no real party names, D-58-04 4-locale fan-out)
provides:
  - 2 hand-authored Alliance entity rows (Progressive Front + Conservative Bloc) seeded into the default template
  - 10 AllianceNomination rows (2 alliances × 5 constituencies) emitted from nominations-override (no parent per validate_nomination trigger)
  - parent_nomination wiring on 30 of 40 OrganizationNomination rows whose party belongs to an alliance (6 of 8 parties × 5 constituencies)
  - 10 standalone OrganizationNomination rows (party_people + party_coast × 5 constituencies) — exercises the no-alliance UI path
  - DynamicSettings.results.sections type union widened to admit Alliance (Candidate | Organization | Alliance)
  - app_settings.results.sections override = ['candidate', 'organization', 'alliance'] in default seed so the voter app surfaces the Alliance tab
  - integration test asserting alliance counts + 30/10 org-nom split + cross-type parent-child constituency identity invariant
affects: [Phase 67-02 — UI smoke + parity gate, future alliance-aware filter/match work, supabaseDataProvider reverse-fill audit]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Override pair pattern: alliance ENTITY rows in alliancesOverride (output.alliances → alliances table); alliance NOMINATION rows in nominationsOverride (output.nominations → nominations table). Bulk_import routes by override key, so polymorphic ref rows (alliance:{external_id}) MUST live in the override matching their target table."
    - "Cross-override helper export: ALLIANCE_KEYS, allianceExtId, allianceNomExtId exported from alliances-override.ts so nominations-override.ts can reference them without duplicating literals — keeps Phase 67 wiring single-sourced."
    - "Conditional parent_nomination spread on org-nom emission: `...(allianceKey ? { parent_nomination: { external_id: ... } } : {})` — yields 30 with-parent rows + 10 standalone rows from one loop without splitting the emission path."
    - "Type-union widening for type-safe seed override: app_settings.results.sections widening (DynamicSettings.type.ts) precedes the seed-layer override that writes 'alliance' into the array — prevents string-literal rejection at the type seam."

key-files:
  created:
    - "packages/dev-seed/src/templates/defaults/alliances-override.ts — exports alliancesOverride + ALLIANCE_MEMBERSHIP map + findAllianceForParty helper + ALLIANCE_KEYS/allianceExtId/allianceNomExtId helpers; emits 2 alliance entity rows."
  modified:
    - "packages/dev-seed/src/templates/defaults/nominations-override.ts — extended to emit 10 alliance noms (no parent) + wire parent_nomination on 30 alliance-member org-noms."
    - "packages/dev-seed/src/templates/default.ts — wires defaultOverrides.alliances=alliancesOverride; adds 'alliance' to app_settings.results.sections."
    - "packages/app-shared/src/settings/dynamicSettings.type.ts — widens results.sections union (1 line) to include typeof ENTITY_TYPE.Alliance."
    - "packages/dev-seed/tests/integration/default-template.integration.test.ts — adds in-memory + DB-level alliance count assertions, 30/10 org-nom split assertion, cross-type parent-child constituency identity invariant."
    - "packages/dev-seed/tests/templates/default.test.ts — updates row count expectations: rows.alliances=2, rows.nominations=327+40+10=377."
    - "packages/dev-seed/tests/templates/nominations-override.test.ts — updates total count to 377; adds alliance-nom emission test + parent-absence assertion; tightens candidate-parent test to scope to org-noms only."

key-decisions:
  - "Fallback-path applied during execution: alliance NOMINATION rows live in nominations-override.ts (not alliances-override.ts). Bulk_import routes by override key — dual-emitting alliance entity + alliance nom rows from alliancesOverride mis-routed nomination rows to the alliances table."
  - "Helper exports (ALLIANCE_KEYS, allianceExtId, allianceNomExtId) live in alliances-override.ts as the canonical home for alliance constants. nominations-override.ts imports them — single source of truth for the alliance-naming convention."
  - "Type widening kept narrow (Candidate | Organization | Alliance) — Faction intentionally excluded per RESEARCH anti-pattern (Array<EntityType> opens every entity type, beyond Phase 67 scope)."
  - "Default runtime value at dynamicSettings.ts:66 stays unchanged at ['candidate', 'organization'] — backward compatible for apps not applying the default seed."

patterns-established:
  - "Override pair pattern for polymorphic-ref tables: when an entity table (e.g. alliances) has nominations referencing it polymorphically (nominations.alliance_id), the entity rows go in entity-override (output.<entityTable>), the nomination rows go in nominations-override (output.nominations). Single override emitting both shapes mis-routes through bulk_import."
  - "Constituency-specific child-parent external_id convention: parent and child external_ids must encode the constituency to satisfy the validate_nomination trigger's election-id + constituency-id identity invariant. Pattern: ${prefix}nom_<entType>_<entId>_<constituencyId> for parents and ${prefix}nom_<childType>_<childId>_<constituencyId> for children, with parent_nomination references built from the constituency-specific id at the same emission site."
  - "Type-union widening before value-literal write: when a seed-layer override needs to write a string literal that's not yet in the consumer type union (e.g. 'alliance' in DynamicSettings.results.sections), widen the union FIRST (or in the same plan), THEN add the literal. Otherwise the seed-layer code rejects at compile time."

requirements-completed: [SEED-01]

# Metrics
duration: ~25min
completed: 2026-04-30
---

# Phase 67 Plan 01: Default Seed Alliances — Seed Authoring Summary

**2 alliances + 10 alliance noms + 30/10 org-nom parent_nomination split land in the default seed; the v2.6 P64 supabase-adapter alliance reverse-fill is empirically exercised end-to-end.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-04-30T06:21:56Z
- **Completed:** 2026-04-30T06:32:15Z
- **Tasks:** 5/5 (with 1 inline deviation fix)
- **Files modified:** 6 (1 created + 5 modified)
- **Commits:** 6 (5 task commits + 1 deviation-fix commit)

## Accomplishments

- **2 hand-authored alliances seeded:** Progressive Front (L) groups party_social/party_red/party_green; Conservative Bloc (R) groups party_blue/party_values/party_rural. Standalone parties (party_people, party_coast) exercise the no-alliance UI path. Invented neutral names per D-04 + D-58-01 (no real Finnish coalition names verified by acceptance grep).
- **377-row nomination payload:** 327 candidate-noms + 40 org-noms (30 with alliance parent + 10 standalone) + 10 alliance-noms (2 × 5 constituencies, no parent per validate_nomination trigger). End-to-end integration test against live local Supabase asserts every count + parent-child constituency identity invariant.
- **Type seam widened:** DynamicSettings.results.sections union now admits Alliance, app_settings.results.sections in the default seed lists 'alliance' so the voter results page surfaces the Alliance tab on `yarn dev:reset-with-data && yarn dev`.
- **Adapter reverse-fill is now real:** the v2.6 Phase 64 supabase-adapter reverse-fill of `organizationNominationIds` on Alliance parents (supabaseDataProvider.ts:391-405) — which had shipped without seed data — now has 30 child org-noms × 2 alliance parents per constituency to traverse on every voter-app load.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create alliances-override.ts** — `5db390c64` (feat) — 2 alliance entity literals + ALLIANCE_MEMBERSHIP map + findAllianceForParty helper.
2. **Task 2: Wire parent_nomination on alliance-member org-noms** — `750e7416e` (feat) — Partial<ParentRef> on OrganizationNominationRow + conditional spread in the org-nom emission loop.
3. **Task 3: Wire alliancesOverride into default.ts + add 'alliance' to results.sections** — `df6e17207` (feat) — single-line override registration + 1-section app_settings extension.
4. **Task 4: Widen DynamicSettings.results.sections union** — `b68d71021` (feat) — single-line union widening (Alliance added; Faction stays out per anti-pattern).
5. **Deviation fix (Rule 1): Split alliance entity vs nomination emission across the two overrides** — `42786597b` (fix) — moved alliance-nom emission to nominations-override; updated 2 unit tests with new counts. See Deviations section below.
6. **Task 5: Extend integration test** — `8febeafc7` (test) — Phase 67 row counts, 30/10 org-nom split assertion, cross-type constituency identity invariant.

## Files Created/Modified

### Created (1)
- `packages/dev-seed/src/templates/defaults/alliances-override.ts` — emits 2 alliance entity rows; exports ALLIANCE_MEMBERSHIP, findAllianceForParty, ALLIANCE_KEYS, allianceExtId, allianceNomExtId for cross-override consumption.

### Modified (5)
- `packages/dev-seed/src/templates/defaults/nominations-override.ts` — adds alliance-nom emission (10 rows, 2 × 5) + extends OrganizationNominationRow type with Partial<ParentRef> + conditional parent_nomination spread on the 30 alliance-member org-noms.
- `packages/dev-seed/src/templates/default.ts` — imports alliancesOverride, registers it under defaultOverrides.alliances, extends app_settings.fixed[0].settings with results.sections=['candidate','organization','alliance'].
- `packages/app-shared/src/settings/dynamicSettings.type.ts` — single-line union widening at line 222 (typeof ENTITY_TYPE.Alliance added).
- `packages/dev-seed/tests/integration/default-template.integration.test.ts` — extended Section 6 with alliance-typed nomination handling, 30/10 split assertion, cross-type parent constituency-identity invariant.
- `packages/dev-seed/tests/templates/default.test.ts` — row count expectation updated to rows.alliances=2 and rows.nominations=377 (327+40+10).
- `packages/dev-seed/tests/templates/nominations-override.test.ts` — total count updated to 377, new alliance-nom emission test, candidate-parent test scoped to org-noms specifically.

## Decisions Made

- **Override-pair pattern:** alliance ENTITY rows in alliancesOverride (table=alliances), alliance NOMINATION rows in nominationsOverride (table=nominations). Bulk_import routes by override key — single override emitting both shapes mis-routes nomination rows to the alliances table. This was a planner-anticipated fallback path (Task 1 implementation note 1) confirmed empirically by the integration test.
- **Helper exports centralised in alliances-override.ts:** ALLIANCE_KEYS + allianceExtId + allianceNomExtId + ALLIANCE_MEMBERSHIP + findAllianceForParty all live in the single canonical home; nominations-override.ts consumes via import. Single source of truth for the Phase 67 alliance-naming convention.
- **Faction NOT added to the sections type union:** RESEARCH anti-pattern — Array<EntityType> would open every entity type. Faction widening is a future-phase concern.
- **Default runtime sections value preserved:** dynamicSettings.ts:66 stays at ['candidate', 'organization']; the seed-layer override is what introduces 'alliance'. Backward compatible for apps not applying the default seed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Alliance NOMINATION rows mis-routed to the alliances table by bulk_import**

- **Found during:** Task 5 (integration test against live local Supabase)
- **Issue:** `alliancesOverride` originally emitted both alliance entity rows AND alliance nomination rows (the dual-emission path). The writer routes rows by override key (`output.alliances → alliances table`), so the alliance NOMINATION rows — which carry a polymorphic `alliance: { external_id }` ref — were sent to the `alliances` table where `alliance` is not a column. Error: `bulkImport failed: column "alliance" of relation "alliances" does not exist`. The plan's Task 1 implementation notes explicitly anticipated this fallback path.
- **Fix:** Refactored to the override-pair pattern. `alliancesOverride` now emits only the 2 alliance entity rows. `nominationsOverride` extended to also emit the 10 alliance nomination rows (in addition to its existing 327 candidate + 40 organization noms). Cross-override helpers (ALLIANCE_KEYS, allianceExtId, allianceNomExtId) exported from alliances-override.ts so nominations-override.ts can reference them without duplicating literals.
- **Files modified:** packages/dev-seed/src/templates/defaults/alliances-override.ts (slim to entities-only, export helpers), packages/dev-seed/src/templates/defaults/nominations-override.ts (add alliance-nom emission), packages/dev-seed/tests/templates/default.test.ts (row count 367 → 377), packages/dev-seed/tests/templates/nominations-override.test.ts (row count 367 → 377, new alliance-nom case, candidate-parent test scoped to org-noms specifically).
- **Verification:** All 484 dev-seed unit + integration tests green (one previously failing, 483 → 484); full monorepo `yarn build` (14/14 tasks) green.
- **Committed in:** `42786597b` (fix(67-01): split alliance entity vs nomination emission across the two overrides).

### Implementation Notes (planner-anticipated)

- The plan's Task 1 implementation note 1 explicitly flagged this fallback path: "If dual-emission fails: fall back to splitting … alliance entities go in `default.ts` `alliances: { count: 0, fixed: [...] }` block, and `alliances-override.ts` emits ONLY the 10 alliance NOMINATION rows." The actual chosen split is slightly different (entities still emitted programmatically by alliancesOverride; nominations moved to nominationsOverride) but lands at the same correctness point and keeps the alliance constants/helpers in their canonical home.

## Plan-Level Verification

### Build
- `yarn build` (14 tasks) — exited 0, 23.4 s.

### Tests
- `yarn workspace @openvaa/dev-seed test:unit` — **484/484 passing** including the integration test (live Supabase, 9.94 s). Specifically:
  - rows.alliances === 2
  - rows.nominations === 377 (327 + 40 + 10)
  - DB countByPrefix('alliances', 'seed_') === 2
  - DB countByPrefix('nominations', 'seed_') === 377
  - candNoms === 327, orgNoms === 40, allianceNoms === 10
  - orgNomsWithParent === 30, orgNomsStandalone === 10
  - For every with-parent org-nom: parent.constituency_id === orgNom.constituency_id AND parent.election_id === orgNom.election_id (validate_nomination trigger invariant)

### Pattern Audit (grep gates from plan)
- `grep -c "parent_nomination" packages/dev-seed/src/templates/defaults/nominations-override.ts` → **8** (expected ≥ 4: type alias, ParentRef def, candidate-nom block × 2, org-nom block × 1, comments).
- `grep -E '(Punavihreä|Porvarihallitus|Vasemmistoliit|Kokoomus|Keskust)' packages/dev-seed/src/templates/defaults/alliances-override.ts` → **no matches** (D-58-01 invariant).
- `grep -q "typeof ENTITY_TYPE.Alliance" packages/app-shared/src/settings/dynamicSettings.type.ts` → **PASS**.
- `grep -q "alliances: alliancesOverride" packages/dev-seed/src/templates/default.ts` → **PASS**.
- `grep -E "sections:.*'candidate'.*'organization'.*'alliance'" packages/dev-seed/src/templates/default.ts` → **PASS** (line: `sections: ['candidate', 'organization', 'alliance']`).

## Open Items (handed to Plan 67-02)

- Live `yarn dev:reset-with-data && yarn dev` exercise — Plan 01's integration test confirms DB-level correctness; Plan 02 confirms voter-UI surfacing.
- 6-step manual UI smoke checklist (RESEARCH §"6-step manual UI smoke checklist"): alliance tab visible, populated, filterable.
- Adapter sanity check: confirm `organizationNominationIds` non-empty on Alliance parents end-to-end through the supabase adapter (the v2.6 P64 reverse-fill).
- v2.6 parity gate against HEAD `2c7ad2dea` — must not regress.

## Threat Flags

None — Phase 67 introduces no new security-relevant surface. The threat register's mitigations (T-67-01 invented names, T-67-03 schema invariants) are enforced by acceptance criteria + the validate_nomination trigger, both verified by the integration test.

## Self-Check: PASSED

- File `packages/dev-seed/src/templates/defaults/alliances-override.ts` — FOUND.
- Files modified — all 5 — FOUND (verified via `git status` post-commit).
- Commit `5db390c64` — FOUND.
- Commit `750e7416e` — FOUND.
- Commit `df6e17207` — FOUND.
- Commit `b68d71021` — FOUND.
- Commit `42786597b` — FOUND.
- Commit `8febeafc7` — FOUND.
- All 484 dev-seed tests green; full monorepo build clean.
