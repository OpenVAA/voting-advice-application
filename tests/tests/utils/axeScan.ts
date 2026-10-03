/**
 * @file The a11y scan core — the one copy in the repository.
 *
 * Extracted from `specs/a11y/a11y-smoke.spec.ts` as a pure MOVE: every body and every docblock below transferred unchanged, and the voter spec now imports what it used to declare. The proof that the move changed nothing a report can see is the ordered comparison of the a11y project's enumerated test titles before and after it.
 *
 * ## Why it is a module rather than a second copy
 *
 * Both halves of the application are scanned — the voter routes from `a11y-smoke.spec.ts`, the candidate `(protected)` routes from `candidate-a11y.spec.ts`. Criterion 6 requires the two to be `identical in strictness`. Holding the tag set, the per-rule trio, the global zero gate, the animation settle, the dark-theme guard and the shared scan body in ONE module makes that a property of the code: there is no second copy that could drift. A difference between the two halves can therefore only ever be a difference in their route tables, never in how hard they are scanned.
 *
 * ## What deliberately did NOT move
 *
 * The voter route table, the three runner loops and the `navigation-a11y` tests stay in the voter spec — they are voter-specific, and moving them would make this module a spec rather than a core.
 *
 * The docblocks below carry MEASURED numbers (stale-chrome element counts, phantom-contrast opacity readings, the half-dark comparison table). They are the reason the current shape is the shape it is; treat them as evidence, not commentary.
 */
import { AxeBuilder } from '@axe-core/playwright';
import { expect } from '@playwright/test';
import { collectRawI18nKeyFindings } from './rawKeyScan';
import { testIds } from './testIds';
import { TIMEOUTS } from '../helpers';
import type { Page, TestInfo } from '@playwright/test';
import type { Route } from '../../../apps/frontend/src/lib/routes/route';

/**
 * Append the `?notr=1` escape hatch (decision) to a URL so the View-Transition layer is deterministically disabled for E2E — `shouldAnimate` short-circuits on `notr=1` (apps/frontend/src/lib/utils/viewTransition.ts), so the navigation completes WITHOUT racing the ~272ms cross-fade against `document.activeElement`. The focus reset (afterNavigate rAF) still runs; only the animation is suppressed.
 */
export function withNoTransition(url: string): string {
  const u = new URL(url);
  u.searchParams.set('notr', '1');
  return u.toString();
}

/**
 * Wait until every running CSS/Web animation on the document has finished BEFORE an axe scan.
 *
 * ## Why
 * axe composites an element's text colour through any in-flight ancestor opacity. The voter routes fade their content in on entry (an entrance animation animating opacity 0→1 / a View-Transition cross-fade), so a scan that fires as soon as a heading is visible — but before the fade settles — reads label/body text at PARTIAL opacity and reports phantom `color-contrast` failures: e.g. a `#666`-class token rendered ~`#858585` (≈3.69:1) at ~0.2-0.3 opacity. At FULL opacity the same tokens pass (isolated, pressure-free scans are 0-violation), so this is a SCAN-TIMING readiness gate, NOT a theme change and NOT a timeout bump. Svelte transitions + View Transitions both run as Web Animations, so awaiting `getAnimations({ subtree: true }).finished` on the document is the real "page has stopped animating" signal. The leading rAF lets a just-started fly/fade register its animation before we collect it.
 *
 * INFINITE animations are EXCLUDED. Some surfaces carry looping CSS animations (e.g. the `infinite` progress/match bar on the results + entity-details surfaces), whose `.finished` promise NEVER resolves — awaiting it would hang the scan until the 90s test timeout. Those loops don't gate text opacity, so we await ONLY the FINITE (entrance) animations: an animation is finite when its effect's computed `endTime` is not Infinity. This exclusion is also why the document-wide settle is now safe on the drawer route, where the looping bar previously forced a dialog-subtree-only settle.
 */
export async function awaitAnimationsSettled(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    // `Element.getAnimations({ subtree: true })` on the document root collects every running animation in the document (the `Document.getAnimations()` overload takes no options arg, so go through `documentElement`).
    const finite = document.documentElement.getAnimations({ subtree: true }).filter((a) => {
      const endTime = a.effect?.getComputedTiming().endTime;
      // endTime is a CSSNumberish (number | CSSNumericValue); only a finite numeric endTime is an entrance (non-looping) animation we should await.
      return typeof endTime === 'number' && Number.isFinite(endTime);
    });
    await Promise.all(finite.map((a) => a.finished.catch(() => undefined)));
  });
}

// WCAG 2.1 AA superset — captures the maximum surface so the smoke gate reflects the full WCAG 2.1 AA contract. A downstream consumer can subset later if needed.
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/**
 * Fields every scan entry carries, whatever supplies its page.
 */
export interface AxeRouteBase {
  name: string;
  /**
   * REQUIRED — the data-driven testid proving this route's real content is in the DOM.
   *
   * A route-level heading is NOT acceptable as a content anchor: headings render from a static i18n title and resolve BEFORE any data-driven content mounts, so a heading settle lets the scan run against a DOM that does not yet contain the content the scan exists to check. Making the field required means a new scan route physically cannot be added without declaring what "loaded" means for it — and the requirement is uniform, because EVERY scan entry (raw and fixture-driven alike) is declared in this one table.
   *
   * A route-unique anchor also detects a `+page.ts` `redirect(307, …)` automatically — that is how the `constituencies-selector` entry was found to have been silently re-scanning `/elections`.
   */
  contentTestId: string;
  /**
   * OPTIONAL extra navigation/interaction needed to REACH the scan target (e.g.
   * walk a gate route, open a drawer). Runs BEFORE the `contentTestId` wait, so the content anchor stays the LAST gate before the scan.
   */
  settle?: (page: Page) => Promise<void>;
}

/**
 * A scan entry the runner navigates to itself — `routeId` is required because nothing else supplies the URL.
 *
 * It does NOT mean "unauthenticated". Browser state comes from the PROJECT the spec runs under, not from this discriminant: `a11y-smoke` runs its raw entries with an empty storage state, while `candidate-a11y-scan` runs its raw entries with the stored candidate session. The distinction this field draws is only "the runner navigates" versus "a fixture hands the page over".
 */
export interface RawAxeRoute extends AxeRouteBase {
  fixture: 'raw';
  routeId: Route;
}

/**
 * A scan entry whose page is supplied by a voter-journey fixture, which has already walked the real UI flow to get there. No `routeId`: navigating would discard the located/answered state the fixture exists to establish.
 */
export interface FixtureAxeRoute extends AxeRouteBase {
  fixture: 'located' | 'answered';
}

export type AxeRoute = RawAxeRoute | FixtureAxeRoute;

/**
 * Assert the per-rule + global 0-violation gates against an axe scan result.
 * The per-rule trio (aria-required-parent, list, button-name) are the historically-regressed rule-IDs.
 */
export async function assertAxeGates(
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

  // Global zero gate — 0 violations across all 28 scanned surfaces (14 voter + 14 candidate, each route in both themes; it was 7 routes / 14 surfaces before the family was extended to the candidate `(protected)` routes).
  // Catches new rule-IDs that the per-rule trio doesn't name (e.g., heading-order from a latent h4-hoist outline gap).
  //
  // This function is the ONLY place either half's violations are gated, and it takes no per-surface parameter that could relax it — which is what makes criterion 6's "identical in strictness" a property of the code rather than of two tables agreeing.
  expect(results.violations).toHaveLength(0);

  // reason: defensive shape checks PRESERVED — defends against AxeBuilder API breakage on future axe-core upgrades; zero runtime cost.
  expect(results).toHaveProperty('violations');
  expect(Array.isArray(results.violations)).toBe(true);
}

/**
 * Assert the page is GENUINELY dark — the whole document, not just the parts that happened to re-render.
 *
 * ## Why this is not just `emulateMedia` + trust
 *
 * The obvious way to give a fixture-driven entry a dark twin is to let the fixture walk in light and then flip `emulateMedia({ colorScheme: 'dark' })` on the page it hands back. MEASURED, that produces a HALF-DARK document. On the /questions intro reached through `locatedVoterPage`:
 *
 *   | mechanism                          | `--color-neutral` at :root | nav-menu-toggle computed colour | elements still painting the LIGHT `#333333` |
 *   | dark emulated AFTER the light walk | `#cccccc` (dark, correct)  | `rgb(51, 51, 51)`  (LIGHT)      | **30** |
 *   | context born dark (`use`)          | `#cccccc` (dark, correct)  | `rgb(204, 204, 204)` (dark)     | **0**  |
 *
 * The custom property itself resolves to the dark token on the stale elements — only their computed `color` is left behind. The stale set is the PERSISTENT layout chrome the fixture rendered before the flip (the header menu-toggle button, the hamburger `svg`/`path`, the OpenVAA logo `svg`); route content, which re-renders after the flip, comes out correctly dark. So the flip is not a full theme change, it is a partial one, and a `-dark` scan built on it reports a confident 0 violations about a document that is still half light.
 *
 * That is precisely the fake-green this scan family exists to prevent, so the dark twins do NOT flip: each is wrapped in a `use({ colorScheme: 'dark' })` group, the browser context is created dark, and the fixture walks the entire voter journey in dark. That also makes the scan more faithful than a flip ever could be — it measures the real dark-mode journey rather than a light journey wearing a dark hat.
 *
 * ## The guard
 *
 * Structure prevents the staleness; this helper stops it silently coming back.
 * A freshly created `.text-neutral` node always resolves the CURRENT token, so comparing it against the persistent chrome detects a stale-light document without hard-coding a single hex value or naming a theme. Validated against both mechanisms above: it FAILS on the flip (`rgb(204,204,204)` vs `rgb(51,51,51)`) and PASSES on the born-dark context.
 */
export async function assertDarkThemeApplied(page: Page): Promise<void> {
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
    // The header menu-toggle is `text-neutral` layout chrome present on every scanned voter surface, and it is the element the flip demonstrably stranded. Reading it as `?? null` (rather than falling back to `live`) keeps the guard from silently going dead if the testid is ever renamed.
    const chrome = document.querySelector<HTMLElement>(`[data-testid="${menuToggleTestId}"]`);
    return { liveTokenColor: live, chromeColor: chrome ? getComputedStyle(chrome).color : null };
  }, testIds.shared.navigation.menuToggle);

  expect(chromeColor).toBe(liveTokenColor);
}

/**
 * The one scan body every entry shares, whatever supplied the page: reach-the-target settle → data-driven content anchor → animations settle → scan → gates. The content anchor is deliberately the LAST wait before the settle, so a `+page.ts` loader redirect or an unmounted data surface cannot be scanned unnoticed.
 *
 * Lives at module scope so the shared body is not duplicated per loop and so no branch sits inside a `test()` body (playwright/no-conditional-in-test).
 * Named `assert…` because it terminates in `assertAxeGates` — that also makes it a recognised assertion helper under the repo's `playwright/expect-expect` `assertFunctionPatterns` config (tests/eslint.config.mjs), so the gates stay enforced rather than the rule being disabled at the call sites.
 */
export async function assertAxeScan(page: Page, route: AxeRoute, testInfo: TestInfo, label: string): Promise<void> {
  await route.settle?.(page);
  await page.getByTestId(route.contentTestId).first().waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
  // Gate the scan on the entrance fade/animation finishing — otherwise axe composites text colour through in-flight opacity and reports phantom color-contrast failures (see awaitAnimationsSettled).
  await awaitAnimationsSettled(page);

  // Suite-wide raw-i18n-key gate (sweep finding F2). `t()` returns the raw dotted key path on a catalog miss (i18n/wrapper.ts:40), so a broken catalog renders `questions.multiChoice.selectExact` as literal user-visible text — a state that SATISFIES 21 of the suite's own text matchers (`/Yes/i` passes against `common.answer.yes`). Checking it here, against a key set derived from the catalog at runtime, covers all 598 keys and every future one on every scanned surface — 28 of them, the voter 14 and the candidate 14 — instead of patching 21 individual regexes. The page is already navigated, content-anchored and animation-settled at this point, so the marginal cost is one DOM read.
  //
  // The DOM read happens BEFORE the axe scan deliberately: an untranslated catalog changes the accessible names axe is about to read, so the raw-key verdict must be taken against the same DOM axe sees, not after it.
  const rawKeys = await collectRawI18nKeyFindings(page, label);

  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

  // BOTH verdicts are computed before EITHER is reported, and the raw-key one is reported softly: compute both verdicts in one body, report both, neither short-circuiting the other.
  //
  // What that fixes, measured rather than supposed: the raw-key gate used to terminate in a throwing `expect`, so on a surface with BOTH defects the axe scan never ran and the surface reported one finding when it had two. The criterion's premise — that an axe failure could subsume a raw-key one — was already false in execution order; the real coupling ran the other way, and this is the line that removes it. Costed at ≈0 s: both gates already ran, and the alternative (a separate reported test per surface) was measured at ≤ +138 s of suite wall clock.
  //
  // `expect.soft` records the raw-key verdict and CONTINUES, so `assertAxeGates` below always runs and its own hard gates still fail the test. A soft failure still fails the test at its end, so nothing is downgraded to a warning — the only thing that changes is that one finding can no longer hide the other.
  // ONE entry point (this function) is shared by both specs, so the property is app-wide by construction rather than by two files agreeing.
  await testInfo.attach(`raw-i18n-keys-${label}.json`, {
    body: JSON.stringify(rawKeys.findings, null, 2),
    contentType: 'application/json'
  });
  expect.soft(rawKeys.findings, rawKeys.message).toEqual([]);

  await assertAxeGates(results, testInfo, label);
}
