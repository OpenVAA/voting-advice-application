---
phase: 134-a11y-contrast-i18n-catalog-boolean-answer-defect-closure
plan: 06
subsystem: testing
tags: [playwright, e2e, regression-lock, i18n, a11y, accessible-name, boolean-answer]

# Dependency graph
requires:
  - phase: 134-03
    provides: "the 7 runtime i18n catalog keys whose rendered text/accessible names these assertions lock"
  - phase: 134-05
    provides: "the `isEmptyValue` guard in the candidate questions overview that step 18.6's falsy-boolean walk proves"
provides:
  - "E2E text assertion locking `questions.multiChoice.selectRange` (candidate-journey step 18.5)"
  - "E2E regression lock for FIX-03: the candidate journey now saves a boolean `false`, reloads, and asserts the overview renders it as answered with an edit call to action (step 18.6)"
  - "E2E accessible-name assertions for `components.multipleTextInput.{add,moveUp,moveDown,remove}` (candidate-journey step 13)"
  - "E2E accessible-name assertion for `components.accordionSelect.listboxAriaLabel` (voter-journey results election accordion)"
  - "Negative-control evidence that the FIX-03 lock actually fails on an unfixed build"
affects: [134-07, 134-08]

actuals:
  tokens: 41000
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Intersecting a testid locator with a role locator (`locator.and(page.getByRole('listbox'))`) when the component spreads restProps onto the role-bearing element itself — a descendant search would find nothing"
    - "Negative-control run: temporarily revert the product fix, confirm the new E2E assertion goes RED at the expected step, restore, re-run green — the only way to show a lock is a lock rather than a description"

key-files:
  created: []
  modified:
    - tests/tests/specs/candidate/candidate-journey.spec.ts
    - tests/tests/specs/voter/voter-journey.spec.ts

key-decisions:
  - "Task 1's `-g \"18.5\"` acceptance command is unrunnable — 18.5 is a `test.step`, not a test title — so Task 1 was verified with the full `--project=candidate-journey` run instead (a `-g` filter would have produced a did-not-run, which counts as a failure)"
  - "Ran a negative control for FIX-03 rather than trusting a green run: the pre-fix guard was temporarily restored and step 18.6 failed as designed, proving the lock discriminates"
  - "The results election listbox is asserted via `electionAccordion.and(page.getByRole('listbox'))` because AccordionSelect spreads `data-testid` onto the `role=listbox` div itself"
  - "No assertion added for `questions.multiChoice.selectExact` — no seeded question has an equal min/max, so it has no E2E path; Plan 03's build-time render proof remains its only coverage"

patterns-established:
  - "A spec comment that documents a live product defect is deleted in the same change that fixes the defect — leaving it turns a fixed bug into misinformation"

requirements-completed: [FIX-02, FIX-03]

coverage:
  - id: D1
    description: "The multi-choice helper's TEXT is asserted (not just its visibility); the obsolete BLOCKER-130-05 note is gone"
    requirement: FIX-02
    verification:
      - kind: e2e
        ref: "candidate-journey step 18.5 — `await expect(helper).toHaveText(/2.*3/)`; `npx playwright test --project=candidate-journey --workers=1` → 5 passed"
        status: pass
      - kind: other
        ref: "grep -c 'BLOCKER-130-05' … → 0; grep -c '/2.*3/' … → 1"
        status: pass
    human_judgment: false
  - id: D2
    description: "A candidate answering a boolean opinion question with the falsy option sees it rendered as answered on the overview, through the real save → reload → render path"
    requirement: FIX-03
    verification:
      - kind: e2e
        ref: "candidate-journey step 18.6 — `selectChoice(0)` (→ `false`), then card visible + `question-choice` markup visible + card action matches /edit/i; 5 passed"
        status: pass
      - kind: e2e
        ref: "NEGATIVE CONTROL — product guard temporarily reverted to `if (!localizedAnswer?.value)`; run went 1 failed / 4 passed, failing at step 18.6 line 896. Guard restored, re-run 5 passed."
        status: pass
    human_judgment: false
  - id: D3
    description: "The four MultipleTextInput controls carry translated accessible names on a path a spec already walks"
    requirement: FIX-02
    verification:
      - kind: e2e
        ref: "candidate-journey step 13 — toHaveAccessibleName('Add item'|'Move up'|'Move down'|'Remove item'), scoped to the multipleText question; 5 passed"
        status: pass
    human_judgment: false
  - id: D4
    description: "The results election listbox carries a translated accessible name instead of the raw dotted key path (WCAG 2.1 AA)"
    requirement: FIX-02
    verification:
      - kind: e2e
        ref: "voter-journey `expectElectionOptionAndSelect` — toHaveAccessibleName('Select an option'); `--project=voter-journey --workers=1` → 4 passed"
        status: pass
    human_judgment: true
    rationale: "The assertion proves the string reaches the accessible name. Whether the wording is the right announcement for a screen-reader user is a human call (same caveat Plan 03 recorded for D3)."

# Metrics
duration: 24min
completed: 2026-08-10
status: complete
---

# Phase 134 Plan 06: E2E Regression Locks for FIX-02 / FIX-03 Summary

**The two workarounds Phase 130 left behind because the product was broken are now the locks: step 18.5 asserts the multi-choice helper's actual text, and step 18.6 deliberately saves a boolean `false` and proves the overview renders it as answered — verified by a negative control that put the pre-fix guard back and watched the step go RED.**

## Performance

- **Duration:** ~24 min
- **Tasks:** 3/3
- **Files modified:** 2 (both spec files; no product code, no new spec file)

## Environment: dev server restarted before any reported result

**Yes — explicitly.** The vite dev server on `:5173` (pid 19982, started 1:29 pm) was killed and
`yarn dev` relaunched from scratch **before any Playwright run in this plan**. This matters because
waves 1–4 changed product code (`app.css`, `ConstituencySelector`, `NumericEntityFilter`,
`questions/+page.svelte`) and the runtime i18n catalog (`apps/frontend/messages/**`), and Vite HMR is
documented in this repo to serve stale SSR modules mid-debug. The relaunch log shows the full cold
path — `dev:clean` wipe, shared-package rebuild, and crucially
`✔ [paraglide-js] Compilation complete (locale-modules)` followed by
`VITE v6.4.1 ready in 2522 ms` — so every assertion below was evaluated against a freshly compiled
Paraglide catalog, not a cached one. Exactly one server ran on `:5173` at all times (`lsof -ti:5173`
confirmed the port free between kill and relaunch).

`yarn db:reset` was run after the relaunch, so the first Playwright run started from a clean database.
Each subsequent run re-seeds through `data-setup-base` (teardown + `e2e/base` import) and tears down
after, so no run inherited the previous run's candidate answers — which is what the plan's step-18.6
precondition requires.

## Task Commits

1. **Task 1: Restore the withheld multi-choice helper content assertion (step 18.5)** — `741d92693` (test)
2. **Task 2: Convert step 18.6 into the FIX-03 boolean-answer lock** — `2c47d2726` (test)
3. **Task 3: Accessible-name locks for the remaining newly-translated keys** — `4b9c5ffa2` (test)

## What changed

### Task 1 — step 18.5 (`candidate-journey.spec.ts`)

Deleted the twelve-line `BLOCKER-130-05` note that explained why a content assertion was withheld,
replaced it with a two-line comment naming the assertion as the FIX-02 lock, and added
`await expect(helper).toHaveText(/2.*3/)` immediately after the existing visibility assertion.
Net: 5 insertions, 12 deletions.

No `selectExact` assertion was added, per the plan and Plan 03's finding: the seeded multi-choice
question carries a 2..3 window, so it renders `selectRange`. There is no E2E path to the exact
variant.

### Task 2 — step 18.6 (`candidate-journey.spec.ts`)

`selectChoice(1)` → `selectChoice(0)`. `OpinionQuestionInput` synthesizes boolean choices as
`[{id:'no'}, {id:'yes'}]` (`OpinionQuestionInput.svelte:127-130`) and the onChange adapter maps
`d.value === 'yes'`, so index 0 saves `false` — the exact value the old truthiness guard discarded.

The eight-line comment quoting the removed guard was deleted and replaced with a three-line note
stating the step is the FIX-03 lock. Both pre-existing post-reload assertions were kept, and the
discriminating assertion was added:

```ts
await expect(boolCard.first().getByTestId(testIds.candidate.questions.cardAction)).toHaveText(/edit/i);
```

The card action's text is the discriminator because the button renders one of three labels
(`+page.svelte:170-175`): `Answer this question` when `answer == null`, `Edit Your Answer` when
answered, `View Your Answer` when locked. `/edit/i` matches only the answered label.

### Task 3 — step 13 + the voter results accordion

Four `toHaveAccessibleName` assertions after `fillMultipleTextQuestion`, scoped to the multipleText
question via the fixture's `getQuestion(label)` and located through `testIds` constants (zero raw
`'multiple-text-*'` literals — the selector-catalogue rule holds: `grep -cE "'multiple-text-"` → 0).

I read `MultipleTextInput.svelte:157-212` first, as the plan required. The finding corrects the
plan's stated expectation: **all three per-row controls always render**; only their `disabled`
attribute is conditional (`disabled={isDisabled || index === 0}` for move-up, etc.). The add control
is the genuinely conditional one (`{#if !isDisabled}`). With two rows filled, all four testids are
present, and a `disabled` button is still in the accessibility tree, so all four names are
assertable. Move-up/move-down/remove are asserted on `.first()` (row 0).

For the voter side, `AccordionSelect` spreads `restProps` — which carries `data-testid` — onto the
`role="listbox"` div **itself** (`AccordionSelect.svelte:81-84`), so
`electionAccordion.getByRole('listbox')` would search descendants and find nothing. The assertion
intersects instead:

```ts
const electionListbox = electionAccordion.and(page.getByRole('listbox'));
await expect(electionListbox).toHaveAccessibleName('Select an option');
```

It sits inside `expectElectionOptionAndSelect`, which the journey already calls five times
(lines 488, 951, 952, 953, 1679) — no new spec, no new walk.

## Ripple check for steps 19 and 21 (required record)

**Outcome: no ripple. Neither step needed a change, and both pass in the same run as the flipped 18.6.**

- **Step 19 (`walkRemainingOpinionQuestions` → home shows completed + preview enabled):** unaffected,
  as the plan predicted. Completion is gated on `candCtx.unansweredOpinionQuestions`, which
  `candidateContext.svelte.ts` computes with `isEmptyValue` — and `isEmptyValue(false)` is `false`,
  so a saved `false` counts as answered. The walk therefore still skips the boolean question, the
  profile-complete gate still flips, and `expectTasks({enabled:['profile','opinions','preview']})`
  still holds. Step 20's completion-message assertion (which depends on `completion === 'full'`)
  likewise passes.
- **Step 21 (preview assertions):** re-read at `candidate-journey.spec.ts:965-995`. It asserts
  **only** `expectOpinionAnswer(/\[qu-opin-base-1-likert5\]/, 1)` for opinion answers — the likert
  question edited in step 18. It does **not** assert any label for `qu-opin-base-5-boolean`, truthy
  or otherwise. **No update was needed**, so nothing was changed there.

Both conclusions are backed by execution, not reading: the full `candidate-journey` project ran green
after the flip (steps 18.6, 19, 20 and 21 all live in the same single serial test, so a cascade would
have surfaced immediately).

## Negative control — proving the FIX-03 lock is a lock

A green run only shows the assertion passes on a fixed build. To show it *fails* on an unfixed one,
the Plan-05 guard in `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte` was
temporarily reverted to the pre-fix shape and the journey re-run:

```
if (!localizedAnswer?.value) return undefined;      // pre-fix guard, temporarily restored
```

```
1) [candidate-journey] › candidate-journey.spec.ts:364:3 › full candidate journey end-to-end
   › 18.6. D-02: categorical + boolean opinion — type-specific input contracts
   Error: expect(locator).toBeVisible() failed
   Locator: getByTestId('candidate-questions-card')
            .filter({ hasText: /\[qu-opin-base-5-boolean\]/ }).first()
            .getByTestId('question-choice').first()
   Expected: visible
   Error: element(s) not found
   > 896 |  await expect(boolCard.first().getByTestId('question-choice').first()).toBeVisible();

  1 failed
  4 passed (28.4s)
```

The guard was then restored with `git checkout -- <that one file>` (the only file touched; verified
back to `isEmptyValue(localizedAnswer?.value) || localizedAnswer == null` at line 63, and
`git status --short` clean of product changes) and the journey re-run to green. **Step 18.6 now fails
on an unfixed build and passes on a fixed one — it is a regression lock, not a description.**

## Which of the seven keys is covered by which mechanism (required record)

| # | Key | Mechanism | Where |
|---|---|---|---|
| 1 | `questions.multiChoice.selectRange` | **E2E text assertion** | candidate-journey step 18.5 — `toHaveText(/2.*3/)` |
| 2 | `questions.multiChoice.selectExact` | **Plan 03 build-time render check only** | no E2E path exists (no seeded question has equal min/max) |
| 3 | `components.accordionSelect.listboxAriaLabel` | **E2E accessible-name assertion** | voter-journey `expectElectionOptionAndSelect` |
| 4 | `components.multipleTextInput.add` | **E2E accessible-name assertion** | candidate-journey step 13 |
| 5 | `components.multipleTextInput.moveUp` | **E2E accessible-name assertion** | candidate-journey step 13 |
| 6 | `components.multipleTextInput.moveDown` | **E2E accessible-name assertion** | candidate-journey step 13 |
| 7 | `components.multipleTextInput.remove` | **E2E accessible-name assertion** | candidate-journey step 13 |

Five keys by E2E accessible-name assertion, one by E2E text assertion, one (`selectExact`) still
carried only by Plan 03's point-in-time build proof. That last one is a standing gap, not a new one —
Plan 03 already flagged it; closing it needs either a seeded exact-1 question or a dedicated render
test.

## Verification Results

| Check | Command | Result |
|---|---|---|
| Task 1 blocker note removed | `grep -c 'BLOCKER-130-05' candidate-journey.spec.ts` | **0** |
| Task 1 assertion present | `grep -c '/2.*3/' candidate-journey.spec.ts` | **1** |
| Task 1 E2E | `npx playwright test --project=candidate-journey --workers=1` | **5 passed, 0 failed, 0 did-not-run (41.4s)** |
| Task 2 truthy workaround gone (18.6 block) | `awk 'NR>=858&&NR<=910' … \| grep -c 'selectChoice(1)'` | **0** |
| Task 2 falsy choice present | `awk 'NR>=858&&NR<=915' … \| grep -c 'selectChoice(0)'` | **2** (see deviation 2) |
| Task 2 cardAction assertion | `grep -c 'cardAction' candidate-journey.spec.ts` | **1** (the new assertion, matching `/edit/i`) |
| Task 2 E2E | `--project=candidate-journey --workers=1` | **5 passed, 0 failed, 0 did-not-run (32.6s)** |
| Task 2 negative control | same, product guard reverted | **1 failed / 4 passed — failed at step 18.6, as designed** |
| Task 2 E2E after restore | `--project=candidate-journey --workers=1` | **5 passed, 0 failed, 0 did-not-run (33.0s)** |
| Task 3 no raw selector literals | `grep -cE "'multiple-text-" candidate-journey.spec.ts` | **0** |
| Task 3 name assertions | `grep -c 'toHaveAccessibleName' candidate-journey.spec.ts` | **4** (≥1 required) |
| Task 3 listbox locators | `grep -c "getByRole('listbox'" voter-journey.spec.ts` | **2** (pre-existing + new) |
| Task 3 candidate E2E | `--project=candidate-journey --workers=1` | **5 passed, 0 failed, 0 did-not-run (31.4s)** |
| Task 3 voter E2E | `--project=voter-journey --workers=1` | **4 passed, 0 failed, 0 did-not-run (1.1m)** |
| Test typecheck | `yarn typecheck:tests` | **exit 0** |
| Lint | `yarn lint:check` | **exit 0** (2 pre-existing warnings in untouched files: `candidate-bank-auth-journey.spec.ts:208`, `mockOidcIssuerEntry.ts:33`) |
| Format | `yarn format:check` | **exit 0 — "All matched files use Prettier code style!"** |
| Working tree | `git status --short` | only `supabase/.temp/cli-latest` (pre-existing, left alone) |

Every E2E number above is a real run against the restarted dev server. No assertion was weakened, no
regex loosened, no `.skip`/`.fixme` added, no retry-until-green.

## Deviations from Plan

### 1. [Rule 3 — Blocking] Task 1's `-g "18.5"` verification command is unrunnable

- **Found during:** Task 1, reading the acceptance criteria against the spec's structure.
- **Issue:** `candidate-journey.spec.ts` contains exactly **one** `test()` — `'full candidate journey
  end-to-end'` at line 364. `18.5` is a `test.step` title, and Playwright's `-g` filters **test**
  titles, not step titles. `-g "18.5"` therefore matches zero tests. Per CLAUDE.md's E2E hard rule a
  did-not-run counts as a failure, so running the command as written would have produced a failure
  and no coverage.
- **Fix:** verified Task 1 with the full `npx playwright test --project=candidate-journey --workers=1`
  instead — a strict superset of what `-g "18.5"` intended, and the same command Tasks 2 and 3
  require. Result: 5 passed.
- **Impact:** none on coverage; the criterion's intent (step 18.5 executes and passes) is met more
  strongly.

### 2. [Reporting] Task 2's `selectChoice(0)` count is 2, not 1, in the stated line window

- **Found during:** Task 2 acceptance greps.
- **Issue:** the criterion expects `sed -n '858,910p' … | grep -c 'selectChoice(0)'` → 1. It returns
  **2**, because step 18.6 answers *two* questions: the categorical question at the top of the step
  already used `selectChoice(0)` before this plan, and the boolean question now uses it too. The
  window covers both.
- **Action taken:** none — the criterion's intent is satisfied exactly. The binding half of the pair
  (`grep -c 'selectChoice(1)'` → **0** in the same window) confirms the truthy workaround is gone, and
  the boolean block demonstrably selects index 0. Reported here rather than restated as a pass.

### 3. [Read-first correction] The plan's expectation about conditional MultipleTextInput controls

- **Found during:** Task 3's required read of `MultipleTextInput.svelte`.
- **Issue:** the plan says "the remove and move controls are conditional" and instructs asserting only
  the controls that actually render. In the current component, all three per-row controls render
  unconditionally inside the `{#each rows}` block — only their `disabled` attribute is conditional.
- **Action taken:** asserted all four names, since all four elements exist for a two-row list. This is
  a superset of what the plan's conditional-aware instruction would have produced, and it is verified
  by the passing run rather than by reading alone.

**Total deviations:** 1 blocking (unrunnable verification command, rerouted), 2 reporting/read-first
notes. No Rule 4 (architectural) questions arose. No product code was changed by this plan — the one
product edit made was the temporary negative control, reverted and verified.

## Issues Encountered

None beyond the deviations above. No flakes: five consecutive `candidate-journey` runs (three green,
one deliberately red under the negative control, one green after restore) all behaved deterministically,
and the single `voter-journey` run passed first time.

## Known Stubs

None.

## Threat Flags

None. This plan adds assertions inside existing authenticated E2E walks — no new credential path, no
new network surface, no packages installed (`yarn.lock` untouched). T-134-14 and T-134-15 are mitigated
by the assertions themselves (and T-134-14 specifically by the negative control, which demonstrates the
lock fails on a regressed build). T-134-16 is mitigated by the recorded, executed step-19/step-21 ripple
check.

## Outstanding for later plans

- **`questions.multiChoice.selectExact` still has no standing guard.** Plan 03's build-time render proof
  is a point-in-time check. Closing it needs a seeded exact-1 multi-choice question or a dedicated render
  test — out of scope here (D-11 forbids new spec files for coverage's sake).
- **Plan 08's gate is unaffected by this plan's runs.** D-15's 3× full-suite determinism standard is
  Plan 08's deliverable; this plan ran only the two journey projects it touches, as its own verification
  section specifies.
- **D-18 native-speaker review** of the 6 constructed non-English `selectExact` singulars remains Plan
  07's UAT item; nothing here changes that.

## Self-Check: PASSED

- `tests/tests/specs/candidate/candidate-journey.spec.ts` — FOUND
- `tests/tests/specs/voter/voter-journey.spec.ts` — FOUND
- `.planning/phases/134-…/134-06-SUMMARY.md` — FOUND
- Commit `741d92693` — found in `git log`
- Commit `2c47d2726` — found in `git log`
- Commit `4b9c5ffa2` — found in `git log`
- No file deletions in any of the three commits (`git diff --diff-filter=D HEAD~1 HEAD` empty)
- `.planning/STATE.md` and `.planning/ROADMAP.md` — **not modified** (orchestrator owns those writes)

---
_Phase: 134-a11y-contrast-i18n-catalog-boolean-answer-defect-closure_
_Completed: 2026-08-10_
