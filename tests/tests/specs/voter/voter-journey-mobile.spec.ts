/**
 * voter-journey-mobile (EFLOW-11) — interactive voter journey at the mobile
 * viewport.
 *
 * This is the MOBILE-DESCRIPTOR leaf for the voter journey. The walk itself is
 * the viewport-agnostic 'max' walk owned by `voter-journey.fixture.ts`
 * (`answeredVoterPage`: Home → Intro → election-select → constituency-select →
 * answer all opinion questions → /results). The MOBILE descriptor (390×844,
 * `isMobile`, `hasTouch`) lives at PROJECT scope in playwright.config.ts
 * (`voter-journey-mobile` project) — the spec consumes the unchanged walk under
 * that descriptor. Do NOT re-implement a bespoke mobile walk (the descriptor is
 * config; the walk is shared — Phase 121 Don't-Hand-Roll).
 *
 * On top of the walk, this leaf exercises the mobile-specific affordances that
 * only matter at a touch/narrow viewport:
 *   - the candidate-details DRAWER opened from a results card,
 *   - a results FILTER (text filter narrows the card list),
 *   - the MOBILE NAV menu (the hamburger drawer) via `navMenu.openMobileNav()`,
 *     including activating a nav-menu item (Feedback), and
 *   - the FEEDBACK dialog reached through that mobile nav drawer (open + submit).
 *
 * Every step is a real interaction (not a screenshot) — the visual-regression
 * project owns the baseline-pixel mobile shot; this leaf owns the FUNCTIONAL
 * mobile journey.
 *
 * Seed: `data-setup-base` (`e2e/base`) — multi-election + multi-constituency.
 * Voter routes are public (no auth).
 *
 * Rigidity contract (project E2E Hard Rule): every assertion is HARD — no
 * expect.soft, no try/catch around expect(), no .catch fallback.
 */

import { expect } from '@playwright/test';
import { createFeedbackDialog } from '../../fixtures/shared/feedbackDialog.fixture';
import { createNavMenu } from '../../fixtures/shared/navMenu.fixture';
import { createEntityFilters } from '../../fixtures/voter/entityFilters.fixture';
import { createResultsPage } from '../../fixtures/voter/resultsPage.fixture';
import { voterJourneyTest } from '../../fixtures/voter/voter-journey.fixture';
import { TIMEOUTS } from '../../helpers';
import { testIds } from '../../utils/testIds';

/**
 * The in-app DataConsent "granted" button accessible name (DataConsent.svelte),
 * scoped via the auto-opened popup dialog. Locked against
 * apps/frontend/.../dataConsent (mirrors voter-prefs-tracking.spec.ts:62).
 */
const GRANTED_BUTTON = /agree to share my data/i;

/**
 * Mobile-only fixture pre-step: auto-dismiss the DataConsentPopup whenever it
 * appears, by granting consent through its in-app control.
 *
 * Why this is mobile-specific (and absent from the desktop voter-journey
 * project): when consent is `indetermined` the voter layout auto-opens the
 * DataConsentPopup — a modal `Alert`. On DESKTOP the alert positions
 * bottom-right (`sm:bottom-safelgb sm:left-safelgl`) clear of the centered
 * elections/constituencies "Continue" button, so the shared walk's clicks land.
 * On MOBILE the SAME alert is full-width bottom-anchored (`w-full bottom-0`), so
 * it INTERCEPTS the bottom-of-viewport Continue button — the walk's
 * `electionsContinue.click()` then retries against the overlay until it times
 * out.
 *
 * `addLocatorHandler` registers a Playwright-driven handler that fires the grant
 * click the moment the popup obstructs an actionability check, then continues —
 * so the VIEWPORT-AGNOSTIC shared walk runs unchanged at 390×844 (the descriptor
 * is project config; the walk is reused — Phase 121 Don't-Hand-Roll). Driving
 * the real in-app control keeps the app state coherent (no fabricated
 * localStorage envelope).
 */
const test = voterJourneyTest.extend({
  page: async ({ page }, use) => {
    const grantButton = page.getByRole('dialog').getByRole('button', { name: GRANTED_BUTTON });
    await page.addLocatorHandler(grantButton, async () => {
      await grantButton.click();
    });
    await use(page);
  }
});

// EFLOW-11: interactive voter journey at mobile viewport.
test.describe('voter-journey-mobile (EFLOW-11)', () => {
  test.describe.configure({ mode: 'serial' });

  test('interactive mobile walk: select → answer → /results → drawer + filter + nav + feedback', async ({
    answeredVoterPage: page
  }) => {
    const resultsPage = createResultsPage(page);
    const entityFilters = createEntityFilters(page);
    const navMenu = createNavMenu(page);
    const feedbackDialog = createFeedbackDialog(page);

    // --- The walk landed on /results (interactive, fixture-driven). ---
    // `answeredVoterPage` selected elections + constituencies, answered all
    // opinion questions per answerMode='max', and selected an election so the
    // entity list renders. Hard-assert the results list mounted.
    await expect(page.getByTestId(testIds.voter.results.list)).toBeVisible({ timeout: TIMEOUTS.slowPage });

    // --- Entity-details drawer: open a party card's details drawer. ---
    // The drawer is the org/party affordance (EntityCardAction → entity-details
    // container); candidate cards navigate to a detail PAGE instead, so the
    // drawer is exercised via a party card (mirrors voter-journey.spec.ts).
    await resultsPage.selectEntityTab('orgs');
    await expect(resultsPage.getEntityCards().first()).toBeVisible({ timeout: TIMEOUTS.page });
    // openEntityDetailsForCard hard-asserts the `entity-details` drawer visible
    // internally; re-assert it here for an explicit drawer-open signal at mobile.
    await resultsPage.openEntityDetailsForCard(() => 0);
    await expect(page.getByTestId(testIds.voter.results.entityDetails)).toBeVisible({ timeout: TIMEOUTS.page });
    // Close the drawer before continuing — its scrim intercepts page-level
    // pointer events at the narrow mobile viewport.
    await page.keyboard.press('Escape');
    await expect(page.getByTestId(testIds.voter.results.entityDetails)).toBeHidden({ timeout: TIMEOUTS.page });

    // --- Results filter: a text filter narrows the candidate list, then clears. ---
    // The walk lands on whichever election/constituency is first in the accordion,
    // and the candidate roster differs per constituency — so the filter TERM is
    // DERIVED from a real card on this list (seed-/constituency-agnostic) rather
    // than hard-coded. A leading word of the first card guarantees ≥1 match and a
    // subset that the unfiltered list contains.
    await resultsPage.selectEntityTab('cands');
    await expect(resultsPage.getEntityCards().first()).toBeVisible({ timeout: TIMEOUTS.page });
    const fullCount = await resultsPage.getEntityCards().count();
    expect(fullCount).toBeGreaterThan(0);
    const firstName = (await resultsPage.getEntityCards().first().getByRole('heading').first().innerText()).trim();
    // Use the first whitespace-delimited token (drop any `[id]` prefix token) as a
    // stable, present-in-the-list filter term.
    const filterTerm = firstName.split(/\s+/).filter((w) => !w.startsWith('['))[0] ?? firstName;
    expect(filterTerm.length).toBeGreaterThan(0);
    await entityFilters.setTextFilter(filterTerm);
    // The filtered set is a non-empty subset of the unfiltered list (≥1 because
    // the term came from a real card; ≤fullCount because it is a narrowing).
    const filtered = resultsPage.getEntityCards();
    await expect(filtered.first()).toBeVisible({ timeout: TIMEOUTS.page });
    const filteredCount = await filtered.count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(fullCount);
    await entityFilters.clearTextFilter();
    await expect(resultsPage.getEntityCards()).toHaveCount(fullCount, { timeout: TIMEOUTS.page });

    // --- Mobile nav menu: the hamburger opens the drawer; activate Feedback. ---
    // `openMobileNav()` is the canonical hamburger-open step (hydration-race
    // guarded `toPass` inside) — never a bespoke toggle click.
    await navMenu.openMobileNav();
    // The leading item is always the "Close menu" affordance (VoterNav.svelte),
    // proving the drawer is genuinely open with its items resolved.
    await expect(navMenu.items().first()).toHaveAccessibleName(/close menu/i);
    const feedbackNavItem = navMenu.items().filter({ hasText: /feedback/i });
    await expect(feedbackNavItem).toHaveCount(1);

    // --- Feedback dialog reached through the mobile nav drawer: open + submit. ---
    await feedbackNavItem.click();
    await feedbackDialog.expectVisible();
    await feedbackDialog.expectSendDisabled();
    await feedbackDialog.setRating(4);
    await feedbackDialog.expectSendEnabled();
    await feedbackDialog.setComment('mobile journey feedback');
    await feedbackDialog.submit();
    await feedbackDialog.expectSuccess();
  });
});
