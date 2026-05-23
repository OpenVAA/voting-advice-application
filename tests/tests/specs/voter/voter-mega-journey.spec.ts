/**
 * Voter mega-journey end-to-end spec — Phase 88 Plan 01 Task 4.
 *
 * Authoritative design source: TEST-INVENTORY-REFACTOR-1.md lines 204-378.
 *
 * Structure: ONE serial-describe → ONE long test('full voter journey
 * end-to-end', ...) → many `test.step('<title>', ...)` segments. Per
 * operator USER NOTE on Task 4, the step structure is approximate —
 * bullets from the refactor doc are re-grouped for a smooth continuous
 * walk, preparatory boilerplate from MOVED tests is stripped, and
 * back-and-forth navigation is minimised.
 *
 * Steps fall into three classes:
 *
 *   - MOVED: absorbed from an existing spec (cross-ref to
 *     TEST-INVENTORY.md numbering — e.g. `9.1.1`, `9.9.1`).
 *   - NEW/MOVE: NEW from refactor doc with no clean predecessor in the
 *     existing inventory.
 *   - DEFERRED-88-NN: step exercises behaviour we can't validate today
 *     against the brand-new baseV1 dataset (per Risk #2). The step body
 *     logs a `[deferred-88-nn]` note and returns; the SUMMARY documents
 *     the deferred coverage so 88-02+ tightens once empirically
 *     confirmed.
 *
 *   NOTE on test.fixme(): calling `test.fixme(true, '...')` inside a
 *   test body MARKS THE WHOLE TEST as fixme and TERMINATES execution
 *   immediately. To preserve the chained walk, deferred steps use
 *   `await test.step('[deferred-88-nn] ...', async () => {})` with an
 *   empty body + a console.log note. The test.step still shows up in
 *   the reporter for visibility; 88-02+ replaces the bodies with real
 *   assertions.
 *
 * Running:
 *   yarn test:e2e --project=voter-mega-journey --reporter=list
 *
 * Runs under the `data-setup-baseV1` → `voter-mega-journey` →
 * `data-teardown-baseV1` chain (appended to tests/playwright.config.ts).
 */

import { expect, test } from '@playwright/test';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';

/**
 * Mark a step as deferred to a future 88-NN plan. Logs a single line
 * to stdout so the reporter shows what was deferred without failing
 * the test. The step name itself carries the `[deferred-88-nn]` tag
 * for grep-ability.
 */
async function deferredStep(stepName: string): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(`[deferred-88-nn] ${stepName}`);
}

test.describe('voter mega-journey', () => {
  test.describe.configure({ mode: 'serial' });

  test('full voter journey end-to-end', async ({ page }) => {
    test.setTimeout(180_000); // 3 min ceiling for the full walk

    // ====================================================================
    // STATIC PAGES — refactor-doc:208-216. Absorbs 9.1.1, 9.9.1, 9.9.2, 9.9.3.
    // ====================================================================

    await test.step('static: home page renders + start button (MOVED 9.1.1)', async () => {
      await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
      await expect(page.getByTestId(testIds.voter.home.startButton)).toBeVisible();
    });

    await test.step('static: about page renders correctly (MOVED 9.9.1)', async () => {
      await page.goto(buildRoute({ route: 'About', locale: 'en' }));
      await expect(page.getByTestId(testIds.voter.about.content)).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId(testIds.voter.about.returnButton)).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    await test.step('static: about → back button returns to home (NEW/MOVE refactor-doc:212)', async () => {
      const returnBtn = page.getByTestId(testIds.voter.about.returnButton);
      await returnBtn.click();
      await page.waitForURL((url) => /\/en\/?$/.test(url.toString()), { timeout: 10_000 });
      await expect(page.getByTestId(testIds.voter.home.startButton)).toBeVisible();
    });

    await test.step('static: info page renders correctly (MOVED 9.9.2)', async () => {
      await page.goto(buildRoute({ route: 'Info', locale: 'en' }));
      await expect(page.getByTestId(testIds.voter.info.content)).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId(testIds.voter.info.returnButton)).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    await test.step('static: privacy page renders correctly (MOVED 9.9.3)', async () => {
      await page.goto(buildRoute({ route: 'Privacy', locale: 'en' }));
      await expect(page.getByTestId(testIds.voter.privacy.content)).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId(testIds.voter.privacy.returnButton)).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    // ====================================================================
    // INTRO + ELECTION SELECTION — refactor-doc:218-228
    // ====================================================================

    await test.step('intro: home → start → intro page (NEW/MOVE refactor-doc:218-220)', async () => {
      await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
      await page.getByTestId(testIds.voter.home.startButton).click();
      await page
        .waitForURL((url) => !/\/en\/?$/.test(url.toString()), { timeout: 10_000 })
        .catch(() => null);
    });

    await test.step('intro: intro page continue OR auto-skip to elections (NEW/MOVE refactor-doc:220)', async () => {
      const introStart = page.getByTestId(testIds.voter.intro.startButton);
      const introVisible = await introStart.isVisible({ timeout: 3_000 }).catch(() => false);
      if (introVisible) {
        await introStart.click();
      }
    });

    await test.step('elections: should show election selector (NEW/MOVE refactor-doc:222-224)', async () => {
      const electionsList = page.getByTestId(testIds.voter.elections.list);
      await expect(electionsList).toBeVisible({ timeout: 10_000 });
    });

    await test.step(
      '[deferred-88-nn] elections: continue disabled when no election selected (Risk #2)',
      async () => {
        await deferredStep('elections: continue-disabled-when-empty UI semantics TBD against baseV1');
      }
    );

    await test.step('elections: continue with default selection (NEW/MOVE refactor-doc:224)', async () => {
      const electionsContinue = page.getByTestId(testIds.voter.elections.continue);
      if (await electionsContinue.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await electionsContinue.click();
      }
    });

    // ====================================================================
    // CONSTITUENCY SELECTION — refactor-doc:226-228
    // ====================================================================

    await test.step('constituencies: list visible (NEW/MOVE refactor-doc:226)', async () => {
      const constituenciesList = page.getByTestId(testIds.voter.constituencies.list);
      await expect(constituenciesList).toBeVisible({ timeout: 10_000 });
    });

    await test.step(
      '[deferred-88-nn] constituencies: only municipalities shown (Risk #7 — hierarchical CG)',
      async () => {
        await deferredStep('constituencies: only-municipalities UI contract TBD against baseV1');
      }
    );

    await test.step('constituencies: select first option per combobox + continue (NEW/MOVE refactor-doc:228)', async () => {
      const constituenciesList = page.getByTestId(testIds.voter.constituencies.list);
      const comboboxes = constituenciesList.getByRole('combobox');
      const count = await comboboxes.count();
      for (let i = 0; i < count; i++) {
        const combo = comboboxes.nth(i);
        await combo.click();
        const listbox = page.getByRole('listbox');
        await listbox.waitFor({ state: 'visible', timeout: 5_000 });
        await listbox.getByRole('option').first().click();
      }
      const constituenciesContinue = page.getByTestId(testIds.voter.constituencies.continue);
      await constituenciesContinue.waitFor({ state: 'visible' });
      await constituenciesContinue.click();
    });

    // ====================================================================
    // QUESTIONS INTRO + CATEGORY SELECTION — refactor-doc:230-240
    // ====================================================================

    await test.step('questions-intro: page renders (MOVED 9.1.3 — REPLACED at refactor-doc:232)', async () => {
      await page.waitForURL(/\/questions/, { timeout: 10_000 }).catch(() => null);
      const questionsStart = page.getByTestId(testIds.voter.questions.startButton);
      await expect(questionsStart).toBeVisible({ timeout: 10_000 });
    });

    await test.step(
      '[deferred-88-nn] questions-intro: category-list checkboxes + total-question count + min-answers gate + uncheck Base-C (refactor-doc:234-239, Risk #2)',
      async () => {
        await deferredStep(
          'questions-intro: category-list semantics + Base-C uncheck against baseV1 TBD'
        );
      }
    );

    await test.step('questions-intro: continue to first category', async () => {
      const questionsStart = page.getByTestId(testIds.voter.questions.startButton);
      await questionsStart.click();
    });

    // ====================================================================
    // CATEGORY INTRO + LIKERT ANSWERS — refactor-doc:242-269
    // ====================================================================

    await test.step('category-intro: Base continue (NEW/MOVE refactor-doc:242-246)', async () => {
      const categoryStart = page.getByTestId(testIds.voter.questions.categoryStart);
      if (await categoryStart.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await categoryStart.click();
      }
    });

    await test.step(
      '[deferred-88-nn] questions: per-question category tags + 1-of-N indices + browser-back state + previous/delete/reanswer roundtrip (MOVED 9.3.2 in spirit, refactor-doc:247-269, Risk #2)',
      async () => {
        await deferredStep(
          'questions: per-question chrome (tags / indices / browser-back / previous-delete-reanswer) TBD'
        );
      }
    );

    await test.step('questions: answer 5 base opinion questions at polar-MAX', async () => {
      const answerOption = page.getByTestId(testIds.voter.questions.answerOption);
      const nextButton = page.getByTestId(testIds.voter.questions.nextButton);
      const categoryStart = page.getByTestId(testIds.voter.questions.categoryStart);
      let answered = 0;
      const targetAnswered = 5;
      const maxIter = 30;
      for (let i = 0; i < maxIter && answered < targetAnswered; i++) {
        const urlBefore = page.url();
        await categoryStart
          .or(answerOption.first())
          .first()
          .waitFor({ state: 'visible', timeout: 10_000 });
        if (await categoryStart.isVisible().catch(() => false)) {
          await categoryStart.click();
          await page
            .waitForURL((url) => url.toString() !== urlBefore, { timeout: 10_000 })
            .catch(() => null);
          continue;
        }
        const choiceCount = await answerOption.count();
        if (choiceCount === 0) {
          await nextButton.waitFor({ state: 'visible', timeout: 5_000 });
          await nextButton.click();
          await page
            .waitForURL((url) => url.toString() !== urlBefore, { timeout: 10_000 })
            .catch(() => null);
          continue;
        }
        await answerOption.nth(choiceCount - 1).click();
        answered++;
        try {
          await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 3_000 });
        } catch {
          if (await nextButton.isVisible().catch(() => false)) {
            await nextButton.click();
            await page
              .waitForURL((url) => url.toString() !== urlBefore, { timeout: 10_000 })
              .catch(() => null);
          }
        }
      }
      expect(answered, 'voter answered at least 5 base opinion questions').toBeGreaterThanOrEqual(5);
    });

    // ====================================================================
    // CATEGORY SKIP + FILTERED CATEGORIES + REMAINING QUESTIONS — refactor-doc:271-289
    // ====================================================================

    await test.step(
      '[deferred-88-nn] category-skip: Base-B skip button + Base-C never visible (refactor-doc:271-274, Risk #2)',
      async () => {
        await deferredStep('category-skip: per-category Skip semantics TBD');
      }
    );

    await test.step(
      '[deferred-88-nn] category-scoping: EL-Reg tag + CO-Mun-SE-SW filtered out + Filt-Mun-NE shown then skipped + Filt-B never seen (refactor-doc:276-289, Risk #2)',
      async () => {
        await deferredStep('category-scoping: per-question scoping TBD against baseV1');
      }
    );

    await test.step('questions: skip-walk remaining categories to reach /results', async () => {
      const nextButton = page.getByTestId(testIds.voter.questions.nextButton);
      const categoryStart = page.getByTestId(testIds.voter.questions.categoryStart);
      const categorySkip = page.getByTestId(testIds.voter.questions.categorySkip);
      const terminal = /\/results/;
      const maxIter = 40;
      for (let i = 0; i < maxIter; i++) {
        if (terminal.test(page.url())) break;
        const urlBefore = page.url();
        await nextButton
          .or(categoryStart)
          .or(categorySkip)
          .first()
          .waitFor({ state: 'visible', timeout: 10_000 })
          .catch(() => null);
        if (await categorySkip.isVisible().catch(() => false)) {
          await categorySkip.click();
        } else if (await categoryStart.isVisible().catch(() => false)) {
          await categoryStart.click();
        } else if (await nextButton.isVisible().catch(() => false)) {
          await nextButton.click();
        } else {
          break;
        }
        await page
          .waitForURL((url) => url.toString() !== urlBefore, { timeout: 10_000 })
          .catch(() => null);
      }
    });

    // ====================================================================
    // RESULTS LANDING + ENTITY-TYPE TABS — refactor-doc:291-298. Absorbs 9.5.2, 9.5.3.
    // ====================================================================

    await test.step('results: list visible after answering (NEW/MOVE refactor-doc:291)', async () => {
      await page.waitForURL(/\/results/, { timeout: 15_000 });
      await expect(page.getByTestId(testIds.voter.results.list)).toBeVisible({ timeout: 15_000 });
    });

    await test.step('results: entity-type tabs visible (MOVED 9.5.2)', async () => {
      const entityTabs = page.getByTestId(testIds.voter.results.entityTabs);
      await expect(entityTabs).toBeVisible();
      const tabCount = await entityTabs.getByRole('tab').count();
      expect(tabCount).toBeGreaterThanOrEqual(2);
    });

    await test.step('results: switch to parties section then back (MOVED 9.5.3)', async () => {
      const entityTabs = page.getByTestId(testIds.voter.results.entityTabs);
      const partyTab = entityTabs.getByRole('tab', { name: /parties|organi[sz]ations?/i });
      if (await partyTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await partyTab.click();
        await expect(page.getByTestId(testIds.voter.results.partySection)).toBeVisible();
        const candTab = entityTabs.getByRole('tab', { name: /candidate/i });
        if (await candTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await candTab.click();
          await expect(page.getByTestId(testIds.voter.results.candidateSection)).toBeVisible();
        }
      }
    });

    // ====================================================================
    // RESULT CARD CONTENT + ENTITY-TYPE COUNTS — refactor-doc:300-314
    // ====================================================================

    await test.step(
      '[deferred-88-nn] result-card-content: portraits / submatches / independent / alliance info / 3-cand expand / election switching (refactor-doc:300-314, Risk #2)',
      async () => {
        await deferredStep('result-card-content cluster TBD against baseV1');
      }
    );

    // ====================================================================
    // HIDDEN CANDIDATE NEGATIVE — refactor-doc:316-318. Absorbs 9.4.5.
    // ====================================================================

    await test.step('results: hidden candidate (no termsOfUseAccepted) NOT shown (MOVED 9.4.5)', async () => {
      const cards = page.getByTestId(testIds.voter.results.card);
      const cardCount = await cards.count();
      expect(cardCount).toBeGreaterThan(0);
      // The hidden candidate is CA-AA-Hidden — rendered name 'Hidden Candidate AA'.
      const hiddenName = page.getByText('Hidden Candidate AA');
      await expect(hiddenName).not.toBeVisible();
    });

    // ====================================================================
    // MATCHING ALGORITHM VERIFICATION — refactor-doc:320-328. Absorbs 9.4.1-9.4.4.
    // ====================================================================

    await test.step(
      '[deferred-88-nn] matching: ranking order / perfect-match top / worst-match last / partial-answer middle (refactor-doc:320-328, MOVED 9.4.1-9.4.4, Risk #2)',
      async () => {
        await deferredStep('matching ranking cluster TBD against baseV1');
      }
    );

    // ====================================================================
    // VOTER ENTITY DETAIL — refactor-doc:330-355. Absorbs 9.6.1, 9.6.2, 9.6.3, 9.6.5-8.
    // ====================================================================

    await test.step('detail: open drawer when clicking first result card (MOVED 9.6.1)', async () => {
      const firstCard = page.getByTestId(testIds.voter.results.card).first();
      await firstCard.click();
      await expect(page.getByTestId(testIds.voter.entityDetail.container)).toBeVisible({
        timeout: 10_000
      });
    });

    await test.step('detail: info OR opinions tab visible (MOVED 9.6.2)', async () => {
      const infoTab = page.getByTestId(testIds.voter.entityDetail.infoTab);
      const opinionsTab = page.getByTestId(testIds.voter.entityDetail.opinionsTab);
      const infoVisible = await infoTab.isVisible({ timeout: 3_000 }).catch(() => false);
      const opinionsVisible = await opinionsTab.isVisible({ timeout: 3_000 }).catch(() => false);
      expect(infoVisible || opinionsVisible).toBeTruthy();
    });

    await test.step(
      '[deferred-88-nn] detail: per-info-question-type render (9 types) (MOVED 9.6.3 + refactor-doc:336-348, Risk #2)',
      async () => {
        await deferredStep('detail: per-info-question-type 9-type grid TBD');
      }
    );

    await test.step(
      '[deferred-88-nn] detail: 9.6.5-8 voter-vs-entity matrix on CA-AA-Special (refactor-doc:349-355, Risk #2)',
      async () => {
        await deferredStep(
          'detail: 4-case voter-vs-entity matrix on CA-AA-Special — arrangement is in baseV1 dataset (USER NOTE Task 1), assertions land in 88-NN'
        );
      }
    );

    await test.step('detail: close drawer via Escape', async () => {
      const detail = page.getByTestId(testIds.voter.entityDetail.container);
      await page.keyboard.press('Escape');
      await detail.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => null);
    });

    // ====================================================================
    // PARTY DRAWER + FILTERS — refactor-doc:357-377. Absorbs 9.6.4, 9.5.5-7, 9.5.10, 9.5.14-18.
    // ====================================================================

    await test.step(
      '[deferred-88-nn] party-drawer: info+candidates+opinions tabs + correct filter list (MOVED 9.6.4, refactor-doc:357-359, Risk #2)',
      async () => {
        await deferredStep('party-drawer tabs + filter-list TBD against baseV1');
      }
    );

    await test.step(
      '[deferred-88-nn] filters: toggle without effect_update_depth_exceeded (MOVED 9.5.5 / RESULTS-01+02)',
      async () => {
        await deferredStep('filter toggle behavior TBD');
      }
    );

    await test.step(
      '[deferred-88-nn] filters: plural tab switch reset + drawer survival + browser back (MOVED 9.5.6, 9.5.7, 9.5.10 / D-13+14+15)',
      async () => {
        await deferredStep('filter persistence cluster TBD');
      }
    );

    await test.step(
      '[deferred-88-nn] filters: SETTINGS-01 wave B Number/Text/Choice/Group/MissingValue (MOVED 9.5.14-9.5.18)',
      async () => {
        await deferredStep('SETTINGS-01 wave B filter cluster TBD');
      }
    );
  });
});
