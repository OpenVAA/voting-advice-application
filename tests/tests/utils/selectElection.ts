/**
 * Select a specific election in the `/results` election accordion, by name.
 *
 * WHY this exists: `answerAndAdvanceToResults` step 7 lands on whichever
 * election its `options.first()` pick resolves to, and that is NOT deterministic
 * between EL-Reg and EL-Mun. Any assertion — or screenshot — taken on `/results`
 * without pinning the election is a coin flip: the Regional list carries the
 * CO-Reg-N candidates while the Municipal list carries a much shorter one, so
 * the page differs in content AND in height between two runs of identical code.
 * `numberScale.probe.spec.ts` and `voter-journey.spec.ts` each pin the election
 * for this same reason; the visual baselines were the one `/results` consumer
 * that did not, which is why they could never reproduce.
 *
 * Collapse-aware: `AccordionSelect` renders ONLY the active option when
 * collapsed, so a bare `getByRole('option', { name })` finds nothing whenever
 * the active election is not the wanted one. Expand first (clicking the single
 * rendered option toggles it open), then click the target and wait for the
 * accordion to collapse back — the signal that the selection committed.
 *
 * NOTE (known duplication): `numberScale.probe.spec.ts` still carries a private
 * copy of this helper and `voter-journey.spec.ts` carries a stricter variant
 * (`expectElectionOptionAndSelect`, which adds a listbox-accessible-name lock it
 * owns). Consolidating the probe copy onto this module is logged in
 * `deferred-items.md`; it was left out of Phase 136 plan 05 to keep the
 * visual-repair blast radius on the visual chain.
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
}
