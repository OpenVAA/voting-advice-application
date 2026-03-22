import { chromium } from '@playwright/test';
import defaultDataset from './tests/data/default-dataset.json' with { type: 'json' };
import overlay from './tests/data/overlays/multi-election-overlay.json' with { type: 'json' };
import voterDataset from './tests/data/voter-dataset.json' with { type: 'json' };
import { mergeDatasets } from './tests/utils/mergeDatasets';
import { SupabaseAdminClient } from './tests/utils/supabaseAdminClient';
import { testIds } from './tests/utils/testIds';

const TEST_DATA_PREFIX = 'test-';

(async () => {
  // Setup data first
  const client = new SupabaseAdminClient();
  await client.bulkDelete({
    nominations: { prefix: TEST_DATA_PREFIX },
    candidates: { prefix: TEST_DATA_PREFIX },
    questions: { prefix: TEST_DATA_PREFIX },
    question_categories: { prefix: TEST_DATA_PREFIX },
    organizations: { prefix: TEST_DATA_PREFIX },
    constituency_groups: { prefix: TEST_DATA_PREFIX },
    constituencies: { prefix: TEST_DATA_PREFIX },
    elections: { prefix: TEST_DATA_PREFIX }
  });
  const merged = mergeDatasets(mergeDatasets(defaultDataset, voterDataset), overlay);
  await client.bulkImport(merged as Record<string, unknown[]>);
  await client.importAnswers(merged as Record<string, unknown[]>);
  await client.linkJoinTables(merged as Record<string, unknown[]>);
  await client.updateAppSettings({
    questions: {
      categoryIntros: { show: false },
      questionsIntro: { allowCategorySelection: false, show: false },
      showResultsLink: true
    },
    entities: { hideIfMissingAnswers: { candidate: false }, showAllNominations: true },
    notifications: { voterApp: { show: false } },
    analytics: { trackEvents: false }
  });
  console.log('Data setup done');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('pageerror', (err) => console.log('[PAGE ERROR]', err.message));

  // Navigate Home -> Intro -> Elections
  await page.goto('http://localhost:5173/en');
  await page.getByTestId(testIds.voter.home.startButton).click();
  const introStart = page.getByTestId(testIds.voter.intro.startButton);
  await introStart.waitFor({ state: 'visible', timeout: 10000 });
  await introStart.click();

  // Elections page
  const electionsList = page.getByTestId(testIds.voter.elections.list);
  await electionsList.waitFor({ state: 'visible', timeout: 10000 });
  console.log('Elections page. URL:', page.url());
  await page.getByTestId(testIds.voter.elections.continue).click();

  // Wait for questions
  const answerOption = page.getByTestId(testIds.voter.questions.answerOption);
  const nextButton = page.getByTestId(testIds.voter.questions.nextButton);
  const categoryStart = page.getByTestId(testIds.voter.questions.categoryStart);

  await answerOption.first().or(categoryStart).waitFor({ state: 'visible', timeout: 15000 });
  console.log('Questions page. URL:', page.url());

  // Handle possible category intro
  if (await categoryStart.isVisible()) {
    console.log('Category intro found, clicking...');
    await categoryStart.click();
    await answerOption.first().waitFor({ state: 'visible', timeout: 10000 });
  }

  // Answer all questions
  let questionCount = 0;
  while (questionCount < 50) {
    if (page.url().includes('/results')) {
      console.log(`Reached results after ${questionCount} questions`);
      break;
    }

    try {
      await answerOption.first().waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      if (page.url().includes('/results')) break;
      if (await categoryStart.isVisible().catch(() => false)) {
        console.log(`Q${questionCount}: Category intro, clicking...`);
        await categoryStart.click();
        continue;
      }
      console.log(`Q${questionCount}: No answer options, no results, no category. URL:`, page.url());
      break;
    }

    questionCount++;
    const urlBefore = page.url();
    const optionCount = await answerOption.count();
    console.log(`Q${questionCount}: ${optionCount} options. URL: ${urlBefore}`);

    await answerOption.nth(2).click();

    try {
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 5000 });
      const newUrl = page.url();
      console.log(`  -> Auto-advanced to: ${newUrl}`);
      if (!newUrl.includes('/results') && (await categoryStart.isVisible().catch(() => false))) {
        console.log('  -> Category intro after advance, clicking...');
        await categoryStart.click();
      }
    } catch {
      console.log('  -> No auto-advance. Checking next button...');
      if (await nextButton.isVisible()) {
        console.log('  -> Clicking next button...');
        await nextButton.click();
        try {
          await page.waitForURL(/\/results/, { timeout: 10000 });
          console.log('  -> Navigated to results!');
        } catch {
          console.log('  -> Next button did not navigate to results. URL:', page.url());
        }
      } else {
        console.log('  -> No next button visible. URL:', page.url());
      }
      break;
    }
  }

  console.log(`\nFinal URL: ${page.url()}`);
  console.log(`Questions answered: ${questionCount}`);

  // Check if results page
  const resultsList = page.getByTestId(testIds.voter.results.list);
  console.log('Results list visible?', await resultsList.isVisible().catch(() => false));

  await page.screenshot({ path: '/tmp/debug-questions.png' });
  await browser.close();
})();
