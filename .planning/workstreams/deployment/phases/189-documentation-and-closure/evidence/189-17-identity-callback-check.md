# 189-17 — the identity-callback closing check (G-04) and the hosted-auth asks (G-03)

Measured 2026-11-20 on `feat/deployment-terraform-supabase`, HEAD `9a4b7f479` before this plan.
Every line number below was read with `grep -n` today against the tree; none is copied from an
earlier record. Nothing in this plan called `identity-callback` or any hosted endpoint: the hosted
half of item (c) is plan 189-05's probe run of 2026-11-20 (`S1_READ_AT=2026-11-20T13:34Z`, 22 of 22
`PASS`), recorded in `evidence/189-05-staging-reads.md`.

G04_MEASURED_AT=2026-11-20

## (a) Every reply is a fixed result, never a caught message

`identity-callback/index.ts` builds its answers in two places only (`grep -n 'Response'` finds
lines 77-78 and 190). Line 77, `respond(result, token)`, serialises `resultBody(result, token)` of
`requestContract.ts`. That function (line 123) passes its argument through `asResult` (line 75),
which answers `unavailable` for any value outside the closed set `IDENTITY_CALLBACK_RESULT`
(line 30). It returns `{ result }`, or `{ result, token }` for a success given a token (lines
128-129). No argument of `respond` carries text, so nothing caught can reach a body. The one other
`new Response` (line 190) answers the CORS preflight with the literal `ok`. It is not an error reply
and carries no result.

The reply sites, one per `return`:

G04_REPLY=apps/supabase/supabase/functions/identity-callback/index.ts:190 ok (OPTIONS preflight, a fixed literal, not a result)
G04_REPLY=apps/supabase/supabase/functions/identity-callback/index.ts:194 bad_request (method other than POST)
G04_REPLY=apps/supabase/supabase/functions/identity-callback/index.ts:200 refused (no x-identity-callback-secret header)
G04_REPLY=apps/supabase/supabase/functions/identity-callback/index.ts:203 refused (secret presented does not match)
G04_REPLY=apps/supabase/supabase/functions/identity-callback/index.ts:211 configuration (unknown IDENTITY_PROVIDER_TYPE; the type is logged at line 210, not returned)
G04_REPLY=apps/supabase/supabase/functions/identity-callback/index.ts:219 bad_request (body is not JSON)
G04_REPLY=apps/supabase/supabase/functions/identity-callback/index.ts:222 bad_request (body fails parseIdentityCallbackRequest)
G04_REPLY=apps/supabase/supabase/functions/identity-callback/index.ts:236 invalid_token (JWE decryption failed; the error is logged, not returned)
G04_REPLY=apps/supabase/supabase/functions/identity-callback/index.ts:256 invalid_token (JWT verification failed; only code, claim and reason are logged)
G04_REPLY=apps/supabase/supabase/functions/identity-callback/index.ts:266 invalid_token (claim extraction failed; logged, not returned)
G04_REPLY=apps/supabase/supabase/functions/identity-callback/index.ts:281 mode_not_allowed (registration mode refused for the type)
G04_REPLY=apps/supabase/supabase/functions/identity-callback/index.ts:353 created|found|no_entity with token (result from findOrCreateOutcome, ownEntity.ts:77, which throws on any answer outside FIND_OR_CREATE_RESULTS)
G04_REPLY=apps/supabase/supabase/functions/identity-callback/index.ts:357 configuration|unavailable (the catch arm; the result is chosen by the error's code alone at line 358, the error is logged at line 356)

The messages interpolated with `${error.message}` (index.ts lines 160, 278, 299, 327, 333, 347)
are the text of `failure(...)` throws. All of them are caught by the arm at line 354, logged and
answered by line 357 without their text.

G04_OPAQUE=yes

## (b) Both providers key accounts on `sub`, and the frontend copies agree

G04_MATCH_PROP=apps/supabase/supabase/functions/identity-callback/claimConfig.ts:43 signicat-ftn sub
G04_MATCH_PROP=apps/supabase/supabase/functions/identity-callback/claimConfig.ts:48 idura-ftn sub
G04_MATCH_PROP=apps/frontend/src/lib/api/utils/auth/providers/signicat.ts:40 signicat-ftn sub
G04_MATCH_PROP=apps/frontend/src/lib/api/utils/auth/providers/idura.ts:39 idura-ftn sub

`claimConfig.ts:87` reads the match value as `payload[config.identityMatchProp]`, and nothing else
of the token keys an account. No `identityMatchProp` in the four files names `birthdate` or
`ftn_sub`. Those two names appear only in doc comments that forbid them (claimConfig.ts lines 36 and
39, signicat.ts line 37). `birthdate` also appears in the frontend's `extractClaims` (signicat.ts:41,
idura.ts:40): claims returned to the caller and stored nowhere, not a match key. The Deno copy
extracts `given_name` and `family_name` as names (claimConfig.ts:44-45 and 49-50).

G04_MATCH_AGREES=yes

## (c) The gateway verifies no JWT for the function, locally and on the hosted project

`[functions.identity-callback]` is at `config.toml:431`, and its `verify_jwt` is on line 436.

G04_VERIFY_JWT=apps/supabase/supabase/config.toml:436 false

The hosted half is from plan 189-05's probe on the persistent (staging) project.
`functions.verify-jwt` (`infra/scripts/probe/checks.mjs:441`, `verifyJwtCheck` at line 175)
compares each function's served `verify_jwt` with `config.toml`.
`functions.identity-callback-unverified` (checks.mjs:474) holds that a keyless GET is answered
`400 bad_request` and a keyless POST of `{}` is answered `401 refused`, so the gateway lets an
unverified call through to the function, which refuses it.

G04_HOSTED_VERIFY_JWT=PASS 189-05 2026-11-20 (S1_CHECK_functions.verify-jwt=PASS, S1_READ_AT=2026-11-20T13:34Z)
G04_HOSTED_UNVERIFIED=PASS 189-05 2026-11-20 (S1_CHECK_functions.identity-callback-unverified=PASS, S1_READ_AT=2026-11-20T13:34Z)

## (d) No guard holds the frontend and Deno claim configurations equal

The search, run 2026-11-20:

```
git grep -n -E "claimConfig|identityMatchProp" -- '*.test.ts'
git grep -n -E "identity-callback/claimConfig|PROVIDER_CONFIGS" -- apps/frontend packages tests infra
git grep -n -E "providers/(signicat|idura)|SIGNICAT_FTN_AUTH_CONFIG|IDURA_FTN_AUTH_CONFIG" -- apps/supabase packages tests infra
```

The first search finds three test files: `identity-callback/claimConfig.test.ts` (lines 51 and 73
pin each Deno provider's `identityMatchProp` to the literal `'sub'`), and `providers/signicat.test.ts`
(line 128) and `providers/idura.test.ts` (line 130), which each pin the frontend's own copy. None of
them imports both copies. The second search finds only a doc comment in `signicat.ts:37` that names
its twin. The third search finds only a runbook table row (`tests/IDURA-TEST-RUNBOOK.md:290`). Each
copy is pinned to literals on its own side: the frontend tests compare the whole `authConfig` with
`toEqual`, and the Deno tests pin `identityMatchProp` to `'sub'`. A change made to one copy and to
that copy's own test passes every test while the other copy is left as it was. No test compares the
two, so the copies are kept equal by hand.

G04_DRIFT_GUARD=none

Filed: `.planning/todos/pending/2026-11-20-189-identity-callback-claim-config-drift-guard.md`.

## G-03 — the hosted-auth todo's three unobserved asks

The hosted-auth todo (`2026-10-07-174-hosted-project-auth-settings-allowlist-and-function-variables.md`)
left three asks unobserved on any hosted project: the Email OTP Length (update 2026-10-22, review fix
A, 174 WR-03), the `identity-callback` secret checks (update 2026-10-22, plan 179-15), and the shared
per-address sign-in budget (update 2026-10-22, 174 IN-04 / 178 IN-05). Each is settled below by a
probe row of plan 189-05 on the persistent (staging) project, or moved with its check to
`.planning/todos/pending/2026-11-20-189-pre-launch-auth-checks-on-the-production-project.md`.

**The OTP length.** `auth.other-settings` (`infra/scripts/probe/checks.mjs:412`) compares every key
of the `auth` block of `infra/modules/supabase/hosted-settings.json` with the Management API's served
auth config, except the two keys checked alone (`AUTH_KEYS_CHECKED_ALONE`, checks.mjs:299:
`disable_signup`, `mailer_autoconfirm`). `mailer_otp_length` is one of the keys it compares
(hosted-settings.json:21, value 10; the local `[auth.email] otp_length = 10` is at config.toml:265).
The row passed, so the served length is 10. The module writes the setting, so the dashboard's label
no longer has to be found and read.

G03_OTP_LENGTH=observed 189-05 S1_CHECK_auth.other-settings=PASS 2026-11-20 (mailer_otp_length 10 served on the persistent project)

**The `identity-callback` secret.** The 2026-10-22 update asks for four observations. Only the first
is settled by a row: a keyless POST is answered `401 {"result":"refused"}`. That is the second
clause of `functions.identity-callback-unverified` (checks.mjs:474: POST of `{}` with no key, `401`,
`refused-result`), and index.ts:200 refuses a request without the header before it reads the
configured secret. The rest is moved: the secret set to one value on both sides, a POST carrying a
wrong secret refused (index.ts:203), the unset function secret answered `500 configuration` with the
variable named in the log, the unset frontend variable ending the sign-in on `configuration_error`,
and the sign-in completing with both set. None of it can be observed on staging today: bank
authentication is not wired on the AWS task, and `function-secrets.tf` sets no
`IDENTITY_CALLBACK_SERVER_SECRET` (`.planning/todos/pending/2026-11-20-189-bank-authentication-on-the-aws-task.md`).

G03_CALLBACK_SECRET=observed 189-05 S1_CHECK_functions.identity-callback-unverified=PASS 2026-11-20 (keyless POST refused 401); moved: secret on both sides, wrong-secret POST, unset-secret answers, completed sign-in

**The shared sign-in budget.** No probe row reads it. Settling it means sending failing sign-ins from
one client and a correct one from another network, which writes to the auth service's rate-limit
state and is not a read. Moved. The fuller procedure is in
`.planning/todos/pending/2026-10-26-179.1-deployment-measure-the-shared-sign-in-budget-on-a-hosted-project.md`,
which stays open.

G03_SIGNIN_BUDGET=moved
