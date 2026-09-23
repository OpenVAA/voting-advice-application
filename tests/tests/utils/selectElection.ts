/**
 * Select a specific election in the `/results` election accordion, by name.
 *
 * WHY this exists: `answerAndAdvanceToResults` step 7 lands on whichever election its `options.first()` pick resolves to, and that is NOT deterministic between EL-Reg and EL-Mun. Any assertion — or screenshot — taken on `/results` without pinning the election is a coin flip: the Regional list carries the CO-Reg-N candidates while the Municipal list carries a much shorter one, so the page differs in content AND in height between two runs of identical code.
 * `voter-journey.spec.ts` pins the election for this same reason; the visual baselines were the one `/results` consumer that did not, which is why they could never reproduce.
 *
 * Collapse-aware: `AccordionSelect` renders ONLY the active option when collapsed, so a bare `getByRole('option', { name })` finds nothing whenever the active election is not the wanted one. Expand first (clicking the single rendered option toggles it open), then click the target and wait for the accordion to collapse back — the signal that the selection committed.
 *
 * Focus-convergent: see `settleNavigationFocus` below. Pinning the election pins the page's CONTENT but not the interaction PATH taken to reach it, and the residual DOM focus state differs between the two paths — which leaks into a screenshot. The helper converges it before returning.
 *
 * NOTE (known duplication): `voter-journey.spec.ts` carries a stricter variant (`expectElectionOptionAndSelect`, which adds a listbox-accessible-name lock it owns). A third copy once lived in `numberScale.probe.spec.ts`; that probe was deleted as redundant with `voter-journey.spec.ts`, which consumes every fixture it proved.
 */

import { expect } from '@playwright/test';
import { testIds } from './testIds';
import { TIMEOUTS } from '../helpers';
import type { Page } from '@playwright/test';

export async function selectElectionByName(page: Page, name: RegExp | string): Promise<void> {
  const accordion = page.getByTestId(testIds.voter.results.electionAccordion);
  await expect(accordion).toBeVisible({ timeout: TIMEOUTS.page });
  const options = accordion.getByRole('option');
  const visibleCount = await options.count();
  if (visibleCount === 1) await options.first().click({ timeout: TIMEOUTS.click });
  const target = accordion.getByRole('option', { name }).first();
  await expect(target).toBeVisible({ timeout: TIMEOUTS.element });
  await target.click({ timeout: TIMEOUTS.click });
  await expect(options).toHaveCount(1, { timeout: TIMEOUTS.element });
  await expect(page.getByTestId(testIds.voter.results.list)).toBeVisible({ timeout: TIMEOUTS.page });
  await settleNavigationFocus(page);
}

/**
 * Converge the post-selection DOM focus state onto the ONE element the app itself focuses after a navigation, so a screenshot taken afterwards is byte-stable regardless of which interaction path `selectElectionByName` took.
 *
 * ## The defect this closes
 *
 * Diagnosed over 12 runs at a fixed HEAD, 12/12 correlation. The voter baselines flipped between exactly two variants, differing in a single 291x17 px band: the `/results` election chip rendering primary-blue or near-black. It is an AND of two conditions:
 *
 * 1. TEST — the walk's landing election is non-deterministic (see this file's
 *    header), so roughly 1 run in 3 has to perform a real election-SWITCH navigation rather than a no-op click on the already-active option.
 * 2. PRODUCT — that navigation fires `afterNavigate` in
 *    `apps/frontend/src/routes/+layout.svelte:172-182`, whose `requestAnimationFrame(() => target?.focus({ preventScroll: true }))` moves focus off the just-clicked option button and onto `[data-focus-on-nav]` / `h1`. The button's `focus:text-primary` (`AccordionSelect.svelte:89`) then stops applying, and the chip paints near-black instead of blue.
 *
 * The seeded data is NOT implicated — it is byte-identical across `db:reset` cycles. The delta scores 0 px at the shipped `threshold: 0.2`, so it never reddened the gate; the fix exists because a byte-stable baseline is strictly better than a merely threshold-stable one, and these bytes are committed.
 *
 * ## Why FOCUS the nav target rather than BLUR the button
 *
 * Blurring races: if the pending `afterNavigate` rAF has not run yet, it fires after the blur and re-focuses the heading, restoring the variance the blur was meant to remove — and a blur is not idempotent under that late callback.
 * Focusing the app's OWN target is idempotent: a late rAF sets the same element, so the outcome is identical whether it already ran, runs during, or runs after.
 * Both paths therefore end with the heading focused and the option button not.
 *
 * The product's focus reset is deliberately left alone: it is NAVA11Y-02, and moving focus to the page heading after navigation is correct accessibility behaviour, not a bug to trade away for a stable screenshot.
 */
async function settleNavigationFocus(page: Page): Promise<void> {
  const focused = await page.evaluate(
    () =>
      // Two frames: let any already-scheduled afterNavigate rAF run first, so the common case is a no-op re-focus rather than a fight.
      new Promise<boolean>((resolve) => {
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            const target =
              document.querySelector<HTMLElement>('[data-focus-on-nav]') ?? document.querySelector<HTMLElement>('h1');
            if (!target) return resolve(false);
            target.focus({ preventScroll: true });
            resolve(document.activeElement === target);
          })
        );
      })
  );
  expect(
    focused,
    'the post-navigation focus target ([data-focus-on-nav] or a focusable h1) was absent or refused focus — the capture would sample a non-deterministic focus state'
  ).toBe(true);
}
