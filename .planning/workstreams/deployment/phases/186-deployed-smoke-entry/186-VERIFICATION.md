---
phase: 186-deployed-smoke-entry
verified: 2026-11-15T12:10:00Z
status: passed
score: 47/48 must-haves verified (4/4 roadmap success criteria, 43/44 plan truths; 1 uncertain, superseded by a review fix, override suggested)
covered_files:
  - .planning/workstreams/deployment/phases/186-deployed-smoke-entry/186-01-PLAN.md
  - .planning/workstreams/deployment/phases/186-deployed-smoke-entry/186-01-SUMMARY.md
  - .planning/workstreams/deployment/phases/186-deployed-smoke-entry/186-02-PLAN.md
  - .planning/workstreams/deployment/phases/186-deployed-smoke-entry/186-02-SUMMARY.md
  - .planning/workstreams/deployment/phases/186-deployed-smoke-entry/186-03-PLAN.md
  - .planning/workstreams/deployment/phases/186-deployed-smoke-entry/186-03-SUMMARY.md
  - .planning/workstreams/deployment/phases/186-deployed-smoke-entry/186-04-PLAN.md
  - .planning/workstreams/deployment/phases/186-deployed-smoke-entry/186-04-SUMMARY.md
  - .planning/workstreams/deployment/phases/186-deployed-smoke-entry/186-05-PLAN.md
  - .planning/workstreams/deployment/phases/186-deployed-smoke-entry/186-05-SUMMARY.md
  - .planning/workstreams/deployment/phases/186-deployed-smoke-entry/186-06-PLAN.md
  - .planning/workstreams/deployment/phases/186-deployed-smoke-entry/186-06-SUMMARY.md
  - .planning/workstreams/deployment/phases/186-deployed-smoke-entry/186-07-PLAN.md
  - .planning/workstreams/deployment/phases/186-deployed-smoke-entry/186-07-SUMMARY.md
  - .planning/workstreams/deployment/phases/186-deployed-smoke-entry/186-08-PLAN.md
  - .planning/workstreams/deployment/phases/186-deployed-smoke-entry/186-08-SUMMARY.md
  - .prettierignore
  - CLAUDE.md
  - infra/envs/staging/supabase/README.md
  - infra/scripts/grant-smoke-contestant.sql
  - package.json
  - tests/README.md
  - tests/deployed-global-setup.ts
  - tests/eslint.config.mjs
  - tests/playwright.deployed.config.ts
  - tests/tests/deployed/contestant.smoke.ts
  - tests/tests/deployed/smokeContent.ts
  - tests/tests/deployed/voter.smoke.ts
  - tests/tests/fixtures/contestant/contestantLoginPage.fixture.ts
  - tests/tests/utils/deployedSmokeGuards.test.ts
  - tests/tests/utils/deployedTarget.test.ts
  - tests/tests/utils/deployedTarget.ts
covered_digest: "v4:sha256:dea044906a573591620459717ebf09e4e36849adfec9b62ef3f963ec9508bb2a"
behavior_unverified: 0
overrides_applied: 1
overrides:
  - must_have: "tests/playwright.deployed.config.ts ... the HTML reporter with open: 'never'"
    reason: "Review fix CR-01 removed the HTML reporter: it titles each fill step with the typed value, so the contestant password reached the report. list plus optional json remain; a guard pins the reporter set."
    accepted_by: "operator (UAT test 1)"
    accepted_at: "2026-11-15T12:47:25Z"
deferred:
  - truth: "The deployed identity is proven once, before the specs, and not re-checked after them (review finding IN-04)"
    addressed_in: "Phase 187"
    evidence: "186-REVIEW-FIX.md defers IN-04 to phase 187, whose deploy-then-smoke chaining owns the window; phase 187 SC wires the smoke run as the pipeline's last stage (PIPE-07)"
human_verification:
  - test: "Accept or reject the superseded plan-02 truth 'the HTML reporter with open: never'. The deployed config now has no HTML reporter (list, plus json only when PLAYWRIGHT_JSON_OUTPUT_FILE is set), per review fix CR-01, because the HTML report embedded the typed contestant password."
    expected: "Operator adds an override for that truth to this file's frontmatter (suggested text in the report body), or rules that an HTML reporter must come back."
    why_human: "The literal plan truth is not met; the deviation is intentional and safer, but only a human can accept a must-have deviation."
  - test: "Confirm the loopback allowance of the gate's origin check (review fix WR-01, marked 'requires human verification' by the fixer): the gate accepts http only on localhost, 127.0.0.1 and [::1]; every other target must be https; the contestant spec separately refuses any origin but public_origin of the committed staging Supabase tfvars."
    expected: "Operator confirms the allowance, or asks for it to be removed. No record of a confirmation was found under .planning/workstreams/deployment."
    why_human: "A new security rule introduced after planning; its acceptability is a policy decision."
  - test: "Rule on the C-02 operator note ('use the existing helpers and fixtures for all subtasks with possibly variable logic'). The voter walk uses navigateToFirstQuestion (walkVoterStages) and answerAndAdvanceToResults, and the contestant spec is built entirely from existing fixtures, but voter.smoke.ts's three results assertions use raw getByTestId locators instead of createResultsPage(page).expectPageVisible / getEntityCards; 186-08-SUMMARY lists this as an open follow-up."
    expected: "Operator accepts the raw assertions (they carry no variable logic) or schedules the fixture swap in a later plan, which would need a new full local run because it touches tests/."
    why_human: "Whether a fixed visibility assertion counts as 'possibly variable logic' is the operator's reading of their own note."
  - test: "Review the 27 judgment-tier prohibitions of the eight plans (all `status: unresolved, flagged: true`). The verifier's non-authoritative verdicts are in § Prohibitions below: 23 hold on repository evidence and 4 rest on process claims a repository read cannot prove (no hosted write in plans 02, 04 and 05; no credential to a subagent). The two value-leak prohibitions hold on the address/JWT-shape search; the exact-value search with the real contestant values was the orchestrator's."
    expected: "Operator accepts the verdicts, or names any prohibition to re-examine."
    why_human: "unverified-prohibition - human review recommended. Judgment-tier prohibitions are never silently passed; four of them concern actions outside the repository (hosted writes, subagent environments)."
---

# Phase 186: Deployed Smoke Entry Verification Report

**Phase Goal:** A read-mostly smoke run proves from a workstation that the deployed URL serves the intended build on the intended project and that a voter and a contestant can use it, and it refuses to run against anything else.
**Verified:** 2026-11-15T12:10:00Z
**Status:** human_needed
**Re-verification:** No, initial verification (no earlier 186-VERIFICATION.md)

The goal is achieved in the codebase and was observed: every roadmap success criterion is VERIFIED on repository evidence and on checks re-run by the verifier. The status is `human_needed`, not `passed`, because four decisions are the operator's: one plan truth superseded by a security fix, one security rule the fixer asked a human to confirm, the C-02 operator note, and the flagged judgment-tier prohibitions.

## Goal Achievement

### Observable Truths (roadmap contract)

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Run from a workstation against `https://staging.openvaa.org`, the smoke run passes: it confirms the build SHA and the project id, renders a voter page from hosted data, goes from questions to results, and signs one contestant in | ✓ VERIFIED | Run dir `tests/e2e-runs/186-08-green-20261115T120003Z` (ignored, present). Verifier re-ran `e2e-spec-verdict.mjs <dir> --passed voter.smoke.ts --passed contestant.smoke.ts --no-flaky`: exit 0, `VERDICT OK: 2 tests -- passed 2, failed 0, flaky 0, skipped 0, did not run 0`. `results.json` stats `expected 2, unexpected 0, flaky 0`. `smoke.log` holds `PASS service-role-key-absent`, `PASS origin`, `PASS sha`, `PASS ref`, `PASS project-id`, `DEPLOYED SMOKE GATE OK build=712947a1… ref=cofbsatfrdysyphajsky project=…0001`, `2 passed (10.4s)`. Specs: `voter.smoke.ts` asserts the first question heading holds `SMOKE_STATEMENTS[0]` (from `smokeTemplate`), then results with candidate section and a card; `contestant.smoke.ts` signs in (`signInFromCold`), asserts a complete task list, signs out (`clickWithoutDialog`). The served build at verification time was still `712947a1…` (observed in the verifier's own control run below) |
| 2 | The negative controls are each seen red, with a non-zero exit status read directly: a wrong expected SHA, a wrong project id, and a target that is not the dedicated project. The run cannot be pointed at a production project (SUPA-09) | ✓ VERIFIED | `186-05-controls.md`: `CONTROL_SHA_EXIT=1`, `CONTROL_PROJECT_ID_EXIT=1`, `CONTROL_REF_EXIT=1`; each run dir's `smoke.log` has exactly one FAIL line on its own check and `1 of 4 checks failed`. Those runs predate the review fix that added the `origin` check; the verifier re-ran control 1 on the current gate (read-only GETs, keys unset, `SMOKE_EXPECTED_SHA` = HEAD): exit 1 read directly, `FAIL sha: observed 712947a1…, expected 062a11c1…`, the four others PASS, `1 of 5 checks failed`. Controls 2 and 3 on the current gate are carried by unit cases run green now: "fails only the project-id check…", "fails only the ref check…" against a loopback stub. Production: the expected ref and project id come only from `infra/envs/staging/supabase/terraform.tfvars` (`DEDICATED_SUPABASE_TFVARS`); the refusal matrix (deleted throwaway `begckvkapaopoztbreqc`, local stack by address and name, foreign hosts, no env block…) and "no input widens the ref" pass (134/134 in the two files) |
| 3 | The run is read-mostly: no setup project and no teardown project, the dataset was seeded once out of band, and `DEV_SEED_ALLOW_REMOTE` appears in no workflow and nowhere in the smoke entry | ✓ VERIFIED | `playwright.deployed.config.ts`: one project `deployed-smoke`, no dependencies, `retries: 0`, `workers: 1`, `assertSmokeProjects` at load. Guard cases green now: "has one project and no setup, teardown, dependency, web server or retry", "collects only the .smoke.ts files…", "finds no remote-seed switch under .github/ or in the smoke entry…", the value-import walk. Verifier grep of `.github/` (all 9 workflows, 187's `deploy.yml` among them) and the entry files for `DEV_SEED_ALLOW_REMOTE|allow-remote|allowRemote`: exit 1 (none). The `smoke` dataset was seeded in 184-22; the readiness REST read found `smoke_cand_0000..0002` with 6 answers and a nomination each. The only hosted write of the phase was the one contestant (plan 08 sitting), not a seed |
| 4 | The local gate suite and its preflight are unchanged, and the full local suite is green on the tree that adds the smoke entry | ✓ VERIFIED | `git diff --quiet a7a4222a8 HEAD -- tests/playwright.config.ts tests/global-setup.ts tests/tests/support/preflight.ts` exit 0, and against the worktree exit 0. Closing local run of record (187-13 handoff, superseding 186-07): `tests/e2e-runs/187-close-20261115T032900Z`, head file `54e79823b…`, no `VOID-host-suspend.txt`; verifier re-ran `e2e-spec-verdict.mjs <dir> --no-flaky`: exit 0, `548 passed, failed 0, flaky 0, skipped 0, did not run 0`. `54e79823b` is an ancestor of HEAD and contains `tests/playwright.deployed.config.ts`; `git diff --quiet 54e79823b HEAD -- apps packages tests` exit 0 (and against the worktree). The smoke specs are not in the local run (`smoke.ts` 0 matches in its results.json/summary.json) |

**Score:** 4/4 roadmap success criteria verified (0 present, behavior-unverified).

### Plan truths (merged, 44)

| Plan | Truths | Status | Notes |
| --- | --- | --- | --- |
| 186-01 gate module | 9 | 9 ✓ | `runDeployedGate`, tfvars-only identity, check order, ref fail-closed matrix, project-id placeholder, SHA shape, key-variable withholding, connection failures as FAIL lines, `assertSmokeProjects`, `requireSmokeInputs` all present and covered by the 134 green cases. The order is now `service-role-key-absent, origin, sha, ref, project-id` (WR-01 added `origin`): the four named checks keep their relative order, all are evaluated, so the truth holds as a superset. The forbidden-key list is a superset too (IN-01) |
| 186-02 entry and specs | 5 | 4 ✓, 1 ? | ✓ the global setup adapter, the voter run green on staging (now also in the green run), the contestant spec failing by name without inputs (`CONTESTANT_NOINPUT_EXIT=1` in `186-02-entry.md`; the spec still calls `requireSmokeInputs` before any page action), the local list unchanged (548 = closing run). **? UNCERTAIN:** "the HTML reporter with `open: 'never'`" is not met: the reporter was removed by CR-01 because the HTML report carried the typed password. Override suggested below |
| 186-03 lock | 5 | 5 ✓ | `test:e2e:deployed` in root `package.json` (line 55), `test:e2e` and `test:e2e:probes` unchanged against `a7a4222a8`; ESLint block on the smoke files, `ignores` unchanged; guard test with token scan, config shape and import closure, all green now |
| 186-04 grant SQL and runbook | 5 | 5 ✓ | `infra/scripts/grant-smoke-contestant.sql` present; outcomes on an isolated database in `186-04-grant-script.md`; Step 22 contestant items and the removal in `infra/envs/staging/supabase/README.md`; exercised for real in the plan 08 sitting (`s22c_grant_exit=0`, `s22c_candidate=smoke_cand_0000`, `grants=1`, `terms=1`) |
| 186-05 controls | 4 | 4 ✓ | See roadmap truth 2 |
| 186-06 docs | 5 | 5 ✓ | `tests/README.md` § Deployed smoke run (now describes five gate lines and `<n> of 5`, consistent with the code); CLAUDE.md Testing line present |
| 186-07 closing gates | 6 | 6 ✓ | Gates and the local-gate diff on record; the closing run is superseded by 187-13's, verified above; `git diff --quiet 712947a1… HEAD -- apps packages` exit 0 now |
| 186-08 sitting and green run | 5 | 5 ✓ | Readiness remade on the handoff inputs; `attempt.sh bound 186-08-2 OPERATOR_REPLY plan=186-08 task=2` and `has … '^answer_sitting=approve$'` re-run by the verifier: both exit 0; every `s22c_` line expected by the plan is in `186-08-sitting.md`; the green run verified above; dated Observations row (2026-11-15) in the staging Supabase README; no commit of plan 08 touches `apps/`, `packages/` or `tests/` |

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `tests/tests/utils/deployedTarget.ts` | Pure gate module | ✓ VERIFIED | Exports `runDeployedGate`, `readDedicatedTarget`, `requireCredentialOrigin`, `assertSmokeProjects`, `requireSmokeInputs`; imported by the config, global setup and contestant spec |
| `tests/tests/utils/deployedTarget.test.ts` | Refusal matrix | ✓ VERIFIED | Contains `begckvkapaopoztbreqc`; green |
| `tests/tests/utils/deployedSmokeGuards.test.ts` | Token scan, shape, closure walk | ✓ VERIFIED | Green; dynamically imports the deployed config |
| `tests/playwright.deployed.config.ts` | Second entry | ✓ VERIFIED | `globalSetup: './deployed-global-setup.ts'`, `assertSmokeProjects` at load |
| `tests/deployed-global-setup.ts` | Gate adapter | ✓ VERIFIED | Throws `gateFailureMessage` on any FAIL |
| `tests/tests/deployed/{voter,contestant}.smoke.ts`, `smokeContent.ts` | Specs and expected content | ✓ VERIFIED | `smokeContent.ts` imports `packages/dev-seed/src/templates/smoke` by path, not the barrel |
| `package.json` `test:e2e:deployed` | Root script | ✓ VERIFIED | `playwright test -c ./tests/playwright.deployed.config.ts` |
| `tests/eslint.config.mjs` | Import lock | ✓ VERIFIED | Block on `tests/deployed/**/*.ts`, `tests/utils/deployedTarget.ts`, `deployed-global-setup.ts` |
| `infra/scripts/grant-smoke-contestant.sql` | Grant SQL | ✓ VERIFIED | Present, used at the sitting |
| `infra/envs/staging/supabase/README.md` Step 22 | Creation and removal | ✓ VERIFIED | Contestant items, removal, Observations row |
| `tests/README.md`, `CLAUDE.md` | How to run and read | ✓ VERIFIED | Section and pointer line present |
| Evidence files 186-02/03/04/05/07/08 | Records | ✓ VERIFIED | All present; the leak-shape search (address or JWT) gives 0 in every evidence file and in the green run's `smoke.log` and `results.json` |

### Key Link Verification

| From | To | Via | Status |
| --- | --- | --- | --- |
| `deployedTarget.ts` | `infra/envs/staging/supabase/terraform.tfvars` | `DEDICATED_SUPABASE_TFVARS` read at run time | ✓ WIRED |
| `playwright.deployed.config.ts` | `deployed-global-setup.ts` | `globalSetup` | ✓ WIRED |
| `deployed-global-setup.ts` | `deployedTarget.ts` | `runDeployedGate`, `gateFailureMessage` | ✓ WIRED (seen live: the gate lines in every run log) |
| `smokeContent.ts` | `packages/dev-seed/src/templates/smoke.ts` | relative import | ✓ WIRED |
| `package.json` | `playwright.deployed.config.ts` | `test:e2e:deployed` | ✓ WIRED |
| Step 22 | `grant-smoke-contestant.sql` | `psql -X -f` | ✓ WIRED (exercised at the sitting) |
| `contestant.smoke.ts` | keychain item `openvaa-staging-smoke-contestant` | `SMOKE_CONTESTANT_EMAIL` / `SMOKE_CONTESTANT_PASSWORD` | ✓ WIRED (green contestant test) |
| `contestant.smoke.ts` | tfvars `public_origin` | `requireCredentialOrigin` before `signInFromCold` | ✓ WIRED (guard case green) |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real data | Status |
| --- | --- | --- | --- | --- |
| `voter.smoke.ts` | questions, candidate cards | hosted `smoke` dataset on `cofbsatfrdysyphajsky`, read by the served app | Yes: gate proved the served env block's Supabase host is the dedicated ref; the voter test passed on it | ✓ FLOWING |
| `contestant.smoke.ts` | complete home | hosted grant on `smoke_cand_0000` (6 answers, a nomination) | Yes | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Green deployed run's verdict | `node tests/scripts/e2e-spec-verdict.mjs tests/e2e-runs/186-08-green-20261115T120003Z --passed voter.smoke.ts --passed contestant.smoke.ts --no-flaky` | exit 0, 2 passed | ✓ PASS |
| Gate and guard units | `vitest run --config tests/vitest.config.ts deployed` | exit 0, 2 files, 134 passed | ✓ PASS |
| Wrong-SHA control on the current gate | `env -u …KEY… SMOKE_EXPECTED_SHA=<HEAD> yarn test:e2e:deployed tests/tests/deployed/voter.smoke.ts --output <scratch>` (GETs only, no credentials) | exit 1, one `FAIL sha`, `1 of 5 checks failed`, no spec ran | ✓ PASS |
| Closing local run's verdict | `node tests/scripts/e2e-spec-verdict.mjs tests/e2e-runs/187-close-20261115T032900Z --no-flaky` | exit 0, 548 passed | ✓ PASS |
| Remote-seed switch absent | `grep -rnE 'DEV_SEED_ALLOW_REMOTE|allow-remote|allowRemote' .github <entry files>` | exit 1 | ✓ PASS |
| Approval binding | `attempt.sh bound 186-08-2 …` and `attempt.sh has 186-08-2 '^answer_sitting=approve$'` | both exit 0 | ✓ PASS |

The full local E2E suite was not run, by instruction; the run of record is 187-13's.

### Probe Execution

Step 7c: no probe is declared by the phase's plans; not applicable.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| SUPA-09 | 186-01 to 186-08 (all eight declare only SUPA-09) | Tests run against a dedicated hosted project and never against a production one | ✓ SATISFIED | Roadmap truths 1 to 3: identity pinned to the committed staging tfvars, refusals unit-tested, controls seen red, the green run on the dedicated project. REQUIREMENTS.md still shows it `[ ]` / Pending, marking it complete is the orchestrator's step |

No orphaned requirement: REQUIREMENTS.md maps only SUPA-09 to Phase 186. PIPE-07 is mapped to Phase 187 and the roadmap says phase 186 only builds toward it.

### Prohibitions (judgment-tier, flagged; verifier verdicts are non-authoritative)

| Plan | Prohibition (short) | Verifier verdict |
| --- | --- | --- |
| 01 | Ref/project id from no env var or argument | Holds: tfvars-only read; "no input widens the ref" green |
| 01 | No key value printed | Holds: withheld-value cases green |
| 01 | No import from the local gate files | Holds: grep of the entry files exit 1 |
| 02 | No edit or import of the local gate files | Holds: diff empty, grep exit 1 |
| 02 | No root `.env` load | Holds: guard "no env-file loader in the entry" green; ESLint bans `dotenv` |
| 02 | No setup/teardown project, dependency or retries | Holds: shape guard green |
| 02 | No hosted write in plan 02 | Process claim; not provable from the repository |
| 02 | No contestant value printed or committed | Holds on the leak-shape search; the exact-value search was the orchestrator's |
| 03 | No service-role client reachable | Holds: value-import walk green |
| 03 | No remote-seed switch | Holds: grep exit 1, guard green |
| 03 | `ignores` and existing scripts unchanged | Holds: `git diff a7a4222a8` shows neither |
| 03 | Planted lint file not committed | Holds: no such file added in the phase range |
| 04 | No hosted write in plan 04 | Process claim (isolated instance per evidence) |
| 04 | No address, password or token committed | Holds on the leak-shape search (the only addresses in the runbook are the sender address and earlier rows) |
| 04 | No dev-seed or remote-seed switch for the contestant | Holds: Step 22 uses the Auth Admin API and the SQL |
| 05 | Gate/config/specs not changed to make a control fail | Holds: plan 05 commits touch only the evidence file |
| 05 | No hosted write in plan 05 | Process claim |
| 05 | No key printed | Holds on the JWT-shape search (0 in evidence) |
| 06 | No credential in the docs | Holds: no contestant address or token shape in `tests/README.md` |
| 06 | Not described as a way around the local preflight | Holds: the section says the entry is separate and gives no way around it |
| 07 | No retry-until-green, no flaky mark, no void counted | Holds on the record (`RED_RUNS=0`, `E2E_VOID_RUNS=0`, `--no-flaky` verdict) |
| 07 | Local gate files not edited | Holds: diff empty |
| 08 | No hosted write before the bound approval | Holds on the record; the binding re-reads exit 0 |
| 08 | No credential to a subagent | Process claim |
| 08 | No contestant value in any written file | Holds on the leak-shape search; `CREDENTIAL_LEAK_CHECK=clean` with the real values was the orchestrator's |
| 08 | No change under `apps/`, `packages/`, `tests/` in plan 08 | Holds: no plan-08 commit touches them; diff since the reference exit 0 |
| 08 | No retry of the green run | Holds on the record: one green run; the only re-run was the sitting, stopped before any hosted write |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `tests/tests/utils/deployedTarget.ts` | 76, 347-348 | `PLACEHOLDER` | ℹ️ Info | The `%projectId%` placeholder the project-id check refuses; correct code, not a marker |
| `tests/tests/deployed/voter.smoke.ts` | 21-23 | raw results locators beside an existing `resultsPage` fixture | ⚠️ Warning | See human item 3 (the C-02 note) |
| `.../186-CONTEXT.md` | header | still "recommendations, unreviewed by the operator" although the overrules (C-02 note, D-02) were recorded in DISCUSSION-POINTS | ℹ️ Info | The plans followed the overrules; the context file was not rewritten from the fill |

No `TBD`, `FIXME` or `XXX` in any implementation file of the phase.

### Human Verification Required

### 1. The HTML reporter truth of plan 186-02

**Test:** Decide on the plan truth "the HTML reporter with `open: 'never'`". It was removed by review fix CR-01 (`b9309a96d`), measured to stop the typed password reaching the report.
**Expected:** Accept it with an override, for example:

```yaml
overrides:
  - must_have: "tests/playwright.deployed.config.ts ... the HTML reporter with open: 'never'"
    reason: "Review fix CR-01 removed the HTML reporter: it titles each fill step with the typed value, so the contestant password reached the report. list plus optional json remain; a guard pins the reporter set."
    accepted_by: "<operator>"
    accepted_at: "<ISO timestamp>"
```

**Why human:** a must-have deviation is accepted only by a person.

### 2. The loopback allowance of the origin check (WR-01)

**Test:** Read § Inputs of `tests/README.md` and the origin cases of `deployedTarget.test.ts`.
**Expected:** Confirm that http on `localhost`, `127.0.0.1` and `[::1]` stays accepted by the gate (the ref check still refuses the local stack, and the contestant spec refuses any origin but `public_origin`).
**Why human:** the fixer marked it "requires human verification"; no confirmation is on record.

### 3. The C-02 operator note

**Test:** Look at `tests/tests/deployed/voter.smoke.ts` lines 21-23.
**Expected:** Accept the raw `getByTestId` assertions, or schedule a swap to `createResultsPage(page)` in a later plan, which then needs a new full local run.
**Why human:** it is the reading of the operator's own note.

### 4. The flagged prohibitions

**Test:** Read § Prohibitions above.
**Expected:** Accept the 23 repository-backed verdicts and the 4 process claims, or name one to re-examine.
**Why human:** unverified-prohibition, human review recommended.

### Gaps Summary

No blocking gap. Every roadmap success criterion holds on evidence the verifier re-ran: the green run's verdict, the closing local run's verdict, the 134 gate and guard cases, the wrong-SHA control on the current five-check gate, the empty local-gate diff, the empty diff since the tree reference, and the absence of the remote-seed switch. What remains is four human decisions, none of which blocks phase 187: one plan truth superseded by a safer fix (override suggested), one security rule to confirm, the C-02 note, and the flagged prohibitions. Deferred, not a gap: the post-spec identity re-check (IN-04), owned by phase 187's deploy-then-smoke chaining.

---

_Verified: 2026-11-15T12:10:00Z_
_Verifier: Claude (gsd-verifier)_
