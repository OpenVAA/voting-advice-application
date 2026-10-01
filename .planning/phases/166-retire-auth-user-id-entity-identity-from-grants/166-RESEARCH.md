# Phase 166: Retire `auth_user_id` — Entity Identity from Grants - Research

**Researched:** 2026-10-01
**Domain:** Supabase/PostgreSQL schema retirement (column drop + identity re-derivation from `public.grants`), Deno Edge Functions, pgTAP, Playwright E2E admin fixtures
**Confidence:** HIGH (every load-bearing mechanism was probed against the live local database in rolled-back transactions; probe residue was removed and the DB state verified identical afterwards)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

Decision IDs map one-to-one onto the discussion doc's section IDs, given in parentheses. Every
decision below is locked; the planner does not re-open them.

#### 0 — Factual baseline

- **D-01 (166-0.1):** All 16 facts below are accepted as the phase's baseline. They were verified on
  `fix/888-review-findings` at `89a4bd9ff`; facts 8–13 are **not** in the roadmap and each one changes
  a plan. Research re-checks them against the planning base (D-22) rather than trusting them blindly.

| # | Roadmap claim → what the tree shows | Evidence (symbol / content anchors) |
|---|---|---|
| 1 | "No RLS policy, storage policy or token claim reads it." **Confirmed.** In `302-rls.sql` the column appears only in comments; `400-storage.sql` and `custom_access_token_hook` never mention it | `schema/302-rls.sql` (comments only) · `schema/301-auth-functions.sql` `custom_access_token_hook` |
| 2 | "Two readers." **Confirmed for product code.** `get_candidate_user_data` reads the column in **both** arms of its `UNION ALL` (candidate and organization), ending in `LIMIT 1` with no ORDER BY; it is `SECURITY INVOKER`. The second reader is `findExistingCandidate` | `schema/503-entity-rpcs.sql` `get_candidate_user_data` · `functions/identity-callback/candidateRecord.ts` `findExistingCandidate` (`.eq('auth_user_id', authUserId)`) |
| 3 | "Two writers." **Confirmed for product code**: `invite-candidate` step 7 (`.update({ auth_user_id: inviteData.user.id })`) and `createCandidate` (`auth_user_id: authUserId`). `seed.sql` also writes the column (the seeded "Test Candidate" row) | `functions/invite-candidate/index.ts` step 7 · `candidateRecord.ts` `createCandidate` · `seed.sql` ("Test candidate record linked to the candidate user" insert) |
| 4 | "Two indexes, its column-grant entries." **Indexes confirmed. The column-grant "entries" are comments only.** `303-column-grants.sql` is an UPDATE allow-list that never names the column; only two comment lines change | `schema/200-indexes.sql` `idx_candidates_auth_user_id`, `idx_organizations_auth_user_id` · `schema/303-column-grants.sql` "Protected (admin-only) columns" lists |
| 5 | **Migration shape is fixed by a gate.** `migrations/` holds one generated file, a byte-identical concatenation of `schema/*.sql`. `yarn assert:schema-migration-parity` (link 12 of `lint:check`) **fails if a second `.sql` file appears**. Migrations 00002–00008 were folded in phase 162 | `apps/supabase/README.md` "Two SQL directories" |
| 6 | "`grants` is revoked from `authenticated`." **Confirmed.** `REVOKE ALL ON TABLE public.grants` from the API roles. `user_can` reads the **claim** (`auth.jwt() -> 'grants'`), not the table. `grants` has **no project column**, so a project filter needs a join to the entity table. The UNIQUE constraint leads with `user_id`, so a lookup by user is already indexed | `schema/300-auth-tables.sql` · `schema/301-auth-functions.sql` `user_can` |
| 7 | **A candidate's grant is `(entity, candidate, <id>, editor)`.** Both Edge Functions write it through `writeEntityGrant`, idempotent on `grants_user_scope_target_role_key`. The matrix gives `entity + admin` the empty permission set | `functions/*/entityGrant.ts` `writeEntityGrant` · `301-auth-functions.sql` `grant_role_permissions` fall-through comment |
| 8 | **Not in the roadmap: `identity-callback`'s self-repair depends on the column.** Order today: create candidate → write grant. If the grant write fails, the next login still finds the row by `auth_user_id` and repairs the grant. Once lookup goes through grants, that orphan becomes invisible and the next login creates **a second candidate** (→ D-09) | `functions/identity-callback/index.ts` step 7 and the "on BOTH branches" grant comment |
| 9 | **Not in the roadmap: the E2E admin client has five readers/writers, not three.** `forceRegister` (step 4 link), `sendEmail` (uses `candidate.auth_user_id` as the "already registered?" test, then links), `unregisterCandidate` (clears the column **and resets `terms_of_use_accepted` keyed on it**), `deleteBankAuthCandidateBySub`, `deleteAllTestUsers`. Two specs also query by the column | `tests/tests/utils/supabaseAdminClient.ts` · `specs/candidate/candidate-bank-auth.spec.ts` (delete by `auth_user_id`, select of it) · `specs/candidate/candidate-bank-auth-journey.spec.ts` (`findData('candidates', { auth_user_id })`) |
| 10 | **Not in the roadmap: deleting step 7 breaks a source-text test.** `flowConformance.test.ts` counts `await rollbackInvite(supabaseAdmin` and expects **2**, and asserts the "Failed to link the invited user" message | `functions/invite-candidate/flowConformance.test.ts` "rolls back the invited auth user … treats a failed link as fatal" |
| 11 | **Roadmap claim weakened: `anon` can still read another auth user id after the drop.** `nominations.created_by` references `auth.users`, and `anon_select_nominations` returns the whole row. No column-level SELECT grant exists anywhere in the schema. The frontend reads nominations only through `get_nominations` (INVOKER), which does not project `created_by` (→ D-02) | `schema/104-nominations.sql` `created_by` · `schema/302-rls.sql` `anon_select_nominations` · `schema/503-entity-rpcs.sql` `get_nominations` |
| 12 | **pgTAP fixture grants are claims, not rows, by default.** `create_test_data()` never calls `test_seed_fixture_grants()`, because `12-user-can` builds its own grant fixture without ON CONFLICT. A lookup that reads the **table** sees no grant in a file that sets only claims. `21-entity-organization` Section 8 already inserts its grant rows explicitly | `tests/database/00-helpers.test.sql` `test_seed_fixture_grants` and its preceding comment · `21-entity-organization.test.sql` Section 8 |
| 13 | Making `get_candidate_user_data` a **public** `SECURITY DEFINER` function trips the RPC census, which pins the authenticated-executable definer set to six names | `tests/database/07-rpc-security.test.sql` "census: … authenticated can execute …" |
| 14 | Remaining references. pgTAP: `00, 02, 03, 05, 09, 14, 20, 21`; `05` and `20` hold `NOT LIKE '%auth_user_id%'` policy guards that become vacuous after the drop. dev-seed: `permittedKeys.ts` (×2), `OrganizationsGenerator.ts` (comments) plus a test asserting `not.toHaveProperty('auth_user_id')`, `templates/e2e/base.ts` (comment). Types: `database.ts` (×6) and hand-kept `column-map.ts` (`authUserId`). **Frontend: zero references.** Agent docs: `.claude/skills/database/*` (4 files). The `502-email-helpers.sql` comment cites `candidates.auth_user_id` as the reason user ids are readable | `git grep -c auth_user_id -- ':!.planning'` (40 files) |
| 15 | **Dependency state.** PRs #888 and #889 are **both still OPEN**. Their content is on this branch: `feat/165-results-navigation-redraw` is an ancestor of HEAD. `ship/v2.15-13-review-fixes` is not, but its one commit beyond HEAD (`6a60390d7`, a frontend NavItem colour fix) touches nothing this phase does | `gh pr view 888/889` · `git log HEAD..ship/v2.15-13-review-fixes` |
| 16 | **Touched comments already break the hygiene rules.** `candidateRecord.ts` (`162`, `D-10`, `162-06`), both `entityGrant.ts` copies (`162-REVIEW WR-06`), the `seed.sql` candidate and grant comments (`162-06`, `162-08`, `D-19`), and the `00-helpers` fixture comments | the files named |

#### A — Scope boundary

- **D-02 (166-A1) — ⚠ DECIDE, ★ confirmed by tick:** **Narrow SC6 to the entity tables** and file
  `nominations.created_by` as a **named residue todo**. D-15's census names `nominations.created_by` as
  its **one** listed exemption, so any new auth-user-id exposure to `anon` still goes red. Rejected:
  revoking `anon` SELECT on the column via table REVOKE + column-list GRANT (introduces column-level
  SELECT privileges the schema uses nowhere, on the table every voter read touches; every future
  `nominations` column would need hand-adding), and moving `created_by` to a side table (reshapes
  `caller_unconfirmed_originated_count` / `enforce_nomination_confirmation`, scope another phase owns).
  — **Reversibility:** cheap — closing the residue later only removes one exemption from the census.
- **D-03 (166-A2):** **Keep the organization arm** of `get_candidate_user_data` and resolve it from the
  `(entity, organization, editor)` grant. The RPC signature (`p_entity_type` stays), the generated
  types, `packages/supabase-types/RPC-NULLABILITY.md` and `scripts/assert-project-scoped-queries.mjs`
  stay unchanged. Organizations gain multi-editor support, as SC4 says. (Nothing calls the arm with
  `'organization'` today; `supabaseDataWriter.ts` always passes `p_entity_type: 'candidate'`.)
- **D-04 (166-A3):** **Update the four agent-facing skill files in this phase** —
  `.claude/skills/database/{SKILL,schema-reference,rls-policy-map,extension-patterns}.md` — to describe
  the grant as the only user→entity link, and **annotate** the todo
  `.planning/todos/pending/2026-06-01-candidate-home-savedanswers-empty-logout-modal.md` (which quotes the
  old `WHERE c.auth_user_id = auth.uid()`) with the new lookup. Phase 168 does not cover `.claude/skills`,
  so leaving them would let the stale text survive both phases.

#### B — The lookup mechanism (SC1–SC3)

- **D-05 (166-B1) — ⚠ DECIDE, ★ confirmed by tick:** **INVOKER RPC over a `private` definer helper.**
  `public.get_candidate_user_data` stays `SECURITY INVOKER`. A new
  `private.caller_entity_ids(p_project_id, p_entity_type)` `SECURITY DEFINER` helper reads
  `public.grants` by `auth.uid()` (`scope = 'entity'`, `role = 'editor'`, `target_type = p_entity_type`)
  and joins the entity table on `project_id` to return the caller's entity id(s). "Which entity am I"
  thus comes from the **table**, not the token; the returned row is still read under the caller's RLS
  exactly as today (row visibility still follows the claim through `user_can` — not a regression). No
  change to the 07 RPC-security census, because `private` is not exposed. Consequence: pgTAP files that
  call the RPC need grant **rows** (D-17). It must **not** route through `user_can`, which is also true
  for project/account admins and would hand an admin an arbitrary candidate (SC1).
  Rejected: public `SECURITY DEFINER` (census grows to seven, the function becomes the only gate on the
  row) and parsing `auth.jwt() -> 'grants'` (stale until token refresh — the weaker choice SC1 names).
- **D-06 (166-B2) — ★ confirmed by tick:** **More than one match is a raised error.** The RPC becomes
  `plpgsql` and RAISEs a named condition when the helper yields more than one id, e.g.
  `RAISE EXCEPTION … USING ERRCODE = 'P0001', HINT = 'ERR_ENTITY_IDENTITY_AMBIGUOUS'`. The same rule
  applies to the organization arm. The existing `.catch` in
  `apps/frontend/src/routes/[[lang=locale]]/candidate/(protected)/+layout.server.ts` already surfaces RPC
  errors. pgTAP asserts it with `throws_ok`. `LIMIT 1` and the ORDER-BY-and-log variant are both out.
- **D-07 (166-B3):** **Only `role = 'editor'` confers identity.** Matches the D-07 role mapping of the
  162 user-rights model; `entity + admin` maps to the empty permission set (fact 7), so such a row
  confers nothing and must not confer identity.
- **D-08 (166-B4):** **`findExistingCandidate` becomes two service-role queries.** (1) Candidate-editor
  grants by `user_id` (`scope = 'entity'`, `target_type = 'candidate'`, `role = 'editor'`) → target ids;
  (2) `candidates` with `.eq('project_id', …).in('id', ids).maybeSingle()`. The project filter stays
  inside the lookup (the module docblock's reason holds). Two or more rows still throw
  `ERR_CANDIDATE_LOOKUP_FAILED`. `CandidateLookupClient` gains the `grants` query chain. (`grants.target_id`
  has no FK, so PostgREST cannot embed the join.) Rejected: a new service-role-only public RPC for the join.
  `createCandidate` stops writing `auth_user_id` (SC2).
- **D-09 (166-B5) — ⚠ DECIDE:** **Compensating delete on the identity-callback create branch.** When
  `writeEntityGrant` throws after a candidate was just created, delete that candidate, then rethrow —
  mirroring `invite-candidate`'s `rollbackInvite`. The existing-candidate branch keeps its idempotent
  grant write. A failed compensating delete is logged; that case is the **one named residue**. This
  closes the fact-8 orphan (an invisible candidate leading to a duplicate on next login). Rejected: a
  transactional service-role RPC (new public function; moves the insert out of `candidateRecord.ts` and
  strips its vitest shape tests of their subject) and accepting the orphan.
- **D-10 (166-B6):** **`invite-candidate` writes the grant only.** Delete step 7 (the
  `.update({ auth_user_id: inviteData.user.id })` link) and its rollback arm; keep the grant-failure
  `rollbackInvite` as a helper (not folded inline). Update `flowConformance.test.ts`: the
  `await rollbackInvite(supabaseAdmin` count goes **2 → 1** and the "Failed to link the invited user"
  assertion is dropped. Renumber step 8.

#### C — Users per entity (SC4)

- **D-11 (166-C1) — ⚠ DECIDE, ★ confirmed by tick:** **One user per candidate**, enforced by a partial
  unique index:
  `CREATE UNIQUE INDEX … ON public.grants (target_id) WHERE scope = 'entity' AND target_type = 'candidate' AND role = 'editor'`.
  Matches the 162 user-rights model, where Candidate is the only candidate-scope user type (D-07); a
  second editor would be indistinguishable from the candidate. Organizations are **not** indexed and
  gain multi-editor support. Two obligations follow:
  1. Research must confirm no pgTAP fixture (notably `12-user-can`'s 13-row set) or E2E setup grants two
     users the same candidate.
  2. `writeEntityGrant`'s `UNIQUE_VIOLATION` → success mapping (both `entityGrant.ts` copies) must **name
     the constraint** it treats as idempotent (`grants_user_scope_target_role_key`), or a second user's
     grant hitting the new index would read as success.
  — **Reversibility:** cheap in schema (drop the index), but a future delegated-editor model would need
  its own way to distinguish editor from candidate.
- **D-12 (166-C2):** **No write-time constraint** for one candidate per user per project; D-06's
  read-time error is the guard. (`grants` has no project column, so a write-time rule would need a
  trigger joining the entity table on every grant insert.)

#### D — Schema change and generated artefacts

- **D-13 (166-D1):** **Edit the schema sources, regenerate in the same commit.** Edit
  `schema/102-entities.sql` (drop the column from both tables), `200-indexes.sql` (drop
  `idx_candidates_auth_user_id`, `idx_organizations_auth_user_id`), `303-column-grants.sql` (comments),
  `302-rls.sql` (comments), `502-email-helpers.sql` (the comment that cites `candidates.auth_user_id`)
  and `503-entity-rpcs.sql`; add the D-05 helper and D-11 index in the appropriate schema files; then run
  `yarn schema:regenerate` and `yarn db:types` in the **same commit** — the README's two-step rule. No
  `00002_*.sql`: `assert:schema-migration-parity` fails on a second file.
- **D-14 (166-D2):** **Delete the column-absence dev-seed test.** Remove `OrganizationsGenerator.test.ts`
  "does NOT emit auth_user_id" and its header line; drop both `permittedKeys.ts` entries and
  `column-map.ts`'s `authUserId`. Permitted-key parity with `database.ts` keeps the key set honest.

#### E — Tests

- **D-15 (166-E1) — ⚠ DECIDE:** **Catalog census plus one behavioural check, observed red first.**
  - *Census:* list every column, in a table that has a `TO anon` SELECT policy, carrying a foreign key to
    `auth.users` (`pg_constraint.confrelid = 'auth.users'::regclass`), and assert the set equals the
    exemption list from D-02 — exactly `nominations.created_by`.
  - *Behavioural:* as `anon`, select `auth_user_id` from `candidates` and expect it to throw. This
    catches a re-added column.
  - Both are red on today's tree (both entity tables in the census). **The red run is recorded before
    the drop lands.** Phase 169's pgTAP gate re-runs this census.
  Rejected: behavioural-only (guards only the named column) and `hasnt_column` alone (can never have
  been observed red against the SC6 problem).
- **D-16 (166-E2):** **Remove the `NOT LIKE '%auth_user_id%'` clauses** from the policy guards in
  `05-organization-admin.test.sql` and `20-storage-authority.test.sql`, keeping the rest of each
  assertion. D-15 covers the regression; a guard on a name that cannot exist measures nothing.
- **D-17 (166-E3):** **pgTAP fixtures:** drop `auth_user_id` from the `00-helpers` inserts. Seed grant
  **rows** (via `test_seed_identity_grants`) **only** in the files that call `get_candidate_user_data`.
  `create_test_data()` keeps not seeding rows, for the `12-user-can` reason its comment records (that
  file's own inserts have no ON CONFLICT).
- **D-18 (166-E4):** **E2E admin client: two private helpers** in `tests/tests/utils/supabaseAdminClient.ts`
  — `candidateIdsForUser(userId)` (candidate-editor grants in this project) and
  `userIdForCandidate(candidateId)`. All five methods (`forceRegister`, `sendEmail`,
  `unregisterCandidate`, `deleteBankAuthCandidateBySub`, `deleteAllTestUsers`) and both bank-auth specs
  use them. **Ordering is the trap:** `unregisterCandidate` and `deleteAllTestUsers` read the candidate
  ids **before** deleting the grants and reset `terms_of_use_accepted` **by id** — delete grants first
  and the ToU reset silently matches nothing, bringing back the stale-ToU failure the step-2 comment
  describes. `sendEmail`'s "already registered?" test becomes "a grant targets this candidate".

#### F — Comment hygiene and gates

- **D-19 (166-F1) — OVERRULES the ★:** **Sweep every touched file entirely.** Every file the phase
  edits must pass the `CLAUDE.md` § Comment Hygiene rules **as a whole**, not just the comment blocks
  the phase rewrites: no historical narrative, no planning references beyond bare `see phase N` /
  `see spike N`, nothing addressed to the reviewer, concise, present only where the code cannot speak.
  The operator accepted the cost the doc named — a larger diff carrying unrelated planning-reference
  cleanups (e.g. throughout `00-helpers.test.sql`, `candidateRecord.ts`'s `162`/`D-10`/`162-06`, both
  `entityGrant.ts` copies' `162-REVIEW WR-06`, `seed.sql`'s `162-06`/`162-08`/`D-19`). Run
  `hygiene-grep-report.sh` over **every touched file** (not just the changed lines) and resolve every
  hit. SC7 still holds in full: no comment narrates the retirement of `auth_user_id`; the code reads as
  if the grant had always been the link. Rejected: rewriting only edited blocks (the ★) and changed
  lines only.
- **D-20 (166-F2):** **Gates, in order:** `yarn lint:check` (includes schema-migration parity — the
  only gate that catches an unregenerated migration) → `yarn test:unit` (includes the Edge Function
  vitest suites) → `yarn db:reset` then pgTAP (`yarn test:db`) → the candidate E2E specs → bank-auth
  specs **3×** under the determinism gate, with the `tests/IDURA-TEST-RUNBOOK.md` prerequisites inlined
  in the plan → the full E2E suite under the cardinal rule ("did not run" = failure). Never read a
  gate's status through a pipe.

#### G — Plan shape

- **D-21 (166-G1) — ⚠ DECIDE:** **Four sequential plans, each leaving the suite green.** Readers move
  before the column dies, so no plan ends broken.
  - **01:** the D-15 census + behavioural check, **observed red** and recorded; the
    `private.caller_entity_ids` helper; the rewritten `get_candidate_user_data` (D-05/D-06/D-07, both
    arms); the D-11 partial unique index (+ `writeEntityGrant` constraint naming). The column still exists.
  - **02:** both Edge Functions and the E2E admin client switch to grant lookups and stop writing the
    column (D-08, D-09, D-10, D-18).
  - **03:** drop the column, its indexes, `seed.sql`, dev-seed and fixtures; regenerate migration and
    types; D-13, D-14, D-16, D-17 — the census goes green.
  - **04:** gates (D-20), the agent docs and todo annotation (D-04), the residue todos (`<deferred>`).
  D-19's sweep applies within whichever plan touches each file.
- **D-22 (166-G2):** **Plan against the `fix/888-review-findings` tip now**; do not wait for PRs
  #888/#889 to merge. Both PRs' content touching `apps/supabase` and `tests/` is already an ancestor;
  the one missing commit (`6a60390d7`) touches nothing here.

### Claude's Discretion

The doc leaves only these to the planner/researcher:
- Which schema file hosts `private.caller_entity_ids` and the D-11 index, and the index's name —
  follow the existing numbered-file conventions (`301-auth-functions.sql` / `200-indexes.sql` /
  `300-auth-tables.sql` are the obvious candidates).
- The exact RAISE text/HINT in D-06 (the doc gives `ERR_ENTITY_IDENTITY_AMBIGUOUS` as an example).
- Re-verifying the 16 baseline facts against the planning base, and confirming D-11's fixture
  precondition (no doubled candidate grants).

### Deferred Ideas (OUT OF SCOPE)

- **Residue: `nominations.created_by` is readable by `anon`** (D-02). Filed as a named todo; it is the
  sole exemption in the D-15 census. Closing it needs column-level SELECT privileges or a side table.
  It is not a vestige, so Phase 167 must not pick it up; it is open when 167 starts.
- **Residue: a failed compensating delete in `identity-callback`** (D-09) is logged, not repaired;
  the orphan-candidate case survives only when both the grant write and the delete fail.
- **Write-time "one candidate per user per project" constraint** (D-12) — not built; revisit only if
  the read-time error is observed in practice.
- **A delegated candidate editor** — excluded by D-11's index; would need a distinguishing role.

**Cross-phase notes (from CONTEXT):** execution is serial 166 → 167 → 168 → 169; 168 describes the grant
as the only user→entity link in `apps/docs`; 169 regenerates `database.ts` against the post-166 schema and
re-runs the D-15 census in its pgTAP gate; 167 leaves the `nominations.created_by` residue todo alone.
</user_constraints>

<phase_requirements>
## Phase Requirements (proposed — register at planning)

The roadmap lists requirements as "TBD". Proposed IDs (no `AUTHID-*` row exists in `REQUIREMENTS.md` today — `[VERIFIED: grep of .planning/REQUIREMENTS.md, 0 hits]`), one per success criterion plus one for D-04:

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTHID-01 | `get_candidate_user_data` resolves the caller's own entity from an `(entity, <type>, editor)` grant row via `private.caller_entity_ids` (table, not claim), filtered by project, never through `user_can`; more than one match RAISEs `P0001` with HINT `ERR_ENTITY_IDENTITY_AMBIGUOUS`; both arms (SC1, D-03, D-05, D-06, D-07) | Pattern 1–2; prototype probed 9/9 green (§ Code Examples) |
| AUTHID-02 | `identity-callback`: `findExistingCandidate` looks up by grant (two service-role queries, project filter inside), `createCandidate` no longer writes the column, and a grant-write failure on the create branch deletes the just-created candidate before rethrowing (SC2, D-08, D-09) | Pattern 4–5; source-text test anchors catalogued in Pitfalls 6–8 |
| AUTHID-03 | `invite-candidate` writes the grant only: step 7 and its rollback arm removed, `rollbackInvite` kept, `flowConformance.test.ts` count 2 → 1, link-message assertion dropped, steps renumbered (SC3, D-10) | Pattern 6 |
| AUTHID-04 | One user per candidate: a partial unique index on `grants (target_id)` for candidate-editor rows; organizations stay multi-editor; `writeEntityGrant` (both copies) treats a unique violation as success only when it names `grants_user_scope_target_role_key` (SC4, D-11, D-12) | Pattern 3; D-11 precondition probe found ONE violator (`12-user-can`) — Pitfall 1 |
| AUTHID-05 | The column is gone from `candidates` and `organizations` with its two indexes, comment entries, `seed.sql` value, dev-seed permitted keys, `column-map.ts`, regenerated migration and types, pgTAP fixtures and vacuous guards, and the E2E admin client + both bank-auth specs (SC5, D-13, D-14, D-16, D-17, D-18) | File inventory § Architecture; Pattern 7 (E2E helpers) |
| AUTHID-06 | `anon` can read no auth user id from any table except the one named exemption `nominations.created_by`: a pgTAP catalog census plus a behavioural check, observed red against the tree with the column present before the drop lands (SC6 narrowed by D-02, D-15) | Pattern 8; census SQL probed: today returns `candidates.auth_user_id, nominations.created_by, organizations.auth_user_id` |
| AUTHID-07 | Every file the phase touches passes `CLAUDE.md` § Comment Hygiene as a whole; no comment narrates the retirement (SC7, D-19) | Hygiene measurement table § Pitfall 9 |
| AUTHID-08 | Gates green in order: lint:check → unit → db:reset + pgTAP → candidate E2E → bank-auth 3× → full E2E, cardinal rule (SC8, D-20) | § Validation Architecture |
| AUTHID-09 | `.claude/skills/database/*` (4 files) describe the grant as the only user→entity link; the savedanswers todo is annotated; the two residue todos are filed (D-04, `<deferred>`) | § Runtime State Inventory / D-04 file list |
</phase_requirements>

## Summary

The phase is a column retirement whose real work is re-deriving "which entity am I" from `public.grants`. Every mechanism the locked decisions name was built and exercised against the live local database inside rolled-back transactions this session: a `private.caller_entity_ids` SECURITY DEFINER helper plus a `plpgsql` INVOKER `get_candidate_user_data` returned the candidate's own row from the grant, returned nothing to a project admin (proving it does not route through `user_can`), resolved the organization arm, returned nothing to `anon`, and raised SQLSTATE `P0001` with HINT `ERR_ENTITY_IDENTITY_AMBIGUOUS` (read back via `GET STACKED DIAGNOSTICS`) when a caller held two candidate-editor grants in one project. `plpgsql_check` reported nothing on the prototype. The D-15 census query, run today, returns exactly the three expected columns, so it is red now and goes green after the drop.

Three findings change plans and are not in CONTEXT. **(1) The D-11 precondition fails:** with the partial unique index injected into every pgTAP file's transaction, 34 of 35 files passed every assertion, but `12-user-can.test.sql` aborts on its own fixture — its "union caller" (`…0000000000f4`) holds `(entity, candidate, candidate_a, editor)` alongside `candidate_a`'s identical-target grant. Retargeting that one row to `test_id('candidate_a2')` is safe (its only assertions are at project scope). **(2) Fact 12 is partly wrong:** `set_test_user` called with a non-empty grants array runs `test_seed_fixture_grants()` and writes all eight identities' grant rows, so every file that impersonates through `test_user_grants(...)` already has table rows; `21-entity-organization` (the only caller of the RPC) needs no new seeding. **(3) D-18 is internally inconsistent:** "two private helpers" cannot be used by the two specs; `candidate-bank-auth.spec.ts` uses a raw `createServiceRoleClient`, not `SupabaseAdminClient`.

The constraint-naming obligation of D-11 was also measured: inserting an exact duplicate grant with the new index present reports `grants_user_scope_target_role_key` (the older index is checked first), and a second user on the same candidate reports the new index. So the idempotent re-write on identity-callback's existing-candidate branch stays a success, and a hijack attempt becomes a throw.

**Primary recommendation:** Follow D-21's four plans, but (a) fix `12-user-can`'s union caller in plan 01 together with the index, (b) land the D-15 census in plan 01 inside a pgTAP `todo_start/todo_end` block after recording the red run (verified: `supabase test db` reports `Failed (TODO)` yet `Result: PASS`), and remove the TODO wrapper in plan 03, (c) put the compensating delete in `candidateRecord.ts` (a `deleteCandidate` helper with a project filter), not inline in `index.ts`.

## Project Constraints (from CLAUDE.md)

- **Comment Hygiene** (applies under `apps/`, `packages/`, `tests/`): no historical narrative; no planning references beyond bare `see phase N` / `see spike N` (no `.planning/` paths, `§` anchors, plan numbers, `D-NN`, milestone tags); nothing addressed to the reviewer (else tag `[PR review]`); concise, only where the code cannot speak; TSDoc on exported symbols still required. `CLAUDE.md`, `.agents/`, `.claude/`, `.planning/` are exempt.
- **E2E Hard Rule:** failing E2E is a cardinal failure; no "known-flaky" exemptions; "did not run" = failure.
- **E2E preflight:** every run asserts the served app is this checkout and serves the suite's project; `tests/scripts/e2e-run.sh` owns its dev server (default `FRONTEND_PORT=5273`).
- **After a schema change:** `yarn db:types` regenerates `packages/supabase-types/`, `yarn db:lint:sql` lints the applied DB.
- **TypeScript strictly** — avoid `any`.
- **Never commit secrets** — the bank-auth test env files live in `/tmp`, never in `.env` or `functions/.env`.
- **Code review checklist** `.agents/code-review-checklist.md` applies.
- **Database skill review items** (`.claude/skills/database/SKILL.md` § Reviewing Database Changes): new SECURITY DEFINER functions use schema-qualified calls and `SET search_path = ''`; new pgTAP files follow the BEGIN/`plan`/`create_test_data()`/`finish()`/ROLLBACK pattern; **rule 6b: never nest a SECURITY DEFINER call inside another** (drives the helper's shape — Pattern 1).
- **Standing memory rules:** never read a gate's status through a pipe; content-anchor every citation (line numbers in this document are hints); `lint:check` is a `&&` chain — a red early link hides later guards; `yarn format:check` is a separate gate.

## Baseline Re-verification (D-01, against HEAD `ec0cd7810`)

`git diff --stat 89a4bd9ff HEAD -- ':!.planning'` is empty `[VERIFIED: git]`, so the code the facts were scouted on is byte-identical to the planning base.

| # | Verdict | Evidence / correction |
|---|---------|-----------------------|
| 1 | Confirmed | `git grep auth_user_id -- apps/supabase/supabase/schema`: 302 hits are all comment lines; none in 400-storage or `custom_access_token_hook` `[VERIFIED: git grep]` |
| 2 | Confirmed | `503-entity-rpcs.sql` lines 173–209: `LANGUAGE sql STABLE SECURITY INVOKER`, both arms `WHERE c.auth_user_id = (SELECT auth.uid())` / `WHERE o.auth_user_id = (SELECT auth.uid())`, ending `LIMIT 1;` `[VERIFIED: Read]` |
| 3 | Confirmed | `invite-candidate/index.ts` step 7 `.update({ auth_user_id: inviteData.user.id })`; `candidateRecord.ts` `auth_user_id: authUserId`; `seed.sql` "Test candidate record linked to the candidate user" `[VERIFIED: Read]` |
| 4 | Confirmed | `303-column-grants.sql` lines 19 and 57 are comments `[VERIFIED: Read]` |
| 5 | Confirmed | `ls migrations` → `00001_initial_schema.sql` only; `yarn schema:regenerate` = `node scripts/assert-schema-migration-parity.mjs --write` `[VERIFIED: package.json]` |
| 6 | Confirmed | `300-auth-tables.sql:23` `CONSTRAINT grants_user_scope_target_role_key UNIQUE NULLS NOT DISTINCT (user_id, scope, target_type, target_id, role),`; `:56` `REVOKE ALL ON TABLE public.grants` `[VERIFIED: Read]` |
| 7 | Confirmed | both `entityGrant.ts` copies byte-identical (`diff` exit 0); `:23` `const UNIQUE_VIOLATION = '23505';`, `:79` `if (error && error.code !== UNIQUE_VIOLATION) {` `[VERIFIED: Read]` |
| 8 | Confirmed, and sharpened | With lookup by grant, the existing-candidate branch is reached **only** when the grant already exists, so its re-write is always a no-op; the "repair" rationale in the `on BOTH branches` comment becomes false and must be rewritten (D-19). |
| 9 | Confirmed | five methods read; `deleteAllTestUsers` has **no callers** (`git grep` over `tests/ packages/ apps/`) `[VERIFIED: git grep]` |
| 10 | Confirmed | `invite-candidate/flowConformance.test.ts` "rolls back the invited auth user as well as the candidate, and treats a failed link as fatal": `.toBe(2)` and `toContain('Failed to link the invited user to the candidate record')` `[VERIFIED: Read]` |
| 11 | Confirmed | census query (Pattern 8) returns `nominations.created_by` today `[VERIFIED: psql probe]` |
| 12 | **Partly wrong** | `00-helpers.test.sql` `set_test_user`: `v_asserts_grants := p_user_grants IS NOT NULL AND jsonb_typeof(p_user_grants) = 'array' AND jsonb_array_length(p_user_grants) > 0;` … `PERFORM test_seed_fixture_grants();` (lines ~299–307) `[VERIFIED: Read]`. Any `set_test_user(..., test_user_grants('x'))` call writes all eight fixture identities' rows. Files that pass `'[]'::jsonb` everywhere (12-user-can) write none. `21` Section 8 calls `set_test_user('authenticated', test_user_id('candidate_a'), test_user_grants('candidate_a'))` first, then inserts its project-B grant explicitly — it already has rows. |
| 13 | Confirmed | `07-rpc-security.test.sql` census expects `'get_entity_basic_data,project_open_for_voters,storage_path_can,storage_path_is_public,user_can,user_has_account_grant'`; the private-helper count asserts `'10/0/10'` over a **named list** of ten, so an eleventh private helper does not disturb it `[VERIFIED: Read]` |
| 14 | Confirmed, list incomplete | 40 files `[VERIFIED: git grep -c]`. Additional: `permittedKeys.ts` has a **third** hit (the comment "`auth_user_id` is not (its camel form differs)"); `05-organization-admin.test.sql` also asserts `AND NOT (r ? 'auth_user_id')` on `get_entity_basic_data`'s projection (same vacuity class as D-16); `20-storage-authority.test.sql` has **two** guard sites (the INSERT-pair structural check and the "absence set" #25); `503-entity-rpcs.sql`'s `get_entity_basic_data` comment lists `auth_user_id` under "Withheld today"; 9 `tests/` comment-only files (Pitfall 9). |
| 15 | Confirmed | `git merge-base --is-ancestor feat/165-results-navigation-redraw HEAD` → true; `HEAD..ship/v2.15-13-review-fixes` = `6a60390d7` touching only `NavItem.svelte`; `gh pr view 888/889` → `OPEN` / `OPEN` `[VERIFIED: git, gh]` |
| 16 | Confirmed, and wider | Measured per-file hygiene hits in § Pitfall 9 (77 mechanical hit lines across 13 of 45 touched files). |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| "Which entity am I" (candidate app load) | Database (`private.caller_entity_ids` definer + INVOKER RPC) | Frontend server (`supabaseDataWriter` → `(protected)/+layout.server.ts` `.catch`) | Identity must come from the authority table; RLS still governs row visibility |
| Ambiguity detection (2+ entities in one project) | Database (RPC RAISE) | Frontend server (surfaces as `loginFailed`) | Invariant lives once, for every caller (D-06) |
| One user per candidate | Database (partial unique index) | Edge Functions (`writeEntityGrant` maps only the named key to success) | Schema-enforced, not convention |
| Bank-auth find-or-create | Edge Function `identity-callback` (service role) | Database (`cleanup_grants_on_delete` trigger completes the compensating delete) | Service-role path bypasses RLS, so the project filter lives in the query |
| Invite | Edge Function `invite-candidate` | — | Grant write is the only link |
| anon exposure guard | Database tests (pgTAP census) | — | Catalog-level, so new FK columns are caught |
| E2E identity fixtures | Test harness (`SupabaseAdminClient`, service role) | — | Mirrors product link semantics |

## Standard Stack

No new libraries. Everything uses what the repo already pins.

### Core
| Tool | Version (measured) | Purpose | Why |
|------|--------------------|---------|-----|
| Supabase CLI | 2.83.0 (`npx supabase --version`) | `db reset`, `test db` (pg_prove), `gen types`, `functions serve` | Repo-pinned via `catalog:` `[VERIFIED: local]` |
| PostgreSQL (local stack) | Supabase-managed; `plpgsql_check` available | schema, pgTAP, `plpgsql_check` | `[VERIFIED: pg_available_extensions]` |
| pgTAP | installed transiently by `supabase test db` (it creates and drops the extension itself) | DB tests | `[VERIFIED: probe — extension list identical before/after]` |
| vitest | `catalog:` | Edge Function source/shape tests (`apps/supabase/vitest.config.*` includes `supabase/functions/**/*.test.ts`) | `[VERIFIED: Read]` |
| Playwright | 1.58.2 | E2E | `[VERIFIED: npx playwright --version]` |

**Installation:** none.

## Package Legitimacy Audit

This phase installs no external packages.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| — | — | — | — | — | — | No installs |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
 Candidate browser ──login──▶ SvelteKit (protected)/+layout.server.ts
                                   │ dataWriter.getCandidateUserData()
                                   ▼
                    PostgREST rpc/get_candidate_user_data (role: authenticated, JWT with grants claim)
                                   │  SECURITY INVOKER, plpgsql
                                   ▼
                    private.caller_entity_ids(p_project_id, p_entity_type)   [SECURITY DEFINER, search_path='']
                       reads public.grants WHERE user_id = auth.uid(), scope='entity', role='editor', target_type
                       + EXISTS on the entity table for project_id   (no nested definer call)
                                   │ uuid[]
                         ┌─────────┴──────────┐
                     >1 id                 0..1 id
                       │                     │
            RAISE P0001 HINT            SELECT row FROM candidates|organizations
     ERR_ENTITY_IDENTITY_AMBIGUOUS      WHERE id = ANY(ids) AND project_id = p_project_id
                       │                     │   (caller RLS applies — visibility via claim/user_can)
                       ▼                     ▼
            .catch → log + loginFailed   row → candidate app

 Bank-auth (identity-callback, service role):
   find auth user ─▶ findExistingCandidate: grants(user_id, entity, candidate, editor) → ids → candidates(project_id, id IN ids).maybeSingle()
        │ found ───────────────────────────────▶ writeEntityGrant (dup → names grants_user_scope_target_role_key → success)
        │ none ─▶ createCandidate (no auth link) ─▶ writeEntityGrant ── throws ─▶ deleteCandidate(project, id) [log on failure] ─▶ rethrow
 Invite (invite-candidate): create candidate ─▶ invite user ─▶ writeEntityGrant ── throws ─▶ rollbackInvite ─▶ 500
 Write-side invariant: UNIQUE INDEX grants(target_id) WHERE entity/candidate/editor  (second user → 23505 naming the new index → ERR_GRANT_WRITE_FAILED)
```

### Component Responsibilities (file → change)

| File | Plan | Change |
|------|------|--------|
| `apps/supabase/supabase/schema/301-auth-functions.sql` | 01 | add `private.caller_entity_ids` before the `GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private` statement; add it to the header function list; the "policy-only helpers" wording becomes "helpers" |
| `schema/300-auth-tables.sql` | 01 | add the D-11 partial unique index next to `idx_grants_scope_target` (the `grants` table is created in 300, so the index cannot live in 200) |
| `schema/503-entity-rpcs.sql` | 01 (RPC), 03 (comment "Withheld today: …auth_user_id…") | rewrite `get_candidate_user_data` |
| both `functions/*/entityGrant.ts` (+ `.test.ts`) | 01 | name the constraint; keep the two copies byte-identical |
| `tests/database/12-user-can.test.sql` | 01 | retarget the union caller's entity grant (Pitfall 1) |
| new `tests/database/36-entity-identity.test.sql` (name: discretion) | 01 (TODO-wrapped census), 03 (unwrap) | census, behavioural check, RPC behaviour, helper placement, index by name |
| `functions/identity-callback/{candidateRecord.ts,candidateRecord.test.ts,index.ts,flowConformance.test.ts}` | 02 | D-08, D-09 |
| `functions/invite-candidate/{index.ts,flowConformance.test.ts}` | 02 | D-10 |
| `tests/tests/utils/supabaseAdminClient.ts`, both bank-auth specs, 9 comment-only `tests/` files | 02 | D-18 |
| `schema/102, 200, 302, 303, 502, 503`, `seed.sql`, regenerated `migrations/00001_initial_schema.sql`, `packages/supabase-types/src/database.ts`, `column-map.ts`, dev-seed (4 files), pgTAP `00, 02, 03, 05, 09, 14, 20, 21` | 03 | the drop |
| `.claude/skills/database/*` (4), todo annotation, two residue todos | 04 | D-04 / deferred |

### Pattern 1: The private definer helper (non-nesting form)
**What:** returns the caller's own entity ids of one type in one project, from the table.
**Placement:** `301-auth-functions.sql`, **before** the `GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO anon, authenticated, service_role;` statement — that `GRANT … ON ALL` only reaches functions that exist when it runs, so a helper defined later (e.g. in 503) would not be covered by the stated grant (it would still be executable through PostgreSQL's default PUBLIC EXECUTE, which the 301 comment explicitly says it does not rely on) `[VERIFIED: Read 301-auth-functions.sql:698-702]`.
**Why not `private.entity_project_id`:** calling it from inside a definer helper is a nested definer call, which `SKILL.md` rule 6b forbids. The CASE/EXISTS form below inlines the hop.
```sql
-- Source: prototype probed this session (rolled back), 9/9 assertions green
CREATE OR REPLACE FUNCTION private.caller_entity_ids (
  p_project_id uuid,
  p_entity_type public.entity_type
) RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT g.target_id
  FROM public.grants g
  WHERE g.user_id = (SELECT auth.uid())
    AND g.scope = 'entity'
    AND g.role = 'editor'
    AND g.target_type = p_entity_type
    AND CASE p_entity_type
          WHEN 'candidate' THEN EXISTS (SELECT 1 FROM public.candidates e WHERE e.id = g.target_id AND e.project_id = p_project_id)
          WHEN 'organization' THEN EXISTS (SELECT 1 FROM public.organizations e WHERE e.id = g.target_id AND e.project_id = p_project_id)
          WHEN 'faction' THEN EXISTS (SELECT 1 FROM public.factions e WHERE e.id = g.target_id AND e.project_id = p_project_id)
          WHEN 'alliance' THEN EXISTS (SELECT 1 FROM public.alliances e WHERE e.id = g.target_id AND e.project_id = p_project_id)
        END;
$$;
```
Enum values used, verbatim from `000-enums.sql:24-37` `[VERIFIED: Read]`: `CREATE TYPE public.entity_type AS ENUM('candidate','organization','faction','alliance')`, `CREATE TYPE public.grant_scope_type AS ENUM('global', 'account', 'project', 'entity');`, `CREATE TYPE public.grant_role_type AS ENUM('admin', 'editor');`. Unqualified literal comparison against an enum column under `search_path = ''` has repo precedent in `cleanup_grants_on_delete` (`g.scope = 'entity'`, 300-auth-tables.sql) and worked in the probe.

### Pattern 2: The INVOKER RPC in plpgsql
Keep the `) RETURNS TABLE (` line and the 14 column lines exactly as today: `scripts/assert-rpc-return-nullability.mjs` harvests them from the schema tree and compares against the DERIVED block of `RPC-NULLABILITY.md` `[VERIFIED: ran the script — "get_candidate_user_data 14 … 0 violation(s)"]`. Keep the `UNION ALL` with the `NULL::jsonb` / `NULL::timestamptz` / `NULL::text` literals so that document's hand-written evidence stays true and the file stays untouched (D-03).
```sql
-- Source: prototype probed this session (rolled back)
) LANGUAGE plpgsql STABLE SECURITY INVOKER
SET
  search_path = '' AS $$
DECLARE
  v_entity_ids uuid[];
BEGIN
  v_entity_ids := ARRAY (SELECT private.caller_entity_ids (p_project_id, p_entity_type));
  IF cardinality(v_entity_ids) > 1 THEN
    RAISE EXCEPTION 'The caller holds an editor grant on more than one % in this project', p_entity_type
      USING ERRCODE = 'P0001', HINT = 'ERR_ENTITY_IDENTITY_AMBIGUOUS';
  END IF;
  RETURN QUERY
  SELECT c.id, c.project_id, NULL::jsonb, c.short_name, c.info,
         c.color, c.image, c.sort_order, c.subtype,
         c.custom_data, c.answers, c.terms_of_use_accepted,
         c.first_name, c.last_name
  FROM public.candidates c
  WHERE c.id = ANY (v_entity_ids)
    AND c.project_id = p_project_id
    AND p_entity_type = 'candidate'
  UNION ALL
  SELECT o.id, o.project_id, o.name, o.short_name, o.info,
         o.color, o.image, o.sort_order, o.subtype,
         o.custom_data, o.answers, NULL::timestamptz,
         NULL::text, NULL::text
  FROM public.organizations o
  WHERE o.id = ANY (v_entity_ids)
    AND o.project_id = p_project_id
    AND p_entity_type = 'organization';
END;
$$;
```
- Every column reference is alias-qualified; in plpgsql the `RETURNS TABLE` names (`id`, `project_id`, …) are OUT variables and an unqualified `id` would be ambiguous. `plpgsql_check_function` reported nothing on this body `[VERIFIED: probe]`.
- The message names no uuid: `+layout.server.ts` logs `e.message` (`log.error(\`Error fetching user data: ${e?.message …}\`)`) and `supabaseDataWriter` wraps it as `Failed to load candidate data: ${error?.message}` `[VERIFIED: Read]`.
- Keep the existing `GRANT EXECUTE … TO authenticated` line; no new REVOKE is needed (anon gets zero rows because `auth.uid()` is NULL — probed).
- `SET search_path = ''` on an INVOKER function is optional; `upsert_answers` in the same file does not pin it. Pinning is harmless here because every reference is qualified.

### Pattern 3: The D-11 index and the constraint-named idempotency
```sql
-- 300-auth-tables.sql, after idx_grants_scope_target. Name: discretion; repo convention is idx_<table>_<what>.
CREATE UNIQUE INDEX idx_grants_one_candidate_editor ON public.grants (target_id)
WHERE
  scope = 'entity'
  AND target_type = 'candidate'
  AND role = 'editor';
```
Measured behaviour with the index present `[VERIFIED: psql probe, rolled back]`:
```
-- exact duplicate of an existing candidate-editor grant:
ERROR:  duplicate key value violates unique constraint "grants_user_scope_target_role_key"
-- a second user on the same candidate:
ERROR:  duplicate key value violates unique constraint "probe166_one_candidate_editor"
-- pg_index order on public.grants: grants_pkey 18998, grants_user_scope_target_role_key 19000, idx_grants_scope_target 19007, probe index 21346
```
The exact-duplicate case names the five-column key because unique indexes are checked in index-OID order and the table's own key was created first; in a from-scratch migration the new index is always created after it `[ASSUMED: PostgreSQL checks indexes in OID order — consistent with the probe, not read from PG source this session]`. Add a pgTAP assertion pinning both messages by name (Pattern 8) so the ordering cannot change silently.

`writeEntityGrant` change (both copies byte-identical; note `flowConformance` asserts `GRANT_MODULE_SOURCE` does **not** contain `'candidate'`, so name the key, not the entity):
```ts
/** The grant key whose violation means this exact grant already exists. */
const GRANT_KEY = 'grants_user_scope_target_role_key';
// …
if (error && !(error.code === UNIQUE_VIOLATION && error.message.includes(GRANT_KEY))) {
  throw Object.assign(new Error(`Grant write failed: ${error.message}`), { code: 'ERR_GRANT_WRITE_FAILED' });
}
```
PostgREST passes the PostgreSQL message through as `message` with `code: '23505'` (the existing `entityGrant.test.ts` fake already uses `message: 'duplicate key value violates unique constraint "grants_user_scope_target_role_key"', code: '23505'`) `[VERIFIED: Read entityGrant.test.ts]`. Add a test: `code: '23505'` with a message naming the partial index → rejects with `ERR_GRANT_WRITE_FAILED`.

### Pattern 4: `findExistingCandidate` as two queries (D-08)
```ts
const { data: grants, error: grantError } = await client
  .from('grants')
  .select('target_id')
  .eq('user_id', authUserId)
  .eq('scope', 'entity')
  .eq('target_type', 'candidate')
  .eq('role', 'editor');
if (grantError) throw lookupFailed(grantError.message);
const ids = (grants ?? []).map((g) => g.target_id);
if (ids.length === 0) return null;
const { data, error } = await client
  .from('candidates')
  .select('id')
  .eq('project_id', projectId)
  .in('id', ids)
  .maybeSingle();
if (error) throw lookupFailed(error.message); // two rows in one project land here
return data;
```
- `CandidateLookupClient` must model a **thenable** builder (`await client.from('grants').select(...).eq(...)` resolves without a terminal call) plus `in` and `maybeSingle`; the hand-built fake in `candidateRecord.test.ts` returns `builder` from `eq` and must gain `in` and `then`.
- The test "names the project on every candidates query the helper module issues" scans every `.from('candidates')` chain in `candidateRecord.ts` up to its first `;` and requires `project_id` in it `[VERIFIED: Read]` — so the candidates chain must keep `.eq('project_id', …)` and the new delete helper (Pattern 5) must carry it too.

### Pattern 5: Compensating delete on identity-callback's create branch (D-09)
Constraints from the existing source-text tests `[VERIFIED: Read]`:
- `candidateRecord.test.ts` "holds no candidates chain of its own at all": `index.ts` must contain **no** `.from('candidates')` → the delete lives in `candidateRecord.ts` as e.g. `deleteCandidate(client, { projectId, candidateId })` with `.eq('id', …).eq('project_id', …)`.
- `identity-callback/flowConformance.test.ts`: `INDEX_SOURCE.indexOf('candidateId = candidate.id;\n    }\n')` must precede `'await writeEntityGrant(supabaseAdmin'`, and `'await writeEntityGrant('` must occur **exactly once**; `entityType:\s*'([a-z]+)'` must match exactly `['candidate']`.
- `envReadSites.test.ts` asserts `INDEX_SOURCE` contains the **comment text** `'five ERR_ENV_UNCONFIGURED throws'` and `'Provider-Agnostic Identity Callback Edge Function'`; `verificationLogPrivacy.test.ts` anchors on `'[identity-callback] token verification failed'`. The D-19 sweep must not reword these without updating the tests in the same commit.

Shape that satisfies all of them:
```ts
try {
  await writeEntityGrant(supabaseAdmin, {
    userId,
    entityType: 'candidate',
    entityId: candidateId
  });
} catch (grantError) {
  if (!existingCandidate) {
    await deleteCandidate(supabaseAdmin, { projectId, candidateId }).catch((deleteError: unknown) =>
      console.error('identity-callback: the candidate whose grant write failed could not be deleted:', deleteError)
    );
  }
  throw grantError;
}
```
Deleting the candidate also fires `cleanup_grants_on_delete` (`AFTER DELETE ON public.candidates … cleanup_grants_on_delete ('entity', 'candidate')`, `300-auth-tables.sql`) `[VERIFIED: Read]`, so a grant that was committed but whose response was lost is removed with it. Update the flowConformance test title (it cites `162-REVIEW WR-06`) and add a source-text assertion that the catch arm calls `deleteCandidate(` only on the create branch.

### Pattern 6: invite-candidate (D-10)
Delete the `// 7. Link auth user to candidate record` block and its `if (linkError) { await rollbackInvite(…) … }` arm; renumber `// 8. Return success response` to 7; `flowConformance.test.ts`: `.toBe(2)` → `.toBe(1)`, drop `toContain('Failed to link the invited user to the candidate record')`, retitle. Keep `expect(INDEX_SOURCE).toContain('supabaseAdmin.auth.admin.deleteUser(userId)')` and `not.toContain("Log but don't fail")`.

### Pattern 7: E2E admin client (D-18)
```ts
/** Candidate ids in this project whose candidate-editor grant the user holds. */
async candidateIdsForUser(userId: string): Promise<Array<string>> {
  const { data: grants, error } = await this.client.from('grants').select('target_id')
    .eq('user_id', userId).eq('scope', 'entity').eq('target_type', 'candidate').eq('role', 'editor');
  if (error) throw new Error(`candidateIdsForUser: ${error.message}`);
  const ids = (grants ?? []).map((g) => g.target_id as string);
  if (ids.length === 0) return [];
  const { data: rows, error: cError } = await this.client.from('candidates').select('id')
    .in('id', ids).eq('project_id', this.projectId);
  if (cError) throw new Error(`candidateIdsForUser: ${cError.message}`);
  return (rows ?? []).map((r) => r.id as string);
}
/** The user holding the candidate-editor grant on this candidate, if any (at most one, by the unique index). */
async userIdForCandidate(candidateId: string): Promise<string | null> { /* grants … .eq('target_id', candidateId) … .maybeSingle() */ }
```
- `unregisterCandidate`: (1) find user; (2) `ids = await this.candidateIdsForUser(user.id)`; (3) `update({ terms_of_use_accepted: null }).in('id', ids)` when non-empty; (4) delete grants by `user_id`; (5) delete auth user. **Order (2)→(3)→(4) is the trap** — `grants.user_id` cascades on user delete, and deleting grants first makes (2) return nothing.
- `deleteAllTestUsers`: same ordering. Today it clears only `auth_user_id` and does not reset ToU; D-18 adds the ToU reset. It has **no callers** today, so the behaviour change is unobservable in the suite.
- `forceRegister`: drop step 4 ("Link auth user to candidate record"); the comment "Wrap the 4-step mutation chain" becomes three steps.
- `sendEmail`: select `id, first_name, last_name`; `const linkedUserId = await this.userIdForCandidate(candidate.id)`; if set → `getUserById(linkedUserId)` + magic link; else invite + grant insert (no link update).
- `deleteBankAuthCandidateBySub`: `candidateIdsForUser(user.id)` then delete each candidate (the `cleanup_grants_on_delete` trigger removes their grants; the explicit grant delete may stay for symmetry).
- `findData` already supports `{ id: { $in: ids } }` and scopes non-`grants` tables to `project_id` `[VERIFIED: Read]` — usable by the journey spec.
- Specs: `candidate-bank-auth.spec.ts` `afterAll` → delete the candidate by `probe.body.candidate_id` (or via grants) **before** deleting the user; drop `auth_user_id` from the `.select(...)` and assert a `(entity, candidate, candidate_id, editor)` grant is held by `body.user_id`. `candidate-bank-auth-journey.spec.ts` 6b → candidate ids from the grant, then one candidate row in the project.

### Pattern 8: The anon-exposure census + behavioural check (D-15)
```sql
-- Census: every column carrying a FK to auth.users in a table anon can read, as schema.table.column.
SELECT
  is (
    ARRAY(
      SELECT format('%s.%s.%s', n.nspname, cl.relname, a.attname)
      FROM pg_constraint c
      JOIN pg_class cl ON cl.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = cl.relnamespace
      CROSS JOIN LATERAL unnest(c.conkey) AS k (attnum)
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
      WHERE c.contype = 'f'
        AND c.confrelid = 'auth.users'::regclass
        AND has_column_privilege('anon', c.conrelid, a.attnum, 'SELECT')
        AND (
          NOT cl.relrowsecurity
          OR EXISTS (
            SELECT 1 FROM pg_policy p
            WHERE p.polrelid = c.conrelid
              AND p.polcmd IN ('r', '*')
              AND ('anon'::regrole = ANY (p.polroles) OR 0::oid = ANY (p.polroles))))
      ORDER BY 1),
    ARRAY['public.nominations.created_by'],
    'census: nominations.created_by is the only auth user id anon can read'
  );
-- Behavioural:
SELECT set_test_user ('anon');
SELECT throws_ok ($$SELECT auth_user_id FROM public.candidates$$, '42703', NULL, 'anon cannot select an auth user id from candidates');
SELECT reset_role ();
```
Measured today `[VERIFIED: psql probe]`: the core query (policy branch) returns `candidates.auth_user_id`, `nominations.created_by`, `organizations.auth_user_id`; no public table anon can SELECT has RLS disabled; no policy targets `PUBLIC` (`0 = ANY(polroles)` count 0); `has_column_privilege('anon','public.candidates','auth_user_id','SELECT')` = `t`; as anon, `SELECT auth_user_id FROM public.candidates` returned 327 rows (no exception); a missing column raises SQLSTATE `42703`. So both assertions are red now and green after the drop.

**Landing red without breaking D-21's "each plan green":** wrap the two assertions in `SELECT todo_start('…');` / `SELECT todo_end();` in plan 01 *after* capturing the un-wrapped red run as evidence; plan 03 removes the wrapper. Measured with the real harness `[VERIFIED: supabase test db probe]`:
```
# Failed (TODO) test 2: "anon cannot select auth_user_id"
#       caught: no exception
#       wanted: 42703
All tests successful.
Result: PASS
```
The TODO reason string is a comment-like literal under `apps/` — keep it free of plan numbers (e.g. `'the entity tables still carry the auth user link'`).

Other assertions for the same new file: helper absent from `public`, `prosecdef` true, `proconfig` pins `search_path=""`, `has_function_privilege('authenticated', 'private.caller_entity_ids(uuid, public.entity_type)', 'EXECUTE')`; RPC `prosecdef` false; own row returned; admin_a gets 0 rows; organization arm; ambiguity `throws_ok(…, 'P0001', …)` plus HINT via a `pg_temp` function using `GET STACKED DIAGNOSTICS v_hint = PG_EXCEPTION_HINT` (probed: returned `ERR_ENTITY_IDENTITY_AMBIGUOUS`); the index by name in both directions (second user rejected naming the index, exact duplicate naming the key, a second organization editor admitted, an `entity + admin` row on an already-edited candidate admitted).

### Anti-Patterns to Avoid
- **Routing identity through `user_can`** — true for project/account/global admins; hands an admin an arbitrary candidate (SC1).
- **Parsing the `grants` claim** — stale until token refresh (rejected by D-05).
- **A public SECURITY DEFINER RPC** — breaks the 07 census and makes the function the only gate (rejected).
- **Calling `private.entity_project_id` from the new definer helper** — nested definer call (rule 6b).
- **Treating every `23505` as success** — a second user's grant would silently "succeed" (D-11 obligation 2).
- **Inline `.from('candidates')` in `identity-callback/index.ts`** — fails `candidateRecord.test.ts`.
- **A second migration file** — fails `assert:schema-migration-parity`.
- **Deleting grants before reading candidate ids** in E2E teardown — silent ToU-reset no-op.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Migration file | a hand-written `00002_*.sql` or hand-edit of `00001` | `yarn schema:regenerate` | Byte-parity gate; README two-step rule |
| Generated types | hand-editing `database.ts` | `yarn db:types` after `yarn db:reset` | Drift job diffs generated output |
| Grant cleanup when a candidate is deleted | explicit grant deletes in rollback paths | existing `cleanup_grants_on_delete` trigger | Already fires on every candidate delete |
| One-user-per-candidate check | app-side "does a grant exist?" read before insert | the partial unique index | Race-free |
| Anon exposure regression guard | a list of named columns | catalog census over `pg_constraint` | Catches new FK columns |
| Hint assertion | string-matching the message | `GET STACKED DIAGNOSTICS … PG_EXCEPTION_HINT` | Messages are prose; the HINT is the code |

**Key insight:** the schema already has the right primitives (trigger cleanup, named constraints, `private` schema, pgTAP census pattern). The phase mostly removes a second link; adding parallel mechanisms is the main risk.

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Local stack `openvaa-local`: `candidates.auth_user_id` populated on 1 row (seed); 0 candidates whose `auth_user_id` lacks a matching `(entity, candidate, id, editor)` grant; 0 grants disagreeing with the column; 0 users with two candidate-editor grants in one project `[VERIFIED: psql]`. No hosted database has been published (operator ruling recorded in `assert-schema-migration-parity.mjs` docblock: "no Supabase database has been published") `[CITED: scripts/assert-schema-migration-parity.mjs]` | No data migration. `yarn db:reset` rebuilds local stacks. For any non-local DB (none known), the drop is safe only if every linked candidate already has a grant — the query above is the pre-check |
| Live service config | Supabase hosted project: none published. Edge Functions: served locally by the edge runtime container and, for bank-auth, by `supabase functions serve` from a terminal | Restart any `supabase functions serve identity-callback` process after plan 02 so it serves the new code |
| OS-registered state | None — no launchd/systemd/pm2 entries reference the column | None |
| Secrets/env vars | None reference `auth_user_id` (`git grep` over `.env.example`, function env templates: 0) | None |
| Build artifacts | `packages/supabase-types/src/database.ts` (6 refs); `migrations/00001_initial_schema.sql` (16 refs); the applied local DB schema; pgTAP helper functions committed to `public` by any `supabase test db` run | Regenerate both files; `yarn db:reset` before `yarn db:types` (Pitfall 4) |

## Common Pitfalls

### Pitfall 1: The D-11 index breaks `12-user-can.test.sql`
**What goes wrong:** the file's own INSERT aborts: `ERROR: duplicate key value violates unique constraint … Key (target_id)=(dddddddd-dddd-dddd-dddd-000000000005) already exists.` and every later statement in the transaction fails `[VERIFIED: probe — index injected into all 35 files; 34 files all-ok, 12 aborted]`.
**Why:** the union-caller rows give `'cccccccc-cccc-cccc-cccc-0000000000f4'` an `('entity', 'candidate', test_id ('candidate_a'), 'editor')` grant while `test_user_id ('candidate_a')` holds the same target.
**How to avoid:** in plan 01, change the f4 entity row's target to `test_id ('candidate_a2')` (also project A, no candidate-editor grant in this file). The f4 assertions in "Section 8: the adjacency edge, resolved as a union" ask only `user_can('project', test_id('project_a'), …)` and `pg_temp.allowed('project', test_id('project_a'))`, so they are unaffected. The `f3` row (`entity, candidate, candidate_a, admin`) is not covered by the partial index (role `admin`).
**E2E precondition (static check):** every `forceRegister`/`sendEmail` call site targets a candidate seeded under its own prefix, setups prefix-delete rows first (the delete trigger removes grants), and `unregisterCandidate(email)` precedes each `forceRegister` — no two users are granted one candidate. The full E2E gate is the empirical proof.

### Pitfall 2: Landing a red census in plan 01
**What goes wrong:** committing the census un-wrapped makes `test:db` red from plan 01 to plan 03, contradicting D-21.
**How to avoid:** record the red run first (run the file un-wrapped, save the output under the phase directory), then wrap in `todo_start/todo_end` (Pattern 8). Plan 03 unwraps and the same assertions must pass.

### Pitfall 3: `yarn test:db` does not exist at the repo root
**What goes wrong:** D-20 names `yarn test:db`; root `package.json` has no such script `[VERIFIED: Read package.json]`.
**How to avoid:** use `yarn workspace @openvaa/supabase test:db` (= `supabase test db`).

### Pitfall 4: Generated types leak the pgTAP helpers
**What goes wrong:** `00-helpers.test.sql` commits ~12 `test_*`/`set_test_user`/`create_test_data` functions to `public`; `yarn db:types` run afterwards adds them to `database.ts` `[VERIFIED: probe — 12 functions appeared after running 00-helpers; CITED: project memory]`.
**How to avoid:** order inside plan 03: edit schema → `yarn prettier --write <edited .sql>` → `yarn schema:regenerate` → `yarn db:reset` → `yarn db:types` → then `test:db`.

### Pitfall 5: Prettier rewrites SQL after regeneration
**What goes wrong:** `.sql` under `schema/` and `tests/` is formatted by prettier-plugin-sql; the migration is in `.prettierignore` `[VERIFIED: Read .prettierignore]`. Formatting a schema file after `schema:regenerate` breaks byte parity.
**How to avoid:** format first, regenerate second; run `yarn format:check` as its own gate (it is not part of `lint:check`).

### Pitfall 6: Source-text tests anchor on comment prose
`envReadSites.test.ts` requires the literal `'five ERR_ENV_UNCONFIGURED throws'` and `'Provider-Agnostic Identity Callback Edge Function'` in `identity-callback/index.ts`; `flowConformance.test.ts` requires `'candidateId = candidate.id;\n    }\n'`. The whole-file sweep of `index.ts` must keep these or update the tests in the same commit `[VERIFIED: Read]`.

### Pitfall 7: The existing-candidate grant re-write and the new index
**What goes wrong (feared):** a returning user's idempotent re-write could report the *new* index, read as a hijack, and fail every login.
**Measured:** an exact duplicate reports `grants_user_scope_target_role_key` `[VERIFIED: probe]`. Pin it in pgTAP (Pattern 8) so a future index reorder reddens a test instead of production.

### Pitfall 8: Comment-hygiene Rule 2 (forced line breaks)
`scripts/assert-comment-hygiene.mjs` (in `lint:check`) fails a comment line that ends without terminal punctuation and continues on the next line at the same indent `[VERIFIED: Read header]`. Write each comment paragraph as one line (the schema files already do). The guard is green at HEAD (`exit=0`).

### Pitfall 9: D-19 whole-file sweep is large, and the grep script cannot scope to files
`hygiene-grep-report.sh` scans all of `apps/ packages/ tests/` and takes no file arguments; at HEAD the tree-wide report fails 7 rows (316 planning refs), so `--assert-clean` cannot be the per-phase gate `[VERIFIED: ran it in report mode]`. Use the same PCRE set restricted to the touched-file list, plus extra patterns for the forms the script misses (`162-06`, `162-REVIEW`, `WR-06`, `migration 00002`):
```bash
PAT='(?<![Ss]ee\s)\b[Pp]hases?\s+\d+|(?<![Ss]ee\s)\b[Ss]pikes?[\s\-/]\d+|\bD-\d{2,3}(-\d{2})?\b|§|\.planning/|\b[Pp]lans?\s+\d+[-.]\d+|\b[A-Z]{3,}-\d{2}\b|\b1\d\d-\d\d[a-z]?\b|\b1\d\d-(REVIEW|SPEC|SUMMARY|CONTEXT|FLOW|NEGATIVE)|\b[A-Z]{2}-\d{2}\b|\bmigration 0000\d'
git diff --name-only <phase-base>..HEAD -- apps packages tests | while read -r f; do git grep -n -I -P "$PAT" -- "$f"; done   # expect no output
```
Measured mechanical hit lines on the files this phase must touch (historical narrative needs reading on top):

| Hits | Lines | File |
|-----:|------:|------|
| 24 | 736 | `tests/database/00-helpers.test.sql` |
| 18 | 513 | `tests/database/14-grants-migration.test.sql` |
| 8 | 140 | `functions/identity-callback/flowConformance.test.ts` |
| 7 | 904 | `tests/database/03-anon-read.test.sql` |
| 4 | 240 | `seed.sql` |
| 4 | 35 | `tests/tests/setup/candidate/bank-auth-journey.teardown.ts` |
| 2 each | — | `supabaseAdminClient.ts`, `candidateRecord.test.ts`, both `entityGrant.ts`, `OrganizationsGenerator.test.ts` |
| 1 each | — | `02-candidate-self-edit.test.sql`, `candidateRecord.ts` |
| 0 | — | the other 32 files (incl. `302-rls.sql` 1484 lines, `12-user-can` 1299, `20-storage-authority` 1320, `templates/e2e/base.ts` 1755) — still need a narrative read |

Comment-only `tests/` files whose text becomes false after plan 02 (so they are touched): `setup/admin/admin-access.teardown.ts`, `setup/admin/admin-auth.setup.ts`, `setup/candidate/bank-auth-journey.teardown.ts` (×2), `setup/shared/auth.setup.ts`, `specs/candidate/candidate-journey.spec.ts`, `utils/candidateJourneyConstants.ts`, `utils/adminCredentials.ts`, `utils/testCredentials.ts` `[VERIFIED: git grep]`. Population check at run time: `git grep -l auth_user_id -- ':!.planning'` must end with **only** the new census test file (it names the column inside its `throws_ok` SQL).

### Pitfall 10: Bank-auth gates need two different Edge Function environments
`DEFAULT_TOKEN_OPTS.issuer` is `'https://test-idp.example.com'` (used by `bank-auth`) while the journey's mock issuer mints `https://127.0.0.1:9443` tokens; the function binds `iss` unconditionally `[VERIFIED: Read buildTestIdToken.ts; CITED: project memory 2026-09-09]`. The runbook's journey step ("reuse the Step E-1/E-2/E-3 procedure") still says otherwise at HEAD. Serve `identity-callback` with `IDENTITY_PROVIDER_ISSUER=https://test-idp.example.com` for the `bank-auth` 3× gate and with `https://127.0.0.1:9443` for the `bank-auth-journey` 3× gate.

### Pitfall 11: `supabaseDataWriter.ts` comment cites `LIMIT 1`
`apps/frontend/.../supabaseDataWriter.ts` `_getCandidateUserData`: "Without the project term an identity holding candidate rows in several projects would get whichever row `LIMIT 1` returned." After plan 01 the RPC has no `LIMIT 1`. See Open Question 2.

## Code Examples

### HINT readback for pgTAP
```sql
-- Source: probed this session
CREATE FUNCTION pg_temp.hint_of (p_sql text) RETURNS text LANGUAGE plpgsql AS $f$
DECLARE v_hint text;
BEGIN
  EXECUTE p_sql;
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS v_hint = PG_EXCEPTION_HINT;
  RETURN v_hint;
END $f$;
SELECT is (pg_temp.hint_of (format('SELECT * FROM public.get_candidate_user_data(%L)', test_id ('project_a'))),
  'ERR_ENTITY_IDENTITY_AMBIGUOUS', 'two candidate-editor grants in one project raise the named condition');
```

### How the error reaches the client
PostgREST maps `P0001` to HTTP 400 with body `{"message": …, "details": …, "hint": …, "code": "P0001"}` `[CITED: docs.postgrest.org/en/stable/references/errors.html]`. supabase-js returns it as `error`; `.single()` on the RPC therefore yields `error` and the writer throws `Failed to load candidate data: …`, which `(protected)/+layout.server.ts` logs and turns into `handleError('loginFailed')` `[VERIFIED: Read]`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| identity link column + grant (two links) | grant row only | this phase | one write per flow; organizations multi-editor |
| `LIMIT 1` over a possibly-ambiguous set | RAISE with named HINT | this phase | ambiguity visible as an error |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | PostgreSQL checks unique indexes in index-OID order, so an exact duplicate always names `grants_user_scope_target_role_key` | Pattern 3, Pitfall 7 | Returning bank-auth logins would 500; mitigated by the recommended pgTAP pin, which turns it into a red test |
| A2 | `supabase test db` accepts several file paths in one call (a single directory path was verified) | Validation | Use the full suite or the psql recipe instead |
| A3 | Sourcing the journey IdP env before `tests/scripts/e2e-run.sh` reaches the dev server it spawns (the wrapper `export`s and runs `yarn dev` in a subshell; env inheritance inferred from that, not traced end to end) | Validation | Run the journey with a hand-started server per the runbook instead |
| A4 | The runbook's journey Edge env issuer mismatch still applies (from project memory 2026-09-09; the runbook text is unchanged at HEAD) | Pitfall 10 | A gate run fails with an `iss` rejection that looks like a product defect |
| A5 | `deleteAllTestUsers` gaining a ToU reset has no observable effect (it has no callers today) | Pattern 7 | None in the suite |

## Open Questions

1. **D-18 "private helpers" vs "both bank-auth specs use them".**
   - What we know: private methods cannot be called from specs; `candidate-bank-auth.spec.ts` uses `createServiceRoleClient`, not `SupabaseAdminClient`.
   - Recommendation: make `candidateIdsForUser` / `userIdForCandidate` public methods so the journey spec calls `client.candidateIdsForUser(authUserId)`; in `candidate-bank-auth.spec.ts` use the Edge Function's returned `candidate_id` plus a grants query on its own client. Confirm with the operator at plan review (small deviation from "private").
2. **The `LIMIT 1` sentence in `supabaseDataWriter.ts`.**
   - What we know: CONTEXT puts frontend changes out of scope on the premise "zero `auth_user_id` references"; this sentence references the RPC's old shape, not the column.
   - Recommendation: change that one sentence in plan 01 (and accept the whole-file sweep of a 384-line file with 0 mechanical hits), or record it as a residue. Operator call.
3. **05-organization-admin `AND NOT (r ? 'auth_user_id')`.** Not named by D-16, same vacuity class. Recommendation: remove it in plan 03 with D-16's rationale.
4. **Index name** (discretion): recommend `idx_grants_one_candidate_editor` in `300-auth-tables.sql`.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Docker | local Supabase, edge runtime | ✓ | 29.7.2 | — |
| Local Supabase stack `openvaa-local` | all DB work | ✓ (running, healthy) | CLI 2.83.0 | — |
| psql | probes, evidence capture | ✓ | 17.6 | `supabase test db` |
| Node / Yarn | all | ✓ | v24.14.1 / 4.13.0 | — |
| Playwright + browsers | E2E | ✓ | 1.58.2 | — |
| python3 | static JWKS server for bank-auth (`http.server 8777`) | ✓ | 3.9.16 | any static server |
| Docker VM free disk | full E2E runs (memory: 15 GiB pre-flight threshold) | ⚠ | 14.6 GiB free | `docker builder prune -af`, re-measure with `docker run --rm alpine df -h /` (do not restart Docker — a second Supabase stack runs on this host) |

**Missing dependencies with no fallback:** none.
**Missing with fallback:** VM disk is below the 15 GiB threshold — prune build cache before the full-suite gates.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pgTAP via `supabase test db` (pg_prove); vitest (Edge Functions, dev-seed); Playwright 1.58.2 |
| Config | `apps/supabase/vitest.config.*` (`supabase/functions/**/*.test.ts`); `tests/playwright.config.ts` |
| Quick run | `yarn workspace @openvaa/supabase test:unit` (Edge Function vitest) |
| DB run | `yarn db:reset && yarn workspace @openvaa/supabase test:db` |
| Full suite | `yarn lint:check && yarn format:check && yarn test:unit && yarn db:reset && yarn db:lint:sql && yarn workspace @openvaa/supabase test:db`, then E2E |

### Phase Requirements → Test Map
| Req ID | Behavior | Type | Automated Command | Failure signal | File Exists? |
|--------|----------|------|-------------------|----------------|-------------|
| AUTHID-01 | own row from grant; admin gets none; org arm; anon none; >1 → P0001 + HINT; helper in `private`, definer, pinned; RPC INVOKER | pgTAP | `yarn workspace @openvaa/supabase test:db` | `not ok` in `36-entity-identity` (name: discretion) or `21-entity-organization` Section 8 | ❌ Wave 0 (new file) |
| AUTHID-02 | grant-based lookup with project filter; no column in insert; compensating delete on create branch only | vitest | `yarn workspace @openvaa/supabase test:unit` | `candidateRecord.test.ts` / `flowConformance.test.ts` failures | ✅ (extend) |
| AUTHID-02 (e2e) | bank-auth create path; a second POST with the same identity returns the same `candidate_id` and `is_new_user: false` (proves the grant lookup and no duplicate) | Playwright | bank-auth gate (below) | failed/did-not-run in `bank-auth` | ⚠ add the second-POST case (Wave 0 recommendation) |
| AUTHID-03 | one rollback call, no link step | vitest | `yarn workspace @openvaa/supabase test:unit` | `invite-candidate/flowConformance.test.ts` | ✅ (edit) |
| AUTHID-04 | index rejects a second user by name; exact dup names the key; org multi-editor allowed; `writeEntityGrant` throws on the index, succeeds on the key | pgTAP + vitest | both commands above | `not ok` / vitest failure | ❌ Wave 0 (pgTAP cases), ✅ (`entityGrant.test.ts` extend ×2) |
| AUTHID-05 | column, indexes, keys, types gone | lint + typecheck + pgTAP | `yarn lint:check` (typecheck, `assert:schema-migration-parity`); `git grep -l auth_user_id -- ':!.planning'` lists only the census test file | non-zero exit; extra files listed | ✅ |
| AUTHID-06 | census = `{public.nominations.created_by}`; anon select of the column throws 42703; observed red first | pgTAP | `yarn workspace @openvaa/supabase test:db` | `not ok` (after unwrap) | ❌ Wave 0 |
| AUTHID-07 | no hygiene hits in touched files; Rule 1/2 guard green | script | `yarn assert:comment-hygiene` + the scoped PCRE loop (Pitfall 9) | non-zero exit / any output | ✅ |
| AUTHID-08 | gates in order | all | see Sampling Rate | any red, any did-not-run | ✅ |
| AUTHID-09 | skill docs and todo updated | manual-only (agent docs are exempt from code gates) | `git grep -n auth_user_id -- .claude/skills` → 0 | output non-empty | ✅ |

### E2E commands
- **Candidate specs** (plans 02–04): `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/166-<plan>-candidate --project candidate-journey` and `--project auth-setup` (both pull their dependencies). Exit code 0 is the verdict; the wrapper owns its dev server on `FRONTEND_PORT` 5273 by default.
- **bank-auth 3×** (prerequisites from `tests/IDURA-TEST-RUNBOOK.md` § Deterministic E2E run): write `/tmp/bank-auth-edge.env` (Step E-1; includes `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-0000000000e2`), serve `/tmp/bank-auth-jwks` on 8777 (E-2), `cd apps/supabase/supabase && npx supabase functions serve identity-callback --no-verify-jwt --env-file /tmp/bank-auth-edge.env` (E-3), export `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (from `yarn db:status`), then three consecutive `PLAYWRIGHT_BANK_AUTH=1 tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/166-bankauth-<n> --no-db-reset --project bank-auth`.
- **bank-auth-journey 3×**: same, but the Edge env issuer is `https://127.0.0.1:9443` (Pitfall 10), `source /tmp/bank-auth-journey.env` (Step B-1) in the shell that runs the wrapper, `--project bank-auth-journey`; one fresh dev server per run (the wrapper spawns one). ~11 min each.
- **Full suite**: `yarn db:reset`, then `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/166-full` run in the background with output tee'd and polled (a foreground run trips the 600 s agent watchdog — project memory). Count `did not run` as failure.

### Sampling Rate
- **Per task commit:** `yarn workspace @openvaa/supabase test:unit` (Edge Function tasks) or `yarn db:reset && yarn workspace @openvaa/supabase test:db` (schema/pgTAP tasks); `yarn assert:comment-hygiene` on every task.
- **Per plan merge:** `yarn lint:check` (status read directly, never piped), `yarn format:check`, `yarn test:unit`, `yarn db:reset && yarn db:lint:sql && yarn workspace @openvaa/supabase test:db`, candidate E2E.
- **Phase gate (plan 04):** D-20 order, plus `yarn format:check` and `yarn db:lint:sql` (baseline green at HEAD: `0 error(s), 3 warning(s)`), bank-auth and bank-auth-journey 3× each, then the full suite.

### Wave 0 Gaps
- [ ] New pgTAP file for AUTHID-01/04/06 (census TODO-wrapped in plan 01).
- [ ] `entityGrant.test.ts` (both copies): a `23505` naming the partial index throws `ERR_GRANT_WRITE_FAILED`.
- [ ] `candidateRecord.test.ts`: grant-then-candidate lookup cases, `deleteCandidate` carries the project filter.
- [ ] `candidate-bank-auth.spec.ts`: a second identity-callback POST for the same identity returns the same `candidate_id` (proves the existing branch end to end; today no test reaches it).

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes (bank-auth identity → candidate) | identity-callback verified `sub`; grant written by service role only |
| V3 Session Management | no change | Supabase Auth cookies |
| V4 Access Control | yes | `public.grants` + `user_can` (unchanged); identity from grant rows; partial unique index; `private` schema for the definer helper |
| V5 Input Validation | yes | typed RPC params (`uuid`, `public.entity_type`) |
| V6 Cryptography | no | — |
| V8 Data Protection | yes | removes an anon-readable auth user id from two entity tables (SC6) |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Admin receives an arbitrary candidate as "self" | Elevation | helper filters `scope='entity' AND role='editor'`; never `user_can` (probed: admin_a → 0 rows) |
| Cross-tenant oracle via a public definer function | Info disclosure | helper in `private` (not exposed: `config.toml [api] schemas = ["public", "graphql_public"]`); returns only the caller's own rows |
| Second user grants themselves an existing candidate | Elevation / spoofing | partial unique index + `writeEntityGrant` names the idempotent key |
| Orphan candidate after a failed grant write → duplicate on next login | Tampering (integrity) | compensating delete (D-09); residual double-failure logged |
| anon enumerates auth user ids | Info disclosure | drop + census; `nominations.created_by` recorded residue |
| `search_path` hijack in a definer | Elevation | `SET search_path = ''`, qualified names |
| Error text leaking ids to logs | Info disclosure | RAISE message names only the entity type |

## Sources

### Primary (HIGH confidence)
- Repository files read this session at HEAD `ec0cd7810` (schema 000/102/200/300/301/302/303/502/503, seed.sql, both Edge Functions and their tests, pgTAP 00/03/05/07/09/12/20/21/26, dev-seed permittedKeys/OrganizationsGenerator, column-map, supabaseAdminClient, both bank-auth specs, setup files, playwright config, e2e-run.sh, determinism-batch.sh, IDURA-TEST-RUNBOOK.md, CLAUDE.md, database SKILL.md, scripts/assert-*.mjs, hygiene-grep-report.sh).
- Live probes against the local `openvaa-local` database (all rolled back; helper functions and the pgtap extension removed afterwards; `pg_proc`/`pg_extension` snapshots identical to the pre-probe state; `get_candidate_user_data` source md5 unchanged): index precondition across all 35 pgTAP files, constraint-name ordering, helper + RPC prototype (both helper forms), HINT readback, `plpgsql_check`, census query, anon column read, `todo_start` under `supabase test db`.
- `yarn db:lint:sql` and `node scripts/assert-rpc-return-nullability.mjs` and `node scripts/assert-comment-hygiene.mjs` at HEAD (all exit 0).

### Secondary (MEDIUM confidence)
- PostgREST error mapping — https://docs.postgrest.org/en/stable/references/errors.html (`P0001 | 400`, body includes `hint`).
- Project memory files (bank-auth env and determinism, E2E prerequisites, disk sinks, gate-status piping).

### Tertiary (LOW confidence)
- PostgreSQL unique-index check order (A1) — consistent with the probe, not read from source.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; versions measured.
- Architecture: HIGH — helper, RPC, index and census prototyped against the real schema.
- Pitfalls: HIGH — each one reproduced or read from the anchoring test/script.

**Research date:** 2026-10-01
**Valid until:** 2026-10-31 (stable; re-check if 167/168/169 land first or if the Supabase CLI is bumped)
