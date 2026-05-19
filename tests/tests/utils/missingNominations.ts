/**
 * Shared helpers for the "missing nominations" modal rendered by
 * `apps/frontend/src/routes/(voters)/(located)/+layout.svelte` whenever one or
 * more selected elections lack any nomination in the selected constituency.
 *
 * Why a shared helper:
 *   The previous pattern (try/catch around `dialog.waitFor({ timeout: 3000 })`)
 *   was flaky because the layout's `awaitNominationsSettled` has its own 3s
 *   safety timer — the modal can open at 3-4s after the URL settles on
 *   /questions. A 3s waitFor that started counting from URL-settle could miss
 *   the modal on cold first paint, swallow via catch, and then the immediately
 *   following `answerOption.click()` would be intercepted by the (just-opened)
 *   modal overlay and burn the full test timeout.
 *
 *   The helpers below either race the modal against a stable
 *   post-modal landmark (the first answer-option), or install Playwright's
 *   `addLocatorHandler` so the modal is dismissed transparently whenever it
 *   appears during any subsequent action.
 *
 * Test-body discipline:
 *   Both helpers live at module scope so any spec governed by
 *   `playwright/no-conditional-in-test` can call them without introducing
 *   `if`/`try`/`catch` inside a test body.
 */
import { testIds } from './testIds';
import type { Locator, Page } from '@playwright/test';

/**
 * Wait until the layout has settled into a stable state (either rendering the
 * first question OR showing the missing-nominations modal), then dismiss the
 * modal if it is currently visible. Returns `true` iff the modal was dismissed.
 *
 * Stable-state race: by the time `question-choice` is visible, the layout has
 * set `ready = true`, which is set sequentially AFTER
 * `modalRef?.openModal()` — so if the modal was going to open at all, it has
 * already opened by the time the question paint resolves.
 *
 * The modal's testId is stable (CONF-03 post-fix); we still fall back to
 * `getByRole('dialog')` so the helper also works on older builds that have
 * not yet picked up the testId addition.
 */
export async function dismissMissingNominationsIfPresent(page: Page): Promise<boolean> {
  const modal = page.getByTestId(testIds.voter.missingNominationsModal);
  const answerOption = page.getByTestId(testIds.voter.questions.answerOption).first();

  // Race the modal's `[open]` transition against the first question
  // painting. Both probes are bounded with the SAME budget; whichever
  // resolves first decides the path. If `answerOption` becomes visible
  // before the modal opens, we treat that as a settled "no modal" state
  // and return false — the layout's `awaitNominationsSettled` either
  // already determined nomStatus === 'all' (modal won't be rendered) OR
  // it determined nomStatus !== 'all' AND finished BEFORE answer-option
  // paint (modal would already be open in that case, so it'd win the
  // race). Cap at 10s; covers the layout's 3s safety timer plus headroom.
  //
  // CRITICAL: cannot gate on `target.waitFor({state: 'visible'})` to
  // detect modal-is-open, because DaisyUI's `.modal` class keeps the
  // underlying `<dialog>` at `display: grid` even when closed — Playwright
  // then considers a closed dialog "visible", so any state:'visible' wait
  // resolves immediately. The native `<dialog open>` attribute is the
  // authoritative open-state signal (toggled by `showModal()`/`close()`).
  const winner = await Promise.race([
    waitForOpen(page, 10000).then((ok) => (ok ? 'modal' : null)),
    answerOption
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(() => 'answer' as const)
      .catch(() => null)
  ]);
  if (winner !== 'modal') return false;
  await dismissModal(modal);
  return true;
}

/**
 * Poll the missing-nominations modal's `<dialog open>` attribute in-page
 * via `waitForFunction`. Resolves `true` on observed-open, `false` on
 * timeout. Uses a CSS selector (not a Locator) so the wait short-circuits
 * cleanly even when the dialog element is never rendered into the DOM
 * (`hasNominations === 'all'` → `{#if hasNominations !== 'all'}` removes
 * the `<Modal>` entirely from `(located)/+layout.svelte`).
 *
 * `Locator.evaluate` would wait up to the action timeout for the element
 * to attach before running, which previously stretched a "no modal" case
 * into a ~60s stall.
 */
async function waitForOpen(page: Page, timeoutMs: number): Promise<boolean> {
  return page
    .waitForFunction(
      (testId: string) => {
        const el = document.querySelector(`[data-testid="${testId}"]`);
        return el != null && el.hasAttribute('open');
      },
      testIds.voter.missingNominationsModal,
      { timeout: timeoutMs }
    )
    .then(() => true)
    .catch(() => false);
}

/**
 * Install a Playwright locator handler that auto-dismisses the missing-
 * nominations modal whenever Playwright detects it during any subsequent
 * action. Use this in `beforeAll` for serial test suites where multiple tests
 * traverse /questions or /results and none of them explicitly assert the
 * modal. The handler is no-op when the modal is absent.
 *
 * Do NOT call this in a suite that also asserts the modal's contents (see
 * `constituency.spec.ts:289 — should show missing nominations warning for
 * partial-coverage constituency`) without also `removeLocatorHandler`-ing the
 * locator first, otherwise the handler will dismiss the modal before the
 * assertion has a chance to read it.
 */
export async function installMissingNominationsAutoDismiss(page: Page): Promise<Locator> {
  const modal = page.getByTestId(testIds.voter.missingNominationsModal);
  // Use `.or(getByRole('dialog'))` so the handler also fires for builds without
  // the testId. The `.first()` collapses the union to a single matcher.
  const target = modal.or(page.getByRole('dialog')).first();
  await page.addLocatorHandler(target, async (locator) => {
    await dismissModal(locator);
  });
  return target;
}

/**
 * Click Continue and verify the modal stays dismissed.
 *
 * Two non-obvious behaviors this handles:
 *
 *   1. DaisyUI's `.modal` class keeps `display: grid` on closed `<dialog>`s,
 *      so Playwright's `state: 'hidden'` NEVER resolves — closed dialogs are
 *      still "visible" to Playwright. We check the native `<dialog open>`
 *      attribute instead, which is the authoritative open-state signal that
 *      `HTMLDialogElement.showModal()` / `.close()` toggle.
 *
 *   2. `(located)/+layout.svelte`'s nomination-check `$effect` re-fires
 *      whenever the streamed `data.questionData` / `data.nominationData`
 *      Promises re-resolve — including on sub-route navigation within
 *      `(located)` (e.g., `/questions` → `/questions/__first__`). The
 *      frontend `modalShownForKey` guard suppresses the reopen for the same
 *      election+constituency dataset, but as a belt-and-suspenders the
 *      helper retries on reappearance.
 */
async function dismissModal(modal: Locator): Promise<void> {
  const page = modal.page();
  const STABILITY_WINDOW_MS = 600;
  const MAX_ATTEMPTS = 5;
  // Probe `[open]` via page.evaluate + CSS selector (not Locator.evaluate,
  // which stalls waiting for the element to attach when it's not in the DOM —
  // the layout removes the modal entirely when `hasNominations === 'all'`).
  const probeOpen = (): Promise<boolean> =>
    page.evaluate((testId: string) => {
      const el = document.querySelector(`[data-testid="${testId}"]`);
      return el != null && el.hasAttribute('open');
    }, testIds.voter.missingNominationsModal);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const isOpen = await probeOpen();
    if (!isOpen) {
      // Closed — verify it stays closed across the stability window. If
      // something reopens it, we loop and click again.
      await page.waitForTimeout(STABILITY_WINDOW_MS);
      if (!(await probeOpen())) return;
      continue;
    }
    await modal.getByRole('button', { name: /continue/i }).click({ timeout: 3000 }).catch(() => null);
    // Brief settle so any in-flight $effect re-runs (and their downstream
    // `modalRef?.openModal()` paths) finish before the next iteration's
    // open-state probe.
    await page.waitForTimeout(STABILITY_WINDOW_MS);
  }
  // Final defensive check — if we still see `[open]` after the retry budget,
  // surface a clear error rather than silently leaving an obstructing modal.
  if (await probeOpen()) {
    throw new Error(
      `[dismissMissingNominationsIfPresent] modal still has [open] after ${MAX_ATTEMPTS} dismiss attempts — ` +
        `the frontend re-open guard in (located)/+layout.svelte may have regressed.`
    );
  }
}
