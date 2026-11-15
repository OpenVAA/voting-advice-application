# 187-15 evidence: the CI run on the final tree

Repository `OpenVAA/voting-advice-application`. These readings were made by the plan executor from this checkout. The one remote read was `git ls-remote`. Nothing was pushed, no ref was created or moved, no GitHub, AWS or Supabase setting was read or changed, and no attempt file was created under `tmp/183-evidence/`.

## Task 1: what would be pushed, read-only (read 2026-11-15T20:04Z, HEAD `dff44d18f`)

```
READ_AT=2026-11-15T20:04Z
PUSH_COMMIT=69d10a72357e149c1c35a7002d7779233ffc4d44
PUSH_TREE=fa16b0c68a9d32835f811344393d2bb31a173c9b
HEAD_SOURCE_TREE=0f222299b88d63aa18878080896f1b6b50c6fe3a
PUSH_TREE_MATCHES_HEAD=no
PUSH_TREE_COVERED_BY_E2E=yes
PUSH_PATHS=3320
PUSH_PLANNING_PATHS=0
PUSH_EXCLUSIONS_PRESENT=yes
BRANCH_ABSENT=yes
MAIN_YAML_TRIGGERS_ON_CI_EVIDENCE=yes
READY_TO_PUSH=no
STOP_REASON=the green evidence commit's tree is not HEAD's tree without .planning/: 17 source paths under .github/workflows/ and infra/ changed after it, in 16 commits
```

How each line was read:

- **`PUSH_COMMIT`.** `git rev-parse --verify refs/evidence/187/green` exit 0 printed `69d10a72357e149c1c35a7002d7779233ffc4d44`, which is `GREEN_COMMIT` of `187-12-evidence-commits.md`. Its tree, `git rev-parse <commit>^{tree}`, is `fa16b0c68a9d32835f811344393d2bb31a173c9b` (`GREEN_TREE`). `git for-each-ref --contains <commit>` prints only `refs/evidence/187/green`: no branch and no remote-tracking ref holds it.
- **`PUSH_TREE_MATCHES_HEAD=no`.** I wrote a temporary index under the session scratch directory and removed it afterwards. With HEAD at `1b2af2af9`: `git read-tree HEAD` exit 0, `git rm -r --cached --quiet .planning` exit 0, and `git write-tree` exit 0 printed `0f222299b88d63aa18878080896f1b6b50c6fe3a`. That is not `GREEN_TREE`. The real index was not touched (`git diff --cached --quiet` exit 0). HEAD then moved to `dff44d18f` through a concurrent executor's commit. That commit changes only `.planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-17-smoke-contestant.md` (`git diff --quiet 1b2af2af9 HEAD -- . ':!.planning'` exit 0), so the reading holds for the current HEAD as well.
- **What differs.** `git diff --stat fa16b0c68 0f222299b` reports 17 files changed, 776 insertions(+) and 329 deletions(-). The files are:
  - `.github/workflows/`: `deploy.yml`, `destroy.yml`, `infra-plan.yml`
  - `infra/`: `README.md`, `bootstrap/README.md`, `envs/example/aws/tests/plan.tftest.hcl`, `envs/staging/supabase/README.md`, `modules/github-oidc/deploy-policies.tf`, `modules/github-oidc/tests/github_oidc.tftest.hcl`
  - `infra/scripts/`: `check-destroy-plan.sh`, `check-destroy-plan.test.ts`, `deploy-workflow.test.ts`, `destroy-workflow.test.ts`, `infra-plan-workflow.test.ts`, `push-migrations.sh`, `push-migrations.test.ts`, `workflowGuards.ts`

  `git log --oneline 54e79823b..HEAD -- . ':!.planning'` lists 16 commits that changed them, all after the closing E2E run's HEAD. Fourteen are code-review fixes, from `49d8ec823` (WR-08) to `6bf28e0e1` (IN-04). The other two are `95d1d6ad5` (docs 186-08) and `d55a94b7a` (docs 187, R-01). No file under `apps/`, `packages/` or `tests/` is among them.
- **`PUSH_TREE_COVERED_BY_E2E=yes`.** `git diff --quiet 54e79823b1fa6a3548a82bdf2d27644e4b7af317..HEAD -- apps packages tests` exit 0. Also, `git diff --quiet 54e79823b <PUSH_COMMIT> -- . ':!.planning'` exit 0: the green commit's tree is exactly the source tree the closing run covered (`E2E_TREE_SHA` of `187-13-closing-e2e.md`).
- **`PUSH_PLANNING_PATHS=0`.** `git ls-tree -r --name-only <PUSH_COMMIT>` exit 0 lists 3320 paths. `grep -c '^\.planning/'` over them counts 0 (exit 1, no match). HEAD's source tree also holds 3320 paths: the 17 files changed, but no path was added or removed.
- **`PUSH_EXCLUSIONS_PRESENT=yes`.** `git show <PUSH_COMMIT>:.github/trufflehog-exclude-paths.txt` holds both new exact-path entries, counted 2 by `grep -cxF`: `^tests/tests/utils/mailedLink\.test\.ts$` and `^apps/supabase/supabase/functions/account-access/signInLink\.test\.ts$`. The file and `.github/workflows/main.yaml` are identical at the green commit and at HEAD (`git diff --quiet <PUSH_COMMIT> HEAD -- <both>` exit 0).
- **`BRANCH_ABSENT=yes`.** `git ls-remote origin refs/heads/ci-evidence/187-final` exit 0 printed nothing (0 bytes), so a first push would carry no lease.
- **`MAIN_YAML_TRIGGERS_ON_CI_EVIDENCE=yes`.** In the green commit's `.github/workflows/main.yaml`, `on.push.branches` holds `main` and `"ci-evidence/**"`. `paths-ignore` (`**.md` and the `.env.example` paths) does not suppress the run: the commit's diff against its parent `340a20070` (origin's `main`) touches many paths that are not `.md` files.

## Reading

The execution rules allow the push only when the green commit's tree equals HEAD's tree without `.planning/`, and that check fails. The review-fix commits changed `deploy.yml`, `destroy.yml`, `infra-plan.yml`, the `github-oidc` module and the infra scripts after the green commit was written. Pushing `refs/evidence/187/green` now would run `secret-scan` and `infra-validate` on a tree from before those fixes, not on the phase's final tree, so G-03 would not be observed. The plan's rule applies: plan 187-12 Tasks 2 and 3 and plan 187-13 run again first, and then this plan's Task 1 is read again. Until then, Task 2's approval is not requested and no attempt of key `187-15-2` is created.

The closing E2E run's coverage of `apps/`, `packages/` and `tests/` still holds for HEAD, because no file there changed. Whether plan 187-13 really must run again for a change confined to `.github/workflows/` and `infra/` is a question for the operator or the planner. As written, the plan requires it.
