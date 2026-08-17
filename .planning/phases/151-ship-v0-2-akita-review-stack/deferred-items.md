# Deferred items — phase 151

Out-of-scope discoveries logged during execution. Not fixed by the plan that found them.

## From plan 151-17

- **`gsd-tools query state.add-decision` writes `[Phase ?]` instead of the phase number.** Four
  decisions added by this plan were corrected by hand to `[Phase 151]`. **256 pre-existing entries
  in `.planning/STATE.md` carry the same `[Phase ?]` placeholder** — a tooling defect with a long
  tail, not a defect of this phase. Left alone under the scope boundary: it is unrelated to slice
  11, and a 256-line rewrite of STATE.md inside a publication plan would be exactly the kind of
  unrequested churn the boundary exists to prevent.
- **`gsd-tools query state.update-progress` reports `Progress field not found in STATE.md`.**
  Pre-existing STATE.md shape mismatch; the progress bar was not updated by this plan. Recorded
  rather than chased.
