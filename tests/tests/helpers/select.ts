/**
 * Combobox/listbox iteration helper for Select.svelte interactions.
 *
 * Thin wrapper around the multi-combobox + listbox-option iteration pattern used to drive every `<Select>` rendered on a page (e.g. the `/constituencies` page renders one Select per applicable-elections group; the helper iterates all sections and picks the first option in each).
 *
 * Select.svelte ARIA contract:
 *   `<Select>` renders as `role="combobox"` (NOT `role="radiogroup"`).
 *   The opened menu is `role="listbox"`; each item is `role="option"`.
 *   Keep this "NOT a radiogroup" contract in mind before re-extending this helper — using `radio` / `radiogroup` roles against `<Select>` silently does nothing.
 *
 * Scope:
 *   This helper is narrow — it iterates EVERY combobox in the locator and clicks the first option in each. Named-combobox variants (e.g. picking a SPECIFIC option text in a SPECIFIC combobox among many) are intentionally NOT supported by this helper.
 */

import { expect } from '@playwright/test';
import { TIMEOUTS } from './timeouts';
import type { Locator, Page } from '@playwright/test';

/**
 * Iterate every combobox in `comboboxLocator`, open it, click its first option, and wait for the listbox to hide.
 *
 * Preconditions:
 *   - `comboboxLocator` resolves to ≥1 combobox element. The helper fails-fast if `count === 0` with a diagnostic message.
 *   - Each combobox opens a `role="listbox"` overlay when clicked.
 *
 * See module docstring; the option role is `'option'` by Select.svelte contract, NOT `'radio'`.
 *
 * @param page - Playwright Page (needed to locate the listbox overlay,
 *   which is rendered at page-root via Portal in Select.svelte).
 * @param comboboxLocator - Locator resolving to one or more
 *   `role="combobox"` elements (e.g.
 *   `page.getByTestId(testIds.voter.constituencies.list).getByRole('combobox')`).
 */
export async function iterateSelectOptions(page: Page, comboboxLocator: Locator): Promise<void> {
  await comboboxLocator.first().waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
  const count = await comboboxLocator.count();
  expect(count, 'expected at least one combobox to render').toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const cb = comboboxLocator.nth(i);
    await cb.click();
    const listbox = page.getByRole('listbox');
    await listbox.waitFor({ state: 'visible', timeout: TIMEOUTS.page });
    await listbox.getByRole('option').first().click();
    await listbox.waitFor({ state: 'hidden', timeout: TIMEOUTS.element }).catch(() => null);
  }
}
