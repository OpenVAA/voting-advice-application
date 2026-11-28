---
phase: 188-relay-on-the-deployed-stack-and-the-per-caller-limit
plan: "04"
status: complete
subsystem: database
tags: [supabase, migration, rate-limit, pgtap, OBS-09]
requires: []
provides:
  - "public.invitation_caller_take(uuid, text) -> integer, service_role only (migration 00023)"
  - "throttle key form caller:<project id>:<IPv4 host | IPv6 /64>"
affects:
  - "188-05 (Edge Function wiring calls the RPC)"
  - "188-10 (hosted push of migration 00023)"
tech-stack:
  added: []
  patterns:
    - "Scalar-returning SECURITY DEFINER RPC over private.invitation_throttle_take"
    - "Trust gate on private.deployment_settings.behind_cloudflare, inet parse with invalid_text_representation handler"
key-files:
  created:
    - apps/supabase/supabase/migrations/00023_invitation_caller_limit.sql
    - apps/supabase/supabase/tests/database/59-invitation-caller-limit.test.sql
    - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/evidence/188-04-local-schema.md
  modified:
    - apps/supabase/supabase/schema/506-invitation-rpcs.sql
    - apps/supabase/supabase/schema/107-feedback.sql
    - apps/supabase/supabase/migrations.manifest.json
    - apps/supabase/supabase/tests/database/07-rpc-security.test.sql
    - apps/supabase/supabase/tests/database/39-invitations.test.sql
    - packages/supabase-types/src/database.ts
    - .claude/skills/database/schema-reference.md
    - .claude/skills/database/SKILL.md
decisions:
  - "invitation_caller_take returns 0 for admitted or untrusted and otherwise the whole seconds left in the caller's window, at least 1; limit 30 per caller per project per 10 minutes"
  - "No partial index for the delete of ended caller: rows; the table stays small and an index can be appended later"
  - "The function carries its own REVOKE/GRANT next to it rather than joining the shared service_role GRANT block of 506, so the migration holds the same statements as schema/"
metrics:
  duration: 9min
  completed: 2026-11-18
  tasks: 2
  files: 11
estimate:
  tokens: 90000
  tasks: 2
actuals:
  tokens: 10950
  tasks: 2
  commits: 3
plan_head_before: 3572acc5eb28375013c27a5d7cbe1442e8789026
plan_head_after: 88956829b947cf5a15c7681e965e6653d387e071
---

# Phase 188 Plan 04: The per-caller invitation limit, database half, Summary

`public.invitation_caller_take(p_project_id uuid, p_address text) -> integer` in appended migration 00023 lets a caller make 30 takes per project per 10 minutes. The key is `caller:<project>:<IPv4 host | IPv6 /64>`, and the address is trusted only when `behind_cloudflare` is true and it parses. An untrusted, absent or unparseable address, or an unknown project, is admitted without writing a row. Each take deletes the `caller:` rows whose window has ended. The function is service-role only. pgTAP file 59 proves all of this on a freshly reset local database.

## pgTAP file 59 and the gate lines

- **File 59 plan count: `plan (25)`.** It failed first with `function public.invitation_caller_take(uuid, unknown) does not exist`, planned 25 and ran 0. It passes now.
- **Full suite:** `Files=59, Tests=2923`, `Result: PASS`, on a fresh `yarn db:reset` that applied migrations 00001 to 00023.
- Evidence lines (`evidence/188-04-local-schema.md`): `RESET_EXIT=0`, `MIGRATIONS_APPLIED=23`, `PGTAP_EXIT=0`, `EQUIVALENCE_EXIT=0`, `DB_TYPES_EXIT=0`, `DB_LINT_EXIT=0`, `RPC_NULLABILITY_EXIT=0`, `GSD_SESSION_MUST_RESET=yes`.
- `yarn assert:schema-migration-parity`: 23 migrations, frozen ones match. `yarn assert:comment-hygiene`: 0 violations. `yarn db:lint:sql`: 0 errors and 3 warnings. All three warnings are on foreign-key indexes of tables this plan does not touch, and none is new.
- `git diff --quiet a58de7f16..HEAD -- apps/supabase/supabase/migrations ':(exclude)…00023…'` exits 0, so migrations 00001 to 00022 are untouched.

## What file 59 asserts (25 cases, descriptions prefixed `ICL: `)

1. **Trusted IPv4:** 30 takes of `198.51.100.7` are admitted, the 31st is refused with a value from 1 to 600, and `198.51.100.8` at the same moment is admitted.
2. **`behind_cloudflare` false:** the take is admitted and no `caller:` row is written.
3. **Bad or masked addresses:** NULL, empty, blanks and `not-an-address` are each admitted with no row written. `198.51.100.7/8` is admitted and keyed as `198.51.100.7`.
4. **IPv6:** `2001:db8:1:2::1` and `::ffff` share one bucket, so the 31st take across the two is refused. `2001:db8:1:3::1` is admitted. The keys are `…:2001:db8:1:2::/64` and `…:2001:db8:1:3::/64`, which confirms assumption A6.
5. **Unknown project id:** admitted, with no row written.
6. **Cleanup:** a `caller:` row whose window has ended is deleted by the next take of another address. A `caller:` row still inside its window is kept, and so is a `link:` row whose window has ended.
7. **Privileges:** `anon` and `authenticated` get 42501, and `service_role` may execute. The definition is `true {"search_path=\"\""} integer`.

## Commits

| Task | Commit | Message |
| --- | --- | --- |
| 1 (RED) | 96d6b595d | test(188-04): the per-caller limit's takes, trust, keys, cleanup and grants |
| 1 (GREEN) | de8535729 | feat(188-04): invitation_caller_take, the per-caller limit, in migration 00023 |
| 2 | 88956829b | docs(188-04): the caller: key form in the comments, regenerated types, local gates |

Task 1 was a tracer, so its `<verify>` was re-run end to end before Task 2 started (reset, full pgTAP, file 59 present, parity), and it passed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] A third census pin in file 39 that the plan did not name**
- **Found during:** Task 1, the first full pgTAP run.
- **Issue:** file 39 § 21, test 242, lists every `public.invitation\_%` function with its anon/authenticated/service_role EXECUTE. The new function joined that list, so the "seven helpers" assertion went red.
- **Fix:** added `invitation_caller_take false/false/true` to the expected string and changed "seven helpers" to "eight helpers".
- **Files modified:** apps/supabase/supabase/tests/database/39-invitations.test.sql
- **Commit:** de8535729

**2. [Rule 1 - Bug] Types regenerated on a database that still held pgTAP's helper functions**
- **Found during:** Task 2.
- **Issue:** the first `yarn db:types` ran after the pgTAP suite. `00-helpers.test.sql` commits its helpers, so the generated types listed 17 test-helper functions as well.
- **Fix:** discarded that output, ran `yarn db:reset` again, and regenerated. The committed diff is the one `invitation_caller_take` line. `db:lint:sql` and `assert:rpc-nullability` were also re-run on the fresh reset.
- **Commit:** 88956829b

**3. [Rule 2 - Correctness] Statements in the database skill that the change made false**
- **Found during:** Task 2.
- **Issue:** `.claude/skills/database/SKILL.md` § 4 said the service-role-only census holds thirteen names and "the six `invitation_*` helpers", and § 10 said "The one key on a caller is `confirm:<user id>`".
- **Fix:** the census now says fourteen names and seven helpers, and § 10 now describes the `caller:` key as well. The header of schema/506 also lists the function, and its count of service-role `invitation_*` functions went from six to seven (a comment-only change).
- **Files modified:** .claude/skills/database/SKILL.md, apps/supabase/supabase/schema/506-invitation-rpcs.sql
- **Commits:** de8535729 (506 header), 88956829b (SKILL.md)

### E2E

No targeted E2E run was made. Nothing calls the RPC yet: the Edge Function wiring is plan 188-05. No spec, fixture, route or helper of any Playwright project changed, so no project's test count moved.

## Threat Flags

None. The surface this plan adds (T-188-09 to T-188-13) is in the plan's threat model, and file 59 asserts each mitigation.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: apps/supabase/supabase/migrations/00023_invitation_caller_limit.sql
- FOUND: apps/supabase/supabase/tests/database/59-invitation-caller-limit.test.sql
- FOUND: .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/evidence/188-04-local-schema.md
- FOUND: 96d6b595d, de8535729, 88956829b (all ancestors of HEAD)
