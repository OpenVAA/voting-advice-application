# Phase 190 deferred items

Out-of-scope discoveries logged by executors; not fixed by the plan that found them.

| Found in | Item | Why deferred |
|----------|------|--------------|
| 190-03 | `yarn lint:check` exits 1 on 11 comment-hygiene violations (rule 2, forced line break) in `infra/scripts/resolve-deployment.sh` lines 15-25, the column table of its output contract. | File of plan 190-02; no file of 190-03 is flagged. Join or punctuate the table lines in a later plan touching the resolver (190-07 or 190-08), or before the phase-end lint gate. |
| 190-03 | `yarn test:unit:tests` has one host-only failure: `tests/utils/tcpForward.test.ts` "gives up on an unreachable upstream in BOUNDED time" (elapsed about 409 ms against a 550 ms floor; the unreachable dial is refused fast on this host instead of timing out). | Imports none of the files 190-03 touched; reproduces on every rerun here. |
| 190-03 | `.github/workflows/deploy.yml` (line 333) still calls `push-migrations.sh --confirmed-ref` without `--deployment`, which the script now refuses with exit 2. **Resolved by 190-08 (54f880e3e).** | deploy.yml is plan 190-07's file; it passes `--deployment` from the resolve job. Until then a push to `deploy/staging` would stop at the migration step. |
| 190-03 | `tests/README.md` inputs table (line 206) names `SMOKE_BASE_URL`'s default as `https://staging.openvaa.org` and the staging tfvars, and has no `SMOKE_DEPLOYMENT` row. | Documentation of the phase's docs plan (190-13 touches tests/README.md). |
| 190-09 | `infra/README.md` lines 290 and 307 still say the repository holds `AWS_PLAN_ROLE_ARN` and that the PR plan job assumes it and plans the staging AWS root; infra-plan.yml now derives each owned deployment's plan role and plans every owned AWS root. The repository variable can be deleted once the derived role (`arn:aws:iam::471112560111:role/openvaa/openvaa-plan` for staging) is confirmed. **Resolved in the docs by 190-10 (6be80d2cd); deleting the variable in GitHub stays an operator step.** | Documentation of the phase's docs plans (190-10/190-13 rewrite infra/README.md). |

## From the phase verification (2026-11-27, operator rulings)

- **The pull-request plan job of `infra-plan.yml` has never run** (190-09 truth 1; VERIFICATION human item 2). Every observed infra-plan run was a push, on which the job is skipped, so the derived plan role has not been seen assumed. Deferred by the operator: it is observed by the first same-repository pull request that touches `infra/`.
- **`tcpForward` "BOUNDED time" unit test fails on some hosts** (`yarn test:unit:tests`, 463/464 in the verifier's run, 464/464 in the gate run). It touches no phase-190 file. Deferred by the operator for now. Under the project's no-flaky rule it still has to be fixed at its root.
- **`AWS_PLAN_ROLE_ARN` repository variable**, value confirmed `arn:aws:iam::471112560111:role/openvaa/openvaa-plan` on 2026-11-27. Phase 190's workflows no longer read it, but `infra-plan.yml` on `feat/deployment-terraform-supabase` and `deploy/staging` still does (its wrong-subject job fails with `The repository variable AWS_PLAN_ROLE_ARN is not set.`). Delete it once phase 190's workflows are on those branches.
