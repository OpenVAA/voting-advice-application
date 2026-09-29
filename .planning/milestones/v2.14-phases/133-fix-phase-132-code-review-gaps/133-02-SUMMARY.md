---
phase: 133-fix-phase-132-code-review-gaps
plan: 02
subsystem: testing
tags: [playwright, e2e, candidate-journey, assertion-precision, diagnostics]

# Dependency graph
requires:
  - phase: 132-milestone-close-green-gate-svelte-check-zero-flip
    provides: the step-13.5 split URL-settle (D-01 flake harden) whose negative-lookahead regex this plan replaces with a positive assertion
provides:
  - "candidate-journey step 13.5 positively asserts the candidate-home destination (`/candidate`), so a post-submit misroute fails fast at the `waitForURL` and names the true destination"
  - "Zero negative-lookahead URL assertions in candidate-journey.spec.ts"
affects: [133-03 full-suite 3x determinism gate, candidate-journey spec step 14]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Positive-destination URL settle over negative-lookahead: assert the route the app is contracted to reach, not merely 'not the route it came from'"
    - "Route-boundary regex idiom `/\\/route\\/?(?:\\?|#|$)/` — matches the exact route with optional trailing slash / query / hash and an optional locale prefix, but never a sub-route"

key-files:
  created: []
  modified:
    - tests/tests/specs/candidate/candidate-journey.spec.ts

key-decisions:
  - "Confirmed the destination in source before locking the regex: profile/+page.svelte `submitRouting` falls through to `getRoute.current('CandAppHome')` on the field-cleared (not-allRequiredFilled) path, and route.ts maps `CandAppHome: CANDIDATE` with `const CANDIDATE = '/candidate'` — so `/candidate` is the contracted destination, not an inference"
  - "Chose the boundary-terminated regex `/\\/candidate\\/?(?:\\?|#|$)/` over a naive `/\\/candidate$/`: the latter would break on a trailing slash, query string, or hash, reintroducing flake in exchange for precision"
  - "Kept `TIMEOUTS.slowPage` and the split settle/visibility structure intact — the Phase 132 D-01 cold-start flake harden is orthogonal to the assertion-precision fix and remains load-bearing"
  - "Preserved the Phase 132 D-01 flake rationale in the reworded comment rather than replacing it — the split-settle reasoning is still the reason these are two awaits, and deleting it would invite a future re-collapse into one racing assertion"

patterns-established:
  - "URL settles in E2E specs assert the positive destination; a negative-lookahead that passes on any route other than the origin is a diagnostics defect, not a valid wait"

requirements-completed: [IN-01]

coverage:
  - id: D1
    description: "Step 13.5's post-submit URL settle is a positive candidate-home assertion (`/\\/candidate\\/?(?:\\?|#|$)/`), and no negative-lookahead remains anywhere in candidate-journey.spec.ts"
    requirement: "IN-01"
    verification:
      - kind: other
        ref: "grep -c 'candidate(?!' tests/tests/specs/candidate/candidate-journey.spec.ts → 0"
        status: pass
      - kind: other
        ref: "grep -cF 'waitForURL(/\\/candidate\\/?(?:\\?|#|$)/, { timeout: TIMEOUTS.slowPage })' → 1 (present exactly once, still on the slowPage budget, no magic-number ms literal)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The regex is correct against the app's actual routing contract and does not match any wrong sub-route (`/candidate/profile`, `/candidate/questions`, `/candidate/login`), while tolerating a trailing slash, query, hash, and an optional locale prefix"
    requirement: "IN-01"
    verification:
      - kind: other
        ref: "Source confirmation: apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte `submitRouting` default branch → getRoute.current('CandAppHome'); apps/frontend/src/lib/utils/route/route.ts:1 `const CANDIDATE = '/candidate'`, :47 `CandAppHome: CANDIDATE`"
        status: pass
      - kind: other
        ref: "Regex boundary analysis — after `\\/candidate` the optional `\\/?` is followed by a required `?`/`#`/end-of-string, so `/candidate/profile` (next char `p` after the slash, `/` if the slash is unconsumed) cannot match"
        status: pass
    human_judgment: false
  - id: D3
    description: "No collateral change: step 14's `toHaveURL(/\\/candidate\\/profile/)` and `/\\/candidate\\/questions/` assertions, all imports, and the downstream statusMessage visibility check are untouched; the tests project still typechecks and lints clean"
    verification:
      - kind: other
        ref: "grep -c 'candidate\\\\/profile' → 3, identical to `git show HEAD~1:…` prior count"
        status: pass
      - kind: other
        ref: "yarn lint:check → exit 0 (turbo lint + `eslint tests` + `typecheck:tests` = `tsc -p tests/tsconfig.json --noEmit`); the 2 residual warnings in tests/ are pre-existing and in other files"
        status: pass
    human_judgment: false
  - id: D4
    description: "Happy-path behavior preserved end-to-end: the field-cleared submit in candidate-journey still reaches home and the positive settle passes under the full concurrent suite, and a misroute would now fail at the settle rather than 10s downstream"
    verification: []
    human_judgment: true
    rationale: "Behavioral proof is deliberately deferred to the Plan 03 full-suite 3× determinism gate per this phase's locked decision ('the full E2E suite is the gate'). Static analysis establishes that `/candidate` is the contracted destination and that the regex matches it, but only a live run under the full-perm-DAG concurrency that produced the original Phase 132 D-01 flake can confirm the settle is not newly tightened into a timeout."

# Metrics
duration: 4min
completed: 2026-07-25
status: complete
---

# Phase 133 Plan 02: Positive candidate-home URL assertion Summary

**Step 13.5 of `candidate-journey.spec.ts` now positively settles on the contracted `/candidate` home route instead of a negative-lookahead that passed on any non-`/profile` URL — so a post-submit misroute fails fast at the `waitForURL` and names the true destination rather than surfacing ~10s later as an opaque status-message timeout.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-07-25T09:36:23Z
- **Completed:** 2026-07-25T09:40:00Z (approx.)
- **Tasks:** 1
- **Files modified:** 1 (22 insertions, 11 deletions — 1 code line, the rest comment)

## Accomplishments

- **IN-01 closed:** the step-13.5 settle `page.waitForURL(/\/candidate(?!\/profile)/)` became `page.waitForURL(/\/candidate\/?(?:\?|#|$)/)`. The old assertion was satisfied by `/candidate/login`, `/candidate/questions`, an error route, or literally any candidate-adjacent URL that was not `/profile`; the new one is satisfied only by the home route the submit handler is contracted to reach.
- **Destination verified in source, not assumed.** `profile/+page.svelte`'s `submitRouting` `$derived.by` returns `getRoute.current('CandAppQuestions')` only when `allRequiredFilled && unansweredOpinionQuestions.length && !answersLocked`; the field-cleared path (step 13.5 clears the required link question) falls through to the default branch, `getRoute.current('CandAppHome')`. `route.ts` maps `CandAppHome: CANDIDATE` where `const CANDIDATE = '/candidate'`. The regex was locked only after reading both.
- **Flake-hardening preserved.** The `TIMEOUTS.slowPage` budget, the split between the URL settle and the `statusMessage` visibility wait, and the recorded Phase 132 D-01 rationale for that split all survive unchanged. Only the regex and the framing of the comment changed.
- **No magic numbers, no collateral edits.** The settle still uses the `TIMEOUTS.slowPage` constant; step 14's positive `toHaveURL(/\/candidate\/profile/)` and `/\/candidate\/questions/` assertions, all imports, and every other step are byte-identical.

## Task Commits

Each task was committed atomically:

1. **Task 1: Flip step-13.5 URL settle from negative-lookahead to positive candidate-home assertion (IN-01)** - `8bf64c4d8` (test)

## Files Created/Modified

- `tests/tests/specs/candidate/candidate-journey.spec.ts` - Candidate end-to-end journey spec. Step-13.5 post-submit URL settle changed from the negative-lookahead `/\/candidate(?!\/profile)/` to the positive candidate-home boundary regex `/\/candidate\/?(?:\?|#|$)/`, with the adjacent comment reworded to state the positive rationale while retaining the Phase 132 D-01 split-settle explanation.

## Decisions Made

- **Boundary-terminated regex over a bare anchor.** `/\/candidate$/` would be maximally precise but brittle: a trailing slash, a query string appended by the router, or a hash fragment would all fail it, converting a diagnostics fix into a new flake. `/\/candidate\/?(?:\?|#|$)/` accepts `/candidate`, `/candidate/`, `/candidate?…`, `/candidate#…` and, because the anchor is `\/candidate` rather than a string start, tolerates a locale prefix such as `/en/candidate`. It still rejects every sub-route, because after the optional slash a `?`, `#`, or end-of-string is mandatory.
- **Kept, rather than replaced, the Phase 132 D-01 comment.** The temptation was to swap the whole comment for the new positive rationale. But the split between the URL settle and the visibility check exists for a documented cold-start load-contention reason; deleting that explanation would leave a future reader with two awaits and no reason not to collapse them back into one racing assertion. The comment now leads with the positive-destination rationale and retains the split-settle history below it.
- **Did not widen the pattern speculatively for locale prefixes.** The plan permitted widening only if the observed goto target differed. The run is English and unprefixed, and the chosen anchor already tolerates a prefix segment, so no widening was needed.
- **Static verification only, by design.** Per the phase's locked decision the full E2E suite is Plan 03's gate; running it here would have duplicated a ~long run without adding signal this plan can act on.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The edit applied on the first attempt; the acceptance greps and `yarn lint:check` passed on their first run.

## Verification Performed

Static gate only, per this plan's design (behavioral gate deferred to Plan 03):

| Check | Result |
|-------|--------|
| `grep -c 'candidate(?!' …/candidate-journey.spec.ts` | **0** — no negative-lookahead remains |
| `grep -cF 'waitForURL(/\/candidate\/?(?:\?\|#\|$)/'` | **1** — the positive settle appears exactly once, at step 13.5 |
| Settle retains `TIMEOUTS.slowPage` | **1 match** for the full `…, { timeout: TIMEOUTS.slowPage })` form — no ms literal introduced |
| `grep -c 'candidate\\/profile'` | **3**, identical to the pre-change count from `git show HEAD:…` — step 14's assertions untouched |
| `yarn lint:check` | **exit 0** — chains `turbo run lint` + `eslint --flag v10_config_lookup_from_file tests` + `typecheck:tests` (`tsc -p tests/tsconfig.json --noEmit`), so both the playwright/raw-locator lint gate and the compile gate are covered. The 2 residual warnings in `tests/` (`candidate-bank-auth-journey.spec.ts` prefer-to-have-length, `mockOidcIssuerEntry.ts` unused disable directive) are pre-existing and in other files. |
| Post-commit deletion check | no files deleted; no untracked files left behind |

Per the phase's locked decision and the orchestrator's execution note, the full E2E suite was **not** run in this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Ready for Plan 03** — the full-suite 3× determinism gate, which is the behavioral gate for both this plan and Plan 01. Environment prerequisites apply: one fresh dev server on :5173 (no Playwright `webServer`; a stale server steals the port) and a clean DB via `yarn db:reset` before the run.
- **Watch signal if Plan 03 is not clean:** a new failure at `candidate-journey` step 13.5's `waitForURL` (rather than at the downstream `statusMessage` check) would mean the submit is landing somewhere other than `/candidate`. That is the fix working as intended — the reported URL in the Playwright error names the true destination, so triage starts from a real route rather than an opaque visibility timeout. It would indicate a product-side routing issue, not a regression in this assertion; do **not** reinstate the negative-lookahead to make it pass.

## Self-Check: PASSED

- `tests/tests/specs/candidate/candidate-journey.spec.ts` — FOUND
- `.planning/phases/133-fix-phase-132-code-review-gaps/133-02-SUMMARY.md` — FOUND
- Commit `8bf64c4d8` (task 1) — FOUND
- No unintended file deletions in the task commit; the only working-tree residue is the pre-existing, unrelated `supabase/.temp/cli-latest` modification, deliberately left unstaged.

---
*Phase: 133-fix-phase-132-code-review-gaps*
*Completed: 2026-07-25*
