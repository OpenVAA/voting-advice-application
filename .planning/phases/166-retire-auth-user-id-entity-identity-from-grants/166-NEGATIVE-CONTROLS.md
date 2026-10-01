# Phase 166: Negative Controls

**Purpose.** The standing acceptance rule (`.planning/REQUIREMENTS.md`): every new check this phase adds
is observed FAILING on a realistic regression before it counts. Each row below records the check, the
regression state it was run against (the old code, or an injected fault), the exact command, the RED
verdict with its exit code and the verbatim failing lines, and then the GREEN run after the change.
An injected fault is reverted and the revert proven with `git diff --exit-code -- <file>`.

**Opened at:** HEAD `cb276b0d2` on `fix/888-review-findings` (166-01 start, 2026-10-01).

**Row format:** id · check · regression state · command · RED (exit code + verbatim failing lines) · GREEN.

---

## NC-1 — identity is read from the grant table (166-01 Task 1)

- **Check:** the "who the caller is" and "catalog" sections of
  `apps/supabase/supabase/tests/database/36-entity-identity.test.sql` (13 assertions).
- **Regression state:** the OLD code — the tree at `cb276b0d2`, where `get_candidate_user_data` is a
  `LANGUAGE sql` function reading the per-row auth link column of `candidates` / `organizations`,
  ending in `LIMIT 1`, and `private.caller_entity_ids` does not exist. Only the new test file was
  added; no schema file was touched.
- **Command:** `yarn db:reset && yarn workspace @openvaa/supabase test:db`

### RED

`yarn db:reset` exit 0; `test:db` **exit 1**.

```
/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/supabase/supabase/tests/database/36-entity-identity.test.sql ...............
# Failed test 1: "one candidate-editor grant in project A resolves to exactly that candidate"
#         have: NULL
#         want: 36363636-3636-3636-3636-0000000000c1
# Failed test 2: "asked for project B, the same caller resolves to its project B candidate"
#         have: NULL
#         want: 36363636-3636-3636-3636-0000000000c4
# Failed test 5: "an organization-editor grant resolves to that organization in the organization arm"
#         have: NULL
#         want: dddddddd-dddd-dddd-dddd-000000000003
# Failed test 7: "two organization-editor grants in one project raise"
#       caught: no exception
#       wanted: P0001
# Failed test 8: "a second candidate-editor grant in the table raises even though the token predates it"
#       caught: no exception
#       wanted: P0001
# Failed test 9: "the ambiguity error carries the hint ERR_ENTITY_IDENTITY_AMBIGUOUS"
#         have: NULL
#         want: ERR_ENTITY_IDENTITY_AMBIGUOUS
# Failed test 11: "private.caller_entity_ids is SECURITY DEFINER with an empty search_path"
# Failed test 13: "authenticated holds the private schema's stated EXECUTE grant on private.caller_entity_ids"
# Looks like you failed 8 tests of 13
Failed 8/13 subtests

Test Summary Report
-------------------
/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/supabase/supabase/tests/database/36-entity-identity.test.sql             (Wstat: 0 Tests: 13 Failed: 8)
  Failed tests:  1-2, 5, 7-9, 11, 13
Files=36, Tests=1330,  3 wallclock secs ( 0.08 usr  0.03 sys +  0.17 cusr  0.07 csys =  0.35 CPU)
Result: FAIL
```

The five assertions that pass on the old code (3 project admin, 4 entity-admin holder, 6 anon, 10 helper
absent from `public`, 12 RPC not SECURITY DEFINER) are the denial and placement halves; they guard
against a fix that over-reaches (for example one routed through `user_can`), not against the old code.

### GREEN

After `private.caller_entity_ids` (301) and the plpgsql `get_candidate_user_data` (503) landed:
`yarn prettier --write …`, `yarn schema:regenerate`, `yarn db:reset` (exit 0), `yarn db:types` (exit 0,
`packages/supabase-types/src/database.ts` byte-identical), then `test:db` **exit 0**:

```
/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/supabase/supabase/tests/database/36-entity-identity.test.sql ............... ok
All tests successful.
Files=36, Tests=1330,  3 wallclock secs ( 0.07 usr  0.04 sys +  0.17 cusr  0.08 csys =  0.36 CPU)
Result: PASS
```

Placement probe for assertion 13 (rolled back, psql as postgres): a function created in `private`
after the `GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private` statement carries no stated grant, so the
assertion distinguishes the two placements:

```
      proname      | acl_null | stated
-------------------+----------+--------
 caller_entity_ids | f        | t
 probe_after_grant | t        | f
```

Other gates: `yarn assert:schema-migration-parity` exit 0, `yarn assert:rpc-nullability` exit 0
(`get_candidate_user_data 14 … 0 violation(s)`), `yarn db:lint:sql` exit 0 (`No schema errors found`,
`0 error(s), 3 warning(s)` — the baseline), `plpgsql_check_function` on the new body: 0 rows.

E2E tracer: `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/166-01-tracer --project candidate-a11y-scan`
**exit 0** — `17 passed (16.7s)`, `preflight failures 0, successes 1`, HEAD `cb276b0d2` plus the
uncommitted Task 1 change. Every protected candidate page in the scan loads through the rewritten RPC.
