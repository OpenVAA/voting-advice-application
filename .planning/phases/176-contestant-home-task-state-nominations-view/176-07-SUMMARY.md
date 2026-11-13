---
phase: 176-contestant-home-task-state-nominations-view
plan: 07
subsystem: e2e
tags: [e2e, dev-seed, playwright, perm-chain, nominations, fixtures]
requires:
  - phase: 176-06
    provides: the entity-level load that no longer signs out an entity with no nomination
  - phase: 175-05
    provides: the perm-style dataset pattern, registerAndStoreSession on perm-seeded rows, contestantEntityHomePage
provides:
  - the `perm-no-nomination` template and its three Playwright projects in the permutation chain
  - the data module `permNoNominationData.ts` and three stored sessions
  - the composition root with `setNominationState`, `setAnswers`, `setNominationsLocked`
  - the spec `perm-no-nomination.spec.ts` with three `dataset:` tests
  - the Locator Contract's test ids in the registry
  - the per-project baseline `176-07-close` (273 tests, 113 projects)
affects: [176-08, 176-09, 176-10, 176-12, 176-13, 176-14, 176-15, 176-16, 176-17, 176-18, 176-19]
tech-stack:
  added: []
  patterns:
    - state steps as plain exported functions that accept the dataset's own entities alone and name rows by exact external id
key-files:
  created:
    - packages/dev-seed/src/templates/e2e/perm/perm-no-nomination.ts
    - tests/tests/utils/permNoNominationData.ts
    - tests/tests/setup/perm/perm-no-nomination.setup.ts
    - tests/tests/setup/perm/perm-no-nomination.teardown.ts
    - tests/tests/fixtures/contestant/perm-no-nomination.ts
    - tests/tests/specs/perm/perm-no-nomination.spec.ts
  modified:
    - packages/dev-seed/src/templates/index.ts
    - packages/dev-seed/tests/templates/built-in-templates-contestant-app.test.ts
    - packages/dev-seed/README.md
    - packages/dev-seed/src/template/permittedKeys.ts
    - tests/tests/utils/testIds.ts
    - tests/playwright.config.ts
    - tests/README.md
decisions:
  - "Phase 175's contestantEntityHomePage.fixture.ts is the home fixture the no-nomination spec's composition root registers; contestantHomePage.fixture.ts stays the journey's"
  - "A state step refuses an entity that is not one of the dataset's three and a nomination row that is not the dataset's own for that entity"
  - "The new template is a family of its own in the contestant-app family test, beside perm-organization-editing"
metrics:
  duration: ~30 min (02:20Z → 02:49Z)
  completed: 2026-10-09
status: complete
requirements-completed: []
actuals:
  tokens: 18388
  tasks: 3
  commits: 3
commits: 3
plan_head_before: 60c816d75753fe6e2a2f5269f4eb324ae9171a9e
plan_head_after: a35ebb1e977a3211babdb93b2832248333002479
---

# Phase 176 Plan 07: The No-Nomination Dataset, its Link of the Suite, and the Phase's First Full Gate Set — Summary

**A hand-authored template with a candidate and an organization that have no nomination row and a candidate that has one, seeded by its own setup into the suite's project with one stored session per editor and three state steps; a candidate's and a party's editor with no nomination are shown in a browser to stay signed in on their own home; all fourteen gate rows exit 0 on a rebuilt database, and the full run is 273 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run in 113 projects, every earlier project at its `176-06-close` total.**

Everything below was measured in this session unless it says "read" or "not done".

## Read this first

1. All three tasks are done. The three `<automated>` blocks, run byte for byte from the plan with `bash`, each exit **0**.
2. **Assumption A6 holds.** The pipeline seeds entities with no nomination row: the dev-seed suite passes over the new template and a read-back from a database shows the rows.
3. **NOM-01's first browser proof is green**, on the first attempt: one pre-commit run, no `-rN`, no red run, no void run, nothing retried.
4. **One checklist finding is not fixed** (`inFreshContext` is now in two setups); see *The code review checklist*. I did not make the extraction because it changes Phase 175's setup and needs a pre-commit run of its own, and the context left for this session did not allow one more run with certainty. Nothing else is left undone.
5. `requirements-completed` is empty on purpose: this plan is NOM-01's first proof, not its completion.

## Task Commits

| # | Commit | Subject | Task |
|---|---|---|---|
| 1 | `58be09ac3` | `test(176-07): a dataset with entities that have no nomination` | 1 |
| 2 | `6a9928f87` | `test(176-07): the no-nomination dataset's identities and the ids of the new screens` | 1 |
| 3 | `a35ebb1e9` | `test(176-07): the no-nomination dataset's sessions, state steps and first tests in the chain` | 2, after `control … --green` passed |

All by pathspec on `feat/entity-signup-multi-grant`. Task 3 changed no file.

## Each verify, with its real exit status

Scripts extracted from the plan file by a script; evidence in `tests/e2e-runs/176-unit/176-07-t<N>-verify.{sh,log,exit,head}`.

| Verify | Head | Exit |
|---|---|---|
| Task 1, as written (background) | `6a9928f87` | **0** |
| Task 2, as written | `a35ebb1e9` | **0** |
| Task 3, as written (after the full run and the reseed) | `a35ebb1e9` | **0** |
| `176-verdict.mjs control 176-07-precommit --project perm-no-nomination --setup data-setup-perm-no-nomination --dirty-only tests/ --green` | run head `6a9928f87` | **0** — PASS |
| `176-verdict.mjs gates 176-07-close` | `a35ebb1e9` | **0** — PASS |
| `176-verdict.mjs e2e 176-07-close …` as in Task 3 step 3 | `a35ebb1e9` | **0** — PASS |
| the same without the three exceptions | `a35ebb1e9` | **1** — refuses |
| the same with `--expect-title-count "perm-no-nomination::dataset:=999"` | `a35ebb1e9` | **1** — refuses |

## The dataset (Task 1)

Template `perm-no-nomination`, `externalIdPrefix: 'e2e-perm-no-nomination-'`, every collection stated with `count: 0`, `generateTranslationsForAllLocales: false`. Each id is the prefix followed by:

| Collection | Id | What it holds | Locales of its names |
|---|---|---|---|
| elections | `el-1` | `organization_list` (the type Phase 175's dataset states), one round, `current_round: 1` | `name` `en` only: `[EL-1] Nomination Election`; `short_name` `en`: `EL-1` |
| constituency_groups | `cg-1` | holds `co-1` | `en`: `[CG-1] Nomination Group` |
| constituencies | `co-1` | | `en` only: `[CO-1] Nomination Constituency` |
| candidates | `ca-none` | confirmed (seed default); **no nomination row** | not localized: `[CA-N] Unnominated` / `Candidate` |
| candidates | `ca-nominated` | confirmed; one nomination | not localized: `[CA-Y] Nominated` / `Candidate` |
| organizations | `or-none` | confirmed; **no nomination row**; no logo, no colour | `name` `en` and `fi`: `[OR-N] Unnominated Party` / `[OR-N] Ehdokkuudeton puolue`; `short_name` `en` only: `ORN` |
| question_categories | `qc-info`, `qc-opin` | neither states an entity type | `en` |
| questions | `qu-info-req` | text, `required: true`, editable, no entity type | `en` |
| questions | `qu-opin-1`, `qu-opin-2` | `singleChoiceOrdinal`, `LIKERT_5_EN`, `required: true`, `allow_open: false`, no entity type | `en` |
| nominations | `nom-ca-nominated` | `ca-nominated` in `el-1` and `co-1`, round 1, `election_symbol: '7'`, confirmed by the seed's default, under no parent | — |
| app_settings | `app-settings` | `MINIMAL_BASE_APP_SETTINGS` with `contestantApp` restated whole: `entityTypes: ['candidate', 'organization']`, the base's registration modes | — |

No answer is seeded. **For a later plan that asserts a localized name:** only the organization's `name` has a second locale (`fi`). The election's, the constituency's and the organization's short name have `en` alone, so in a Finnish session they are read through the default-locale fallback.

**Rows a state step writes** (not seeded; removed by the teardown's prefix): `nom-ca-none` and `nom-or-none`, each its entity in `el-1` and `co-1`, round 1, `election_symbol: '12'`, `confirmed` stated.

**The dry run's two readings (A6).**

1. `yarn workspace @openvaa/dev-seed test:unit`: exit 0, 68 files, **1041 passed** (was 1037: three family cases for the new template and one count case). `typecheck` exit 0.
2. A scratch copy without the settings row (`tests/e2e-runs/176-unit/176-07-scratch-template.ts`, gitignored) seeded through the CLI into the local default project: exit 0, **12 rows**. `psql` (`176-07-dryrun-readback.txt`): `ca-none` confirmed, 0 nominations; `or-none` confirmed, 0 nominations, name `{en, fi}`, short name `{en}`; `ca-nominated` confirmed, 1 nomination; `nom-ca-nominated` confirmed, symbol `7`, round 1, `entity_type` `candidate`; three questions, each `required`, none with an entity type. `yarn db:seed:teardown --prefix e2e-perm-no-nomination-`: 12 rows deleted, 0 storage objects removed; the default project's 377 nominations untouched. The CLI resolves a template path from `packages/dev-seed`, so the scratch file was named by absolute path (the first attempt with a relative path exited 1 on "Cannot find module" and wrote nothing).

**The lists of built-ins that changed** (`git grep -n -F "perm-organization-editing" -- packages/dev-seed tests/tests apps/docs/src`): the three places of `templates/index.ts`; the family test (below); `packages/dev-seed/README.md` "30 of the 32 built-ins" → "31 of the 33"; one measured comment of `src/template/permittedKeys.ts` "all 32 built-ins" → "all 33" (its row counts are unchanged: the new template states no answers key). No list under `apps/docs/src`. Not changed: the test title "covers at least 30 built-ins" in `assertKnownRowProps.builtins.test.ts`, which is still true.

**The family test.** `built-in-templates-contestant-app.test.ts` gained a fifth family, `perm-no-nomination`, with the lists Phase 175's family has and a case of its own that exactly one template is in it; `familyOf` names it; the header comment says two perm datasets serve both types.

**Test ids added** (the UI contract's Locator Contract, each under a comment naming its element and state attributes): `contestant.home.tasks`, `.task`, `.nomination`, `.profile`, `.preview`, `.continue`, `.closedReason`, `.tip`; the block `contestant.nominations` — `page`, `list`, `card`, `election`, `constituency`, `parent`, `electionSymbol`, `state`, `pendingNote`, `empty`, `lockedNote`, `continue`; `contestant.nav.nominations`, `.closedReason`. Every earlier key has the value it had (`home.questions` moved two lines down, same value). `contestant.profile.nominations` is still there for plan 176-13.

## The data module — `tests/tests/utils/permNoNominationData.ts`

| Entity | External id | Grant | Editor email | Storage state | Names |
|---|---|---|---|---|---|
| candidate, no nomination | `UNNOMINATED_CANDIDATE_EXTERNAL_ID` (`…ca-none`) | `UNNOMINATED_CANDIDATE_GRANT` | `UNNOMINATED_CANDIDATE_EDITOR_EMAIL` | `UNNOMINATED_CANDIDATE_STORAGE_STATE` (`playwright/.auth/perm-no-nomination-candidate-none.json`) | `UNNOMINATED_CANDIDATE_NAME` (`firstName`, `lastName`) |
| organization, no nomination | `UNNOMINATED_ORGANIZATION_EXTERNAL_ID` (`…or-none`) | `UNNOMINATED_ORGANIZATION_GRANT` | `UNNOMINATED_ORGANIZATION_EDITOR_EMAIL` | `UNNOMINATED_ORGANIZATION_STORAGE_STATE` (`…-organization-none.json`) | `UNNOMINATED_ORGANIZATION_NAME` (`en`, `fi`), `UNNOMINATED_ORGANIZATION_SHORT_NAME` (`en`) |
| candidate, nominated | `NOMINATED_CANDIDATE_EXTERNAL_ID` (`…ca-nominated`) | `NOMINATED_CANDIDATE_GRANT` | `NOMINATED_CANDIDATE_EDITOR_EMAIL` | `NOMINATED_CANDIDATE_STORAGE_STATE` (`…-candidate-nominated.json`) | `NOMINATED_CANDIDATE_NAME` |

Each email is the entity's external id at `test.openvaa.local`; one editor grant each; terms of use accepted; password `NO_NOMINATION_PASSWORD` (the suite's shared test password).

Also: `NO_NOMINATION_PREFIX`; `ELECTION_EXTERNAL_ID`, `ELECTION_NAME` (`en`); `CONSTITUENCY_EXTERNAL_ID`, `CONSTITUENCY_NAME` (`en`); `NOMINATION_ELECTION_ROUND` (1); `REQUIRED_INFO_QUESTION_EXTERNAL_ID`; `OPINION_QUESTION_EXTERNAL_IDS` (two, in order); `NOMINATED_CANDIDATE_NOMINATION_EXTERNAL_ID` with `SEEDED_NOMINATION_ELECTION_SYMBOL` (`'7'`); `UNNOMINATED_CANDIDATE_NOMINATION_EXTERNAL_ID` and `UNNOMINATED_ORGANIZATION_NOMINATION_EXTERNAL_ID` with `WRITTEN_NOMINATION_ELECTION_SYMBOL` (`'12'`).

## The link (Task 2)

**The chain's edges as written** in `tests/playwright.config.ts`:

- `data-setup-perm-no-nomination` — `dependencies: ['perm-organization-editing']`, `teardown: 'data-teardown-perm-no-nomination'`
- `data-teardown-perm-no-nomination` — `retries: 0`, with its neighbours' reason
- `perm-no-nomination` — `testDir: './tests/specs/perm'`, `fullyParallel: false`, Desktop Chrome, no `storageState`, `dependencies: ['data-setup-perm-no-nomination']`
- `data-setup-perm-analytics-tracking` — re-pointed to `dependencies: ['perm-no-nomination']` (was `['perm-organization-editing']`, read before the edit)
- the diagram's last line: `→ perm-organization-editing → perm-no-nomination → voter-prefs-tracking (the tail; admin-access follows it)`; the closing docblock names both session-storing links.

No dependency list of `contestant-a11y-scan` names a project of this dataset (`yarn assert:a11y-scan-wiring` exit 0). The configuration loads, so the prefix guard accepted `e2e-perm-no-nomination-`. `--list --project perm-no-nomination`: 199 tests, three of them under `perm-no-nomination`.

**The composition root: import `test` from `tests/tests/fixtures/contestant/perm-no-nomination.ts`.** It registers `contestantEntityHomePage` and `navMenu` and re-exports `expect`.

**Which home fixture owns what (the pattern map's open item).** The plan registers Phase 175's `contestantEntityHomePage.fixture.ts` (`open()`, `expectLanded(grant)`, `expectQuestionsButton(present)`) on this root, and this plan added **no** fixture step to it or to any fixture. The task steps (`expectTasks` with a status per task, the reason sentence, the main action) are named by the UI contract for `contestantHomePage.fixture.ts`, which the journey's root uses; that fixture is not registered here. A plan that needs task steps in this spec (176-14, 176-15) has to register the fixture that holds them on this root — the plans settle which; this plan did not decide it.

**The state steps, with their exact signatures:**

```ts
export type NominationState = 'none' | 'pending' | 'confirmed';
export interface AnswersState { requiredInfo: boolean; opinions: 'none' | 'allButLast' | 'all' }

export async function setNominationState(entity: EntityGrantTarget, state: NominationState): Promise<void>;
export async function setAnswers(entity: EntityGrantTarget, answers: AnswersState): Promise<void>;
export async function setNominationsLocked(on: boolean): Promise<void>;
```

| Step | What it reads and writes |
|---|---|
| `setNominationState` | Resolves the entity's id (`admin.entityId`), reads the entity's nominations by `candidate_id` / `organization_id`. `none`: `bulkDelete({ nominations: { external_ids: [<the entity's one row>] } })` when the row exists. `pending` / `confirmed`: an existing row has `confirmed` alone changed with `update`, and only when it differs; a missing row is written with `bulkImport` — external id, the entity's own `project_id`, entity, election and constituency by external id, round 1, the symbol, `confirmed` stated. For `ca-nominated` the row is the seeded `nom-ca-nominated`. |
| `setAnswers` | `update(<entity table>, id, { answers })` — the column whole. `requiredInfo: true` stores `{ value: { en: 'An answer the test wrote.' } }` under `qu-info-req`'s id; an answered opinion question stores `{ value: '3' }`; `allButLast` answers `qu-opin-1` alone. Keys are question ids resolved from external ids. |
| `setNominationsLocked` | `updateAppSettings({ access: { nominationsLocked: on } })` — the one key. |

Each makes its own service-role client. `setNominationState` and `setAnswers` **throw for an entity that is not one of the dataset's three**, and `setNominationState` throws when the entity holds a nomination that is not the dataset's own row for it, so nothing outside the prefix is written or removed (T-176-26). **Not exercised by a test yet:** `'pending'`, the `bulkImport` branch of `setNominationState` (no test gives an unnominated entity a nomination before plan 176-08), `setAnswers` and `setNominationsLocked` — each type-checks and is called by no test of this plan.

**The spec's three tests**, one describe per session with `test.use({ storageState })`:

| Session | Title | Body |
|---|---|---|
| unnominated candidate | `dataset: the editor of a candidate with no nomination stays signed in and lands on that candidate's home` | `setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'none')`, `open()`, `expectLanded(grant)` |
| unnominated organization | `dataset: the editor of an organization with no nomination stays signed in and lands on that organization's home` | the same with the organization's grant |
| nominated candidate | `dataset: the editor of a candidate with a confirmed nomination lands on that candidate's home` | `setNominationState(NOMINATED_CANDIDATE_GRANT, 'confirmed')`, `open()`, `expectLanded(grant)` |

`expectLanded` asserts the home's status message, an entity-home URL and the entity's type and id; the login page fails the first two. Nothing is asserted about the profile, the questions or the preview, so no test of this plan turns red when plan 176-08 gates them.

**The pre-commit run** — one attempt, no `-rN`:

`tests/e2e-runs/176-e2e/176-07-precommit`, directly through the wrapper with `--no-db-reset --project perm-no-nomination`, of head `6a9928f87` with the six files uncommitted (`176-07-precommit.diff` and the spec as run, `176-07-precommit.perm-no-nomination.spec.ts`, beside it). Launched 02:29:48Z. Wrapper exit 0, no void marker. **199 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; 5.9 min.** `perm-no-nomination: 3 test(s), 3 passed`. Verdict `control … --green`: **PASS** (`176-07-precommit.verdict.txt`); its recorded uncommitted paths are exactly the six. Before the commit `git diff HEAD` was byte-equal to the kept diff (`cmp` exit 0). Docker VM free before: 19.10 GiB. AC power, 100 %.

**What a one-project run of `perm-no-nomination` covers:** 199 tests in 5.9 min — the 194 of a `perm-organization-editing` slice (the permutation chain up to it and the projects the chain's head depends on, with their setups) plus this dataset's setup, three tests and teardown. The chain's tail and the base leaves outside those dependencies are covered by a full run alone.

## The gate set and the full run (Task 3)

**Gate set `176-07-close`** — `tests/e2e-runs/176-gates/176-07-close`, head `a35ebb1e9`, launched 02:36:17Z, driver exit 0, verdict **PASS**. The phase's first run of all fourteen rows and of the database rows on plan 176-02's schema. Docker VM free before: 19.07 GiB.

| Row | Exit | Seconds | Numbers |
|---|---|---|---|
| typecheck | 0 | 19 | |
| lint | 0 | 43 | |
| db-reset | 0 | 29 | the in-flight check passed |
| types-regen | 0 | 2 | |
| types-clean | 0 | 0 | no drift |
| pgtap | 0 | 5 | **Files=42, Tests=1957, Result: PASS** (the baseline's 41 files and 1888, plus plan 176-02's file) |
| sql-lint | 0 | 4 | |
| integration | 0 | 3 | |
| unit | 0 | 65 | frontend **3385 passed**, 20 skipped; dev-seed **1041**; supabase 462; the harness's own 102 |
| check-frontend | 0 | 9 | 2796 files, 0 errors, 0 warnings |
| build | 0 | 15 | |
| format | 0 | 18 | |
| docs-links | 0 | 2 | |
| name-gate-self-test | 0 | 0 | |

`176-verdict.mjs scope` and `… hygiene` exit 0 inside Task 3's verify.

**Full run `176-07-close`** — `tests/e2e-runs/176-e2e/176-07-close`, through `176-e2e.sh 176-07-close --require-project perm-no-nomination`, head `a35ebb1e9`, 02:40:04Z → 02:47:29Z. Driver exit 0, no void marker, no Sleep entry in its window. Docker VM free before: **19.25 GiB** (the driver's own reading); after: 19.21 GiB. AC power, 100 %.

```
counts: total 273, passed 273, failed 0, flaky 0, skipped 0, didNotRun 0; 113 project(s)
not stale: head a35ebb1e9 is tree-equal to HEAD outside .planning/
power: no Sleep entry inside the run window
project perm-no-nomination: 3/3 passed
project contestant-journey: 1/1 passed
project contestant-a11y-scan: 22/22 passed
project perm-no-nomination: 3 test(s) whose title contains 'dataset:', all passed
per project: 113 compared, 0 not as expected
176-verdict e2e 176-07-close: PASS
```

**Per project against `176-06-close` (268 in 110):** each of its 110 projects is at its total; the three new ones are present and green — `data-setup-perm-no-nomination` 1, `data-teardown-perm-no-nomination` 1, `perm-no-nomination` 3. 268 + 5 = 273. The whole table is `tests/e2e-runs/176-e2e/176-07-close.verdict.txt`. **`176-07-close` is the per-project baseline for plan 176-08.**

**The refusals**, both on `176-07-close`:

1. Without the three exceptions (the plan's step 4): exit **1** —
   ```
   FAIL project 'data-setup-perm-no-nomination' has total 1; expected equal to 0 (176-06-close has 0)
   FAIL project 'data-teardown-perm-no-nomination' has total 1; expected equal to 0 (176-06-close has 0)
   FAIL project 'perm-no-nomination' has total 3; expected equal to 0 (176-06-close has 0)
   176-verdict e2e 176-07-close: FAIL (3)
   ```
   This is the first run in which a project's total differs from its predecessor's, so the branch every later `--except` rests on is seen refusing here (`176-07-close.refusal.txt`).
2. A false title count (the plan's acceptance criterion and output speak of two; its step 4 names one): `--expect-title-count "perm-no-nomination::dataset:=999"` exits **1** — `FAIL project 'perm-no-nomination' holds 3 test(s) whose title contains 'dataset:', not 999` (`176-07-close.refusal-title.txt`).

No axe finding and no width overflow: this plan builds no surface.

## The code review checklist

Over the template, the data module, the setup and teardown, the three projects, the composition root and the spec.

| Item | Outcome |
|---|---|
| Solves the issue | yes — the dataset seeds; three sessions land on their own entity's home, two of them with no nomination |
| OWASP top 10 | three test users with real editor grants and the suite's shared password exist only between the setup and the teardown, on a local domain; the session helper unregisters each address first and the teardown unregisters each by address. The state steps write with the service role and refuse any entity or nomination row that is not the dataset's own. No production path is touched |
| Code style guide | ESLint and Prettier exit 0 (lint and format rows). Two private helpers take two positional parameters of distinct types (`nominationOf(step, entity)`, `tablesOf(step, entity)`), as their siblings in Phase 175's root do |
| No `any` | none; `{ value: unknown }` on the stored answers |
| No repetition | **Finding, not fixed:** `inFreshContext(browser, baseURL, action)` is now in two setups, `perm-organization-editing.setup.ts` and `perm-no-nomination.setup.ts`, word for word. The fix is a shared module under `tests/tests/setup/shared/` used by both; it changes Phase 175's setup, so it needs a pre-commit run of its own. Left for a later plan or the closing plan. The three registration calls differ by identity alone and are the form the plan prescribes |
| New entities documented | TSDoc on every export of the data module and the composition root; the template is documented by its header, as its siblings are; each new registry id has a comment |
| Repo markdown updated | `tests/README.md` (the link's paragraph and table, the chain sentence of the organization-editing link, the composition roots, the data module); `packages/dev-seed/README.md` (one count) |
| Tracking events | nothing a user can perform is added |
| New Svelte components | none |
| Errors handled | every failed read and every unknown entity or question throws by name; each browser context is closed in a `finally` |
| Failing checks | none at any commit of this plan |
| Parts sharing the dependency | the analytics setup moved one link down the chain; the full run holds every earlier project at its total |
| WCAG, keyboard and screen reader | no application file is changed |
| Docs guides | no page under `apps/docs/src` lists the built-in templates or the suite's projects (searched) |
| Comment hygiene | `yarn assert:comment-hygiene` exit 0 on the working tree before each commit; every added comment and title read: no history, no plan, decision or assumption id. The registry's new comments describe elements later plans render — the UI contract's wording, ordered by the plan |
| Commit history | linear; dataset, identities and ids, link |
| No fixes of itself | none |
| Formatting in its own commit | none |
| `[db]` tag | no database change |
| Backend, adapter, Edge Function sections | name nothing this plan touches |

## Deviations from Plan

**1. Two dev-seed files outside the plan's list**, as the plan's step 5 allows ("any measured comment"): `src/template/permittedKeys.ts` (one count in a comment). `packages/dev-seed/README.md` is in the list.

**2. The family test has a family of the new template's own**, not Phase 175's key shared: the plan says "give it the family Phase 175's template has, with a count assertion of its own". Read as: the same expected lists under its own key, so each count assertion stays "exactly one".

**3. The state steps refuse what is not the dataset's.** The plan says each step "writes only what it is given"; the steps also throw for an entity outside the dataset's three and for a foreign nomination row on one of them. `setNominationState`'s new row carries the entity's own `project_id`, read from the entity's row, because `bulkImport` takes the project from each row.

**4. The setup does not unregister each editor itself.** The plan says "each unregistered first so that a second run starts clean"; `registerAndStoreSession` already unregisters any user holding the address before it registers one (read at `await client.unregisterCandidate(identity.email)`), so the setup adds no second call and its header says where it happens.

**5. The teardown asserts that its literal `PREFIX` equals the data module's**, as Phase 175's does.

**6. A second refusal was made** (the false title count), because the acceptance criterion and the output block speak of two while step 4 names one.

**7. Comments of `tests/playwright.config.ts` and `tests/README.md` beyond the diagram and docblock were corrected** where the new link made them false: "the one perm dataset whose settings serve both entity types" in each.

**8. One poll held three 45-second waits in one command** (the pre-commit run's second poll), against the execution rules' one bounded loop per poll. Every other poll was one loop of at most 45 seconds.

**9. HEAD is on `feat/entity-signup-multi-grant`**, the branch the orchestrator named, not a per-agent branch.

Nothing was appended to `.planning/WINDOWS.md`: no stub, no skipped test, no verify left unrun.

## For plans 176-08 to 176-18

**How a test reaches a session:** a nested `test.describe` with `test.use({ storageState: <the constant> })`; the project carries no `storageState`. Import `test` and the state steps from `tests/tests/fixtures/contestant/perm-no-nomination.ts`, and the grants, names and ids from `tests/tests/utils/permNoNominationData.ts`. Add a fixture to the root's `NoNominationFixtures` and its `base.extend`.

**Every test begins with its state steps, then a full page load.** The entity's nominations and the settings are read when a page is loaded; a page already open does not follow a step.

**Facts measured on this dataset:**

- An entity with no nomination **signs in through the login form and reaches its home** with the status message rendered — for a candidate and for an organization (the setup's registrations and the two `dataset:` tests). The settle marker `contestant-home-status` holds for it today; plan 176-14 has to keep it.
- The three entities are confirmed, so no name field is editable and the profile task has no name clause.
- `ca-nominated` is in an `organization_list` election under no parent; a top-level candidate nomination there is accepted by the database (seeded and read back).
- The questions and categories state no entity type: all three questions are asked of both types.
- Only `or-none`'s `name` has a `fi` entry. Its short name, the election's and the constituency's names are `en` alone.
- A candidate seeded by the CLI into the default project had no stored portrait here (`0 storage objects removed`), unlike Phase 175's note; whether the E2E setup's writer uploads one for these candidates was not read.
- A one-project run is 199 tests and 5.9 min; the full run is 273 tests in 113 projects and 7.4 min.

**Not yet exercised in a browser or by any test:** a nomination written by `setNominationState` (`'pending'`, or `'confirmed'` on an unnominated entity) — RQ-3's "the nomination a state step inserts is admitted" is proven for the seeded shape, and for an **organization** in this election by Phase 175's dataset, but the `bulkImport` call of the step itself first runs in plan 176-08. If it is refused there, the cause is in the step, not in that plan's surface. The same for `setAnswers` (its stored shape for the text question is the one `buildStandardCandidateAnswers` uses) and `setNominationsLocked`.

**In the tree as it stands,** an entity with no nomination can open its profile, and its questions URL shows the loading view for good (read in 176-06, not asserted here). No committed test depends on either.

**For plan 176-19:** the `inFreshContext` duplication above; `apps/docs` was not searched beyond the lists of built-ins.

## The state the local database is left in

Read with `psql` after the reseed:

- **Schema:** the tree's, applied by the gate set's `db-reset` at about 02:37Z. pgTAP ran after it, so its helper functions are in `public` until the next reset.
- **Default project:** the `default` dataset, reseeded by `yarn db:seed:default` after the full run (exit 0, 752 rows): 377 nominations.
- **Projects:** 3. The E2E project and the third hold no nomination; no row under `e2e-perm-no-nomination-` is left anywhere: every teardown of the run passed.
- **Auth users:** 2. No user or storage-state file of this dataset is left.
- **`private.invitation_link_witness`: 13 rows**, written by the full run after the reset; `39-invitations.test.sql` test 238 is red on this database without a reset — the known finding.
- The stack is up; neither it nor Docker was restarted; nothing pruned but the build cache, by the driver. Nothing listens on the wrapper's port. Docker VM free: 19.21 GiB.

## Not done, or not verified

- The `inFreshContext` extraction (checklist finding).
- `'pending'`, the insert branch of `setNominationState`, `setAnswers` and `setNominationsLocked` are called by no test (above).
- No isolated determinism batch of the new spec; the closing plan's. The new project ran twice, green both times.
- `pmset -g log` was not read by hand: both runs are green and the verdict's own power line reports no Sleep entry in the full run's window.
- `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` were not edited; none was searched for a sentence this plan made false. `CAND-APP-PLAN.md` stays untracked; nothing under `tests/e2e-runs/` was deleted.

## Files touched that the plan did not list

- `packages/dev-seed/src/template/permittedKeys.ts` (deviation 1).

Gitignored evidence: `tests/e2e-runs/176-e2e/176-07-precommit/` with `.diff`, `.head`, `.verdict.txt` and the spec as run beside it; `tests/e2e-runs/176-e2e/176-07-close/` with `.verdict.txt`, `.refusal.txt`, `.refusal-title.txt`; `tests/e2e-runs/176-gates/176-07-close/`; in `tests/e2e-runs/176-unit/`: `176-07-t1-verify.*` to `176-07-t3-verify.*`, `176-07-devseed.*`, `176-07-scratch-template.ts`, `176-07-dryrun-*`, `176-07-t1-*`, `176-07-t2-*`, `176-07-precommit-run.*`, `176-07-commit-t1.sh`, `176-07-commit-t2.sh`, `176-07-gates-close.*`, `176-07-gates-verdict.log`, `176-07-e2e-close.*`, `176-07-e2e-verdict.sh`, `176-07-seed-default.log`.

## Known Stubs

None.

## Threat Flags

None beyond the plan's register. T-176-25: the configuration loaded with the new prefix and the teardown asserts its literal. T-176-26: the steps' refusals and exact external ids. T-176-27: every test begins with a state step; the three-run batch is the closing plan's. T-176-28: `control … --green` on the uncommitted tree, whose head lacks the spec (Task 2's verify). T-176-29: the teardown unregisters each editor; 2 auth users after the run.

## Self-Check: PASSED

- The six created files are tracked; `58be09ac3`, `6a9928f87` and `a35ebb1e9` are ancestors of HEAD; `git rev-list --count 60c816d75..a35ebb1e9` is 3.
- `176-07-t1-verify.exit`, `-t2-` and `-t3-` each hold 0; the control, gate and E2E verdicts exit 0 and the two refusals exit 1; the full run's directory holds no void marker.
- `git diff --quiet 60c816d75 HEAD -- .planning/STATE.md .planning/ROADMAP.md .planning/REQUIREMENTS.md CLAUDE.md` exits 0.
- `git status --short` before this file was written showed the untracked `CAND-APP-PLAN.md` alone.
