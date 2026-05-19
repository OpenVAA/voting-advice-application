/**
 * startFromConstituencyGroup variant E2E tests.
 *
 * Phase 86.1 post-fix rewrite. Test contract per user spec (2026-05-17):
 *   - 2 elections — E1 (Test Election 2025) and E2 (Test Election 2026)
 *   - E1's only constituency group is REGIONS
 *   - E2's only constituency group is MUNICIPALITIES
 *   - `elections.disallowSelection = true` — election selector is skipped
 *     entirely; elections are auto-implied from the picked constituency
 *   - `elections.startFromConstituencyGroup = <municipalities-group-id>`
 *     — voter picks a municipality FIRST, then is taken straight to /questions
 *   - All municipalities except one (Orphan Municipality) are children of
 *     regions; each region has at least one child municipality.
 *
 * Branch contract this variant proves:
 *   (a) Voter picks ORPHAN MUNICIPALITY → no region implied for E1 → only E2
 *       appears in the Results page election selector.
 *   (b) Voter picks a NON-ORPHAN MUNICIPALITY → parent region implied for E1
 *       → both E1 and E2 appear in the Results page election selector.
 *
 * The seed for this contract lives at
 * `tests/tests/setup/templates/variant-startfromcg.ts`. The template was
 * updated alongside this rewrite to drop the municipalities group from E1
 * (E1 retains only the regions group); the orphan municipality and per-
 * region child-municipality assignments were already in place.
 *
 * The `startFromConstituencyGroup` setting is set in beforeAll after
 * querying for the municipalities constituency group's database ID
 * (not externalId), per pre-existing pattern; the matrix-cell describe
 * at the bottom of this file retains its own pre-existing setting overrides
 * (disallowSelection:false) for the orthogonal E2E-04 cell-5 contract that
 * keeps the election selector page in play.
 *
 * Runs within the `variant-startfromcg` project which depends on
 * `data-setup-startfromcg` for dataset loading.
 */

import { expect, test } from '@playwright/test';
import { answerUntilResults } from '../../utils/answerQuestion';
import { buildRoute } from '../../utils/buildRoute';
import { dismissMissingNominationsIfPresent } from '../../utils/missingNominations';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

/**
 * Pick a municipality from the constituency selector by visible name.
 *
 * Hoisted to module scope so the test bodies stay conditional-free. The
 * selector renders as an autocomplete combobox under the Municipalities
 * group label (the only group offered when `startFromConstituencyGroup` is
 * set to the municipalities group's id — see
 * `apps/frontend/src/routes/(voters)/constituencies/+page.svelte:51`).
 */
async function pickMunicipality(page: Page, name: string): Promise<void> {
  const constituenciesList = page.getByTestId(testIds.voter.constituencies.list);
  await expect(constituenciesList).toBeVisible({ timeout: 10_000 });
  const combobox = constituenciesList.getByRole('combobox', { name: /Municipalities/ });
  await combobox.click();
  await combobox.fill(name);
  const listbox = page.getByRole('listbox');
  await listbox.waitFor({ state: 'visible', timeout: 5_000 });
  await listbox.getByRole('option', { name: new RegExp(name) }).click();
  const continueButton = page.getByTestId(testIds.voter.constituencies.continue);
  await expect(continueButton).toBeEnabled();
  await continueButton.click();
}

/**
 * Navigate Home → Intro Start → /constituencies. Hoisted so the orphan and
 * non-orphan tests share the same entry sequence.
 */
async function walkToConstituencySelection(page: Page): Promise<void> {
  await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
  await page.getByTestId(testIds.voter.home.startButton).click();
  const introStart = page.getByTestId(testIds.voter.intro.startButton);
  await introStart.waitFor({ state: 'visible' });
  await introStart.click();
}

/**
 * Return the names of `expectedCount` election options rendered inside the
 * Results page `voter-results-election-select` AccordionSelect.
 *
 * The AccordionSelect collapses to a single visible option when an active
 * election is set in URL/state (the `electionId` persistent search param is
 * typically present on a freshly-loaded /results). To enumerate ALL options
 * the helper clicks the visible (active) option ONCE when the rendered
 * count is below `expectedCount` — clicking an already-active option flips
 * `expanded = true` per `AccordionSelect.svelte:61-69 (activate)`. Clicking
 * a NON-active option in an already-expanded accordion would schedule the
 * counter-productive `setTimeout(() => expanded = false, DELAY.lg)` re-
 * collapse, so the helper gates the click on "is the rendered count short?".
 *
 * The count then settles via `expect(options).toHaveCount(expectedCount)`
 * — Playwright auto-retries the assertion through the slide-in transition,
 * which avoids `page.waitForTimeout` (the lint rule
 * `playwright/no-wait-for-timeout` forbids that).
 */
async function readElectionOptionNames(accordion: Locator, expectedCount: number): Promise<Array<string>> {
  const options = accordion.getByRole('option');
  await options.first().waitFor({ state: 'visible', timeout: 10_000 });
  const initial = await options.count();
  if (initial < expectedCount) {
    await options.first().click({ timeout: 2_000 }).catch(() => null);
  }
  await expect(options).toHaveCount(expectedCount, { timeout: 5_000 });
  const names: Array<string> = [];
  for (let i = 0; i < expectedCount; i++) {
    const raw = (await options.nth(i).textContent()) ?? '';
    names.push(raw.trim());
  }
  return names;
}

/**
 * Common app_settings shape used by the main describe's beforeAll /
 * afterAll. Lifted to a single source of truth so the restore path
 * stays in lockstep with the initial-set path; only `disallowSelection`
 * and `startFromConstituencyGroup` differ per call.
 */
function buildSettings(opts: {
  startFromConstituencyGroup: string | null;
  disallowSelection: boolean;
}): Record<string, unknown> {
  return {
    elections: {
      startFromConstituencyGroup: opts.startFromConstituencyGroup,
      disallowSelection: opts.disallowSelection,
      showElectionTags: true
    },
    questions: {
      categoryIntros: { show: false },
      questionsIntro: { allowCategorySelection: false, show: false },
      showResultsLink: true
    },
    results: {
      sections: ['candidate', 'organization'],
      cardContents: { candidate: ['submatches'], organization: ['children'] },
      showFeedbackPopup: 0,
      showSurveyPopup: 0
    },
    entities: {
      hideIfMissingAnswers: { candidate: false },
      showAllNominations: true
    },
    notifications: { voterApp: { show: false } },
    analytics: { trackEvents: false }
  };
}

test.describe('startFromConstituencyGroup variant', { tag: ['@variant'] }, () => {
  test.describe.configure({ mode: 'serial' });

  let client: SupabaseAdminClient;

  test.beforeAll(async () => {
    client = new SupabaseAdminClient();

    const findResult = await client.findData('constituencyGroups', {
      externalId: { $eq: 'test-cg-municipalities' }
    });
    expect(findResult.type).toBe('success');
    expect(findResult.data).toBeDefined();
    expect(findResult.data!.length).toBeGreaterThan(0);
    const cgDocumentId = findResult.data![0].documentId as string;
    expect(cgDocumentId).toBeTruthy();

    // disallowSelection:true skips /elections entirely (the route's load
    // function redirects to /questions when impliedElectionId resolves —
    // and getImpliedElectionIds always resolves when disallowSelection is
    // truthy, per `apps/frontend/src/lib/utils/route/impliedParams.ts:38`).
    await client.updateAppSettings(
      buildSettings({ startFromConstituencyGroup: cgDocumentId, disallowSelection: true })
    );
  });

  test.afterAll(async () => {
    if (client) {
      await client.updateAppSettings(
        buildSettings({ startFromConstituencyGroup: null, disallowSelection: false })
      );
    }
  });

  test('reversed flow: constituency selector first; elections page bypassed', async ({ page }) => {
    test.setTimeout(30_000);

    await walkToConstituencySelection(page);

    // Constituency selector visible immediately; election selection NOT shown
    // anywhere in the entry path.
    const constituenciesList = page.getByTestId(testIds.voter.constituencies.list);
    await expect(constituenciesList).toBeVisible({ timeout: 10_000 });

    const electionsList = page.getByTestId(testIds.voter.elections.list);
    await expect(electionsList).toBeHidden();

    const municipalityCombobox = constituenciesList.getByRole('combobox', { name: /Municipalities/ });
    await expect(municipalityCombobox).toBeVisible();

    // Pick a non-orphan municipality and Continue. With disallowSelection:true,
    // the /elections load function redirects straight to /questions (the
    // election selector page should never appear).
    await pickMunicipality(page, 'North Municipality A');
    await expect(page).toHaveURL(/\/questions/, { timeout: 10_000 });
    await expect(electionsList).toBeHidden();
  });

  test('orphan municipality → only Election 2026 (E2) in Results election selector', async ({ page }) => {
    test.setTimeout(90_000);

    await walkToConstituencySelection(page);
    await pickMunicipality(page, 'Orphan Municipality');
    await expect(page).toHaveURL(/\/questions/, { timeout: 10_000 });

    // The orphan has no parent region → E1 has no applicable constituency →
    // selectedElections = [E2]. The (located) layout may still open the
    // missing-nominations modal if some chosen elections lack nominations
    // for this constituency; dismiss it transparently.
    await dismissMissingNominationsIfPresent(page);

    await answerUntilResults(page);
    await expect(page).toHaveURL(/\/results/, { timeout: 10_000 });

    const accordion = page.getByTestId(testIds.voter.results.electionAccordion);
    // dataRoot has 2 elections so the accordion is rendered (the wrapping
    // `{#if $dataRoot.elections.length > 1}` is satisfied), but with only
    // E2 in `selectedElections` it offers a single option.
    await expect(accordion).toBeVisible({ timeout: 10_000 });
    const names = await readElectionOptionNames(accordion, 1);
    expect(names, 'orphan flow should leave only Election 2026 selected').toEqual(['Test Election 2026']);

    // Defensive cross-check: even with a hidden/non-rendered option in a
    // collapsed accordion, Playwright's role-tree would surface it — but in
    // the orphan case the option for E1 must not exist at all because E1 is
    // not in `selectedElections`. textContent enumeration via
    // `readElectionOptionNames` is the load-bearing assertion; this is the
    // shape-of-tree confirmation.
    await expect(accordion.getByRole('option', { name: /Election 2025/ })).toHaveCount(0);
  });

  test('non-orphan municipality → both Election 2025 (E1) + Election 2026 (E2) in Results election selector', async ({
    page
  }) => {
    test.setTimeout(90_000);

    await walkToConstituencySelection(page);
    await pickMunicipality(page, 'North Municipality A');
    await expect(page).toHaveURL(/\/questions/, { timeout: 10_000 });

    await dismissMissingNominationsIfPresent(page);

    await answerUntilResults(page);
    await expect(page).toHaveURL(/\/results/, { timeout: 10_000 });

    const accordion = page.getByTestId(testIds.voter.results.electionAccordion);
    await expect(accordion).toBeVisible({ timeout: 10_000 });
    const names = await readElectionOptionNames(accordion, 2);
    expect(names.sort(), 'non-orphan flow should leave BOTH elections selected').toEqual([
      'Test Election 2025',
      'Test Election 2026'
    ]);
  });
});

// ---------------------------------------------------------------------------
// E2E-04 cell 5 (startFromConstituency) — ADDITIVE matrix assertion (Phase 74
// Plan 04 Task 4)
//
// Reuses the startfromcg dataset. The matrix contract (cell 5):
//   (1) constituency selector visible FIRST (reversed flow)
//   (2) elections list HIDDEN at the constituency-pick step
//   (3) After constituency continue → URL transitions to /elections
//
// Mirrors the locator shape used by the existing 'should show constituency
// selection first (reversed flow)' test at lines 211-239 + the
// 'should show election selection after constituency selection' test at
// lines 241-281 (which proves the /elections URL transition after
// constituency-continue).
//
// Settings setup (beforeAll/afterAll) is duplicated from the existing
// describe block because the existing block's afterAll has already
// RESTORED `startFromConstituencyGroup` to null by the time this additive
// block runs. The duplication is intentional and ADDITIVE per Phase 74
// CONTEXT D-05 — it does NOT modify the existing startFromConstituencyGroup
// blocks above.
// ---------------------------------------------------------------------------

test.describe('matrix cell: startFromConstituency (E2E-04 cell 5)', { tag: ['@variant', '@matrix'] }, () => {
  test.describe.configure({ mode: 'serial' });

  let matrixClient: SupabaseAdminClient;

  test.beforeAll(async () => {
    matrixClient = new SupabaseAdminClient();

    // Look up the municipalities constituency group's documentId. Same
    // lookup as line 142-149 of the existing block, repeated locally.
    const findResult = await matrixClient.findData('constituencyGroups', {
      externalId: { $eq: 'test-cg-municipalities' }
    });
    expect(findResult.type).toBe('success');
    expect(findResult.data).toBeDefined();
    expect(findResult.data!.length).toBeGreaterThan(0);
    const cgDocumentId = findResult.data![0].documentId as string;
    expect(cgDocumentId).toBeTruthy();

    await matrixClient.updateAppSettings({
      elections: {
        startFromConstituencyGroup: cgDocumentId,
        disallowSelection: false,
        showElectionTags: true
      },
      questions: {
        categoryIntros: { show: false },
        questionsIntro: { allowCategorySelection: false, show: false },
        showResultsLink: true
      },
      results: {
        sections: ['candidate', 'organization'],
        cardContents: { candidate: ['submatches'], organization: ['children'] },
        showFeedbackPopup: 0,
        showSurveyPopup: 0
      },
      entities: {
        hideIfMissingAnswers: { candidate: false },
        showAllNominations: true
      },
      notifications: { voterApp: { show: false } },
      analytics: { trackEvents: false }
    });
  });

  test.afterAll(async () => {
    if (matrixClient) {
      await matrixClient.updateAppSettings({
        elections: {
          startFromConstituencyGroup: null,
          disallowSelection: false,
          showElectionTags: true
        },
        questions: {
          categoryIntros: { show: false },
          questionsIntro: { allowCategorySelection: false, show: false },
          showResultsLink: true
        },
        results: {
          sections: ['candidate', 'organization'],
          cardContents: { candidate: ['submatches'], organization: ['children'] },
          showFeedbackPopup: 0,
          showSurveyPopup: 0
        },
        entities: {
          hideIfMissingAnswers: { candidate: false },
          showAllNominations: true
        },
        notifications: { voterApp: { show: false } },
        analytics: { trackEvents: false }
      });
    }
  });

  test('startFromConstituency — constituency selector shown first; elections list hidden; constituency URL segment present', async ({
    page
  }) => {
    test.setTimeout(30000);

    // Reversed flow per startFromConstituencyGroup variant: constituency
    // picked FIRST, election auto-bound. Mirrors the locator shape used by
    // the existing 'should show constituency selection first (reversed
    // flow)' test at lines 211-239.

    await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
    await page.getByTestId(testIds.voter.home.startButton).click();

    const introStart = page.getByTestId(testIds.voter.intro.startButton);
    await introStart.waitFor({ state: 'visible' });
    await introStart.click();

    // (1) Constituency selector visible immediately (variant's defining
    // behavior). The constituency-selector combobox lives inside the
    // voter-constituencies-list container (testIds.voter.constituencies.list)
    // — see startfromcg.spec.ts:225-238 for the canonical locator.
    const constituenciesList = page.getByTestId(testIds.voter.constituencies.list);
    const municipalityCombobox = constituenciesList.getByRole('combobox', { name: /Municipalities/ });
    await expect(municipalityCombobox).toBeVisible({ timeout: 5000 });

    // (2) Elections list HIDDEN at this point (variant skips elections step).
    const electionsList = page.getByTestId(testIds.voter.elections.list);
    await expect(electionsList).toBeHidden();

    // Pick a municipality + continue (uses the autocomplete combobox per the
    // existing 'should show election selection after constituency selection'
    // test at startfromcg.spec.ts:248-261 canonical interaction shape).
    await municipalityCombobox.click();
    await municipalityCombobox.fill('North Municipality A');
    const listbox = page.getByRole('listbox');
    await listbox.waitFor({ state: 'visible', timeout: 5000 });
    await listbox.getByRole('option', { name: /North Municipality A/ }).click();
    await page.getByTestId(testIds.voter.constituencies.continue).click();

    // (3) After continue, the URL transitions to /elections (proving the
    // variant bypassed the canonical elections-first step). Mirrors the
    // assertion at startfromcg.spec.ts:265-281.
    await expect(page).toHaveURL(/\/elections/);
    await expect(electionsList).toBeVisible({ timeout: 10000 });
  });
});
