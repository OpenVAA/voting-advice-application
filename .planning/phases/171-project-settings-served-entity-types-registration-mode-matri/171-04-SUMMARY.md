---
phase: 171-project-settings-served-entity-types-registration-mode-matri
plan: 04
subsystem: testing
tags: [dev-seed, e2e, playwright, axe, docs, registration-modes, entity-types, contestant-app, bank-auth, closing-gate, tdd]

requires:
  - phase: 171-project-settings-served-entity-types-registration-mode-matri
    provides: "Plan 01: the two settings in the type, the defaults and the strict stored schema, the accessors, the deep merge, and the bank-auth override stating the candidate row"
  - phase: 171-project-settings-served-entity-types-registration-mode-matri
    provides: "Plan 02: `contestant_app_public_config` and the provider's closed-project branch that carries the two settings to an anonymous visitor"
  - phase: 171-project-settings-served-entity-types-registration-mode-matri
    provides: "Plan 03: the three shown names, the gated login entries, the registration-code guard, and the base E2E dataset's declaration"
  - phase: 170-contestant-app-rename-symbols-routes
    provides: "The gate, E2E and bank-auth drivers this phase's drivers are modelled on, and the allowlist probe"
provides:
  - "Every built-in dev-seed template stating the whole `contestantApp` root, pinned by a unit test that parses each one through `StoredSettingsSchema`"
  - "`yarn db:reset-with-data` yielding a default project that declares both entity types and every registration mode for both, read back from the stored row by a gate"
  - "Six E2E tests on the terminal closed-project node: the login screen for three matrices, the three names, both route guards, the unserved row and the invitation landing, with four axe scans of the login states"
  - "The open-project branch asserted on the base dataset in the contestant journey"
  - "Four docs pages describing the two settings, the three overridable name keys and the identity-provider environment requirement; no page names the removed switch"
  - "`171-e2e.sh`, `171-gates.sh` and `171-bankauth.sh`, and the phase's closing evidence on one tree"
  - "Two pending todos: the voter loaders' two-layer merge, and the Publishers' Guide's term for the app"
affects: [172, 173, 175, 177, 178, 179]

actuals:
  tokens: 37416
  tasks: 4
  commits: 8
plan_head_before: 3105668a08ab5bc828f312db8b0d1ce4286b6db7
plan_head_after: 72d99fb876fd4016f33b6626c6bce3ad2bd3848b

tech-stack:
  added: []
  patterns:
    - "A settings root every dataset must declare is stated whole in `MINIMAL_BASE_APP_SETTINGS`, `BASE_APP_SETTINGS` and the `default` template, and one unit test over `BUILT_IN_TEMPLATES` pins its exact members and parses it through the stored-settings schema"
    - "An in-spec settings write states the whole of what the test means (both matrix rows, whole lists) and writes nothing back; the next setup replaces the row"
    - "Assertions that need a closed project live only on the terminal node; the same settings on an open project are asserted on the base dataset"
    - "A generated-types drift gate runs on the freshly reset database, before pgTAP"
    - "The two opt-in bank-auth projects each run alone under their own Edge Function environment"

key-files:
  created:
    - packages/dev-seed/tests/templates/built-in-templates-contestant-app.test.ts
    - .planning/phases/171-project-settings-served-entity-types-registration-mode-matri/171-e2e.sh
    - .planning/phases/171-project-settings-served-entity-types-registration-mode-matri/171-gates.sh
    - .planning/phases/171-project-settings-served-entity-types-registration-mode-matri/171-bankauth.sh
    - .planning/phases/171-project-settings-served-entity-types-registration-mode-matri/evidence/171-04-task1-red.json
    - .planning/todos/pending/2026-10-05-voter-loaders-merge-static-settings-only.md
    - .planning/todos/pending/2026-10-05-publishers-guide-contestant-app-naming.md
  modified:
    - packages/dev-seed/src/templates/default.ts
    - packages/dev-seed/src/templates/e2e/perm/shared.ts
    - apps/docs/src/routes/(content)/developers-guide/configuration/app-settings/+page.md
    - apps/docs/src/routes/(content)/publishers-guide/app-settings/+page.md
    - apps/docs/src/routes/(content)/developers-guide/contestant-app/bank-authentication/+page.md
    - apps/docs/src/routes/(content)/developers-guide/contestant-app/pre-registration-and-invitation/+page.md
    - tests/tests/utils/testIds.ts
    - tests/tests/specs/perm/perm-closed-project.spec.ts
    - tests/tests/specs/contestant/contestant-journey.spec.ts
    - tests/README.md
    - .planning/phases/171-project-settings-served-entity-types-registration-mode-matri/171-VALIDATION.md
    - .planning/phases/171-project-settings-served-entity-types-registration-mode-matri/deferred-items.md

key-decisions:
  - "The closing E2E evidence is three wrapper runs on one tree, not one: the default suite, `bank-auth` and `bank-auth-journey`. The two opt-in projects need different Edge Function issuers, and a run with `PLAYWRIGHT_BANK_AUTH` set puts both in the graph, so neither can ride along with the default suite."
  - "The generated-types drift gate runs straight after the database reset and before pgTAP. The plan's order put it after pgTAP, whose first file commits its helper functions into `public`."
  - "The three journey assertions sit on the login page reached by the direct request that follows the mid-flow logout, not on the landing straight after the logout, which can carry the password-set message as its heading."
  - "`171-e2e.sh` and `171-gates.sh` refuse a working tree with uncommitted changes outside `.planning/`, so every gate row and every run describes a commit."
  - "The Publishers' Guide's settings page keeps that page's existing term for the app and quotes the three shown names; the rest of the guide is not swept and the question is filed for the operator."

patterns-established:
  - "Driver markers and logs live under `tests/e2e-runs/<family>/_drivers/`, so a glob over run directories never meets a marker file"
  - "`171-e2e.sh <label> --project <p> --require-project <p>`: a run is red unless the named project has a passed test and no failed, flaky or did-not-run test"

requirements-completed: [SET-01, SET-02, SET-03, NAME-03]

coverage:
  - id: D1
    description: "Every built-in template states the whole `contestantApp` root in canonical order, accepted by the stored-settings schema; the E2E datasets declare candidates only with email and code, the default template both types and every mode"
    requirement: SET-02
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/templates/built-in-templates-contestant-app.test.ts (95 cases over 31 templates)"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/templates/base-app-settings.test.ts#contestantApp block states the whole root"
        status: pass
    human_judgment: false
  - id: D2
    description: "A project seeded by `yarn db:reset-with-data` declares both settings: the default project's stored row is read back after the reset and the default seed"
    requirement: SET-01
    verification:
      - kind: integration
        ref: "171-gates.sh 171-04-closing-2, rows db-reset and seed-default (query prints `t`; the stored root is printed in 13-seed-default.log)"
        status: pass
    human_judgment: false
  - id: D3
    description: "`seed.sql` still writes `'{}'` for the default project"
    verification:
      - kind: other
        ref: "git diff 3105668a0..HEAD -- apps/supabase/supabase/seed.sql (empty)"
        status: pass
    human_judgment: false
  - id: D4
    description: "In a closed project an anonymous visitor's login screen follows the matrix: sign-in only for an empty matrix, the registration-code link for `code`, the pre-registration button beside a collapsed sign-in form for `identity_provider`"
    requirement: SET-03
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/171-e2e/171-04-closing — perm-closed-project.spec.ts: 'an empty matrix offers sign-in only…', 'the code mode shows the registration-code link…', 'the identity provider mode shows pre-registration beside a collapsed sign-in form'"
        status: pass
    human_judgment: false
  - id: D5
    description: "Re-seeding the served entity types alone changes the login heading between the three names, and a type named twice counts once"
    requirement: NAME-03
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/171-e2e/171-04-closing — perm-closed-project.spec.ts: 'the heading names the app after the served entity types, and a type named twice counts once'"
        status: pass
    human_judgment: false
  - id: D6
    description: "A direct URL to a registration route whose mode is off ends on the login page, a row for an unserved type opens nothing, and a signed-in user reaches the set-password page without a registration key under an empty matrix"
    requirement: SET-03
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/171-e2e/171-04-closing — perm-closed-project.spec.ts: the three direct requests of the empty-matrix test, the cross-refusals of the code and identity-provider tests, 'a registration row for an entity type the project does not serve opens nothing', 'a signed-in user reaches the set-password page…'"
        status: pass
    human_judgment: false
  - id: D7
    description: "In an open project the same settings are read through the readable row: the base dataset's login page shows the code link, no pre-registration button and the candidate name"
    requirement: SET-01
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/171-e2e/171-04-closing — contestant-journey.spec.ts step 7"
        status: pass
    human_judgment: false
  - id: D8
    description: "The four login-screen states pass the axe scan and the raw-key check"
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/171-e2e/171-04-closing — four `assertAxeScan` calls in perm-closed-project.spec.ts; all four `axe-violations-*.json` and `raw-i18n-keys-*.json` attachments are `[]` (read in 171-04-interim-2)"
        status: pass
    human_judgment: false
  - id: D9
    description: "The identity-provider cell switched on by the bank-auth setup works end to end, and the synthetic-token project is green on the changed setup"
    requirement: SET-03
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/171-e2e/171-04-closing-bank-auth-journey (131 of 131; project 1 of 1) and 171-04-closing-bank-auth (8 of 8; project 6 of 6)"
        status: pass
    human_judgment: false
  - id: D10
    description: "The closing gates are green on the final tree, each read by its own exit status"
    verification:
      - kind: other
        ref: "tests/e2e-runs/171-gates/171-04-closing-2/summary.tsv (13 rows, all 0; head 45505e155)"
        status: pass
    human_judgment: false
  - id: D11
    description: "The docs describe the two settings with their defaults, the three overridable name keys, the closed-project answer and the identity-provider environment requirement; no page names the removed switch"
    requirement: NAME-03
    verification:
      - kind: other
        ref: "git grep -F preRegistration -- apps/docs (nothing found); docs format:check, check and validate:links --check (0, 0, 0); the app-name gate (0 findings)"
        status: pass
    human_judgment: true
    rationale: "The gates prove that the keys are named and that nothing is broken. Whether the wording serves a publisher is a reading judgement no test makes."
  - id: D12
    description: "Two open items are on record: the voter loaders' two-layer merge, and the question of the Publishers' Guide's term for the app"
    verification:
      - kind: other
        ref: "test -s on both files under .planning/todos/pending/"
        status: pass
    human_judgment: true
    rationale: "The second todo is a question for the operator; filing it does not answer it."

duration: 40min
completed: 2026-10-05
status: complete
---

# Phase 171 Plan 04: Seeds, E2E Proof, Docs and the Closing Run Summary

**Every built-in dataset now declares the served entity types and the registration matrix, six tests on the closed-project node and three assertions on the base dataset observe the login screen, the app's name and both route guards against re-seeded settings with four clean axe scans, the docs describe the two settings in place of the removed switch, and the phase closes on one tree with thirteen gate rows at `0`, the default suite at 177 of 177 and both opt-in bank-auth projects green.**

## Performance

- **Duration:** 40 min
- **Started:** 2026-10-05T23:03:20Z
- **Completed:** 2026-10-05T23:43:13Z
- **Tasks:** 4 of 4
- **Files changed:** 19 (11 outside `.planning/`), before this summary
- **Start revision:** `3105668a08ab5bc828f312db8b0d1ce4286b6db7`
- **The tree every closing gate and run describes:** `45505e155a5e0ffb6a8d704476dcd80981041a2b`. The one commit after it, `72d99fb87`, touches `171-VALIDATION.md` only.

## Accomplishments

- Added the whole `contestantApp` root to `MINIMAL_BASE_APP_SETTINGS` and to the `default` template. With the base dataset declared in plan 03, all 31 built-in templates now state it, and a new unit test keeps it so.
- Rewrote the settings sections of the developers' and the publishers' pages and the two sentences of the contestant app pages that named the removed switch.
- Added six tests to the terminal closed-project node and three assertions to the contestant journey, registered four test ids, and described the terminal node in the tests README.
- Wrote the phase's three drivers and closed the phase with them.
- Filed two todos and two deferred items.

## The Closing Evidence

Every exit status was read from the command or from its marker file, never through a pipe. All of it describes one tree, `45505e155`.

| What | Command | Exit | Result |
|---|---|---|---|
| **Gate set** | `171-gates.sh 171-04-closing-2` | **0** | **13 rows, all `0`**; no turbo task cached |
| **E2E, default suite** | `171-e2e.sh 171-04-closing` | **0** | **177 total, 177 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run**; 100 projects; 4.6 min; one preflight success, no preflight failure |
| **E2E, `bank-auth`** | `171-bankauth.sh 171-04-closing` → `171-e2e.sh 171-04-closing-bank-auth --project bank-auth --require-project bank-auth` | **0** | **8 of 8**; the project itself 6 of 6; Edge issuer `https://test-idp.example.com` |
| **E2E, `bank-auth-journey`** | same driver → `171-e2e.sh 171-04-closing-bank-auth-journey --project bank-auth-journey --require-project bank-auth-journey` | **0** | **131 of 131**; the project itself 1 of 1; Edge issuer `https://127.0.0.1:9443` |
| Bank-auth driver | `171-bankauth.sh 171-04-closing` | 0 | both runs 0; `restore: OK` |
| Allowlist probe, after the restore | `170-allowlist-probe.sh after` | 0 | ten rows OK |
| Allowlist probe, after the last run | same | 0 | ten rows OK |

**The order at the close:** the gate set, then the two bank-auth runs with the stack restore, then the default suite last, so the full suite ran on the restored stack and its directory is the newest one under the closing label.

### The thirteen gate rows of `171-04-closing-2`

| Row | Command | Exit | Seconds | Result |
|---|---|---|---|---|
| build | `yarn build` | 0 | 15 | 14 tasks, 0 cached; the frontend and the docs production builds among them |
| typecheck | `yarn typecheck`, then `yarn typecheck:tests` | 0 | 18 | both 0 |
| lint | `yarn lint:check` | 0 | 42 | every link, through the Edge Function required-env guard |
| format | `yarn format:check` | 0 | 16 | |
| check-frontend | `yarn workspace @openvaa/frontend check` | 0 | 8 | 2650 files, 0 errors, 0 warnings |
| check-docs | `yarn workspace @openvaa/docs check` | 0 | 3 | 696 files, 0 errors, 0 warnings |
| docs-links | `yarn workspace @openvaa/docs validate:links --check` | 0 | 1 | 0 findings |
| unit | `yarn test:unit` | 0 | 31 | 25 tasks, 0 cached; frontend 2140 in 135 files, dev-seed 997 in 67, data 244, supabase 206, app-shared 141 in 10, llm 49, matching 43, argument-condensation 31, filters 22, question-info 22, core 8 |
| db-reset | `yarn db:reset` | 0 | 29 | |
| db-types-drift | `yarn db:types`, then the generated file against the index | 0 | 2 | unchanged |
| pgtap | `yarn workspace @openvaa/supabase test:db` | 0 | 5 | 37 files, 1351 tests, `Result: PASS` |
| db-lint | `yarn db:lint:sql` | 0 | 3 | 0 errors, 3 warnings (the three foreign keys without an index that plan 02 recorded) |
| seed-default | `yarn db:seed:default`, then the read-back query | 0 | 7 | the query prints `t` |

The default project's stored root after rows `db-reset` and `seed-default`, which together are `yarn db:reset-with-data`:

```json
{"questions": {"hideHero": false, "hideVideo": false}, "entityTypes": ["candidate", "organization"], "registrationModes": {"candidate": ["identity_provider", "email", "code"], "organization": ["identity_provider", "email", "code"]}}
```

### Every run directory of this plan

| Directory | Head | Counts | Verdict |
|---|---|---|---|
| `tests/e2e-runs/171-gates/171-04-closing` | `71684c813` | 13 rows: 12 at `0`, `db-types-drift` at `1` | red; see *The Red Runs* |
| `tests/e2e-runs/171-gates/171-04-closing-2` | `45505e155` | 13 rows, all `0` | **green, the closing gate set** |
| `tests/e2e-runs/171-e2e/171-04-interim` | `9b65693d7` | 177 total: 82 passed, 1 failed, 94 did not run | red; see *The Red Runs* |
| `tests/e2e-runs/171-e2e/171-04-interim-2` | `0c0ef4baf` | 177 of 177 | green |
| `tests/e2e-runs/171-e2e/171-04-closing-bank-auth` | `45505e155` | 8 of 8 | **green** |
| `tests/e2e-runs/171-e2e/171-04-closing-bank-auth-journey` | `45505e155` | 131 of 131 | **green** |
| `tests/e2e-runs/171-e2e/171-04-closing` | `45505e155` | 177 of 177 | **green, the closing default-suite run** |

Driver logs, exit markers, the bank-auth driver's evidence and both allowlist probes are under `tests/e2e-runs/171-e2e/_drivers/` and `tests/e2e-runs/171-gates/_drivers/`. Nothing under `tests/e2e-runs/` was deleted. No run was repeated on an unchanged tree to see whether it passes.

### The expected total, derived

`playwright test --list` on the final tree counts 177 tests in 99 files for the default suite and 186 in 103 with `PLAYWRIGHT_BANK_AUTH` set. 177 is the 171 of plan 03's closing run plus the six tests this plan adds to `perm-closed-project.spec.ts`; the journey's three assertions add no test. The nine more with the opt-in variable are six in `bank-auth`, one in `bank-auth-journey` and its setup and teardown. A restricted run counts only the projects it pulls: 8 for `bank-auth` (six plus two setups), 131 for `bank-auth-journey` (the perm chain it hangs off). Both match Phase 170's numbers.

## How the Opt-In Bank-Auth Projects Were Run, and Why Not in One Run

**Three wrapper runs instead of one.** The plan asks for one run of the default suite with both opt-in projects, and allows a second run "if the two opt-in projects need different Edge Function environments on this host". They do, and the consequence is one step further than the plan's fallback:

- One served `identity-callback` has one `IDENTITY_PROVIDER_ISSUER`. The synthetic token of `bank-auth` is issued by `https://test-idp.example.com`; the journey's token is minted by the mock issuer as `https://127.0.0.1:9443`.
- `PLAYWRIGHT_BANK_AUTH` is one switch for both projects. A run of the default suite with it set has **both** in its graph under one Edge environment, so one of them is refused by the function. "The default suite with one of them" cannot be expressed with the wrapper's single `--project`.

So each opt-in project ran alone, `--project <name> --require-project <name>`, under its own Edge file, through `171-bankauth.sh`, which is Phase 170's proven driver pointed at this phase's runner. The default suite ran without the variable. The journey run pulls the whole perm chain, so 131 of the suite's tests ran a second time on the same tree. The terminal closed-project node is downstream of the journey and ran in the default-suite run only.

Nothing generated for these runs was written into the repository: the Edge files and the JWKS document live in a `mktemp` directory outside it and are removed on exit. The run directories keep one line each, the issuer.

## Task Commits

1. **Task 1: every dataset declares both settings** (TDD)
   - `50d35d5ce` `test(171-04): add a failing test that every built-in template states the whole contestant app root` — red: 61 of 205 cases of `tests/templates` fail.
   - `1312b735d` `feat(171-04): declare the served entity types and the registration modes in every built-in dataset`
2. **Task 2: the docs pages and the two todos**
   - `a86fa4d1e` `docs(171-04): describe the served entity types and the registration modes, and drop the removed pre-registration switch`
3. **Task 3: the E2E proof and the interim run**
   - `9b65693d7` `test[e2e](171-04): prove the registration matrix and the app's name on the closed-project node and the base dataset`
   - `0c0ef4baf` `test[e2e](171-04): assert the base dataset's login page on a freshly loaded document` — the fix after the red interim run.
4. **Task 4: the closing run**
   - `71684c813` `chore(171-04): add the closing gate runner and the bank-auth driver of the phase`
   - `45505e155` `fix(171-04): run the generated-types drift gate on the freshly reset database, before pgTAP` — the fix after the red gate row.
   - `72d99fb87` `docs(171-04): record the closing evidence and the per-task statuses in the validation map`

`git rev-list --count 3105668a0..72d99fb87` is 8.

## The Red Runs

### Task 1's red run (TDD, by design)

Record: `evidence/171-04-task1-red.json`, classified `RED_EVIDENCE_OK` by `gsd-tools check tdd-red-evidence`.

| Red run | Target | Why it failed |
|---|---|---|
| 61 of 205 cases of `tests/templates` fail, all in the new file | `BUILT_IN_TEMPLATES[default] — the contestantApp root > states exactly the question settings, the served entity types and the registration modes` | `expected '' to be 'entityTypes,questions,registrationModes'`: the default template declared no root |

For each of the 30 templates other than `e2e/base` the member-list case and the declared-values case failed, plus the `perm-hide-hero` case. **Green in the red run, by design:** the three cases of `e2e/base`, declared one plan earlier; the schema case of every other template, which parses an absent root as an empty object and so stated nothing yet; and the coverage case. **The base dataset's pin in `base-app-settings.test.ts` was already green**, as the handover said: it was added with the declaration in plan 03 and had its own red run there. No red was manufactured for it. The combined report was not given to the classifier, for the reason plans 01 to 03 recorded; the target was rerun alone.

### The interim E2E run `171-04-interim` (a defect in a new assertion)

- **Verdict:** wrapper exit 1; 177 total, 82 passed, **1 failed, 94 did not run**. The failure was `contestant-journey`, step 7; the perm chain depends on that project, so everything after it did not run.
- **The failure:** `expect(getByRole('heading', { level: 1 })).toHaveText("Candidate app")` received "Your password is now set! Please log in using it.", fourteen polls in a row. The two assertions before it (the code link visible, the pre-registration button hidden) passed.
- **Root cause, from the page snapshot and the source:** the set-password page stores the new user's email in the contestant context and sends the user to the login page, which shows the password-set message as its heading in place of the app's name and then clears the value. In the journey the session from the invitation is still valid, the user is forwarded into the app before the login page mounts, and the value is never consumed. The landing straight after the mid-flow logout is a client-side navigation in the same document, so that login page shows the password-set heading. The plan's assumption that this landing shows the name was wrong; the research had noted that the heading is the name "unless the 'password set' message replaces it".
- **Fix, at the source of the failure:** the three assertions moved four lines down, to the login page reached by the direct request the step already makes (`/en/contestant/profile` while signed out, which is a full page load). That page is exactly what the assertions are for: an anonymous visitor of an open project reading the settings through the readable row. Nothing was skipped, retried or loosened. Commit `0c0ef4baf`; the next run, `171-04-interim-2`, was 177 of 177.
- **Not fixed:** the stale heading itself. It predates the phase and no change of the phase touches it. Recorded in `deferred-items.md`.

### The gate set `171-04-closing` (a defect in the gate order)

- **Verdict:** 12 rows at `0`, `db-types-drift` at `1`.
- **Root cause, from the row's log and the diff:** `yarn db:types` describes the applied database. The plan's order ran it after pgTAP, and the suite's first file, `00-helpers.test.sql`, commits its helper functions into `public` ("Function definitions are COMMITted … The `supabase db reset` between test runs removes these functions"). The regenerated file gained 18 lines, every one a test helper: `create_test_data`, `reset_role`, `set_test_grants`, `set_test_retired_claim`, `set_test_user`, `test_grants_claim`, `test_id`, `test_rls_digest`, `test_seed_fixture_grants`, `test_seed_identity_grants`, `test_user_grants`, `test_user_id`. The tree's schema and types agree; plan 02 had run the same steps in the other order and seen a one-line diff.
- **Fix:** `171-gates.sh` runs the drift row straight after the reset and before pgTAP, and on a drift keeps the diff and puts the committed file back. Commit `45505e155`. The generated file was restored with `git checkout --` on that one path; it was never committed. The whole set was run again as `171-04-closing-2`: 13 rows, all `0`.

## What the E2E Tests Pin

`tests/tests/specs/perm/perm-closed-project.spec.ts`, a nested describe at the end of the file, serial. Each test starts with one `updateAppSettings` call that states `entityTypes` and both rows of the matrix; nothing is written back and no value is `null`.

| # | Settings written | Asserted |
|---|---|---|
| 1 | `['candidate']`, both rows empty | the email field visible; the collapsed-form button, the code link and the pre-registration button hidden; the heading reads the `candidate` name; axe scan; then the code-entry route, the pre-registration route and the set-password route with a key and an email each end on the login URL |
| 2 | the same, restated | the seeded candidate signs in, requests the set-password route with only an email, and sees the password setter on that URL |
| 3 | `candidate: ['code']` | the code link and the email field visible, the pre-registration button hidden; axe scan; the code-entry route shows its code input; the pre-registration route ends on the login URL |
| 4 | `candidate: ['identity_provider']` | the pre-registration button and the collapsed-form button visible, the email field and the code link hidden; axe scan; the button expands the form; axe scan again; the pre-registration route shows its start button; the code-entry route ends on the login URL |
| 5 | `['organization']`, then `['candidate', 'organization']`, then `['organization', 'candidate', 'candidate']` | the heading reads the `organization` name, then the `candidateAndOrganization` name twice |
| 6 | `['candidate']`, `candidate: []`, `organization: ['code']` | the code link hidden; the code-entry route ends on the login URL |

The three names are read from `apps/frontend/messages/en/dynamic.json`; routes are built with `buildRoute` from the route keys; every assertion is hard and goes through `testIds` or the level-1 heading by role.

**Axe: no violation in any of the four states.** All four `axe-violations-*.json` attachments and all four `raw-i18n-keys-*.json` attachments are empty lists. No component was changed.

**Old phrase:** `git grep -n -i -F "Election Compass for Candidates" -- tests/tests` finds nothing, and the four visual baselines are the preview and the results pages (desktop and mobile), none of which prints the name. Nothing was re-baselined.

## Decisions Made

Nothing in the plan's decisions was decided differently. The calls the plan does not make are the five under `key-decisions` and the deviations below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan's gate order made the generated-types row red on a correct tree**
- **Found during:** Task 4, the gate run `171-04-closing`.
- **Issue and fix:** as under *The Red Runs*. The thirteen rows are the plan's rows; rows 10 to 12 changed places: `db-types-drift`, `pgtap`, `db-lint`.
- **Files modified:** `171-gates.sh`.
- **Committed in:** `45505e155`.

**2. [Rule 1 - Bug] A new journey assertion read the heading on a landing that can carry another message**
- **Found during:** Task 3, the interim run `171-04-interim`.
- **Issue and fix:** as under *The Red Runs*.
- **Files modified:** `tests/tests/specs/contestant/contestant-journey.spec.ts`.
- **Committed in:** `0c0ef4baf`.

**3. [Rule 3 - Blocking] A test title tripped the app-name gate**
- **Found during:** Task 3, before its commit.
- **Issue:** the first test's title said that the page "names the candidate app". The phrase outside a whole quoted shown name is a finding. No exemption was added.
- **Fix:** the title says "names the app for candidates".
- **Committed in:** `9b65693d7`.

**4. [Rule 2 - Missing critical] A hydration guard on the one click the new tests make**
- **Found during:** Task 3.
- **Issue:** the collapsed-form button is server-rendered before its handler is bound, and it is a button inside the sign-in form, so a click in that gap is a native form submission, not an expansion.
- **Fix:** the click and its effect are retried together with `toPass`, the idiom the navigation fixtures use for the menu toggle. Each inner step is a hard assertion.
- **Committed in:** `9b65693d7`.

### Procedure the plan's wording did not fit

- **The closing E2E is three runs, not one or two.** As under *How the Opt-In Bank-Auth Projects Were Run*. The phase is closed on all three.
- **A third driver, `171-bankauth.sh`.** The plan names two runner scripts. The bank-auth runs need the Edge Function served with a generated environment and the stack restored afterwards; Phase 170's driver does that for Phase 170's runner and labels, so this phase has its own copy pointed at `171-e2e.sh`.
- **Task 1 does not edit `e2e/base.ts` or `base-app-settings.test.ts`.** Both were done in plan 03, as the handover said.
- **`tests/README.md` had no description of the terminal node to extend.** A paragraph was added that says what the node is and what its spec asserts, the new assertions among them. The project graph is unchanged.
- **Both runners refuse an uncommitted tree outside `.planning/`**, as Phase 170's do. So Task 3 was committed before its interim run, and each fix was committed before the next run.
- **Driver markers were moved once.** The first interim run's exit marker and driver log were written beside the run directory and then moved into `_drivers/`, because the plan's verify command globs `171-04-interim*` and would have met the marker file. Later runs wrote there from the start.

### Acceptance criteria that did not hold as written

- **"`git grep -n -F "assertAxeScan"` finds four call sites" (Task 3).** The grep finds seven lines: the import, two header comments and the four calls. `git grep -c -F "assertAxeScan("` is 4.
- **"The newest `171-04-closing*` run … shows passed tests for both opt-in bank-auth projects" (Task 4).** The newest directory under that glob is the default-suite run, which holds neither project. The plan's second verify command was run on each of the three directories instead: exit 0 three times.
- **`<verification>`: "`171-e2e.sh 171-04-closing` with `PLAYWRIGHT_BANK_AUTH=1` … both opt-in projects executed".** Not runnable as one command, for the reason above. Both projects executed, each in its own run.
- **The settings table of the developers' page** lists the matrix as two rows, `contestantApp.registrationModes.candidate` and `.organization`, each defaulting to `[]`, where the plan describes one row. The rules the plan puts in the table cells (repeats collapse, an unserved row is ignored) are in a subsection under the table, because the longer cells would have reflowed every row of the table.

Every other criterion holds as written.

---

**Total deviations:** 4 auto-fixed (2 bugs, 1 blocking, 1 missing critical), plus the notes above.
**Impact on plan:** none changes product behaviour. No file under `apps/frontend/src` or `apps/supabase` was touched by this plan.

## Prohibitions, Each Checked

| Prohibition | Evidence |
|---|---|
| PROH-171-12: no new Playwright project, setup or teardown; the project is closed only on the terminal node | `git diff 3105668a0..HEAD -- tests/playwright.config.ts tests/tests/setup` is empty; the six tests sit inside the existing spec's describe |
| PROH-171-13: no `null` restore, nothing written back | the spec contains no `null`; the new describe has no `afterAll`; the file's existing `afterAll` reopens the project and writes no setting |
| PROH-171-14: nothing skipped, retried until green or marked flaky; no axe exclusion | the spec has no `skip`, `fixme` or retry setting; `assertAxeScan` is called with no option that narrows it; the two red runs were each followed by a fix and a new label |
| PROH-171-15: `tests/e2e-runs/` never deleted, no status through a pipe | every directory of the phase is present; every status above was read from `$?` or from a marker file |

## Changes for the Operator's Eye

- **`yarn db:reset-with-data` now gives a local login screen with the pre-registration button and a collapsed sign-in form.** The `default` template declares `identity_provider` for candidates, as D-18 says. With a default `.env` the button is refused when the visitor starts identification. A plain `yarn db:reset` still leaves `'{}'`, the shipped defaults and sign-in only.
- **Every perm dataset now allows `email` and `code` for candidates**, so on every perm project the login page shows the registration-code link and the logged-out menu shows the registration item. No perm spec asserted their absence.
- **The docs name the two settings and no longer the removed switch.** The Publishers' Guide outside its settings page still says "candidate application" in several spellings; the question which term it should use is filed for you.
- **`yarn.lock` and every `package.json` are unchanged.** No package was installed.
- **`CAND-APP-PLAN.md` was not edited, moved, staged or committed.** `.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` are unchanged.
- **The stack was stopped and started once,** by the bank-auth driver's restore, with `yarn db:stop` and `yarn db:start` only. The database was reset twice, once by each gate run. The other Supabase stack on this host, `my-redis` and the Vite server on port 5199 were not touched.

## Todos Filed and Deferred Review

- `.planning/todos/pending/2026-10-05-voter-loaders-merge-static-settings-only.md` — the four voter loaders merge the stored row over the static settings only. Found in research, neither fixed nor worsened by the deep merge.
- `.planning/todos/pending/2026-10-05-publishers-guide-contestant-app-naming.md` — which term the Publishers' Guide uses for the app in general. Holds the population (25 lines on 12 pages) and three options. The guide was not swept.
- **Carried from plan 03, non-blocking:** `.planning/todos/pending/2026-10-05-native-speaker-review-contestant-app-names.md` — eighteen names and thirty sentences in six locales, constructed and not read by a native speaker.

## Deferred Issues

None fixed, all outside this plan; the first two are in `deferred-items.md`:

1. The login page can greet a user who has just logged out with the password-set message. Phase 178 rebuilds the screen.
2. `packages/dev-seed/tests/templates/nominations-override.test.ts` fails the import-sort rule, and the package's `lint` script covers `src/` only, so no gate sees it.
3. The database skill's link audit still exits 1 with the 31 citations plan 02 recorded.

The cross-phase defect ledger (`.planning/WINDOWS.md`) was not appended to: there is no stub, no skipped test and no verification of this plan that was not run.

## Issues Encountered

Two red runs, both diagnosed and fixed at their source, as above. One foreground poll exceeded the harness's two-minute default and was moved to the background by the harness; the run it watched was unaffected.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## What Later Phases Must Know

**All of them**

- **Baselines.** E2E default suite: `tests/e2e-runs/171-e2e/171-04-closing`, 177 of 177 on `45505e155`; 186 tests are listed with the opt-in variable. Unit: frontend 2140 in 135 files, dev-seed 997 in 67, app-shared 141 in 10. pgTAP: 37 files, 1351 tests.
- **The drivers are reusable as models:** `171-e2e.sh <label> [--project <p>] [--require-project <p>]...`, `171-gates.sh <label>`, `171-bankauth.sh <label-stem>`. In any gate set, **generate the types on the freshly reset database, before pgTAP.**
- **The two opt-in bank-auth projects cannot share a run** with each other or with the default suite. Run each alone under its own Edge issuer and restore the stack afterwards.
- **`built-in-templates-contestant-app.test.ts` pins the exact members of the `contestantApp` root** (`entityTypes`, `questions`, `registrationModes`) and the exact values per dataset. A phase that adds a member to that root, or widens a dataset, changes that test and `base-app-settings.test.ts` in the same commit.
- **A template's settings object is the whole stored row**, checked by exact equality at setup. A new setting a dataset should declare goes into the three places: `MINIMAL_BASE_APP_SETTINGS`, `BASE_APP_SETTINGS`, the `default` template.

**Phase 172**

- pgTAP file 37 is free, 38 is taken, the next free number above is 39. Both definer censuses name six functions (seven for `authenticated`).
- The last test of the closed-project node leaves the E2E project's stored matrix as `candidate: []`, `organization: ['code']` until the next setup replaces it. A manual look at that project between runs shows that, not the base dataset.

**Phase 173**

- The base dataset is candidates-only by decision; widening it to organizations is yours. When you do: the journey's step 7 asserts the heading as the `candidate` name and must then read `candidateAndOrganization`; the two dev-seed pins change; the closed-project tests write their own settings and are unaffected.
- The app-name gate still owes you the `get_candidate_user_data` exemption.

**Phase 175**

- The docs pages still address the reader's candidates as candidates, and the Publishers' Guide's term for the app is an open question for the operator. Texts that address the reader as a candidate are yours.
- For an anonymous visitor of a closed project `access.answersLocked` reads `false` whatever is stored. A setting of yours that such a visitor must see is one more member of `contestant_app_public_config`.

**Phase 178**

- **Six E2E tests and three journey assertions now hold the login screen.** They use the test ids `login-register-link`, `login-preregister`, `login-show` and `register-code`, registered as `testIds.contestant.login.registerLink`, `.preregister`, `.showLogin` and `testIds.contestant.register.code`. A rebuilt screen keeps the ids or moves the tests with it.
- **Four axe scans cover the login states** (sign-in only, code link, pre-registration collapsed, pre-registration expanded). They are the only scans of any contestant route outside `(protected)`; the rebuilt screen's states need the same.
- **Both guards are observed by URL:** the code-entry page and the pre-registration entry page keep `ssr = false`, so their refusal arrives through the client's data request and the tests wait on the URL; the set-password page with a key answers with a real 303.
- A project allowing only `email` has no entry on the login page; the docs say so "in this release".
- The `answersLocked` hand-over of plan 02 stands: one more member in the function, one more copied member in the provider, one more key in the pgTAP key-set assertion.
- **Two things to end while you are there:** the stale password-set heading after a logout (`deferred-items.md`), and the collapsed-form button, which is a submit button of the sign-in form until its handler is bound.

**Phase 179**

- Widening the registration modes of the base dataset changes the same two dev-seed pins and the journey's assertions on the login page (today: the code link visible, the pre-registration button hidden).
- The bank-auth setup's override states the whole candidate row, `['identity_provider', 'email', 'code']`, because a list is replaced, not merged. Its first runs on that override are this plan's, both green.

**Host state:** the stack is up and healthy on the live allowlist with the default function environment; the three functions answer `OPTIONS` with 200. The default project holds the `default` dataset with the configuration quoted above; the E2E project is open and holds what the closing run left. Nothing listens on 5173, 5273, 8777 or 9443.

## Self-Check: PASSED

- Every file under `key-files.created` exists, and every path under `key-files.modified` is in `git diff --name-only 3105668a0..72d99fb87`.
- All eight commits (`50d35d5ce`, `1312b735d`, `a86fa4d1e`, `9b65693d7`, `0c0ef4baf`, `71684c813`, `45505e155`, `72d99fb87`) are ancestors of HEAD; `git rev-list --count 3105668a0..HEAD` was 8 when this file was written.
- The plan's two closing verify commands were run after the last run: the gate verify on `171-04-closing-2` (13 gates, none red, exit 0) and the E2E verify on each of the three closing directories (exit 0 three times, each with its recorded head equal to HEAD for `apps`, `packages`, `tests/tests`, `tests/playwright.config.ts` and `scripts`).
- `.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` are unchanged since the start revision; `CAND-APP-PLAN.md` is untracked and untouched.
