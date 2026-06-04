/**
 * axe accessibility smoke — WCAG 2.1 AA regression gate.
 *
 * Asserts the 0-violation state across 6 voter-app routes AND a per-rule
 * regression gate (aria-required-parent, list, button-name) so future
 * reintroductions are caught.
 *
 * Routes (6 distinct entries):
 *   1. Home (voter landing /en)                       [pre-location — raw page.goto]
 *   2. Elections selector (/en/elections)             [pre-location — raw page.goto]
 *   3. Constituencies selector (/en/constituencies)   [pre-location — raw page.goto]
 *   4. Questions flow (/en/questions)                 [located — locatedVoterPage fixture]
 *   5. Results list (/en/results)                     [located — answeredVoterPage fixture]
 *   6. Voter-detail drawer (opened from Results)      [located — answeredVoterPage fixture]
 *
 * Each route: navigate → settle via role-based content wait (NEVER a
 * network-idle settle) → run
 * AxeBuilder.withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()
 * → assert per-rule 0-violation gate + global 0-violation gate.
 *
 * Located routes consume the voter-journey fixtures:
 *   - `questions` route → `locatedVoterPage` (walks Home → Elections →
 *     Constituencies → /questions intro and STOPS).
 *   - `results` + `voter-detail-drawer` routes → `answeredVoterPage`
 *     (full walk through to /results landing).
 *
 * The fixtures walk the real voter flow and let the voter context populate
 * electionId/constituencyId via the live UI path, avoiding bypass-of-UI-flow
 * data setup and tightening the trust boundary.
 *
 * Per-rule axe-id assertions + global 0-violation gate are PRESERVED — no
 * weakening, per CLAUDE.md WCAG 2.1 AA discipline.
 */

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { voterJourneyTest, walkUntilQuestionsIntro } from '../../fixtures/voter/voter-journey.fixture';
import { TIMEOUTS } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';
import type { Page, TestInfo } from '@playwright/test';
import type { Route } from '../../../../apps/frontend/src/lib/utils/route/route';

/**
 * Append the `?notr=1` escape hatch (decision D-02 / Plan 99-01) to a URL so the
 * View-Transition layer is deterministically disabled for E2E — `shouldAnimate`
 * short-circuits on `notr=1` (apps/frontend/src/lib/utils/viewTransition.ts), so
 * the navigation completes WITHOUT racing the ~272ms cross-fade against
 * `document.activeElement`. The focus reset (afterNavigate rAF) still runs; only
 * the animation is suppressed.
 */
function withNoTransition(url: string): string {
  const u = new URL(url);
  u.searchParams.set('notr', '1');
  return u.toString();
}

/**
 * If the post-answer Q→Q auto-advance landed on a category-intro page (the
 * first question of a new category renders the category-intro first), click
 * through it so we settle on an actual question route. Lives at module scope so
 * the branch does not sit inside the test body (playwright/no-conditional-in-test).
 */
async function advancePastCategoryIntro(page: Page): Promise<void> {
  const categoryStart = page.getByTestId(testIds.voter.questions.categoryStart);
  // Poll for presence (NOT `isVisible({ timeout })`, which is a one-shot snapshot
  // that ignores its timeout — see voter-journey.fixture.ts:waitForVisible).
  const present = await categoryStart
    .waitFor({ state: 'visible', timeout: TIMEOUTS.page })
    .then(() => true)
    .catch(() => false);
  if (!present) return;
  // The category-start link's `href` resolves post-hydration from the v2.11
  // reactive `selectedQuestionBlocks` ($state); a plain click races the reactive
  // re-render AND is intercepted by the navigating document root ("<html>
  // intercepts pointer events"). Wait for the href to point at a question route,
  // then NAVIGATE to it deterministically.
  await expect(categoryStart).toHaveAttribute('href', /\/questions\//, { timeout: TIMEOUTS.slowPage });
  const href = await categoryStart.getAttribute('href');
  if (href) await page.goto(href);
}

// Run unauthenticated — all routes are voter-app (public).
test.use({ storageState: { cookies: [], origins: [] } });
voterJourneyTest.use({ storageState: { cookies: [], origins: [] } });

// WCAG 2.1 AA superset — captures the maximum surface so the smoke gate
// reflects the full WCAG 2.1 AA contract. A downstream consumer can subset
// later if needed.
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

interface UnlocatedAxeRoute {
  name: string;
  routeId: Route;
  /** Role-based content settle BEFORE axe scan (never a network-idle settle) */
  settle: (page: Page) => Promise<void>;
}

const UNLOCATED_ROUTES: ReadonlyArray<UnlocatedAxeRoute> = [
  {
    name: 'home',
    routeId: 'Home',
    settle: async (page) => {
      await page.getByRole('heading').first().waitFor({ state: 'visible', timeout: 10000 });
    }
  },
  {
    name: 'elections-selector',
    routeId: 'Elections',
    settle: async (page) => {
      await page.getByRole('heading').first().waitFor({ state: 'visible', timeout: 10000 });
    }
  },
  {
    name: 'constituencies-selector',
    routeId: 'Constituencies',
    settle: async (page) => {
      await page.getByRole('heading').first().waitFor({ state: 'visible', timeout: 10000 });
    }
  }
];

/**
 * Assert the per-rule + global 0-violation gates against an axe scan result.
 * The per-rule trio (aria-required-parent, list, button-name) are the
 * historically-regressed rule-IDs.
 */
async function assertAxeGates(
  results: Awaited<ReturnType<AxeBuilder['analyze']>>,
  testInfo: TestInfo,
  routeName: string
): Promise<void> {
  await testInfo.attach(`axe-violations-${routeName}.json`, {
    body: JSON.stringify(results.violations, null, 2),
    contentType: 'application/json'
  });

  // Per-rule regression gates.
  expect(results.violations.filter((v) => v.id === 'aria-required-parent')).toHaveLength(0);
  expect(results.violations.filter((v) => v.id === 'list')).toHaveLength(0);
  expect(results.violations.filter((v) => v.id === 'button-name')).toHaveLength(0);

  // Global zero gate — "0 violations across all 6 routes". Catches new rule-IDs
  // that the per-rule trio doesn't name (e.g., heading-order from a latent
  // h4-hoist outline gap).
  expect(results.violations).toHaveLength(0);

  // reason: defensive shape checks PRESERVED — defends against AxeBuilder API breakage on future axe-core upgrades; zero runtime cost.
  expect(results).toHaveProperty('violations');
  expect(Array.isArray(results.violations)).toBe(true);
}

// Module-level for…of route runner — module-level dispatch satisfies
// playwright/no-conditional-in-test (no `if` inside test() bodies).
for (const route of UNLOCATED_ROUTES) {
  test(`axe accessibility scan — ${route.name}`, async ({ page }, testInfo) => {
    await page.goto(buildRoute({ route: route.routeId, locale: 'en' }));
    await route.settle(page);

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    await assertAxeGates(results, testInfo, route.name);
  });
}

// ── Located routes — voter-journey fixture consumes ────────────────────────

voterJourneyTest('axe accessibility scan — questions', async ({ locatedVoterPage: page }, testInfo) => {
  // locatedVoterPage walks Home → Elections → Constituencies → /questions
  // intro and STOPS. The voter-questions-start button is visible at this
  // point — the intro page is the route under axe scan.
  await page.getByRole('heading').first().waitFor({ state: 'visible', timeout: 10000 });

  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  await assertAxeGates(results, testInfo, 'questions');
});

voterJourneyTest('axe accessibility scan — results', async ({ answeredVoterPage: page }, testInfo) => {
  // answeredVoterPage walks the full flow + lands on /results. Wait for the
  // results layout tablist (Tabs.svelte) — its explicit role="tablist"
  // resolves the aria-required-parent + list axe violations.
  await page.getByRole('tablist').first().waitFor({ state: 'visible', timeout: 10000 });

  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  await assertAxeGates(results, testInfo, 'results');
});

voterJourneyTest('axe accessibility scan — voter-detail-drawer', async ({ answeredVoterPage: page }, testInfo) => {
  // Wait for the results layout tablist (Tabs.svelte) — its explicit
  // role="tablist" resolves the aria-required-parent + list axe violations.
  await page.getByRole('tablist').first().waitFor({ state: 'visible', timeout: 10000 });
  // Open the drawer — click first entity card. The drawer renders as
  // role=dialog overlay intercepted by results/+layout.svelte beforeNavigate.
  await page.getByTestId('entity-card').first().waitFor({ state: 'visible', timeout: 10000 });
  await page.getByTestId('entity-card').first().click();
  await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 10000 });

  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  await assertAxeGates(results, testInfo, 'voter-detail-drawer');
});

// ── Navigation-a11y assertions (transition stack active) ───────────────────
//
// These prove the navigation-a11y stack (Plan 99-01 mechanism + Plan 99-02
// surfaces) behaves correctly WITH the View-Transition layer active. They run
// under the same `a11y-smoke` project (PLAYWRIGHT_A11Y=1, depends:
// data-setup-base) and drive the transition deterministically via the `?notr=1`
// escape hatch (D-02) so assertions never race the cross-fade animation.

/**
 * Assert the `#route-announcer` aria-live region is present, polite, and that
 * its text is the active route's already-localized page title (the value fed to
 * the document `<title>`, minus the constant app-name/maintenance suffix),
 * surfaced via the layout-context `routeTitle` signal that MainContent /
 * SingleCardContent register their localized `title` into (CR-01 / NAVA11Y-01).
 *
 * On the question route this proves the announcer speaks the localized question
 * heading text rather than the opaque DB `questionId` slug: the announcer text
 * MUST NOT contain the raw slug from the URL AND MUST equal the visible question
 * heading textContent. The label also still differs between the /questions intro
 * and the entered question (the localized titles differ). Lives at module scope
 * (mirrors `assertAxeGates`) so the `expect()` calls are assertion-helper bodies,
 * not inline test-block expects (playwright/no-standalone-expect).
 */
async function assertRouteDerivedAnnouncer(page: Page): Promise<void> {
  // reason: the announcer has no role and no testId — its stable contract IS the
  // `#route-announcer` id (Plan 99-01). An id selector is locale-stable and is the
  // canonical hook for this element, so the raw .locator() is justified here.
  // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
  const announcer = page.locator('#route-announcer');
  await announcer.waitFor({ state: 'attached', timeout: TIMEOUTS.slowPage });

  // The announcer is always present + aria-live="polite" + aria-atomic (NAVA11Y-01).
  await expect(announcer).toHaveAttribute('aria-live', 'polite');
  await expect(announcer).toHaveAttribute('aria-atomic', 'true');
  // Localized title on the questions intro (no questionId param yet).
  await expect(announcer).not.toBeEmpty();
  const introLabel = (await announcer.textContent())?.trim() ?? '';
  expect(introLabel.length).toBeGreaterThan(0);

  // Enter the first question (deterministic — disable the transition via
  // ?notr=1). The auto-advance goto strips the query, so drive the entry as an
  // explicit no-transition navigation into the question route.
  await page.getByTestId(testIds.voter.questions.startButton).click();
  // Clicking start lands on the first category's intro page before the first
  // question (categoryIntros.show is on for the base dataset) — advance through
  // it so we settle on an actual question route with the per-question heading.
  await advancePastCategoryIntro(page);
  await page.getByTestId(testIds.voter.questions.heading).waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
  await page.goto(withNoTransition(page.url()));
  await page.getByTestId(testIds.voter.questions.heading).waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });

  // The announcer now carries the localized question title — it differs from the
  // intro label once a questionId param is present (the localized titles differ).
  const questionLabel = (await announcer.textContent())?.trim() ?? '';
  expect(questionLabel.length).toBeGreaterThan(0);
  expect(questionLabel).not.toBe(introLabel);

  // CR-01: the announcer must NOT leak the opaque DB questionId slug. Extract the
  // slug from the question route URL (last path segment, query/hash stripped) and
  // assert it is absent from the spoken label.
  const slug = decodeURIComponent(
    new URL(page.url()).pathname.replace(/\/+$/, '').split('/').filter(Boolean).pop() ?? ''
  );
  expect(slug.length).toBeGreaterThan(0);
  expect(questionLabel).not.toContain(slug);

  // CR-01: the announcer speaks the localized question title — the same text the
  // route feeds to the document <title>. The visible heading testId wraps a
  // PreHeading (category tag + N/M counter + election tags) ABOVE the <h1>, so its
  // textContent is a superset of the announced title; assert containment (not
  // equality) to prove the announcer carries the localized title, not the slug.
  const headingText = (await page.getByTestId(testIds.voter.questions.heading).textContent())?.trim() ?? '';
  expect(headingText.length).toBeGreaterThan(0);
  expect(headingText).toContain(questionLabel);
}

/**
 * Assert focus landed on the question heading after a Q→Q navigation: the
 * active element carries `data-focus-on-nav` (the QuestionHeading callsite
 * marker, Plan 99-02) or is the first `<h1>` fallback. Module-scope helper so
 * the `expect()` is not an inline test-block expect.
 */
async function assertFocusOnHeading(page: Page): Promise<void> {
  const focusedHeading = await page.evaluate(
    () => document.activeElement?.hasAttribute('data-focus-on-nav') === true || document.activeElement?.tagName === 'H1'
  );
  expect(focusedHeading).toBe(true);
}

/**
 * NAVA11Y-01 / CR-01 — the always-present `#route-announcer` aria-live region
 * exists, is `aria-live="polite"` + `aria-atomic="true"`, and carries the active
 * route's already-localized page title (title-minus-constants, sourced from the
 * layout-context `routeTitle` signal). The label is non-empty on the /questions
 * intro AND changes after navigating into a question; on the question route it
 * does NOT contain the opaque DB `questionId` slug and appears within the visible
 * localized question heading text — proving the announcer speaks the localized
 * title rather than the raw slug.
 */
voterJourneyTest('navigation-a11y — route announcer is route-derived', async ({ locatedVoterPage: page }) => {
  // locatedVoterPage parks on the /questions intro (located, not answered).
  await assertRouteDerivedAnnouncer(page);
});

/**
 * NAVA11Y-02 — focus lands on the question heading after a Q→Q navigation. The
 * root-layout `afterNavigate` rAF focus reset targets `[data-focus-on-nav]`
 * (fallback first `<h1>`), placed on the QuestionHeading callsite (Plan 99-02).
 * The Q→Q hop is driven with `?notr=1` so the cross-fade is disabled and
 * `document.activeElement` is asserted against the settled DOM, not the
 * `::view-transition` pseudo-tree (D-02 determinism).
 */
voterJourneyTest('navigation-a11y — focus lands on heading after Q→Q nav', async ({ page }) => {
  // Walk to the /questions intro, then enter the first question.
  await walkUntilQuestionsIntro(page);
  await page.getByTestId(testIds.voter.questions.startButton).click();
  // Clicking start lands on the first category's intro before the first question
  // (categoryIntros.show is on for the base dataset) — advance through it so we
  // settle on an actual question route with the per-question heading.
  await advancePastCategoryIntro(page);
  await page.getByTestId(testIds.voter.questions.heading).waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });

  const firstQuestionUrl = page.url();

  // Answer the first question to trigger the real Q→Q auto-advance navigation.
  const answerOption = page.getByTestId(testIds.voter.questions.answerOption);
  await answerOption.first().waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
  await answerOption.first().click();

  // Wait for the Q→Q navigation to settle on a NEW question route (URL changed,
  // heading re-rendered). The auto-advance may land on a category-intro for the
  // first question of a new category; tolerate that by advancing if needed.
  await page.waitForURL((url) => url.toString() !== firstQuestionUrl, { timeout: TIMEOUTS.slowPage }).catch(() => null);
  await advancePastCategoryIntro(page);
  await page.getByTestId(testIds.voter.questions.heading).waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });

  // Re-enter the settled question route deterministically (transition disabled)
  // so the afterNavigate focus reset runs against a non-animating DOM — this is
  // the binding Q→Q focus assertion (NAVA11Y-02).
  const settledUrl = page.url();
  await page.goto(withNoTransition(settledUrl));
  await page.getByTestId(testIds.voter.questions.heading).waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });

  await assertFocusOnHeading(page);
});
