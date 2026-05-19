/**
 * Voter browse-without-match E2E tests (Phase 74 E2E-02).
 *
 * Covers the browse-without-match contract:
 *   - Voter who completes location selection but skips opinion questions
 *     must still be able to reach `/results` and browse the entity list.
 *   - No match-score percentages are rendered (no opinions answered →
 *     match.score undefined → SubMatches / score-gauges do not render).
 *   - The results-page ingress copy switches to the "browse" form
 *     (`dynamic.results.ingress.browse`) when `voterCtx.resultsAvailable`
 *     is false (i.e. answered count < `matching.minimumAnswers`).
 *
 * Variant: this spec runs under the `variant-low-minimum-answers` Playwright
 * project, which loads the `variant-low-minimum-answers` dataset overlay
 * (`matching.minimumAnswers: 1`). Even with the threshold lowered to 1, the
 * voter NEVER answers an opinion question in this spec, so `resultsAvailable`
 * remains false and the browse-mode ingress copy renders.
 *
 * Fixture choice: uses `voterTest`'s base `page` (NOT `answeredVoterPage`)
 * because the contract requires the voter to NOT have answered anything.
 */

import { expect } from '@playwright/test';
import { voterTest as test } from '../../fixtures/voter.fixture';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';
import { navigateToFirstQuestion } from '../../utils/voterNavigation';

test.describe('voter browse without match (E2E-02)', { tag: ['@voter', '@variant'] }, () => {
  test('voter completes location, skips opinions, browses entity list without match scores', async ({ page }) => {
    // Step 1: Home → Intro → (auto-imply elections + constituencies) →
    // first question. The base e2e seed has 1 election + 1 constituency, but
    // the journey still surfaces /elections + /constituencies pages with an
    // auto-Continue. The shared `navigateToFirstQuestion` helper drives the
    // full chain and waits for the URL to settle on /questions/<id>, after
    // which electionId + constituencyId are persistent search params on the
    // URL.
    await navigateToFirstQuestion(page);

    // Step 2: skip opinion questions entirely. Navigate directly to /results
    // carrying the now-settled electionId + constituencyId search params.
    // The voter never clicks a Likert option → answerStore stays empty →
    // voterCtx.resultsAvailable === false → browse-mode ingress renders.
    const currentUrl = new URL(page.url());
    await page.goto(`${buildRoute({ route: 'Results', locale: 'en' })}${currentUrl.search}`);

    // Wait for the results list to attach. expect.poll provides settle
    // headroom for the layout loader + SSR hydration on cold navigation
    // (canonical pattern per v2.6 P64 voter-results.spec.ts).
    const list = page.getByTestId(testIds.voter.results.list);
    await expect.poll(() => list.count(), {
      timeout: 15000,
      message: 'results list must render under browse-without-match path (E2E-02)'
    }).toBeGreaterThan(0);
    await expect(list.first()).toBeVisible();

    // Assertion 1 — entity cards still render (browse path open).
    const firstCard = page.getByTestId(testIds.voter.results.card).first();
    await expect.poll(() => page.getByTestId(testIds.voter.results.card).count(), {
      timeout: 10000,
      message: 'at least one entity card must render under browse-without-match path (E2E-02)'
    }).toBeGreaterThan(0);
    await expect(firstCard).toBeVisible();

    // Assertion 2 — no match-score percentages visible. With zero opinion
    // answers, `match.score` is undefined → SubMatches / ScoreGauge do not
    // render. Asserting the list element contains no `%` text is the
    // canonical proxy (RESEARCH §"E2E-02" + EntityCard.svelte submatches
    // gating). The base e2e overlay disables alliance/faction sections,
    // so the candidate list is the only score-renderer surface.
    await expect(list.first().getByText(/%/)).toHaveCount(0);

    // Assertion 3 — ingress block renders in the "browse" form. The
    // testid `voter-results-ingress` is rendered unconditionally by
    // `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte:321`;
    // its inner copy switches via the `voterCtx.resultsAvailable` ternary
    // at line 322. With 0 opinion answers and `matching.minimumAnswers: 1`,
    // `resultsAvailable` evaluates to `false` and the `{:else}` branch
    // renders `dynamic.results.ingress.browse`.
    //
    // The browse and results translations differ in their second sentence:
    //   browse  → "...ordered by election symbol or name. You can use the
    //              filters to narrow them down."
    //   results → "...The best matches are first on the list. To narrow
    //              down the results, you can also use the filters."
    //
    // We assert the browse-specific phrase ("ordered by election symbol or
    // name") and verify the results-specific phrase ("best matches are
    // first") is absent. The two assertions together pin the conditional
    // to the browse branch and survive minor copy edits to either string
    // independently. EN copy is fixed by this variant; other locales would
    // need their own variant project if Plan 07 extends the matrix.
    const ingress = page.getByTestId(testIds.voter.results.ingress);
    await expect(ingress).toBeVisible();
    await expect(ingress).toContainText(/ordered by election symbol or name/i);
    await expect(ingress.getByText(/best matches are first/i)).toHaveCount(0);
  });
});
