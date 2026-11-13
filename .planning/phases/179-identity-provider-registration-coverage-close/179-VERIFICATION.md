---
phase: 179-identity-provider-registration-coverage-close
verified: 2026-10-22T17:30:00Z
status: human_needed
score: 6/6 must-haves verified
covered_files:
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-01-PLAN.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-01-SUMMARY.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-02-PLAN.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-02-SUMMARY.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-03-PLAN.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-03-SUMMARY.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-04-PLAN.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-04-SUMMARY.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-05-PLAN.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-05-SUMMARY.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-06-PLAN.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-06-SUMMARY.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-07-PLAN.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-07-SUMMARY.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-08-PLAN.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-08-SUMMARY.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-09-PLAN.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-09-SUMMARY.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-10-PLAN.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-10-SUMMARY.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-11-PLAN.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-11-SUMMARY.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-12-PLAN.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-12-SUMMARY.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-13-PLAN.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-13-SUMMARY.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-14-PLAN.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-14-SUMMARY.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-15-PLAN.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-15-SUMMARY.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-16-PLAN.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-16-SUMMARY.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-17-PLAN.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-17-SUMMARY.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-18-PLAN.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-18-SUMMARY.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-19-PLAN.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-19-SUMMARY.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-20-PLAN.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-20-SUMMARY.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-21-PLAN.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-21-SUMMARY.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-22-PLAN.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-22-SUMMARY.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-23-PLAN.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-23-SUMMARY.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-24-PLAN.md"
  - ".planning/phases/179-identity-provider-registration-coverage-close/179-24-SUMMARY.md"
  - "apps/frontend/src/lib/contestant/gates/gates.ts"
  - "apps/frontend/src/routes/api/oidc/authorize/+server.ts"
  - "apps/frontend/src/routes/api/oidc/callback/+server.ts"
  - "apps/supabase/supabase/functions/account-access/addressConfirmation.ts"
  - "apps/supabase/supabase/functions/identity-callback/index.ts"
  - "apps/supabase/supabase/migrations/00003_address_confirmation_request.sql"
  - "tests/tests/specs/contestant/contestant-identity-provider.spec.ts"
covered_digest: "v3:sha256:7b0d587d76d432141473d7c7d2f1816bf1ceedb70cc7947e8584ff4c1d33238a"
behavior_unverified: 0
overrides_applied: 0
re_verification: false
human_verification:
  - test: "Look at the new screens rendered, in light and dark theme, on a phone width and at desktop width: CI1 in its five variants (new, returning with address, no address, pending, taken), CI2 in its three classes (cancelled, retry, no retry), and the registration-mode selector's identity-provider panel with the nested entity-type radio group."
    expected: "One anchor per surface, no overflow, readable contrast (the spec's secondary/primary on base-300 pass by a tenth), the hero and the type group laid out as 179-UI-SPEC.md describes."
    why_human: "179-UI-REVIEW.md audited code only (no stack was running) and states nothing was seen rendered. Axe scans and phone-width overflow checks in the E2E run cover accessibility and overflow, not visual judgement."
  - test: "A native speaker of da, et, fi, fr, lb and sv reads the 23 keys of contestantApp.identityProvider and the new contestantApp.register.identityProvider keys; the Swedish common.login label (\"Registrera dig\") is corrected or accepted."
    expected: "Wording is idiomatic and truthful about retrying (CI2) and about the pending address (CI1)."
    why_human: "Key parity across all seven locales is machine-verified; the quality of the translations is not."
  - test: "On CI1 as a user with a pending address, press \"Use a different address\" and consider whether a mis-press can be undone."
    expected: "The user can go back to the waiting-link view (Send again) or accepts that Log Out / a new address is the way out."
    why_human: "179-UI-REVIEW.md Top fix 1: the switch is one-way (the `switched` flag is never reset in IdentityProviderGate.svelte). It is a UX decision, not a failure of REG-05; no requirement text demands an undo."
---

# Phase 179: Identity-Provider Registration & Coverage Close Verification Report

**Phase Goal:** A user can register a candidate or an organization with the identity provider, gives the email they will sign in with, and goes straight to editing; with this the three registration modes are complete and covered end to end.
**Verified:** 2026-10-22
**Status:** human_needed
**Re-verification:** No, initial verification

All six roadmap success criteria hold in the code and in the recorded E2E evidence. The status is `human_needed` only because the new screens were never seen rendered and the non-English copy was not reviewed by a native speaker (see Human Verification Required). No gap blocks the goal.

## Goal Achievement

### Observable Truths

| # | Truth (roadmap success criterion) | Status | Evidence |
|---|-----------------------------------|--------|----------|
| 1 | A new user completes the provider's flow, which creates user and entity together, lands on CI1, enters the address, and on Continue goes to terms of use and editing with no wait and no set-password step; the address is pending and a link is mailed (REG-04) | VERIFIED | `identity-callback/index.ts` creates the account (invite recipe, no password), the entity and the grant, writes the record, then mints the sign-in token; the callback route `api/oidc/callback/+server.ts` invokes it with the server credential, verifies the token on the request's client and sets the arrival marker; `gates.ts` orders setPassword, identityProvider, termsOfUse, and the set-password gate needs `addressState === 'proved'`, so a pending user is never sent to it. E2E `contestant-identity-provider.spec.ts` "a new candidate identifies at the provider ..." drives gate, Continue, terms of use, home, then opens the mailed link as received and meets the set-password gate naming the proved address. 613/613 on e9a6c35e4. |
| 2 | With more than one allowed type the user chooses in the selector before the flow and the entity is of that type; with one, not asked; an organization's name and short name are entered on CI1 through multilingual inputs and saved to the already-created organization; created unconfirmed and nameless (REG-06, REG-07) | VERIFIED | `register/+page.svelte` reads `identityProviderEntityTypes`, shows the radio group only when asked, posts `{entityType}` to `/api/oidc/authorize`; the authorize endpoint checks it through `identityProviderEntityType` and sets the httpOnly `oidcEntityType` cookie; the callback re-checks and sends it; `identity-callback` `resolveEntityType` is the authority. `organizationRecord.ts` inserts `{project_id, confirmed:false}` with no name. `IdentityProviderGate.svelte` carries `name`/`shortName` as `LocalizedString` multilingual inputs and posts them to `/api/contestant/identity-provider`, which writes on the request's own client (RLS). E2E: party chosen, named in default locale, `confirmed` false, `name.en`/`shortName.en` asserted; forged type cookie refused; switched-off mode refused. |
| 3 | A returning user is told so and to sign in by email next time and continues without re-entering; a user who never gave an address is asked before any protected page; a pending address counts as given (REG-05) | VERIFIED | `gates.ts` identityProvider gate fires for `addressState === 'none'`, for an unnamed own organization, and for `arrival === 'existing'` with a pending or proved address; the arrival marker only adds a gate. The protected layout server load decides the gate on user-level data, not on the URL. E2E: returning with proved address; no address asked before settings opened directly; removed grant gives `no_entity`; pending address shown once, Send again, home reminder, settings; second candidate not created. |
| 4 | An identification failure shows CI2 with the support block and Try again; the message is truthful about retrying; a deliberate cancel is a cancel, in all seven locales (REG-08) | VERIFIED | `oidcError.ts` is a closed table of 9 codes in 3 classes (cancelled, retry, noRetry); `register/identity-provider/error/+page.svelte` renders per-class title and sentence, Try again for cancelled and retry only, the support block for all. `messages/{da,en,et,fi,fr,lb,sv}/contestantApp.identityProvider.json` each hold 23 keys, none empty. E2E: cancel and provider-error cases against the mock issuer, no account created. Locale wording quality is a human item. |
| 5 | The legacy registration flows are gone; no `preregister/` URL, constant, catalogue entry or spec refers to the removed routes; `register/` is the one tree (REG-14) | VERIFIED | `find apps/frontend/src/routes -ipath '*preregister*'` finds nothing; `/api/oidc` holds only `authorize` and `callback` (no token route); `node scripts/assert-no-preregister.mjs` run now: 2943 files scanned, 0 findings, exit 0; wired into `lint:check`. Only two `tsconfig.tsbuildinfo` build artefacts mention the word. `register/` holds `email`, `identity-provider/error`, `sign-in`. |
| 6 | Each registration mode has an E2E spec that follows the real email verify redirect; organization registration, entity selection with several grants and nomination definition each have E2E coverage; the full suite is green at close (E2E-01, E2E-02, E2E-03) | VERIFIED | `node scripts/assert-e2e-coverage-tags.mjs` run now: @reg-idp 16, @reg-email 2, @reg-code 1, @org-registration 2, @entity-selection 8, @nomination-definition 72, exit 0. Read the specs behind the tags: the identity-provider, email and code specs obtain the mailed link from the mail catcher (`confirmationLinkToOpen`, `signInLinkToOpen`, shape-asserted, origin rewritten only) and `page.goto` it; none builds the callback URL. `node tests/scripts/e2e-evidence.mjs tests/e2e-runs/179-e2e/179-review-fix-final`: total 613, passed 613, failed 0, flaky 0, skipped 0, didNotRun 0; `summary.json` void null, wrapper exit 0, restore ok. |

**Score:** 6/6 truths verified (0 present-but-behavior-unverified)

The E2E run is on e9a6c35e4. `git diff --name-only e9a6c35e4 HEAD` lists only `.planning/` files, so the run covers the code at HEAD.

### Review findings and their fixes (post-plan)

| Finding | Check made against the tree | Status |
|---------|-----------------------------|--------|
| CR-01 `confirm-address` throttle keyed on a caller-chosen project | `addressConfirmation.ts` `registeredIn(account, projectId)` returns `refused` before any slot; `00003_address_confirmation_request.sql` keys `confirm:<user id>` and `confirm-address:<sha256>` with no project, refuses unless `registered_entities` names the project, and adds `address_confirmation_release`; `assert:schema-migration-parity` run now passes (4 migrations, frozen mode matches) | VERIFIED |
| WR-01 `email_exists` branch resets a record; case-sensitive placeholder match | `identity-callback/index.ts` uses `holdsPlaceholderAddress` and `existingAccountSetup` (keep, initialise, refuse) from `placeholderAccount.ts` | VERIFIED |
| WR-02 a change completed by the current link alone left the unproved address | `addressConfirmation.ts` has `isCompletedChange` and `restoreAddress`; on anything but `confirmed` it restores the placeholder, gives the slot back and answers `refused`; "Secure email change" recorded as a deployment requirement and parity-checked | VERIFIED |
| IN-01 to IN-06 | Deferred by disposition (info, outside fix scope); none touches a success criterion | Noted |

`00001_initial_schema.sql` has an empty diff against the phase base (320bd265b). No `TBD`, `FIXME` or `XXX` marker in any file the phase changed.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `functions/identity-callback/index.ts` + 14 pure siblings | Credential-gated, matrix-checked creation of user, entity, grant, record, token | VERIFIED | 414 lines, wired; flow conformance tests pin the order |
| `functions/account-access/addressConfirmation.ts` | confirm-address operation | VERIFIED | Bounded, restores on partial completion |
| `migrations/00002`, `00003`, `00004` | Claim exclusion, confirmation request, caller-only taken fact | VERIFIED | Manifest and parity guard pass; 00001 untouched |
| `routes/api/oidc/{authorize,callback}/+server.ts` | Type cookie, server-side invoke | VERIFIED | Wired to `identityProviderEntityType` and `identity-callback` |
| `routes/api/contestant/identity-provider/+server.ts` + `identityProviderRegistration.ts` | Names, address, resend, marker clear | VERIFIED | Writes on the request's own client |
| `lib/contestant/gates/{gates,gateViews}.ts`, `IdentityProviderGate.svelte` | CI1 in every variant | VERIFIED | Gate order frozen and tested |
| `routes/contestant/register/identity-provider/error` | CI2 | VERIFIED | Class-only load, three classes |
| `scripts/assert-no-preregister.mjs`, `assert-e2e-coverage-tags.mjs` | REG-14 and E2E-01/02 proofs | VERIFIED | Both run now, exit 0 |
| `tests/tests/specs/contestant/contestant-identity-provider.spec.ts` | 826 lines, 16 tagged tests plus scans | VERIFIED | Read; real assertions, no placeholders |

### Key Link Verification

| From | To | Via | Status |
|------|----|----|--------|
| Register page | authorize endpoint | POST `{entityType}` | WIRED |
| Authorize | callback | httpOnly type cookie, matrix checked at both | WIRED |
| Callback | `identity-callback` | `functions.invoke` with server secret header | WIRED |
| Callback | session | `verifyOtp` on the function's token | WIRED |
| Callback | protected layout | arrival marker cookie | WIRED |
| Protected layout load | CI1 | `firstNeededGate` | WIRED |
| CI1 | registration endpoint | fetch with names and address | WIRED |
| Registration endpoint | `confirm-address` | `requestAddressConfirmation` | WIRED |
| Mailed link | set-password gate | verify redirect, proved address | WIRED (E2E) |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real data | Status |
|----------|------|--------|-----------|--------|
| CI1 | `user.addressState`, `ownOrganizationUnnamed` | `getBasicUserData` over the auth user and `private` facts | Yes (E2E asserts rows) | FLOWING |
| Register page types | `appSettings` registration matrix | settings row | Yes | FLOWING |
| CI2 | class | `oidcErrorClass` over the `error` param | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| No legacy route | `node scripts/assert-no-preregister.mjs` | 0 findings | PASS |
| Coverage tags | `node scripts/assert-e2e-coverage-tags.mjs` | 6 of 6 tags have tests | PASS |
| Migration parity | `yarn assert:schema-migration-parity` | frozen migrations match manifest | PASS |
| E2E record | `node tests/scripts/e2e-evidence.mjs <run>` | 613/613 | PASS |
| Gate rows | `tests/e2e-runs/179-gates/179-review-fix-r2/summary.tsv` | 22 rows, every exit 0 | PASS |

The E2E wrapper, the gates and the unit suites were not re-run: the session barred starting the stack. Their recorded results are on disk for the tree that equals HEAD outside `.planning/` (unit regression on HEAD: 25/25 turbo tasks, exit 0, as reported by the caller).

### Probe Execution

Step 7c: no `probe-*.sh` is declared by the phase or exists under `scripts/*/tests/`. Skipped.

### Requirements Coverage

Every ID is claimed by at least one plan's frontmatter and no ID mapped to Phase 179 is orphaned.

| Requirement | Source plans | Status | Evidence |
|-------------|--------------|--------|----------|
| REG-04 | 02, 03, 08, 09, 10, 11, 12, 13, 14, 15, 18, 19, 24 | SATISFIED | Truth 1 |
| REG-05 | 02, 03, 09, 11, 12, 14, 17, 18, 24 | SATISFIED | Truth 3 |
| REG-06 | 07, 08, 13, 15, 16, 20, 24 | SATISFIED | Truth 2 |
| REG-07 | 09, 12, 13, 16, 24 | SATISFIED | Truth 2 |
| REG-08 | 06, 20, 24 | SATISFIED | Truth 4 |
| REG-14 | 21, 22, 24 | SATISFIED | Truth 5 |
| E2E-01 | 04, 05, 14, 19, 23, 24 | SATISFIED | Truth 6 |
| E2E-02 | 16, 23, 24 | SATISFIED | Truth 6 |
| E2E-03 | 01, 04, 05, 24 | SATISFIED | Truth 6 (613/613, not void) |

`.planning/REQUIREMENTS.md` still shows these nine as `Pending` in its checklist and traceability table; marking them complete is the orchestrator's close-out step, not a gap in the code.

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| (phase-changed files) | `TBD`/`FIXME`/`XXX` | none found | None |
| `IdentityProviderGate.svelte` | `switched` never reset | Warning | One-way "use a different address"; UX only (human item 3) |

Accepted residuals recorded by the phase, not gaps: the auth service's own `PUT /auth/v1/user` existence oracle (accepted risk in 179-REVIEW-FIX.md); IN-01 to IN-06 deferred; Signicat cookie return (A5) and Back-from-provider (N-5) unverified for lack of a Signicat mock; carried items in 179-CARRIED-ITEMS.md (stale wording in no-edit documents, harness evidence holding the local stack key, which is a pre-existing harness concern).

### Human Verification Required

#### 1. Rendered look of the new screens

**Test:** View CI1 (five variants), CI2 (three classes) and the selector's identity-provider panel with the type group, in both themes, at phone and desktop width.
**Expected:** Layout and contrast as the approved UI-SPEC describes; nothing overflows.
**Why human:** The UI review was code-only; E2E checks accessibility and overflow, not visual quality.

#### 2. Native-language review

**Test:** Native readers check the 23 `contestantApp.identityProvider` keys and the new register keys in da, et, fi, fr, lb, sv; fix or accept Swedish `common.login`.
**Expected:** Idiomatic wording, truthful about retry and the pending address.
**Why human:** Parity is machine-checked; translation quality is not.

#### 3. One-way address switch on CI1

**Test:** As a user with a pending address, press "Use a different address".
**Expected:** Either a way back to the waiting-link view, or an accepted decision that there is none.
**Why human:** A UX decision recorded by the UI review as its first priority fix; no requirement asks for an undo.

### Gaps Summary

No gaps. Every roadmap success criterion is verified against the code and against a complete, non-void, fully green E2E run of 613 tests on the tree that equals HEAD outside `.planning/`. The three post-review findings (CR-01, WR-01, WR-02) are fixed in the code as read. The status is `human_needed` solely for the three items above.

---

_Verified: 2026-10-22_
_Verifier: Claude (gsd-verifier)_
