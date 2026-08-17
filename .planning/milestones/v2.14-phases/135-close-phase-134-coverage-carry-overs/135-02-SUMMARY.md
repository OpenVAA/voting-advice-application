---
phase: 135-close-phase-134-coverage-carry-overs
plan: 02
subsystem: testing
tags: [i18n, paraglide, mf2, plurals, dev-seed, playwright, e2e, regression-guard, multi-choice]
status: complete

requires:
  - phase: 134-03
    provides: "questions.multiChoice.selectExact as an MF2 plural declaration in all 7 runtime locales, with the en singular verified as `Select 1 option.`"
  - phase: 134-06
    provides: "The selectRange E2E lock (candidate step 18.5) as a shape precedent, and the negative-control discipline this plan follows"
  - phase: 129
    provides: "qu-opin-base-7-multichoice (2..3 window, D-07 range edge-coverage) and the multi-choice voter/candidate input paths"
provides:
  - "test-e2e-base-qu-opin-base-8-multichoice-exact — the first seeded question with an EQUAL selection window, so the running app can reach the `selectExact` branch at all"
  - "A standing E2E regression guard on `questions.multiChoice.selectExact`, proven to discriminate by two independent negative controls"
  - "selectSmallestValidMultiChoice — a constraint-agnostic multi-choice walk helper that reads validity off the app instead of copying a number out of the seed"
  - "A pinned Regional election in the numberScale probe, removing a latent dependency on a documented-as-non-deterministic walk behaviour"
affects:
  - "any future seeded multi-choice question with a new min/max window — both walks now handle it without edits"
  - "the e2e/base question set: MAIN opinion category is now 8 questions, base dataset 26 questions total"
  - "voter-journey walk length (+1 question, +1 delete in the min-answers gate sequence)"

actuals:
  tokens: 59000
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Read a multi-choice selection's validity off the APP (Save enabled / delete enabled) instead of hard-coding a count copied from the seed — the walk stays correct when a second window is authored"
    - "Assert a resolved i18n string EXACTLY, not by a regex the raw dotted key could also satisfy — a matcher that cannot fail is not a guard"
    - "Make a new seed row matching-NEUTRAL (identical value in every answer template) when its purpose is render coverage, so existing score/ranking assertions are preserved by construction rather than by luck"
    - "Prove a suspected regression by BISECTION (revert to the pre-change tree, re-run, restore, re-run) before deciding whether to fix or defer"

key-files:
  created:
    - "tests/tests/utils/multiChoice.ts"
  modified:
    - "packages/dev-seed/src/templates/e2e/base.ts"
    - "tests/tests/specs/voter/voter-journey.spec.ts"
    - "tests/tests/fixtures/voter/voter-journey.fixture.ts"
    - "tests/tests/fixtures/candidate/candidateQuestionPage.fixture.ts"
    - "tests/tests/specs/_probes/numberScale.probe.spec.ts"
    - ".planning/phases/135-close-phase-134-coverage-carry-overs/deferred-items.md"

key-decisions:
  - "base-8 carries minSelections 1 / maxSelections 1 (not 2/2): count=1 renders the MF2 countPlural=one branch, which holds the constructed non-English singulars (134 D-18) and is therefore the branch most worth guarding"
  - "base-8 is matching-NEUTRAL — every answer template gives it ['a'] — so it adds 1 to Dmax and 0 to every candidate's D. Ordering is preserved by a monotone transform, not by hoping the ranking assertions survive"
  - "The helper text is asserted as the EXACT string `Select 1 option.`, not a regex; /select/i would be satisfied by the raw key `questions.multiChoice.selectExact` that an unresolved lookup emits"
  - "Both multi-choice walks were decoupled from the hard-coded 'click 2'. Not optional: 2 clicks is over-max on base-8, which leaves candidate Save permanently disabled and silently drops the voter's answer"
  - "The numberScale probe was FIXED rather than deferred, because bisection proved this plan's change is what flipped it — the SCOPE BOUNDARY carve-out for issues directly caused by the current task"
  - "Two negative controls were run, not one: a value corruption (proves the plural form is locked) and a full key removal (proves the raw-key regression is caught)"

patterns-established:
  - "Constraint-agnostic multi-choice selection: click from index 0 until the app's own validity control enables, then hard-assert; strictly stricter than a fixed count, which never verified the answer registered"
  - "Seed additions intended for RENDER coverage get a matching-neutral value so they cannot perturb matching assertions"

requirements-completed: [GUARD-01]

coverage:
  - id: D1
    description: "`questions.multiChoice.selectExact` is rendered by the running app and asserted by the E2E suite — it has a standing regression guard, not only a build-time proof"
    requirement: GUARD-01
    verification:
      - kind: e2e
        ref: "tests/tests/specs/voter/voter-journey.spec.ts — expectExactOneMultiChoiceQuestionAndAdvance, asserted twice in `full voter journey end-to-end`; run via --project=voter-journey --workers=1"
        status: pass
    human_judgment: false
  - id: D2
    description: "The guard is proven to FAIL if the key regresses — by negative control, not by assuming"
    requirement: GUARD-01
    verification:
      - kind: e2e
        ref: "Negative control A (en singular corrupted) — Received: \"Select 1 CORRUPTED option.\"; Negative control B (key removed from all 7 locales) — Received: \"questions.multiChoice.selectExact\". Both failed at voter-journey.spec.ts:394"
        status: pass
    human_judgment: false
  - id: D3
    description: "Adding the question does not perturb any existing spec's assumptions about the seeded question set"
    requirement: GUARD-01
    verification:
      - kind: e2e
        ref: "yarn test:e2e — 134 passed (10.5m), 0 failed, 0 did-not-run; two consecutive clean runs, the second on the final code state"
        status: pass
    human_judgment: false
  - id: D4
    description: "Both multi-choice walks are constraint-agnostic, so a future question with any min/max window needs no walk edits"
    requirement: GUARD-01
    verification:
      - kind: e2e
        ref: "tests/tests/utils/multiChoice.ts consumed by voter-journey.fixture.ts + candidateQuestionPage.fixture.ts; exercised on BOTH windows (base-7 2..3, base-8 1..1) in every full-suite run"
        status: pass
    human_judgment: false

metrics:
  duration: "~2h"
  completed: 2026-08-11
---

# Phase 135 Plan 02: Seeded exact-one multi-choice question + `selectExact` standing guard — Summary

**`questions.multiChoice.selectExact` now renders in the running app and is locked by an E2E
assertion that has been WATCHED FAIL two different ways — and the seed change that made it
reachable turned out to require decoupling both multi-choice walks from a hard-coded selection
count they should never have had.**

## The headline: the guard exists, and it has been observed failing

Phase 134 added the key in 7 locales and proved it renders by importing the compiled Paraglide
output at build time. But no seeded question had an equal min/max window, so
`QuestionChoices.svelte:420` always took the `selectRange` branch — the key had **zero runtime
coverage**. `test-e2e-base-qu-opin-base-8-multichoice-exact` (min === max === 1) closes that.

Exact-**one** rather than exact-two is the deliberate choice: it renders the MF2 `countPlural=one`
branch, which is the branch carrying the six CONSTRUCTED non-English singulars flagged for
native-speaker review in 134 D-18. That is the branch most worth guarding.

### The negative controls — the whole point of the plan

A guard that has never been observed failing is an assumption. Two independent controls were run,
each with a dev-server restart and a full `--project=voter-journey` run.

**Control A — corrupt the `en` singular value** (`"Select 1 option."` → `"Select 1 CORRUPTED option."`):

```
Error: expect(locator).toHaveText(expected) failed

Locator:  getByTestId('question-choice-helper')
Expected: "Select 1 option."
Received: "Select 1 CORRUPTED option."
Timeout:  2000ms

Call log:
  - Expect "toHaveText" with timeout 2000ms
  - waiting for getByTestId('question-choice-helper')
    6 × locator resolved to <p data-testid="question-choice-helper" class="small-label text-secondary mt-md text-center s-SB6MDz2oEP2_">Select 1 CORRUPTED option.</p>
      - unexpected value "Select 1 CORRUPTED option."

> 394 |     await expect(helper).toHaveText(SELECT_EXACT_ONE_EN, { timeout: TIMEOUTS.element });
```

Result: **1 failed / 3 passed (46.0s)** — failed at the guard, nowhere else.

**Control B — delete `selectExact` from all 7 locale files.** `t()` falls through to
"3. Key not found -- return key as fallback" (`i18n/wrapper.ts:39`), so the app paints the raw
dotted key. That is the exact regression shape the guard exists for:

```
Error: expect(locator).toHaveText(expected) failed

Locator:  getByTestId('question-choice-helper')
Expected: "Select 1 option."
Received: "questions.multiChoice.selectExact"
Timeout:  2000ms

Call log:
    6 × locator resolved to <p data-testid="question-choice-helper" ...>questions.multiChoice.selectExact</p>
      - unexpected value "questions.multiChoice.selectExact"
```

Result: **1 failed / 3 passed (44.9s)**.

Control B is also the argument for the EXACT-string matcher over a regex: a `/select/i` matcher is
satisfied by the string `questions.multiChoice.selectExact`, so it would have passed this control —
i.e. it would have been a guard that cannot fail.

**Restore + green:** `git checkout -- apps/frontend/messages/`, dev server restarted,
`git status --porcelain apps/frontend/messages/` printed **empty**, `en/questions.json:72` reads
`"countPlural=one": "Select 1 option."` again, and the re-run was **4 passed (1.2m)**.

## The seed change, and why it cannot move a single score

`base-7` KEEPS its 2..3 window (Phase 129 D-07 range edge-coverage) — base-8 is an addition, never
a repurposing. The interesting decision is base-8's ANSWER values: every template (POLAR_MAX,
NEAR_MAX, POLAR_MIN, GENERIC, CA-AA-Special) gives it the same `['a']`, and every automated walk
selects checkboxes from index 0, so the voter also lands on `'a'` in both `answerMode` extremes.

That is not laziness, it is the safety argument. A categorical question's subdimensions are
re-weighted to one dimension's worth of total weight (`metric.ts:225-231`), so base-8 adds exactly
**1 to Dmax and 0 to every candidate's D**. Scores become `1 - D/(Dmax+1)` with `D` unchanged — a
strictly monotone transform, so `score(A) > score(B)` is preserved for every pair. The existing
ranking assertions (POLAR_MAX first at 100%, POLAR_MIN last, the EQTYP-02 min-walk ordering) are
therefore preserved **by construction**, not by hoping they survive a re-measure. base-7 remains
the multi-choice matching-coverage question; base-8's job is render coverage.

Verified against the live DB after `db:reset && db:seed --template e2e/base` (exit 0, 26 questions):

| external_id | type | custom_data | sort_order |
|---|---|---|---|
| `test-e2e-base-qu-opin-base-7-multichoice` | multipleChoiceCategorical | `{maxSelections: 3, minSelections: 2}` | 106 |
| `test-e2e-base-qu-opin-base-8-multichoice-exact` | multipleChoiceCategorical | `{maxSelections: 1, minSelections: 1}` | 107 |

## The thing the plan did not anticipate: "click 2" was load-bearing in three places

Both walk helpers hard-coded a 2-checkbox selection and CITED base-7's window in a COUPLING
comment. Against base-8 that count is **over-max**, and the two apps fail differently:

- **candidate** — `isMultiChoiceCountValid` false ⇒ Save stays disabled ⇒
  `walkRemainingOpinionQuestions`'s `expectContinueEnabled()` fails (step 19 of the candidate
  journey).
- **voter** — `handleAnswer` refuses to persist an out-of-range selection
  (`questions/+layout.svelte:194-198`), so Next acts as Skip and the question advances **silently
  unanswered**. No failure, just a hole — the worse of the two outcomes.

`tests/tests/utils/multiChoice.ts` replaces the count with `selectSmallestValidMultiChoice`: click
from index 0 until the app's own validity control enables (candidate → Save; voter → the delete
button, which QuestionActions enables iff `value != null && opinionInputValid`), bounded by the
choice count, ending on a HARD assertion if no prefix is ever valid. This is **stricter** than what
it replaced, which clicked twice and never verified the answer registered at all. It is also
window-agnostic: 1..1, 2..3, 2..null all work with no further edits.

The internal `pollEnabled` probe is a probe, not a softened assertion — the same idiom as
`waitForVisible` in the voter fixture, and it never decides pass/fail.

## Walk changes in `voter-journey.spec.ts`

base-8 lands last in the MAIN category, so:

- the polar-MAX run continues Base-7 → **Base-8** before the Opt-A intro;
- the min-answers gate now deletes **four** (8→7→6→5→4) instead of three, because the voter holds 8
  base answers and `minimumAnswers: 5` is no longer crossed by three deletes — the CTA-enabled
  assertions on each intermediate delete were re-derived, not merely shifted;
- the answer-survival back-walk gains the Base-8 hop, which is additionally the first **same-type**
  multi-choice hop in the suite (no `{#key question.type}` remount), so it now covers the input
  REUSE path as well as the remount path;
- the forward re-advance gains a Base-8 `settleAndAdvance`.

The guard therefore fires **twice** per journey: once on first paint, and once on a question whose
answer was deleted and re-entered (deleteEpoch remount).

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 — Blocking] Both multi-choice walk helpers were coupled to base-7's window**

- **Found during:** Task 1, checking what the new question would perturb.
- **Issue:** `voter-journey.fixture.ts` and `candidateQuestionPage.fixture.ts` both clicked exactly
  2 checkboxes, which is invalid against base-8 — breaking the candidate journey outright and
  silently under-answering the voter walk.
- **Fix:** extracted `selectSmallestValidMultiChoice` (new shared util) and rewired both fixtures.
- **Files:** `tests/tests/utils/multiChoice.ts` (new),
  `tests/tests/fixtures/voter/voter-journey.fixture.ts`,
  `tests/tests/fixtures/candidate/candidateQuestionPage.fixture.ts`
- **Commit:** `978a57ea`

**2. [Rule 1 — Bug] The `numberScale` probe depended on an unpinned election**

- **Found during:** post-gate verification, running the non-gated `_probes` project.
- **Issue:** the probe asserts a Polar-Max candidate card is present, but Polar-Max BB One is
  nominated only in CO-Reg-N. It relied on `answerAndAdvanceToResults` step 7 landing on the
  Regional election — a landing `voter-journey.spec.ts` explicitly documents as NOT deterministic
  between EL-Reg/EL-Mun, and pins around. This plan's extra question changed the walk's shape
  enough to flip the coin.
- **Proven, not assumed:** bisection. Reverting the seed + both fixtures + the journey spec to
  `HEAD~2` and re-running made the probe pass (**2 passed, 55.0s**); restoring made it fail again.
  Meanwhile the gated suite's own Regional-election ranking assertion (POLAR_MAX first at 100%)
  stayed green throughout, so the DATA was correct and only the unpinned election was at fault.
- **Fix:** collapse-aware `selectElectionByName(page, /Regional/i)`, mirroring
  `expectElectionOptionAndSelect`. No assertion weakened — a precondition previously left to luck
  is now explicit.
- **Files:** `tests/tests/specs/_probes/numberScale.probe.spec.ts`
- **Commit:** `8f9cc678`

**3. [Rule 2 — Correctness] Three stale question-count comments in `base.ts`**

- Already wrong since Phase 129 ("QG-Opin-Base — 5 opinion questions", "all 11 opinion questions",
  "= 20" total). Corrected to 8 / 14 / 26, each re-derived from the `fixed` array rather than
  copied forward. Included because this change makes them more wrong, and a seed file whose
  self-description is fiction is how the next author gets misled.
- **Commit:** `978a57ea`

### Not fixed — logged instead

**DEF-135-04** appended to `deferred-items.md`: a single, never-reproduced failure of the
`EPERM-07 customData.terms` term-trigger assertion. Deliberately logged WITHOUT a root cause: the
cold-start-Vite hypothesis was tested and **disproved** (three later runs, each also the first
after a dev-server restart, passed that step, as did both full-suite runs). The failure's own page
snapshot shows the trigger present in the DOM, so it is a latency signal rather than an absence.
It is also strictly upstream of every line this plan touched, so it is not attributable here. One
observation with a disproved hypothesis is not a diagnosis, and recording a guess as a finding is
worse than recording the gap.

## Verification — actual output

Environment for every binding run, per DEF-135-03: the `:5173` listener was asserted to be a
**`node`** process (`lsof -nP -iTCP:5173 -sTCP:LISTEN`) — an HTTP 200 is NOT sufficient proof —
and `docker ps` confirmed no container publishing 5173. The dev server was restarted before every
run whose result is quoted below, and `db:reset` + a storage-bucket check
(`['private-assets', 'public-assets']`) preceded both full-suite runs.

| Gate | Command | Result |
|---|---|---|
| **Full E2E suite** (binding) | `yarn test:e2e` | **134 passed (10.5m)** — 0 failed, 0 did-not-run |
| **Full E2E suite** (confirming, final code state) | `yarn test:e2e` | **134 passed (10.5m)** — 0 failed, 0 did-not-run |
| voter-journey (post-Task-2) | `--project=voter-journey --workers=1` | **4 passed (1.2m)** |
| voter-journey (post-restore) | `--project=voter-journey --workers=1` | **4 passed (1.2m)** |
| Negative control A (corrupt value) | same | **1 failed / 3 passed (46.0s)** — failed at the guard |
| Negative control B (key removed ×7) | same | **1 failed / 3 passed (44.9s)** — failed at the guard |
| numberScale probe (post-fix) | `--project=_probes numberScale.probe.spec.ts --workers=1` | **2 passed (58.0s)**, twice consecutively |
| dev-seed unit tests (isolated) | `cd packages/dev-seed && yarn test:unit` | **444 passed / 42 files (7.51s)** |
| Seed apply | `yarn db:reset && yarn db:seed --template e2e/base` | exit **0**, 26 questions, 143 rows |
| DB assertion | REST query on `questions` | base-8 `{minSelections:1, maxSelections:1}`, base-7 unchanged `{2,3}` |
| `grep -c 'minSelections: 1' base.ts` | — | **1** |
| Test typecheck | `yarn typecheck:tests` | exit **0** |
| Format | `yarn format:check` | exit **0** |
| Lint | `yarn lint:check` | exit **0** (2 pre-existing warnings, neither in a touched file) |
| Working tree | `git status --porcelain` | only `supabase/.temp/cli-latest` |

Two consecutive clean full-suite runs; the second is on the exact code state being handed off.

### Question-count ripple — how it was checked

The plan required stating how existing count assertions were checked, not just that they were.

- `grep`ed every `toHaveCount(` in `tests/tests/` and read each hit. None counts opinion questions;
  they count cards, options, tabs, filters, info-items and choices-per-question.
- `TEXT_RE.answerCount` (`/Answer 4/i`) is asserted with the Base category **unchecked**, and
  `numQuestions` is `selectedQuestionBlocks.questions.length` (`questions/+page.svelte:162-163`) —
  i.e. it counts only SELECTED categories, so adding to Base leaves it at 4. Confirmed still green.
- `candidateJourneyConstants.ts` carries no question counts (checked line by line).
- Positional assertions on the CA-AA-Special drawer are text-filtered
  (`expectQuestionDisplay(/Base opinion 7 …/)`), not index-based, so a new row does not reindex them.
- The one genuinely positional walk — the voter journey's serial step order — was updated
  explicitly (see "Walk changes" above), not left to chance.
- `visual-regression` is tagged `@visual` and excluded from `yarn test:e2e`; its baselines are
  captured on the canonical CI runner. base-8 adds a question to the candidate-preview page, so
  **those four PNG baselines will need a CI re-baseline** — flagged here rather than re-baselined
  locally, since local font rendering differs by design.

## Cardinal-rule compliance

No test was skipped, `.fixme`'d, retried-until-green, or annotated as flaky. No assertion was
weakened, no regex loosened, no `expect.soft` added to reach green. The single failure observed
during the plan that was NOT a deliberate negative control (DEF-135-04) is reported as an open,
unexplained observation rather than absorbed. The one test that this plan genuinely broke (the
numberScale probe) was root-caused by bisection and fixed, not deferred.

## Self-Check: PASSED

- `.planning/phases/135-close-phase-134-coverage-carry-overs/135-02-SUMMARY.md` — FOUND
- `tests/tests/utils/multiChoice.ts` — FOUND
- `packages/dev-seed/src/templates/e2e/base.ts` — FOUND
- `tests/tests/specs/voter/voter-journey.spec.ts` — FOUND
- `tests/tests/specs/_probes/numberScale.probe.spec.ts` — FOUND
- `978a57eaa` — FOUND
- `7d1fee9dd` — FOUND
- `8f9cc6783` — FOUND
