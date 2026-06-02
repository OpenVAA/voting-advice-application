/**
 * @file resultsPage fixture — Phase 88 Plan 04 T4.
 *
 * Function-fixture that exposes a narrow `ResultsPageFixture` surface for the
 * voter results listing screen. Sibling to `entityFilters.fixture.ts` and
 * `entityDetails.fixture.ts`; composed in `tests/tests/fixtures/views.ts`.
 *
 * **Rigidity contract** (Phase 88 Plan 04 SCOPE acceptance #6):
 * - NO `expect.soft` in any helper.
 * - NO `try/catch` wrapping `expect(...)`.
 * - NO best-effort `.catch(() => null)` on assertion-bearing locator
 *   interactions. The sole exception is `dismissAllDialogs`, which is a
 *   purely best-effort cleanup helper and is explicitly documented as such;
 *   callers MUST follow it with a hard assertion on the desired post-state.
 *
 * **Caller-supplied locators / regexes / indexers** (Phase 88 Plan 04 R-10 —
 * fixture coupling guard): every method that targets a specific entity / tab
 * takes a `RegExp | string | ((count: number) => number)` from the caller.
 * NO hardcoded baseV1-specific strings (e.g. `'Party AA'`) in fixture bodies.
 */

import { expect } from '@playwright/test';
import { buildRoute } from '../utils/buildRoute';
import { testIds } from '../utils/testIds';
import type { Locator, Page } from '@playwright/test';

/**
 * Target descriptor used by lookups that accept either a textual matcher
 * (regex or string) or a count-driven indexer.
 */
type Target = RegExp | string | ((count: number) => number);

/**
 * Mapping from SETTINGS keyword to the accessible name regex Playwright
 * uses to find the matching entity-tab. Internal to the fixture; tests pass
 * the SETTINGS keyword.
 */
const ENTITY_TAB_LABELS = Object.freeze({
  cands: /Candidates/i,
  orgs: /Parties|Organizations/i,
  alliances: /Alliances/i
}) as Readonly<Record<'cands' | 'orgs' | 'alliances', RegExp>>;

/**
 * Mapping from SETTINGS keyword to the entity-section testid. Used to
 * scope `getEntityCards()` to the currently active section.
 */
const ENTITY_SECTION_TESTID = Object.freeze({
  cands: testIds.voter.results.candidateSection,
  orgs: testIds.voter.results.partySection,
  alliances: testIds.voter.results.allianceSection
}) as Readonly<Record<'cands' | 'orgs' | 'alliances', string>>;

export function createResultsPage(page: Page) {
  /**
   * Active entity-section locator. The frontend conditionally renders
   * ONE of three section testids
   * (`voter-results-{candidate,party,alliance}-section`) based on the
   * active entity-type — only one is in DOM at a time. The OR locator
   * resolves to whichever is currently present. Callers MUST call
   * selectEntityTab first (or otherwise navigate so a section is rendered)
   * before consuming `getEntityCards()`.
   */
  function activeSectionLocator(): Locator {
    const cand = page.getByTestId(ENTITY_SECTION_TESTID.cands);
    const org = page.getByTestId(ENTITY_SECTION_TESTID.orgs);
    const al = page.getByTestId(ENTITY_SECTION_TESTID.alliances);
    return cand.or(org).or(al);
  }

  /**
   * Assert the results page is (not) visible via its results-list load anchor.
   * Phase 92 Plan 03 (D-06/D-07): the canonical voter-page paradigm pair.
   */
  async function expectPageVisible(visible = true): Promise<void> {
    await expect(page.getByTestId(testIds.voter.results.list)).toBeVisible({ visible, timeout: 5_000 });
  }

  return {
    /**
     * Navigate to the voter results page (locale-aware) and assert it loaded.
     * Phase 92 Plan 03 (D-06/D-08): requires an already-located voter session
     * (an unlocated /results bounces through the selector chain).
     */
    async goToPage(locale = 'en'): Promise<void> {
      // buildRoute already returns a leading-slash path (e.g. '/results') with NO locale
      // segment (voter ROUTE values carry no [[lang=locale]] token). Base locale 'en' is
      // served from '/' (Paraglide); non-base locales are prefixed '/<locale>' (e.g. '/fi/results').
      await page.goto((locale === 'en' ? '' : `/${locale}`) + buildRoute({ route: 'Results', locale }) || '/');
      await expectPageVisible(true);
    },

    expectPageVisible,

    /**
     * Click the matching election option inside the
     * `voter-results-election-select` accordion.
     *
     * Per Wave-0 Probe 4 (88-04-WAVE0-PROBES.txt): the inner clickable is
     * a `<button role="option">` whose accessible name comes from the
     * election's name field (post-T2: `[el-reg] Regional Election` etc.).
     *
     * @param target accepted as RegExp / string (text match on the option's
     *   accessible name) OR a `(count) => index` indexer.
     */
    async selectElection(target: Target): Promise<void> {
      const accordion = page.getByTestId(testIds.voter.results.electionAccordion);
      const options = accordion.getByRole('option');
      const chosen =
        typeof target === 'function'
          ? options.nth(target(await options.count()))
          : options.filter({ hasText: target as RegExp | string });
      await chosen.first().click();
    },

    /**
     * Click the entity-tab matching the SETTINGS keyword. The fixture maps
     * the keyword to the visible (i18n) label internally so spec bodies
     * stay free of i18n details. After clicking, hard-asserts the matching
     * entity-section is visible so subsequent `getEntityCards()` reads
     * resolve against a populated section (not a transitioning DOM).
     */
    async selectEntityTab(entityType: 'cands' | 'orgs' | 'alliances'): Promise<void> {
      const tablist = page.getByTestId(testIds.voter.results.entityTabs);
      await tablist.getByRole('tab', { name: ENTITY_TAB_LABELS[entityType] }).click();
      const sectionTestid = ENTITY_SECTION_TESTID[entityType];
      await expect(page.getByTestId(sectionTestid)).toBeVisible();
    },

    /**
     * Assert the entity-tabs list contains exactly the expected SETTINGS
     * keywords in the given order.
     */
    async expectEntityTabs(expectedTypes: Array<'cands' | 'orgs' | 'alliances'>): Promise<void> {
      const tablist = page.getByTestId(testIds.voter.results.entityTabs);
      const tabs = tablist.getByRole('tab');
      await expect(tabs).toHaveCount(expectedTypes.length);
      for (let i = 0; i < expectedTypes.length; i++) {
        await expect(tabs.nth(i)).toHaveAccessibleName(ENTITY_TAB_LABELS[expectedTypes[i]]);
      }
    },

    /**
     * Outer entity-cards under the currently-active entity-tab section.
     * After Phase 88 Plan 04 Wave 1.5 the EntityCard.svelte testid is
     * conditional: outer cards carry `entity-card`, subcards carry
     * `entity-card-subcard`. So `getByTestId('entity-card')` ALREADY
     * excludes subcards — no `hasNot` filter is needed (and applying one
     * would incorrectly exclude OUTER cards that CONTAIN subcards as
     * descendants).
     *
     * Returns a synchronous Playwright Locator (no `await`).
     */
    getEntityCards(): Locator {
      return activeSectionLocator().getByTestId(testIds.voter.results.card);
    },

    /**
     * Return a single Locator filtered from {@link getEntityCards} by:
     * - regex / string → `hasText: target`
     * - function       → `nth(target(count))`
     */
    async getEntityCard(target: Target): Promise<Locator> {
      const cards = this.getEntityCards();
      if (typeof target === 'function') {
        const count = await cards.count();
        return cards.nth(target(count));
      }
      return cards.filter({ hasText: target as RegExp | string }).first();
    },

    /**
     * Best-effort cleanup: press Escape, then if any role=dialog is still
     * visible, click any visible close button. NOT a hard assertion —
     * callers MUST follow this with their own hard assertion on the desired
     * post-state (e.g. `expect(page.getByRole('dialog')).toBeHidden()`).
     *
     * Uses `Locator.waitFor` + `.catch(() => null)` because the helper is
     * purely best-effort; assertion-bearing locator interactions in the
     * fixture's API surface NEVER use `.catch(() => null)` per R-6.
     */
    async dismissAllDialogs(): Promise<void> {
      await page.keyboard.press('Escape').catch(() => null);
      const dialog = page.getByRole('dialog').first();
      const stillVisible = await dialog
        .waitFor({ state: 'visible', timeout: 500 })
        .then(() => true)
        .catch(() => false);
      if (stillVisible) {
        const closeBtn = page.getByRole('button', { name: /close|cancel|dismiss/i }).first();
        const closeVisible = await closeBtn.isVisible({ timeout: 500 }).catch(() => false);
        if (closeVisible) {
          await closeBtn.click().catch(() => null);
        }
      }
    },

    /**
     * Open the entity-details view for the card matching `target`.
     *
     * Implementation note (EntityCardAction structure): when the card has
     * subcards, the outer article is NOT click-navigable — only the inner
     * header gets an EntityCardAction <a> wrap (so each subcard is
     * independently navigable). Clicking the outer article does nothing.
     * Robust approach: click the FIRST entity-card-action descendant —
     * which is always the parent card's primary action (the whole-article
     * wrap for no-subcard cards, the header wrap for subcard cards).
     * Subcards have their own entity-card-action descendants too, but the
     * FIRST one in DOM order is always the parent's.
     *
     * After click, hard-asserts entity-details container visible.
     */
    async openEntityDetailsForCard(target: Target): Promise<void> {
      const card = await this.getEntityCard(target);
      await card.getByTestId('entity-card-action').first().click();
      await expect(page.getByTestId(testIds.voter.results.entityDetails)).toBeVisible();
    }
  };
}

export type ResultsPageFixture = ReturnType<typeof createResultsPage>;
