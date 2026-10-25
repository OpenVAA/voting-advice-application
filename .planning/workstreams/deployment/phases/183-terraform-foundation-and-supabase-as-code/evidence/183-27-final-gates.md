# 183-27 The chains, the guards and the roots on the final tree

Plan started at HEAD `de904bfff279f57d14f8481366ce5b1ffa3d64e8` (2026-10-25T07:56:50Z). Each section is written whole from the attempt file named under it.

## Chains on the final tree

Attempt: 27-1 20261025T075656Z.de904bfff

Run in the shared checkout one after another, each in the background with stdout and stderr written to a log under `$TMPDIR` and the exit status written to a status file by the next command, never read through a pipe. Before and after each run: `git rev-parse HEAD` and `git status --porcelain --untracked-files=no`. The tree cell gives the line counts of the two samples. The commit id did not move during any gate, so none was re-run. The baseline status is plan 183-01's for the same gate. Node v24.21.0.

| Gate | Exit status | Date (UTC) | HEAD before | HEAD after | Tree before and after | Baseline status | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| lint:check | 0 | 2026-10-25T07:57Z | de904bfff279f57d14f8481366ce5b1ffa3d64e8 | de904bfff279f57d14f8481366ce5b1ffa3d64e8 | 0/0 | 0 | reached both guards: line 229 `No-inline-IAM-policies guard — 42 .tf file(s) read under 'infra'; 0 finding(s).`, line 233 the parity guard's all-hold line |
| format:check | 0 | 2026-10-25T07:57Z | de904bfff279f57d14f8481366ce5b1ffa3d64e8 | de904bfff279f57d14f8481366ce5b1ffa3d64e8 | 0/0 | 0 | |
| test:unit | 0 | 2026-10-25T07:58Z | de904bfff279f57d14f8481366ce5b1ffa3d64e8 | de904bfff279f57d14f8481366ce5b1ffa3d64e8 | 0/0 | 0 | |

Turbo cache: the turbo-run links replayed results keyed on their input hashes (lint:check: `turbo run lint` 12 of 12 cached and the turbo typecheck 23 of 23 cached; format:check: the app-shared build 7 of 7 cached; test:unit: 14 of 25 cached, 11 run). Every other link ran live on this tree: `eslint tests`, `typecheck:tests`, the 19 `assert:*` guards including both of this phase's, `prettier --check .`, the docs format check, `assert:unit-coverage` and `test:unit:tests`.

### What changed in the guards and their inputs since plan 183-13

Range: 5322ab1f640cf91bc586b962f025827efdb59b4c..de904bfff279f57d14f8481366ce5b1ffa3d64e8 (plan 183-13 ran its gates at 5322ab1f6), paths scripts/assert-hosted-settings-parity.mjs scripts/assert-no-inline-iam-policies.mjs scripts/fixtures infra packages/dev-seed/tests

```
3d08b6665 docs(183-20): record the budget alert on the operator's ruling and the raise to 100 USD
07ecd0627 docs(183-25): record the persistent project's apply in the runbook
b988931f3 feat(183-23): track the persistent project's organisation, name and region
a9418645d docs(183-24): move what the throwaway rehearsal showed into the runbook's observations
55802a1bc fix(183-24): stop sending the two OAuth-server keys the hosted API refused
839238881 feat(183-21): correct the Supabase settings to what the throwaway import showed
2a826bd82 docs(183-19): record the verified mail identity and the existing production access
7e4e6dcaa docs(183-18): record the staging delegation and the outside checks
fb5db2fca docs(183-17): record the zone and mail apply, the DKIM zone and the account asserts
7178a694a docs(183-16): record the bootstrap apply, migration, read-backs, simulator and lock
9d3d688da fix(183-16): simulate the plan role's two state reads one call each, and check the re-checked first-apply lines
1d90d8ead chore(183-14): record the account inventory and leave SES suppression to the account
51ffaccaa fix(183-14): print an access-key-id tag key as access-key-description in the account inventory
12c98aa5c feat[db]: freeze the baseline 00001_initial_schema.sql behind a manifest
0e5221fb1 test(182-06): the analytics variables in the three environment templates
```

The guard and its inputs were last edited by `55802a1bc` (183-24: `scripts/assert-hosted-settings-parity.mjs`, `infra/modules/supabase/hosted-settings.json`, the `max-rows-49999` fixture) and `839238881` (183-21: the same three, plus `infra/envs/scratch/supabase/terraform.tfvars`). The tracked variable files were last edited by `b988931f3` (183-23: `infra/envs/staging/supabase/terraform.tfvars`) and `1d90d8ead` (183-14: `infra/envs/staging/dns-mail/terraform.tfvars`). Every one of these commits is an ancestor of `de904bfff`, the commit all three gates ran on. The other commits in the range touch runbooks, `infra/scripts/account-inventory.sh` or specs of other phases.
