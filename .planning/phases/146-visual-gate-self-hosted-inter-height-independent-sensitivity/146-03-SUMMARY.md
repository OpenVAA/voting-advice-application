---
phase: 146-visual-gate-self-hosted-inter-height-independent-sensitivity
plan: "03"
subsystem: testing
tags: [playwright, visual-regression, screenshot-diff, pixelmatch, docker, noise-measurement, negative-control, determinism]

requires:
  - phase: 146-01
    provides: "`tests/scripts/visual-container.sh` + `tcp-forward.mjs` (the container recipe and the relay), the 29-row register and the 40-cell noise ledger, both enumerated before any run"
  - phase: 146-02
    provides: "`D14-OBS` — the served-application preflight observed passing from inside the pinned container; the container half of assumption A2; `E1-CURL`/`E2-CHROMIUM`; the host dev server's recorded identity"
  - phase: 136-real-guards-visual-repair-sweep-remediation
    provides: "the `MatchScore.svelte:30` `text-lg` → `text-2xl` injection and the 19,484 / 19,545 px v2.14 record — cited for injection comparability only, never as a cell value"
  - debug: tied-match-order-churn
    provides: "`53002b6a9` (dev-seed persists nomination emission order as `sort_order`) and `dbb704bd4` (`/results` tie-breaks with `compareMaybeWrappedEntities`) — the two fixes that made this plan's Tasks 2-3 re-measurable"
provides:
  - "`B1-OLD` / `B2-OLD` — the gate's blindness RE-OBSERVED in this container: `voter-results-desktop` PASSES with the v2.14 injection live under the unmodified shipped config; `voter-results-mobile` FAILS in the same run. ROADMAP criterion 2's blindness half, discharged by observation. **Unchanged by this re-run** — a verdict comparison under the shipped config, unaffected by tie ordering"
  - "the 40-cell noise matrix, RE-MEASURED at HEAD `e5ff31740` — **all forty cells read 0**, on all four baselines, across ten completed in-container runs at `maxDiffPixels: 0`. The suite's run-to-run noise floor is not small; it is absent"
  - "**`cap = 200`** — the D-05 derivation runs to completion via its FLOOR branch (`max(noise) = 0` → `× 10` = 0 → floored at 200 → already round → `200 < 5,000` ✓). `146-04` is UNBLOCKED"
  - "the recorded finding that at `cap = 200` the `maxDiffPixelRatio: 0.01` budget is **inert on all four baselines** — the citation `146-04`'s config comment carries for D-03"
  - "a SECOND reproduction of the run-4-shaped anomaly, with a named source line: `voter-journey.fixture.ts:336`, the three-way `.or()` locator in `answerAndAdvanceToResults`. OPEN and UNCONFIRMED — material input to `146-07`'s D-16"
  - "the void first matrix preserved as history (`tests/e2e-runs/146-noise-VOID-run01`…`-VOID-run10`) rather than silently overwritten"
affects: [146-04, 146-05, 146-06, 146-07, 146-08, 146-09]

actuals:
  tokens: 46000
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "Companion measurement run: the verdict is taken under the shipped configuration and the magnitude under a gitignored zero-tolerance overlay, in the same injected state, because a passing `toHaveScreenshot` is structurally incapable of reporting its own count"
    - "Overlay proof-before-measurement: `--list` must enumerate byte-identically to the base config before any number the overlay produces is trusted"
    - "Fixed-expected / independent-actuals: a single snapshot refresh taken STRICTLY BEFORE a noise matrix preserves the measurement's invariant (one expected, N independent actuals) while removing a stale-baseline constant that would otherwise masquerade as noise"
    - "Status-gated zero: an extractor may only emit `0` for a capture whose status is `passed`; every other status is `NO MEASUREMENT`, because `no diff message` means two opposite things depending on why there is no message"

key-files:
  created: []
  modified:
    - .planning/phases/146-visual-gate-self-hosted-inter-height-independent-sensitivity/146-NEGATIVE-CONTROL.md
    - .planning/phases/146-visual-gate-self-hosted-inter-height-independent-sensitivity/146-VISUAL-NOISE-LEDGER.md
    - tests/scripts/visual-container.sh

key-decisions:
  - "The first 40-cell matrix and its halted derivation are VOID and were REPLACED in place, not appended beside — two matrices in one ledger would leave `max(noise)` ambiguous. The void matrix's evidence and the reason it is void are preserved in the ledger and on disk"
  - "The D-05 FLOOR branch was taken and recorded honestly: `cap = 200` because the floor is 200, not because `max(noise) × 10` produced it. The forty observations establish that the noise floor is 0 — which is what makes taking the floor safe — but they did not set the number, and the ledger says so"
  - "One operator-approved pre-matrix snapshot refresh (working tree only, reverted and proven) rather than measuring a fixed 16,883 px stale-baseline delta as if it were noise. `146-07` still owns the committed re-baseline"
  - "`run07` contributes NOTHING to `max` rather than four zeros: its `voter-results-desktop` capture timed out and never took a screenshot. A replacement run (`run11`) restores the matrix to ten completed observations"
  - "Row labels were kept matching their run directories one-for-one (`run01`…`run06`, `run08`…`run11`) and the Completeness grep pattern widened instead, because label↔directory correspondence is what makes a cell auditable"
  - "The run-4-shaped anomaly is recorded OPEN and UNCONFIRMED. It recurred; it was not written off"

patterns-established:
  - "Void-and-replace with retained provenance: a superseded measurement corpus is replaced in place, but the fact that it existed, what it measured, and which commits invalidated it are recorded beside the replacement"
  - "Anchored placeholder counting: a bare `grep -o 'pending'` counts the documentation of the convention as unfinished work"

requirements-completed: []

coverage:
  - id: D1
    description: "The visual gate's blindness re-observed, not cited: with the v2.14 injection live under the unmodified shipped config, `voter-results-desktop` PASSES and `voter-results-mobile` FAILS in the same run"
    requirement: "VGATE-01"
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/146-negctl-b1/results.json — Voter Results - Desktop @visual status `passed`; Voter Results - Mobile @visual `failed`, `19861 pixels … are different.`; exit 1; stdout.log carries the E2E PREFLIGHT OK line. NOT re-run in this session — a verdict comparison under the shipped config, unaffected by tie ordering"
        status: pass
    human_judgment: false
  - id: D2
    description: "The injection was applied and fully reverted; zero product bytes survive"
    verification:
      - kind: other
        ref: "git diff --exit-code -- apps/frontend/src/lib/components/matchScore/MatchScore.svelte (exit 0); git hash-object == ec84b65bd0cca43acff9db6982a3cce6bc45597c; git status --porcelain -- apps packages tests .github package.json yarn.lock empty at plan close"
        status: pass
    human_judgment: false
  - id: D3
    description: "The 40-cell noise matrix RE-MEASURED from ten completed in-container runs at `maxDiffPixels: 0`, all forty cells reading 0, with the overlay proven to enumerate 7 tests before any measurement and deleted afterwards"
    requirement: "VGATE-03"
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/146-noise-run01…run06, run08…run11 — ten results.json, each observed_workers=1 / observed_retries=0 read back from results.json, each with exactly one E2E PREFLIGHT OK line (12/12 including the refresh run and the void run07); --list through the overlay diffs byte-identically against the base config at 7 tests in 4 files"
        status: pass
      - kind: other
        ref: "146-03-PLAN.md Task 2 <verify> in its intent-preserving form (`run[0-9]{2}`) → `OK 40 numeric cells`; `test ! -f tests/e2e-runs/146-noise/playwright.noise.config.ts` passes. The as-written form (`run(0[1-9]|10)`) finds 9 rows — see Deviations"
        status: pass
    human_judgment: false
  - id: D4
    description: "The D-05 derivation run against the forty cells and TERMINATING in `cap = 200` via its floor branch, with all five steps and their intermediates recorded"
    requirement: "VGATE-03"
    verification:
      - kind: other
        ref: "146-03-PLAN.md Task 3 <verify> → `derived cap = 200`, exit 0, inside the `[200, 5000)` bounds it asserts"
        status: pass
    human_judgment: true
    rationale: "The automated check confirms a number in range; it cannot confirm the number is the RIGHT one. The load-bearing judgment is that `cap = 200` was set by the FLOOR, not by the measured noise — `max(noise) × 10` is 0 — so the corpus's contribution is the fact that the noise floor is zero rather than the value itself. Whether that is an adequate basis for the cap `146-04` installs is a human call, and the ledger states the distinction explicitly so it can be made."
  - id: D5
    description: "The voter-results baselines are now content-DETERMINISTIC across runs; the 11,748–15,928 px churn the first matrix measured is gone"
    verification:
      - kind: e2e
        ref: "40/40 cells at 0 against a fixed expected image whose blob is proven unchanged across all eleven runs; corroborated independently by the 5-run verification in .planning/debug/tied-match-order-churn.md (four byte-identical 16,883 px counts where previously every run differed)"
        status: pass
    human_judgment: false
  - id: D6
    description: "`visual-container.sh` gained `--config`, without which the plan's overlay runs were not expressible; disclosed in the register rather than back-dated"
    verification:
      - kind: other
        ref: "bash -n exit 0; five usage errors return 2; --help exit 0; yarn lint:check and yarn format:check exit 0. Landed in the 2026-08-25 session; blob 2a5420a25… unchanged by this re-run"
        status: pass
    human_judgment: true
    rationale: "Whether extending a committed 146-01 executable mid-phase — against this plan's `zero product bytes` posture — is the right call is a scope-discipline judgment, and it changed a script other plans depend on."
  - id: D7
    description: "The run-4-shaped anomaly RECURRED and is recorded OPEN, with a named source line"
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/146-noise-run07 — `Voter Results - Desktop @visual` status `timedOut` at voter-journey.fixture.ts:336, the same locator and call path as the OPEN tests/e2e-runs/146-verify-tiebreak-3 intermittent. Replacement run11 taken so the matrix rests on ten completed observations"
        status: pass
    human_judgment: true
    rationale: "The observation is machine-established but the CAUSE is not diagnosed, and diagnosing it is 146-07's D-16 charter rather than this plan's. It is recorded UNCONFIRMED and OPEN specifically so that it cannot later be dismissed as 'did not recur, so presumed gone' — the reasoning this milestone rejected for DEF-135-04. A human must decide whether it now warrants pulling D-16 forward."

duration: 44min
completed: 2026-08-26
status: complete
---

# Phase 146 Plan 03: The Blindness Half and the Noise Matrix Summary

**Tasks 2 and 3 re-run after the tie-break fixes: the forty-cell matrix that previously churned by 11,748–15,928 px now reads **zero in all forty cells**, so the D-05 rule runs to completion through its floor branch and yields **`cap = 200`** — and along the way the run-4-shaped anomaly recurred, with a source line, and is recorded open.**

## What this document is

This is a **re-run summary**. The original execution of this plan (2026-08-25) is preserved in the
record below and its Task 1 result stands unchanged; its **Tasks 2 and 3 are void** and have been
replaced. The reason is not a mistake in the execution — it is that the execution measured a **product
defect** faithfully, and the defect has since been fixed.

## Why Tasks 2 and 3 were re-run

The first matrix did not measure noise. It measured **tie-order churn**: distance-tied candidates on
`/results` permuted between page loads, because the seeder never persisted the template's declaration
order and `get_nominations`'s `ORDER BY n.sort_order NULLS LAST, n.id` therefore collapsed to a
`gen_random_uuid()` primary key re-minted on every teardown-and-reseed, while
`matchingAlgorithm.match()`'s stable sort had no tie-break to impose an order of its own.

Two commits fixed it, both landing after the first execution:

| Commit | Fix |
|---|---|
| `53002b6a9` | dev-seed persists each nomination's emission index as `sort_order` |
| `dbb704bd4` | `/results` sorts with `compareMaybeWrappedEntities` (`toSorted`, not `sort`) |

Full root-cause record, including the operator's tie-break decision: `.planning/debug/tied-match-order-churn.md`.

**Task 1 was NOT re-run.** `B1-OLD`/`B2-OLD` are a verdict comparison under the shipped configuration —
desktop passes the injection, mobile fails it — and tie ordering does not bear on which side of a
47,155 px / 16,193 px budget a ~16,700 px diff falls. Those register rows are untouched.

## Performance

- **Duration:** ~44 min
- **Started:** 2026-08-26T09:00:15Z
- **Completed:** 2026-08-26T09:44:05Z
- **Tasks:** 2 re-run (2, 3); 1 carried forward unchanged (Task 1)
- **Container runs this session:** 12 — 1 pre-matrix refresh, 10 completed matrix runs, 1 void
- **Dev server:** PID `82314`, port 5173, **never restarted** (2h01m uptime at plan close)

## Accomplishments

### Task 2 — the 40-cell matrix, re-measured (commit `6fb65a583`)

Ten consecutive in-container runs at `maxDiffPixels: 0`, `--workers=1 --retries=0` read back from each
run's own `results.json`, against a fixed expected image:

| | `voter-results-desktop` | `voter-results-mobile` | `candidate-preview-desktop` | `candidate-preview-mobile` |
|---|---|---|---|---|
| min / **max** / spread / sd | 0 / **0** / 0 / 0 | 0 / **0** / 0 / 0 | 0 / **0** / 0 / 0 | 0 / **0** / 0 / 0 |
| max as % of that baseline's budget | 0 % | 0 % | 0 % | 0 % |

**Forty cells of zero.** Ten independent captures of the same four pages produced not one differing
pixel that pixelmatch scored at the shipped `threshold: 0.2`. The suite's run-to-run noise floor is not
small — it is **absent**.

**The voter pair is what changed.** In the void matrix it swung across 11,748–15,928 px, every run
different, desktop and mobile in lockstep to within 28 px. That was the churn, and it is gone. The
independent 5-run verification in the debug record saw the same collapse (four byte-identical 16,883 px
counts where previously every run differed); the pre-matrix refresh removes that residual constant, and
what remains is 0.

**The `candidate-preview` pair is still the load-bearing control, and it still holds.** Twenty of the
forty zeros are its — matching the v2.14 record and the void matrix's own 20 cells. Three measurement
campaigns, three HEADs, two tie-order regimes, and that pair has never moved. A matrix of forty zeros is
the result most exposed to the objection *"you measured nothing at all"*, and this pair — with the
`--list` proof of 7 tests and the preflight line in **12 of 12** stdout logs — is what answers it.

**Both silent-failure traps closed before any number was taken.** The overlay absolutised `globalSetup`
(F-146-P1) and every project's relative `testDir` (F-146-P2); `--list` through the overlay `diff`s
byte-identically against the base config at **7 tests in 4 files**. The overlay is reproduced verbatim
in the ledger and **deleted from disk**; `tests/playwright.config.ts` still hashes to `de1ae33ff…`.

### Task 3 — the derivation, run to completion (commit `6fb65a583`)

| Step | Rule | Value | Branch |
|---|---|---|---|
| 1 | `max(noise)` over all 40 cells | **0 px** | measured, from 40 observations |
| 2 | `× 10` | 0 px | — |
| 3 | floored at 200 | **200** | **FLOOR BRANCH TAKEN** |
| 4 | rounded **up** to a round number | 200 (already round; nothing rounded down) | — |
| 5 | strictly `< 5,000` | 200, **25× below the ceiling** | **CEILING SATISFIED** |

**`cap = 200`.** `max(noise) = 0 < 500`, so the incompatibility threshold is not reached and the
stop-and-record branch does not apply.

**The floor set this number, not the noise — and the ledger says so.** `max(noise) × 10` is zero, and
zero is not a threshold. Claiming "200 was derived from forty observations" without that qualification
would overstate what the corpus did. What the forty observations actually contribute is that **the
noise floor is 0**, so any positive cap has complete headroom — which is precisely the condition under
which taking the floor is safe, and precisely the case the floor was written for (*"so that an all-zero
matrix does not produce a cap of `0`"*). Had the matrix come back at 40 px, step 2 would have produced
400 and the floor would have been inert.

**200 catches what the gate exists to catch, by ~83×**: the injection measured 16,650 px on desktop and
16,689 px on mobile (rows `B1-OLD`/`B2-OLD`), against the v2.14 record's 19,484 / 19,545 px. The
admissible window is no longer a 722 px sliver — it runs from 200 up to ~16,650, and the derivation
lands at the strict end of it.

**Which knob binds where, under `cap = 200`:** the cap binds on **all four** baselines and
`maxDiffPixelRatio: 0.01` is **inert everywhere** (ratios looser by 18.0× to 235.8×). This differs from
what the void matrix's derivation anticipated — it reasoned about caps in `(3,603.6, 5,000)`, where
`candidate-preview-mobile`'s ratio keeps binding — and the difference is stated rather than glossed. It
sharpens D-03 rather than contradicting it: the ratio's role really is the **small-baseline floor**, and
at this cap no baseline in the suite is small enough to invoke it.

## Task Commits

1. **Tasks 2 + 3: the re-measured matrix and the completed derivation** — `6fb65a583` (docs)
2. **Summary + state** — see final commit below

*Tasks 2 and 3 landed in one commit because they write the same file and Task 3's § Derivation
references the matrix Task 2 fills, in the same document; splitting them would have produced an
intermediate commit whose ledger asserted a derivation over cells it did not yet contain.*

## Deviations from Plan

### 1. [Operator-approved] The pre-matrix baseline refresh

**This is the significant one and it is disclosed in full in the ledger's own
§ *⚠ DEVIATION, operator-approved — the pre-matrix baseline refresh*, not just here.**

- **Found during:** Task 2, before the matrix.
- **Issue:** the committed voter baselines still encode the OLD arbitrary tie permutation. Measured
  against them, every run reports a **fixed 16,883 px stale-baseline delta** — a constant, not noise.
  Run exactly as written, Task 2 would have produced `max(noise) = 16,883` and halted D-05 a second
  time for a reason with nothing to do with run-to-run variance. The real committed re-baseline belongs
  to `146-07`, which must run after `146-05`/`146-06` move the pixels again; it cannot be pulled forward.
- **Fix:** ONE snapshot-update run (`tests/e2e-runs/146-noise-rebase`, exit **0**, preflight OK),
  in-container through the same harness and overlay, refreshing the four expected PNGs **in the working
  tree only** — taken **strictly before** the matrix. Then ten measurement runs with **no
  snapshot-update flag of any kind**.
- **Why the measurement's meaning is unchanged:** the plan's prohibition exists so no run inside the
  matrix compares against its own previous output. A single refresh before the loop preserves that
  invariant completely — **one fixed expected, ten independent actuals**, which is exactly the shape a
  noise measurement requires. Proven: the four expected blobs are byte-identical when hashed after the
  refresh and again after run11.
- **Measured per-baseline effect:** the voter pair's PNGs changed by 37,544 / 37,530 raw pixels (the
  removed offset). The `candidate-preview` pair changed by 2,304 raw pixels each — but those are
  **sub-`threshold`**, and that pair scored exactly 0 in all 20 of its cells in the *un-refreshed*
  matrix, so for those twenty cells the refresh is provably a **no-op under the comparator that runs**.
- **Reverted and proven:** `git checkout --` on the four PNGs; all four blobs back to
  `ea8316c50…` / `e42d1d753…` / `5b847d227…` / `fc19205d9…`; `git diff --exit-code` exit 0;
  `git status --porcelain` prints nothing. **Zero product bytes, and `146-07` keeps its job.**

### 2. [Rule 1 — Bug in the measurement instrument] The extractor read a timed-out capture as `0`

- **Found during:** Task 2, diagnosing `run07`.
- **Issue:** `extract.mjs`'s fallback was `m ? {count: N} : {count: 0, note: 'passed silently -> 0'}`.
  It keyed on **the absence of a diff message**, not on the status. `run07`'s `voter-results-desktop`
  capture **timed out and never took a screenshot** — and the extractor reported it as a clean `0`.
- **Why it matters:** that is the exact **inversion** of research Pitfall 1. Pitfall 1 says a silent
  pass must be recorded as `0`; this says a silent *non-run* must not be. Recording it as `0` reads a
  did-not-run as a pass — the E2E Hard Rule's cardinal error — and biases `max(noise)` **downwards**,
  the direction that reddens the gate on its own noise. Had the anomaly landed in a run whose other
  three baselines were also quiet, the uncorrected extractor would have contributed a full row of
  **fabricated zeros** to a derivation whose entire output is a maximum.
- **Fix:** branch on `status === 'passed'` before emitting `0`; every other status yields
  `count: null, 'NO MEASUREMENT — capture did not complete'`. `run07` now reads `NO MEASUREMENT` and
  contributes nothing to `max`.
- **Verification:** re-extracted `run07` → `status: "timedOut"`, `count: null`; the other ten runs
  re-extract unchanged at 0.

### 3. [Documented] The Task 2 `<verify>` row-label pattern

The plan's automated check matches `^\|\s*run(0[1-9]|10)\s*\|` and requires 10 rows. The matrix's ten
completed observations are `run01`…`run06` and `run08`…`run11`, so it finds **9**. The pattern was
written in `146-01` assuming ten runs would be numbered 1–10 — but this plan's own Task 2 instructs
*"take a replacement run so the matrix still rests on ten completed observations"*, and a replacement
necessarily carries the eleventh number. **Row labels were kept matching their run directories
one-for-one** rather than renumbered to fit, because label↔directory correspondence is what lets a cell
be audited back to the JSON it came from; the pattern was widened to `run[0-9]{2}` instead, in the
ledger's § Completeness and in the check. Both forms assert the same invariant — ten data rows, forty
numeric cells, zero placeholders — and the widened form returns **`OK 40 numeric cells`**.

### 4. [Recorded, not fixed] The void first matrix was replaced in place

Two matrices in one ledger would leave `max(noise)` ambiguous, which is the one thing this corpus must
not be. The forty old cells were **overwritten**, and a clearly-marked § *⚠ The first matrix is VOID*
records that it existed, what it measured, which commits invalidated it, and where its evidence lives
(`tests/e2e-runs/146-noise-VOID-run01`…`-VOID-run10`, retaining `results.json`/`stdout.log`/
`observed.txt`/`exit`/`pw-args.txt`/`provenance.txt`; HTML reports and traces dropped for disk).

---

**Total deviations:** 4 — 1 operator-approved measurement-hygiene deviation (disclosed twice, reverted,
proven), 1 Rule-1 bug in the measurement instrument caught by the anomaly it mis-read, and 2
documentation/record decisions.

## Issues Encountered

### ⚠ OPEN — the run-4-shaped anomaly RECURRED

**`tests/e2e-runs/146-noise-run07`, exit 1.** `Voter Results - Desktop @visual` ended
`status: "timedOut"`:

```
Test timeout of 90000ms exceeded while setting up "answeredVoterPage".
Error: locator.waitFor: Test timeout of 90000ms exceeded.
  - waiting for getByTestId('voter-questions-category-start')
      .or(getByTestId('question-choice').first())
      .or(getByTestId('question-number-slider').first())
      .first() to be visible
  at fixtures/voter/voter-journey.fixture.ts:336
  at answerAndAdvanceToResults (…voter-journey.fixture.ts:336:8)
  at Object.answeredVoterPage (…voter-journey.fixture.ts:572:5)
```

**This is not merely "the same shape" as the intermittent carried out of the tie-break session — it is
the same defect at the same source line.** `tests/e2e-runs/146-verify-tiebreak-3` reads
`TimeoutError: locator.waitFor: Timeout 10000ms exceeded` at **`voter-journey.fixture.ts:336`**, on the
**same three-way `.or()` locator**, in the **same `answerAndAdvanceToResults` → `answeredVoterPage`
call path**. Only the budget that expired differs: there the locator's own `TIMEOUTS.slowPage` went
first, here the whole 90 s test budget did. The failing wait is the question-flow page never rendering
a category-start button, a choice question or a number slider.

**Two sightings, both this session, both in-phase.** `146-07`'s **D-16** is chartered to reproduce the
v2.14 "run-4 anomaly" (*1 unexplained failure in 5 clean runs*); this is a second independent
reproduction **with a named source line**, which is materially more than D-16 had to work with.

**Recorded UNCONFIRMED and OPEN. It is explicitly not written off** — "did not recur, so presumed gone"
is the reasoning this milestone rejected for DEF-135-04. Handled per the plan: artifacts captured,
recorded in the ledger as a D-16-relevant observation, and a replacement run (`run11`) taken so the
matrix rests on ten completed observations.

**For the operator:** this may warrant pulling D-16's investigation forward, since the anomaly is now
reproducing at roughly 1-in-6 to 1-in-10 in this environment and has a concrete first suspect.

### Everything else

No other issues. The remaining eleven container runs reached Playwright and completed; the overlay
enumerated correctly on the first attempt; the dev server was **never restarted** (PID `82314`
throughout, D-16's continuous-uptime requirement intact).

## Known Stubs

The noise ledger carries **4** placeholder cells, all in § *Font delta (N-1)*, owned by `146-06`. The
register's remaining `pending` cells belong to `146-04` … `146-09`. All deliberate. No code stub exists.

## Threat Flags

None new. `T-146-09` (a botched revert corrupting the shipped config) is **mitigated twice as
designed**: the zero-tolerance budget never touched `tests/playwright.config.ts` (still `de1ae33ff…`)
and the baseline refresh — the one new write path this session introduced — is reverted and proven by
blob comparison plus a clean `git status --porcelain`. `T-146-10` (a matrix built by harvesting
failures) is **structurally mitigated and this session is its extreme case**: all 40 cells are zeros
that a failure-driven harvest would have omitted **entirely**, leaving no corpus at all. `T-146-11` (the
overlay's silent no-op modes) is **mitigated by observation**: `--list` proved 7 tests before any
measurement and 12 of 12 runs carry the preflight's OK line. `T-146-05` is unchanged — `preflight.ts`
and `global-setup.ts` still hash to `389197f03…` and `1c4a29d33…`.

## Verification Results

| Check | Result |
|---|---|
| `B1-OLD`/`B2-OLD` filled | **unchanged from the first execution** — not re-run, and not affected by tie ordering |
| 40 noise cells + 4 `max` cells numeric; overlay verbatim in ledger and gone from disk | `OK 40 numeric cells` (intent-preserving form); `playwright.noise.config.ts` **absent** |
| § Derivation carries the arithmetic and a cap in `[200, 5000)` | **`derived cap = 200`**, exit 0 |
| `git diff --exit-code` over config / MatchScore / preflight / global-setup | exit **0**; blobs `de1ae33ff…`, `ec84b65bd…`, `389197f03…`, `1c4a29d33…` |
| baselines restored after the approved refresh | 4/4 blobs match committed; `git diff --exit-code` exit 0 |
| `git status --porcelain -- apps packages tests .github package.json yarn.lock` | prints nothing |
| `yarn lint:check` / `yarn format:check` | exit **0** / exit **0** |
| Dev server PID `82314`, port answering 200 | **unchanged, never restarted** |

Task `<verify>` blocks: Task 2 → **PASS** (intent-preserving form; see Deviation 3);
Task 3 → **PASS**, `derived cap = 200`.

## User Setup Required

None.

## Next Phase Readiness

**✅ `146-04` is UNBLOCKED.** A cap exists, derived in the open by a rule written before the numbers
did, and it is `200`. What `146-04` needs from this plan is all present:

1. **The cap value**, with its five-step arithmetic and the honest note that the **floor** set it.
2. **The binding analysis for D-03's config comment** — under `cap = 200` the cap is operative on all
   four baselines and `maxDiffPixelRatio` is inert everywhere.
3. **The blindness half of ROADMAP criterion 2** — discharged, committed, and preceding every product
   byte. `C1-NEW`/`C2-NEW` (the *caught* halves) are what remain, and they now have a cap to be caught
   under.
4. **The container harness, the mount, the egress block, `--config`** — twelve more runs this session,
   one failure, and that failure was a product/fixture intermittent rather than a harness fault.
5. **The host dev server** — PID `82314`, never restarted by this plan; D-16's continuous-uptime
   control is intact from that PID forward.

**Two things the operator should weigh:**

- **The run-4-shaped anomaly is open and reproducing.** Second sighting, same source line
  (`voter-journey.fixture.ts:336`). D-16 may deserve to move earlier.
- **`146-07`'s re-baseline is still owed and still one-time.** The committed baselines still encode the
  old permutation; this session refreshed them only in the working tree and reverted. Under `cap = 200`
  the current committed baselines would fail the voter pair by ~16,883 px until `146-07` re-captures —
  which is expected and is exactly why the cap lands in `146-04` and the re-baseline in `146-07`, after
  the font moves the pixels one final time.

**Requirements:** `requirements-completed` remains **empty**. VGATE-01 requires the regression to be
**caught** (`C1-NEW`, in `146-04`). VGATE-03 now has both halves in substance — measured per-baseline
noise and a re-derivable threshold — but the threshold is not yet **in force**, so it is advanced to the
point of installation rather than discharged.

## Self-Check

- `146-VISUAL-NOISE-LEDGER.md` — FOUND; 10 matrix rows, 40 numeric cells all `0`, `max` row `0 0 0 0`,
  `cap = 200` in § Derivation, 4 placeholder cells remaining (§ Font delta only)
- `146-NEGATIVE-CONTROL.md` — FOUND; `B1-OLD`/`B2-OLD` unchanged
- `tests/e2e-runs/146-noise-rebase/{results.json,stdout.log,observed.txt,exit}` — FOUND
- `tests/e2e-runs/146-noise-run01…run06, run08…run11/{results.json,stdout.log,observed.txt,exit,provenance.txt}` — FOUND (10/10)
- `tests/e2e-runs/146-noise-run07/` — FOUND (the void run, retained as the D-16 observation)
- `tests/e2e-runs/146-noise-VOID-run01…VOID-run10/` — FOUND (10/10, the void first matrix's evidence)
- `tests/e2e-runs/146-noise/playwright.noise.config.ts` — correctly **ABSENT**
- commit `6fb65a583` — FOUND (`docs(146-03): re-measure the noise matrix and derive cap = 200`), blob non-empty (58,322 B)
- product-path `git status --porcelain` — empty
- committed baseline blobs — 4/4 restored to their `e5ff31740` values
- dev server PID `82314` — still running, never restarted

## Self-Check: PASSED

---
*Phase: 146-visual-gate-self-hosted-inter-height-independent-sensitivity*
*First executed: 2026-08-25 — halted at the D-05 stop-and-record branch on a matrix that measured the tie-order churn.*
*Tasks 2-3 re-run: 2026-08-26 at HEAD `e5ff31740` — 40/40 cells at 0, D-05 completes via its floor branch, **`cap = 200`**.*
