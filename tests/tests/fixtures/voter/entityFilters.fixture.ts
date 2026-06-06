/**
 * @file entityFilters fixture.
 *
 * Function-fixture that bundles the `entityFilters` + `entityFilterDialog` +
 * `entityFilter` surfaces into one factory (the dialog + per-filter shapes
 * are tightly coupled — a single `getFilter()` lookup hands the caller a
 * per-filter shape that operates inside the open dialog).
 *
 * **Rigidity contract** (identical to resultsPage):
 * - NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO
 *   `.catch(() => null)` on assertion-bearing locator interactions.
 *
 * **Conditional rendering invariant**: the `entity-list-filter` testid is
 * set on TWO Buttons inside EntityListControls.svelte (one for the
 * active-filter-state variant at line 128, one for the inactive variant at
 * line 137). Only ONE is in the DOM at any time — `.first()` is safe and is
 * the documented pattern.
 */

import { expect } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

type Target = RegExp | string | ((count: number) => number);

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
          // Settle: getFilter() auto-expands the row and reveals these options
          // REACTIVELY (Expander toggle), but returns without waiting. Reading
          // count() before the options mount makes the check/uncheck loop below a
          // silent no-op (total === 0 → nothing selected), so the filter never
          // applies — the intermittent voter-journey STAGE-5a flake (13 cards
          // instead of 12, "9× resolved to 13"). Wait for the first option to
          // render before counting.
          await expect(options.first()).toBeVisible({ timeout: 5_000 });
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
       *
       * Auto-expands the filter row if it's currently collapsed (EntityFilters
       * defaults `defaultExpanded` to false for non-active / non-text
       * filters — see EntityFilters.svelte:55). The Expander surface
       * controls visibility via an internal checkbox toggle; clicking
       * the filter's "Expand or collapse this section" checkbox shows
       * the inner options.
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
        // Auto-expand if collapsed. Expander uses a checkbox-toggle
        // internally; check the state and click to expand if needed.
        // Hard-assert toggle visibility (per fixture rigidity contract) before
        // reading state — no `.catch(() => true)` swallowing a frontend
        // regression that would surface as zero-options downstream.
        const toggle = row.getByRole('checkbox', { name: /expand or collapse/i }).first();
        await expect(toggle).toBeVisible({ timeout: 2_000 });
        const isExpanded = await toggle.isChecked();
        if (!isExpanded) {
          await toggle.click();
        }
        return createFilter(row);
      },

      /**
       * Hard-assert the reset Button's disabled state.
       *
       * The Modal action snippet's `data-testid="entity-filter-dialog-apply"`
       * / `data-testid="entity-filter-dialog-reset"` are wired on the
       * `<Button>` component (which forwards via `concatClass(restProps,
       * classes)` to a `<svelte:element this="button">`). Empirically the
       * resulting testid-on-button lookup is unreliable inside the open
       * `getByRole('dialog')` scope — strict-mode resolution fails to
       * locate the button despite it being in DOM (root cause: the
       * `<svelte:element>` + concatClass forwarding chain in Svelte 5
       * apparently doesn't surface `data-testid` on the rendered element
       * in all cases). Switching to `getByRole('button', { name: <i18n> })`
       * scoped to the dialog root bypasses the testid mechanism entirely
       * — buttons have stable accessible names ("Close filters" /
       * "Reset filters") that are visibility-aware by default.
       *
       * @param disabled default true (assert disabled).
       */
      async expectResetToBeDisabled({ disabled }: { disabled?: boolean } = { disabled: true }): Promise<void> {
        const reset = dialogRoot.getByRole('button', { name: /Reset filters/i });
        if (disabled !== false) {
          await expect(reset).toBeDisabled();
        } else {
          await expect(reset).toBeEnabled();
        }
      },

      /**
       * Click the apply Button (closes the dialog). See note on
       * `expectResetToBeDisabled` re: the role-based lookup.
       */
      async close(): Promise<void> {
        await dialogRoot.getByRole('button', { name: /Close filters/i }).click();
        await expect(dialogRoot).toBeHidden();
      },

      /**
       * Click the reset Button. NB — `resetFilters()` at
       * EntityListControls.svelte:96-100 calls `filterGroup?.reset()` AND
       * `filtersModalRef?.closeModal()` synchronously, so clicking reset
       * CLOSES the dialog as a side-effect. Callers should NOT call
       * `close()` afterwards; the dialog is already gone.
       *
       * Awaits the dialog being hidden before returning so subsequent
       * `openFilterDialog()` calls observe a clean baseline.
       */
      async reset(): Promise<void> {
        await dialogRoot.getByRole('button', { name: /Reset filters/i }).click();
        await expect(dialogRoot).toBeHidden();
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
     * Click the `entity-list-filter` Button (using `.first()` — the two
     * conditional-render variants share the testid but only one is in the
     * DOM at a time). After clicking, hard-asserts the dialog is visible.
     * Returns a dialog-scoped API.
     */
    async openFilterDialog(): Promise<ReturnType<typeof createDialog>> {
      const btn = page.getByTestId(testIds.voter.results.filterButton);
      await btn.first().click();
      // The Modal forwards the `entity-filter-dialog` testid via concatClass,
      // but empirically `getByTestId('entity-filter-dialog')` doesn't reliably
      // resolve.
      // Use role=dialog (the <dialog> element's implicit role) filtered by
      // accessible name 'Filters' (i18n key entityFilters.filters →
      // Modal `title` prop → <h2>). The Modal stays in DOM with the
      // `hidden` class post-close, but Playwright's getByRole excludes
      // hidden-by-CSS elements by default (visible=true is the default).
      const dialog = page.getByRole('dialog', { name: /Filters/i });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      return createDialog(dialog);
    },

    /**
     * The filter button's badge surface. Returns the filter button itself
     * so callers can `toContainText(/<count>/)` against the rendered count.
     *
     * A `<span>` wrapping `<InfoBadge>` does NOT survive Svelte 5's snippet
     * compilation — the rendered DOM contains only the InfoBadge's inner
     * `<div class="badge ...">`. Rather than chase the Svelte 5
     * snippet-wrapping behaviour, scope the assertion to the filter button
     * itself (which has accessible name "<count> Filter" when active — the
     * badge count is part of the button's textContent).
     */
    getFilterButtonBadge(): Locator {
      return page.getByTestId(testIds.voter.results.filterButton).first();
    }
  };
}

export type EntityFiltersFixture = ReturnType<typeof createEntityFilters>;
