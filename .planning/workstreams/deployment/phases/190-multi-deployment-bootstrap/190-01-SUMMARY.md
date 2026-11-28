---
phase: 190-multi-deployment-bootstrap
plan: "01"
subsystem: infra
tags: [terraform, bootstrap, plan-guard, move-proof, terraform-test]

requires:
  - phase: 189.1
    provides: "the deployment stack's bootstrap root at 46554181e"
provides:
  - "infra/scripts/check-bootstrap-plan.sh: JSON plan guard (delete, replace, failed move, unexpected create; --pure-move also refuses update and create)"
  - "infra/scripts/check-bootstrap-plan.test.ts: 33 fixture cases"
  - "infra/scripts/check-bootstrap-moves.sh: offline two-tree move proof, guard status propagated"
  - "Terraform 1.16.5 at $HOME/.cache/openvaa-terraform/1.16.5/terraform (untracked, checksum verified)"
  - "BASELINE_INFRA for the phase: 524 passed / 6 failed"
affects: [190-04, 190-06, 190-11, 190-13]

actuals:
  tasks: 3
  commits: 3
plan_head_before: 7623230fe
plan_head_after: f394858bb

tech-stack:
  added: []
  patterns:
    - "terraform test with an alternate module source per run and a shared state_key: base under a mock provider, tree under the real provider with fake keys and refresh off"

key-files:
  created:
    - infra/scripts/check-bootstrap-plan.sh
    - infra/scripts/check-bootstrap-plan.test.ts
    - infra/scripts/check-bootstrap-moves.sh
  modified: []

key-decisions:
  - "190-01: the run module source in the generated move test resolves from the root module directory: ../../../base/infra/bootstrap works on Terraform 1.16.5 (the tests-directory form was not needed)"
  - "190-01: the run name of a terraform test -json test_plan line is the field @testrun (1.16.5, read from the output)"
  - "190-01: the harness runs terraform with every AWS credential, profile and metadata variable unset and AWS_CONFIG_FILE/AWS_SHARED_CREDENTIALS_FILE=/dev/null, so no shell credential reaches the real provider"
  - "190-01: a step failure of the harness prints bootstrap_moves_failed=<step> before exiting with the step's status, so a terraform status of 1 is told apart from a guard fail"

requirements-completed: []

duration: 20min
completed: 2026-11-24
---

# Phase 190 Plan 01: Bootstrap plan guard and offline move-proof harness Summary

**A jq plan guard that refuses delete, replace, failed moves and unkeyed creates, and a `terraform test` harness that applies the base commit's bootstrap under a mock provider and plans the working tree into the same state under the real AWS provider with fake keys, clean on 46554181e and red on a registry rename.**

## Performance

- Started: 2026-11-24T14:42Z (approx.)
- Completed: 2026-11-24T15:02Z
- Tasks: 3 (Task 1 tracks no file, so it has no commit)
- Files created: 3

## Records

**Terraform download check (Task 1):**

```
terraform_1.16.5_linux_amd64.zip: OK
```

`$HOME/.cache/openvaa-terraform/1.16.5/terraform version` first line: `Terraform v1.16.5`. Nothing of the download is under the repository (fetched into a fresh scratchpad directory).

**Unit baseline (Task 1, unchanged tree 7623230fe):**

`BASELINE_INFRA=524 passed / 6 failed`, all six in `infra/scripts/workflow-errexit.test.ts`, host-only, not fixed:

1. the wrong-subject step of infra-plan.yml under bash -e > prints the subject and both refusals and exits 0 when both roles refuse with AccessDenied
2. the wrong-subject step of infra-plan.yml under bash -e > exits 1 with its own error line when a role accepts the subject
3. every status-reading step of the pipeline workflows under bash -e > deploy.yml deploy Alert the operator
4. every status-reading step of the pipeline workflows under bash -e > destroy.yml plan-destroy Show the Supabase root's state is out of reach
5. the Supabase-root step of destroy.yml under bash -e > passes on the two expected refusals
6. the Supabase-root step of destroy.yml under bash -e > fails when the init of the Supabase root succeeds

After this plan: 557 passed / 6 failed (the same six; +33 new guard cases).

**Control move proof (Task 3, `PATH="$HOME/.cache/openvaa-terraform/1.16.5:$PATH" bash infra/scripts/check-bootstrap-moves.sh --base 46554181e`, exit 0, about 18 s):**

```
CONTROL_MOVES=
bootstrap_moves_base_map=absent
bootstrap_moves_base=46554181e467aafe5b5a2928356b3c616f80c418
bootstrap_plan_delete=0
bootstrap_plan_replace=0
bootstrap_plan_moved=0
bootstrap_plan_failed_move=0
bootstrap_plan_update=18
bootstrap_plan_create=0
bootstrap_plan_unexpected_create=0
bootstrap_plan_guard=pass
```

The 18 updates are the mocked policy JSON and tag defaults of the pre_map state (policies, the two roles, the execution role, the budget); every attachment, the OIDC provider, the ECR repository and the state bucket are no-ops. 44 managed changes in the map run's plan.

**Red control of the harness (not in the plan, added for proof):** with `registry_name = "openvaa-frontend-x"` written temporarily into the working tree's `infra/bootstrap/terraform.tfvars` (reverted with `git checkout -- <file>` right after), the harness printed `bootstrap_plan_replace=2` (the ECR repository and its lifecycle policy), `bootstrap_plan_guard=fail` and exited 1. The real-provider plan therefore does report ForceNew replacements.

**Other checks:** `--base not-a-commit` exits 2; no `--base`, a bad `--new-key`, and no terraform on PATH exit 2; `--help` exits 0. After every run `git status --porcelain infra/` showed only the new, then committed, script; no `openvaa-bootstrap-moves.*` directory remained. `yarn lint:check` and `yarn format:check` exit 0. `grep -v '^#' <script> | grep -c 'set -x'` is 0 for both scripts.

## E2E

No local E2E project's spec, fixture, route or helper is touched, so no targeted run is due; project deltas 0 against the last full run (`tests/e2e-runs/191-06-full`, 742 passed).

## Task Commits

1. **Task 1: Terraform 1.16.5 and the unit baseline**: no commit (nothing tracked)
2. **Task 2: the bootstrap plan guard** (TDD): `08e04abb4` (test, RED: 33 failing), `60a4b84e2` (feat, GREEN: 33 passing)
3. **Task 3: the offline move-proof harness**: `f394858bb` (feat)

## Deviations from Plan

### Auto-fixed / added

**1. [Rule 2 - Security] The harness strips the calling shell's AWS credentials from terraform's environment**
- Found during: Task 3 (threat T-190-03 says no credential env reaches the real provider)
- Fix: every terraform call runs through `env -u AWS_ACCESS_KEY_ID -u AWS_SECRET_ACCESS_KEY ... AWS_CONFIG_FILE=/dev/null AWS_SHARED_CREDENTIALS_FILE=/dev/null AWS_EC2_METADATA_DISABLED=true CHECKPOINT_DISABLE=1`
- Files: infra/scripts/check-bootstrap-moves.sh; commit f394858bb

**2. [Rule 2 - Correctness] A named step-failure line**
- Terraform's own failing status is often 1, which equals the guard-fail status. The harness prints `bootstrap_moves_failed=<step>` (workdir, base, tree, test-file, init, test, plan) before exiting, so the two are told apart in the log; the header documents it.

**3. Guard extras beyond the behaviour list (tightening, no rule relaxed):** a create-before-destroy `["create","delete"]` counts as a replace; an `["update"]` with a non-empty `replace_paths` counts as a replace; a key that only begins like a named key (`other-two` vs `--new-key other`) is not matched; a `previous_address` equal to the address is not a move. Each has a fixture.

**4. Task 2 split into a RED and a GREEN commit** per the TDD protocol, so the plan has three commits for two tracked tasks.

## Known Stubs

None.

## Next Phase Readiness

- Plan 190-04 Task 3 is the first to exercise `bootstrap_moves_base_map=present` (MOVE_COMMIT on itself); the `deployments = <json>` line and the `for_each` override target are written but not yet run.
- Later plans put `$HOME/.cache/openvaa-terraform/1.16.5` first on PATH, or repeat Task 1's download and checksum check.

## Self-Check: PASSED

- FOUND: infra/scripts/check-bootstrap-plan.sh, infra/scripts/check-bootstrap-plan.test.ts, infra/scripts/check-bootstrap-moves.sh
- FOUND commits: 08e04abb4, 60a4b84e2, f394858bb
