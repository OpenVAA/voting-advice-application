---
phase: 179-identity-provider-registration-coverage-close
plan: 10
subsystem: account-access
tags: [edge-function, identity-provider, email-change, address-confirmation, mail-templates, throttle, vitest, e2e]
status: complete

requires:
  - phase: 179-identity-provider-registration-coverage-close
    provides: "179-02: probe rows P1 held, P3 first-refused, P4 422 email_exists, P6 action-link-token; 179-03: public.address_confirmation_request and invitation_link_release; 179-08: account-access/placeholderAddress.ts"
provides:
  - "account-access operation confirm-address: { operation, project_id, email, locale } with the caller's own access token in Authorization; answers { result: 'sent' | 'in-use' | 'refused' } (200) or { error: 'unauthenticated' } (401)"
  - "$FN/contract.ts: ConfirmAddressRequest, AddressConfirmationOutcome, ADDRESS_SENT_BODY, ADDRESS_IN_USE_BODY, ADDRESS_REFUSED_BODY, UNAUTHENTICATED_BODY, addressConfirmationAnswer"
  - "$FN/addressConfirmation.ts: confirmAddress, AddressConfirmationDeps, CallerAccount, EmailChangeKind, EmailChangeTokens, bearerToken, callerTokenRefused, identityProviderOf, actionLinkToken, isSingleConfirmation"
  - "$FN/mailTemplates.ts: ADDRESS_CONFIRMATION_MAIL_TEMPLATES (seven locales), renderAddressConfirmationMail; $FN/signInLink.ts: LINK_TYPES gains 'email_change'"
  - "179-stack-probe.sh row 12: confirm-address with no caller, EQUAL at 401 unauthenticated"
affects: [179-14, 179-18, 179-19]

tech-stack:
  added: []
  patterns:
    - "An operation that answers after its work, to the caller its own bearer token names, with its whole decision in a pure module over injected effects"
    - "One mail transport function shared by both dependency factories of the handler"

key-files:
  created:
    - apps/supabase/supabase/functions/account-access/addressConfirmation.ts
    - apps/supabase/supabase/functions/account-access/addressConfirmation.test.ts
  modified:
    - apps/supabase/supabase/functions/account-access/contract.ts
    - apps/supabase/supabase/functions/account-access/contract.test.ts
    - apps/supabase/supabase/functions/account-access/mailTemplates.ts
    - apps/supabase/supabase/functions/account-access/mailTemplates.test.ts
    - apps/supabase/supabase/functions/account-access/signInLink.ts
    - apps/supabase/supabase/functions/account-access/signInLink.test.ts
    - apps/supabase/supabase/functions/account-access/index.ts
    - apps/supabase/supabase/functions/account-access/flowConformance.test.ts
    - .planning/todos/pending/2026-10-21-179-native-speaker-review-identity-provider-strings.md
    - .planning/phases/179-identity-provider-registration-coverage-close/179-stack-probe.sh

key-decisions:
  - "P1 held: the three-call recipe (email_change_current, email_change_new, the current token verified by POST /auth/v1/verify) is the only route; the current link is verified by its hashed_token, as P1 observed"
  - "P6 action-link-token: the mailed link carries the token parameter of the email_change_new action_link, never its hashed_token; the choice is made in the pure module, not in the handler"
  - "P3 first-refused: the mail keeps 'only the newest link you asked for works' in all seven locales, in each locale's sign-in-mail words; every request repeats all three calls"
  - "P4 422 email_exists: in-use when either link answers email_exists; the address's slot is given back, the account's slot never"
  - "The current token's verification must be the single confirmation (200, no session); a session there throws and the request is refused"
  - "A missing token and a token the auth service refuses (401/403) are unauthenticated; any other failure to read the caller is refused"
  - "Task 2 was executed before Task 1: the recipe module imports the confirmation mail and the email_change link type"

requirements-completed: []

actuals:
  tokens: 20034
  tasks: 3
  commits: 4
plan_head_before: dd794d6817a1b2ec9b22ba59be7cbf0e602b09a2
plan_head_after: 504479e8b03e5df3322ff913f1364caf37b8d405

metrics:
  duration: "about 50 minutes (01:08 to 01:58 UTC, 2026-10-22)"
  completed: 2026-10-22
---

# Phase 179 Plan 10: The address-confirmation operation of account-access Summary

`account-access` now has a fifth operation, `confirm-address`. A signed-in account that an identity provider made, still on its placeholder address, sends an address it typed. The function reads the caller from their own bearer token and takes the account's slot and the address's slot. It then asks the auth service for the two links of a change of address, verifies the current address's link itself, and mails the typed address a seven-locale, impersonal confirmation mail. The typed address becomes the account's only when that link is opened. It answers `sent`, `in-use`, `refused` or 401 `unauthenticated`. Nothing in the application calls it yet. The served operation was also driven end to end on the stack (below).

## Tasks

| Task | Commit | What |
|---|---|---|
| 2 (run first) | 7c81e3f0c | `feat`: the confirmation mail in seven locales (`ADDRESS_CONFIRMATION_MAIL_TEMPLATES`, `renderAddressConfirmationMail`), `LINK_TYPES` gains `email_change`, the review todo lists the mail by locale |
| 1 | 13f16f9c3 | `feat`: the `confirm-address` request, its four answers, and `confirmAddress` over injected effects |
| 3 | 7973f63c3 | `feat`: the handler wires the operation; the conformance assertions |
| 3 (probe row) | 504479e8b | `chore`: the stack probe's `confirm-address` row |

## Red runs (under `tests/e2e-runs/179-unit/`)

Both were made against stubs that export the names and answer wrongly, captured with the JUnit reporter and classified with `gsd-tools check tdd-red-evidence`.

| Run | Head | Exit | Failed / total | Classifier | Target |
|---|---|---|---|---|---|
| `179-10-t2-red` | dd794d681 | 1 | 20 / 290 | **RED_EVIDENCE_OK** | the English mails > the address-confirmation mail reads as written |
| `179-10-t1-red` | 7c81e3f0c | 1 | 45 / 162 | **RED_EVIDENCE_OK** | confirmAddress: the whole recipe > asks the effects in the order current link, new link, verify the current token, send, and answers sent |

The first `t2-red` classification named the target without its `describe` prefix and was refused as `no_target_test_failure`. It was re-run under the same label with the full JUnit name. The cases that passed in each red run are the ones a wrong stub happens to satisfy. In t2 these were the per-locale "newest link" sentence, which the stub's sign-in text holds, and the completeness cases. In t1 they were the refusal cases, which an always-refusing stub satisfies.

## The probe branches as built

- **P1 held.** The recipe is `generateLink` `email_change_current`, then `generateLink` `email_change_new`, both from the account's current address to the trimmed typed one. Then the current link's `hashed_token` is verified with `POST /auth/v1/verify` `{ type: 'email_change' }` and the anon key. The verification must be the single confirmation: 200 and no session (`isSingleConfirmation`). Any other answer throws and is `refused`.
- **P3 first-refused.** The mail's "only the newest link you asked for works" stays in all seven locales. A test holds it to the sign-in mail's own first sentence in each locale. Every request repeats all three calls.
- **P4 422 email_exists.** Either link answering `email_exists` gives `in-use`. The address's slot is given back; the account's slot is not.
- **P6 action-link-token.** The mailed `token_hash` is the `token` parameter of the `email_change_new` `action_link` (`actionLinkToken`). The pure module picks it, so a unit case asserts it.

## The operation, served (observed on the running stack, `179-10-operation-probe.log`)

The edge runtime served the working tree. A scratch probe (`scratchpad/179-10-operation-probe.mjs`) drove the operation through `/functions/v1/account-access` with four synthetic accounts. It made three link verifications and four password sign-ins.

| Step | Observed |
|---|---|
| No `Authorization` header | 401 `unauthenticated` |
| The anon key as the bearer | 401 `unauthenticated` (`getUser` answers 403 `bad_jwt`) |
| An account no identity provider made | 200 `refused` |
| A typed address on the placeholder domain | 200 `refused` |
| An identity-provider account, a fresh address, locale `fi` | 200 `sent`. One mail to the typed address: the `fi` confirmation subject, link on the configured SITE_URL origin, path `/fi/api/auth/callback`, with exactly `token_hash` and `type=email_change`, the link in the html too. 0 mails to the placeholder. The account still on the placeholder with the typed address pending. |
| The same address again at once | 200 `refused` (the address's slot); still one mail |
| An address another account holds | 200 `in-use`; 0 mails to it |
| The mailed link opened (`verifyOtp` `email_change`) | no error, a session; the account's address is the typed one and nothing is pending |
| The same account asks again, its address proved | 200 `refused` |
| A second account asks twice for one address, 62 s apart | `sent` both times. The two links differ. The first link opened is refused with `otp_expired`; the second gives a session and completes the change. |

Cleanup: 4 probe users deleted, 3 mails removed.

**Inferred, not observed:** that the frontend callback lands the mailed link the same way in a browser. That is 179-14's test.

## The carried item: can a signed-in user set `email_change` directly?

Measured (`179-10-probe-1.log`, scratch `179-10-probe.mjs`) with a placeholder account naming an identity provider, signed in by a probe-only password, calling `PUT /auth/v1/user` with its own access token:

- With an address another account holds: **422 `email_exists`**.
- With a fresh address: **200**. The account's `email` stays the placeholder, the typed address is pending, `email_change_sent_at` is set.
- `get_user_entities.pending_email_taken` read `false` with the pending address free and **`true`** after another account was created holding it.
- Three more fresh addresses: **429 `over_email_send_rate_limit`** each (`[auth.rate_limit] email_sent = 2` per hour).
- The held address once more, after the 429s: **422 `email_exists`**. The duplicate check comes before the rate limit.

**What this means:**

- **The operation's own guarantee holds.** A direct update leaves the address pending. Its tokens go to the no-op Send Email hook, so nobody receives a link, and the address cannot be completed that way. Nothing in `account-access` writes an address. A typed address becomes an identifier only through the link this operation mails.
- **The "no oracle" premise does not hold at deployment level.** The auth service answers `email_exists` to `PUT /auth/v1/user`, before and after its own email rate limit. So it tells any signed-in account, identity-provider or not, whether an address is held, without limit. The per-account `confirm:` slot of 179-03 bounds this operation's `in-use` answer only. It does not bound the auth service.
- **`pending_email_taken` is not the oracle.** The address can be learned from the auth service directly, and more cheaply. A direct update can also set the pending address the key reads (once per hour per deployment while the rate limit holds), so the key can reflect a pending address this operation did not set.
- **Routed to the verifier and the operator.** A deployment-level control (a gateway rule on `PUT /auth/v1/user` with an `email` body, or accepting the residual) is outside this plan.

## Conformance assertions added (`flowConformance.test.ts`, 53 cases)

- The `confirm-address` branch returns `answerAddressConfirmation(request, bearerToken(req.headers.get('Authorization')))`, with no `EdgeRuntime` hand-off. Its answer is built only by `addressConfirmationAnswer`, starting from `refused`.
- The handler reads `req.headers` once, for `Authorization`, inside that branch. Its header reads are exactly `response:location` and `req:Authorization`.
- `callerAccount` calls `admin.auth.getUser(token)` and nothing else names a user.
- `takeSlot` calls `address_confirmation_request` with `p_user_id`. `releaseSlot` calls `invitation_link_release` without `p_code`.
- The census of minted types is exactly `invite`, `magiclink`, `recovery`, `email_change_current` and `email_change_new`, with `generateLink(` four times.
- Over every non-test module: no `updateUserById(` call carries an `email` key, no `updateUser(`, and no `email_confirm`. A negative control appended a stray `updateUserById(id, { email })` to `index.ts` and the case went red; the file was restored and the suite was green again.
- Only the current token is verified, at `/auth/v1/verify`, with the anon key and no `Authorization` header. `deps.verifyCurrent(` is called once, with `current.hashedToken`, and the link carries `next.actionLinkToken`.
- The log rule holds in `addressConfirmation.ts`: every `say` call has a fixed message and at most `describeFailure(error|releaseError)`. The handler's one new `log` call has the same form. `JSON.stringify(` appears three times; the third is the verify body.
- Both dependency factories use the one `sendMail` function. `SITE_URL` is read once, through `configuredSiteUrl()`.

## Verification

- **Verify blocks, byte for byte** (`179-10-t{1,2,3}-verify.sh`): each exits 1 at the `yarn -s` stage ("Unsupported option name (-s)"). **Restated** (`yarn workspace @openvaa/supabase test:unit > /dev/null`, `-verify-restated.sh`): t1 exit 0 at 13f16f9c3, t2 exit 0 at 7c81e3f0c and again at 13f16f9c3. t3: see the close.
- `yarn workspace @openvaa/supabase test:unit`: 25 → 26 files, 889 → 1074 tests, green.
- `yarn lint:check` (`179-10-lint`, on the Task 3 tree): exit 0. That includes `assert:edge-function-env` (10 required names, unchanged; SITE_URL still a literal `requireEnv`).
- An ad hoc strict `tsc --noEmit` over the changed modules and their tests: 0 errors. No repository gate typechecks Edge Function files.
- `yarn assert:comment-hygiene`: 0 violations before every commit.
- **Held run** `179-e2e/179-10-held` (uncommitted Task 3 at 13f16f9c3): 569/569, wrapper exit 0, `restore: ok`. `node $P/179-verdict.mjs control 179-10-held --full --same-projects-as 179-07-close --dirty-only apps/supabase/supabase/functions/account-access/ --green`: **PASS**, 131 projects compared, 0 not as expected. Held copies `179-10-held.<path>.kept` were byte-identical (`cmp`) to what was committed.
- **Stack probe** (committed tree, after the held run's restore): exit 0. The new row read `401 unauthenticated / names it / EQUAL` (`179-10-stack-probe.log`).
- **Close** `179-e2e/179-10-close`, committed head 504479e8b: 569/569, driver exit 0, wrapper exit 0, `restore: ok`, on AC power at 80 % at both ends, 0 Sleep / Wake entries in the window. `node $P/179-verdict.mjs e2e 179-10-close --same-projects-as 179-10-held`: **PASS**, 131 projects compared, 0 not as expected. The plan adds no E2E test, so no `--except` was used.
- **Task 3 verify block** at 504479e8b: as written, exit 1 at `yarn -s`; restated, exit 0 (`179-10-t3-verify-restated-final`). It includes the held verdict, the stack probe and the close verdict. The t1 and t2 blocks restated also exit 0 at the final head.

## Code review checklist (`.agents/code-review-checklist.md`)

- **Solves the plan's issues:** yes, all three tasks. The operation was also observed working end to end on the stack.
- **OWASP:**
  - The caller comes only from their own bearer token, read by the auth service. The body names no user (T-179-103).
  - The answers are a closed set of four; any other runtime value is answered as `refused`.
  - No address is ever written to an account. Every link comes from `SITE_URL`, and the link is HTML-escaped in the html part.
  - The account's and the address's slot are both taken before the auth service is asked about the address (T-179-102, T-179-106).
  - The mail is impersonal (T-179-104).
  - No log line carries an address, token, link, locale or user id. The conformance test asserts this, and so do the unit cases, which feed failures that quote secrets (T-179-105, PROH-179-17).
  - **Found:** the auth service's own `PUT /auth/v1/user` is an unlimited address oracle (the carried item above). It is not introduced by this plan.
- **Code style, TSDoc, `any`:**
  - Every export is documented.
  - There is no `any` in the modules. Tests cast hostile values with `as unknown as`, as the existing tests do.
- **Repetition:**
  - The SMTP transport was moved out of `linkIssueDeps` into one `sendMail` function shared by both factories, and the `SITE_URL` read into `configuredSiteUrl()`.
  - `say` in `addressConfirmation.ts` is a five-line copy of the private `say` in `linkIssue.ts`, which is typed to `LinkIssueDeps`.
  - `UUID_PATTERN` is untouched.
- **Docs:**
  - No repository document was changed: the plan lists none, and nothing calls the operation yet.
  - Stale sentences are listed under *Items to report*.
- **Tracking events, Svelte, WCAG, keyboard:** not applicable (no UI).
- **Error handling:**
  - Every failure is a logged outcome, and `confirmAddress` never rejects.
  - The handler catches a failure to build the effects (for example an unset `SITE_URL`) and answers `refused`.
  - The edge-function item "descriptive error messages" is deliberately not met: the coarse answer is the security property.
- **Edge Functions section:**
  - The operation decides no project authority. It acts only on the account the caller's token names, so `user_can` is not asked.
  - The service-role client exists before the caller is read. Its first use is `getUser(token)`, which the auth service answers by the caller's token alone.
  - Read strictly, the checklist's "refuse before any service-role client exists" is not met when there is no token: the client object is built, and no call is made before `confirmAddress` answers `unauthenticated`.
- **Comment hygiene:** no ids, no history, 0 violations.
- **Commit history:** four commits, linear, no `[db]` (no schema change). The first one is formatting-clean.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `yarn -s` rejected by Yarn 4.18.1 in all three verify blocks**
- **Fix:** both forms are kept. As written, each block exits 1 at that stage. Restated as `yarn workspace … test:unit > /dev/null`, each exits 0.

**2. [Rule 3 - Blocking] Task 2 executed before Task 1**
- **Issue:** Task 1's recipe module builds the `email_change` link and renders the confirmation mail. Both are Task 2's.
- **Fix:** Task 2 was committed first (7c81e3f0c), then Task 1 (13f16f9c3). Each red run was made at the head before its own task.

**3. [Rule 2 - Correctness] The current token's verification must be the single confirmation**
- **What was added:** `verifyCurrent` throws unless the verification answers 200 with no session (`isSingleConfirmation`).
- **Why:** a session there would mean the change completed without the mailed link.
- **Effect:** none on P1's observed path. This is a guard.

**4. [Rule 2 - Correctness] A refused token is told apart from an outage**
- `callerAccount` answers null, which is `unauthenticated`, only for a 401 or 403 from the auth service.
- Any other failure throws, which is `refused`, so an outage does not tell a signed-in caller their session is gone.

**5. [Rule 2 - Correctness] A `SITE_URL` that cannot carry a link refuses before the slot is taken.** This is an extra step before the slot, and no effect is asked.

**6. [Judgement] `CallerAccount` carries no `new_email`.** The plan lists the account's pending address among what `callerAccount` answers, but no step of the operation decides on it. It was left out rather than carried unused.

**7. [Judgement] The conformance test was restructured where the handler's shape changed.**
- `dependencyBody` takes the factory's name.
- The two mail cases read the shared `sendMail` function.
- These counts were raised: `generateLink(` 3 → 4, `p_project_id` 5 → 7, `JSON.stringify(` 2 → 3, `email_exists` 1 → 2.
- Header reads gained `req:Authorization`.
- Each changed count is matched by a case that names what the new occurrence is.

**8. [Procedural] A committed intermediate state.** At 13f16f9c3 the contract parses `confirm-address`, but `index.ts` has no branch for it yet. A `confirm-address` body would have fallen through to the code check. Nothing calls the operation, the stack had not restarted onto that commit, and 7973f63c3 adds the branch. It is recorded here for the verifier.

**Files touched that the plan did not list:** none. The 12 files changed between `plan_head_before` and `plan_head_after` are exactly `files_modified`. Evidence under `tests/e2e-runs/` is gitignored, and the probe scripts are in the session scratchpad.

## Items to report rather than edit

- **The auth service is an address oracle to every signed-in account** (the carried item, measured above).
  - `PUT /auth/v1/user` answers 422 `email_exists` for a held address, before and after its own rate limit.
  - D-07's "behind the throttle" and the T-179-102 mitigation hold for this operation only.
  - Settle: verifier, then operator (a gateway rule, or the residual accepted).
- **`.claude/skills/database/SKILL.md` § Service Patterns 1** says `account-access` is "ANONYMOUS by design (called with the anon key and no user token)". It is no longer only that. 179-22 lists the skill.
- **Docs describe four anonymous operations:**
  - `apps/docs/src/routes/(content)/developers-guide/backend/edge-functions/+page.md` (the table row "an anonymous visitor, with the anon key … anonymous by design", and the operations section) is listed by 179-22.
  - `apps/supabase/README.md` (the `account-access` bullet: "**anonymous** … (`check-code`) … (`code-sign-in`)") is listed by no later plan, as far as a search of 179-20..24 shows.
- **The token-verification budget is shared:**
  - Each `confirm-address` makes one `POST /auth/v1/verify` from the edge runtime's address.
  - That counts against the auth service's thirty verifications per five minutes per origin, shared by every confirmation of the deployment.
  - A spec that sends many confirmations (179-14, 179-18, 179-19) paces itself.
- **The edge gateway checks a bearer token when one is present.** `Bearer not-a-jwt` was answered 401 "Invalid JWT format" by the gateway, before the function. No header, or the anon key, reaches the function.

## Statements observed and inferred

- **Observed:**
  - the red and green unit runs
  - the operation's ten steps on the served stack
  - the carried item's measurements
  - `lint:check`, the held and close runs, the verdicts and the stack probe
- **Inferred:**
  - that the frontend callback, in a browser, completes the change from the mailed link as `verifyOtp` did here. That is 179-14's test.
  - that the 429 on direct updates is the deployment-wide `email_sent` limit and not a per-user one. It was not separated.

## Known Stubs

None. The stubs used for the red runs were replaced before each commit.

## Self-Check: PASSED

- `addressConfirmation.ts` and `addressConfirmation.test.ts` exist, and every modified file is on the tree.
- Commits 7c81e3f0c, 13f16f9c3, 7973f63c3 and 504479e8b are ancestors of HEAD.
- `git rev-list --count dd794d681..504479e8b` = 4.
