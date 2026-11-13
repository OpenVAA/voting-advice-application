---
phase: 174-invitations-grants-defined-in-advance
reviewed: 2026-10-22T19:59:24Z
depth: standard
files_reviewed: 85
files_reviewed_list:
  - apps/frontend/eslint.config.mjs
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.integration.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/invitationAccess.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/invitationAccess.ts
  - apps/frontend/src/lib/api/base/dataWriter.type.ts
  - apps/frontend/src/lib/api/base/universalDataWriter.ts
  - apps/frontend/src/lib/auth/index.ts
  - apps/frontend/src/lib/auth/invitationCodeLogin.test.ts
  - apps/frontend/src/lib/auth/invitationCodeLogin.ts
  - apps/frontend/src/lib/auth/passwordLogin.test.ts
  - apps/frontend/src/lib/auth/passwordLogin.ts
  - apps/frontend/src/lib/auth/sessionAdmission.test.ts
  - apps/frontend/src/lib/auth/sessionAdmission.ts
  - apps/frontend/src/routes/admin/login/+page.server.ts
  - apps/frontend/src/routes/api/auth/callback/+server.ts
  - apps/frontend/src/routes/api/auth/callback/server.test.ts
  - apps/supabase/scripts/lint-schema.mjs
  - apps/supabase/supabase/functions/account-access/contract.test.ts
  - apps/supabase/supabase/functions/account-access/contract.ts
  - apps/supabase/supabase/functions/account-access/deploymentChecks.test.ts
  - apps/supabase/supabase/functions/account-access/deploymentChecks.ts
  - apps/supabase/supabase/functions/account-access/envConfig.ts
  - apps/supabase/supabase/functions/account-access/flowConformance.test.ts
  - apps/supabase/supabase/functions/account-access/index.ts
  - apps/supabase/supabase/functions/account-access/linkIssue.test.ts
  - apps/supabase/supabase/functions/account-access/linkIssue.ts
  - apps/supabase/supabase/functions/account-access/mailTemplates.test.ts
  - apps/supabase/supabase/functions/account-access/mailTemplates.ts
  - apps/supabase/supabase/functions/account-access/signInLink.test.ts
  - apps/supabase/supabase/functions/account-access/signInLink.ts
  - apps/supabase/supabase/functions/identity-callback/entityGrant.test.ts
  - apps/supabase/supabase/functions/identity-callback/entityGrant.ts
  - apps/supabase/supabase/functions/identity-callback/envConfig.ts
  - apps/supabase/supabase/functions/send-email/callerAuthority.test.ts
  - apps/supabase/supabase/functions/send-email/callerAuthority.ts
  - apps/supabase/supabase/functions/send-email/envConfig.test.ts
  - apps/supabase/supabase/functions/send-email/envConfig.ts
  - apps/supabase/supabase/functions/send-email/flowConformance.test.ts
  - apps/supabase/supabase/functions/send-email/index.ts
  - apps/supabase/supabase/functions/send-email/jwtSegment.test.ts
  - apps/supabase/supabase/functions/send-email/jwtSegment.ts
  - apps/supabase/supabase/functions/send-email/templateVars.ts
  - apps/supabase/supabase/migrations/00001_initial_schema.sql
  - apps/supabase/supabase/schema/305-invitations.sql
  - apps/supabase/supabase/schema/506-invitation-rpcs.sql
  - apps/supabase/supabase/tests/database/07-rpc-security.test.sql
  - apps/supabase/supabase/tests/database/25-matrix-conformance.test.sql
  - apps/supabase/supabase/tests/database/39-invitations.test.sql
  - packages/dev-seed/src/index.ts
  - packages/dev-seed/src/supabaseAdminClient.ts
  - packages/dev-seed/src/templates/e2e/base.ts
  - packages/dev-seed/tests/projectScopingGate.test.ts
  - packages/dev-seed/tests/supabaseAdminClient.invitations.test.ts
  - packages/dev-seed/tests/templates/base.test.ts
  - scripts/assert-auth-signup-closed.mjs
  - scripts/assert-edge-env-defaults.mjs
  - scripts/assert-no-candidate-app-names.mjs
  - scripts/assert-project-scoped-queries.mjs
  - scripts/fixtures/assert-no-candidate-app-names.input.ts
  - scripts/fixtures/project-scoped-queries/clean.fixture.ts
  - scripts/fixtures/project-scoped-queries/violation.fixture.ts
  - tests/playwright.config.ts
  - tests/tests/fixtures/admin/adminLoginPage.fixture.ts
  - tests/tests/fixtures/contestant/contestant-journey.ts
  - tests/tests/fixtures/contestant/contestantLoginPage.fixture.ts
  - tests/tests/fixtures/contestant/invitation-landing.ts
  - tests/tests/fixtures/shared/emailBucket.fixture.ts
  - tests/tests/fixtures/shared/invitationFlow.fixture.ts
  - tests/tests/setup/contestant/contestant-journey.teardown.ts
  - tests/tests/setup/perm/perm-localisation-positive.teardown.ts
  - tests/tests/specs/auth/public-signup-closed.spec.ts
  - tests/tests/specs/contestant/contestant-journey.spec.ts
  - tests/tests/specs/contestant/invitation-contract.spec.ts
  - tests/tests/specs/contestant/invitation-landing.spec.ts
  - tests/tests/specs/perm/perm-localisation-positive.spec.ts
  - tests/tests/utils/accountAccessClient.ts
  - tests/tests/utils/authApi.ts
  - tests/tests/utils/contestantJourneyConstants.ts
  - tests/tests/utils/invitationConstants.ts
  - tests/tests/utils/mailedLink.test.ts
  - tests/tests/utils/mailedLink.ts
  - tests/tests/utils/supabaseAdminClient.ts
  - tests/tests/utils/supabaseAnonKey.ts
findings:
  critical: 1
  warning: 4
  info: 4
  total: 9
status: issues_found
---

# Phase 174: Code Review Report

**Reviewed:** 2026-10-22T19:59:24Z
**Depth:** standard
**Files Reviewed:** 85
**Status:** issues_found

## Summary

This is a retroactive review of the phase-174 invitation model as it stands at HEAD, scoped to what the phase introduced: the `invitations` table and its policies, `create_invitations`, the service-role helpers, `claim_invitations`, the `account-access` Edge Function, and the frontend claim, refresh and gate wiring. Files changed later (in phases 177.1, 178 and 179) were read at HEAD. Findings already filed in `177.1-REVIEW.md` and `179-REVIEW.md` are not repeated.

The following files were read in full and traced: `305-invitations.sql`, `506-invitation-rpcs.sql`, `account-access/{index,contract,linkIssue,signInLink,deploymentChecks}.ts`, `invitationAccess.ts`, `sessionAdmission.ts`, `passwordLogin.ts`, `invitationCodeLogin.ts`, the auth callback, the admin login action, the invitation section of `supabaseDataWriter.ts`, `assert-auth-signup-closed.mjs`, and the invitation methods of the dev-seed and E2E admin clients. The function bodies of `claim_invitations`, `create_invitations`, `invitation_link_request` and `recovery_link_request` in `00001_initial_schema.sql` are byte-identical to the schema files. The remaining tests, fixtures and gate scripts were checked only for test reliability.

The core claim holds up. `claim_invitations` takes no address or invitation id. It reads only the caller's own confirmed `auth.users` row, re-checks `claimed_at IS NULL` under `FOR UPDATE`, which makes a concurrent double claim a no-op, and maps each grant-uniqueness violation to a named outcome. The authority map in the three policies matches the role matrix. No rate limit repeats the 179 CR-01 shape of keying on a caller-chosen project id: every `link:` slot is taken only after eligibility has been decided in the named project.

Where this phase falls short is the anonymous mail surface. In the code path of `request-link`, the code holder's typed address chooses the throttle slot, and whether that slot is free decides a write the code holder can observe. This makes the endpoint an oracle for invitee and account membership (CR-01). The same path, and the address slot on its own, also let mail be sent and sign-in links be invalidated with no overall bound (WR-01, WR-02). Two configuration and data-model gaps undermine the "confirmed address" trust and day-to-day administration (WR-03, WR-04).

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: `request-link` with a code is an oracle for whether any address is invited to the project or holds a grant in it

**File:** `apps/supabase/supabase/schema/506-invitation-rpcs.sql:851-907` (also `:989-995` for the recovery variant); contract claim at `apps/supabase/supabase/functions/account-access/index.ts:12` and `contract.ts:6`

**Issue:** In the code path, `invitation_link_request` sets `v_candidate := v_email` (the address the caller typed) and only then takes the `link:<project>:<sha256(address)>` slot. It binds `pending_email` and starts the code row's 60-second cooldown (`pending_email_at`) **only if that slot was free**. Whether address X's slot is taken depends on whether X is eligible on the email path: an open invitation in the project, or a confirmed user holding a grant in it (`:874-887`, and `recovery_link_request` `:973-995`). Anyone who holds one open code can therefore learn that eligibility with three anonymous requests inside 60 seconds and their own mailbox:

1. `request-link {email: X}`. If X is eligible, X's slot is taken. If not, nothing is written.
2. `request-link {code: C, email: X}`. If X's slot is taken, the function returns null **without binding**. Otherwise it binds `pending_email = X` and starts C's cooldown.
3. `request-link {code: C, email: <attacker's own address>}`. If step 2 bound, the cooldown refuses the request and no mail arrives. If step 2 did not bind, a sign-in mail arrives in the attacker's mailbox.

A mail in the attacker's mailbox therefore means "X is invited to, or holds a grant in, this project". This exposes unconfirmed invitees, project admins and editors, and it contradicts the endpoint's stated contract that "no answer depends on whether an address, a code or an account exists". Every code invitee holds such a code, so the precondition is ordinary. The probe also sends X a mail and leaves C bound to X.

**Fix:** In the code path, make what the code holder can observe independent of the typed address's state. Take a per-code slot keyed on the row (not on the address), and consume the code's cooldown before the address slot is consulted, so a refused address slot still starts the cooldown:

```sql
ELSE
  -- The code's own cooldown is spent whatever the typed address's slot says.
  UPDATE public.invitations i
  SET pending_email_at = now()
  WHERE i.id = v_row.id;
  v_candidate := v_email;
  v_bind := true;
END IF;
...
IF NOT private.invitation_throttle_take('link:' || ..., 1, interval '60 seconds') THEN
  RETURN NULL;  -- the cooldown above is already spent, so step 3 is refused either way
END IF;
IF v_bind THEN
  UPDATE public.invitations i SET pending_email = v_candidate WHERE i.id = v_row.id;
END IF;
```

Alternatively, key the code path's mail slot on the code row (`code-link:<row id>`) rather than on the typed address. Add a pgTAP case that runs the three-step probe for an eligible and an ineligible X and asserts the code row ends in the same state both times.

## Warnings

### WR-01: One open code lets its holder mail any address and create an auth user for it, once a minute, with no lifetime bound

**File:** `apps/supabase/supabase/schema/506-invitation-rpcs.sql:866-872, 893-905`; `apps/supabase/supabase/functions/account-access/linkIssue.ts:151-153`; `index.ts:210-215`

**Issue:** For an open code, the address that is mailed is whatever the caller typed. The only limits are the row's 60-second `pending_email_at` cooldown and a per-address slot, and the slot is new for every new address. Each accepted request runs `generateLink({ type: 'invite' })` for that address, which creates an unconfirmed `auth.users` row, and then sends the deployment's sign-in mail to it. Nothing caps the number of distinct addresses per code, per day or per requester. So a leaked or malicious code yields about 1,440 unsolicited mails and 1,440 junk auth users a day from the deployment's sender, until the code is claimed or deleted. A claim does not stop it either: the attacker can keep rebinding the code to their own address so it is never claimed. Separately, binding to an existing account's address means that account's next password sign-in claims the grant without its owner's knowledge (`claim_invitations` `:1271`).

**Fix:** Bound the code path per code row. For example, add a `code-bind:<row id>` throttle of N bindings per day through `invitation_throttle_take`. Defer user creation until the link is opened: mint the magiclink only for an address that already has a user, and otherwise use a single `invite`-type token minted after eligibility, rather than creating the user up front. Consider refusing to rebind a code whose pending address has an unexpired, unopened link.

### WR-02: The per-address slot alone lets an anonymous caller flood any invitee or grant holder with mail and keep their mailed links invalid

**File:** `apps/supabase/supabase/schema/506-invitation-rpcs.sql:893-899, 989-995`; `apps/supabase/supabase/functions/account-access/index.ts:427-439`

**Issue:** `request-link` and `request-recovery` are anonymous and are bounded only by `link:<project>:<address>`, one per minute. Each accepted request mints a new token, and the schema comment at `:956` notes that "a later link of either kind stops an unopened earlier one". A caller who knows an invitee's or a grant holder's address can send a request every 60 seconds, which produces about 1,440 mails a day per project the address belongs to. Each mail also invalidates the previous link, so a first-time invitee, who has no password, can sign in only by opening each link within the minute before the next request replaces it. A password holder's recovery link is kept invalid in the same way. Nothing is keyed on the requester, and there is no daily cap per address.

**Fix:** Add a second, longer window per address, for example at most 5 per hour and 20 per day on a `link-day:<project>:<address>` key taken next to the minute slot. Consider not minting a new token while the previous one is unexpired and was issued less than a few minutes ago, so a repeat request re-mails nothing rather than invalidating. A per-IP limit at the edge function would also help, but should not be the only control.

### WR-03: Every mailed link also mints a 6-digit OTP for the address, and the claim trusts whoever verifies it

**File:** `apps/supabase/supabase/config.toml:236, 262` (`token_verifications = 30`, `otp_length = 6`); `scripts/assert-auth-signup-closed.mjs:43-86`; `apps/supabase/supabase/functions/account-access/index.ts:217-221`; `506-invitation-rpcs.sql:1214-1218`

**Issue:** `generateLink({ type: 'magiclink' | 'recovery' })` stores a token whose `email_otp` (6 digits, valid for `otp_expiry` = 3600 s) is accepted by `POST /auth/v1/verify` with `{ email, token }`, just like the mailed `token_hash`. The application never uses the OTP, but anyone can trigger one for a known invited address through `request-link` (anonymous). After that they get one hour of guesses against 10^6 values, limited only by GoTrue's per-IP `token_verifications` (30 per 5 minutes). A distributed attacker can therefore obtain a session for the invitee's address. `claim_invitations` then writes the promised grants to that session, because its only trust anchor is `email_confirmed_at` (the comment block "WHAT IT CANNOT KNOW"). The signup-closed gate pins seven keys but not `otp_length`, so nothing holds this bound for local or hosted configurations.

**Fix:** Set `[auth.email] otp_length = 10`, the GoTrue maximum, which raises the work factor by 10^4. Add it to `REQUIRED` in `assert-auth-signup-closed.mjs` and to the operator list for hosted projects. Consider a shorter `otp_expiry` for these links, and/or a lower `token_verifications`.

### WR-04: A claimed invitation blocks re-inviting that address to that target forever, and no API role can remove it

**File:** `apps/supabase/supabase/schema/305-invitations.sql:151-154` (unique index over claimed rows too), `:339-341` (DELETE policy requires `claimed_at IS NULL`), `:90` (deleting the claimant keeps `claimed_at`)

**Issue:** The unique index `invitations_email_target_key` covers claimed rows, and pgTAP asserts that "a claimed row still refuses a second invitation". The DELETE policy refuses claimed rows, and deleting the claimant user only nulls `claimed_by`. As a result:

- an admin who removes a person's grant, or deletes their account, cannot invite the same address to the same candidate or project again;
- an account admin cannot invite an address that claimed a project-editor invitation as project admin, because the role is outside the key;
- the only remedy is a service-role delete.

The E2E harness needed exactly that workaround (`tests/tests/utils/supabaseAdminClient.ts:1369`: "Deleting the user alone leaves a claimed row claimed, so a later run would seed a duplicate of it"). The product has no such path.

**Fix:** Either restrict the unique index to open rows (`WHERE email IS NOT NULL AND claimed_at IS NULL`), keeping claimed rows as history, or let the DELETE policy remove a claimed row whose grant no longer exists, or whose `claimed_by` is null. Update the pgTAP case at `39-invitations.test.sql:1083-1106` to match.

## Info

### IN-01: A new skip reason from the database turns every sign-in link into a forced sign-out

**File:** `apps/frontend/src/lib/api/adapters/supabase/utils/invitationAccess.ts:17-19`; `apps/frontend/src/routes/api/auth/callback/+server.ts:66-74`

**Issue:** `reason` is a closed `z.enum`, although the schema comment says unknown members are tolerated. If `claim_invitations` gains a third skip reason, `parseInvitationClaim` throws, and `claimAndRefresh` returns `undefined`. The `magiclink` arm then signs the user out with `authError`, even though the grants were written.

**Fix:** Accept `z.string().min(1)` for `reason` (or `.catch()` to a generic value), or narrow it with a fallback.

### IN-02: The test-only completion witness is accepted from anonymous production requests

**File:** `apps/supabase/supabase/functions/account-access/contract.ts:185-188, 217, 229`; `linkIssue.ts:189-195`

**Issue:** Any caller may attach any uuid as `witness`, and the background work completes that record if it is open. It is harmless today, because records are opened only by the service role in tests. Still, it is a test seam in the production contract, and an attacker who learned an open record's id could corrupt a test's evidence.

**Fix:** Accept `witness` only when an environment flag enables it, or only from a request carrying the service-role key.

### IN-03: Invited admins land in the Contestant App

**File:** `apps/supabase/supabase/functions/account-access/signInLink.ts:66-84`; `apps/frontend/src/routes/api/auth/callback/+server.ts:132-136`

**Issue:** The mailed link carries no `next`, so every `magiclink` lands on `ContestantAppHome`. That includes a project-admin or account-admin invitee, who meets the Contestant App's set-password and terms-of-use gates and then an empty entity list. Nothing points them to the Admin App.

**Fix:** In the callback, choose the landing from the claimed grant shapes: `ADMIN_GRANTS` goes to `AdminAppHome`.

### IN-04: The code sign-in password guesses share the edge function's IP-based auth rate limit

**File:** `apps/supabase/supabase/functions/account-access/index.ts:382-410`

**Issue:** Every `code-sign-in` calls `signInWithPassword` from the edge runtime's address, so all code sign-ins in the deployment share one per-IP `sign_in_sign_ups` budget (30 per 5 minutes locally). A holder of a few used codes can exhaust it with wrong passwords, which, within the 10-per-15-minutes limit per code, locks out legitimate code sign-ins for everyone.

**Fix:** Forward the client IP to GoTrue (`X-Forwarded-For` through a trusted path), or add a deployment-wide budget in the database that is separate from the per-code one.

---

_Reviewed: 2026-10-22T19:59:24Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
