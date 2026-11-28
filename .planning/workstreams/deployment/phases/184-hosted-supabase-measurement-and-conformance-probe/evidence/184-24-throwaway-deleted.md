# 184-24: the throwaway project's deletion and its local state

- **Subject:** the throwaway project `openvaa-scratch` (`begckvkapaopoztbreqc`), its scratch root `infra/envs/scratch/supabase` and its linked work directory `tmp/supabase-linked/begckvkapaopoztbreqc`.
- **Who wrote it:** the executor, on 2026-11-11. It held no credential and contacted no hosted project.

## 1. What goes with the throwaway (Task 1)

SCRATCH_SCOPE=keep-root

Dated 2026-11-11. The plan's auto-selected recommended option, applied by the orchestrator while the operator was away.

Under `keep-root` the scratch root's local state is removed (its `terraform.tfstate`, `terraform.tfstate.backup`, any `tfplan` and its `.terraform` directory), and so is the linked work directory. The root's tracked files are kept for a future rehearsal on a new throwaway, whose ref is then written into the root's `terraform.tfvars`; their comments are corrected after the deletion so that none says the root is removed.

The precondition of the ruling held when it was taken: the throwaway's red run (`184-18-throwaway-break-red.md`, `## Red run`), its green run (`184-19-throwaway-revert-green.md`, `## Green run`), its header record (`184-13-throwaway-headers-timeout-drift.md`, `BEHIND_CLOUDFLARE=`) and the persistent project's green run (`184-23-persistent-probe-and-records.md`, `## Green run`) are all on record; Task 1's verify exited 0.

## 2. The deletion and the removals (Task 2)

Dated 2026-11-12 (UTC). The operator deleted the project `openvaa-scratch` (`begckvkapaopoztbreqc`) in the dashboard. The orchestrator then ran the three scripts after the deletion, with the access token from the operator's keychain, under the operator's authorisation of 2026-11-10. The scripts read the throwaway's ref only, sourced no credential file, and printed only named lines. The reply is stored under attempt `20261111T212446Z.08a3b6447` of key `184-24-2`.

answer_project_deleted=yes
answer_deleted_at=2026-11-12T06:10:00Z

**The deletion time is the time of the operator's report, not the dashboard's time.** The operator reported the deletion at about 06:10Z on 2026-11-12 without giving the exact time of the deletion, so it happened at or before 06:10Z. The read of the Management API ran at 06:10:11Z.

| Item | Line                       | What it shows                                                                                                                                  |
| ---- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 2    | `s2_project_http=404`      | The Management API no longer knows the throwaway's ref                                                                                         |
| 3    | `s3_local_removed=yes`     | The scratch root's `terraform.tfstate`, `terraform.tfstate.backup`, `tfplan` and `.terraform`, and `tmp/supabase-linked/begckvkapaopoztbreqc`, are gone |
| 3    | `s3_state_files_left=0`    | No `terraform.tfstate*` remains in the scratch root                                                                                            |
| 3    | `s3_staging_linked_kept=yes` | The persistent project's linked work directory is untouched                                                                                  |
| 3    | `s3_tracked_root_diff_exit=0` | The scratch root's tracked files were unchanged by the removal                                                                              |
| 4    | `s4_logs_removed=yes`      | The sitting's log directory, with the API's body, is removed                                                                                   |

Script 02 removes nothing unless script 01 recorded a status other than 200 and 000 for the throwaway's ref, so no state was removed while the project still answered.

The executor confirmed the removals on disk afterwards: `test ! -e infra/envs/scratch/supabase/terraform.tfstate` and `test ! -e tmp/supabase-linked/begckvkapaopoztbreqc` both succeed, and `tmp/supabase-linked/` holds only `cofbsatfrdysyphajsky`.

## 3. The tracked texts after the deletion (Task 3)

Under `keep-root`:

- `infra/envs/scratch/supabase/main.tf`: the header says that the root rehearses the staging root on a throwaway project, that each rehearsal creates a new throwaway by hand and writes its ref, organisation, name and region into `terraform.tfvars`, and that the project and the root's state are deleted when the rehearsal ends. The sentence saying the root is removed is gone.
- `infra/envs/scratch/supabase/terraform.tfvars`: the header says the values name the last throwaway, deleted on 2026-11-12 together with the root's state, and that the next rehearsal replaces them.
- `infra/README.md`: the scratch root's "Ever applied" cell said "Yes, then removed with the throwaway project", which read as the root being removed. It now says "Yes; its state is removed with each throwaway project".
- `infra/envs/staging/supabase/README.md`: "When the rehearsal is over" lists everything that is removed, including the `.terraform` directory, any `tfplan` and the linked work directory, and says the tracked files stay for the next rehearsal. A dated row in "Observations" records the deletion.
- `packages/dev-seed/tests/infraValidateJobGate.test.ts` is unchanged: `LOCAL_BACKEND_ROOTS` still names the kept root.

Both of Task 3's verify commands exited 0. The kept root was validated offline with `TF_DATA_DIR` in a scratch directory, which was removed afterwards, so no `.terraform` was recreated in the scratch root.
