---
phase: 133-fix-phase-132-code-review-gaps
fixed_at: 2026-07-26T00:00:00Z
review_path: .planning/phases/133-fix-phase-132-code-review-gaps/133-REVIEW.md
iteration: 1
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 133: Code Review Fix Report

**Fixed at:** 2026-07-26
**Source review:** `.planning/phases/133-fix-phase-132-code-review-gaps/133-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 2 (WR-01, WR-02 — critical + warning; 0 critical existed)
- Fixed: 2
- Skipped: 0

**Scope note:** Fix scope was critical + warning only. The 4 Info findings (IN-01..IN-04) were
explicitly out of scope for this run and were NOT touched.

**Hard constraint honoured:** Phase 133 is complete and signed off by a 3× green Playwright E2E
gate (129/129, 0 unexpected/flaky/skipped) against the current behaviour of
`tests/tests/utils/voterNavigation.ts`. Both fixes are **documentation-only** — no runtime
behaviour changed. Specifically: `TIMEOUTS.slowPage` was left in place on both continue-button
visibility waits (WR-01's first remedy was deliberately declined in favour of its second,
documentation remedy), `maxSteps` remains 10, and no control flow, branch, or `.catch()` handling
was altered.

**Verification:** `git diff db670d788..HEAD -- tests/` filtered for non-comment changed lines
returns empty — every changed line sits inside a `//` line comment or the `advanceVoterFlow` JSDoc
block. `yarn lint:check` (turbo lint + `eslint tests` + `typecheck:tests`) exits 0; the only output
is pre-existing warnings in unrelated files, none in `voterNavigation.ts`. The E2E suite was
deliberately NOT re-run — no behaviour changed and a single run costs ~11 minutes.

## Fixed Issues

### WR-01: The "exhausts `maxSteps` and fails loudly at the terminal wait" contract is unreachable in the button-never-renders case

**Files modified:** `tests/tests/utils/voterNavigation.ts`
**Commit:** `21f28ac7a`
**Applied fix:** Took the review's **second** remedy (documentation), not the first
(`slowPage` → `page` timeout change), because `slowPage` is genuinely required on both waits for
cold start. Rewrote both continue-button comment blocks — the constituencies branch (previously
lines 163-167) and the elections branch (previously lines 196-200) — to drop the unconditional
"a genuinely-stuck screen exhausts `maxSteps`" claim and replace it with an honest two-case
breakdown:

- **Click no-ops (button renders, click does nothing):** each iteration costs only the
  `TIMEOUTS.page` URL settle, so the loop *does* exhaust `maxSteps` (~10 × 5 s + 5 s terminal wait
  ≈ 55 s, inside the 90 s `TIMEOUTS.testMax` ceiling) and *does* reach the terminal `stopAt` wait.
  The elections-branch comment cites the empirical confirmation of this path recorded in
  `133-UAT.md` test 1 — a deliberately-broken build failed at the terminal
  `getByTestId('question-choice')` wait at 54.4 s with no `page.goto()` rescue.
- **Button never renders:** each iteration burns the full `slowPage` (10 s), so
  `maxSteps` × `slowPage` = 100 s overruns the 90 s ceiling. The test is killed inside iteration
  9's `waitFor`, naming `voter-elections-continue` / `voter-constituencies-continue`, and the
  terminal `stopAt` wait is never reached. The comments now state plainly that `maxSteps` is NOT
  the binding constraint on this path — the wall clock is — and that raising `maxSteps` alone
  changes nothing, which was the false model the review flagged.

Both comments also now record *why* `slowPage` is the correct bucket on each branch (cold-start
multi-roundtrip first paint for elections; post-selection data roundtrip for constituencies), so a
future maintainer does not re-derive the rejected "just lower it to `page`" fix. Both branches keep
the "never routed around" guarantee, which remains true — it is the failure *surface* that differs
between the two cases, not whether the failure is loud.

### WR-02: Retry headroom is 4 iterations, not the "generous" margin the docstring implies

**Files modified:** `tests/tests/utils/voterNavigation.ts`
**Commit:** `586859376`
**Applied fix:** Replaced the `@param opts.maxSteps` JSDoc line in `advanceVoterFlow` with the
review's suggested wording verbatim. The old text claimed "at most 5 real hops so 10 is generous
headroom"; the corrected text states 5 click-hops **plus 1 terminal-detect iteration**, leaving
**4** retry iterations (not 5), and names the real constraint — that the wall-clock budget
(`maxSteps` × the slowest per-iteration wait) binds before `maxSteps` does, cross-referencing the
continue-button waits corrected in WR-01. Pure arithmetic/doc correction; `maxSteps` default is
unchanged at 10.

---

_Fixed: 2026-07-26_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
