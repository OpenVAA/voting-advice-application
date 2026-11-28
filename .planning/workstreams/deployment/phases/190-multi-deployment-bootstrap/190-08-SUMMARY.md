---
phase: 190-multi-deployment-bootstrap
plan: 08
subsystem: pipeline workflows
tags: [github-actions, deploy, destroy, multi-deployment, PIPE-13]
requires:
  - "190-03: push-migrations.sh --deployment and SMOKE_DEPLOYMENT in the deployed smoke entry"
  - "190-07: the resolve job and its 18 outputs in deploy.yml and destroy.yml"
provides:
  - "deploy.yml: --deployment \"$DEPLOYMENT_KEY\" on the migration push, SMOKE_DEPLOYMENT on the smoke step, the re-read of https://$DOMAIN/api/health, the alert's topic, subject and message from resolve outputs"
  - "deploy.yml settings check: the resolved Supabase root's public_origin must equal https://<domain>"
  - "destroy.yml: head-object of the resolved STATE_BUCKET and SUPABASE_STATE_KEY; confirm description for any deployment; error texts name $DEPLOYMENT_KEY or $AWS_ROOT"
  - "neither workflow names staging outside comments; workflow names `Deploy` and `Destroy AWS stack`"
affects:
  - "190-09 (infra-plan.yml still names staging and a literal role ARN)"
  - "190-13 (docs naming the workflow names and the confirm text)"
tech-stack:
  added: []
  patterns:
    - "whole-file `no staging outside comment lines` assertions with red copies"
    - "errexit alert case: the aws stub writes its arguments to a file outside the case root, read back after the run"
key-files:
  created: []
  modified:
    - .github/workflows/deploy.yml
    - .github/workflows/destroy.yml
    - infra/scripts/deploy-workflow.test.ts
    - infra/scripts/destroy-workflow.test.ts
    - infra/scripts/workflow-errexit.test.ts
decisions:
  - "190-08: the public_origin comparison sits in the existing settings check (resolved-settings), before the first assume; it reads $SUPABASE_ROOT/terraform.tfvars with sed and prints public_origin="
  - "190-08: the Supabase state key formula hand/<key>/supabase/terraform.tfstate is held, for every map key with an infra/envs/<key>/supabase root, to that root's declared backend key"
  - "190-08: the guard step of both destroy jobs takes DEPLOYMENT_KEY from resolve for its error text; the state-after error names $AWS_ROOT"
metrics:
  duration: "~10 min"
  completed: 2026-11-24
---

# Phase 190 Plan 08: deploy.yml and destroy.yml stage values from the resolve outputs Summary

The two writing workflows now take every stage value from the resolve job. That covers the migration push's deployment, the smoke key, the health re-read address, the alert's topic, subject and message, the destroy confirm description and the Supabase state head-object. Step names, workflow names and headers describe the resolved deployment. For staging every rendered value is unchanged: the topic `arn:aws:sns:eu-north-1:471112560111:openvaa-staging-frontend-deployments`, the subject `openvaa staging deploy failed at <stage>`, the message `The staging deploy failed at <stage>.`, the confirm text `destroy staging aws` (now from `destroy_confirm`, as before) and the key `hand/staging/supabase/terraform.tfstate`.

## Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | deploy.yml stage values | 54f880e3e | .github/workflows/deploy.yml, infra/scripts/deploy-workflow.test.ts, infra/scripts/workflow-errexit.test.ts |
| 2 | destroy.yml stage values | be66b7f5c | .github/workflows/destroy.yml, infra/scripts/destroy-workflow.test.ts, infra/scripts/workflow-errexit.test.ts |

## What changed

- **deploy.yml:**
  - The workflow is now named `Deploy`. Its header is rewritten around the deployment the resolve job picks, with the resolve job added to the numbered stage list.
  - The migrations step gets `DEPLOYMENT_KEY` and passes `--deployment "$DEPLOYMENT_KEY"`, and its comment is rewritten.
  - The smoke step gets `SMOKE_DEPLOYMENT`.
  - The re-read uses `DOMAIN` and requests `"https://$DOMAIN/api/health"`.
  - The alert uses `TOPIC_ARN` and `DEPLOYMENT_KEY`, and the message is `printf 'The %s deploy failed at %s.…' "$DEPLOYMENT_KEY" "$stage" …`.
  - The settings check gets `SUPABASE_ROOT` and `DOMAIN` and refuses a `public_origin` other than `https://$DOMAIN`.
  - Renamed steps: "Validate the AWS root", "Initialise the AWS root", "Plan the AWS root with the built digest".
- **destroy.yml:**
  - The workflow is now named `Destroy AWS stack`, and the `confirm` description is "Type destroy <deployment> aws, with the deployment this ref deploys, to destroy its AWS stack". The header is rewritten.
  - The refusal step's head-object uses `--bucket "$STATE_BUCKET" --key "$SUPABASE_STATE_KEY"`.
  - Renamed steps (both jobs where they occur): "Initialise the AWS root", "List the state of the AWS root", "Plan the destroy of the AWS root", "Show the state of the AWS root is empty".
  - Error texts now read "…the plan is not the destroy of the $DEPLOYMENT_KEY AWS stack." and "The state of $AWS_ROOT still holds $count addresses."
- **Tests:**
  - deploy-workflow tests:
    - New pins for the migration flag (a regex on the continued line) and its env, `SMOKE_DEPLOYMENT`, and the re-read's env and URL.
    - A new `alertViolations` rule with four red copies: a literal topic, a literal staging in the subject, a literal staging in the message, and the topic from another source.
    - The public_origin regex in `resolvedSettingsViolations`, with two red copies: the comparison dropped, and the comparison against a literal origin.
    - A whole-file "names staging in comments only" test with three red copies.
  - destroy-workflow tests:
    - A pin on the confirm description.
    - The refusal step's env and head-object.
    - A per-key test, `it.each` over every map key with a Supabase root, that the derived key equals the root's declared backend key. It has a staging-present guard and a red parse of a foreign key, and it replaces the literal comparison.
    - The roots test is retitled "names no infra/envs/ path at all outside a comment".
    - A whole-file "names staging in comments only" test with four red copies.
  - workflow-errexit tests:
    - A new describe "the alert step of deploy.yml under bash -e" with two cases. The aws stub records its arguments. For `DEPLOYMENT_KEY=staging` the subject is `openvaa staging deploy failed at build`, the message's first line is `The staging deploy failed at build.` and the topic is the resolved one. A second key `other` is named by its key.
    - The Supabase-root case sets `SUPABASE_ROOT`, `STATE_BUCKET` and `SUPABASE_STATE_KEY` explicitly.

## Verification

- `yarn test:unit:infra`: **695 passed / 6 failed**. The six failures are the baseline host-only `workflow-errexit.test.ts` failures, with titles unchanged: wrong-subject ×2, sweep "deploy.yml deploy Alert the operator", sweep "destroy.yml plan-destroy Show the Supabase root's state is out of reach", and Supabase-root ×2. That is 19 more passing tests than the 676/6 baseline and no new failures.
- `yarn test:unit:infra deploy-workflow workflows`: 137 passed. `yarn test:unit:infra destroy-workflow workflows`: 125 passed.
- `yarn lint:check` exit 0, `yarn format:check` exit 0, `yarn lint:workflows` exit 0 ("actionlint found nothing in 3 workflows").
- Acceptance greps:
  - Non-comment `staging` lines: 0 in deploy.yml and 0 in destroy.yml.
  - `--deployment "$DEPLOYMENT_KEY"`: 1 in deploy.yml.
  - `SMOKE_DEPLOYMENT: ${{ needs.resolve.outputs.key }}`: 1 in deploy.yml.
  - `SUPABASE_STATE_KEY`: 2 in destroy.yml.
- `yarn test:unit:tests` was not rerun: this plan touches nothing under `tests/`. The baseline there is 1 host-only failure (tcpForward "BOUNDED time").

**Baseline test titles:** none of the six changed. Sweep titles that follow a step rename (all were green before and stay green):
- "deploy.yml deploy Plan the staging AWS root with the built digest" → "deploy.yml deploy Plan the AWS root with the built digest"
- "destroy.yml plan-destroy|apply-destroy List the state of the staging AWS root" → "… List the state of the AWS root"
- "destroy.yml plan-destroy|apply-destroy Plan the destroy of the staging AWS root" → "… Plan the destroy of the AWS root"
- "destroy.yml apply-destroy Show the state of the staging AWS root is empty" → "… Show the state of the AWS root is empty"

**Host-only cause, observed:** in this environment `rm` resolves to a guard that refuses. Every step that ends with `rm -f` therefore stops under `bash -e` before its last lines. That is what turns the alert sweep and the Supabase-root cases red here. The new alert case stubs `rm` with a no-op, so it is green on this host as well as on CI.

**E2E:** no local E2E project's spec, fixture, route or helper was touched, so no targeted run is due. Project deltas are 0 against `tests/e2e-runs/191-06-full` (742 passed).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The errexit alert case stubs `rm`**
- **Found during:** Task 1
- **Issue:** The alert script ends with `rm -f` of its two output files. On this host `rm` is a refusing guard, so a case without a stub would have been one more host-only red test.
- **Fix:** The case's stubs include `rm: 'exit 0'`. The removal is not under test, and the case's root is removed by the harness.
- **Commit:** 54f880e3e

### Scope notes

- The old error text "…not the destroy of the staging AWS stack" now names `$DEPLOYMENT_KEY`, so the guard step of both destroy jobs gained an `env:` block. This is one of the plan's examples.
- deferred-items.md: the 190-03 item "deploy.yml calls push-migrations.sh without --deployment" is resolved by 54f880e3e.

## Threat Flags

None. No new surface was added. T-190-34, -35, -37 and -38 are mitigated as the register sets out: the `--deployment` key, the public_origin = https://<domain> check before any AWS call, the resolved head-object key held to every root's backend key, and the alert text rendered from the key with staging's text pinned. T-190-36 is unchanged from 190-07: the job `if:` compares with `destroy_confirm`.

## Self-Check: PASSED

- FOUND: .github/workflows/deploy.yml, .github/workflows/destroy.yml, infra/scripts/deploy-workflow.test.ts, infra/scripts/destroy-workflow.test.ts, infra/scripts/workflow-errexit.test.ts
- FOUND commits: 54f880e3e, be66b7f5c
