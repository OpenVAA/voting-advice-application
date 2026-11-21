# Phase 178 — probe findings

What the running local auth service does with the tokens of mailed links, with an account that has no
password and with a password set on a link session. Written from the output of `178-probe.mjs`; every line
in a code block below is a line the script printed, unchanged.

## The run

| | |
|---|---|
| Command | `node 178-probe.mjs p1,p2,p3,p4,p7`, under `caffeinate`, in the background |
| Started | 2026-10-12T16:26:43Z |
| Exit status | 0 — every step was made |
| Tree | `ffd376a1c` (the commit that adds the probe); nothing outside `.planning/` differs from the base commit |
| Auth service | GoTrue `v2.197.0`, as its health endpoint answered |
| Client library | `@supabase/supabase-js` 2.117.2, one in-memory client per presentation |
| Project | the seed's default project |
| Password sign-ins made | 27, all of row p7 — against a limit of 30 in five minutes, budgeted at 28 |
| Link verifications made | 14, in rows p1 to p4 (6, 5, 2, 1) — against a separate limit of 30 in five minutes, budgeted at 28 |
| Cleanup | 14 users of the probe found and deleted; 0 left; 0 invitations naming an address of the probe |
| Evidence | `tests/e2e-runs/178-unit/178-02-probe.log` and `.exit` (gitignored) |

The run was made once. No row was run again.

```
178-probe: rows p1,p2,p3,p4,p7, started 2026-10-12T16:26:43.342Z
BUDGET 27 password sign-in(s) and 14 link verification(s); at most 28 of each, counted separately (the stack admits 30 of each in five minutes)
PASS 0 the stack — both keys and the database's address captured; the auth service answers as version v2.197.0
PASS cleanup — 14 user(s) of the probe found; 0 removal(s) refused; 0 left; 0 invitation(s) naming an address of the probe
PASS count — 27 password sign-in(s) and 14 link verification(s) were made; 27 and 14 were announced
178-probe: every step was made
```

**How to read a step.** `PASS` says the step was made and that what its line states was observed; `FAIL`
would say it could not be made. "(as assumed)" and "(NOT as assumed)" set the observation against what the
row assumes; either is a `PASS`, because a row is a measurement. "Password set" is
`private.user_password_set` read with `psql` as the database's owner role. "The stored value is unchanged"
compares a short digest of the stored value that the database computed before and after the act; the digest
is never printed.

**The three kinds of account.** *With a password*: an admin `createUser` with `email_confirm` and a random
password of sixteen characters. *By the recipe*: the two calls of the `account-access` function —
`generateLink` with the type `invite`, then `generateLink` with the type `magiclink`, for the same address.
*Identity-provider-shaped*: an admin `createUser` with `email_confirm` and no password.

## Row P1 — the recovery link

```
PASS p1.01 — an account with a password: created
PASS p1.02 — an account with a password: password set before the recovery link — true
PASS p1.03 — an account with a password: a recovery link from the service role — issued: true, status 200, code none (as assumed)
PASS p1.04 — an account with a password: the recovery token verified as recovery — a session came back: true, status 200, code none (as assumed)
PASS p1.05 — an account with a password: password set after the verification — true; the stored value is unchanged: true (as assumed)
PASS p1.06 — an account with a password: the same recovery token presented a second time — refused: true, status 403, code otp_expired (as assumed)
PASS p1.07 — an account made by the recipe, never signed in: created
PASS p1.08 — an account made by the recipe, never signed in: password set before the recovery link — false
PASS p1.09 — an account made by the recipe, never signed in: a recovery link from the service role — issued: true, status 200, code none (as assumed)
PASS p1.10 — an account made by the recipe, never signed in: the recovery token verified as recovery — a session came back: true, status 200, code none (as assumed)
PASS p1.11 — an account made by the recipe, never signed in: password set after the verification — false; the stored value is unchanged: true (as assumed)
PASS p1.12 — an account made by the recipe, never signed in: the same recovery token presented a second time — refused: true, status 403, code otp_expired (as assumed)
PASS p1.13 — an address with no account: a recovery link asked of the service role — issued: false, status 404, code user_not_found; users for the address afterwards: 0 (as assumed)
PASS p1.14 — a fresh account made by the recipe: created
PASS p1.15 — the sign-in token verified as magiclink — a session came back: true, status 200, code none (as assumed)
PASS p1.16 — the same sign-in token presented a second time — refused: true, status 403, code otp_expired (as assumed)
```

The row's summary lines, as printed:

```
P1: held
P1-EXPIRY: 3600 s configured; not observed
```

**Observed:** for an account with a password and for a recipe account that had never signed in, a recovery
link issued by the service role verifies as `recovery` to a session; the password fact and the stored value
are the same before and after; a second presentation of each recovery token, and of a sign-in token, is
refused with 403 `otp_expired`; a recovery link asked for an address with no account answers 404
`user_not_found` and leaves no user. **Inferred, not observed:** the lifetime of a link — 3600 is what
`config.toml` states under `[auth.email]`, read by the script, and no step aged a link or compared the
running service with the file; that a recipe account which *has* signed in behaves as the never-signed-in one
did (row p3 shows its password fact, not its recovery link); and that a recovery link in a browser, through
the callback, behaves as the direct verification did.

## Row P2 — the two kinds of link against each other

```
PASS p2.01 — (i) an account with a password, and its link(s) issued in the order magiclink, then recovery
PASS p2.02 — (i) the earlier sign-in token presented after a recovery link was issued — refused: true, status 403, code otp_expired (as assumed)
PASS p2.03 — (ii) an account with a password, and its link(s) issued in the order recovery, then magiclink
PASS p2.04 — (ii) the earlier recovery token presented after a sign-in link was issued — refused: true, status 403, code otp_expired (as assumed)
PASS p2.05 — (iii) an account with a password, and its link(s) issued in the order magiclink, then recovery
PASS p2.06 — (iii) the later recovery token presented first — accepted: true, status 200, code none
PASS p2.07 — (iii) the sign-in token presented after the recovery token was opened — refused: true, status 403, code otp_expired (as assumed)
PASS p2.08 — (iv) an account with a password, and its link(s) issued in the order magiclink
PASS p2.09 — (iv) a sign-in token presented with the type recovery — accepted: true, status 200, code none
```

The row's summary lines, as printed:

```
P2: held
P2-TYPE: interchangeable
```

**Observed:** a later link of either kind stops an unopened earlier one of the other kind, in both orders
(i, ii); the later link itself still works (iii, first presentation); and a sign-in token is accepted when
it is presented with the type `recovery` (iv). The refusal of a superseded token carries the same status and
code as the refusal of a spent one, 403 `otp_expired`. **Inferred, not observed:** that *opening* one link
stops the other. Step (iii) cannot tell it apart from (i): the sign-in token it presents second had already
been superseded when the recovery link was issued, so its refusal is explained by (i) alone, and since a
later link always replaces the earlier, two live links of different kinds for one account cannot be made on
this service at all. The cause — one token slot per account for both kinds — is the research's reading of
the service's source and is consistent with every step here, not shown by them. The reverse of (iv), a
recovery token presented as `magiclink`, was not a step of the row.

## Row P3 — the truth table of "password set"

```
PASS p3.01 — the recipe's account: created
PASS p3.02 — the recipe's account before its first verification — password set: false (as assumed)
PASS p3.03 — the recipe's account: its sign-in token verified as magiclink — a session came back: true, status 200, code none
PASS p3.04 — the recipe's account after its first verification — password set: false (as assumed)
PASS p3.05 — an account created with a password: created
PASS p3.06 — an account created with a password — password set: true (as assumed)
PASS p3.07 — an identity-provider-shaped account: created
PASS p3.08 — an identity-provider-shaped account — password set: true (as assumed)
PASS p3.09 — the recipe's account: a password set on its link session — status 200, code none
PASS p3.10 — the recipe's account after the password was set — password set: true (as assumed)
PASS p3.11 — a second recipe account: created
PASS p3.12 — a second recipe account: password set before — false; a recovery link issued: true, status 200, code none
PASS p3.13 — a second recipe account: its recovery token verified as recovery — a session came back: true, status 200, code none
PASS p3.14 — a second recipe account after a recovery token was verified — password set: false; the stored value is unchanged: true (as assumed)
```

The row's summary lines, as printed:

```
P3: held
P3-IDP: set
P3-RECOVERY: unchanged
```

| Account, and when | Password set |
|---|---|
| by the recipe, before its first verification | false |
| by the recipe, after its sign-in token is verified | false |
| created with a password | true |
| identity-provider-shaped (`createUser`, confirmed, no password) | true |
| by the recipe, after `updateUser` with a password on its link session | true |
| by the recipe, never signed in, after a recovery token is verified | false, stored value unchanged |

**Observed:** all six states of the table, each read from the database through
`private.user_password_set`. **Inferred, not observed:** that an account the `identity-callback` function
itself creates reads as the identity-provider-shaped one did — the probe made the same `createUser` call
without the function's two metadata arguments and did not invoke the function; and the two origins the row
does not hold, an account whose `invite` token is verified and an account the suite's own helper registers,
which stand on the research's citation.

## Row P4 — a password set on a link session

```
PASS p4.01 — a recipe account: created
PASS p4.02 — its sign-in token verified on a client that keeps the session in memory — a session came back: true, status 200, code none
PASS p4.03 — claim_invitations read with the link session — status 200, password_set: false, claimed 0, skipped 0 (as assumed)
PASS p4.04 — a password of sixteen characters set on that session — updated: true, status 200, code none (as assumed)
PASS p4.05 — the client's access token after the update — present: true; its digest differs from the earlier one: false
PASS p4.06 — claim_invitations read by a second client holding the access token as it was before the update — refused: false, status 200, password_set: true, claimed 0, skipped 0 (as assumed)
```

The row's summary line, as printed:

```
P4: held
```

**Observed:** on a link session, `updateUser` with a password answers 200; the client's access token is the
same token afterwards (its digest did not change); and a read of `claim_invitations` made with the access
token exactly as it was before the update is answered 200 with `password_set` true, having claimed and
skipped nothing. **Inferred, not observed:** the cookie-level behaviour in a browser — that the server's
client, reading the cookies the browser client wrote, sees the same session after the update — until the
tracer's test runs; and the behaviour under `secure_password_change = true`, which this stack does not set.
The fallback step (`refreshSession()`) was not made, because the row held.

## Row P7 — the password sign-in's answers and timings

```
PASS p7.01 — an account with a password: created
PASS p7.02 — an account made by the recipe, never signed in: created
PASS p7.03 — an address with no account: 9 sign-ins — statuses {400}; codes {invalid_credentials}; least 5.3 ms, median 6.1 ms, greatest 8 ms
PASS p7.04 — an account with a password, a wrong password: 9 sign-ins — statuses {400}; codes {invalid_credentials}; least 62.7 ms, median 65.1 ms, greatest 67.9 ms
PASS p7.05 — an account with no password: 9 sign-ins — statuses {400}; codes {invalid_credentials}; least 11.7 ms, median 13 ms, greatest 15.3 ms
```

The row's summary lines, as printed:

```
P7: difference
P7-ANSWERS: one status: true; one error code: true; each median inside the other two ranges: false
```

| Case | Statuses | Error codes | Least | Median | Greatest |
|---|---|---|---|---|---|
| an address with no account | 400 | `invalid_credentials` | 5.3 ms | 6.1 ms | 8.0 ms |
| an account with a password, a wrong password | 400 | `invalid_credentials` | 62.7 ms | 65.1 ms | 67.9 ms |
| an account with no password | 400 | `invalid_credentials` | 11.7 ms | 13.0 ms | 15.3 ms |

**Observed:** the twenty-seven answers share one status and one error code, so the body tells nothing; the
three cases' timings do not overlap at all — the nine times of each case lie wholly outside the ranges of
the other two — and a wrong password for an account that has one took about ten times as long as an address
with no account. **Inferred, not observed:** the cause (that the service compares a password hash only when
the account stores one); that the difference survives a network between the caller and the service — it was
measured on the loopback interface of one host, nine attempts a case, interleaved; that the sign-in screen's
action shows the same difference, which was not measured because that action does not exist yet and adds no
step before this call; and the timing for a recipe account that *has* signed in, since the row's account
with no password had not.

## What follows

Taken from the table of `178-EXECUTION-RULES.md` § *The probe rows, and what rests on each* and, where a
line says what a named plan builds, from that plan's own ruling on its row (178-06, 178-07, 178-14, 178-19,
178-23); nothing here is decided by this file.

- **P1 is held** — plans 178-06, 178-07 and 178-19 build the first branch: the recovery link's own type is verified as it is. `recovery_link_request` answers `recovery` for a grant-holder whether or not the account has a password (178-06); the function's recovery arm mints with the type `recovery` (178-07); the callback is not edited (178-19). The other branch — every link verified as `magiclink`, and `recovery` answered only for an account whose password is set — is not built.
- **P1-EXPIRY reads 3600** — plan 178-20 pins that value under `[auth.email]` in the auth-configuration gate and has the stack probe compare the running service with the file; plan 178-23 names it among a hosted project's settings. Until 178-20 the lifetime is a value read from a file.
- **P2 is held** — plan 178-06 gives the recovery request and the sign-in request one shared slot, and the texts of plans 178-10 and 178-06 say that only the newest mail works. Both would have been built either way; with the row held they are accurate and not merely cautious.
- **P3 is held, and P3-IDP reads set** — the phase goes on. Plans 178-04, 178-12, 178-14 and 178-22 rest on an account with an empty password that the two-call recipe makes and keeps through its first sign-in; an identity-provider-shaped account stores a password and does not meet the set-password gate, so plan 178-14 is not stopped before its Task 2.
- **P4 is held** — plan 178-14 passes the set-password gate by a rerun of the loads (`invalidateAll()`), as the terms gate does; the adapter's `_setPassword` gains no `refreshSession()` and the gate does not leave by a full page load. Plan 178-19's reset page leaves by a client-side navigation that reruns the loads.
- **P7 reads difference** — plan 178-23 writes the fourth item under `Known residuals` in the authentication page, with the three triples of the table above: a residual of the auth service's own endpoint, reachable with the anon key whatever a screen does, stated and never claimed closed.
- **Rows P5 and P6** are not rows of this run: they change the stack's configuration and are written and run by plan 178-20, which appends their lines here.

## Observations that no row's verdict carries

- **A token's type is not bound to the kind of link it was minted as** (`P2-TYPE: interchangeable`, step p2.09). The type a link's address names decides where the callback lands, not what the service accepts.
- **A spent token and a superseded token are refused alike**, 403 `otp_expired`: the service's answer cannot say which happened.
- **`updateUser` with a password did not change the client's access token** (step p4.05), on a Node client that keeps its session in memory. A comment above `_setPassword` in the Supabase data writer says that the call rotates the access token; the probe did not see that. A browser client was not observed.
- **Whether the two limits bind on the local stack was not observed**: no call was answered 429, at 27 sign-ins and 14 verifications.

## Row FN — the recovery operation of the `account-access` function

Added by plan 178-07, after the function gained the operation `request-recovery`. Every line in a code block
below is a line the script printed, unchanged.

| | |
|---|---|
| Command | `node 178-probe.mjs fn`, under `caffeinate`, in the background |
| Started | 2026-10-12T18:37:58Z |
| Exit status | 0 — every step was made |
| Tree | `b65999c8d` with the eight files of the function uncommitted, as commit `1e21146b6` then held them: `index.ts` had the digest recorded in `178-07-mutant-held.sha` before and after |
| Stack | this project's stack, restarted 21 seconds before by `yarn db:stop` and `yarn db:start` (both exit 0); `178-stack-probe.sh` read every row OK or EQUAL after it, the function's row `200 accepted` / `names it` |
| Project | the seed's default project |
| Password sign-ins made | 3 — one for each grant holder, to claim its invitation on its own session |
| Link verifications made | 1 — the mailed recovery token |
| Cleanup | 4 users of the probe found and deleted; 4 invitations removed; 0 left of either; 7 witnesses and 4 mails removed |
| Evidence | `tests/e2e-runs/178-unit/178-07-fn.log` and `.exit` (gitignored) |

The run was made once. No step was made again.

```
178-probe: rows fn, started 2026-10-12T18:37:58.304Z
BUDGET 3 password sign-in(s) and 1 link verification(s); at most 28 of each, counted separately (the stack admits 30 of each in five minutes)
PASS 0 the stack — both keys and the database's address captured; the auth service answers as version v2.197.0
PASS cleanup — 4 user(s) of the probe found; 0 removal(s) refused; 0 left; 4 invitation(s) removed; 0 invitation(s) naming an address of the probe; 7 witness(es), 0 slot(s) and 4 mail(s) of its requests removed
PASS count — 3 password sign-in(s) and 1 link verification(s) were made; 3 and 1 were announced
178-probe: every step was made
```

**How the row is built.** A *grant holder* is an account created with a password by the service role whose
(project, editor) invitation, seeded by the service role, is claimed through `claim_invitations` on the
account's own password session. Every request of the function carries a completion witness, and nothing is
read of a request's effect before its witness has finished. The expected subjects are read from
`mailTemplates.ts` in the tree. "The same answer" is status 200 with a body deep-equal to `{"accepted":true}`.

```
PASS fn.01 — the subjects of the two mails were read from the function's module in the tree
PASS fn.02 — the first grant holder: an account with a password, its invitation seeded and claimed on its own session
PASS fn.03 — the first grant holder: password set before the request — true
PASS fn.04 — the first grant holder: a recovery request — status 200, the accepted body: true, answered in 11 ms (as assumed)
PASS fn.05 — the first grant holder: the witness of that request read sent (as assumed)
PASS fn.06 — the first grant holder: mails for the address — 1; the subject is the English recovery subject: true; it is not the sign-in subject: true (as assumed)
PASS fn.07 — the first grant holder: the mail holds one link, the same in its html and its text: true; it has the path of the English callback, exactly the parameters token_hash and type, the type recovery and no fragment: true (as assumed)
PASS fn.08 — the first grant holder: the mailed token verified as recovery — a session came back: true, status 200, code none (as assumed)
PASS fn.09 — the first grant holder: password set after the verification — true; the stored value is unchanged: true (as assumed)
PASS fn.10 — the first grant holder: users for the address after the request — 1 (as assumed)
PASS fn.11 — the first grant holder, asked again straight after: the same answer: true, in 4 ms; the witness read not-sent; mails for the address — 1 (as assumed)
PASS fn.12 — an address with an open invitation and no account: its invitation seeded; users for the address before the request — 0
PASS fn.13 — an address with an open invitation and no account: the same answer: true, in 12 ms; the witness read sent; mails for the address — 1; the subject is the English sign-in subject: true; its one link is of the type magiclink on the English callback: true (as assumed)
PASS fn.14 — an address with neither an account nor an invitation: the same answer: true, in 9 ms; the witness read not-sent; mails for the address — 0; users for the address — 0 (as assumed)
PASS fn.15 — the second grant holder: an account with a password, its invitation seeded and claimed on its own session
PASS fn.16 — the second grant holder: a link request — the same answer: true; its witness read sent; then at once a recovery request — the same answer: true, in 9 ms; its witness read not-sent; mails for the address — 1; the one mail is the sign-in mail: true (as assumed)
PASS fn.17 — the third grant holder: an account with a password, its invitation seeded and claimed on its own session
PASS fn.18 — the third grant holder, asked with the Origin and X-Forwarded-Host of another site: the same answer: true; the witness read sent; mails for the address — 1; the link's origin equals the origin of the first mail's link: true; the link names the other site nowhere: true (as assumed)
PASS fn.19 — the third grant holder, asked in the locale fi: the subject is the Finnish recovery subject: true; its one link is of the type recovery on the Finnish callback: true (as assumed)
PASS fn.20 — the answers: 7 answers of the function, the first among them, were set against the first — each has its status and a body deep-equal to its body: true; answered in 4 to 12 ms (as assumed)
```

The row's summary line, as printed:

```
FN: held
```

**Observed:** for an account that holds a grant, a recovery request is answered 200 with the accepted body,
its witness reads `sent`, exactly one mail arrives with the English recovery subject, the mail's one link has
the path of the English callback and exactly the parameters `token_hash` and `type=recovery`, the token
verifies as `recovery` to a session, and the password fact and the stored value are the same before and
after; a second request inside the minute is answered alike, reads `not-sent` and leaves one mail; an address
with an open invitation and no account is answered alike and gets the sign-in mail with a link of the type
`magiclink`; an address with neither is answered alike, reads `not-sent`, gets no mail and no account; a
recovery request made at once after a link request for the same grant holder reads `not-sent` and the one
mail is the sign-in mail; a request carrying another site's `Origin` and `X-Forwarded-Host` is mailed a link
with the origin of the first mail's link that names the other site nowhere; a request in the locale `fi` is
mailed the Finnish recovery subject and a link to the Finnish callback; seven answers of the function were
equal in status and body, returned in 4 to 12 ms. **Inferred, not observed:** that the answers' timings
carry nothing — seven requests on the loopback interface are not a measurement of timing, and the property
rests on the handler returning before its work, which the conformance test pins by source and three mutants
showed it refuses; that a recovery link opened in a browser, through the callback, behaves as the direct
verification did (plan 178-19); that the slot is given back after a failed mint or a failed send, which the
unit cases show and no live step made happen; and the reverse order of the shared slot — a recovery request,
then at once a link request — which is asserted at the database (file 39, Section 23) and was not a step here.

**Observed beside the row:** the function's row of the stack probe read `200 accepted` / EQUAL *before* the
restart too. `config.toml` sets the edge runtime's policy to `per_worker`, which reloads a function's source
when a file changes, so the running runtime already served the operation from the working tree. On this
configuration a change to a function's source is served without a restart; the restart was made as the plan
lays it out, and both readings are in `tests/e2e-runs/178-unit/178-07-stack-before.log` and
`178-07-stack-after.log`. The functions' environment and the auth configuration were not changed by this
plan, so nothing here says whether those need the restart.

## Rows P5 and P6 — the password length and the mail hook (plan 178-20)

Run on 2026-10-14 by plan 178-20 against the local stack. `p5pre` ran at 20:57:14Z, after the last reset of
the database (Task 2's, at about 20:55Z) and immediately before `yarn db:stop` (20:57:51Z); `yarn db:start`
ended at 20:58:31Z; `p5,p6` ran at 20:58:56Z. No reset was made between `p5pre` and `p5`. Logs:
`tests/e2e-runs/178-unit/178-20-p5pre.log` and `178-20-probe.log`.

Before the restart the stack probe read the running auth service at `GOTRUE_PASSWORD_MIN_LENGTH` 6 and
`GOTRUE_HOOK_SEND_EMAIL_ENABLED` false against the tree's 8 and true (DIFFERS), although the database had been
reset twice since the edits: the auth service reads `[auth]` and its hook tables only when the stack starts.
After the restart all four auth rows read EQUAL, `otp_expiry` 3600 among them
(`178-20-stack-before.log`, `178-20-stack.log`).

### Row P5 — the minimum password length

```
PASS p5pre.01 — the row's address read: no account holds it
PASS p5pre.02 — an administrator's createUser with a password of 7 characters, on the configuration the service started with — status 200, code none
PASS p5.01 — the account the row p5pre made: found
PASS p5.02 — a fresh account with a password of sixteen characters: created and signed in
PASS p5.03 — the user's own update to a password of 7 characters — refused: true, status 422, code weak_password (as assumed)
PASS p5.04 — the user's own update to a password of 8 characters — accepted: true, status 200, code none (as assumed)
PASS p5.05 — an administrator's createUser with a password of 7 characters — refused: true, status 422, code weak_password (as assumed)
PASS p5.06 — a password sign-in with the 7-character password the account had before the restart — status 200, code none (as assumed)
```

The account of the fourth step, as the row `p5pre` printed it, and the row's summary line:

```
P5-PRE: created
P5: held
```

**Observed:** the account at the fixed address `r178-probe-p5pre@…` was created by an administrator's
`createUser` with a password of seven characters on the service as it had run since its last start (minimum
6), after the last reset and before the restart, and the run's cleanup kept it; the row `p5` found it after
the restart. On the restarted service (minimum 8): the user's own `updateUser` to seven characters is refused
422 `weak_password`, to eight is accepted 200; an administrator's `createUser` with seven is refused 422
`weak_password`; a password sign-in with the seven-character password the account already had answers 200.
The length binds the setting of a password, by the user and by the service role, and no sign-in with an
older, shorter password. **Inferred, not observed:** that a password set through the recovery page's
`updateUser` is bound the same way (the same endpoint as the user's own update, on a recovery session);
that the hosted service binds alike — its dashboard holds its own copy of the setting.

### Row P6 — the auth service under a no-op mail hook

```
PASS p6.01 — an account with a password for the link and the change of address: created
PASS p6.02 — generateLink of the type magiclink — status 200, code none; a token came back: true (as assumed)
PASS p6.03 — its token verified as magiclink — a session came back: true, status 200, code none (as assumed)
PASS p6.04 — an account with a password for the service's own requests: created
PASS p6.05 — the service's own one-time-code request, create_user false — an address with an account: status 200, code none; an address without: status 422, code otp_disabled
PASS p6.06 — the service's own recovery request — an address with an account: status 200, code none; an address without: status 200, code none
PASS p6.07 — the user's own change of address on that session — status 200, code none
PASS p6.08 — an address with an open invitation: its invitation seeded
PASS p6.09 — the function's link request for it — status 200; the witness read sent; mails for the address — 1 (as assumed)
PASS p6.10 — a grant holder: an account with a password, its invitation seeded and claimed on its own session
PASS p6.11 — the function's recovery request for it — status 200; the witness read sent; mails for the address — 1 (as assumed)
PASS p6.12 — mails the catcher holds after the service's own four requests — the address with an account: 0; the address without: 0 (as assumed)
PASS p6.13 — mails the catcher holds after the change of address — the old address: 0; the new address: 0 (as assumed)
```

The row's summary lines, as printed:

```
P6: held
P6-OTP: distinguishes
P6-EMAIL-CHANGE: no mail
```

**Observed:** with `[auth.hook.send_email]` configured to `public.send_email_hook` and the stack restarted,
`generateLink` of the type magiclink answers 200 with a token and the token verifies to a session; the
service's own one-time-code request (`create_user` false) answers 200 for an address with an account and
422 `otp_disabled` for one without — **the hook does not change that answer, so the endpoint still tells a
registered address from an unregistered one**; the service's own recovery request answers 200 for both; the
user's own change of address answers 200; the account-access function's link request and recovery request
each read `sent` and each address holds exactly one mail; and five seconds after the service's last request
the catcher holds no mail for the address with an account, the address without, the old address or the new
one. **Inferred, not observed:** that without the hook those four requests and the change of address would
have mailed (no control run without the hook was made by this plan; the 200 answers say the service took
the requests, and a mail the service hands over is handed over before it answers); that a mail of the
service's other kinds (an invitation through `inviteUserByEmail`, a reauthentication) is held back alike —
the hook is called for every mail the service would send, and no such request was made; and the change of
address itself was not followed further — under the hook no confirmation reaches either address, so an
address change asked through the service cannot be completed by a user.
