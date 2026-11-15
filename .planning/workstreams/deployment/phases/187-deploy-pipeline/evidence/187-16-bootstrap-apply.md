# 187-16 — The bootstrap hand apply of the deploy permissions

Root: `infra/bootstrap`, Step 9 of `infra/bootstrap/README.md`. Names, counts and forms only: no login, no address, no credential, no resource id from a log.

## Task 1 — The tree the operator will apply, read-only (2026-11-15T20:05Z)

Run with no AWS credential in the shell (`AWS_PROFILE`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN` unset), Terraform 1.16.5, each status read on its own line:

- `terraform -chdir=infra/modules/github-oidc init -backend=false -input=false` exit 0, then `terraform -chdir=infra/modules/github-oidc test -no-color`: `Success! 11 passed, 0 failed.`
- `node_modules/.bin/vitest run --config infra/vitest.config.ts bootstrap-tfvars`: 1 file, 7 tests passed.
- `terraform -chdir=infra/bootstrap validate -no-color`: `Success! The configuration is valid.` The root's existing `.terraform/` (S3 backend recorded) was used as it was; no init was run in `infra/bootstrap`, so the operator's item 2 init finds it unchanged.

```
READ_AT=2026-11-15T20:05Z
MODULE_TEST_EXIT=0
BOOTSTRAP_GUARD_EXIT=0
BOOTSTRAP_VALIDATE_EXIT=0
APPLY_COMMIT=b2a3c5dbd8644076c59fe50f0cea844ca61452b9
ENVIRONMENTS_READ_BACK=yes
STEP9_PRESENT=yes
```

Readings:

- `APPLY_COMMIT` is the tree's HEAD when the gates ran. The last commit touching `infra/bootstrap` or `infra/modules/github-oidc` is `6bf28e0e1`; the two commits after plan 187-14 (`dff44d18f`, `b2a3c5dbd`) touch only the evidence files of plans 187-17 and 187-15, so any later HEAD whose `git diff --quiet b2a3c5dbd -- infra` exits 0 applies the same code.
- `ENVIRONMENTS_READ_BACK=yes`: plan 187-14's evidence holds `ENV_STAGING_ADMIN_BYPASS=false` and `ENV_STAGING_DESTROY_ADMIN_BYPASS=false` (read 2026-11-15T19:59Z), so the `staging-destroy` subject the new deploy trust names belongs to an environment that exists and is protected.
- `STEP9_PRESENT=yes`: the runbook holds `## Step 9: The deploy role's permissions, the id conditions and the plan role's lock`, items 1 to 7.

### The reply's line forms against the attempt screen

Every line form Step 9 prints, with its expected values, was passed through `attempt.sh put` in a throwaway `ATTEMPT_DIR` (removed afterwards). Every key passes rule 2: no field's last word is a secret word (`s9b_pass_ecs_exit` and `s9a_add_address=...deploy_pass_role` end in `exit` and `address`; `s9c_uncovered_count`, `answer_step9` and the unstripped `token.actions.githubusercontent.com:` condition form pass too).

One value form is refused. The two Route 53 decision lines of item 3 (cases `dns_a` and `dns_mx`) print the simulator's resource name `arn:aws:route53:::hostedzone/Z02494181MAM7OCUAIPKC`, in which `hostedzone/Z02494181MAM7OCUAIPKC` is a run of 32 base64 characters holding a capital, a lower-case letter and a digit, so rule 3 refuses the line (`class=token-shape`, exit 3) and with it the whole reply. The same line with the `/` after `hostedzone` given as a space passes (exit 0), as does a line naming the case label, the action and the decision only. Raised at the checkpoint for the orchestrator to settle before the operator runs item 3; the runbook was not changed by this task.

```
SCREEN_KEYS=pass
SCREEN_DNS_DECISION_LINES=refused-token-shape
```
