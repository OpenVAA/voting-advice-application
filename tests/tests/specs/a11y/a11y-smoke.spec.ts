/**
 * axe accessibility smoke — WCAG 2.1 AA regression gate.
 *
 * Asserts the 0-violation state across 7 voter-app surfaces AND a per-rule
 * regression gate (aria-required-parent, list, button-name) so future
 * reintroductions are caught.
 *
 * ## The route contract (D-04)
 *
 * EVERY scan is declared as an entry in the single `AXE_ROUTES` table — there
 * are no hand-written scan bodies outside it. Each entry MUST declare a
 * `contentTestId`: the data-driven testid proving the route's real content is
 * in the DOM. The field is REQUIRED, so a new scan route cannot be added
 * without stating what "loaded" means for it.
 *
 * This exists because a role-based settle is not a content settle. The previous
 * `getByRole('heading')` settle resolved on a static i18n title that renders
 * BEFORE any data-driven content mounts, so scans could — and did — pass against
 * a DOM that did not contain the thing being checked. It also could not detect a
 * `+page.ts` `redirect(307, …)`: the `constituencies-selector` entry had never
 * once scanned a constituency selector, silently re-scanning /elections instead.
 *
 * Entries are discriminated on `fixture`, which decides what supplies the page:
 *   - `raw`      — the runner navigates itself (`routeId` required), from a
 *                  clean unauthenticated page.
 *   - `located`  — `locatedVoterPage` fixture (walks Home → Elections →
 *                  Constituencies → /questions intro, then STOPS).
 *   - `answered` — `answeredVoterPage` fixture (full walk to /results landing).
 * The fixtures walk the real voter flow and let the voter context populate
 * electionId/constituencyId via the live UI path, avoiding bypass-of-UI-flow
 * data setup and tightening the trust boundary.
 *
 * Routes (7 distinct entries — note Paraglide's `url` locale strategy means
 * there is NO locale route segment; the paths really are `/`, `/elections`, …):
 *   1. home                             (/)              [raw]
 *   2. elections-selector               (/elections)     [raw]
 *   3. constituencies-selector-located  (/constituencies)[raw + settle: walks
 *      the elections Continue gate, because /constituencies 307-redirects a
 *      goto that carries no electionId]
 *   4. questions                        (/questions)     [located]
 *   5. results                          (/results)       [answered]
 *   6. voter-detail-drawer  (opened from Results)        [answered + settle]
 *   7. results-filter-drawer (filter dialog on Results)  [answered + settle:
 *      opens the dialog through the entityFilters fixture and expands EVERY
 *      filter row, because the filter bodies are lazily imported]
 *
 * Each scan: (navigate) → optional reach-the-target `settle` → REQUIRED
 * `contentTestId` wait (the LAST gate; NEVER a network-idle settle) →
 * `awaitAnimationsSettled` → raw-i18n-key gate (`assertNoRawI18nKeys`, F2) →
 * run AxeBuilder.withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()
 * → assert per-rule 0-violation gate + global 0-violation gate.
 *
 * EVERY entry is scanned in BOTH themes — each emits a light scan and a `-dark`
 * twin, so there is no theme-shaped hole in the gate. Raw twins emulate dark
 * before their `goto`; fixture-driven twins take a dark browser context so the
 * fixture walks the whole journey in dark (see `assertDarkThemeApplied` for why
 * flipping the theme after the walk is not equivalent).
 *
 * Per-rule axe-id assertions + global 0-violation gate are PRESERVED — no
 * weakening, per CLAUDE.md WCAG 2.1 AA discipline.
 */

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { createEntityFilters } from '../../fixtures/voter/entityFilters.fixture';
import { voterJourneyTest, walkUntilQuestionsIntro } from '../../fixtures/voter/voter-journey.fixture';
import { TIMEOUTS } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { assertNoRawI18nKeys } from '../../utils/rawKeyScan';
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
 * Wait until every running CSS/Web animation on the document has finished
 * BEFORE an axe scan.
 *
 * ## Why
 * axe composites an element's text colour through any in-flight ancestor
 * opacity. The voter routes fade their content in on entry (an entrance
 * animation animating opacity 0→1 / a View-Transition cross-fade), so a scan
 * that fires as soon as a heading is visible — but before the fade settles —
 * reads label/body text at PARTIAL opacity and reports phantom `color-contrast`
 * failures: e.g. a `#666`-class token rendered ~`#858585` (≈3.69:1) at ~0.2-0.3
 * opacity. At FULL opacity the same tokens pass (isolated, pressure-free scans
 * are 0-violation), so this is a SCAN-TIMING readiness gate, NOT a theme change
 * and NOT a timeout bump. Svelte transitions + View Transitions both run as
 * Web Animations, so awaiting `getAnimations({ subtree: true }).finished` on the
 * document is the real "page has stopped animating" signal. The leading rAF
 * lets a just-started fly/fade register its animation before we collect it.
 *
 * INFINITE animations are EXCLUDED. Some surfaces carry looping CSS animations
 * (e.g. the `infinite` progress/match bar on the results + entity-details
 * surfaces), whose `.finished` promise NEVER resolves — awaiting it would hang
 * the scan until the 90s test timeout. Those loops don't gate text opacity, so
 * we await ONLY the FINITE (entrance) animations: an animation is finite when
 * its effect's computed `endTime` is not Infinity. This exclusion is also why
 * the document-wide settle is now safe on the drawer route, where the looping
 * bar previously forced a dialog-subtree-only settle.
 */
async function awaitAnimationsSettled(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    // `Element.getAnimations({ subtree: true })` on the document root collects
    // every running animation in the document (the `Document.getAnimations()`
    // overload takes no options arg, so go through `documentElement`).
    const finite = document.documentElement.getAnimations({ subtree: true }).filter((a) => {
      const endTime = a.effect?.getComputedTiming().endTime;
      // endTime is a CSSNumberish (number | CSSNumericValue); only a finite
      // numeric endTime is an entrance (non-looping) animation we should await.
      return typeof endTime === 'number' && Number.isFinite(endTime);
    });
    await Promise.all(finite.map((a) => a.finished.catch(() => undefined)));
  });
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
  // The category-start link's `href` resolves post-hydration from the
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

/**
 * Fields every scan entry carries, whatever supplies its page.
 */
interface AxeRouteBase {
  name: string;
  /**
   * REQUIRED — the data-driven testid proving this route's real content is in
   * the DOM.
   *
   * A route-level heading is NOT acceptable as a content anchor: headings render
   * from a static i18n title and resolve BEFORE any data-driven content mounts,
   * so a heading settle lets the scan run against a DOM that does not yet contain
   * the content the scan exists to check. Making the field required means a new
   * scan route physically cannot be added without declaring what "loaded" means
   * for it (D-04) — and the requirement is uniform, because EVERY scan entry
   * (raw and fixture-driven alike) is declared in this one table.
   *
   * A route-unique anchor also detects a `+page.ts` `redirect(307, …)`
   * automatically — that is how the `constituencies-selector` entry was found to
   * have been silently re-scanning `/elections`.
   */
  contentTestId: string;
  /**
   * OPTIONAL extra navigation/interaction needed to REACH the scan target (e.g.
   * walk a gate route, open a drawer). Runs BEFORE the `contentTestId` wait, so
   * the content anchor stays the LAST gate before the scan.
   */
  settle?: (page: Page) => Promise<void>;
}

/**
 * A scan entry the runner navigates to itself, from a clean unauthenticated
 * page — `routeId` is required because nothing else supplies the URL.
 */
interface RawAxeRoute extends AxeRouteBase {
  fixture: 'raw';
  routeId: Route;
}

/**
 * A scan entry whose page is supplied by a voter-journey fixture, which has
 * already walked the real UI flow to get there. No `routeId`: navigating would
 * discard the located/answered state the fixture exists to establish.
 */
interface FixtureAxeRoute extends AxeRouteBase {
  fixture: 'located' | 'answered';
}

type AxeRoute = RawAxeRoute | FixtureAxeRoute;

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
    // The entry declares `routeId: 'Elections'`, NOT 'Constituencies', because
    // `(voters)/constituencies/+page.ts` `redirect(307, 'Elections')`s any goto
    // that carries no `electionId` — a bare `/constituencies` goto has never
    // reached a constituency selector. So the walk goes through the elections
    // gate: both elections are pre-checked in the `e2e/base` dataset, so
    // Continue is enabled immediately and needs no option click.
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
    // `locatedVoterPage` walks Home → Elections → Constituencies → the
    // /questions intro and STOPS there, so the start button IS the intro
    // page's data-driven content and no extra settle is needed.
    name: 'questions',
    fixture: 'located',
    contentTestId: testIds.voter.questions.startButton
  },
  {
    // Strictly tighter than the previous `getByRole('tablist')` settle: the
    // tablist is layout chrome that renders before any nomination data, while
    // an entity card only exists once the matched entities have rendered.
    name: 'results',
    fixture: 'answered',
    contentTestId: testIds.voter.results.card
  },
  {
    // The drawer content flies in via Svelte `transition:fly` (Drawer.svelte:82),
    // which animates opacity 0->1. axe composites text colour through any
    // in-flight ancestor opacity, so scanning mid-fly produced phantom
    // `color-contrast` failures — e.g. `text-secondary` #666666 rendered ~#969696
    // (2.95:1) and `primary` #2546a8 rendered ~#6a80c3 (3.82:1), both exactly the
    // token at ~0.69 opacity. At FULL opacity the tokens pass (≈5.7:1 / ≈8.6:1 on
    // white), so this is a scan-timing fix, NOT a theme change. The shared
    // `awaitAnimationsSettled` gate settles the WHOLE document (drawer fly + any
    // page-level entrance fade) and is safe here specifically because it excludes
    // INFINITE animations — the looping match bar on this surface would otherwise
    // never resolve, which is why this route once needed a dialog-subtree-only
    // settle.
    name: 'voter-detail-drawer',
    fixture: 'answered',
    contentTestId: testIds.voter.results.entityDetails,
    settle: async (page) => {
      // Open the drawer — click first entity card. The drawer renders as
      // role=dialog overlay intercepted by results/+layout.svelte beforeNavigate.
      await page
        .getByTestId(testIds.voter.results.card)
        .first()
        .waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
      await page.getByTestId(testIds.voter.results.card).first().click();
      await page.getByRole('dialog').waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
    }
  },
  {
    // The results filter drawer — `NumericEntityFilter` / `EnumeratedEntityFilter`
    // and the Expander rows that hold them. Before this entry these surfaces were
    // scanned by NOTHING, which is what let the FIX-01 defect class sit on exactly
    // the components the v2.14 audit named.
    //
    // The content anchor is the numeric filter's range input, NOT the dialog root
    // and NOT a filter row. Filter bodies are lazily imported
    // (`{#await import('./numeric')}` in EntityFilters.svelte), so a dialog-root or
    // row anchor resolves while the bodies are still unmounted and the scan would
    // cover an empty drawer. The `e2e/base` dataset renders exactly one numeric
    // filter (the years-of-experience info question carries `filterable: true`), so
    // this anchor is the strictest data-driven proof the drawer's real content is
    // present.
    //
    // Scanned in BOTH themes, like every other entry. Research had measured this
    // drawer at 0 violations in light and dark; the `-dark` twin now holds that
    // in CI rather than leaving it as an untested claim — and it confirms it,
    // with the drawer opened and every filter row expanded in a dark context.
    name: 'results-filter-drawer',
    fixture: 'answered',
    contentTestId: testIds.voter.results.filterNumericMin,
    settle: async (page) => {
      await page
        .getByTestId(testIds.voter.results.card)
        .first()
        .waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
      // Go through the fixture, never a hand-rolled click: the fixture's dialog
      // opener owns the two-conditional-render `.first()` invariant on the filter
      // button AND the fallback from the unreliable `entity-filter-dialog` testid
      // to `getByRole('dialog', { name: /Filters/i })`.
      const dialog = await createEntityFilters(page).openFilterDialog();
      // Expand EVERY row: EntityFilters defaults `defaultExpanded` to false for
      // non-active/non-text filters, so an unexpanded drawer hides most of the
      // markup this scan exists to check. `getFilter()` auto-expands through the
      // Expander's internal `role=checkbox, name=/expand or collapse/i` toggle —
      // never click an Expander header directly. The loop is bounded by a count
      // read ONCE up front, and each expand is bounded by the fixture's own
      // toggle-visibility assertion, so there is no unbounded polling here and no
      // fixed-duration sleep anywhere in this file.
      const rowCount = await dialog.getFilters().count();
      for (let index = 0; index < rowCount; index++) {
        await dialog.getFilter(() => index);
      }
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

  // Global zero gate — "0 violations across all 7 surfaces". Catches new rule-IDs
  // that the per-rule trio doesn't name (e.g., heading-order from a latent
  // h4-hoist outline gap).
  expect(results.violations).toHaveLength(0);

  // reason: defensive shape checks PRESERVED — defends against AxeBuilder API breakage on future axe-core upgrades; zero runtime cost.
  expect(results).toHaveProperty('violations');
  expect(Array.isArray(results.violations)).toBe(true);
}

/**
 * Assert the page is GENUINELY dark — the whole document, not just the parts
 * that happened to re-render.
 *
 * ## Why this is not just `emulateMedia` + trust
 *
 * The obvious way to give a fixture-driven entry a dark twin is to let the
 * fixture walk in light and then flip `emulateMedia({ colorScheme: 'dark' })` on
 * the page it hands back. MEASURED, that produces a HALF-DARK document. On the
 * /questions intro reached through `locatedVoterPage`:
 *
 *   | mechanism                          | `--color-neutral` at :root | nav-menu-toggle computed colour | elements still painting the LIGHT `#333333` |
 *   | dark emulated AFTER the light walk | `#cccccc` (dark, correct)  | `rgb(51, 51, 51)`  (LIGHT)      | **30** |
 *   | context born dark (`use`)          | `#cccccc` (dark, correct)  | `rgb(204, 204, 204)` (dark)     | **0**  |
 *
 * The custom property itself resolves to the dark token on the stale elements —
 * only their computed `color` is left behind. The stale set is the PERSISTENT
 * layout chrome the fixture rendered before the flip (the header menu-toggle
 * button, the hamburger `svg`/`path`, the OpenVAA logo `svg`); route content,
 * which re-renders after the flip, comes out correctly dark. So the flip is not
 * a full theme change, it is a partial one, and a `-dark` scan built on it
 * reports a confident 0 violations about a document that is still half light.
 *
 * That is precisely the fake-green this scan family exists to prevent, so the
 * dark twins do NOT flip: each is wrapped in a `use({ colorScheme: 'dark' })`
 * group, the browser context is created dark, and the fixture walks the entire
 * voter journey in dark. That also makes the scan more faithful than a flip
 * ever could be — it measures the real dark-mode journey rather than a light
 * journey wearing a dark hat.
 *
 * ## The guard
 *
 * Structure prevents the staleness; this helper stops it silently coming back.
 * A freshly created `.text-neutral` node always resolves the CURRENT token, so
 * comparing it against the persistent chrome detects a stale-light document
 * without hard-coding a single hex value or naming a theme. Validated against
 * both mechanisms above: it FAILS on the flip (`rgb(204,204,204)` vs
 * `rgb(51,51,51)`) and PASSES on the born-dark context.
 */
async function assertDarkThemeApplied(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => window.matchMedia('(prefers-color-scheme: dark)').matches), {
      timeout: TIMEOUTS.page
    })
    .toBe(true);

  const { liveTokenColor, chromeColor } = await page.evaluate((menuToggleTestId) => {
    // A node created NOW cannot be stale, so its colour is the live token.
    const probe = document.createElement('span');
    probe.className = 'text-neutral';
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    document.body.appendChild(probe);
    const live = getComputedStyle(probe).color;
    probe.remove();
    // The header menu-toggle is `text-neutral` layout chrome present on every
    // scanned voter surface, and it is the element the flip demonstrably
    // stranded. Reading it as `?? null` (rather than falling back to `live`)
    // keeps the guard from silently going dead if the testid is ever renamed.
    const chrome = document.querySelector<HTMLElement>(`[data-testid="${menuToggleTestId}"]`);
    return { liveTokenColor: live, chromeColor: chrome ? getComputedStyle(chrome).color : null };
  }, testIds.shared.navigation.menuToggle);

  expect(chromeColor).toBe(liveTokenColor);
}

/**
 * The one scan body every entry shares, whatever supplied the page:
 * reach-the-target settle → data-driven content anchor → animations settle →
 * scan → gates. The content anchor is deliberately the LAST wait before the
 * settle, so a `+page.ts` loader redirect or an unmounted data surface cannot
 * be scanned unnoticed (D-04).
 *
 * Lives at module scope so the shared body is not duplicated per loop and so
 * no branch sits inside a `test()` body (playwright/no-conditional-in-test).
 * Named `assert…` because it terminates in `assertAxeGates` — that also makes it
 * a recognised assertion helper under the repo's `playwright/expect-expect`
 * `assertFunctionPatterns` config (tests/eslint.config.mjs), so the gates stay
 * enforced rather than the rule being disabled at the call sites.
 */
async function assertAxeScan(page: Page, route: AxeRoute, testInfo: TestInfo, label: string): Promise<void> {
  await route.settle?.(page);
  await page.getByTestId(route.contentTestId).first().waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
  // Gate the scan on the entrance fade/animation finishing — otherwise axe
  // composites text colour through in-flight opacity and reports phantom
  // color-contrast failures (see awaitAnimationsSettled).
  await awaitAnimationsSettled(page);

  // Suite-wide raw-i18n-key gate (sweep finding F2). `t()` returns the raw
  // dotted key path on a catalog miss (i18n/wrapper.ts:40), so a broken catalog
  // renders `questions.multiChoice.selectExact` as literal user-visible text —
  // a state that SATISFIES 21 of the suite's own text matchers (`/Yes/i` passes
  // against `common.answer.yes`). Checking it here, against a key set derived
  // from the catalog at runtime, covers all 598 keys and every future one on
  // every scanned surface, instead of patching 21 individual regexes. The page
  // is already navigated, content-anchored and animation-settled at this point,
  // so the marginal cost is one DOM read.
  //
  // Runs BEFORE the axe scan deliberately: an untranslated catalog is a content
  // defect that makes every accessible-name result on the surface meaningless,
  // so it should be the reported failure rather than a footnote under a
  // downstream contrast complaint.
  await assertNoRawI18nKeys(page, label);

  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  await assertAxeGates(results, testInfo, label);
}

// Module-level for…of route runners, filtered by the `fixture` discriminant —
// module-level dispatch satisfies playwright/no-conditional-in-test (no `if`
// inside test() bodies), and the type predicates narrow the union so each loop
// sees only the fields its variant actually carries.
//
// THEME COVERAGE — complete. Every entry, raw and fixture-driven alike, emits a
// light scan and a `-dark` twin, so a dark-only contrast regression on ANY
// scanned surface fails the gate. The two runner families reach dark
// differently, and the difference is load-bearing rather than stylistic: raw
// twins emulate dark before their own `goto`, while fixture-driven twins take a
// dark browser CONTEXT so the fixture walks the journey in dark from the first
// paint. Flipping the theme onto an already-walked light page is NOT equivalent
// — it strands the persistent layout chrome in light. See
// `assertDarkThemeApplied` for the measurement and the guard that pins it.

const RAW_ROUTES = AXE_ROUTES.filter((route): route is RawAxeRoute => route.fixture === 'raw');
const LOCATED_ROUTES = AXE_ROUTES.filter((route): route is FixtureAxeRoute => route.fixture === 'located');
const ANSWERED_ROUTES = AXE_ROUTES.filter((route): route is FixtureAxeRoute => route.fixture === 'answered');

for (const route of RAW_ROUTES) {
  test(`axe accessibility scan — ${route.name}`, async ({ page }, testInfo) => {
    await page.goto(buildRoute({ route: route.routeId, locale: 'en' }));
    await assertAxeScan(page, route, testInfo, route.name);
  });

  // EFLOW-07: dark-mode colour-contrast (WCAG 2.1 AA gated in both themes).
  // Re-run the SAME axe scan under emulated `prefers-color-scheme: dark` — there
  // is no toggle/storage; the OS-media emulation IS the dark-theme source
  // (`darkMode.svelte.ts` reads matchMedia only). The dark token palette must
  // clear contrast just like light, so the global 0-violation gate (via
  // assertAxeGates, `-dark` label) catches any dark-only contrast regression.
  test(`axe accessibility scan — ${route.name} (dark)`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(buildRoute({ route: route.routeId, locale: 'en' }));
    await assertAxeScan(page, route, testInfo, `${route.name}-dark`);
  });
}

// ── Located routes — voter-journey fixture supplies the page ───────────────
//
// The fixtures walk the real voter flow and let the voter context populate
// electionId/constituencyId via the live UI path, avoiding bypass-of-UI-flow
// data setup and tightening the trust boundary. No `page.goto` here: navigating
// would discard the located/answered state the fixture exists to establish.

for (const route of LOCATED_ROUTES) {
  // `locatedVoterPage` walks Home → Elections → Constituencies → the /questions
  // intro and STOPS (it does NOT answer questions or proceed to /results). The
  // fixture-name-aliasing idiom `{ locatedVoterPage: page }` lets the body read
  // as if it had a plain `page`.
  voterJourneyTest(`axe accessibility scan — ${route.name}`, async ({ locatedVoterPage: page }, testInfo) => {
    await assertAxeScan(page, route, testInfo, route.name);
  });

  // Dark twin. Unlike the raw runner there is no `goto` to precede, so there is
  // nothing to emulate dark *before* — and flipping the theme after the fixture
  // has walked leaves the persistent layout chrome painting light tokens
  // (measured: 30 stale elements — see assertDarkThemeApplied). So the context
  // is born dark via `use` instead, and the fixture walks the ENTIRE journey in
  // dark. The anonymous describe scopes that option to this one test without
  // adding a title segment.
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

  // Dark twin — same born-dark shape as the located loop above. Because the
  // context is dark from creation, the route's `settle` (drawer open, filter-row
  // expansion) also runs against a dark DOM, so the scanned overlay is dark
  // rather than a light-rendered panel over a dark page.
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
