/**
 * multiChoice — constraint-agnostic selection helper for
 * `multipleChoiceCategorical` questions.
 *
 * ## Why this exists (Phase 135 GUARD-01)
 *
 * Until Phase 135 the `e2e/base` seed carried exactly ONE multi-choice opinion
 * question (`qu-opin-base-7-multichoice`, minSelections 2 / maxSelections 3), so
 * every walk hard-coded "click the first 2 checkboxes" and cited that window in
 * a COUPLING comment. Phase 135 adds a second multi-choice question with an
 * EQUAL window (`qu-opin-base-8-multichoice-exact`, min === max === 1) so the
 * app can reach the `questions.multiChoice.selectExact` helper string. Against
 * that question "click 2" is OVER-max, i.e. invalid — the candidate app leaves
 * Save disabled and the voter app refuses to persist the answer. A walk that
 * hard-codes a count is therefore coupled to one question's authoring and
 * silently breaks (or silently under-answers) the moment a second window exists.
 *
 * This helper removes the coupling: it selects the SMALLEST valid number of
 * choices, discovered from the APP'S OWN validity signal rather than from a
 * number copied out of the seed. It is correct for 1..1, 2..3, 2..null, and any
 * future window without further edits.
 *
 * ## The validity signal
 *
 * Callers pass `validWhenEnabled` — a Locator for a control that is enabled iff
 * the current selection is a VALID answer:
 *   - candidate app → `candidate-questions-save` (Save gates on
 *     `isMultiChoiceCountValid`, multiChoiceValidity.ts:30).
 *   - voter app → `question-delete` (enabled iff an answer is persisted, and an
 *     out-of-range multi-choice selection is NEVER persisted —
 *     (voters)/(located)/questions/+layout.svelte handleAnswer).
 *
 * ## Rigidity
 *
 * `pollEnabled` is a PROBE, not a weakened assertion — the same idiom as
 * `waitForVisible` in voter-journey.fixture.ts. It answers "is the selection
 * valid YET?", which is a genuine question during the click-up loop, and it is
 * never the thing that decides whether the test passes: if NO prefix of the
 * choice list ever becomes valid, the helper ends on a HARD `expect(...)
 * .toBeEnabled()` that fails loudly with the real reason. Net effect is
 * STRICTER than the code it replaces, which clicked twice and never verified
 * that the answer registered at all.
 */

import { expect } from '@playwright/test';
import { TIMEOUTS } from '../helpers';
import type { Locator } from '@playwright/test';

/**
 * Polling enabled-probe. Playwright's `locator.waitFor` supports only
 * visible/hidden/attached/detached, and `locator.isEnabled()` is a one-shot
 * snapshot — so poll `isEnabled()` until `timeout` elapses. Resolves `true` as
 * soon as the control is enabled, `false` on timeout. Never throws (a detached
 * element reads as "not enabled").
 */
async function pollEnabled(locator: Locator, timeout: number): Promise<boolean> {
  const deadline = Date.now() + timeout;
  for (;;) {
    if (await locator.isEnabled().catch(() => false)) return true;
    if (Date.now() >= deadline) return false;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/**
 * Click checkboxes from index 0 upward until the app reports the selection is
 * valid, and return how many were selected.
 *
 * @param choices - Locator resolving to THIS question's checkbox inputs (scope
 *   it by `name=questionChoices-{questionId}` on a voter Q→Q nav, where the
 *   outgoing question's choices linger — the SETTLE-BEFORE-COUNT contract).
 * @param validWhenEnabled - a control that is enabled iff the current selection
 *   is a valid answer (see the module docblock).
 * @param probeTimeout - per-step budget for the "did this click make the
 *   selection valid?" probe. Defaults to the `element` bucket (a button
 *   enabling is exactly that bucket's semantics). Costs one full budget per
 *   BELOW-min click, i.e. at most `minSelections - 1` waits per question.
 */
export async function selectSmallestValidMultiChoice({
  choices,
  validWhenEnabled,
  probeTimeout = TIMEOUTS.element
}: {
  choices: Locator;
  validWhenEnabled: Locator;
  probeTimeout?: number;
}): Promise<number> {
  const total = await choices.count();
  expect(total, 'selectSmallestValidMultiChoice: the question rendered no checkbox choices').toBeGreaterThan(0);
  for (let i = 0; i < total; i++) {
    await choices.nth(i).click();
    if (await pollEnabled(validWhenEnabled, probeTimeout)) return i + 1;
  }
  // Every prefix of the choice list was rejected. Re-assert HARD so the failure
  // carries Playwright's own diagnostics rather than a bare boolean.
  await expect(
    validWhenEnabled,
    `selectSmallestValidMultiChoice: selecting all ${total} choices never produced a valid answer — the question's minSelections/maxSelections window may be unsatisfiable`
  ).toBeEnabled({ timeout: probeTimeout });
  return total;
}
