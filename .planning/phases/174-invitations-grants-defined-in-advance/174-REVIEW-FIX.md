---
phase: 174-invitations-grants-defined-in-advance
step: review-fix
batch: review-fix-A
findings_fixed: [CR-01, WR-01, WR-02, WR-03, IN-01, IN-02, IN-04]
findings_skipped: [WR-04, IN-03]
base: dd5dd97a7
gates: tests/e2e-runs/179-gates/review-fix-A-r2
e2e_close: tests/e2e-runs/179-e2e/review-fix-A
status: complete
---

# Phase 174 review fix

Fixed in review-fix batch A, with phases 170, 172, 173, 178 and 179. Each finding got a failing test first, with the exit of its red run recorded, then the fix, then the green run; a doc-only finding got no red. Two findings overlap with phase 178 and were fixed once: WR-01 is 178 WR-02, WR-02 is 178 WR-01. IN-04 is 178 IN-05.

| Finding | Disposition | Commits |
| --- | --- | --- |
| CR-01 | fixed | 0a9f5e6cd (red), 4a32bb33c (fix), 8faecac39 and 5e1a0b851 (docs) |
| WR-01 (= 178 WR-02) | fixed | 0a9f5e6cd, 4a32bb33c, 8faecac39 |
| WR-02 (= 178 WR-01) | fixed | 0a9f5e6cd, 4a32bb33c, 8faecac39 |
| WR-03 | fixed | af12e5fad (red), 0cc944131 (fix), 2aeccb2d9 (parity fixture) |
| WR-04 | skipped: operator decision | none |
| IN-01 | fixed | ed9bb7bf0 (red), 04e48ac41 (fix) |
| IN-02 | fixed | 20c012744 (red), 07e21ef7a (fix) |
| IN-03 | skipped: operator decision | none |
| IN-04 (= 178 IN-05) | fixed as a documented residual | 879d51daf |

## CR-01, WR-01, WR-02 (and 178 WR-01, WR-02, IN-01): one change to the link request

**Verified.** In `invitation_link_request`'s open-code branch the typed address's `link:` slot was taken before the row was bound and its cooldown started; a refused slot returned null without binding. Whether the slot is taken depends on whether the address is eligible on the email path, so the three-step probe of the review was an oracle. Separately, nothing bounded the number of addresses a code is rebound to (WR-01), and the only bound on an address's mails was one a minute per project (WR-02). The claimed-code branch read its claimant through `invitation_code_claimant_email`, spending the code's password budget (178 IN-01).

**Red** (0a9f5e6cd): the new pgTAP file `49-invitation-link-bounds.test.sql`, run with `00-helpers` against the schema before the fix: **exit 1**, 11 of 17 failed. It runs the review's three-step probe for an eligible and an unknown address and asserts the third answer and the code row's end state are the same; five bindings then a refused sixth; twenty mails then a refused twenty-first across two projects and both kinds; the release giving one take back; and that ten link requests with a used code write no `code:` key.

**Fix** (4a32bb33c, `fix[db]`):
- **CR-01.** For an open code, the row is bound (`pending_email`) and its 60-second cooldown starts (`pending_email_at`) **before** the typed address's slots are asked. What the holder can observe afterwards, the row and its cooldown, no longer depends on the typed address's eligibility. A request refused by the address's slots has bound the row and mails nothing.
- **WR-01 / 178 WR-02.** `code-bind:<invitation id>`: five bindings to an address other than the row's pending one, per code row per day, taken before the bind and never given back. Sending again to the bound address counts nothing. The key holds no caller-chosen value; the addresses a holder can make a mail go to, and so the `link:` keys a caller can create through a code, are bounded by it.
- **WR-02 / 178 WR-01.** `link-address:<sha256 hex>`: twenty sign-in or recovery mails per address per day **in every project together**, taken after the per-project minute slot by `invitation_link_request` and `recovery_link_request`, so a request inside the minute spends nothing of the day. `invitation_link_release` gives one take of it back when it frees a minute slot. The cleanup trigger deletes the row's `code-bind:` key; an address's `link-address:` key belongs to no row and is not deleted.
- **178 IN-01.** The claimed-code branch reads the claimant inline and counts nothing against `code:`; the address's two slots bound those mails.
- **Migration.** `00005_invitation_link_bounds.sql` holds the four replaced functions (`cleanup_invitation_throttle_on_delete`, `invitation_link_request`, `invitation_link_release`, `recovery_link_request`), extracted byte-for-byte from `schema/506`, with its manifest line. The functions live in the frozen baseline `00001` too, which was not touched: the repository's rule is an appended migration. No signature changed, so `packages/supabase-types` needed no regeneration. `yarn check:schema-equivalence`: **EQUAL** (exit 0). `assert:schema-migration-parity`: exit 0.
- **pgTAP 39 updated for the new behaviour**, in the fix commit: the link request with a used code is now answered with the claimant's address after the look-up budget is spent, and takes the claimant's minute slot afresh (two cases); the five answered recovery requests write ten throttle keys, not five (one count).

**Green:** `49` 17/17; the full pgTAP suite **exit 0**, 49 files, 2657 tests.

**Docs** (8faecac39): the limits tables and residuals of `backend/authentication`, `contestant-app/pre-registration-and-invitation`, `backend/email` and `backend/edge-functions`; `.claude/skills/database/{SKILL,schema-reference}.md`.

**Not done, from the reviews' fix suggestions:** deferring the creation of the auth user until a link is opened, removing never-confirmed users created through a rebound code, refusing to mint while an earlier link is unexpired, and a per-IP limit at the edge. The bind cap bounds the junk users to five per code per day.

**Trade-off to note.** An address-only day cap cannot tell the owner from anyone else: a caller who spends an address's twenty also leaves its owner without a mailed link until the window ends (a password still works). Stated in the authentication page's residuals.

## WR-03: a ten-digit one-time code

**Verified.** `config.toml [auth.email] otp_length = 6`; every `magiclink` and `recovery` token the function has minted also stores an email OTP that `POST /auth/v1/verify` accepts in the link's place; the gate pinned seven keys but not this one.

**Red** (af12e5fad): `assert-auth-signup-closed.mjs` requires `otp_length = 10` (two self-test cases added; self-test exit 0, 20 cases). The gate over `config.toml`: **exit 1**, 1 of 8 keys does not hold.

**Fix** (0cc944131): `otp_length = 10`, the auth service's maximum; `infra/modules/supabase/hosted-settings.json` `mailer_otp_length: 10` (the parity guard's existing "must agree" row; its rationale reworded); the authentication page (eight keys) and the deployment page (an Email OTP Length row and why); an update section in `.planning/todos/pending/2026-10-07-174-hosted-project-auth-settings-allowlist-and-function-variables.md`.

**Green:** the gate exit 0 (8 of 8); its self-test, `assert:hosted-settings-parity` and its self-test exit 0. The first gate set then found the dev-seed test that keeps the parity fixture one value away from the real settings red, because the fixture still held `mailer_otp_length: 6`; 2aeccb2d9 sets it to 10 (that test file: exit 0, 9 passed). After `yarn db:stop && yarn db:start` the auth container serves `GOTRUE_MAILER_OTP_LENGTH=10`. `otp_expiry` and `token_verifications` were left as they are.

## WR-04: skipped, an operator decision

The finding holds: `invitations_email_target_key` covers claimed rows and the DELETE policy refuses them. But it is the recorded decision of 174-CONTEXT D-07/D-08: "*Known limit, flagged:* because a claimed row counts and cannot be deleted through the admin path (D-08), an admin who revokes a grant cannot re-invite the same address to the same target. Accepted for v2.16; the admin tooling that would lift it is out of scope", and "re-inviting an address whose grant was revoked" is listed under the deferred residuals. Either fix the review offers (open-rows-only index, or a DELETE policy for claimed rows whose grant is gone) reverses that decision. **Decision for the operator.**

## IN-01: an unknown skip reason does not fail the claim

**Red** (ed9bb7bf0): `invitationAccess.test.ts`, **exit 1**: a skip reason the database may add later threw.

**Fix** (04e48ac41): the reason is any non-empty string; one the application does not know is read as `other`, which `InvitationSkipReason` now names. An empty, missing or non-text reason still fails the narrowing. **Green:** exit 0.

## IN-02: the witness is admitted only with the service role's key

**Verified.** `parseAccountAccessRequest` accepted any uuid as `witness` from any caller.

**Red** (20c012744): `contract.test.ts` (new `admitWitness` cases) and `flowConformance.test.ts`: **exit 1**.

**Fix** (07e21ef7a):
- `contract.ts` `admitWitness(request, authorization, serviceRoleKey)`: a link or recovery request keeps its witness only when its `Authorization` is `Bearer <SUPABASE_SERVICE_ROLE_KEY>`, compared over the whole length; an unset or empty key admits nothing.
- `index.ts` reads `Authorization` once, for the admission and for the address confirmation's caller. The conformance cases about header reads and the confirmation branch were updated to that one read.
- The E2E harness sends the service role's key as bearer on a witnessed request: `requestLink` with a witness, and `witnessPageRequest` on the request it intercepts (`tests/tests/utils/supabaseServiceRoleKey.ts` reads it from the suite's environment).

**Green:** vitest over `supabase/functions` exit 0, 1135 passed; `typecheck:tests` and eslint over the touched test files exit 0. The witnessed E2E specs are in the close run below.

## IN-03: skipped, an operator decision

The finding holds: the mailed link carries no `next`, so an admin invitee lands in the Contestant App. The fix the review proposes, landing `ADMIN_GRANTS` claimants in the Admin App, is a product change: the Admin App has no set-password gate, so a passwordless invited admin landing there could not set a password, and 174-CONTEXT lists "an Admin-app flow that claims a project-scope invitation" as out of scope. **Decision for the operator**, together with how an invited admin sets a password.

## IN-04 (= 178 IN-05): documented as a residual

The code sign-in calls `signInWithPassword` from the edge runtime, so the auth service's per-address `sign_in_sign_ups` budget is shared by every code sign-in; the email sign-in does the same from the frontend server. Not measured on a hosted project. Neither remedy (a trusted forwarded-address header, or a deployment-wide budget) was built: the first needs a hosted measurement to know which header the auth service trusts there. Recorded (879d51daf) at the call in `account-access/index.ts`, in `backend/authentication` § Known residuals, and in the hosted-settings todo with what to observe. **Decision for the operator** after the hosted measurement.

## Gates and E2E close of batch A

- **Gate set `review-fix-A`**, on 07e21ef7a: 20 of 22 rows exit 0. Two were red, both fixed in commits of their own: `unit` (dev-seed `hostedSettingsParityGate.test.ts`: the hosted-settings fixture for `max_rows` still carried `mailer_otp_length: 6`; 2aeccb2d9) and `format` (two docs tables needed the docs workspace's Prettier; 5e1a0b851).
- **Gate set `review-fix-A-r2`**, on 5e1a0b851: all 22 rows exit **0**. `179-verdict gates review-fix-A`: **PASS**, not stale, no Sleep entry in the window.
- The stack was restarted (`yarn db:stop && yarn db:start` through the key filter, exit 0) after the auth-config and function changes, before the first gate set (the auth container then served `GOTRUE_MAILER_OTP_LENGTH=10`), and again before the E2E run.
- **E2E close `review-fix-A`**, on 5e1a0b851, under `caffeinate`: **613 passed**, 0 failed, 0 flaky, 0 skipped, 0 did not run, 128 projects, 14.9 min. Wrapper exit 0, `restore: ok`. Not void; `sleep_entries_in_window: 0`. `179-verdict e2e review-fix-A --same-projects-as 179-review-fix-final`: **PASS**, 128 projects compared, 0 not as expected. New E2E test count delta: 0.
- After the run the throttle table held 27 `link-address:` keys, the largest count 1, so a full run uses little of an address's twenty a day.
- `yarn db:seed:default` exit 0 afterwards. `179-verdict hygiene`: PASS.
