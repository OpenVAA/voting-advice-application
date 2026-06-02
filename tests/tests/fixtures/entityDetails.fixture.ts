/**
 * @file entityDetails fixture — Phase 88 Plan 04 T4.
 *
 * Function-fixture for the entity-details (drawer / page) view. Per
 * 88-04-RESEARCH.md R-3 secondary divergence: tab-name SETTINGS keywords
 * map to i18n display labels internally; spec bodies use the SETTINGS
 * keyword for readability. Info-item assertions accept regex/substring
 * matchers to accommodate the post-T2 `[<id-token>]` prefix on display
 * strings.
 *
 * **Rigidity contract** (SCOPE acceptance #6, identical to siblings):
 * - NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO
 *   `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { testIds } from '../utils/testIds';
import type { Locator, Page } from '@playwright/test';

/**
 * Mapping from SETTINGS keyword to i18n-displayed tab label. Per
 * 88-04-RESEARCH.md R-3: the SETTINGS keyword `children` displays as
 * "Members"; `info` as "Basic Info"; `opinions` as "Opinions". Spec bodies
 * stay free of i18n details by passing the SETTINGS keyword.
 *
 * NOTE: regex anchored case-insensitive; not exact-equality. Locked
 * against apps/frontend/src/lib/i18n/messages/en/entityDetails.json.
 */
const TAB_LABELS = Object.freeze({
  info: /Basic Info/i,
  children: /Members/i,
  opinions: /Opinions/i
}) as Readonly<Record<'info' | 'children' | 'opinions', RegExp>>;

/**
 * Mapping from SETTINGS keyword to the per-tab container testid (used to
 * scope `getInfoItems` / `getQuestionDisplays` / `getMemberCards` to the
 * currently-active tab's content).
 */
const TAB_CONTAINER_TESTID = Object.freeze({
  info: testIds.voter.entityDetail.infoTab,
  children: testIds.voter.entityDetail.childrenTab,
  opinions: testIds.voter.entityDetail.opinionsTab
}) as Readonly<Record<'info' | 'children' | 'opinions', string>>;

export function createEntityDetails(page: Page) {
  /**
   * Currently-active tab container — probed by checking each container's
   * visibility; the first visible one wins. Used internally by
   * `getInfoItems` / `getQuestionDisplays`.
   */
  function activeContainer(): Locator {
    return page
      .getByTestId(TAB_CONTAINER_TESTID.info)
      .or(page.getByTestId(TAB_CONTAINER_TESTID.children))
      .or(page.getByTestId(TAB_CONTAINER_TESTID.opinions));
  }

  return {
    /**
     * Click the matching tab via role + i18n label (mapped from SETTINGS
     * keyword).
     */
    async selectTab(tabType: 'info' | 'children' | 'opinions'): Promise<void> {
      const details = page.getByTestId(testIds.voter.results.entityDetails);
      await details.getByRole('tab', { name: TAB_LABELS[tabType] }).click();
    },

    /**
     * Assert the tab-list contains exactly the expected SETTINGS keywords
     * in the given order.
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
     * Hard-assert exactly one info-item matches both label + value regex/
     * substring matchers. Accepts regex/substring per R-3 (post-T2
     * `[<id-token>]` prefix in displayed strings).
     */
    async expectInfoItem(label: RegExp | string, value: RegExp | string): Promise<void> {
      const item = this.getInfoItems().filter({ hasText: label }).filter({ hasText: value });
      await expect(item).toHaveCount(1);
    },

    /**
     * All `entity-opinion-question` blocks inside the currently-active
     * opinions tab container.
     */
    getQuestionDisplays(): Locator {
      return activeContainer().getByTestId(testIds.voter.entityDetail.opinionQuestion);
    },

    /**
     * Assert a question display matches `target` (heading text), with
     * optional matchers for voter / entity answers, numSelected count,
     * and infoText (missing-answer marker text). Subsumes the legacy
     * `expectQuestionDisplayToHave` util in voter-mega-journey.spec.ts.
     *
     * Uses `filter({ hasText: target })` on the entity-opinion-question
     * div directly (more robust than the legacy helper's
     * `filter({ has: getByRole('heading', { level: 3, name: regex }) })`
     * which failed to match against the post-T2 [<id>] prefix on heading
     * text — see deferred-items.md).
     */
    async expectQuestionDisplay(
      target: RegExp | string,
      options?: {
        voterAnswer?: RegExp | string;
        entityAnswer?: RegExp | string;
        numSelected?: number;
        infoText?: RegExp | string;
      }
    ): Promise<void> {
      const block = this.getQuestionDisplays().filter({ hasText: target });
      await expect(block).toHaveCount(1);
      if (options?.numSelected !== undefined) {
        const voterChecked = block.getByRole('radio', { checked: true });
        const entitySelected = block.getByTestId(testIds.voter.entityDetail.entitySelectedAnswer);
        await expect(voterChecked.or(entitySelected)).toHaveCount(options.numSelected);
      }
      if (options?.infoText !== undefined) {
        // reason: infoText asserts the localized missing-answer marker message
        // (e.g. "hasn't answered") rendered inside the question display block.
        // The marker element carries no stable data-testid today; adding one is
        // deferred to Plan 92-03 (frontend-testid work). Until then this stays a
        // text-content assertion scoped to the already-resolved `block` locator.
        // eslint-disable-next-line playwright/no-restricted-locators
        await expect(block.getByText(options.infoText)).toBeVisible();
      }
      if (options?.voterAnswer !== undefined) {
        const voter = block.getByRole('radio', { checked: true });
        await expect(voter).toHaveAccessibleName(options.voterAnswer);
      }
      if (options?.entityAnswer !== undefined) {
        const entity = block.getByTestId(testIds.voter.entityDetail.entitySelectedAnswer);
        await expect(entity).toHaveAccessibleName(options.entityAnswer);
      }
    },

    /**
     * Outer member-cards under the currently-active children/members tab
     * container. The EntityCard.svelte conditional testid means
     * `entity-card` is set on outer cards only — subcards carry
     * `entity-card-subcard`. So getByTestId('entity-card') already
     * excludes subcards. NO hasNot filter (which would also exclude outer
     * cards that contain subcards as descendants).
     */
    getMemberCards(): Locator {
      return page.getByTestId(TAB_CONTAINER_TESTID.children).getByTestId(testIds.voter.results.card);
    }
  };
}

export type EntityDetailsFixture = ReturnType<typeof createEntityDetails>;
