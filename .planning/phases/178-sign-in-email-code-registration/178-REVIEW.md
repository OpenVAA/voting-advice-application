---
phase: 178-sign-in-email-code-registration
reviewed: 2026-10-22T20:01:07Z
depth: standard
files_reviewed: 53
files_reviewed_list:
  - apps/frontend/eslint.config.mjs
  - apps/frontend/src/hooks.server.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/invitationAccess.ts
  - apps/frontend/src/lib/api/base/universalDataWriter.ts
  - apps/frontend/src/lib/auth/sessionAdmission.ts
  - apps/frontend/src/lib/contestant/components/emailEntry/EmailEntry.svelte
  - apps/frontend/src/lib/contestant/components/emailSentPanel/EmailSentResend.svelte
  - apps/frontend/src/lib/contestant/components/emailSentPanel/resendCountdown.svelte.ts
  - apps/frontend/src/lib/contestant/components/passwordSetter/PasswordSetter.svelte
  - apps/frontend/src/lib/contestant/entryFlow/entryFlow.ts
  - apps/frontend/src/lib/contestant/gates/gates.ts
  - apps/frontend/src/lib/contestant/gates/SetPasswordGate.svelte
  - apps/frontend/src/lib/contestant/utils/registrationOffer.ts
  - apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts
  - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts
  - apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte
  - apps/frontend/src/lib/routes/appGates.ts
  - apps/frontend/src/lib/routes/loginRedirectTarget.ts
  - apps/frontend/src/lib/routes/route.ts
  - apps/frontend/src/lib/server/contestant/registrationGuard.ts
  - apps/frontend/src/routes/api/auth/callback/+server.ts
  - apps/frontend/src/routes/contestant/(protected)/+layout.server.ts
  - apps/frontend/src/routes/contestant/+layout.svelte
  - apps/frontend/src/routes/contestant/email-sent/+page.svelte
  - apps/frontend/src/routes/contestant/forgot-password/+page.svelte
  - apps/frontend/src/routes/contestant/login/+page.svelte
  - apps/frontend/src/routes/contestant/login/email/+page.server.ts
  - apps/frontend/src/routes/contestant/login/email/+page.svelte
  - apps/frontend/src/routes/contestant/password-reset/+page.server.ts
  - apps/frontend/src/routes/contestant/password-reset/+page.svelte
  - apps/frontend/src/routes/contestant/register/+page.server.ts
  - apps/frontend/src/routes/contestant/register/+page.svelte
  - apps/frontend/src/routes/contestant/register/email/+page.server.ts
  - apps/frontend/src/routes/contestant/register/email/+page.svelte
  - apps/frontend/src/routes/contestant/register/sign-in/+page.server.ts
  - apps/frontend/src/routes/contestant/register/sign-in/+page.svelte
  - apps/frontend/vitest.config.ts
  - apps/supabase/supabase/functions/account-access/contract.ts
  - apps/supabase/supabase/functions/account-access/index.ts
  - apps/supabase/supabase/functions/account-access/linkIssue.ts
  - apps/supabase/supabase/functions/account-access/mailTemplates.ts
  - apps/supabase/supabase/functions/account-access/signInLink.ts
  - apps/supabase/supabase/schema/106-app-settings.sql
  - apps/supabase/supabase/schema/301-auth-functions.sql
  - apps/supabase/supabase/schema/503-entity-rpcs.sql
  - apps/supabase/supabase/schema/506-invitation-rpcs.sql
  - packages/app-shared/src/settings/contestantAppConfig.ts
  - scripts/assert-auth-signup-closed.mjs
  - tests/tests/utils/mailedLink.ts
  - tests/tests/utils/supabaseAdminClient.ts
  - tests/tests/utils/testCredentials.ts
findings:
  critical: 0
  warning: 3
  info: 6
  total: 9
status: issues_found
---

# Phase 178: Code Review Report

**Reviewed:** 2026-10-22T20:01:07Z
**Depth:** standard
**Files Reviewed:** 53
**Status:** issues_found

## Summary

This is a retroactive review of the code at HEAD, concentrating on what phase 178 introduced (`git diff b49642cce` and the `(178-NN)` commits). Covered: the `account-access` recovery operation and the link pipeline it shares with sign-in; the throttle keys in `506-invitation-rpcs.sql`; the registration-mode condition (`invitation_mode_allowed`, `registration_mode_allowed_in`) and its TypeScript twin; the no-op `send_email_hook`; the auth callback; the sign-in, registration, code sign-in, forgot-password, email-sent and password-reset routes; the registration guard; the entry-route gate; and the contestant context's entry-flow state.

Checked and sound:
- **Registration-mode matrix.** It is enforced in all three server paths that read an open invitation: the code check, the link request (both branches) and the claim. The recovery request's `sign-in` branch applies it too. The SQL rule and `isRegistrationModeAllowed` agree on the served-type fallback and the malformed-matrix cases. The shipped default matrix is empty, so the registration guard's fallback to `{}` really does fail closed. Leaving the answers lock out of the server contract is the recorded J5 decision and is not reported.
- **Open redirects.** `next` in the callback and `redirectTo` in the sign-in action both pass through `safeRedirectTarget` and are placed behind `/{locale}/`. I found no bypass.
- **Enumeration oracles.** `request-link` and `request-recovery` build their answer before any work. The code sign-in answers with a single refusal for every failure. The login notice renders only known keys.
- **Code guessing.** Codes carry 60 bits. The used-code password budget is keyed on the normalised code hash, so different spellings of one code share it.
- **Caller-chosen throttle keys (the 179 CR-01 class).** The `link:<project>:<address hash>` key is taken only for an address that is eligible in the named project, so a caller cannot mint a fresh budget with an arbitrary project id. The project dimension is still a multiplier for an address eligible in several projects (see WR-01).

The defects are in what the throttles leave open over time and in how mailed tokens are consumed. Already accepted or already reported risks are not repeated here: AR-179-02, the P7 timing residual of the auth service's own password endpoint, and the `/otp` answer difference recorded under J6.

Test specs, fixtures and setup files in scope were not reviewed line by line. The three test utilities listed above were scanned for embedded keys, and none were found.

## Warnings

### WR-01: Sign-in and recovery mails to any invited or registered address are limited to one a minute per project, with no longer window, so an anonymous caller can flood a known address and keep its links from working

**File:** `apps/supabase/supabase/schema/506-invitation-rpcs.sql:893-899` and `:989-995`; `apps/supabase/supabase/functions/account-access/index.ts:427-439`
**Issue:** The only limit on `request-link` (no code) and `request-recovery` is `invitation_throttle_take('link:<project>:<sha256(address)>', 1, '60 seconds')`. Neither the Edge Function nor the database adds a per-caller limit, a per-IP limit or any limit over a longer window. Any anonymous caller who knows a candidate's address can therefore:
- have 1,440 mails a day sent to that address from the deployment's sender, indefinitely. Candidates' addresses are often public.
- keep that person's sign-in and recovery links from working. Probe row P2 measured that a later link of either kind stops an unopened earlier one, so each mail the attacker triggers cancels the previous link. When the attacker has just taken the slot, the victim's own request is silently dropped.
- multiply both effects by the number of projects in which the address holds a grant or an invitation, because the key carries the project the request names. The auth service has a single token slot per account, not one per project.

Scripted across many invitees, the same pattern also uses up the deployment's SMTP quota and sender reputation.
**Fix:** After the per-project slot, take a second slot keyed on the address alone, with a longer window. For example:
```sql
IF NOT private.invitation_throttle_take(
  'link-addr:' || encode(sha256(convert_to(lower(btrim(v_candidate)), 'UTF8')), 'hex'),
  5, interval '1 hour'
) THEN
  RETURN NULL;
END IF;
```
Add the same take to `recovery_link_request`, have `invitation_link_release` give it back, and add the key to `cleanup_invitation_throttle_on_delete`. A coarse per-IP limit in front of `account-access` (an API gateway rule or a fixed-window key on a hashed client IP) would bound the fan-out across addresses.

### WR-02: Anyone holding an open registration code can mail any address once a minute without limit and create an auth account for each address

**File:** `apps/supabase/supabase/schema/506-invitation-rpcs.sql:851-873` (open-code branch, rebinding gate at 868); `apps/supabase/supabase/functions/account-access/linkIssue.ts:151-153`; `apps/supabase/supabase/functions/account-access/index.ts:210-215`
**Issue:** On an open code row, `invitation_link_request` accepts any `p_email` as the candidate and blocks only a rebinding less than 60 seconds after the last one. Nothing caps how many times a code can be rebound. Each accepted request then runs `createPasswordlessUser`, which is `generateLink({ type: 'invite' })` and creates an `auth.users` row for an address the caller picked, and mails that address. A single leaked or guessed-and-checked valid code therefore lets its holder:
- send registration mails to arbitrary third parties at 1,440 a day;
- grow `auth.users` with never-confirmed accounts at the same rate. Nothing removes those accounts.

The per-address `link:` slot does not help here, because the attacker changes the address on every request.
**Fix:** Count bindings per code row over a long window and refuse once the count is exceeded. For example, take `'bind:' || v_row.id` with `p_max => 5, p_window => interval '1 day'` before the `link:` slot in the open-code branch, and leave it unreleased on failure. Optionally, remove an `auth.users` row created by the invite and never confirmed when its code is rebound to another address.

### WR-03: The auth callback consumes a single-use token on a plain cross-site GET, which allows login CSRF (session fixation) and lets mail-link scanners spend the token before the user opens it

**File:** `apps/frontend/src/routes/api/auth/callback/+server.ts:45-79`; `apps/supabase/supabase/functions/account-access/signInLink.ts:66-84`
**Issue:** The mailed link points directly at `GET /<locale>/api/auth/callback?token_hash=…&type=…`, and the handler calls `verifyOtp` and writes the session cookies on that GET, replacing whatever session the browser held. Since 178-19, recovery tokens also use this path (`token_hash`, "completes in any browser"), with no PKCE verifier binding the link to the browser that asked for it. Two consequences follow:
1. **Login CSRF.** An attacker asks for a sign-in or recovery link for their own account and sends the URL to a victim. When the victim opens it, they are signed in as the attacker: on the `magiclink` arm the victim lands in the attacker's Contestant App, and on the `recovery` arm on a "create new password" form for the attacker's account. Any session the victim already had is replaced without warning.
2. **Prefetching scanners.** Corporate mail scanners and link-preview services GET links before the person does. The first GET spends the single-use token (403 `otp_expired` afterwards), so the real click ends on the login page with `authError`. Probe P2 confirms that a spent token and a superseded token are refused the same way.
**Fix:** Make the mailed link land on a page that renders a "Continue" button and verifies on POST:
```ts
// routes/contestant/auth/confirm/+page.server.ts
export const actions = {
  default: async ({ request, locals, fetch }) => {
    const data = await request.formData();
    const token_hash = String(data.get('token_hash') ?? '');
    const type = String(data.get('type') ?? '') as EmailOtpType;
    // ...the current GET body: verifyOtp, claimAndRefresh, landing
  }
};
```
Point `CALLBACK_PATH` in `signInLink.ts` at that page, and add it to the auth redirect allowlist. SvelteKit's origin check on form POSTs then blocks the cross-site variant, and scanners do not submit forms. If a signed-in browser opens a link for a different account, show an explicit "you will be signed out of …" choice.

## Info

### IN-01: A request for a sign-in link with a used code spends the claimant's password-attempt budget

**File:** `apps/supabase/supabase/schema/506-invitation-rpcs.sql:861`, `:1107`
**Issue:** `invitation_link_request` reads the claimant through `invitation_code_claimant_email`, which takes the `code:` budget (10 per 15 minutes) meant for code sign-in password attempts. Ten "send the link to my address" requests, from anyone holding the used code, lock that code's sign-in for the rest of the window. A refused take still counts and does not move the window. The claimant then sees the generic "wrong password" refusal. Exploiting this requires knowing the code.
**Fix:** Read the claimant address in the link branch through a non-counting helper. The `link:` slot already limits that branch's mails.

### IN-02: The code sign-in screen and its action are refused while answers are locked or the code mode is switched off, although they are a sign-in rather than a registration

**File:** `apps/frontend/src/routes/contestant/register/sign-in/+page.server.ts:26,31`; `apps/frontend/src/lib/server/contestant/registrationGuard.ts:52-53`; `apps/frontend/src/lib/contestant/utils/registrationOffer.ts:35`
**Issue:** The guard asks `listedRegistrationModes`, which returns `[]` under `answersLocked`. A code-registered user therefore cannot use code and password to sign in while answers are locked, or after the code mode is switched off. This is inconsistent with `signInLinkOffered`, which deliberately ignores the lock ("a user who cannot edit can still sign in"). The user can still sign in by email and password, so this is a usability inconsistency rather than a lockout.
**Fix:** Either gate the claimed-code screen on something that ignores the lock, or document that code sign-in is unavailable while answers are locked.

### IN-03: The entry-route gate runs only on server-handled requests

**File:** `apps/frontend/src/hooks.server.ts:109`; `apps/frontend/src/lib/routes/appGates.ts:17`
**Issue:** The doc says a caller with a session "is sent away from every one of" the entry routes. In practice, client-side navigation to `login/email`, `register/**` or `email-sent` makes no server request, because those pages and their server layouts have no URL-dependent server load, so the hook never runs. The form POSTs are still caught, so this is not a security gap, but the stated invariant does not hold for client navigation.
**Fix:** Narrow the doc to "on every server request", or add a universal `load` on those routes that redirects when `data.session` is set.

### IN-04: Accounts holding only a global or account-level grant have no password recovery path any more

**File:** `apps/supabase/supabase/schema/506-invitation-rpcs.sql:754-772`; `apps/supabase/supabase/schema/301-auth-functions.sql:99`
**Issue:** `send_email_hook` stops every mail the auth service would send, and `recovery_link_request` mails only holders of a project or entity grant in the named project. An administrator who holds only a global or account grant is answered `{ accepted: true }`, receives nothing, and has no other way to recover a password. If this is intended, it is undocumented in the code.
**Fix:** Document the operator procedure (service-role reset) where `email_holds_grant_in_project` explains the exclusion, or give account and global grant holders their own recovery eligibility.

### IN-05: The code sign-in probably shares one per-IP auth-service bucket across all users (unverified on hosted)

**File:** `apps/supabase/supabase/functions/account-access/index.ts:395-401`
**Issue:** Every `code-sign-in` calls `signInWithPassword` from the Edge runtime, so on a hosted project all code sign-ins of the deployment probably count against a single IP's `sign_in_sign_ups` limit (30 per 5 minutes in `config.toml`). A few callers holding used codes could then exhaust the bucket for everyone. This is not measured; the code path predates the phase, and this phase made it user-facing.
**Fix:** Measure on a hosted project. If confirmed, forward the client IP through a header the auth service trusts, or document the limit as a residual.

### IN-06: An ESLint allowlist comment edited in this phase has stale counts and breaks the comment-hygiene rules

**File:** `apps/frontend/eslint.config.mjs:14`, `:29`, `:34`
**Issue:**
- Line 14 says "the seven grandfathered sites … Four are route files", but GROUP 2 now holds six entries, three of them route files, and line 29 says "six".
- Lines 14 and 34 cite "Phase-158 disposition" and "Phase 158's login collapse" rather than the bare `see phase N` form.
- Line 34 adds historical narrative ("the file a recorded cookie-loss incident was fixed in").
**Fix:** Correct the count to six with three route files, and drop the phase citations and the incident narrative.

---

_Reviewed: 2026-10-22T20:01:07Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
