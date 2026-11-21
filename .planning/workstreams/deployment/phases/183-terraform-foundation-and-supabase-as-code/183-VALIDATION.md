---
phase: "183"
slug: "terraform-foundation-and-supabase-as-code"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-11"
---

# Phase 183 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node guards with `--self-test` (`scripts/assert-*.mjs`); Vitest gate specs in `packages/dev-seed/tests/`; `terraform fmt -check`, `init -backend=false -lockfile=readonly` and `validate`; `infra/scripts/check-settings-types.sh`; the `infra-validate` job in `main.yaml`; `dig` for public DNS; the attempt-file helper `tools/attempt.sh` in the phase directory, with its own `--self-test` |
| **Config file** | None new. Guards are script keys in `package.json`; the specs run under the existing `packages/dev-seed` Vitest project |
| **Quick run command** | `node scripts/assert-no-inline-iam-policies.mjs --self-test && node scripts/assert-no-inline-iam-policies.mjs && node scripts/assert-hosted-settings-parity.mjs --self-test && node scripts/assert-hosted-settings-parity.mjs && bash infra/scripts/check-settings-types.sh && terraform fmt -check -recursive infra` |
| **Full suite command** | `yarn lint:check`, then `yarn format:check`, then `yarn test:unit`, each in the background with its exit status written to a file and read directly, under Node 24.21.0 |
| **Estimated runtime** | Quick: under 30 seconds. Validation of all eight roots: about 2 minutes with the plugin cache. Full suite: several minutes per gate (measured as the baseline in plan 183-01) |

Local Terraform is 1.14.7. It runs `fmt`, `init -backend=false`, `validate`, `console` and `providers lock`. Everything that reaches a backend or a cloud API (`plan`, `apply`, `import`, `state`, `show`) is the operator's, with Terraform 1.16.5. CI's `infra-validate` job runs 1.16.5.

The local E2E suite is not part of this phase's gate: the phase changes no application code, and the roadmap's cardinal-rule clause names phases 181 and 182.

---

## Sampling Rate

- **After every task commit:** the task's own `<automated>` command. For Terraform tasks: `fmt -check` and `init -backend=false -lockfile=readonly` plus `validate` of the directories the task touched. For guard tasks: the guard's `--self-test` and its gate mode.
- **After every plan wave:** nothing tree-wide while other plans of the wave are writing. The tree-wide gates run three times, each alone: the baseline in plan 183-01, the finished autonomous tree in plan 183-13, and the final tree in plan 183-27 after the last edit to a guard or its inputs.
- **Before `/gsd-verify-work`:** every row of the operator table below has a date; both guards exit 0; the validation loop over every root succeeds; plan 183-27's two chains exited 0.
- **Max feedback latency:** 30 seconds for a task's own check; the tree-wide gates are long and run in the background.
- **Red controls:** each guard is seen failing twice, once run directly (plans 183-09 and 183-26) and once through `yarn lint:check` in a scratch checkout (plan 183-13). The settings type check is seen failing on a trap form and on a decoupled JSON (plan 183-05). The `infra-validate` job is seen failing on a tree broken on purpose (plan 183-15). The budget alert is seen firing (plan 183-20). A destroy plan is seen refused on the throwaway project before the persistent one (plans 183-24 and 183-25). The attempt-file helper is seen refusing a stale approval, a push confirmation for other commits and a missing pointer (plan 183-01).

### Rules that bind every whole-repository gate and every operator checkpoint

- **Clean tree.** A whole-repository gate, and the building of a commit to be pushed, starts and ends on a tree with no uncommitted tracked change (`git status --porcelain --untracked-files=no` empty before and after). Otherwise the task records the output, changes nothing, and ends with a blocked result returned to the orchestrator (status `blocked`, the paths listed). That is not a checkpoint task and no operator answer resumes it: the orchestrator re-runs the task once the other phase's work is committed. Plans 183-01 and 183-27 are `autonomous: true` in that sense: they never need operator input, and they can still be held up by a dirty tree. The task never stashes, reverts or commits another phase's files and never narrows the gate.
- **Named commit.** `git rev-parse HEAD` is recorded in full before and after with the gate's result, and the tree as the two line counts of `git status`, `0/0` for clean. The verify of plans 183-01, 183-13 and 183-27 compares the two commit ids, requires all forty characters and requires the tree cell `0/0` on every gate row.
- **Attempt files.** Scratch state and pasted operator output live in attempt files under `tmp/183-evidence/` (ignored by Git), one fresh file per attempt, reached through a pointer file. A verify or a precondition reads only the file the pointer names. Earlier attempts are kept, never read, never deleted. An evidence file is written whole from the current attempt files and names each on a line `Attempt: <key> <attempt id>`; a verify that reads an evidence file (plans 01, 09, 13, 14, 16, 17, 19, 20, 25, 26) first compares that line with the helper's `id`, so a file left by an earlier attempt fails. The scans of an evidence file for an address or a secret name stay on the tracked file, because that is the file a commit would publish.
- **Bound replies.** A checkpoint shows the attempt id as a nonce, and the reply's first line is `answer_attempt=<id>`; the helper stores nothing without it. The reply is recorded with the nonce, the full commit id, and the object acted on: the two commit ids for the evidence push, the IAM user for each one-way decision, the zone id for the delegation, the project ref and the plan file's SHA-256 for an import and an apply. `bound` compares whole whitespace-delimited fields, so a prefix of a commit id or a checksum does not match, and takes the last line of that name in the current attempt file; a decision is a second record line after the reply line. The following task requires the nonce and the bound values to match the current state, or it returns to the checkpoint.
- **Named lines only.** No checkpoint asks for raw output. Each operator command sends its output to a log directory outside the repository and prints lines of the form `s<step>_<field>=<value>`; answers go on `answer_<name>=` lines. An apply log, a plan log, `terraform show`, `terraform output` without a name, the caller's raw `Arn` and the raw answer of an API are never pasted: they can hold an access key id, attribute values, a session name or an address. This is the control that counts.
- **Status on its own line.** A status is tested on the line named for its step (`s5_apply_exit=0`, `s8_second_plan_exit=0`, `s1_dkim=SUCCESS`), never by finding the word somewhere in the reply.
- **Screen second.** A reply is written to the attempt file only after the helper's screen has passed: line form, secret names in any spelling, token shapes, and addresses and session names, with one self-test case per form. The screen lowers the chance that a pasted secret is stored; it does not guarantee it.
- **Every named line tested.** Each status or decision line that a criterion names is tested on its own line with its expected value by a verify. Where a line belongs to a branch (the lock seen or not, the fallback backend route, a second apply of the mail root, a rejected simulator form, the two ways of raising the budget), the verify reads which branch was taken from a named line and tests that branch's lines.
- **Every sitting stands alone.** Each checkpoint begins with the lines that set what its commands need (directory, `LC_ALL=C`, pager, log directory, exports), to be run again in any new terminal; the second terminal of the lock observation gets its own block. The first checkpoint (plan 183-14) prints a version line for `terraform`, `jq`, `aws`, `dig`, `curl`, `shasum` and `git`, and its verify requires each.
- **Locale.** Every `<automated>` that calls `awk`, `printf` or `sort` starts with `export LC_ALL=C`, every sitting exports it, and the one operator `awk` that formats a number carries it itself. No `date` command is used without `-u` and an explicit format.
- **Logs and plan files are secrets.** Each checkpoint says that `$L` and a saved `tfplan` hold secrets in clear text and are never shared, and ends with a step that removes `$L` and prints `s<n>_logs_removed=yes`, which the following verify requires. A plan file is removed by the step that applied it, also when the apply failed, or on the executor's instruction when a review says stop. The Supabase token goes to `curl` on standard input and is written to no file.
- **A clause is `seen` only on the source's own word.** Plans 183-13, 183-15, 183-23, 183-25 and 183-26 each write a fixed line for their observation (`Chain observation: made`, `Run observation: seen`, `Clause C5.1 import: seen`, `Clause C5.1 state: seen`, `Clause C5.2: seen`, `Clause C5.3: seen`, `Red controls: 12 of 12 as expected`), and plan 183-27's verify reads those lines from the evidence files before it accepts the six verdicts.
- **Evidence checked for addresses.** The evidence files of plans 183-14, 183-16, 183-17, 183-19 and 183-20 are checked by a verify for an e-mail address other than the sender and the DMARC receiver and for an assumed-role session name.
- **Execution by dependency after plan 183-21.** Plans 183-22, 183-24, 183-23 and 183-25 depend only on the Supabase chain, and plan 183-23 also on plan 183-16 for the state bucket. They may be executed as soon as the plans in their own `depends_on` are done, without waiting for plans 183-18, 183-19 and 183-20 of wave 10, which can wait for hours or days on DNS, SES and a budget mail. The wave numbers say what may run together; they do not make the Supabase chain wait for the rest of wave 10.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 183-01-01 | 01 | 1 | builds SUPA-08 | T-183-01, T-183-02, T-183-03 | State, plan and local variable files ignored; tracked variable files not ignored; first commit of the phase | smoke | `git check-ignore -q` on seven paths (exit 0 each), and on four tracked paths (exit 1) | ❌ W0 | ⬜ pending |
| 183-01-02 | 01 | 1 | all four (baseline) | — | Stale, mismatched and prefix-only records refused; a paste in each secret, token, address and session form refused; gates on a clean tree at one full commit id | helper self-test, gate baseline | `bash …/tools/attempt.sh --self-test` (binding, must-refuse and must-pass cases, among them capital hexadecimal, a two-part `eyJ` string and a URL with user information); `awk` over the current attempt file of `01-2` (three rows, forty-character ids, tree cell `0/0`) | ❌ W0 | ⬜ pending |
| 183-01-03 | 01 | 1 | builds INFRA-10 | T-183-04, T-183-SC | Provider refuses another account; lock pins 6.68.0 | smoke | `terraform -chdir=infra/envs/staging/aws init -backend=false -lockfile=readonly && … validate` | ❌ W0 | ⬜ pending |
| 183-02-01 | 02 | 2 | builds SUPA-08 | T-183-05, T-183-06 | Bucket encrypted, versioned, closed, TLS-only, `prevent_destroy` | smoke | module `init -backend=false && validate && fmt -check` | ❌ W0 | ⬜ pending |
| 183-02-02 | 02 | 2 | builds INFRA-01 | T-183-07 | Image tags immutable; rollback limit written down | smoke | module validate; `prettier --check` and `grep` on the module's README | ❌ W0 | ⬜ pending |
| 183-02-03 | 02 | 2 | INFRA-15 | T-183-08 | Alert address sensitive, no default | smoke | module validate; `awk` check on the `alert_email` block | ❌ W0 | ⬜ pending |
| 183-03-01 | 03 | 2 | INFRA-17 | T-183-09, T-183-10, T-183-13 | Trust conditions are `StringEquals` only | smoke | module validate; `awk` count of condition tests | ❌ W0 | ⬜ pending |
| 183-03-02 | 03 | 2 | INFRA-17 | T-183-11, T-183-12, T-183-14 | Managed policies only; explicit deny; one-key allow-list; the list condition traced to the backend's source | smoke | module validate; `awk` counts of policies and attachments; `awk` for `backend_state` and `env:/` in a comment line | ❌ W0 | ⬜ pending |
| 183-04-01 | 04 | 2 | INFRA-18 | T-183-18 | Zone protected by `prevent_destroy` | smoke | module `init -backend=false && validate && fmt -check` | ❌ W0 | ⬜ pending |
| 183-04-02 | 04 | 2 | INFRA-17 | T-183-15, T-183-16, T-183-17 | Send policy scoped; password output sensitive | smoke | module validate; `awk` check on `smtp_password` | ❌ W0 | ⬜ pending |
| 183-04-03 | 04 | 2 | INFRA-18 | T-183-17 | State key under `hand/`; no secret in tracked variables | smoke | root `init -backend=false -lockfile=readonly && validate`; `cmp` of lock files | ❌ W0 | ⬜ pending |
| 183-05-01 | 05 | 2 | SUPA-11 | T-183-24 | Encoded settings keep their types and hold every key of the JSON; the four reads of the JSON in the forms the guard matches | script, seen failing twice | `bash infra/scripts/check-settings-types.sh`; `grep`/`awk` for the four pinned reads in `settings.tf` | ❌ W0 | ⬜ pending |
| 183-05-02 | 05 | 2 | SUPA-11 | T-183-19, T-183-20, T-183-25 | `prevent_destroy` and password ignore on the project block; `jsonencode(local.api)` and `jsonencode(local.auth)` as the guard reads them | smoke | module validate; `awk` checks on the project block and the settings resource | ❌ W0 | ⬜ pending |
| 183-05-03 | 05 | 2 | SUPA-11 | T-183-SC | Supabase provider locked at 1.11.0 | smoke | scratch root `init -backend=false -lockfile=readonly && validate` | ❌ W0 | ⬜ pending |
| 183-06-01 | 06 | 3 | INFRA-15, INFRA-17 | T-183-27, T-183-54 | Backend alone in `backend.tf`; four module calls, no resource | smoke | `terraform fmt -check infra/bootstrap` and `awk` structure checks | ❌ W0 | ⬜ pending |
| 183-06-02 | 06 | 3 | INFRA-15, INFRA-17 | T-183-27 | No address in tracked variables; bucket names agree; pipeline key equals the pipeline root's backend key | smoke | root validate; `cmp`; `awk` comparisons | ❌ W0 | ⬜ pending |
| 183-07-01 | 07 | 3 | SUPA-11 | T-183-26 | Own state key; no secret assigned | smoke | root validate; `cmp` of lock files | ❌ W0 | ⬜ pending |
| 183-07-02 | 07 | 3 | SUPA-11 | T-183-26 | Example origin is `https`; no secret assigned | smoke | root validate; `cmp`; `awk` | ❌ W0 | ⬜ pending |
| 183-08-01 | 08 | 3 | INFRA-18 | T-183-55 | Stand-in account id refused by the provider | smoke | root validate; `diff` against the staging twin | ❌ W0 | ⬜ pending |
| 183-08-02 | 08 | 3 | INFRA-18 | T-183-55 | Same | smoke | root validate; `cmp` | ❌ W0 | ⬜ pending |
| 183-09-01 | 09 | 3 | INFRA-17 | T-183-28, T-183-29 | Banned IAM forms found; nothing examined is a failure | guard self-test | `node scripts/assert-no-inline-iam-policies.mjs --self-test`; `--root …/violations` exits 1 | ❌ W0 | ⬜ pending |
| 183-09-02 | 09 | 3 | INFRA-17 | T-183-29 | Link is a member of `lint:check` | unit | `yarn workspace @openvaa/dev-seed test:unit tests/noInlineIamPoliciesGate.test.ts` | ❌ W0 | ⬜ pending |
| 183-09-03 | 09 | 3 | INFRA-17 | T-183-29 | Guard seen red and green, statuses read directly; the plan's own commits, named by the file each added, touch nothing under `infra/` | red control | five recorded runs in the current attempt of `09-3`; `git show --name-only` of the two commits that added the guard and its spec | ❌ W0 | ⬜ pending |
| 183-10-01 | 10 | 4 | SUPA-11 | T-183-21, T-183-22, T-183-30 | Disagreement, unclassified key, stale row, no origin and an unexplained hook switch each fail | guard self-test | `node scripts/assert-hosted-settings-parity.mjs --self-test`, gate mode, and `--envs-dir <empty>` exits 1, with the setup's own failure reported as exit 9 | ❌ W0 | ⬜ pending |
| 183-10-02 | 10 | 4 | SUPA-11 | T-183-21 | Link is a member of `lint:check` | unit | `yarn workspace @openvaa/dev-seed test:unit tests/hostedSettingsParityGate.test.ts` | ❌ W0 | ⬜ pending |
| 183-11-01 | 11 | 4 | SUPA-11 (criterion 5) | T-183-32, T-183-33, T-183-34 | Job holds no credential; actions pinned by SHA | smoke | the job's commands run locally; Node check of the job's `uses:` lines with comments dropped | ❌ W0 | ⬜ pending |
| 183-11-02 | 11 | 4 | SUPA-11 (criterion 5) | T-183-32, T-183-33, T-183-34, T-183-27 | Same, kept by a spec; state keys unique; pipeline key equal in both places | unit | `yarn workspace @openvaa/dev-seed test:unit tests/infraValidateJobGate.test.ts tests/nodeEngineGate.test.ts tests/ciDockerImageBuildGate.test.ts` | ❌ W0 | ⬜ pending |
| 183-12-01 | 12 | 4 | INFRA-17 | T-183-35 | Read-only calls; no credential, address, session name or error text printed | script self-test | `bash -n … && bash infra/scripts/account-inventory.sh --self-test` (canned input with addresses must yield none) | ❌ W0 | ⬜ pending |
| 183-12-02 | 12 | 4 | INFRA-15, INFRA-17 | T-183-36 | No status read through a pipe; remote state checked before local files go; runbook equals the checkpoint plans, named `echo` lines and `dig` included | docs check | `prettier --check`; `awk`; the command-sync loop over plans 14, 16 and 20 | ❌ W0 | ⬜ pending |
| 183-28-01 | 28 | 4 | INFRA-18 | T-183-61 | SMTP outputs and the apply log never read; runbook equals the checkpoint plans | docs check | `prettier --check`; `grep`/`awk`; the command-sync loop over plans 17, 18 and 19 | ❌ W0 | ⬜ pending |
| 183-28-02 | 28 | 4 | SUPA-11 | T-183-61 | Plan and apply kept apart; destroy and password rules stated; named lines only | docs check | `prettier --check`; `grep`/`awk`; the command-sync loop over plans 21, 22, 24, 23 and 25 | ❌ W0 | ⬜ pending |
| 183-26-01 | 26 | 5 | SUPA-11 | T-183-23, T-183-31, T-183-62 | Decoupled JSON, unprotected project block, misplaced key and a second writer each fail | guard self-test | `--self-test`, gate mode, and `--module-dir <decoupled copy>` exits 1, with a failed copy or an edit without effect reported as exit 9 | ✅ after wave 4 | ⬜ pending |
| 183-26-02 | 26 | 5 | SUPA-11 | T-183-21, T-183-62 | Guard seen red once per kind of finding, each exit status equal to its expected one | red control | twelve rows (1 to 8, 9a, 9b, 10, 11) in the current attempt file of `26-2`, expected status equal to exit status; the line `Red controls: 12 of 12 as expected` in the attempt and the evidence file | ✅ after wave 4 | ⬜ pending |
| 183-13-01 | 13 | 6 | INFRA-17, SUPA-11 | T-183-56 | `yarn lint:check` red for each guard in a scratch checkout; nothing planted in the shared checkout | red control | scratch checkout gone and unregistered; `Chain observation:` line in the current attempt of `13-1` | ✅ after wave 5 | ⬜ pending |
| 183-13-02 | 13 | 6 | INFRA-17, SUPA-11 | T-183-56 | A foreign red link stops the plan instead of passing | operator decision, conditional | `attempt.sh has 13-1 '^Chain observation: made'` | ✅ after wave 5 | ⬜ pending |
| 183-13-03 | 13 | 6 | INFRA-17, SUPA-11 | T-183-63 | Gates on a clean tree at one full commit id | full gates | `awk` over the current attempt of `13-3` (ids, tree cell `0/0`); evidence names the attempt; the three new specs | ✅ after wave 5 | ⬜ pending |
| 183-14-01 | 14 | 7 | INFRA-17 | T-183-39 | Applying identity named without its session; assert over every IAM user; no raw `Arn` requested | operator | executor: `bash infra/scripts/account-inventory.sh --self-test`; named lines checked in task 3 | ✅ | ⬜ pending |
| 183-14-02 | 14 | 7 | INFRA-17 | T-183-40 | A destructive change to a legacy user is the operator's decision, recorded per user | operator decision | `s5b_assert_users_exit=` after the change; `attempt.sh bound 14-2 OPERATOR_DECISION --where user=<name>` | ✅ | ⬜ pending |
| 183-14-03 | 14 | 7 | INFRA-17 | T-183-41 | Existing resources imported or reported, never assumed absent; reply bound to its attempt; evidence holds no address or session name | smoke | `attempt.sh bound 14-1 …`; named lines by `has`, among them a version for each of seven tools and `s9_logs_removed=yes`; an IAM user needs an MFA device; validate of `bootstrap` and `staging/dns-mail`; inline guard; address `awk` on the evidence file | ✅ | ⬜ pending |
| 183-15-01 | 15 | 7 | SUPA-11 (criterion 5) | T-183-37 | Whole tree scanned; full file list in the manifest; clean tree at one commit; one push command with a lease per branch | smoke | `git ls-tree` list checked with `awk`; two-file diff; manifest not shorter than the file list; `GREEN`/`RED`/`REMOTE_` lines and the leased command by `has` | ✅ | ⬜ pending |
| 183-15-02 | 15 | 7 | SUPA-11 (criterion 5) | T-183-37 | The operator pushes after reading the full list; confirmation bound to the two full commit ids; a retry needs a new one | operator | `git -c credential.helper= ls-remote https://…` shows both branches at the recorded commits | ✅ | ⬜ pending |
| 183-15-03 | 15 | 7 | SUPA-11 (criterion 5) | T-183-37 | Results read without a credential and bound to the pushed commit by `head_sha`; rate limit or timeout recorded as not seen | CI run | `curl` of runs by `head_sha` and of jobs; `attempt.sh bound 15-2 OPERATOR_PUSH_CONFIRMED=yes green=… red=…`; `has 15-2` for the push status and log removal; `Run observation: seen` in the attempt and the evidence file | ✅ | ⬜ pending |
| 183-16-01 | 16 | 8 | INFRA-15, INFRA-17 | T-183-38 | Local state and plan files ignored; address masked; named lines only | operator | executor: `git check-ignore -q` on four paths; named lines checked in task 3 | ✅ | ⬜ pending |
| 183-16-02 | 16 | 8 | INFRA-17 | T-183-42 | Remote state read before local files are removed; simulator run for every backend call, the plan role's read of the lock object included | operator | executor: no state file in `git status` of the root; named lines checked in task 3 | ✅ | ⬜ pending |
| 183-16-03 | 16 | 8 | INFRA-15, INFRA-17 | T-183-38 | Each status on the line of its step; no address or session name recorded; replies bound to their attempts | record check | `attempt.sh bound 16-1 …` and `16-2 …`; fifteen named lines of `16-1`; twenty-six status lines of `16-2` and the managed-resource count against the apply's; thirteen simulator decisions, four list-prefix decisions unless the form was rejected, four lock lines when `answer_lock_seen=yes`; address `awk` on the evidence file | ✅ | ⬜ pending |
| 183-17-01 | 17 | 9 | INFRA-17, INFRA-18 | T-183-58 | SMTP outputs never printed; the apply log, which holds the SMTP user's access key id, never pasted | operator | executor: root validates; named lines checked in task 2 | ✅ | ⬜ pending |
| 183-17-02 | 17 | 9 | INFRA-17, INFRA-18 | T-183-57, T-183-58 | DKIM zone reconciled; evidence holds no SMTP secret, access key id, address or session name | record check | `attempt.sh bound 17-1 …` with the zone id; nineteen named lines by `has`; DKIM values from Terraform equal those from SES; apply count equals plan count; `Second apply needed:` in `17-2`; four distinct name servers in `DELEGATION.md`; three `awk` scans of the evidence file | ✅ | ⬜ pending |
| 183-18-01 | 18 | 10 | INFRA-18 | T-183-44, T-183-45 | Referral names exactly the zone's four name servers | operator, then smoke | `dig +norecurse NS staging.openvaa.org @<parent ns>` yields four `awsdns` names | ✅ | ⬜ pending |
| 183-18-02 | 18 | 10 | INFRA-18 | T-183-45 | Same, from a public resolver; the entry bound to the zone that exists now | smoke | `attempt.sh bound 18-1 … zone=<field of 17-1>`; four `answer_ns_` values in `DELEGATION.md`; the `s0_` lines when `17-2` says a second apply was needed; evidence names `18-2`; `dig +short NS` and `SOA` at `1.1.1.1` | ✅ | ⬜ pending |
| 183-19-01 | 19 | 10 | INFRA-18 (criterion 4) | T-183-47, T-183-60 | No address pasted; raw `get-account` answer not pasted; SMTP outputs not read | operator, then smoke | `dig` for the DMARC, MX and SPF records | ✅ | ⬜ pending |
| 183-19-02 | 19 | 10 | INFRA-18 (criterion 4) | T-183-47 | `verified`, DKIM and MAIL FROM each on its own line; evidence holds no personal address | record check | `attempt.sh bound 19-1 …`; fourteen named lines by `has`, among them `s1_verified=true`, `s1_dkim=SUCCESS`, `s1_mailfrom=SUCCESS`, the two account statuses and `s4_logs_removed=yes`; address `awk` on the evidence file; `prettier --check` | ✅ | ⬜ pending |
| 183-20-01 | 20 | 10 | INFRA-15 | T-183-48 | Test amount has a floor; a case with no possible alert is reported, not passed | operator | executor: plan 183-14's `Credits:` and `183-R2:` lines present; tracked limit is 100 | ✅ | ⬜ pending |
| 183-20-02 | 20 | 10 | INFRA-15 | T-183-48 | Plan finishes only on the outcome `fired`; the budget in the account recorded beside the tracked value in every outcome | record check | `attempt.sh bound 20-1 OPERATOR_REPLY … outcome=fired`; eighteen named lines by `has`; one plan resource, the budget; test amount against the spend; the lock read when the lock way was taken; the mismatch line and the address `awk` on the evidence file | ✅ | ⬜ pending |
| 183-21-01 | 21 | 10 | SUPA-11 (criterion 5) | T-183-52 | Named lines only; the filter drops every setting whose name ends in a secret word, by name and by value | operator | executor: scratch root validates; state file ignored | ✅ | ⬜ pending |
| 183-21-02 | 21 | 10 | SUPA-11 | T-183-49 | Reply screened before it is recorded; every managed key confirmed against the hosted API's names; reply bound to the project ref | guard | `attempt.sh bound 21-1 … ref=…`; named lines by `has`, with the project's name, organisation and region and `s9_logs_removed=yes`; region equals the operator's answer; evidence names `21-2`; parity guard, self-test, type check, guard spec; scratch root validate | ✅ | ⬜ pending |
| 183-22-01 | 22 | 11 | SUPA-11 (criterion 5) | T-183-59, T-183-64 | Plan saved, nothing applied; only headings and change lines pasted | operator | executor: `awk` check on the project block; plan file ignored | ✅ | ⬜ pending |
| 183-22-02 | 22 | 11 | SUPA-11 | T-183-59 | Stop rules read before any apply; review bound to the plan's full checksum | record check | `attempt.sh field 22-1 OPERATOR_REPLY sha256`; `bound 22-2 PLAN_REVIEWED root=scratch sha256=…`; plan log removed; evidence names `22-2` | ✅ | ⬜ pending |
| 183-24-01 | 24 | 12 | SUPA-11 (criterion 5) | T-183-65, T-183-66 | Apply requested only when the last review line is `ok`; token in a header file inside the log directory | operator | `attempt.sh bound 22-2 PLAN_REVIEWED=ok root=scratch sha256=<field>` | ✅ | ⬜ pending |
| 183-24-02 | 24 | 12 | SUPA-11 | T-183-65 | Applied plan is the reviewed one; each status on its own line; served values equal intended values | guard | `attempt.sh bound 24-1 OPERATOR_APPLIED=yes sha256=<reviewed>`; twelve named lines by `has`; every `api` and `auth` value of `hosted-settings.json` equal to its served line; evidence names `24-2`; parity guard, self-test, type check, guard spec | ✅ | ⬜ pending |
| 183-23-01 | 23 | 13 | SUPA-11 (criterion 5) | T-183-51 | Region confirmed before the project exists; raised only when the rehearsal applied its reviewed plan and its destroy plan was refused | operator decision | executor: persistent root validates; `bound 22-2 PLAN_REVIEWED=ok` and `bound 24-1 OPERATOR_APPLIED=yes` for one checksum; `has 24-1` for the refusal; evidence of 24 names `24-2` | ✅ | ⬜ pending |
| 183-23-02 | 23 | 13 | SUPA-11 (criterion 5) | T-183-50 | Project imported, plan saved, nothing applied | operator | executor: `awk` checks on the project block and the backend key | ✅ | ⬜ pending |
| 183-23-03 | 23 | 13 | SUPA-11 | T-183-50, T-183-67 | Right project imported; stop rules read before any apply; review bound to checksum and ref | record check | `attempt.sh bound 23-1 … ref`, `23-2 … ref sha256`, `23-3 PLAN_REVIEWED … ref sha256`; named lines by `has`; region equals the decision's; the clause line agrees with the review; evidence names `23-3`; root validate; variable file check | ✅ | ⬜ pending |
| 183-25-01 | 25 | 14 | SUPA-11 (criterion 5) | T-183-68, T-183-69 | Apply requested only when the last review line is `ok`; destroy seen with a plan only | operator | `attempt.sh bound 23-3 PLAN_REVIEWED=ok root=staging sha256=<field>` | ✅ | ⬜ pending |
| 183-25-02 | 25 | 14 | SUPA-11 | T-183-68 | Applied plan is the reviewed one for the reviewed project; each status on its own line | record check | `attempt.sh bound 25-1 OPERATOR_APPLIED=yes sha256=<reviewed> ref=<reviewed>`; seventeen named lines by `has`; every `api` and `auth` value equal to its served line; the three clause lines in the attempt and the evidence file; parity guard | ✅ | ⬜ pending |
| 183-27-01 | 27 | 15 | SUPA-11 | T-183-70 | Chains run after the last guard edit, on a clean tree at one full commit id | full gates | `awk` over the current attempt of `27-1`: three rows, equal forty-character ids, tree cell `0/0`, `lint:check` and `format:check` status 0 | ✅ | ⬜ pending |
| 183-27-02 | 27 | 15 | SUPA-11 | T-183-70 | Guards, roots and specs green on the final tree; six clause lines, each `seen`, each from an evidence file that names its plan's current attempt | guard, smoke | both guards and self-tests, type check, three specs; validation loop over every root; `Attempt:` comparison for five evidence files; each source file's own observation line; `awk` over the six `C5.<n>` lines and `SUPA-11: observed` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Nothing in the tree checks Terraform or these two rules today, so every check below is created by an autonomous plan before the first plan that relies on it. No test framework is installed: Vitest and Node are already present.

- [ ] The `.gitignore` entries, as the phase's first commit, before any file exists under `infra/` and before any `terraform init` — plan 183-01, task 1
- [ ] `yarn install` under Node 24.21.0, the attempt-file helper `tools/attempt.sh` with its self-test, and the baseline of the three gates — plan 183-01, task 2
- [ ] `infra/envs/staging/aws/.terraform.lock.hcl` (AWS provider 6.68.0, three platforms) and the plugin cache — plan 183-01, task 3
- [ ] `infra/modules/supabase/hosted-settings.json`, the hosted side the parity guard reads — plan 183-05, task 1
- [ ] `infra/scripts/check-settings-types.sh`, which also proves the module encodes every key of the JSON — plan 183-05, task 1
- [ ] `infra/envs/scratch/supabase/.terraform.lock.hcl` (Supabase provider 1.11.0, three platforms) — plan 183-05, task 3
- [ ] `scripts/assert-no-inline-iam-policies.mjs` with `scripts/fixtures/no-inline-iam-policies/` — plan 183-09, task 1 (INFRA-17)
- [ ] `packages/dev-seed/tests/noInlineIamPoliciesGate.test.ts` — plan 183-09, task 2
- [ ] `scripts/assert-hosted-settings-parity.mjs`, comparing core with embedded cases, and `scripts/fixtures/hosted-settings-parity/` — plan 183-10 (SUPA-11)
- [ ] `packages/dev-seed/tests/hostedSettingsParityGate.test.ts` — plan 183-10, task 2
- [ ] The guard's structural assertions — plan 183-26, task 1
- [ ] The `infra-validate` job and `packages/dev-seed/tests/infraValidateJobGate.test.ts` — plan 183-11
- [ ] `infra/scripts/account-inventory.sh` with an assert mode and a self-test over canned output — plan 183-12, task 1
- [ ] Terraform 1.16.5 on the operator's workstation — plan 183-14, task 1 (operator)

---

## Manual-Only Verifications

Each of these can be made only by the operator, with credentials the agent never holds, or from the operator's mailbox or a vendor dashboard. Each is a checkpoint that returns named lines only, never raw output, which the executor stores through the helper's screen in the checkpoint's attempt file, checks line by line and records with its date. The research's Validation Architecture rows are given in brackets.

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| The account holds no IAM user with an inline policy, the applying identity included [C2c] | INFRA-17 | Needs AWS credentials | Plan 183-14 task 1 (`s5_assert_users_exit`) and plan 183-17 task 1 (`s9_assert_users_exit`): `infra/scripts/account-inventory.sh --assert-no-inline-user-policies`, output to a log, status on a named line |
| Bootstrap applied in `471112560111`, `eu-north-1` [C1a] | builds INFRA-10 | Apply is the operator's | Plan 183-16 task 1: `s9_apply_line`, `s9_apply_exit` and `s3_account` |
| State bucket encrypted, versioned, closed, TLS-only [C1b] | builds SUPA-08 | Needs AWS credentials | Plan 183-16 task 2 step 6: five `aws s3api` reads |
| State locked during an apply [C1c] | builds INFRA-10 | Needs two credentialed terminals | Plan 183-16 task 2 step 9; fallback in plan 183-20 task 1 step 4 |
| OIDC provider, two roles, registry with immutable tags [C1d] | builds PIPE-01, INFRA-01 | Needs AWS credentials | Plan 183-16 task 2 step 7 |
| Second plan of each applied root shows no change [C1e, C5c] | criteria 1 and 5 | A plan reaches the backend and the cloud | `terraform plan -detailed-exitcode …` with its status on a line named for the step (`s5_second_plan_exit`, `s8_second_plan_exit`, `s6_second_plan_exit`, `s3_second_plan_exit`) in plans 183-16, 183-17, 183-20, 183-24, 183-25; red control in plan 183-24 step 6 |
| Both roles have managed policies only; the plan role's deny holds; each call the S3 backend makes is allowed or refused as expected [C2a, C2d] | INFRA-17 | Needs AWS credentials | Plan 183-16 task 2 steps 7 and 8: `list-role-policies`, `simulate-principal-policy` for get, put, lock and the two list prefixes, for both roles |
| The budget notifies the operator [C3] | INFRA-15 | Only the operator reads their mailbox; AWS documents the mail can take a day | Plan 183-20 task 1: the outcome word, and for `fired` the mail's date, subject and kind |
| The four NS records are entered at Cloudflare and nothing existed at or under the name [C4b] | INFRA-18 | Cloudflare dashboard | Plan 183-18 task 1; the executor then verifies with `dig` |
| SES identity verified, DKIM and MAIL FROM successful [C4c] | INFRA-18 (criterion 4) | Needs AWS credentials; SES looks for records for up to 72 hours | Plan 183-19 task 1 step 1: `aws sesv2 get-email-identity …`, three fields on three named lines |
| The first plan after an import changes nothing on the project resource [C5a] | SUPA-11 (criterion 5) | A plan reaches the provider | Plan 183-22 task 1 (throwaway) and plan 183-23 task 2 (persistent): the plan's headings and change lines, read by the executor before any apply |
| Project imported into its own root and state [C5a] | SUPA-11 (criterion 5) | Needs the Supabase token and AWS credentials | Plan 183-23 task 2 steps 4 and 5; plan 183-25 task 1 step 6 |
| A destroy of the Supabase root is refused [C5b] | SUPA-11 (criterion 5) | A plan reaches the provider | `terraform plan -destroy …` with `s5_destroy_plan_exit` and `s5_refusal_lines`, first in plan 183-24 step 5, then in plan 183-25 step 5; `terraform destroy` is never run |
| Served settings equal the HCL [C5c] | SUPA-11 (criterion 5) | Needs the Supabase token | Plans 183-24 step 4 and 183-25 step 4: two Management API reads, printed as named lines for the managed keys, with every setting whose name ends in a secret word dropped |
| The `infra-validate` job seen passing and failing in a run [C5f] | SUPA-11 (criterion 5) | The push that triggers a run is the operator's | Plan 183-15 task 2; the executor reads the job from the public API without a credential |

Left to later phases and not written as fact here: a role assumed through OIDC and a wrong subject refused (187); a second push of one image tag refused (185); an SMTP send accepted under the scoped policy, and a mail with DKIM, SPF and DMARC passing (184); the forecast budget alert.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s for each task's own check (the tree-wide gates run in the background in plans 183-01, 183-13 and 183-27)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** {pending / approved YYYY-MM-DD}
