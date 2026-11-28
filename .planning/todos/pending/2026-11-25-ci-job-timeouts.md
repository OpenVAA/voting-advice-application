---
created: 2026-11-25T18:30:00.000Z
title: Job-level timeouts for every job of main.yaml
area: ci
severity: minor
source: Phase 189.1.1 code review IN-06
owner: the maintainer of the CI workflows
files:
  - .github/workflows/main.yaml
---

## Problem

No job of `.github/workflows/main.yaml` sets `timeout-minutes`: all thirteen run under GitHub's six-hour default, so a stuck step holds a runner for six hours before the job fails. Phase 189.1.1's review raised it on `frontend-and-shared-module-validation` (IN-06), the job that gained the shutdown check (`yarn check:shutdown-exit`), its first step that starts server processes. That script bounds each of its own waits and kills its children on every way out, so the new step is not itself the risk; the gap is the same on every job and predates the phase.

Deferred from phase 189.1.1, not fixed there: the condition is outside the phase's changed lines, and an edit of `main.yaml` then would have undone the phase's observed full `main.yaml` run (D-14i), needing a second operator-approved `ci-evidence/**` push and a CI run of about 35 minutes for an Info finding. The record is in `.planning/workstreams/deployment/phases/189.1.1-address-tech-debt-the-consent-prompt-covers-an-answer-choice/deferred-items.md` § From plan 18.

## Done when

- Each of the thirteen jobs of `main.yaml` carries `timeout-minutes`, set from its observed durations (read from CI runs, not local ones, since the CI runner is slower) with the margin over the slowest observed run stated beside it.
- One `main.yaml` run through the `ci-evidence/**` channel is green at job level after the change, and its run id and each job's duration are recorded.
