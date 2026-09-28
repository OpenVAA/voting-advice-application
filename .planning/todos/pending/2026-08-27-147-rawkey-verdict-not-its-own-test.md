---
created: 2026-08-27T16:07:00.000Z
title: The raw-key verdict reports inside the axe test's body, not as its own test — criterion 5 accepted, not solved
area: tests / reporting
severity: minor
source: Phase 147 (147-02 decision B, re-surfaced by 147-03; filed by 147-05)
files:
  - tests/tests/utils/axeScan.ts
  - tests/tests/specs/a11y/a11y-smoke.spec.ts
  - tests/tests/specs/a11y/candidate-a11y.spec.ts
---

## The open judgement

ROADMAP Phase 147 criterion 5 asks that `assertNoRawI18nKeys` report **independently** of the axe
assertion, so raw-key coverage is not hostage to an a11y failure.

`147-02` measured what was already true and what was not:

- **Execution independence already held.** The raw-key gate runs *before* the axe scan in the shared
  body, so it reaches its verdict regardless of what axe later says. The scout recorded this
  (§ C) — criterion 5 was an **execution** claim about something that was already a **reporting**
  problem.
- **`147-02` chose decision (B):** report the raw-key verdict via `expect.soft` inside the shared
  scan body, so both findings surface from one test rather than the raw-key failure aborting before
  axe reports.

That satisfies the criterion's **purpose**. It does **not** satisfy the scout's literal restatement,
*"reported as its own **test**"* — reporter output still shows one test per surface with both
findings inside it.

`147-03` re-surfaced this explicitly rather than letting the green close it: *"the one place in this
phase where the evidence does not by itself force the answer."*

## The cost, measured

`147-02` priced the alternative — splitting the raw-key verdict into its own `test()` per surface —
at **≤ +138 s** of suite wall clock. That is the number the decision turned on, and it is the number
a future phase should re-derive rather than re-argue: the suite has grown by 15 tests since.

## Solution — decide, don't drift

1. **Keep (B)** and correct criterion 5's wording to the property actually delivered: an independent,
   non-subsumed raw-key verdict reported alongside the axe verdict. Records the choice; costs
   nothing.
2. **Split** the raw-key verdict into its own test per surface, at the measured cost, and get the
   reporter granularity the literal wording asks for.

What should not happen is that the criterion stays worded one way while the code does another — the
drift class Phase 147 spent a whole plan retiring.

## Note

`147-03` also recorded a consequence of (B) worth carrying: an injected raw key now fails the test
**at its end** rather than aborting it, so the same test still reports its axe verdict. Read the
failure list, not just the first error.
