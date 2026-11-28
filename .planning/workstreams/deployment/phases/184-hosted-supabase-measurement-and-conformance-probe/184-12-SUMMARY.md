---
phase: 184-hosted-supabase-measurement-and-conformance-probe
plan: 12
subsystem: infra
tags: [infra, supabase, hosted, throwaway, edge-functions, gateway, verify_jwt, api-keys, observations]
status: complete

requires:
  - "184-11: the throwaway holds 00001, the settings with both hooks on and the seven function secrets; the linked work directory is kept"
provides:
  - "The three functions deployed and ACTIVE on the throwaway begckvkapaopoztbreqc, verify_jwt false for identity-callback alone"
  - "The dated call-shape record of the hosted gateway (OBS-03) and what the legacy anon and publishable keys work for"
  - "Verdict lines D09_TRIGGER=yes, D04_FAILS_CLOSED=yes, D12_LEGACY_ANON=works"
  - "Six dated runbook Observations rows; the deploy-symlink row settled"
affects: [184-14, 184-15, 184-16, 184-23]

actuals:
  tokens: 3425
  tasks: 2
  commits: 1
plan_head_before: d5938c622416fca14ab894ee622759bffbc4d2fc
plan_head_after: a59fe3b91031f4c9212d69312889d15e8c70eece

tech-stack:
  added: []
  patterns:
    - "Keys reach curl only through `-K -` on standard input, written by the printf builtin, so no key appears on a command line"
    - "The answering party is classified by jq against the function's fixed bodies; a gateway answer prints only its sanitised code and message"

key-files:
  created:
    - .planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/evidence/184-12-throwaway-functions-and-gateway.md
  modified:
    - infra/envs/staging/supabase/README.md

key-decisions:
  - "D09_TRIGGER=yes: the hosted gateway refuses an apikey-only call to a verify_jwt function with 401 UNAUTHORIZED_NO_AUTH_HEADER, so 184-14 declares verify_jwt = false for account-access (2026-11-10)"
  - "D04_FAILS_CLOSED=yes: the served identity-callback answers GET 405 and POST {} 500 with its own fixed bodies; no fix needed (2026-11-10)"
  - "D12_LEGACY_ANON=works: the legacy anon key works for REST, auth and function calls, so the project stays on legacy keys; the publishable key also passed the gateway's JWT check on the Authorization header (2026-11-10)"

requirements-completed: []  # OBS-03 is recorded here, but working-or-changed account-access is shown by 184-14 and 184-15; SUPA-05 and SUPA-13 close on the persistent project's runs

duration: about 20 min of agent work across two runs (checkpoint 2026-11-10T13:05Z, reply 2026-11-10T13:14Z)
completed: 2026-11-10
---

# Phase 184 Plan 12: The throwaway's functions, the gateway's call shapes, and the key verdicts Summary

D09_TRIGGER=yes
D04_FAILS_CLOSED=yes
D12_LEGACY_ANON=works

**On the hosted gateway, a call with the anon key in `apikey` alone does not reach a function served with `verify_jwt` true.** The gateway itself answers 401 `UNAUTHORIZED_NO_AUTH_HEADER`. A call with any Bearer header reaches the function: the legacy anon JWT does, and so does the publishable key, which is not a JWT. `identity-callback` fails closed on the served function. The legacy anon key works for every call measured.

## Performance

- **Duration:** about 20 min of agent work. The checkpoint was raised at 2026-11-10T13:05:09Z (attempt `20261110T130509Z.d5938c622`), and the reply was received at 2026-11-10T13:14Z.
- **Completed:** 2026-11-10
- **Tasks:** 2 of 2
- **Files modified:** 2

## Accomplishments

- **Deploy (Step 17).**
  - `s17_deploy_exit=0` from the linked work directory: the CLI followed the symbolic link to `functions`.
  - The Management API lists `account-access`, `identity-callback` and `send-email` as `ACTIVE`, with `verify_jwt=false` for `identity-callback` alone, as `config.toml` declares.
- **Call shapes (OBS-03):**
  - **`account-access`:**
    - (a) `apikey` only: 401 from the gateway.
    - (b) `apikey` with Bearer anon: 200 and the function's own `{"status":"unknown"}`.
    - (c) the publishable key in both headers: 200 and the function's own body.
  - **`send-email`:**
    - (a) `apikey` only: 401 from the gateway.
    - (b) with Bearer anon: 405 and the function's own body.
- **Fails closed (D-04).** `identity-callback`, called with `apikey` and no Authorization header, answered the GET with 405 and the POST of `{}` with 500 and `{"error":"Internal server error"}`. Both bodies are the function's own.
- **Keys (D-12).** Both keys, legacy anon and publishable, in `apikey` and the Bearer header: REST `elections` answered 200 and auth `settings` answered 200.
- **`check-code` reached the database.** It answered 200 `unknown` through the platform-provided service-role key.
- **Runbook.**
  - Six dated Observations rows (2026-11-10) cover the deploy, each gateway shape, the refusal of `identity-callback` and the reach of each key.
  - The row "The CLI follows the symbolic links of the linked work directory when it deploys" left "Not yet observed".

## Task Commits

1. **Task 1: the operator deploys and calls.** This was a human-action checkpoint with no commit. The reply is stored under `OPERATOR_REPLY=received attempt=20261110T130509Z.d5938c622 plan=184-12 task=1 head=d5938c622…`, and the screen accepted it on the first `put`.
2. **Task 2: the evidence, the verdicts and the runbook rows.** Commit `a59fe3b91`.

## Decisions Made

- **D09_TRIGGER=yes.**
  - The trigger holds on its first arm: the gateway refused shape (a).
  - Its second arm does not hold, because (c) also passed, so the legacy JWT is not the only shape that gets through.
  - Plan 184-14 changes `config.toml` for `account-access`.
- **D04_FAILS_CLOSED=yes.** Nothing to fix in this phase.
- **D12_LEGACY_ANON=works.**
  - The project stays on the legacy keys, and no FUT-02 checkpoint is raised.
  - The dashboard's retirement date, "early 2027" (184-10), is added to the FUT-02 todo by 184-23, which owns that file.
  - The service-role shapes are judged in 184-15 and 184-16.

## Deviations from Plan

### Executor additions to the operator commands (Rules 2 and 3)

**1. Guard lines and key-shape lines were added before the deploy.**
- **Guard lines:** `s0_ref`, `s0_linked_ref`, `s0_functions_linked`, `s0_docker_exit` and `s0_project_id`.
- **Key-shape lines:** `s0_access_shape`, `s0_anon_shape` and `s0_pub_shape`. They confirm which key sits in which variable without printing a value.

**2. Step 17's own logs-removal item was dropped**, so that the logs stay until item 6.
- A conditional `s17_deploy_err=` block was offered for a failed deploy. It was not needed.

**3. Keys reach curl only through `-K -` on standard input.**
- They are written by the `printf` builtin through two helpers, `hk` and `hb`.
- Gateway answers are reduced to `code` and `message`, stripped to `[A-Za-z0-9 ._-]` and cut to 80 characters, so no body text with a colon or an equals sign reaches a paste.

**4. An `s5_curl_errors=` line was added**, so that a transport failure is not read as a gateway answer.

### Operator-reported

**5. The secrets block ran twice.**
- The first run's last prompt ended without a newline.
- The second run set all three variables, as the shape lines confirm.

---

**Total deviations:** 4 executor additions and 1 operator-reported.

**Impact:** none on the measurements.

## Issues Encountered

None.

## User Setup Required

None. The three functions stay deployed on the throwaway for the sittings that follow.

## Next Phase Readiness

- **184-14:** `D09_TRIGGER=yes`.
  - Declare `[functions.account-access]` `verify_jwt = false` in `config.toml` and widen the parity guard to `functions.*`.
  - Redeploy, then measure shapes (a) and (b) again. Shape (a) is expected to reach the function then.
- **184-15 and 184-16:** judge the service-role shapes.
  - The legacy anon key and the publishable key both work for REST, auth and functions on this project.
- **184-23:** add the retirement date, "early 2027", to the FUT-02 todo.

## Self-Check: PASSED

- The evidence file is present.
  - It names `Attempt: 184-12-1 20261110T130509Z.d5938c622` and `Attempt: 184-12-2 20261110T131417Z.d5938c622`.
  - It holds the three verdict lines, each on a line of its own.
- The Task 2 automated check exits 0: the reply is bound, and every required status line is present. The attempt file holds three `status=ACTIVE` lines.
- `prettier --check infra/envs/staging/supabase/README.md` exits 0.
- Commit `a59fe3b91` is an ancestor of HEAD.
- Secret scan of the evidence file and the runbook:
  - no JWT, `sb_`/`sbp_` key or IPv4 address
  - no address other than the sender's
  - the disposable user's address appears in no file
