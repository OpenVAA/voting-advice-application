---
phase: 133-fix-phase-132-code-review-gaps
fixed_at: 2026-07-26T00:00:00Z
review_path: .planning/phases/133-fix-phase-132-code-review-gaps/133-REVIEW.md
iteration: 2
findings_in_scope: 6
fixed: 5
skipped: 1
status: partial
---

# Phase 133: Code Review Fix Report

**Fixed at:** 2026-07-26
**Source review:** `.planning/phases/133-fix-phase-132-code-review-gaps/133-REVIEW.md`
**Iteration:** 2 (cumulative — covers iteration 1 + iteration 2)

**Summary:**
- Findings in scope: 6 (WR-01, WR-02, IN-01..IN-04 — 0 critical existed)
- Fixed: 5 (WR-01, WR-02 in iteration 1; IN-01, IN-02, IN-04 in iteration 2)
- Skipped: 1 (IN-03 — the review itself prescribes no fix for this phase)

**Iteration split:**

| Iteration | Scope | Findings | Commits |
|---|---|---|---|
| 1 | critical + warning | WR-01, WR-02 | `21f28ac7a`, `586859376` |
| 2 | info (`--fix-scope all`) | IN-01, IN-02, IN-04 (IN-03 skipped) | `9dcf488ad`, `62e1e4e72`, `d7f08858d` |

**Hard constraint honoured (both iterations):** Phase 133 is complete and signed off by a 3× green
Playwright E2E gate (129/129, 0 unexpected/flaky/skipped) against the current behaviour of
`tests/tests/utils/voterNavigation.ts`. Across all five fixes: no timeout constant changed
(`TIMEOUTS.slowPage`, `TIMEOUTS.page`, the 3000 ms fast-fail clicks all untouched), `maxSteps`
remains 10, no numeric budget moved, and no `page.goto()` fallback was reinstated. Iteration 1 was
documentation-only. Iteration 2's two code changes are **inert on a passing run** by construction —
see the per-finding inertness arguments below.

**Verification (iteration 2):**
- `git diff 586859376..HEAD -- tests/` reviewed line by line. One file changed
  (`tests/tests/utils/voterNavigation.ts`, +40/−16). Scanning added lines for forbidden tokens
  (`page.goto`, `maxSteps =`, `slowPage`, `TIMEOUTS.*`, `3000`) returns only two hits, both inside
  reworded **comment** text (`// URL settle (TIMEOUTS.page bucket …)`) — the corresponding
  `timeout: TIMEOUTS.page` code lines are unchanged context lines in the diff.
- `grep -rn "advanceVoterFlow(" tests/` returns exactly two hits: the declaration
  (`voterNavigation.ts:102`) and its single call site (`voterNavigation.ts:311`), which passes
  `'first-question'` explicitly. `advanceVoterFlow` is module-private, so this is the *complete*
  consumer set — substantiating the IN-04 inertness claim more strongly than the review's own
  three-consumer list (those three specs reach it indirectly through the exported
  `navigateToFirstQuestion`, which is the `'first-question'` call site).
- `yarn lint:check` exits **0** (turbo lint + `eslint tests` + tests typecheck). Only pre-existing
  warnings in unrelated files; none in `voterNavigation.ts`. `tsc -p tests/tsconfig.json --noEmit`
  re-run standalone also exits 0, and `prettier --check` on the edited file passes.
- E2E suite deliberately NOT run — the orchestrator runs the full-suite regression check.

## Fixed Issues

### WR-01: The "exhausts `maxSteps` and fails loudly at the terminal wait" contract is unreachable in the button-never-renders case

**Files modified:** `tests/tests/utils/voterNavigation.ts`
**Commit:** `21f28ac7a` (iteration 1)
**Applied fix:** Took the review's **second** remedy (documentation), not the first
(`slowPage` → `page` timeout change), because `slowPage` is genuinely required on both waits for
cold start. Rewrote both continue-button comment blocks — the constituencies branch and the
elections branch — to drop the unconditional "a genuinely-stuck screen exhausts `maxSteps`" claim
and replace it with an honest two-case breakdown:

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
**Commit:** `586859376` (iteration 1)
**Applied fix:** Replaced the `@param opts.maxSteps` JSDoc line in `advanceVoterFlow` with the
review's suggested wording verbatim. The old text claimed "at most 5 real hops so 10 is generous
headroom"; the corrected text states 5 click-hops **plus 1 terminal-detect iteration**, leaving
**4** retry iterations (not 5), and names the real constraint — that the wall-clock budget
(`maxSteps` × the slowest per-iteration wait) binds before `maxSteps` does, cross-referencing the
continue-button waits corrected in WR-01. Pure arithmetic/doc correction; `maxSteps` default is
unchanged at 10.

### IN-01: Stale line reference in the `navigateToFirstQuestion` comment

**Files modified:** `tests/tests/utils/voterNavigation.ts`
**Commit:** `9dcf488ad` (iteration 2)
**Applied fix:** Documentation only. Replaced the stale `(line ~167)` pointer — which after the
`resolveSeedUuids`/`uuidCache` deletion pointed into the middle of the constituencies continue-button
comment block — with the review's suggested symbolic wording:
`advanceVoterFlow can short-circuit (the terminal answerOption.isVisible() early return)`. The
number was **dropped rather than re-pinned** to 136, per the review's own rationale that a numeric
pointer will drift again on the next edit. The surrounding `// reason:` block was re-wrapped to the
project's 120-column width so the paragraph reflows cleanly; no other prose changed.

**Inertness:** comment-only — zero runtime effect.

### IN-02: `.catch(() => null)` on the URL settles swallows every error class, not just timeouts

**Files modified:** `tests/tests/utils/voterNavigation.ts`
**Commit:** `d7f08858d` (iteration 2)
**Applied fix:** Narrowed **both** URL-settle handlers inside `advanceVoterFlow` (the constituencies
settle and the elections settle) to the review's snippet verbatim:

```ts
.catch((e) => {
  if (!/Timeout .* exceeded/.test(String(e))) throw e;
  return null;
});
```

A Playwright settle timeout (`page.waitForURL: Timeout 5000ms exceeded.`) still resolves to `null`,
so the loop re-detects the current screen on the next iteration exactly as before. Every other error
class — `Target page, context or browser has been closed`, `Navigation failed because page was
closed`, frame-detached — now propagates at its origin instead of re-surfacing one step removed at
the following `isVisible()`. The adjacent comment was updated to match: it now says non-throwing on
**timeout only**, enumerates the rethrown classes, and ties the change back to WR-01 (stopping
catch-alls from eating real signal is the same property WR-01's hard-nav removal protected).

**Scope discipline:** only the two settles inside `advanceVoterFlow` were touched. The pre-existing
`.catch(() => null)` pair in `advanceClick` (the `Promise.race` at lines 68-71) is **unchanged**, as
the review explicitly marks it pre-existing and out of this diff — verified by inspection after the
edit.

**Inertness:** on a green run `waitForURL` resolves, so the `.catch` never executes. Behaviour
diverges only when a non-timeout error is thrown, which does not occur on a passing run.

### IN-04: `stopAt: 'category-intro'` / `'questions-intro'` can return successfully without ever reaching that checkpoint

**Files modified:** `tests/tests/utils/voterNavigation.ts`
**Commit:** `62e1e4e72` (iteration 2)
**Applied fix:** Guarded the early return exactly as the review specifies:

```ts
if (stopAt === 'first-question' && (await answerOption.isVisible())) return;
```

Added an explanatory comment above it recording *why* the guard exists — a `'category-intro'` /
`'questions-intro'` walk that overshoots its checkpoint (because that page is disabled in app
settings) previously sailed through to the first question and resolved **successfully**, a silent
pass on a checkpoint that never rendered. Guarded, the overshoot falls through to the terminal
`stopAt` wait and fails loudly. This is the same "assertion that passes when the thing under test is
absent" shape the phase's own candidate-spec regex fix closed.

**Inertness — verified, not assumed:** `grep -rn "advanceVoterFlow(" tests/` returns only the
declaration and one call site, `voterNavigation.ts:311`, which passes `'first-question'` explicitly.
`advanceVoterFlow` is module-private (not exported), so that is the complete consumer set — the
added conjunct is `true` for every existing caller and the branch behaves identically. The three
consumers the review names (`perm-hide-category-tags.spec.ts:21`,
`perm-hide-election-tags.spec.ts:22`, `minimalVoterResultsPage.fixture.ts:53`) all reach it
indirectly via the exported `navigateToFirstQuestion`, which *is* that `'first-question'` call site
— confirmed by `grep -rn "navigateToFirstQuestion" tests/`.

## Skipped Issues

### IN-03: Elections/constituencies branch asymmetry — the combobox interaction is unguarded

**File:** `tests/tests/utils/voterNavigation.ts:153-161` (pre-existing block, now ~162-171)
**Reason:** skipped by design — the review's own **Fix** section states verbatim *"None required for
this phase."* The finding is pre-existing, sits outside this phase's diff, and its current
loud-rejection behaviour (a mid-selection detach rejects `advanceVoterFlow` outright rather than
retrying) is directionally what WR-01 asked for. Wrapping the combobox selection loop in
`try { … } catch { continue; }` would convert a loud failure into a silent retry — the opposite of
this phase's intent — and rescoping `page.getByRole('listbox')` to the combobox would change
locator resolution on the happy path, violating the inert-on-a-passing-run constraint. Both remedies
belong on the deferred-items list, gated behind their own E2E run.
**Original issue:** the constituencies branch performs three unguarded actions per iteration
(`combo.click()`, `listbox.waitFor()`, `option.first().click()`), which contradicts the function
docstring's "resilient to elements detaching mid-click (retry on next iteration)" claim for that
block. Two secondary unconfirmed hypotheses noted by the reviewer: the page-scoped
`getByRole('listbox')` could be a strict-mode violation with two simultaneously-open listboxes, and
the whole selection loop re-runs on every retry iteration.

---

_Fixed: 2026-07-26_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 2 (cumulative report — iterations 1 and 2)_
