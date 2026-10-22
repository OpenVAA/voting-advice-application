# 183-22: The first plan after the throwaway import, read against the stop rules

**Review: ok.** All five stop rules hold. The first plan after the import plans one update in place of
`module.supabase.supabase_settings.this` and no change to the project resource. No line names the
database password. The go-ahead is good for the plan file with SHA-256
`35d762b21b217cc2cd232fcdc347e8da13604ed69ec2cb60d4db0da92a1289c8` and for no other file. Nothing
was applied.

Attempt: 22-1 20261022T161449Z.1d0e2d6d0
Attempt: 22-2 20261022T165931Z.1d0e2d6d0

Recorded: 2026-10-22T16:59Z (UTC). The operator made the plan on 2026-10-22, in
`infra/envs/scratch/supabase`, against the throwaway project `suxeqyhafjueinxnojge` (organisation
`gulgrbzofwnwepdnrgrl`, region `eu-north-1`). Every value below comes from the operator's named lines,
which are stored in the attempt files named above, under `tmp/183-evidence/` and ignored by Git.
Neither the access token nor the database password was pasted, and neither is in any file.

## What the operator pasted

| Line | Value |
| --- | --- |
| `s1_plan_exit` | `0` |
| `s2_plan_sha256` | `35d762b21b217cc2cd232fcdc347e8da13604ed69ec2cb60d4db0da92a1289c8` |
| `s3_plan_line` | `10:  # module.supabase.supabase_settings.this will be updated in-place` |
| `s3_plan_line` | `265:Plan: 0 to add, 1 to change, 0 to destroy.` |
| `s4_logs_removed` | `yes` |

These were the only two `s3_plan_line` lines. Step 3's filter prints every resource heading, the
summary line, and every line that names `database_password`, a replacement or a destroy. So the plan
log held one resource heading, and no line of any of those other kinds.

## The five stop rules

| Rule | Verdict | Supporting line |
| --- | --- | --- |
| 1. No resource heading names `module.supabase.supabase_project.this` | holds | The only heading is line 10, for `module.supabase.supabase_settings.this` |
| 2. No pasted line contains `database_password` | holds | None of the pasted lines contains it |
| 3. The summary shows `0 to destroy`, and no line says a resource must be replaced | holds | Line 265: `Plan: 0 to add, 1 to change, 0 to destroy.` There is no `must be replaced` or `forces replacement` line |
| 4. The only resource heading is for `module.supabase.supabase_settings.this`, as an update in place or a creation | holds | Line 10: `will be updated in-place`, and there is no other heading |
| 5. The plan's status line reads 0 | holds | `s1_plan_exit=0` |

## The review line

```
PLAN_REVIEWED=ok attempt=20261022T165931Z.1d0e2d6d0 sha256=35d762b21b217cc2cd232fcdc347e8da13604ed69ec2cb60d4db0da92a1289c8 head=1d0e2d6d0bce8b21eac8a60a530be6b1d0f9ff34 root=scratch
```

This line is the go-ahead for plan 183-24's apply. It holds only for `tfplan` with the checksum above.
Any new plan is a different file and needs a new review.

## What this observes

- **Assumption A1 holds on this imported project (observed on 2026-10-22).** The import left the
  password out of state (183-21: `s7_password_in_state=false`), and the module sets
  `ignore_changes = [database_password]`. With both, the first plan showed no change to the project
  resource and no password line. So the first apply of this file does not call the password-update
  endpoint, and follow-up 183-R4 is not raised.
- **The project block's protection was not exercised here.** `prevent_destroy` is not touched by a
  plan that destroys nothing. The refused destroy is Step 7 of the rehearsal (plan 183-24 or later).
- **Not observed, because step 3 prints no setting value:** which keys inside the settings diff
  change. 183-21 expected the three keys that came back null on import (`password_required_characters`,
  `hook_custom_access_token_uri`, `hook_send_email_uri`), together with whatever other differences the
  JSON holds. Whether the hosted API accepts each value, including the two hooks on a project that has
  no hook functions (research F2), shows at the apply. Whether `""` for `password_required_characters`
  comes back as `""` or as null shows in the second plan (Step 6). Both are still open.

## Provenance and deviations

- **Presentation-only wrapping by the orchestrator.** The operator entered the two secrets with the
  runbook's no-echo `read -rs` lines. Step 3's regular expression was assembled in a shell variable
  from three single-quoted parts. Before handing it out, the orchestrator checked that it was
  byte-identical to the plan's pattern (`[ "$O" = "$G" ]`). The commands are otherwise the plan's
  own.
- **The reply was relayed.** The orchestrator relayed the operator's named lines, which carried the
  attempt id `20261022T161449Z.1d0e2d6d0` on their `answer_attempt=` line. The reply passed the
  `attempt.sh put` screen with no refusal. It is stored under
  `OPERATOR_REPLY=received attempt=20261022T161449Z.1d0e2d6d0 plan=22 task=1 head=1d0e2d6d0bce8b21eac8a60a530be6b1d0f9ff34 sha256=35d762b21b217cc2cd232fcdc347e8da13604ed69ec2cb60d4db0da92a1289c8`.
- **One plan only.** The operator made one plan. `tfplan` is kept in `infra/envs/scratch/supabase`
  for plan 183-24's apply, and the terminal stays open. Git ignores the file. It holds the project's
  settings and the database password in clear text, and it is removed by the step that applies it.
- **No refresh drift.** The plan printed no "has changed" heading, so the question of how rule 1
  treats a refresh-only drift heading did not arise.
