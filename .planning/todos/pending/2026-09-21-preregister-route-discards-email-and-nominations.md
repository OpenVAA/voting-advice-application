---
created: 2026-09-21T19:55:00Z
title: Preregister route discards the email, the nominations and the email template
area: backend
severity: blocker
files:
  - apps/frontend/src/routes/api/candidate/preregister/+server.ts (line ~16: `body: { id_token: idToken }` — the whole discard, in one expression)
  - apps/frontend/src/lib/api/base/universalDataWriter.ts (`preregisterWithIdToken`, ~line 72: what the client actually sends)
  - apps/supabase/supabase/functions/identity-callback/index.ts (`generateLink` at ~line 331; placeholder email at ~275)
  - apps/supabase/supabase/functions/identity-callback/candidateRecord.ts (`createCandidate` takes projectId/authUserId/firstName/lastName only)
  - apps/frontend/messages/en/candidateApp.preregister.json (`status.success.content` — the promise that is not kept)
  - apps/frontend/src/routes/candidate/preregister/(authenticated)/email/+page.svelte (builds the unused emailTemplate)
---

## Problem

**Immediate follow-up, filed 2026-09-21 during the Idura bank-auth debug session.** Found while
chasing "no mail in Inbucket": there is no mail because **nothing ever asked for any**, and the
missing email is the smallest of three losses.

`preregisterWithIdToken` sends `{ email, nominations, extra: { emailTemplate } }` to
`/api/candidate/preregister`. That route forwards **`{ id_token: idToken }` and nothing else** to the
`identity-callback` Edge Function. Everything the candidate entered is dropped in that one
expression, silently — no warning, no 4xx, and the UI reports success.

| The client sends | The route forwards |
|---|---|
| `email` | dropped |
| `nominations` | dropped |
| `extra.emailTemplate` | dropped |
| `id_token` | forwarded |

### The three consequences, worst first

1. **The candidate's selected elections and constituencies are lost.** `createCandidate` accepts only
   `projectId`, `authUserId`, `firstName`, `lastName`, and nothing in `identity-callback` touches
   nominations at all. So a candidate completes the flow, having picked an election and a
   constituency, and the row is created nominated for nothing. This is data the user entered, gone
   without a trace, which is why this is filed `blocker` rather than `major`.
2. **The typed email never reaches the server.** `identity-callback` creates the auth user under a
   placeholder address derived from the identity claim (`{sub}@bank-auth.placeholder`) with
   `email_confirm: true`. Confirmed in the live auth log. So the email-entry page's own promise —
   "In the future, your email address will act as your username" — is not yet true, and no
   confirmation email is *possible*, because nothing on the server knows the address.
3. **The UI states an email was sent.** `status.success.content` reads "We have sent a message to your
   email. Click the link in the message to confirm your email address and complete the registration."
   The bank-auth path sends nothing: `identity-callback` calls `generateLink`, which GENERATES
   without sending, and the frontend consumes that link itself via `verifyOtp` to establish the
   session. Measured: the auth container logged no `/invite` request at all across the whole session —
   only `/user`, `/verify`, `/admin/users`, `/admin/generate_link`.

**`invite-candidate` is the only function that sends mail** (`inviteUserByEmail`), and it is on a
different path — `_preregister` in `supabaseDataWriter`, which this flow never calls. Note that
`_preregister` *also* drops `emailTemplate` and `nominations`, forwarding only firstName/lastName/
email/projectId, so the template is unused on both paths.

## Solution

TBD — and deliberately so. This is an unfinished feature, not a defect with one obvious repair, and
each half needs a product decision that is not mine to take:

- **Nominations.** Create them inside `identity-callback` (it holds the service-role client and the
  verified identity, but its threat model and its `--no-verify-jwt` exposure would then cover
  nomination writes), or in a separate authenticated call once the session exists (cleaner authority
  story, but a partial-failure window where a candidate exists with no nominations). Note Phase 162
  gated nomination writes behind `nomination.create_parent` / the confirmation triggers, so whichever
  route is chosen must satisfy the grant model rather than bypass it with the service role by
  default.
- **Email.** Either promote the typed address to the auth user (an email-change confirmation, which
  IS a real confirmation email and would make the success copy true), or drop the promise from the
  copy and let the placeholder stand. The first is what the copy and the "email as username" line
  both assume.
- **The copy** must not claim a sent email until one is actually sent. If email promotion is deferred,
  `status.success.content` needs rewriting first — in all seven locales — because today it sends
  every successful registrant to wait for a message that will never arrive.

### Constraints for whoever picks this up

- Do not "fix" this by forwarding the body blindly. `identity-callback` is served `--no-verify-jwt`
  and is reachable with the anon key; every field it accepts is attacker-supplied. `project_id` is
  already validated against `PUBLIC_PROJECT_ID` for exactly this reason, and `email`/`nominations`
  would need equivalent treatment (an email that is not the caller's, or nominations in another
  project, must be refused rather than trusted).
- The seven-locale rule applies to any copy change (`assert:i18n-catalog-namespaces` is a
  `lint:check` link).
- There is no test covering this: the bank-auth specs are opt-in behind `PLAYWRIGHT_BANK_AUTH` and
  have not run since Phase 158 (see `2026-09-02-close-bank-auth-oidc-round-trip-window.md`). A fix
  should arrive with a test that asserts the nominations exist after preregistration, which is the
  assertion whose absence let this ship.

## Related

- `.planning/debug/idura-bank-auth-empty-client.md` — the session this came out of; five other faults
  fixed along the way (env loader, fail-open authorize URL, JWKS path, PII in logs, SSR crash).
- `2026-09-21-surface-bank-identification-failure-to-the-user.md` — the error-surfacing follow-up.
  Adjacent but independent: that one is about failures the user is not told about, this one is about
  a success that is not one.
