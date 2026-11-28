---
phase: 190-multi-deployment-bootstrap
plan: "04"
subsystem: infra
tags: [terraform, bootstrap, for_each, moved, iam, oidc]

requires:
  - phase: 190
    provides: "190-01 move harness and plan guard; 190-02 deployment map"
provides:
  - "infra/modules/github-oidc-provider: the account's one aws_iam_openid_connect_provider.github"
  - "github-oidc inputs oidc_provider_arn and iam_name_prefix; output policy_names"
  - "infra/bootstrap over var.deployments (map(object), eleven attributes, eleven validations), moves.tf with four moved blocks, deployments output map"
  - "infra/bootstrap/example-deployments.json"
  - "MOVE_COMMIT=ce17178c6945c6514b3a2c5cfde49b322fb0265f"
affects: [190-05, 190-06, 190-07, 190-08, 190-09, 190-11, 190-13]

actuals:
  tasks: 3
  commits: 4
plan_head_before: bd9ae8312
plan_head_after: ce17178c6

tech-stack:
  added: []
  patterns:
    - "per-entry validations that read an optional attribute use a for-expression `if` filter, so a null attribute is never interpolated"

key-files:
  created:
    - infra/modules/github-oidc-provider/main.tf
    - infra/modules/github-oidc-provider/outputs.tf
    - infra/bootstrap/moves.tf
    - infra/bootstrap/example-deployments.json
  modified:
    - infra/modules/github-oidc/{main,variables,outputs,policies,deploy-policies}.tf
    - infra/modules/github-oidc/tests/github_oidc.tftest.hcl
    - infra/bootstrap/{main,variables,outputs}.tf
    - infra/bootstrap/terraform.tfvars
    - infra/bootstrap/example.tfvars
    - infra/scripts/bootstrap-tfvars.test.ts
    - infra/scripts/workflows.test.ts
    - infra/scripts/check-bootstrap-moves.sh
    - scripts/tests/infraValidateJobGate.test.ts

key-decisions:
  - "190-04: MOVE_COMMIT=ce17178c6945c6514b3a2c5cfde49b322fb0265f; move proof vs 46554181e: delete 0, replace 0, create 0, moved 37 (= 37 managed addresses under the four keyed prefixes), update 18 (mock policy JSON, as in the control), guard pass"
  - "190-04: MAP_CONTROL vs MOVE_COMMIT: base_map present, moved 0, delete 0, replace 0, create 0, guard pass"
  - "190-04: the bootstrap root derives pipeline_state_keys as pipeline/<key>/aws/terraform.tfstate; scripts/tests/infraValidateJobGate.test.ts now checks every map key's infra/envs/<key>/aws backend key against it"
  - "190-04: check-bootstrap-moves.sh found the tree's deployments variable through a glob under set -f, which never expanded; it now lists the root's .tf files with find"

requirements-completed: []  # INFRA-21 is met in code and INFRA-22 offline; both are ticked when the operator's live plan and apply (190-11) are recorded

duration: 15min
completed: 2026-11-24
---

# Phase 190 Plan 04: The pure staging move Summary

**`infra/bootstrap` now calls `registry`, `frontend_task_role` and `github_oidc` once per entry of `var.deployments`, with the OIDC provider in its own account-wide module and four `moved` blocks. Every staging name and description renders as before, and the offline proof against 46554181e shows 37 addresses moved, with no delete, no replace and no create.**

## Performance

- Started: 2026-11-24T15:20Z (approx.)
- Completed: 2026-11-24T15:36Z
- Tasks: 3. Commits: 4 (the harness fix is a separate commit).

## Records

`MOVE_COMMIT=ce17178c6945c6514b3a2c5cfde49b322fb0265f`. This is the tree the operator plans and applies first, in 190-11.

`MOVE_PROOF=` (`PATH="$HOME/.cache/openvaa-terraform/1.16.5:$PATH" bash infra/scripts/check-bootstrap-moves.sh --base 46554181e`, run on a clean tree at MOVE_COMMIT, exit 0):

```
bootstrap_moves_base_map=absent
bootstrap_moves_base=46554181e467aafe5b5a2928356b3c616f80c418
bootstrap_plan_delete=0
bootstrap_plan_replace=0
bootstrap_plan_moved=37
bootstrap_plan_failed_move=0
bootstrap_plan_update=18
bootstrap_plan_create=0
bootstrap_plan_unexpected_create=0
bootstrap_plan_guard=pass
```

Independent count, made from a `--keep` run's `map-plan.json`: 37 managed resource_changes have an address starting `module.github_oidc[`, `module.github_oidc_provider.`, `module.frontend_task_role[` or `module.registry[`. All 37 carry a `previous_address`, out of 44 managed changes in total. So `bootstrap_plan_moved=37` equals the counted total of 37. The 18 updates are the same mocked policy JSON and tag defaults as the 190-01 control (budget, state bucket policy, the 12 policies, both roles, the execution role and its parameters policy). None is a replace.

`MAP_CONTROL=` (`bash infra/scripts/check-bootstrap-moves.sh --base ce17178c6945c6514b3a2c5cfde49b322fb0265f`, clean tree at MOVE_COMMIT, exit 0):

```
bootstrap_moves_base_map=present
bootstrap_moves_base=ce17178c6945c6514b3a2c5cfde49b322fb0265f
bootstrap_plan_delete=0
bootstrap_plan_replace=0
bootstrap_plan_moved=0
bootstrap_plan_failed_move=0
bootstrap_plan_update=18
bootstrap_plan_create=0
bootstrap_plan_unexpected_create=0
bootstrap_plan_guard=pass
```

**Checks:**
- `terraform -chdir=infra/modules/github-oidc test`: 14 passed. These include `staging_names_unchanged` (openvaa-plan, openvaa-staging-deploy, all twelve policy names, the exact staging DNS description) and `second_prefix_names`.
- `terraform -chdir=infra/bootstrap validate`: Success. `terraform-checks.sh validate`: 8 roots. `test-modules`: 3 modules. `terraform fmt -check -recursive infra`: clean.
- I checked the validations by hand in a scratch copy with `terraform console`. Each of these is refused: an environment with no matching subject, a destroy_environment with no matching subject, `a/*b` as a branch, a duplicate entry, an entry with no environment and no ref subject, a non-digit id, and a key that is too long. The real map, the example map, a second well-formed entry and a ref-only entry are accepted. 190-05 proves these with `expect_failures`.
- `yarn test:unit:infra`: 630 passed / 6 failed. The six failures are the baseline host-only `workflow-errexit.test.ts` cases. The other 10 tests are new, so the count was 620 before.
- `yarn test:unit:tests`: 459 passed / 1 failed, the baseline host-only tcpForward "BOUNDED time" case.
- `scripts` vitest (`infraValidateJobGate`): 33 passed. The whole `scripts` workspace passes.
- `yarn lint:check` exit 0. `yarn format:check` exit 0.

## E2E

No local E2E project's spec, fixture, route or helper is touched, so no targeted run is due. Project deltas are 0 against `tests/e2e-runs/191-06-full` (742 passed).

## Task Commits

1. **Task 1: provider module and github-oidc inputs**: `9122fabe4`
2. **Task 2: bootstrap root over the map, moved blocks**: `722fc623d`
3. **Task 3: text guards read the map**: `ced508356`. The harness fix needed to run the proof is `ce17178c6` (MOVE_COMMIT).

## Deviations from Plan

**1. [Rule 1 - Bug] The move harness never saw the tree's `deployments` variable**
- Found during: Task 3, on the first run of the move proof.
- Issue: `check-bootstrap-moves.sh` runs under `set -f`, so `"$REPO"/infra/bootstrap/*.tf` stayed a literal path. `grep` failed on it, and the harness printed `bootstrap_moves_note=undeclared_map_file_skipped`. It left the map out of the copy, and the tree's run failed with no value for `deployments`.
- Fix: the root's `.tf` files are listed with `find -maxdepth 1 -name '*.tf' -exec grep -Eq ... {} +`.
- Commit: `ce17178c6`. This is the last code commit, so it is MOVE_COMMIT. It changes no Terraform.

**2. [Rule 3 - Blocking] `scripts/tests/infraValidateJobGate.test.ts` read `pipeline_state_key` from `terraform.tfvars`**
- The plan removes that assignment, and the file was not in the plan's list. The test now asserts two things. First, `infra/bootstrap/main.tf` derives `pipeline_state_keys` as `pipeline/${k}/aws/terraform.tfstate`. Second, the backend key of `infra/envs/<key>/aws` is that key for every map key.
- Commit: `ced508356`.

**3. Additions to bootstrap-tfvars.test.ts:** one test pins the account values in `terraform.tfvars` and checks that no deployment assignment remains there. Another asserts that the attribute parse found exactly the eleven declared names, so the subset check cannot pass vacuously.

## Known Stubs

None.

## Notes for later plans

- `infra/bootstrap/README.md` still describes the flat per-deployment variables. That is docs work for 190-11 or 190-13.
- `deploy.yml` still calls `push-migrations.sh` without `--deployment`. This is expected until 190-07.

## Self-Check: PASSED

- FOUND: infra/modules/github-oidc-provider/main.tf, outputs.tf, infra/bootstrap/moves.tf, infra/bootstrap/example-deployments.json
- FOUND commits: 9122fabe4, 722fc623d, ced508356, ce17178c6
