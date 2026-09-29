---
phase: 161-project-scoping-project-id-parameterisation
plan: 10
subsystem: auth
tags: [supabase, edge-functions, deno, vitest, postgrest, project-scoping, bank-auth]

requires:
  - phase: 161-project-scoping-project-id-parameterisation
    provides: the PUBLIC_PROJECT_ID binding the identity-callback handler already resolves through requireEnv
provides:
  - a project-scoped, error-checked existing-candidate lookup extracted to its own vitest-reachable module
  - a committed spec that reddens if either the project filter or the error check is reverted
  - a text-level pin holding the identity-callback entry point on the extracted helper
affects: [161-11, 161-12, 161-13, bank-auth candidate self-registration]

actuals:
  tokens: 4200
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Edge Function query logic extracted to a parameter-taking module beside its own spec, following envConfig/claimConfig/verifyConfig"
    - "Text-level route pin over an unimportable entry point: instrument-first, run-time-derived population, offending excerpt in the failure message"

key-files:
  created:
    - apps/supabase/supabase/functions/identity-callback/candidateRecord.ts
    - apps/supabase/supabase/functions/identity-callback/candidateRecord.test.ts
  modified:
    - apps/supabase/supabase/functions/identity-callback/index.ts

key-decisions:
  - "The lookup was extracted to candidateRecord.ts rather than patched inside index.ts, because index.ts holds a remote import and the Deno global and cannot be imported by vitest, so an in-place patch could only ever be asserted by a string search"
  - "maybeSingle() was kept and the error check is what makes it safe: zero rows stays the ordinary first-registration null return, and everything else becomes a throw"
  - "The thrown message carries the client-reported text only, no project id and no auth user id, because the endpoint is served without JWT verification"
  - "Reversion is pinned by a committed text-level spec rather than by a comment, instrument-first and with the population derived at run time"

patterns-established:
  - "Pattern 1: a query whose scoping term is the thing under assertion moves into a module that takes both the client and the scope as parameters"
  - "Pattern 2: a text assertion over an unimportable file proves its instrument found something before it asserts any absence"

requirements-completed: [PRESHIP-01]

coverage:
  - id: D1
    description: "The existing-candidate lookup filters on both the deployment's project and the auth user, so an identity holding a candidates row in another project is not adopted across the project boundary"
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: "apps/supabase/supabase/functions/identity-callback/candidateRecord.test.ts#applies both the project filter and the auth user filter"
        status: pass
      - kind: unit
        ref: "apps/supabase/supabase/functions/identity-callback/candidateRecord.test.ts#carries the project id it was given rather than one of its own"
        status: pass
    human_judgment: false
  - id: D2
    description: "A failed lookup throws instead of returning null, so a transient failure can no longer fall through to the insert branch and write a duplicate candidates row plus a duplicate user_roles row"
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: "apps/supabase/supabase/functions/identity-callback/candidateRecord.test.ts#rejects when the lookup reported an error rather than returning null"
        status: pass
      - kind: unit
        ref: "apps/supabase/supabase/functions/identity-callback/candidateRecord.test.ts#returns null when the lookup found nothing, the ordinary first-registration case"
        status: pass
    human_judgment: false
  - id: D3
    description: "The thrown message names the client-reported failure and carries no project id, auth user id or configuration value"
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: "apps/supabase/supabase/functions/identity-callback/candidateRecord.test.ts#names the client-reported failure and nothing about the deployment in the thrown message"
        status: pass
    human_judgment: false
  - id: D4
    description: "The identity-callback entry point still routes its existing-candidate path through the helper, and holds no candidates query filtered on the auth user without naming a project"
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: "apps/supabase/supabase/functions/identity-callback/candidateRecord.test.ts#holds no candidates query filtered on the auth user without naming a project"
        status: pass
      - kind: other
        ref: "manual reversion drill: restoring the raw auth-user-only chain in index.ts turned the suite red (2 failed / 63 passed), restoring the helper call turned it green again"
        status: pass
    human_judgment: false
  - id: D5
    description: "The extracted module stays reachable from vitest: no Deno runtime global and no remote module specifier"
    requirement: PRESHIP-01
    verification:
      - kind: other
        ref: "yarn assert:edge-env-defaults (check 3, vitest-reachability) — exit 0, files scanned 19, 0 violation(s)"
        status: pass
    human_judgment: false

duration: 10 min
completed: 2026-09-05
status: complete
---

# Phase 161 Plan 10: Close CR-01 — the scoped, error-checked existing-candidate lookup Summary

**The bank-auth existing-candidate lookup now names the project the deployment serves and throws on a failed read, both asserted by a vitest spec beside the extracted module rather than by a comment.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-09-05 (baseline gates captured at 21:25 local)
- **Completed:** 2026-09-05 21:32 local
- **Tasks:** 3 of 3
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments

- Extracted `findExistingCandidate` into `candidateRecord.ts`, taking the client and the project id as parameters, so the query shape is assertable by a running test instead of by a grep over a file vitest cannot import.
- The lookup applies an equality on `project_id` alongside the existing equality on `auth_user_id`. A `candidates` row is unique per project, not globally, and the query runs on the service-role client that bypasses row-level security entirely, so the project filter is the only thing keeping an identity's row in another project from being adopted by this deployment.
- The lookup destructures and reads `error`. Before this change a transport failure and a two-row read both arrived at the call site as `existingCandidate === null`, indistinguishable from "no candidate here", and sent the handler into its insert arm — a second `candidates` row plus a second `user_roles` row for an identity that already had both.
- Rewired `index.ts` to call the helper with the already-resolved `projectId` binding; no second environment read was introduced, and the `if (existingCandidate) { … } else { … }` structure below it was left untouched.
- Pinned the route with a text-level spec over `index.ts`: it asserts the helper call is present before asserting any absence, derives the candidates-chain population at run time rather than hard-coding a count, and reports the offending excerpt on failure.

## Task Commits

1. **Task 1 (tracer, TDD): scoped, error-checked lookup end to end** — `d6245d4` (test, RED) then `10ee453` (feat, GREEN)
2. **Task 2 (TDD): the raw unscoped chain cannot come back without a red gate** — `909dfbf` (test)
3. **Task 3: run the wired gates and record the close** — no code change; gate outputs transcribed below

## Gate outputs, transcribed

- `yarn lint:check` — **EXIT=0**, zero `[ERROR]` lines in the full run log (all fifteen assert gates plus `turbo run lint`, both typecheck links and the tests lint).
- `yarn workspace @openvaa/supabase test:unit` — **EXIT=0**, `Test Files 7 passed (7)`, `Tests 65 passed (65)`; zero failed, zero skipped. `candidateRecord.test.ts (10 tests)` is among the files run. Baseline before this plan was 6 files / 55 tests.
- `yarn assert:edge-env-defaults` summary line, verbatim:

  `Edge-function environment-default guard (phase 155: REVIEW-EDGE-02) — files scanned: 19; checks live: 3 of 3 (env-default; copy-drift; vitest-reachability). 0 violation(s).`

  Baseline before this plan read `files scanned: 17`; the two new files account for the difference.
- `grep -n "project_id" …/candidateRecord.ts` — **EXIT=0**, matching `.eq('project_id', projectId)`.

**The full E2E suite is NOT run by this plan.** Per the plan's own scoping, the closing full-suite run for this phase belongs to **161-13**; the gates above are the unit-level half of the obligation.

## Files Created/Modified

- `apps/supabase/supabase/functions/identity-callback/candidateRecord.ts` — the extracted lookup: exports `CandidateLookupClient` (a locally declared structural type, so the module needs no import at all) and `findExistingCandidate`, which selects `id` from `candidates`, filters on `project_id` and `auth_user_id`, reads `error` and throws `ERR_CANDIDATE_LOOKUP_FAILED` carrying the client-reported text only.
- `apps/supabase/supabase/functions/identity-callback/candidateRecord.test.ts` — ten cases in two blocks: seven behavioural cases driving a recording fake client (filters asserted by content, never by position), and three text-level cases pinning the entry point's route.
- `apps/supabase/supabase/functions/identity-callback/index.ts` — imports the helper beside its `./envConfig.ts` sibling and replaces the raw chain under the `// 7. Find or create candidate record` anchor with a single helper call; the comment above it now states the mechanism (project foreign key, non-unique auth user id across projects, RLS bypassed by the admin client, and why a failed lookup must throw).

## Decisions Made

The plan's DR-28, DR-29 and DR-30 were followed as written: extraction over in-place patch, `maybeSingle()` kept with the error read as the safety property, and reversion pinned by a text spec that is deliberately the second instrument behind the behavioural cases.

One judgment call inside DR-28's envelope: the module docblock originally named the Deno global in prose, following the `envConfig.ts` precedent (the guard excludes comment spans structurally and stayed green). It was reworded to describe the property without the literal token, so the plan's acceptance criterion reads clean under a literal grep as well as under the guard. No behaviour changed.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The RED gate for task 1 was a genuine unresolvable-import failure before the module existed; the RED demonstration for task 2 was performed by temporarily restoring the raw chain in `index.ts` (2 failed / 63 passed), then restoring the helper call from a scratchpad copy and re-confirming green — no git history was rewritten and no working-tree reset was used.

## Tracer feedback gate

Task 1 was a `type="tracer"` task carrying only automated `<verify>` steps and no `gate="blocking-human"`. Under `human_verify_mode: end-of-phase` the gate re-ran the tracer's verification end to end (unit suite, edge guard, project-term grep) — all green — and execution continued to the expansion task without synthesizing a human checkpoint.

## Flagged assumptions carried forward

The plan's four edge-probe rows remain **UNRESOLVED** by design and are restated here so they are not lost: (1) two candidates rows sharing an `auth_user_id` within one project are treated as a data-integrity defect and now surface as a thrown lookup failure rather than an arbitrary pick; (2) zero rows stays the ordinary first-registration case; (3) project-id equality is uuid equality performed by PostgreSQL after PostgREST casts the string, and a non-uuid `PUBLIC_PROJECT_ID` now surfaces as a throw rather than being swallowed; (4) no assertion added here depends on violation-message order.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

CR-01, one of the two blocking reasons `161-VERIFICATION.md` cites for grading criterion 2 PARTIALLY ACHIEVED, is closed at the code level with a committed regression gate. CR-02 remains open and is the subject of the sibling gap-closure plan. The phase's closing full-suite E2E run remains outstanding and belongs to 161-13.

---
*Phase: 161-project-scoping-project-id-parameterisation*
*Completed: 2026-09-05*

## Self-Check: PASSED

- `apps/supabase/supabase/functions/identity-callback/candidateRecord.ts` — FOUND
- `apps/supabase/supabase/functions/identity-callback/candidateRecord.test.ts` — FOUND
- Commits `d6245d4`, `10ee453`, `909dfbf` — FOUND in `git log`
- `yarn lint:check` EXIT=0 and `yarn workspace @openvaa/supabase test:unit` EXIT=0 re-confirmed at this plan's HEAD
