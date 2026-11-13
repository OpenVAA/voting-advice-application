# 183-13 Both new guards red through `yarn lint:check`

Each red control below planted a violation in a throwaway `git worktree` (the scratch checkout) made from a commit
that already holds both guards and both `lint:check` links. The shared checkout was never changed by a red control.
Every `yarn lint:check` ran in the background with stdout and stderr written to a log file and its exit status
written to a status file on the next command, never read through a pipe. Each setup (planting, editing) was its own
command with its own status checked before the run. Node v24.21.0, Yarn 4.18.1, `TURBO_CACHE_DIR` private to the
scratch checkout and removed with it.

Section written whole from the attempt file named on the next line.

Attempt: 13-1 20261019T062957Z.46099edc1

## Scratch checkout

- Commit `C`: 46099edc1c52f9674cf62c74fa32f280611121d8 (also the commit at which this plan started). `git cat-file -e`
  found `scripts/assert-no-inline-iam-policies.mjs` and `scripts/assert-hosted-settings-parity.mjs` in `C`, and the
  `lint:check` value of `git show C:package.json` holds both `yarn assert:no-inline-iam-policies` and
  `yarn assert:hosted-settings-parity` (the last two links of the chain).
- Shared checkout before: `git status --porcelain --untracked-files=no` printed 0 lines, HEAD `C`.
- Free space under `$TMPDIR`: 207 GiB.
- Made with `git worktree add --detach "$TMPDIR/openvaa-183-red" C` (status 0).
- `node_modules` came from `yarn install --immutable` run in the scratch checkout (status 0, 5 s, mostly linked from
  Yarn's global cache; `du -sh` of the scratch checkout after the install: 1.2G). The shared checkout's
  `node_modules` was not linked. The shared checkout's untracked, Git-ignored `.env` was copied in.
- Workspace packages built in the scratch checkout with `yarn build` (status 0, 14 of 14 turbo tasks). A first clean
  `yarn lint:check` before this build exited 2 at `typecheck:tests` with `TS2307: Cannot find module
  '@openvaa/app-shared'` (and `@openvaa/core`, `@openvaa/data`): a fresh checkout has no `dist/` for the workspace
  packages, which the shared checkout has. That is a gap in the scratch setup, not a red link at `C`; the baseline of
  plan 183-01 shows `lint:check` 0 in a built tree. `du -sh` before removal, with the build output: 1.3G.
- Removal: `git worktree remove --force "$TMPDIR/openvaa-183-red"`, then `git worktree prune`. Afterwards
  `git worktree list --porcelain` does not name the path, and the path does not exist.
- Shared checkout after: 0 lines, HEAD `C`.

## Inline-policy guard through the chain

- Date (UTC): 2026-10-19
- Clean run (2026-10-19T06:32:49Z, after the build): exit status 0. Its inline-policy line:
  `No-inline-IAM-policies guard — 42 .tf file(s) read under 'infra'; 0 finding(s).` Its parity line:
  `Hosted-settings parity guard — every classified key holds between apps/supabase/supabase/config.toml, infra/modules/supabase/hosted-settings.json and the Supabase roots under infra/envs.`
- Setup: `mkdir infra/zz-red-control` in the scratch checkout and a file `planted.tf` holding one
  `aws_iam_role_policy` resource for a role (`terraform fmt -check` exit 0): status 0.
- Red run (2026-10-19T06:33:41Z): exit status 1.
- Finding line: `infra/zz-red-control/planted.tf:1: aws_iam_role_policy`
- Guard summary: `No-inline-IAM-policies guard — 43 .tf file(s) read under 'infra'; 1 finding(s).`
- Last link that printed its summary before the failure:
  `Auth-signup-closed guard — 7 key(s) hold in apps/supabase/supabase/config.toml.` The parity guard, the link after
  the inline-policy guard, printed nothing: the chain stopped at the inline-policy guard.
- The planted directory was then deleted from the scratch checkout (status 0; `git status --porcelain` empty).

## Parity guard through the chain

- Date (UTC): 2026-10-19
- Clean run: the same clean run as above, exit status 0.
- Setup: in the scratch checkout's `infra/modules/supabase/hosted-settings.json`, `max_rows` in the `api` group
  changed from 50000 to 49999 and nothing else (`git diff`: one line out, one line in): status 0.
- Red run (2026-10-19T06:34:21Z): exit status 1.
- Finding line:
  `infra/modules/supabase/hosted-settings.json: api/max_rows: config.toml 50000, hosted api.max_rows 49999, dataAdapter.pageSize 50000; all three must be equal — the frontend reads each collection in one request and does not paginate, so a smaller cap truncates a response without an error`
- Guard summary: `Hosted-settings parity guard — 1 finding(s).`
- Last link that printed its summary before the failure, which shows the earlier new link passed:
  `No-inline-IAM-policies guard — 42 .tf file(s) read under 'infra'; 0 finding(s).`

Chain observation: made

## Gates on the finished tree

Run in the shared checkout one after another, each in the background with its log and exit status written to files
and the status read from the file, with a private `TURBO_CACHE_DIR`. Before and after each run, `git rev-parse HEAD`
and `git status --porcelain --untracked-files=no` (the tree cell is the line count of the two samples). No gate needed
a re-run: the commit id did not move during any of them. The baseline status is the one of plan 183-01 for the same
gate.

Attempt: 13-3 20261019T063550Z.5322ab1f6

| Gate | Exit status | Date (UTC) | HEAD before | HEAD after | Tree before and after | Baseline status | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| lint:check | 0 | 2026-10-19T06:35Z | 5322ab1f640cf91bc586b962f025827efdb59b4c | 5322ab1f640cf91bc586b962f025827efdb59b4c | 0/0 | 0 | |
| format:check | 0 | 2026-10-19T06:36Z | 5322ab1f640cf91bc586b962f025827efdb59b4c | 5322ab1f640cf91bc586b962f025827efdb59b4c | 0/0 | 0 | |
| test:unit | 0 | 2026-10-19T06:37Z | 5322ab1f640cf91bc586b962f025827efdb59b4c | 5322ab1f640cf91bc586b962f025827efdb59b4c | 0/0 | 0 | |
| three new specs | 0 | 2026-10-19T06:38Z | 5322ab1f640cf91bc586b962f025827efdb59b4c | 5322ab1f640cf91bc586b962f025827efdb59b4c | 0/0 | n/a | `noInlineIamPoliciesGate`, `hostedSettingsParityGate`, `infraValidateJobGate`: Test Files 3 passed (3), Tests 36 passed (36) |
| infra-validate local loop | 0 | 2026-10-19T06:38Z | 5322ab1f640cf91bc586b962f025827efdb59b4c | 5322ab1f640cf91bc586b962f025827efdb59b4c | 0/0 | n/a | Terraform 1.14.7, no credentials: `terraform fmt -check -recursive -diff infra` 0; the job's validation script, extracted from the parsed `main.yaml`, 0 with 8 "configuration is valid" lines and `validated 8 roots` (seven required plus `infra/envs/scratch/supabase`); `bash infra/scripts/check-settings-types.sh` 0, "four cases hold" |

Run directly on the finished tree at 5322ab1f640cf91bc586b962f025827efdb59b4c:

- `node scripts/assert-no-inline-iam-policies.mjs`: exit 0,
  `No-inline-IAM-policies guard — 42 .tf file(s) read under 'infra'; 0 finding(s).`
- `node scripts/assert-hosted-settings-parity.mjs`: exit 0,
  `Hosted-settings parity guard — every classified key holds between apps/supabase/supabase/config.toml, infra/modules/supabase/hosted-settings.json and the Supabase roots under infra/envs.`

The commit 5322ab1f6 is this plan's Task 1 commit and holds only this evidence file; the gates therefore ran on the
tree that holds every earlier plan of the phase that has been executed (183-01 to 183-12, 183-26 and 183-28).
