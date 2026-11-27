---
phase: 190-multi-deployment-bootstrap
plan: "12"
subsystem: infra
tags: [oidc, github-actions, downstream, deployed-smoke, operator-checkpoint]

requires:
  - phase: 190
    provides: "190-03 the smoke gate keyed by SMOKE_DEPLOYMENT; 190-09 the workflows' environment shape; 190-14 Task 2 the evidence deploy that put this tree on staging"
provides:
  - "the downstream's OIDC subjects, observed: id-bearing for push and pull request"
  - "EMPTY_ENVIRONMENT=runs-without: a job whose environment name is empty runs with no environment on the private downstream"
  - "ARM_RUNNER=available for the private downstream"
  - "the deployed smoke green against staging from this tree with SMOKE_DEPLOYMENT unset and =staging"
affects: [190-13, 193]

actuals:
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns: []

key-files:
  created:
    - .planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/evidence/190-12-probe-workflow.yml
    - .planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/evidence/190-12-observations.md
  modified:
    - tests/README.md

key-decisions:
  - "190-12: the nuorten-2027 entry's plan and deploy subjects take the id-bearing form repo:OpenVAA@115159211/deploy-nuortenvaalikone@1468971368:… (Phase 193)"
  - "190-12: Task 3 ran after 190-14's evidence deploy (operator ruling 2026-11-24), against the served build b7a78427d, whose apps/ and packages/ equal this branch's"
  - "190-12: tests/README.md § Deployed smoke run step 5 no longer passes --no-flaky, which e2e-spec-verdict.mjs refuses; a flaky test fails every verdict whatever the flags"

requirements-completed: [PIPE-13]

duration: Task 1 on 2026-11-24; Task 2 operator probe 2026-11-24; Task 3 on 2026-11-27, about 1 min of runs
completed: 2026-11-27
---

# Phase 190 Plan 12: Downstream token probe and deployed smoke Summary

**The downstream's OIDC subjects are on record in the id-bearing form, and a job with an empty environment name runs with no environment there. The arm runner is available to the private downstream. The deployed smoke passed against staging from this tree, both with `SMOKE_DEPLOYMENT` unset and with `SMOKE_DEPLOYMENT=staging`.**

## Verdicts

From [evidence/190-12-observations.md](evidence/190-12-observations.md):

```
PROBE_PUSH_SUB=repo:OpenVAA@115159211/deploy-nuortenvaalikone@1468971368:ref:refs/heads/deploy/nuorten-2027
PROBE_PR_SUB=repo:OpenVAA@115159211/deploy-nuortenvaalikone@1468971368:pull_request
EMPTY_ENVIRONMENT=runs-without
ARM_RUNNER=available
SMOKE_DEFAULT=passed
SMOKE_STAGING_KEY=passed
```

| Acceptance criterion | Recorded | Verdict |
|---|---|---|
| Task 1: probe workflow committed, actionlint clean | `evidence/190-12-probe-workflow.yml`; actionlint 1.7.12 no error | pass |
| Task 2: both runs' claim lines verbatim, environments count, four verdict lines | push run 45475184723, pull-request run on #7, `environments_total_count=0` | pass |
| Task 2: `EMPTY_ENVIRONMENT=runs-without` | as recorded | pass |
| Task 2: `deploy/nuorten-2027` gone from the downstream | `- [deleted] deploy/nuorten-2027` | pass |
| Task 3: both smoke runs passed, verdict exit 0, no void marker | default and staging: gate 5/5 PASS, `1 passed`, `smoke_exit=0`, `VERDICT OK`, `verdict_exit=0`, `void_marker=none` | pass |

## Subjects for Phase 193

The nuorten-2027 entry's plan subject is the pull-request form and its deploy subject the ref form, both with ids: owner `115159211`, repository `1468971368`.

## Deviations

- **Task 3 run by the session, not handed to the operator.** The voter-only run needs no contestant secret and no privileged key, so it was run from the workstation directly, under the operator's go-ahead to continue the phase.
- **README step 5.** `--no-flaky` was refused by `e2e-spec-verdict.mjs` (status 2). The flag was dropped from tests/README.md, and the verdict was run again on the same run directories.

## E2E

The deployed smoke ran twice green (above). This plan touches no local E2E project, so its project deltas are 0 against `tests/e2e-runs/191-06-full` (742 passed).
