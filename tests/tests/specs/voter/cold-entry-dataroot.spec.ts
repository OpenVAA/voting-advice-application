/**
 * Cold / direct-URL entry dataRoot reactivity regression.
 *
 * Root cause (LOCKED): an intermediate `const dataRoot = $derived(ctx.dataRoot)` alias over the identity-stable, `#version`-bridge `DataRoot` yields the SAME object reference on every version bump, so Svelte 5's referential-equality rule SKIPS downstream notification. On cold/direct-URL entry (data provided AFTER mount) the downstream consumer keeps the empty pre-mount snapshot → the elections list / info election region never renders.
 *
 * These tests are the negative control for the codemod: they FAIL against the pre-fix (aliased) source (the data-dependent region never appears → timeout) and PASS once each consumer reads `ctx.dataRoot.<prop>` directly in its tracking scope. NO intro→Continue walk — a bare hard navigation IS the cold entry; the warm intro walk MASKS the bug (data present before the alias first computes).
 *
 * Seed: `data-setup-base` (`e2e/base`) — multi-election. Voter routes are public (no auth). Post-hydration mount hazard: the list mounts a beat after navigation, so use the WAITING assertion `toBeVisible({ timeout })`, never one-shot `isVisible()`.
 *
 * Rigidity contract (project E2E Hard Rule): every assertion is HARD — no expect.soft, no try/catch around expect(), no .catch fallback.
 *
 * ## Phase 159 extension — the two routes plan 07 disturbs
 *
 * Criterion 5 extracts the duplicated `questionCategories` rollup out of `voterContext.svelte.ts` and `candidateContext.svelte.ts` into one shared utility. Both rollups read the data root, so both are candidates for reintroducing the alias-skip above, and neither of the two original cases covers them. Two cases are added, one per rollup consumer.
 *
 * Neither route is reachable by a BARE `page.goto`, and that is a property of the product's route guards rather than a gap in this control — measured, not assumed: `/en/results` and `/en/questions` both 307 to `/elections?next=…` on a cold hit, because the located routes carry their election and constituency selection in the URL and there is nothing to imply from on a multi-election dataset. The candidate app additionally requires a session. So each case reaches its cold entry differently, and each keeps the cold property intact:
 *
 *   - The RESULTS case discovers the located URL by walking once on `page`, then asserts in a BRAND-NEW browser context that shares nothing with that walk but the URL string. The walk is URL discovery, never the observation. The warm-walk masking this file warns about comes from data being present in the SAME document before the alias first computes; a fresh context performing a full document load has no such carry-over.
 *   - The CANDIDATE case is a genuinely bare hard navigation, carrying only a stored session cookie — the cold entry a returning candidate performs when they open a bookmark. It runs under its own Playwright project (`cold-entry-dataroot-candidate`) because it needs `storageState`, mirroring the split the a11y family already makes for exactly this reason. The `@cand-session` tag in its describe title is what routes it there.
 *
 * Rigidity is unchanged for the new cases: waiting `toBeVisible({ timeout })` assertions on `testIds` constants, no `isVisible()`, no soft assertion, no fallback catch.
 */

import { expect, test } from '@playwright/test';
import { walkUntilQuestionsIntro } from '../../fixtures/voter/voter-journey.fixture';
import { TIMEOUTS } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';

test.describe('cold-entry-dataroot', () => {
  test('cold direct-URL entry to /en/elections renders the populated elections list', async ({ page }) => {
    // COLD: bare hard navigation, no Home→Intro→Continue walk.
    await page.goto('/en/elections');

    // The data-dependent list is gated behind `{#if elections.length}` and is EMPTY when `voterCtx.dataRoot.elections` is stale. WAITING assertion covers the post-hydration mount window.
    await expect(page.getByTestId(testIds.voter.elections.list)).toBeVisible({ timeout: TIMEOUTS.slowPage });

    // Stronger signal: at least one selectable election option present.
    await expect(page.getByTestId(testIds.voter.elections.option).first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('cold direct-URL entry to /en/info renders the election-data region', async ({ page }) => {
    // COLD: bare hard navigation.
    await page.goto('/en/info');

    // Assert the `{#each ctx.dataRoot.elections}` region (NOT the static `voter-info-content` {@html} div) — this region is empty when `dataRoot.elections` is stale, so it proves the cold-path populate landed.
    await expect(page.getByTestId(testIds.voter.info.electionList)).toBeVisible({ timeout: TIMEOUTS.slowPage });
  });

  test('cold direct-URL entry to the located /en/results renders the election-data region', async ({
    page,
    browser
  }) => {
    // URL DISCOVERY ONLY, and deliberately on a page nothing is asserted against. The located routes keep their selection in the URL, so the cold target cannot be spelled until the seeded election and constituency ids are known, and the suite knows the seed by external_id rather than by database id.
    await walkUntilQuestionsIntro(page);
    const located = new URL(page.url());
    const coldTarget = new URL(`/en/results${located.search}`, located.origin).toString();

    // COLD: a full document load in a context with no cookies, no local storage and no prior mount — the walk above cannot mask anything here.
    const coldContext = await browser.newContext();
    const coldPage = await coldContext.newPage();
    await coldPage.goto(coldTarget);

    // The election accordion is gated behind a DIRECT `voterCtx.dataRoot.elections.length > 1` read in the results layout, so it is absent for exactly as long as the data root looks empty. WAITING assertion covers the post-hydration mount window.
    await expect(coldPage.getByTestId(testIds.voter.results.electionAccordion)).toBeVisible({
      timeout: TIMEOUTS.slowPage
    });

    // Second, independent data-dependent region on the same page: the ingress renders inside the nominations-gated main content, so it is present only once the located layout has resolved real nomination data.
    await expect(coldPage.getByTestId(testIds.voter.results.ingress)).toBeVisible({ timeout: TIMEOUTS.element });

    await coldContext.close();
  });
});

test.describe('cold-entry-dataroot candidate @cand-session', () => {
  test('cold direct-URL entry to /candidate/questions renders the question overview', async ({ page }) => {
    // COLD: bare hard navigation, carrying only the stored session. No login walk, no in-app navigation.
    await page.goto(buildRoute({ route: 'CandAppQuestions', locale: 'en' }));

    // The overview list is built from `candCtx.opinionQuestionCategories` — the rollup criterion 5 extracts — so it is empty for exactly as long as the candidate context's view of the data root is stale.
    await expect(page.getByTestId(testIds.candidate.questions.list)).toBeVisible({ timeout: TIMEOUTS.slowPage });
  });
});
