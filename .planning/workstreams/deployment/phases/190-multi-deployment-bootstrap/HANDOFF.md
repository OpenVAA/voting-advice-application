# Phase 190 handoff (2026-11-25)

Continue locally from `OpenVAA/voting-advice-application` branch `planning/deployment-190`. Workstream `deployment`; pass `--ws deployment` to GSD (its state handlers misbehave with `--ws`, so STATE.md has been edited by hand). Resume with `/gsd:execute-phase 190 --ws deployment`; plans 190-01 to 190-11 have SUMMARYs and are skipped.

## Where it stands

| Plan | State |
|------|-------|
| 190-01 … 190-10 | Complete (code, tests, docs). |
| 190-11 | Complete. Both live applies done (evidence/190-11-applies.md), including a catch-up apply of 46554181e's plan-deny policy before the move. |
| 190-12 | Token probe done (evidence/190-12-observations.md: id-bearing subjects, `EMPTY_ENVIRONMENT=runs-without`, `ARM_RUNNER=available`). Task 3, the two workstation smoke runs, waits for 190-14 Task 2 by operator ruling. No SUMMARY yet. |
| 190-14 | Task 1 done (evidence commit, evidence/190-14-pipeline.md). **Task 2 blocked**, see below. Task 3 (destroy path) not started. No SUMMARY yet. |
| 190-13 | Not started: every gate on one commit, the move proof, the requirement trace, one full E2E run judged against `tests/e2e-runs/191-06-full` (742 passed, expected summed delta 0), VALIDATION sign-off. |

Live account: staging is on the map (MOVE_COMMIT ce17178c6) and tightened (TIGHTEN_COMMIT 7d4ab1242); `terraform plan` of the bootstrap reads `No changes` at 7d4ab1242. A staging deploy from main's old workflow after the tightening was green (run 44939177207, attempt 2).

## The blocker

The evidence deploy (`deploy-evidence/190-final` = fd57d43396b4f3da85897d9196102f6aa2eb2561, run 45564561423) stopped at "Push the migrations" before any change: staging's database carries migrations 00005–00024 of the pre-restack history, and the restacked stack dropped them (bba309b72) and differs in 13 `schema/` files. Every earlier step of the new workflow was green; the Infrastructure plan run on the same push (45564561462) was green. Another session is rewriting the staging database.

## Next steps, in order

1. **After the staging database is rewritten:** re-run Deploy run 45564561423 ("Re-run all jobs", same commit, no push needed), approve the `staging` gate. Expect `key=staging`, both settings steps success, `smoke_exit=0`, `served_build_after_smoke=fd57d43396…`. Record `DEPLOY_RUN=` in evidence/190-14-pipeline.md. If the rewrite changes `apps/supabase` on the deployment stack, rebuild the evidence commit from the new planning HEAD instead (recipe in 190-14 Task 1; use `git rm -r -f --cached -q .planning` on the temporary index).
2. **190-12 Task 3:** two voter-only smoke runs from the workstation against staging, `SMOKE_DEPLOYMENT` unset and `=staging`, with `SMOKE_EXPECTED_SHA` = the served build and `git diff --quiet <served> -- apps packages` = 0 (commands in 190-12-PLAN.md Task 3 and tests/README.md § Deployed smoke run). Record `SMOKE_DEFAULT=passed` and `SMOKE_STAGING_KEY=passed` in evidence/190-12-observations.md; write 190-12-SUMMARY.md.
3. **190-14 Task 3:** push the same commit to `deploy-evidence/destroy-staging`, approve `plan-destroy` only, **reject `apply-destroy`** (never approve it). Then `gh workflow run destroy.yml --ref deploy-evidence/190-final -f confirm=no` (both jobs skipped), then delete both evidence branches. Record `DESTROY_RUN=` and `DISPATCH_RUN=`; write 190-14-SUMMARY.md.
4. **190-13:** the phase gate and the full E2E run (`openvaa-stack-up` or the local equivalent first, then `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/190-full --no-db-reset --no-watch`). Then the phase verifier, ROADMAP and STATE.

## Things to know

- **Terraform:** use 1.16.5 built for the workstation's own platform (`darwin_arm64` on Apple Silicon). 1.17.2 darwin_amd64 timed out starting the AWS provider under Rosetta. The runbook now says so.
- **Unit baseline here:** `yarn test:unit:infra` had 6 failures in `workflow-errexit.test.ts` on the cloud host, caused by a refusing `rm` there; they should pass locally. If they pass, record fewer failures than the baseline (allowed by 190-13). `tests` has one host-only failure (tcpForward "BOUNDED time").
- **Accepted risks** recorded in infra/README.md: 13 cross-deployment plan-role reads (AWS reference pages were unreachable from the cloud session; each can be closed later by an in-place `plan_deny` update), shared budget, no reviewer gate for the GitHub-Free downstream.
- **Open deferred item:** `tests/README.md` has no `SMOKE_DEPLOYMENT` row (deferred-items.md, aimed at 190-13).
- **Operator chores:** confirm the old `AWS_PLAN_ROLE_ARN` repository variable named `arn:aws:iam::471112560111:role/openvaa/openvaa-plan`, then delete it (nothing reads it).
- **Downstream** (`OpenVAA/deploy-nuortenvaalikone`): Phase 192 complete; deferred there: delete `downstream-evidence/192-red`, `downstream-evidence/192-green` and the Dependabot nginx branch, and turn off Dependabot security updates. Phase 193 (instance infrastructure) waits for Phase 190 on `main`; the nuorten-2027 entry's subjects take the id-bearing form recorded in evidence/190-12-observations.md.
- **Upstream PR of Phase 191's code:** leave `.planning/workstreams/nuorten-2027/` out of it.
