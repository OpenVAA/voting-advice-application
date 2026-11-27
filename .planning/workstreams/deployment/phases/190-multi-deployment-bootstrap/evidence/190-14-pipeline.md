# 190-14 pipeline evidence

## Evidence commit (Task 1, 2026-11-24)

Built on the executor's host with a temporary index and pushed by no one. Inputs:

```
SOURCE_HEAD=b647e0d723009d94ad4c3af33bf28c57e3efe8f9
PARENT=340a200708c28fb7ed078d452138712f3400c789
EVIDENCE_TREE=d93523b909cd1330604e8a17f6b360c51ac0e436
EVIDENCE_COMMIT=fd57d43396b4f3da85897d9196102f6aa2eb2561
```

`SOURCE_HEAD` is `planning/deployment-190` at the time of the build (190-11's completion commit). `PARENT` is `origin/main` as fetched at that time. Every later commit of the planning branch touches only `.planning/`, so its tree outside `.planning/` is still `EVIDENCE_TREE`.

Recipe: `GIT_INDEX_FILE=<scratch>/ev.index`, `git read-tree $SOURCE_HEAD`, `git rm -r --cached -q .planning`, `git write-tree`. The commit is made with `git commit-tree --no-gpg-sign $EVIDENCE_TREE -p $PARENT -F -` and the fixed identity and dates `GIT_AUTHOR_NAME=Claude`, `GIT_AUTHOR_EMAIL=noreply@anthropic.com`, `GIT_AUTHOR_DATE='1795554000 +0000'`, and the same three values for the committer. Its message is fed on stdin as `printf '%s\n\n%s\n%s\n' 'evidence: phase 190 final tree' 'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>' 'Claude-Session: https://claude.ai/code/session_01SWZj9GAvsemehyWy7pQZwd'`. With every input fixed, anyone who reruns the recipe gets the same commit id. The local ref is `refs/evidence/190/final`.

```
$ git cat-file -p fd57d43396b4f3da85897d9196102f6aa2eb2561
tree d93523b909cd1330604e8a17f6b360c51ac0e436
parent 340a200708c28fb7ed078d452138712f3400c789
author Claude <noreply@anthropic.com> 1795554000 +0000
committer Claude <noreply@anthropic.com> 1795554000 +0000

evidence: phase 190 final tree

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01SWZj9GAvsemehyWy7pQZwd
```

Checks:

```
evidence_planning_paths=0          git ls-tree -r --name-only $EVIDENCE_COMMIT | grep -c '^.planning/'
evidence_tree_equal_exit=0         git diff --quiet HEAD $EVIDENCE_COMMIT -- . ':!.planning'
```

## Local resolution from the evidence tree (Task 1)

Run in a detached worktree of `EVIDENCE_COMMIT`:

```
### resolve-deployment.sh --mode deploy --repository-id 546467466 --ref deploy-evidence/190-final
exit=0
key=staging
environment=staging
destroy_environment=staging-destroy
domain=staging.openvaa.org
aws_account_id=471112560111
aws_region=eu-north-1
state_bucket=openvaa-tfstate-471112560111
aws_root=infra/envs/staging/aws
supabase_root=infra/envs/staging/supabase
state_key=pipeline/staging/aws/terraform.tfstate
supabase_state_key=hand/staging/supabase/terraform.tfstate
deploy_role_arn=arn:aws:iam::471112560111:role/openvaa/openvaa-staging-deploy
plan_role_arn=arn:aws:iam::471112560111:role/openvaa/openvaa-plan
topic_arn=arn:aws:sns:eu-north-1:471112560111:openvaa-staging-frontend-deployments
cluster_name=openvaa-staging
service_name=openvaa-staging-frontend
destroy_branch=deploy-evidence/destroy-staging
destroy_confirm=destroy staging aws
### resolve-deployment.sh --mode destroy --repository-id 546467466 --event push --ref deploy-evidence/destroy-staging
exit=0
key=staging
environment=staging
destroy_environment=staging-destroy
domain=staging.openvaa.org
aws_account_id=471112560111
aws_region=eu-north-1
state_bucket=openvaa-tfstate-471112560111
aws_root=infra/envs/staging/aws
supabase_root=infra/envs/staging/supabase
state_key=pipeline/staging/aws/terraform.tfstate
supabase_state_key=hand/staging/supabase/terraform.tfstate
deploy_role_arn=arn:aws:iam::471112560111:role/openvaa/openvaa-staging-deploy
plan_role_arn=arn:aws:iam::471112560111:role/openvaa/openvaa-plan
topic_arn=arn:aws:sns:eu-north-1:471112560111:openvaa-staging-frontend-deployments
cluster_name=openvaa-staging
service_name=openvaa-staging-frontend
destroy_branch=deploy-evidence/destroy-staging
destroy_confirm=destroy staging aws
### resolve-deployment.sh --mode destroy --repository-id 546467466 --event workflow_dispatch --ref deploy-evidence/190-final
exit=0
key=staging
environment=staging
destroy_environment=staging-destroy
domain=staging.openvaa.org
aws_account_id=471112560111
aws_region=eu-north-1
state_bucket=openvaa-tfstate-471112560111
aws_root=infra/envs/staging/aws
supabase_root=infra/envs/staging/supabase
state_key=pipeline/staging/aws/terraform.tfstate
supabase_state_key=hand/staging/supabase/terraform.tfstate
deploy_role_arn=arn:aws:iam::471112560111:role/openvaa/openvaa-staging-deploy
plan_role_arn=arn:aws:iam::471112560111:role/openvaa/openvaa-plan
topic_arn=arn:aws:sns:eu-north-1:471112560111:openvaa-staging-frontend-deployments
cluster_name=openvaa-staging
service_name=openvaa-staging-frontend
destroy_branch=deploy-evidence/destroy-staging
destroy_confirm=destroy staging aws
### resolve-deployment.sh --mode plan --repository-id 546467466
exit=0
deployments=[{"key":"staging","aws_root":"infra/envs/staging/aws","plan_role_arn":"arn:aws:iam::471112560111:role/openvaa/openvaa-plan","deploy_role_arn":"arn:aws:iam::471112560111:role/openvaa/openvaa-staging-deploy","cluster_name":"openvaa-staging","service_name":"openvaa-staging-frontend"}]
### resolve-deployment.sh --mode deploy --repository-id 546467466 --ref deploy-evidence/destroy-staging
exit=1
failed=no_branch_match
```

The last line is a control: a destroy branch never resolves in deploy mode. `deploy.yml`'s push trigger also excludes `deploy-evidence/destroy-*`.

## Operator push commands

Run from a clone that holds `EVIDENCE_COMMIT`, either built there by the recipe above or fetched:

```
git push origin fd57d43396b4f3da85897d9196102f6aa2eb2561:refs/heads/deploy-evidence/190-final
git push origin fd57d43396b4f3da85897d9196102f6aa2eb2561:refs/heads/deploy-evidence/destroy-staging
```

The second push is made only after the deploy of the first one is green and the two staging smoke runs of 190-12 Task 3 are recorded.

## Evidence commit, rebuilt (2026-11-26)

Phase 189.1.1 rewrote the staging database (its plan 12 rebuilt it to 00004, and its deploys added 00005), and `planning/deployment-190` was rebased onto `feat/deployment-terraform-supabase`, which brings 00005 and other `apps/supabase` changes. The evidence commit of Task 1 was rebuilt from the rebased branch by the same recipe, with only its session line changed:

```
SOURCE_HEAD=73560241e9a63f15c043e65f7a78f18043e6ecd0
PARENT=340a200708c28fb7ed078d452138712f3400c789
EVIDENCE_TREE=7d9bb71896e9dc5435228ef224fd7ef712221a2e
EVIDENCE_COMMIT=b7a78427de3c42817b04610155007f2e3d7f6c72
```

The message is `printf '%s\n\n%s\n%s\n' 'evidence: phase 190 final tree' 'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>' 'Claude-Session: https://claude.ai/code/session_01SWZj9DogP8np9RRWzxceZd'`; identity and dates as above. `PARENT` is `origin/main` as fetched on 2026-11-26, unchanged since Task 1.

```
evidence_planning_paths=0          git ls-tree -r --name-only $EVIDENCE_COMMIT | grep -c '^.planning/'
evidence_tree_equal_exit=0         git diff --quiet 73560241e $EVIDENCE_COMMIT -- . ':!.planning'
migrations=00001 00002 00003 00004 00005
apps_supabase_vs_served=0 files    git diff --stat 81b80140f $EVIDENCE_COMMIT -- apps/supabase
```

Staging served `deploy/staging` 81b80140f at the rebuild (Deploy run 45676071401, success). Its `apps/supabase` equals the evidence tree's, so the migration push is expected to find nothing pending.

Operator push (replaces fd57d4339 on the branch):

```
git push --force-with-lease=deploy-evidence/190-final:fd57d43396b4f3da85897d9196102f6aa2eb2561 \
  origin b7a78427de3c42817b04610155007f2e3d7f6c72:refs/heads/deploy-evidence/190-final
```

## Deploy

Task 2, 2026-11-27. The operator approved pushing EVIDENCE_COMMIT b7a78427d to `deploy-evidence/190-final` (`+ fd57d4339...b7a78427d`, force-with-lease on fd57d4339) and approved the `staging` gate in the GitHub UI.

- INFRA_PLAN_RUN=https://github.com/OpenVAA/voting-advice-application/actions/runs/45947196249 success (resolve success, checks success, wrong-subject (staging) success, plan skipped on push)
- DEPLOY_RUN=https://github.com/OpenVAA/voting-advice-application/actions/runs/45947196363 success

Every job and step of the Deploy run is `success` (resolve; checks; deploy: "Check the settings name the resolved deployment", the role assumptions, build and push, init, plan, show, link, "Push the migrations", "Check the deployment settings", "Deploy the functions", apply, "Check the rollout is stable", the smoke entry, "Read the served build again"), and the two alert steps are `skipped`. From its log:

```
key=staging
push_exit=0
settings_exit=0
smoke_exit=0
served_build_after_smoke=b7a78427de3c42817b04610155007f2e3d7f6c72
```

After the run, `curl -s https://staging.openvaa.org/api/health` printed `{"status":"ok","build":"b7a78427de3c42817b04610155007f2e3d7f6c72"}`.

## Destroy

Task 3, 2026-11-27. With the operator's go-ahead the session pushed EVIDENCE_COMMIT to `deploy-evidence/destroy-staging` (`+ 331b5db28...b7a78427d`, force-with-lease on 331b5db28, a leftover of phase 187). The push started "Destroy staging AWS" alone; no Deploy or Infrastructure plan run. The operator approved `plan-destroy` and rejected `apply-destroy` at the `staging-destroy` gate.

```
key=staging
destroy_environment=staging-destroy
supabase_root_refused=yes
destroy_guard=pass
```

Approvals of the run (`gh api repos/OpenVAA/voting-advice-application/actions/runs/45954382752/approvals`): `approved staging-destroy` (plan-destroy), `rejected staging-destroy` (apply-destroy). Jobs: resolve success (5 steps), plan-destroy success (15 steps), apply-destroy failure with no step run (GitHub's conclusion for a rejected deployment). Afterwards `https://staging.openvaa.org/api/health` still printed `{"status":"ok","build":"b7a78427de3c42817b04610155007f2e3d7f6c72"}`.

DESTROY_RUN=https://github.com/OpenVAA/voting-advice-application/actions/runs/45954382752 plan-destroy=success apply-destroy=rejected

The wrong-confirm dispatch, `gh workflow run destroy.yml --ref deploy-evidence/190-final -f confirm=no`: run conclusion success on `deploy-evidence/190-final`, resolve success, both destroy jobs skipped.

DISPATCH_RUN=https://github.com/OpenVAA/voting-advice-application/actions/runs/45958867533 resolve=success plan-destroy=skipped apply-destroy=skipped

Both evidence branches deleted:

```
$ git push origin --delete deploy-evidence/190-final deploy-evidence/destroy-staging
 - [deleted]             deploy-evidence/190-final
 - [deleted]             deploy-evidence/destroy-staging
$ git ls-remote origin refs/heads/deploy-evidence/190-final refs/heads/deploy-evidence/destroy-staging | wc -l
       0
```

## Evidence deploy, attempt 1 (2026-11-25)

Pushed by the operator: `deploy-evidence/190-final` = fd57d43396b4f3da85897d9196102f6aa2eb2561.

- INFRA_PLAN_RUN=https://github.com/OpenVAA/voting-advice-application/actions/runs/45564561462 success (resolve success, checks success, wrong-subject (staging) success, plan skipped on push)
- DEPLOY_RUN=https://github.com/OpenVAA/voting-advice-application/actions/runs/45564561423 failure, at "Push the migrations" (alert_stage=migrations). Every earlier step green: resolve, checks, "Check the settings name the resolved deployment", role assumption, build and push, init, plan, show, link. Apply, rollout and smoke did not run; staging still serves 2ddc331d1.

Cause (outside Phase 190): `supabase db push --dry-run` refused with "Remote migration versions not found in local migrations directory" for 00005 to 00024. The staging database was migrated from the pre-restack history (24 migrations, as at deploy/staging 2ddc331d1); the restacked stack (46554181e and every tree after it) regenerated the baseline and dropped 00002 to 00024 (bba309b72), and its `apps/supabase/supabase/schema/` differs from the deployed one in 13 files.

Operator ruling: another session is rewriting the staging database; this plan waits for it. When it is done, re-run the failed Deploy run (same commit, so no new push is needed), approve the `staging` gate, and continue with 190-12's smoke runs and Task 3.
