---
phase: 173-multi-entity-grants-entity-selection
plan: 13
subsystem: testing
tags: [playwright, axe, a11y, docs, closing-gate, e2e, contestant-app]

requires:
  - phase: 173-12
    provides: "the multi-entity and no-entity stored sessions, the selection and nothing-to-edit page fixtures, the nav-menu members, the baseline label 173-12-spec (192 tests in 103 projects)"
  - phase: 173-10
    provides: "the selection screen, the nothing-to-edit view and the menu's switch item, the three surfaces scanned here"
provides:
  - "three axe scan entries in two themes (six scans): contestant-entity-selection, contestant-nav-menu-switch, contestant-nothing-to-edit; contestant-a11y-scan at 22 tests"
  - "one recorded negative control for the new scans"
  - "the developers' page contestant-app/entity-selection, the corrected routing table and route README, the contestant scan section of tests/README.md"
  - "eight todos under .planning/todos/pending/ and ## Obligations to later phases (O-1 to O-12) in the name map"
  - "the D-24 closing gate on one tree: gate set, integration test, searches, exemptions, full E2E at 198 of 198"
affects: [174, 175, 176, 177, 178, 179]

actuals:
  tokens: 26000
  tasks: 4
  commits: 5
plan_head_before: 5dd0cd30df4af189cdf8ba6817e28d740604bab9
plan_head_after: 77fffb582b90c80bfb2bf03318692b9992cc9155

tech-stack:
  added: []
  patterns:
    - "A scan entry that needs another stored session is declared in its own table and emitted from an anonymous describe whose first statement is test.use({ storageState })"
    - "A negative control for a scan is a planted, uncommitted defect run through the wrapper directly; the driver refuses a dirty tree"

key-files:
  created:
    - "apps/docs/src/routes/(content)/developers-guide/contestant-app/entity-selection/+page.md"
    - ".planning/todos/pending/2026-10-06-173-identity-callback-lookup-throws-for-two-candidate-grants.md"
    - ".planning/todos/pending/2026-10-06-173-refresh-the-session-after-a-claim.md"
    - ".planning/todos/pending/2026-10-06-173-no-entity-name-on-answering-pages.md"
    - ".planning/todos/pending/2026-10-06-173-writer-integration-test-runs-in-no-ci-job.md"
    - ".planning/todos/pending/2026-10-06-173-terms-of-use-view-phone-overflow-and-focus.md"
    - ".planning/todos/pending/2026-10-06-173-nav-drawer-does-not-close-on-escape.md"
    - ".planning/todos/pending/2026-10-06-173-nomination-format-error-logged-in-every-run.md"
    - ".planning/todos/pending/2026-10-06-173-widened-page-params-annotation-in-contestant-context.md"
  modified:
    - "tests/tests/specs/a11y/contestant-a11y.spec.ts"
    - "tests/playwright.config.ts"
    - "tests/README.md"
    - "tests/tests/utils/axeScan.ts"
    - "tests/tests/utils/rawKeyScan.ts"
    - "scripts/assert-a11y-scan-wiring.mjs"
    - "apps/docs/src/lib/navigation.config.ts"
    - "apps/docs/src/routes/(content)/developers-guide/frontend/routing/+page.md"
    - "apps/frontend/src/routes/contestant/README.md"
    - ".planning/phases/173-multi-entity-grants-entity-selection/173-NAME-MAP.md"

key-decisions:
  - "The menu scan reaches the entity home as the user does, by activating the first card of the selection screen, not by a constructed URL"
  - "No component was changed: the six new scans had no violation and no raw-key finding on their first run"
  - "The wiring guard's stated count was corrected in prose (two comment lines, one message) after the task's check was observed on the unmodified script; no check changed"
  - "The hand-made database reset before the gate set was not made: the gate set's types-regen row resets the database itself"

patterns-established:
  - "Docs GitHub links keep parentheses and nested brackets out of the link label; the link check cuts such a link short"

requirements-completed: [ENT-01, ENT-02, ENT-03, GEN-02]

coverage:
  - id: D1
    description: "The selection screen, the nothing-to-edit view and the open menu of a multi-entity user are scanned by axe in the light and the dark theme, each under the stored session that reaches it and with its own reach marker"
    requirement: ENT-01
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/173-e2e/173-13-final — contestant-a11y-scan 22/22; the six new scans each with an empty violations attachment"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/173-e2e/173-13-negative-control — a planted unnamed button fails exactly the two nothing-to-edit scans with button-name"
        status: pass
    human_judgment: false
  - id: D2
    description: "The closing gate on one tree: twelve gate rows at 0, the adapter-level integration test 7 of 7 with none skipped, the four searches empty, the exemption list as the verdict expects, the full default E2E suite 198 of 198"
    requirement: GEN-02
    verification:
      - kind: other
        ref: "node 173-verdict.mjs gates 173-13-final; greps; exemptions — each exit 0"
        status: pass
      - kind: integration
        ref: "tests/e2e-runs/173-gates/173-13-integration.json — 7 passed, 0 failed, 0 pending"
        status: pass
      - kind: e2e
        ref: "node 173-verdict.mjs e2e 173-13-final --same-projects-as 173-12-spec --except contestant-a11y-scan=6 --expect-project contestant-entity-selection --expect-project contestant-a11y-scan --expect-project contestant-journey — exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "The developers' docs, the route README and the tests' README describe the entity routes, the root's three outcomes, switching, per-entity drafts, the two database functions and the contestant scan"
    verification:
      - kind: other
        ref: "yarn workspace @openvaa/docs validate:links --check — exit 0; gate row docs-links 0"
        status: pass
    human_judgment: true
    rationale: "Link validation shows the page resolves, not that its prose is right; the page was written from the loads' own docblocks and the measured behaviour and should be read once by the operator"
  - id: D4
    description: "What the phase hands to Phases 174 to 179 is filed as todos and as obligations O-1 to O-12 in the name map"
    verification:
      - kind: other
        ref: "grep -c -E '^\\| O-(1[0-2]|[1-9]) ' 173-NAME-MAP.md → 12; git grep -l -F findExistingCandidate -- .planning/todos/pending → one file"
        status: pass
    human_judgment: false

duration: 32min
completed: 2026-10-06
status: complete
---

# Phase 173 Plan 13: Axe Scans of the New Surfaces, Docs, Hand-over and the Closing Gate Summary

**Six new axe scans (the selection screen, the "nothing to edit" view and the multi-entity menu, light and dark) green with zero violations and one recorded negative control, the docs and todos brought to the tree, and the D-24 closing gate green on one tree: twelve gate rows at 0, the integration test 7 of 7, the four searches empty, and the full default E2E suite at 198 of 198 in 103 projects.**

## Performance

- **Duration:** about 32 min
- **Started:** 2026-10-06T18:47Z
- **Completed:** 2026-10-06T19:20Z
- **Tasks:** 4 of 4
- **Files modified:** 20 (five commits, measured from the plan's ledger)

## Accomplishments

- Every surface the phase added is inside the blocking accessibility gate in both themes, each scan proving its reach by a marker only that surface renders. `contestant-a11y-scan` holds 22 tests (16 before), the suite 198 (192 before).
- A negative control shows the new scans catch a planted defect: an unnamed button in `NothingToEdit.svelte` failed exactly the two scans of that view with `button-name`, impact `critical`, and nothing else.
- The closing gate was made once, on one tree, with no red or void attempt: gate set, integration test, searches, exemptions and the full suite all describe head `c8db3b8fc`, which equals final HEAD outside `.planning/`.
- A developers' page on entity selection and the entity routes exists; the routing table, the route README and the tests' README describe the tree as it is.
- Eight todos and a twelve-row obligations table carry what the phase learned about later phases' work.

## Task Commits

1. **Task 1: three scan entries in two themes** — `b1bec9cc7` (test)
   - stated counts corrected in the scan core, the raw-key scan and the wiring guard — `151f89d67` (docs)
2. **Task 2: docs and skill files** — `2ea3b9d8d` (docs)
3. **Task 3: todos and the obligations record** — `c8db3b8fc` (docs)
4. **Task 4: the closing gate, recorded** — `77fffb582` (docs)

**Plan metadata:** the commit that adds this file.

## Gates and Runs

Every status below was read from `$?` or a marker file, never through a pipe.

| Instrument | Label / command | Head | Result |
|---|---|---|---|
| Task 1 checks | `yarn assert:a11y-scan-wiring`; `yarn typecheck:tests`; ESLint on the two files; comment hygiene; Prettier | `b1bec9cc7` | 0; 0; 0; 0; 0 |
| Scan slice | `173-13-axe-slice` (`--project contestant-a11y-scan`) | `b1bec9cc7` | wrapper 0; 30 of 30; verdict `--allow-slice --expect-project contestant-a11y-scan --same-projects-as 173-12-spec --except contestant-a11y-scan=6` exit 0 (22 against 16; five other projects equal); first attempt |
| Negative control | `173-13-negative-control` (wrapper directly, one uncommitted planted line) | `b1bec9cc7` + the line | RED on purpose: 28 passed, 2 failed, both `contestant-nothing-to-edit` scans, `button-name` on the planted node; file restored, SHA-256 equal to the one read before |
| Task 2 checks | `validate:links --check`; `audit-skill-links.sh components`; name gate; comment hygiene; `generate:docs` | `2ea3b9d8d` | 0; 0; 0; 0; 0 |
| Gate set | `173-13-final` | `c8db3b8fc` | exit 0; twelve rows, every status 0; verdict exit 0; first attempt |
| Integration test | `tests/e2e-runs/173-gates/173-13-integration.json` | `c8db3b8fc` | exit 0; 7 passed, 0 failed, 0 pending |
| Tests' utility suite | `yarn vitest run --config tests/vitest.config.ts` (in no gate row) | `c8db3b8fc` | exit 0; 73 tests in 5 files |
| Searches | `173-verdict.mjs greps`; the four `git grep` commands by hand | `c8db3b8fc` | exit 0; each of the four prints nothing and exits 1 |
| Exemptions | `173-verdict.mjs exemptions` | `c8db3b8fc` | exit 0; two entries |
| Full E2E | `173-13-final` | `c8db3b8fc` | wrapper 0, Playwright 0; 198 of 198, 0 failed, 0 flaky, 0 skipped, 0 did not run, 103 projects; verdict (the plan's exact form) exit 0; first attempt |
| Closing verify at final HEAD | the plan's `<automated>` chain of Task 4, each link read separately | `77fffb582` | 0 for each; both runs "not stale: head c8db3b8fc is tree-equal to HEAD outside .planning/" |

Gate rows of `173-13-final`: typecheck 0, lint 0, types-regen 0, types-clean 0, sql-lint 0, pgtap 0 (38 files, 1447 tests), unit 0 (frontend 2546 passed and 7 skipped; dev-seed 1015), check-frontend 0, build 0, format 0, docs-links 0, name-gate-self-test 0.

**Power.** The slice and the negative control ran on battery, the gate set and the closing run on AC, all under `caffeinate -dimsu`; every `power.txt` records `sleep_entries_in_window: 0`. `pmset -g log` holds three Sleep entries after 21:40 local, none inside a run window: `21:52:58 Clamshell Sleep` (wake 21:53:19; the slice ended 21:52:35, the control started 21:53:39), `21:59:10 Clamshell Sleep` and `22:00:45 Maintenance Sleep` (full wake 22:01:08; the gate set started 22:05:48). No run is void and none was made twice.

## The E2E Counts of Every Label of the Phase

| Label | Head | Scope | Total | Passed | Failed | Flaky | Did not run | Projects | What it is |
|---|---|---|---|---|---|---|---|---|---|
| `173-01-baseline` | `9f888dfcd` | full | 180 | 87 | 1 | 0 | 92 | 100 | VOID: three Sleep entries in its window |
| `173-01-baseline-r2` | `9f888dfcd` | full | 180 | 180 | 0 | 0 | 0 | 100 | the baseline |
| `173-02-schema` | `89acaff82` | full | 180 | 180 | 0 | 0 | 0 | 100 | closes 173-02 |
| `173-03-writer` | `c921d473e` | full | 180 | 85 | 1 | 0 | 94 | 100 | RED, kept |
| `173-03-writer-r2` | `b1ec2b99f` | full | 180 | 83 | 3 | 0 | 94 | 100 | RED, kept; after a fix |
| `173-03-preview-probe` | `cafcdba51` | `contestant-journey` | 5 | 5 | 0 | 0 | 0 | 5 | slice |
| `173-03-writer-r3` | `cafcdba51` | full | 180 | 124 | 1 | 0 | 55 | 100 | RED, kept; after a fix |
| `173-03-profile-probe` | `43385c089` | `perm-answers-locked` | 78 | 78 | 0 | 0 | 0 | 48 | slice |
| `173-03-writer-r4` | `43385c089` | full | 180 | 180 | 0 | 0 | 0 | 100 | closes 173-03 |
| `173-05-prep` | `bf2fa8d8a` | full | 180 | 180 | 0 | 0 | 0 | 100 | closes 173-05 and 173-04 |
| `173-07-split` | `e7a0aade6` | full | 180 | 180 | 0 | 0 | 0 | 100 | closes 173-07 and 173-06 |
| `173-08-move` | `24f23def5` | full | 180 | 180 | 0 | 0 | 0 | 100 | the URL move, first run |
| `173-08-move-r2` | `1afcbe1b6` | full | 180 | 180 | 0 | 0 | 0 | 100 | closes 173-08, on a tree with more assertions |
| `173-10-screens` | `4bf684612` | full | 180 | 180 | 0 | 0 | 0 | 100 | closes 173-10 and 173-09 |
| `173-11-base` | `8d223fb7c` | full | 180 | 180 | 0 | 0 | 0 | 100 | closes 173-11 |
| `173-12-slice` | `b56f0ae7c` | `contestant-entity-selection` | 16 | 13 | 3 | 0 | 0 | 6 | RED, kept; a fixture pressed Escape |
| `173-12-slice-r2` | `b6897fd31` | `contestant-entity-selection` | 16 | 16 | 0 | 0 | 0 | 6 | after the fixture fix |
| `173-12-spec` | `b6897fd31` | full | 192 | 192 | 0 | 0 | 0 | 103 | closes 173-12 |
| `173-13-axe-slice` | `b1bec9cc7` | `contestant-a11y-scan` | 30 | 30 | 0 | 0 | 0 | 6 | the six new scans |
| `173-13-negative-control` | `b1bec9cc7` + one planted line | `contestant-a11y-scan` | 30 | 28 | 2 | 0 | 0 | 6 | RED on purpose, kept |
| `173-13-final` | `c8db3b8fc` | full | 198 | 198 | 0 | 0 | 0 | 103 | the closing run |

No test was skipped in any of them. Every `-rN` other than `173-01-baseline-r2` was made after a change to the tree. The name map's `## Closing gate` holds the same table with start times and Sleep counts.

## The Five Roadmap Criteria on the Closing Tree

1. **Several grants, normal sign-in, index kept (ENT-03).** `data-setup-entity-selection` registers a user who edits two candidates and an organization and signs in through the login form (3 of 3); `36-entity-identity.test.sql` in the `pgtap` row; the ambiguity raise and its function are gone (`greps`).
2. **Choose, skip, or be told (ENT-01).** `contestant-entity-selection` 8 of 8; the three surfaces scanned in both themes with no violation.
3. **Switch without signing out; pages show and save the selected entity (ENT-02).** The same spec: the switch item, per-entity drafts, a save that changes the selected candidate's row alone.
4. **An organization loads and saves through the same writer (GEN-02).** The integration report, 7 passed and none skipped: the organization save and six refused writes, through the adapter. Not shown through organization pages, by D-19; that is Phase 175's.
5. **The selection spec and the full suite are green (E2E-02 in part, E2E-03).** `173-13-final`, 198 of 198.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Wrong count] The spec's docblock said eleven public routes and listed twelve**
- **Found during:** Task 1, re-measuring the docblock against `find … -name "+page.svelte"`.
- **Fix:** "Twelve of them". Also: the dark guard runs on eleven twins, and the entry-count sentence names three entries whose target is not the URL they open.
- **Commit:** `b1bec9cc7`

**2. [Rule 1 - Stale docs] The routing page named the app's directory `candidate/`**
- **Found during:** Task 2. The file is not in the plan's list; the row has been false since the rename and the row beneath it was made incomplete by this phase.
- **Fix:** `contestant/`, and the protected group's row points at the new page.
- **Commit:** `2ea3b9d8d`

**3. [Rule 3 - Blocking] Three docs links were cut short by the link check**
- **Found during:** Task 2. A link whose label holds a parenthesis or a nested bracket is reported as "Not a tracked file or directory: …/contestant/(protected". I also ran the generator once while a finding stood, which left 48 generated pages unformatted in the working tree, as name-map item 32 describes; the second run, after the links were corrected, exited 0 and restored them. Nothing unformatted was committed.
- **Fix:** labels reduced to the file name, the group named in the sentence.
- **Commit:** `2ea3b9d8d`

### Where the plan and the tree differ, measured and not bent

- **"`scripts/assert-a11y-scan-wiring.mjs` unmodified" (Task 1 acceptance) against the dispatch note's "three places, stale at 14".** The acceptance was observed first: the guard exited 0 at `b1bec9cc7` with the script untouched. `151f89d67` then changed two comment lines and one message string to 22. No check changed; the guard exits 0 after it. Plan ruling 3 ("the guard is not extended") holds.
- **"The name gate declares exactly one exemption" (must-have).** The tree holds two, as name-map item 1 has said since 173-01, and `173-verdict.mjs exemptions` is written to pass on exactly those two. It passes.
- **The hand-made `yarn db:reset` of Task 4 step 1 was not made.** The gate set's `types-regen` row resets the database itself (name-map item 2); one reset, not two.
- **The plan lists the generated route map and component listing as modified.** `generate:docs` left both as they were: they already matched the tree.
- **The plan lists three skill files as modified.** None changed. `context-reactivity.md` already names the four accessors, the components skill's counts re-measured equal (0, 0, 0, 103, 103, 61, 68), and the database skill's item 9 already describes the two functions. `audit-skill-links.sh components` exits 0; the whole audit reports `Dangling: 222`, the count 173-02 recorded. The database skill's own pgTAP baseline (264 assertions in 11 files) is far from the tree's 1447 in 38 and predates this phase; not touched.
- **`tests/README.md` had no scan section to extend.** One was added, with the default-on table's missing row for `contestant-a11y-scan`.
- **The Task 1 `<automated>` chain is true at `b1bec9cc7` only.** The slice's verdict reports any later tree as stale, by design; the closing verdicts are the ones that hold at final HEAD.
- **A native-speaker review todo existed already** (173-09). It was brought up to date and no second one was filed.
- **Three todos beyond the plan's five**, from the dispatch note and `deferred-items.md`: the terms-of-use view's two defects, the drawer and Escape, the nomination log line; and one for the widened `page.params` annotation, which stays on the tree because the plan does not list `contestantContext.svelte.ts`.
- **The pre-commit branch assertion of the executor protocol** expects an `agent-*` branch in a worktree. This worktree is the operator's long-lived one on `feat/entity-signup-multi-grant`, where every plan of the phase has committed; commits were made there as the standing notes direct.

**Total deviations:** 3 auto-fixed (2 Rule 1, 1 Rule 3). **Impact:** none on scope; no product file changed in this plan.

## Known Open Defects, Not Fixed Here

None is met by a scan: every scan identity accepted the terms at registration, and the menu scan closes nothing.

1. **The terms-of-use view overflows at 390px with its checkbox off-screen** — a blocker for phone users. Todo `…-173-terms-of-use-view-phone-overflow-and-focus.md`.
2. **Passing the terms gate leaves focus on `<body>`.** Same todo.
3. **`Error formatting nomination: … Child in collection elections … not found`**, three times in the dev-server log of the closing run, as in every full run since `173-07-split`. Todo `…-173-nomination-format-error-logged-in-every-run.md`.
4. **The navigation drawer does not close on Escape.** Todo `…-173-nav-drawer-does-not-close-on-escape.md`.

**Unexercised:** the two opt-in bank-auth projects were last green at Phase 172's close and were not run in Phase 173, which changed the login gate, the app root and the route tree; `identity-callback` redirects to `/contestant`, now the root's three-way decision. The visual project was last run by 173-11.

## The Consolidated Rulings and Deviations of 173-01, With What Happened

**Plan shape (D-23).** Delivered as thirteen plans. Full runs closed 173-02, 173-03, 173-05, 173-07, 173-08, 173-10, 173-11, 173-12 and 173-13, as planned; 173-04, 173-06 and 173-09 closed on their gates with the next plan's run as boundary proof.

| Ruling | What happened |
|---|---|
| O-Q1 dedicated unconfirmed rows in `e2e/base` | Done by 173-11: two candidates and one organization, `confirmed: false`; no voter ranking assertion moved (`173-11-base` 180 of 180). |
| O-Q2 the coarse role tests the admin shapes first | Done by 173-05, as that plan's summary records; not re-verified here. |
| O-Q3 the adapter-level write is a gated integration test, shown to have run | Done by 173-03; shown again on the closing tree, 7 of 7 with none skipped. No CI job runs it: todo filed. |
| O-Q4 the lookbehind admits `contestant`; the exemption line is deleted; "the list drops to one" | The line is deleted. The list holds **two** entries, not one: the count in the ruling described a list that never existed (name-map item 1). |
| O-Q5 the editors' prompt is left alone; drafts proven through a reload | Done: 173-12's spec shows one native confirm on a switch with an unsaved edit and a draft that survives a reload. A full page load away from an editor does not discard the draft (name-map item 75): read from the code, not measured as a mechanism. |

**UI-SPEC decisions U-01 to U-16.** Adopted as written by 173-09 and 173-10. Shown in a browser by 173-12's spec and this plan's scans: U-04 (groups and headings), U-05 and U-03's type label, U-06 (the switch item is the entity group's last link, on entity pages only), U-07 (the menu names the selected entity), U-10 (the "nothing to edit" view with support and logout), U-13 (a switch raises no prompt of its own), U-14 (the third scan entry, this plan), U-15 (eight keys in seven locales, asserted by `translations.test.ts`). U-08's organization greeting holds only while something is left to do (name-map item 76). The others are as 173-09 and 173-10 recorded them and were not re-verified one by one here. One finding against the plans' premise: there is no header logout button (name-map item 3).

**The recorded limitation (U-09).** No entity name is on screen on the questions, question-editor and settings pages. A wrong-entity save is impossible; a wrong-entity editing session is not. Filed for the operator: `…-173-no-entity-name-on-answering-pages.md`.

**The two CONTEXT.md sentences the plans contradict.** Both stand contradicted, with one refinement measured by 173-02 (name-map item 13): a grant the token predates is neither listed nor readable **when the entity is not publicly visible**; when it is publicly visible it is listed and readable at once and every write is refused. The list and the one-entity read agree in every case; `36-entity-identity.test.sql` pins all three. No summary in the phase directory records the operator's acknowledgement that 173-01 asked for; this plan did not look outside that directory.

| Deviation of 173-01 | What happened |
|---|---|
| 1 the load split one plan before the URL move | As planned: 173-07, then 173-08; both green on the single-candidate suite. |
| 2 a transitional test helper | As planned: optional segment in 173-06, required in 173-08. |
| 3 the name gate changes once, in 173-02 | As planned; the fixture line for the retired login-error code was edited in 173-10. |
| 4 the database skill and the authentication page rewritten with the schema plan | As planned; both read here and found current. |
| 5 the dead "no entity" branch leaves in 173-03, its code and messages in 173-10 | As planned; `userNoCandidate` has no hit on the tree. |
| 6 D-12 lands in 173-05 | As planned; the interim `loginFailed` sign-out was replaced by the two views in 173-10. |
| 7 between 173-08 and 173-10 a multi-entity user is served a typed entity URL | Held as described; no such user existed before 173-12. |
| 8 `user` leaves the entity data | Done in 173-05. |
| 9 the names chosen | All on the tree as listed; `homeRoute` arrived in 173-07. |
| 10 `MINIMAL_BASE_APP_SETTINGS` stays candidate-only | Held: every perm setup serves candidates alone. |
| 11 the zero-entity session by a deleted grant | Done in 173-12. |
| 12 "nothing to edit" is a view of the root; `EntityList` reused | Done in 173-10. |
| 13 the obligation to Phase 174 | Filed as a todo here, with the three measured cases. |
| 14 the draft key takes a new stem | Done in 173-04; the old key has no hit. |
| 15 D-24's fourth search adopted | Done; all four empty. |
| 16 a user with nothing to edit accepts the terms first | Held: the gates run on user-level data before the list is read. |

## Sentences of `CLAUDE.md` the Phase Made False or Incomplete

`CLAUDE.md` was not edited (`git diff --stat 5dd0cd30d..HEAD -- CLAUDE.md` prints nothing). Read against the tree, no sentence is flatly false; two no longer say enough to be safe, and one rule now has a sibling it does not name.

1. § *Frontend (SvelteKit)*, Routing: "Contestant app: `apps/frontend/src/routes/contestant/`, protected routes under `apps/frontend/src/routes/contestant/(protected)/`". The pages of an entity are no longer directly under the group. Paste-ready replacement:
   > - Contestant app: `apps/frontend/src/routes/contestant/`, protected routes under `apps/frontend/src/routes/contestant/(protected)/`. The group's own page is the app root, `/contestant`: it redirects a user who edits one entity to that entity's home, lets a user who edits several choose one, and tells a user who edits none so. The pages of one entity are under `(protected)/[entityType=servedEntityType]/[entityId=uuid]/`, so the URL names the entity (`/contestant/candidate/<id>/profile`); a path without the entity is resolved by `(protected)/[...page=contestantEntityPage]/`
2. § *Backend (Supabase)*, Auth: "candidates authenticate via Supabase Auth". Editors of organizations sign in too (Phase 171), and one user may edit several entities (this phase). Paste-ready replacement for that clause:
   > the editors of candidates and organizations authenticate via Supabase Auth, and one user may edit several entities of a project; which entities a user edits is read from the `grants` table by `get_user_entities` and `get_entity_user_data`
3. § *Context Destructuring Rule*: the list of reactive accessors is given as examples "and some twenty more", which is still true. The contestant context gained four: `user`, `entities`, `selectedEntity`, `homeRoute`. Optional addition after the examples:
   > On the contestant context also `user`, `entities`, `selectedEntity` and `homeRoute`.
4. § *Results Navigation Invariants* states the tracked-URL prohibition for the `(located)` load only. The same prohibition now governs the two contestant layout loads, the root and the resolver, each with a read-recording test. Optional addition:
   > The same prohibition holds for the Contestant App's protected loads: they read the `entityType` and `entityId` params and no `url` property, guarded by `layout.tracking.test.ts` and `page.tracking.test.ts` under `apps/frontend/src/routes/contestant/(protected)/`.

## What Later Phases Must Know

The name map's `## Obligations to later phases` holds one row per obligation with files and symbols. In short:

- **Phase 174 (claims).** Refresh the session after a claim, before the first read or write. Three cases are pinned in pgTAP file 36: a not-public entity is neither listed nor readable; a public entity is listed and readable while every write is refused; a removed grant stops being listed at once although the token carries it. A claim on a candidate that has an editor fails on `idx_grants_one_candidate_editor` and is a refusal. Do not change either database function without re-running file 36: the root's redirect and the entity-level load's redirect rely on their agreement. Schema edits stay serial.
- **Phase 175 (organization pages).** The writer and the store already serve organizations; `updateEntityProperties` is the method for `name` and `short_name`, and `EditableEntityProps` holds `image` alone. The context's question scope still names the candidate type. The store holds nothing on the server and on first paint: leave a part out for a known organization, never show it only for a known candidate. Remove the widened `page.params` annotation while in the context. No organization page is scanned by axe yet; an entry that picks the organization's card would do it. The preview page's visual baselines are a candidate's.
- **Phase 176 (home and tasks).** The `candidateNoNomination` sign-out is in the entity-level load, stage 4, and nowhere else; the one-entity read does not require a nomination. `LogoutButton` logs out at once when no entity is loaded. The home's heading names the entity only while something is left to do. The nomination log line is yours to diagnose.
- **Phase 177 (selectors).** The entity path is `CONTESTANT_ENTITY`; `EntityCard` with `headerOnly` and `showType`, and `EntityList`, are the reusable card list; `showType` reads `common.<type>.singular` for all four types; `provideEntityData` does not reset the entity collections; `pageStyles.push` exists.
- **Phase 178 (password gate).** `get_user_entities` returns one object, so a per-user key can be added beside `entities` without changing signature or cardinality; the gates are decided on user-level data before the list is read. The "nothing to edit" view takes a `title` and `children` and is what a user whose email proved no invitation is shown. Passing a gate is not a navigation: focus is left on `<body>` today.
- **Phase 179 (identity provider).** `findExistingCandidate` ends in `.maybeSingle()` and fails for a returning user who edits two candidates of the project. Run the two bank-auth projects first: they have not run since the login gate, the root and the route tree changed.
- **Every phase with an E2E spec.** The base dataset serves both entity types; perm setups serve candidates alone. A reader of the multi-entity or the no-entity session runs before the perm chain. Both sessions are read-only. A new contestant surface gets an entry in `contestant-a11y.spec.ts` in both themes, under the session that reaches it, and the verdict's `--except contestant-a11y-scan=<n>` holds the count. `173-e2e.sh` refuses a dirty tree, so a negative control goes through `tests/scripts/e2e-run.sh` directly. Keep parentheses and nested brackets out of docs link labels.

## Known Stubs

None. No file changed in this plan holds a placeholder, an empty value that flows to a view, or a TODO.

## Threat Model

| Threat | Disposition | What was done |
|---|---|---|
| T-173-50 a scan passing against a spinner, a login page or the wrong view | mitigate | each entry has a data-driven anchor and a marker only its surface renders; the reach proofs show the settled URL, one marker node and the surface's own `<h1>` for all six; the negative control shows a real violation on one of them fails |
| T-173-51 the closing verdict assembled from different trees | mitigate | every instrument records head `c8db3b8fc`; both verdicts report it tree-equal to HEAD outside `.planning/` at `77fffb582` |
| T-173-52 a scan ending a shared session | mitigate | the two describes only read; the logout button is a marker and is never pressed; `contestant-entity-selection` passed 8 of 8 beside the scans in the closing run |
| T-173-53 a key printed by the integration run | mitigate | the three values went from `supabase status -o env` into shell variables; a search of the log and the report for a JWT-shaped string finds none |
| T-173-SC installs | accept | no package installed |

No new security surface: the plan changed tests, docs and planning files only.

## Prohibitions

- **PROH-173-18** held: no rule, node or surface was excluded; no scan needed a fix.
- **PROH-173-07** held: no stored session was signed out by a spec.
- **PROH-173-11** held: `CAND-APP-PLAN.md` untouched and untracked; `CLAUDE.md` unedited.
- **PROH-173-12** held: no run was retried on an unchanged tree, no test skipped or annotated, nothing under `tests/e2e-runs/` deleted.

## State Left Behind

The local stack is up (`yarn db:status` 0). The database holds migrations, `seed.sql` and the `default` dataset (`yarn db:seed:default` exit 0, 752 rows): no auth user on `test.openvaa.local`, no `test-` candidate or organization, two rows in `grants`. No dev server; 5173 and 5273 have no listener. The working tree is clean but for the operator's untracked `CAND-APP-PLAN.md`. `.planning/STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `PROJECT.md` were not touched.

## Self-Check: PASSED

- Files: the docs page, the eight todos and the three name-map sections exist on disk.
- Commits: `b1bec9cc7`, `151f89d67`, `2ea3b9d8d`, `c8db3b8fc` and `77fffb582` are ancestors of HEAD; `git rev-list --count 5dd0cd30d..HEAD` was 5 when this file was written.
