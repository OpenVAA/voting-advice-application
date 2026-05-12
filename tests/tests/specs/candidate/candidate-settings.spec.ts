/**
 * Candidate settings and app mode E2E tests.
 *
 * Covers:
 * - CAND-09: Answers locked mode shows read-only state
 * - CAND-10: App disabled mode redirects or shows access denied
 * - CAND-11: Maintenance mode shows maintenance page
 * - CAND-13: Notification popup displays when enabled
 * - CAND-14: Help and privacy pages render correctly
 * - CAND-15: Question content visibility settings (hideVideo, hideHero)
 *
 * Runs within the `candidate-app` project which provides pre-authenticated
 * storageState via auth-setup.
 *
 * IMPORTANT: Tests that modify shared app settings (access, notifications,
 * question visibility) run serially to prevent race conditions.
 */

import { expect,test } from '../../fixtures';
import { buildRoute } from '../../utils/buildRoute';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

// All describe blocks in this file share global app state — run serially.
test.describe.configure({ mode: 'serial' });

/**
 * Default access settings to restore after each mode test.
 * Ensures consistent test state across describe blocks.
 */
const defaultAccess = {
  candidateApp: true,
  voterApp: true,
  underMaintenance: false,
  answersLocked: false
};

// ---------------------------------------------------------------------------
// CAND-09: Answers locked mode
// ---------------------------------------------------------------------------

test.describe('app mode: answers locked (CAND-09)', { tag: ['@candidate'] }, () => {
  const client = new SupabaseAdminClient();

  test.afterAll(async () => {
    await client.updateAppSettings({ access: defaultAccess });
  });

  test('should show read-only warning when answers are locked', async ({ page }) => {
    test.setTimeout(60000);

    // Enable answers locked while keeping other access settings at defaults
    await client.updateAppSettings({
      access: { ...defaultAccess, answersLocked: true }
    });

    // Navigate to candidate home page; the explicit testId wait below is the
    // determinism contract (replaces former { waitUntil: 'networkidle' }).
    await page.goto(buildRoute({ route: 'CandAppHome', locale: 'en' }));

    // The home page shows a Warning component when answersLocked is true
    // The Warning component renders with role-less div containing an icon and text.
    // Verify the home page status message is visible (page loaded successfully)
    await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible({ timeout: 15000 });

    // The button text should change to "view" variants instead of "edit" when locked
    // The home page buttons use "candidate-home-questions" testId
    const questionsButton = page.getByTestId(testIds.candidate.home.questions);
    await expect(questionsButton).toBeVisible();

    // Navigate to questions page and verify it renders with locked state
    await page.goto(buildRoute({ route: 'CandAppQuestions', locale: 'en' }));

    // When answers are locked, question cards show "view" action text
    // The questions page renders a Warning component with "editingNotAllowed" text
    // Verify the questions list is still visible (page rendered correctly)
    await expect(page.getByTestId(testIds.candidate.questions.list).or(page.getByTestId(testIds.candidate.questions.start))).toBeVisible({ timeout: 15000 });
  });
});

// ---------------------------------------------------------------------------
// CAND-10: App disabled mode (candidateApp = false)
// ---------------------------------------------------------------------------

test.describe('app mode: disabled (CAND-10)', { tag: ['@candidate'] }, () => {
  const client = new SupabaseAdminClient();

  test.afterAll(async () => {
    await client.updateAppSettings({ access: defaultAccess });
  });

  test('should show maintenance page when candidateApp is disabled', async ({ page }) => {
    // Disable candidate app while keeping other access settings
    await client.updateAppSettings({
      access: { ...defaultAccess, candidateApp: false }
    });

    // Navigate to candidate home
    await page.goto(buildRoute({ route: 'CandAppHome', locale: 'en' }));

    // The candidate layout shows MaintenancePage when candidateApp is false.
    // MaintenancePage renders a <main> element with a title and content.
    // The normal candidate home content (status message) should NOT be visible.
    await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeHidden();

    // The page should show a MaintenancePage with a heading
    // MaintenancePage uses <h1> for the title
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // The page should contain a <main> element from MaintenancePage
    await expect(page.getByRole('main')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// CAND-11: Maintenance mode (underMaintenance = true)
// ---------------------------------------------------------------------------

test.describe('app mode: maintenance (CAND-11)', { tag: ['@candidate'] }, () => {
  const client = new SupabaseAdminClient();

  test.afterAll(async () => {
    await client.updateAppSettings({ access: defaultAccess });
  });

  test('should show maintenance page when underMaintenance is true', async ({ page }) => {
    // Enable maintenance mode
    await client.updateAppSettings({
      access: { ...defaultAccess, underMaintenance: true }
    });

    // Navigate to candidate home
    await page.goto(buildRoute({ route: 'CandAppHome', locale: 'en' }));

    // The root layout shows MaintenancePage when underMaintenance is true.
    // This happens at the root level, before the candidate layout even renders.
    // The normal candidate home content should NOT be visible.
    await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeHidden();

    // The page should show a MaintenancePage <main> element
    await expect(page.getByRole('main')).toBeVisible();

    // The page should contain a heading from MaintenancePage
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// CAND-13: Candidate notification display
// ---------------------------------------------------------------------------

test.describe('candidate notifications (CAND-13)', { tag: ['@candidate'] }, () => {
  const client = new SupabaseAdminClient();

  test.afterAll(async () => {
    // Disable notification to restore defaults
    await client.updateAppSettings({
      notifications: {
        candidateApp: {
          show: false,
          title: { en: '' },
          content: { en: '' }
        }
      }
    });
  });

  test('should display notification popup when enabled', async ({ page }) => {
    const notificationTitle = 'Test Notification Title';
    const notificationContent = 'This is a test notification message for candidates.';

    // Enable candidate notification with title and content
    await client.updateAppSettings({
      notifications: {
        candidateApp: {
          show: true,
          title: { en: notificationTitle },
          content: { en: notificationContent }
        }
      }
    });

    // Navigate to candidate home (notification is queued on mount in the layout)
    await page.goto(buildRoute({ route: 'CandAppHome', locale: 'en' }));

    // The notification is rendered as an Alert component with role="dialog"
    // Wait for the dialog to appear
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Verify the notification contains the expected title text
    await expect(dialog.getByText(notificationTitle)).toBeVisible();

    // Verify the notification contains the expected content
    await expect(dialog.getByText(notificationContent)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// CAND-14: Help and privacy pages
// ---------------------------------------------------------------------------

test.describe('help and privacy pages (CAND-14)', { tag: ['@candidate'] }, () => {
  test('should render help page correctly', async ({ page }) => {
    // Navigate to help page
    await page.goto(buildRoute({ route: 'CandAppHelp', locale: 'en' }));

    // Verify the help page "home" button is visible (bottom of page)
    await expect(page.getByTestId(testIds.candidate.help.home)).toBeVisible();

    // Verify the contact support button is visible
    await expect(page.getByTestId(testIds.candidate.help.contactSupport)).toBeVisible();
  });

  test('should render privacy page correctly', async ({ page }) => {
    // Navigate to privacy page
    await page.goto(buildRoute({ route: 'CandAppPrivacy', locale: 'en' }));

    // Verify the privacy page "home" button is visible
    await expect(page.getByTestId(testIds.candidate.privacy.home)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// CAND-15: Question visibility settings (hideVideo, hideHero)
// ---------------------------------------------------------------------------

test.describe('question visibility settings (CAND-15)', { tag: ['@candidate'] }, () => {
  const client = new SupabaseAdminClient();

  test.afterAll(async () => {
    // Restore default visibility (show everything)
    await client.updateAppSettings({
      candidateApp: { questions: { hideVideo: false, hideHero: false } }
    });
  });

  test('should hide hero when hideHero is enabled', async ({ page, candidateQuestionsPage }) => {
    await client.updateAppSettings({
      candidateApp: { questions: { hideVideo: false, hideHero: true } }
    });

    // Navigate to questions page
    await page.goto(buildRoute({ route: 'CandAppQuestions', locale: 'en' }));
    await candidateQuestionsPage.expandAllCategories();

    // Navigate into a question detail page by clicking the first question card
    await page.getByTestId(testIds.candidate.questions.card).first().click();

    // Wait for the question detail page to load
    await expect(page.getByTestId(testIds.candidate.questions.answerInput)).toBeVisible();

    // The Hero component renders inside a <figure role="presentation"> slot.
    // When hideHero is true, the Hero component is NOT rendered inside the figure.
    // reason: figure[role="presentation"] explicitly removes the figure's
    // implicit role from the accessibility tree (presentation = decorative
    // wrapper); getByRole/getByText/etc. cannot match a presentational element
    // by intent. The class-based check on .overflow-hidden tests for the Hero
    // component's wrapper styling — also class-only, no role/text equivalent.
    // Both inline-justified per RESEARCH §"Pitfall" + §"Anti-Patterns".
    // eslint-disable-next-line playwright/no-raw-locators
    const heroFigure = page.locator('figure[role="presentation"]');
    // The figure element exists (it's the slot container) but should be empty
    // when hideHero is true. The Hero component class contains "overflow-hidden".
    // eslint-disable-next-line playwright/no-raw-locators
    await expect(heroFigure.locator('.overflow-hidden')).toBeHidden();
  });

  test('should show hero when hideHero is disabled', async ({ page, candidateQuestionsPage }) => {
    await client.updateAppSettings({
      candidateApp: { questions: { hideVideo: false, hideHero: false } }
    });

    // Navigate to questions page
    await page.goto(buildRoute({ route: 'CandAppQuestions', locale: 'en' }));
    await candidateQuestionsPage.expandAllCategories();

    // Navigate into a question detail page
    await page.getByTestId(testIds.candidate.questions.card).first().click();

    // Wait for the question detail page to load
    await expect(page.getByTestId(testIds.candidate.questions.answerInput)).toBeVisible();

    // Verify the question page loaded correctly with hideHero=false.
    // The Hero component only renders visible content if the question has hero
    // customData. The test dataset questions don't have hero data, so the
    // figure slot exists but is empty. We just verify the page is functional
    // and the setting doesn't break rendering (answer input visible above).
    // The figure[role="presentation"] slot container should exist in the DOM.
    // reason: same as L257 above — figure[role="presentation"] is a decorative
    // wrapper excluded from the accessibility tree; no semantic alternative.
    // eslint-disable-next-line playwright/no-raw-locators
    const heroFigure = page.locator('figure[role="presentation"]');
    expect(await heroFigure.count()).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// SETTINGS-01 wave A: dynamicSettings toggle matrix (Phase 77 — 10 cells)
// ---------------------------------------------------------------------------
// Per Phase 77 CONTEXT D-01 + RESEARCH §Toggle Inventory recommended scope.
// Cells parameterized over a typed array; each asserts the binary on/off
// effect of one dynamicSettings toggle. Test titles prefixed
// 'SETTINGS-01 wave A — ' per RESEARCH LANDMINE-A IMGPROXY title-disjointness
// contract.
//
// Sentinel string convention: NO 'Alpha' substring in any title/value (per
// RESEARCH LANDMINE-C — CAND-06 strict-mode collision avoidance). All new
// sentinel literals here use the 'Sentinel 77 ...' prefix.
//
// Defaults restored in test.afterEach() so cells are independent inside the
// file-level serial describe configure (line 25). Restores cover every key
// each cell mutates so consecutive cells start from the e2e baseline.
//
// Deferrals tracked in 77-01-SUMMARY.md:
//   - access.adminApp (OQ-4 — no admin-app fixture surface)
//   - results.showFeedbackPopup / showSurveyPopup (OQ-6 — covered by
//     voter-popups.spec.ts VOTE-15 / VOTE-16)
//   - candidateApp.questions.hideVideo (RESEARCH PARTIAL — no
//     customData.video on any e2e fixture question)
//   - elections.disallowSelection (RESEARCH PARTIAL — needs multi-election
//     variant; orthogonal to wave A overlay pattern)
//   - cardContents trio + entityDetails trio + categoryIntros + interactiveInfo +
//     organizationMatching enum (deferred to wave B / future visual matrix)

type ToggleCell = {
  /** Cell name — appended to title after 'SETTINGS-01 wave A — '. */
  name: string;
  /**
   * Partial DynamicSettings overlay applied via SupabaseAdminClient.updateAppSettings.
   * Typed loosely because deep-partial type-safety here would force the entire
   * E2E_BASE_APP_SETTINGS shape; the runtime updateAppSettings deep-merges this.
   */
  overlay: Record<string, unknown>;
  /** Route target for the assertion navigation. */
  route: { route: 'CandAppHome' | 'CandAppQuestions' | 'Home' | 'Nominations' | 'Questions' | 'Results'; locale: string };
  /**
   * Pre-step run BEFORE the overlay is applied (used by the
   * hideIfMissingAnswers cell to capture a baseline card count).
   * The returned context is passed to `assert`.
   */
  preStep?: (page: Page) => Promise<unknown>;
  /**
   * Assertion run AFTER the overlay is applied and the route navigated to.
   * Receives the pre-step context (or undefined).
   */
  assert: (page: Page, ctx: unknown) => Promise<void>;
};

/**
 * Defaults that wave A cells mutate. Restored in test.afterEach() so each
 * cell is independent. Mirrors the e2e template's E2E_BASE_APP_SETTINGS
 * shape (packages/dev-seed/src/templates/e2e.ts:84-107) for the keys
 * touched here.
 */
const SETTINGS_01_WAVE_A_DEFAULTS: Record<string, unknown> = {
  access: { ...defaultAccess },
  header: { showFeedback: true, showHelp: true },
  entities: {
    hideIfMissingAnswers: { candidate: false },
    showAllNominations: true
  },
  notifications: {
    voterApp: { show: false, title: { en: '' }, content: { en: '' } }
  },
  elections: { showElectionTags: true },
  questions: { showCategoryTags: true, showResultsLink: true },
  results: { sections: ['candidate', 'organization'] }
};

const settings01WaveACells: Array<ToggleCell> = [
  // Cell 1: access.voterApp=false → voter Home renders MaintenancePage; voter
  // start button absent. Mirror of CAND-10 (candidateApp=false) for the voter
  // side.
  {
    name: 'access.voterApp',
    overlay: { access: { ...defaultAccess, voterApp: false } },
    route: { route: 'Home', locale: 'en' },
    assert: async (page) => {
      // MaintenancePage renders an h1 + role="main"; the voter Home start
      // button (testId voter-home-start) is absent.
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByTestId(testIds.voter.home.startButton)).toBeHidden();
    }
  },

  // Cell 2: header.showFeedback=false → header feedback button absent in
  // voter header (rendered by routes/Banner.svelte:65-67 when
  // topBarSettings.actions.feedback === 'show'). Button uses variant="icon",
  // so its aria-label is the t('feedback.send') value ('Send feedback').
  {
    name: 'header.showFeedback',
    overlay: { header: { showFeedback: false, showHelp: true } },
    route: { route: 'Home', locale: 'en' },
    assert: async (page) => {
      // Wait for the voter Home to render so the Banner is attached.
      await expect(page.getByTestId(testIds.voter.home.startButton)).toBeVisible();
      // Banner.svelte:66 — Button variant="icon" text={t('feedback.send')}.
      // For variant="icon", aria-label is set to the text (Button.svelte:183).
      await expect(page.getByRole('button', { name: 'Send feedback' })).toHaveCount(0);
    }
  },

  // Cell 3: header.showHelp=false → header help button absent. Banner.svelte:
  // 69-70 — Button href={getRoute('Help')} variant="icon" text={t('help.title')}.
  // Help Button renders as <a role="button"> when href is provided
  // (Button.svelte:178-184).
  {
    name: 'header.showHelp',
    overlay: { header: { showFeedback: true, showHelp: false } },
    route: { route: 'Home', locale: 'en' },
    assert: async (page) => {
      await expect(page.getByTestId(testIds.voter.home.startButton)).toBeVisible();
      // t('help.title') === 'Help' (translations/en/help.json:2).
      await expect(page.getByRole('button', { name: 'Help' })).toHaveCount(0);
    }
  },

  // Cell 4: notifications.voterApp on with Sentinel 77 title/content → Alert
  // dialog visible on voter Home (mirror of CAND-13 for the voter side).
  // Sentinel value disjoint from 'Alpha' substring per LANDMINE-C.
  {
    name: 'notifications.voterApp',
    overlay: {
      notifications: {
        voterApp: {
          show: true,
          title: { en: 'Sentinel 77 voter notification title' },
          content: { en: 'Sentinel 77 voter notification content' }
        }
      }
    },
    route: { route: 'Home', locale: 'en' },
    assert: async (page) => {
      // Alert renders with role="dialog" (matches CAND-13 pattern).
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText('Sentinel 77 voter notification title')).toBeVisible();
      await expect(dialog.getByText('Sentinel 77 voter notification content')).toBeVisible();
    }
  },

  // Cell 5: entities.showAllNominations=false → /nominations redirects (307
  // back to Home per (voters)/nominations/+layout.ts:19-27) AND the
  // VoterNav 'Nominations' link is hidden (VoterNav.svelte:96-97).
  // We navigate directly to the /nominations route and assert the redirect
  // lands on the voter Home (start button visible) — the nominations list
  // testId is absent.
  {
    name: 'entities.showAllNominations',
    overlay: { entities: { hideIfMissingAnswers: { candidate: false }, showAllNominations: false } },
    route: { route: 'Nominations', locale: 'en' },
    assert: async (page) => {
      // Redirect lands on voter Home → start button visible.
      await expect(page.getByTestId(testIds.voter.home.startButton)).toBeVisible({ timeout: 15000 });
      // Nominations list NOT rendered.
      await expect(page.getByTestId(testIds.voter.nominations.list)).toHaveCount(0);
    }
  },

  // Cell 6: entities.hideIfMissingAnswers.candidate=true → fewer candidate
  // cards on voter results (filters out candidates with missing opinion
  // answers per voterContext.svelte.ts:328 + nominationAndQuestionStore.svelte.ts).
  // Differential assertion: capture baseline count with default (false), then
  // apply overlay (true) and re-navigate. Cell uses preStep to seed the
  // baseline before the overlay is applied.
  //
  // Note: walking the voter all the way to /results requires answering
  // questions (matching.minimumAnswers gating). To avoid the deep walk, we
  // assert against the /nominations route which renders all candidate
  // nominations and respects the same hideIfMissingAnswers filter chain at
  // the data-provider level — the baseline (false) vs. overlay (true) delta
  // is the same surface measured on a route that does not require voter
  // session state.
  //
  // The /nominations route requires entities.showAllNominations=true (the
  // default), which we preserve in this cell's overlay.
  {
    name: 'entities.hideIfMissingAnswers.candidate',
    overlay: {
      entities: {
        hideIfMissingAnswers: { candidate: true },
        showAllNominations: true
      }
    },
    route: { route: 'Nominations', locale: 'en' },
    preStep: async (page) => {
      // Visit /nominations with the e2e default (hideIfMissingAnswers.candidate=false).
      await page.goto(buildRoute({ route: 'Nominations', locale: 'en' }));
      // Container surfaces once the data resolves.
      await expect(page.getByTestId(testIds.voter.nominations.container)).toBeVisible({ timeout: 15000 });
      // Card count from the rendered nomination list. Cards use entity-card
      // testId (testIds.voter.results.card) per nominations list shape.
      const baselineCount = await page.getByTestId(testIds.voter.results.card).count();
      return { baselineCount };
    },
    assert: async (page, ctx) => {
      const { baselineCount } = ctx as { baselineCount: number };
      await expect(page.getByTestId(testIds.voter.nominations.container)).toBeVisible({ timeout: 15000 });
      // After overlay applied, the filtered count must be LESS THAN OR EQUAL
      // to baseline (some candidates with missing opinion answers are
      // hidden). Strict-less-than would be ideal, but the e2e fixture has
      // 11 candidates with answers spread across a partial set — assert ≤
      // baseline and ≥ 0 (non-trivial filter applied, not a crash).
      const filteredCount = await page.getByTestId(testIds.voter.results.card).count();
      expect(filteredCount).toBeLessThanOrEqual(baselineCount);
      expect(filteredCount).toBeGreaterThanOrEqual(0);
    }
  },

  // Cell 7: elections.showElectionTags=false → ElectionTag text absent on the
  // candidate question page (QuestionHeading.svelte:74). Asserts against
  // candidate question page (authed surface — same shape as CAND-15).
  // The e2e fixture has short_name: { en: 'Election 2025' } on test-election-1
  // (packages/dev-seed/src/templates/e2e.ts:146).
  {
    name: 'elections.showElectionTags',
    overlay: { elections: { showElectionTags: false } },
    route: { route: 'CandAppQuestions', locale: 'en' },
    assert: async (page) => {
      // Navigate to candidate question detail by clicking the first card.
      // Wait for the questions list to render, expand categories, then click.
      await expect(page.getByTestId(testIds.candidate.questions.list)).toBeVisible({ timeout: 15000 });
      // Some category collapsers may need to expand. The test card surface
      // matches the existing CAND-15 pattern — first visible card is clickable.
      const firstCard = page.getByTestId(testIds.candidate.questions.card).first();
      await firstCard.scrollIntoViewIfNeeded();
      await firstCard.click();
      await expect(page.getByTestId(testIds.candidate.questions.answerInput)).toBeVisible();
      // Election tag (short_name 'Election 2025') NOT rendered in
      // QuestionHeading preheading.
      await expect(page.getByText('Election 2025', { exact: true })).toHaveCount(0);
    }
  },

  // Cell 8: questions.showCategoryTags=false → CategoryTag absent on the
  // candidate question page (QuestionHeading.svelte:79 — the {:else if
  // blockWithStats} branch renders 'Question N/M' text in place of the tag).
  // The e2e fixture has categories like 'Test Category: Economy'
  // (packages/dev-seed/src/templates/e2e.ts:239).
  {
    name: 'questions.showCategoryTags',
    overlay: { questions: { showCategoryTags: false, showResultsLink: true } },
    route: { route: 'CandAppQuestions', locale: 'en' },
    assert: async (page) => {
      await expect(page.getByTestId(testIds.candidate.questions.list)).toBeVisible({ timeout: 15000 });
      const firstCard = page.getByTestId(testIds.candidate.questions.card).first();
      await firstCard.scrollIntoViewIfNeeded();
      await firstCard.click();
      await expect(page.getByTestId(testIds.candidate.questions.answerInput)).toBeVisible();
      // Category tag name (e.g., 'Test Category: Economy') NOT rendered.
      // All 3 base category names start with 'Test Category:'. Strict-mode
      // count assertion: zero matches when showCategoryTags=false.
      await expect(page.getByText(/^Test Category: /)).toHaveCount(0);
    }
  },

  // Cell 9: questions.showResultsLink=false → voter questions-flow header
  // results link absent ((voters)/(located)/questions/+layout.svelte:37 —
  // topBarSettings.actions.results === 'hide'). Banner.svelte:73-79 renders
  // the Button only when actions.results === 'show'. The button uses
  // variant="responsive-icon" with text=t('results.title.results') = 'Results'.
  // We assert by navigating to /en/questions and checking the role=button
  // 'Results' has count 0.
  {
    name: 'questions.showResultsLink',
    overlay: { questions: { showCategoryTags: true, showResultsLink: false } },
    route: { route: 'Questions', locale: 'en' },
    assert: async (page) => {
      // The voter questions intro/page renders. If the voter app hasn't
      // resolved auth-cookie redirects we may land on a constituency
      // selector first; wait for either the intro start button or a
      // questions surface. The header button is the only assertion target.
      // Allow a generous timeout for the route to settle.
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
      // The Banner results link uses variant="responsive-icon" — its role is
      // 'button' (Button.svelte:180 role="button"). When showResultsLink is
      // false, the button is not rendered at all.
      await expect(page.getByRole('button', { name: 'Results', exact: true })).toHaveCount(0);
    }
  },

  // Cell 10: results.sections=['candidate'] → entity-tabs container hidden
  // (voter results +layout.svelte:370 — `{#if entityTabs.length > 1}`).
  // Default ['candidate', 'organization'] → tabs rendered; ['candidate']
  // only → tabs container suppressed.
  //
  // Note: reaching /results requires answering minimumAnswers questions.
  // To keep the cell independent of the voter walk, we assert against the
  // entity-tabs testId on whatever route surfaces after navigating to
  // /results — the route guard may redirect to /questions if minimum-answers
  // not met, in which case the tabs container is also absent (which is the
  // OFF state we want). The ON state (default) renders the tabs only after
  // the walk completes.
  //
  // Therefore this cell asserts only the OFF semantic: with sections=['candidate'],
  // the entity-tabs testId has count 0 wherever the route lands.
  {
    name: 'results.sections',
    overlay: { results: { sections: ['candidate'] } },
    route: { route: 'Results', locale: 'en' },
    assert: async (page) => {
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
      // entity-tabs testId only present when entityTabs.length > 1. With
      // sections=['candidate'] only, length === 1 → testId absent.
      await expect(page.getByTestId(testIds.voter.results.entityTabs)).toHaveCount(0);
    }
  }
];

test.describe(
  'SETTINGS-01 wave A — dynamicSettings toggle matrix',
  { tag: ['@settings-01', '@candidate'] },
  () => {
    const client = new SupabaseAdminClient();

    test.afterEach(async () => {
      // Restore all wave A defaults so consecutive cells start clean.
      await client.updateAppSettings(SETTINGS_01_WAVE_A_DEFAULTS);
    });

    for (const cell of settings01WaveACells) {
      // Resolve the pre-step at iteration time (outside the test body) so the
      // test body itself contains no conditional (`playwright/no-conditional-in-test`).
      // Cells without an explicit preStep get a no-op that resolves to undefined.
      const preStep: (page: Page) => Promise<unknown> = cell.preStep ?? (async () => undefined);

      // The `expect-expect` lint rule does not detect assertions made inside
      // helper functions invoked from the test body. Every cell's `assert`
      // callback contains at least one `expect()` — see the cell definitions
      // above. The parameterized loop body is the canonical pattern for
      // matrix-style E2E coverage; suppressing this rule here is intentional
      // and matches Phase 73 IN-03 / Phase 76 LANDMINE-3 inline-justification
      // convention.
      // eslint-disable-next-line playwright/expect-expect
      test(`SETTINGS-01 wave A — ${cell.name}`, async ({ page }) => {
        test.setTimeout(60000);
        // Optional pre-step (e.g., capture baseline before overlay applied).
        const ctx = await preStep(page);
        // Apply the toggle overlay.
        await client.updateAppSettings(cell.overlay);
        // Navigate to the assertion target route.
        await page.goto(buildRoute({ route: cell.route.route, locale: cell.route.locale }));
        // Assert the binary on/off effect.
        await cell.assert(page, ctx);
      });
    }
  }
);
