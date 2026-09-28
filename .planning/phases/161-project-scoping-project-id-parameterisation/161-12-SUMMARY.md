---
phase: 161-project-scoping-project-id-parameterisation
plan: 12
subsystem: tooling
tags: [static-analysis, lint-gate, edge-functions, supabase, multi-tenant, project-scoping]

requires:
  - phase: 161-project-scoping-project-id-parameterisation
    provides: "a `send-email` Edge Function that requires a `project_id` body term, which is what makes this plan's disposition for it a true statement rather than a claim"
provides:
  - "check 7 — every `.functions.invoke(` in a guarded source is examined and held to a written disposition"
  - "check 8 — reaching a table through `.schema(…).from(…)` is a named violation in a guarded source"
  - "`PROJECT_SCOPED_EDGE_FUNCTIONS`, dispositioning the three Edge Functions this repository invokes"
  - "a per-family non-vacuity floor, which the pooled total had silently stopped providing for `ACCESS_RE`"
  - "a comment-aware `readCallArguments`, so an apostrophe in a comment no longer over-reads a call"
affects: [161-13 widened guarded-source enumeration, 162 scope-aware authorization]

actuals:
  tokens: 44000
  tasks: 3
  commits: 6

tech-stack:
  added: []
  patterns:
    - "A disposition map keyed by the thing disposed (function name) rather than by the caller, so the same function invoked from two receivers gets one answer"
    - "A prohibition for a shape with zero live call sites, chosen over widening a receiver pattern that has no last case"
    - "Per-family non-vacuity floors: a pooled site count lets one live family hold the floor up for a dead matcher in another"

key-files:
  created: []
  modified:
    - scripts/assert-project-scoped-queries.mjs
    - scripts/fixtures/project-scoped-queries/violation.fixture.ts
    - scripts/fixtures/project-scoped-queries/clean.fixture.ts
    - packages/dev-seed/tests/projectScopingGate.test.ts

key-decisions:
  - "DR-34 honoured in both directions: the schema hop is a PROHIBITION (no legitimate use, zero live sites measured) and the invocation is a DISPOSITION (three load-bearing call sites that cannot be forbidden)"
  - "DR-35 honoured: `INVOKE_RE` is anchored on `.functions.invoke(` rather than on `this.supabase`, so the third live invocation — reached through a request-scoped `locals.supabase` — is not a new blind spot"
  - "The floor was changed from a pooled total to the dot-access family. Counting the new families into one number let two live invocations mask a dead `ACCESS_RE`, which the committed vacuity reproduction caught. The per-family floor is strictly stronger than the pooled one it replaces"
  - "`readCallArguments` was made comment-aware rather than left alone: an ordinary apostrophe in a comment was read as a string delimiter and over-read a live 562-character call to 2019, so a disposition checked against that text was checked against the wrong text"

requirements-completed: [PRESHIP-01]

coverage:
  - id: D1
    description: "An Edge Function invocation from a guarded source is SEEN by the guard, and a function with no written disposition is a violation"
    requirement: PRESHIP-01
    verification:
      - kind: fixture-selftest
        ref: "scripts/assert-project-scoped-queries.mjs --self-test#VIOLATION_FIXTURE did not produce the check-7 undispositioned-invocation violation"
        status: pass
      - kind: command
        ref: "node scripts/assert-project-scoped-queries.mjs"
        status: pass
    human_judgment: false
  - id: D2
    description: "A function dispositioned as needing a project term but invoked without one is a violation, in either the camelCase or the snake_case spelling"
    requirement: PRESHIP-01
    verification:
      - kind: fixture-selftest
        ref: "scripts/assert-project-scoped-queries.mjs --self-test#VIOLATION_FIXTURE did not produce the check-7 missing-project-term violation"
        status: pass
      - kind: fixture-selftest
        ref: "scripts/assert-project-scoped-queries.mjs --self-test#CLEAN_FIXTURE produced 0 violation(s) over dispositionedInvocationCamelCase and dispositionedInvocationSnakeCase"
        status: pass
    human_judgment: false
  - id: D3
    description: "Reaching a table by hopping schemas is forbidden outright in a guarded source, and the site is counted as well as reported"
    requirement: PRESHIP-01
    verification:
      - kind: fixture-selftest
        ref: "scripts/assert-project-scoped-queries.mjs --self-test#VIOLATION_FIXTURE did not produce the check-8 schema-hop violation"
        status: pass
      - kind: fixture-selftest
        ref: "scripts/assert-project-scoped-queries.mjs --self-test#violation fixture yielded exactly 9 site(s)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The three Edge Functions this repository invokes each carry a written disposition, restated from outside the guard"
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#dispositions every Edge Function this repository invokes, and is read where it is declared"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#keeps a schema-hop matcher, and keeps something reading it"
        status: pass
    human_judgment: false
  - id: D5
    description: "The widening did not redden correct code: the real corpus reports zero violations and the wired lint:check tail is green"
    requirement: PRESHIP-01
    verification:
      - kind: command
        ref: "yarn lint:check"
        status: pass
      - kind: command
        ref: "yarn test:unit"
        status: pass
    human_judgment: false
  - id: D6
    description: "Each disposition is a true statement about its call site rather than a claim about one"
    requirement: PRESHIP-01
    verification:
      - kind: source-read
        ref: "apps/supabase/supabase/functions/invite-candidate/index.ts (projectId destructure + required-field rejection + project_id on the inserted row); identity-callback/index.ts (requireEnv('PUBLIC_PROJECT_ID') + body-claim refusal); send-email/index.ts (400 Invalid project_id after the admin check)"
        status: pass
    human_judgment: true
    rationale: "That a disposition STRING matches what a function body actually does is a reading of prose against code. The guard can enforce the promise at the call site but cannot check the promise against the body, which is the whole reason the map exists"

duration: 10 min
completed: 2026-09-05
status: complete
---

# Phase 161 Plan 12: Edge Function Invocation and Schema-Hop Blind Spots Summary

Two new checks in the project-scoped query guard — a disposition map that holds every `.functions.invoke(` to a written promise, and an outright prohibition on reaching a table through `.schema(…).from(…)` — each with a committed fixture pair and its own self-test expectation.

## What was built

`161-VERIFICATION.md` re-ran the CR-02 reproduction against the live regex and recorded both shapes as invisible, with two live unguarded invocation sites in the adapter. Both are now seen.

**Check 7 — Edge Function disposition.** `PROJECT_SCOPED_EDGE_FUNCTIONS` dispositions the three functions this repository invokes; `INVOKE_RE` matches `.functions.invoke(` on any receiver, and `checkEdgeFunctionInvocations` reports an unreadable argument list, a non-literal function name, a name with no disposition, and a disposition the call does not keep. Both live spellings of the project term are accepted, because both are live: `invite-candidate` is invoked with camelCase `projectId` and `send-email` with snake_case `project_id`.

**Check 8 — schema hop.** `SCHEMA_HOP_RE` and `checkSchemaHop` forbid the mid-chain call outright. `ACCESS_RE`'s chain group spans bare identifiers only, so it stops dead at a call in the middle of the chain and the table on the far side goes uncounted rather than merely unchecked. The RED commit demonstrated exactly that: adding the schema-hop fixture member left the fixture's site count unchanged at 8.

Both checks count their sites into `checkSource`'s return, so neither shape is invisible to the non-vacuity floor.

## The guard's summary line, transcribed verbatim

```
Project-scoped query guard — 5 guarded source(s), 0 deferred, 5 adapter source(s) on disk, 5 raw client call(s) examined, 2 Edge Function invocation(s), 7 client-touching site(s) in all, 0 violation(s); self-test flagged 9 line(s) in scripts/fixtures/project-scoped-queries/violation.fixture.ts (9 access(es)) and 0 in scripts/fixtures/project-scoped-queries/clean.fixture.ts (4 access(es)), matching the committed expectation.
```

Fixture counts moved from the pre-plan 6 and 1 to 9 and 4. Every count in the self-test was re-derived by running the guard and reading the number it printed; none was carried forward from a guess.

## The dispositions, and the evidence for each

| function | disposition | evidence read |
|---|---|---|
| `invite-candidate` | `requires a project term` | `index.ts:36` destructures `projectId`, `:44` rejects the request without it, `:111` writes `project_id: projectId` on the candidate row |
| `send-email` | `requires a project term` | `index.ts:140-149` returns 400 `Invalid project_id` on a mismatched or absent term, after the admin check |
| `identity-callback` | `scoped-by-deployment: PUBLIC_PROJECT_ID` | `index.ts:181` resolves the project with `requireEnv`, `:187-189` refuses a body claim naming a different one; the payload carries no project term by design |

No `UNSCOPED` value exists in the map, and the gate spec asserts its absence within the declaration slice — scoped there rather than whole-file, because the rpc-disposition docblock discusses that keyword in prose and a whole-file search would match the explanation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `readCallArguments` read an apostrophe in a comment as a string delimiter**

- **Found during:** Task 1
- **Issue:** The balanced scan was quote-aware but not comment-aware. An ordinary English apostrophe in a comment between two arguments — `the payload's own convention`, which the live `send-email` invocation contains — opened a string that stayed open until the next apostrophe anywhere in the file, swallowing every bracket in between. Measured on that call: 2019 characters returned where the call is 562. Check 7 would then have tested the disposition against the wrong text, and passing for that reason is indistinguishable from passing for the right one.
- **Fix:** The scan now skips `//` to end-of-line and `/* */` to its close before the quote test.
- **Files modified:** `scripts/assert-project-scoped-queries.mjs`
- **Verification:** The same invocation now reads 562 characters, ending at the call's own closing brace.
- **Commit:** `03cf280c3`

**2. [Rule 1 - Bug] The pooled non-vacuity floor stopped firing for a dead `ACCESS_RE`**

- **Found during:** Task 3
- **Issue:** DR-37 requires both new checks to count their sites into the total the floor reads. Doing so pooled four families into one number, and the two live invocations then held the floor above zero when `ACCESS_RE` matched nothing. The committed vacuity reproduction caught it: the mutated copy reported `2 raw client call(s) examined` where the assertion requires `0`, so the floor stayed silent on a table matcher that had stopped matching.
- **Fix:** `checkSource` now tallies sites by family while still returning the total, and the floor reads the dot-access family. Every state the pooled floor caught, this catches — a zero total implies a zero dot-access count — plus the masked ones. The summary reports the dot-access count under its existing name alongside the total.
- **Files modified:** `scripts/assert-project-scoped-queries.mjs`
- **Verification:** A local copy with the matcher broken the same way the committed probe breaks it now reports `0 raw client call(s) examined` and fires the floor. `packages/dev-seed/tests/projectScopingGate.test.ts` passes unchanged — no assertion was weakened, skipped or deleted.
- **Commit:** `f4c8d7dc6`

**Total deviations:** 2 auto-fixed (2 × Rule 1 — bug). **Impact:** Both were defects the new checks exposed rather than caused, and both left the guard stronger. Neither changed the plan's shape: the eight acceptance criteria of tasks 1 and 2 and the six of task 3 are met as written.

## Verification results

| # | Check | Result |
|---|---|---|
| 1 | `node scripts/assert-project-scoped-queries.mjs` | EXIT=0, `0 violation(s)` over the real corpus, fixture counts 9 and 4 (up from 6 and 1) |
| 2 | `node scripts/assert-project-scoped-queries.mjs --self-test` | EXIT=0, no failed expectation |
| 3 | `yarn workspace @openvaa/dev-seed test:unit` | EXIT=0, 60 files / 666 tests, `projectScopingGate.test.ts` among them, `ACCESS_RE_DECL` vacuity probe unchanged and passing |
| 4 | `yarn lint:check` | EXIT=0, 23/23 turbo tasks, 0 `[ERROR]` lines across all fifteen assert gates |
| 5 | `yarn test:unit` | EXIT=0, 25/25 turbo tasks |

Each exit code was read from the command itself. Nothing was piped into `grep`, `head` or `tee` to inspect it.

## Flagged assumptions

Row 4 (ordering) is honoured: every expectation added by this plan matches with `some(…)` over the collected messages by distinctive substring. No assertion depends on message position, and no existing expectation was deleted or loosened to accommodate a new one — the three escape-hatch and three check-1/3/4 expectations are all still pinned individually.

## Known Stubs

None. Every declaration this plan added is read by a checker, and the gate spec asserts that from outside the guard for both.

## Threat Flags

None. This plan added no network endpoint, auth path, file access pattern or schema change; the four mitigations in its threat register (T-161-12-01 through -04) are each discharged by a committed rule with a fixture in both directions.

## Issues Encountered

None outstanding.

## Next Phase Readiness

Ready for `161-13`, whose widened guarded-source enumeration is a corpus change rather than a second matcher: `INVOKE_RE` is anchored on the function name, so it already reads the third live invocation (`locals.supabase.functions.invoke('identity-callback', …)` in `apps/frontend/src/routes/api/candidate/preregister/+server.ts`) correctly the moment that file enters the corpus, and `identity-callback`'s disposition is already written.

One residual stays OPEN and deferred, exactly as `161-11-SUMMARY.md` recorded it: `send-email` accepts any admin role without comparing `scope_id` to the project. Nothing in this plan narrows it, and no disposition here claims otherwise — `requires a project term` promises only that the call names a project, which is what check 7 enforces.

## Self-Check: PASSED

- All four modified files present on disk.
- All six commits present in `git log` (`03146c6b1`, `03cf280c3`, `078fb71bd`, `e65eb998f`, `f4c8d7dc6`, `0da09f6ab`).
- All five plan-level verification checks re-run at HEAD and green.
</content>
</invoke>
