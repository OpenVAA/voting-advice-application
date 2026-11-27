---
phase: 190-multi-deployment-bootstrap
plan: "05"
subsystem: infra
tags: [terraform, bootstrap, tftest, mock-provider, ci]

requires:
  - phase: 190
    provides: "190-04 bootstrap root over var.deployments, module outputs policy_names / execution_role_name / repository_name"
provides:
  - "infra/bootstrap/tests/deployments.tftest.hcl: staging name pins, two-entry isolation, seven validation refusals (mock provider)"
  - "terraform-checks.sh test-bootstrap, run by infra-plan.yml's checks job"
affects: [190-06, 190-07, 190-11, 190-13, 190-14]

actuals:
  tasks: 2
  commits: 2
plan_head_before: 3cd1966b4
plan_head_after: d7949d849

tech-stack:
  added: []
  patterns:
    - "a check over a fixed root loops over the literal path and skips it when its tests directory is missing, because nullglob never drops a word with no glob character"

key-files:
  created:
    - infra/bootstrap/tests/deployments.tftest.hcl
  modified:
    - infra/scripts/terraform-checks.sh
    - infra/scripts/terraform-checks.test.ts
    - .github/workflows/infra-plan.yml
    - infra/scripts/infra-plan-workflow.test.ts

key-decisions:
  - "190-05: the bootstrap root test pins staging's names (openvaa-plan, openvaa-staging-deploy, the twelve policy names, openvaa-staging-frontend-execution, openvaa-frontend, openvaa-monthly) in the committed-map run and again beside a nuorten-2027 stand-in; the stand-in's state policy is openvaa-tfstate-nuorten-2027-aws (name_prefix-environment form), its other eleven policies carry openvaa-nuorten-2027-"
  - "190-05: test-bootstrap checks for infra/bootstrap/tests with -d instead of a glob; a glob-free path survives nullglob, which the stub test caught red"

requirements-completed: []  # INFRA-21 is ticked with the operator's live plan and apply (190-11)

duration: 20min
completed: 2026-11-24
---

# Phase 190 Plan 05: The bootstrap root test and its CI check Summary

**I added a mock-provider `terraform test` of `infra/bootstrap` with three parts. It pins staging's rendered names. It plans a `nuorten-2027` stand-in beside staging, with no role, policy or registry name shared between them. It shows each of seven map validations refusing its case. CI runs it on every infra pull request through a new `terraform-checks.sh test-bootstrap` check in `infra-plan.yml`'s credential-free checks job.**

## Results

`terraform -chdir=infra/bootstrap test`: 9 passed, 0 failed. That is 2 plan runs (`staging_names` and `second_entry_is_apart`) and 7 refusals, each with `expect_failures = [var.deployments]`.

**Red first:** in a scratch copy, I mutated staging's deploy-role pin to `openvaa-staging-deployx`. `staging_names` then failed with "Staging's deploy role must be named openvaa-staging-deploy." I also split each refusal into its own file with `expect_failures` removed, to check that each case fails on the validation it is meant for and on no other:

| Run | Validation that refused it |
|-----|----------------------------|
| refuses_a_key_over_fifteen_characters (`nuorten-20270000`, 16 chars) | "Every key of deployments must start with a lower-case letter, ..." (the 32-character registry-name bound) |
| refuses_a_malformed_key (`Nuorten_2027`) | the same key validation |
| refuses_a_shared_domain | "No two entries of deployments may share a domain." |
| refuses_a_shared_subject (staging's pull_request subject) | "No OIDC subject may appear twice ..." |
| refuses_a_wildcard_branch_without_environment (`deploy/*`) | "An entry of deployments without environment must list only deploy branches free of \"*\" ..." |
| refuses_a_branch_without_its_ref_subject (`:ref:refs/heads/main` only) | the same no-environment validation |
| refuses_an_environment_without_its_subject | "An entry ... that sets environment or destroy_environment must list ... :environment:<that name>." |

The account has one OIDC provider by construction: `module.github_oidc_provider` has no `for_each`, and every `github_oidc[k]` takes its ARN. No assertion is needed for that.

**Checks:**
- `infra/scripts/terraform-checks.sh test-bootstrap`: exit 0, `tested 1 bootstrap roots: infra/bootstrap`.
- `yarn test:unit:infra terraform-checks infra-plan-workflow`: 59 passed.
- `yarn lint:workflows`: exit 0. Docker was started with `openvaa-stack-up`.
- `terraform fmt -check -recursive infra`: clean.
- `yarn test:unit:infra`: 633 passed / 6 failed. The baseline was 630 / 6; the 3 extra passes are the new test-bootstrap stub tests. The six failures are the baseline host-only `workflow-errexit.test.ts` cases.
- `yarn lint:check`: exit 0. `yarn format:check`: exit 0.

## E2E

No local E2E project's spec, fixture, route or helper was touched, so no targeted run is due. Project deltas are 0 against `tests/e2e-runs/191-06-full` (742 passed).

## Task Commits

1. **Task 1: the bootstrap root test**: `f475461de`
2. **Task 2: test-bootstrap, its stub tests and the CI step**: `d7949d849`

## Deviations from Plan

**1. [Rule 1 - Bug] The planned glob loop in test-bootstrap could not fail**
- Found during: Task 2, when the new stub test "fails naming infra/bootstrap when it has no tests directory" went red.
- Issue: `for tests in infra/bootstrap/tests/` contains no glob character, so `nullglob` keeps it as a literal word. The loop then ran Terraform on a missing tests directory, `require_reached` passed, and the check exited 0 on nothing. This is the empty-glob hole that threat T-190-21 names.
- Fix: the loop goes over `infra/bootstrap` and skips the root when `[ ! -d "$root/tests" ]`. `require_reached` then fails, naming `infra/bootstrap`. The stub test passes now.
- Commit: `d7949d849`.

**2. The stand-in's state policy is not prefixed `openvaa-nuorten-2027-`.** The plan's wording, "policies prefixed `openvaa-nuorten-2027-`", does not hold for `tfstate_pipeline`. Its name stays in the `<name_prefix>-tfstate-<key>-aws` form, the same as staging's `openvaa-tfstate-staging-aws`. The test asserts the prefix on the other eleven policies and the exact name `openvaa-tfstate-nuorten-2027-aws` for that one. A union assertion checks that none of the 30 role and policy names (15 per deployment) repeats, and a separate one checks the registries.

**3. Additions:** a third stub test for a failing bootstrap test (exit 7, no "tested" line), and an assertion on the `deployments` output's keys in both plan runs.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: infra/bootstrap/tests/deployments.tftest.hcl
- FOUND commits: f475461de, d7949d849
