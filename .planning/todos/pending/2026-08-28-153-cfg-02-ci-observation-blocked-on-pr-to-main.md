---
title: REVIEW-CFG-02 — the node-engine negative-control job has never run in CI (the JOB's first run is what is blocked, NOT the binding, which 153-02 already observed)
created: 2026-08-28
updated: 2026-08-29
source_phase: 153-build-tooling-config-correctness
source_plan: 03
priority: medium
suggested_phase: 163-ci-hardening
keywords: [REVIEW-CFG-02, node-engine-range-negative-control, assert-node-engine, main.yaml, ci-trigger, workflow_dispatch, integration-branch, D3, D-N2, negative-control, deferred-verification, gh-run-view]
---

# The negative-control job's first CI run is unobserved

## Read this first — what is blocked, and what is not

**The blocked observation is the JOB's first CI run. It is NOT the binding.**

This distinction matters because the earlier framing of this filing said the opposite, and
`153-09-PLAN.md` still carries that older wording ("REVIEW-CFG-02's binding observation"). Whoever
executes `153-09` should correct it there rather than inherit it.

- **Already observed, by plan `153-02`, locally, against real runtimes:** that the root manifest's
  `engines.node` range actually BINDS. `yarn install` under Node v20.18.1 exits 1 with a build log
  naming `assert-node-engine`; v22.4.0 / v24.14.1 / v25.2.1 all pass. REVIEW-CFG-02 is `Complete` in
  `.planning/REQUIREMENTS.md` on the strength of that. Nothing about the requirement is waiting on
  CI.
- **Not observed, and unobservable from this branch:** that the standing CI job plan `153-03`
  appended to `.github/workflows/main.yaml` — `node-engine-range-negative-control` — behaves on a
  GitHub runner as it behaves locally. Its correctness was proven locally against real out-of-range
  and in-range runtimes with every half flip-tested (see
  `.planning/phases/153-build-tooling-config-correctness/153-NC-ROW-6-CFG-02.md`, Part 3), but no
  workflow run has ever executed it.

## Why it cannot be observed here

`.github/workflows/main.yaml` triggers only on `push` to `main` and `pull_request` targeting `main`.
The branch is `integration/ship-12-squash`, measured 222 commits ahead of `origin/main`. No run of
this workflow — of any job in it — has been produced by any v2.15 commit.

Per operator ruling **D3** (`.planning/v2.15-OPERATOR-DECISIONS-2026-08-29.md` § D3), the trigger
change is owned by **`163-01`**, not by `153-03`: adding `integration/**` to the push trigger and
adding `workflow_dispatch`, with a recorded removal condition (the `integration/**` push trigger
comes back out when v2.15 merges to `main`; `workflow_dispatch` stays). D3 deliberately did not
apply it in-session, because turning the trigger on starts CI against a long tail of unobserved
commits — an outward-facing action best taken inside the phase that owns it. `153-03` therefore left
the `on:` block untouched.

## Discharge condition — either path, whichever comes first

1. **The near path:** `163-01` lands the `integration/**` push trigger and `workflow_dispatch` per
   D3. Once either fires, the job runs on this branch.
2. **The far path:** v2.15 merges to `main`, at which point the existing push/PR triggers cover it
   without any workflow edit.

## What to observe

The job **`node-engine-range-negative-control`** concludes with `conclusion: success`, and — because
a job that examines nothing also reports green — its two assertion steps carry the guard's own
messages in their logs:

- step **"Assert the node-engine guard REJECTS an out-of-range Node"** (running under Node 20.x)
  logs a line beginning `rejected as required under v20.` and containing the guard's
  version-mismatch message `assert-node-engine: this Node is v20.` … `declares "engines.node":
  ">=22"`.
- step **"Assert the node-engine guard ACCEPTS an in-range Node"** (running under 22.22.1) logs
  `accepted as required under v22.22.1: assert-node-engine: v22.22.1 satisfies "engines.node":
  ">=22" — OK`.

A `success` conclusion WITHOUT those two lines is not a discharge: it would mean the steps ran and
asserted nothing, which is the exact failure mode the job exists to prevent.

## The command that reads it

```bash
gh run list --workflow "Main tests & validation" --branch <branch> --limit 5
gh run view <id> --json jobs \
  --jq '.jobs[] | select(.name=="node-engine-range-negative-control") | {conclusion, steps: [.steps[] | {name, conclusion}]}'
# then the step logs, for the two message lines above:
gh run view <id> --log --job <job-id> | grep -E 'rejected as required|accepted as required'
```

## The three residual risks this discharges — and only these

Local execution proved the job's YAML validity and structure, that it introduces no new action
reference, that the four `node-version: 22.22.1` pins are untouched, and that its step bodies —
**extracted from the YAML by a parser, not retyped** — behave correctly under real out-of-range
(v20.18.1) and in-range (v24.14.1) runtimes with both halves flip-tested red under the wrong
runtime. What it could not cover:

1. **Whether the runner resolves `20.x` from the setup-node version manifest.** The local proof
   selected v20.18.1 through `nvm`, not through `actions/node-versions`. If Node 20 is ever dropped
   from that manifest, the setup step fails loudly — the accepted outcome (threat T-153-13), named
   in the job's own comment — but that is not observable from a developer machine.
2. **Whether the runner's default shell reproduces the `bash -e` semantics the local proof used.**
   The proof ran GNU bash 3.2.57 with `-e`; GitHub's default is a newer bash with
   `--noprofile --norc -eo pipefail`. The steps contain no pipes precisely because `pipefail` would
   otherwise report the wrong stage's status, and the `OUTPUT="$(cmd)" || STATUS=$?` idiom exists
   precisely because `-e` would otherwise abort the step before its assertion ran — but the runner's
   exact invocation is unobserved.
3. **Whether the YAML-to-step wiring behaves as parsed.** `js-yaml` extracted the three `run:`
   bodies and the local proof executed those; that the runner assembles the same three steps in the
   same order from the same YAML is inferred, not observed.

## Where the observation goes when it is made

Append a CI section to
`.planning/phases/153-build-tooling-config-correctness/153-NEGATIVE-CONTROL.md` (assembled by plan
`153-09`), under Row 6. Quote the two log lines verbatim, name the run id and the commit SHA, and
mark which of the three residual risks each observation closes. Then move this file to
`.planning/todos/done/`.

## Cross-links — three items discharge on the same event

- `.planning/todos/pending/2026-08-28-153-cfg-05-ci-observation-blocked-on-pr-to-main.md` — the
  sibling filing for REVIEW-CFG-05, owned by plan `153-08`. **Written 2026-08-29; it points back
  here, so the pair discharges together rather than one at a time.** (This bullet previously read
  "Not yet written at the time of this filing"; `153-08` has now executed and the forward reference
  is live.)
  ⚠ **One asymmetry between the two, worth knowing before you treat them as identical.** CFG-02's
  blocked item is only *the job's first run*. CFG-05's has a **second** blocker on top of the trigger:
  the audit legitimately exits 1 until **Phase 160** brings the `filters` and `matching` skills green
  (operator ruling **D9**). A run obtained before Phase 160 lands would discharge CFG-02 and would
  **not** discharge CFG-05.
- `.planning/STATE.md:293` — the Phase 137 deferred verification row (*"Task 2: observed CI run on
  both jobs (E2E + `e2e-visual`)"*), operator-accepted 2026-08-13 and blocked on exactly the same
  trigger fact. It carries its own open risk **T-137-11** (the preflight's 120 s poll as CI's only
  cold-start absorber, budget-preserving rather than measured), which the same run would let
  somebody measure.
- `.planning/v2.15-OPERATOR-DECISIONS-2026-08-29.md` § D3 — the ruling that assigns the trigger
  change to `163-01` and records its removal condition.
- `.planning/phases/153-build-tooling-config-correctness/153-NC-ROW-6-CFG-02.md` — the local proof
  this filing is the boundary of: the six-row flip matrix, the guard-moved-aside row, and the
  standing spec's six reds.

## Tags

#ci #deferred-verification #negative-control #node-engine #REVIEW-CFG-02 #blocked-on-163-01
