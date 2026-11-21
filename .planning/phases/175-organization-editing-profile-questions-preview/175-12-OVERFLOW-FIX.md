---
phase: 175-organization-editing-profile-questions-preview
plan: 12 (gap closure, between plans 12 and 13; this file is its only plan)
subsystem: frontend
tags: [a11y, wcag, reflow, phone-width, daisyui, tailwind, input, e2e, playwright]

requires:
  - phase: 175-organization-editing-profile-questions-preview (plan 12)
    provides: the finding, the page-width check that names what does not fit, the unused `expectFitsViewport` step and the kept red tests
  - phase: 174.1-terms-of-use-gate-phone-width-focus (plan 01)
    provides: the precedent, `whitespace-normal` on one label, and its criterion for desktop width
provides:
  - the label inside every single-row `Input` wraps between words (`inputLabelClass`)
  - a component test over every kind of `Input` that renders an in-row label
  - page-width assertions on an organization's profile (two states) and on a candidate's, at 320 and 390 px, and a row check of the locked info question and of the candidate's name fields
  - two geometry steps, `expectWithinViewportWidth` and `expectShowsWholeText`
  - two findings that are not fixed, in `deferred-items.md` items 4 and 5
affects: [175-13, 176]

actuals:
  tokens: 10338 # chars/4 over the diff of 0f224ce24..1d6559c10 outside .planning/ (41353 chars)
  tasks: 1
  commits: 5 # MEASURED: git rev-list --count 0f224ce24..995567049; three are this work's, aaad85a55 and f9feacc1e are another agent's planning commits
plan_head_before: 0f224ce2434d8a761f50d91f0a871e1bb2c9abf3
plan_head_after: 9955670498a2e6d8c86d13d8ebf2d20f4b665802

tech-stack:
  added: []
  patterns:
    - "A cause is confirmed in a browser before a fix: computed values along the element chain, and a throwaway inline style that removes the defect and is taken off again"
    - "A fix's reach at desktop width is measured: the box of every rendered element before and after, compared, and the unfixed state re-created on the fixed tree by an inline style to show that nothing else differs"
    - "A row that clips is checked by boxes: the control inside the row and the viewport, beside the label, and the label's content inside the label"

key-files:
  created:
    - apps/frontend/src/lib/components/input/Input.labelWrap.svelte.test.ts
  modified:
    - apps/frontend/src/lib/components/input/shared.ts
    - tests/tests/specs/perm/perm-organization-editing.spec.ts
    - tests/tests/fixtures/contestant/contestantProfilePage.fixture.ts
    - tests/tests/fixtures/shared/pageGeometry.fixture.ts
    - tests/README.md

key-decisions:
  - "The fix is one utility on one constant, `whitespace-normal` on `inputLabelClass`, as the precedent's was on one label"
  - "`overflow-wrap: anywhere` was tried beside it, measured and taken out: it broke one-word labels in two"
  - "The candidate's profile is asserted on the organization-editing dataset's candidate, because the base dataset's candidate overflows at 320 px for another cause"
  - "The closing full run was not made: the phase's driver refused to start it on the Docker VM's free space"

requirements-completed: []

duration: about 80 min
completed: 2026-10-09
status: blocked
---

# Phase 175, between plans 12 and 13: the profile page's phone-width overflow — Summary

**An organization's profile no longer overflows at 320 or 390 px: the label inside an `Input` row takes `whitespace-normal`, proven by a red control of four tests and a green run of the same four, with the six gate rows green on the committed tree. The closing full E2E run was NOT made: the phase's driver refused to start it because the Docker VM had 13.76 GiB free against its 13.8 GiB floor, and nothing I am allowed to do frees space. A candidate's profile on the base dataset has a second, different overflow of 8 px at 320 px, which is reported and not fixed.**

Everything below was measured in this session unless it says "read" or "not measured".

## Read this first: what is not done

1. **The full default E2E run on the committed tree does not exist.** `175-e2e.sh 175-12-overflow-close` exited 3 at its free-space guard: `only 13.76 GiB free in the Docker VM (floor 13.8 GiB) -- stop and report`. Its own `docker builder prune -af` had run first and reclaimed nothing (`docker system df`: build cache 0 B). Seven readings over the following six minutes fell from 14431208 to 14431000 KiB against a floor of 14470349 KiB: 38 MB short, and falling by about 40 KiB a minute. The run directory `tests/e2e-runs/175-e2e/175-12-overflow-close` holds only `done` (3); the next attempt is `175-12-overflow-close-r2`.
2. **So the criterion "0 failed, 0 flaky, 0 skipped, 0 did not run in a full run" is unmet**, and the comparison with `175-12-close` was not made. A run that was not made is not evidence either way. What exists is narrower and is set out under *The runs*: a run restricted to `perm-organization-editing`, 194 tests in 88 projects, all passed, on a tree whose six changed files are the committed ones.
3. **Where the space is** (read, nothing changed): the local stack's storage volume holds 9477 MB while the database's `storage.objects` rows name 327 objects of 174 MB in all, so about 9.3 GB of it is more than the rows account for. What those files are was not looked into. The database's WAL is 480 MB, held by the realtime replication slot (464 MB behind). Each run of the 88-project slice took 60 to 70 MB of the VM that no prune gives back: 14.12 GiB at the first run of this session, 13.85 at the last. Freeing any of it is the operator's: it is the storage volume, the stack or Docker itself.
4. **A candidate's profile on the base dataset is 8 px wider than the viewport at 320 px**, before and after this fix, for a cause that is not a label (below, and `deferred-items.md` item 4). 1.4.10 Reflow fails on that page at that width.

## The cause, confirmed

Runs `175-12-overflow-probe-base` and `175-12-overflow-probe`: uncommitted probe tests appended to two specs, run through the wrapper on the unfixed tree, at 320, 390 and 1280 px in `en`, `fi` and `sv`.

**The chain, on organization B's profile at 320 px** (the same values on organization A's):

| Element | Width | Computed |
|---|---|---|
| the label `[QU-INFO-ORG-LOCKED] Registration number` | 234 | `white-space: nowrap`, `min-width: 64px`, `flex: 0 1 auto` |
| its row (`inputContainerClass`) | 383.8 | `overflow-x: hidden`, `min-width: auto` |
| the control's container | 127.9 | `flex: 1 1 auto` |
| the locked field | 95.9 (276 to 371.8) | |
| the `InputGroup`'s `<fieldset class="mt-lg">` | 383.8 (20 to 403.8) | `min-inline-size: min-content` |
| the section that holds it | 280 | |

`scrollWidth − clientWidth` of the document: **84 at 320 px, 15 at 390 px, 0 at 1280 px**, the same in the three locales and for both organizations.

**The throwaway changes, each an inline style set and taken off again** (the readings returned to 84 and 15 after each):

| Change | Overflow at 320 / 390 | The row | The locked field |
|---|---|---|---|
| none | 84 / 15 | 383.8 wide | 276 to 371.8: beyond the viewport at 320 |
| `white-space: normal` on that one label | **0 / 0** | 280 × 64.8, the label in three lines of 165.3 (at 390: two lines of 211.6) | 207.3 to 268: inside the row and the viewport |
| `min-width: 0` on the fieldset, the label untouched | 0 / 0 | 280 wide, the label's box 165.3 with its one line still 330 wide | 207.3 to 268 |
| `min-width: 0` on the label alone | 84 / 15 | unchanged | unchanged |

So the suspected property is the one: the label's `nowrap` is what the fieldset's least width is made of, and letting that one label wrap removes the overflow with the control still on screen.

**Two things the report this work started from had inferred, and the measurement corrects:**

- *"`min-w-0` on the fieldset alone would cut the row's control off; in a 280 px row the control would begin at 256."* It does not move the control out of view: with the fieldset free to shrink the field lies at 207.3 to 268. What goes wrong instead is the label: its box is squeezed to 165 px, its one line stays 330 px wide, and 165 px of text run across the field until the row clips them. Not a fix either, for that reason.
- *The label was at its full width inside the group.* It was not: its box was 234 px for 330 px of text. Read on the fixed tree with the one line forced back by an inline style, which gave the unfixed tree's boxes again. The label's text already ran 96 px past its box, over the first 84 px of the field, at both phone widths.

**Why the label can be squeezed at all:** it carries `min-w-[4rem]`, an explicit least width, so a row shrinks it like any flex item. That is why the same label outside a group does not widen the page and overruns its control instead.

## A candidate's profile

| Profile | 320 | 390 | 1280 | What was found |
|---|---|---|---|---|
| the organization-editing dataset's candidate | 0 | 0 | 0 | no overflow before the fix, in three locales. Its in-row labels are short: the two names, the constituency, the election number, the state, the portrait |
| the base dataset's candidate | **8** | 0 | 0 | the same in three locales, and **the same after the fix** |

The base candidate's 8 px are not this defect. With every in-row label set to `white-space: normal` the reading stayed 8. The elements beyond the viewport are the last of the three 56 px buttons of each row of the multiple-text info question: the row is the language label (64 px and 20 px of margin, kept while it is transparent), the field at its narrowest (48 px) and a button group that does not shrink (172 px), 308 px in a 280 px column. `deferred-items.md` item 4.

What the base candidate's profile did have of this defect is the other face of it: six info-question labels whose one line was wider than their box, running across their controls, at 320 px (230 to 542 px of text in boxes of 158 to 204 px) and at 390 px, and one of them at 1280 px (542 px in 446 px).

## What was changed

`apps/frontend/src/lib/components/input/shared.ts`: `inputLabelClass` gains `whitespace-normal`, and its TSDoc says why. Nothing else in the application changed. Commit `64834c4e4`.

**The constant's users, each row layout read:**

| File | Element | Row |
|---|---|---|
| `Input.svelte` (branch 6: text, url, email, number, date, boolean, select, color) | `<label for>` | `inputContainerClass`: a flex line, `justify-between`, `overflow-hidden`; the control's container grows |
| `parts/ImagePart.svelte` | `<label>` | the same row; a 60 px high button |
| `parts/MultilingualTextPart.svelte` (`text-multilingual`) | one language label per field | the same row; the label is transparent while the translations are hidden |
| `parts/SelectMultiplePart.svelte` | the dropdown's `<label for>` | the same row |
| `parts/SelectMultiplePart.svelte` | a `<span>` per selected option | the same row with `!justify-end`, the container not growing |
| `parts/MultipleTextPart.svelte` (multilingual) | one language label per field | a plain `flex items-center gap-2` line |

**The pages that render `Input`** (`git grep` over `apps/frontend/src` for the four components and for imports of `$lib/components/input`): three, all in the Contestant App — the profile page, the question page (a textarea kind, whose label is above the field: no in-row label) and the settings page (one locked e-mail row). `QuestionInput` is rendered by the profile page alone. `PreviewAllInputs` is rendered by nothing. The Voter App and the Admin App render no `Input`; the instruction's "`Input` is used by every app" does not hold on this tree. The settings page was read, not opened in a browser.

**`overflow-wrap: anywhere` beside it: tried, measured, taken out** (run `175-12-overflow-probe-after`, kept as `after-anywhere`). It closes one more case, a label that is a single word wider than the room. And it broke what was whole: a row gives a label a few pixels less than its text before the control is at its narrowest, so at 320 px "Constituency", 93 px of text in an 89 px box, became "Constituenc" and "y". With `whitespace-normal` alone that label is as it was before the fix.

**The limit that leaves** (run `175-12-overflow-probe-after-r2`): with the locked row's label replaced by one 39-letter word, 296 px wide, an `en` page at 320 px is 50 px too wide again and the field ends at 337.5. At 390 px it is not. On a `fi` and an `sv` page the browser hyphenates the same word, because `html` carries `hyphens: auto`, and the overflow is 0. It is in the todo.

## Before and after

Run `175-12-overflow-probe-after-r2` on the fixed tree against `175-12-overflow-probe` on the unfixed one. Every in-row label computes `white-space: normal` on the fixed tree.

**An organization's profile, the row of the locked info question** (A and B, the three locales alike):

| Width | Overflow | The label | The locked field | The row |
|---|---|---|---|---|
| 320 | 84 → **0** | 234, one line → 165.3, three lines | 276 to 371.8 → 207.3 to 268 | 383.8 × 44 → 280 × 64.8 |
| 390 | 15 → **0** | 234, one line → 211.6, two lines | 276 to 371.8 → 253.6 to 338 | 383.8 × 44 → 350 × 44.5 |
| 1280 | 0 → 0 | 329.8, one line, unchanged | 703.8 to 896, unchanged | 576 × 44, unchanged |

No other row of either profile changed at 320 or 390 px: the label and the controls of the language rows, the constituency, the state, the logo and the colour are at the same place and of the same width. Every control of every in-row label lies inside its row and the viewport.

**The other pages, at 320 and 390 px:**

| Page | Overflow | What changed |
|---|---|---|
| the organization-editing candidate's profile | 0 → 0 | at 320 px in `en`, "Election Number" takes two lines beside an unmoved 123.5 px field (117 px of text in a 102.5 px box), the row is 0.5 px higher; in `fi` "Ehdokasnumero" is hyphenated into two lines; in `sv`, and at 390 px, nothing |
| the base candidate's profile | 8 → 8 at 320, 0 → 0 at 390 | six info-question labels wrap inside their boxes, in two or three lines, where they ran across their controls; no control moved sideways; the page is 64 px longer at 320 px and 23 px at 390 px |
| the question page, organization A's and the base candidate's | 0 → 0 | nothing: the page holds no in-row label; 0 of 84 and of 89 boxes differ |

## At 1280 px: nothing moved that should not

The rule is Phase 174.1's: nothing changes except a label wrapping inside its column where it is wider than the column. Measured as the box of every rendered element of the page, before and after, in the three locales the dataset and the app have (`en`, `fi`, `sv`; none is treated as the longest, all three were measured).

| Page | Elements | Differ | Sideways |
|---|---|---|---|
| organization A's profile | 169 | 0 in each locale | 0 |
| organization B's profile, translations shown | 176 | 0 in each locale | 0 |
| the organization-editing candidate's profile | 127 | 0 in each locale | 0 |
| organization A's question page | 84 | 0 | 0 |
| the base candidate's question page | 89 | 0 | 0 |
| the base candidate's profile | 273 | 179 in each locale | **0** |

The base candidate's 179: one label, `[qu-info-multipleChoiceCategorical] Info: pick multiple categories that apply.`, takes two lines in its 445.5 px box, where its 542 px line ran under the select beside it. Its row is 0.5 px higher (44 → 44.5), so 163 boxes below it lie 0.5 px lower, 13 that contain it are 0.5 px higher, two differ by 0.3 px and one is the label itself. No box changed its left edge or its width, and the select is at 819.5, 100.5 wide, as before. That is the rule's own exception.

**That nothing else differs** was read a second way: on the fixed tree, with every in-row label forced back to one line by an inline style, the boxes of organization A's, the candidate's and the base candidate's profile are those of the unfixed tree at every width and locale (0 differ). On organization B's profile up to three boxes differ under that comparison: the path of the icon inside the translations toggle, which the toggle swaps when pressed, and the menu drawer's two fixed layers, whose recorded top is the scroll offset. None is a row.

**The `visual-regression` project** (outside the default suite) holds four baselines, read in `visual-regression.spec.ts` and `tests/README.md`: the voter results and the candidate's preview, each at desktop and at phone size. Neither surface renders an `Input`: no file under the preview route or the voter routes imports the input components. No baseline holds a surface this touches, and none was regenerated.

## The tests

**Component** — `Input.labelWrap.svelte.test.ts`, 13 cases: every kind of `Input` that renders an in-row label (twelve kinds, and the multilingual kind again with the translations shown) renders the expected number of such labels, and each carries `whitespace-normal` and no utility that breaks a word. A DOM without layout cannot show a wrap; what the cases hold is that no kind is left out of the shared class. On the unfixed constant: 13 failed, each on `to include 'whitespace-normal'` (`tests/e2e-runs/175-unit/175-12-overflow-labelwrap-red.json`); on the fixed one: 13 passed (`-green.json`).

**E2E** — in `perm-organization-editing.spec.ts`, in the two phone describes (320 and 390 px, the phone descriptor). Commit `1d6559c10`.

| Session | Title | Asserts |
|---|---|---|
| B | `phone: an editable profile with every translation shown fits the viewport, and its empty colour field and its locked info question fit their rows` | the page's width; the colour row; the locked info question's row |
| A | `phone: a locked profile with a long name and a colour fits the viewport, and its colour field and its locked info question fit their rows` | the same, with a 100-character name stored and shown |
| candidate | `phone: a candidate's profile fits the viewport, and its name fields fit their rows` | the page's width; the rows of the first and the last name |

The first two replace the two colour-row tests plan 12 committed; the third is new. Six tests, two more than before: the project holds 46.

**The row check** (`expectLockedInfoRowFits`, `expectPersonNameRowsFit`): the control and the label lie wholly inside the row, they do not overlap, the control lies between the viewport's edges, and the label's content does not reach beyond its own box. The row clips, so the page's width alone does not show a control pushed out of it. `pageGeometry.fixture.ts` gained `expectWithinViewportWidth` and `expectShowsWholeText` for it.

**Why the candidate is the organization-editing dataset's.** `contestant-terms-gate-phone` and the base candidate's stored session would have served without new setup, and the probe ran there. A page-width assertion on that profile is red at 320 px for the multiple-text cause, with or without this fix, and no red test is committed.

## The runs

All through `tests/scripts/e2e-run.sh` directly, in the background, on uncommitted trees, with `--project perm-organization-editing` unless noted; AC power at 100 %; no void marker; no Sleep entry after 19:37 local on the day before; the largest heartbeat lateness of a run 42 to 121 ms.

| Label | Tree | Result | Verdict |
|---|---|---|---|
| `175-12-overflow-probe-base` | unfixed, probe tests in `contestant-terms-gate-phone.spec.ts`; `--project contestant-terms-gate-phone` | 9 passed | a measurement, not judged |
| `175-12-overflow-probe` | unfixed, probe tests in both specs | 204 passed | a measurement, not judged |
| `175-12-overflow-control` | the tests and fixtures, **no fix** | **4 failed**, 190 passed | `control … --red` **PASS** |
| `175-12-overflow-probe-after` | the fix with `overflow-wrap: anywhere`, tests, probe | 206 passed | a measurement of the variant that was taken out |
| `175-12-overflow-probe-after-r2` | the final fix, tests, probe | 206 passed | a measurement, not judged |
| `175-12-overflow-precommit` | the final fix and the tests, as committed | **194 passed**, 0 failed, 0 flaky, 0 skipped, 0 did not run; 88 projects | `control … --green --were-red-in 175-12-overflow-control` **PASS** |

**The red control**, as the verdict printed it (`175-12-overflow-control.verdict.txt`): the four tests named by the two titles, at 320 and at 390 px, each `Error: the document must not be wider than its viewport`; `4 test(s) named …; 190 other test(s)`. The candidate's two tests are among the 190: that profile fitted before the fix.

**The green proof** (`175-12-overflow-precommit.verdict.txt`): `perm-organization-editing: 46 test(s), 46 passed`, and each of the four `was red, now passed`. The spec and the fixtures are byte-identical in the two runs (`cmp`). The six files were last written before the proof's launch and committed unedited, and the spec the proof ran is `HEAD`'s (`cmp`); `HEAD` is tree-equal to `1d6559c10` outside `.planning/`.

**What that proof covers and does not.** The slice holds every spec that opens a profile page: `perm-organization-editing` (its 18 scans among the 46), `contestant-a11y-scan` (22 of 22), `contestant-journey`, `perm-answers-locked` and `perm-localisation-positive`. Outside it are 22 projects and 74 tests of the full run, none of which opens a page that renders an `Input`, by a search of the specs. That is a reading, and it is not the full run.

## The gate rows

`175-gates.sh 175-12-overflow-close --rows typecheck,lint,unit,check-frontend,build,format`, on the committed tree at `1d6559c10`, driver exit 0; `175-verdict.mjs gates … --rows …` **PASS** (`not stale`, `no Sleep entry inside the run window`).

| Row | Exit | Seconds | Numbers |
|---|---|---|---|
| typecheck | 0 | 18 | |
| lint | 0 | 44 | |
| unit | 0 | 63 | frontend 182 files passed, 1 skipped; **3146 tests passed**, 16 skipped (3133 and 181 files at `175-12-close`: 13 more tests in 1 more file); dev-seed 1037; supabase 462; data 244; app-shared 148; the harness's own 7 files / 102 tests |
| check-frontend | 0 | 8 | |
| build | 0 | 15 | |
| format | 0 | 17 | |

## The code review checklist

| Item | Outcome |
|---|---|
| Solves the issue | the organization profile's overflow: yes, measured. The phase's truth about that page holds at 320 and 390 px. The full run that would close it was not made |
| OWASP top 10 | one class on a constant and test code; no input, endpoint or stored value changes |
| Code style guide | TSDoc on the constant, on the five new fixture steps and on the test's helpers; `Array<T>`; explicit return types |
| No `any` | none |
| No repetition | **finding, not fixed:** `expectWithinViewportWidth` is a second "inside the viewport" measure beside the one in `contestantTermsOfUsePage.fixture.ts`, as the page-width measure already is. The component test's context mock is the block its four neighbours hold |
| New entities documented | yes |
| Repo markdown | `tests/README.md`, the project's row |
| Tracking events | nothing a user can perform is added |
| New Svelte components | none |
| Errors handled | the row step throws by name when a control has no `id` |
| Failing checks | none on the committed tree, of those that ran |
| Parts sharing the dependency | the six elements and three pages above; five specs that open a profile page are green in the slice |
| WCAG A and AA | 1.4.10 holds on an organization's profile at 320 px. **It fails on a candidate's profile that holds a multiple-text question, at 320 px, by 8 px** (not this defect, not fixed). The 18 scans of the spec and the 22 of `contestant-a11y-scan` are green on the fixed tree |
| Keyboard and screen reader | no element, attribute or order changes; the label still names its control by `for` |
| Docs guides | no page under `apps/docs/src` names the constant or the utility. No `@component` docstring changed, so the generated listing is as it was |
| Comment hygiene | every added comment read; `yarn assert:comment-hygiene` exit 0 before each commit |
| Commit history | linear; the fix before the tests |
| No fixes of itself | two commits, one concern each |
| Formatting in its own commit | Prettier re-aligned the README's table because one cell grew; it rides with the cell |
| `[db]` tag, backend, adapter and Edge Function sections | name nothing this touches |

## Choices and deviations

1. **The closing full run is absent** (the first section).
2. **One utility was tried and removed before anything was committed** (`overflow-wrap: anywhere`), on a measurement. The component test asserts its absence.
3. **The candidate's profile is not the base dataset's**, for the reason above.
4. **The two colour-row tests were replaced, not kept beside the new ones:** the new titles assert the colour row too.
5. **The probe ran three times on the fixed-or-unfixed tree where the method names two reads**: once more because the first fix was changed.
6. **The base candidate's `-before` files were written twice**, by the 9-test run and again by the 204-test run that holds the same probe; the second is what the comparison read.
7. **No state file was edited**, by instruction; nothing was appended to `.planning/WINDOWS.md`. This file's first section is what would go there, as an unrun verify.
8. **The components skill was not edited:** no component was added, removed, renamed or moved, and none of its counts changed.

## For the orchestrator and plan 175-13

- **Free the VM, then:** `bash $P/175-e2e.sh 175-12-overflow-close-r2 --require-project perm-organization-editing --require-project contestant-a11y-scan`, judged by `node $P/175-verdict.mjs e2e 175-12-overflow-close --same-projects-as 175-12-close --except perm-organization-editing=2 --expect-project perm-organization-editing --expect-project contestant-a11y-scan --expect-title-count "perm-organization-editing::axe accessibility scan=18"`. Expected 268 tests in 110 projects: 266 and the candidate's two. Plan 13's own closing run is the same suite on the same tree and would serve, if no commit outside `.planning/` comes between.
- **The slice costs 60 to 70 MB of the VM a run** and the determinism batch of plan 13 runs it several times.
- **The 9.3 GB of the storage volume that no row accounts for** were there before this session. The suite has a `storage-cleanup` project; whether a teardown or a reset leaves files behind was not looked into.
- **Operator decision B5** asks whether the fix is kept. What it should also know: a two-word label a few pixels too wide for its share of a row now takes two lines at 320 px ("Election Number"); item 5 of `deferred-items.md` says what would prevent that and what it would cost.
- **The nominations block** of the profile is a group of the same component: its rows are inside a `<fieldset>`, so a long election-list or constituency label there is covered by this fix, and a long single word is not.

## Evidence

Under the ignored `tests/e2e-runs/`:

- `175-e2e/175-12-overflow-probe-base`, `-probe`, `-control`, `-probe-after`, `-probe-after-r2`, `-precommit`: the run directories, each with its `.launched`, `.log` and `.wrapper-exit`; `-control` and `-precommit` with `.evidence.log`, `.verdict.txt` and the spec as run (`.spec.ts`); `175-12-overflow-control.fixtures.diff`.
- `175-e2e/175-12-overflow-probe.data/`: `before/`, `after/` and `after-anywhere/` (one JSON per page, width and locale), the probe helper, the two appended test blocks, `compare.cjs` and its output `compare-final.txt`.
- `175-e2e/175-12-overflow-close` (the refused attempt), `.log`, `.exit`, `.launched`.
- `175-gates/175-12-overflow-close`, `.log`, `.exit`, `.verdict.txt`.
- `175-unit/175-12-overflow-labelwrap-red.json`, `-green.json`.

## The state the local stack is left in

No reset, no restart, no prune beyond the drivers' own `docker builder prune -af`. No dev server is left running and nothing listens on the wrapper's port. The probe tests are in no file: the two specs were restored and the helper removed. The E2E project's rows were torn down by each run; the default project holds the `default` dataset as the gate's `unit` row left it. Read-only commands were run against the database and the storage container to size them.

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

- The created file and the five modified files exist.
- `64834c4e4`, `1d6559c10` and `995567049` are ancestors of `HEAD`.
- `175-12-overflow-control.wrapper-exit` holds 1 and its verdict file ends `--red: PASS`; `175-12-overflow-precommit.wrapper-exit` holds 0 and its verdict file ends `--green: PASS`; `175-gates/175-12-overflow-close.exit` holds 0; `175-e2e/175-12-overflow-close.exit` holds 3.
- `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` have no change of this work's.

## The closing full run, made afterwards by the orchestrator (2026-10-09)

The run this record reports as not made was made once space was freed, on the same committed tree.

- **Space.** The orchestrator removed eight Docker images that no container used — seven Supabase
  service images of superseded versions (storage-api v1.41.8, edge-runtime v1.71.0, logflare 1.34.7,
  realtime v2.78.10, vector 0.28.1-alpine, gotrue v2.187.0, studio 2026.03.04-sha-0043607) and
  `postgres:15.8.1.085`. Free space in the Docker VM went from 14430832 KiB to 20348784 KiB against the
  driver's floor of 14470349 KiB. No container was stopped or restarted (24 running before and after),
  nothing was pruned from a volume, and no reset was run. The storage volume's unaccounted 9.3 GB is
  untouched.
- **Run.** `bash 175-e2e.sh 175-12-overflow-close-r2 --require-project perm-organization-editing
  --require-project contestant-a11y-scan`, head `bb68d4e33` (tree-equal to HEAD outside `.planning/`),
  AC power, driver exit 0, wrapper exit 0, no Sleep entry in the window, no void marker. **268 passed,
  0 failed, 0 flaky, 0 skipped, 0 did not run; 110 projects.** `perm-organization-editing` 46 of 46,
  `contestant-a11y-scan` 22 of 22.
- **Verdict.** `175-verdict.mjs e2e 175-12-overflow-close --same-projects-as 175-12-close --except
  perm-organization-editing=2 --expect-project perm-organization-editing --expect-project
  contestant-a11y-scan --expect-title-count "perm-organization-editing::axe accessibility scan=18"`:
  exit 0, PASS. 110 projects compared, 0 not as expected: 109 equal to their `175-12-close` totals,
  `perm-organization-editing` 46 against 44. The label resolved to the `-r2` attempt; the first
  attempt's directory holds only the driver's refusal.
- This was the first attempt at the run itself. The 22 projects and 74 tests outside the pre-commit
  slice are now run, not read.

The per-project baseline for plan 175-13 is `175-12-overflow-close` (268 in 110).
