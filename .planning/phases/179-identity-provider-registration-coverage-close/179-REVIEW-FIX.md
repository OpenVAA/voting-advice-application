---
phase: 179-identity-provider-registration-coverage-close
step: review-fix
findings_fixed: [CR-01, WR-01, WR-02]
findings_out_of_scope: [IN-01, IN-02, IN-03, IN-04, IN-05, IN-06]
base: e8c820377
head: e9a6c35e4
gates: tests/e2e-runs/179-gates/179-review-fix-r2
e2e_close: tests/e2e-runs/179-e2e/179-review-fix-final
status: complete
---

# Phase 179 review fix: CR-01, WR-01, WR-02

Each finding was handled in the same order: first a failing test, with the exit of its red run recorded; then the fix; then the green run. After that came the full gate set and one full E2E close run on the final tree. Info findings IN-01 to IN-06 were not touched. The auth service's own `PUT /auth/v1/user` address oracle stays an accepted risk and was not touched.

## CR-01: the `confirm-address` bounds no longer depend on a project the caller chooses

**Red** (5997b3718):
- pgTAP `48-address-confirmation-request.test.sql`, run together with `00-helpers` (`supabase test db`): **exit 1**. Failed test 11 of 17: "ACR: the same user's request naming another project it registered in answers false: one user has one budget whatever project the request names".
- Unit `addressConfirmation.test.ts`: **exit 1**, 2 failed and 74 passed. The failures were "refuses a project the account registered no entity in, and takes no slot" and "refuses an account that registered no entity in any project, and takes no slot".

**Fix** (b1f981564, formatting in 8935255d5, docs in e8e58ad47):

*(a) The Edge Function.*
- `callerAccount` now exposes `registeredProjects`, read by the new `registeredProjectsOf(app_metadata)`: the lower-cased own keys of `registered_entities` whose value is an object.
- `confirmAddress` answers `refused` for a `projectId` the account's record does not name. This happens after `mayAsk` and before any slot is taken. A conformance case pins the order.

*(b) The SQL.* `00003_address_confirmation_request.sql` was edited in place. The manifest hash was updated, and `schema/506-invitation-rpcs.sql` was kept equal to it. `00001` was not touched.
- The caller's slot is `confirm:<user id>`: 10 per 15 minutes, whatever the project.
- The address's slot is `confirm-address:<sha256 hex>`: one per 60 seconds, whatever the project.
- `address_confirmation_request` keeps its signature `(p_project_id, p_user_id, p_email)`. It now answers false, and writes nothing, unless the user's `raw_app_meta_data.registered_entities` holds an entry for `p_project_id`. This repeats the function's check inside the database.
- **Key family decision, stated in the SQL header.** The confirmation's address slot no longer shares the per-project `link:` family, because a project-independent slot cannot share a per-project key. A confirmation mail and a sign-in or recovery mail to one address are now limited each on its own, one a minute each. They need no shared slot: a change-of-address link neither stops an unopened sign-in or recovery link nor is stopped by one.
- The new `address_confirmation_release(p_email)` gives back the `confirm-address:` slot. It is SECURITY DEFINER, has an empty `search_path` and is the service role's alone. The function's `releaseSlot` now calls it in place of `invitation_link_release`.
- The `07-rpc-security` census went from ten to eleven functions. `packages/supabase-types` was regenerated.

**Docs.** The following now state the per-account and per-address bounds, the registered-project rule and the key forms:
- `contract.ts` header and `ConfirmAddressRequest.projectId`
- the migration and schema headers
- the docs pages `backend/edge-functions` and `contestant-app/bank-authentication`
- `apps/supabase/README.md`
- `.claude/skills/database/{SKILL,schema-reference,rls-policy-map}.md`

The `backend/authentication` page states no per-project bound, so it was not edited.

**Green:**
- `vitest` over `supabase/functions`: **exit 0**, 1099 passed.
- The full pgTAP suite: **exit 0**, 48 files and 2640 tests, PASS.
- `assert:schema-migration-parity`, `assert:rpc-nullability`, `assert:comment-hygiene`, `assert:project-scoped-queries` and `assert:edge-function-env`: each **exit 0**.

## WR-01: `identity-callback` finds its placeholder account without regard to case, and keeps a finished record

**Red** (7b29de94a): `vitest` over the new `placeholderAccount.test.ts` and `identity-callback/flowConformance.test.ts`: **exit 1**.
- The new module did not exist yet, so its test file failed to load.
- Two conformance cases failed: the lookup goes through `holdsPlaceholderAddress`, and the `email_exists` branch consults `existingAccountSetup`.

**Fix** (d7a205f6f):
- The new pure sibling module `identity-callback/placeholderAccount.ts` holds two functions:
  - `holdsPlaceholderAddress(account, placeholder)` compares the trimmed, lower-cased addresses.
  - `existingAccountSetup(app_metadata, matchValue)` answers `keep` (with the metadata) for an account that already carries this identity's match value, `initialise` for one that carries none, and `refuse` for one that carries another identity's match value.
- `index.ts` uses both:
  - `findUserByPlaceholderAddress` matches without regard to case.
  - On `email_exists`, a `keep` account's record is kept and no reset is written.
  - A `refuse` throws `ERR_ACCOUNT_CREATE_FAILED` (answered `unavailable`).
  - A freshly invited or unfinished account is confirmed and initialised exactly as before.

**Green:** `vitest` over `supabase/functions`: **exit 0**, 1116 passed (27 files).

## WR-02: a change of address completed by the current link alone is undone

**Red** (ad2755be9): `addressConfirmation.test.ts`: **exit 1**, 3 failed and 88 passed. The failing cases have `verifyCurrent` answer `'completed'` and expect three things: the placeholder is put back, nothing is mailed, and the answer is `refused`. One of them has the restore itself fail.

**Fix** (ee18547d8, docs in 94ba0a87b):
- **The verification's answer.** `verifyCurrent` now answers `'confirmed'`, or `'completed'` when the auth service issued a session (the new `isCompletedChange(status, body)`). It rejects for anything else.
- **The undo.** On anything but `'confirmed'`, `confirmAddress` does three things:
  - it logs a fixed line;
  - it calls the new `restoreAddress({ userId, email: <the account's own placeholder> })`;
  - it gives the address's slot back and answers `refused`. Nothing is mailed. A failed restore is logged, and the answer is still `refused`.
- **The restore in `index.ts`.** It refuses any address that is not a placeholder, then calls `updateUserById(userId, { email, email_confirm: true })`. This is now the one admin update in `account-access` that carries an address. The conformance cases "no admin update carries an email key" and "no email_confirm anywhere" were narrowed to that single, pinned exception.
- **The deployment requirement.** "Secure email change" (`double_confirm_changes`) is now a stated deployment requirement:
  - a row and a bullet in `developers-guide/deployment` § Auth settings of a hosted project;
  - the `edge-functions` and `bank-authentication` pages;
  - the `account-access` header;
  - the database skill;
  - an update section in `.planning/todos/pending/2026-10-07-174-hosted-project-auth-settings-allowlist-and-function-variables.md`.
- **The parity check.** `assert:hosted-settings-parity` **already carries it**, as a "must agree" row: `double_confirm_changes` against `mailer_secure_email_change_enabled`, with `true` in `infra/modules/supabase/hosted-settings.json`. Only its rationale text was extended to name the address confirmation. No row was added. `assert:auth-signup-closed`, the local-file gate, was not extended.

**Green:**
- `vitest` over `supabase/functions`: **exit 0**, 1126 passed.
- `assert:hosted-settings-parity` and `--self-test`: each **exit 0**.

## The first close run was red: the E2E helpers released the old slot

`tests/e2e-runs/179-e2e/179-review-fix-close` ran on 94ba0a87b. It was not void and recorded no sleep entries.
- **Counts:** 613 total, 586 passed, **4 failed**, 23 did not run. Wrapper exit **1**, `restore: ok`.
- **Failures:** four `contestant-identity-provider` tests: the two "an address awaiting its link" tests, which expected 2 confirmation mails and received 1, and the two "two identities give one address" tests. The 23 that did not run are the `perm-closed-project` chain that depends on them.
- **Cause:** a consequence of CR-01's new key family. The resend helpers (the gate, the home reminder, the settings page) and `identityProviderFlow.giveBackMailSlot` released the per-project `link:` slot. The confirmation's slot is now `confirm-address:`, so the second mail was refused by the interval.
- **Fix** (e9a6c35e4, test helpers only):
  - The new `SupabaseAdminClient.releaseConfirmationSlot(email)` calls `address_confirmation_release`.
  - The three resend helpers use it.
  - `giveBackMailSlot` gives back both slots.

The run was then made again on that changed tree, never on the unchanged one.

## Gate rows

**Final:** `tests/e2e-runs/179-gates/179-review-fix-r2`, on e9a6c35e4. All 22 rows exit **0**:
- typecheck, lint, db-reset, types-regen, types-clean, pgtap, sql-lint
- integration, unit, check-frontend, build, format, docs-links
- name-gate-self-test, test-keys-scope, preregister-gone-self-test, coverage-tags
- auth-config, auth-config-self-test, fn-closed, stack, equivalence

`179-verdict gates 179-review-fix`: **PASS**. The run is not stale, and power shows no sleep entry. The earlier set `179-review-fix`, on 94ba0a87b, was also 22/22. It went stale when e9a6c35e4 changed `tests/`.

The edge runtime was restarted (`yarn db:stop && yarn db:start`, through the key filter, exit 0) after the Deno function changes and before the first gate set. `yarn db:seed:default` was run after the final gate set (exit 0).

## E2E close

`tests/e2e-runs/179-e2e/179-review-fix-final`, on e9a6c35e4:
- **613 passed**, 0 failed, 0 flaky, 0 skipped, 0 did not run, across 128 projects, in 15.0 min.
- Driver and wrapper exit **0**, `restore: ok`.
- **Not void**, with `sleep_entries_in_window: 0`.
- Power: battery at 37 % at the start, AC at the end.

`179-verdict e2e 179-review-fix-final --same-projects-as 179-24-final --expect-project contestant-identity-provider --expect-project bank-auth`: **PASS**.
- 128 projects were compared, and none was not as expected.
- `contestant-identity-provider` is 40/40 and `bank-auth` is 11/11.
- The log is at `_drivers/179-review-fix-final.verdict.log`.

**New E2E test count delta: 0.** The fix added unit and pgTAP cases only: 19 ACR assertions where there were 17, one more `07` census line value, and new vitest cases.

`179-verdict hygiene`: **PASS**.

## Deviations

1. **[Rule 2] The SQL repeats the registered-project check.** `address_confirmation_request` keeps `p_project_id` and refuses a project the user's `registered_entities` does not name. The review only asked that the keys drop the project. This keeps the bound in the database even if a future caller of the RPC forgets the check. The pgTAP fixture writes `registered_entities` for the asking users, and the "Arguments" case adds three refusals that write nothing: an unregistered project, a user with no record, and a user who does not exist.
2. **[Rule 3] A new RPC, `address_confirmation_release`.** It was needed because the address slot left the `link:` family, which `invitation_link_release` serves. The `07` census and the database skill's census count were updated.
3. **[Rule 2] WR-01 also refuses another identity's account.** A lookup that ignores case can name the account of an identity whose `sub` differs only in case. Such an account is refused rather than having its record overwritten.
4. **WR-02 relaxes two conformance invariants.** The fix necessarily writes an address: the account's own placeholder. Two `account-access` conformance invariants were narrowed to exactly that one pinned exception, which is guarded against any address that is not a placeholder.
5. **The migration commit carries no `[db]` tag.** b1f981564 changes a migration and is titled `fix(179-review): …`, the form this step's dispatch prescribed. `.agents/code-review-checklist.md` asks for `fix[db]…`. History was not rewritten; the ship-review-stack reconstruction should apply the tag.
6. **Formatting has its own commit** (8935255d5), as the checklist prefers.
7. **One red E2E close**, caused by the test helpers and fixed as described above.

## Commits

| Commit | Kind | What |
| --- | --- | --- |
| 5997b3718 | test | CR-01 red: pgTAP budget across projects; unit refusal of an unregistered project |
| b1f981564 | fix | CR-01: function refusal, project-independent slots, `address_confirmation_release`, 00003 = 506, types |
| 8935255d5 | fix | CR-01 formatting |
| e8e58ad47 | docs | CR-01 docs and skill references |
| 7b29de94a | test | WR-01 red |
| d7a205f6f | fix | WR-01: `placeholderAccount.ts`, `index.ts` wiring |
| ad2755be9 | test | WR-02 red |
| ee18547d8 | fix | WR-02: `verifyCurrent` outcome, `restoreAddress`, conformance |
| 94ba0a87b | docs | WR-02: Secure email change required; hosted settings todo |
| e9a6c35e4 | test | E2E helpers release the confirmation slot |

## Self-Check: PASSED

- All ten commits above are ancestors of HEAD.
- These files exist: `apps/supabase/supabase/functions/identity-callback/placeholderAccount.ts` and its test, `apps/supabase/supabase/migrations/00003_address_confirmation_request.sql`, and `tests/e2e-runs/179-e2e/179-review-fix-final/summary.json`.
- The gate verdict and the E2E verdict both PASS on e9a6c35e4.

---

# Review-fix batch A: IN-05, IN-06

Fixed in review-fix batch A (base dd5dd97a7), with phases 170, 172, 173, 174 and 178. The batch's gate set and E2E close are given at the end of this section; the records of the other phases are their own `*-REVIEW-FIX.md` files.

## IN-05: IdentityProviderGate's Log Out logs a rejection and ends its loading state

**Disposition:** fixed.

**Verified:** `handleLogout` reset `loggingOut` only after a successful `await logout()`; a rejection left the button loading and was unhandled. The same shape in `TermsOfUseGate` and `SetPasswordGate` is 172 IN-01, and `LogoutButton`'s direct path is 173 IN-04.

**Red** (40bbc24d4): `IdentityProviderGate.svelte.test.ts`, the new case "logs a failed Log Out and gives the button back": **exit 1**, the button stayed disabled and the rejection was unhandled.

**Fix** (59ead4090): `try { await logout(); } catch (e) { log.error(...) } finally { loggingOut = false; }`. The `catch` is needed beside the review's `finally`, which alone would still leave the rejection unhandled.

**Green:** vitest over `src/lib/contestant/gates` and `logoutButton`: **exit 0**, 114 passed.

## IN-06: the OIDC callback clears the flow cookies on its early failures

**Disposition:** fixed.

**Verified:** only the entity-type cookie was removed before the provider-error and missing-code redirects; `oidc_state`, `oidc_nonce` and `oidc_code_verifier` stayed until their 600 s expiry.

**Red** (9144f56c3): `callback-endpoint.test.ts`, four new cases (both bindings, both early failures): **exit 1**.

**Fix** (2be5f7e2c): `clearFlowCookies(cookies)` before both redirects; the module's step list says so.

**Green:** the same file, **exit 0**.

## Gates and E2E close of batch A

- **Gate set `review-fix-A`**, on 07e21ef7a: 20 of 22 rows exit 0. Two were red, both fixed in commits of their own: `unit` (dev-seed `hostedSettingsParityGate.test.ts`: the hosted-settings fixture for `max_rows` still carried `mailer_otp_length: 6`; 2aeccb2d9) and `format` (two docs tables needed the docs workspace's Prettier; 5e1a0b851).
- **Gate set `review-fix-A-r2`**, on 5e1a0b851: all 22 rows exit **0**. `179-verdict gates review-fix-A`: **PASS**, not stale, no Sleep entry in the window.
- The stack was restarted (`yarn db:stop && yarn db:start` through the key filter, exit 0) after the auth-config and function changes, before the first gate set (the auth container then served `GOTRUE_MAILER_OTP_LENGTH=10`), and again before the E2E run.
- **E2E close `review-fix-A`**, on 5e1a0b851, under `caffeinate`: **613 passed**, 0 failed, 0 flaky, 0 skipped, 0 did not run, 128 projects, 14.9 min. Wrapper exit 0, `restore: ok`. Not void; `sleep_entries_in_window: 0`. `179-verdict e2e review-fix-A --same-projects-as 179-review-fix-final`: **PASS**, 128 projects compared, 0 not as expected. New E2E test count delta: 0.
- After the run the throttle table held 27 `link-address:` keys, the largest count 1, so a full run uses little of an address's twenty a day.
- `yarn db:seed:default` exit 0 afterwards. `179-verdict hygiene`: PASS.


---

# Review-fix batch C: IN-01, IN-02, IN-03, IN-04

Fixed in review-fix batch C (base e93f172bb), with phases 170, 171, 172, 174.1 and 175. The batch's gate set and E2E close are given at the end of this section. One red commit holds the cases of IN-01 and IN-02, which share the endpoint's test file; each finding has its own fix commit.

| Finding | Disposition | Commits |
| --- | --- | --- |
| IN-01 | fixed | 4c2f96ed6 (red), cfb998291 (fix) |
| IN-02 | fixed | 4c2f96ed6 (red), 4d3321f4a (fix) |
| IN-03 | fixed, documentation | a839bf02f |
| IN-04 | fixed, comment | a756755c0 |

**Red** (4c2f96ed6): `identityProviderRegistration.test.ts`: **exit 1**, 5 of 54 failed: a save of the names while answers are locked was written (IN-01), and a name or short name keyed by an unsupported locale or with an entry over 200 characters was accepted (IN-02, four cases).

## IN-01: the registration endpoint refuses the names while answers are locked

**Fix** (cfb998291): the handler takes `getAnswersLocked` and refuses the names (200 `failed`, nothing written, the arrival marker kept) while it is true. The route reads `access.answersLocked` through the request's own data provider, as the protected layout does; a read that fails rejects and the endpoint answers `failed` rather than write past a lock it could not read. An address alone is still handled while answers are locked, as the gate asks for one then too.

## IN-02: a name is passed on only in supported locales and within 200 characters

**Fix** (4d3321f4a): a name or short name is accepted only when every key is a code of `staticSettings.supportedLocales` and every text is at most 200 characters; otherwise the request is no intent and is answered 400 `failed` with nothing done. The route hands the handler the supported locales. A case pins that a 200-character name is saved.

**Green** (both): vitest over `src/lib/server/contestant` and the contestant API routes: **exit 0**, 103 passed.

## IN-03: `deleteOrganization`'s docs name both triggers

The docs now say the organization is deleted "when the grant or the record naming it could not be written", as `deleteCandidate`'s do and as `index.ts` calls it.

## IN-04: the admin-auth setup's comment states its reason

The comment no longer points at a reason "recorded there by explicit operator decision"; it states it: the `app_settings` row is a singleton several projects replace, and only the serial chain keeps two of them from overlapping. Comment-hygiene guard: **exit 0**.

## Gates and E2E close of batch C

- **Gate set `review-fix-C`**, on a756755c0: all 22 rows exit **0** on the first run (unit: frontend 6544 passed and 33 skipped, dev-seed 1210 passed; pgTAP 51 files and 2699 tests, PASS; integration 208 passed; schema equivalence equal). `179-verdict gates review-fix-C`: **PASS**, not stale (a756755c0 is tree-equal to HEAD outside `.planning/`), no Sleep entry in the window. This is the gate verdict of record for batch C, on the tree the E2E close ran on.
- The stack was restarted before the E2E run (`yarn db:stop && yarn db:start` through the key filter, exit 0; `supabase_edge_runtime_openvaa-local` Up).
- **E2E close `review-fix-C`**, on a756755c0, under `caffeinate`: **613 passed**, 0 failed, 0 flaky, 0 skipped, 0 did not run, 128 projects, 15.6 min. Wrapper exit 0, `restore: ok`. Not void; `sleep_entries_in_window: 0`. `179-verdict e2e review-fix-C --same-projects-as review-fix-B-r2`: **PASS**, 128 projects compared, 0 not as expected. New E2E test count delta: 0 (the batch adds assertions to existing tests, not tests).
- A control run for 174.1 WR-01, on a756755c0 with the protected layout's focus call removed: `tests/e2e-runs/179-controls/review-fix-C-174.1-wr01-unfixed`, `--project contestant-journey`, exit 1, the new focus step failed; see `174.1-REVIEW-FIX.md`.
- `yarn db:seed:default` exit 0 afterwards. `179-verdict hygiene`: PASS.
