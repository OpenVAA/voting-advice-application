---
phase: 173-multi-entity-grants-entity-selection
plan: 11
subsystem: testing
tags: [dev-seed, e2e, playwright, contestant-app, entity-selection, app-settings, visual-regression, fixtures]

requires:
  - phase: 173-10
    provides: the root's three outcomes, screen H and the "nothing to edit" view, on a tree that is green at 180 of 180 E2E
  - phase: 171
    provides: "the `contestantApp` settings root stored whole, `getContestantAppNameKey`, the three names under `dynamic.contestantAppName`"
  - phase: 172
    provides: "`confirmed` as the single visibility lever, and the two unconfirmed control candidates of `e2e/base`"
provides:
  - "`e2e/base` serving both entity types: `contestantApp.entityTypes: ['candidate', 'organization']` with `registrationModes: { candidate: ['email', 'code'], organization: [] }`"
  - "three unconfirmed rows no identity edits: candidates `test-e2e-base-ca-sel-a` and `test-e2e-base-ca-sel-b`, organization `test-e2e-base-or-sel`, each with one nomination in EL-Reg / CO-Reg-N"
  - the journey's login-heading assertion reading the name of a two-type project from the catalogue
  - dev-seed pins of the widened root, of the three rows and of the dataset totals as earlier total plus delta
  - the measured verdict on the opt-in visual baselines under the widened dataset (no difference)
  - the stage-5 seed-side close on one tree (twelve gate rows, 180 of 180 E2E, every project at its baseline total)
affects: [173-12, 173-13, 174, 175, 177]

actuals:
  tokens: 7173 # chars/4 over the realized diff outside .planning/ (28693 chars, 7 files)
  tasks: 3
  commits: 3
plan_head_before: 446dd4bd913323daa22a607b36a50b90b1dd46b1
plan_head_after: a65edb3040fb11bc29158016f4f04def6863add2

tech-stack:
  added: []
  patterns:
    - "a row a write-heavy spec may edit is seeded unconfirmed: the entity policies hide the entity and `nomination_entities_confirmed` hides its nomination, so no voter query reads the write"
    - "a dataset total in a test is written as earlier total plus delta, in the assertion and in its description"
    - "a per-template settings test names its dataset families in one table, so a family that differs on purpose is a row and not a branch"

key-files:
  created: []
  modified:
    - packages/dev-seed/src/templates/e2e/base.ts
    - packages/dev-seed/tests/templates/base.test.ts
    - packages/dev-seed/tests/templates/base-app-settings.test.ts
    - packages/dev-seed/tests/templates/built-in-templates-contestant-app.test.ts
    - tests/tests/specs/contestant/contestant-journey.spec.ts
    - tests/tests/specs/voter/voter-journey.spec.ts
    - tests/README.md
    - .planning/phases/173-multi-entity-grants-entity-selection/173-NAME-MAP.md

key-decisions:
  - "The three selection rows are nominated in CO-Reg-N of the regional election, where the stored session's candidate and the journey's candidate are, so the selection spec reads the same election and question scope as the existing contestant specs."
  - "The two candidates carry CA-AA-1's answers exactly and differ on QU-Opin-Base-1 alone ('3' against '5'), so one seeded value tells a spec whose data a page shows."
  - "Names avoid every string the dataset already renders: `Switch-A Entity One`, `Switch-B Entity Two`, `[or-sel] Party Sel` / `SEL`."
  - "`MINIMAL_BASE_APP_SETTINGS` and the 29 templates over it stay candidates-only; both dev-seed settings tests say the two families differ on purpose."
  - "No visual baseline was regenerated: all four compared equal."

patterns-established:
  - "Count template rows from the `fixed` arrays, never by searching the file for an id prefix (a nomination's parent ref matches the same search)."

requirements-completed: []

coverage:
  - id: D1
    description: "The base dataset's settings state the whole `contestantApp` root with both served entity types and no registration mode for organizations"
    requirement: ENT-01
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/templates/base-app-settings.test.ts#contestantApp block states the whole root: the question settings, both served entity types and both registration rows"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/templates/built-in-templates-contestant-app.test.ts#BUILT_IN_TEMPLATES[e2e/base] — the contestantApp root"
        status: pass
    human_judgment: false
  - id: D2
    description: "The perm family's minimal settings stay candidates-only, and the difference from the base is pinned as deliberate"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/templates/built-in-templates-contestant-app.test.ts#the minimal perm settings serve candidates only while the E2E base serves both types, on purpose"
        status: pass
    human_judgment: false
  - id: D3
    description: "Three unconfirmed rows for the selection spec, each with exactly one nomination, the two candidates differing on one opinion question"
    requirement: ENT-01
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/templates/base.test.ts#baseTemplate — the three entity-selection rows"
        status: pass
    human_judgment: false
  - id: D4
    description: "The app names itself 'Candidate and party app' under the base dataset and the login screen's registration entries are unchanged"
    verification:
      - kind: e2e
        ref: "tests/tests/specs/contestant/contestant-journey.spec.ts#full candidate journey end-to-end (step 7), run 173-11-base"
        status: pass
    human_judgment: false
  - id: D5
    description: "Voters see exactly the entities they saw before: every voter project green at its baseline total with no voter assertion edited"
    verification:
      - kind: e2e
        ref: "node .planning/phases/173-multi-entity-grants-entity-selection/173-verdict.mjs e2e 173-11-base --same-projects-as 173-01-baseline"
        status: pass
    human_judgment: false
  - id: D6
    description: "The opt-in visual baselines agree with the widened dataset"
    verification:
      - kind: automated_ui
        ref: "tests/e2e-runs/173-visual/173-11-observe (status 0, observed_unexpected=0)"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-10-06
status: complete
---

# Phase 173 Plan 11: The Seed Side of Stage 5 Summary

**The suite's base dataset now serves candidates and organizations (so the app calls itself "Candidate and party app" there), holds three unconfirmed rows that only the selection spec will edit, and carries the whole existing suite unchanged: twelve gate rows at 0, 180 of 180 E2E with every project at its baseline total, and no visual difference.**

`requirements-completed` is empty on purpose: the plan's requirements are ENT-01 and GEN-02, this plan lays the dataset the selection spec needs, and the orchestrator owns `REQUIREMENTS.md`. Nothing here is the proof of either requirement; 173-12's spec is.

## Performance

- **Duration:** 25 min
- **Started:** 2026-10-06T17:50:20Z
- **Completed:** 2026-10-06T18:15:00Z
- **Tasks:** 3
- **Files modified:** 7 outside `.planning/`

## Accomplishments

- `BASE_APP_SETTINGS.contestantApp` states the whole root with `entityTypes: ['candidate', 'organization']`; `registrationModes` and the question settings are as they were.
- Two candidates and one organization, each `confirmed: false` with one nomination, wait in `e2e/base` for the selection spec. No spec names them yet and no identity edits them.
- The one spec that pinned the app's name under the base dataset follows the dataset; the one that writes its own settings is untouched.
- The dev-seed tests pin the widened root, the three rows and the totals as earlier total plus delta.
- The four opt-in visual baselines were compared once against the widened dataset: no difference, nothing regenerated.

## Task Commits

1. **Task 1: Three dedicated, unconfirmed rows for the selection spec** — `bea1e9f10` (feat)
2. **Task 2: The base dataset serves both entity types; the app's name is re-baselined; the visual baselines are checked** — `8d223fb7c` (feat). The visual check wrote nothing to the tree, so it has no commit of its own.
3. **Task 3: The gate set and the full E2E suite** — `a65edb304` (docs: the name map)

## The three rows

All in `packages/dev-seed/src/templates/e2e/base.ts`.

| External id | Type | Names | Carries | Nomination |
|---|---|---|---|---|
| `test-e2e-base-ca-sel-a` | candidate | first name `Switch-A`, last name `Entity One` (displayed "Switch-A Entity One"), `sort_order` 15, no organization | `withInfoAnswers(GENERIC)`: exactly the answers of `test-e2e-base-ca-aa-1`, every info question and all 14 opinion questions | `test-e2e-base-nom-reg-n-ca-sel-a`: EL-Reg, CO-Reg-N, round 1, election symbol `31`, no parent |
| `test-e2e-base-ca-sel-b` | candidate | first name `Switch-B`, last name `Entity Two` (displayed "Switch-B Entity Two"), `sort_order` 16, no organization | the same, except the one question below | `test-e2e-base-nom-reg-n-ca-sel-b`: EL-Reg, CO-Reg-N, round 1, election symbol `32`, no parent |
| `test-e2e-base-or-sel` | organization | name `[or-sel] Party Sel`, short name `SEL`, colour `#6b3fa0` / `#b79ad9`, `sort_order` 5 | no answers, as every base organization | `test-e2e-base-nom-reg-n-or-sel`: EL-Reg, CO-Reg-N, round 1, no parent, no child nomination |

- Each is `confirmed: false`, and none has an editor grant in the dataset.
- The question on which the two candidates differ is `test-e2e-base-qu-opin-base-1-likert5`: A answers `'3'` ("Neutral"), B answers `'5'` ("Fully agree"). Every other answer is equal.
- A sorts before B by first name, by last name and by displayed name.

**Why no voter sees them.** `anon_select_candidates` and `anon_select_organizations` require `confirmed` on the entity. `anon_select_nominations` requires `private.nomination_entities_confirmed(id)`, which is false when the nominated entity is unconfirmed, and the `authenticated` policies assemble the same conjuncts for a caller without authority over the row. An unconfirmed entity therefore hides its nomination too.

## Totals that moved, each as earlier total plus delta

| Total | Before | Delta | Now |
|---|---|---|---|
| organizations in the dataset | 5 | + 1 | 6 |
| candidates in the dataset | 30 | + 2 | 32 |
| nominations in the dataset | 61 | + 3 | 64 |
| candidate nominations in CO-Reg-N | 15 | + 2 | 17 |
| of those, unconfirmed candidates | 2 | + 2 | 4 |
| candidate cards a voter sees in CO-Reg-N | 13 | 0 | 13 |
| organization nominations in CO-Reg-N | 5 | + 1 | 6 |
| organization cards a voter sees in CO-Reg-N | 5 | 0 | 5 |
| CO-Reg-N candidates without a parent nomination | 1 | + 2 | 3 |
| of those, visible to voters | 1 | 0 | 1 |
| Party AA members, nominal / visible | 7 / 5 | 0 | 7 / 5 |
| dev-seed unit tests (67 files) | 996 | + 19 | 1015 |

The first three are pinned in `base.test.ts`; the CO-Reg-N rows were derived from the template by a script and agree with the two comments corrected in the voter journey. Before this plan `base.test.ts` pinned the organization total alone; the candidate and nomination totals are new pins.

## Name pins

Population command: `git grep -n -i -E "Candidate app|Party app|Candidate and party app|contestantAppName" -- tests packages/dev-seed/tests`, two lines.

| Hit | Disposition |
|---|---|
| `tests/tests/specs/contestant/contestant-journey.spec.ts` | **Changed.** The constant is `BASE_DATASET_APP_NAME`, read from `dynamic.contestantAppName.candidateAndOrganization`, used once (step 7: the login heading on a freshly loaded document). The two registration-entry assertions beside it are unedited and pass. |
| `tests/tests/specs/perm/perm-closed-project.spec.ts` | **Left.** It writes its own settings and reads all three names. |

Also searched and found empty: literals of the five sentences parameterised on the name (`contestantApp.help.ingress`, `contestantApp.notSupported.title` / `.content`, `dynamic.contestantAppNotAccessible.title` / `.content`) in `tests/`, and any regular expression in `tests/` that matches the old name.

`MINIMAL_BASE_APP_SETTINGS` stays candidates-only, with the 29 built-in templates over it (`perm-*` and `show-feedback-survey`). `git diff --stat 446dd4bd9..8d223fb7c -- packages/dev-seed/src/templates/e2e/perm` prints nothing.

## The visual verdict

**No difference. No baseline regenerated.** Run directory `tests/e2e-runs/173-visual/173-11-observe`: `status` 0, `observed_expected=8`, `observed_unexpected=0`, `observed_flaky=0`, `observed_skipped=0`, one preflight success and no preflight failure, no update flag. The eight are the four screenshot tests, the base setup, the two auth-setup tests and the base teardown. Window 21:01:26 to 21:02:46 local; no Sleep entry in it.

`git status --porcelain tests/tests/specs/visual/__screenshots__/` prints nothing. The tree holds four baselines, not the two the plans speak of: `voter-results-desktop`, `voter-results-mobile`, `contestant-preview-desktop`, `contestant-preview-mobile`. Assumption A13 holds for all four and its row in the name map is amended.

Host recipe, as phase 170 recorded it: `yarn build` (exit 0); `yarn db:reset` (exit 0); storage answering 200; `yarn db:seed --template e2e/base` (exit 0); `yarn dev:clean` (exit 0); `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-0000000000e2 yarn workspace @openvaa/frontend dev --host 0.0.0.0` in its own process group on 5173, publishing that project id on its HTML root; the container script; the server stopped by its process group and the port confirmed free.

## Gates

| Instrument | Label / command | Exit | Result |
|---|---|---|---|
| Gate set | `173-gates.sh 173-11-base` → `tests/e2e-runs/173-gates/173-11-base` | 0 | twelve rows, every status 0; window 21:03:13 to 21:06:37 local; `sleep_entries_in_window: 0` |
| Gate verdict | `173-verdict.mjs gates 173-11-base` | 0 | 12 expected, 12 recorded; head `8d223fb7c` tree-equal to HEAD outside `.planning/` |
| E2E | `173-e2e.sh 173-11-base` → `tests/e2e-runs/173-e2e/173-11-base` | 0 | total 180, passed 180, failed 0, flaky 0, skipped 0, didNotRun 0; 100 projects; window 21:06:44 to 21:12:25 local; `sleep_entries_in_window: 0` |
| E2E verdict | `173-verdict.mjs e2e 173-11-base --same-projects-as 173-01-baseline` | 0 | 100 projects compared, 0 not as expected |
| E2E verdict | `173-verdict.mjs e2e 173-11-base --min-total-of 173-01-baseline` | 0 | — |
| Visual | `visual-container.sh --run-dir tests/e2e-runs/173-visual/173-11-observe` | 0 | 8 expected, 0 unexpected |
| Re-seed | `yarn db:seed:default` | 0 | 752 rows |

Both closing instruments ran once, on one tree, on battery power under `caffeinate -dimsu`. `pmset -g log`, read after the E2E run, holds no Sleep, Wake or DarkWake entry after 20:33:53 local, which is before this plan's first run. No run was void and no run was made twice.

Per-commit checks, each with its own exit status read directly: `yarn workspace @openvaa/dev-seed test:unit` 0 (1012 tests after Task 1, 1015 after Task 2), `yarn typecheck:tests` 0, `yarn workspace @openvaa/dev-seed typecheck` 0, `yarn lint:check` 0 before each of the two source commits (the comment-hygiene guard and the app-name gate among its links, both 0 findings).

Gate-row counts: pgTAP 38 files and 1447 tests; frontend unit tests 2546 passed and 7 skipped; dev-seed 1015.

The run's dev-server log holds none of `effect_update_depth_exceeded`, `Cannot set an answer`, `Cannot reload entity data`, `hydration_mismatch`, `loginFailed`, `candidateNoNomination`, `Missing parameter`, `ERR_TOO_MANY_REDIRECTS`, `is not filled`, `Error providing the user` or `Error resolving the user`. It holds `Error formatting nomination` three times, as the logs of `173-07-split`, `173-08-move-r2` and `173-10-screens` do; that is filed in `deferred-items.md` by 173-10.

## Acceptance criteria as observed

| Criterion | Observed |
|---|---|
| Each id is an entity and in one nomination in `base.ts` | yes: each id appears on its entity row and in one nomination's ref |
| `base.test.ts` asserts the three rows are unconfirmed and passes | yes |
| `git grep -n -e "test-e2e-base-ca-sel" -e "test-e2e-base-or-sel" -- tests/tests` prints nothing | exit 1, no output |
| The voter journey's patch changes comment lines only | two comment lines, nothing else |
| `entityTypes` both types, `registrationModes` as stated | yes (the plan's `node -e` check exits 0) |
| No change under `e2e/perm` | empty diff |
| One test asserts the base serves both, one asserts the minimal settings serve candidates only | yes, in both settings test files |
| The visual run directory exists, verdict recorded | yes, above |
| Twelve gate rows at 0 | yes |
| E2E failed, flaky, didNotRun all 0; totals equal the baseline's | yes |

## Deviations from Plan

### Auto-fixed Issues

None: no defect was found and no fix commit was made.

### Departures and readings, none of which changed an assertion

**1. Two totals were pinned that had no pin before.** The plan says to move each total the plan changed. `base.test.ts` pinned only the organization total; the candidate total (30 + 2) and the nomination total (61 + 3) were added so the must-have "each total stated as the earlier total plus what this plan added" has something to hold.

**2. The voter journey has two corrected comments, not one.** Beside the CO-Reg-N nomination count (15 and 2 became 17 and 4), the "No answer" filter comment said one candidate has no parent nomination; three do now, one of them visible. It reads "1 candidate voters see has no parent_nomination".

**3. `tests/README.md` gained one sentence on the perm family** (it serves candidates only, on purpose), beside the two bullets the plan asks for. The file is in the plan's list.

**4. There was no comment above `contestantApp` to rewrite;** one was written. The file's header docblock, which lists the dataset's ids by type, and the comment above the candidates fragment, which names the unconfirmed candidates, were brought up to date in Task 1.

**5. The nominations carry election symbols `31` and `32`,** the next free ones, as every other candidate nomination but CA-AA-Special's does. The plan does not mention symbols.

**6. The visual recipe resets the database,** so the database was reset twice in this plan (the recipe, then the gate set's `types-regen` row), and `e2e/base` was seeded once into the default project by the recipe before the gate set removed it. The `default` dataset is back.

**7. A count I first wrote was wrong and the test caught it.** Counting nominations by searching for the id prefix gave 107; the `fixed` array holds 61. The assertion was corrected to the measured 61 + 3 before the commit; no committed tree held the wrong number.

**8. Commits are on `feat/entity-signup-multi-grant`,** as the orchestrator's standing notes direct, not on an `agent-*` branch.

## Known Stubs

None.

## Threat model

| Threat | Disposition | As built |
|---|---|---|
| T-173-44 (a spec's writes changing what a parallel voter spec asserts) | mitigate | the three rows are unconfirmed, which hides the entities and their nominations from every voter query; every voter project is green at its baseline total with no voter assertion edited; PROH-173-17 holds: no voter-visible row was added, removed or changed, and no existing base entity was given an editor |
| T-173-45 (a name pin silently loosened) | mitigate | the one pin changed reads the exact catalogue name for a two-type project; the spec with its own settings is untouched; the registration-entry assertions are unedited |
| T-173-SC | accept | no package was installed |

No new security-relevant surface: the plan changes seed data, tests and one README.

## What 173-12 and 173-13 must know

- **The ids:** `test-e2e-base-ca-sel-a`, `test-e2e-base-ca-sel-b`, `test-e2e-base-or-sel`. Names, answers and nominations are in the table above and in `## After 173-11` of the name map.
- **Telling the two candidates apart on a page:** by name, and by `test-e2e-base-qu-opin-base-1-likert5` ('3' for A, '5' for B). To prove a save lands on the selected one, write to a question on which they are equal and read both.
- **They are free, and nothing frees them for you.** No identity holds a grant on them. Whether `data-teardown-base` also removes a grant naming one of them was not measured; clear the spec's own user and grants in its setup, as `auth.setup.ts` does for CA-AA-1.
- **`test-e2e-base-ca-aa-hidden` and CA-AA-1 are not to be reused:** each holds one editor for a whole run.
- **On the base dataset an organization is served.** By the root load's rule a user whose only grant is on `test-e2e-base-or-sel` goes to that organization's home; under a perm project the same user gets "nothing to edit". Neither was shown in a browser here.
- **The organization has no answers,** and its profile, questions and preview are Phase 175's.
- **Do not count template rows by searching for an id prefix** (name-map item 69).
- **The visual project has four baselines** and needs the host recipe with a database reset; run it before the gate set if 173-13 runs it again.
- **Still open, not this plan's:** the terms-of-use view overflows at 390px and leaves focus on `<body>` after the gate (name-map item 64).

## Self-Check: PASSED

- `packages/dev-seed/src/templates/e2e/base.ts`, `packages/dev-seed/tests/templates/base.test.ts`, `packages/dev-seed/tests/templates/base-app-settings.test.ts`, `packages/dev-seed/tests/templates/built-in-templates-contestant-app.test.ts`, `tests/tests/specs/contestant/contestant-journey.spec.ts`, `tests/tests/specs/voter/voter-journey.spec.ts`, `tests/README.md`, `173-NAME-MAP.md`: present and changed in `446dd4bd9..a65edb304`.
- Commits `bea1e9f10`, `8d223fb7c`, `a65edb304`: ancestors of HEAD.
- Run directories `tests/e2e-runs/173-gates/173-11-base`, `tests/e2e-runs/173-e2e/173-11-base`, `tests/e2e-runs/173-visual/173-11-observe`: present.
