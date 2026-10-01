---
phase: 166-retire-auth-user-id-entity-identity-from-grants
plan: 01
subsystem: database
tags: [postgres, supabase, pgtap, rls, security-definer, grants, edge-functions, vitest]

requires:
  - phase: 165 / 165.1
    provides: the fix/888-review-findings tip this phase plans against (precondition verified)
provides:
  - private.caller_entity_ids(uuid, entity_type) SECURITY DEFINER helper (search_path '') over the caller's own editor grants
  - get_candidate_user_data as plpgsql SECURITY INVOKER resolving identity from grants, raising P0001 / ERR_ENTITY_IDENTITY_AMBIGUOUS on ambiguity in both arms
  - idx_grants_one_candidate_editor partial unique index (one editor per candidate; organizations multi-editor)
  - writeEntityGrant treating only grants_user_scope_target_role_key violations as success (both byte-identical copies)
  - 36-entity-identity.test.sql (20 assertions; the anon census pair held as TODO)
  - 166-NEGATIVE-CONTROLS.md rows NC-1..NC-4
affects: [166-02, 166-03, 166-04, identity-callback, invite-candidate, candidate app login]

actuals:
  tokens: 19000
  tasks: 3
  commits: 3
plan_head_before: cb276b0d2d64919e95276c4c372e22fb67b91b65
plan_head_after: 0243dec0be7f311b408511e491145c7251f24c8e

tech-stack:
  added: []
  patterns:
    - "Identity lookup = private SECURITY DEFINER helper reading the caller's own grant rows + an INVOKER RPC over it (no nested definer call, never user_can)"
    - "Ambiguity is an error with a machine-readable HINT, read back in pgTAP via GET STACKED DIAGNOSTICS"
    - "Idempotent writes match the violated constraint by NAME, never by SQLSTATE alone"
    - "A red-before-the-fix pgTAP check is landed inside todo_start/todo_end after its red run is recorded"

key-files:
  created:
    - apps/supabase/supabase/tests/database/36-entity-identity.test.sql
    - .planning/phases/166-retire-auth-user-id-entity-identity-from-grants/166-NEGATIVE-CONTROLS.md
  modified:
    - apps/supabase/supabase/schema/301-auth-functions.sql
    - apps/supabase/supabase/schema/503-entity-rpcs.sql
    - apps/supabase/supabase/schema/300-auth-tables.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - apps/supabase/supabase/tests/database/12-user-can.test.sql
    - apps/supabase/supabase/functions/identity-callback/entityGrant.ts
    - apps/supabase/supabase/functions/invite-candidate/entityGrant.ts
    - apps/supabase/supabase/functions/identity-callback/entityGrant.test.ts
    - apps/supabase/supabase/functions/invite-candidate/entityGrant.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts

key-decisions:
  - "The ambiguity RAISE message is the plan's lowercase form ('the caller holds an editor grant on more than one % in this project'), pinned verbatim by throws_ok, naming the type and no id"
  - "36-entity-identity carries a 13th catalog assertion beyond the plan's list: authenticated holds the stated EXECUTE ACL entry on private.caller_entity_ids, which only a helper defined BEFORE the private-schema GRANT has (placement proven by a rolled-back probe)"
  - "get_candidate_user_data pins search_path = '' (optional on INVOKER; harmless since every reference is qualified)"
  - "The partial index comment documents that an exact duplicate grant names grants_user_scope_target_role_key because that key is checked first; 36 pins both names so a reorder reddens"

patterns-established:
  - "Constraint-named idempotency: IDEMPOTENT_GRANT_KEY constant; any other 23505 throws ERR_GRANT_WRITE_FAILED"
  - "Census-style anon exposure guard over pg_constraint FKs to auth.users with a single named exemption"

requirements-completed: [AUTHID-01, AUTHID-04, AUTHID-06, AUTHID-07]

coverage:
  - id: D1
    description: "A user whose only link is a candidate-editor grant gets exactly their candidate from get_candidate_user_data, per project; admins, entity-admin holders and anon get none; organization arm resolves"
    requirement: AUTHID-01
    verification:
      - kind: integration
        ref: "yarn db:reset && yarn workspace @openvaa/supabase test:db (36-entity-identity tests 3-8)"
        status: pass
      - kind: e2e
        ref: "tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/166-01-final --project candidate-a11y-scan (17 passed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Two editor grants of the type in one project raise P0001 with HINT ERR_ENTITY_IDENTITY_AMBIGUOUS in both arms, read from the table not the token"
    requirement: AUTHID-01
    verification:
      - kind: integration
        ref: "36-entity-identity tests 9-11 (throws_ok x2 + PG_EXCEPTION_HINT readback)"
        status: pass
    human_judgment: false
  - id: D3
    description: "One editor per candidate by named partial unique index; exact duplicate names the table key; organizations multi-editor; grant write treats only the table key as success"
    requirement: AUTHID-04
    verification:
      - kind: integration
        ref: "36-entity-identity tests 16-20"
        status: pass
      - kind: unit
        ref: "apps/supabase/supabase/functions/*/entityGrant.test.ts#throws when a unique violation names a key other than the grant key"
        status: pass
    human_judgment: false
  - id: D4
    description: "Anon-exposure census and behavioural column check observed red against the tree with the column present, recorded, and held as TODO"
    requirement: AUTHID-06
    verification:
      - kind: integration
        ref: "36-entity-identity tests 1-2 (Failed (TODO), Result: PASS); NC-4 red recorded"
        status: pass
    human_judgment: false
  - id: D5
    description: "Every touched file passes the scoped hygiene scan, assert:comment-hygiene, lint:check and format:check"
    requirement: AUTHID-07
    verification:
      - kind: other
        ref: "bash 166-hygiene-scan.sh <10 files> (CLEAN, exit 0); yarn lint:check exit 0; yarn format:check exit 0"
        status: pass
    human_judgment: false

duration: 17min
completed: 2026-10-01
status: complete
---

# Phase 166 Plan 01: Entity Identity from Grants Summary

**"Which entity am I" now comes from the caller's own `(entity, <type>, <id>, editor)` grant rows through a private SECURITY DEFINER helper and a plpgsql INVOKER `get_candidate_user_data` that raises `P0001` / `ERR_ENTITY_IDENTITY_AMBIGUOUS` on ambiguity. A partial unique index allows one editor per candidate, `writeEntityGrant` treats a unique violation as success only when it names the grant's own key, and the anon-exposure census was observed red and is held as a TODO until 166-03 drops the column.**

## Performance

- **Duration:** about 17 min (2026-10-01T20:24:46Z to 20:41:40Z)
- **Started:** 2026-10-01T20:24:46Z
- **Completed:** 2026-10-01T20:41:40Z
- **Tasks:** 3/3
- **Files modified:** 12 (2 created, 10 modified)

## Accomplishments

- `private.caller_entity_ids(p_project_id, p_entity_type)`: SECURITY DEFINER, `search_path = ''`, filters `user_id = auth.uid()`, `scope = 'entity'`, `role = 'editor'` and the target type, and checks the project inline with one EXISTS per entity table. It does not call `entity_project_id` (that would nest one definer call in another) and does not call `user_can`. It is defined before `GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private`, so the stated grant reaches it.
- `get_candidate_user_data`: the signature, the `RETURNS TABLE` block (14 columns) and the `NULL::` literals are byte-identical. The body is now plpgsql SECURITY INVOKER. It raises in both arms when more than one id comes back, and has no row cap. `rpc-nullability` and the `07-rpc-security` census did not change.
- `idx_grants_one_candidate_editor ON public.grants (target_id) WHERE scope='entity' AND target_type='candidate' AND role='editor'`.
- `writeEntityGrant` (both copies byte-identical): adds the `IDEMPOTENT_GRANT_KEY` constant. A 23505 that names any other key throws `ERR_GRANT_WRITE_FAILED`. The header no longer carries the decision id, wave number or deferral narrative.
- `12-user-can`: the union caller's entity grant moved to `candidate_a2`. It still has 45 assertions and all pass.
- `36-entity-identity.test.sql`: 20 assertions in four sections: what anon can read (TODO), who the caller is, catalog, and one editor per candidate.
- In `supabaseDataWriter.ts`, only the comment changed (checked with `git diff -I`). It now describes the per-project grant lookup and the error raised on ambiguity.
- `166-NEGATIVE-CONTROLS.md`: NC-1, NC-2 (plus a fixture control), NC-3 (vitest and hygiene) and NC-4. Each check was seen RED with verbatim output, then GREEN. NC-4 is GREEN only inside its TODO block for now.

## Task Commits

1. **Task 1: A candidate whose only link is a grant row loads their own record end to end:** `4413b8ac7` (feat)
2. **Task 2: One user per candidate (index, constraint-named grant write, 12-user-can fixture):** `cc4a599b9` (feat)
3. **Task 3: Anon-exposure census observed red and held as TODO; writer comment:** `0243dec0b` (test)

TDD shape per task: the red test was written and run against the old code and recorded in NC-x. The fix followed, and both were committed together in one green commit, as the plan says ("Do not commit the red state" / "Commit once, green").

## Verification (final tree)

| Gate | Result |
|---|---|
| `yarn db:reset && yarn workspace @openvaa/supabase test:db` | exit 0, `Files=36, Tests=1337`, `Result: PASS`; only 36's tests 1-2 are `Failed (TODO)` |
| `yarn workspace @openvaa/supabase test:unit` | exit 0, 197 passed |
| `cmp` both entityGrant pairs | identical |
| `yarn assert:schema-migration-parity` / `assert:rpc-nullability` / `db:lint:sql` | exit 0 / exit 0 / exit 0 (`0 error(s), 3 warning(s)`, the baseline) |
| `yarn db:types` then `git diff --exit-code -- packages/supabase-types/src/database.ts` | exit 0 after Task 1 and after Task 2 (types unchanged) |
| `yarn workspace @openvaa/frontend check` / `test:unit` | 0 errors 0 warnings / 2041 passed |
| `yarn lint:check` (status read directly) | exit 0 |
| `yarn format:check` | exit 0 |
| 166-hygiene-scan.sh over all 10 touched code files | `CLEAN`, exit 0, no advisory cues |
| E2E tracer `--project candidate-a11y-scan` | `166-01-tracer` (Task 1 tree): exit 0, 17 passed; `166-01-final` (HEAD `0243dec0b`): exit 0, 17 passed, preflight 0 failures / 1 success, 0 skipped |
| `ls apps/supabase/supabase/migrations/*.sql \| wc -l` | 1 |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical check] Placement assertion for the private helper**
- **Found during:** Task 1
- **Issue:** The plan's three catalog checks would still pass if the helper were defined after the private-schema GRANT. In that case it would run only on PostgreSQL's default PUBLIC EXECUTE, which the 301 comment says the schema does not rely on.
- **Fix:** Added a 13th assertion: `authenticated` holds an explicit EXECUTE ACL entry (via `aclexplode(proacl)`). A rolled-back probe showed that a function created after the GRANT has `proacl IS NULL` and fails this check (recorded in NC-1 GREEN).
- **Files modified:** `36-entity-identity.test.sql` (plan count 13 → 18 → 20 across the tasks)
- **Commit:** `4413b8ac7`

**2. [Rule 1 - Acceptance mismatch] `ERR_ENTITY_IDENTITY_AMBIGUOUS` count in 503**
- **Found during:** Task 1 acceptance check
- **Issue:** The banner and the RAISE both named the hint, so the count was 2 where the plan requires exactly 1.
- **Fix:** The banner now says "whose hint names the ambiguity", so the literal appears only in the RAISE. The migration was regenerated and parity is green.
- **Commit:** `4413b8ac7`

**3. [Rule 3 - Verification command portability] Comment-only diff check**
- **Found during:** Task 3 acceptance check
- **Issue:** The plan's `git diff -I '^\s*//' -I '^\s*/?\*' --exit-code` exits 1 on macOS because git's POSIX regex does not support `\s`.
- **Fix:** Ran the equivalent check `git diff -I '^[[:space:]]*//' -I '^[[:space:]]*/?\*' --exit-code`, which exits 0, and confirmed by reading the one-line diff. No code change.

**4. [Scope addition, evidence only] Extra negative control and a second E2E run**
- I added a fixture control to NC-2: with the index present, the old `12-user-can` aborts with `duplicate key ... "idx_grants_one_candidate_editor"` and runs 0 of 45 tests. This shows the retarget is required.
- I re-ran the E2E tracer on the final HEAD because the index landed after the first tracer run. Result: exit 0, 17 passed.

**5. [Rule 1 - Stale rationale, D-19 sweep] entityGrant.test.ts idempotency comment**
- An existing test comment claimed the idempotent write lets identity-callback "repair an identity whose first grant write failed". That stops being true once lookup is by grant (166-02). I rewrote it to a statement true in both states: a caller can write the grant without first asking whether it exists. The test title is now "treats a unique violation on the grant key (the grant already exists) as success".

## Known Stubs

None in product code. One assertion pair is deliberately held: `36-entity-identity.test.sql` tests 1-2, the anon census and the `42703` behavioural check, sit inside `todo_start ('the entity tables still expose an auth user id to anon')` / `todo_end ()`. They are red by design while `candidates.auth_user_id` / `organizations.auth_user_id` exist. 166-03 drops the columns and removes the wrapper.

## Threat Flags

None. The only new security surface is `private.caller_entity_ids`, which the plan's threat model covers (T-166-01..03). It sits in an unexposed schema, `36` asserts it is absent from `public`, and the 07 census of public definer functions is unchanged.

## Notes for Next Plans

- 166-02: identity-callback's `findExistingCandidate` still reads the link column; nothing else reads it for identity. When lookup moves to grants, the existing-candidate grant re-write always hits `grants_user_scope_target_role_key`, which `writeEntityGrant` treats as success. Test 17 pins that.
- 166-03: remove the `todo_start`/`todo_end` wrapper in `36-entity-identity.test.sql`. The two assertions must then pass un-wrapped; that run is NC-4's real GREEN. `get_entity_basic_data`'s "Withheld today" list in 503 still names the column, as this plan intended.
- `.planning/STATE.md` and `.planning/state.json` were already modified before this plan started. They were left out of the task commits.

## Self-Check: PASSED
