/**
 * voter-alliance (EFLOW-02 + EPERM-03/EPERM-04 riders) — alliance results
 * surface DEPTH on the base dataset.
 *
 * Read-only LEAF spec on `data-setup-base` (`e2e/base`). Voter routes are
 * public (no auth, no own setup/teardown). It consumes the shared, viewport-
 * agnostic 'max' voter walk owned by `voter-journey.fixture.ts`
 * (`answeredVoterPage`: Home → Intro → election-select → constituency-select →
 * answer all opinion questions → /results, landing in the Regional election /
 * CO-Reg-N scope where Alliance A is nominated). The walk is shared config —
 * this leaf does NOT re-implement it (Phase 121 Don't-Hand-Roll). Because
 * `views.ts`'s `test` does not expose `answeredVoterPage`, this spec imports
 * `voterJourneyTest as test` and composes the results/entity-details fixtures
 * via their `create*` factories (mirrors `voter-journey-mobile.spec.ts`).
 *
 * ## Scope — DEPTH the voter-journey D-10 step lacks (not a verbatim re-run)
 *
 * The `voter-journey.spec.ts` D-10 step already asserts alliance PRESENCE
 * (section + card + gauge + a member subcard visible). This spec deepens that:
 *   - EPERM-03 presence rider made SELF-CONTAINED here (tab set + section),
 *   - both member-org subcards ([or-aa] Party AA, [or-ab] Party AB) asserted
 *     by name (not `nth(1)` visibility),
 *   - the clickable in-card children proven by opening THAT member org's own
 *     entity-detail drawer (drawer-identity assertion, D-03),
 *   - the EPERM-04 alliance tab-control rider (EXACTLY ['info','children'], no
 *     opinions tab) and the EFLOW-02 member-orgs drawer (both members listed).
 *
 * Seed is ASSERT-ONLY (D-04): no dev-seed or product files are modified. The
 * alliance names, member orgs, `results.sections` (['candidate','organization',
 * 'alliance']) and `entityDetails.contents.alliance` (['info','children']) are
 * the frozen `e2e/base` wiring verified at the 129 close.
 *
 * ## Rigidity contract (project E2E Hard Rule)
 *
 * Every assertion is HARD — no `expect.soft`, no try/catch around `expect()`,
 * no `.catch` fallback, no skip/flaky annotation, no retry-until-green. A
 * failing OR did-not-run test blocks completion.
 */

import { expect } from '@playwright/test';
import { createEntityDetails } from '../../fixtures/voter/entityDetails.fixture';
import { createResultsPage } from '../../fixtures/voter/resultsPage.fixture';
import { voterJourneyTest as test } from '../../fixtures/voter/voter-journey.fixture';
import { TIMEOUTS } from '../../helpers';
import { testIds } from '../../utils/testIds';

test.describe('voter-alliance (EFLOW-02 + EPERM-03/04 riders)', () => {
  test.describe.configure({ mode: 'serial' });

  test('alliance section + card + clickable member children + member-orgs drawer + tab control', async ({
    answeredVoterPage: page
  }) => {
    const resultsPage = createResultsPage(page);
    const entityDetails = createEntityDetails(page);

    // The walk landed on /results in the Regional / CO-Reg-N scope. Anchor on
    // the results list before touching the alliance tab.
    await expect(page.getByTestId(testIds.voter.results.list)).toBeVisible({ timeout: TIMEOUTS.slowPage });

    await test.step('EPERM-03 rider: alliance section present in results.sections[]', async () => {
      // Self-contained presence criterion (D-03): the alliances entity tab
      // exists alongside candidates + organizations, and selecting it renders
      // the alliance section. `results.sections = ['candidate','organization',
      // 'alliance']` in e2e/base — assert the exact tab set + order.
      await resultsPage.expectEntityTabs(['cands', 'orgs', 'alliances']);
      await resultsPage.selectEntityTab('alliances');
      await expect(page.getByTestId(testIds.voter.results.allianceSection)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    });

    await test.step('Alliance A card renders with a match-score gauge + both member-org subcards', async () => {
      const allianceA = resultsPage.getEntityCards().filter({ hasText: /Alliance A/i }).first();
      await expect(allianceA).toBeVisible({ timeout: TIMEOUTS.slowPage });

      // Card-level MatchScore gauge (org→alliance imputation output).
      await expect(allianceA.getByTestId(testIds.voter.results.matchScore).first()).toBeVisible({
        timeout: TIMEOUTS.element
      });

      // Both member-org subcards asserted BY NAME (deeper than D-10's nth(1)
      // visibility): OR-AA Party AA + OR-AB Party AB are the alliance members.
      const subcards = allianceA.getByTestId(testIds.voter.results.cardSubcard);
      await expect(subcards.filter({ hasText: /Party AA/i })).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(subcards.filter({ hasText: /Party AB/i })).toBeVisible({ timeout: TIMEOUTS.slowPage });
    });

    await test.step('member subcard click-through opens the member org’s OWN drawer (clickable in-card children)', async () => {
      // Clicking a member subcard navigates to THAT org's entity-detail drawer
      // (the whole subcard is wrapped by the member org's EntityCardAction <a>
      // — EntityCard.svelte:220). Assert the opened drawer is the ORG's, not
      // the alliance's (drawer-identity assertion, D-03).
      const allianceA = resultsPage.getEntityCards().filter({ hasText: /Alliance A/i }).first();
      const partyAASubcard = allianceA
        .getByTestId(testIds.voter.results.cardSubcard)
        .filter({ hasText: /Party AA/i });
      await partyAASubcard.click();

      const drawer = page.getByTestId(testIds.voter.results.entityDetails);
      await expect(drawer).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(drawer.getByRole('heading', { name: /Party AA/i }).first()).toBeVisible({
        timeout: TIMEOUTS.page
      });
      // It is the member ORG's drawer, NOT the alliance's.
      await expect(drawer.getByRole('heading', { name: /Alliance A/i })).toHaveCount(0);

      // Close the org drawer to leave clean state for the alliance-drawer steps.
      await page.keyboard.press('Escape');
      await expect(drawer).toBeHidden({ timeout: TIMEOUTS.page });
    });

    await test.step('EPERM-04 rider: alliance drawer exposes EXACTLY [info, children] — no opinions tab', async () => {
      // Re-anchor on the alliances section (the org drawer was an overlay; the
      // tab state persists, but assert explicitly so the card lookup below is
      // deterministic after the drawer close).
      await resultsPage.selectEntityTab('alliances');

      // Open the ALLIANCE's own drawer (the parent card's primary action —
      // openEntityDetailsForCard clicks the FIRST entity-card-action, which for
      // a subcard-bearing card is the alliance header wrap, not a member).
      await resultsPage.openEntityDetailsForCard(/Alliance A/i);

      // seed entityDetails.contents.alliance = ['info','children'] → EXACTLY the
      // Basic Info + Members tabs, in order, and NO opinions tab (the per-type
      // tab-control contract made unmistakable — mirrors the journey's
      // absent-tab precedent).
      await entityDetails.expectTabs(['info', 'children']);
      const drawer = page.getByTestId(testIds.voter.results.entityDetails);
      await expect(drawer.getByRole('tab', { name: /Opinions/i })).toHaveCount(0);
    });

    await test.step('EFLOW-02: member-orgs drawer lists both member orgs', async () => {
      await entityDetails.selectTab('children');
      const members = entityDetails.getMemberCards();
      await expect(members).toHaveCount(2, { timeout: TIMEOUTS.slowPage });
      await expect(members.filter({ hasText: /Party AA/i })).toHaveCount(1);
      await expect(members.filter({ hasText: /Party AB/i })).toHaveCount(1);
    });
  });
});
