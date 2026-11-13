---
phase: 175-organization-editing-profile-questions-preview
plan: 05
subsystem: testing
tags: [e2e, playwright, dev-seed, template, fixtures, gates, entity_type, sessions]

requires:
  - phase: 175-organization-editing-profile-questions-preview (plan 01)
    provides: 175-gates.sh, 175-e2e.sh, 175-verdict.mjs and the checked baseline; the Input parts repair this plan's full run is the browser proof of
  - phase: 175-organization-editing-profile-questions-preview (plan 03)
    provides: entity_type carried by bulk_import on the question tables and typed in dev-seed; the colour validation
  - phase: 175-organization-editing-profile-questions-preview (plan 04)
    provides: the reworded Help title and the two menu lists of the journey spec, first run in a browser here
provides:
  - the built-in template perm-organization-editing (prefix e2e-perm-organization-editing-)
  - the Playwright projects data-setup-perm-organization-editing, data-teardown-perm-organization-editing and perm-organization-editing, between perm-org-matching and the analytics setup
  - three stored sessions, one per editor of the dataset's three entities
  - tests/tests/utils/permOrganizationEditingData.ts, the fixtures contestantEntityHomePage and organizationDetail, the composition root fixtures/contestant/perm-organization-editing.ts
  - fourteen new test ids in tests/tests/utils/testIds.ts
  - SupabaseAdminClient.entityId (target) — an entity's id by type and external id
  - the phase's first gate set (175-05-close, 14 rows green) and first full run (175-05-close, 226 passed in 110 projects)
affects: [175-06, 175-08, 175-09, 175-10, 175-11, 175-12, 175-13]

actuals:
  tokens: 19418 # chars/4 over the five commits' diff outside .planning/ (77673 chars)
  tasks: 3
  commits: 5 # MEASURED: git rev-list --count 8c9b0e668..c5ced389c; all five are this plan's
plan_head_before: 8c9b0e668fc1aadfc0a05abdc742214ed2077fe1
plan_head_after: c5ced389c29f69e91213b466a57b3d2ce0744d81

tech-stack:
  added: []
  patterns:
    - "A setup that stores several sessions registers each in a browser context of its own: a signed-in page is never shown the login form"
    - "A landing assertion names the entity by type and id, read with the service role, so a session stored for the wrong entity of the same type fails"
    - "A voter-side fixture opens a card through its title: the card's link wraps the whole card or its header alone, and the title is inside both"

key-files:
  created:
    - packages/dev-seed/src/templates/e2e/perm/perm-organization-editing.ts
    - tests/tests/utils/permOrganizationEditingData.ts
    - tests/tests/setup/perm/perm-organization-editing.setup.ts
    - tests/tests/setup/perm/perm-organization-editing.teardown.ts
    - tests/tests/fixtures/contestant/contestantEntityHomePage.fixture.ts
    - tests/tests/fixtures/voter/organizationDetail.fixture.ts
    - tests/tests/fixtures/contestant/perm-organization-editing.ts
    - tests/tests/specs/perm/perm-organization-editing.spec.ts
  modified:
    - packages/dev-seed/src/templates/index.ts
    - packages/dev-seed/src/template/permittedKeys.ts
    - packages/dev-seed/README.md
    - packages/dev-seed/tests/templates/built-in-templates-contestant-app.test.ts
    - tests/tests/utils/testIds.ts
    - tests/tests/utils/supabaseAdminClient.ts
    - tests/tests/setup/shared/registerAndStoreSession.ts
    - tests/playwright.config.ts
    - tests/README.md

key-decisions:
  - "The template does not state results.sections: with no visible candidate nomination the results render the organizations' list directly, with no tab list"
  - "cli/help.ts is not edited: its list names the family as perm-*, which covers the new name; the plan's verify stage that greps the literal exits 1 and is reported"
  - "The dev-seed test that pins each built-in's served entity types gains a family for perm-organization-editing rather than a loosened expectation"
  - "contestantEntityHomePage.open () takes no entity (the session decides it); expectLanded takes the grant target and checks the entity's id as well as its type"
  - "No red test was committed: the link was run four times on the uncommitted tree and committed on the third run's verdict; one comment-only config change followed on the fourth's"

patterns-established:
  - "Pre-commit proof of an E2E change: tests/scripts/e2e-run.sh on the uncommitted tree, e2e-evidence.mjs, then 175-verdict.mjs control … --green --dirty-only tests/"

requirements-completed: []

coverage:
  - id: D1
    description: "The dataset seeds: two organizations (one confirmed, one not), an unconfirmed candidate, a nomination each, six questions scoped by entity type, and settings that serve both entity types"
    requirement: GEN-01
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/dev-seed test:unit (68 files, 1037 tests; the built-ins key gate and the contestantApp-root test run the template)"
        status: pass
      - kind: other
        ref: "a scratch copy seeded through the CLI into the local default project and read back with psql, then torn down (17 rows written, 17 deleted)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Three sessions registered through the shared helper on rows a permutation template seeded, each landing on its own entity's home"
    requirement: GEN-01
    verification:
      - kind: e2e
        ref: "tests/tests/specs/perm/perm-organization-editing.spec.ts — the three `dataset:` landing tests; runs 175-05-precommit-r2, -r3, -r4 and 175-05-close"
        status: pass
    human_judgment: false
  - id: D3
    description: "An anonymous voter finds the confirmed organization's detail under its seeded name and does not find the unconfirmed organization"
    requirement: GEN-01
    verification:
      - kind: e2e
        ref: "the `dataset:` voter test of the same spec (red in 175-05-precommit on a fixture defect, green from -r2 on)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The first gate set of the phase is green on the tree of waves 1 and 2 plus this plan"
    verification:
      - kind: other
        ref: "175-verdict.mjs gates 175-05-close (exit 0; fourteen rows at 0; pgTAP Files=41, Tests=1888)"
        status: pass
    human_judgment: false
  - id: D5
    description: "One full default E2E run: 0 failed, 0 flaky, 0 did not run; every baseline project at its total; the three new projects present and green"
    verification:
      - kind: e2e
        ref: "175-verdict.mjs e2e 175-05-close --same-projects-as tests/e2e-runs/261008-quick-g2-g4-g6 with the three exceptions (exit 0)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The verdict refuses the run against the baseline without its exceptions, and a false title count"
    verification:
      - kind: other
        ref: "both commands exit 1 (tests/e2e-runs/175-e2e/175-05-close.refusal-*.txt)"
        status: pass
    human_judgment: false

duration: 50min
completed: 2026-10-08
status: complete
---

# Phase 175 Plan 05: The Organization-Editing Dataset, its Link of the Suite, and the Phase's First Gate Set and Full Run — Summary

**A hand-authored template with a confirmed organization, an unconfirmed organization and an unconfirmed candidate, seeded by its own setup into the suite's project with one stored session per editor, proven on the uncommitted tree before it was committed; then the phase's first gate set (14 rows, all 0) and first full run (226 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run, 110 projects), with every one of the baseline's 107 projects at its baseline total.**

## Performance

- **Duration:** about 50 min (13:21Z → 14:12Z)
- **Tasks:** 3 of 3
- **Files:** 8 created, 9 modified (17 in all; 888 lines added, 25 removed)

## Task Commits

1. **Task 1 — the dataset:** `29d8444c6` `test(175-05): the organization-editing dataset — two organizations, a candidate, questions scoped by entity type` (5 dev-seed files)
2. **Task 1 — identities and ids:** `ca8902594` `test(175-05): the organization-editing dataset's identities and the new test ids` (3 test-side files)
3. **Task 2 — the link:** `44457c96e` `test(175-05): the organization-editing link of the suite — setup, teardown, sessions and its first tests` (8 files), committed after `control 175-05-precommit … --green` passed on `-r3`
4. **Task 2 — a comment:** `aee581473` `docs(175-05): the perm chain's diagram keeps the new link on the tail's line` (deviation 5), committed after the same verdict passed on `-r4`
5. **Task 3 — the README:** `c5ced389c` `docs(175-05): the organization-editing projects in the E2E inventory`

Each was made by pathspec. No other agent's commit sits between them.

## Each task's verify command, with its real exit status

Evidence is under `tests/e2e-runs/175-unit/` as `175-05-t<N>-*.log` / `.exit` / `.head`.

| Verify | Head | Exit | Why |
|---|---|---|---|
| **Task 1, as written** | `ca8902594` | **1** | Stops at its fourth stage, `git grep -q -F "perm-organization-editing" -- packages/dev-seed/src/cli/help.ts`: the help text lists the family as `perm-*` and was not edited (deviation 1). The three stages before it passed. |
| Task 1, the same chain with that one stage asking whether the help's list covers the name | `ca8902594` | **0** | Every later stage passed: array-only `entity_type`, `confirmed: false`, the ten test ids, dev-seed typecheck, dev-seed unit (68 files, 1037 tests), `typecheck:tests`, ESLint, comment hygiene. The script is kept as `175-05-t1-verify-own.sh`. |
| **Task 2, as written**, first run | `44457c96e` | **1** | Reached `yarn assert:comment-hygiene`, which reported one finding in this plan's own change to `tests/playwright.config.ts` (deviation 5). Every stage before it passed. |
| **Task 2, as written**, second run | `c5ced389c` | **0** | Whole chain, the control verdict on `175-05-precommit-r4` included. |
| **Task 3, as written** | `c5ced389c` | **0** | scope, hygiene, gates, e2e against the baseline, and the two refusals each non-zero. |

## The dataset (Task 1)

Template `perm-organization-editing`, `externalIdPrefix: 'e2e-perm-organization-editing-'`, every collection stated with `count: 0`, `generateTranslationsForAllLocales: false`.

**Every row's external id** (each is the prefix followed by):

| Collection | Ids | What it holds |
|---|---|---|
| elections | `el-1` | `organization_list`, one round |
| constituency_groups · constituencies | `cg-1` · `co-1` | one each |
| organizations | `or-confirmed` | confirmed by the seed's default; `name` `{ en: '[OR-A] Confirmed Party', fi: '[OR-A] Vahvistettu puolue' }`; `short_name` `{ en: 'ORA', fi: 'ORA-FI' }`; no image, no colour; answers `qu-opin-1` = `'5'` and `qu-opin-2` = `'1'`, nothing else |
| organizations | `or-unconfirmed` | `confirmed: false`; `name` `{ fi: '[OR-B] Vahvistamaton puolue' }` only; no short name, image, colour or answer |
| candidates | `ca-unconfirmed` | `confirmed: false`; `first_name` `'[CA-U] Unconfirmed'`, `last_name` `'Candidate'`; no organization, no answers (U-30's block) |
| question_categories | `qc-info` · `qc-opin` | neither states `entity_type` |
| questions | `qu-opin-1`, `qu-opin-2`, `qu-opin-3` | Likert-5, `entity_type: ['organization']`, required |
| questions | `qu-info-org` | text, `entity_type: ['organization']`, editable, not required |
| questions | `qu-info-org-locked` | text, `entity_type: ['organization']`, `custom_data: { locked: true }`, nobody answers it |
| questions | `qu-info-cand` | text, `entity_type: ['candidate']`, editable, not required (not part of U-30's block) |
| nominations | `nom-or-confirmed`, `nom-or-unconfirmed`, `nom-ca-unconfirmed` | one per entity |
| app_settings | `app-settings` | below |

**The nomination shape taken.** Three top-level nominations, none under a parent, each naming its entity, the one election and the one constituency, `election_round: 1`; the candidate's also states `election_symbol: '1'`. `validate_nomination` returns a top-level nomination of an organization or a candidate as it is, whatever the election's type; the base dataset's three selection rows have the same shape. No row states `entity_type`. **All three nominations take the seed's confirmed default**: an unconfirmed entity hides its nomination, so confirming the entity alone publishes it — which is the one write D-19's confirmation step needs.

**Settings.** `MINIMAL_BASE_APP_SETTINGS`, with three roots restated: `contestantApp` whole, with `entityTypes: ['candidate', 'organization']` and the base's registration modes; `entities.hideIfMissingAnswers: { candidate: false }`; `matching.organizationMatching: 'answersOnly'`. No `access` member beyond the base's five and no `organization` key of `hideIfMissingAnswers`. `results.sections` is the base's `['candidate', 'organization']`.

**Read back from a database.** A scratch copy without the settings row was seeded through the CLI into the local default project: exit 0, 17 rows. `psql` showed both organizations and the candidate with the `confirmed` values above, six questions with `["organization"]` or `["candidate"]`, the locked one with `{"locked": true}`, and the three nominations. `yarn db:seed:teardown --prefix e2e-perm-organization-editing-` then deleted 17 rows. **The writer uploads a portrait for the candidate** (`Portraits uploaded: 1`): the seeded candidate has an image, though the template states none.

**The lists of built-in templates** (`git grep -n -F "perm-org-matching" -- packages/dev-seed tests/tests apps/docs/src`): the three places in `templates/index.ts`, which gained the name; a measured sentence in `permittedKeys.ts`, corrected (deviation 3); and file headers and spec comments that name `perm-org-matching` for itself. **No list under `apps/docs/src`**, so nothing is recorded for plan 175-13 on that count. `cli/help.ts` holds `perm-*`, not a list of names (deviation 1).

**Test ids added** (the UI contract's Locator Contract, with its comments): under `contestant.profile` — `identity`, `nameNote`, `firstName`, `lastName`, `name`, `shortName`, `color`, `colorHex`, `saveMessage`, `cancel`, `return`; under `contestant.questions` — `none`, `noneReturn`; under `contestant.preview` — `tag`. Every earlier key has the value it had.

## The link (Task 2)

**Ruling 1's proof — the session helper on rows a permutation template seeded.** Three registrations through `registerAndStoreSession`, each with one `entityGrants` target of this dataset, were green in all four runs of the uncommitted tree and in the full run; no error beginning "failed to find" occurred. Each session then lands on the home of the entity it was registered on, asserted by type **and by id**. The setup's one test took 3.3 to 3.6 s in each of the five runs (seed plus three sign-ins).

**What was measured about the results with an empty candidate section** (ruling 4). The voter walk reached the results; the page read "1 party" and listed `[OR-A] Confirmed Party` at 33 % with **no entity-tab list**: a tab list is rendered only when more than one entity type has a visible nomination. `or-unconfirmed` was not listed. **So the template does not state `results.sections`**, and the fixture selects the organizations' tab only when their list is not already the one shown.

**The pre-commit runs**, all through `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/175-e2e/<label> --no-db-reset --project perm-organization-editing`, 152 tests each, one preflight success and no failure, no void marker, largest heartbeat lateness 42–68 ms, no Sleep entry in any window:

| Label | Tree | Result | Reason for the next attempt |
|---|---|---|---|
| `175-05-precommit` | uncommitted link on `ca8902594` | **red**: 151 passed, 1 failed (wrapper exit 1) | The voter test timed out at 90 s in `resultsPage.openEntityDetailsForCard`: that step looks for the card's link **inside** the card, and a card without member subcards is **wrapped by** its link. The page snapshot showed the card rendered. A defect of this plan's fixture, not of the tree: `organizationDetail.openFromResults` now clicks the card's title, which is inside the card and inside the link in both shapes. Nothing was committed. |
| `175-05-precommit-r2` | the same with the fixture corrected | green, 152 passed; `control … --green` PASS | TSDoc was then added to three exports, and the entity lookup was moved onto the admin client; the committed tree had to be the tree a run had shown. |
| `175-05-precommit-r3` | the tree committed as `44457c96e` | green, 152 passed; `control … --green --dirty-only tests/` **PASS** | — the commit followed. |
| `175-05-precommit-r4` | `44457c96e` plus the comment-only config change and the README | green, 152 passed; `control …` **PASS** | — `aee581473` and `c5ced389c` followed. |

`node 175-verdict.mjs control 175-05-precommit …` reads the newest attempt, `-r4`, whose recorded uncommitted paths are `tests/README.md` and `tests/playwright.config.ts`. The verdict on `-r3`, whose recorded paths are the eight files of the link's commit, is kept as `tests/e2e-runs/175-e2e/175-05-precommit-r3.verdict.txt`.

**The chain.** `data-setup-perm-organization-editing` depends on `perm-org-matching`; `data-setup-perm-analytics-tracking` depends on `perm-organization-editing` in place of `perm-org-matching`; the teardown has `retries: 0` with its neighbours' reason; no dependency list of `contestant-a11y-scan` names a new project (`yarn assert:a11y-scan-wiring` exit 0). The configuration loads, so the prefix guard accepted `e2e-perm-organization-editing-` beside `e2e-perm-orgmatch-`. `--list` shows 226 tests in 110 projects, the spec under `perm-organization-editing` and under no other.

**The teardown and stored images.** Deleting an entity row fires `cleanup_entity_storage_files` (schema `400-storage.sql`), which deletes every object in that entity's own storage folder through the Storage API after the delete commits. A logo a later test uploads for an organization is removed that way, asynchronously; nothing in the teardown waits for it or asserts it. `runTeardown` itself removes the portraits of the prefix's candidates and of no other type. The teardown's header says so.

## The gate set and the full run (Task 3)

**Gate set `175-05-close`** — `tests/e2e-runs/175-gates/175-05-close`, head `c5ced389c`, `TURBO_FORCE=true` (0 cached in every turbo row), driver exit 0, `175-verdict.mjs gates 175-05-close` **PASS**, no Sleep entry in the window. It is the first run of the driver and of its `integration` row.

| Row | Exit | Seconds | Numbers |
|---|---|---|---|
| typecheck | 0 | 18 | 23 turbo tasks |
| lint | 0 | 45 | `yarn lint:check`, every link |
| db-reset | 0 | 28 | the in-flight check passed |
| types-regen | 0 | 2 | |
| types-clean | 0 | 0 | no drift |
| pgtap | 0 | 6 | **Files=41, Tests=1888, PASS** |
| sql-lint | 0 | 3 | 0 errors, 3 warnings (the three known foreign keys without an index) |
| integration | 0 | 3 | 11 tests in 6 suites, 11 passed, 0 pending |
| unit | 0 | 67 | 25 turbo tasks; frontend 2708 passed / 11 skipped, dev-seed 1037, supabase 462, data 244, app-shared 141; then the harness's own 7 files / 102 tests |
| check-frontend | 0 | 9 | 2757 files, 0 errors, 0 warnings |
| build | 0 | 15 | 14 turbo tasks |
| format | 0 | 19 | |
| docs-links | 0 | 1 | 0 findings |
| name-gate-self-test | 0 | 0 | 82 findings on the fixture, 82 expected |

`175-verdict.mjs scope` and `… hygiene` both exit 0 at `c5ced389c`.

**Full run `175-05-close`** — `tests/e2e-runs/175-e2e/175-05-close`, head `c5ced389c`, through `175-e2e.sh 175-05-close --require-project perm-organization-editing`, driver exit 0, 14:02:00Z → 14:07:59Z.

- **226 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; 110 projects**; Playwright 5.3 min, 6 workers, 0 retries.
- Preflight 1 success, 0 failures; no void marker; largest heartbeat lateness 97 ms; no Sleep entry in the window.
- **Against the baseline `tests/e2e-runs/261008-quick-g2-g4-g6` (220 in 107 projects):** each of its 107 projects is at its baseline total in this run. The three new projects are present and green: `data-setup-perm-organization-editing` 1, `data-teardown-perm-organization-editing` 1, `perm-organization-editing` 4. 220 + 6 = 226.
- Verdict, taken at once: `175-verdict.mjs e2e 175-05-close --same-projects-as tests/e2e-runs/261008-quick-g2-g4-g6 --except data-setup-perm-organization-editing=+ --except data-teardown-perm-organization-editing=+ --except perm-organization-editing=+ --expect-project perm-organization-editing` → **PASS** (`175-05-close.verdict.txt`: one line per project, 107 "equal to … holds" and three "above 0 holds").

No run was void. One run was red, `175-05-precommit`, on the uncommitted tree, for the fixture defect above.

**What the full run proves about plans 175-01 to 175-04** (their first browser run): `contestant-journey` 1/1 with the two menu lists expecting "Support"; `contestant-a11y-scan` 22/22 and every contestant project green over the `Input` parts repair; every project green on the schema of plans 02 and 03.

**The two refusals** (Task 3 step 4), both on `175-05-close`:

1. Without the three exceptions: exit **1** — `FAIL project 'data-setup-perm-organization-editing' has total 1; expected equal to 0 (261008-quick-g2-g4-g6 has 0)`, the same for the teardown (1 against 0) and for `perm-organization-editing` (4 against 0); `175-verdict e2e 175-05-close: FAIL (3)`.
2. `--expect-title-count "perm-organization-editing::dataset:=999"`: exit **1** — `FAIL project 'perm-organization-editing' holds 4 test(s) whose title contains 'dataset:', not 999`.

## The code review checklist

Over the template, the data module, the setup and teardown, the three projects, the two fixtures, the composition root, the spec's first describe and the admin client's new method. Recorded before the gate set.

| Item | Outcome |
|---|---|
| Solves the issue | yes — the dataset seeds, three sessions land on their entities, the voter path to an organization's detail works |
| OWASP top 10 | three test users with real editor grants and the suite's shared password exist only between the setup and the teardown, on a local domain; the setup unregisters each first and the teardown unregisters each by address. The two unconfirmed rows state `confirmed: false`, and the voter test asserts the unconfirmed organization absent. No production path is touched |
| Code style guide | `Array<T>` / `ReadonlyArray<T>`, explicit return types, named exports. Two helpers take positional parameters of distinct types (`inFreshContext (browser, baseURL, action)`, `createContestantEntityHomePage (page, admin)`), as their siblings do |
| No `any` | none; `{ value: unknown }` on the answer map, as the analog template has it |
| No repetition | the entity lookup is the admin client's own, exposed as `entityId` instead of copied. The setup's three registration calls differ by identity alone and are the form the plan prescribes. **Finding, not fixed:** the title click in `organizationDetail` is the third copy of a workaround for `resultsPage.openEntityDetailsForCard` (also in `voter-results-redraw.spec.ts` and `perm-show-feedback-survey.spec.ts`); the shared step is outside this plan |
| New entities documented | TSDoc on every export of the data module, the two fixtures, the composition root and the admin client's method. The template constant is documented by its file header, as its 30 siblings are |
| Repo markdown updated | `tests/README.md` (inventory, chain, taxonomy, the served-types sentence, the stored-session pitfall); `packages/dev-seed/README.md` (two counts) |
| Tracking events | nothing a user can perform is added |
| New Svelte components | none |
| Errors handled | a missing entity or a failed read throws by name from the admin client; each browser context is closed in a `finally` |
| Failing checks | the first pre-commit run (fixed before any commit) and the comment guard at `44457c96e` (deviation 5) |
| Parts sharing the dependency | the analytics setup moved one link down the chain; the full run holds every baseline project at its total |
| WCAG, keyboard and screen reader | no application file is changed |
| Docs guides | no page under `apps/docs/src` lists the built-in templates or the suite's projects |
| Comment hygiene | every added comment read; `yarn assert:comment-hygiene` exit 0 at `c5ced389c`. **Was red at `44457c96e`** |
| Commit history | linear; dataset, identities, link, comment, README |
| No fixes of itself | **finding:** `aee581473` follows `44457c96e` on one comment of `tests/playwright.config.ts` |
| Formatting in its own commit | none |
| `[db]` tag | no database change |
| Backend, adapter and Edge Function sections | name nothing this plan touches |

## Deviations from Plan

### 1. `cli/help.ts` is not edited, and Task 1's verify exits 1 as written

The plan's action, acceptance criterion and verify all ask for the name in that file's list, on the premise that it "holds a hard-coded list of built-in names". It holds `perm-*  Settings/topology-permutation fixtures (see packages/dev-seed/src/templates/index.ts)`: one line for the family, which none of the 28 other permutation templates is named beside. Adding one name there would have been code written for a search. The file is unchanged, the verify was not edited, and the chain as written exits **1** at that stage. The stage's intent — the help's list covers the new name — was run by a command of my own (the family line exists and the name begins `perm-`), with every other stage unchanged: exit **0**. **The acceptance criterion "listed in `cli/help.ts`" is met through the family line and not by the literal.** If the ruling is that the literal must appear, it is one line of that file.

### 2. An existing dev-seed test's expectation table gained a family — reported for a ruling

`packages/dev-seed/tests/templates/built-in-templates-contestant-app.test.ts` pins every built-in outside `default` and `e2e/base` to `entityTypes: ['candidate']`. The new template serves both types by D-18, so the first unit run failed on it (1 of 1037). The test now has a fourth family, `perm-organization-editing`, with its own expected lists and a count assertion that exactly one template is in it; the `perm` family's expectation is untouched. This is an edit of an existing test, made because the test is a tripwire for exactly this event and the plan requires the unit suite at 0. The alternative is a template that serves candidates only, which cannot hold an organization's editor.

### 3. Three dev-seed files outside the plan's list

- `built-in-templates-contestant-app.test.ts` — deviation 2.
- `src/template/permittedKeys.ts` — one comment sentence that the new template made false: the answers key now occurs on 2 organization rows, in `perm-org-matching` and `perm-organization-editing`. Re-measured over the registry: 32 built-ins, 441 candidate rows.
- `README.md` — "29 of the 31 built-ins" is "30 of the 32", and "the message lists all 30" no longer states a number.

### 4. `tests/tests/utils/supabaseAdminClient.ts` gained `entityId (target)`

A public wrapper of the private `entityIdForGrantTarget`, so that the entity-home fixture reads an id without a second copy of the lookup. Plans 175-09 to 175-12 need the same read for their state steps.

### 5. The comment guard was red at `44457c96e`, and a comment-only commit followed

The chain diagram's new line, `→ perm-organization-editing` alone, reads to `assert-comment-hygiene` as a sentence broken across two lines; its neighbours pass because each holds an arrow between two links. I had run the guard on the tree before the link's files existed and not again before the commit, so `yarn lint:check` was red for one commit. The line now reads `→ perm-organization-editing → voter-prefs-tracking (…)`. Because the file is the Playwright configuration, the change was run on the uncommitted tree first (`-r4`, PASS) and then committed as `aee581473`. Cost: one fix of itself in the history.

### 6. The fixtures' surface differs from the plan's sketch

- `contestantEntityHomePage.open ()` takes no entity: it opens the app's root, and a single-entity session is sent to its entity. `expectLanded (entity)` takes the grant target (`{ entityType, externalId }`), not `{ entityType }` alone, and also asserts that the URL carries **that entity's id** — two organizations differ in the URL by id only, so a type check would pass for a session stored for the wrong one (T-175-23).
- `organizationDetail` has a fifth step, `openList ()`, which `openFromResults (name)` begins with.

### 7. The setup registers each editor in a browser context of its own

One `setup (…)`, as the plan says, but three sign-ins cannot share its `page`: a signed-in page is redirected past the login form. Each `registerAndStoreSession` call runs on a page of a fresh context (`inFreshContext`), closed afterwards.

### 8. The data module: one more export per entity than the plan counts

The candidate's block holds five exports (its external id, seeded names, grant, editor email, storage-state path), and the module exports the shared password as `ORGANIZATION_EDITING_PASSWORD`. The U-30 fallback still removes the block whole.

### 9. Smaller differences

- Organization A's `short_name` is seeded in two locales, as its name is.
- The teardown asserts that its literal `PREFIX` equals the data module's prefix before it deletes.
- Two comments of `tests/playwright.config.ts` beyond the diagram and the docblock were corrected, because the new link made them false: the anchor's sentence that every perm setup serves candidates alone, and the analytics setup's "the verified tail".
- `tests/README.md` gained two sentences the plan does not list: that one permutation dataset serves both types, and that the three new sessions are their spec's own.

**Not recorded in `.planning/WINDOWS.md`:** there is no stub, no skipped test and no verify left unrun; the ledger is a shared planning file, as plans 01 to 04 left it.

## What the next plans should know

**Sessions and identities** — all from `tests/tests/utils/permOrganizationEditingData.ts`:

| Entity | External id | Grant | Editor email | Storage state |
|---|---|---|---|---|
| organization A (confirmed) | `CONFIRMED_ORGANIZATION_EXTERNAL_ID` | `CONFIRMED_ORGANIZATION_GRANT` | `CONFIRMED_ORGANIZATION_EDITOR_EMAIL` | `CONFIRMED_ORGANIZATION_STORAGE_STATE` (`playwright/.auth/perm-organization-editing-confirmed.json`) |
| organization B (unconfirmed) | `UNCONFIRMED_ORGANIZATION_EXTERNAL_ID` | `UNCONFIRMED_ORGANIZATION_GRANT` | `UNCONFIRMED_ORGANIZATION_EDITOR_EMAIL` | `UNCONFIRMED_ORGANIZATION_STORAGE_STATE` (`…-unconfirmed.json`) |
| the candidate (unconfirmed) | `UNCONFIRMED_CANDIDATE_EXTERNAL_ID` | `UNCONFIRMED_CANDIDATE_GRANT` | `UNCONFIRMED_CANDIDATE_EDITOR_EMAIL` | `UNCONFIRMED_CANDIDATE_STORAGE_STATE` (`…-candidate.json`) |

Also: `ORGANIZATION_EDITING_PREFIX`, `ORGANIZATION_EDITING_PASSWORD`, `CONFIRMED_ORGANIZATION_NAME` (`en`, `fi`), `CONFIRMED_ORGANIZATION_SHORT_NAME` (`en`, `fi`), `UNCONFIRMED_ORGANIZATION_NAME` (`fi`), `UNCONFIRMED_CANDIDATE_NAME` (`firstName`, `lastName`), `OPINION_QUESTION_EXTERNAL_IDS` (three), `ORGANIZATION_INFO_QUESTION_EXTERNAL_ID`, `ORGANIZATION_LOCKED_INFO_QUESTION_EXTERNAL_ID`, `CANDIDATE_INFO_QUESTION_EXTERNAL_ID`. Each email is the entity's external id at `test.openvaa.local`.

**How a test reaches a session:** a nested `test.describe` with `test.use ({ storageState: <the constant> })`; the project itself carries no `storageState`, so a describe without one is the anonymous voter. Import `test` from `tests/tests/fixtures/contestant/perm-organization-editing.ts`.

**Fixture steps that exist:**

- `contestantEntityHomePage.open ()` — the app's root; a single-entity session is sent to its entity's home. `contestantEntityHomePage.expectLanded (grant)` — the home's status message, an entity-home URL, and the entity's type and id.
- `organizationDetail.openList ()` — an anonymous voter from the home page through all three questions (answered at the maximum) to the results, with the organizations' list shown. `openFromResults (name)` — the same, then the detail of the card matching `name`. `expectListed (name)` / `expectNotListed (name)` — on that list; they also hold while a detail is open over it. `expectName (name)` — the open detail's header; a string is the whole name.
- `new SupabaseAdminClient ().entityId (grant)` — the id the application's URLs and writes carry; `admin.update ('organizations', id, { confirmed: true })` is then the confirmation step, and it alone publishes B, because B's nomination is already confirmed.

**Facts measured on this dataset:**

- The voter's results show **no entity-tab list** while organizations are the only visible type: `resultsPage.selectEntityTab ('orgs')` would time out. Go through `organizationDetail`.
- An organization here has no member a voter can see, so its card has no subcard and **its link wraps the card**: `resultsPage.openEntityDetailsForCard` cannot open it. Click the title, as `organizationDetail.openFromResults` does.
- A voter who answers all three questions at the maximum sees organization A at **33 %** (`answersOnly`: one agreement, one disagreement, one missing answer).
- B's name has no `en` entry; `getLocalized` falls back to the first key that holds a string, so B's displayed name in an English page is its `fi` name.
- The seeded candidate **has a portrait**: the writer uploads one for every candidate.
- The three sign-ins and the seed take about 3.4 s; the home's status message renders today for an organization and for a candidate with no opinion question.
- A one-project run of `perm-organization-editing` is 152 tests and 4.5 min; the full run is 226 tests in 110 projects and 5.3 min. **The per-project baseline for later plans is `175-05-close`.**

**For any plan that edits a comment or the Playwright configuration:** `yarn assert:comment-hygiene` reads the files on disk, so run it on the working tree before the commit. A line of a comment diagram needs an arrow between two tokens to be read as a diagram.

**For plan 175-13:** three more comments of `permittedKeys.ts` still say "the 30 built-ins" beside figures measured then (1,481 rows; 11,125 key occurrences), as does one test title in `assertKnownRowProps.builtins.test.ts` ("at least the 30"); the registry holds 32. `resultsPage.openEntityDetailsForCard` does not open a card without subcards, and three callers now work around it — a todo. The gate set's `db-reset` emptied the local database; see below.

## The state the local database is left in

- Schema: the tree's, applied by the gate set's `db-reset` at about 13:58Z. `yarn db:types` ran on the freshly reset database with no drift; pgTAP has run since, so its helper functions are in `public` until the next reset.
- Data: `seed.sql`, plus the **`default` dataset in the default project** — 328 candidates, 8 organizations, 26 questions, 377 nominations — which the dev-seed integration test writes during the gate set's `unit` row. The dataset was not re-seeded by `yarn db:seed:default`.
- The E2E project `…00e2` exists and is empty: every teardown of the full run passed. An empty project row `…05c1` exists, created by `storage-cleanup.spec.ts`. Both projects are open for voters.
- Auth users: the two of `seed.sql`. No user of this dataset is left, and no storage-state file of it.
- The Supabase stack is up and was never restarted; Docker was never restarted; `docker builder prune -af` ran once, inside the E2E driver. The Docker VM had 14.68 GiB free before the full run.

## Not done, or not verified

- **Task 1's verify does not exit 0 as written** (deviation 1).
- **`GEN-01` is not completed by this plan**: it supplies the harness the page plans assert through. `requirements-completed` is empty on purpose.
- **The U-30 fallback was not exercised**; the candidate's parts are one block in the template, the data module, the setup, the teardown and the spec, each marked by a comment.
- **No isolated determinism batch** of the new spec was made; D-22's three isolated runs are plan 175-13's. The four pre-commit runs each ran the new project once: one red on a fixture defect, three green.
- **The host ran on battery throughout**: 47 % at the first pre-commit run, 20 % after the full run, with about half an hour left. No run was affected and no Sleep entry falls in any run window, but a further full run on this charge may not finish.
- `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` were not touched; `CAND-APP-PLAN.md` stays untracked; nothing under `tests/e2e-runs/` was deleted.

## Files touched that the plan did not list

- `packages/dev-seed/tests/templates/built-in-templates-contestant-app.test.ts` (deviation 2)
- `packages/dev-seed/src/template/permittedKeys.ts`, `packages/dev-seed/README.md` (deviation 3)
- `tests/tests/utils/supabaseAdminClient.ts` (deviation 4)

Listed by the plan and not changed: `packages/dev-seed/src/cli/help.ts` (deviation 1). Two scratch files were created and removed without being staged: a counting script in `packages/dev-seed/` and a scratch template outside the repository.

Gitignored evidence: `tests/e2e-runs/175-e2e/175-05-precommit`, `-r2`, `-r3`, `-r4` and `175-05-close`, each with its `.log`, `.exit` and verdict files beside it; `tests/e2e-runs/175-gates/175-05-close`; `tests/e2e-runs/175-unit/175-05-*`.

## Known Stubs

None.

## Threat Flags

None. The plan's register covers what was added: a dataset, three local test users and their teardown.

## Self-Check: PASSED

- The eight created files and the nine modified files exist; `packages/dev-seed/src/cli/help.ts` is unchanged against `8c9b0e668`.
- `29d8444c6`, `ca8902594`, `44457c96e`, `aee581473` and `c5ced389c` are ancestors of `HEAD`; `git rev-list --count 8c9b0e668..c5ced389c` is 5.
- `tests/e2e-runs/175-gates/175-05-close/done` holds 0; the `.exit` markers of `175-05-precommit-r2`, `-r3`, `-r4` and `175-05-close` hold 0 and that of `175-05-precommit` holds 1; `175-05-t1-verify.exit` holds 1, and `175-05-t1-verify-own.exit`, `175-05-t2-verify-r2.exit` and `175-05-t3-verify.exit` hold 0.
