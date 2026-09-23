/**
 * @file entityDetails fixture.
 *
 * Function-fixture for the entity-details (drawer / page) view. Tab-name SETTINGS keywords map to i18n display labels internally; spec bodies use the SETTINGS keyword for readability. Info-item assertions accept regex/substring matchers to accommodate the `[<id-token>]` prefix on display strings.
 *
 * **Rigidity contract** (identical to siblings):
 * - NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO
 *   `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

/**
 * Mapping from SETTINGS keyword to i18n-displayed tab label. The SETTINGS keyword `children` displays as "Members"; `info` as "Basic Info"; `opinions` as "Opinions". Spec bodies stay free of i18n details by passing the SETTINGS keyword.
 *
 * NOTE: regex anchored case-insensitive; not exact-equality. Locked against apps/frontend/src/lib/i18n/messages/en/entityDetails.json.
 */
const TAB_LABELS = Object.freeze({
  info: /Basic Info/i,
  children: /Members/i,
  opinions: /Opinions/i
}) as Readonly<Record<'info' | 'children' | 'opinions', RegExp>>;

/**
 * Mapping from SETTINGS keyword to the per-tab container testid (used to scope `getInfoItems` / `getQuestionDisplays` / `getMemberCards` to the currently-active tab's content).
 */
const TAB_CONTAINER_TESTID = Object.freeze({
  info: testIds.voter.entityDetail.infoTab,
  children: testIds.voter.entityDetail.childrenTab,
  opinions: testIds.voter.entityDetail.opinionsTab
}) as Readonly<Record<'info' | 'children' | 'opinions', string>>;

export function createEntityDetails(page: Page) {
  /**
   * Currently-active tab container — probed by checking each container's visibility; the first visible one wins. Used internally by `getInfoItems` / `getQuestionDisplays`.
   */
  function activeContainer(): Locator {
    return page
      .getByTestId(TAB_CONTAINER_TESTID.info)
      .or(page.getByTestId(TAB_CONTAINER_TESTID.children))
      .or(page.getByTestId(TAB_CONTAINER_TESTID.opinions));
  }

  /**
   * Assert the entity-details drawer is (not) visible via its container load anchor — the canonical voter-page paradigm.
   *
   * NOTE: no `goToPage` is exposed here. The entity-detail is a DRAWER opened from the results listing (`resultsPage.openEntityDetailsForCard`), not a standalone navigable page — there is no deep-link `page.goto` to the `ResultEntity` route across `tests/`. A goToPage taking the runtime-discovered entity id would be a freeform-URL smell. Callers open the drawer via the results fixture, then assert with `expectPageVisible`.
   */
  async function expectPageVisible(visible = true): Promise<void> {
    await expect(page.getByTestId(testIds.voter.entityDetail.container)).toBeVisible({ visible, timeout: 5_000 });
  }

  return {
    expectPageVisible,

    /**
     * Click the matching tab via role + i18n label (mapped from SETTINGS keyword).
     */
    async selectTab(tabType: 'info' | 'children' | 'opinions'): Promise<void> {
      const details = page.getByTestId(testIds.voter.results.entityDetails);
      await details.getByRole('tab', { name: TAB_LABELS[tabType] }).click();
    },

    /**
     * Assert the tab-list contains exactly the expected SETTINGS keywords in the given order.
     */
    async expectTabs(expectedTypes: Array<'info' | 'children' | 'opinions'>): Promise<void> {
      const details = page.getByTestId(testIds.voter.results.entityDetails);
      const tabs = details.getByRole('tab');
      await expect(tabs).toHaveCount(expectedTypes.length);
      for (let i = 0; i < expectedTypes.length; i++) {
        await expect(tabs.nth(i)).toHaveAccessibleName(TAB_LABELS[expectedTypes[i]]);
      }
    },

    /**
     * All `info-item` elements inside the currently-active tab container.
     */
    getInfoItems(): Locator {
      return activeContainer().getByTestId(testIds.voter.results.infoItem);
    },

    /**
     * Hard-assert exactly one info-item matches both label + value regex/substring matchers. Accepts regex/substring to tolerate the `[<id-token>]` prefix in displayed strings.
     */
    async expectInfoItem(label: RegExp | string, value: RegExp | string): Promise<void> {
      const item = this.getInfoItems().filter({ hasText: label }).filter({ hasText: value });
      await expect(item).toHaveCount(1);
    },

    /**
     * All `entity-opinion-question` blocks inside the currently-active opinions tab container.
     */
    getQuestionDisplays(): Locator {
      return activeContainer().getByTestId(testIds.voter.entityDetail.opinionQuestion);
    },

    /**
     * Assert a question display matches `target` (heading text), with optional matchers for voter / entity answers, numSelected count, and infoText (missing-answer marker text).
     *
     * Uses `filter({ hasText: target })` on the entity-opinion-question div directly (more robust than a heading-role filter, which fails to match against the [<id>] prefix on heading text).
     */
    async expectQuestionDisplay(
      target: RegExp | string,
      options?: {
        voterAnswer?: RegExp | string;
        entityAnswer?: RegExp | string;
        numSelected?: number;
        /**
         * Count of CHECKED voter inputs (radios + checkboxes unioned). For MultipleChoiceCategorical (checkbox) displays the voter answer is ≥1 checked checkbox — the radio-only reads used by single-select types are invisible to it.
         */
        voterSelectedCount?: number;
        /**
         * Count of ENTITY selected-answer markers inside the block. The single-select `entityAnswer` accessible-name path assumes exactly one marker; multi-select entity answers surface N markers, so they are asserted by count.
         */
        entitySelectedCount?: number;
        infoText?: RegExp | string;
      }
    ): Promise<void> {
      const block = this.getQuestionDisplays().filter({ hasText: target });
      await expect(block).toHaveCount(1);
      if (options?.numSelected !== undefined) {
        // Voter-side reads union checked radios AND checked checkboxes so checkbox multi-choice displays are counted; single-select types have zero checkboxes so the union is a no-op for them.
        const voterChecked = block
          .getByRole('radio', { checked: true })
          .or(block.getByRole('checkbox', { checked: true }));
        const entitySelected = block.getByTestId(testIds.voter.entityDetail.entitySelectedAnswer);
        await expect(voterChecked.or(entitySelected)).toHaveCount(options.numSelected);
      }
      if (options?.voterSelectedCount !== undefined) {
        const voterChecked = block
          .getByRole('radio', { checked: true })
          .or(block.getByRole('checkbox', { checked: true }));
        await expect(voterChecked).toHaveCount(options.voterSelectedCount);
      }
      if (options?.entitySelectedCount !== undefined) {
        const entitySelected = block.getByTestId(testIds.voter.entityDetail.entitySelectedAnswer);
        await expect(entitySelected).toHaveCount(options.entitySelectedCount);
      }
      if (options?.infoText !== undefined) {
        // reason: infoText asserts the localized missing-answer marker message (e.g. "hasn't answered") rendered inside the question display block.
        // The marker element carries no stable data-testid today, so this stays a text-content assertion scoped to the already-resolved `block` locator.
        // eslint-disable-next-line playwright/no-restricted-locators
        await expect(block.getByText(options.infoText)).toBeVisible();
      }
      if (options?.voterAnswer !== undefined) {
        const voter = block.getByRole('radio', { checked: true }).or(block.getByRole('checkbox', { checked: true }));
        await expect(voter).toHaveAccessibleName(options.voterAnswer);
      }
      if (options?.entityAnswer !== undefined) {
        const entity = block.getByTestId(testIds.voter.entityDetail.entitySelectedAnswer);
        await expect(entity).toHaveAccessibleName(options.entityAnswer);
      }
    },

    /**
     * Assert the number-scale dual-marker read-only display inside the question block matching `target`. Derived from NumberScaleInput.svelte's display-mode markup:
     *   - the disabled `question-number-slider` carries `value = voter ?? entity ?? midpoint` (voter wins) — asserted as the authoritative numeric.
     *   - marker `<div class="marker …" style="left: {pct}%">` positions encode each value; when voter === entity a SINGLE combined marker renders (bothEqual), otherwise one marker per present value.
     *
     * `min`/`max` default to the base number question's 0/10 range (used only to compute the expected marker offset).
     */
    async expectNumberQuestionDisplay(
      target: RegExp | string,
      {
        voterValue,
        entityValue,
        min = 0,
        max = 10
      }: { voterValue?: number; entityValue?: number; min?: number; max?: number }
    ): Promise<void> {
      const block = this.getQuestionDisplays().filter({ hasText: target });
      await expect(block).toHaveCount(1);
      const container = block.getByTestId(testIds.voter.questions.numberScaleInput);
      await expect(container).toBeVisible();

      // The display slider's value attribute is `voter ?? entity ?? midpoint`.
      const displayValue = voterValue ?? entityValue;
      if (displayValue !== undefined) {
        await expect(container.getByTestId(testIds.voter.questions.numberSlider)).toHaveValue(String(displayValue));
      }

      const pct = (v: number): number =>
        max === min ? 0 : Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100));
      // reason: the display-mode value markers carry the class `marker` (set in NumberScaleInput.svelte) but no data-testid — the numeric value is encoded in the `left: {pct}%` inline style. No getByTestId/getByRole form expresses a class-scoped marker read.
      // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
      const markers = container.locator('.marker');

      if (voterValue != null && entityValue != null && voterValue === entityValue) {
        // bothEqual → a single combined marker at the shared position.
        await expect(markers).toHaveCount(1);
        await expect(markers.first()).toHaveAttribute('style', new RegExp(`left:\\s*${pct(voterValue)}%`));
      } else {
        const expectedCount = (voterValue != null ? 1 : 0) + (entityValue != null ? 1 : 0);
        await expect(markers).toHaveCount(expectedCount);
        if (voterValue != null) {
          await expect(
            // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
            container.locator('.marker.text-primary')
          ).toHaveAttribute('style', new RegExp(`left:\\s*${pct(voterValue)}%`));
        }
      }
    },

    /**
     * Outer member-cards under the currently-active children/members tab container. The EntityCard.svelte conditional testid means `entity-card` is set on outer cards only — subcards carry `entity-card-subcard`. So getByTestId('entity-card') already excludes subcards. NO hasNot filter (which would also exclude outer cards that contain subcards as descendants).
     */
    getMemberCards(): Locator {
      return page.getByTestId(TAB_CONTAINER_TESTID.children).getByTestId(testIds.voter.results.card);
    }
  };
}

export type EntityDetailsFixture = ReturnType<typeof createEntityDetails>;
