---
phase: 178-sign-in-email-code-registration
plan: 20
subsystem: auth
tags: [supabase, gotrue, auth-config, password-length, send-email-hook, pgtap, probe, stack-restart]

requires:
  - phase: 178-sign-in-email-code-registration
    provides: "plan 178-01: 178-stack-probe.sh with config_value/compared, the gate driver, the verdict; plan 178-02: 178-probe.mjs and P1-EXPIRY 3600; plan 178-06: section 8c's three censuses; plan 178-07: the permitted restart form; plan 178-19: the predecessor run 178-19-close-r2 (473 tests, 119 projects)"
provides:
  - "config.toml [auth] minimum_password_length = 8 (password_requirements stays empty)"
  - "config.toml [auth.hook.send_email] enabled = true, uri = pg-functions://postgres/public/send_email_hook"
  - "public.send_email_hook (event jsonb) RETURNS jsonb: LANGUAGE sql IMMUTABLE, search_path '', returns '{}' and reads nothing; EXECUTE for supabase_auth_admin alone (revoked from PUBLIC, anon, authenticated, service_role)"
  - "scripts/assert-auth-signup-closed.mjs: seven required keys (the length, [auth.email] otp_expiry = 3600, the hook's enabled and uri added), 18 self-test cases"
  - "07-rpc-security.test.sql section 8d: a census of the auth service's hooks and three privilege assertions on send_email_hook; plan (44)"
  - "178-stack-probe.sh: rows GOTRUE_MAILER_OTP_EXP / otp_expiry and GOTRUE_HOOK_SEND_EMAIL_URI / uri"
  - "178-probe.mjs: rows p5pre, p5, p6; findings P5-PRE created, P5 held, P6 held, P6-OTP distinguishes, P6-EMAIL-CHANGE no mail"
affects: [178-21, 178-22, 178-23, 178-24, 179]

actuals:
  tokens: 15700
  tasks: 3
  commits: 4
plan_head_before: 65a947c61411efa3f92404d5c384caae243ac966
plan_head_after: cc2651c3255fc3db4a1f0202dfbb7f1b0921c98d

tech-stack:
  added: []
  patterns:
    - "An auth hook is a function of public executable by supabase_auth_admin alone, pinned by a census of such functions read from pg_proc by name"
    - "A probe account that must outlive a restart is kept by the cleanup of the run that made it, at a fixed address, and its password is derived again (HMAC of the address keyed by the stack's service key), never stored"

key-files:
  created: []
  modified:
    - apps/supabase/supabase/config.toml
    - scripts/assert-auth-signup-closed.mjs
    - apps/supabase/supabase/schema/301-auth-functions.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - packages/supabase-types/src/database.ts
    - apps/supabase/supabase/tests/database/07-rpc-security.test.sql
    - .planning/phases/178-sign-in-email-code-registration/178-probe.mjs
    - .planning/phases/178-sign-in-email-code-registration/178-stack-probe.sh
    - .planning/phases/178-sign-in-email-code-registration/178-PROBE-FINDINGS.md

key-decisions:
  - "The hook is not a definer function, so section 8c's definer censuses cannot list it; a census of the auth service's hooks (functions of public that supabase_auth_admin may execute and neither API role may) holds it beside custom_access_token_hook"
  - "J6 adopted at (a) on P6: held; D-17 built; otp_expiry pinned at 3600, not changed"

requirements-completed: []

duration: ~55 min on 2026-10-14, then the closing run on 2026-10-15 (about 15 min)
completed: 2026-10-15
status: complete
---

# Phase 178 Plan 20: The Auth Configuration — Eight Characters on the Service, and a No-Op Mail Hook So the Service Sends No Mail of Its Own — Summary

## Read this first

**Complete.** The closing full run is **`178-20-close-r2`**: 473 of 473, the 119 projects equal to
`178-19-close-r2`, verdict PASS. Task 3's verify, restated with that label, exits 0.

The first closing attempt, `178-20-close`, was refused on 2026-10-14 by the E2E driver's disk guard. It
exited 3 after its own `docker builder prune -af`: 11.63 GiB free in the Docker VM against the 13.8 GiB floor.
The plan stopped there, as the dispatch requires. That directory holds only a `done` file.

The operator then chose to prune unused images, and the orchestrator ran `docker image prune -a -f`: 21.6 GiB
free. This executor resumed on 2026-10-15 and made the run as `-r2`.

## Performance

- Started about 20:30Z, stopped 21:26Z on 2026-10-14 (about 55 minutes).
- Tasks: 3 of 3. The closing run was made on 2026-10-15, from 08:26:38Z to 08:39:21Z.
- Commits: 4 (measured from the ledger, `65a947c61..cc2651c32`).

## Task Commits

| # | Commit | Subject | Files |
|---|---|---|---|
| 1 | `e5cdf4ec3` | test(178-20): the mail hook's function in the census, as failing assertions | `07-rpc-security.test.sql` |
| 2 | `1803d5abe` | feat(178-20): the auth service requires eight characters, as the client's rule does | `config.toml`, `assert-auth-signup-closed.mjs` (their state at the end of Task 1: the length and the `otp_expiry` pin) |
| 3 | `fbcb80685` | feat(178-20): [db] the auth service sends no mail of its own — a no-op mail hook | `301-auth-functions.sql`, the migration, `database.ts`, `config.toml`, `assert-auth-signup-closed.mjs` (final) |
| 4 | `cc2651c32` | chore(178-20): the probe's rows for the password length and the mail hook, as measured | `178-probe.mjs`, `178-stack-probe.sh`, `178-PROBE-FINDINGS.md` |

`config.toml` and the gate held changes of commits 2 and 3. Instead of committing both files whole with the later
commit, the first commit holds them as they stood at the end of Task 1 (kept copies,
`tests/e2e-runs/178-unit/178-20-commit1.*.kept`). The gate and its self-test were run on that state before it
was committed (5 keys hold; 15 cases). The final versions were then restored and compared byte for byte.

## Each task's verify command, with its real exit status

| Task | Script (byte for byte from the plan) | Exit | Note |
|---|---|---|---|
| 1 | `tests/e2e-runs/178-unit/178-20-t1-verify.sh` | **0** | |
| 2 | `178-20-t2-verify.sh` | **0** | pgTAP green on the reset database; the red run named file 07 |
| 3 | `178-20-t3-verify.sh` | **1** | as written: every stage passes up to and including `verdict gates 178-20-close`; the last stage, `verdict e2e 178-20-close`, fails: `summary.json is missing`, because the run of that label was refused by the disk floor |
| 3, restated | `178-20-t3-verify-r2.sh` | **0** | the same script with one change: the last stage reads `e2e 178-20-close-r2`, the label the run took after the refusal. Every stage PASS: the stack probe, the pre-commit control, `gates 178-20-close` (not stale at `6c22aa9a1`), `e2e 178-20-close-r2` |

## The verdict lines, as written to `178-PROBE-FINDINGS.md`

```
P5-PRE: created
P5: held
P6: held
P6-OTP: distinguishes
P6-EMAIL-CHANGE: no mail
```

- **P5-PRE (how and when the fourth step's account was made).** It was made at 20:57:14Z by `p5pre`, an
  administrator's `createUser` with a password of seven characters on the service as it had run since its
  last start (minimum 6). The address is `r178-probe-p5pre@…`. That was after the last reset (Task 2's, at
  about 20:55Z) and 37 seconds before `yarn db:stop` (20:57:51Z). No reset came between it and `p5`. Exit 0.
- **P5 (observed after the restart).**
  - The user's own update to seven characters: 422 `weak_password`.
  - The user's own update to eight characters: 200.
  - An administrator's `createUser` with seven characters: 422 `weak_password`.
  - A password sign-in with the seven-character password the account already had: 200.
  - So the length binds setting a password, by the user and by the service role, and no sign-in with an
    older, shorter password.
- **P6 (observed after the restart, under the hook).**
  - `generateLink` magiclink: 200 with a token, and the token verifies to a session.
  - The service's own one-time-code request (`create_user` false): **200 for an address with an account, 422
    `otp_disabled` for one without**.
  - The service's own recovery request: 200 for both.
  - The user's own change of address: 200.
  - The function's link request and recovery request: each witness reads `sent`, with exactly one mail each.
  - Five seconds after the service's last request, the catcher holds **no** mail for any of the four
    addresses (with an account, without, the old and the new address).
- **Inferred, not observed:**
  - That without the hook those requests would have mailed. No control without the hook was run; the 200
    answers show the service took the requests.
  - That the service's other mail kinds are held back alike: an invitation via `inviteUserByEmail`, or a
    reauthentication.

**The hook was adopted** (P6: held). It stops the auth service's mail and nothing else. Its one-time-code
endpoint still tells a registered address from an unregistered one (`P6-OTP: distinguishes`). That is
measured and stated here, and it is not closed by this plan or this phase.

## The restart, and the stack probe before and after it

`tests/e2e-runs/178-unit/178-20-restart.sh`, the 178-07 form, ran after the in-flight check: 487 `started`
markers, each with an `ended`; nothing on 5273; Docker VM 14.92 GiB; AC power.

| Command | Exit |
|---|---|
| `yarn db:stop` (`openvaa-local` only) | **0** |
| `yarn db:start` | **0** |

What the restart touched, from `docker ps` before, between and after (`178-20-restart.containers-*`):

- The 13 `openvaa-local` containers stopped and came back.
- Every other container kept its uptime: `my-redis`, the `next-supabase-skimle2` stack, and the
  `openvaa-iso-topo` stack. `openvaa-iso-topo` is a third Supabase stack, on ports 55800 and 55801, started by
  someone else about 20:29Z, before this plan's first command; it was left alone.
- Docker itself was not restarted.
- The tail of the `db:start` log was not read.

| Row (running auth container / config.toml) | Before the restart (after two resets) | After |
|---|---|---|
| `GOTRUE_PASSWORD_MIN_LENGTH` / `minimum_password_length` | 6 / 8 — DIFFERS | 8 / 8 — EQUAL |
| `GOTRUE_MAILER_OTP_EXP` / `[auth.email] otp_expiry` | 3600 / 3600 — EQUAL | 3600 / 3600 — EQUAL |
| `GOTRUE_HOOK_SEND_EMAIL_ENABLED` / `hook.send_email` | false / true — DIFFERS | true / true — EQUAL |
| `GOTRUE_HOOK_SEND_EMAIL_URI` / `uri` | (none) / the URI — DIFFERS | the URI / the URI — EQUAL |
| `account-access request-recovery` / `contract.ts` | 200 accepted / names it — EQUAL | the same |
| the six signup-closed rows, `SITE_URL`, `SMTP_HOST`, `SMTP_PORT`, probe users | OK / EQUAL | OK / EQUAL |

Exits: 1 before (`178-20-stack-before.log`), **0 after** (`178-20-stack.log`). **Observed: `[auth]` keys and hook
tables are not served without a restart.** A `yarn db:reset` (two were made after the edit) restarts the
container with its old environment. The functions' environment was not changed by this plan, so whether it
needs the restart is still untested.

## The pinned lifetime of a mailed link (D-18, PL-27)

`otp_expiry` keeps 3600 under `[auth.email]`; `config.toml` is not changed for it.

**The gate requires `otp_expiry = 3600` under `[auth.email]`.** Its self-test cases for the key:

- 86400;
- absent;
- commented out;
- present only in `[auth]`.

**The stack probe reads the running `GOTRUE_MAILER_OTP_EXP` against the file.** It read 3600 / 3600 EQUAL,
before and after the restart. The variable's name was found by listing the auth container's variable names
only, no values; the probe itself still reads one variable by name.

**Pinned, not observed:** no task waited a link out.

## The gate's cases

The gate holds seven keys and its self-test 18 cases. The cases for the length:

- 6;
- absent;
- commented out;
- present only in `[auth.email]`.

The cases for the hook:

- `enabled = false`;
- the table absent, with the access-token hook left in place (both keys reported);
- another URI.

Three existing cases had anchored on `enable_signup = false` directly followed by `[auth.rate_limit]`. The new
key broke that adjacency, and the self-test's own guard reported each as "equals the required configuration".
They were re-anchored.

## Red before green

- `tests/e2e-runs/178-unit/178-20-pgtap-red.{log,exit,head}`: exit 1. It ran on a freshly reset database at
  head `65a947c61`, with the migration the committed one. **Red in file 07 alone:** tests 22 to 25, each on
  its expectation (the census, then the three privilege assertions). The other 44 files passed; 45 files,
  2435 tests.
- The red run was made twice:
  - `-r1` used the file before prettier formatted it.
  - The kept run used the formatted bytes that were committed.
  - The `-r1` files were renamed, not deleted.
- After the schema change: reset, types and pgTAP each exit 0, 2435 tests PASS (`178-20-t2-*`).
- `assert:schema-migration-parity` 0; `assert:rpc-nullability` 0.
- The regenerated migration's diff is exactly the 25 schema lines. The types gain one line,
  `send_email_hook: { Args: { event: Json }; Returns: Json }`.

## The runs

| Run | Totals | Projects against `178-19-close-r2` | Docker VM free before | Verdict |
|---|---|---|---|---|
| `178-e2e/178-20-precommit` (uncommitted tree, through the wrapper, 21:04:33Z to 21:16:40Z) | 473 passed, 0 failed, flaky, skipped or did not run | 119 compared, 0 not as expected | 14.92 GiB | `control … --full --green`: **PASS** |
| `178-gates/178-20-close` (full set, head `cc2651c32`) | all 17 rows exit 0 | — | — | `gates 178-20-close`: **PASS** (not stale; no Sleep in the window) |
| `178-e2e/178-20-close` (2026-10-14) | **not run** | — | **11.63 GiB after the driver's prune** (11.44 before it) | the driver refused, exit 3 |
| `178-e2e/178-20-close-r2` (committed tree, head `6c22aa9a1`, 2026-10-15 08:26:38Z to 08:39:21Z) | 473 passed, 0 failed, flaky, skipped or did not run | 119 compared, 0 not as expected | 21.59 GiB at the in-flight check, 24.12 GiB after the driver's prune | `e2e 178-20-close-r2 --same-projects-as 178-19-close`: **PASS** (not stale; no Sleep entry in the window) |

The kept copies of the eight uncommitted files sit beside the pre-commit run as `178-20-precommit.<path>.kept`.
HEAD holds byte for byte what that run used. No void, no red run, no axe finding and no overflow.

The auth budget in the pre-commit run's window is unchanged from 178-19
(`tests/e2e-runs/178-unit/178-20-precommit-auth-peaks.log`):

- 25 of 30 password sign-ins in five minutes (35 in all);
- 17 link verifications.

The run was started more than five minutes after the probe's three sign-ins. No fixture needed correcting for
the length: the run shows every password the estate generates is accepted at eight.

`docker system df` after the refusal:

| Type | Size |
|---|---|
| images | 18.15 GB (2.75 GB reclaimable) |
| volumes | 14.02 GB (none reclaimable) |
| build cache | 2.60 GB, all 12 entries active, so the prune reclaims none of it |

Free space fell by about 3.5 GiB between the pre-commit run (14.92) and the gate set's end. Not investigated
further; nothing was removed.

## Decisions Made

- J6 built at (a) on `P6: held`; D-17 built; the lifetime pinned (PL-27). J6, PL-18 and PL-27 were read by the
  operator on 2026-10-11 and stand at their recommended options.
- The hook census is a new section, 8d: see Deviation 1.

## Deviations from Plan

**1. [Rule 3 - Blocking] The census the hook goes into.** The plan says "the census gains `send_email_hook`, and
three assertions in the form the access-token hook's have". The plan's own function is `LANGUAGE sql
IMMUTABLE` with no `SECURITY DEFINER`, so none of section 8c's three definer censuses can list it. The
dispatch's "After 178-06" rule is conditional ("if `send_email_hook` is one") and does not apply. The
access-token hook's privileges are asserted in file 24, as one `ok()`, not in file 07.

Built instead, in file 07, a section 8d:

- a census of the functions of `public` that `supabase_auth_admin` may execute and neither API role may. It
  read `custom_access_token_hook` before this plan and now reads `custom_access_token_hook,send_email_hook`;
- three assertions: executable by `supabase_auth_admin`; by neither `anon` nor `authenticated`; not by
  `service_role`.

Each reads `pg_proc` by name, so the red run fails rather than raises. `plan (40)` became `plan (44)`. Commit
`e5cdf4ec3`.

**2. [Rule 2] The stack probe also compares the hook's URI.** Step 6 asked only to confirm the `enabled` row.
A configured hook that names another function would have read EQUAL on that row alone. Commit `cc2651c32`.

**3. The first commit holds the Task-1 state of two files**, rather than leaving the first commit empty under
the "commit with the later of them" rule. See Task Commits.

**4. The probe's design for `p5pre`.**

- The account lives at a fixed address under the prefix. The run that made it spares it in the cleanup; a
  later `p5` run's cleanup removes it.
- Its password is an HMAC of the address keyed by the stack's service key, cut to seven characters. It is
  recomputed by `p5`, and never printed or written anywhere.
- The fallback (a direct bcrypt hash) sends its SQL to `psql` on standard input. It was not needed and was not
  exercised.
- Naming `p5pre` beside `p5` in one run is a usage error (exit 2).
- **`p5` and `p6` are now rows with steps, so plan 178-02's Task 1 verify (`node 178-probe.mjs p5` exits 2) no
  longer holds.**

**5. The red-run script's guard was narrowed.** It first required the schema directory and the migration to
equal HEAD; it now requires the migration alone, which is what the reset applies. The first, refused attempt
is kept as `178-20-pgtap-red-r2-refused-driver.*`.

**6. Wording in the gate.**

- The `otp_expiry` reason first said the mails and the docs state an hour. They do not (searched: no "hour" in
  `mailTemplates.ts` or under `apps/docs/src`), so it says only that the setting bounds how long a link can be
  used.
- The header's "a hosted project's two switches" now reads "copies of these settings".

**7. The gate set's wrapper exit marker** (`178-20-gates-driver.exit`) was not written: I launched it with `&`
from a shell that then exited. The driver's own `done`, `summary.tsv` and per-row logs are complete, and the
verdict read them.

## Not done, or not verified

- The closing run's first attempt, `178-20-close`, was refused by the disk floor. Its retry `178-20-close-r2`
  is green, and Task 3's verify passes restated with that label.
- Not observed by any row:
  - That a mailed link is refused after 3600 s (PL-27: pinned, not observed).
  - The service's other mail kinds under the hook: invite, reauthentication.
  - A control of P6 without the hook.
- The two opt-in bank-auth projects were not run (PL-26: at 178-24's close).

## Threat surface

T-178-126, -127, -129, -130 and -157 are mitigated as planned. T-178-128 is accepted and measured
(`P6-OTP: distinguishes`). T-178-131 is transferred, below. T-178-132 is measured (`P6-EMAIL-CHANGE: no mail`)
and handed to Phase 179. No new surface: the hook is the plan's.

## For Phase 179

**Under the hook, the auth service sends no mail for a change of address.** `updateUser({ email })` answered 200,
and neither the old nor the new address received anything (`P6-EMAIL-CHANGE: no mail`). An address change asked
through the service therefore cannot be confirmed by its user. Phase 179's confirmation of a pending address must
be sent by a function, in seven locales.

Today nothing in `apps`, `packages` or `tests` calls a mailing endpoint of the auth service. A search for
`inviteUserByEmail`, `signInWithOtp`, `resetPasswordForEmail`, `reauthenticate` and `updateUser({ email` found no
hit.

## For a hosted project (O-7, O-8; the sentence is plan 178-23's)

Each of these is set in the dashboard, because no file in the repository reaches it:

- **Minimum password length 8**; required characters none.
- **Email OTP expiration 3600 seconds**: the life of a mailed link.
- **Send Email hook**: enabled, of the Postgres type, function `public.send_email_hook`. The function arrives
  with the schema; its grant to `supabase_auth_admin` is in the migration.
- **Public sign-up off**; email confirmations on.

The hook stops the service's mail. It does not make the one-time-code endpoint uniform for registered and
unregistered addresses.

## The state the local stack is left in

- Up. Restarted once by this plan, at 20:57:51Z to 20:58:31Z, serving the tree's `[auth]` configuration with
  the hook.
- The gate set's reset was the last reset. It was followed by `yarn db:seed:default` (exit 0, 752 rows) and by
  no E2E run. pgTAP was green on it just before the seed (the gate row); whether test 238 of file 39 is still
  green after the seed is inferred, not run.
- No `r178-probe-` user is left: `p5`'s cleanup removed the `p5pre` account.
- Nothing listens on 5273; no `started` without an `ended`.
- After the closing run `178-20-close-r2` (2026-10-15), which used `--no-db-reset`: the database holds what
  the suite's teardowns leave, so pgTAP test 238 of file 39 is red on it until the next reset (the known
  finding).
- Docker VM: 24.12 GiB free before the closing run. The running containers are `openvaa-local`'s 13 and
  `my-redis`. The `next-supabase-skimle2` and `openvaa-iso-topo` stacks were gone by 2026-10-15; neither was
  stopped by this plan.
- Power: 100 %, charged.

## For later plans

- **Predecessor label for the next full run: `178-20-close-r2`.** 473 tests, 119 projects, head `6c22aa9a1`
  (tree-equal to `cc2651c32` outside `.planning/`). `178-20-close` is a refused attempt with no run in it;
  never name it as a predecessor.
- **Passwords:** the auth service now refuses fewer than eight characters (422 `weak_password`) on
  `updateUser`, on an administrator's `createUser` and on the recovery page's update. A fixture or a spec
  that sets a seven-character password now fails at the service. An account created before this plan with a
  shorter password still signs in.
- **The auth service sends no mail.** A spec that expected one from `/otp`, `/recover`, an invite or an
  address change would wait forever; none exists today.
- **pgTAP now:** 45 files, 2435 assertions; file 07 is `plan (44)`.
- **The stack probe** has two more rows (`GOTRUE_MAILER_OTP_EXP`, `GOTRUE_HOOK_SEND_EMAIL_URI`). Its `/otp`
  live row still reads 422 `signup_disabled` under the hook.
- **The probe:** `p5pre` is run alone before a restart, and `p5` and `p6` after it. Any other row's cleanup
  removes the `p5pre` account. Plan 178-02's Task 1 verify (`p5` exits 2) no longer holds.
- **For 178-23, now out of date (none edited):**
  - `apps/docs/.../developers-guide/contestant-app/password-validation/+page.md` says the local stack enforces
    "6 characters".
  - `.claude/skills/database/SKILL.md`: § 4 describes the 8c censuses and not the hook census of 8d; the
    pgTAP counts; § 2 lists only the access-token hook.
  - `.claude/skills/database/schema-reference.md` has no row for `public.send_email_hook`.
  - The docs pages on authentication and on email (`developers-guide/backend/authentication`,
    `backend/email`) where they say what the auth service mails.
  - The hosted-settings paragraph above.
  - Two todos: the one on the auth service's OTP endpoint
    (`2026-10-07-174-auth-service-otp-endpoint-tells-registered-addresses.md`) stays open and gains the
    measurement `P6-OTP: distinguishes`; the one on hosted settings
    (`2026-10-07-174-hosted-project-auth-settings-allowlist-and-function-variables.md`) gains the length, the
    lifetime and the hook. The plan's threat register says both, but its tasks name neither file, so this plan
    did not edit them.
- **Timing on this host today:**

  | Step | Time |
  |---|---|
  | the red pgTAP run with its reset | about 35 s |
  | the restart | 40 s |
  | `p5,p6` | about 25 s |
  | the pre-commit full run | 12 min 7 s |
  | the seventeen gate rows | about 4 min 25 s |
  | the closing full run | 12 min 43 s |

## Known Stubs

None.

## Self-Check: PASSED

- The four commits `e5cdf4ec3`, `1803d5abe`, `fbcb80685`, `cc2651c32` are ancestors of HEAD.
- The modified files exist with the contents committed.
- The findings hold one line each of `P5-PRE: created`, `P5: held`, `P6: held`, `P6-OTP: distinguishes`,
  `P6-EMAIL-CHANGE: no mail`.
