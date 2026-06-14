---
resolves_phase: 131
---

# voter-feedback-persistence dialog-close locator collision — v2.11+ hardening

**Filed:** 2026-05-16
**Source:** Phase 86.1-02 (`.planning/phases/86.1-pre-phase-87-convergence-sweep-drive-v2-10-e2e-suite-to-all-/86.1-02-PLAN.md`; RESEARCH §5.1-§5.5)
**Home phase:** v2.11+ (target phase TBD)
**Effort:** ~0.5 phase (single-spec investigation + targeted FeedbackModal/Modal close-signal contract redesign)

## Why deferred

`voter-feedback-persistence:43` asserts the modal closes after cancel and after send. Both close-assertions fail in the post-85-04-trace-cleanup baseline. Phase 86-02 applied H1 (commit `5d67f1933`: replaced `toBeHidden()` with `toHaveCount(0)` on the dialog-wrapper locator) — VERIFIED in place but EMPIRICALLY INSUFFICIENT. Phase 86.1-02 applied H4 (RESEARCH §5.4: switched assertion target from dialog-wrapper to `feedback-form` testId) — ALSO EMPIRICALLY INSUFFICIENT.

The 86.1-02 per-spec smoke (post-fix/86.1-02-smoke-feedback-persistence.txt) shows:

```
Error: expect(locator).toHaveCount(expected) failed
  Locator:  getByTestId('feedback-form')
  Expected: 0
  Received: 1
  Timeout:  5000ms
  Call log:
    9 × locator resolved to 1 element
      - unexpected value "1"
```

**The form element remains in the DOM throughout the close transition** — Feedback.svelte is kept mounted via `bind:this={feedbackRef}` in `FeedbackModal.svelte:62` so its internal `$state` survives open/close cycles (which is the WHOLE POINT of the persistence-across-cancel assertion the test is trying to verify). The persistence contract is INTRINSICALLY INCOMPATIBLE with using form-element DOM removal as the close signal.

Both H1 (dialog-wrapper count == 0 via the `getByRole('dialog')` a11y-tree gate) AND H4 (form-element count == 0) are wrong. The true close signal must be a different DOM mechanism — most likely the `<dialog open>` attribute on the wrapper, or the `aria-hidden`/`inert` attributes that ModalContainer applies during the close transition. Per CONTEXT D-04 1h cap and D-06 skip-protocol, further investigation is deferred to v2.11+.

## Hypothesis history

- **H1 (Phase 86-02 — verified-applied, insufficient).** Mechanism: `toBeHidden()` matched on dialog-wrapper had stale `aria-hidden` evaluation during close. Fix: substitute `toHaveCount(0)` on `getByRole('dialog').filter({ has: getByTestId('feedback-form') })`. Status: code is in place (commit `5d67f1933`); post-85-04 trace-restored run shows the assertion STILL fails (locator resolves to non-zero count during close).
- **H2 (multi-dialog locator collision per Pitfall 8 — PLAUSIBLE, unexplored in 86.1-02).** Mechanism: a second `<dialog role="dialog">` (feedback popup, entity-details drawer, or other) might be open simultaneously with the feedback modal, causing the `.filter({ has: feedback-form })` chain to match an unintended element. RESEARCH §5.2 notes that the spec runs in the `voter-app` project (no `voter-app-popups` dependency), so cross-project leak shouldn't occur — but the trace-cleanup baseline now produces full traces; v2.11+ should inspect a failing trace artifact frame-by-frame to capture `getByRole('dialog')` count during the close transition.
- **H3 (Svelte 5 reset semantics — UNLIKELY).** Mechanism: `feedbackRef.reset()` semantics changed via $effect cleanup. Disproof: the test fails on the `toHaveCount(0)` close-assertion (upstream of any reset semantics), not on the `toHaveValue('persistence test text')` reopen assertion. RESEARCH §5.3.
- **H4 (close-transition selector window — Phase 86.1-02 attempted, EMPIRICALLY INSUFFICIENT).** Mechanism: `.filter({ has: feedback-form })` chain inspects the DOM not the a11y tree, so the dialog-wrapper lingers during close-transition. Fix: replace dialog-wrapper assertion with form-element direct assertion `expect(page.getByTestId('feedback-form')).toHaveCount(0)`. Status: code applied at lines 86 + 105 (commit `937ec5147`). Per-spec smoke shows H4 ALSO fails — the form element remains in the DOM, confirming Feedback is kept mounted by `bind:this` (this is BY DESIGN per spec docstring lines 87-91; the persistence-across-cancel assertion REQUIRES the form element to survive). H4 mitigation logically incompatible with the test contract.

## Recommended next action for v2.11+

1. **Capture trace artifact frame-by-frame.** Run the spec with `trace: 'on'`; use `playwright show-trace` to inspect the DOM at the failing close-assertion moment. Specifically observe:
   - The `<dialog>` element's `open` attribute value (present? absent?)
   - The `<dialog>` element's `aria-hidden` / `inert` attributes
   - Whether ANY second `<dialog role="dialog">` is open simultaneously (H2 verification)
   - The count of elements matching `getByRole('dialog')` and `getByTestId('feedback-form')` at frames 0ms, 100ms, 1500ms, 5000ms post-cancel-click
2. **Redesign the close-signal contract.** Once the trace evidence reveals the actual close mechanism, modify the assertion to match it. Likely candidates:
   - `await expect(feedbackDialog).toHaveAttribute('open', null, { timeout: 5000 })` — asserts on the `<dialog open>` attribute absence specifically
   - `await expect(feedbackDialog).toBeHidden({ timeout: 5000 })` re-attempted with an explicit `aria-hidden` assertion gate
   - A new `data-testid="feedback-modal-container"` on the Modal wrapper with `data-open="false"` attribute switching, asserted via `toHaveAttribute('data-open', 'false', { timeout: 5000 })`
3. **Consider hardening FeedbackModal testId structure.** Add a stable testid on the `<dialog>` wrapper (e.g. `data-testid="feedback-modal-dialog"`) that toggles a `data-state="open" | "closed"` attribute. This makes the close-signal contract assertion-friendly without coupling to Modal.svelte's internal close mechanism.
4. **Consider per-spec storageState reset.** If H2 (cross-test popup-state leak) re-surfaces in v2.11+ investigation, add `test.beforeEach(async ({ context }) => context.clearCookies())` or equivalent.

## Cross-references

- Phase 86.1-02 PLAN (this filing): `.planning/phases/86.1-pre-phase-87-convergence-sweep-drive-v2-10-e2e-suite-to-all-/86.1-02-PLAN.md`
- Phase 86.1-02 RESEARCH §5.1-§5.5: hypothesis tree and skip-rationale candidate
- Phase 86.1-02 smoke evidence: `.planning/phases/86.1-pre-phase-87-convergence-sweep-drive-v2-10-e2e-suite-to-all-/post-fix/86.1-02-smoke-feedback-persistence.txt`
- Phase 86 RESEARCH §3.6: H1/H2/H3 hypothesis tree (first-pass framing)
- Phase 86-02 commit `5d67f1933`: H1 fix (verified-applied; insufficient)
- Phase 86.1-02 commit `937ec5147`: H4 fix (verified-applied; insufficient)
- Phase 86.1-02 PATTERNS §"Plan 86.1-02 target": Analog 1 (H1 in-place shape) + Analog 2 (H4 selector switch) + Analog 3 (skip fallback shape)
- Source code: `apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte:85,132-137,158,243-249`; `apps/frontend/src/lib/dynamic-components/feedback/FeedbackModal.svelte:47-52,62` — the persistence-via-bind:this design that makes H4 logically incompatible
- CONTEXT D-04 (1h cap), D-06 (skip-protocol), D-10 (`git -c core.hooksPath=/dev/null`)

## Open questions

- Is the persistence-via-`bind:this` design (Feedback kept mounted across modal close) actually a product-correctness invariant, or is it an implementation detail that could be redesigned in v2.11+? If the latter, an alternative fix would be to unmount Feedback when closing (which would make H4 work) — but at the cost of losing the text-persists-across-cancel contract. The test specifically asserts that contract, so the redesign would change product behaviour.
- Are there sibling specs that ALREADY assert dialog-close on a `<dialog>` wrapper that DOES detach on close (e.g., the entity-details drawer in voter-detail.spec.ts)? If so, those specs have a clean dialog-close assertion pattern that v2.11+ can study as a positive contrast.
- Should the Modal/ModalContainer Svelte components expose a `data-state="open" | "closed"` attribute by default for stable testid-based close-signal contracts? This would benefit not just feedback but any future modal-close E2E assertion.

## Phase 86.3-03 trace findings (2026-05-20 — augmented)

**Plan source:** `.planning/phases/86.3-implement-skipped-tests-close-7-source-skipped-voter-app-can/86.3-03-PLAN.md` Task 1.
**Verdict:** NEITHER H2 nor H3 verified — **upstream fixture race blocks H2/H3 disambiguation**.
**Trace analysis:** `.planning/phases/86.3-…/86.3-03-trace-analysis.md`.
**Smoke evidence:** `.planning/phases/86.3-…/post-fix/86.3-03-cell5-smoke.txt`.
**Trace artifact:** `tests/playwright-results/voter-feedback-persistence-d3f62-smiss-and-resets-after-send-voter-app/trace.zip` (720 KB).
**Atomic commits:**
- Task 1 trace capture + analysis: `cc8b609b9`
- Task 2 SKIP-FALLBACK + this todo augmentation: (committed atomically with the rest of Task 2)

### What was attempted

1. Temporarily un-skipped cell #5 (commented out the `test.skip(true, …)` block, preserving the rationale array verbatim).
2. Reset DB + seeded `e2e` template (and separately tried `--likert-only` per CLAUDE.md "Common Workflows" canonical chain).
3. Restarted Vite dev server with cleared `.svelte-kit` cache.
4. Ran `cd tests && yarn playwright test --project=voter-app --grep "feedback text persists across" --workers=1 --reporter=line` to capture a trace.
5. Inspected `0-trace.trace` + `0-trace.network` + `error-context.md` via `grep` and `playwright show-trace` (the latter only when grep was insufficient).

### Empirical finding (NEW — not predicted by Phase 86.1-02 H2/H3 framing)

The trace shows the test never reaches the modal-close site:

```
TimeoutError: locator.waitFor: Timeout 5000ms exceeded.
Call log:
  - waiting for getByTestId('voter-intro-start').or(getByTestId('voter-elections-list'))
      .or(getByTestId('voter-constituencies-list')).or(getByTestId('voter-questions-start'))
      .or(getByTestId('voter-questions-category-start')).or(getByTestId('question-choice').first()).first()
      to be visible
  at advanceVoterFlow (tests/tests/utils/voterNavigation.ts:149)
  at navigateToFirstQuestion (tests/tests/utils/voterNavigation.ts:263)
  at answeredVoterPage fixture (tests/tests/fixtures/voter.fixture.ts:56)
```

Page-snapshot evidence (from `error-context.md`):

```yaml
- generic [ref=e2]:
  - banner: button "Open menu", button "Send feedback", button "Help"
  - main: "Loading…"
```

Frames visited (per trace): `about:blank` → `/` → `/intro` → `/questions?electionId=4e91b931-…` (last frame; main slot stuck at `Loading…`).

Supabase REST status (per trace network): all 200/304/307. Tables seeded (elections=1, constituencies=1, questions=25, organizations=4, nominations=22, etc.). No 4xx/5xx errors.

**Conclusion:** `answeredVoterPage` fixture fails on the post-86.2 / post-86.3-01 baseline because the /questions intro page renders `Loading…` indefinitely — none of the 6 advanceVoterFlow checkpoint testIds are present. This is a separate-from-DETERM-13 bug (CASCADE-class) that gates cell #5's H2/H3 disambiguation entirely.

### Recommended next action for v2.11+ (REVISED ORDER)

**FIRST:** fix the upstream `answeredVoterPage` fixture race (the /questions intro `Loading…` issue). Likely candidates:
- `(voters)/(located)/+layout.ts` loader ordering vs client-side context initialization.
- `voterContext` `$state` / `$derived` chain initialization race that prevents `voter-questions-start` from rendering.
- Possible interaction with the post-86.3-01 reactive `$effect` blocks in `(voters)/+layout.svelte` (topBarSettings.push + notification popupQueue.push) — though Phase 86.3-01 SUMMARY's per-cell smokes did PASS, so unlikely root cause.

**THEN re-attempt H2/H3 disambiguation:**
1. **Capture trace artifact frame-by-frame.** Run the spec with `trace: 'on'`; use `playwright show-trace` to inspect the DOM at the failing close-assertion moment. Specifically observe:
   - The `<dialog>` element's `open` attribute value (present? absent?)
   - The `<dialog>` element's `aria-hidden` / `inert` attributes
   - Whether ANY second `<dialog role="dialog">` is open simultaneously (H2 verification)
   - The count of elements matching `getByRole('dialog')` and `getByTestId('feedback-form')` at frames 0ms, 100ms, 1500ms, 5000ms post-cancel-click
2. **Redesign the close-signal contract.** Once the trace evidence reveals the actual close mechanism, modify the assertion to match it. Likely candidates:
   - `await expect(feedbackDialog).toHaveAttribute('open', null, { timeout: 5000 })` — asserts on the `<dialog open>` attribute absence specifically
   - `await expect(feedbackDialog).toBeHidden({ timeout: 5000 })` re-attempted with an explicit `aria-hidden` assertion gate
   - A new `data-testid="feedback-modal-container"` on the Modal wrapper with `data-state="open|closed"` attribute switching, asserted via `toHaveAttribute('data-state', 'closed', { timeout: 5000 })`
3. **Consider hardening FeedbackModal testId structure.** Add a stable testid on the `<dialog>` wrapper (e.g. `data-testid="feedback-modal-dialog"`) that toggles a `data-state="open" | "closed"` attribute. This makes the close-signal contract assertion-friendly without coupling to Modal.svelte's internal close mechanism.
4. **Consider per-spec storageState reset.** If H2 (cross-test popup-state leak) re-surfaces in v2.11+ investigation, add `test.beforeEach(async ({ context }) => context.clearCookies())` or equivalent.

### Cross-references (extended from H1+H4 lineage)

- Phase 86.3-03 PLAN: `.planning/phases/86.3-…/86.3-03-PLAN.md`
- Phase 86.3-03 trace analysis: `.planning/phases/86.3-…/86.3-03-trace-analysis.md`
- Phase 86.3-03 smoke: `.planning/phases/86.3-…/post-fix/86.3-03-cell5-smoke.txt`
- Phase 86.3-03 commit Task 1 (trace capture): `cc8b609b9`
- Phase 86.3-03 commit Task 2 (SKIP-FALLBACK + this augmentation): (atomic)
- Trace artifact: `tests/playwright-results/voter-feedback-persistence-d3f62-smiss-and-resets-after-send-voter-app/trace.zip`
- Per-cell smoke prerequisite: NONE — cell #5 is the sole test in its `describe.serial` block per RESEARCH "Pattern 3" `LANDMINE-NOTE: cell #5 has no within-spec cascade dependents.`
