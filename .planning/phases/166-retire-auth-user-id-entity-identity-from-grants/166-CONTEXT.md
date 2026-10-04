# Phase 166: Retire `auth_user_id` — Entity Identity from Grants - Context

**Gathered:** 2026-10-01
**Status:** Ready for planning

**Source of decisions:** `.planning/v2.15-166-169-DISCUSSION-POINTS.md` § *Phase 166* — a shared
checkbox document covering phases 166–169, filled by the operator in one pass (recorded in commit
`e65bed5cf`, "docs(166-169): record the filled discussion decisions"). Its rule: an unticked decision
accepts the `★ RECOMMENDED` option; a ticked box overrules; `**EDIT:**` / `**NOTE:**` free text beats
every box. Phase 166 has 22 decisions (including the baseline check 166-0.1) and no EDIT/NOTE text.
Five boxes were ticked:

- **166-A1 (a), 166-B1 (b), 166-B2 (a), 166-C1 (a)** — each ticked on the ★ itself, so each is an
  explicit confirmation of the recommendation.
- **166-F1 (b) "Sweep the touched files entirely"** — **overrules the ★ (a)** ("rewrite every comment
  block the phase edits, leave untouched blocks alone"). See D-19.

Every other decision takes its ★ option as written. The doc was scouted on `fix/888-review-findings`
at HEAD `89a4bd9ff` (2026-10-01). Anchors below are symbols or content; never trust a line number.

<domain>
## Phase Boundary

The grant is the only link between an auth user and an entity. "Which entity am I" is answered from
the `(entity, <type>, editor)` row in `public.grants`; `invite-candidate` and `identity-callback`
write one link (the grant) instead of two; `candidates.auth_user_id` and `organizations.auth_user_id`
are dropped with their indexes, seed rows, dev-seed keys, generated types, pgTAP fixtures and E2E
admin-client usage; and `anon` can no longer read an auth user id from any entity table — proven by a
pgTAP census observed red against today's tree before the drop lands.

Success criteria are the eight in `.planning/ROADMAP.md` § *Phase 166* (draft; firmed at planning,
where requirements are registered — currently "TBD"). SC6 is **narrowed** by D-02: it covers the
entity tables, and `nominations.created_by` is the single named exemption.

**Not in this phase:**
- Closing `nominations.created_by`'s exposure to `anon` (D-02 — residue todo, see `<deferred>`).
- Any write-time constraint on "one candidate per user per project" (D-12 — the read-time error is
  the guard).
- `apps/docs` pages about candidate registration/auth — Phase 168 owns them (cross-phase notes).
- Dropping the organization arm or the `p_entity_type` parameter of `get_candidate_user_data` (D-03).
- A new migration file (D-13 — the parity gate forbids it).
- Any frontend change: the frontend has zero `auth_user_id` references.

</domain>

<decisions>
## Implementation Decisions

Decision IDs map one-to-one onto the discussion doc's section IDs, given in parentheses. Every
decision below is locked; the planner does not re-open them.

### 0 — Factual baseline

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

### A — Scope boundary

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

### B — The lookup mechanism (SC1–SC3)

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

### C — Users per entity (SC4)

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

### D — Schema change and generated artefacts

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

### E — Tests

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

### F — Comment hygiene and gates

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

### G — Plan shape

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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The phase's own contract
- `.planning/ROADMAP.md` § *Phase 166* — goal and the eight draft success criteria.
- `.planning/v2.15-166-169-DISCUSSION-POINTS.md` § *Phase 166* and § *Cross-phase picture* — the filled
  decision document this file restates.
- `CLAUDE.md` § Comment Hygiene — the SC7 / D-19 rule set.
- `apps/supabase/README.md` "Two SQL directories" — the schema-edit-then-regenerate rule (D-13).
- `tests/IDURA-TEST-RUNBOOK.md` — bank-auth prerequisites inlined into the D-20 gate plan.
- `hygiene-grep-report.sh` — `.claude/skills/ship-review-stack/sources/hygiene-grep-report.sh` (copies
  also under `.planning/phases/151-*/scripts/` and `152-*/scripts/`).

### Schema (`apps/supabase/supabase/schema/`)
- `102-entities.sql` — the column on `candidates` / `organizations`.
- `104-nominations.sql` — `created_by` (the D-02 exemption).
- `200-indexes.sql` — `idx_candidates_auth_user_id`, `idx_organizations_auth_user_id`.
- `300-auth-tables.sql` — `public.grants`, `grants_user_scope_target_role_key`, the API-role REVOKE.
- `301-auth-functions.sql` — `user_can`, `custom_access_token_hook`, `grant_role_permissions`.
- `302-rls.sql` — comments; `anon_select_nominations`.
- `303-column-grants.sql` — "Protected (admin-only) columns" comment lists.
- `502-email-helpers.sql` — the comment citing `candidates.auth_user_id`.
- `503-entity-rpcs.sql` — `get_candidate_user_data`, `get_nominations`.
- `migrations/00001_initial_schema.sql` — generated; never hand-edited.
- `seed.sql` — the "Test Candidate" insert and its grant.

### Edge Functions (`apps/supabase/supabase/functions/`)
- `identity-callback/candidateRecord.ts` (+ `candidateRecord.test.ts`) — `findExistingCandidate`,
  `createCandidate`, `CandidateLookupClient`.
- `identity-callback/index.ts` — step 7 and the "on BOTH branches" grant comment (D-09).
- `identity-callback/entityGrant.ts`, `invite-candidate/entityGrant.ts` — `writeEntityGrant`.
- `invite-candidate/index.ts` — step 7, `rollbackInvite`, step 8.
- `invite-candidate/flowConformance.test.ts` — the rollback count and link-message assertion (D-10).

### pgTAP (`apps/supabase/supabase/tests/database/`)
- `00-helpers.test.sql` — `create_test_data()`, `test_seed_fixture_grants`, `test_seed_identity_grants`.
- `02`, `03`, `05`, `09`, `14`, `20`, `21` (Section 8 grant rows) — current `auth_user_id` references.
- `07-rpc-security.test.sql` — the six-name definer census D-05 must not disturb.
- `12-user-can.test.sql` — its own 13-row grant fixture (D-11 precondition, D-17 reason).

### Types, dev-seed, scripts
- `packages/supabase-types/src/database.ts` (generated), `src/column-map.ts` (`authUserId`),
  `RPC-NULLABILITY.md`.
- `packages/dev-seed/src/template/permittedKeys.ts`, `src/generators/OrganizationsGenerator.ts`,
  `tests/generators/OrganizationsGenerator.test.ts`, `src/templates/e2e/base.ts`.
- `scripts/assert-project-scoped-queries.mjs`.

### E2E
- `tests/tests/utils/supabaseAdminClient.ts` — the five methods (D-18).
- `tests/tests/specs/candidate/candidate-bank-auth.spec.ts`, `candidate-bank-auth-journey.spec.ts`.

### Frontend consumer (read-only for this phase)
- `apps/frontend/src/routes/[[lang=locale]]/candidate/(protected)/+layout.server.ts` — the `.catch`
  that surfaces the D-06 error.
- `supabaseDataWriter.ts` — always calls the RPC with `p_entity_type: 'candidate'`.

### Agent docs and todos
- `.claude/skills/database/{SKILL,schema-reference,rls-policy-map,extension-patterns}.md` (D-04).
- `.planning/todos/pending/2026-06-01-candidate-home-savedanswers-empty-logout-modal.md` (D-04).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `writeEntityGrant` (two copies) — already idempotent on `grants_user_scope_target_role_key`; D-11
  narrows its `UNIQUE_VIOLATION` mapping to that named constraint.
- `rollbackInvite` in `invite-candidate` — the pattern D-09's compensating delete mirrors.
- `test_seed_identity_grants` in `00-helpers.test.sql` — the per-file grant-row seeder D-17 uses.
- `21-entity-organization.test.sql` Section 8 — an existing example of explicit grant-row fixtures.
- The `private` schema — not exposed through PostgREST, so a definer helper there does not enter the
  07 census.

### Established Patterns
- Schema is edited in `schema/*.sql`, then `yarn schema:regenerate` + `yarn db:types`; a single
  generated migration file, enforced by `lint:check`.
- Authorisation reads the `grants` **claim** (`user_can`); this phase introduces the first identity
  lookup that reads the `grants` **table** (through a definer helper).
- Service-role Edge Function queries keep the project filter inside the lookup (module docblock in
  `candidateRecord.ts`).

### Integration Points
- `get_candidate_user_data` ← `supabaseDataWriter.ts` ← candidate `(protected)/+layout.server.ts`.
- `identity-callback` create/existing branches → `writeEntityGrant`.
- E2E setup/teardown call `unregisterCandidate` / `forceRegister` / `deleteAllTestUsers`.

### Comment-only references outside fact 14 (found 2026-10-01, `git grep auth_user_id`)
Fact 14's list is not exhaustive for comments. `tests/tests/setup/admin/admin-access.teardown.ts`,
`admin/admin-auth.setup.ts`, `candidate/bank-auth-journey.teardown.ts` (a NOTE that `unregisterCandidate`
"nulls the candidate's `auth_user_id`"), `shared/auth.setup.ts`, `tests/tests/specs/candidate/candidate-journey.spec.ts`,
`tests/tests/utils/candidateJourneyConstants.ts` ("since the candidate has no auth_user_id yet"),
`adminCredentials.ts` and `testCredentials.ts` also match. Some describe behaviour that becomes false
after the drop and must be corrected under SC7 — which makes those files "touched" and brings them under
D-19's whole-file sweep. Research enumerates the population at run time rather than trusting this list.

</code_context>

<specifics>
## Specific Ideas

- The D-15 red run is evidence, not a formality: capture the failing pgTAP output against the tree
  with the column present before plan 03 drops it.
- D-06's error must be a **named** condition (SQLSTATE `P0001` + a HINT code), asserted with
  `throws_ok`, so the frontend and any other caller see ambiguity as an error rather than a silent pick.
- D-18's ordering rule (read candidate ids → reset ToU by id → delete grants) is the single most
  likely regression; the plan states it explicitly.

</specifics>

<deferred>
## Deferred Ideas

- **Residue: `nominations.created_by` is readable by `anon`** (D-02). Filed as a named todo; it is the
  sole exemption in the D-15 census. Closing it needs column-level SELECT privileges or a side table.
  It is not a vestige, so Phase 167 must not pick it up; it is open when 167 starts.
- **Residue: a failed compensating delete in `identity-callback`** (D-09) is logged, not repaired;
  the orphan-candidate case survives only when both the grant write and the delete fail.
- **Write-time "one candidate per user per project" constraint** (D-12) — not built; revisit only if
  the read-time error is observed in practice.
- **A delegated candidate editor** — excluded by D-11's index; would need a distinguishing role.

## Cross-phase notes

- **Execution is serial: 166 → 167 → 168 → 169.** Planning can run in parallel; each plan names its
  upstream phase as a precondition.
- **168 (docs rewrite):** every candidate-registration or auth page must describe the grant as the only
  link from an auth user to an entity. 166 updates `.claude/skills/database/*`, not `apps/docs`; 168
  takes this CONTEXT as its source for those flows (168-E1 waits for 166).
- **169 (dependency bump):** a Supabase CLI or `supabase-js` bump regenerates `database.ts` after 166
  has regenerated it — run 169's type regeneration against the post-166 schema, and **re-run D-15's
  anon-exposure census in 169's pgTAP gate**.
- **167 (vestige cleanup):** no file overlap found (167 touches `apps/frontend` constants, auth mocks
  and `safeGetSession`). If 167 sweeps `.planning/todos`, the todo annotated under D-04 is closed or
  carried forward, not duplicated; the `nominations.created_by` residue todo is left alone.

</deferred>

---

*Phase: 166-Retire `auth_user_id` — Entity Identity from Grants*
*Context gathered: 2026-10-01*
