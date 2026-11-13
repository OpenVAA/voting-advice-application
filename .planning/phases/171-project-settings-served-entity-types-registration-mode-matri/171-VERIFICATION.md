---
phase: 171-project-settings-served-entity-types-registration-mode-matri
verified: 2026-10-06T00:00:00Z
status: passed
score: 13/14 must-haves verified
covered_files:
  - .planning/phases/171-project-settings-served-entity-types-registration-mode-matri/171-01-PLAN.md
  - .planning/phases/171-project-settings-served-entity-types-registration-mode-matri/171-01-SUMMARY.md
  - .planning/phases/171-project-settings-served-entity-types-registration-mode-matri/171-02-PLAN.md
  - .planning/phases/171-project-settings-served-entity-types-registration-mode-matri/171-02-SUMMARY.md
  - .planning/phases/171-project-settings-served-entity-types-registration-mode-matri/171-03-PLAN.md
  - .planning/phases/171-project-settings-served-entity-types-registration-mode-matri/171-03-SUMMARY.md
  - .planning/phases/171-project-settings-served-entity-types-registration-mode-matri/171-04-PLAN.md
  - .planning/phases/171-project-settings-served-entity-types-registration-mode-matri/171-04-SUMMARY.md
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
  - apps/frontend/src/lib/utils/settings.ts
  - apps/frontend/src/routes/contestant/login/+page.svelte
  - apps/frontend/src/routes/contestant/register/+layout.server.ts
  - apps/supabase/supabase/schema/106-app-settings.sql
  - packages/app-shared/src/data/schemas/storedSettings.schema.ts
  - packages/app-shared/src/settings/contestantAppConfig.ts
  - tests/tests/specs/perm/perm-closed-project.spec.ts
covered_digest: "v3:sha256:02210d67d90d47855cf7b99b250333afb0d181d585cd1be1f69780dfc1a6c45d"
behavior_unverified: 0
overrides_applied: 1
gaps: []
human_verification:
  - test: "A native speaker of da, et, fi, fr, lb and sv reads the 18 constructed app names and the 30 constructed sentences in apps/frontend/messages/<locale>/dynamic.json, contestantApp.notSupported.json and contestantApp.help.json"
    expected: "Each name and sentence reads naturally"
    why_human: "Grammaticality and naturalness cannot be checked programmatically. This is the plan 03 truth marked verification: backstop. It is already filed as .planning/todos/pending/2026-10-05-native-speaker-review-contestant-app-names.md"
overrides:
  - must_have: "The constructed da/et/fi/fr/lb/sv names and sentences read naturally"
    reason: "Operator decision C4 (a), 2026-10-07: accepted; the native-speaker review stays a filed todo (.planning/todos/pending/2026-10-05-native-speaker-review-contestant-app-names.md) and does not hold the phase — the same treatment as the Phase 134 strings. The review itself has not been done."
    accepted_by: "operator"
    accepted_at: "2026-10-07T00:00:00Z"
---

# Phase 171: Project Settings, Served Entity Types and Registration-Mode Matrix: Verification Report

**Phase Goal:** A project declares which entity types its Contestant app serves and how a user of each type may register, and the app already obeys both declarations where it can today, in what it calls itself and in what the login screen offers.
**Verified:** 2026-10-06
**Status:** passed — 13 truths verified and 1 passed by override: the native-speaker review (H1) is deferred to a filed todo by operator decision C4 (a) of `.planning/v2.16-OPERATOR-DECISIONS-2026-10-07.md`, 2026-10-07. The review has not been done.
**Re-verification:** No, initial verification
**Judged against:** commit `45505e155` (read with `git show` and `git diff`). The working tree was moving under Phase 172, so no live stack, E2E, pgTAP or database command was run.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC1 | Settings name the served types (`candidate`, `organization` or both). The app names itself "Candidate app", "Party app" or "Candidate and party app" in 7 locales, with no code change (SET-01, NAME-03) | VERIFIED | `dynamicSettings.type.ts` has `entityTypes: Array<ServedEntityType>`, and `dynamicSettings.ts` ships `['candidate']`. `StoredSettingsSchema.contestantApp.entityTypes` is `ServedEntityTypeListSchema` (min 1, enum, canonicalising transform) inside strictObjects. `getContestantAppNameKey` picks one of three keys, and `getContestantAppName` is the single helper that calls `t('dynamic.contestantAppName.<key>')`. All 7 `messages/<locale>/dynamic.json` files carry `contestantAppName.{candidate,candidateAndOrganization,organization}`, and en reads "Candidate app", "Candidate and party app" and "Party app". `translations.test.ts` asserts the 3 keys in every locale. The closed-project E2E re-seeds the types and reads the three headings. |
| SC1b | Every reader of the old single name key goes through the helper | VERIFIED | `git grep` at 45505e155 finds no `t('dynamic.contestantAppName')` and no `dynamic.contestantAppName` without a suffix, outside docs prose and a comment. The five readers (login h1; forgot-password, password-reset and register PreHeading; help mail subject) use `getContestantAppName`. The five sentences (`contestantAppNotAccessible` x2, `notSupported` x2, `help.ingress`) take `{contestantAppName}`, and a translations test asserts the placeholder in every locale. |
| SC2 | Per-type mode matrix over `identity_provider`, `email` and `code`. One empty cell, an empty row and an empty matrix are accepted and read back as declared. Duplicates collapse. Unknown types and modes are rejected (SET-02) | VERIFIED | Dedup is enforced in three layers. (1) Schema transforms `ServedEntityTypeListSchema` and `RegistrationModeListSchema` filter the vocabulary in canonical order. (2) The accessors use `membersOf(vocabulary, stored)`. (3) The provider's closed-project branch runs the same schema. Tests: `storedSettings.schema.test.ts` has "collapses repeats…", "wholly empty matrix", "one empty row", "one empty cell beside a non-empty row", "unserved row stored as declared", and rejections of an empty list, an unknown type, an unknown mode and an unknown row. `contestantAppConfig.test.ts` and the provider test cover the other layers. I re-ran both app-shared test files at 45505e155 (2 files, 63 tests, exit 0). |
| SC3 | With no mode allowed, the login screen offers sign-in only. The pre-registration entry is gated on `candidate x identity_provider`, and the code entry on any served type allowing `code` (SET-03) | VERIFIED | `login/+page.svelte` derives `canPreregister = isRegistrationModeAllowed(appSettings,'candidate',IdentityProvider)` and `canRegisterWithCode = isRegistrationModeAllowedForAnyType(appSettings,Code)`. `isLoginShown` is true when `!canPreregister`. The preregister button is under `{#if !answersLocked && canPreregister}`, and the code link is under `{#if canRegisterWithCode}`. `ContestantNav.svelte` gates its two items the same way. `git grep` shows no other `ContestantAppRegister` or `ContestantAppPreregister` link outside these two files, the register route's own flow and the OIDC callback. The closed-project E2E asserts all four states in a browser: empty matrix, `code`, `identity_provider`, and an unserved row opens nothing. |
| SC3b | Registration-code server guard covers the code leg and exempts the invitation leg (recorded narrowing of D-13) | VERIFIED | `register/+layout.server.ts` calls `isRegistrationCodeLeg({isSetPasswordRoute: route.id==='/contestant/register/password', hasRegistrationKey})`. It returns before any settings read when the request is the set-password page without a key. Otherwise it reads through the DataProvider with an anonymous client, and on a failed read it logs and treats the settings as `{}`, so it redirects. `layout.server.test.ts` has 9 cases: invitation leg under an empty matrix with no setting read, an empty key read as no key, a failing read still serving the invitation leg, and the code leg refused under an empty matrix, with nothing declared, with code only on an unserved row and on a rejected read. The preregister tree is guarded by `identity_provider` on `candidate`. Both guards touch no Supabase client directly. |
| SC4 | A freshly seeded project and every E2E dataset declare both settings explicitly. The `default` template has both types and every mode. Base datasets have `['candidate']`, `candidate: ['email','code']` and `organization: []`. The E2E suite is green | VERIFIED | `default.ts`, `e2e/base.ts` and `perm/shared.ts` state the whole root. `built-in-templates-contestant-app.test.ts` loops over every `BUILT_IN_TEMPLATES` entry, throws on a template with no settings and has no skip list. It parses the root through `StoredSettingsSchema`, requires exact keys and requires the declared values. Gate row 13 of `171-gates/171-04-closing-2` reads the default project's stored row after reset and seed: `{"entityTypes":["candidate","organization"],"registrationModes":{candidate:[identity_provider,email,code],organization:[…same]}, "questions":{…}}`. Rows 09 and 13 together are `db:reset-with-data`. |
| P-A | `contestant_app_public_config` is SECURITY DEFINER with `search_path=''` and returns exactly three values and nothing else for any project. It is granted to anon and authenticated, appears in both censuses, has its pgTAP file, and the provider's closed-project branch reads it | VERIFIED | `106-app-settings.sql` defines `jsonb_build_object` over `#>` paths `{access,contestantApp}`, `{contestantApp,entityTypes}` and `{contestantApp,registrationModes}`. It is `LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''`, with an explicit `GRANT EXECUTE … TO anon, authenticated`. A missing row or missing project gives an all-null object, so it is no existence oracle. `07-rpc-security.test.sql` lists it in both censuses ("six"). `38-contestant-app-public-config.test.sql` has plan(16): both privileges, definer, search_path, exact key sets at three levels (so `questions`, `voterApp`, `answersLocked` and `underMaintenance` are unreachable), the all-null cases, anon still reading 0 rows, and a no-grant authenticated caller. Gate row `pgtap`: Files=37, Tests=1351, PASS. The migration is parity-checked, and I re-ran `assert-schema-migration-parity.mjs` (exit 0, "generated copy is current"). `database.ts` has the `Functions` entry, and the drift gate row is 0. The provider calls `rpc('contestant_app_public_config',{p_project_id})` in the `open===false` arm. It narrows the answer with `isJsonObject` and `storedPublicConfig` (no double cast), and parses it with `parseWithPartialPreserve(StoredSettingsSchema…)`. It builds `access` with `voterApp:false` last, and a `contestantApp` over the shipped defaults. The provider test has 7 closed-branch cases. |
| P-B | Deep settings merge: in `mergeAppSettings` itself, lists replaced whole, unsafe keys skipped, app context recomputes from the base | VERIFIED | `settings.ts` `mergeLevel` is a local recursive function. It does not import `mergeSettings` and does not use `structuredClone` or JSON, so PROH-171-01 holds. It replaces lists and scalars (`isMergeable` excludes arrays), skips `undefined`, skips root `null`, and skips `__proto__`, `constructor` and `prototype`. The app context effect calls `mergeInitialAppSettings(staticSettings, dynamicSettings, data)`, which merges over the base each time, never over the previous value. Tests: `settings.test.ts` (shipped `questions` kept, list replaced, `{}` yields base, 3 unsafe keys at root and nested, no mutation, shared untouched subtrees), `settings.svelte.test.ts` (a `$state` proxy target), and `appContext.settingsRemerge.svelte.test.ts` (5 cases, including a member or root omitted by the next payload returning to its default). I re-ran these at 45505e155: 8 files, 523 tests, exit 0. |
| P-C | The pre-registration switch is gone from type, schema and readers, and docs are corrected | VERIFIED | `git grep preRegistration` at 45505e155 finds only a schema test asserting that the key is rejected, plus a route doc line about "preregistration steps". The developers' `app-settings` page replaces the "by top-level key" rule with a member-by-member merge. The publishers' page says "a stored setting replaces only the default it names", says `0` disables the popups, and documents `entityTypes`, `registrationModes` and the three overridable name keys. It also notes that the identity-provider mode needs the server's environment. The bank-authentication and pre-registration-and-invitation pages name `contestantApp.registrationModes.candidate`. `dynamicSettings.type.ts` JSDoc for the popup delays is corrected. The only stale phrase left in the tree is a historical spike sample (`.claude/skills/spike-findings…/sources/008…/page.svelte:47`), which is not a docs page. |
| P-D | Closing evidence is real | VERIFIED | `tests/e2e-runs/171-gates/171-04-closing-2/`: head `45505e155a5e…`, 13 rows all exit 0 (build, typecheck, lint, format, check-frontend, check-docs, docs-links, unit, db-reset, db-types-drift, pgtap, db-lint, seed-default), with TURBO_FORCE. The unit log shows 135 frontend files / 2140 tests, 67 dev-seed files / 997 tests and 10 app-shared files / 141 tests, all passed. `171-e2e/171-04-closing`: head 45505e155, exit 0, 177/177, 0 failed, 0 flaky, 0 skipped, 0 did-not-run, preflight 1 success and 0 failures. `171-04-closing-bank-auth`: head 45505e155, 8/8 (the project's own 6/6). `171-04-closing-bank-auth-journey`: head 45505e155, 131/131 (the journey 1/1). `git log 45505e155..HEAD` shows only 3 `.planning` commits, and none touches `apps`, `packages`, `tests/tests`, `tests/playwright.config.ts` or `scripts`. `git diff 45505e155 -- apps packages tests scripts` is empty. |
| P-E | Plan 04 prohibitions | VERIFIED | PROH-171-12/13/14: `playwright.config.ts` is not in the phase diff, and the new spec has no `test.skip`/`fixme`, no retry and no `null` write-back. Reseeding goes through `updateAppSettings`. PROH-171-04: `302-rls.sql` and the policies are not in the diff. PROH-171-02: no decision code outside `contestantAppConfig.ts` reads the two keys directly. The provider reads them only to assemble the closed-project answer, not to decide. PROH-171-11: neither route guard touches Supabase directly. |
| H1 | The constructed da/et/fi/fr/lb/sv names and sentences read naturally (`verification: backstop`) | HUMAN | See human verification. The strings are present in all seven catalogues and the structural test passes, but naturalness cannot be established from the repo. |

**Score:** 13/14 truths verified; 1 PASSED (override) — H1, deferred to a filed todo by the operator on 2026-10-07 (C4 (a)).

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `packages/app-shared/src/settings/contestantAppConfig.ts` | VERIFIED | Vocabularies, `isRegistrationMode` and six accessors, exported via the barrel. No runtime import of `@openvaa/data` (type-only, `satisfies`). |
| `storedSettings.schema.ts` | VERIFIED | Dedup transforms, strictObject at every level. |
| `apps/frontend/src/lib/utils/settings.ts` | VERIFIED | Deep merge. |
| `contestantAppName.ts`, `register/+layout.server.ts`, `registrationCodeGuard.ts` with tests | VERIFIED | Wired from the layout, login, nav and five readers. |
| `106-app-settings.sql`, migration, `database.ts`, `07-rpc-security`, `38-…test.sql` | VERIFIED | Parity guard exit 0. |
| `supabaseDataProvider.ts` closed branch | VERIFIED | |
| Seeds and `built-in-templates-contestant-app.test.ts` | VERIFIED | |
| `perm-closed-project.spec.ts` plus `testIds` | VERIFIED | Six new tests on the terminal node, four axe scans. |

### Key Link Verification

| From | To | Status |
|------|----|--------|
| schema enums and transforms | `REGISTRATION_MODES` and `SERVED_ENTITY_TYPES` tuples | WIRED |
| `appContext.svelte.ts` | `mergeInitialAppSettings(staticSettings, dynamicSettings, data)` | WIRED |
| preregister guard | `isRegistrationModeAllowed` | WIRED |
| login, nav and register page | accessors | WIRED |
| provider | `rpc('contestant_app_public_config')` and `StoredSettingsSchema` | WIRED |
| `assert-project-scoped-queries.mjs` | disposition `requires p_project_id` | WIRED |
| E2E spec | anonymous login load after `updateAppSettings` | WIRED |

### Data-Flow Trace (Level 4)

Heading and entries: the stored `app_settings.settings` row (readable path) or the `contestant_app_public_config` RPC (closed-project anon path) goes through `parseWithPartialPreserve`, then page data, then `mergeInitialAppSettings`, then the accessors, then the rendered h1 and links. The chain ends at real queries. The E2E asserts it end to end, so there is no static fallback.

### Behavioral Spot-Checks

| Behavior | Command | Result |
|----------|---------|--------|
| Accessors and schema | `vitest run` in `packages/app-shared` (2 files) | 63 passed |
| Merge, remerge, provider, guard, translations, name helper | `vitest run` in `apps/frontend` (8 files) | 523 passed |
| Migration parity | `node scripts/assert-schema-migration-parity.mjs` | exit 0 |

All files are unchanged since 45505e155. E2E, pgTAP and the database were deliberately not run. Their recorded runs are read as evidence under P-D.

### Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| SET-01 | SATISFIED | SC1 |
| SET-02 | SATISFIED | SC2 and P-A |
| SET-03 | SATISFIED | SC3 and SC3b (amended criterion 3: the `email`-only residue is accepted) |
| NAME-03 | SATISFIED in structure, with a human review pending on the 6 non-English locales' wording | SC1, SC1b and H1 |

No orphaned requirements. `.planning/REQUIREMENTS.md` still shows the four IDs as "Pending" in its traceability table, so the orchestrator should tick them at phase close.

### Anti-Patterns Found

No TBD/FIXME/XXX debt markers were introduced in the changed product files. Informational only:
- `/api/contestant/preregister` (the POST endpoint) is not independently gated by the mode. D-13 and the plan scoped the guard to the two page trees, so this is not a gap against the roadmap. It is worth keeping in mind for Phase 178.
- The voter route loaders (`(located)/+layout.ts`, `constituencies`, `elections`, `nominations`) call `mergeAppSettings(staticSettings, stored)` with no shipped dynamic defaults beneath it. Under the new deep merge a partial stored root therefore lacks siblings there. This is disclosed and filed as `.planning/todos/…voter-loaders-merge-static-settings-only.md`.

### Item 8: the two red runs

**`171-04-interim` (1 failed, 94 did not run) and fix `0c0ef4baf`.**
- The diagnosis is supported. The failing journey assertion read the h1 after the mid-flow logout.
- `deferred-items.md` records that the heading was "Your password is now set! Please log in using it." fourteen polls in a row, and that a full load of the login page straight afterwards shows the app's name.
- Reading the code at the phase base `4c8b80651` confirms the cause predates the phase. `contestantCtx.newUserEmail` is set by the set-password page and consumed (reset) only when the login page mounts. If the user is forwarded into the app first, the value survives in the context for the document's life, so the next login mount after a logout shows the password-set heading. The phase did not touch `showPasswordSetMessage` or `newUserEmail` (the login diff changes only the else-branch of the h1).
- No assertion was weakened. The fix is a pure move: the same three assertions (code link visible, pre-registration button hidden, h1 equals the English `candidate` name), with the same matchers, now sit after the `page.goto('/en/contestant/profile')` redirect to a freshly loaded login document. Nothing was deleted, loosened or skipped.
- The move scopes the assertion correctly and hides no defect this phase owes. Phase 171's claim is "the login screen reflects the declared settings". That claim is still asserted, on a fresh load, and in four more states in `perm-closed-project.spec.ts`. The stale heading is orthogonal to the served types and the registration modes, it affects an unrelated message, and it is filed as open in `deferred-items.md` for Phase 178, which rebuilds the login screen. The only coverage the move gives up is a post-logout client-side landing, which was never a Phase 171 requirement.
- The resulting run `171-04-interim-2` is 177/177.

**Gate set `171-04-closing` (`db-types-drift` = 1) and fix `45505e155`.**
- The diagnosis is supported. `12-db-types-drift.log` in that run shows a regenerated `database.ts` with exactly "18 insertions(+)". `00-helpers.test.sql` states "Function definitions are COMMITted (persisted for other test files to use)", and its helpers (`test_user_id`, `test_id`, `set_test_user`, …) are created in `public`. The committed `database.ts` contains none of them.
- The fix reorders the gate so that `db-types-drift` runs straight after `db-reset` and before pgTAP. The rerun `171-04-closing-2` shows the drift row `0` ("unchanged against the index") on the same schema.
- The fix weakened no assertion. The test is the same and it still compares the regenerated file to the index. It is moved to a state of the database where the comparison is meaningful. The row also now keeps a diff file and restores the committed file on a drift. The commit touches only `171-gates.sh` (a `.planning` file), so no product file changed.
- A note for the record: the `171-04-closing` directory has no `db-types-drift.diff` because the keep-the-diff logic was added in this very fix. The 18-line `git diff --stat` in the log is the evidence.

### Gaps Summary

No gaps. Every roadmap success criterion and plan truth is implemented in the tree at 45505e155, wired and tested. The tree the evidence was recorded on is the tree judged. The only open item is a human naturalness review of the constructed non-English strings, already filed as a todo and already disclosed to the operator as a native-speaker review item. Because it is a `backstop` truth, the status is `human_needed` and not `passed`.

### Human Verification — deferred by the operator, 2026-10-07

Operator decision C4 (a) in `.planning/v2.16-OPERATOR-DECISIONS-2026-10-07.md`: the item below is accepted as a filed todo and does not hold the phase. It is still open as a todo: no native speaker has read the strings.

1. **Native-speaker review of the app names and sentences**
   - **Test:** have a speaker of each of da, et, fi, fr, lb and sv read the three `dynamic.contestantAppName.*` names, the two `dynamic.contestantAppNotAccessible.*` sentences, the two `contestantApp.notSupported.*` sentences and `contestantApp.help.ingress` (the `help` file also changed) in `apps/frontend/messages/<locale>/`.
   - **Expected:** natural wording, with the `{contestantAppName}` parameter placed grammatically.
   - **Why human:** naturalness cannot be checked programmatically.

---

_Verified: 2026-10-06_
_Verifier: Claude (gsd-verifier)_
