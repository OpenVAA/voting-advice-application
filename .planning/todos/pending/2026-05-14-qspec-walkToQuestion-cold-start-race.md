---
resolves_phase: 131
---

# QSPEC-01/02 walkToQuestion cold-start race — v2.11+ hardening

**Filed:** 2026-05-14
**Source:** Phase 86 DETERM-14 (`.planning/phases/86-voter-app-failure-class-cleanup-investigate-and-resolve-the-/86-03-PLAN.md` Tasks 1 + 2; 86-RESEARCH.md §3.9 + §3.10)
**Home phase:** v2.11+ (target phase TBD)
**Effort:** ~1 phase (cluster-wide voter-fixture hardening; same scope as the prior 2026-05-11-voter-fixture-heterogeneous-question-types.md and 2026-05-12-qspec-01-i18n-hardening.md follow-ups, but specifically for the cold-start `voter-questions-start` 10s timeout)

## Why deferred

Both QSPEC-01 (boolean) and QSPEC-02 (categorical) share a SINGLE root cause per Phase 86 RESEARCH §3.9-§3.10: the `walkToQuestion(page, N)` helper in `tests/tests/utils/voterNavigation.ts` calls `walkToQuestionsIntro` which waits up to 10s on `getByTestId('voter-questions-start')` (apps/frontend/src/routes/(voters)/(located)/questions/+page.svelte:161). In full-suite cold-start runs, this testId either (a) does not render fast enough due to a settings-overlay race or (b) is bypassed entirely because `passThroughConstituencies` falls through to `navigateDirectlyToQuestions` (placing the voter on `/questions/<id>` instead of `/questions/<intro>`).

This is the SAME race that Phase 75 closed as PASS-WITH-DEFERRAL — see `.planning/milestones/v2.9-phases/75-question-rendering-specs/75-VERIFICATION.md` §"FAILURE-CLASS rationale". Per Phase 86 CONTEXT.md D-03 (fix-preferred-skip-acceptable, 1h investigation cap) + D-08 (no SETTINGS-03 product-fix), Phase 86 inherits the Phase 75 classification rather than attempting either of the candidate fixes:

- **Project-wide `--likert-only` seed flip** (RESEARCH §3.9 H3): would regress 60+ other voter-app PASS_LOCKED cells (the e2e template ships sort-17 categorical + sort-18 boolean which `--likert-only` strips out; spec assertions on those questions would fail).
- **Per-spec `appSettings.questions.questionsIntro.show: true` override** (H1): unbounded risk — settings persistence may leak into adjacent voter-app project tests and the override path doesn't address the deeper `passThroughConstituencies` fallback case.
- **`walkToQuestion` helper resilience** (H2): touches a helper shared by MANY voter-app specs. A bad refactor regresses the whole voter-app cluster; outside the per-test cap for Phase 86.

Per-plan smoke remains PASS × 3 in isolation per the Phase 75 verification. Only full-suite cold-start surfaces the race.

## Scope when picked up

1. **Decide which mechanism to apply:**
   - Option A (per-spec settings override) — restricted to QSPEC-01/02 only, with a beforeAll teardown to ensure no leak.
   - Option B (`walkToQuestion` helper resilience) — detect the `passThroughConstituencies` fallback path and skip the intro start CTA wait when voter is already on `/questions/<id>`.
   - Option C (per-project `voter-app` seed flip via custom Playwright project with `--likert-only`) — adds a new project scope, leaves the existing `voter-app` project + 60+ PASS_LOCKED cells untouched.
2. **Verify in isolation × 3** AND **full-suite cold-start × 3** that QSPEC-01 + QSPEC-02 become deterministic PASS.
3. **Regression check:** run the full voter-app project + variant-* project smokes 3× cold-start to confirm no PASS_LOCKED regression.
4. **Move QSPEC-01 + QSPEC-02 OUT of `SKIPPED_TESTS` const** (or the FAILURE-CLASS narrative — whichever Phase 86 Plan 04 lands).

## Cross-references

- Phase 86 CONTEXT D-03 (fix-preferred-skip-acceptable; 1h-per-test cap)
- Phase 86 CONTEXT D-08 (no SETTINGS-03 product-fix pre-resolution)
- Phase 86 RESEARCH §3.9 (QSPEC-01 RCA + H1/H2/H3 fix sketches)
- Phase 86 RESEARCH §3.10 (QSPEC-02 — confirmed shared root cause with QSPEC-01)
- Phase 75 VERIFICATION §"FAILURE-CLASS rationale" (original PASS-WITH-DEFERRAL classification + Phase 75 acceptance shape)
- `.planning/todos/pending/2026-05-11-voter-fixture-heterogeneous-question-types.md` (Phase 75 Path B operator-locked — overlapping scope)
- `.planning/todos/pending/2026-05-12-qspec-01-i18n-hardening.md` (Phase 75 W-03 follow-up — i18n hardening; orthogonal to the cold-start race)
- Phase 75 P01 Option A (`walkToQuestion` 2-iter Skip-Next fallback) — already applied; this todo addresses the residual cold-start race

## Open questions

- Should Option C (per-project seed flip via a new Playwright project, e.g., `voter-app-likert-only`) be preferred over Option A or B? It isolates the `--likert-only` flip to QSPEC-01/02 + a small set of fixture-compatible specs, avoiding both the broad seed-flip regression and the shared-helper refactor.
- Is the `passThroughConstituencies` fallback path itself a latent bug worth fixing at the helper level (mirror the assertion path) even outside the QSPEC scope?

## Phase 86.3-05 attempt (2026-05-20 — augmented)

### Option B (walkToQuestion helper resilience) — verified-applied, EMPIRICALLY INSUFFICIENT

Phase 86.3-05 landed Option B (walkToQuestion helper resilience per PATTERNS.md "Recommended fix shape") at `tests/tests/utils/voterNavigation.ts:308-329`:

```ts
export async function walkToQuestion(page: Page, sortOrder: number): Promise<void> {
  await walkToQuestionsIntro(page);
  const startBtn = page.getByTestId(testIds.voter.questions.startButton);
  const onIntro = await startBtn.isVisible().catch(() => false);
  if (onIntro) await startBtn.click();
  const nextButton = page.getByTestId(testIds.voter.questions.nextButton);
  for (let i = 0; i < sortOrder; i++) {
    await nextButton.waitFor({ state: 'visible', timeout: 10000 });
    await nextButton.click();
  }
}
```

Helper fix LEFT IN PLACE on SKIP-FALLBACK as evidence-of-attempt (mirrors Phase 86.3-04 cell #6 Path 2 LEFT-IN-PLACE pattern). It is defensively correct and does not regress any existing voter-app PASS_LOCKED cells (full voter-app project smoke confirmed no regression caused by this change — see `.planning/phases/86.3-…/post-fix/86.3-05-voter-app-full-smoke.txt`).

### Empirical finding (NEW priority — supersedes the original v2.11+ scope)

Per-cell smoke (Phase 86.3-05 Task 2) on both cells #7 + #8 with the helper fix applied:
  - Cell #7 (boolean) — `1 failed` (locator.waitFor timeout 5000ms at `advanceVoterFlow` voterNavigation.ts:149); page-snapshot YAML in `playwright-results/voter-question-rendering-b-0831c-.../error-context.md` shows /intro main panel renders only `Loading…`; `voter-intro-start` testId never paints.
  - Cell #8 (categorical) — identical failure mode + identical Loading… page-snapshot.
  - Post-skip re-smoke (after applying test.skip(true, …) rationale) — both cells report `1 skipped + 3 passed`.

The failure is UPSTREAM of the helper fix entirely — the Home → /intro hydration itself doesn't complete; none of the 6 race-checkpoint testIds (`voter-intro-start`, `voter-elections-list`, `voter-constituencies-list`, `voter-questions-start`, `voter-questions-category-start`, `question-choice`) ever paint after `page.goto(Home)` + start-button click.

### Cross-plan trace reconciliation (4 cells share ONE root cause)

The same `Loading…` symptom blocks:
  - Cell #5 voter-feedback-persistence (Phase 86.3-03 trace finding — /questions Loading… via `answeredVoterPage` fixture).
  - Cell #6 voter-popup-hydration (Phase 86.3-04 trace finding — /results Loading… via direct `page.goto`).
  - Cell #7 voter-question-rendering-boolean (Phase 86.3-05 trace finding — /intro Loading… via `walkToQuestion` → `walkToQuestionsIntro` → `advanceVoterFlow`).
  - Cell #8 voter-question-rendering-categorical (same as cell #7).

This characterizes the race as a SHARED voter-app cold-deeplink loader / data-resolution issue across the voter-app surface (NOT route-specific). The Phase 86.3-05 full voter-app project smoke (`.planning/phases/86.3-…/post-fix/86.3-05-voter-app-full-smoke.txt`) shows the same race blocks 38+ voter-app tests at `advanceVoterFlow` line 149.

### REVISED v2.11+ next action (supersedes Options A/B/C above)

The original Options A/B/C addressed the `walkToQuestion` intro-start CTA race specifically. Phase 86.3-05 evidence shows the actual blocker is the UPSTREAM /intro hydration race, which Options A/B/C do not address.

**RECOMMENDED v2.11+ next action (paired with Phase 86.3-04 Recommendation #3):**

Navigation-from-home test redesign — replace `walkToQuestion(page, N)` + `walkToQuestionsIntro(page)` with a natural in-app navigation flow that uses the `answeredVoterPage` fixture's stable navigation primitives once those are repaired. Specifically:

1. **First**, fix the upstream voter-app cold-deeplink loader race that blocks `/intro` (cells #7/#8), `/questions` (cell #5), and `/results` (cell #6) hydration. This is the SAME race for all 4 cells; one upstream fix closes all 4.
2. **Then**, restore cells #7/#8 to using the navigation primitive (either un-skipping with the existing helper, or via a new redesign that bypasses `walkToQuestionsIntro` entirely).
3. **Verify** the 4 SKIPPED_TESTS entries (cells #5/#6/#7/#8 — all share this race) become FIX-PASS.

This is now the SAME v2.11+ next-action as Phase 86.3-04 Recommendation #3 (`navigation-from-home test redesign` in `.planning/todos/pending/2026-05-16-voter-popup-hydration-layout-03-deeplink.md`). Both todos point at the same upstream race; v2.11+ pickup should treat them as a single closure-pair.

### Cross-references

- `.planning/phases/86.3-implement-skipped-tests-close-7-source-skipped-voter-app-can/86.3-05-PLAN.md` (Plan 86.3-05)
- `.planning/phases/86.3-implement-skipped-tests-close-7-source-skipped-voter-app-can/86.3-SUMMARY.md` (Phase 86.3 close — 8-cell disposition)
- `.planning/phases/86.3-implement-skipped-tests-close-7-source-skipped-voter-app-can/post-fix/86.3-05-cell7-smoke.txt`
- `.planning/phases/86.3-implement-skipped-tests-close-7-source-skipped-voter-app-can/post-fix/86.3-05-cell8-smoke.txt`
- `.planning/phases/86.3-implement-skipped-tests-close-7-source-skipped-voter-app-can/post-fix/86.3-05-voter-app-full-smoke.txt`
- `.planning/phases/86.3-implement-skipped-tests-close-7-source-skipped-voter-app-can/86.3-03-SUMMARY.md` (cell #5 trace finding sibling)
- `.planning/phases/86.3-implement-skipped-tests-close-7-source-skipped-voter-app-can/86.3-04-SUMMARY.md` (cell #6 trace finding sibling)
- `.planning/todos/pending/2026-05-16-voter-popup-hydration-layout-03-deeplink.md` (Phase 86.3-04 augmentation — paired closure target)
- `.planning/todos/pending/2026-05-16-voter-feedback-persistence-second-pass.md` (Phase 86.3-03 augmentation — paired closure target)
