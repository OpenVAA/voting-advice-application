---
phase: 178-sign-in-email-code-registration
verified: 2026-10-16T16:45:00Z
status: human_needed
score: 6/7 must-haves verified
covered_files:
  - ".planning/phases/178-sign-in-email-code-registration/178-01-PLAN.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-01-SUMMARY.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-02-PLAN.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-02-SUMMARY.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-03-PLAN.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-03-SUMMARY.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-04-PLAN.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-04-SUMMARY.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-05-PLAN.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-05-SUMMARY.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-06-PLAN.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-06-SUMMARY.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-07-PLAN.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-07-SUMMARY.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-08-PLAN.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-08-SUMMARY.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-09-PLAN.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-09-SUMMARY.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-10-PLAN.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-10-SUMMARY.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-11-PLAN.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-11-SUMMARY.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-12-PLAN.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-12-SUMMARY.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-13-PLAN.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-13-SUMMARY.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-14-PLAN.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-14-SUMMARY.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-15-PLAN.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-15-SUMMARY.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-16-PLAN.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-16-SUMMARY.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-17-PLAN.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-17-SUMMARY.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-18-PLAN.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-18-SUMMARY.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-19-PLAN.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-19-SUMMARY.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-20-PLAN.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-20-SUMMARY.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-21-PLAN.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-21-SUMMARY.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-22-PLAN.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-22-SUMMARY.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-23-PLAN.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-23-SUMMARY.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-24-PLAN.md"
  - ".planning/phases/178-sign-in-email-code-registration/178-24-SUMMARY.md"
  - "apps/frontend/src/lib/contestant/gates/SetPasswordGate.svelte"
  - "apps/frontend/src/lib/contestant/gates/gates.ts"
  - "apps/frontend/src/routes/api/auth/callback/+server.ts"
  - "apps/frontend/src/routes/contestant/(protected)/+layout.server.ts"
  - "apps/frontend/src/routes/contestant/email-sent/+page.svelte"
  - "apps/frontend/src/routes/contestant/login/+page.svelte"
  - "apps/frontend/src/routes/contestant/login/email/+page.svelte"
  - "apps/frontend/src/routes/contestant/register/+page.svelte"
  - "apps/supabase/supabase/functions/account-access/linkIssue.ts"
  - "apps/supabase/supabase/schema/301-auth-functions.sql"
covered_digest: "v3:sha256:024edfb8d87115af17a291a731597ae42ce4fc158cef073217114228b12e4638"
behavior_unverified: 1
overrides_applied: 0
behavior_unverified_items:
  - truth: "Browser autofill and password managers work on every input of the sign-in, code-reuse, email-entry and set-password screens (ROADMAP SC4, second clause)"
    test: "In two browsers and one password manager: sign in from a saved account, save a password on the set-password view and on the reset page under the right address, fill the code-reuse sign-in, and confirm nothing is offered on the code field"
    expected: "The manager pairs the read-only, not-rendered user-name field of the set-password view with the new password; offers the saved account on sign-in; offers nothing for the registration code; a browser-suggested password passes the rule list"
    why_human: "The type, name and autocomplete attributes are asserted by unit tests on every component, but whether a real password manager honours them is the manager's behavior; no E2E can exercise it (todos 2026-10-16-178-entry-screens-with-two-browsers-and-one-password-manager and 2026-10-16-178-browser-suggested-passwords-against-the-rule-list)"
coincidental_reliance_items:
  - truth: "A user in their initial identity-provider registration is not asked to set a password (REG-11, last sentence)"
    reason: undeclared-precondition
    harden: "The gate reads the stored password, and the identity-callback creates its user with admin.createUser and no password. The exemption holds only because the auth service stores a password hash for such an account (probe row P3-IDP: set, measured in 178-02). Nothing in the repository declares or enforces it; Phase 179 owns the explicit exemption (178-B2)."
human_verification:
  - test: "Password managers (N-6): two browsers, one manager. Sign in from a saved account; save on the set-password view and on the reset page under the right address; fill the code-reuse sign-in; nothing on the code field"
    expected: "Each manager pairs and offers as the autocomplete hints declare"
    why_human: "A password manager's behavior cannot be driven by Playwright"
  - test: "Browser-suggested passwords against the rule list (N-7)"
    expected: "A suggested password satisfies, or is clearly rejected with a readable reason by, the rule list"
    why_human: "Suggestion generators are browser-owned"
  - test: "The whole entry flow by keyboard and with a screen reader, in en (includes the tab order of the sign-in screen)"
    expected: "Every control reachable and announced; focus moves to the heading of each new screen and to the first gate heading when a gate is passed"
    why_human: "Axe covers rules, not a walk with assistive technology"
  - test: "The new strings at 320 px in the six other locales; long text-button labels wrapping inside the button (the setter's 50-character main-button label)"
    expected: "No overflow, no clipped label"
    why_human: "Only en is asserted at 320 px; the other catalogues are constructed translations"
  - test: "Control edge against 3:1 on the shaded page, light and dark (N-8)"
    expected: "Edges meet 3:1"
    why_human: "Axe does not compute non-text contrast against a shaded background"
  - test: "65 seconds of wall clock against the server's 60 for the resend"
    expected: "A real-minute wait ends in a second mail, not in the 'asked again too soon' sentence"
    why_human: "Specs advance the page's clock; the real wait is never made (assumption in 178-24-SUMMARY, todo sixty-five-seconds)"
  - test: "U-30: the confirmation page between a mailed link and its verification (scanner-spendable link)"
    expected: "A decision whether the page is built; today the link is verified when opened"
    why_human: "A product decision with a security trade-off"
  - test: "Rendered-screen details from 178-09 to 178-19: ErrorMessage inline centred under start-aligned labels; the forgot-password link announced as a button; D2's long refusal sentence; the login screen's footer placement; the reset page's support button; E, D1 and D2 with no document title for the moment before they leave with nothing held; the identity-provider panel of the selector at phone width"
    expected: "Acceptable to the operator"
    why_human: "Visual judgment"
  - test: "A passwordless project-scope user passing the gate; the access token's bytes after updateUser in a browser; whether a stored link session lasts a whole run"
    expected: "Gate passes after saving; no token rotation that makes the next load read password_set false"
    why_human: "Flagged assumptions P4/N-5 and the stored-session lifetime; observed in Chromium only, no digest compared"
  - test: "A hosted project's dashboard settings: minimum password length 8, otp_expiry 3600, the Send Email hook public.send_email_hook, sign-up off, confirmations on"
    expected: "Dashboard equals the repository's config.toml"
    why_human: "The repository can neither set nor read a hosted dashboard"
  - test: "The constructed translations (da, et, fi, fr, lb, sv), by a native speaker (Swedish common.login reads 'Registrera dig')"
    expected: "Reviewed wording"
    why_human: "Language judgment"
---

# Phase 178: Sign-in, Email & Code Registration Verification Report

**Phase Goal:** A user reaches a signed-in session through the new entry flow, signing in with email, or registering by email or by code, over shared components, with the set-password step enforced once, in the layout.
**Verified:** 2026-10-16T16:45:00Z
**Status:** human_needed
**Re-verification:** No, initial verification

## Verdict

The goal is achieved in the codebase. All five ROADMAP success criteria resolve to VERIFIED against code that was read here and against the run artifacts that were re-read here (not the SUMMARY's restatement). The only reason the status is not `passed` is the human-verification list below: password-manager behavior, assistive-technology walk, six-locale rendering and the other backstops the phase itself declares it did not make. No FAILED truth, no missing artifact, no unwired key link, no blocker.

Verified independently of 178-24-SUMMARY.md:

- `tests/e2e-runs/178-e2e/178-24-final/summary.json`: 530 total, 530 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run, `void: null`; `results.json` holds 530 tests all with status `expected`; `head` file = `062127caeb27a490f3f4bc4ba8d9272e90401749`.
- `tests/e2e-runs/178-gates/178-24-final`: `summary.tsv` has 17 rows, every status 0; `head` = `062127cae...`; pgTAP log: `Files=45, Tests=2435`, `Result: PASS`.
- `178-24-bank-auth` 8/8 and `178-24-bank-auth-journey` 457/457, `void: null`, both at head `062127cae...`.
- `git diff --stat 062127cae..HEAD` outside `.planning/` is empty: HEAD (`af42bef7c`) differs from the evidence head only under `.planning/`.
- Every test title in the SUMMARY's requirement-to-test map that was spot-checked (25 title fragments) exists exactly once in `results.json` with status `expected`; the per-project counts (email-registration 11, code-registration 6, password-recovery 4, entry-scan 29, entry-phone 20, a11y-scan 30, closed-project 18, answers-locked 5, journey 1) match the SUMMARY.
- Unit tests run here: `yarn vitest run src/lib/contestant src/routes/contestant src/routes/api/auth src/lib/server/contestant src/lib/auth` in `apps/frontend`: 77 files, 1895 tests, all passed.
- `node scripts/assert-a11y-scan-wiring.mjs`: 0 violations (the phase's edit to it extends the list of scan files and requires `declareEntryScans`/`assertAxeScan`; it relaxes nothing).
- Debt-marker scan (`TBD|FIXME|XXX`) of the lines added by the phase outside `.planning/`: 0 hits.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SC1 (REG-01, REG-03): the login screen offers "Sign in with email" and, only when some registration mode is allowed, "Register"; Register opens the selector listing each allowed mode as an expandable option with one Continue, or the single mode directly | VERIFIED | `routes/contestant/login/+page.svelte`: sign-in link always; `registerOffered = listedRegistrationModes(appSettings).length > 0` gates the Register link; `answersLocked` lists nothing. `register/+page.svelte`: `RegistrationModeSelector` over `listed`; `mode` derived as the sole listed mode when `listed.length === 1`; server `+page.server.ts` calls `refuseUnlessRegistrationOffered(event,'any')`. E2E: "entry: the login screen offers both entries", "an empty matrix offers sign-in only...", "the code mode offers Register...", "registers by email through the mode selector", "validation: Continue with no mode..." all passed in 178-24-final |
| 2 | SC2 (REG-02, REG-10, REG-11): registering by email and "I have not set a password yet" (offered when email or identity-provider mode is allowed for any served type) both lead to "email sent" (resend with wait, support link, same response for any address, no backend error); the link signs in; a user without a password must set one before any other page, enforced by the layout | VERIFIED | `login/email/+page.svelte`: `linkOffered = signInLinkOffered(appSettings)` (email or IdP for any type) gates the button, which calls `sendEntryLink` then `goto(EmailSent)`. `sendEntryLink` resolves alike for success, failure or no answer (`settledOrBounded`) and holds no answer. `email-sent/+page.svelte`: `EmailSentResend` with `ResendCountdown`, `ContactSupport`, change-address and return buttons. `api/auth/callback/+server.ts`: verify, claim, refresh, land. Gate: `(protected)/+layout.server.ts` stage 3 `firstNeededGate(user)`; `gates.ts` `setPassword` first, `isNeeded: passwordSet === false`; the layout renders `GATE_VIEWS[data.gate]` in place of the page; `get_user_entities` returns `password_set` from `private.caller_password_set()` (`auth.uid()` only). Sole decision point: a repo-wide search for `passwordSet`/`firstNeededGate` finds the decision only in `gates.ts` and the protected layout load. E2E: tracer, "link button...", "oracle on sign-in", "oracle: an invited and an uninvited address...", "resend:", "first-time user: an address with an invitation only is mailed the sign-in link, and is asked to choose a password" all passed |
| 3 | SC3 (REG-09): a valid unused code leads to entering and confirming an email (D1) and on to E; a used code to password sign-in (D2); anything else to "We couldn't confirm your registration code." | VERIFIED | `register/+page.svelte` `handleCodeSubmit`: `checkInvitationCode` `valid` -> `RegisterEmail`, `used` -> `RegisterSignIn` (code held in the private entry flow, not the URL), any other answer or a failed check -> `codeUnconfirmed` at the field. `contestantApp.register.codeUnconfirmed` present in all 7 locales (en: "We couldn’t confirm your registration code."). `register/email` uses `EmailEntry`; `register/sign-in` uses `PasswordSignIn`. E2E: "an invited organization registers with a code", "used code: the same code leads to the password sign-in, and signs in", "unconfirmed: a code no project holds...", "reload:..." passed |
| 4a | SC4 (REG-13): the sign-in, password and email-entry pieces are the same shared components on the sign-in, code-reuse, email-entry and set-password screens, and every input carries type/autocomplete hints | VERIFIED | Imports: `login/email` -> `EmailField`+`PasswordSignIn`; `register/sign-in` -> `PasswordSignIn`; `register/email` -> `EmailEntry`; `SetPasswordGate`, `password-reset`, settings page -> `PasswordSetter`. Hints in source: `EmailField` `type="email" inputmode="email" autocapitalize="none" spellcheck="false"` with caller autocomplete (`username`/`email`); `PasswordSignIn` `current-password`; `PasswordSetter` read-only `username` field plus two `new-password` fields; `RegistrationCodeField` `autocomplete="off" autocapitalize="characters" spellcheck="false"`. Component unit tests (EmailField 19, PasswordSignIn 15, PasswordSetter 33, RegistrationCodeField 15, PasswordField 11, EmailEntry 24...) pass |
| 4b | SC4 (FIX-01): a password-reset link requested from inside the app completes and signs the user in, in whichever browser or device it is opened | VERIFIED | Recovery link is issued by the server (`account-access/linkIssue.ts`, `mintRecoveryToken`, no account created) as `.../api/auth/callback?token_hash=...&type=recovery`; callback does `verifyOtp({token_hash,type})` and redirects `recovery` to the reset page, whose server load decides on the session alone. `resetPasswordForEmail`, `toCallbackUrl` and `ContestantAppSetPassword` have no hit anywhere outside `.planning/` and the run directories. E2E: "recovery: a reset link asked for inside the app, opened in a browser that never asked for it, signs the user in and sets a new password" (opens the mailed link in a second browser context), "oracle: forgot-password...", "no session: the reset page..." passed |
| 5 | SC5: the email and code modes each have an E2E spec that follows the real emailed verify redirect, not a hand-built callback URL; the full suite is green at close | VERIFIED | `contestant-email-registration.spec.ts` and `contestant-code-registration.spec.ts` open `invitationFlow.signInLinkToOpen(address,...)`, which reads the link from the mail bucket; `tests/tests/utils/mailedLink.ts` normalises only the origin and asserts path, exactly the two parameters, and type, "never built here". Full suite 530/530 (above) |
| 6 | Set-password enforced once, in the layout (goal clause) | VERIFIED | See truth 2. One gate list (`CONTESTANT_GATES`, frozen), one view map (`GATE_VIEWS`), one load; the callback asks nothing about passwords; behavior (gate shown, passes after save via `invalidateAll`) is exercised by the tracer E2E, `setPasswordLayout.svelte.test.ts`, `layout.server.test.ts` and the `contestant-set-password-gate*` scans |
| 7 | SC4 second clause: browser autofill and password managers *work* on every input | PRESENT_BEHAVIOR_UNVERIFIED | Attributes present and asserted (truth 4a); a real manager's pairing is not exercised by any test and the phase declares the backstop not made. Routed to human verification |

**Score:** 6/7 truths verified (1 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/frontend/src/lib/contestant/gates/{gates.ts,gateViews.ts,SetPasswordGate.svelte}` | One gate list, views, set-password view | VERIFIED | Substantive, wired in the protected layout, data flows from `get_user_entities.password_set` |
| `apps/frontend/src/routes/contestant/(protected)/+layout.server.ts`, `+layout.svelte` | Gate decided in the layout | VERIFIED | Reads `passwordSet`, fails closed (signs out) on a non-boolean |
| `routes/contestant/{login,login/email,register,register/email,register/sign-in,email-sent,forgot-password,password-reset}` | Entry screens A, B, C, D1, D2, E and recovery | VERIFIED | All exist, all wired to the shared components and to the context's `sendEntryLink`/`checkInvitationCode`/`holdEntryCode` |
| `apps/frontend/src/lib/contestant/components/{emailField,emailEntry,passwordField,passwordSignIn,passwordSetter,registrationCodeField,registrationModeSelector,emailSentPanel}` | Shared components | VERIFIED | Each with `.type.ts`, barrel, docblock and unit test |
| `apps/frontend/src/lib/contestant/entryFlow/` + `contestantContext` | Private entry-flow state (code and address not in URL) | VERIFIED | `#entryFlow` private `$state`; `sendEntryLink` holds no server answer |
| `apps/frontend/src/lib/server/contestant/registrationGuard.ts` | Server enforcement of the registration matrix | VERIFIED | Used by `register/+layout.server.ts` and `+page.server.ts` |
| `apps/frontend/src/routes/api/auth/callback/+server.ts` | verify, claim, refresh, land | VERIFIED | `invite/signup/email` types refused; `recovery` -> reset page |
| `apps/supabase/supabase/functions/account-access/*` | Link and recovery issue | VERIFIED | `linkIssue.ts` fixed order: deployment checks, eligibility, issue, mail, slot release, witness; log lines carry no address |
| `apps/supabase/supabase/schema/{301,503,506,106}*.sql` | `user_password_set`, `caller_password_set`, `get_user_entities.password_set`, mode matrix | VERIFIED | Grants as described; pgTAP 45 files / 2435 tests pass |
| Legacy `checkRegistrationKey` / `CheckRegistrationData` / `resetPasswordForEmail` / `toCallbackUrl` / `ContestantAppSetPassword` | Removed | VERIFIED | `git grep` outside `.planning/` and run dirs: no hit |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| login screen | sign-in / register | links gated by `listedRegistrationModes` | WIRED | `login/+page.svelte` |
| sign-in screen | email-sent | `sendEntryLink` then `goto(ContestantAppEmailSent)` | WIRED | `login/email/+page.svelte` |
| register (code) | D1 / D2 | `checkInvitationCode` + `holdEntryCode` + `goto` | WIRED | `register/+page.svelte` |
| email-sent | resend | `resendEntryLink` -> `sendEntryLink` with the held request | WIRED | `contestantContext.svelte.ts` |
| mailed link | session | `/api/auth/callback` `verifyOtp` + `claimAndRefresh` | WIRED | `callback/+server.ts`; E2E follows the real mail |
| protected layout load | set-password view | `firstNeededGate` -> `data.gate` -> `GATE_VIEWS` | WIRED | `+layout.server.ts`, `+layout.svelte` |
| `get_user_entities` | `BasicUserData.passwordSet` | `parseCallerPasswordSet` (throws on non-boolean) | WIRED | `supabaseDataWriter.ts` |
| set-password view | gate removal | `setPassword` then `invalidateAll` | WIRED | `SetPasswordGate.svelte` |

### Data-Flow Trace (Level 4)

| Artifact | Data variable | Source | Real data | Status |
|----------|---------------|--------|-----------|--------|
| Protected layout gate | `user.passwordSet` | `get_user_entities` -> `private.user_password_set` reading `auth.users.encrypted_password` | Yes | FLOWING |
| Login screen | `registerOffered` | `appSettings` from `contestantApp.registrationModes` (stored matrix) | Yes | FLOWING |
| Email-sent screen | `request` / `address` | private entry flow written by `sendEntryLink` | Yes | FLOWING |
| Reset page | `data.email` | verified session user from `safeGetSession` | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Phase unit tests (gates, pages, components, callback, guard, session admission) | `yarn vitest run src/lib/contestant src/routes/contestant src/routes/api/auth src/lib/server/contestant src/lib/auth` | 77 files, 1895 passed | PASS |
| A11y wiring gate | `node scripts/assert-a11y-scan-wiring.mjs` | 0 violations | PASS |
| Closing run totals | read `178-24-final/summary.json` | 530/530, void null | PASS |
| Requirement titles present and passing | node over `178-24-final/results.json` | 25/25 fragments found once, `expected` | PASS |

The E2E suite and the database reset were not run here (shared stack; instructed). Their evidence is the run directories read above.

### Probe Execution

No `scripts/*/tests/probe-*.sh` is declared by the phase. The phase's own probe rows (P1 to P7, `178-probe.mjs`) are recorded in 178-02-SUMMARY.md and 178-PROBE-FINDINGS.md; their conclusions are assumptions the build rests on and are listed under Flagged items, not re-run (they need the live stack).

### Requirements Coverage

Every ID in the phase's list appears in PLAN frontmatter and in REQUIREMENTS.md, and each has passing, titled evidence. REQUIREMENTS.md checkboxes and traceability rows still read `[ ]` / `Pending`, and ROADMAP.md still shows Phase 178 `[ ]`; both are bookkeeping for the orchestrator to flip on acceptance, not code gaps. No orphaned requirement: every REQUIREMENTS.md row mapped to Phase 178 is claimed by at least one plan.

| Requirement | Claimed by (plans) | Completed in (summaries' `requirements-completed`) | Status | Evidence |
|-------------|--------------------|-----------------------------------------------------|--------|----------|
| REG-01 login offers Sign in with email and Register | 04, 08, 16, 18, 21, 22, 24 | 04, 08, 18, 21, 22, 24 | SATISFIED | Truth 1; E2E "entry:", closed-project cases, answers-locked cases |
| REG-02 "I have not set a password yet" | 02, 08, 09, 13, 14, 17, 18, 21, 24 | 08, 09, 13, 18, 21, 24 | SATISFIED | Truth 2; `signInLinkOffered`; "link button", "oracle on sign-in", code-registration "I have not set a password yet" |
| REG-03 mode selector | 08, 10, 16, 21, 22, 24 | 08, 10, 16, 21, 22, 24 | SATISFIED | Truth 1; selector unit test (23); entry-register scans |
| REG-09 code registration (valid, used, unconfirmed) | 03, 05, 09, 10, 12, 15, 16, 17, 21, 23, 24 | 03, 05, 09, 10, 12, 17, 21, 23, 24 | SATISFIED | Truth 3; 6 code-registration tests |
| REG-10 email registration, "email sent", resend, no backend error | 03, 05, 06, 07, 08, 10, 12, 13, 14, 16, 17, 19, 20, 21, 24 | 03, 05, 06, 07, 08, 10, 12, 13, 17, 19, 21, 24 | SATISFIED | Truth 2; oracle, resend, asked-again, reload tests |
| REG-11 set-password gate in the layout; IdP initial registration not asked | 01, 02, 04, 11, 12, 14, 20, 22, 24 | 04, 11, 12, 14, 22, 24 (01 and 02 declare none: instruments and probes; 20 declares none) | SATISFIED (see note) | Truth 2 and 6; 178-14 is the plan that builds the gate and completes it; tracer, first-time-user, gate scans, phone-320 |
| REG-13 shared components, autofill hints | 08, 09, 11, 13, 15, 17, 18, 19, 21, 22, 23, 24 | 08, 09, 11, 13, 19, 21, 22, 23, 24 | SATISFIED for hints; real-manager behavior is human item | Truth 4a, 7 |
| FIX-01 in-app reset completes in any browser | 01, 02, 06, 07, 08, 12, 19, 20, 21, 22, 23, 24 | 06, 07, 08, 12, 19, 21, 22, 23, 24 | SATISFIED | Truth 4b; cross-context recovery test |

REG-11 note: the requirement's last sentence ("a user in their initial identity-provider registration is not asked") is satisfied by the J2 (a) design, in which the gate reads the stored password and `identity-callback` is unchanged. It rests on the measured fact P3-IDP (an IdP-shaped account stores a password hash), which nothing in the repository declares; see `coincidental_reliance_items`. The bank-auth-journey (457/457) passes through this path green. Phase 179 owns making the exemption explicit.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `apps/frontend/src/routes/contestant/preregister/(authenticated)/email/+page.svelte` | 30 | Mail-template `registrationUrl` still built as `ContestantAppRegister?registrationKey=<%= candidate.registrationKey %>`; the register page no longer reads that parameter, so the link opens the mode selector and the key is dropped | Warning | Inside `preregister/`, which is Phase 179's to remove (D-19, roadmap operator note). Does not defeat the Phase 178 goal; Phase 179 must repoint or remove it |
| `apps/frontend/src/lib/server/contestant/registrationGuard.test.ts` | 185 | `registrationKey` in a test that the guard drops it | Info | Deliberate |
| debt markers `TBD`/`FIXME`/`XXX` in added lines | n/a | none | n/a | 0 hits |

No stubs found: no placeholder returns, no hollow props, no console-only handlers in the files read.

## Items the operator must rule on (recorded; none defeats the goal)

1. **Baseline sum lacks `perm-answers-locked` +1.** Confirmed in the data: `perm-answers-locked` holds 5 tests in `178-24-final`; 178-24 Task 2 as written exits 1 on it, restated with `--except perm-answers-locked=1` exits 0. The chain table in 178-24-SUMMARY shows the +1 arriving at `178-16-close` (452 = 445 + 7), where 178-16 moved the answers-lock case into that spec (4 to 5 tests). Run totals are internally consistent (530 = 444 + 86). The phase's closing verify, as written, therefore cannot pass; the figure is reported, not edited.
2. **178-22's "both fields in error" is not showable.** `validate()` reports one field at a time; the confirmation field's error is the marker. The scan `contestant-set-password-gate-invalid` passed in light and dark.
3. **CLAUDE.md Auth bullet is now false.** It still says "cookie-based sessions with PKCE" and that `account-access` mails "a sign-in link" only. The replacement is in 178-23-SUMMARY.md and 178-24-SUMMARY.md (§ For the operator). CLAUDE.md is outside the phase's scope and was not edited.
4. **pgTAP image from Docker Hub.** The pgTAP row passed (45 files, 2435 tests) on `supabase/pg_prove:3.36` tagged under the ECR name; identity with the ECR image is assumed, not compared.
5. Remaining open items 1 to 24 of 178-24-SUMMARY (P7 timing, `P6-OTP` oracle, interim rulings 7, 8, 11, 12, commits `f7212f546`/`250e4215b` red alone, the unrun `170-allowlist-probe.sh` after the restore, etc.) are recorded there and are residuals or rulings, not unmet truths.

## Flagged assumptions (carried from 178-24-SUMMARY; none contradicted by what was read here)

- The FIX-01 edge list (other browser, second open, later request, unknown address) is the planner's reading of an unclassified probe row; edges outside it (a link opened while another user is signed in in the same browser) are untested.
- No `refreshSession()` after a saved password (P4): the gate passes by `invalidateAll()`; observed in Chromium only.
- 65 s client wait against the server's 60 s; stored passwordless session lifetime; `create_invitations` two-argument form until Phase 177.1 lands.

## Human Verification Required

See the `human_verification` and `behavior_unverified_items` entries in the frontmatter (11 items). They are the 178-24-SUMMARY "list for a person" and the seven `2026-10-16-178-*` todos, plus the hosted-dashboard check. Automated checks are all green.

## Gaps Summary

None. No truth failed, no artifact is missing or a stub, no key link is unwired, and no blocker anti-pattern exists. Open: the human-verification list, one behavior-unverified truth (real password-manager behavior), one coincidental-reliance advisory (the identity-provider exemption rests on a measured, undeclared precondition), and the bookkeeping rows (REQUIREMENTS.md checkboxes, ROADMAP `[ ]`) for the orchestrator.

---

_Verified: 2026-10-16T16:45:00Z_
_Verifier: Claude (gsd-verifier)_
