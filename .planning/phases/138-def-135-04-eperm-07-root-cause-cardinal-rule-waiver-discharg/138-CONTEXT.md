# Phase 138: DEF-135-04 — `EPERM-07` Root Cause + Cardinal-Rule Waiver Discharge - Context

**Gathered:** 2026-08-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Diagnose the intermittent `EPERM-07` term-trigger E2E failure (DEF-135-04) to a **named root cause**,
prove the fix with a before/after negative control under a forcing harness, hold it across ≥16
consecutive preflight-confirmed full-suite runs, and discharge
`.planning/v2.14-CARDINAL-RULE-WAIVER.md` unrenewed.

This is a **diagnosis phase, not an implementation phase**. It is deliberately not padded with
adjacent work. It may spend a plan on a hypothesis that gets disproved — a disproof is recorded and
the next hypothesis pursued. What it may **not** do is close on non-reproduction, open a successor
waiver, add a `test.skip`, or add a retry annotation.

</domain>

<decisions>
## Implementation Decisions

### Forcing the failure on demand (ROADMAP criterion 1)

- **D-01:** The forcing harness is **CDP CPU/network throttling on the Base-2 → Base-3 transition,
  combined with a temporarily shrunken `TIMEOUTS.element` budget** — amplifying the existing race
  without touching app code. The amplified budget doubles as the negative-control knob (pre-fix
  FAILS under the forced condition, post-fix PASSES).
  — **Reversibility:** reversible — the throttle and the shrunk budget are test-harness-local and
  must not be left in the committed default configuration.
- **D-02:** Fault injection **into the app path** (an artificial delay in `translateQuestionTerms` /
  `Term.svelte`) is NOT the chosen first mechanism, because the mechanism is not yet identified and
  injecting there presumes the answer. It remains available as a follow-on once throttling has
  localised the race.

### Where a reproduction counts (repro scope)

- **D-03:** The hunt runs in an **isolated minimal spec** that drives only Base-1 → Base-2 → Base-3
  and asserts the term trigger — seconds per iteration instead of ~10.5 minutes, so dozens of forcing
  attempts are affordable.
- **D-04:** Known risk of D-03, to be stated in the plan: the isolated spec may not carry the
  full-suite's contention conditions. If the forced failure will not reproduce in isolation, that is
  itself a finding about the mechanism (contention-dependent) and redirects the hunt — it does not
  close the phase.

### Fix shape (ROADMAP criterion 2)

- **D-05:** The accepted fix is a **fix to the app race** — if the mechanism is a real mount/parse
  race in `Term.svelte` / `translateQuestionTerms.ts`, it is fixed in the product, because a user
  could see the same flash.
  — **Reversibility:** costly — a change in the term-parsing/mount path affects every question
  heading that carries an in-text term, across all four locales.
- **D-06:** **Test-side fixes are NOT pre-authorised.** If the forced repro shows the mechanism is
  genuinely test-side (the locator resolves before the term-parsing pass, with no user-visible
  defect), the executor **stops and escalates to the operator as a checkpoint decision** with the
  evidence in hand. It does not apply a test-side remedy unilaterally. This keeps the app-only
  preference from silently expanding.
- **D-07:** A **bare timeout bump is not a fix** and is rejected as a non-diagnosis. Raising
  `TIMEOUTS.element` and declaring the defect resolved does not satisfy criterion 2 and must not
  appear as the phase outcome.
- **D-08:** The upstream `expect.soft` heading assertion at `voter-journey.spec.ts:858` is
  **promoted to a hard assertion** as a diagnostic improvement, so a mis-timed Base-3 arrival fails
  where it is explainable rather than surfacing at the (harder) term check downstream. This is done
  regardless of what the diagnosis finds — `deferred-items.md` § DEF-135-04 "Suggested follow-up"
  already recommends it.
  — **Reversibility:** reversible — single-assertion change in one spec.

### Forensic capture, landing BEFORE the hunt (Plan 01)

Honours the waiver's condition 3 — "the next occurrence is data" — so every later v2.15 phase's
suite runs contribute evidence rather than discarding it.

- **D-09:** Add **video retention** on the term-trigger path. `trace: 'on'` already exists at
  `tests/playwright.config.ts:133`; no `video` setting exists, so a recurrence is currently traceable
  but not replayable.
- **D-10:** Add **dev-server log retention** alongside each run's artifacts, so a server-side stall
  (SSR, module transform) is observable rather than inferred.
- **D-11:** Add **browser console + network capture**, so a late-arriving fetch or a client error on
  the Base-2 → Base-3 transition is directly observable.
- **D-12:** A durable cross-phase per-run results ledger was offered and **not** selected. The 16-run
  gate still has to produce recorded evidence for criterion 3 — do that as a phase-local run log
  (per-run pass/fail, preflight verdict, timestamp) rather than building a milestone-wide accumulator.

### The 16-run determinism gate (ROADMAP criterion 3)

- **D-13:** Execute as a **serial local unattended batch** — a scripted loop of 16 full-suite runs on
  the host, each gated by the Phase-137 served-app preflight, each result logged. ~3 h wall clock.
  This matches the environment in which the 1-in-8 was originally observed.
- **D-14:** Containerised runs are explicitly NOT the gate environment — proving it in a place the
  failure never happened is weaker evidence, not stronger.
- **D-15:** The 16 runs are **not** interleaved across Phases 139–150. The waiver is discharged
  inside Phase 138, per the ROADMAP's "138 second" sequencing rationale.

### Standing v2.15 acceptance rule (inherited, applies here)

- **D-16:** Prove the guard fails before claiming it guards — negative control run twice: once
  against the pre-fix code to demonstrate the failure, once against the post-fix code to demonstrate
  the catch. A fix accepted on "it stopped happening" does not satisfy criterion 2.
- **D-17:** Every run used as evidence must be confirmed by the Phase-137 preflight (proof the page
  under test came from this checkout).

### Waiver discharge (ROADMAP criterion 4)

- **D-18:** `.planning/v2.14-CARDINAL-RULE-WAIVER.md` is marked **discharged** with the diagnosis
  referenced. No successor waiver, no `test.skip`, no retry annotation, and no "could not reproduce"
  closure may exist anywhere in the record. The cardinal rule returns to force unwaived.
  — **Reversibility:** one-way — discharging the waiver removes the project's only recorded
  cardinal-rule exception; re-opening one would, by the waiver's own condition 4, be evidence that
  the rule needs rewriting rather than re-waiving.

### Claude's Discretion

- Exact throttle factors (CPU slowdown multiplier, network profile) and the shrunk `TIMEOUTS.element`
  value used by the forcing harness — tune empirically until the pre-fix failure is deterministic.
- The shape of the isolated minimal spec (fixture reuse, seed template) — reuse
  `tests/tests/fixtures/voter/questionInfo.fixture.ts` and the `e2e/base` template where they fit.
- Whether video retention is scoped to the term-trigger spec/project only or enabled more broadly —
  weigh artifact size against replay coverage.
- The plan-count and split for the phase (the ROADMAP records "Plans: TBD"), subject to the fixed
  ordering that forensic capture (D-09..D-11) lands before the hunt.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The defect and its waiver
- `.planning/v2.14-CARDINAL-RULE-WAIVER.md` — the waiver being discharged; its four attached
  conditions bound what this phase may and may not do.
- `.planning/milestones/v2.14-phases/135-close-phase-134-coverage-carry-overs/deferred-items.md`
  § DEF-135-04 (lines 164–222) — the original observation, the verbatim failure text, the page
  snapshot showing the trigger present, the disproved cold-start-Vite hypothesis, and the
  "Suggested follow-up" that D-08 implements.
- `.planning/milestones/v2.14-phases/135-close-phase-134-coverage-carry-overs/135-04-SUMMARY.md` —
  the Plan 04 gate update (did not recur across three full-suite runs on cold Vite cache).

### Phase scope and requirements
- `.planning/ROADMAP.md` lines 292–304 — Phase 138 goal, the four success criteria, and the shape
  note ("diagnosis phase, not an implementation phase"; may not close on non-reproduction).
- `.planning/ROADMAP.md` line 228 — why 138 runs second in the milestone.
- `.planning/REQUIREMENTS.md` lines 45–47 — INTEG-01 (named root cause), INTEG-02 (determinism run
  long enough to exercise 1-in-8), INTEG-03 (waiver discharged, no successor).
- `.planning/REQUIREMENTS.md` line 110 — explicit non-goal: renewing or re-scoping the waiver.

### The failing assertion and its rendering path
- `tests/tests/specs/voter/voter-journey.spec.ts` lines 841–874 — the `EPERM-07 customData.terms`
  step; line 858 is the `expect.soft` heading assertion promoted by D-08; line 862 is the hard
  `toBeVisible` that fails.
- `apps/frontend/src/lib/components/term/Term.svelte` — the `<Term>` affordance; line 127 emits
  `data-testid="voter-questions-term-trigger"`. W3C APG tooltip pattern: the popup mounts only while
  hovered/focused.
- `apps/frontend/src/lib/api/utils/translateQuestionTerms.ts` — the term-parsing pass over the
  heading text; prime suspect surface for the mount/parse race.
- `tests/tests/utils/testIds.ts` lines 236–245 — `termTrigger` / `termPopup` id definitions and the
  comment describing where the in-text trigger renders.
- `tests/tests/fixtures/voter/questionInfo.fixture.ts` — the EPERM-07 voter fixture.

### Harness and gate configuration
- `tests/playwright.config.ts` line 115 (`retries: CI ? 3 : 0`), line 133 (`trace: 'on'`) — current
  artifact retention; no `video` setting exists today (D-09).
- `tests/README.md` § Run — the Phase-137 served-app preflight, how to read a preflight failure
  field by field, and the `FRONTEND_PORT` escape hatch.
- `CLAUDE.md` § "E2E Hard Rule (cardinal failure)" + § "E2E preflight (served-application gate)" — the cardinal E2E rule (the rule being restored) and the preflight
  section.
- `.planning/phases/137-e2e-preflight-integrity-assert-the-served-application/137-NEGATIVE-CONTROL.md`
  — the negative-control record format this phase's criterion-2 pair should follow.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Phase-137 preflight** (`tests/tests/support/preflight.ts`) — already gates every run; satisfies
  D-17 with no new work, and every evidence run inherits it automatically.
- **`trace: 'on'`** (`tests/playwright.config.ts:133`) — traces already retained; the forensic plan
  adds video/console/network/server-log around an existing foundation rather than starting from zero.
- **`questionInfo.fixture.ts` + `e2e/base` seed template** — the Base-3 `terms` block was seeded in
  Phase 119 (`base.ts:782-790`); the isolated minimal spec can reuse both directly.
- **`_probes/questionInfo.probe.spec.ts`** — an existing narrow EPERM-07 probe; a useful shape
  precedent for the isolated minimal spec of D-03.

### Established Patterns
- **Negative-control-pair recording** — Phase 137 established the format (`137-NEGATIVE-CONTROL.md`:
  old assertion shown PASSING against the scenario, new assertion shown FAILING). D-16 follows it.
- **`TIMEOUTS.element` = 2 s** is the shared budget the failing assertion uses; shrinking it is a
  harness-wide lever, so the forcing harness must scope the shrink rather than change the default.
- **Soft-vs-hard assertion placement** already carries diagnostic meaning in this suite — the known
  misdirection at the term check (D-08) is a direct instance.

### Integration Points
- `tests/playwright.config.ts` — where video/console/network/server-log retention is wired (D-09..D-11).
- `voter-journey.spec.ts:858` — the single-line soft→hard promotion (D-08).
- `Term.svelte` / `translateQuestionTerms.ts` — where an app-side fix would land (D-05), if the
  mechanism proves to be there.
- `.planning/v2.14-CARDINAL-RULE-WAIVER.md` + `.planning/STATE.md:65` + `.planning/MILESTONES.md` —
  the records that must all reflect discharge (D-18), not just the waiver file.

</code_context>

<specifics>
## Specific Ideas

- The failure is a **latency signal, not an absence signal** — the failure's own page snapshot showed
  the heading rendered at the moment of failure. Any diagnosis that explains the trigger as *missing*
  contradicts the captured evidence.
- The **cold-start-Vite hypothesis is already eliminated** (four first-after-restart runs passed,
  including three on a cold Vite cache via `dev:clean`). Do not re-test it as if it were open.
- Current honest baseline: **1 failure in 8 full-suite runs** (plus 8 voter-journey runs). 16 runs is
  deliberately 2× that rate.
- The hard/soft asymmetry is the reason the failure surfaces where it does: the heading check above
  it is soft, so a mis-timed Base-3 arrival is not caught until the term check.

</specifics>

<deferred>
## Deferred Ideas

- **Durable cross-phase run-results ledger** — offered and declined for this phase (D-12). If later
  v2.15 phases want an accumulating failure-rate baseline, that is its own small phase.
- **DEF-135-05** (two concurrent turbo build graphs race on `packages/*/dist`) — a separate open
  deferred item in the same file; unrelated build-tooling hazard, not in this phase's scope.
- **Broadening video retention across the whole suite** — if artifact size proves acceptable during
  this phase, propose it as a suite-wide change in a later phase rather than expanding scope here.

</deferred>

---

*Phase: 138-DEF-135-04 — `EPERM-07` Root Cause + Cardinal-Rule Waiver Discharge*
*Context gathered: 2026-08-13*
