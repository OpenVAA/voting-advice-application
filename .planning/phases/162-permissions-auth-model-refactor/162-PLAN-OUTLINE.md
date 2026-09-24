# Phase 162 — Plan Outline

**Written:** 2026-09-15 · **Source:** `162-IMPLEMENTATION-BRIEF.md` § 5, verbatim.

**This outline was not derived by an agent.** Brief § 5 already specifies the 19-plan, seven-wave
sequence; it is the operator's, it is reviewed, and re-deriving it would risk deviation from a settled
decomposition. The rows below transcribe it. Objectives are abridged — **the brief section named in each
row is authoritative** and each per-plan planner reads it.

| Plan ID | Objective | Wave | Depends On | Requirements |
| --- | --- | --- | --- | --- |
| 162-01 | Write `162-SPEC.md` — § 3's 23-permission matrix, the read rules including § 11.2's entity-confirmation conjunct, the level-1 definition, and the explicit amendments to criteria 1, 4 and 6. K4's stated home and the fixed reference every later plan checks against. | 0 | — | PRESHIP-02 |
| 162-02 | Correct the ROADMAP § Phase 162 entry and the PRESHIP-02 row in `REQUIREMENTS.md` against facts 2–7 and 16–39, dated, in house style. Carries § 10.1's operator amendment to criterion 4. | 0 | 162-01 | PRESHIP-02 |
| 162-02b | The declarativity pass (§ 11.4). Merge 15 of the 25 `ADD COLUMN` sites into their `CREATE TABLE` bodies (**not** `300-auth-tables.sql`'s 10 — 162-16 deletes those), regenerate `00001_initial_schema.sql`, fold `00002`–`00008`, collapse `assert-schema-migration-parity.mjs` to a `cmp`, and reword `apps/supabase/README.md`. Behaviour-neutral by construction; gate is schema byte-identity, not a green test run. | 0 | — | PRESHIP-02 |
| 162-03 | Enums `grant_scope_type`, `grant_role_type`, `grant_permission` (**23 members** — § 3.2 canonical); the `grants` table with the CHECK tying `target_type IS NOT NULL` to `scope = 'entity'`; indexes. | 1 | 162-02b | PRESHIP-02 |
| 162-04 | `user_can(p_scope, p_target_id, p_permission)` encoding § 3.3's matrix in **one** place — JWT grant set, table lookups only for hierarchy (B5(a) hybrid); `is_child_nominee` direct-parent-only (D4(a)). **Carries the tracer slice:** one permission end to end — grant row → JWT claim → `user_can` → one converted policy → one pgTAP assertion. | 1 | 162-03 | PRESHIP-02 |
| 162-05 | `has_role` and `can_access_project` reimplemented as thin shims over `user_can`; every existing policy keeps working untouched. **Must be provably behaviour-neutral** — full E2E + pgTAP run here. | 2 | 162-04 | PRESHIP-02 |
| 162-06 | Data migration per B6(a) including the `auth_user_id` backfill; the access-token hook emits `grants`; the four frontend claim readers and `invite-candidate` updated (A2(a), D-20 — the invite writes a grant and its swallowed failure becomes a hard abort, parameterised by entity type). | 2 | 162-05 | PRESHIP-02 |
| 162-07 | `projects.open_for_voters` (backfilled `true`, D2(a)); `projects.lock_nominations`; **`elections.election_type` repurposed** to carry the nomination shape, old `'general'`/`'local'` values and traces deleted (operator note in § 8.2; `162-CONTEXT.md` D-16 has the measured trace list — 14 templates, one production read at `supabaseDataProvider.ts:245`, six adapter tests); and `entities.confirmed` on all four entity tables, backfilled `true` (§ 11.2). All declared in `CREATE TABLE` bodies per § 11.4. | 3 | 162-06 | PRESHIP-02 |
| 162-07b | `organization_id` moves from `candidates` to `factions` (§ 11.8). Drop the candidates column and sweep its consumers; add `factions.organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE`. **Closes RES-7 / T-144-11.** Measurement first: what breaks when the column leaves the two `503-entity-rpcs.sql` return shapes, and does any fixture emit a faction with no organization. | 3 | 162-06 | PRESHIP-02 |
| 162-08 | The anon read policies re-expressed against `open_for_voters` + confirmed nominations + the linked entities' `confirmed` flags (§ 3.4, § 11.2). **No `published` conjunct** — 162-16 deletes it, so these are written once in their end state. | 3 | 162-07 | PRESHIP-02 |
| 162-09 | `accounts`, `projects`, `elections`, `constituency_groups`, `constituencies` + the two join tables → `user_can`. | 4 | 162-08 | PRESHIP-02 |
| 162-10 | `organizations`, `candidates`, `factions`, `alliances` → `user_can`; the 6 inline `auth_user_id = auth.uid()` re-derivations folded in and `is_candidate_self` dropped (A3(a)). Carries D-21's entity-type generalisation. | 4 | 162-08, 162-07b | PRESHIP-02 |
| 162-11 | `questions`, `question_categories`, `app_settings`, `feedback`, `admin_jobs` → `user_can`. `app_settings` UPDATE gates on `project.edit_app_settings`, `projects` on `project.edit_project_settings` (§ 11.1). | 4 | 162-08 | PRESHIP-02 |
| 162-12 | `nominations`: admin policies converted; the new entity-user INSERT/UPDATE policies gated on `nomination.edit` + `NOT lock_nominations`; the `confirmed → false` transition on edit; `nomination.confirm` admin-only. **Plus all of § 11.5** (`nomination.create_parent` and its five guards, the `GRANT INSERT (…)` column list, the per-candidate cap, the `ON DELETE CASCADE` ruling), **§ 11.7's `UNIQUE NULLS NOT DISTINCT` constraint**, and **§ 11.8's faction-parent rule** in `validate_nomination()`. Also flips `unconfirmed` → `confirmed`. | 4 | 162-08, 162-07b | PRESHIP-02 |
| 162-13 | Immutable-data enforcement, **conditional on `confirmed`** (§ 11.2, § 8.7(a)): a trigger reading `OLD.confirmed`, not a `WITH CHECK`; `303-column-grants.sql` reduced to the coarse outer bound it can express. `entity.confirm` gates writes to `confirmed` itself. | 4 | 162-10 | PRESHIP-02 |
| 162-14 | All 15 storage policies through `user_can(scope, uuid, permission)`, **including the 7 non-callers — the six `candidate_*` plus `anon_select_public_assets`** (A4(a); census corrected 2026-09-15, see `162-CONTEXT.md` D-03) and their 12 inline re-derivations. Plus the operator's A4 note: one public bucket per entity type, write access paired to `entity.edit_answers(entity_type, entity_id)`. | 5 | 162-10, 162-11, 162-12, 162-13 | PRESHIP-02 |
| 162-15 | Delete the shims; drop `user_roles`, `user_role_type`, `role_scope_type` (B1(a), K1) — "drop" meaning absent from the declarative schema (§ 11.3). **Must land the replacement for `test_user_roles()`** — called from **9 of the 12** pgTAP files at 66 sites naming 6 fixture identities (corrected 2026-09-16; `03-anon-read`, `08-triggers` and `11-question-rpcs` carry none). 162-06's M4 measured the same 66/6 independently. | 6 | 162-14 | PRESHIP-02 |
| 162-16 | The `published` removal (§ 8.4(b), § 11.6): 10 columns and 10 partial indexes out of the schema; the term out of every anon policy and out of `303-column-grants.sql`'s comments; `dev-seed`, `permittedKeys.ts`, `seed.sql`, the bulk-import RPC column lists, the adapter selects, and the E2E specs that publish rows to make them visible. | 6 | 162-15 | PRESHIP-02 |
| 162-17 | Tests and evidence: the pgTAP estate widened across § 3.3's matrix; F2(a)'s structural non-collapse guard in `lint-schema.mjs`; F3(a)'s per-verb storage paired assertion; `162-NEGATIVE-CONTROL-LEDGER.md` (F4(a)); the criterion-7 flow check (G2(a), G3(a)); § 11.5's two behavioural assertions; **§ 11.7's two-directional pair** — duplicate rejected AND same candidate under two parents accepted. | 6 | 162-16 | PRESHIP-02 |

**19 plans · 7 waves.**

## Notes carried into every per-plan dispatch

- **No plan writes a `000NN` migration file** (D-14, § 10.2 — no database has been published).
- **Every plan's `requirements` field contains `PRESHIP-02`** — it is the phase's only requirement ID.
- **§ 3.2 (the 23-member enum) and § 3.3 (the matrix) are canonical** and are not restated anywhere else.
- **Nothing else in this directory may end in `-PLAN.md`** — GSD globs that as the executable plan set.

## OUTLINE COMPLETE
