---
phase: 171-project-settings-served-entity-types-registration-mode-matri
step: review-fix
batch: review-fix-C
findings_fixed: [WR-02, IN-01, IN-02, IN-03, IN-04, IN-05]
findings_operator: [WR-01]
base: e93f172bb
gates: tests/e2e-runs/179-gates/review-fix-C
e2e_close: tests/e2e-runs/179-e2e/review-fix-C
status: complete
---

# Phase 171 review fix

Fixed in review-fix batch C, with phases 170, 172, 174.1, 175 and 179. Each finding a test can show got a failing test first, committed with the exit of its red run, then the fix, then the green run. A doc-only finding got no red. The SQL change is migration `00009_contestant_app_public_config_bounded.sql`, which holds the replaced function and its header byte-for-byte from `schema/106-app-settings.sql`, with its manifest line, as `00005` to `00008` do.

| Finding | Disposition | Commits |
| --- | --- | --- |
| WR-01 | not fixed: reverses recorded decisions, operator | none |
| WR-02 | fixed, documentation | 26dc7d264 |
| IN-01 | fixed, documentation | 9a507a3f7 |
| IN-02 | fixed, documentation | 9a507a3f7 |
| IN-03 | fixed, documentation | 9a507a3f7 |
| IN-04 | fixed | 96257a36b (red), d74a1cc60 (fix) |
| IN-05 | fixed, documentation | 9a507a3f7 |

## WR-01: not fixed, a decision for the operator

**Verified.** The finding holds at HEAD. The provider parses the row with `StoredSettingsSchema` and `parseWithPartialPreserve`, so one rejected value under `contestantApp` drops the whole stored root and the shipped defaults apply (candidates only, an empty matrix). `private.registration_mode_allowed_in` and the `identity-callback` copy of the rule read the raw JSON and filter. A stored `{"contestantApp":{"entityTypes":["candidate"],"registrationModes":{"candidate":["email"],"alliance":[]}}}` shows registration off in the app while `claim_invitations` honours `candidate × email`.

**Why it is not fixed here.** Each fix the review offers reverses a recorded decision:

- *Filter rather than reject in the list schemas* reverses **D-05** ("Unknown values are not filtered out one by one ... A value outside the enum fails the parse, is reported with its path, and the default applies") and **D-08** (an empty list of served types is invalid).
- *Validate on write with a trigger on `public.app_settings`* is the database constraint over the settings JSON that 171's deferred list records as rejected for the phase (171-A1 (b)).
- *Make the database reject as the schema does* would have the SQL and Deno readers restate the whole zod parse of the `contestantApp` root, `questions` included, so that one bad value there drops the matrix too.

**The trade-off.** Member-level tolerance (filtering) makes the app and the database agree on any stored value and never hides registration that is on, but a misspelt mode is then silently ignored instead of reported and defaulted. A write-time trigger keeps D-05's strictness and makes the divergence impossible, at the cost of a second statement of the schema in SQL and a refused write for an editor who stores a typo. Keeping D-05 as it is means the divergence stays possible for a row nobody validated on write. D-05 itself names member-level tolerance as the alternative "if research finds it is not acceptable".

## WR-02: the anon endpoint's two descriptions name all five values

The project-scope guard's disposition (`scripts/assert-project-scoped-queries.mjs`) said three values and the public-schema rationale in `schema/301-auth-functions.sql` said four. Both now name the five the function returns: `access.contestantApp`, `access.answersLocked`, `contestantApp.entityTypes`, `contestantApp.registrationModes` and `analytics.trackEvents`. The same sentence in the frozen baseline `00001` keeps "four"; a migration is never edited, and a comment there changes nothing in a database. The guard: **exit 0**.

## IN-01, IN-02, IN-03, IN-05: the comments say what the code does

- **IN-01.** `ContestantAppConfigInput` (`contestantAppConfig.ts`) now says that an absent root, list or matrix reads as its shipped default and that a row absent from a matrix that is present reads as empty, as `getEffectiveRegistrationModes` and the SQL and Deno readers do.
- **IN-02.** The stored-settings schema's docblock describes the provider as it reads now: `maybeSingle`, not `PGRST116`, and `parseWithPartialPreserve` dropping only the top-level member a failure lies under, with the `contestantApp` consequence stated. The touched paragraph's "were required and are no longer" became a statement of why the members are optional.
- **IN-03.** The base dataset's comment gives the real reason the whole `contestantApp` root is restated: a list replaces the default whole, and the voter loaders merge over the static settings only.
- **IN-05.** The help page's `### Settings` names `contestantApp.entityTypes`, which decides the app's name in its ingress.

## IN-04: the anon endpoint returns no content of a value the frontend refuses

**Verified.** `contestant_app_public_config` returned whatever JSON was stored at its five paths. Nothing validates the column on write, so an extra matrix row, an object inside a list or an object in a boolean slot was readable by `anon` for any project id, against its own promise that no other member of `settings` is reachable.

**Design.** The review's fix builds the matrix from its two known rows. That alone would let a closed project's anonymous view accept a matrix the signed-in view (the whole row through the strict schema) rejects, which would undo the "rejection in one place" of D-09 for that case. The fix therefore keeps every outcome of the provider's parse and removes only the content:

- A value is returned as stored when its shape is one the stored-settings schema can accept: a boolean or a JSON null for the two gates and the tracking switch; a JSON null or a list of the strings `candidate` and `organization` for the entity types; a JSON null or an object of rows named `candidate` or `organization`, each a list of `identity_provider`, `email` and `code`, for the matrix. Repeats and order are still returned as stored, as D-09 and pgTAP 38's Section 2 require: the caller normalises.
- Any other value is answered as the JSON string `"invalid"`, which the provider's parse refuses exactly as it refuses the stored value, so a closed project falls back as before. A provider case pins that fallback for an `"invalid"` list and an `"invalid"` matrix.
- The scalars are included because an object in a boolean slot is the same leak.

**Red** (96257a36b): pgTAP `38-contestant-app-public-config.test.sql` with `00-helpers`: **exit 1**, 3 of 24 failed (18 to 20). Case 21, values the frontend accepts, passed on the unfixed function. Log `tests/e2e-runs/179-unit/review-fix-C-171-in04-db-red.log`.

**Fix** (d74a1cc60): the function in `schema/106-app-settings.sql` and migration `00009`, the provider contract case, and the database skill's policy map.

**Green:** after `yarn db:reset`, pgTAP `00-helpers`, `38`, `07` and `30`: **exit 0**, 38 at 24/24. vitest `supabaseDataProvider.test.ts`: **exit 0**, 125 passed. `assert:schema-migration-parity`: **exit 0**, nine migrations. No signature changed, so `packages/supabase-types` was not regenerated, and no function was added, so the `07-rpc-security` census did not move.

## Gates and E2E close of batch C

- **Gate set `review-fix-C`**, on a756755c0: all 22 rows exit **0** on the first run (unit: frontend 6544 passed and 33 skipped, dev-seed 1210 passed; pgTAP 51 files and 2699 tests, PASS; integration 208 passed; schema equivalence equal). `179-verdict gates review-fix-C`: **PASS**, not stale (a756755c0 is tree-equal to HEAD outside `.planning/`), no Sleep entry in the window. This is the gate verdict of record for batch C, on the tree the E2E close ran on.
- The stack was restarted before the E2E run (`yarn db:stop && yarn db:start` through the key filter, exit 0; `supabase_edge_runtime_openvaa-local` Up).
- **E2E close `review-fix-C`**, on a756755c0, under `caffeinate`: **613 passed**, 0 failed, 0 flaky, 0 skipped, 0 did not run, 128 projects, 15.6 min. Wrapper exit 0, `restore: ok`. Not void; `sleep_entries_in_window: 0`. `179-verdict e2e review-fix-C --same-projects-as review-fix-B-r2`: **PASS**, 128 projects compared, 0 not as expected. New E2E test count delta: 0 (the batch adds assertions to existing tests, not tests).
- A control run for 174.1 WR-01, on a756755c0 with the protected layout's focus call removed: `tests/e2e-runs/179-controls/review-fix-C-174.1-wr01-unfixed`, `--project contestant-journey`, exit 1, the new focus step failed; see `174.1-REVIEW-FIX.md`.
- `yarn db:seed:default` exit 0 afterwards. `179-verdict hygiene`: PASS.
