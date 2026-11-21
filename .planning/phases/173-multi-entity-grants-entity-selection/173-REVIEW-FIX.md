---
phase: 173-multi-entity-grants-entity-selection
step: review-fix
batch: review-fix-A, review-fix-B
findings_fixed: [IN-04, WR-01, IN-02, IN-03, IN-05]
findings_not_fixed: [IN-01]
base: dd5dd97a7 (A), 19374478c (B)
gates: tests/e2e-runs/179-gates/review-fix-A-r2 (A), tests/e2e-runs/179-gates/review-fix-B-r3 (B)
e2e_close: tests/e2e-runs/179-e2e/review-fix-A (A), tests/e2e-runs/179-e2e/review-fix-B-r2 (B)
status: complete
---

# Phase 173 review fix: IN-04

Fixed in review-fix batch A, with phases 170, 172, 174, 178 and 179. The other findings of `173-REVIEW.md` were not in this batch.

## IN-04: LogoutButton logs a rejected logout on its direct path

**Disposition:** fixed.

**Verified:** `triggerLogout`'s `else` branch, which runs whenever no modal asks first (no loaded entity, answers locked, nothing left to count), awaited `logout()` bare, while `handleLogout` caught and logged.

**Red** (f73809832): vitest over `LogoutButton.svelte.test.ts`: **exit 1**; the new case "logs a logout that rejects on the direct path, where no modal asks first" saw nothing logged and an unhandled rejection.

**Fix** (6c9cb704c): both paths call one `logoutLogged()`, which catches and logs the rejection.

**Green:** vitest over `src/lib/contestant/gates` and `logoutButton`: **exit 0**, 114 passed.

## Commits

| Commit | Kind | What |
| --- | --- | --- |
| f73809832 | test | IN-04 red |
| 6c9cb704c | fix | IN-04 |

## Gates and E2E close of batch A

- **Gate set `review-fix-A`**, on 07e21ef7a: 20 of 22 rows exit 0. Two were red, both fixed in commits of their own: `unit` (dev-seed `hostedSettingsParityGate.test.ts`: the hosted-settings fixture for `max_rows` still carried `mailer_otp_length: 6`; 2aeccb2d9) and `format` (two docs tables needed the docs workspace's Prettier; 5e1a0b851).
- **Gate set `review-fix-A-r2`**, on 5e1a0b851: all 22 rows exit **0**. `179-verdict gates review-fix-A`: **PASS**, not stale, no Sleep entry in the window.
- The stack was restarted (`yarn db:stop && yarn db:start` through the key filter, exit 0) after the auth-config and function changes, before the first gate set (the auth container then served `GOTRUE_MAILER_OTP_LENGTH=10`), and again before the E2E run.
- **E2E close `review-fix-A`**, on 5e1a0b851, under `caffeinate`: **613 passed**, 0 failed, 0 flaky, 0 skipped, 0 did not run, 128 projects, 14.9 min. Wrapper exit 0, `restore: ok`. Not void; `sleep_entries_in_window: 0`. `179-verdict e2e review-fix-A --same-projects-as 179-review-fix-final`: **PASS**, 128 projects compared, 0 not as expected. New E2E test count delta: 0.
- After the run the throttle table held 27 `link-address:` keys, the largest count 1, so a full run uses little of an address's twenty a day.
- `yarn db:seed:default` exit 0 afterwards. `179-verdict hygiene`: PASS.

# Review-fix batch B: WR-01, IN-02, IN-03, IN-05

Fixed in review-fix batch B, with phases 175, 176 and 177. IN-01 was not in the batch: it is the claim-based policy design that pgTAP 36 pins, and the review asks for no change. IN-04 was fixed in batch A.

| Finding | Disposition | Commits |
| --- | --- | --- |
| WR-01 | fixed | 8fb1f744e (red), 038f0c685 (fix), a9f7c2511 (E2E fixture) |
| IN-02 | fixed | 6de25b18c (red), 1ac77f4e7 (fix) |
| IN-03 | fixed as documentation; the product alternative is an operator decision | b7ef8feaf |
| IN-05 | fixed | 444778c0e |

## WR-01: an entity's unsaved answers belong to the user who typed them

**Verified.** `editedAnswersKey` built `contestantContext-userData-editedAnswers-<type>-<id>` with no user in it, and only the menu's logout removed the drafts. Two editors of one organization on one browser: the second was shown, and would have saved, the first's unsaved answers.

**Red** (8fb1f744e): vitest over `contestantUserDataState.svelte.test.ts`, **exit 1**, 3 of 72 failed. Every `init` and key of the file now names the signed-in user.

**Fix** (038f0c685):
- `editedAnswersKey(entity, userId)` builds `<stem>-<userId>-<type>-<id>`.
- `init(data, userId)` removes every draft of the stem that is not the user's own, a key that names no user included, before the user's own is restored; `removePersistedByPrefix` takes a prefix to keep. A user's own drafts survive a sign-out for a later visit by the same user; another user's never reach the screen.
- The entity layout passes the user-level load's `user.id`, and shows its error view when there is none.
- Docs: `contestant-app/entity-selection` § Drafts.

**Green:** vitest over `src/lib/contexts` and the contestant routes **exit 0**, 1765 passed. The E2E fixture of `contestant-entity-selection` read the draft under the old key and was fixed in a9f7c2511 (see the E2E close below). The review's further suggestion, a sweep when the login screen mounts, was not built: it would also remove a user's own drafts after every server-side sign-out, and the init-time sweep already keeps another user's drafts from ever being shown.

## IN-02: the uuid matcher admits the lower-case form alone

**Red** (6de25b18c): `uuid.test.ts`, **exit 1**, 2 of 12 failed. **Fix** (1ac77f4e7): the matcher drops its `i` flag, as the Supabase adapter's own canonical-uuid check has none, so an upper-case id is a 404 instead of a redirect to the app root for the user's own entity. The matcher is used by the contestant entity tree alone. **Green:** vitest over `src/params` **exit 0**, 65 passed.

## IN-03: documented; serving settings without an entity is an operator decision

The finding holds: the settings page is a page of an entity, and the "nothing to edit" view offers support and logout and nothing else, as 173-CONTEXT D-11 specifies ("No other navigation into the app's protected pages"). The review's first remedy, documenting it, is done (b7ef8feaf): `NothingToEdit`'s component docs and the `entity-selection` docs page. Serving the settings outside the entity tree for a user with zero or several entities, and linking to them from the view, would change D-11. **Decision for the operator.**

## IN-05: comment residue the phase edited

Fixed (444778c0e), comments only: the `158-MOSTLY-PERMANENT` tag in `eslint.config.mjs`; the "criterion-9 count" and "moved in phase 162" sentences of `requireAdminIdentity.ts`; the decision ids E1, B3, C4 NOTE 1 and B4(a) in `contestantUserDataState.svelte.ts`, each restated as the current behaviour. vitest over the guards, the admin server code and the user-data state **exit 0**, 508 passed.

## Gates and E2E close of batch B

- **Gate set `review-fix-B`**, on 444778c0e: 20 of 22 rows exit 0. `lint` and `unit` were red for one cause: the new adapter source `utils/rpcAnswer.ts` was in neither list of `assert-project-scoped-queries.mjs` (the guard itself, and dev-seed `projectScopingGate.test.ts`); fixed in a633bf167. Before the second run, WR-01 of phase 177 was narrowed to new and moved nominations (3ca2fa7bf red, 456b5ee17 fix, migration `00007`).
- **Gate set `review-fix-B-r2`**, on 456b5ee17: all 22 rows exit **0**; `179-verdict gates review-fix-B`: **PASS**, no Sleep entry in the window.
- The stack was restarted (`yarn db:stop && yarn db:start` through the key filter, exit 0; the edge runtime up) before the E2E.
- **E2E close `review-fix-B`**, on 456b5ee17, under `caffeinate`: **red, not void** (no Sleep entry, no void marker): 2 failed, 383 did not run, 228 passed of 613. The two failures were `contestant-entity-selection`'s draft tests: its fixture read a draft at `<stem>-<type>-<id>`, the key form before 173 WR-01 added the user; the 383 are the perm chain anchored on that project. Fixed in the fixture (a9f7c2511), which finds the one key that ends `-<type>-<id>`.
- **E2E close `review-fix-B-r2`**, on a9f7c2511, under `caffeinate`: **613 passed**, 0 failed, 0 flaky, 0 skipped, 0 did not run, 128 projects, 16.2 min. Wrapper exit 0, the restore ran (`db:stop`, `db:start`, edge runtime running). Not void; `sleep_entries_in_window: 0`. `179-verdict e2e review-fix-B --same-projects-as review-fix-A`: **PASS**, 128 projects compared, 0 not as expected. New E2E test count delta: 0.
- **Gate set `review-fix-B-r3`**, on a9f7c2511, the tree the E2E close ran on: all 22 rows exit **0**; `179-verdict gates review-fix-B`: **PASS**, not stale, no Sleep entry in the window. This is the gate verdict of record for batch B.
- `yarn db:seed:default` exit 0 afterwards.
