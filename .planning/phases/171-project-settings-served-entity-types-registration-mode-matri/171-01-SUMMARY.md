---
phase: 171-project-settings-served-entity-types-registration-mode-matri
plan: 01
subsystem: settings
tags: [app-settings, zod, deep-merge, svelte-5, registration-modes, entity-types, contestant-app, tdd]

requires:
  - phase: 170-contestant-app-rename-symbols-routes
    provides: "The `contestantApp` settings root, `access.contestantApp`, the `routes/contestant/` tree, `ContestantNav`, the contestant test directories and the app-name search gate as link 8 of `lint:check`"
provides:
  - "`contestantApp.entityTypes` and `contestantApp.registrationModes` in `DynamicSettings`, in the shipped defaults (candidates only, every registration row empty) and in the strict `StoredSettingsSchema`, with repeats collapsed to canonical order at parse"
  - "`contestantAppConfig.ts` in `@openvaa/app-shared`: the two vocabularies and six pure accessors, total on merged settings, on a provider's raw partial and on `{}`"
  - "A deep `mergeAppSettings` in the frontend: objects merge member by member, lists and scalars are replaced whole, the target is never mutated and nothing is cloned"
  - "The app context recomputing its effective settings from the static and dynamic base on each new loader payload"
  - "The pre-registration switch removed from the type, the schema, its six readers and its one writer; each reader asks the `candidate` × `identity_provider` cell through `isRegistrationModeAllowed`"
  - "`171-NAME-MAP.md`: every name the four plans cite, resolved against the tree Phase 170 left, with nine measured starting populations"
affects: [171-02, 171-03, 171-04, 173, 174, 175, 177, 178, 179]

actuals:
  tokens: 33508
  tasks: 4
  commits: 6
plan_head_before: 4c8b80651333901151b5e6cc0a07b17d6df0428b
plan_head_after: 795a6783b0c6b4c0bd1fbbc97ef7c32df7c095da

tech-stack:
  added: []
  patterns:
    - "A settings rule lives in one pure accessor in `@openvaa/app-shared`; components, guards and seeds call the accessor and never read the two raw keys"
    - "A stored list is validated as an enum array and transformed to the vocabulary filtered by membership, so equal declarations parse to equal values"
    - "The frontend settings merge is deep and clone-free: a shallow spread per merged level, untouched subtrees shared by reference"
    - "A context that merges loader payloads recomputes from its base on each payload instead of accumulating onto its previous value"

key-files:
  created:
    - packages/app-shared/src/settings/contestantAppConfig.ts
    - packages/app-shared/src/settings/contestantAppConfig.test.ts
    - apps/frontend/src/lib/utils/settings.svelte.test.ts
    - apps/frontend/src/lib/contexts/app/appContext.settingsRemerge.svelte.test.ts
    - .planning/phases/171-project-settings-served-entity-types-registration-mode-matri/171-NAME-MAP.md
    - .planning/phases/171-project-settings-served-entity-types-registration-mode-matri/evidence/171-01-task2-red.json
    - .planning/phases/171-project-settings-served-entity-types-registration-mode-matri/evidence/171-01-task3-red.json
  modified:
    - packages/app-shared/src/settings/dynamicSettings.type.ts
    - packages/app-shared/src/settings/dynamicSettings.ts
    - packages/app-shared/src/data/schemas/storedSettings.schema.ts
    - packages/app-shared/src/data/schemas/storedSettings.schema.test.ts
    - packages/app-shared/src/index.ts
    - packages/app-shared/src/utils/mergeSettings.ts
    - apps/frontend/src/lib/utils/settings.ts
    - apps/frontend/src/lib/utils/settings.test.ts
    - apps/frontend/src/lib/contexts/app/appContext.svelte.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts
    - apps/frontend/src/routes/contestant/login/+page.svelte
    - apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte
    - apps/frontend/src/routes/contestant/register/+page.svelte
    - apps/frontend/src/routes/contestant/preregister/+layout.server.ts
    - packages/dev-seed/src/templates/default.ts
    - apps/docs/src/routes/(content)/developers-guide/configuration/app-settings/+page.md
    - apps/docs/src/routes/(content)/publishers-guide/app-settings/+page.md
    - tests/tests/setup/contestant/bank-auth-journey.setup.ts
    - tests/tests/setup/contestant/bank-auth-journey.teardown.ts
    - tests/tests/setup/shared/setupFromTemplate.ts

key-decisions:
  - "An absent `registrationModes` member reads as the shipped matrix; a present matrix with an absent row reads that row as empty. The fallback is per member, never per row."
  - "The accessors read anything that is not a list as an empty list, so they are total at run time on values their input type does not admit."
  - "The unsafe-key skip of the merge applies at every level the merge walks. A source subtree that replaces whole is taken as one value and is not walked."
  - "Each TDD task has a `test` commit before its `feat` commit. The Task 2 `test` commit carries a compile-only skeleton of the new module, so that the package still typechecks and builds at that commit."
  - "One default-suite E2E run was made on the plan's final tree, although the plan's gate is unit level."

patterns-established:
  - "Readers of a registration mode: `isRegistrationModeAllowed(settings, entityType, REGISTRATION_MODE.X)` imported from `@openvaa/app-shared`, derived once per component over the context's `appSettings`"
  - "A server guard passes the provider's raw answer to the accessor and substitutes `{}` on a failed read; the accessor's totality turns the failure into a refusal"

requirements-completed: [SET-01, SET-02, SET-03, NAME-03]

coverage:
  - id: D1
    description: "The two vocabularies and the six pure accessors: served types (never empty, canonical order), the effective matrix (rows for served types only), per-cell, any-type and any-registration questions, and the name key"
    requirement: SET-01
    verification:
      - kind: unit
        ref: "packages/app-shared/src/settings/contestantAppConfig.test.ts (31 cases)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The strict stored-settings schema for both lists: repeats collapse to canonical order, one empty cell, one empty row and a wholly empty matrix read back as declared, and each invalid value fails with its path"
    requirement: SET-02
    verification:
      - kind: unit
        ref: "packages/app-shared/src/data/schemas/storedSettings.schema.test.ts#StoredSettingsSchema — the served entity types and the registration-mode matrix (15 cases) and the two LEVEL cases for `contestantApp`"
        status: pass
    human_judgment: false
  - id: D3
    description: "The name key derivable from the settings: `candidate`, `organization` or `candidateAndOrganization`"
    requirement: NAME-03
    verification:
      - kind: unit
        ref: "packages/app-shared/src/settings/contestantAppConfig.test.ts#getContestantAppNameKey"
        status: pass
    human_judgment: false
  - id: D4
    description: "A deep `mergeAppSettings`: objects merge recursively, lists and scalars are replaced whole, the target is never mutated, a reactive proxy is a valid target"
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/utils/settings.test.ts#mergeAppSettings (21 cases)"
        status: pass
      - kind: unit
        ref: "apps/frontend/src/lib/utils/settings.svelte.test.ts"
        status: pass
    human_judgment: false
  - id: D5
    description: "The app context recomputes its effective settings from the base on each new loader payload"
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/contexts/app/appContext.settingsRemerge.svelte.test.ts (5 cases)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The pre-registration switch is gone from the model and every former reader asks the identity-provider cell through the accessor"
    requirement: SET-03
    verification:
      - kind: unit
        ref: "packages/app-shared/src/data/schemas/storedSettings.schema.test.ts#rejects a row that carries a top-level `preRegistration` key, naming that key at the root"
        status: pass
      - kind: other
        ref: "git grep -F preRegistration over the source paths (nothing found); yarn workspace @openvaa/frontend check (exit 0); yarn typecheck:tests (exit 0)"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/171-e2e/171-01-close — default suite, 171 passed of 171"
        status: pass
    human_judgment: true
    rationale: "The default suite never switches pre-registration on. The bank-auth setup's new override and the guard's new condition are exercised only by the opt-in bank-auth projects, which this plan does not run; they run at the phase's closing gate in 171-04."
  - id: D7
    description: "No comment or docs sentence describes the settings merge as replacing a stored group whole; the publishers' page says that `0`, not omission, disables the feedback popup"
    verification:
      - kind: other
        ref: "the seven-phrase `git grep` of Task 3's verify (nothing found); publishers' page lines for `showFeedbackPopup` and `showSurveyPopup`"
        status: pass
    human_judgment: false
  - id: D8
    description: "`171-NAME-MAP.md`: 73 cited names resolved by command, nine starting populations measured"
    verification:
      - kind: other
        ref: "Task 1's automated verify (exit 0); a script that checks every path of the Resolved column with `git ls-files` (76 paths, 0 untracked)"
        status: pass
    human_judgment: false

duration: 30min
completed: 2026-10-05
status: complete
---

# Phase 171 Plan 01: Served Entity Types and the Registration-Mode Matrix — the Model Summary

**The two settings exist in the type, the shipped defaults and the strict stored schema with repeats collapsed at parse, six pure accessors answer every question about them, the frontend settings merge is deep with lists replaced whole, the app context recomputes from its base on each loader payload, and the pre-registration switch is replaced by the `candidate` × `identity_provider` cell in every reader and in the bank-auth setup.**

## Performance

- **Duration:** 30 min
- **Started:** 2026-10-05T21:34:46Z
- **Completed:** 2026-10-05T22:04:00Z
- **Tasks:** 4 of 4
- **Files changed:** 26 (25 outside `.planning/`), before this summary and the two evidence records
- **Start revision:** `4c8b80651333901151b5e6cc0a07b17d6df0428b`
- **The tree every closing gate describes:** `795a6783b0c6b4c0bd1fbbc97ef7c32df7c095da`

## Accomplishments

- Resolved all 73 names the four plans cite against the tree Phase 170 left. None differs in a way that changes a task.
- Added `contestantApp.entityTypes` and `contestantApp.registrationModes` to the type, the defaults and the schema. A list that names a value twice or out of order parses to the canonical list; an empty served list, an unknown type, an unknown mode and an unknown row each fail with the path of the offending member.
- Wrote the accessors every later reader goes through, total on merged settings, on raw provider output and on `{}`.
- Made `mergeAppSettings` deep, written in `settings.ts` itself with no clone, and changed the app context's loader-payload effect to recompute from the base.
- Restated every comment and docs sentence that described the replace-by-root rule.
- Removed `preRegistration` from the type and the schema, moved its six reads to the accessor, and changed the bank-auth setup's override to the full `candidate` row.

## The Exported Names, as Implemented

All from `packages/app-shared/src/settings/contestantAppConfig.ts`, re-exported by the package barrel. No name differs from the plan.

| Name | Kind | What it is |
|---|---|---|
| `SERVED_ENTITY_TYPES` | const tuple | `['candidate', 'organization']`, tied to the data package's `EntityType` by `satisfies` |
| `ServedEntityType` | type | member union of the tuple |
| `REGISTRATION_MODE` | const object | `IdentityProvider: 'identity_provider'`, `Email: 'email'`, `Code: 'code'` |
| `RegistrationMode` | type | value union of the object |
| `REGISTRATION_MODES` | const tuple | the three values in canonical order |
| `isRegistrationMode(value)` | type guard | |
| `RegistrationModeMatrix` | type | `Record<ServedEntityType, Array<RegistrationMode>>` |
| `ContestantAppNameKey` | type | `'candidate' \| 'organization' \| 'candidateAndOrganization'` |
| `ContestantAppConfigInput` | type | a value that may be `null` or `undefined`, with an optional and nullable `contestantApp`, an optional `entityTypes` and an optional `registrationModes` whose rows are optional |
| `getServedEntityTypes(input)` | accessor | `Array<ServedEntityType>`, never empty, canonical order, a fresh list on every call |
| `getEffectiveRegistrationModes(input)` | accessor | `Partial<RegistrationModeMatrix>`: one row per served type and no other key |
| `isRegistrationModeAllowed(input, entityType, mode)` | accessor | `boolean` |
| `isRegistrationModeAllowedForAnyType(input, mode)` | accessor | `boolean` |
| `isAnyRegistrationAllowed(input)` | accessor | `boolean` |
| `getContestantAppNameKey(input)` | accessor | `ContestantAppNameKey` |

The schema helpers `ServedEntityTypeListSchema` and `RegistrationModeListSchema` are module-level constants of `storedSettings.schema.ts` and are not exported, like `StoredNotificationSchema` beside them.

**Two points of behaviour the plan leaves to the implementation:**

1. **Where the fallback applies.** An absent `entityTypes` (or one that is not a list, or that names no known type) reads as the shipped `['candidate']`. An absent `registrationModes` reads as the shipped matrix. A present matrix with an absent row reads that row as empty. So a stored `registrationModes: {}` is an empty matrix whatever the shipped defaults are.
2. **Values the type does not admit.** A list stored as a string, or a mode outside the vocabulary, reads as nothing. The accessors never throw.

## Task Commits

1. **Task 1: Reconcile every cited name and record the starting populations**
   - `80dd52083` `docs(171-01): resolve every cited name against the tree Phase 170 left and record the starting populations`
2. **Task 2: The two settings in `@openvaa/app-shared`** (TDD)
   - `49356003b` `test(171-01): add failing tests for the served entity types, the registration-mode matrix and their accessors` — red: 45 of 62 cases fail.
   - `a4b408eb7` `feat(171-01): declare the served entity types and the registration-mode matrix as contestant app settings`
3. **Task 3: The deep merge, the app context's recompute, the statements of the old rule** (TDD)
   - `9c560121c` `test(171-01): add failing tests for the deep settings merge and the app context's recompute from the base` — red: 15 of 36 cases fail.
   - `05a10320c` `feat(171-01): merge app settings member by member at every depth and recompute them from the base on each loader payload`
4. **Task 4: Remove the pre-registration switch; the plan gate**
   - `795a6783b` `feat(171-01): replace the pre-registration switch with the identity-provider registration mode for candidates`

No refactor commit was needed.

## Gate and E2E Results

Each exit status was read from the command or from its exit marker, never through a pipe. The plan gate was run twice: on the working tree before the Task 4 commit, and again on the committed tree. The second run is the one recorded here.

| What | Command | Exit | Result |
|---|---|---|---|
| Build | `yarn build --filter=@openvaa/app-shared` | 0 | |
| Unit suites | `yarn test:unit` | 0 | 25 turbo tasks; frontend 2060 tests in 132 files, dev-seed 901, app-shared 141 in 10 files, data 244, supabase 206, llm 49, matching 43, argument-condensation 31, filters 22, question-info 22, core 8 |
| Frontend check | `yarn workspace @openvaa/frontend check` | 0 | 0 errors, 0 warnings |
| Tests typecheck | `yarn typecheck:tests` | 0 | |
| Lint | `yarn lint:check` | 0 | all 20 links; app-name search gate 2693 files, 0 findings; comment hygiene 0 violations |
| Package typecheck | `yarn workspace @openvaa/app-shared typecheck` | 0 | |
| Workspace typecheck | `yarn typecheck` | 0 | 23 tasks (after Task 2) |
| Formatting | `prettier --check` over the 23 touched source files, and the docs workspace's `prettier --check` over the two docs pages | 0, 0 | |
| Bundle | `grep "@openvaa/data" packages/app-shared/dist/index.js` | 1 | no reference to the data package |
| Task 1 automated verify | as written in the plan | 0 | |
| Task 2 automated verify | as written | 0 | |
| Task 3 automated verify | as written | 0 | 8 files, 67 tests |
| Task 4 automated verify (both) | as written | 0, 0 | |
| **E2E, default suite** | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/171-e2e/171-01-close --no-db-reset` | **0** | **171 total, 171 passed, 0 failed, 0 flaky, 0 skipped, 0 did-not-run**; 100 projects; 4.5 min; one preflight success, no preflight failure; head `795a6783b`, tree clean |

Run directory: `tests/e2e-runs/171-e2e/171-01-close`. There was no red gate row and no red run, and nothing was run twice to see whether it passes.

**Not run here, by the plan:** the opt-in `bank-auth` and `bank-auth-journey` projects. They are the only tests that switch pre-registration on, and this plan changed the setup that does it. Their first run on this change is the phase's closing gate in 171-04.

## The Red Runs

Both TDD tasks have a recorded red run, classified with `gsd-tools check tdd-red-evidence`. Records: `evidence/171-01-task2-red.json` and `evidence/171-01-task3-red.json` in this phase directory.

| Task | Red run | Target | Classifier |
|---|---|---|---|
| 2 | 45 of 62 cases fail: 29 accessor cases on the skeleton throwing "Not implemented", 16 schema cases on their own assertions | `getContestantAppNameKey > is candidateAndOrganization when both are served, in either stored order` | `RED_EVIDENCE_OK` |
| 3 | 15 of 36 cases fail: six deep-merge cases, six unsafe-key cases, the proxy-target case, two recompute cases | `reads the shipped default again for a member the previous payload set and the new one omits` | `RED_EVIDENCE_OK` |

The combined report of each red run could not be given to the classifier: vitest writes multi-line assertion values into the TAP diagnostic blocks, which the classifier's TAP adapter rejects as non-TAP data. Each target was rerun alone with the same reporter, and that report was classified. The combined counts and the list of failing cases are kept in each record under `combinedRun`.

**Cases that were green in the red run, by design.** They state a property the old code already had, and they guard the new code against a known wrong way of writing it: that the target is not mutated, that a nullish root is skipped, that `{}` and an `Error` merge as nothing, that the reference guard and the early return on an `Error` hold. The proxy-target case was red on the merged value, after its control (`structuredClone` throws on the same proxy) had passed.

## What the Merge Does, in One Place

`mergeAppSettings(target, additional)` in `apps/frontend/src/lib/utils/settings.ts`, with one non-exported helper `mergeLevel`:

- at the root a member whose value is `null` or `undefined` is skipped;
- below the root `undefined` is skipped and `null` replaces;
- recursion happens only when both sides hold a non-null, non-list object; in every other pairing the source value replaces the target value whole;
- the keys `__proto__`, `constructor` and `prototype` are never merged;
- `target` is never mutated; each merged level is a new object made by a shallow spread and untouched subtrees are shared by reference.

It does not call `mergeSettings` and clones nothing (PROH-171-01). `mergeInitialAppSettings` keeps its signature and body.

## Remaining Hits of the Merge-Rule Population Command

`git grep -n -i -E "root key|by top-level key|shallow|replaces the whole|whole .?access.? object" -- apps packages tests ':!tests/e2e-runs'` still finds 20 lines. None describes the settings merge as replacing by root or top-level key.

| Hit | Why it stays |
|---|---|
| `supabaseDataProvider.ts` (the comment above the closed-project `access` object) and `supabaseDataProvider.test.ts` (one comment) | Restated. They still say the whole `access` object is carried, which the provider still does, and now give the reason that holds: the answer states every gate itself, and the voter route loaders merge it over the static settings only |
| `supabaseDataProvider.ts`, two `reason:` comments | They call the type `Partial<DynamicSettings>` a shallow partial. That is about a type |
| `localizeRow.ts` (three), `components.ts` (four), `sameRefs.ts` (one) | Shallow clones and copies of rows, props and arrays |
| `contestantContext.svelte.test.ts` (one), `buildMinimal.test.ts` (one) | A context fake that behaves as a shallow copy; the dev-seed's own deep merge |
| `(voters)/(located)/layout.tracking.test.ts`, `results/[[electionTab]]/+layout.svelte` | "replaces the whole subtree / list": page content, not settings |
| `504-admin-rpcs.sql` and the generated migration (two each) | `merge_question_custom_data`, a shallow JSONB merge of another column |

Outside the command's scope, and not changed: the spike records under `.claude/skills/spike-findings-voting-advice-application-gsd/` quote the old rule in a spike source file (`sources/008-ssr-hydration-runes/page.svelte`) and name `mergeAppSettings` as a pure function. They are a record of the spikes.

## Decisions Made

Nothing in the plan's decisions was decided differently. Calls the plan does not make are the five under `key-decisions` and the deviations below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The TSDoc of the two popup delays said the opposite of what the merge now does**
- **Found during:** Task 3, checking the type file beside the publishers' page.
- **Issue:** `results.showFeedbackPopup` was documented as "If defined, a feedback popup will be shown…". Under the deep merge a stored `results` that leaves it out keeps the shipped 180 seconds, so "leave it out" no longer disables the popup.
- **Fix:** both delays' TSDoc say that `0` disables the popup and that a stored value which leaves the member out keeps the shipped default. Confirmed in the countdown code: both `startFeedbackPopupCountdown` and `startSurveyPopupCountdown` return on `delay <= 0`.
- **Files modified:** `packages/app-shared/src/settings/dynamicSettings.type.ts`.
- **Committed in:** `05a10320c`.

**2. [Rule 1 - Bug] The comment above the app context's effect named the function the effect no longer calls**
- **Found during:** Task 3.
- **Issue:** the plan names the comment above `#appSettingsValue` for restating. The comment above the effect also said "`mergeAppSettings` always produces a new AppSettings object" and carried a sentence about Svelte 4 stores.
- **Fix:** restated in the present tense, with one added sentence on why the effect recomputes from the base. The reference-equality guard and the early return are unchanged.
- **Files modified:** `apps/frontend/src/lib/contexts/app/appContext.svelte.ts`.
- **Committed in:** `05a10320c`.

**3. [Rule 1 - Bug] The schema docblock's nesting-depth sentence carried a stale zod version and a line citation**
- **Found during:** Task 2, re-measuring the sentence as the plan asks.
- **Issue:** "measured at this tree's zod (4.3.6) and recorded verbatim at `packages/dev-seed/src/template/schema.ts:35-41`". The tree resolves zod 4.6.5, and the cited lines no longer hold that record.
- **Fix:** the sentence states the depth as measured (three objects deep, as at `settings` → `contestantApp` → `registrationModes`; four where a `results.cardContents` list holds a question object) and names the six levels that have an unknown-key case. The version and the line citation are gone.
- **Files modified:** `packages/app-shared/src/data/schemas/storedSettings.schema.ts`.
- **Committed in:** `a4b408eb7`.

**4. [Rule 3 - Blocking] A test-only red commit would not have built**
- **Found during:** Task 2, before the `test` commit.
- **Issue:** the accessor tests import a module that did not exist. A commit holding only the tests fails the package's typecheck and its build, and with the build the frontend check.
- **Fix:** the `test` commit carries the module's vocabularies and types and a compile-only skeleton whose accessors throw "Not implemented". The red run therefore fails inside the target tests, not at load, and the package typechecks at that commit (exit 0).
- **Committed in:** `49356003b`; replaced by the implementation in `a4b408eb7`.

**5. [Rule 3 - Blocking] The new module's import order failed lint**
- **Fix:** `eslint --fix` on that one file before the `feat` commit.
- **Committed in:** `a4b408eb7`.

### Acceptance criteria that did not hold as written

- **"its output lists `contestantAppConfig.test.ts` among the passed files" (Task 2), and the same for three frontend files (Task 3).** In a non-interactive shell vitest's default reporter prints the totals and no file names. Each file was confirmed with `--reporter=verbose`: `contestantAppConfig.test.ts` 31 cases, `settings.test.ts` 30, `settings.svelte.test.ts` 1, `appContext.settingsRemerge.svelte.test.ts` 5, all passing. No code was changed for this.
- **"finds the initializer and the effect (two call sites)" (Task 3).** The grep finds three lines: the two call sites and the comment above the initializer, which quotes the call and predates the plan.
- **"each remaining hit is unrelated" (Task 3).** Two of the remaining hits are the restated provider comments, which still contain the words "whole `access` object". They are listed above with the others.
- **"A source key named `__proto__`, `constructor` or `prototype` is skipped at every depth" (Task 3).** It holds at every level the merge walks, and is tested at the root and inside a merged root. A source subtree that replaces whole (its target counterpart is missing, `null`, a list or a scalar) is assigned as one value and is not walked, as the rule "in every other pairing the source value replaces the target value whole" requires. Such a subtree keeps its own keys; assigning it cannot reach a prototype.

### Departures in procedure

- **More schema cases than the plan lists.** Beside the nine probe rows and the unknown-key case for the matrix: an unknown-key case for the `contestantApp` object, a full row in canonical order, one empty cell beside a non-empty row, a stored `questions` beside the lists, a second unknown type in a longer list, and `null` for a row.
- **One E2E run the plan does not ask for.** The merge and the app context's recompute change how every setting reaches every page, so the default suite was run once on the final tree. It is not the plan's gate.
- **The plan gate was run twice** (before and after the Task 4 commit). Both were green on every step.
- **Polling.** A standalone `sleep` is blocked in this harness; each wait was a bounded loop on a marker file.

---

**Total deviations:** 5 auto-fixed (3 corrections of fact in comments, 2 blocking), plus the notes above.
**Impact on plan:** none changes behaviour beyond what the plan specifies.

## Changes for the Operator's Eye

- **Two behaviour changes, both in the plan.** (1) A stored settings group that names one member no longer discards the group's other shipped members; leaving a member out no longer switches a feature off. (2) Pre-registration is offered only where a project allows the `identity_provider` mode for candidates; the shipped default allows no mode. A stored row that still carries `preRegistration` has that key rejected and reported, and the rest of the row kept.
- **The developers' and the publishers' docs pages still list `preRegistration.enabled`** (four places, the population in `171-NAME-MAP.md`). The plan leaves them to 171-04.
- **`yarn.lock` and every `package.json` are unchanged.** No package was installed.
- **`CAND-APP-PLAN.md` was not edited, moved, staged or committed.**
- **The stack was neither restarted nor reset.** Nothing listens on 5173 or 5273. The Vite server on 5199 and `my-redis` were left alone.

## Deferred Issues

None fixed, all outside this plan:

1. `yarn workspace @openvaa/app-shared lint` run directly ends with "command not found: eslint" (exit 127). `turbo run lint`, which `lint:check` uses, passes. Predates the plan.
2. The four voter route loaders merge the stored row over `staticSettings` only, without the shipped dynamic defaults (recorded in the research; 171-04 files the todo).
3. `yarn lint:fix` was not run in this plan, so its standing proposal for `tests/tests/support/mockOidcIssuerEntry.ts` did not come up.

The cross-phase defect ledger (`.planning/WINDOWS.md`) was not appended to: there is no stub, no skipped test and no verification of this plan that was not run.

## Issues Encountered

None beyond the deviations above. No gate step and no E2E test was red at any point.

## Known Stubs

None. The compile-only skeleton of the Task 2 red commit was replaced by the implementation in the next commit; `git grep "Not implemented"` in the module finds nothing.

## User Setup Required

None - no external service configuration required.

## Next Plan Readiness — What 171-02 Must Know

- **Compare against:** E2E `tests/e2e-runs/171-e2e/171-01-close` (171 / 171 / 0 skipped, head `795a6783b`). Frontend unit count: 2060 tests in 132 files. App-shared: 141 tests in 10 files.
- **The schema rejects `null` for `entityTypes`, for `registrationModes` and for a row** (pinned by three cases). The function's answer has to lose its null members before it is parsed, as the research's Pitfall 3 says.
- **The accessors are total on the provider's raw answer and on `{}`.** The pre-registration guard already passes the raw answer to `isRegistrationModeAllowed`; it needs no code of its own when the closed-project branch starts carrying the two members.
- **The closed-project branch of `_getAppSettings` is unchanged in behaviour.** Only its comment was restated. It still returns the whole `access` object over the shipped defaults. Under the deep merge the app context would also accept a partial object there, but the four voter loaders merge over the static settings only, so a partial `access` would leave them without the other gates.
- **The guard's comment says "What an anonymous client may read of a project's settings is decided by the provider and the database, not here."** It stays true after the function lands.
- **pgTAP:** the highest file number in use is 36; Phase 172 has not executed. The two census strings of Section 8c are quoted in full in `171-NAME-MAP.md`.
- **No dataset declares the two settings yet.** Until 171-04, every E2E dataset reads the shipped defaults: candidates only, no registration mode. On the login screen that is today's picture, because no template ever switched pre-registration on and the registration-code link is not gated until 171-03.
- **The bank-auth override is `{ contestantApp: { registrationModes: { candidate: ['identity_provider', 'email', 'code'] } } }`.** It has not been exercised by a run.
- **For 171-03:** the three components derive the cell as `canPreregister`. The login page and the nav read `contestantCtx.appSettings`; the register page's local is `ctx`.
- **Stack state:** up, not restarted, not reset; the database holds what the E2E run left in its own project.

## Self-Check: PASSED

- Every file under `key-files.created` exists.
- All six commits (`80dd52083`, `49356003b`, `a4b408eb7`, `9c560121c`, `05a10320c`, `795a6783b`) are ancestors of HEAD; `git rev-list --count 4c8b80651..HEAD` was 6 when this file was written.
- The four tasks' automated verify commands were re-run on the final tree and each exited 0; the plan's `<verification>` items are the gate table above.
- `.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` are unchanged since the start revision; `CAND-APP-PLAN.md` is untracked and untouched.
