---
phase: 174-invitations-grants-defined-in-advance
plan: 03
subsystem: auth
tags: [supabase, gotrue, auth, config, edge-runtime, playwright, e2e, docs, security]

requires:
  - phase: 174-invitations-grants-defined-in-advance
    provides: "plan 01: 174-NAME-MAP.md, the drivers 174-gates.sh, 174-e2e.sh, 174-bankauth.sh, 174-stack-probe.sh and 174-verdict.mjs, and the green baseline 174-01-baseline; plan 02: public.invitations and create_invitations, whose boundary proof is this plan's full E2E run"
  - phase: 170-contestant-app-rename-symbols-routes
    provides: "170-allowlist-probe.sh and the neutral auth callback the redirect allowlist admits"
provides:
  - "a local auth service that creates no user for an unauthenticated caller: POST /signup and POST /otp with create_user each answer 422 signup_disabled"
  - "scripts/assert-auth-signup-closed.mjs and the root script assert:auth-signup-closed, a link of lint:check"
  - "the Playwright project auth-service-contract (two API-only tests) in the default suite"
  - "[edge_runtime] policy = per_worker, live, with a function environment that reaches the mail catcher"
  - "174-mail-probe.mjs: a mail sent by send-email is shown to arrive"
  - "docs: who can create an account, the hosted project's two switches, that the database has no guard of its own, the one restart"
affects: [174-04, 174-05, 174-06, 174-07, 174-08, 174-09, 174-10, 178]

actuals:
  tokens: 16985 # chars/4 over git diff ef110d349..HEAD for the plan's files: 39497 chars outside .planning/, 28443 in 174-mail-probe.mjs and 174-NAME-MAP.md
  tasks: 7
  commits: 15 # MEASURED: git rev-list --count ef110d349..HEAD. Nine are this plan's ((174-03) in the subject); six are the orchestrator's .planning/ commits made in between
plan_head_before: ef110d34912c1e8bf1443c286191fef845b7b86c
plan_head_after: 5674c11903d6470a857713915da12353a2fbea86

tech-stack:
  added: []
  patterns:
    - "A repository gate over configuration keys that finds each key inside its own table, with a self-test of every failing direction"
    - "An API-only Playwright project with no dependency and no use block, for a property of a running service rather than of a dataset"
    - "A stack property is read from the running containers one named variable at a time; an untracked file is corrected by the operator at a checkpoint and verified by a restart and a probe"

key-files:
  created:
    - "scripts/assert-auth-signup-closed.mjs"
    - "tests/tests/specs/auth/public-signup-closed.spec.ts"
    - "tests/tests/utils/supabaseAnonKey.ts"
    - ".planning/phases/174-invitations-grants-defined-in-advance/174-mail-probe.mjs"
  modified:
    - "apps/supabase/supabase/config.toml"
    - ".env.example"
    - "apps/supabase/supabase/functions/.env.example"
    - "package.json"
    - "tests/playwright.config.ts"
    - "tests/README.md"
    - "tests/IDURA-TEST-RUNBOOK.md"
    - "apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/deployment/+page.md"
    - "apps/supabase/README.md"
    - ".planning/phases/174-invitations-grants-defined-in-advance/174-NAME-MAP.md"

key-decisions:
  - "Ruling A1 (operator, 2026-10-07): both switches stay as committed — [auth] enable_signup = false and [auth.email] enable_confirmations = true"
  - "The operator's checkpoint was needed (two of three edge variables differed) and was answered done on 2026-10-07; a restart and 174-stack-probe.sh after are its verification, and no executor opened the untracked file"
  - "The sign-up spec removes, after each test, any user for the address it tried, so a service that regresses leaves no user behind; on a green run this deletes nothing"
  - "INV-03 is advanced, not completed, by this plan: no function claims an invitation yet"

patterns-established:
  - "A change under apps/supabase/supabase/functions/ or to config.toml reaches the running services only through yarn db:stop then yarn db:start, and is followed by 170-allowlist-probe.sh after and 174-stack-probe.sh after"

requirements-completed: []

coverage:
  - id: D1
    description: "The running local auth service refuses to create a user for an unauthenticated caller: POST /auth/v1/signup and POST /auth/v1/otp with create_user each answer 422 signup_disabled and no user exists afterwards; before the change the same two requests each answered 200 and created a user"
    requirement: "INV-03"
    verification:
      - kind: other
        ref: "174-stack-probe.sh before (S1, exit 0) and 174-stack-probe.sh after (A1, S11, the gate row stack, and after the bank-auth restore; exit 0 each time)"
        status: pass
      - kind: e2e
        ref: "tests/tests/specs/auth/public-signup-closed.spec.ts, project auth-service-contract: 2 of 2 in the slice 174-03-contract-slice and in the default run 174-03-close"
        status: pass
    human_judgment: false
  - id: D2
    description: "config.toml holds [auth] enable_signup = false and [auth.email] enable_confirmations = true with [auth.email] enable_signup left true, and the running auth container reports GOTRUE_DISABLE_SIGNUP true and GOTRUE_MAILER_AUTOCONFIRM false, each read by name"
    requirement: "INV-03"
    verification:
      - kind: other
        ref: "node scripts/assert-auth-signup-closed.mjs (gate row auth-config, 0); two docker exec … printenv <NAME> calls after the last restart"
        status: pass
    human_judgment: false
  - id: D3
    description: "yarn assert:auth-signup-closed is a link of yarn lint:check and fails when either switch regresses or the email provider is switched off"
    requirement: "INV-03"
    verification:
      - kind: unit
        ref: "node scripts/assert-auth-signup-closed.mjs --self-test (seven cases, S6); the script over the configuration of ef110d349 exits 1 naming both keys; gate row lint of 174-03-close"
        status: pass
    human_judgment: false
  - id: D4
    description: "[edge_runtime] policy is per_worker; the three existing functions answer; one mail sent by send-email reaches the local mail catcher; both bank-auth projects pass under it"
    verification:
      - kind: other
        ref: "S13 (three OPTIONS 200, no module-level let or var in any index.ts); 174-mail-probe.mjs (S12, exit 0, eight steps PASS)"
        status: pass
      - kind: e2e
        ref: "174-03-bank-auth (8 of 8, bank-auth 6 of 6) and 174-03-bank-auth-journey (152 of 152, bank-auth-journey 1 of 1)"
        status: pass
    human_judgment: true
    rationale: "Whether a background task completes after the response is not measured here; it is measured in 174-05, when a function that uses one exists. What is shown is that the three existing functions keep working under the policy"
  - id: D5
    description: "The running edge runtime's SITE_URL, SMTP_HOST and SMTP_PORT, each read by name, equal the committed template's values; the operator set the three lines at a checkpoint and no task opened the untracked file"
    verification:
      - kind: other
        ref: "174-stack-probe.sh after: three rows EQUAL (S11, and again after the bank-auth restore); 174-verdict.mjs hygiene exits 0"
        status: pass
    human_judgment: true
    rationale: "That the operator's edit touched only the three lines is the operator's word; the probe shows the three values and nothing about the rest of the file"
  - id: D6
    description: "The developers' docs say that a hosted project's dashboard must have public sign-up off and email confirmation on, that the repository cannot set either, that the database has no guard of its own, and that every developer restarts the local stack once"
    verification:
      - kind: other
        ref: "yarn workspace @openvaa/docs validate:links --check (0 findings); the four content greps of Task 6's verify; gate rows docs-links and format of 174-03-close"
        status: pass
    human_judgment: true
    rationale: "The gates show the pages link and format; that the wording is right for an operator of a hosted project is a reading. The dashboard labels are quoted from the plan and were not checked against a hosted project"
  - id: D7
    description: "With the configuration live, the fifteen gate rows, the full default E2E suite and both opt-in bank-auth projects are green, and the stack is restored and probed afterwards"
    verification:
      - kind: other
        ref: "node 174-verdict.mjs gates 174-03-close — exit 0, fifteen rows"
        status: pass
      - kind: e2e
        ref: "node 174-verdict.mjs e2e 174-03-close --same-projects-as 174-01-baseline --except auth-service-contract=2 --expect-project auth-service-contract — exit 0, 200 of 200 in 104 projects"
        status: pass
    human_judgment: false

duration: 40min
completed: 2026-10-07
status: complete
---

# Phase 174 Plan 03: Public sign-up closed on the local auth service, held by a gate and by the suite Summary

**`[auth] enable_signup = false` and `[auth.email] enable_confirmations = true` are live on the local stack, so `POST /signup` and `POST /otp` with `create_user` each answer `422 signup_disabled`; a `lint:check` link and an API-only E2E project hold it, and the edge runtime runs `per_worker` with a function environment shown to deliver mail.**

## Performance

- **Duration:** about 40 min of execution in two sittings (Tasks 1 and 2 on 2026-10-06, 23:24 to 23:36 local; Tasks 4 to 7 on 2026-10-07, 10:54 to 11:21 local), not counting the wait at the operator's checkpoint
- **Tasks:** 7 of 7 (Task 3 is the operator's checkpoint)
- **Files:** 4 created, 11 modified
- **Executors:** two. The first ran Tasks 1 and 2 and stopped at the checkpoint; the second resumed from disk at Task 4

## Accomplishments

- The hole was recorded on the running service before any edit, then closed: both live requests answered 200 and created a user (S1); after one restart both answer `422 signup_disabled` and no user exists (A1).
- `scripts/assert-auth-signup-closed.mjs` fails `yarn lint:check` when either switch regresses or the email provider is switched off; its self-test shows each failing direction.
- The default E2E suite now observes the running service: project `auth-service-contract`, two tests, no dependency.
- The edge runtime runs `per_worker` with `SITE_URL`, `SMTP_HOST` and `SMTP_PORT` equal to the tracked template, and a mail sent by `send-email` reached the catcher.
- The docs state the hosted obligation and, plainly, that the database cannot tell how an address was confirmed.
- The close is green on one tree: fifteen gate rows, 200 of 200 in the default suite, both bank-auth projects.

## Task Commits

| Task | Name | Commits |
| --- | --- | --- |
| 1 | Probe the hole; close it in `config.toml`; the two templates; the gate | `592547b68` (feat: configuration and templates), `814f0a32e` (feat: the gate and `lint:check`), `6c23c730c` (docs: name map) |
| 2 | Restart; the auth service is closed; the three edge variables | `c5e134ecf` (docs: name map) |
| 3 | Checkpoint: the operator sets three lines | none — operator confirmed done, 2026-10-07 |
| 4 | Restart, read again, prove delivery, measure the per-worker policy | `601ffebd8` (docs: the mail probe and name map S10 to S13) |
| 5 | The E2E project | `5d02cf0f4` (test) |
| 6 | The docs | `e6de08acb` (docs), `5a63296e2` (docs: the spec's header, see Deviations) |
| 7 | The close | `5674c1190` (docs: name map S14, S15 and the closing record) |

Plan metadata: the commit that adds this file.

## The probe outputs

| Evidence (under `tests/e2e-runs/174-gates/`, gitignored) | Exit | What it shows |
| --- | --- | --- |
| `174-03-probe-before.txt` | 0 | container `GOTRUE_DISABLE_SIGNUP false`, `GOTRUE_MAILER_AUTOCONFIRM true`; live `POST /signup` 200 and live `POST /otp` with `create_user` 200; two probe users found and deleted, 0 left. A first attempt, kept as `174-03-probe-before-attempt1.txt`, fell inside a DarkWake interval of the host and was made again |
| `174-03-probe-auth.txt` | 0 | after the first restart: `GOTRUE_DISABLE_SIGNUP true`, `GOTRUE_MAILER_AUTOCONFIRM false`; served `disable_signup true`, `mailer_autoconfirm false`; both live requests `422 signup_disabled`; probe users `0 found, 0 left` |
| `174-03-edge-env.txt` | 1 | Task 2's three rows, below |
| `174-03-probe-after.txt` | 0 | after the operator's change and a second restart: the auth rows as above, the three edge rows EQUAL |
| `174-03-mail-probe.txt` | 0 | eight steps, every one PASS |

## Task 2's three rows, and the checkpoint

As the edge runtime was started before the operator's change (`174-03-edge-env.txt`, exit 1):

| Variable | Edge container | Tracked template | Verdict |
| --- | --- | --- | --- |
| `SITE_URL` | `http://127.0.0.1:5173` | `http://localhost:5173` | DIFFERS |
| `SMTP_HOST` | `inbucket` | `inbucket` | EQUAL |
| `SMTP_PORT` | `2500` | `1025` | DIFFERS |

**The checkpoint was needed.** The operator replied `done` on 2026-10-07. After `yarn db:stop` (exit 0) and `yarn db:start` (exit 0), `174-stack-probe.sh after` exits 0 (`174-03-probe-after.txt`):

| Variable | Edge container | Tracked template | Verdict |
| --- | --- | --- | --- |
| `SITE_URL` | `http://localhost:5173` | `http://localhost:5173` | EQUAL |
| `SMTP_HOST` | `inbucket` | `inbucket` | EQUAL |
| `SMTP_PORT` | `1025` | `1025` | EQUAL |

No command of either executor named, opened or changed the untracked file.

## The verdict for A1

**Holds.** The CLI maps `[auth] enable_signup = false` to `GOTRUE_DISABLE_SIGNUP=true` and `[auth.email] enable_confirmations = true` to `GOTRUE_MAILER_AUTOCONFIRM=false`: read by name from the auth container after the restart, in agreement with the served settings and with both live requests.

## The mail probe

`node …/174-mail-probe.mjs`, exit 0, its first run:

```
PASS 1 keys — both captured
PASS 2 project — the edge runtime serves 00000000-0000-0000-0000-000000000001
PASS 3 user — r174-probe-mail-1791359808@test.openvaa.local created, confirmed by the service role
PASS 4 grant — (project, the served project, admin)
PASS 5 sign-in — a session was issued
PASS 6 send-email — answered 200, sent 1, failed 0
PASS 7 delivery — a message with nonce a2b06e07ca024cfb reached the catcher within 0 s
PASS 8 cleanup — the user is deleted and gone
174-mail-probe: PASS
```

## The three policy measurements

Under `[edge_runtime] policy = "per_worker"`:

1. An `OPTIONS` request to `identity-callback`, `invite-candidate` and `send-email` each answers 200.
2. The mail probe passed.
3. `git grep -n -E "^(let|var) " -- 'apps/supabase/supabase/functions/*/index.ts'` prints nothing (exit 1). No finding. A wider look at every module-level `const` of the functions' non-test sources (fifteen) finds none that is mutated; the one global regular expression, `PLACEHOLDER_PATTERN` in `send-email/templateVars.ts`, is used only through `String.prototype.replace`.

Whether a background task completes after the response is 174-05's to measure.

## Gate rows

`tests/e2e-runs/174-gates/174-03-close`, exit 0, head `5a63296e2`, 2026-10-07 11:03:38 to 11:07:11 local, `sleep_entries_in_window: 0`. `node …/174-verdict.mjs gates 174-03-close` exits 0.

| Row | Status | Seconds |
| --- | --- | --- |
| typecheck | 0 | 20 |
| lint | 0 | 45 |
| db-reset | 0 | 30 |
| types-regen | 0 | 2 |
| types-clean | 0 | 0 |
| pgtap | 0 | 5 |
| sql-lint | 0 | 4 |
| unit | 0 | 61 |
| check-frontend | 0 | 9 |
| build | 0 | 15 |
| format | 0 | 18 |
| docs-links | 0 | 2 |
| name-gate-self-test | 0 | 0 |
| auth-config | 0 | 0 |
| stack | 0 | 2 |

## The three runs' counts

| Run | Total | Passed | Failed | Flaky | Skipped | Did not run | Projects | Window (local) | `sleep_entries_in_window` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `174-03-close` (the full default suite) | 200 | 200 | 0 | 0 | 0 | 0 | 104 | 11:07:23 to 11:13:04 | 0 |
| `174-03-bank-auth` | 8 | 8 | 0 | 0 | 0 | 0 | 3 (`bank-auth` 6 of 6) | 11:13:24 to 11:13:39 | 0 |
| `174-03-bank-auth-journey` | 152 | 152 | 0 | 0 | 0 | 0 | 90 (`bank-auth-journey` 1 of 1) | 11:13:47 to 11:18:24 | 0 |

- The default run against the baseline: "per project: 104 compared, 0 not as expected". Each of the baseline's 103 projects holds its baseline total (198 tests); `auth-service-contract` holds 2, both passed.
- The fast-feedback slice `174-03-contract-slice` (Task 5): total 2, passed 2, everything else 0; `sleep_entries_in_window: 0`.
- After the bank-auth driver's restore: `yarn db:stop` 0, `yarn db:start` 0, the three functions `OPTIONS` 200, ports 5273, 8777 and 9443 free, `170-allowlist-probe.sh after` exit 0, `174-stack-probe.sh after` exit 0.
- Every run was a first attempt. No run is void and none was repeated.
- The default run is also 174-02's boundary proof: nothing that reads or writes entities, grants or the database types moved.

## `CLAUDE.md` read against the change

**No sentence was made false.** `CLAUDE.md` names neither switch, nor `SITE_URL`, nor the edge runtime's policy, and states no count or position of `lint:check` links. It was not edited (`git diff --stat ef110d349..HEAD -- CLAUDE.md` prints nothing).

One omission, not a contradiction: § _Development Environment_ and § _Troubleshooting_ do not say that a change to `config.toml` or to the function environment needs `yarn db:stop` then `yarn db:start`. A developer whose stack predates this plan keeps an open sign-up until the restart, and the default suite is then red in `auth-service-contract`.

## Decisions Made

- **Ruling A1** (operator, 2026-10-07): both switches stay as committed.
- **The spec cleans up after itself.** Each test's `afterEach` removes any user for the address it tried. A refusal creates none, so on a green run it deletes nothing; a service that regresses does not leave users behind.
- **`requirements-completed` is empty.** INV-03 reads "Claiming an invitation writes exactly the grants it defines, and only for the user who proved the email or the code". This plan makes "proved the email" mean something; the claim itself is 174-04's.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] The sign-up spec removes any user an attempt created**
- **Found during:** Task 5
- **Issue:** As planned, a test whose refusal fails would leave a `signup-closed-…@test.openvaa.local` user behind on every red run.
- **Fix:** An `afterEach` calls `unregisterCandidate` for each address the test tried.
- **Files modified:** `tests/tests/specs/auth/public-signup-closed.spec.ts`
- **Commit:** `5d02cf0f4`

### Additions and differences

- **The spec's header was reworded in a commit of its own** (`5a63296e2`). Its first sentence said that authority is granted to a confirmed address, which no function does until 174-04; it now gives the reason in terms that hold for any function. A comment change only; the full run that followed includes it.
- **A wider search than the plan's for module-level state** (every module-level `const` of the functions, not only `let` and `var` in `index.ts`), reported under the three policy measurements.
- **`tests/IDURA-TEST-RUNBOOK.md` changed** in Task 1 (S5); it is not in the plan's `files_modified`.
- **`yarn db:seed:default` was run after the last run** (exit 0), as the name map's baseline note asks of every plan that runs the gate set.
- **One container read the plan did not ask for.** While measuring the policy, one `docker exec supabase_edge_runtime_openvaa-local printenv <NAME>` call was made for a single variable other than the four the plan names, with its output discarded to `/dev/null`. Nothing was printed or kept and nothing was learned from it.

### Not observed

- **The spec was never run against an open stack.** That it is red there follows from S1 (both requests answered 200 before the change), not from a run of the spec.
- **The second assertion of each test is weaker than the first.** `getAuthUserByEmail` reads the first page of the admin user list and treats a failed listing as an empty one. The 422 with `signup_disabled` is the assertion that discriminates.

## Issues Encountered

None in Tasks 4 to 7. In Task 1 the first `before` probe fell inside a DarkWake interval of the host and was made again under `caffeinate` (S1).

## Threat Flags

None. The plan adds no endpoint, no auth path and no schema.

One observation for the operator, outside this phase's hygiene scan: `170-allowlist-probe.sh`, which this plan runs as directed, reads the auth container's environment listing through `docker inspect` and a `grep` for one variable. It prints one line, the redirect allowlist, and no secret; but it is not the one-named-variable form PROH-174-29 requires of this phase's own scripts.

## Known Stubs

None.

## User Setup Required

Done at the checkpoint on this host. On any other host: the functions' environment file is created from `apps/supabase/supabase/functions/.env.example`, whose `SITE_URL`, `SMTP_HOST` and `SMTP_PORT` are `http://localhost:5173`, `inbucket` and `1025`, and the stack is restarted once.

## What every later plan must know

- **A change under `apps/supabase/supabase/functions/` or to `config.toml` needs a stack restart followed by both probes:** `yarn db:stop`, `yarn db:start`, then `bash …/170-allowlist-probe.sh after` and `bash …/174-stack-probe.sh after`. The gate set's `stack` row runs the second.
- **The gate set now has fifteen rows.** `auth-config` and `stack` exist from this plan on; a run that needs only some rows names them with `--rows`.
- **The default suite's baseline for comparisons is still `174-01-baseline`,** with `--except auth-service-contract=2`.
- **The served project of the local edge runtime is the default project** (`00000000-0000-0000-0000-000000000001`), read by name. A probe that calls a function as a caller needs a grant on that project, as `174-mail-probe.mjs` does.
- **The bank-auth flows are unaffected** by closed sign-up and required confirmation: both projects hold the counts they had before the change (S7).
- **`claim_invitations` may rely on `auth.users.email_confirmed_at` on the local stack.** On a hosted project that is true only when its dashboard matches; the fail-closed check of the served settings is 174-05's.

## Next Phase Readiness

Ready for 174-04. The local stack is up with the configuration live, seeded with the `default` dataset; no dev server is running; nothing listens on 5273, 8777 or 9443.

## Self-Check: PASSED

Verified after writing: the four created files and this summary exist; each of the nine `(174-03)` commits is an ancestor of HEAD; `git status --short` shows no change of this plan's outside `.planning/`.
