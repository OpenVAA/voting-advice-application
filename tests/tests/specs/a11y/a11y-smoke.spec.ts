/**
 * axe accessibility smoke — the VOTER half of the two-file WCAG 2.1 AA gate.
 *
 * Asserts the 0-violation state across 7 voter-app routes (14 surfaces, both themes) AND a per-rule regression gate (aria-required-parent, list, button-name) so future reintroductions are caught.
 *
 * ## This file is one half of a family
 *
 * The candidate `(protected)` routes are scanned by the sibling `candidate-a11y.spec.ts` in this same directory — 7 more routes, 14 more surfaces, under its own `candidate-a11y-scan` project because those routes need a stored candidate session. **Neither file declares a gate.** The tag set, both gate assertions, the animation settle, the dark-theme guard, the route-entry types and the one shared scan body all live in `tests/tests/utils/axeScan.ts`, which both files import. So the two halves can differ in their ROUTE TABLES and in nothing else, and the strictness parity between the two halves is checkable by reading an import list rather than by comparing two tables. The candidate spec's own docblock carries the parity table: what is identical by construction, every divergence with its reason, and the known gaps.
 *
 * ## The route contract
 *
 * EVERY scan is declared as an entry in the single `AXE_ROUTES` table — there are no hand-written scan bodies outside it. Each entry MUST declare a `contentTestId`: the data-driven testid proving the route's real content is in the DOM. The field is REQUIRED, so a new scan route cannot be added without stating what "loaded" means for it.
 *
 * This exists because a role-based settle is not a content settle. The previous `getByRole('heading')` settle resolved on a static i18n title that renders BEFORE any data-driven content mounts, so scans could — and did — pass against a DOM that did not contain the thing being checked. It also could not detect a `+page.ts` `redirect(307, …)`: the `constituencies-selector` entry had never once scanned a constituency selector, silently re-scanning /elections instead.
 *
 * Entries are discriminated on `fixture`, which decides what supplies the page:
 *   - `raw`      — the runner navigates itself (`routeId` required), from a clean unauthenticated page.
 *   - `located`  — `locatedVoterPage` fixture (walks Home → Elections →
 *                  Constituencies → /questions intro, then STOPS).
 *   - `answered` — `answeredVoterPage` fixture (full walk to /results landing).
 * The fixtures walk the real voter flow and let the voter context populate electionId/constituencyId via the live UI path, avoiding bypass-of-UI-flow data setup and tightening the trust boundary.
 *
 * Routes (7 distinct entries, all voter-app — note Paraglide's `url` locale strategy means there is NO locale route segment; the paths really are `/`, `/elections`, …):
 *   1. home                             (/)              [raw]
 *   2. elections-selector               (/elections)     [raw]
 *   3. constituencies-selector-located  (/constituencies)[raw + settle: walks the elections Continue gate, because /constituencies 307-redirects a goto that carries no electionId]
 *   4. questions                        (/questions)     [located]
 *   5. results                          (/results)       [answered]
 *   6. voter-detail-drawer  (opened from Results)        [answered + settle]
 *   7. results-filter-drawer (filter dialog on Results)  [answered + settle: opens the dialog through the entityFilters fixture and expands EVERY filter row, because the filter bodies are lazily imported]
 *
 * Each scan: (navigate) → optional reach-the-target `settle` → REQUIRED `contentTestId` wait (the LAST gate; NEVER a network-idle settle) → `awaitAnimationsSettled` → COLLECT the raw-i18n-key verdict (`collectRawI18nKeyFindings`, F2) → run AxeBuilder.withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze() → report BOTH verdicts: the raw-key one softly, then the per-rule 0-violation gate + global 0-violation gate.
 *
 * The raw-key step COLLECTS rather than throws, by design — neither verdict short-circuits the other, so a surface carrying BOTH defects reports both instead of only the first. It is read before axe deliberately: an untranslated catalog changes the accessible names axe is about to read. (`assertNoRawI18nKeys`, the throwing wrapper, still exists for callers outside this pipeline; it is NOT what runs here.)
 *
 * EVERY entry is scanned in BOTH themes — each emits a light scan and a `-dark` twin, so there is no theme-shaped hole in the gate. Raw twins emulate dark before their `goto`; fixture-driven twins take a dark browser context so the fixture walks the whole journey in dark (see `assertDarkThemeApplied` for why flipping the theme after the walk is not equivalent).
 *
 * Per-rule axe-id assertions + global 0-violation gate are PRESERVED — no weakening, per CLAUDE.md WCAG 2.1 AA discipline.
 */

import { expect, test } from '@playwright/test';
import { createEntityFilters } from '../../fixtures/voter/entityFilters.fixture';
import { voterJourneyTest, walkUntilQuestionsIntro } from '../../fixtures/voter/voter-journey.fixture';
import { TIMEOUTS } from '../../helpers';
import { assertAxeScan, assertDarkThemeApplied, withNoTransition } from '../../utils/axeScan';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';
import type { AxeRoute, FixtureAxeRoute, RawAxeRoute } from '../../utils/axeScan';

/**
 * If the post-answer Q→Q auto-advance landed on a category-intro page (the first question of a new category renders the category-intro first), click through it so we settle on an actual question route. Lives at module scope so the branch does not sit inside the test body (playwright/no-conditional-in-test).
 */
async function advancePastCategoryIntro(page: Page): Promise<void> {
  const categoryStart = page.getByTestId(testIds.voter.questions.categoryStart);
  // Poll for presence (NOT `isVisible({ timeout })`, which is a one-shot snapshot that ignores its timeout — see voter-journey.fixture.ts:waitForVisible).
  const present = await categoryStart
    .waitFor({ state: 'visible', timeout: TIMEOUTS.page })
    .then(() => true)
    .catch(() => false);
  if (!present) return;
  // The category-start link's `href` resolves post-hydration from the reactive `selectedQuestionBlocks` ($state); a plain click races the reactive re-render AND is intercepted by the navigating document root ("<html> intercepts pointer events"). Wait for the href to point at a question route, then NAVIGATE to it deterministically.
  await expect(categoryStart).toHaveAttribute('href', /\/questions\//, { timeout: TIMEOUTS.slowPage });
  const href = await categoryStart.getAttribute('href');
  if (href) await page.goto(href);
}

// Run unauthenticated — all routes IN THIS FILE are voter-app (public).
//
// The property is file-scoped, NOT project-scoped and NOT family-scoped: the sibling `candidate-a11y.spec.ts` runs the candidate `(protected)` routes WITH a stored candidate session, under its own project. Do not read this line as "the a11y scans are unauthenticated" — half of them are not, and that is the point of the split.
test.use({ storageState: { cookies: [], origins: [] } });
voterJourneyTest.use({ storageState: { cookies: [], origins: [] } });

const AXE_ROUTES: ReadonlyArray<AxeRoute> = [
  {
    name: 'home',
    fixture: 'raw',
    routeId: 'Home',
    contentTestId: testIds.voter.home.page
  },
  {
    name: 'elections-selector',
    fixture: 'raw',
    routeId: 'Elections',
    contentTestId: testIds.voter.elections.label
  },
  {
    // The entry declares `routeId: 'Elections'`, NOT 'Constituencies', because `(voters)/constituencies/+page.ts` `redirect(307, 'Elections')`s any goto that carries no `electionId` — a bare `/constituencies` goto has never reached a constituency selector. So the walk goes through the elections gate: both elections are pre-checked in the `e2e/base` dataset, so Continue is enabled immediately and needs no option click.
    name: 'constituencies-selector-located',
    fixture: 'raw',
    routeId: 'Elections',
    contentTestId: testIds.voter.constituencies.list,
    settle: async (page) => {
      await page
        .getByTestId(testIds.voter.elections.label)
        .first()
        .waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
      await page.getByTestId(testIds.voter.elections.continue).click();
      await page.waitForURL(/\/constituencies/, { timeout: TIMEOUTS.slowPage });
    }
  },
  {
    // `locatedVoterPage` walks Home → Elections → Constituencies → the /questions intro and STOPS there, so the start button IS the intro page's data-driven content and no extra settle is needed.
    name: 'questions',
    fixture: 'located',
    contentTestId: testIds.voter.questions.startButton
  },
  {
    // Strictly tighter than the previous `getByRole('tablist')` settle: the tablist is layout chrome that renders before any nomination data, while an entity card only exists once the matched entities have rendered.
    name: 'results',
    fixture: 'answered',
    contentTestId: testIds.voter.results.card
  },
  {
    // The drawer content flies in via Svelte `transition:fly` (Drawer.svelte:82), which animates opacity 0->1. axe composites text colour through any in-flight ancestor opacity, so scanning mid-fly produced phantom `color-contrast` failures — e.g. `text-secondary` #666666 rendered ~#969696 (2.95:1) and `primary` #2546a8 rendered ~#6a80c3 (3.82:1), both exactly the token at ~0.69 opacity. At FULL opacity the tokens pass (≈5.7:1 / ≈8.6:1 on white), so this is a scan-timing fix, NOT a theme change. The shared `awaitAnimationsSettled` gate settles the WHOLE document (drawer fly + any page-level entrance fade) and is safe here specifically because it excludes INFINITE animations — the looping match bar on this surface would otherwise never resolve, which is why this route once needed a dialog-subtree-only settle.
    name: 'voter-detail-drawer',
    fixture: 'answered',
    contentTestId: testIds.voter.results.entityDetails,
    settle: async (page) => {
      // Open the drawer — click first entity card. The drawer renders as role=dialog overlay intercepted by results/+layout.svelte beforeNavigate.
      await page
        .getByTestId(testIds.voter.results.card)
        .first()
        .waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
      await page.getByTestId(testIds.voter.results.card).first().click();
      await page.getByRole('dialog').waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
    }
  },
  {
    // The results filter drawer — `NumericEntityFilter` / `EnumeratedEntityFilter` and the Expander rows that hold them. Before this entry these surfaces were scanned by NOTHING, which is what let the defect class sit on exactly the components a prior audit named.
    //
    // The content anchor is the numeric filter's range input, NOT the dialog root and NOT a filter row. Filter bodies are lazily imported (`{#await import('./numeric')}` in EntityFilters.svelte), so a dialog-root or row anchor resolves while the bodies are still unmounted and the scan would cover an empty drawer. The `e2e/base` dataset renders exactly one numeric filter (the years-of-experience info question carries `filterable: true`), so this anchor is the strictest data-driven proof the drawer's real content is present.
    //
    // Scanned in BOTH themes, like every other entry. This drawer had been measured at 0 violations in light and dark; the `-dark` twin now holds that in CI rather than leaving it as an untested claim — and it confirms it, with the drawer opened and every filter row expanded in a dark context.
    name: 'results-filter-drawer',
    fixture: 'answered',
    contentTestId: testIds.voter.results.filterNumericMin,
    settle: async (page) => {
      await page
        .getByTestId(testIds.voter.results.card)
        .first()
        .waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
      // Go through the fixture, never a hand-rolled click: the fixture's dialog opener owns the two-conditional-render `.first()` invariant on the filter button AND the fallback from the unreliable `entity-filter-dialog` testid to `getByRole('dialog', { name: /Filters/i })`.
      const dialog = await createEntityFilters(page).openFilterDialog();
      // Expand EVERY row: EntityFilters defaults `defaultExpanded` to false for non-active/non-text filters, so an unexpanded drawer hides most of the markup this scan exists to check. `getFilter()` auto-expands through the Expander's internal `role=checkbox, name=/expand or collapse/i` toggle — never click an Expander header directly. The loop is bounded by a count read ONCE up front, and each expand is bounded by the fixture's own toggle-visibility assertion, so there is no unbounded polling here and no fixed-duration sleep anywhere in this file.
      const rowCount = await dialog.getFilters().count();
      for (let index = 0; index < rowCount; index++) {
        await dialog.getFilter(() => index);
      }
    }
  }
];

// Module-level for…of route runners, filtered by the `fixture` discriminant — module-level dispatch satisfies playwright/no-conditional-in-test (no `if` inside test() bodies), and the type predicates narrow the union so each loop sees only the fields its variant actually carries.
//
// THEME COVERAGE — complete. Every entry, raw and fixture-driven alike, emits a light scan and a `-dark` twin, so a dark-only contrast regression on ANY scanned surface fails the gate. The two runner families reach dark differently, and the difference is load-bearing rather than stylistic: raw twins emulate dark before their own `goto`, while fixture-driven twins take a dark browser CONTEXT so the fixture walks the journey in dark from the first paint. Flipping the theme onto an already-walked light page is NOT equivalent — it strands the persistent layout chrome in light. See `assertDarkThemeApplied` for the measurement and the guard that pins it.

const RAW_ROUTES = AXE_ROUTES.filter((route): route is RawAxeRoute => route.fixture === 'raw');
const LOCATED_ROUTES = AXE_ROUTES.filter((route): route is FixtureAxeRoute => route.fixture === 'located');
const ANSWERED_ROUTES = AXE_ROUTES.filter((route): route is FixtureAxeRoute => route.fixture === 'answered');

for (const route of RAW_ROUTES) {
  test(`axe accessibility scan — ${route.name}`, async ({ page }, testInfo) => {
    await page.goto(buildRoute({ route: route.routeId, locale: 'en' }));
    await assertAxeScan(page, route, testInfo, route.name);
  });

  // dark-mode colour-contrast (WCAG 2.1 AA gated in both themes).
  // Re-run the SAME axe scan under emulated `prefers-color-scheme: dark` — there is no toggle/storage; the OS-media emulation IS the dark-theme source (`darkMode.svelte.ts` reads matchMedia only). The dark token palette must clear contrast just like light, so the global 0-violation gate (via assertAxeGates, `-dark` label) catches any dark-only contrast regression.
  test(`axe accessibility scan — ${route.name} (dark)`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(buildRoute({ route: route.routeId, locale: 'en' }));
    await assertAxeScan(page, route, testInfo, `${route.name}-dark`);
  });
}

// ── Located routes — voter-journey fixture supplies the page ───────────────
//
// The fixtures walk the real voter flow and let the voter context populate electionId/constituencyId via the live UI path, avoiding bypass-of-UI-flow data setup and tightening the trust boundary. No `page.goto` here: navigating would discard the located/answered state the fixture exists to establish.

for (const route of LOCATED_ROUTES) {
  // `locatedVoterPage` walks Home → Elections → Constituencies → the /questions intro and STOPS (it does NOT answer questions or proceed to /results). The fixture-name-aliasing idiom `{ locatedVoterPage: page }` lets the body read as if it had a plain `page`.
  voterJourneyTest(`axe accessibility scan — ${route.name}`, async ({ locatedVoterPage: page }, testInfo) => {
    await assertAxeScan(page, route, testInfo, route.name);
  });

  // Dark twin. Unlike the raw runner there is no `goto` to precede, so there is nothing to emulate dark *before* — and flipping the theme after the fixture has walked leaves the persistent layout chrome painting light tokens (measured: 30 stale elements — see assertDarkThemeApplied). So the context is born dark via `use` instead, and the fixture walks the ENTIRE journey in dark. The anonymous describe scopes that option to this one test without adding a title segment.
  voterJourneyTest.describe(() => {
    voterJourneyTest.use({ colorScheme: 'dark' });

    voterJourneyTest(`axe accessibility scan — ${route.name} (dark)`, async ({ locatedVoterPage: page }, testInfo) => {
      await assertDarkThemeApplied(page);
      await assertAxeScan(page, route, testInfo, `${route.name}-dark`);
    });
  });
}

for (const route of ANSWERED_ROUTES) {
  // `answeredVoterPage` walks the full flow through to the /results landing.
  voterJourneyTest(`axe accessibility scan — ${route.name}`, async ({ answeredVoterPage: page }, testInfo) => {
    await assertAxeScan(page, route, testInfo, route.name);
  });

  // Dark twin — same born-dark shape as the located loop above. Because the context is dark from creation, the route's `settle` (drawer open, filter-row expansion) also runs against a dark DOM, so the scanned overlay is dark rather than a light-rendered panel over a dark page.
  voterJourneyTest.describe(() => {
    voterJourneyTest.use({ colorScheme: 'dark' });

    voterJourneyTest(`axe accessibility scan — ${route.name} (dark)`, async ({ answeredVoterPage: page }, testInfo) => {
      await assertDarkThemeApplied(page);
      await assertAxeScan(page, route, testInfo, `${route.name}-dark`);
    });
  });
}

// ── Navigation-a11y assertions (transition stack active) ───────────────────
//
// These prove the navigation-a11y stack (mechanism surfaces) behaves correctly WITH the View-Transition layer active. They run under the same `a11y-smoke` project (PLAYWRIGHT_A11Y=1, depends: data-setup-base) and drive the transition deterministically via the `?notr=1` escape hatch so assertions never race the cross-fade animation.

/**
 * Assert the `#route-announcer` aria-live region is present, polite, and that its text is the active route's already-localized page title (the value fed to the document `<title>`, minus the constant app-name/maintenance suffix), surfaced via the layout-context `routeTitle` signal that MainContent / SingleCardContent register their localized `title` into (CR-01 / NAVA11Y-01).
 *
 * On the question route this proves the announcer speaks the localized question heading text rather than the opaque DB `questionId` slug: the announcer text MUST NOT contain the raw slug from the URL AND MUST equal the visible question heading textContent. The label also still differs between the /questions intro and the entered question (the localized titles differ). Lives at module scope (mirrors `assertAxeGates`) so the `expect()` calls are assertion-helper bodies, not inline test-block expects (playwright/no-standalone-expect).
 */
async function assertRouteDerivedAnnouncer(page: Page): Promise<void> {
  // reason: the announcer has no role and no testId — its stable contract IS the `#route-announcer` id. An id selector is locale-stable and is the canonical hook for this element, so the raw .locator() is justified here.
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

  // Enter the first question (deterministic — disable the transition via ?notr=1). The auto-advance goto strips the query, so drive the entry as an explicit no-transition navigation into the question route.
  await page.getByTestId(testIds.voter.questions.startButton).click();
  // Clicking start lands on the first category's intro page before the first question (categoryIntros.show is on for the base dataset) — advance through it so we settle on an actual question route with the per-question heading.
  await advancePastCategoryIntro(page);
  await page.getByTestId(testIds.voter.questions.heading).waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
  await page.goto(withNoTransition(page.url()));
  await page.getByTestId(testIds.voter.questions.heading).waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });

  // The announcer now carries the localized question title — it differs from the intro label once a questionId param is present (the localized titles differ).
  const questionLabel = (await announcer.textContent())?.trim() ?? '';
  expect(questionLabel.length).toBeGreaterThan(0);
  expect(questionLabel).not.toBe(introLabel);

  // CR-01: the announcer must NOT leak the opaque DB questionId slug. Extract the slug from the question route URL (last path segment, query/hash stripped) and assert it is absent from the spoken label.
  const slug = decodeURIComponent(
    new URL(page.url()).pathname.replace(/\/+$/, '').split('/').filter(Boolean).pop() ?? ''
  );
  expect(slug.length).toBeGreaterThan(0);
  expect(questionLabel).not.toContain(slug);

  // CR-01: the announcer speaks the localized question title — the same text the route feeds to the document <title>. The visible heading testId wraps a PreHeading (category tag + N/M counter + election tags) ABOVE the <h1>, so its textContent is a superset of the announced title; assert containment (not equality) to prove the announcer carries the localized title, not the slug.
  const headingText = (await page.getByTestId(testIds.voter.questions.heading).textContent())?.trim() ?? '';
  expect(headingText.length).toBeGreaterThan(0);
  expect(headingText).toContain(questionLabel);
}

/**
 * Assert focus landed on the question heading after a Q→Q navigation: the active element carries `data-focus-on-nav` (the QuestionHeading callsite marker) or is the first `<h1>` fallback. Module-scope helper so the `expect()` is not an inline test-block expect.
 */
async function assertFocusOnHeading(page: Page): Promise<void> {
  // Poll via expect.poll so the assertion is web-first rather than a one-shot snapshot. The root layout applies the focus reset inside a `requestAnimationFrame` callback scheduled from `afterNavigate`, so "the heading is visible" and "focus has been moved onto it" are two distinct events with no ordering guarantee — on a loaded machine the rAF callback lands after a single `page.evaluate` and the sample reads the pre-focus `document.activeElement`. Polling asserts the settled state; a heading that never receives focus still fails here, on timeout, so this does not mask the defect the assertion exists to catch.
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            document.activeElement?.hasAttribute('data-focus-on-nav') === true ||
            document.activeElement?.tagName === 'H1'
        ),
      { timeout: TIMEOUTS.slowPage }
    )
    .toBe(true);

  // The poll alone accepts a TRANSIENT focus: it stops at the first true sample, so a heading that receives focus and then loses it again to a later rAF or an autofocusing child would still pass. Settled focus is the property under test - a screen-reader user who is moved onto the heading and then silently moved off is not served. Re-read once, immediately, with no polling: this can only fail if focus left the heading after the poll observed it there, which is the defect the poll cannot see.
  const focusStillOnHeading = await page.evaluate(
    () => document.activeElement?.hasAttribute('data-focus-on-nav') === true || document.activeElement?.tagName === 'H1'
  );
  expect(focusStillOnHeading, 'focus settled on the heading rather than passing through it').toBe(true);
}

/**
 * NAVA11Y-01 / CR-01 — the always-present `#route-announcer` aria-live region exists, is `aria-live="polite"` + `aria-atomic="true"`, and carries the active route's already-localized page title (title-minus-constants, sourced from the layout-context `routeTitle` signal). The label is non-empty on the /questions intro AND changes after navigating into a question; on the question route it does NOT contain the opaque DB `questionId` slug and appears within the visible localized question heading text — proving the announcer speaks the localized title rather than the raw slug.
 */
voterJourneyTest('navigation-a11y — route announcer is route-derived', async ({ locatedVoterPage: page }) => {
  // locatedVoterPage parks on the /questions intro (located, not answered).
  await assertRouteDerivedAnnouncer(page);
});

/**
 * NAVA11Y-02 — focus lands on the question heading after a Q→Q navigation. The root-layout `afterNavigate` rAF focus reset targets `[data-focus-on-nav]` (fallback first `<h1>`), placed on the QuestionHeading callsite.
 * The Q→Q hop is driven with `?notr=1` so the cross-fade is disabled and `document.activeElement` is asserted against the settled DOM, not the `::view-transition` pseudo-tree (determinism).
 */
voterJourneyTest('navigation-a11y — focus lands on heading after Q→Q nav', async ({ page }) => {
  // Walk to the /questions intro, then enter the first question.
  await walkUntilQuestionsIntro(page);
  await page.getByTestId(testIds.voter.questions.startButton).click();
  // Clicking start lands on the first category's intro before the first question (categoryIntros.show is on for the base dataset) — advance through it so we settle on an actual question route with the per-question heading.
  await advancePastCategoryIntro(page);
  await page.getByTestId(testIds.voter.questions.heading).waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });

  const firstQuestionUrl = page.url();

  // Answer the first question to trigger the real Q→Q auto-advance navigation.
  const answerOption = page.getByTestId(testIds.voter.questions.answerOption);
  await answerOption.first().waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
  await answerOption.first().click();

  // Wait for the Q→Q navigation to settle on a NEW question route (URL changed, heading re-rendered). The auto-advance may land on a category-intro for the first question of a new category; tolerate that by advancing if needed.
  await page.waitForURL((url) => url.toString() !== firstQuestionUrl, { timeout: TIMEOUTS.slowPage }).catch(() => null);
  await advancePastCategoryIntro(page);
  await page.getByTestId(testIds.voter.questions.heading).waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });

  // Re-enter the settled question route deterministically (transition disabled) so the afterNavigate focus reset runs against a non-animating DOM — this is the binding Q→Q focus assertion (NAVA11Y-02).
  const settledUrl = page.url();
  await page.goto(withNoTransition(settledUrl));
  await page.getByTestId(testIds.voter.questions.heading).waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });

  await assertFocusOnHeading(page);
});
