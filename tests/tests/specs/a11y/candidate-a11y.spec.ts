/**
 * axe accessibility smoke — the CANDIDATE half of the two-file scan family.
 *
 * Scans the seven candidate `(protected)` surfaces in both themes (14 scans), over the SHARED scan core in `tests/tests/utils/axeScan.ts`. The voter half is `a11y-smoke.spec.ts` in this same directory; neither file declares a gate of its own, so the two halves differ only in their route tables.
 *
 * Runs AUTHENTICATED: the `candidate-a11y-scan` project supplies the stored candidate session (`STORAGE_STATE`, written by `auth-setup`) as its `storageState`, which is what makes `(protected)` reachable at all. That is the one structural difference from the voter half, and it is why this is a separate FILE rather than more entries in the voter table: a Playwright project selects by directory and filename, so a family that needs its own `storageState` and its own dependency edges needs its own file to match on.
 *
 * ## The reach proof
 *
 * The requirement is explicit that the auth fixture reporting success is NOT the evidence. So every scan takes its own: `assertCandidateReach` reads the SETTLED URL, asserts it is inside the candidate application and is not the login route, and asserts a per-entry marker that only the authenticated surface renders. It attaches both to the test's own output, so the evidence lives in the run rather than in a summary.
 *
 * It runs inside every entry's `settle`, i.e. BEFORE the scan — a silently-redirected scan therefore fails by name instead of reporting a confident zero about a login page. `toScanEntry` composes it onto every entry at the runner, so an entry physically cannot be added without it.
 *
 * ============================================================================
 * PARITY WITH THE VOTER HALF
 * ============================================================================
 *
 * ## Identical by construction
 *
 * Not "equivalent", not "kept in sync" — literally the same functions, imported from `tests/tests/utils/axeScan.ts` by both this file and `a11y-smoke.spec.ts`:
 *
 * | what | symbol |
 * |---|---|
 * | the WCAG 2.1 AA tag set | `WCAG_TAGS` (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`) |
 * | the per-rule regression trio | `assertAxeGates` — `aria-required-parent`, `list`, `button-name`, each asserted at 0 |
 * | the global zero-violation gate | `assertAxeGates` — `expect(results.violations).toHaveLength(0)` |
 * | the animation settle before the scan | `awaitAnimationsSettled` |
 * | the REQUIRED data-driven content anchor | `AxeRouteBase.contentTestId`, a required field |
 * | the one scan body | `assertAxeScan` — settle → anchor → settle animations → raw-key verdict → axe → gates |
 * | the raw-i18n-key gate | `collectRawI18nKeyFindings`, reported by `assertAxeScan` |
 *
 * `assertAxeGates` takes no per-surface parameter that could relax it, and this file declares no violation assertion of its own. So the parity is checkable by reading the symbols listed above against the ones `a11y-smoke.spec.ts` pulls from the same module — there is no second copy of a gate that could drift, and any future difference between the two halves can only be a difference in their ROUTE TABLES.
 *
 * ## Divergences, each with its reason
 *
 * 1. **These scans carry a stored candidate session; the voter scans run with an
 *    empty storage state.** Not a choice: the seven routes sit behind `(protected)/+layout.server.ts`'s `redirect(307, CandAppLogin)`. This is also the only reason the two halves need separate projects at all.
 * 2. **The dark-theme guard runs on ALL SEVEN dark twins here; on the voter side
 *    it runs only on the fixture-driven ones.** A deliberate strictness INCREASE, not a mismatch. The voter raw twins emulate dark before their own `goto`, so there is no walked-in-light document to strand; here the context is born dark and every twin is checked anyway. Cost: one probe-node read per scan.
 * 3. **`cand-preview` anchors on the entity-details article, not on
 *    `candidate-preview-container` — the testid the visual baselines use.**
 *    MEASURED: the container wraps the loading, error and success branches of the same template, so it resolves while `<Loading>` is still inside it (anchorText "Loading…", no h1). It is a fake settle. A screenshot of a spinner fails; a scan of one passes, which is why the visual suite can use the container and this one cannot.
 * 4. **`cand-nav-menu` opens the drawer through `navMenu.fixture`, never a
 *    click.** MEASURED: a bare `nav-menu-toggle` click is a no-op at 1280×720 AND 390×844, on the candidate app AND the voter app — `aria-expanded` stays `"false"` and `nav-menu` stays `display: none`, sampled at 0/30/80/150/400/1200 ms. It is the documented SSR→hydration gap; the fixture owns the retry.
 * 5. **axe's `incomplete` ("needs review") results are outside the gate.** This
 *    is a SHARED posture rather than a divergence — the voter gate asserts only on `violations` too — but it is recorded because the scout measured **72** such nodes across these 14 scans, all `color-contrast`, all on `<span class="uc-first">` inside a `vaa-button-label` or on a `!bg-transparent` `<select>`. The already-green voter surfaces produce the same class (voter-home 3, voter-elections 1). A reader who finds the 72 deserves to know they were seen and left out deliberately, and that gating them on this half alone would be the actual parity break.
 *
 * ## Known gaps — recorded as unknowns, never as zeros
 *
 * The zero above covers seven routes in the state one identity puts them in.
 * These are NOT covered, and none of them is claimed to be 0.
 *
 * ### Reachable-but-not-scanned STATES of routes that are otherwise scanned
 *
 * | state | why not reached with this identity/dataset | the lever that would reach it |
 * |---|---|---|
 * | terms-of-use gate modal (`(protected)/+layout.svelte`) | CA-AA-1 carries `terms_of_use_accepted` | `e2e/base` already ships `test-e2e-base-ca-aa-hidden` with that field deliberately absent — no new dataset needed |
 * | `/candidate/questions` empty-state intro (`candidate-questions-intro`) | every `e2e/base` candidate carries answers (0 hits for `answersByExternalId: {}` across 31 declarations) | a template change, or a runtime answer wipe |
 * | logout confirmation modal | the modal appears only when answers are INCOMPLETE; CA-AA-1 is complete | as above |
 * | `answersLocked` warning (`candidate-answers-locked-warning`, 3 routes) | an `app_settings` scenario owned by the `perm-answers-locked` chain | reuse that perm setup, or accept the gap |
 * | `PreventNavigation` unsaved-changes modal (profile, question) | requires a dirty form plus a navigation attempt | one extra step in the entry's `reach` |
 * | error paths — portrait-upload error (the shared `input-error` node inside `profile-image-upload`), preview `notFound` | failure paths, not states of a successful load | out of scope for a route-family scan; would need fault injection |
 *
 * ### Candidate routes OUTSIDE the `(protected)` family — also unscanned
 *
 * Eleven of them, none needing authentication: `login`, `help`, `privacy`, `forgot-password`, `password-reset`, `register`, `register/password`, `preregister` and its `elections` / `constituencies` / `email` / `status` steps. They are outside the criterion's wording ("candidate `(protected)` routes") but they are the same coverage hole, and their a11y state is unknown for the same reason: nothing scans them.
 *
 * ### The four stated limits of the zero itself
 *
 * 1. **One operating system.** Measured on macOS against local Chromium. CI runs
 *    an ubuntu runner. Colour values are computed rather than rendered so contrast should transfer; layout-dependent rules were not re-observed there.
 * 2. **One contention profile.** The scout's measurement was `--workers=1` in a
 *    standalone config. It was re-taken inside the real suite, which closes this one for the recorded run but not for every future scheduling shape — scan-timing pressure is exactly what produced phantom `color-contrast` failures on the voter side (see `awaitAnimationsSettled`).
 * 3. **One identity on one dataset.** CA-AA-1 on `e2e/base`. Every state in the
 *    table above is unmeasured.
 * 4. **One viewport.** 1280×720 (`devices['Desktop Chrome']`), matching the voter
 *    family. Mobile candidate layouts are not scanned — nor are mobile voter ones.
 */

import { expect, test } from '@playwright/test';
import { createCandidateQuestionsOverviewPage } from '../../fixtures/candidate/candidateQuestionsOverviewPage.fixture';
import { createNavMenu } from '../../fixtures/shared/navMenu.fixture';
import { TIMEOUTS } from '../../helpers';
import { assertAxeScan, assertDarkThemeApplied } from '../../utils/axeScan';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';
import type { RawAxeRoute } from '../../utils/axeScan';

/**
 * A candidate scan entry. Same shape as the voter table's `RawAxeRoute` — a `routeId` the runner navigates to, a REQUIRED data-driven `contentTestId`, an optional reach step — plus the post-login marker the reach proof asserts.
 *
 * `reach` rather than `settle`: the runner composes `settle` from `reach` + the reach proof + the dark guard (see `toScanEntry`), so neither proof can be forgotten on a new entry. Everything else is the voter table's contract, unchanged.
 */
interface CandidateAxeRoute extends Omit<RawAxeRoute, 'settle'> {
  /**
   * REQUIRED — a testid this surface renders ONLY when a candidate session is live. The login route renders none of them, so its presence is a positive proof of authentication rather than the absence of a redirect.
   */
  postLoginTestId: string;
  /**
   * OPTIONAL navigation/interaction needed to REACH the scan target. Runs before the reach proof, which in turn runs before the `contentTestId` wait.
   */
  reach?: (page: Page) => Promise<void>;
}

/** Any URL inside the candidate application, with or without a locale prefix. */
const CANDIDATE_APP_URL = /\/candidate(\/|$|\?|#)/;
/** The candidate login route — the surface a lost session silently lands on. */
const CANDIDATE_LOGIN_URL = /\/candidate\/login(\/|$|\?|#)/;

/**
 * Assert — and attach — the proof that THIS scan is about to read an authenticated candidate document.
 *
 * Two independent readings, because either alone is weak:
 *   - the SETTLED URL is inside `/candidate` and is not `/candidate/login`. This catches `(protected)/+layout.server.ts`'s `redirect(307, CandAppLogin)`, the exact way a scan would end up reporting a confident zero about a login form.
 *   - a per-entry marker only the authenticated surface renders. A URL alone would still pass against an error or empty state served at the same path.
 *
 * Both are attached to the test's own output before they are asserted, so the evidence survives on the failing path too — that is the point of taking the proof from the scan's own run rather than from the fixture's exit code.
 */
async function assertCandidateReach(page: Page, route: CandidateAxeRoute, label: string): Promise<void> {
  const marker = page.getByTestId(route.postLoginTestId);
  await marker.first().waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });

  const settledUrl = page.url();
  const markerCount = await marker.count();
  const markerText = ((await marker.first().textContent()) ?? '').replace(/\s+/g, ' ').trim().slice(0, 120);
  const heading = page.getByRole('heading', { level: 1 }).first();
  const headingCount = await page.getByRole('heading', { level: 1 }).count();
  const headingText = headingCount > 0 ? ((await heading.textContent()) ?? '').replace(/\s+/g, ' ').trim() : null;
  const prefersColorSchemeDark = await page.evaluate(() => window.matchMedia('(prefers-color-scheme: dark)').matches);

  await test.info().attach(`reach-proof-${label}.json`, {
    body: JSON.stringify(
      {
        label,
        settledUrl,
        postLoginTestId: route.postLoginTestId,
        postLoginNodeCount: markerCount,
        postLoginNodeText: markerText,
        h1: headingText,
        prefersColorSchemeDark
      },
      null,
      2
    ),
    contentType: 'application/json'
  });

  expect(settledUrl, `"${label}" settled outside the candidate application: ${settledUrl}`).toMatch(CANDIDATE_APP_URL);
  expect(
    settledUrl,
    `"${label}" settled on the candidate LOGIN route — the stored session did not survive, so this scan ` +
      `would have reported a verdict about a login form: ${settledUrl}`
  ).not.toMatch(CANDIDATE_LOGIN_URL);
  expect(
    markerCount,
    `"${label}" rendered no "${route.postLoginTestId}" node, so nothing on the scanned document proves it ` +
      'is the authenticated surface rather than something else served at the same path'
  ).toBeGreaterThan(0);
}

const CANDIDATE_AXE_ROUTES: ReadonlyArray<CandidateAxeRoute> = [
  {
    // Anchor on the home status message, NOT on the page frame: its content is computed from the candidate's completion state, so it exists only once the candidate's own answers have loaded. A frame-level anchor would resolve while the layout's data promises were still pending.
    // Marker: the logout button, which the app renders only for a live session.
    name: 'cand-home',
    fixture: 'raw',
    routeId: 'CandAppHome',
    contentTestId: testIds.candidate.home.statusMessage,
    postLoginTestId: testIds.candidate.home.logout
  },
  {
    // Anchor on a profile info item — one per editable info question, several in the base dataset — rather than on the profile heading, which renders from a static i18n title before any of the candidate's own data mounts.
    // Marker: the immutable-nominations section, which exists only for a nominated, authenticated candidate.
    name: 'cand-profile',
    fixture: 'raw',
    routeId: 'CandAppProfile',
    contentTestId: testIds.candidate.profile.infoItem,
    postLoginTestId: testIds.candidate.profile.nominations
  },
  {
    // Anchor on a question CARD, and expand every category expander first.
    // This is not a convenience: `Expander` renders its body only when open and `defaultExpanded` is true only for categories with unanswered questions, so on a complete candidate every card is ABSENT FROM THE DOM until expanded.
    // Anchoring on the list wrapper instead would resolve against an accordion of collapsed headers and scan a surface with no cards in it.
    // Marker: the list wrapper itself, which the protected route alone renders.
    name: 'cand-questions',
    fixture: 'raw',
    routeId: 'CandAppQuestions',
    contentTestId: testIds.candidate.questions.card,
    postLoginTestId: testIds.candidate.questions.list,
    reach: async (page) => {
      await page
        .getByTestId(testIds.candidate.questions.list)
        .waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
      await expandEveryCategory(page);
    }
  },
  {
    // Reached by WALKING the expanded overview through the questions-overview fixture, never by a constructed URL: `/candidate/questions/[questionId]` carries the internal database id, and the suite knows candidates and questions by seed `external_id` only — there is no fixture that could build this path. The fixture's `goToQuestion` owns the expand-all-then-click walk.
    // Anchor on a question choice, which exists only once the question's input has mounted; the question heading renders from the loader before it.
    // Marker: the save button, which only the editing (authenticated) view has.
    name: 'cand-question',
    fixture: 'raw',
    routeId: 'CandAppQuestions',
    contentTestId: testIds.voter.questions.answerOption,
    postLoginTestId: testIds.candidate.questions.saveButton,
    reach: async (page) => {
      await page
        .getByTestId(testIds.candidate.questions.list)
        .waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
      await createCandidateQuestionsOverviewPage(page).goToQuestion(0);
      await page.waitForURL(/\/candidate\/questions\/[^/?#]+/, { timeout: TIMEOUTS.slowPage });
    }
  },
  {
    // Anchor on the rendered entity-details article, NOT on `candidate-preview-container`. MEASURED: the preview template wraps its loading, error and success branches in that one container, so the container testid resolves while `<Loading>` is still inside it (anchorText "Loading…", no h1) and the scan reads a spinner. The article renders only on the success branch of the same template, so it is the anchor that means what the container appears to mean. The visual baselines' use of the container is not a precedent here — a screenshot of a spinner fails, a scan of one passes.
    // Marker: the container, which is a fine IDENTITY proof (the protected preview route is the only thing that renders it) even though it is a bad ANCHOR.
    name: 'cand-preview',
    fixture: 'raw',
    routeId: 'CandAppPreview',
    contentTestId: testIds.voter.results.entityDetails,
    postLoginTestId: testIds.candidate.preview.container
  },
  {
    // Anchor on the new-password field: the settings form's inputs mount with the candidate's own settings data, while the "Settings" heading is a static i18n title that renders before it.
    // RE-ANCHORED from `settings.currentPassword` by 157-10 branch (a), which deleted that field. `newPassword` is rendered by the SAME form template, in the same section, on the same load — so it satisfies the identical mounts-with-data property the paragraph above relies on. The anchor is load-bearing, not a passing mention: dropping it outright would let the scan run against the static heading.
    // Marker: the update-password submit, which only the authenticated form has.
    name: 'cand-settings',
    fixture: 'raw',
    routeId: 'CandAppSettings',
    contentTestId: testIds.candidate.settings.newPassword,
    postLoginTestId: testIds.candidate.settings.updateButton
  },
  {
    // The nav drawer, opened over the candidate home route THROUGH THE FIXTURE.
    // A bare `getByTestId('nav-menu-toggle').click()` is a measured NO-OP at both 1280×720 and 390×844, on both halves of the app: the toggle is server-rendered before its `onclick` is hydrated, so a click inside that gap does nothing and `nav-menu` stays hidden (sampled at 0/30/80/150/400/1200 ms — it never opens). The fixture wraps click-and-assert in a retrying block and owns that race; it is also what two existing journeys already use, so this entry adds no new hydration knowledge to the suite. Anchor on a nav menu item, which exists only once the drawer is actually open.
    // Marker: the candidate settings nav item, rendered by CandidateNav — the authenticated app's own navigation, not the public header.
    name: 'cand-nav-menu',
    fixture: 'raw',
    routeId: 'CandAppHome',
    contentTestId: testIds.shared.navigation.menuItem,
    postLoginTestId: testIds.candidate.nav.settings,
    reach: async (page) => {
      await page
        .getByTestId(testIds.candidate.home.statusMessage)
        .waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
      await createNavMenu(page).openMobileNav();
    }
  }
];

/**
 * Expand EVERY category expander on the questions overview.
 *
 * Mirrors `candidateQuestionsOverviewPage.goToQuestion`'s first step rather than reaching for a private helper: an already-open expander's checkbox is left checked by `check()`, so this is idempotent. The loop is bounded by a count read once up front — no polling, no fixed-duration wait.
 */
async function expandEveryCategory(page: Page): Promise<void> {
  const expanders = page.getByTestId(testIds.candidate.questions.categoryExpander);
  const expanderCount = await expanders.count();
  for (let index = 0; index < expanderCount; index++) {
    const checkbox = expanders.nth(index).getByRole('checkbox').first();
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  }
}

/**
 * Adapt a candidate entry to the shared core's `RawAxeRoute`, composing the entry's own `reach`, the reach proof and — on a dark twin — the dark-theme guard into the single `settle` the core calls.
 *
 * The composition is where the reach proof and the theme claim become structural: the core runs `settle` first and the content anchor last, so both proofs are taken from the REACHED document and asserted BEFORE the scan — and no entry can opt out of either, because entries do not supply `settle` at all.
 *
 * Both proofs run AFTER `reach` rather than immediately after the `goto`. That ordering is load-bearing for the two entries whose target is not the URL they open (`cand-question` walks to a per-question route, `cand-nav-menu` opens the drawer), and it is what lets the dark guard read the persistent layout chrome: that chrome is not in the document yet at `goto` time, and the guard reads it with `querySelector`, so an early call would compare against `null`.
 */
function toScanEntry(entry: CandidateAxeRoute, label: string, dark: boolean): RawAxeRoute {
  return {
    name: entry.name,
    fixture: 'raw',
    routeId: entry.routeId,
    contentTestId: entry.contentTestId,
    settle: async (page) => {
      await entry.reach?.(page);
      await assertCandidateReach(page, entry, label);
      await assertDarkThemeIfDark(page, dark);
    }
  };
}

/**
 * Run the shared dark-theme guard on a dark twin, and nothing on a light one.
 *
 * The branch lives here, at module scope, so no `if` sits inside a `test()` body (playwright/no-conditional-in-test) and so the two runners below stay a single shared shape rather than two divergent ones.
 */
async function assertDarkThemeIfDark(page: Page, dark: boolean): Promise<void> {
  if (!dark) return;
  await assertDarkThemeApplied(page);
}

// THEME COVERAGE — complete, and stricter than the voter half by one deliberate step. Every entry emits a light scan and a `-dark` twin, and EVERY dark twin runs `assertDarkThemeApplied` before scanning. On the voter side only the fixture-driven twins do, because its raw twins emulate dark before their own `goto` and have no walked-in-light document to strand. Here the twins take a born-dark browser CONTEXT via `use`, so the whole authenticated walk — layout chrome included — is dark from the first paint, and the guard pins that rather than assuming it. See `assertDarkThemeApplied` for the 30-stale-element measurement that makes the difference between the two mechanisms load-bearing.

for (const entry of CANDIDATE_AXE_ROUTES) {
  test(`axe accessibility scan — ${entry.name}`, async ({ page }, testInfo) => {
    await page.goto(buildRoute({ route: entry.routeId, locale: 'en' }));
    await assertAxeScan(page, toScanEntry(entry, entry.name, false), testInfo, entry.name);
  });

  // Dark twin. The anonymous describe scopes `colorScheme: 'dark'` to this one test without adding a title segment — the same idiom the voter spec uses for its fixture-driven twins, and for the same reason: the browser CONTEXT is created dark, so the authenticated document is dark from its first paint rather than being flipped after the fact.
  test.describe(() => {
    test.use({ colorScheme: 'dark' });

    test(`axe accessibility scan — ${entry.name} (dark)`, async ({ page }, testInfo) => {
      const label = `${entry.name}-dark`;
      await page.goto(buildRoute({ route: entry.routeId, locale: 'en' }));
      await assertAxeScan(page, toScanEntry(entry, label, true), testInfo, label);
    });
  });
}
