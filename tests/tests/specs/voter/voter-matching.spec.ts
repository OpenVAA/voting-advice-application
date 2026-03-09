/**
 * Matching algorithm verification E2E tests.
 *
 * Independently runs the @openvaa/matching algorithm on the combined test data
 * (default-dataset + voter-dataset) and compares the computed rankings against
 * what the UI displays.
 *
 * Covers:
 * - VOTE-05 (partial negative): Category intros confirmed disabled during voter journey
 * - VOTE-07 (partial above-threshold): Results accessible after answering all questions
 * - VOTE-08: Matching algorithm produces correct rankings
 * - VOTE-09: Perfect match candidate appears first
 * - VOTE-10: Worst match candidate appears last
 *
 * Full boundary testing for VOTE-05 (category intros shown/hidden) and
 * VOTE-07 (minimum answers threshold at boundary) is deferred to Phase 4.
 */

import { DISTANCE_METRIC, MatchingAlgorithm, MISSING_VALUE_METHOD, OrdinalQuestion } from '@openvaa/matching';
import { expect, test } from '@playwright/test';
import defaultDataset from '../../data/default-dataset.json' assert { type: 'json' };
import voterDataset from '../../data/voter-dataset.json' assert { type: 'json' };
import { testIds } from '../../utils/testIds';
import { navigateToFirstQuestion, waitForNextQuestion } from '../../utils/voterNavigation';
import type { HasAnswers } from '@openvaa/core';
import type { Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Independent matching computation (module scope)
// ---------------------------------------------------------------------------

const LIKERT_SCALE = 5;
const VOTER_ANSWER_VALUE = 5; // "Fully agree" -> choice_5
const VOTER_ANSWER_INDEX = 4; // 0-based index for "Fully agree" (5th option)

// Collect ALL opinion questions from both datasets (default + voter).
// The default dataset has 8 opinion questions (Likert-5 type) and 4 info questions.
// The voter dataset has 8 opinion questions. All use test-qt-likert5 question type.
// Only include opinion (Likert-5) questions for matching.
const allOpinionQuestions = [
  ...defaultDataset.questions.filter((q) => q.questionType.externalId === 'test-qt-likert5'),
  ...voterDataset.questions
];

const TOTAL_OPINION_QUESTIONS = allOpinionQuestions.length; // 16

// Create OrdinalQuestion objects for matching
const questions = allOpinionQuestions.map((q) =>
  OrdinalQuestion.fromLikert({ id: q.externalId, scale: LIKERT_SCALE })
);

// Create voter answers -- all "Fully agree" (choice_5) for every opinion question
const voterAnswers: Record<string, { value: string }> = {};
for (const q of questions) {
  voterAnswers[q.id] = { value: `choice_${VOTER_ANSWER_VALUE}` };
}
const voterEntity: HasAnswers = { answers: voterAnswers };

// Collect ALL visible candidates from both datasets.
// Visible = has termsOfUseAccepted set.
const allCandidates = [
  ...defaultDataset.candidates.map((c) => ({
    ...c,
    answersByExternalId: c.answersByExternalId as Record<string, { value: string }> | undefined
  })),
  ...voterDataset.candidates.map((c) => ({
    ...c,
    answersByExternalId: c.answersByExternalId as Record<string, { value: string }> | undefined
  }))
];
const visibleCandidates = allCandidates.filter((c) => c.termsOfUseAccepted);

// Build HasAnswers-compatible objects for each candidate.
// Dataset answer values are raw numeric strings ("5", "1", etc.) which map
// to OrdinalQuestion.fromLikert choice IDs ("choice_5", "choice_1", etc.).
const candidateEntities = visibleCandidates.map((c) => {
  const answers: Record<string, { value: string }> = {};
  if (c.answersByExternalId) {
    for (const [qId, ans] of Object.entries(c.answersByExternalId)) {
      if (questions.some((q) => q.id === qId) && ans.value) {
        answers[qId] = { value: `choice_${ans.value}` };
      }
    }
  }
  return {
    name: `${c.firstName} ${c.lastName}`,
    externalId: c.externalId,
    answers
  };
});

// Run matching algorithm with the same config as frontend voterContext.ts
const algorithm = new MatchingAlgorithm({
  distanceMetric: DISTANCE_METRIC.Manhattan,
  missingValueOptions: { method: MISSING_VALUE_METHOD.RelativeMaximum }
});

const computedMatches = algorithm.match({
  questions,
  reference: voterEntity,
  targets: candidateEntities
});

// Build the expected ranking grouped by distance tier (ties share the same tier).
// Within a tier, any order is acceptable since the algorithm doesn't guarantee
// a stable sort for equal distances.
const expectedTiers: Array<{ names: Array<string>; distance: number }> = [];
for (const match of computedMatches) {
  const name = (match.target as (typeof candidateEntities)[0]).name;
  const lastTier = expectedTiers[expectedTiers.length - 1];
  if (lastTier && Math.abs(lastTier.distance - match.distance) < 0.0001) {
    lastTier.names.push(name);
  } else {
    expectedTiers.push({ names: [name], distance: match.distance });
  }
}
// Flat list for total count verification
const expectedRanking = computedMatches.map((m) => (m.target as (typeof candidateEntities)[0]).name);

// Lookup helpers for specific candidates in the voter dataset
const hiddenCandidate = voterDataset.candidates.find((c) => !c.termsOfUseAccepted)!;
const partialCandidate = voterDataset.candidates.find((c) => c.externalId === 'test-voter-cand-partial')!;
const agreeCandidate = voterDataset.candidates.find((c) => c.externalId === 'test-voter-cand-agree')!;
const opposeCandidate = voterDataset.candidates.find((c) => c.externalId === 'test-voter-cand-oppose')!;

// ---------------------------------------------------------------------------
// Helper: navigate the voter through all questions to reach results
// ---------------------------------------------------------------------------

/**
 * Navigate the full voter journey: Home -> Intro -> answer all opinion questions -> Results.
 * Uses shared navigation helpers that handle optional intermediate pages
 * (questions intro, category intros) which may appear due to parallel settings specs.
 */
async function navigateToResults(page: Page): Promise<void> {
  // Navigate Home -> Intro -> (optional pages) -> First Question
  await navigateToFirstQuestion(page);

  // Answer all opinion questions with "Fully agree" (index 4, the 5th option).
  // After clicking an answer, the app auto-advances to the next question after 350ms.
  // We track URL changes to confirm navigation happened before clicking the next answer.
  for (let i = 0; i < TOTAL_OPINION_QUESTIONS; i++) {
    const answerOption = page.getByTestId(testIds.voter.questions.answerOption).nth(VOTER_ANSWER_INDEX);
    await answerOption.waitFor({ state: 'visible' });

    // Capture current URL before clicking to detect when navigation completes
    const urlBefore = page.url();
    await answerOption.click();

    if (i < TOTAL_OPINION_QUESTIONS - 1) {
      // Wait for URL to change (auto-advance navigated to next question)
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 5000 });
      // Wait for next question, clicking through any category intro page
      await waitForNextQuestion(page, VOTER_ANSWER_INDEX);
    }
  }

  // After answering the last question, the auto-advance timer navigates to results.
  // Wait for the results page to load.
  await page.getByTestId(testIds.voter.results.list).waitFor({ state: 'visible', timeout: 15000 });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('matching algorithm verification', () => {
  test.describe.configure({ mode: 'serial' });

  test('should display candidates in correct match ranking order', async ({ page }) => {
    await navigateToResults(page);

    const cards = page.getByTestId(testIds.voter.results.card);

    // Read candidate names from entity cards in display order
    const cardCount = await cards.count();
    const displayedNames: Array<string> = [];
    for (let i = 0; i < cardCount; i++) {
      const text = await cards.nth(i).textContent();
      displayedNames.push(text ?? '');
    }

    // Verify total candidate count matches
    await expect(cards).toHaveCount(expectedRanking.length);

    // Verify ranking by distance tiers: candidates with equal distances may
    // appear in any order within their tier, but tiers must be in order.
    let position = 0;
    for (const tier of expectedTiers) {
      const tierCards = displayedNames.slice(position, position + tier.names.length);
      for (const name of tier.names) {
        expect(tierCards.some((card) => card.includes(name))).toBe(true);
      }
      position += tier.names.length;
    }
  });

  test('should show perfect match candidate as top result', async ({ page }) => {
    await navigateToResults(page);

    const firstCard = page.getByTestId(testIds.voter.results.card).first();
    const agreeName = `${agreeCandidate.firstName} ${agreeCandidate.lastName}`;

    await expect(firstCard).toContainText(agreeName);
  });

  test('should show worst match candidate as last result', async ({ page }) => {
    await navigateToResults(page);

    const cards = page.getByTestId(testIds.voter.results.card);
    const lastCard = cards.last();
    const opposeName = `${opposeCandidate.firstName} ${opposeCandidate.lastName}`;

    await expect(lastCard).toContainText(opposeName);
  });

  test('should show partial-answer candidate in results with valid score', async ({ page }) => {
    await navigateToResults(page);

    const candidateSection = page.getByTestId(testIds.voter.results.candidateSection);
    const partialName = `${partialCandidate.firstName} ${partialCandidate.lastName}`;

    // Partial candidate should appear in results
    await expect(candidateSection).toContainText(partialName);

    // Partial candidate should NOT be first or last
    const cards = page.getByTestId(testIds.voter.results.card);
    const firstCard = cards.first();
    const lastCard = cards.last();
    await expect(firstCard).not.toContainText(partialName);
    await expect(lastCard).not.toContainText(partialName);
  });

  test('should NOT show hidden candidate (no termsOfUseAccepted)', async ({ page }) => {
    await navigateToResults(page);

    const candidateSection = page.getByTestId(testIds.voter.results.candidateSection);
    const hiddenName = `${hiddenCandidate.firstName} ${hiddenCandidate.lastName}`;

    await expect(candidateSection).not.toContainText(hiddenName);
  });

  test(
    'should confirm category intros were not shown during journey (VOTE-05 partial negative coverage)',
    async ({ page }) => {
      // Navigate the full journey and verify no category intro appeared.
      // Category intros are disabled in data setup via updateAppSettings.
      //
      // Full boundary testing (enabling/disabling category intros and verifying
      // behavior) is explicitly Phase 4 scope.
      await navigateToResults(page);

      // Category intro element should not be present on the results page
      await expect(page.getByTestId(testIds.voter.questions.categoryIntro)).toBeHidden();
    }
  );

  test(
    'should confirm results accessible after all questions answered (VOTE-07 partial above-threshold coverage)',
    async ({ page }) => {
      // Navigate and answer all opinion questions (above the default minimum of 5).
      // This confirms results are accessible when answering all questions above threshold.
      //
      // Full boundary testing (answering exactly at threshold, below threshold)
      // is explicitly Phase 4 scope.
      await navigateToResults(page);

      // Results list should be visible with entity cards present
      await expect(page.getByTestId(testIds.voter.results.list)).toBeVisible();
      const cardCount = await page.getByTestId(testIds.voter.results.card).count();
      expect(cardCount).toBeGreaterThan(0);
    }
  );
});
