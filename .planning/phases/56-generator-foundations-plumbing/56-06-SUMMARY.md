---
phase: 56-generator-foundations-plumbing
plan: 06
subsystem: dev-tools
tags: [generators, nominations, polymorphic, referential-integrity, gen-08]

# Dependency graph
requires:
  - phase: 56-generator-foundations-plumbing (Plan 03)
    provides: Template schema + Ctx (refs map) + Fragment types
  - phase: 56-generator-foundations-plumbing (Plan 04)
    provides: Foundation generators (Elections, Constituencies, Organizations, Alliances, Factions, Accounts, Projects) populating ctx.refs upstream of NominationsGenerator
  - phase: 56-generator-foundations-plumbing (Plan 05)
    provides: CandidatesGenerator populating ctx.refs.candidates — the primary ref NominationsGenerator reads
provides:
  - "NominationsGenerator — polymorphic nomination rows with exactly ONE of {candidate,organization,faction,alliance} refs per CHECK constraint (migration line 741)"
  - "GEN-08 client-side FK validation: assertRefsPopulated throws descriptive error when ctx.refs.{candidates,elections,constituencies} are empty BEFORE bulk_import is invoked"
  - "Clean polymorphism emission (no redundant `organization` ref on candidate rows) — drops the legacy tests/ workaround per RESEARCH §9"
  - "14th and final generator in packages/dev-seed/src/generators/ — Wave 3 complete"
affects:
  - "Plan 07 (pipeline.ts) — NominationsGenerator runs AFTER candidates/elections/constituencies in D-06 topo order; pipeline enforces this via TOPO_ORDER map"
  - "Plan 07 (writer.ts) — nomination rows with polymorphic refs pass through bulk_import unchanged; no special routing needed (unlike app_settings or feedback)"
  - "Plan 08 (unit tests) — asserts specific error messages from assertRefsPopulated for each missing-ref case; verifies no organization ref on candidate-type rows"
  - "Phase 58 (templates) — can override via `nominations: (fragment, ctx) => rows[]` for richer cross-election × cross-constituency topologies and party/faction/alliance variants"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Polymorphic ref union type (PolymorphicRef = CandidateRef | OrganizationRef | FactionRef | AllianceRef) — type-system echo of DB CHECK num_nonnulls=1 constraint"
    - "Omit-based NominationRow relaxation for NOT NULL FK columns resolved via refs (election_id / constituency_id) — same shape as QuestionsGenerator's category_id relaxation"
    - "GEN-08 private guard method (assertRefsPopulated) — runs before any generated row, collects missing ref categories, throws a single error listing all of them"
    - "Count clamp + logger warn against upstream ref length (Math.min(n, refs.candidates.length)) — same idiom as AppSettingsGenerator's UNIQUE clamp but driven by data availability"

key-files:
  created:
    - "packages/dev-seed/src/generators/NominationsGenerator.ts"
  modified: []

key-decisions:
  - "NominationRow uses Omit<TablesInsert<'nominations'>, 'election_id' | 'constituency_id'> to relax the two NOT NULL FK columns that the ref sentinels (election + constituency) resolve at write time — same pattern as QuestionsGenerator's category_id relaxation. Without the Omit, TS would require either real UUIDs (which dev-seed cannot know client-side) or casts at every push site."
  - "PolymorphicRef wrapped in Partial<> inside NominationRow — union-typed fields ONLY line up at spread/push sites when every member is optional; otherwise TS requires EVERY union member to be present on a given row, which is the opposite of the CHECK constraint semantics."
  - "Phase 56 generated path emits candidate-type nominations ONLY — all wired to ctx.refs.elections[0] × ctx.refs.constituencies[0]. This exercises the polymorphism + ref-resolution path end-to-end without combinatorial cross-wiring. Organization / faction / alliance variants are supported only via fixed[] pass-through; Phase 58 templates extend the generated path via the override hook."
  - "Explicitly DROPPED the legacy tests/ admin-client `organization: { external_id }` redundancy on candidate nominations per RESEARCH §9. The party-candidate relationship is already expressed via candidates.organization_id; dev-seed controls emission so the workaround stripping in SupabaseAdminClient is no longer needed for dev-seed-generated rows."
  - "assertRefsPopulated collects ALL missing categories into one array and throws a single consolidated error instead of short-circuiting on the first miss. Users configuring multi-entity templates benefit from seeing every missing ref at once."
  - "Count clamped to refs.candidates.length with logger warning (not throw) — exceeds-available is a soft configuration issue (template requested more than upstream produced), not a semantic bug. The throw path is reserved for empty-refs (true GEN-08 violation)."

requirements-completed: [GEN-01, GEN-02, GEN-04, GEN-08, NF-03]

# Metrics
duration: 3m 15s
completed: 2026-04-22
---

# Phase 56 Plan 06: NominationsGenerator (polymorphic, GEN-08) Summary

**Polymorphic nomination generator with client-side FK validation; emits exactly one of {candidate,organization,faction,alliance} per row, drops the legacy "emit both, strip one" workaround, and fails fast with a descriptive error when upstream refs are empty. 14 of 14 generators now in place — Wave 3 complete.**

## Performance

- **Duration:** ~3 min 15 sec
- **Started:** 2026-04-22T14:47:14Z
- **Completed:** 2026-04-22T14:50:23Z
- **Tasks:** 1
- **Files created:** 1 (178 lines)
- **Commits:** 1

## Accomplishments

- **Polymorphic emission implemented** — `PolymorphicRef` type union (`CandidateRef | OrganizationRef | FactionRef | AllianceRef`) mirrors the DB-side `CHECK num_nonnulls(candidate_id, organization_id, faction_id, alliance_id) = 1` at the type layer; `Partial<PolymorphicRef>` in `NominationRow` allows spread/push sites while keeping the one-per-row semantic at emission time.
- **GEN-08 client-side validation** — `assertRefsPopulated` runs before any generated row, collects missing categories (`candidates`, `elections`, `constituencies`) into a single array, and throws a consolidated error that points at the D-06 topo-order contract and template config. This catches misconfiguration client-side rather than deep inside `bulk_import`'s PL/pgSQL `RAISE EXCEPTION`.
- **Clean polymorphism emission** — no redundant `organization` ref on candidate-type nominations. The legacy tests/ admin-client workaround (SupabaseAdminClient lines 172–180) emitted both and stripped one; dev-seed drops this per RESEARCH §9 because it controls emission.
- **`entity_type` omitted** — GENERATED column (migration lines 724–731); emitting it would fail with "cannot write to generated column".
- **Count clamping with soft-warning** — generated count capped at `refs.candidates.length` with a `ctx.logger` warning. Empty-refs → throw (hard GEN-08 violation); exceeds-available → clamp + log (soft configuration issue).
- **fixed[] pass-through** — user-authored nominations get the `externalIdPrefix` applied and default `project_id` filled in; users are responsible for polymorphism + hierarchy correctness per D-22 pure-I/O contract.
- **14 of 14 generators now present** — Wave 3 complete. Plan 07 can now wire the full TOPO_ORDER map.

## Task Commits

1. **Task 1: NominationsGenerator with polymorphic emission + GEN-08 validation** — `19ecdad54` (feat)

## Files Created/Modified

- `packages/dev-seed/src/generators/NominationsGenerator.ts` (new, 178 lines) — Polymorphic `NominationsGenerator` class. `constructor(private ctx: Ctx)` captures ctx per D-26; `defaults(ctx) → { count: 0 }` per D-08 (Phase 56 scaffolds shape; Phase 58 templates drive richer counts). `generate(fragment)` runs `assertRefsPopulated` before the generated loop, emits one candidate-type nomination per candidate up to `min(count, refs.candidates.length)` with `externalIdPrefix` applied, no `entity_type`, no `organization` ref, no `parent_nomination`.

## Decisions Made

1. **NominationRow uses `Omit<TablesInsert<'nominations'>, 'election_id' | 'constituency_id'>`** — both columns are NOT NULL in the schema but dev-seed resolves them via the `election` / `constituency` ref sentinels at write time (bulk_import's `resolve_external_ref`). Without the Omit, TS required either real UUIDs client-side (impossible) or casts at every push site (noisy). Same pattern as QuestionsGenerator's `category_id` relaxation (Plan 05).
2. **`Partial<PolymorphicRef>` inside `NominationRow`** — union-typed fields only line up at spread/push sites when every member is optional. If the union were required, TS would insist every row provide all four (candidate AND organization AND faction AND alliance), which directly opposes the CHECK constraint. Partial keeps the semantic "at least one" at the type level while emission enforces "exactly one" at the value level.
3. **Phase 56 emission path: candidate-type nominations only** — all wired to `ctx.refs.elections[0] × ctx.refs.constituencies[0]`. Deliberate minimal strategy: exercises polymorphism + ref-resolution end-to-end without combinatorial cross-wiring. Organization / faction / alliance variants are supported via `fixed[]` pass-through (the `PolymorphicRef` union accepts any of the four shapes). Phase 58 templates extend the generated path via the `nominations: (fragment, ctx) => rows[]` override hook.
4. **Legacy `organization` redundancy explicitly dropped** — SupabaseAdminClient lines 172–180 emitted both `candidate` and `organization` refs on candidate nominations then stripped the redundant one. RESEARCH §9 recommends dev-seed emit only the authoritative ref since the party-candidate relationship is already expressed via `candidates.organization_id`. Acceptance criterion verified no active emission of `organization: { external_id }` on candidate-type rows (only in type definitions and explanatory comments).
5. **`assertRefsPopulated` collects all misses before throwing** — single consolidated error lists every missing category (`candidates, elections, constituencies`) rather than short-circuiting on the first one. Better UX for template authors configuring multi-entity fragments.
6. **Count-exceeds-available: clamp + log, not throw** — requesting more nominations than candidates exist is a soft configuration issue (template wants 20 but upstream produced 8). Throw is reserved for GEN-08 violations (empty refs = pipeline order broken). Clamp + logger warning keeps the pipeline running while surfacing the mismatch.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] TablesInsert<'nominations'> requires NOT NULL election_id and constituency_id — incompatible with ref-sentinel emission**
- **Found during:** Task 1 (typecheck after initial file creation)
- **Issue:** `TablesInsert<'nominations'>` marks `election_id` and `constituency_id` as required NOT NULL columns. The plan's `NominationRow` type definition (`TablesInsert<'nominations'> & Partial<PolymorphicRef> & { election?: ..., constituency?: ... }`) kept those fields required, so push-ing a row object that supplied only the ref sentinels (`election: { external_id }` / `constituency: { external_id }`) failed `ts(2345)`: "missing properties election_id, constituency_id".
- **Fix:** Relaxed to `Omit<TablesInsert<'nominations'>, 'election_id' | 'constituency_id'> & Partial<PolymorphicRef> & { election?: ..., constituency?: ..., parent_nomination?: ... }`. Same Omit pattern as QuestionsGenerator's `category_id` relaxation (Plan 05). The underlying contract is identical: bulk_import resolves the NOT NULL FK from the ref sentinel at write time; the generator never has the UUID client-side.
- **Files modified:** packages/dev-seed/src/generators/NominationsGenerator.ts
- **Verification:** `yarn workspace @openvaa/dev-seed typecheck` exits 0
- **Committed in:** 19ecdad54 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking — type-schema mismatch the plan's inline code did not anticipate)
**Impact on plan:** Minor — the fix establishes the same Omit pattern QuestionsGenerator uses for the same reason (ref-sentinel-resolves-NOT-NULL-FK). Zero scope creep.

## Issues Encountered

None beyond the deviation documented above. Typecheck + lint + test:unit (no test files; `--passWithNoTests`) all green after the Omit fix. Smoke test via `yarn tsx -e` verified:
- Empty fragment returns `[]`
- `count: 0` returns `[]`
- `count: 1` with empty refs throws with `ctx.refs is empty for: candidates, elections, constituencies` in the message
- `count: 1` with populated refs emits exactly one row with `candidate`, `election`, `constituency` refs, no `organization`, no `entity_type`, prefix applied

## Cross-Plan Contracts Documented

- **For Plan 07 (Pipeline):** TOPO_ORDER map MUST place `nominations` AFTER `candidates`, `elections`, `constituencies` (as well as `organizations`, `factions`, `alliances` for completeness — those are read only via `fixed[]` pass-through in Phase 56 but will be read by Phase 58 templates). If nominations run before any of these, `assertRefsPopulated` throws.
- **For Plan 07 (Writer):** Nomination rows pass through `bulk_import` unchanged — no special routing like app_settings or feedback. The polymorphic refs (`candidate`, `organization`, `faction`, `alliance`, `election`, `constituency`, `parent_nomination`) are all handled by `resolve_external_ref` in the bulk_import RPC per the relationship map (migration lines 2625–2634).
- **For Plan 08 (Unit Tests):** Specific error-message assertions are available:
  - `"ctx.refs is empty for: candidates"` when only candidates ref is empty
  - `"ctx.refs is empty for: elections"` when only elections ref is empty
  - `"ctx.refs is empty for: constituencies"` when only constituencies ref is empty
  - `"ctx.refs is empty for: candidates, elections, constituencies"` when all three are empty
  - Additional assertions: no `organization` key on generated candidate rows; no `entity_type` key on any generated row; `external_id` starts with `${externalIdPrefix}nom_cand_`.
- **For Phase 58 (Templates):** The `PolymorphicRef` union type is re-exportable if templates want type-safe organization/faction/alliance nomination generation via the override hook. Phase 56 keeps it private (file-local) to avoid widening the public API surface before it's needed; Plan 07/58 can re-export on demand.

## Known Stubs

- **Default `count = 0`** — intentional per plan and CONTEXT. Phase 56 scaffolds the generator shape; nominations are an opt-in entity whose meaningful counts emerge from Phase 58's default template (which wires candidate counts to nomination counts).
- **No organization / faction / alliance generated variants** — intentional. The `PolymorphicRef` union supports all four shapes for `fixed[]` pass-through, but the generated path only produces candidate nominations (per plan strategy). Phase 58 templates extend via the override hook when richer topologies are needed.
- **No parent_nomination in generated path** — intentional. All Phase 56 generated nominations are top-level (no parent), which sidesteps the `validate_nomination` trigger's parent-consistency check (migration lines 360–373). `fixed[]` rows that include parents rely on user-supplied consistency per D-22.

## Threat Flags

None. All threats from the plan's threat_model (T-56-27 through T-56-31) are addressed as planned:
- T-56-27 (Tampering, polymorphic emission): generator emits ONLY authoritative ref; CHECK constraint enforces DB-side.
- T-56-28 (Integrity, parent consistency): Phase 56 generates top-level only; fixed[] with parents trusts D-22 contract.
- T-56-29 (Spoofing, forged parent): accepted; bulk_import's resolve_external_ref catches non-existent parent extIds.
- T-56-30 (DoS, validation throw): bounded — throw fires at most once per pipeline run.
- T-56-31 (Integrity, emit-both-strip-one): mitigated — generator emits only `candidate` ref on candidate rows; acceptance criterion verified no active `organization: { external_id }` emission.

## Self-Check: PASSED

- `packages/dev-seed/src/generators/NominationsGenerator.ts`: FOUND (178 lines)
- Commit `19ecdad54`: FOUND
- Typecheck: PASS (EXIT=0)
- Lint: PASS (EXIT=0)
- Unit tests: PASS (no test files; `--passWithNoTests`)
- Smoke test (instantiation + empty fragment + validation throw + emission with populated refs): ALL OK
- Generator count: 14 of 14 (Wave 3 complete)

## Next Phase Readiness

- **Wave 3 generators: 14/14 complete.** All generator files in `packages/dev-seed/src/generators/` are in place. No cross-plan blockers remain within Phase 56 Waves 1–3.
- **Plan 07 (pipeline + writer) unblocked** — can now wire the full TOPO_ORDER map with all 14 generator classes. Contracts documented above (TOPO position, no special writer routing for nominations).
- **Plan 08 (unit tests) unblocked** — specific assertion targets documented for NominationsGenerator's polymorphism, GEN-08 throw, and emission cleanliness.

---
*Phase: 56-generator-foundations-plumbing*
*Plan: 06*
*Completed: 2026-04-22*
