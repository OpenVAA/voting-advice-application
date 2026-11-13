---
phase: 176-contestant-home-task-state-nominations-view
plan: 11
subsystem: frontend
tags: [not-editable-note, contact-support, answers-locked, contestant-components, e2e, tdd, NOM-02]
requires:
  - phase: 176-04
    provides: the message key contestantApp.common.nominationsNotEditable
  - phase: 176-10
    provides: the per-project baseline 176-10-close, and the finding on stale-entry tests
provides:
  - the contestant component `NotEditableNote` (`reason`, optional `children`, `data-reason` on its root)
  - the optional prop `iconPos` on `ContactSupport`
  - the note on the home, the profile, the questions list and the question page while answers are locked
  - the fixture `notEditableNote.fixture.ts` (`expectNote`, `expectSupportButtons`, `expectNoNote`)
  - one `note:` test in the answers-locked spec
  - the control of plan 176-08's stale-entry `gate:` test with the group's redirect removed
  - the per-project baseline `176-11-close`, whose newest attempt is `176-11-close-r2` (286 tests, 113 projects)
affects: [176-12, 176-13, 176-14, 176-18, 176-19, 177]
tech-stack:
  added: []
  patterns:
    - "an optional prop forwarded to a child only when set, by spreading a derived object, so that the child's own default stands"
    - "one note component per kind of refusal, its sentence chosen from a closed union of reasons"
key-files:
  created:
    - apps/frontend/src/lib/contestant/components/notEditableNote/NotEditableNote.svelte
    - apps/frontend/src/lib/contestant/components/notEditableNote/NotEditableNote.type.ts
    - apps/frontend/src/lib/contestant/components/notEditableNote/index.ts
    - apps/frontend/src/lib/contestant/components/notEditableNote/NotEditableNote.svelte.test.ts
    - tests/tests/fixtures/contestant/notEditableNote.fixture.ts
  modified:
    - apps/frontend/src/lib/contestant/components/contactSupport/ContactSupport.svelte
    - apps/frontend/src/lib/contestant/components/contactSupport/ContactSupport.type.ts
    - apps/frontend/src/lib/contestant/components/contactSupport/ContactSupport.svelte.test.ts
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+page.svelte"
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/page.svelte.test.ts"
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/profile/+page.svelte"
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/profile/page.svelte.test.ts"
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/questions/+page.svelte"
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/questions/[questionId]/+page.svelte"
    - tests/tests/specs/perm/perm-answers-locked.spec.ts
decisions:
  - "U-09 (a) as ruled: the note is the Warning holding the reason's sentence, the caller's second sentence and ContactSupport as a ghost button, icon first"
  - "ContactSupport forwards iconPos by spreading a derived object that is empty when the prop is unset, so a caller that sets none leaves the Button its own default"
  - "The note's props type imports WarningProps from the warning's type file, because the warning's barrel exports no type and the Warning is not to be changed"
  - "Plan 176-08's stale-entry gate test was left as committed: it went red in a control with the group's redirect removed"
metrics:
  duration: about 70 min of work (04:47Z to 05:15Z, then a host suspension, then the closing run)
  completed: 2026-10-09
status: complete
requirements-completed: [NOM-02]
actuals:
  tokens: 9686
  tasks: 3
  commits: 7
commits: 7
plan_head_before: 9d16f98ad154347702be3a23b1fca949ca3aa8b9
plan_head_after: c7255e0a4668fb95ab0b76bb4fd41d5fa134fd10
---

# Phase 176 Plan 11: The Reusable "Not Editable" Note and its First Four Uses — Summary

**One component, `NotEditableNote`, now says "this cannot be edited — contact support" on the home, the profile, the questions list and the question page while answers are locked, with a Contact support button under the sentence; `ContactSupport` gained the optional `iconPos` that makes a start-aligned button possible.**

## Read this first

- **Plan 176-08's stale-entry `gate:` test is sound by the control the orchestrator asked for, and was not changed.** With the group's redirect removed it went red with the other four `gate:` tests. One caveat is stated under its own heading below: the control is one run, and what makes this test's navigation finish before its URL is read, where plan 176-10's did not, was not determined.
- **The plan's full run was void once.** `176-11-close` was ended by the wrapper with status 8 (`VOID-host-suspend.txt`): the laptop's lid was closed at 05:16:29Z, eleven seconds after the run started. It is kept. The run was made again as `176-11-close-r2` once the lid was open and the host on AC power.
- **A candidate now meets one more control on four pages** while answers are locked: the Contact support button under the sentence those pages already showed.
- A hook reported "context usage at 71%" after this executor's first command. The figure is read from a file keyed by the orchestrator's session id and did not move with this executor's reading, so it was taken as the orchestrator's own and the plan went on.

## Task Commits

| # | Commit | Subject |
|---|---|---|
| 1 | `a3fbc2ff7` | test(176-11): the not-editable note and the support block's icon position |
| 1 | `02d1d74e4` | feat(176-11): the support block takes the position of its button's icon |
| 1 | `77c32d86c` | feat(176-11): a reusable note for what cannot be edited, with the way to support |
| 2 | `c1edb9d4c` | test(176-11): fixture steps for the not-editable note |
| 2 | `1def07cea` | test(176-11): the answers-locked note on the home and on the profile |
| 2 | `32acc05ad` | test(176-11): the note keeps its two sentences apart |
| 2, 3 | `c7255e0a4` | feat(176-11): the pages that say editing is closed show the note with the way to support |

The orchestrator's added first step committed nothing: the test was sound and the mutated load was restored with `git checkout --` and confirmed equal to HEAD (`git diff --quiet HEAD` exit 0).

## Each verify, with its real exit status

Each `<automated>` block was written byte for byte to `tests/e2e-runs/176-unit/176-11-t<N>-verify.sh` and run with `bash`; the log, the exit status and the head are beside each.

| Task | Exit | Head | Note |
|---|---|---|---|
| 1 | **0** | `77c32d86c` | Run in the foreground with a 400 s ceiling, not in the background as the rules say for a block that holds svelte-check; it ended in under two minutes. |
| 2 | **0** | `32acc05ad` | With the four pages and the spec uncommitted, as the block requires. |
| 3 | **0** | `c7255e0a4` | After the full run `176-11-close-r2` and before any commit outside `.planning/`. |

## Added by the orchestrator's ruling: the stale-entry `gate:` test of plan 176-08

**Question.** Can `gate: an entry the browser still shows open is redirected to home, with focus on its heading` pass on a tree with no rule, as plan 176-10's own stale-entry test did before it was reordered?

**The control** — `tests/e2e-runs/176-e2e/176-11-stale-control`, through the wrapper with `--no-db-reset --project perm-no-nomination`, head `9d16f98ad`. The only uncommitted path was the group's gate load, `(nominated)/+layout.server.ts`, whose no-nomination branch returned `{}` (the diff as run: `176-11-stale-control.diff.launch`). The specs were as committed. Launched 04:48:34Z; AC power, 100 %; Docker VM free before: **18.54 GiB**.

- **211 total, 206 passed, 5 failed, 0 flaky, 0 skipped, 0 did not run.** Wrapper exit 1 (the five); no void marker.
- Judged with `176-verdict.mjs control 176-11-stale-control --project perm-no-nomination --setup data-setup-perm-no-nomination --dirty-only <the load> --red "gate:"`: **PASS**, exit 0 — "5 test(s) named by 'gate:'; 206 other test(s)". The form fits as it stands: it requires every `gate:` test red on an expectation and every other test green.
- All five failed on `expect(page).toHaveURL(expected)`. The stale-entry test took 10 680 ms: its `expectOnHome` read the profile's URL (`…/candidate/<id>/profile`) at the first of 23 polls and at every one after it.

**Finding: sound.** The test went red without the redirect, so by the ruling nothing was changed. The load was restored and the tree was clean before Task 1.

**What the control does not show (UNCONFIRMED).** The test's order is still URL first, focus second. It was red here because the navigation to the profile had already ended when the URL was first read. In plan 176-10's first control the same order was vacuous for the preview, whose navigation had not ended. The difference was not measured. A likely cause is that the group's load answers at once on the mutated tree while the preview's load makes two reads, so the margin is one of timing and may not hold on a slower host such as the CI runner. If it did not hold there, the test would lose its power to detect a missing gate; it would not turn red on a tree that has the gate, where the URL is home's before and after the click. Reordering it as plan 176-10 did would remove the dependence on timing. That was outside the ruling for a red result and was not done.

## `ContactSupport` — the new prop

```ts
  /**
   * The position of the icon in the button. Passed to the `Button`. @default the `Button`’s own default for its variant
   */
  iconPos?: ButtonProps['iconPos'];
```

The component takes `iconPos` out of its rest props and spreads `iconPos === undefined ? {} : { iconPos }` onto both of its buttons. The `@component` docstring's properties list has the line.

**What the existing callers render:** exactly what they rendered. The Help page and `NothingToEdit` pass no `iconPos`, so nothing is spread and the `Button` keeps its own default (`'right'`, which lays the row out `flex-row-reverse`). Two cases pin it for both actions: the button carries `flex-row-reverse` and the block's root carries no `iconpos` attribute. The four cases that existed are unchanged and pass. With `iconPos="left"` the button carries `flex-row` and not `flex-row-reverse`, for both actions.

## `NotEditableNote` — props and markup

`apps/frontend/src/lib/contestant/components/notEditableNote/`: `NotEditableNote.svelte`, `NotEditableNote.type.ts`, `index.ts` (the component and its props type), `NotEditableNote.svelte.test.ts`.

```ts
export type NotEditableNoteProps = WarningProps & {
  reason: 'answersLocked' | 'nominationsLocked';
  children?: Snippet;
};
```

```svelte
<Warning {...restProps} data-reason={reason}>
  {t(REASON_MESSAGE[reason])}
  {@render children?.()}
  <ContactSupport variant="normal" iconPos="left" class="mt-sm" />
</Warning>
```

| Reason | Message key |
|---|---|
| `answersLocked` | `contestantApp.common.editingNotAllowed` — not reworded |
| `nominationsLocked` | `contestantApp.common.nominationsNotEditable` |

`REASON_MESSAGE` is a `Record` over the union typed with `TranslationKey`, so a reason without a key, or a key that is not in the catalogue, fails the type check. The root is the `Warning`'s `<div>`: a caller's `data-testid` and `class` land on it, and it carries `data-reason`. The rendered button is the `normal` variant: `btn-ghost w-full justify-start flex-row min-h-touch`, the `help` icon first, an `<a>` to `/contestant/help#support`. The component reads `t` from the contestant context and nothing reactive.

Nine cases: the sentence of each reason and not the other's; `data-reason`; exactly one support button and its link; the button's layout classes; a second sentence after the reason's and before the button, separated from the first by white space; no second sentence when none is given; the caller's test id and class on the root.

## The four pages

Each renders `<NotEditableNote reason="answersLocked" data-testid="contestant-answers-locked-warning">` in `MainContent`'s `note` snippet under the condition it had for its inline `Warning`. No page gained a branch on the entity's type, and no reactive accessor is destructured.

| Page | Condition for the note | Second sentence, passed as children |
|---|---|---|
| home, `ENTITY/+page.svelte` | `answersLocked` (the page's own derived) | `isHiddenBecauseMissing` while `hiddenForMissingAnswers` |
| profile, `GATED/profile/+page.svelte` | `contestantCtx.answersLocked` | `isHiddenBecauseMissing` while a required info question is unanswered, or the type's `hideIfMissingAnswers` is on and an opinion question is unanswered |
| questions list, `GATED/questions/+page.svelte` | `contestantCtx.answersLocked` | the same condition as the profile |
| question page, `GATED/questions/[questionId]/+page.svelte` | `answersLocked` | none |

- **The questions list gained the id**; it had none.
- The question page's inline error in `setAnswer`, which assigns the same key to `errorMessage`, is untouched.
- The profile's locked-name section is untouched and holds no note: two cases assert it (a name locked while answers are not; a name locked while answers are, where the page holds one note and one support button, both outside the identity section).
- No page's `@component` docstring named the warning, so none changed. One code comment on the profile said "the page's warning explains it" and now says "the page's note".

**Unit cases:** three on the home and five on the profile (`1def07cea`). The profile test's fake context gained `unansweredRequiredInfoQuestions` in its state box, which it returned as a fixed empty list; no existing case changed.

## Red and green (unit)

| Report | Head | Total | Failed | Passed |
|---|---|---|---|---|
| `176-11-note-red.json` | `a3fbc2ff7` | 17 | 11 | 6 |
| `176-11-note-green.json` | `a3fbc2ff7`, components in the working tree | 17 | 0 | 17 |
| `176-11-pages-red.json` | `1def07cea` | 58 | 5 | 53 |
| `176-11-pages-green.json` | `32acc05ad`, pages in the working tree | 58 | 0 | 58 |

Every red case failed on an assertion. The contestant component library: 6 files, 40 cases passed. The frontend's whole unit suite with the pages in the working tree: 191 files passed, 1 skipped; **3476 cases passed**, 20 skipped. svelte-check: 2162 files, 0 errors, 0 warnings, at both points.

## Every committed spec that reads those pages, and what was done

| Reader | Reads | Done |
|---|---|---|
| `perm-answers-locked.spec.ts`, `profile:` and `opinion question:` | the id, visible, on the profile and on a question page | Unchanged; green in the pre-commit run. The file's header comment says "note" where it said "Warning". |
| `perm-answers-locked.spec.ts`, **new** `note: each page that says editing is closed offers one way to contact support` | on the home, the profile, the questions list and the question `[QU-OPIN-L5-1]`: `expectNote('answersLocked')` and `expectSupportButtons(1)` | Added and committed with the pages. |
| `perm-organization-editing.spec.ts`, `postLoginTestId: answersLockedWarning` | the id, visible on the home after sign-in | Unchanged; 46 of 46 green. |
| Phase 175's `org-profile-answers-locked` axe scans, light and dark (in the `perm-organization-editing` project) | the profile with the note, by axe | Unchanged; both passed. No finding on the note, on either background. |
| `contestantNothingToEditPage.fixture.ts` | the support button inside the nothing-to-edit container | Unchanged: `NothingToEdit` passes no `iconPos`. |
| `contestant-a11y.spec.ts`, a comment | names the id as an unscanned surface on "3 routes" | Not edited: the plan leaves that todo's annotation to 176-19. It is four routes now. |

**The new test covers all four pages.** It reads what the spec's dataset already seeds and what its two older tests already read: the `answersLocked` setting of the `perm-answers-locked` template, the one candidate the setup registers and signs in (so the app's root leads to that candidate's home, asserted with `contestantHomeUrlRe()`), and the opinion question labelled `[QU-OPIN-L5-1]`.

**The fixture is not registered on a composition root, because the spec has none:** it imports `test` from `@playwright/test` and builds its fixtures by factory in the test body, as it did for the questions overview. The new test does the same with `createNotEditableNote(page)`.

## The control and the green proof (E2E)

**The control** — `tests/e2e-runs/176-e2e/176-11-control`, `--project perm-answers-locked`, head `c1edb9d4c` with the spec alone uncommitted (the copy as run: `176-11-control.perm-answers-locked.spec.ts`). Launched 05:00:36Z; AC power; Docker VM free before: **18.49 GiB**. **99 total, 98 passed, 1 failed, 0 flaky, 0 skipped, 0 did not run.** Wrapper exit 1; no void marker. Verdict `--red "note:"`: **PASS**, exit 0. The red test's first error line:

```
Error: expect(locator).toHaveAttribute(expected) failed      (getByTestId('contestant-answers-locked-warning'): expected "answersLocked", received "")
```

— at the home's `expectNote`, after the home's URL assertion had passed.

**The pre-commit run** — `tests/e2e-runs/176-e2e/176-11-precommit`, `--project perm-no-nomination`, head `32acc05ad` with the four pages and the spec uncommitted (kept beside it: the spec, and each page as `176-11-precommit.<home|profile|questions|question>.+page.svelte.kept`). Launched 05:06:40Z; AC power; Docker VM free before: **18.45 GiB**. **212 total, 212 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run.** Wrapper exit 0. Verdict `--green --were-red-in 176-11-control`: **PASS**, exit 0 — "was red, now passed: … note: each page that says editing is closed offers one way to contact support". In it: `perm-answers-locked` 4 of 4, `perm-organization-editing` 46 of 46, `contestant-a11y-scan` 22 of 22, `contestant-journey` 1 of 1, `perm-no-nomination` 15 of 15. Nothing had to be settled in another spec.

## The gate rows and the full run

**Gate rows** — `tests/e2e-runs/176-gates/176-11-close`, head `c7255e0a4`: `typecheck=0 lint=0 unit=0 check-frontend=0 build=0 format=0`; not stale; no Sleep entry inside the run's window. Verdict: **PASS**, exit 0. Frontend unit: 191 files, 3476 cases passed.

**The full run, first attempt: VOID** — `tests/e2e-runs/176-e2e/176-11-close`, head `c7255e0a4`, through the driver with `--require-project perm-answers-locked --require-project perm-no-nomination`. Started 05:16:18Z on AC power; Docker VM free before: **18.88 GiB**. The wrapper ended it with **status 8** and wrote `VOID-host-suspend.txt` (last beat 05:16:30Z, next 05:22:52Z, a gap of 379 814 ms); it holds no `results.json`. `pmset -g log` has `Entering Sleep state due to 'Clamshell Sleep'` at 05:16:29Z: the lid was closed and the host went to battery. It is void by the marker, not by judgment. Nothing of it was diagnosed; the directory is kept.

Between the two attempts the host stayed lid-closed on battery, waking for under a minute every eight to twelve minutes (`Maintenance Sleep`, `DarkWake`). No run was started in that state. A script waited for thirty seconds of an open lid (`ioreg`'s `AppleClamshellState`) and then launched the driver; its record is `tests/e2e-runs/176-unit/176-11-close-r2.await.opened`: lid open at 05:48:54Z, AC power, 100 %.

**The full run, second attempt** — `tests/e2e-runs/176-e2e/176-11-close-r2`, head `c7255e0a4`, the same command. 05:48:55Z to 05:57:01Z. Driver exit **0**. Docker VM free before: **18.88 GiB**; after: 18.85 GiB. AC power; `sleep_entries_in_window: 0`. Judged at once with the plan's command, which reads the label's newest attempt: exit **0**.

```
run: tests/e2e-runs/176-e2e/176-11-close-r2
counts: total 286, passed 286, failed 0, flaky 0, skipped 0, didNotRun 0; 113 project(s)
scope: the full default suite
not stale: head c7255e0a4 is tree-equal to HEAD outside .planning/
power: no Sleep entry inside the run window
project perm-answers-locked: 4/4 passed
project contestant-journey: 1/1 passed
project contestant-a11y-scan: 22/22 passed
project perm-organization-editing: 46/46 passed
project perm-no-nomination: 15/15 passed
per project: 113 compared, 0 not as expected
176-verdict e2e 176-11-close-r2: PASS
```

Against `176-10-close` (285 tests): `perm-answers-locked` 4 against 3; each of the other 112 projects at its total. No red run but the two controls; one void run; nothing retried on a changed or unchanged tree to turn a red green; no axe finding; no overflow.

## The code review checklist

| Item | Outcome |
|---|---|
| Solves the issue | Yes: one reusable note that directs to support (NOM-02), used on four pages. |
| OWASP top 10 | Nothing found. The note renders message text by interpolation and one link built by the route builder; it takes no user input. |
| Code style guide | Prettier and ESLint clean on every file; the `format` and `lint` rows are 0. |
| No `any` | None. The tests cast mount props with `as never`, as the support block's test does. |
| No repeated code | Four inline warnings became one component. |
| New entities documented | The component has its `@component` docstring; both props have TSDoc; the new prop of `ContactSupport` has TSDoc and its docstring line; the fixture and its steps have TSDoc. |
| Repo documentation | The generated component pages are stale until plan 176-19 regenerates them: `ContactSupport`'s page lacks `iconPos` and `NotEditableNote` has no page. `generate:docs` was not run. |
| Tracking events | None added. The support button is a link and `ContactSupport` tracked nothing before. |
| Svelte component guidelines | Runes only; props typed in a co-located `.type.ts`; a barrel; the caller's class merged by the `Warning`'s `concatClass`. |
| Errors handled | Nothing can fail in the note. |
| Failing checks | None: gate rows 0. |
| Parts that share dependencies | The Help page and `NothingToEdit` render as before (pinned by cases, and green in the runs). |
| WCAG A and AA; keyboard and screen reader | The note sits in the page's `note` slot, whose wrapper has `role="note"` and precedes the title. The button is an `<a>` with `min-h-touch`, reachable by keyboard, named by its text. The two axe scans of the profile with answers locked, light and dark, are green. The home, the questions list and the question page are not scanned with the note in this phase (the plan's ruling 4). |
| Comment hygiene | `yarn assert:comment-hygiene` 0 violations before every commit; every touched comment was read: no history, no ids. |
| Commit history | Linear; `32acc05ad` adds one case to the test `a3fbc2ff7` created, which a squash before review would fold in. |
| `[db]` tag | No database change. |

**The components skill's re-check list:** 1 — docstring, type file and barrel are there. 2 and 3 — `generate:docs` and `validate:links` not run (left to 176-19, as above). 4 — the skill's convention 1 gives counts measured on 2026-10-06 (103 files calling `$props()`, 103 type files); this plan adds one of each. The skill was not edited. 5 — `bash .claude/scripts/audit-skill-links.sh components` exit 0.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing check] A case that the note keeps its two sentences apart**
- **Found during:** Task 2, step 5, when the pages' second sentence moved from the same text run as the first into the note's `children`.
- **Issue:** Nothing asserted that white space still separates the two sentences once they are rendered by two different tags.
- **Fix:** One assertion in the note's test; it passed as written, so the component needed no change.
- **Files modified:** `NotEditableNote.svelte.test.ts`
- **Commit:** `32acc05ad`

### Other departures

- **The fixture is not registered on a composition root** — the spec has none (above).
- **`WarningProps` is imported from the warning's type file**, not its barrel, which exports no type; changing the `Warning` is prohibited. `LanguageSelector.type.ts` imports `SelectProps` the same way.
- **Task 1's verify ran in the foreground** (above).
- **The plan's full run was made twice**, the first being void (above).
- **Step 1 of Task 1 committed the scaffold with a short docstring**, replaced by the full one in `77c32d86c`.

## Not done, or not verified

- **The comment on the id in `tests/tests/utils/testIds.ts`** still lists three routes for `contestant-answers-locked-warning`; it is four with the questions list. Seen after the pages were committed; correcting it would have made the gate rows stale. For the next plan that edits that file.
- **The stale-entry test's dependence on timing** (above): not measured, not changed.
- **No scan of the note on the home, the questions list or a question page**: by the plan's ruling 4.
- **`generate:docs`**: not run.
- **`setNominationsLocked`** was not called by this plan and is still called by no test.
- The preview's first-level heading, observed once by plan 176-10: this plan opened no preview and saw nothing of it.

## For plans 176-12 to 176-18, and Phase 177

- **Using the note for locked nominations (176-12):** `<NotEditableNote reason="nominationsLocked" data-testid="…" />` inside the page's `note` snippet. It shows `contestantApp.common.nominationsNotEditable` and one Contact support button; pass a second sentence as children if the view has one. Import from `$contestant/components/notEditableNote`.
- **A third reason (Phase 177)** is one more member of the union in `NotEditableNote.type.ts` and one more entry in `REASON_MESSAGE`; the `Record` type makes the compiler ask for the entry. Add a case to the two `it.each` lists of the note's test.
- **The fixture locates the note by the answers-locked id.** `expectNote('nominationsLocked')` type-checks but looks for `contestant-answers-locked-warning`. A note under another id needs the fixture to take the id, or a second locator; `expectSupportButtons(count)` counts over the whole page and works as it is.
- **A page that shows the note holds one `contestant-contact-support`.** A page that also renders a `ContactSupport` of its own holds two: scope by the note, as `expectNote` does.
- **A page test that mounts a page with the note** needs nothing new in its fake contestant context beyond `t` and `getRoute.current`: the support block reads `appSettings.admin.email` only for its `'email'` action.
- **Counts:** a one-project run of `perm-no-nomination` is 212 tests; `perm-answers-locked` alone is 99 with its dependencies and holds 4 tests of its own; the full run is 286 in 113 projects.
- **For 176-19:** regenerate the component pages; the unscanned-surface comment in `contestant-a11y.spec.ts` says three routes; the components skill's dated counts.

## The state the local database is left in

Not reset by this plan. The stack is up; neither it nor Docker was restarted; nothing pruned but the build cache, by the driver. Read with `psql` after the full run: 3 projects; 2 auth users; 377 nominations (the default project's dataset); no candidate row of an E2E dataset left; `private.invitation_link_witness` holds 85 rows, so `39-invitations.test.sql` test 238 is red on this database without a reset — the known finding. Nothing listens on the wrapper's port. Docker VM free: 18.85 GiB.

## Files touched that the plan did not list

None. The fifteen files changed are the fifteen the plan lists.

## Known Stubs

None.

## Threat Flags

None: the note adds no endpoint, no auth path and no read; its one link is to the Help page.

## Self-Check: PASSED

- Files: the five created files and `176-11-SUMMARY.md` exist (`test -f` on each).
- Commits: `a3fbc2ff7`, `02d1d74e4`, `77c32d86c`, `c1edb9d4c`, `1def07cea`, `32acc05ad` and `c7255e0a4` are ancestors of HEAD; `git rev-list --count 9d16f98ad..c7255e0a4` is 7.
- Evidence: the directories and reports named above exist under `tests/e2e-runs/`.
