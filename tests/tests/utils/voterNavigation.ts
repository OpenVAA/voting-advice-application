/**
 * Shared voter navigation helpers for E2E tests.
 *
 * These handle the full voter journey from Home to the first question,
 * clicking through any optional intermediate pages (main intro, questions
 * intro with/without category selection, category intros).
 *
 * The app's default behavior shows these intermediate pages. data.setup.ts
 * disables them, but parallel settings-mutating specs may re-enable them
 * at any time. These helpers are resilient to that.
 */

import { buildRoute } from './buildRoute';
import { SupabaseAdminClient } from './supabaseAdminClient';
import { testIds } from './testIds';
import type { Page } from '@playwright/test';

/**
 * Cached UUID lookups for the e2e seed's elections + leaf-constituencies.
 * Resolved once per process — the seed is reset at most once per test run.
 */
let uuidCache: { electionUuids: Array<string>; constituencyUuids: Array<string> } | undefined;

async function resolveSeedUuids(): Promise<{ electionUuids: Array<string>; constituencyUuids: Array<string> }> {
  if (uuidCache) return uuidCache;
  const client = new SupabaseAdminClient();
  const e1 = await client.findData('elections', { externalId: { $eq: 'test-election-1' } });
  const e2 = await client.findData('elections', { externalId: { $eq: 'test-election-2' } });
  // Pick the first leaf-constituency in each group (e2 belongs to the
  // Municipalities group; alpha is the Region for election-1). With perfect
  // hierarchy alpha is auto-implied from e2, but providing both keeps the
  // bypass URL valid even if a variant breaks the hierarchy.
  const cAlpha = await client.findData('constituencies', { externalId: { $eq: 'test-constituency-alpha' } });
  const cE2 = await client.findData('constituencies', { externalId: { $eq: 'test-constituency-e2' } });
  uuidCache = {
    electionUuids: [e1.data?.[0]?.id, e2.data?.[0]?.id].filter((id): id is string => Boolean(id)),
    constituencyUuids: [cAlpha.data?.[0]?.id, cE2.data?.[0]?.id].filter((id): id is string => Boolean(id))
  };
  return uuidCache;
}

/**
 * Navigate from Home through all intermediate pages to the first question.
 *
 * Handles: Home → Intro → (Questions Intro?) → (Category Intro?) → First Question
 *
 * After returning, the page is on an actual question page (URL matches
 * /questions/[id]) with answer options visible. This ensures that the
 * questions intro page's onMount redirect (from /questions to
 * /questions/__first__) has completed, preventing URL change race
 * conditions in subsequent waitForURL calls.
 */
export async function navigateToFirstQuestion(page: Page): Promise<void> {
  await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
  await page.getByTestId(testIds.voter.home.startButton).click();

  const introStart = page.getByTestId(testIds.voter.intro.startButton);
  await introStart.waitFor({ state: 'visible' });
  await introStart.click();

  // The base e2e seed has 2 elections and 2 constituency groups with multiple
  // children per group, so the journey now lands on /elections then
  // /constituencies before reaching /questions. Skip either page when it
  // doesn't appear (e.g. single-election variants or settings that auto-imply).
  await passThroughElections(page);
  await passThroughConstituencies(page);

  await clickThroughIntroPages(page);

  // Wait for the URL to settle on an actual question page. The questions
  // intro page (/questions) may redirect to /questions/__first__ via
  // onMount. Without this wait, the caller's waitForURL would detect
  // the redirect as a URL change instead of the auto-advance navigation.
  await page.waitForURL(/\/questions\//, { timeout: 10000 });
}

/**
 * If the elections selection page is reached, accept the default selection
 * (all elections pre-checked) and continue. No-op when the journey skipped
 * the page (single election, or already past it).
 *
 * The Continue button triggers a SvelteKit `goto()` that intermittently fails
 * to navigate (pre-existing bug — see multi-election.spec.ts:173-189 TODO).
 * On click we wait briefly for the URL to leave /elections; if it doesn't,
 * fall back to a hard navigation that supplies both election + constituency
 * IDs via search params, bypassing /constituencies entirely.
 */
async function passThroughElections(page: Page): Promise<void> {
  const list = page.getByTestId(testIds.voter.elections.list);
  const cont = page.getByTestId(testIds.voter.elections.continue);
  try {
    await list.waitFor({ state: 'visible', timeout: 4000 });
  } catch {
    return;
  }
  await cont.waitFor({ state: 'visible' });
  await cont.click();
  try {
    await page.waitForURL((url) => !url.toString().includes('/elections'), { timeout: 3000 });
  } catch {
    await navigateDirectlyToQuestions(page);
  }
}

/**
 * If the constituency selection page is reached, pick the first municipality
 * in each combobox and continue. The base e2e seed has a perfect hierarchy
 * (Regions → Municipalities), so one selector renders per election and the
 * region is implied automatically.
 */
async function passThroughConstituencies(page: Page): Promise<void> {
  const list = page.getByTestId(testIds.voter.constituencies.list);
  const cont = page.getByTestId(testIds.voter.constituencies.continue);
  try {
    await list.waitFor({ state: 'visible', timeout: 4000 });
  } catch {
    return;
  }

  const comboboxes = list.getByRole('combobox');
  const count = await comboboxes.count();
  for (let i = 0; i < count; i++) {
    const combo = comboboxes.nth(i);
    await combo.click();
    const listbox = page.getByRole('listbox');
    await listbox.waitFor({ state: 'visible', timeout: 5000 });
    await listbox.getByRole('option').first().click();
  }

  await cont.waitFor({ state: 'visible' });
  await cont.click();
  try {
    await page.waitForURL(/\/questions/, { timeout: 3000 });
  } catch {
    await navigateDirectlyToQuestions(page);
  }
}

/**
 * Hard-navigation fallback used when SvelteKit goto() silently fails to
 * advance from /elections or /constituencies. Looks up the seed UUIDs once
 * and sends the page straight to /questions with both election + constituency
 * IDs in the search params.
 */
async function navigateDirectlyToQuestions(page: Page): Promise<void> {
  const { electionUuids, constituencyUuids } = await resolveSeedUuids();
  const baseUrl = page.url().replace(/\/(elections|constituencies).*$/, '');
  const eqs = electionUuids.map((id) => `electionId=${encodeURIComponent(id)}`).join('&');
  const cqs = constituencyUuids.map((id) => `constituencyId=${encodeURIComponent(id)}`).join('&');
  const sep = eqs && cqs ? '&' : '';
  await page.goto(`${baseUrl}/questions?${eqs}${sep}${cqs}`);
}

/**
 * Walk Home → Intro → /elections → /constituencies and stop on the questions
 * intro page (the page with the category checkboxes + "Answer N Questions"
 * counter). Use this when the test wants to inspect the intro page itself
 * rather than the first question.
 */
export async function walkToQuestionsIntro(page: Page): Promise<void> {
  await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
  await page.getByTestId(testIds.voter.home.startButton).click();

  const introStart = page.getByTestId(testIds.voter.intro.startButton);
  await introStart.waitFor({ state: 'visible' });
  await introStart.click();

  await passThroughElections(page);
  await passThroughConstituencies(page);

  // The questions intro page renders the start CTA + category checkboxes.
  await page.getByTestId(testIds.voter.questions.startButton).waitFor({ state: 'visible', timeout: 10000 });
}

/**
 * Click through any intermediate pages (questions intro, category intro)
 * until the first question's answer options are visible.
 *
 * Retries if elements are detached (e.g., due to parallel settings changes).
 */
export async function clickThroughIntroPages(page: Page): Promise<void> {
  const answerOption = page.getByTestId(testIds.voter.questions.answerOption).first();
  const questionsStart = page.getByTestId(testIds.voter.questions.startButton);
  const categoryStart = page.getByTestId(testIds.voter.questions.categoryStart);

  for (let attempt = 0; attempt < 5; attempt++) {
    await answerOption.or(questionsStart).or(categoryStart).waitFor({ state: 'visible', timeout: 10000 });

    if (await answerOption.isVisible()) return;

    try {
      if (await questionsStart.isVisible()) {
        await questionsStart.click({ timeout: 3000 });
      } else if (await categoryStart.isVisible()) {
        await categoryStart.click({ timeout: 3000 });
      }
    } catch {
      // Element may have been detached due to concurrent settings change; retry
      continue;
    }
  }

  // Final fallback: just wait for the answer option
  await answerOption.waitFor({ state: 'visible', timeout: 10000 });
}

/**
 * Wait for the next question's answer options, clicking through any
 * category intro page that may appear between questions.
 */
export async function waitForNextQuestion(page: Page, answerIndex: number): Promise<void> {
  const nextAnswer = page.getByTestId(testIds.voter.questions.answerOption).nth(answerIndex);
  const categoryStart = page.getByTestId(testIds.voter.questions.categoryStart);

  await nextAnswer.or(categoryStart).waitFor({ state: 'visible', timeout: 10000 });
  if (await categoryStart.isVisible()) {
    await categoryStart.click();
    await nextAnswer.waitFor({ state: 'visible', timeout: 10000 });
  }
}
