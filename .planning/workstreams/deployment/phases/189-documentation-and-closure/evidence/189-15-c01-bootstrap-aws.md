# 189-15 evidence: the unobserved statements of the bootstrap and staging AWS runbooks (C-01)

Recorded 2026-11-21 (UTC) by the plan executor of plan 189-15. Every disposition below is read from a tracked record: the runbooks' own dated Observations rows and the phase-187 evidence. No AWS, Supabase or GitHub call was made. Each statement is matched by its text, as numbered in `189-RESEARCH.md` § C-01. A `todo` disposition is carried, with its check, into `.planning/todos/pending/2026-11-20-189-unobserved-statements-about-the-deployed-stack.md`.

## `infra/bootstrap/README.md`, § "Not yet observed" (deleted)

```
C01_S3=todo The actual alert of the budget reaching the operator's mailbox, and its latency. Not seen: the 2026-10-23 row records the alert triggered in the AWS Budgets console and no mail within two days (an address not confirmed). INFRA-15 closed on the operator's ruling accept-console-alert of 2026-10-23, so nothing relies on the mail; carried with its check.
C01_S4=todo A forecast alert fires (AWS needs about five weeks of usage data). No record holds a forecast alert; carried with its check.
C01_S5=removed-moot AWS accepting a budget limit below 1 USD as a test amount. The 2026-10-22 row records a computed spend of 6.828 USD past the 0.80 USD threshold of the 1 USD budget, so no lower test amount was needed; the runbook no longer relies on it.
C01_S6=settled-by-row 2026-10-21 The spend of a quiet account showing in the budget's computed spend within a day or two. The 2026-10-21 row (Step 6) reads a computed spend of 6.475 USD on the day of the first apply, and the 2026-10-22 row 6.828 USD.
C01_S7=todo One OIDC provider per URL, so a second create for GitHub's URL fails. The 2026-10-21 row records that none existed, so no second create was tried; carried with its check (AWS's documentation cited, or a second create in a throwaway account).
C01_S8=row 2026-11-17 The AWS-managed read-only policy lets a plan of the pipeline root read all it must. Run 44104573552 (infra-plan.yml, same-repository pull request, created 2026-11-17T14:34:21Z, evidence/187-19-pr-plan.md and 187-VERIFICATION.md truth 3): the plan job assumed the plan role, every step succeeded and the plan ended plan_exit=2 with Plan: 1 to add, 1 to change, 1 to destroy. Row added, dated 2026-11-17, after the last 2026-11-17 row, so the table stays in date order.
C01_S9=settled-by-row 2026-11-18 A refused list call for the prefix env:/ does not stop a plan or an apply of the pipeline root. The 2026-10-21 row (Step 5) records the deploy role's list for env:/ as an implicit deny, and the 2026-11-18 row records every plan, apply, destroy and create of the AWS root by that role succeeding with no refused call in any log.
C01_S10=row 2026-11-17 A workflow can assume the plan role. The same run 44104573552: Assuming role with OIDC, Authenticated as the session pr-plan-44104573552 (evidence/187-19-pr-plan.md § The plan job). Row added, dated 2026-11-17, after the last 2026-11-17 row, so the table stays in date order.
```

## `infra/envs/staging/aws/README.md`, § "Not yet observed" (deleted)

```
C01_S11=row 2026-11-17 infra/scripts/running-image-digest.sh reads the digest of a running service whose task definition names its image by a tag. Settled by an existing record, so it became a dated row rather than a todo entry (deviation from the plan, which carried it into the todo): run 44104573552's digest step, on 2026-11-17 while the service ran task definition :6 with its image named by a tag, printed running_task_definition=…:6, running_image_reference=tag and the tag's digest (evidence/187-19-pr-plan.md § The plan job), and the script run from the workstation the same day printed the same three lines (evidence/187-21-green-run.md § The expected plan). Row added, dated 2026-11-17, after the table's last 2026-11-17 row.
C01_S12=settled-by-row 2026-11-18 The first plan after the switch to a digest reads Plan: 1 to add, 1 to change, 1 to destroy. on the task definition and the service alone. The 2026-11-18 row of run 44270824581 reads that plan line with the task definition replaced by digest, and the new 2026-11-17 row records the same line on the same two addresses for the pull request's plan. The half "its apply rolls out the same build" is moot: the pipeline's apply rolled out the new image its own build pushed, so nothing relies on a rollout of the same build.
C01_S13=settled-by-row 2026-11-18 ECS pulls and runs the image named as <registry_url>@sha256:<digest>. The 2026-11-18 row of run 44270824581 records the service running task definition :8 with the image by digest, the stable step COMPLETED and /api/health serving the commit; the 2026-11-19 row of run 44491292876 the same for the next digest.
```
