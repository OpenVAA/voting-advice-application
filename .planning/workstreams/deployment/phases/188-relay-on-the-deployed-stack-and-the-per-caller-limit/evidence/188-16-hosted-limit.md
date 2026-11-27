# 188-16 — The per-caller limit on the hosted `account-access`

Staging: `https://staging.openvaa.org`. Hosted Supabase project: `cofbsatfrdysyphajsky`. The limit: 30 takes per 10 minutes per caller per project across `check-code`, `request-link` and `request-recovery` (CONTEXT E-03; `code-sign-in` outside the take since 2026-11-19), keyed on `cf-connecting-ip` and trusted only when `private.deployment_settings.behind_cloudflare` is true.

## Task 1 — Readiness, read-only: the function and migration as deployed, the trust flag, the command the operator will run (2026-11-19)

Recorded 2026-11-19 (UTC) by the plan executor of plan 188-16, at 09:17Z to 09:20Z, from HEAD `b614fde3a`. Nothing called `account-access` from this workstation, no attempt was opened, and no hosted service, AWS resource or GitHub setting was written. The remote reads were one GET of `https://staging.openvaa.org/` (`curl -4`, the page kept in the session scratch directory, the two values read from it and not written here); `gh run list --workflow deploy.yml` and the status-filtered `gh api` GETs of `actions/runs`. The hosted database was not read: the executor holds no database credential. Every status was read on its own line, never through a pipe.

### The trust flag, first

```
BEHIND_CLOUDFLARE=true
BEHIND_CLOUDFLARE_READ_AT=2026-11-11T21:01:20Z
BEHIND_CLOUDFLARE_SOURCE=184-22 s20_behind_cloudflare both runs
MIGRATIONS_SINCE_READ=22
DEPLOYMENT_SETTINGS_WRITES_SINCE=0
E06_PREREQUISITE=present
```

- **`BEHIND_CLOUDFLARE=true`.** `evidence/184-22-persistent-bootstrap-admin-seed.md` § 3, on the persistent project `cofbsatfrdysyphajsky`: the `s20_behind_cloudflare<k>` row reads `true` for Run 1 and `true` for Run 2. The bootstrap overwrote the migration's default `false` (that file's own note); both runs ran between 21:01:19Z and 21:01:20Z of 2026-11-11, which `BEHIND_CLOUDFLARE_READ_AT=` names.
- **`MIGRATIONS_SINCE_READ=22`, `DEPLOYMENT_SETTINGS_WRITES_SINCE=0`.** The migrations applied to the hosted project since that read are `00002` to `00022` (187-21's run) and `00023` (188-10's run, `MIGRATIONS_PUSHED=00023`, `drift_status=0`). `git ls-tree --name-only a7003b490b4ff92fc72bef5d225c593b222d6c4e apps/supabase/supabase/migrations/` exit 0; each of `00002_claim_excludes_identity_provider_accounts.sql` to `00023_invitation_caller_limit.sql` was written with `git show <DEPLOY_COMMIT>:<path>` to a file in the session scratch directory, each exit 0: 22 files. `grep -ciE '(insert[[:space:]]+into|update|delete[[:space:]]+from|truncate)[[:space:]]+(table[[:space:]]+)?(only[[:space:]]+)?private\.deployment_settings'` printed 0 for each of the 22. A wider `grep -n deployment_settings` over the 22 finds it in `00023` alone, on two lines: the header comment and `IF NOT COALESCE((SELECT s.behind_cloudflare FROM private.deployment_settings s), false)`, a read. The same count is 0 over the 21 files `00002` to `00022` at `a58de7f16` and over the 22 at HEAD, and `git diff --quiet a7003b490 HEAD -- apps/supabase` exit 0.
- **The scope of the reading.** It is the last read of the flag plus every migration applied since. No bootstrap or other hosted write to the project's settings is recorded after 184-22 in this workstream's evidence, and the executor read nothing on the hosted database itself; whether the flag holds is settled by Task 3's first step, CloudShell's 31st call, before any workstation call.

### The function, the migration and the command

```
MIGRATION_00023_PUSHED=yes
FUNCTION_DEPLOYED_FROM=a7003b490b4ff92fc72bef5d225c593b222d6c4e
ANON_KEY_READ=yes
PROJECT_ID_READ=yes
NO_RUN_ACTIVE=yes
E06_COMMAND_READY=yes
```

- **`MIGRATION_00023_PUSHED=yes`.** `evidence/188-10-rollout.md`: `push_pending=00023` (the dry run's one pending line), `push_status=0`, `MIGRATIONS_PUSHED=00023`, `DRIFT_HISTORY_DATABASE=00001..00023`, `drift_status=0`.
- **`FUNCTION_DEPLOYED_FROM=`.** The same evidence: run `44491292876` on `deploy/staging` at `DEPLOY_COMMIT=a7003b490…`, `functions_deploy_exit=0`, `function=account-access status=ACTIVE verify_jwt=false expected_verify_jwt=false`, the step after the migration push. Staging still serves that commit (`evidence/188-11-capture-and-refusals.md`, `SERVED_BUILD=` read at 09:15:39Z).
- **`ANON_KEY_READ=yes`, `PROJECT_ID_READ=yes`.** `curl -4 -sS --max-time 20 https://staging.openvaa.org/` exit 0, HTTP 200. The served env block carries `PUBLIC_PROJECT_ID`, `PUBLIC_SUPABASE_ANON_KEY`, `PUBLIC_LOG_LEVEL` and `PUBLIC_SUPABASE_URL`, one each. Read inside one command and not printed: the key is JWT-shaped, 208 characters; the project id is a uuid, equal to the page's `data-project-id` attribute and to the canonical project of `seed.sql` that the deployed smoke run names; `PUBLIC_SUPABASE_URL` is `https://cofbsatfrdysyphajsky.supabase.co`.
- **`NO_RUN_ACTIVE=yes`.** At 09:19:34Z, `gh run list --workflow deploy.yml` exit 0, its 8 runs all `completed`; the status-filtered counts of `actions/runs` are 0 for `queued`, `in_progress`, `waiting`, `requested` and `pending`, each GET exit 0.
- **`E06_COMMAND_READY=yes`.** The CloudShell command is one subshell of 19 lines, none over 80 characters. It reads the anon key, the project id and the function's host from `https://staging.openvaa.org/` itself, makes 32 `check-code` calls with `curl -4`, each with a fresh unknown 12-character code of the generated alphabet, keeps only each status and, for the first 429, its `Retry-After` value and the UTC time, and prints one line `cs_200=<n> cs_429=<n> cs_first_429=<call number> cs_retry_after=<seconds> cs_limited_at=<UTC>`, or `cs_error=env-not-read` when the page gives no key or project. `bash -n` exit 0. Against a loopback stand-in on this workstation (the first line's base URL alone changed, a fake key and project; the stand-in answers 200 to 30 calls and then 429 with `Retry-After: 571`, and 400 to any request whose headers, body keys, operation, project or code form differ or whose code repeats), the command exit 0 and printed `cs_200=30 cs_429=2 cs_first_429=31 cs_retry_after=571 cs_limited_at=<the time>`, nothing on stderr; the stand-in counted 32 calls, 0 malformed, 32 distinct codes. With a base URL that answers nothing it printed `cs_error=env-not-read` and exited 1. The command is kept in the session scratch directory for the attempt file, not here.

## Task 2 — The second caller, from AWS CloudShell (2026-11-19)

The orchestrator opened attempt `20261119T095140Z.b5b5ecf9f` of key `188-16-2` and wrote Task 1's command into it. The operator ran it in AWS CloudShell in `eu-north-1`, and the reply was stored with `attempt.sh put 188-16-2`. `bash "$A" bound 188-16-2 OPERATOR_REPLY plan=188-16 task=2` exit 0 and `bash "$A" has 188-16-2 '^answer_sitting=approve$'` exit 0. The workstation saw the binding at 10:00:10Z.

```
E06_CS_200=30
E06_CS_429=2
E06_CS_FIRST_429=31
E06_CS_RETRY_AFTER=593
E06_CS_LIMITED_AT=2026-11-19T09:59:32Z
```

CloudShell's 32 calls got 30 answers of 200, then 429 at calls 31 and 32. The first 429 came at 09:59:32Z with `Retry-After: 593`.

## Task 3 — The workstation answered while CloudShell was limited, then limited and released itself (2026-11-19)

One script under the session scratch directory did all of Task 3's calls. It waited for the binding (checked every 5 s from 09:53:54Z) and then checked the answers before making any call. The anon key, the project id and the function's address were read from `https://staging.openvaa.org/` inside that script and not printed. Every call was `curl -4 -s -o <file> -D <file> -w '%{http_code}'`, a POST of `operation: check-code` with the project id and a fresh 12-character unknown code. Only the status was kept, plus the `Retry-After` value and the body's `error` word for a 429. Each status went into a variable and was read on the next line, never through a pipe. Nothing else on this workstation called `account-access` from 09:49Z (ten minutes before CloudShell's first call) to the last call: 188-11 finished at 09:45:42Z without calling it, and no deployed smoke run was started.

```
E06_LIMIT_IN_FORCE=yes
E06_WS_FIRST_STATUS=200
E06_WS_FIRST_AT=2026-11-19T10:00:11Z
E06_SAME_WINDOW=yes
E06_WS_200=30
E06_WS_FIRST_429=31
E06_WS_RETRY_AFTER=589
E06_429_BODY=too-many-requests
E06_WS_AFTER_WINDOW=200
E06_IPV6_NOTE=both callers used curl -4, so both were keyed on an IPv4 address; the /64 keying of IPv6 rests on pgTAP only
```

- **`E06_LIMIT_IN_FORCE=yes`.** `E06_CS_200=30` and `E06_CS_FIRST_429=31`, so CloudShell was refused at its 31st call, as `BEHIND_CLOUDFLARE=true` predicts.
- **`E06_SAME_WINDOW=yes`.** The workstation's first call was answered 200 at 10:00:11Z, 39 seconds after CloudShell's first 429 (under the 540 s the plan allows). CloudShell's `Retry-After: 593` was still running then. That call's curl exit was 0.
- **The workstation's own limit.** Calls 1 to 30 were all answered 200, and call 31 at 10:00:23Z was answered 429 with `Retry-After: 589` and the body word `too-many-requests`, the same body CloudShell got. No call got any other status (`WS_OTHER=0`), and 31 calls were made in all.
- **`E06_WS_AFTER_WINDOW=200`.** The script waited 594 s (`Retry-After` plus 5) from 10:00:23Z. One more `check-code` call at 10:10:18Z was answered 200, curl exit 0, with no `error` word in its body.
- **What was kept.** The evidence holds no address of either caller, no anon key and no response body other than the 429's `error` word. The hosted throttle rows of the two callers were neither read, edited nor deleted; they expire through the next take.
- **The attempt.** `bash "$A" bound 188-16-2 OPERATOR_REPLY plan=188-16 task=2` exit 0 again after the calls, for attempt `20261119T095140Z.b5b5ecf9f`.
