---
phase: 172-terms-of-use-per-user-and-project
step: review-fix
batch: review-fix-A
findings_fixed: [IN-01]
findings_out_of_scope: [all others in 172-REVIEW.md]
base: dd5dd97a7
gates: tests/e2e-runs/179-gates/review-fix-A-r2
e2e_close: tests/e2e-runs/179-e2e/review-fix-A
status: complete
---

# Phase 172 review fix: IN-01

Fixed in review-fix batch A, with phases 170, 173, 174, 178 and 179. The other findings of `172-REVIEW.md` were not in this batch.

## IN-01: a failed Log Out of the terms gate is logged and ends the loading state

**Disposition:** fixed, with the sibling gate the finding names (`SetPasswordGate`); `IdentityProviderGate`, the third, is 179 IN-05 (see `179-REVIEW-FIX.md`).

**Verified:** `TermsOfUseGate.handleLogout` set `status = 'loading'`, which disables both buttons, and awaited `logout()` with no `try`. The context's `logout` awaits `goto(...)`, so a rejection left both buttons in the loading state and was unhandled. `SetPasswordGate.handleLogout` had the same shape with `loggingOut`.

**Red** (126982ed2): vitest over `src/lib/contestant/gates` and `logoutButton`: **exit 1**. The TermsOfUseGate case and the failure case of the new `SetPasswordGate.svelte.test.ts` failed, each with an unhandled rejection.

**Fix** (749931cc0): both handlers catch and log the rejection (`log.error`) and reset their state in `finally`.

**Test correction, in the fix commit.** The red TermsOfUseGate case asserted that both buttons end enabled, but Continue stays disabled until the terms are ticked, so that assertion could not pass. It now asserts that Log Out is enabled and that neither button shows the loading state. Run against the unfixed component it fails (**exit 1**, 1 failed of 12); with the fix it passes.

**Green:** vitest over `src/lib/contestant/gates` and `logoutButton`: **exit 0**, 114 passed, no unhandled error.

## Commits

| Commit | Kind | What |
| --- | --- | --- |
| 126982ed2 | test | IN-01 red: TermsOfUseGate case, new SetPasswordGate test file |
| 749931cc0 | fix | IN-01: TermsOfUseGate and SetPasswordGate handlers; the TermsOfUseGate case's assertion corrected |

## Gates and E2E close of batch A

- **Gate set `review-fix-A`**, on 07e21ef7a: 20 of 22 rows exit 0. Two were red, both fixed in commits of their own: `unit` (dev-seed `hostedSettingsParityGate.test.ts`: the hosted-settings fixture for `max_rows` still carried `mailer_otp_length: 6`; 2aeccb2d9) and `format` (two docs tables needed the docs workspace's Prettier; 5e1a0b851).
- **Gate set `review-fix-A-r2`**, on 5e1a0b851: all 22 rows exit **0**. `179-verdict gates review-fix-A`: **PASS**, not stale, no Sleep entry in the window.
- The stack was restarted (`yarn db:stop && yarn db:start` through the key filter, exit 0) after the auth-config and function changes, before the first gate set (the auth container then served `GOTRUE_MAILER_OTP_LENGTH=10`), and again before the E2E run.
- **E2E close `review-fix-A`**, on 5e1a0b851, under `caffeinate`: **613 passed**, 0 failed, 0 flaky, 0 skipped, 0 did not run, 128 projects, 14.9 min. Wrapper exit 0, `restore: ok`. Not void; `sleep_entries_in_window: 0`. `179-verdict e2e review-fix-A --same-projects-as 179-review-fix-final`: **PASS**, 128 projects compared, 0 not as expected. New E2E test count delta: 0.
- After the run the throttle table held 27 `link-address:` keys, the largest count 1, so a full run uses little of an address's twenty a day.
- `yarn db:seed:default` exit 0 afterwards. `179-verdict hygiene`: PASS.


---

# Review-fix batch C: WR-02, WR-03, WR-04, IN-01, IN-02

Fixed in review-fix batch C (base e93f172bb), with phases 170, 171, 174.1, 175 and 179. The batch's gate set and E2E close are given at the end of this section. WR-01 and IN-03 were not in this batch: they are the operator's.

| Finding | Disposition | Commits |
| --- | --- | --- |
| WR-02 | documented; the admin read is the operator's | a9ef05df5 |
| WR-03 | fixed | 4a58ab0db (red), ebd9af1aa (fix) |
| WR-04 | not fixed: reverses D-05, operator; the existence answer is documented | a9ef05df5 |
| IN-01 | no change needed: fixed in batch A | 749931cc0 (batch A) |
| IN-02 | fixed | fcd359fc9 (red), 27c9e3176 (fix) |

## WR-02: who can read an acceptance is stated; the admin read is the operator's

**Verified.** Only the accepting user reads an acceptance; no administrator can audit them, and the `project_id` index serves a lookup no API role can make.

**Why the policy is not added.** D-04 and D-05 give `authenticated` SELECT on its own rows and nothing else. A project-scoped admin read is a new reader of personal data and the first reader pgTAP 37's Section 7 census was written to refuse (D-15); who may audit acceptances is a product decision, and it is the TOU-F01 todo's.

**Fix** (a9ef05df5), the review's alternative: the table header (`schema/304-terms-of-use-acceptances.sql`) says that no API role but the accepting user reads an acceptance, that the index serves the service role and a future reader for audit, and that the audit and the Admin app's confirmation rule need a reader the table does not have. The TOU-F01 todo's first implementation note records that no administrator can read an acceptance and that the admin read is the decision the item needs. A `--` comment outside any function, so no migration.

## WR-03: a failed acceptance read rejects

**Red** (4a58ab0db): `supabaseDataWriter.test.ts`: **exit 1**, 1 of 264 failed; a failed acceptance read resolved with `termsOfUseAccepted: null`.

**Fix** (ebd9af1aa): `_getBasicUserData` throws `getBasicUserData: could not read the terms-of-use acceptance: <message>`, as the password-fact read beside it does. The protected layout already signs a user out with `loginFailed` when the user-level data cannot be read, so the gate no longer loops on a read that keeps failing. `BasicUserData.termsOfUseAccepted`'s doc says so. **Consequence, stated:** the Admin app's identity reads (`getUserData`, `requireAdminIdentity`) go through the same method, so a failed acceptance read now fails them too, as a failed password read already did.

**Green:** vitest over `supabaseDataWriter.test.ts`, the protected contestant routes, `lib/server/admin` and `routes/api/admin`: **exit 0**, 979 passed.

## WR-04: not fixed, a decision for the operator

**Verified.** The INSERT policy checks who and not which project, so an identity can write acceptance rows for any existing project, and the foreign key's `23503` for an id that names no project tells existing ids from others.

**Why it is not fixed.** D-05 records the first half as an accepted property ("the policy checks who, not which project ... It unlocks nothing"). The existence answer cannot be closed without constraining the insert to projects the caller holds a grant in, which is the change D-05 rejected. **Trade-off:** constraining closes the oracle and keeps other tenants' tables clean, at the cost of a private grant-reading helper in the policy and a user who cannot pre-accept a project before an invitation reaches them; leaving it keeps D-05 and an oracle over random UUIDs that is hard to use. **Documented** (a9ef05df5): the table header now states the existence answer beside the accepted property.

## IN-01: no change needed, fixed in batch A

`TermsOfUseGate.handleLogout` catches and logs a rejected `logout()` and resets its state in `finally` (749931cc0, this record's batch A section, with `SetPasswordGate`). The 179 IN-05 fix covered `IdentityProviderGate`. Nothing was left to change.

## IN-02: a failed rerun after a recorded acceptance is not a failed save

**Red** (fcd359fc9): `TermsOfUseGate.svelte.test.ts`: **exit 1**, 1 of 13 failed; with the acceptance recorded and `invalidateAll` rejecting, the gate showed `contestantApp.error.saveFailed`.

**Fix** (27c9e3176): the acceptance and the rerun have a `try` each. A failed acceptance is reported as before; a failed rerun is logged as the rerun's failure and the gate returns to idle, where Continue reruns it (accepting again is harmless).

**Green:** vitest over `src/lib/contestant/gates` and the protected contestant routes: **exit 0**, 771 passed.

## Gates and E2E close of batch C

- **Gate set `review-fix-C`**, on a756755c0: all 22 rows exit **0** on the first run (unit: frontend 6544 passed and 33 skipped, dev-seed 1210 passed; pgTAP 51 files and 2699 tests, PASS; integration 208 passed; schema equivalence equal). `179-verdict gates review-fix-C`: **PASS**, not stale (a756755c0 is tree-equal to HEAD outside `.planning/`), no Sleep entry in the window. This is the gate verdict of record for batch C, on the tree the E2E close ran on.
- The stack was restarted before the E2E run (`yarn db:stop && yarn db:start` through the key filter, exit 0; `supabase_edge_runtime_openvaa-local` Up).
- **E2E close `review-fix-C`**, on a756755c0, under `caffeinate`: **613 passed**, 0 failed, 0 flaky, 0 skipped, 0 did not run, 128 projects, 15.6 min. Wrapper exit 0, `restore: ok`. Not void; `sleep_entries_in_window: 0`. `179-verdict e2e review-fix-C --same-projects-as review-fix-B-r2`: **PASS**, 128 projects compared, 0 not as expected. New E2E test count delta: 0 (the batch adds assertions to existing tests, not tests).
- A control run for 174.1 WR-01, on a756755c0 with the protected layout's focus call removed: `tests/e2e-runs/179-controls/review-fix-C-174.1-wr01-unfixed`, `--project contestant-journey`, exit 1, the new focus step failed; see `174.1-REVIEW-FIX.md`.
- `yarn db:seed:default` exit 0 afterwards. `179-verdict hygiene`: PASS.
