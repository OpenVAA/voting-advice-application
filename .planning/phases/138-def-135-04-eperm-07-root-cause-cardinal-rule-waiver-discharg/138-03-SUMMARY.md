---
phase: 138-def-135-04-eperm-07-root-cause-cardinal-rule-waiver-discharg
plan: 03
subsystem: e2e-diagnosis
tags: [forensics, playwright, cdp-throttling, sveltekit-router, contention, root-cause, hypothesis-elimination]
status: complete

requires:
  - 'tests/tests/specs/voter/eperm07-term-trigger.spec.ts :: the LEAF hunt instrument with its CDP throttle knob and finally-scoped release (plan 01)'
  - 'env knobs EPERM07_FORCE_BUDGET_MS / EPERM07_FORCE_CPU_RATE / EPERM07_NO_VT :: neutral by construction (plan 01)'
  - 'tests/tests/fixtures/shared/forensicCapture.fixture.ts :: the D-11 console + failed-request auto-capture (plan 01)'
  - '138-FORCED-REPRO.md :: the plan-02 environment stamp, budget sweep and Discriminator A'
  - '138-DIAGNOSIS.md :: the hypothesis ledger with H1 eliminated, H2/H3 live'
provides:
  - '138-DIAGNOSIS.md § Named root cause :: the mechanism, named as an ORDERING with quoted file:line for every link — criterion 1s written artefact'
  - '138-DIAGNOSIS.md § Hypothesis ledger :: all three rows terminal (H1/H2/H3 eliminated), plus H4 and RESEARCH A2 dispositioned'
  - '138-FORCED-REPRO.md § Discriminator B :: the CPU ladder at the production budget, the window-width bisection, the throttle-hygiene proof'
  - '138-FORCED-REPRO.md § Contention :: the isolated-vs-pressured comparison, verdict Contention-dependent, and the plan-04 construction instruction'
  - 'the DETERMINISTIC forcing configuration for plan 04 :: budget 400 + CPU rate 40, 15/15 over two blocks, only a 5x oracle shrink'
  - 'the answer to RESEARCH U-2 :: DataRoot.update() has one call site, in an admin utility off the voter path'
  - 'the answer to U-1, by derivation :: the soft heading assertion at voter-journey.spec.ts:858 must also have failed'
  - 'a green full-suite gate observation :: 135 passed / 0 failed / 0 skipped / 0 flaky, 622 s, 6 workers, 0 retries'
affects:
  - '138-DIAGNOSIS.md :: H2 and H3 rows moved from live to eliminated with structural + empirical evidence; a plan-03 ledger-state paragraph added; § Named root cause written'
  - '138-FORCED-REPRO.md :: 975 lines appended (§ Discriminator B, § Contention)'
  - 'plan 04 :: inherits a deterministic configuration, an explicit ISOLATED-construction instruction, and a Remedy tier written as decision input for the D-06 checkpoint'
  - 'plan 04 :: warned OFF any Term.svelte / QuestionHeading.svelte fix — that is H3, and H3 is eliminated'
  - 'plan 06 :: the waiver discharge must carry the stated gap (the amplifier is unidentified) rather than reading as a fully explained field failure'

tech-stack:
  added: []
  patterns:
    - 'Bisect the ORACLE budget at a fixed adversary setting to MEASURE the race window in milliseconds — it turns "the lever did not force it" into a quantity, and the quantity is what localises the mechanism'
    - 'Escalate an amplifier until it visibly breaks the instrument, then record that breakage as the usable ceiling — "we did not push hard enough" and "the technique cannot reach" are different findings and only the second is defensible'
    - 'Run a contention A/B at a MARGINAL operating point, never at a saturated one: a configuration that already fails 15/15 cannot show an effect in either direction'
    - 'Record a per-run "which assertion actually failed" field alongside the state probe — it caught two distinct classes of false reproduction (a NaN-valued CDP call and a throttle that broke the upstream gate) that a pass/fail count would have absorbed'
    - 'Validate a load generator against the thing it models before trusting a null result: the hunt spec stretched 1.32x under the real six-worker suite and 1.32x under the generator'
    - 'Detect adversary leakage by SHAPE, not only by duration — the tri-state class is categorical in throttle rate, so an unthrottled-shaped probe is a stronger no-leak proof than a timing measurement'

key-files:
  created: []
  modified:
    - '.planning/phases/138-.../138-FORCED-REPRO.md'
    - '.planning/phases/138-.../138-DIAGNOSIS.md'

decisions:
  - 'Root cause NAMED as an ordering: SvelteKit commits the URL at client.js:1759-1760 and swaps the DOM at client.js:1824, while the walk settle (voter-journey.spec.ts:186-190) waits on the URL only and swallows its own timeout — so assertions land inside a window in which Base-2 is still rendered and Base-2 carries no terms'
  - 'Outcome recorded as "Not forced at production budget; forced with the budget lever" — 91 forced-lever runs at the unweakened 2000 ms budget produced zero failures'
  - 'The negative result was converted into a localisation by budget bisection: ~105 ms of the ~112 ms window is CPU-rate-INDEPENDENT, so the window is frame/latency-bound, not JS-bound — which is what disqualifies snapshot capture as the amplifier'
  - 'CPU rate 80 rejected as a forcing rate despite a 10/10 raw failure count: it breaks the upstream Base-2 gate, and a rate that sometimes fails the wrong assertion cannot serve as a negative control'
  - 'Preferred forcing configuration is budget 400 + rate 40 (15/15, 5x shrink), superseding budget 100 + rate 20 (10/10, 20x shrink), because the pair should weaken the oracle as little as possible'
  - 'Verdict Contention-dependent, but BOUNDED: 1/10 vs 10/10 at the margin, yet contention widens the window by less than 2x and both arms are 0/10 at the production budget — RESEARCH A2 is measured and found insufficient, not confirmed'
  - 'H2 eliminated structurally (neither render gate can change inputs on a Q→Q hop) plus empirically (the gate failure path never logged), not on the 127 headingCount:0 probes alone'
  - 'H3 eliminated by closing U-2 (DataRoot.update has one call site, in an admin utility) plus 262 counter-example-free probes — and its elimination is what makes U-1 answerable by derivation'
  - 'The phase records that the AMPLIFIER is unidentified: the field occurrence needs a ~36x excursion and every lever here reached at most ~5.4x. Mechanism established, excursion not — stated as a bounded open question, never as a closure'
  - 'Remedy tier written as BOTH, with an explicit warning that a Term.svelte / QuestionHeading.svelte change would fix the mechanism this phase disproved'

metrics:
  duration: ~70 min
  completed: 2026-08-13
  tasks: 3
  commits: 3

actuals:
  tokens: 22113
  tasks: 3
  commits: 3
---

# Phase 138 Plan 03: Amplification, Contention and the Named Root Cause Summary

CPU amplification could not force the failure at the production budget in 91 runs — and bisecting the
oracle budget at each throttle rung turned that negative into the measurement that named the
mechanism: the post-settle window is ~105 ms of **CPU-rate-independent** latency, so it is a
frame/round-trip cost rather than the snapshot-capture cost every ranked hypothesis assumed. With H2
and H3 eliminated structurally as well as empirically, what is left is the window itself, and
`138-DIAGNOSIS.md` now names it as an ordering, with every link quoted from the tree.

## What was done

**Task 1 — Discriminator B.** A seven-rung CPU ladder (rates 2, 4, 8, 12, 20, plus 40 and 80 added at
executor discretion) at the **unset** budget, i.e. the production 2000 ms. **71 runs, zero failures.**
The throttle demonstrably applied — median test body rose 3.45 s → 9.31 s — and the tri-state migrated
monotonically from H1-shaped (11/11 at rate ≤ 2) to H2-shaped (40/40 at rate ≥ 12), a shift that occurs
with the View Transition **on** and that plan 02 could not observe because its only route to
`headingCount: 0` was to switch the transition off.

The ladder alone would have been a shrug. The addition that made it a finding was **budget bisection at
a fixed rate**: hold the throttle, walk the budget, and the flip point *is* the window width in
milliseconds.

| CPU rate | Window | Amplification |
|---|---|---|
| 1 | 100–125 ms (plan 02) | 1× |
| 20 | 200–400 ms | ~2.7× |
| 40 | 400–800 ms | ~5.4× |
| 80 | unmeasurable — breaks the upstream Base-2 gate 4/5 | — |

Fitting those gives `gap ≈ 105 ms + 12 ms × rate`: the intercept dominates and is untouchable by a CPU
throttle. Reaching 2000 ms would need rate ~130–190; the technique already destroys the instrument at
80. That is why the outcome is recorded as **"Not forced at production budget; forced with the budget
lever"** rather than as a shortfall — no ladder could have succeeded, and the record says why with a
number.

The combination rung was decisive where neither lever was: budget 100 alone is plan 02's 11/15 (73 %),
and budget 100 + rate 20 is **10/10**. Better still, budget **400** + rate **40** is **15/15** over two
independently launched blocks at only a **5×** oracle shrink instead of 20× — that is the configuration
handed to plan 04.

Throttle hygiene (T-138-09) was proven adversarially: a rate-80 run interrupted mid-hop (exit 130),
then the very next unprefixed run returned **3.766 s** *and* an **H1-shaped** probe. The second signal
is the stronger one — tri-state class is categorical in throttle rate, so an unthrottled shape is proof
no throttle leaked, independent of timing noise.

**Task 2 — Contention.** Arm ISOLATED vs arm PRESSURED (a five-worker Chromium load generator, validated
against live HTTP 200 responses and reporting its own navigation counts). At the **production budget**
the arms are indistinguishable: **0/10 and 0/10**, despite the pressure measurably slowing the test body
1.32×. At a deliberately **marginal** operating point — rate 20 with a 400 ms budget, chosen to sit on
the edge of the measured band because a saturated point cannot show an effect — the arms are **1/10
isolated against 10/10 pressured**, p ≈ 0.0001. Verdict: **Contention-dependent**.

And bounded in the same breath, because the bound is the honest half: bisecting under load shows
contention widens the window by **less than 2×**. RESEARCH Assumptions Log A2 assumed six workers were
*the* amplifier; measured, they are *an* amplifier worth under 2× against a failure that needs ~36×.

One unprefixed full-suite run supplied the real-environment sample: **135 passed / 0 failed / 0 skipped
/ 0 flaky**, 622 s, 6 workers, 0 retries. Two things fell out of it. The hunt spec's probe inside the
green gate run is **H1-shaped** — the window is there, in the suite, on a passing run. And the hunt
spec's body stretched **1.32×** under the real suite against **1.32×** under the load generator, the
same figure to two digits, which is what licenses reading the model's result as a statement about the
suite.

**Task 3 — the named root cause.** Structure A, with all three hypothesis rows driven terminal.

## Key finding — the mechanism

**DEF-135-04 is an ordering defect, not an element defect.** SvelteKit commits the destination URL to
history (`client.js:1759-1760`), awaits the `onNavigate` callbacks (`client.js:1779-1785`) and only then
swaps the DOM (`client.js:1824`). The walk's settle (`voter-journey.spec.ts:186-190`) waits on the URL
only *and swallows its own timeout*, so it releases at the first of those and every later assertion
races a swap that has not happened. Inside the window the rendered question is still Base-2, whose
`custom_data` carries no `terms` (`base.ts:834`), and the trigger is emitted only when `terms` is
present (`QuestionHeading.svelte:61`, `:96-99`; `Term.svelte:127`) — so **no element with that testid is
ever constructed**, which is exactly why the error is `element(s) not found` rather than a visibility
failure.

The window is **unconditional**: across 262 probes over two plans, `triggerCount` was 0 at the settle
instant in every run except the two whose probe was itself delayed past the window by load. What varies
is only its width — ~112 ms median against a 2000 ms budget, ~18× smaller, which is precisely why the
defect is 1-in-8 rather than constant.

Both paradoxical facts from the original write-up are reconciled, and the paradox was **reproduced in a
single forced run**: the probe recorded `{"headingCount":0,"headingText":null,"triggerCount":0}` while
that same run's `error-context.md` shows the complete Base-3 heading with the `Likert` button — because
Playwright takes that snapshot after the budget expires, by which time the swap has landed.

## Hypotheses, all terminal

| ID | Status | The evidence that closed it |
|---|---|---|
| H1 | eliminated | Plan 02's 10-vs-10 A/B (transition not *necessary*), plus this plan's rate-independence measurement: snapshot capture is a frame cost and frame costs do not scale with CPU rate, so it could not have been the amplifier either |
| H2 | eliminated | Neither render gate's inputs can change on a Q→Q hop (`#opinionQuestions` is `$effect`-assigned over DataRoot/elections/constituencies at `voterContext.svelte.ts:499`; `question`/`questionBlock` are synchronous `$derived` over loaded data), the gate's own reroute log (`questions/+layout.svelte:119-121`) never fired in the forced-failure console transcript, and the 127 `headingCount: 0` probes rise monotonically with throttle rate — a mount-timing instant inside the swap, not a data gate |
| H3 | eliminated | **U-2 closed:** `DataRoot.update(` has exactly one frontend call site, `loadElectionData.ts:56`, an admin utility off the voter path — so `customData` cannot change between reads; text and trigger are one `$derived` into one `<h1>`; and **zero** H3-shaped observations in 262 probes, with both Base-3 sightings showing `triggerCount: 1` |
| H4 (RESEARCH U-3) | eliminated — does not fit | It predicts a visibility failure against a *found* element; the recorded and reproduced error is an existence failure |
| A2 (six-worker amplifier) | not confirmed — bounded, insufficient | Real (1/10 → 10/10 at the margin) but worth < 2× against a ~36× requirement |

**H3's elimination answered U-1 by derivation where artifact recovery had failed.** Since the term
trigger cannot be absent while the Base-3 heading text is present, the term assertion at
`voter-journey.spec.ts:862` could only have failed if the soft heading assertion at 858 had failed
first. U-1 searched eight locations and concluded UNRECOVERABLE; the mechanism now supplies the answer.

## What is NOT explained, stated as such

The field occurrence needed a window exceeding **~4000 ms** (858 consumed a full 2 s budget before 862
started its own) — roughly **36×** the median. Every lever in this phase reached at most **~5.4×**, and
the phase measured *why* neither can go further. **The mechanism is established; the amplifier is not.**
That gap is written into `138-DIAGNOSIS.md` as a bounded open question with the candidates named
(dev-server transform stall, GC pause, scheduling starvation, Chrome's ~4 s view-transition skip
ceiling) and with the instrument that will answer it — plan 01's forensic capture plus plan 02's hard
heading gate mean the next occurrence arrives as data. Nothing in the record reads as a closure.

## Deviations from Plan

### Method additions (Rule 2 — evidence the plan's stated method could not have produced)

**1. Budget bisection at fixed throttle rates.** The plan asked for a ladder of rates at the production
budget, which would have yielded "0/71, ceiling rate 80" and nothing else. Bisecting the budget at each
rung measured the window in milliseconds and produced the rate-independence result that localises the
mechanism and disqualifies H1 as the amplifier. Recorded as `138-FORCED-REPRO.md` §B.7.

**2. The ladder extended to rates 40 and 80.** RESEARCH §R2.4-B suggests a ceiling of 20; CONTEXT.md
grants tuning discretion. Rate 80 was the load-bearing rung — not because it forced anything, but
because it identified the *usable* ceiling, which is what makes "amplification cannot reach the
production budget" a defensible claim rather than an admission.

**3. Two combination rungs instead of one.** The plan asked for one. The highest rung turned out to be
degenerate (it breaks the upstream Base-2 gate), so a second at rate 20 was needed to have a clean one.

**4. The contention A/B run at a marginal operating point, not at the best forcing configuration.** The
plan's step 1 says arm ISOLATED uses the best forcing configuration from task 1. That configuration
fails 15/15, so both arms would have been saturated at 100 % and the comparison would have measured
nothing. Both arms were therefore also run at rate 20 + 400 ms — on the edge of the measured band, the
most sensitive point on the curve — and that is where the 1/10-vs-10/10 signal appeared. The production
budget arms are reported too.

**5. Both contention constructions run, not one.** The plan says pick (a) or (b). (a) is the primary
instrument because a rate comparison needs samples and (b) yields one hunt-spec sample per ~11-minute
run. (b) was then run once, **unprefixed**, so it is an ordinary gate observation rather than a forced
run — which additionally validated (a) against it (1.32× vs 1.32×) and produced a green 135/135 gate.

**6. The load generator is a bespoke script, not an existing project invocation.** The plan describes
"five further Chromium workers driving an existing read-only voter project". A second `playwright test`
invocation carries its own `data-setup-base` / `data-teardown-base` and would have raced the hunt run's
dataset import, contaminating the runs it was meant to pressure. The generator performs no DB writes and
depends on no seeded data. It was validated against live responses before use.

### Two discarded blocks, recorded rather than hidden

**7. A 20-run block died with `rate: NaN`.** A loop written as `set -- $CFG` did not word-split — the
session shell is `zsh` — so the whole string reached the knob and `Number("40 400")` is `NaN`. All 20
runs failed at the CDP call before reaching the hop. Caught by the per-run "which assertion failed"
field, not by eye. Recorded at §B.12.

**8. A 10-run "pressured" block ran with no pressure.** The load generator resolved
`require('@playwright/test')` against its own scratch directory and died instantly with
`MODULE_NOT_FOUND`. Caught by the duration signal — the block's median body was 3.52 s against the
isolated arm's 3.51 s, where genuine pressure produces 4.62 s. Re-run in full after fixing. Recorded at
§C.9.

Both are the exact failure mode this document's evidence rule exists to prevent: a confident null
result produced by an instrument that was not running.

### Correction

**9. A run count in both documents was made exact.** An earlier draft said "96 runs at the production
element budget"; 71 + 10 + 10 forced-lever runs is 91, with 96 reached only by counting the five
unprefixed verification runs and 97 by counting the full-suite sample. Both documents now state the
breakdown rather than the rounded total — a number not backed by a `results.json` field is, by the
document's own rule, a bug in the document.

### D-02

Not reached for. No artificial delay was injected into the live term-render path
(`QuestionHeading.svelte`, `Term.svelte`). D-02 names the old term-translation utility module, which
plan 01 established is dead code with no call site, so the constraint was read against the live parse
path. D-02 *conditionally authorises* the technique once a ladder has localised the race — the ladder
did localise it (§B.7.3), but the localisation was sufficient on its own, so the authorisation went
unexercised and there is nothing to record under it.

## Known Stubs

None. This plan produced no source changes — `git status --porcelain tests/ apps/` is empty, verified
after every task. Every one of the 217 recorded hunt-project runs was driven by an environment prefix
plus `--reporter=json`; no committed file was edited, no `TIMEOUTS` value moved, and no quarantine,
`skip`, `fixme` or `.only` annotation was added to any spec.

## Verification

| Check | Result |
|---|---|
| `138-FORCED-REPRO.md` has exactly one `## Discriminator B` with one of the three named outcomes, the combination rung, and the throttle-hygiene durations | PASS |
| `138-FORCED-REPRO.md` has exactly one `## Contention` with one of the three named verdicts and the plan-04 instruction | PASS |
| `138-DIAGNOSIS.md` § Named root cause follows Structure A with all five subsections; ≥ 3 distinct quoted `file:line` refs (10 present) | PASS |
| `grep -c 'PENDING — plan 03 writes this section.'` | 0 |
| `grep -cE '^\| H[123] \|.*(confirmed\|eliminated\|open-with-stated-reason)'` | 3 |
| `grep -c 'translateQuestionTerms'` on the diagnosis | 0 |
| `grep -niE 'could not reproduce\|unable to reproduce\|did not recur, so'` | no match |
| Unprefixed `--project=eperm07-term-trigger` run, no forcing prefix | **exit 0**, 3 passed (7.2 s) |
| `git status --porcelain tests/ apps/` | empty |
| No orphan Chromium, driver or extra listener on 5273 | confirmed (only the operator's PID 92504) |
| Full gate suite, unprefixed | 135 passed / 0 failed / 0 skipped / 0 flaky |

## Self-Check: PASSED

All three documents exist on disk (`138-03-SUMMARY.md`, `138-FORCED-REPRO.md`, `138-DIAGNOSIS.md`) and
all four commits are reachable in `git log --all`: `9ea193bb7` (Discriminator B), `2ca539a9b`
(Contention), `f91679f5c` (Named root cause), `067f890f3` (Summary + run-count correction).
