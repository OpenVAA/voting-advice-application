/**
 * @file entityFilters fixture — Phase 88 Plan 04 T4.
 *
 * Function-fixture that bundles the SCOPE T4 `entityFilters` +
 * `entityFilterDialog` + `entityFilter` surfaces into one factory per
 * 88-04-RESEARCH.md R-4 (the dialog + per-filter shapes are tightly
 * coupled — a single `getFilter()` lookup hands the caller a per-filter
 * shape that operates inside the open dialog).
 *
 * **Rigidity contract** (SCOPE acceptance #6, identical to resultsPage):
 * - NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO
 *   `.catch(() => null)` on assertion-bearing locator interactions.
 *
 * **Conditional rendering invariant** (88-04-RESEARCH R-7): the
 * `entity-list-filter` testid is set on TWO Buttons inside
 * EntityListControls.svelte (one for the active-filter-state variant at
 * line 128, one for the inactive variant at line 137). Only ONE is in the
 * DOM at any time — `.first()` is safe and is the documented pattern.
 */

import { expect } from '@playwright/test';
import { testIds } from '../utils/testIds';
import type { Locator, Page } from '@playwright/test';

type Target = RegExp | string | ((count: number) => number);

function pickByTarget(loc: Locator, target: Target): Locator {
  if (typeof target === 'function') {
    return loc.nth(target(0)); // count unknown synchronously — caller must
    // ensure the indexer doesn't need `count`. Use the async variants in
    // `getFilter` / `getOption` below for count-aware indexing.
  }
  return loc.filter({ hasText: target as RegExp | string }).first();
}

export function createEntityFilters(page: Page) {
  /**
   * Returns the dialog-scoped + per-filter API surface, scoped to the
   * `entity-filter-dialog` testid (the Modal root) that is now open.
   */
  function createDialog(dialogRoot: Locator) {
    function createFilter(filterRow: Locator) {
      return {
        /**
         * All `entity-filter-option` <label> elements inside this filter row.
         * Enumerated filters only (Party / pick-multiple).
         */
        getOptions(): Locator {
          return filterRow.getByTestId(testIds.voter.results.filterOption);
        },

        /**
         * Single option by accessible name (regex/string) or indexer.
         */
        async getOption(target: Target): Promise<Locator> {
          const options = this.getOptions();
          if (typeof target === 'function') {
            const count = await options.count();
            return options.nth(target(count));
          }
          return options.filter({ hasText: target as RegExp | string }).first();
        },

        /**
         * Checkbox-only set-post-condition selection. Iterates options,
         * makes the set of CHECKED options exactly match those matching
         * `values`. If `values === undefined`, selects all options.
         *
         * Acceptable inputs:
         *   - Array of regex / string matchers (text-match each option's
         *     label).
         *   - (count) => Array<index> indexer (rare).
         *   - undefined → select-all.
         */
        async setSelection(
          values: Array<RegExp | string> | ((count: number) => Array<number>) | undefined
        ): Promise<void> {
          const options = this.getOptions();
          const total = await options.count();
          // Compute target index set.
          let targetIndices: Set<number>;
          if (values === undefined) {
            targetIndices = new Set(Array.from({ length: total }, (_, i) => i));
          } else if (typeof values === 'function') {
            targetIndices = new Set(values(total));
          } else {
            const candidates = await Promise.all(
              Array.from({ length: total }).map(async (_, i) => {
                const txt = await options.nth(i).innerText();
                return values.some((v) => (v instanceof RegExp ? v.test(txt) : txt.includes(v))) ? i : -1;
              })
            );
            targetIndices = new Set(candidates.filter((i) => i >= 0));
          }
          // Iterate and check/uncheck to match target set.
          for (let i = 0; i < total; i++) {
            const option = options.nth(i);
            const checkbox = option.getByRole('checkbox');
            const isChecked = await checkbox.isChecked();
            const shouldBeChecked = targetIndices.has(i);
            if (isChecked !== shouldBeChecked) {
              // Click the label itself (DaisyUI-style); the inner checkbox
              // is bound via bind:group.
              await option.click();
            }
          }
        },

        /**
         * Drive the numeric filter sliders. `null` leaves the bound
         * untouched. Per Wave-1.5 testids `entity-filter-numeric-min` /
         * `-max` on the <input type="range"> elements.
         */
        async setNumberRange(min?: number | null, max?: number | null): Promise<void> {
          if (min != null) {
            const minInput = filterRow.getByTestId(testIds.voter.results.filterNumericMin);
            await minInput.fill(String(min));
            await minInput.dispatchEvent('change');
          }
          if (max != null) {
            const maxInput = filterRow.getByTestId(testIds.voter.results.filterNumericMax);
            await maxInput.fill(String(max));
            await maxInput.dispatchEvent('change');
          }
        }
      };
    }

    return {
      /**
       * All `entity-filter-row` rows inside the open dialog.
       */
      getFilters(): Locator {
        return dialogRoot.getByTestId(testIds.voter.results.filterRow);
      },

      /**
       * Single filter row by accessible name (regex/string) or indexer.
       * Returns a per-filter API surface scoped to that row.
       */
      async getFilter(target: Target): Promise<ReturnType<typeof createFilter>> {
        const rows = this.getFilters();
        let row: Locator;
        if (typeof target === 'function') {
          const count = await rows.count();
          row = rows.nth(target(count));
        } else {
          row = rows.filter({ hasText: target as RegExp | string }).first();
        }
        return createFilter(row);
      },

      /**
       * Hard-assert the reset Button's disabled state.
       *
       * @param disabled default true (assert disabled).
       */
      async expectResetToBeDisabled({ disabled }: { disabled?: boolean } = { disabled: true }): Promise<void> {
        const reset = dialogRoot.getByTestId(testIds.voter.results.filterDialogReset);
        if (disabled !== false) {
          await expect(reset).toBeDisabled();
        } else {
          await expect(reset).toBeEnabled();
        }
      },

      /**
       * Click the apply Button (closes the dialog).
       */
      async close(): Promise<void> {
        await dialogRoot.getByTestId(testIds.voter.results.filterDialogApply).click();
        await expect(dialogRoot).toBeHidden();
      },

      /**
       * Click the reset Button. Dialog STAYS OPEN; caller decides whether
       * to close or continue asserting.
       */
      async reset(): Promise<void> {
        await dialogRoot.getByTestId(testIds.voter.results.filterDialogReset).click();
      }
    };
  }

  return {
    /**
     * The `entity-list-search` text-filter input (top-level filters chrome).
     */
    getTextFilter(): Locator {
      return page.getByTestId(testIds.voter.results.listSearch).getByRole('textbox');
    },

    /**
     * Fill the search input. Caller asserts the post-state.
     */
    async setTextFilter(text: string): Promise<void> {
      const input = this.getTextFilter();
      await input.fill(text);
    },

    /**
     * Clear the search input.
     */
    async clearTextFilter(): Promise<void> {
      const input = this.getTextFilter();
      await input.fill('');
    },

    /**
     * Click the `entity-list-filter` Button (using `.first()` per R-7 — the
     * two conditional-render variants share the testid but only one is in
     * the DOM at a time). After clicking, hard-asserts the dialog is
     * visible. Returns a dialog-scoped API.
     */
    async openFilterDialog(): Promise<ReturnType<typeof createDialog>> {
      const btn = page.getByTestId(testIds.voter.results.filterButton);
      await btn.first().click();
      const dialog = page.getByTestId(testIds.voter.results.filterDialog);
      await expect(dialog).toBeVisible();
      return createDialog(dialog);
    },

    /**
     * The `entity-list-filter-badge` wrapper (Wave 1.5 testid added at
     * EntityListControls.svelte:130 — only present when the active-state
     * Button variant is rendered, i.e. when numActiveFilters > 0).
     */
    getFilterButtonBadge(): Locator {
      return page.getByTestId(testIds.voter.results.filterBadge);
    }
  };
}

export type EntityFiltersFixture = ReturnType<typeof createEntityFilters>;

// Mark pickByTarget as referenced to satisfy `noUnusedLocals` if enabled.
// Keep as utility for future per-filter-row indexer use.
void pickByTarget;
