# 184-24: the throwaway project's deletion and its local state

- **Subject:** the throwaway project `openvaa-scratch` (`begckvkapaopoztbreqc`), its scratch root `infra/envs/scratch/supabase` and its linked work directory `tmp/supabase-linked/begckvkapaopoztbreqc`.
- **Who wrote it:** the executor, on 2026-11-11. It held no credential and contacted no hosted project.

## 1. What goes with the throwaway (Task 1)

SCRATCH_SCOPE=keep-root

Dated 2026-11-11. The plan's auto-selected recommended option, applied by the orchestrator while the operator was away.

Under `keep-root` the scratch root's local state is removed (its `terraform.tfstate`, `terraform.tfstate.backup`, any `tfplan` and its `.terraform` directory), and so is the linked work directory. The root's tracked files are kept for a future rehearsal on a new throwaway, whose ref is then written into the root's `terraform.tfvars`; their comments are corrected after the deletion so that none says the root is removed.

The precondition of the ruling held when it was taken: the throwaway's red run (`184-18-throwaway-break-red.md`, `## Red run`), its green run (`184-19-throwaway-revert-green.md`, `## Green run`), its header record (`184-13-throwaway-headers-timeout-drift.md`, `BEHIND_CLOUDFLARE=`) and the persistent project's green run (`184-23-persistent-probe-and-records.md`, `## Green run`) are all on record; Task 1's verify exited 0.

## 2. The deletion and the removals (Task 2)

Pending: the operator deletes the project in the dashboard, and the orchestrator runs the read of the Management API and the removals afterwards.
