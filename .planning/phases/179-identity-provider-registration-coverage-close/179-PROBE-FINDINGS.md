# Phase 179 — Probe Findings

What the running local stack does with each recipe this phase builds on, measured once by `179-probe.mjs` before
anything was built. Every verdict line below is copied from the probe's output exactly as printed, alone on its
line. A plan chooses its branch from these lines and from nothing else.

- **Rows p1–p7, p9:** `node 179-probe.mjs p1,p2,p3,p4,p5,p6,p7,p9`, started 2026-10-21T19:50:27Z, at head
  a95211e60. Log `tests/e2e-runs/179-unit/179-02-probe.log`, exit `0`.
- **Row p8:** `node 179-probe.mjs p8`, started 2026-10-21T19:51:11Z, at head a95211e60. Log
  `tests/e2e-runs/179-unit/179-02-p8.log`, exit `0`.
- **The stack probe after p8:** `bash 179-stack-probe.sh`, exit `0` ("every row OK or EQUAL"). Log
  `tests/e2e-runs/179-unit/179-02-stack-probe.log`.
- **What was running:** the auth service answered as `v2.197.0`, and `config.toml` `[auth.email]` read
  `double_confirm_changes = true` and `enable_confirmations = true`. The host was on AC power for both runs.
- **Budget and cleanup:** 20 link verifications were made, as announced, against a limit of 28. The cleanup of
  each run passed (12 users of the probe found and removed, 0 left; 0 in the p8 run).
- **What the probe prints:** statuses, codes, booleans, counts and times. It printed no address, token, link or
  claim value.

## P1 — the three-call recipe for a placeholder account

```
PASS p1.01 — a placeholder account as today: created
PASS p1.02 — the account before — read: true; email_confirmed_at set: true
PASS p1.03 — email_change_current with newEmail — issued: true, status 200, code none; a token hash came back: true (as assumed)
PASS p1.04 — email_change_new with newEmail — issued: true, status 200, code none; its action_link carries a token: true (as assumed)
PASS p1.05 — the current token by POST /verify type email_change — status 200, body code 200, error code none, a session came back: false (as assumed)
PASS p1.06 — after the current token — the address is still the placeholder: true; the pending address is the typed one: true (as assumed)
PASS p1.07 — the new link's token by verifyOtp type email_change — an error came back: false, status 200, code none, a session came back: true (as assumed)
PASS p1.08 — the account afterwards — email is the typed address: true; new_email empty: true; email_confirmed_at unchanged: true (as assumed)
PASS p1.09 — mails the catcher holds 3 s later — to the placeholder: 0; to the typed address: 0 (as assumed)
```

P1: held

**Observed:**
- Both links issue with status 200.
- The current token single-confirms: 200, no session, address unchanged and the typed address pending.
- The new link's token then completes the change: a session, `email` equal to the typed address, `new_email`
  empty, `email_confirmed_at` unchanged.
- The catcher holds no mail for either address 3 s later.

**Inferred:**
- That the browser-level landing of the mailed link through the frontend callback completes the same way. This
  stays inferred until plan 179-14's test runs.
- That no mail arrives after the 3 s wait. This rests on the no-op Send Email hook.

## P2 — the new-address link alone

```
PASS p2.01 — a fresh placeholder account as today: created
PASS p2.02 — email_change_new alone — issued: true, status 200, code none; its action_link carries a token: true
PASS p2.03 — the new link's token by verifyOtp type email_change — an error came back: false, status 200, code none, a session came back: false (as assumed)
PASS p2.04 — the account afterwards — the address changed to the typed one: false; it is still pending: true (as assumed)
```

P2: single-confirm

P2-VERIFYOTP: no-error no-session

**Observed:**
- supabase-js `verifyOtp` resolves with no error and a null session on the single-confirmation answer.
- The address does not change and stays pending.

**Inferred:** how the frontend callback treats that answer. Today's default arm would redirect as if the change
were complete.

## P3 — a second triple against the first new-address link

```
PASS p3.01 — a fresh placeholder account as today: created
PASS p3.02 — the first triple: email_change_current issued: true, status 200, code none; a token hash came back: true
PASS p3.03 — the first triple: email_change_new issued: true, status 200, code none; its action_link carries a token: true
PASS p3.04 — the first triple: the current token by POST /verify type email_change — status 200, body code 200, error code none, a session came back: false
PASS p3.05 — the second triple: email_change_current issued: true, status 200, code none; a token hash came back: true
PASS p3.06 — the second triple: email_change_new issued: true, status 200, code none; its action_link carries a token: true
PASS p3.07 — the second triple: the current token by POST /verify type email_change — status 200, body code 200, error code none, a session came back: false
PASS p3.08 — the first triple's new token by POST /verify — accepted: false, status 403, body code 403, error code otp_expired, a session came back: false (as assumed)
PASS p3.09 — the second triple's new token by POST /verify — accepted: true, status 200, body code none, error code none, a session came back: true (as assumed)
```

P3: first-refused

P3-SECOND: accepted

**Observed:**
- After a second triple, the first new-address token is refused with 403 `otp_expired`.
- The second triple's token completes the change with a session.

**Inferred:**
- That the same holds for a third or later triple.
- The link's lifetime (`otp_expiry`), which was not waited out.

## P4 — an address another account holds, and two accounts pending one address

```
PASS p4.01 — a real account holding a typed address: created
PASS p4.02 — a placeholder account asking for it: created
PASS p4.03 — email_change_current for the held address — status 422, code email_exists (as assumed)
PASS p4.04 — email_change_new for the held address — status 422, code email_exists (as assumed)
PASS p4.05 — placeholder account A: created
PASS p4.06 — placeholder account B: created
PASS p4.07 — A's triple: email_change_current issued: true, status 200, code none; a token hash came back: true
PASS p4.08 — A's triple: email_change_new issued: true, status 200, code none; its action_link carries a token: true
PASS p4.09 — A's triple: the current token by POST /verify type email_change — status 200, body code 200, error code none, a session came back: false
PASS p4.10 — B's first triple: email_change_current issued: true, status 200, code none; a token hash came back: true
PASS p4.11 — B's first triple: email_change_new issued: true, status 200, code none; its action_link carries a token: true
PASS p4.12 — B's first triple: the current token by POST /verify type email_change — status 200, body code 200, error code none, a session came back: false
PASS p4.13 — B's second triple: email_change_current issued: true, status 200, code none; a token hash came back: true
PASS p4.14 — B's second triple: email_change_new issued: true, status 200, code none; its action_link carries a token: true
PASS p4.15 — B's second triple: the current token by POST /verify type email_change — status 200, body code 200, error code none, a session came back: false
PASS p4.16 — A's new token — status 200, body code none, error code none, a session came back: true; A's address changed: true (as assumed)
PASS p4.17 — B's newest token, the address now A's — status 500, body code 23505, error code none, a session came back: false; B's address changed: false
PASS p4.18 — B's first token, made invalid by its second triple — status 403, body code 403, error code otp_expired, a session came back: false
```

P4-ISSUE: 422 email_exists

P4-ISSUE-NEW: 422 email_exists

P4-RACE: 500 none

P4-INVALID: 403 otp_expired

P4-DISTINGUISHABLE: yes

**Observed:**
- Issuing either email-change link for an address another account holds answers 422 `email_exists`.
- Two placeholder accounts can both hold the same pending address.
- The first to verify gets the address. The second's verification answers 500 with no `error_code`, its body's
  numeric `code` is 23505 (the database's unique-violation code), and its address does not change.
- An invalidated token answers 403 `otp_expired`, which differs from the race in both status and code.

**Inferred:**
- That a 500 from an `email_change` verification means "the address was taken" and nothing else. Any other
  server failure of that endpoint would also answer 500.
- What supabase-js `verifyOtp` surfaces as the error's `code` for the race. It was presented here by a raw
  `POST /verify`, so this is not observed.

## P5 — the passwordless creation recipe

```
PASS p5.01 — generateLink invite for a placeholder — status 200, code none; a user came back: true
PASS p5.02 — updateUserById with app_metadata and email_confirm — status 200, code none
PASS p5.03 — private.user_password_set before the magic link — false (as assumed)
PASS p5.04 — a magiclink for the account's current address — issued: true, status 200, code none
PASS p5.05 — the magic link verified — an error came back: false, status 200, code none, a session came back: true (as assumed)
PASS p5.06 — private.user_password_set after the magic link — false (as assumed)
PASS p5.07 — email_confirmed_at set — true (as assumed)
PASS p5.08 — the control: a placeholder account as today: created
PASS p5.09 — the control's private.user_password_set — true (as assumed)
```

P5: held

P5-CONFIRMED: yes

**Observed:**
- An account made by `generateLink invite`, then `updateUserById` with `app_metadata` and `email_confirm`,
  reads `private.user_password_set` false both before and after its magic link is verified.
- The account is confirmed.
- The `createUser` control reads true.

**Inferred:** that the same holds when the invite call also carries `data` (the user metadata names), which the
probe did not send.

## P6 — which token of the new-address link verifies

```
PASS p6.01 — a fresh placeholder account as today: created
PASS p6.02 — the recipe up to the current token: email_change_current issued: true, status 200, code none; a token hash came back: true
PASS p6.03 — the recipe up to the current token: email_change_new issued: true, status 200, code none; its action_link carries a token: true
PASS p6.04 — the recipe up to the current token: the current token by POST /verify type email_change — status 200, body code 200, error code none, a session came back: false
PASS p6.05 — the new link's hashed_token and its action_link token are equal: false
PASS p6.06 — the new link's hashed_token by POST /verify type email_change — status 403, body code 403, error code otp_expired, a session came back: false (as assumed)
PASS p6.07 — the action_link's token by POST /verify type email_change — status 200, body code none, error code none, a session came back: true (as assumed)
```

P6: action-link-token

**Observed:**
- For `email_change_new`, the response's `hashed_token` differs from the `token` parameter of its `action_link`.
- `hashed_token` is refused with 403 `otp_expired`.
- The `action_link` token completes the change with a session.

**Inferred:** nothing beyond the row.

## P7 — a session across a change of address

```
PASS p7.01 — a fresh placeholder account as today: created
PASS p7.02 — a magiclink for the placeholder — issued: true, status 200, code none
PASS p7.03 — signed in by the magic link on an anon client — status 200, code none, a session came back: true
PASS p7.04 — the recipe from the service role: email_change_current issued: true, status 200, code none; a token hash came back: true
PASS p7.05 — the recipe from the service role: email_change_new issued: true, status 200, code none; its action_link carries a token: true
PASS p7.06 — the recipe from the service role: the current token by POST /verify type email_change — status 200, body code 200, error code none, a session came back: false
PASS p7.07 — the new link's token by verifyOtp on another anon client — status 200, code none, a session came back: true; the address changed: true
PASS p7.08 — getUser with the access token from before the change — status 200, code none, the same user: true (as assumed)
PASS p7.09 — refreshSession with the refresh token from before the change — status 200, code none, a session came back: true (as assumed)
```

P7: survives

**Observed:** after the change completed elsewhere, the access token and the refresh token issued before it both
still work, for the same user.

**Inferred:** that the frontend's cookie session behaves the same, and that a page reading the user before and
after shows the new address without a new sign-in.

## P8 — the serve-and-restore cycle of the edge runtime

```
PASS p8.01 — a scratch directory was made outside the repository: true
PASS p8.02 — the Edge file was generated from the committed test keys and the tracked template — tsx exit 0; file and issuer present: true
PASS p8.03 — the served identity-callback — the edge container carries the generated issuer: true; OPTIONS 200; ready: true after 2 s
PASS p8.04 — the function server stopped: true
PASS p8.05 — after the stop the edge container is: absent
PASS p8.06 — yarn db:start alone — exit 0 after 2 s; then the edge container is: absent; OPTIONS account-access 503, identity-callback 503, send-email 503
PASS p8.07 — yarn db:stop — exit 0 after 5 s; yarn db:start — exit 0 after 24 s; 29 s together
PASS p8.08 — after db:stop and db:start the edge container is: running; OPTIONS account-access 200, identity-callback 200, send-email 200
PASS p8.09 — the db logs, filtered: tests/e2e-runs/179-unit/179-probe-p8-1792612272-1e4cee.{db-start-alone,db-stop,db-start}.log
```

P8: stop-start-needed

P8-SERVE: 2 s

P8-RESTORE: 29 s

**Observed:**
- The served function carried the generated issuer and answered OPTIONS within 2 s.
- Stopping the serve removed the edge container.
- `yarn db:start` alone exited 0 in 2 s without bringing the container back. Its filtered log lists the edge
  runtime among "Stopped services", and all three functions answered 503.
- `yarn db:stop` then `yarn db:start` (29 s together) restored the container, with every function answering 200.
- The stack probe exited 0 afterwards.

**Inferred:** that the times are of the same order on another host or on the CI runner.

## P9 — a null value in `app_metadata`

```
PASS p9.01 — a fresh placeholder account as today: created
PASS p9.02 — updateUserById with the key set — status 200, code none; the key reads as set: true
PASS p9.03 — updateUserById with the key null — status 200, code none; the key is absent: true; it holds null: false; the other keys are kept: true
```

P9: null-removes

**Observed:**
- `updateUserById` with a key set to null removes that key from `app_metadata`.
- The update merges, so the other keys stay.

**Inferred:** nothing beyond the row.

## What follows

Each line names the plans that read the row and the branch they build, as `179-EXECUTION-RULES.md` § *The probe
rows, and what rests on each* assigns it.

- **P1 held:**
  - Plans 179-10, 179-14 and 179-19 build on the three-call recipe.
  - Plan 179-10 mails the new-address link of the three-call recipe.
  - The phase does not stop, and the fallback (`double_confirm_changes = false`) is not taken.
- **P2 single-confirm, no-error no-session:**
  - Plan 179-19 builds the guard: a verified `email_change` with no session is a failure.
  - The guard is built either way. The row confirms it is needed, because `verifyOtp` reports no error.
- **P3 first-refused:**
  - Plan 179-10's third mail keeps "only the newest link works".
  - Every resend repeats all three calls.
- **P4-ISSUE 422 email_exists:** plan 179-10 answers `in-use` when either issue call answers 422 `email_exists`.
- **P4-DISTINGUISHABLE yes:**
  - Plan 179-19 shows A's `emailTaken` without a session (PL-13), not `authError`.
  - The race answers 500 and an invalid token 403 `otp_expired`.
  - This rests on a 500 being read as "taken". That reading is inferred, so the plan records it as a flagged
    assumption.
- **P5 held:**
  - Plan 179-13 builds the invite recipe (J2): `generateLink invite`, then `updateUserById` with `app_metadata`
    and `email_confirm: true`, then the magic link.
  - F's predicate needs the address proved.
  - The phase does not stop.
- **P6 action-link-token:** plan 179-10's operation mails the `token` parameter of the `email_change_new` link's
  `action_link`, never `hashed_token`.
- **P7 survives:**
  - Plans 179-14 and 179-19 record it as a residual: a session issued before the change still works after it.
  - No code changes.
- **P8 stop-start-needed:**
  - Plan 179-05's wrapper restores the stack by `yarn db:stop` then `yarn db:start`, about 29 s per run on this
    host.
  - `yarn db:start` alone leaves no edge runtime.
- **P9 null-removes:** plans 179-09 and 179-13 build PL-09's strip. Each sign-in through the function sends
  `hetu: null` and `birthdate: null` in its `app_metadata` update, which removes the two stale claim keys.
