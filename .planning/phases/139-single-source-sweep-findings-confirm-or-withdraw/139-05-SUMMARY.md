---
phase: 139-single-source-sweep-findings-confirm-or-withdraw
plan: 05
subsystem: testing-assurance
tags: [assertion-audit, injection-testing, verdicts, frontend, oidc, i18n]
status: complete

requires:
  - "139-04-SUMMARY.md — the F19 sites and § 8.3 R-6, the injection-axis failure mode this plan re-applied"
  - "139-VERDICTS.md §§ 1-4 — the apparatus (HYGIENE-LOOP, TWO-COLUMN RULE, COLLATERAL RULE, 15-row enumeration)"
provides:
  - "139-VERDICTS.md § 5.5 (F17), § 5.10 (F20-1), § 5.11 (F20-2), § 5.12 (F20-3) — the last four of fifteen records"
  - "139-VERDICTS.md § 4 rows 5, 10, 11, 12 — no row now reads `pending`"
  - "139-VERDICTS.md § 8.1 C-5, § 8.2 O-3, § 8.3 R-7 through R-10"
  - "A live pre-existing defect in the OIDC authorize endpoint, documented with its remediation ordering"
affects:
  - "Phase 142 (ASSERT-07) — four pre-specified negative controls, three explicit NOT-the-control warnings"
  - "Phase 140 (ASSERT-03) — unchanged; no F19 verdict was touched"

tech-stack:
  added: []
  patterns:
    - "Positive controls are mandatory wherever an injection predicts PASS — four were run, each of a different shape"
    - "An injection must be checked against the axis the finding names before the run is trusted (R-6/R-7)"

key-files:
  created:
    - .planning/phases/139-single-source-sweep-findings-confirm-or-withdraw/139-05-SUMMARY.md
  modified:
    - .planning/phases/139-single-source-sweep-findings-confirm-or-withdraw/139-VERDICTS.md
  transient_reverted:
    - apps/frontend/src/routes/api/oidc/authorize/+server.ts
    - apps/frontend/src/lib/i18n/overrides.ts
    - apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.ts
    - apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte

decisions:
  - "F20-1's plan-specified injection was run as specified, then found to be zero-delta on the caller-observable axis; the verdict was rested on a second, correctly-scoped injection (carry-forward #4 applied)"
  - "The 400-swallow in the authorize endpoint is recorded as a live defect with a remediation ordering, not silently folded into the verdict"
  - "F17's verdict rests on the import graph; the run is labelled corroboration, and a syntax-error control upgrades the inference to a measurement"
  - "The getIdTokenClaims coverage gap is recorded as MISSING coverage, out of ASSERT-07 scope, and excluded from the verdict"

metrics:
  duration: 32 min
  completed: 2026-08-14

actuals:
  tokens: 17100
  tasks: 3
  commits: 4
---

# Phase 139 Plan 05: The Last Four Verdicts Summary

Four findings confirmed by running them — three matcher-weakness sites (a bare `.rejects.toThrow()`, a `typeof` check, two `result.success` checks) plus F17, whose verdict rests on an import graph rather than on a run — completing all fifteen records with zero placeholders and a live OIDC defect found along the way.

## What was built

Nothing shipped. This plan produced evidence: `139-VERDICTS.md` grew by 1,180 lines across four records, and four frontend source files were injected and reverted seven times between them. The source tree is byte-identical to HEAD.

| Record | Finding | Injections | Verdict |
|---|---|---|---|
| § 5.10 | F20-1 — `authorize-endpoint.test.ts:233` | 2 | confirmed |
| § 5.11 | F20-2 — `overrides.test.ts:36` | 1 + 2 controls | confirmed |
| § 5.12 | F20-3 — `getIdTokenClaims.test.ts:236,259` | 2 + 1 control | confirmed |
| § 5.5 | F17 — `EntityListWithControls.test.ts:94` | 1 + 1 control | confirmed (on the import graph) |

## Task commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | F20-1 and F20-2 | `6adbe8f86` | `139-VERDICTS.md` (+493/-16) |
| 2 | F20-3 | `e68779b55` | `139-VERDICTS.md` (+393/-8) |
| 3 | F17 | `42e416e62` | `139-VERDICTS.md` (+294/-8) |

## The finding that was not in the plan

**The OIDC authorize endpoint does not return 400 for a missing `redirectUri`, and has not for as long as the test has been green.**

`error()` in SvelteKit 2 throws rather than returns, so `return error(400, …)` at `+server.ts:22` is caught by the same function's own `catch (e)` and replaced by the catch arm's `error(500, …)` at `:52`. The proof is in the runner's own stderr on the clean tree: `Failed to construct authorization request: HttpError { status: 400, … }` is printed by the `console.error` *inside the catch arm*, so the 400 was caught, and the caller receives the 500.

This was discovered while designing the injection, and it changed the plan's design. The plan's injection (400 → 500) is **zero-delta on the axis the finding is about** — it varies which status gets logged, not which status is returned. Per carry-forward #4 it was run as specified and recorded (§ 8.3 R-7), and the verdict was then rested on a second injection that replaces the catch arm's `HttpError` with a bare `TypeError`, varying the rejection the caller actually receives. That one still passes.

The consequence is carried into § 5.10.6 as a warning Phase 142 cannot skip: tightening this matcher to `{ status: 400 }` will **red on the un-injected tree**. Phase 142 must first choose between fixing the endpoint (re-throw `HttpError`s from the catch arm) and ratifying the 500 in the test's title — and record the choice — or the remediation will look like a failure when it is a pre-existing defect surfacing.

This is the second time in this pass that a finding's hypothetical regression turned out to be the production reality; R-2 (F15-A) was the first.

## Positive controls, four of them

Two green runs cannot distinguish "the assertion is blind" (the finding) from "the injection never took effect" (a null experiment). Every site here predicted PASS, so every site got a control.

- **F20-1** — the stderr status token flips `400` → `500` under injection A, proving the line executed; and the `console.error` immediately preceding the injected `throw` proves the catch arm ran to it under injection B.
- **F20-2** — an out-of-band probe showed the fixture template genuinely throws (`SyntaxError: EXPECT_PLURAL_ARGUMENT_SELECTOR`), then an in-band `throw` in the catch arm reddened **exactly 1 of 7** tests with a stack frame at `overrides.ts:36` — proving reachability inside the real run and verifying the zero-collateral prediction rather than assuming it.
- **F20-3** — control C makes the kid-lookup branch return success and reds **exactly the two sites**, the precise complement of injection A's three success-path reds. The two runs partition all five tests with no overlap and no remainder. This proves the branch is reached (so injection B was live, not null — necessary because a code-less `Error` and the original code-less `Error` produce an identical observable) and that the sites are not vacuous.
- **F17** — control D makes the component syntactically invalid, confirmed fatal against `svelte/compiler` (`js_parse_error`), and the test still reports 8 passed. This converts the import-graph claim from an inference into a measurement.

All four are recorded as **disqualified** Phase 142 negative controls (§ 8.3 R-8, R-9, R-10, following R-4/R-5), because a control that reds before *and* after a fix makes the remediation unverifiable. R-10's disqualification is a different shape and is written up as such: it reds *neither* before nor after, and post-fix would red for the wrong reason.

## F17, handled honestly

The plan required F17's record to lead with the import-graph fact and mark the run as corroboration. It does, and the fact turned out to be stronger than stated: the test's only non-vitest import is the helpers module, and **that helper has zero imports of its own**, so the transitive module graph is closed at `{test.ts, vitest, helpers.ts}`. The component is not merely un-mounted, it is unreachable.

§ 5.5.4 states in terms that the sentence "an effect loop was injected and the test stayed green" is true and, on its own, misleading, and says why. Control D then removes the need to take the import reading on trust.

Recorded as out-of-criterion-1 per D-06, with both remedies named in § 5.5.6 and the note that they are **not equivalent** — only mounting the component makes the pre-specified regression red; renaming the test closes the misdescription and leaves the guard absent.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 — Design defect in the plan's injection] F20-1's specified injection does not model the finding**

- **Found during:** Task 1
- **Issue:** The plan mandated `error(400, …)` → `error(500, …)` at `+server.ts:22`. Because `error()` throws and the handler catches its own throw, the caller-observable rejection is a 500 either way. The injection is hygienically perfect and produces a green run of exactly the right shape while proving nothing about the status the endpoint returns — R-6's failure mode reached from the opposite direction (R-6 was a red on the wrong axis; this is a green on the wrong axis).
- **Fix:** Ran the specified injection, recorded it in full as injection A with its zero-delta nature stated (§ 8.3 R-7), then designed and ran injection B at `:52` — replacing the catch arm's `HttpError` with a `TypeError` — which varies the rejection the caller receives and models the audit's own second clause. The verdict rests on B. § 5.10.6 names B as the negative control and states explicitly that A is not.
- **Files modified:** `139-VERDICTS.md` (§§ 5.10.1, 5.10.2, 5.10.4, 5.10.5, 5.10.6, 8.2 O-3, 8.3 R-7)
- **Commit:** `6adbe8f86`

**2. [Rule 2 — Missing critical evidence] Three sites predicted PASS with no positive control specified**

- **Found during:** Tasks 1, 2 and 3
- **Issue:** The plan specified no control for F20-2, F20-3 injection B, or F17. Each predicted PASS, so each green run was ambiguous between blindness and non-execution — the null-experiment hazard carried forward from plans 03 and 04.
- **Fix:** Added four controls (above), each as its own HYGIENE-LOOP iteration, and recorded each with its disqualification reasoning at § 8.3 R-8, R-9 and R-10.
- **Files modified:** `139-VERDICTS.md` (§§ 5.11.4, 5.12.4, 5.5.4, 8.3)
- **Commits:** `6adbe8f86`, `e68779b55`, `42e416e62`

### Recorded, not fixed

**F20-3's remediation has a prerequisite the audit does not mention.** The strengthened assertion § 5.12.6 recommends — asserting on `result.error.code` — cannot be written today, because the kid-lookup failure throws a plain `Error`, which has no `code`, so both sites receive `error: {}` via the catch's second branch. Phase 142 must attach a stable code to that failure *before* the assertion can name it. Recorded in § 5.12.6 rather than acted on; this plan ships no product code.

## Deferred / out of scope

**The `getIdTokenClaims` adjacent coverage gap** — no negative test for a bad signature, a wrong `issuer` or a wrong `audience`, the three rejections a token validator most needs and the three that `jose.jwtVerify` is configured to perform. Recorded in § 5.12.5 as a **MISSING** test rather than a fake one, explicitly stated not to bear on the F20-3 verdict, and marked out of ASSERT-07's scope (ASSERT-07 remediates fake guards; a test that does not exist is not a fake guard). Deferred to a future coverage phase per `139-CONTEXT.md`.

## Security

Injections A and B for F20-3 removed and altered ID-token verification — authentication material. Each was live only inside its own HYGIENE-LOOP iteration, reverted with `git checkout --` before the next began, and no `yarn dev`, `yarn test:e2e` or Playwright command ran at any point in this plan. T-139-04, T-139-05, T-139-15, T-139-17 and T-139-20 are all discharged: the three post-gates ran after every one of the seven injections, and `git diff --exit-code` over all four touched files exits 0.

No injected state reached a commit. Every commit in this plan touches `139-VERDICTS.md` only.

## Verification

- Six-file frontend vehicle: **52 passed** after the final revert (matching the plan's stated baseline).
- `git status --porcelain -- apps tests packages` — empty.
- `grep -rn 'INJECTED (139)' apps packages tests` — no matches.
- `git diff --exit-code` over all four injected files — exits 0.
- `grep -c 'not yet run'` over `139-VERDICTS.md` — **0**. All fifteen records filled.
- No `pending` in any § 4 table row.

Note on gate hygiene: two intermediate checks were run with cwd inside `apps/frontend`, where the pathspecs `apps tests packages` match nothing and the `test -d` guard short-circuits — both were silently vacuous. They were re-run from the repo root before each commit, and the results above are all repo-root runs.

## Self-Check: PASSED

- `139-05-SUMMARY.md` — FOUND
- `139-VERDICTS.md` — FOUND, 4,629 lines, 0 placeholders
- `6adbe8f86` — FOUND
- `e68779b55` — FOUND
- `42e416e62` — FOUND
