---
created: 2026-11-27T11:00:00.000Z
title: Delete the AWS_PLAN_ROLE_ARN repository variable once deploy/staging carries phase 190's workflows
area: ci
severity: minor
source: Phase 190 handoff (operator chore) and deferred-items.md § From the phase verification
owner: the operator (repository admin)
files:
  - .github/workflows/infra-plan.yml
---

## Problem

The repository variable `AWS_PLAN_ROLE_ARN` of `OpenVAA/voting-advice-application` holds `arn:aws:iam::471112560111:role/openvaa/openvaa-plan`, confirmed with `gh variable get` on 2026-11-27. Phase 190's `infra-plan.yml` no longer reads it: each plan role is derived from the deployment map by the resolve job, and `infra-plan-workflow.test.ts` fails if `vars.AWS_PLAN_ROLE_ARN` comes back.

`deploy/staging` still carries the old `infra-plan.yml` until its next deploy from `feat/deployment-terraform-supabase`. That file assumes the role from the variable (lines 91 and 169), and its wrong-subject job fails with `The repository variable AWS_PLAN_ROLE_ARN is not set.` when the variable is missing. Deleting it now would turn the next Infrastructure plan run on `deploy/staging` red. Old `ci-evidence/*` and `deploy-evidence/*` branches also read it, but they are not run again.

## Done when

- `git grep -c 'vars.AWS_PLAN_ROLE_ARN' origin/deploy/staging -- .github` prints nothing, after a deploy of a tree that holds phase 190's workflows.
- `gh variable delete AWS_PLAN_ROLE_ARN --repo OpenVAA/voting-advice-application` has run, and `gh variable list --repo OpenVAA/voting-advice-application` no longer lists it.
- The next Infrastructure plan run on `deploy/staging` after the deletion is green, and its run id is recorded here.
