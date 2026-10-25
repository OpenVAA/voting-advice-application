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

Attempt: 27-2 20261025T075928Z.de904bfff

## Guards, roots and specs on the final tree

Run in the shared checkout on 2026-10-25 between 07:59Z and 08:00Z, on the commit Task 1's gates ran on. `git rev-parse HEAD` was de904bfff279f57d14f8481366ce5b1ffa3d64e8 before the first run and after the last, and `git status --porcelain --untracked-files=no` printed 0 lines both times (`0/0`). Each status was captured on the command after the run, never through a pipe. Node v24.21.0. Terraform on this workstation is now v1.16.5, the version the `infra-validate` job pins, not the 1.14.7 the plan names.

| Check | Command | Exit status | Result line |
| --- | --- | --- | --- |
| inline-policy guard | `node scripts/assert-no-inline-iam-policies.mjs` | 0 | `No-inline-IAM-policies guard — 42 .tf file(s) read under 'infra'; 0 finding(s).` |
| inline-policy self-test | `node scripts/assert-no-inline-iam-policies.mjs --self-test` | 0 | `self-test passed: 9 finding(s) on the violating root, 9 expected; 0 on the clean root; 2 .tf file(s) read.` |
| parity guard | `node scripts/assert-hosted-settings-parity.mjs` | 0 | every classified key holds; `203 tracked file(s) scanned for a second writer of hosted settings` |
| parity self-test | `node scripts/assert-hosted-settings-parity.mjs --self-test` | 0 | `Hosted-settings parity guard — self-test passed: 66 case(s).` |
| settings types | `bash infra/scripts/check-settings-types.sh` | 0 | `four cases hold ... (types kept, JSON groups encoded)` |
| formatting | `terraform fmt -check -recursive -diff infra` | 0 | no diff |
| validation loop | `init -backend=false -input=false -lockfile=readonly` then `validate -no-color`, for `infra/bootstrap` and `infra/envs/*/*/` | 0 | 8 of 8 roots `Success! The configuration is valid.`: infra/bootstrap, infra/envs/example/aws, infra/envs/example/dns-mail, infra/envs/example/supabase, infra/envs/scratch/supabase, infra/envs/staging/aws, infra/envs/staging/dns-mail, infra/envs/staging/supabase |
| gate specs | `yarn workspace @openvaa/dev-seed test:unit tests/noInlineIamPoliciesGate.test.ts tests/hostedSettingsParityGate.test.ts tests/infraValidateJobGate.test.ts` | 0 | 3 test files, 36 tests passed |

The validation loop ran with `TF_PLUGIN_CACHE_DIR="$HOME/.terraform.d/plugin-cache"` and, for each root, its own `TF_DATA_DIR` under one `mktemp -d` directory in `$TMPDIR`, so no root's own `.terraform` directory was written or read. That directory was removed afterwards and no longer exists. The loop and the CI job run the same commands. The only difference is the data directory, which the init and validate of each root share.

Where the CLI's configuration push appears. The parity guard's "one writer" search covers every tracked file under `.github/workflows/`, `infra/` and `scripts/`, plus every tracked `package.json` (203 files on this tree). It excludes only the guard's own source and `scripts/fixtures/hosted-settings-parity/`, and it found none. A wider read-only `git grep -lE 'supabase[[:space:]\\]+config[[:space:]\\]+push'` over every tracked file, with state, plan and `.terraform` paths excluded, lists 17 files, all under `.planning/`, as planning prose. None is under `apps/`, `packages/`, `tests/`, `.github/`, `infra/` or `scripts/`, so nothing invokes it.

Verify re-run. The three verify commands of this task were run again at bcf3483f3d5b145538d6bfe54cfafa89da65f349, whose tree differs from de904bfff only by the Task 1 section of this evidence file, on 2026-10-25 around 08:03Z. All three exited 0. The validation loop again used its own throwaway `TF_DATA_DIR`, removed afterwards. The tree was 0/0 after.

## Criterion 5, clause by clause

Source check. Each source file's `Attempt:` line equals the helper's `id` for its key: `13-1 20261019T062957Z.46099edc1`, `15-3 20261021T112307Z.fd7f4c94d`, `23-3 20261023T105701Z.88053dd0f`, `25-2 20261023T114935Z.7f5e99d9d`, `26-2 20261019T062611Z.fc7521da6`. Each file carries its own observation line: `Chain observation: made` (183-13, its last such line), `Run observation: seen` (183-15), `Clause C5.1 import: seen` (183-23), `Clause C5.1 state: seen`, `Clause C5.2: seen` and `Clause C5.3: seen` (183-25), and `Red controls: 12 of 12 as expected` (183-26).

C5.1 verdict=seen date=2026-10-23 evidence=183-23-persistent-import.md source=23-3
The persistent project cofbsatfrdysyphajsky was imported into infra/envs/staging/supabase on 2026-10-23. The state read of 183-25-persistent-apply.md (key 25-2), the same day, found the project and the settings resource in its own encrypted, versioned state object hand/staging/supabase/terraform.tfstate, with prevent_destroy on the project block.
C5.2 verdict=seen date=2026-10-23 evidence=183-25-persistent-apply.md source=25-2
On 2026-10-23 a destroy plan of the staging Supabase root exited 1, naming the project resource as protected by prevent_destroy. terraform destroy was never run.
C5.3 verdict=seen date=2026-10-23 evidence=183-25-persistent-apply.md source=25-2
On 2026-10-23 the reviewed plan applied the hosted API and auth settings (apply exit 0). A second plan exited 0 with no changes, and 37 of 37 managed keys were read back as intended.
C5.4 verdict=seen date=2026-10-25 evidence=183-27-final-gates.md source=27-2
On the final tree the parity guard exited 0 with no second writer, across the 203 tracked files under .github/workflows/, infra/ and scripts/ and every tracked package.json. A wider grep finds the command only in planning prose under .planning/.
C5.5 verdict=seen date=2026-10-19 evidence=183-13-lint-check-red-controls.md source=13-1
On 2026-10-19 yarn lint:check exited 1 when a scratch checkout's hosted api.max_rows disagreed with config.toml, and the chain reached the parity guard. On the final tree the chain exits 0 with the tree cell 0/0 (Task 1), and the direct runs of 183-26-parity-red-control.md (key 26-2) found 12 of 12 red controls as expected.
C5.6 verdict=seen date=2026-10-21 evidence=183-15-ci-evidence.md source=15-3
The credential-free infra-validate job of main.yaml passed in run 39591102824 on 2026-10-21 and failed, as intended, in run 39591102968 on a tree broken on purpose. That run validated the branch as it stood at 18fdcd6ca. The infra edits since (plans 183-14, 183-21, 183-23 and 183-24) have been validated with the job's commands locally on the final tree in this task, but not in CI.

SUPA-11: observed

