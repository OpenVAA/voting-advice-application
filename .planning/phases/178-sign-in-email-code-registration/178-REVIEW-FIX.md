---
phase: 178-sign-in-email-code-registration
step: review-fix
batch: review-fix-A
findings_fixed: [WR-01, WR-02, IN-01, IN-02, IN-03, IN-05, IN-06]
findings_skipped: [WR-03]
findings_out_of_scope: [IN-04]
base: dd5dd97a7
gates: tests/e2e-runs/179-gates/review-fix-A-r2
e2e_close: tests/e2e-runs/179-e2e/review-fix-A
status: complete
---

# Phase 178 review fix

Fixed in review-fix batch A, with phases 170, 172, 173, 174 and 179. Three findings are the same defects as phase 174's and were fixed once, in the change described in `174-REVIEW-FIX.md`: WR-01 is 174 WR-02, WR-02 is 174 WR-01, and IN-05 is 174 IN-04. IN-04 (recovery for global and account grant holders) is a product decision left to the operator and was not touched.

| Finding | Disposition | Commits |
| --- | --- | --- |
| WR-01 (= 174 WR-02) | fixed | 0a9f5e6cd (red), 4a32bb33c (fix), 8faecac39 (docs) |
| WR-02 (= 174 WR-01) | fixed | 0a9f5e6cd, 4a32bb33c, 8faecac39 |
| WR-03 | skipped: operator decision | none |
| IN-01 | fixed | 0a9f5e6cd, 4a32bb33c |
| IN-02 | fixed: documented | e18da6138 |
| IN-03 | fixed: documented | 0e85f29ed |
| IN-04 | not in this batch | none |
| IN-05 (= 174 IN-04) | fixed as a documented residual | 879d51daf |
| IN-06 | fixed: comment | af7695c69 |

## WR-01: a longer bound per address, across projects

The `link-address:<sha256 hex>` slot: twenty sign-in or recovery mails per address per day in every project together, taken after the per-project minute slot by both `invitation_link_request` and `recovery_link_request`; `invitation_link_release` gives one take back. The key carries no project, so the project dimension no longer multiplies the bound. Red: pgTAP `49` section 3 (exit 1 before the fix); green: 49 17/17, full suite exit 0. Details, migration and docs in `174-REVIEW-FIX.md`. No per-IP limit was added.

## WR-02: an open code is bound to at most five addresses a day

`code-bind:<invitation id>`, five bindings to another address per code row per day, not given back. Red: pgTAP `49` section 2; green as above. Removing the never-confirmed users a rebound code created was not built.

## WR-03: skipped, an operator decision

The finding holds: the callback verifies the single-use token on the GET that opens the mailed link. 178-CONTEXT D-18 records that "if the research finds that likely, a confirm-then-verify step is the remedy and is raised with the operator, not built silently", and 178-VERIFICATION carries it as human item U-30, "A product decision with a security trade-off". A confirmation step could keep the mailed URLs (a page and a form action beside the endpoint), but it adds a step to every sign-in, recovery and change-of-address link, needs new copy in seven locales and a choice for a browser already signed in to another account. **Decision for the operator.**

## IN-01: a link request with a used code does not spend the code's sign-in budget

The claimed-code branch reads the claimant inline, without `invitation_code_claimant_email`; only the code sign-in takes the `code:` budget now. Red: pgTAP `49` section 4; green as above. Two cases of `39-invitations.test.sql` that asserted the old counting were updated.

## IN-02: documented

The finding holds, but the behaviour is the recorded J5 decision (178-CONTEXT: "`register/**` refuses to the login route" while answers are locked). The review's second fix was taken: the code sign-in screen's server module and the registration docs page now state that the screen is refused while answers are locked and while the code mode is off, and how a code-registered user signs in meanwhile (the email sign-in screen with the claimed address and password; the sign-in link, which ignores the lock, where the email or identity-provider mode is allowed). Doc-only, no red.

## IN-03: documented

Verified: `login`, `login/email` and `email-sent` have no server load, so a client-side navigation to them makes no request the hook sees; the registration screens have server loads and are caught. The app-gate module's doc now says the redirect holds on every request the server handles (a document request, a form post, the data request of a navigation to a page with a server load) and that a client navigation to an entry page with none is not redirected, its form posts still being caught. Doc-only, no red.

## IN-05: documented as a residual

See 174 IN-04 in `174-REVIEW-FIX.md`. The residual also names the email sign-in, which makes its `signInWithPassword` from the frontend server and so meets the same per-address budget.

## IN-06: comment corrected

`apps/frontend/eslint.config.mjs`: GROUP 2 holds six sites, three of them route files; the two phase citations take the bare `see phase 158` form; the incident narrative is gone. Comment-only.

## Gates and E2E close of batch A

- **Gate set `review-fix-A`**, on 07e21ef7a: 20 of 22 rows exit 0. Two were red, both fixed in commits of their own: `unit` (dev-seed `hostedSettingsParityGate.test.ts`: the hosted-settings fixture for `max_rows` still carried `mailer_otp_length: 6`; 2aeccb2d9) and `format` (two docs tables needed the docs workspace's Prettier; 5e1a0b851).
- **Gate set `review-fix-A-r2`**, on 5e1a0b851: all 22 rows exit **0**. `179-verdict gates review-fix-A`: **PASS**, not stale, no Sleep entry in the window.
- The stack was restarted (`yarn db:stop && yarn db:start` through the key filter, exit 0) after the auth-config and function changes, before the first gate set (the auth container then served `GOTRUE_MAILER_OTP_LENGTH=10`), and again before the E2E run.
- **E2E close `review-fix-A`**, on 5e1a0b851, under `caffeinate`: **613 passed**, 0 failed, 0 flaky, 0 skipped, 0 did not run, 128 projects, 14.9 min. Wrapper exit 0, `restore: ok`. Not void; `sleep_entries_in_window: 0`. `179-verdict e2e review-fix-A --same-projects-as 179-review-fix-final`: **PASS**, 128 projects compared, 0 not as expected. New E2E test count delta: 0.
- After the run the throttle table held 27 `link-address:` keys, the largest count 1, so a full run uses little of an address's twenty a day.
- `yarn db:seed:default` exit 0 afterwards. `179-verdict hygiene`: PASS.
