---
phase: 121-e2e-specs-flow-coverage
plan: 01
subsystem: e2e-tests
tags: [e2e, playwright, voter-journey, entity-filters, submatches, EFLOW]
requires:
  - "tests/tests/fixtures/voter/entityFilters.fixture.ts (selectAll/selectNone/getSelectAllToggle/setTextFilter/clearTextFilter)"
  - "e2e/base seed dataset (deterministic candidate/party topology)"
provides:
  - "EFLOW-01 asserted: categorical filter select-all/none + text×filter intersection + reset"
  - "EFLOW-04 asserted: per-category subMatch CORRECT values for one pinned candidate"
  - "EFLOW-03/-05 confirmed-covered evidence cited in-file (greppable)"
affects:
  - "tests/tests/specs/voter/voter-journey.spec.ts"
tech-stack:
  added: []
  patterns:
    - "Pin a subMatch gauge by its question-group label, read aria-valuenow off role=meter"
    - "Use the >3-option Party filter (not pick-multiple) for the select-all/none flip-toggle"
    - "Navigation-budget timeout (TIMEOUTS.page) for post-goBack answer-restore assertions"
key-files:
  created: []
  modified:
    - "tests/tests/specs/voter/voter-journey.spec.ts"
decisions:
  - "EFLOW-01 select-all/none surfaced on the Party filter (6 options > 3 threshold); pick-multiple has 3 options so its toggle is asserted ABSENT"
  - "EFLOW-04 gauge values DERIVED at build (Base=100, Opt-A=50, Opt-B=50, Regional=100) — not the uniform ≈100% the research assumed"
  - "text×dialog intersection: text 'polar' (2) ∩ Party=BB → 1 card (Polar-Max BB One)"
metrics:
  duration: "~75 min"
  completed: "2026-06-16"
  tasks: 3
  files: 1
---

# Phase 121 Plan 01: EFLOW Flow Coverage (filters + subMatches + re-confirm) Summary

EFLOW-01 categorical select-all/none + a text×dialog-filter intersection + reset, and
EFLOW-04 correct per-category subMatch values for the name-pinned polar-MAX candidate,
added to `voter-journey.spec.ts`; EFLOW-03/-05 confirmed-covered assertions cited in-file.
The `voter-journey` project passes the cardinal determinism gate (5/5 consecutive after a
one-line pre-existing-flake fix).

## What Was Built

- **EFLOW-01 (Task 1):** A new `test.step` adds three net-new cells on top of the existing
  per-filter coverage:
  - **Select-all / select-none** on the Party filter (6 options, > 3 threshold → the
    `EnumeratedEntityFilter` flip-toggle renders). `selectAll()` → 13 cards; `selectNone()`
    → 0 cards; the toggle is asserted **ABSENT** on the 3-option pick-multiple filter.
  - **Text × dialog intersection:** text `'polar'` (2 cards) ∩ Party = `BB` → exactly 1
    card (Polar-Max BB One) — strictly narrower than either constraint alone.
  - **Reset:** clear text + reset the dialog filter restores the full 13-card list.
- **EFLOW-04 (Task 2):** The subMatches assertion upgrades from count-only `toHaveCount(4)`
  to per-category CORRECT values, pinned to candidate `test-ca-bb-1` by `TEXT_RE.polarMax`
  (never `.first()`). Each gauge's `aria-valuenow` (read off its `role=meter`) is asserted:
  Base = 100, Opt-A = 50, Opt-B = 50, Regional = 100. A module-scope `gaugeMeterByLabel`
  helper pins each gauge by its question-group label.
- **EFLOW-03/-05 (Task 3):** Traceability comments at the cited sites (the 4-case
  voter-vs-entity comparison matrix; the skip + delete/back-nav + answer-count→results-CTA
  behaviour). Comments only — no behaviour change.

## Key Decisions

1. **Select-all/none uses the Party filter, not pick-multiple.** Build-time probing of the
   rendered dialog showed Party has **6** options (AA, AB, BA, BB, C, "No answer") → exceeds
   the `values.length > 3` threshold, so the flip-toggle renders there; the pick-multiple
   filter has only **3** options → its toggle is absent. The research had guessed the
   opposite (pick-multiple as the >3 filter). Corrected against the actual rendered DOM.
2. **EFLOW-04 values were DERIVED, not assumed.** The research/plan premise was "≈100% per
   answered category, only answered categories appear." The rendered reality for the
   polar-MAX candidate is **4 gauges with mixed values (100/50/50/100)**: the voter-answered
   Base + Regional groups score the full 100, while the two optional groups the voter
   skipped/de-selected (Opt-A NotSelected, Opt-B Skipped) read the neutral **50**. The exact
   values were read off the rendered `aria-valuenow` at build time and pinned by label.
3. **text×dialog intersection target = Party BB.** Polar-Max BB One is in Party BB,
   Polar-Min BA One in Party BA (base.ts), so text 'polar' ∩ BB → exactly 1 card — a clean,
   non-degenerate, deterministic intersection narrower than either alone.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Widen post-`goBack()` answer-restore timeout to the navigation budget**
- **Found during:** Determinism gate (the cardinal 3× run). The `voter-journey` walk
  flaked intermittently (~1-in-3) at the previous-question-roundtrip step (`voter-journey.spec.ts`
  L570), asserting `toBeChecked` on the restored answer within only the 2 s element budget
  after a full `page.goBack()` navigation.
- **Root cause (confirmed pre-existing):** `page.goBack()` is a FULL browser navigation —
  SvelteKit re-runs `load` and the question variant remounts via `{#key question.type}`; the
  persisted answer is re-hydrated onto the radio's `checked` state only after that round-trip
  settles, occasionally past 2 s. Reproduced on the **unmodified baseline** (stash + re-run),
  so it is NOT introduced by the EFLOW-01/04 additions.
- **Fix:** Use `TIMEOUTS.page` (5 s navigation budget) for this single post-`goBack`
  answer-restore assertion — matching the single-navigation round-trip it actually waits on.
- **Files modified:** `tests/tests/specs/voter/voter-journey.spec.ts` (L570 region)
- **Commit:** `99dd7e259`
- **Result:** 5/5 consecutive green after the fix.

### Environmental (test-harness) note — NOT a code defect

While running the spec many times in this session via `--no-deps` against a persistent local
DB, the feedback step intermittently failed (`data-status` stuck at `sending`, or → `error`).
Root cause: the **feedback table's per-IP rate limit (5 inserts/IP** in
`private.feedback_rate_limits`; 6th insert raises "Rate limit exceeded"). Each `voter-journey`
run inserts one feedback row, so repeated `--no-deps` reruns against the same DB exhaust the
counter. This is **not present in the canonical chain** (each run gets a fresh seed/teardown)
and is unrelated to this plan's scope. Cleared the counter between determinism reruns to obtain
a trustworthy signal; no code/test change made for it. Logged as a deferred infra item.

## Verification

- **Cardinal E2E gate:** `voter-journey --no-deps` passed **5/5** consecutive (after the L570
  fix + clearing the per-IP feedback rate-limit counter between reruns). The EFLOW-01/04
  assertions passed in every run that reached them across ~18 total runs — they were never the
  failing assertion.
- **Lint:** `yarn lint:check` clean (11/11 tasks; only pre-existing `@openvaa/core` /
  `@openvaa/dev-seed` warnings, 0 errors, none in the edited file).
- **Marker greps:** `selectAll()|selectNone()` = 2; `EFLOW-03|EFLOW-05` = 8;
  `EFLOW-04|aria-valuenow` = 9.

## Deferred Items

- **Feedback step per-IP rate-limit accumulation under repeated `--no-deps` reruns** — a
  test-harness/infra characteristic (the `private.feedback_rate_limits` 5-per-IP cap), not a
  code defect and not in this plan's scope. The canonical seed/teardown chain avoids it. A
  future hardening could reset the counter in the base setup/teardown if repeated local reruns
  become a common workflow.

## Self-Check: PASSED

- `tests/tests/specs/voter/voter-journey.spec.ts` — FOUND
- `.planning/phases/121-e2e-specs-flow-coverage/121-01-SUMMARY.md` — FOUND
- Commits `2aa39c6df` (T1), `a637bede7` (T2), `99dd7e259` (deviation fix), `72cafa498` (T3) — all FOUND
