/**
 * Combobox/listbox iteration helper for Select.svelte interactions.
 *
 * Thin wrapper around the multi-combobox + listbox-option iteration
 * pattern used to drive every `<Select>` rendered on a page (e.g. the
 * `/constituencies` page renders one Select per applicable-elections
 * group; the helper iterates all sections and picks the first option in
 * each).
 *
 * Select.svelte ARIA contract:
 *   `<Select>` renders as `role="combobox"` (NOT `role="radiogroup"`).
 *   The opened menu is `role="listbox"`; each item is `role="option"`.
 *   Keep this "NOT a radiogroup" contract in mind before re-extending this
 *   helper — using `radio` / `radiogroup` roles against `<Select>` silently
 *   does nothing.
 *
 * Scope:
 *   This helper is narrow — it iterates EVERY combobox in the locator
 *   and clicks the same `optionIndex` in each. Named-combobox variants
 *   (e.g. picking a SPECIFIC option text in a SPECIFIC combobox among
 *   many) are intentionally NOT supported by this helper.
 */

import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

/**
 * Iterate every combobox in `comboboxLocator`, open it, click the
 * option at `optionIndex` (default 0), and wait for the listbox to hide.
 *
 * Preconditions:
 *   - `comboboxLocator` resolves to ≥1 combobox element. The helper
 *     fails-fast if `count === 0` with a diagnostic message.
 *   - Each combobox opens a `role="listbox"` overlay (configurable via
 *     `opts.listboxRole`, default `'listbox'`) when clicked.
 *
 * See module docstring; the option role is `'option'` by Select.svelte
 * contract, NOT `'radio'`.
 *
 * @param page - Playwright Page (needed to locate the listbox overlay,
 *   which is rendered at page-root via Portal in Select.svelte).
 * @param comboboxLocator - Locator resolving to one or more
 *   `role="combobox"` elements (e.g.
 *   `page.getByTestId(testIds.voter.constituencies.list).getByRole('combobox')`).
 * @param opts.optionIndex - index of the option to pick in each listbox;
 *   default `0` (pick the first option).
 * @param opts.listboxRole - ARIA role of the listbox overlay; default
 *   `'listbox'`. Override only if Select.svelte's contract changes.
 * @param opts.perComboboxTimeoutMs - per-combobox listbox-visible budget
 *   in ms; default `5_000`.
 */
export async function iterateSelectOptions(
  page: Page,
  comboboxLocator: Locator,
  opts: {
    optionIndex?: number;
    listboxRole?: string;
    perComboboxTimeoutMs?: number;
  } = {}
): Promise<void> {
  const optionIndex = opts.optionIndex ?? 0;
  const listboxRole = opts.listboxRole ?? 'listbox';
  const perComboboxTimeoutMs = opts.perComboboxTimeoutMs ?? 5_000;
  await comboboxLocator.first().waitFor({ state: 'visible', timeout: 10_000 });
  const count = await comboboxLocator.count();
  expect(count, 'expected at least one combobox to render').toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const cb = comboboxLocator.nth(i);
    await cb.click();
    const listbox = page.getByRole(listboxRole as 'listbox');
    await listbox.waitFor({ state: 'visible', timeout: perComboboxTimeoutMs });
    await listbox.getByRole('option').nth(optionIndex).click();
    await listbox.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => null);
  }
}
