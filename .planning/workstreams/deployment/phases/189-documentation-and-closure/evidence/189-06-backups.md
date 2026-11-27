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

## Task 3 — the read, recorded

The operator approved the sitting and ran the block of attempt `20261120T135428Z.406e0395d` of
`189-06-2` (`R=staging`, the persistent project) in their own terminal, and pasted its output in
the main session; the orchestrator stored it at top level, where it passed the screen
(`OPERATOR_REPLY=received attempt=20261120T135428Z.406e0395d plan=189-06 task=2`,
`answer_sitting=approve`). The reply gave no explicit `answer_sitting=` line: running the sitting
and returning its lines was read as approval, as the attempt file notes. The executor made no call
to Supabase. The printed lines, as the operator pasted them:

```text
s24_read_at=2026-11-20T13:55Z
s24_backups_http=200
s24_region=eu-north-1
s24_pitr_enabled=false
s24_walg_enabled=true
s24_backups=8
s24_completed=8
s24_earliest_unix=null
s24_latest_unix=null
s24_jq_exit=0
s24_logs_removed=yes
```

Recorded:

E2_SITTING=approved
E2_READ_AT=2026-11-20T13:55Z
E2_BACKUPS_HTTP=200
E2_REGION=eu-north-1
E2_PITR_ENABLED=false
E2_WALG_ENABLED=true
E2_BACKUPS=8
E2_COMPLETED=8
E2_EARLIEST_UTC=null
E2_LATEST_UTC=null

The two times are `null` as printed, and no date is put in their place. `jq` prints `null` both
when `physical_backup_data` or one of its two fields is absent and when it is a JSON `null`, so the
read does not tell those apart; either way the answer carried no earliest or latest physical backup
time. PITR is off on this project (`pitr_enabled=false`), which is consistent with an empty
physical-backup range; the API reference read on 2026-11-20 does not say when the two fields are
filled, so their absence is recorded as read, beside PITR off, and no cause is claimed for it. The span of the daily backups is not in this read: Step 24 prints the count and the
`COMPLETED` count, not each backup's `inserted_at`. Eight backups, all eight `COMPLETED`, is one
more than the "about 7" the research expected for Pro without the PITR add-on (its assumption A4,
from Supabase's "last 7 days of daily backups"); the read does not show which days they cover.

Nothing on the project changed: the block made one `GET`, called no restore and no `POST`, and
its temporary directory was removed (`s24_logs_removed=yes`). The access token is not in this file
or in the attempt file.
