---
phase: 174-invitations-grants-defined-in-advance
plan: 02
subsystem: database
tags: [postgres, rls, supabase, pgtap, invitations, grants, authority-map, security-lists]

requires:
  - phase: 174-invitations-grants-defined-in-advance
    provides: "plan 01: 174-NAME-MAP.md, the drivers 174-gates.sh and 174-verdict.mjs, and the green baseline 174-01-baseline"
  - phase: 173-multi-entity-grants-entity-selection
    provides: "public.grants as the only link from a user to an entity, private.entity_project_id, user_can and grant_role_permissions"
provides:
  - "public.invitations: one row promises one grant in the four columns of public.grants, bound to exactly one of a normalised email and the sha256 hash of a server-generated code"
  - "the deny-by-default authority map, inline in admin_insert_invitations, admin_select_invitations and admin_delete_invitations"
  - "public.create_invitations(p_project_id uuid, p_invitations jsonb): SECURITY INVOKER seeding that returns each generated code once and confirms a named target"
  - "39-invitations.test.sql: 122 assertions, every authority-map case through the function and through a direct insert"
  - "the two ratified security lists moved by exactly the two measured permissions, each with its reason"
affects: [174-03, 174-04, 174-05, 174-06, 174-08, 174-10, 175, 178]

actuals:
  tokens: 33550
  tasks: 4
  commits: 4
plan_head_before: 40b36acc7ef60a66e34795688e3020af2d13f443
plan_head_after: 3fd27825e9e5348bdc2f34760764b8b7ac111305

tech-stack:
  added: []
  patterns:
    - "An authority map written inline in one policy per command, so the linter and the enforcement census read its permission literals from pg_policies"
    - "Server-only columns through column privileges plus a BEFORE INSERT trigger: the caller holds no INSERT on the column, the trigger sets it"
    - "A secret handed from a trigger to its calling function through a transaction-local setting that the function reads once and clears"
    - "pgTAP refusals asserted with SQLSTATE and exact message, so a policy refusal, a privilege refusal and a constraint refusal are told apart"

key-files:
  created:
    - "apps/supabase/supabase/schema/305-invitations.sql"
    - "apps/supabase/supabase/schema/506-invitation-rpcs.sql"
    - "apps/supabase/supabase/tests/database/39-invitations.test.sql"
  modified:
    - "apps/supabase/supabase/migrations/00001_initial_schema.sql"
    - "packages/supabase-types/src/database.ts"
    - "apps/supabase/scripts/lint-schema.mjs"
    - "apps/supabase/supabase/tests/database/25-matrix-conformance.test.sql"
    - ".planning/phases/174-invitations-grants-defined-in-advance/174-NAME-MAP.md"

key-decisions:
  - "EXECUTE on the three private code functions is held by authenticated and service_role, not revoked from authenticated as the plan's action says: the SECURITY INVOKER insert trigger calls them as the inserting role, and without it an insert of a code row raises 42501 (measured)"
  - "A non-entity item passes its target_type and target_id through to the table, so the policy and the CHECK constraints refuse a wrong shape; create_invitations itself refuses only what the table cannot see (a non-array batch, a non-object item, an entity item without a type or with not exactly one of target_id and external_id, an external_id on a non-entity item, an unknown external_id)"
  - "A collision of a generated code hash is not retried: it raises 23505 on invitations_code_hash_key and undoes the batch"
  - "The three schema and test commits are titled feat(174-02) and test(174-02) without the [db] tag the review checklist asks for; retitling them needs a history rewrite, which the permission system denied"

patterns-established:
  - "The direct insert is the case that isolates an INSERT policy: an INSERT … RETURNING inside a SECURITY INVOKER function must also pass the SELECT policy, so the function path can stay green while the INSERT policy is too wide"

requirements-completed: [INV-01, INV-02, INV-05]

coverage:
  - id: D1
    description: "public.invitations exists with its ten named CHECK constraints, two unique indexes, three foreign keys, three policies and its column privileges, in the applied database"
    requirement: "INV-01"
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/39-invitations.test.sql Section 1 (15 catalogue assertions); gate row pgtap of 174-02-close"
        status: pass
    human_judgment: false
  - id: D2
    description: "Who may promise which grant is the deny-by-default map, enforced where the row is written: every case refused or admitted identically through create_invitations and through a direct insert, the self-promotion case included; account-scope, global-scope and empty-permission promises are refused for the service role too"
    requirement: "INV-01"
    verification:
      - kind: integration
        ref: "39-invitations.test.sql Section 2 (47 assertions) and Section 3 (4 assertions, no rewrite); negative control M4 in 174-NAME-MAP.md"
        status: pass
    human_judgment: false
  - id: D3
    description: "A duplicate invitation is refused with the first row unchanged; the same address on another target is accepted; a duplicate code hash is refused whatever the target; a batch with one duplicate writes nothing; a claimed row still counts"
    requirement: "INV-02"
    verification:
      - kind: integration
        ref: "39-invitations.test.sql Section 4 (11 assertions)"
        status: pass
    human_judgment: false
  - id: D4
    description: "A code is generated by the server, stored only as a hash, returned once, and cannot be planted, rewritten or read back by an API role"
    requirement: "INV-01"
    verification:
      - kind: integration
        ref: "39-invitations.test.sql Section 5 (16 assertions) and the Section 2 assertions on the returned code and the cleared setting"
        status: pass
    human_judgment: false
  - id: D5
    description: "Seeding through create_invitations confirms a named candidate and a named organization in the same transaction; a nameless target stays unconfirmed; a project-scope promise confirms nothing; deleting the invitation leaves the entity confirmed"
    requirement: "INV-05"
    verification:
      - kind: integration
        ref: "39-invitations.test.sql Section 6 (9 assertions) and the 'deleting an invitation leaves its entity confirmed' assertion of Section 7"
        status: pass
    human_judgment: false
  - id: D6
    description: "anon and entity editors read no row; a project editor, a project admin and an account admin each read exactly the shapes they could promise; an unclaimed row is deleted under the same map and a claimed one by no API role; a row goes with its entity and its project; seeding sends nothing, creates no user and writes no grant"
    requirement: "INV-01"
    verification:
      - kind: integration
        ref: "39-invitations.test.sql Sections 7 and 8 (20 assertions)"
        status: pass
    human_judgment: false
  - id: D7
    description: "The two ratified security lists were edited only as the applied schema reported: SAME_PERMISSION_ALLOW gained two entries, m17_unenforced_ratified lost two members, each with its reason"
    verification:
      - kind: other
        ref: "yarn db:lint:sql and pgTAP file 25 before the edits (M1, M2 in 174-NAME-MAP.md) and after (gate rows sql-lint and pgtap of 174-02-close, both 0)"
        status: pass
    human_judgment: true
    rationale: "The edits widen a ratified security surface under ruling OQ-9, which is itself flagged for operator review; the tools show the lists agree with the schema, not that the two entries are the right policy"
  - id: D8
    description: "The plan closes on eight green gate rows; it made no E2E run, and its boundary proof is the full run that closes 174-03"
    verification:
      - kind: other
        ref: "node 174-verdict.mjs gates 174-02-close --rows typecheck,lint,db-reset,types-regen,types-clean,pgtap,sql-lint,unit — exit 0"
        status: pass
      - kind: e2e
        ref: "the full default suite at the close of 174-03"
        status: unknown
    human_judgment: true
    rationale: "No E2E run was made on this tree. The table and the function have no caller in the application, so a regression is expected to be none, but that is shown only by 174-03's run"

duration: 26min
completed: 2026-10-06
status: complete
---

# Phase 174 Plan 02: The invitation table, its authority map and its seeding function Summary

**`public.invitations` with a deny-by-default authority map inline in its three policies, a server-generated Crockford code stored only as a `sha256` hash, `create_invitations` as a `SECURITY INVOKER` seeding function that confirms a named target, and 122 pgTAP assertions that hold every case through the function and through a direct insert.**

## Performance

- **Duration:** 26 min
- **Started:** 2026-10-06T19:53:36Z
- **Completed:** 2026-10-06T20:19:30Z
- **Tasks:** 4 of 4
- **Files modified:** 8 (3 created, 5 modified)

## Accomplishments

- An invitation is a row that promises one grant in `public.grants`' own four columns. Who may write it is decided by the `INSERT` policy, so a direct insert meets the same refusals as the function; a project editor can promise neither a project editor's nor a project admin's grant.
- The code is generated in the database from `gen_random_uuid()`, 60 bits, stored only as a hash. No API role holds `INSERT` or `SELECT` on `code_hash`, and none holds `UPDATE` on anything.
- `create_invitations` seeds a batch as the caller, returns each generated code once, and confirms a target that has a name.
- The two ratified lists moved by exactly the two permissions the tools reported, and by nothing else.
- Nothing is claimable: no function or trigger of this plan writes `public.grants`, and pgTAP pins that the grant table is unchanged by seeding.

## Task Commits

1. **Task 1: the table, its controls, the authority map and the code; the two ratified lists** - `ea603b205` (feat)
2. **Task 2: `create_invitations` and the confirmation of a named target** - `6c51d7589` (feat)
3. **Task 3: one pgTAP file for INV-01, INV-02 and INV-05** - `3fd1c9ad1` (test)
4. **Task 4: close on eight gate rows** - `3fd27825e` (docs)

**Plan metadata:** the commit that adds this file (docs).

## Names on the tree, for 174-04 and later plans

File numbers used: **305** (`305-invitations.sql`), **506** (`506-invitation-rpcs.sql`), **39** (`39-invitations.test.sql`). All three were free, as the name map measured.

**Table `public.invitations`** — columns `id`, `project_id` (→ `projects`, `ON DELETE CASCADE`), `scope public.grant_scope_type`, `target_type public.entity_type`, `target_id uuid` (no foreign key), `role public.grant_role_type`, `email`, `code_hash`, `pending_email`, `pending_email_at`, `expires_at` (no default), `created_by` (default `auth.uid()`, → `auth.users`, `ON DELETE SET NULL`), `created_at`, `claimed_by` (→ `auth.users`, `ON DELETE SET NULL`), `claimed_at`. "Claimed" is `claimed_at IS NOT NULL`.

**CHECK constraints (ten):** `invitations_entity_scope_target_type_check`, `invitations_target_id_scope_check`, `invitations_scope_check`, `invitations_project_target_check`, `invitations_role_confers_check`, `invitations_binding_check`, `invitations_email_normalised_check`, `invitations_code_hash_format_check`, `invitations_pending_email_check`, `invitations_claimed_by_needs_claimed_at_check`. **Foreign keys:** `invitations_project_id_fkey`, `invitations_created_by_fkey`, `invitations_claimed_by_fkey`.

**Indexes:** unique `invitations_email_target_key` on `(project_id, email, scope, target_type, target_id) NULLS NOT DISTINCT WHERE email IS NOT NULL`; unique `invitations_code_hash_key` on `(project_id, code_hash) WHERE code_hash IS NOT NULL`; `idx_invitations_project_id`, `idx_invitations_scope_target`, `idx_invitations_created_by`, `idx_invitations_claimed_by`, `idx_invitations_pending_email` on `(project_id, pending_email) WHERE pending_email IS NOT NULL`.

**Policies (three, each `TO authenticated`):** `admin_select_invitations`, `admin_insert_invitations`, `admin_delete_invitations`. No `UPDATE` policy.

**Privileges of `authenticated`:** `SELECT` on `id, project_id, scope, target_type, target_id, role, email, expires_at, created_by, created_at, claimed_by, claimed_at`; `INSERT` on `project_id, scope, target_type, target_id, role, email, expires_at`; `DELETE`. Nothing for `anon`. `service_role` keeps its default table privileges and bypasses the policies.

**Functions:**

| Function | Kind | EXECUTE |
|---|---|---|
| `private.normalise_invitation_code(text) → text` | `IMMUTABLE`, invoker | `authenticated`, `service_role` |
| `private.invitation_code_hash(text) → text` | `IMMUTABLE`, invoker; normalises its argument itself | `authenticated`, `service_role` |
| `private.generate_invitation_code() → text` | `VOLATILE`, invoker; returns the code already formatted `XXXX-XXXX-XXXX` | `authenticated`, `service_role` |
| `private.project_account_id(uuid) → uuid` | `STABLE SECURITY DEFINER` | `authenticated` |
| `private.localized_has_text(jsonb) → boolean` | `IMMUTABLE`, invoker | `authenticated`, `service_role` |
| `public.prepare_invitation()` | trigger function, `SECURITY INVOKER` | revoked from `PUBLIC`, `anon`, `authenticated` |
| `public.cleanup_invitations_on_delete()` | trigger function, `SECURITY DEFINER` | revoked from `PUBLIC`, `anon`, `authenticated` |
| `public.create_invitations(p_project_id uuid, p_invitations jsonb) → jsonb` | `plpgsql`, `SECURITY INVOKER` | `authenticated`, `service_role`; not `anon` |

**Triggers:** `prepare_invitation` (`BEFORE INSERT` on `invitations`); `cleanup_invitations_on_delete` (`AFTER DELETE` on `candidates`, `organizations`, `factions`, `alliances`, with the entity type as argument).

**Setting:** `openvaa.generated_invitation_code`, transaction-local. The trigger writes the formatted code into it for a generated row and the empty string for every other insert; `create_invitations` reads it straight after each insert and sets it back to the empty string.

**`create_invitations` contract as built.** Item `{ scope? = 'entity', role? = 'editor', target_type?, target_id?, external_id?, email?, expires_at? }`. Returns a JSON array, one object per item in order, with `id`, `scope`, `target_type`, `target_id`, `role`, `email`, `expires_at`, `code` (null on an email item). SQLSTATE `22023` with these messages, `N` being the item's zero-based index: `create_invitations: p_invitations must be a JSON array`; `… p_invitations[N] must be a JSON object`; `… p_invitations[N] is an entity-scope item and needs a target_type`; `… p_invitations[N] must name its entity by exactly one of target_id and external_id`; `… p_invitations[N] names no <type> with that external_id in the project`; `… p_invitations[N] names an external_id, which only an entity-scope item may`. An invalid enum or uuid in an item raises PostgreSQL's own `22P02`, and an invalid timestamp `22007`. A refused promise raises `42501` (`new row violates row-level security policy for table "invitations"`), a duplicate `23505` naming the index, and for a service-role caller a refused shape raises `23514` naming the constraint.

## pgTAP `plan(N)` deltas

| File | Before | After |
|---|---|---|
| `39-invitations.test.sql` | did not exist | `plan (122)` |
| `25-matrix-conformance.test.sql` | `plan (40)` | `plan (40)`, unchanged: one list lost two members, no assertion was added or removed |
| whole suite | 38 files, 1447 tests | 39 files, 1569 tests |

## The two list edits, verbatim, with their reasons

Both were made only after the tools reported exactly these entries on the applied schema, and neither tool reported anything else (M1 and M2 in `174-NAME-MAP.md` § Measurements).

**`SAME_PERMISSION_ALLOW` in `apps/supabase/scripts/lint-schema.mjs`: one entry → three.** `yarn db:lint:sql` printed, before the edit: `public.invitations: read and write permission sets intersect on 'account.manage_admins'` and `… on 'project.manage_editors'`, `2 error(s), 3 warning(s)`. Added:

```js
  // Whoever may promise a grant may read the promises; the matrix names no separate read member for grant administration. The invitation policies ask `project.manage_editors` for a project editor's promise on the read, the insert and the delete alike, so the intersection is that one capability and not a collapse. The entity arm does keep a read member (`project.read_entities`) apart from its write member (`project.edit_entities`) and needs no entry.
  ['public', 'invitations', 'project.manage_editors'],
  // Whoever may promise a grant may read the promises; the matrix names no separate read member for grant administration. The same construction one level up: `account.manage_admins` is asked for a project admin's promise on all three commands.
  ['public', 'invitations', 'account.manage_admins']
```

**`m17_unenforced_ratified` in `25-matrix-conformance.test.sql`: six members → four.** The suite printed, before the edit: `Failed test 3: "enforcement census: no permission member on the unenforced list is read by any policy"`, `Unexpected records: (project.manage_editors) (account.manage_admins)`. Removed the two `VALUES` rows `('account.manage_admins')` and `('project.manage_editors')`. The three comment lines that said grant administration has no user-facing policy became:

```sql
-- The other two grant-administration members, account.manage_admins and project.manage_editors, are not on the list: the three policies of public.invitations read them, as the authority to promise a project admin's and a project editor's grant.
--
-- The unenforced list, with the reason no policy reads each member:
--   - entity.invite_children: grant administration at entity scope (000-enums.sql names it as project.manage_editors' entity-scope equivalent). public.grants carries no user-facing policy at all, and no policy of public.invitations asks it.
```

The list still holds `entity.invite_children`, `entity.edit_immutable`, `entity.confirm` and `nomination.confirm`. `REACHES_NEITHER_ALLOW` (ten entries) and `MECHANISM_HELPERS` (five) are untouched.

## Gate rows

`174-02-close`, `tests/e2e-runs/174-gates/174-02-close`, first attempt, head `3fd1c9ad1`, window 23:14:25 to 23:17:09 local on AC power under `caffeinate -dimsu`, `sleep_entries_in_window: 0`.

| Row | Status |
|---|---|
| typecheck | 0 |
| lint | 0 |
| db-reset | 0 |
| types-regen | 0 |
| types-clean | 0 |
| pgtap | 0 |
| sql-lint | 0 |
| unit | 0 |

`node 174-verdict.mjs gates 174-02-close --rows typecheck,lint,db-reset,types-regen,types-clean,pgtap,sql-lint,unit` exits 0, on head `3fd1c9ad1` and again on `3fd27825e`. `node 174-verdict.mjs hygiene` exits 0. It is a subset and is judged as one: it holds no `check-frontend`, `build`, `format`, `docs-links` or `name-gate-self-test` row. `yarn prettier --check` on the seven source files this plan wrote, edited or regenerated exits 0, which is what the `format` row would have asked of them.

Each task's own `<automated>` chain was run on the staged tree before its commit and exited 0: Task 1 and Task 2 each from `yarn assert:schema-migration-parity` through a fresh `yarn db:reset`, `yarn db:types`, the types diff, pgTAP, `yarn db:lint:sql` and their gates; Task 3 from the reset through pgTAP. `yarn lint:check` (which holds `yarn typecheck`) exited 0 before each of the two schema commits.

**No E2E run was made.** The full run that closes 174-03 is this plan's boundary proof. A failure there would point back here if it is: a setup or teardown step failing on the new table (a user or entity delete that meets `invitations`, a project teardown); a census or count assertion (a pgTAP census, a unit test that counts the tables or functions of the generated types); or drift of the generated types (`types-clean`). A failure in a voter or contestant flow would not: nothing in the application calls the table or the function.

## Review against the database checklist

Read against `.claude/skills/database/SKILL.md` § *Reviewing Database Changes* and `.agents/code-review-checklist.md`.

- **Does not apply, by design: no `anon` policy.** The table holds invitees' addresses and unused credentials; `anon` holds no privilege on it at all.
- **Does not apply, by design: no `UPDATE` policy.** A row's promise, address and code are immutable for every API role; there is no `UPDATE` privilege either.
- Also outside the standard shape, for the same kind of reason as `grants` and `terms_of_use_acceptances`: the table is not a content table, so it has none of the common columns (`name`, `external_id`, `updated_at`, …), no `set_updated_at` trigger and no `bulk_import` entry.
- Holds: row-level security enabled; every policy names `TO authenticated`; `user_can` and the `private` helper are called inside scalar subqueries; both `SECURITY DEFINER` functions pin `search_path = ''` and qualify every name; indexes on `project_id` and on both user foreign keys (the linter's foreign-key advisor reports no new warning); schema file and regenerated migration in one commit under the parity gate; the pgTAP file follows the transaction boundary and the three assertion patterns.
- The trigger name `prepare_invitation` is the plan's; it is outside the `set_`/`validate_`/`enforce_`/`cleanup_` naming the checklist lists.
- **Not met: the `[db]` commit tag.** See the deviations.
- Every comment in the two schema files, the linter and the two test files describes the code as it is; none carries history, a plan number or a decision id.

## Decisions Made

- **The function leaves shape refusals to the table.** `create_invitations` holds no authority rule and no copy of the CHECK constraints. For a non-entity item it passes `target_type` and `target_id` through, defaulting a project-scope `target_id` to `p_project_id`, so a wrong shape is refused by the policy (for an API caller) or by the constraint (for the service role), with the same message a direct insert gets.
- **A direct insert confirms nothing.** Confirmation is `create_invitations`' act, as D-11 words it ("creating an invitation … in the same transaction"). A project editor who inserts into the table directly leaves the target unconfirmed. pgTAP pins this ("a direct insert confirms nothing"), so a later change of mind shows up as a red assertion.
- **`localized_has_text` has explicit privileges.** The plan names none for it; it follows the three code functions, since the same invoker function calls it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan's revoke on the code functions would have broken every code row**
- **Found during:** Task 1
- **Issue:** the action says `EXECUTE` on `private.normalise_invitation_code`, `private.invitation_code_hash` and `private.generate_invitation_code` is revoked from `PUBLIC`, `anon` and `authenticated`. The insert trigger `prepare_invitation` is `SECURITY INVOKER`, as the plan also requires, so it calls them as the inserting role. Measured in a rolled-back transaction: with the revoke, a project editor's insert of a code row raises `42501 permission denied for function generate_invitation_code`; a `service_role` insert does the same once `PUBLIC` is revoked and nothing is granted back.
- **Fix:** revoke from `PUBLIC` and `anon`; grant to `authenticated` and `service_role`, with the reason in a comment above the statement. The three functions are in `private`, which PostgREST does not expose, read no table and return nothing secret. The alternative, a `SECURITY DEFINER` trigger, contradicts the plan's explicit `SECURITY INVOKER` and was not taken.
- **Files modified:** `apps/supabase/supabase/schema/305-invitations.sql`
- **Verification:** M3 in `174-NAME-MAP.md`; pgTAP "a direct insert with no email writes a second code row" and "the service role seeds an entity editor's promise and receives its code"
- **Committed in:** `ea603b205`

### Not done as the checklist asks

**2. The three schema and test commits carry no `[db]` tag.** `.agents/code-review-checklist.md` asks that every commit containing database changes carry it, and this branch's earlier database commits do (`feat[db](173-02): …`, `test[db](172-01): …`). I noticed after the third commit. Retitling `ea603b205`, `6c51d7589` and `3fd1c9ad1` needs a rewrite of three local, unpushed commits; the attempt was denied by the permission system as a destructive git action, and I did not pursue it another way. The trees are unaffected. Whoever may rewrite history can retitle them, or the tag can be applied when the branch is restructured for review.

### Differences from the wording of CONTEXT, not from the plan

**3. A code-hash collision is not retried.** D-07 says the seeding call resolves a 2⁻⁶⁰ collision "by generating again". The plan asks for one `INSERT` per item and no retry, and that is what is built: a collision raises `23505` naming `invitations_code_hash_key` and undoes the batch, and the caller seeds again. The invoker cannot test for a collision first, having no `SELECT` on `code_hash`. A retry loop around the insert would be the change if the operator wants D-07's sentence literally.

**4. The comment above `m17_unenforced_ratified` gained a sentence.** The two removed members' lines are replaced by one sentence saying which policies read them, and the `entity.invite_children` line no longer says "the same"; the plan asked for a rewording and this is one.

---

**Total deviations:** 1 auto-fixed (Rule 1), 1 checklist item not met and reported, 2 differences noted.
**Impact on plan:** the auto-fix was necessary for code rows to exist at all; it widens nothing that the API can reach. No scope creep: no frontend, harness, Edge Function or configuration file changed (`git diff --stat` over those paths prints nothing).

## Issues Encountered

- **The function path does not isolate the `INSERT` policy.** In the negative control (M4), with the `INSERT` policy weakened to `project.edit_entities` alone, the two self-promotion cases through `create_invitations` stayed green while their direct-insert twins failed. The cause is that `INSERT … RETURNING id` in an invoker function must also pass the `SELECT` policy, which a project editor does not for a project-scope row. It is a second lock on the function path, and it is why the direct-insert half of every case is load-bearing rather than a duplicate.
- **A first probe failed on `invitations_created_by_fkey`.** The default `created_by = auth.uid()` needs the caller to exist in `auth.users`; a claim built for an id that names no user is refused. Real tokens always name one. The pgTAP file creates its two extra identities as `auth.users` rows first.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: privilege | `apps/supabase/supabase/schema/305-invitations.sql` | `authenticated` and `service_role` hold `EXECUTE` on the three private code functions, where the plan's register assumed them revoked. Not reachable through PostgREST; they read no table. A signed-in caller with another route to SQL could compute a hash or draw a code, which gives nothing without `INSERT` on `code_hash` |
| threat_flag: privilege | `apps/supabase/supabase/schema/506-invitation-rpcs.sql` | the same for `private.localized_has_text`, a pure function |

Every other surface this plan adds is in the plan's threat model (T-174-05 to T-174-16).

## Known Stubs

None. The table and the function are complete for the seeding end; nothing calls them from the application yet, which is the plan's stated scope.

## User Setup Required

None - no external service configuration required.

## What 174-03 must know

- This plan made no E2E run; 174-03's full run is its boundary proof (see *Gate rows* for which failures would point back here).
- The local database holds the `default` dataset (752 rows, `yarn db:seed:default` exit 0) on top of the new schema, plus the pgTAP helper functions the gate's `pgtap` row committed into `public`. A `yarn db:types` without a reset first would show them as drift; the gate driver resets in its own row.
- `auth-config` and `stack` rows still do not exist; a gate run before 174-03's own changes names its rows with `--rows`.
- No dev server was started, nothing listens on 5173 or 5273, and no Edge Function was served.

## What 174-04 must know

- `authenticated` holds no `UPDATE` on `invitations`, so `claim_invitations` has to be `SECURITY DEFINER` to set `claimed_by`, `claimed_at` and to clear `pending_email`; it then joins the `authenticated` definer census in `07-rpc-security.test.sql` (seven names → eight).
- Whatever binds a pending address must store `lower(btrim(…))`: `invitations_pending_email_check` refuses anything else, and refuses a pending address on an email row.
- `private.invitation_code_hash` normalises its own argument; pass it the code as typed. A code is compared by hash only.
- The claim must re-ask `private.entity_project_id(target_type, target_id) = project_id`: there is no foreign key on the target, and the policy asked it only when the row was written.
- `SAME_PERMISSION_ALLOW` holds three entries and `m17_unenforced_ratified` four. `entity.invite_children` is still on the unenforced list.
- `39-invitations.test.sql` plans 122 and uses transaction-local settings named `t39.*` to carry a returned value from one role's statement to another's. Its last assertion compares `public.grants` before and after seeding; a claim added to that file goes before it or the baseline is taken again.
- The linter's census is 107 policies over 21 tables; a new policy or table moves it, and a new service-only function in `public` needs its `EXECUTE` revoked from `anon` and `authenticated` or the census in file 07 reddens.

## For the operator

- **J1, J2, J3, OQ-2 and OQ-9 are implemented as the plan states them** and remain flagged for your review. The two list edits are quoted above with their reasons.
- **INV-05 is implemented for all four entity types.** If the Phase 175 discussion decides an invited organization is not confirmed, the change is the `WHEN 'organization'` arm of the confirming `CASE` in `create_invitations` (and, by the same reasoning, the faction and alliance arms) plus the pgTAP rows "a named organization is confirmed from the moment it is seeded" and the Section 8 seeding of `inv-org-mail`.
- **A confirmed, invited, never-signed-in entity with a confirmed nomination is public once the project opens.** Nothing here adds a "has an editor" condition.
- **REQUIREMENTS.md, ROADMAP.md and STATE.md were not edited**, as directed. `requirements-completed` above lists the plan's three ids for their database half: the table, the seeding function and their pgTAP proof. The harness helpers and specs that drive them from outside the database are later plans'.

## Next Phase Readiness

- The model and its seeding end are in the applied database and held by eight green gate rows and 122 assertions.
- Nothing can be claimed until 174-04, which lands after 174-03's auth configuration.
- Open for a decision: the `[db]` tag on three commit titles.

## Self-Check: PASSED

- Files: the three created files, the four modified source files and the name map exist on the tree.
- Commits: `ea603b205`, `6c51d7589`, `3fd1c9ad1` and `3fd27825e` are ancestors of HEAD; `git rev-list --count 40b36acc7..HEAD` printed 4 when this file was written.
- Evidence: `tests/e2e-runs/174-gates/174-02-close` exists and its verdict exits 0 on HEAD.
- The 122 assertions of `39-invitations.test.sql` are 15, 47, 4, 11, 16, 9, 16 and 4 over its eight sections.
