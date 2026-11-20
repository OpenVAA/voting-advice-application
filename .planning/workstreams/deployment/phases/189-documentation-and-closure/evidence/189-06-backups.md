# 189-06 — sitting 2: the persistent project's backups, read (H-01 (2), E-02)

Measured 2026-11-20 on `feat/deployment-terraform-supabase`, HEAD `cc6f1b193` before this plan.

## Task 1 — Step 24 written

`infra/envs/staging/supabase/README.md` gains "Step 24: The backups, read", after Step 23 and
before "Fault steps on the throwaway project", and one line in the flow overview. The step is one
`GET /v1/projects/<ref>/database/backups` (scope `database:read`, per Supabase's API reference read
on 2026-11-20), the token given to `curl -sS -K -` on standard input by a shell builtin, the body
written to `$L/s24-backups.json` and the status printed as `s24_backups_http=`. A `jq -r` prints
`s24_region=`, `s24_pitr_enabled=`, `s24_walg_enabled=`, `s24_backups=`, `s24_completed=`,
`s24_earliest_unix=` and `s24_latest_unix=`, one per line; an absent field prints `null`. The last
item removes `$L` and prints `s24_logs_removed=yes`. The step names no restore endpoint and no
`POST`.

The `jq` filter was run against two local sample bodies only (one shaped as the cited schema, one
error-shaped object): it printed the seven lines with values for the first and `null` for each of
the second, and exited 0 both times. Nothing in this task ran against the hosted project.

The sitting block is the runbook's sitting lines with `R=staging`, the access-token prompt only, and
Step 24's three items, in one subshell. It is kept in `tmp/189-06-2.sitting-block.sh` (ignored by
Git) and goes into the attempt file of `189-06-2` at Task 2, not here.

STEP24_WRITTEN=yes
SITTING_COMMAND_READY=yes
