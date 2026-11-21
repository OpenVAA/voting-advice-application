---
phase: 176-contestant-home-task-state-nominations-view
plan: 18
subsystem: testing
tags: [a11y, axe, scans, phone-widths, wiring-gate, e2e, contestant-app, NOM-01, NOM-02]
requires:
  - phase: 175-12
    provides: declareScans / toScanEntry (tests/tests/utils/contestantAxeScan.ts), pageGeometry.fixture.ts, the wiring gate reading the helper module
  - phase: 176-12
    provides: the nominations view with its container, card and note markers
  - phase: 176-15
    provides: the home's task list, reason sentence and main action with their state attributes
  - phase: 176-16
    provides: the menu's closed items and reason line
  - phase: 176-17
    provides: the per-project baseline 176-17-close (312 tests, 113 projects)
provides:
  - scan entry `cand-nominations` in contestant-a11y-scan; `cand-home`'s reach asserting data-next-step="preview"
  - six scan entries in perm-no-nomination.spec.ts, each in both themes (12 scans)
  - fourteen `phone:` tests (seven at 320 px, seven at 390 px)
  - one `nominations:` test of the view in a Finnish session
  - the wiring gate reading perm-no-nomination.spec.ts
  - fixture steps expectFitsViewport, expectGreetingFits, expectCardValuesInsideCard, openInLocale, expectSupportButtonInsideNote, expectClosedPartsInsideDrawer; noNominationPagesOf and setOrganizationName on the composition root
  - the per-project baseline 176-18-close (341 tests, 113 projects)
affects: [176-19, 177]
tech-stack:
  added: []
  patterns:
    - "a scan entry's reach writes its state with the state steps, loads the page as a new document and asserts the state through fixture steps; the describe's afterEach restores a project-wide setting"
    - "a non-default locale is opened at /<locale>/<path>: no route id holds a locale segment, so buildRoute's locale parameter selects nothing"
    - "a clipped container is measured by boxes and by scrollWidth against clientWidth, never by the page's width"
key-files:
  created: []
  modified:
    - tests/tests/specs/a11y/contestant-a11y.spec.ts
    - tests/tests/specs/perm/perm-no-nomination.spec.ts
    - scripts/assert-a11y-scan-wiring.mjs
    - tests/tests/fixtures/contestant/perm-no-nomination.ts
    - tests/tests/fixtures/contestant/contestantHomePage.fixture.ts
    - tests/tests/fixtures/contestant/contestantNominationsPage.fixture.ts
    - tests/tests/fixtures/contestant/notEditableNote.fixture.ts
    - tests/tests/fixtures/shared/navMenu.fixture.ts
    - tests/tests/utils/permNoNominationData.ts
    - packages/dev-seed/src/templates/e2e/perm/perm-no-nomination.ts
    - tests/README.md
decisions:
  - "The nominations view of the all-complete base candidate reads Return, not Continue: its reach asserts data-action=\"return\", which also proves the task state is known in the browser before the scan"
  - "The fixture steps and the dataset's Finnish names were shown green by a run of the uncommitted tree of their own (176-18-fixtures-precommit) before they were committed, so that the plan's pre-commit run could be made with the spec and the gate alone uncommitted"
  - "The new spec is read by the wiring gate with no required import, as the organization-editing spec is: it holds tests other than scans"
  - "The greeting with a long party name is measured in English at both widths, where the UI contract left it to a person's read"
metrics:
  duration: about 50 min (11:30Z to 12:20Z)
  completed: 2026-10-09
status: complete
requirements-completed: [NOM-01, NOM-02]
actuals:
  tokens: 26055
  tasks: 3
  commits: 5
commits: 5
plan_head_before: c9d48926fd740e3443532b2680b9087966fe6a57
plan_head_after: 797cbc0478bda455728bd6a97a41a418e64740dd
---

# Phase 176 Plan 18: Seven Scan Entries, Phone Widths and the Wiring Gate — Summary

**Seven states of the home, the menu and the nominations view pass the shared axe gate in the light and the dark theme with zero violations, each behind a marker only that state renders; the screens fit 320 and 390 px with their card, note, menu and a long party name inside their boxes; and no surface needed a fix.**

## Read this first

- **All three tasks are done, every verify exits 0, and the full run is green**: 341 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run, 113 projects. `contestant-a11y-scan` 22 → 24, `perm-no-nomination` 41 → 68, the other 111 projects at their plan-17 totals.
- **No axe violation and no overflow was found on any surface.** No application file changed. Fourteen scans and fourteen width tests passed on their first run.
- **Two runs of the uncommitted tree were red, both on a mistake in a test this plan wrote, neither on the application** (below, *Red runs*). Each was corrected in the test and made again; nothing was retried on an unchanged tree.
- **Both things asked beyond the plan's text were done**: a Finnish name is asserted on the nominations view in a Finnish session, and the list-semantics facts are recorded. Neither moved a pinned count.
- **Not established by this plan**, said plainly under *Not done, or not verified*: how axe classified the closed menu items for contrast (the gate records violations only), and which state `contestant-nav-menu` scans (inferred, not asserted by its reach).

## Task Commits

| Task | Commit | Subject |
|---|---|---|
| 1 | `1a7eae90e` | test(176-18): the nominations view is scanned with a confirmed card, and the home scan says which home it scans |
| 2 | `ae004aead` | test(176-18): fixture steps for the widths of the home, the nominations view and the menu |
| 2 | `511ed2a79` | test(176-18): the new screens' states pass the axe gate in both themes and fit a phone's width |
| 3 | `44807a798` | docs(176-18): the tests README names what the no-nomination spec asserts and scans |
| 3 | `797cbc047` | docs(176-18): the candidate scan's notes name the scans of the no-nomination spec |

## Each verify, with its real exit status

| Verify | Script | Exit | Head |
|---|---|---|---|
| Task 1 | `tests/e2e-runs/176-unit/176-18-t1-verify.sh` | 0 | `1a7eae90e` |
| Task 2 | `176-18-t2-verify.sh` | 0 | `511ed2a79` |
| Task 3 | `176-18-t3-verify.sh` | 0 | `797cbc047` |

Each script is the plan's `<automated>` block byte for byte, extracted by a script and run with `bash`; its log, exit and head are beside it. No stage was restated. Task 3's was taken after the full run and before any further commit outside `.planning/`.

## What the confirming reads of Phase 175's helpers found (assumption A-175)

It holds, under the names the plan expects:

- `tests/tests/utils/contestantAxeScan.ts` is tracked and exports `ContestantAxeRoute`, `assertContestantReach`, `toScanEntry`, `assertDarkThemeIfDark` and `declareScans`. `declareScans(entry)` declares two tests titled `axe accessibility scan — <name>` and the same with ` (dark)`; each first opens the entry's route in the entity-less form in English, then runs `reach`, the reach proof and, on the dark twin, the dark-theme guard.
- `tests/tests/fixtures/shared/pageGeometry.fixture.ts` is tracked and holds `expectNoHorizontalOverflow`, `expectWithinViewportWidth`, `expectShowsWholeText`, `expectInside`, `expectNoOverlap` and `expectAtLeast`. Phase 175's page fixtures call `createPageGeometry(page)` themselves; none of its composition roots registers it.
- `scripts/assert-a11y-scan-wiring.mjs` reads the helper module and `perm-organization-editing.spec.ts` in its check 4a, the latter with `gate: null`.
- `perm-organization-editing.ts` exports `organizationEditingPagesOf(page)`, the form a `reach` uses to speak in fixture steps; this plan's `noNominationPagesOf(page)` follows it.

## The seven entries

| # | Entry | Where | Session | State the reach sets and asserts | Content anchor | Reach marker (`postLoginTestId`) |
|---|---|---|---|---|---|---|
| 1 | `cand-nominations` | `contestant-a11y.spec.ts`, project `contestant-a11y-scan` | the base candidate (`STORAGE_STATE`) | nothing written; asserts `data-nominations-state="listed"`, `data-nominations-locked="false"`, exactly one card with `data-confirmed="true"`, a visible parent row and a visible symbol row, and the main button with `data-action="return"` | `contestant-nomination` | `contestant-nominations` |
| 2 | `no-nomination-home` | `perm-no-nomination.spec.ts`, project `perm-no-nomination` | `ca-none` | nomination `none`, lock off; home loaded; task list `incomplete / blocked / blocked`, preview closed, reason `noNomination`, next step `nomination` | `contestant-home-status` | `contestant-home-closed-reason` (`data-reason="noNomination"` asserted by the reach) |
| 3 | `no-nomination-nominations-empty` | the same | `ca-none` | `none`, lock off; view loaded; `empty`, not locked, the candidate's empty sentence, no note, button `return` | `contestant-nominations-empty` | `contestant-nominations-empty` |
| 4 | `no-nomination-nominations-locked` | the same | `ca-none` | `none`, lock on, then a full load; `empty`, locked, the note with one support button, the empty sentence, button `return` | `contestant-nominations-empty` | `contestant-nominations-locked-note` |
| 5 | `no-nomination-menu` | the same | `ca-none` | `none`, lock off; home loaded, the menu opened through the fixture; the nominations item, three closed items described by the reason line, reason `noNomination` | `nav-menu-item` | `contestant-nav-closed-reason` |
| 6 | `nominated-home` | the same | `ca-none` | `pending`, no answers, lock off; home loaded; task list `complete / incomplete / incomplete`, counts 1 and 2, preview closed, reason `previewNotReady` | `contestant-home-status` | `contestant-home-closed-reason` |
| 7 | `nominated-nominations-pending-locked` | the same | `ca-none` | `pending`, no answers, lock on, then a full load; `listed`, locked, the note, one card (election, constituency, symbol `12`, no parent, unconfirmed), the pending line, button `continue` | `contestant-nomination` | `nomination-pending-note` |

- Fourteen scans, each with zero violations and an empty raw-key finding list, in `176-18-scan-precommit` and again in `176-18-close`.
- **U-08's fallback is not on the tree.** `emptySentenceShown` is `viewState === 'empty'`, so the locked empty view shows the note above the empty sentence, as the recommended option says; entry 4 anchors on that sentence and is marked by the note.
- The six entries of the new spec are in one describe under `ca-none`'s session, whose `afterEach` turns the lock off after every scan, the four that never turn it on included. The four unlocked entries are declared before the two locked ones.
- **The scan project's count: 22 before, 24 after.** Its dependencies are unchanged; nothing that needs an entity without a nomination or a flipped setting was added to it.
- **`cand-home` is now pinned to the all-complete home**: its reach asserts `data-next-step="preview"`, and it passed, so the base candidate is all-complete on the tree. `cand-profile` reaches the profile behind `contestant-profile-identity`, as plan 13 left it; this plan did not change it.
- The scan spec's table of unscanned states names the note where it named the warning, with the three entries that scan the same component (`org-profile-answers-locked`, entries 4 and 7). It had no row for the profile's nominations, so none was removed. Its counts read twelve surfaces and 24 scans.

## The phone-width tests

In `perm-no-nomination.spec.ts`, in two describes `perm-no-nomination: at 320px wide` (320 × 568) and `at 390px wide` (390 × 844), each with `isMobile` and `hasTouch`, in English. Seven tests in each, fourteen in all, every one beginning with its state steps:

| Test (title begins `phone:`) | Session | State | What is measured |
|---|---|---|---|
| the home of a candidate with no nomination fits the viewport | `ca-none` | `none` | the document's `scrollWidth` against its `clientWidth` |
| the home of a candidate with a pending nomination and nothing answered fits the viewport | `ca-none` | `pending`, no answers | the same |
| the empty nominations view fits the viewport | `ca-none` | `none`, lock off | the same |
| the empty nominations view under the lock fits the viewport, and its note holds the support button | `ca-none` | `none`, lock on (restored in a `finally`) | the page's width; the note's support button's box inside the note's |
| a pending card under the lock fits the viewport, the card holds its values and the note its support button | `ca-none` | `pending`, lock on (restored in a `finally`) | the page's width; the card's heading, its three values (constituency, symbol, state) and its pending line each inside the card's box, each value's text inside the value's own box; the support button inside the note |
| the open menu of a candidate with no nomination holds its closed items and its reason line inside the drawer | `ca-none` | `none` | the reason line and each of the three closed items inside the box of the drawer panel (`nav-menu`), none with text beyond its own box; the page's width with the menu open |
| the home of a party with a long name fits the viewport, and its greeting is shown whole | `or-none` | `none`, a 104-character name stored (the seeded name put back in an `afterEach`) | the page's width; the `<h1>` between the viewport's edges, its text inside its own box |

All fourteen passed on their first run. The parent row is the one row not measured at phone width, as the UI contract says; entry 1 renders it at desktop width.

## Every violation or overflow found

**None.** No rule was disabled, no element excluded, no entry removed, no tolerance changed, and no application file was touched.

What earlier plans left for this plan to show:

| Question | What was found |
|---|---|
| Does the gate pass over a closed menu item (`!text-neutral/20` on `bg-base-100`, `aria-disabled="true"`, `role="link"`)? | `no-nomination-menu` has zero violations in both themes with three such items in the document. **How axe classified them is not recorded**: the gate attaches `violations` alone, and axe's `incomplete` results are outside it by the scan family's stated posture. |
| The menu's reason line at 320 px | inside the drawer panel, its text inside its own box, at 320 and at 390 px |
| The home's greeting with a long party name at 320 px | the page does not widen and the `<h1>` shows its whole text, at 320 and at 390 px, in English |
| Which state `cand-home` scans | the all-complete home, now asserted by its reach |
| Which state `contestant-nav-menu` scans | the menu of the same user in the same project, so by inference the all-open menu with the nominations item. **Its reach asserts nothing about closed items**; it was not changed. |

## Red runs of the uncommitted tree, and their causes

Neither was a void, and neither was made again on an unchanged tree.

1. **`176-18-a11y-precommit`: 2 failed of 32** — `cand-nominations` and its dark twin, both on the reach's own expectation (`data-action` expected `continue`, received `return`), before any scan. **Cause, confirmed from the failure's call log:** the expectation was mine and wrong. The base candidate has no task left, so the view's button returns to the home; the log shows the button first as the disabled loading form with no `data-action` and then as the link with `data-action="return"`. The expectation was corrected to `return`, which keeps what the assertion is for (the task state is known in the browser before the scan). `176-18-a11y-precommit-r2`: 32 passed.
2. **`176-18-fixtures-precommit`: 1 failed of 267** — the Finnish test, on its expectation (the election's heading read `[EL-1] Nomination Election`). **Cause, confirmed from the test's trace:** the request was `/contestant/candidate/<id>/nominations` with no locale prefix. The fixture step built its URL through `buildRoute`'s `locale` parameter, and no route id holds a locale segment, so the page was the English one. The step now loads `/<locale><path>` and asserts `document.documentElement.lang`. The trace is kept in `tests/e2e-runs/176-unit/176-18-fixtures-precommit-red-trace/`. `176-18-scan-precommit` then passed with the test in it.

## The pre-commit runs and their verdicts

| Label | Project | Uncommitted | Load before | Docker VM free | Result | Verdict |
|---|---|---|---|---|---|---|
| `176-18-a11y-precommit` | `contestant-a11y-scan` | the scan spec | 11.49 | 18.01 GiB | 30 passed, 2 failed | `control … --green`: FAIL (as it should) |
| `176-18-a11y-precommit-r2` | `contestant-a11y-scan` | the scan spec | 7.90 | 18.01 GiB | 32 passed | `control 176-18-a11y-precommit … --green`: **PASS** (24/24 in the project) |
| `176-18-fixtures-precommit` | `perm-no-nomination` | the five fixtures, the data module, the template, the spec, the gate | 17.93 | 17.99 GiB | 266 passed, 1 failed | `control … --red "a user who reads the view in Finnish"`: **PASS** (exactly that test red, on its expectation) |
| `176-18-scan-precommit` | `perm-no-nomination` | the spec and the gate | 12.24 | 17.91 GiB | 267 passed | `control … --dirty-only $S --dirty-only $W --green`: **PASS** (68/68 in the project) |

`176-18-fixtures-precommit` is not in the plan. The plan commits the fixture steps first, as steps no committed spec calls; this plan's first commit of Task 2 also gives the dataset two Finnish names, which a browser can observe. That run showed every committed test green on the changed fixtures and dataset before they were committed, and let the plan's own pre-commit run be made with exactly the two files its verdict names.

At the commit each green run was made on, the spec held no such entry: `c9d48926f` holds no `cand-nominations`, and `ae004aead` holds no `declareScans` in the new spec. Both are stages of the verify scripts.

## The wiring gate's control

The spec was added to check 4a's list with `gate: null`, beside the organization-editing spec. With `const CONTROL_GATE = new AxeBuilder({ page: undefined });` appended to the uncommitted spec, `yarn assert:a11y-scan-wiring` exited **1**:

```
[ERROR] scripts/assert-a11y-scan-wiring.mjs: specs/perm/perm-no-nomination.spec.ts constructs its own AxeBuilder, calls .withTags(`) or imports the axe package, instead of obtaining the gate from the shared 'assertAxeScan' in tests/tests/utils/axeScan.ts. A gate built outside that one function can relax the WCAG tag set independently of every other scan, breaking strictness parity (CSCAN-02 criterion 6).
A11y-scan wiring guard (phase 147: CSCAN-02, CSCAN-03) — 1 violation(s).
```

The line was removed at once (the file compared equal to its copy from before) and the gate exited 0. Log: `tests/e2e-runs/176-unit/176-18-wiring-control.log`.

## Gate rows and the full run

`176-18-close` gates on `797cbc047` (load before 5.76; Docker VM free 18.24 GiB; AC power): typecheck 0 (21 s), lint 0 (49 s), unit 0 (78 s), check-frontend 0 (10 s), build 0 (17 s), format 0 (20 s). `176-verdict.mjs gates 176-18-close --rows typecheck,lint,unit,check-frontend,build,format`: PASS, not stale, no Sleep entry in the window. Frontend unit: 3567 passed, 20 skipped, 193 files, as before; dev-seed 1041 passed.

The full default run `tests/e2e-runs/176-e2e/176-18-close`, head `797cbc0478bda455728bd6a97a41a418e64740dd`, 12:07:07Z to 12:16:38Z; load before 12.01 (16.12 at its end); Docker VM free 18.24 GiB; AC power, battery 100 %:

```
counts: total 341, passed 341, failed 0, flaky 0, skipped 0, didNotRun 0; 113 project(s)
scope: the full default suite
not stale: head 797cbc047 is tree-equal to HEAD outside .planning/
power: no Sleep entry inside the run window
project perm-no-nomination: 68/68 passed
project contestant-a11y-scan: 24/24 passed
project contestant-journey: 1/1 passed
project perm-organization-editing: 46/46 passed
project perm-no-nomination: 12 test(s) whose title contains 'axe accessibility scan', all passed
compared with: tests/e2e-runs/176-e2e/176-17-close
  contestant-a11y-scan	24	22	22+2 = 24	holds
  perm-no-nomination	68	41	above 41	holds
per project: 113 compared, 0 not as expected
176-verdict e2e 176-18-close: PASS
```

The other 111 projects are `equal to` their plan-17 totals (the whole table is in `tests/e2e-runs/176-unit/176-18-t3-verify.log`). The title substring pinned is the plan's own, `axe accessibility scan`: `declareScans` titles a scan in those words. `perm-no-nomination` rose by 27: 12 scans, 14 `phone:` tests and the one Finnish test. A one-project run of `perm-no-nomination` is now 267 tests.

No run of this plan was void.

## Every new state, and where it is scanned

| State | Scanned by | If not, the reason | Found |
|---|---|---|---|
| Home, no nomination (H1) | entry 2 | | 0 violations, both themes |
| Home, a nomination, something incomplete (H2) | entry 6 | | 0 violations, both themes |
| Home, every task complete (H3) | `cand-home` (reach asserts `data-next-step="preview"`) | | 0 violations, both themes |
| Home, pending frame | — | Transient; every marker excludes it. | — |
| Home with answers locked | — | The note is one component in one slot, scanned on `base-100` by entry 4, on `base-200` by entry 7, and with its `answersLocked` sentence by `org-profile-answers-locked`. | — |
| Questions list with answers locked | — | The same component in the same slot on `base-100`, the pairing entry 4 scans. | — |
| Question page with answers locked | — | The same component in the same slot on `base-200`, the pairing entry 7 scans. | — |
| Menu, no nomination | entry 5 | | 0 violations, both themes |
| Menu, a nomination, preview closed | — | The markup of entry 5 with one closed item and the other sentence, in the same classes. | — |
| Menu, everything open, with the nominations item | `contestant-nav-menu` (existing entry) | | 0 violations, both themes; the state is inferred, not asserted by the reach |
| J with nominations, lock off (J1), a confirmed card with all four rows | entry 1 | | 0 violations, both themes |
| J with nominations, lock on (J2), a pending card | entry 7 | | 0 violations, both themes |
| J empty, lock off (J3) | entry 3 | | 0 violations, both themes |
| J empty, lock on (J4) | entry 4 | | 0 violations, both themes |
| The note with the `nominationsLocked` reason | entries 4 and 7 | | 0 violations |
| The organization's home, menu and J | — | The candidate's markup with other sentences and one other label, chosen by the descriptor; asserted by the spec, scanned once. | — |
| Profile without the nominations block | `cand-profile` (marker `contestant-profile-identity`) | | 0 violations, both themes |
| Questions list and question page with required info missing | — | The pages' existing markup, reached in a state that was closed before; the spec asserts they render. | — |

## Asked beyond the plan's text

**1. A localized name in a browser — done.** The template `packages/dev-seed/src/templates/e2e/perm/perm-no-nomination.ts` seeded the election's and the constituency's `name` with an `en` entry alone; each now also carries `fi` (`[EL-1] Ehdokasasetteluvaalit`, `[CO-1] Ehdokasasettelun vaalipiiri`), mirrored in `ELECTION_NAME` and `CONSTITUENCY_NAME` of `permNoNominationData.ts`. The test `nominations: a user who reads the view in Finnish is shown the election and the constituency by their Finnish names` writes a pending nomination for `ca-none`, opens the view at `/fi/…`, asserts that the document's `lang` is `fi`, and reads the card's heading and constituency as the Finnish names. It passed in `176-18-scan-precommit` and in the full run: the names of a nomination follow the session's locale on a full load. Its title holds no scan wording, so the count of 12 stands; the project's rise is allowed by `=+`.

**2. The list-semantics question — the facts, with no markup changed.**

- The home's task list: `<ol class="mt-lg w-full list-none pl-0" aria-label="…" data-testid="contestant-home-tasks">`. It is `list-style-type: none` (Tailwind's `list-none`) and carries **no `role="list"`**. It has an accessible name.
- The nominations view's card list: `<ul class="mt-lg gap-lg flex list-none flex-col self-stretch pl-0" data-testid="contestant-nominations-list">`. It is `list-style-type: none` and carries **no `role="list"`**. It has no accessible name, and it is a flex container.
- **The suite cannot show what WebKit does with them.** Every project of `tests/playwright.config.ts` runs `devices['Desktop Chrome']` (49 uses; the one other device name is in a comment); there is no WebKit and no Firefox project. Axe's `list` rule, one of the gate's three per-rule checks, passed on both, but it checks the children of a list, not whether a browser exposes the list.
- By contrast the menu's groups do not rely on the element: each item is a `<div role="listitem">`.

## Code review checklist

Walked over the two specs, the five fixtures, the data module, the template and the gate script.

| Item | Outcome |
|---|---|
| Solves the issue | Yes: seven entries in both themes, the widths, the gate's list. |
| OWASP top 10 | Test code only. The new service-role write, `setOrganizationName`, refuses any entity but the dataset's organization; no secret is read or printed. |
| Code style guide | Prettier and ESLint clean on every changed file; the tests' lint (no raw or text locator in a spec) passes. |
| No `any` | None. |
| No repeated code | `PHONE_VIEWPORTS` and a long organization name are stated in this spec and in `perm-organization-editing.spec.ts`: a spec cannot import a spec, and neither constant was moved to a shared module. Reported, not changed. |
| New entities documented | Every new step, helper, constant and fixture member has TSDoc or a describing comment. |
| Repo documentation | `tests/README.md` updated. |
| Tracking events | Not applicable: no user function added. |
| Svelte component guidelines | Not applicable: no component touched. |
| Errors handled | The state step throws by name on a foreign entity and on a failed write. |
| Failing checks | None: gates and the full run are green. |
| Shared dependencies | `navMenu.fixture.ts` is shared with the voter specs and gained one member and one import; the dataset gained two Finnish names. The full run covers both. |
| WCAG A and AA | This plan's subject: seven entries, both themes, zero violations, each behind its marker. |
| Keyboard and screen reading | Unchanged by this plan. The list-semantics facts above are for a person's read on WebKit. |
| Developers' and Publishers' guides | Not applicable. |
| Comment hygiene | `yarn assert:comment-hygiene` 0 before each commit; every comment read: none tells history or names a plan. |
| Commit history | Five commits, three `test` and two `docs`. `797cbc047` changes comments that `1a7eae90e` added to the same file: the sentence it adds names entries that did not exist at the first commit. |
| `[db]` tag | Not applicable: no schema or migration change. |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The new entry's reach expected the wrong button action**
- **Found during:** Task 1, the first pre-commit run
- **Issue:** `cand-nominations` asserted `data-action="continue"`; the base candidate's view reads Return.
- **Fix:** the expectation is `return`. The run was made again as `-r2`.
- **Files modified:** `tests/tests/specs/a11y/contestant-a11y.spec.ts`
- **Commit:** `1a7eae90e`

**2. [Rule 1 - Bug] `openInLocale` opened the default locale**
- **Found during:** Task 2, `176-18-fixtures-precommit`
- **Issue:** the step passed the locale to `buildRoute`, which fills a locale segment no route id holds.
- **Fix:** the step loads `/<locale><path>` and asserts the document's `lang`.
- **Files modified:** `tests/tests/fixtures/contestant/contestantNominationsPage.fixture.ts`
- **Commit:** `ae004aead`

### Other departures

- **A run the plan does not name**, `176-18-fixtures-precommit`, for the reason given above.
- **Tests beyond the plan's list**: the Finnish test (asked by the dispatch); the long-party-name test at both widths (the dispatch names the greeting among what this plan should show; the UI contract had it as a person's read); a page-width assertion with the menu open.
- **Steps beyond the plan's list**: `contestantHomePage.expectGreetingFits`, `contestantNominationsPage.openInLocale`, and on the composition root `noNominationPagesOf` and `setOrganizationName`.
- **A fifth commit**, `797cbc047`, comments only, after Task 2.
- **The scans are placed before the logout tests** in the spec, and the phone tests after the scans, so that every test under `ca-none`'s stored session runs before the test that signs that user in and out. No test depends on the order; the placement only keeps the new tests clear of it.

## Files touched that the plan did not list

- `tests/tests/utils/permNoNominationData.ts` — the two Finnish names.
- `packages/dev-seed/src/templates/e2e/perm/perm-no-nomination.ts` — the same two names in the template, and its header's sentence about them.

No application file.

## For plan 176-19

**The reads the UI contract leaves to a person, for the todo it files:**

1. **Row labels, reason sentences, the note and the empty sentence in the six other locales at 320 px**, on the home, in the menu and on the nominations view: no clipping and no overlap. This plan measured English alone.
2. **Card labels in seven locales at 320 px**: the longest, "Numéro du·de la candidat·e", wraps above its value.
3. **The greeting with a long party name** is now measured in English at 320 and 390 px. What is left to a person is the same greeting in the other locales, and a name made of one unbroken word, which this plan did not try.
4. **Focus after accepting the terms of use at a closed URL** (on the home's `<h1>`, not on `<body>`).
5. **An entry the browser shows open and the server has closed**, after an administrator's change: the user lands on the home with nothing said.
6. **List semantics on WebKit with VoiceOver**: whether the home's `<ol>` and the nominations view's `<ul>`, both `list-style: none` and neither with `role="list"`, are announced as lists. The suite has no WebKit project.
7. **How a closed menu item's contrast is classified by axe** (`!text-neutral/20` on `bg-base-100`): passed, incomplete or not applicable. The gate shows only that it is not a violation.

**Facts for the final run:**

- The baseline is `176-18-close`: 341 tests, 113 projects; `perm-no-nomination` 68, `contestant-a11y-scan` 24.
- `contestant-nav-menu`'s reach does not assert its state. One line would pin it (`navMenu.expectReasonLine(null)` after the menu opens); it was left because the plan names only `cand-home`'s reach.
- The scans run at 1280 × 720. The phone tests measure widths and run no axe scan.

## For the phase's verification

- **Each scan entry, its marker and its state** are in *The seven entries* above; each scan's `reach-proof-<entry>.json`, `raw-i18n-keys-<entry>.json` and `axe-violations-<entry>.json` are attached to its test in `tests/e2e-runs/176-e2e/176-18-close/results.json`.
- **Each width measured**: 320 × 568 and 390 × 844, seven tests at each, in *The phone-width tests* above.
- **The lock**: every reach and test that turns it on is followed by a full load; the scan describe restores it in an `afterEach`, the two phone tests in a `finally`.
- **Counts pinned by the verdict**: `contestant-a11y-scan` = its plan-17 total + 2; 12 titles holding `axe accessibility scan` in `perm-no-nomination`.

## Not done, or not verified

- How axe classified the closed menu items for contrast: not recorded by the gate, not measured here.
- The state `contestant-nav-menu` scans: inferred from the session, not asserted.
- No locale but English at phone width; no Finnish page was scanned (the Finnish test reads names and runs no scan).
- The parent row at phone width, by the UI contract's own exclusion.
- WebKit: nothing, for want of a project.

## The state the local database is left in

A full E2E run has touched it and no reset followed: the gate rows of this plan held no `db-reset` row. `39-invitations.test.sql` test 238 is therefore red on it until the next reset, which is the known finding. The nominations lock is off (the last scan's `afterEach` and each `finally` ran; the run was green), and every dataset of the suite was removed by its teardown.

## Known Stubs

None.

## Evidence (gitignored)

`tests/e2e-runs/176-e2e/`: `176-18-a11y-precommit`, `176-18-a11y-precommit-r2`, `176-18-fixtures-precommit`, `176-18-scan-precommit`, `176-18-close`, each with the copies of the files it ran beside it. `tests/e2e-runs/176-gates/176-18-close`. `tests/e2e-runs/176-unit/176-18-*`: the verify scripts with their logs, exits and heads, the verdict logs, the load readings before and after each run, the wiring control and the kept trace.

## Self-Check: PASSED

The five commits are ancestors of HEAD; the five run directories, the gate directory, the verify scripts with their logs, the wiring control log and the kept trace exist; `git rev-list --count c9d48926f..HEAD` was 5 when this file was written; no stub pattern in the changed spec or composition root.
