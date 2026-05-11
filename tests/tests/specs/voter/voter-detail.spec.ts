/**
 * Voter entity detail E2E tests.
 *
 * Covers:
 * - VOTE-11: Candidate detail with info and opinions tabs
 * - VOTE-12: Party detail with info, candidates (submatches), and opinions tabs
 *
 * Entity details are shown in a Drawer modal rendered by the results layout
 * (`results/+layout.svelte`) when clicking entity cards on the results page.
 * The layout intercepts navigation to entity detail routes via beforeNavigate,
 * cancels the navigation, and shows the entity in an EntityDetailsDrawer.
 *
 * Uses the `answeredVoterPage` fixture from `voter.fixture.ts` which
 * navigates the voter journey and answers all questions, landing on
 * the results page.
 *
 * Runs within the `voter-app` project which depends only on data-setup
 * (no auth needed for voter tests).
 */

import { expect } from '@playwright/test';
import { voterTest as test } from '../../fixtures/voter.fixture';
import { E2E_CANDIDATES } from '../../utils/e2eFixtureRefs';
import { testIds } from '../../utils/testIds';

// The candidate used for detail content verification (has info answers and open answers)
const alphaCandidate = E2E_CANDIDATES.find((c) => c.external_id === 'test-candidate-alpha')!;
const alphaAnswers = alphaCandidate.answersByExternalId as Record<
  string,
  { value: string | number | boolean | Record<string, string>; info?: Record<string, string> }
>;

test.describe('voter entity detail', { tag: ['@voter'] }, () => {

  test('should open candidate detail drawer when clicking a result card', async ({
    answeredVoterPage: page
  }) => {
    // Click the first entity card on the results page (VOTE-11)
    await page.getByTestId(testIds.voter.results.card).first().click();

    // Assert a drawer/dialog opens
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Assert entity details are visible inside the drawer
    await expect(dialog.getByTestId('entity-details')).toBeVisible();
  });

  test('should display candidate info and opinions tabs', async ({ answeredVoterPage: page }) => {
    // Click first entity card to open drawer (VOTE-11)
    await page.getByTestId(testIds.voter.results.card).first().click();

    // Assert drawer is open
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Assert info tab content is visible (default tab)
    await expect(dialog.getByTestId(testIds.voter.entityDetail.infoTab)).toBeVisible();

    // Switch to opinions tab via tab button within the drawer
    await dialog.getByRole('tab', { name: /opinions/i }).click();

    // Assert opinions content area is visible
    await expect(dialog.getByTestId(testIds.voter.entityDetail.opinionsTab)).toBeVisible();

    // Close the drawer by pressing Escape
    await page.keyboard.press('Escape');

    // Assert drawer is closed
    await expect(dialog).toBeHidden();
  });

  test('should display candidate answers correctly in info and opinions tabs', async ({
    answeredVoterPage: page
  }) => {
    // Open "Test Candidate Alpha" who has:
    // - Info answers: campaign slogan "Progress for all", years of experience, etc.
    // - Opinion answers with open answers on default-dataset Q1, Q3, and Q5
    await page.getByTestId(testIds.voter.results.card).filter({ hasText: alphaCandidate.last_name! }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // --- Info tab: candidate's info question answers are displayed ---
    const infoTab = dialog.getByTestId(testIds.voter.entityDetail.infoTab);
    await expect(infoTab).toBeVisible();
    // Campaign slogan (text-type info answer) from dataset
    const sloganAnswer = alphaAnswers['test-question-text'].value as Record<string, string>;
    await expect(infoTab).toContainText(sloganAnswer.en);

    // --- Opinions tab ---
    await dialog.getByRole('tab', { name: /opinions/i }).click();
    const opinionsTab = dialog.getByTestId(testIds.voter.entityDetail.opinionsTab);
    await expect(opinionsTab).toBeVisible();

    // Candidate's opinion answer is correctly indicated:
    // Alpha answered Q1 — the corresponding choice radio has entitySelected class.
    // reason: 'entitySelected' is a CSS class set by the OpinionQuestionInput
    // component to mark the candidate's answer position; it has no ARIA role
    // (the role lives on the underlying <input type="radio">), no associated
    // text, and no testId. The class is the contract — getByRole/getByText/etc.
    // would match either too few elements (no class info) or too many (all
    // radios). Inline-justified per RESEARCH §"Pitfall" + §"Anti-Patterns".
    const firstQuestionInput = opinionsTab.getByTestId('opinion-question-input').first();
    // eslint-disable-next-line playwright/no-raw-locators
    await expect(firstQuestionInput.locator('.entitySelected')).toHaveCount(1);

    // Voter's answer is displayed alongside the candidate's:
    // The voter's selected radio is checked, and voter label ("You") is shown.
    // getByRole('radio', { checked: true }) is the semantic equivalent of input:checked
    // for radios; OpinionQuestionInput renders one radio per choice.
    await expect(firstQuestionInput.getByRole('radio', { checked: true })).toHaveCount(1);
    await expect(firstQuestionInput.getByText('You')).toBeAttached();

    // Candidate's open answers are displayed where provided (from dataset info fields)
    const openAnswerKeys = Object.keys(alphaAnswers).filter(
      (k) => alphaAnswers[k].info && (alphaAnswers[k].info as Record<string, string>).en
    );
    for (const key of openAnswerKeys) {
      await expect(opinionsTab).toContainText((alphaAnswers[key].info as Record<string, string>).en);
    }
  });

  test('should open party detail drawer with info, candidates, and opinions tabs', async ({
    answeredVoterPage: page
  }) => {
    // First switch to organizations/parties tab on results page
    const entityTabs = page.getByTestId(testIds.voter.results.entityTabs);
    await entityTabs.getByRole('tab', { name: /parties/i }).click();

    // Wait for party section to be visible
    const partySection = page.getByTestId(testIds.voter.results.partySection);
    await expect(partySection).toBeVisible();

    // Click the first party card's action link to open drawer.
    // The EntityCardAction component renders as <a data-testid="entity-card-action">.
    // When subcards exist, the link wraps the header inside the card;
    // when no subcards, the link wraps the entire card from outside.
    // Using entity-card-action works in both cases.
    await partySection.getByTestId('entity-card-action').first().click();

    // Assert drawer opens with party entity details
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByTestId('entity-details')).toBeVisible();

    // Assert info tab is visible (default tab)
    await expect(dialog.getByTestId(testIds.voter.entityDetail.infoTab)).toBeVisible();

    // Switch to children/members tab (renamed from candidates/submatches in Phase 69 — English label is now "Members")
    await dialog.getByRole('tab', { name: /members/i }).click();
    await expect(dialog.getByTestId(testIds.voter.entityDetail.childrenTab)).toBeVisible();

    // Switch to opinions tab
    await dialog.getByRole('tab', { name: /opinions/i }).click();
    await expect(dialog.getByTestId(testIds.voter.entityDetail.opinionsTab)).toBeVisible();

    // Close the drawer
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});

/**
 * Phase 74 Plan 05 — E2E-05 voter-vs-entity 4-case answer-state coverage.
 *
 * Closes the v2.5/v2.6-deferred gap: voter-detail today asserts only case (a)
 * (both answered) at lines 73-122 above. Phase 74 Plan 05 Task 1 extends the
 * `e2e` dev-seed template (`packages/dev-seed/src/templates/e2e.ts`) with 4
 * marker candidates — `test-candidate-Case{A,B,C,D}-*` — each exhibiting one
 * of the 4 voter-vs-entity answer-state cases on a deterministic marker
 * question. This block asserts the 4 cases against the post-extension seed.
 *
 * Marker question selection:
 *   - Case (a) / Case (b): `test-question-1` — first opinion question in
 *     sort order (Test Category: Economy, sort 0). Voter has an answer
 *     (fixture default voterAnswerCount=16 covers all 16 ordinals).
 *   - Case (c) / Case (d): `test-question-directional-1` — last opinion
 *     question (sort 17, Test Category: Directional). Voter does NOT have
 *     an answer (fixture answers 16, skips this categorical at sort 17).
 *
 * Visual contract (per voter-detail.spec.ts:97-113 existing exemplar +
 * EntityOpinions.svelte:51-75 + OpinionQuestionInput.svelte:88-115):
 *   - `.entitySelected` class on a `<input type="radio">` marks the
 *     candidate's chosen answer; no aria/role equivalent — class is the
 *     contract per RESEARCH §"Pitfall" + §"Anti-Patterns" + existing test
 *     precedent at line 106. `playwright/no-raw-locators` inline-justified.
 *   - `getByRole('radio', { checked: true })` is the semantic equivalent of
 *     `input:checked` — marks the voter's answer.
 *   - `getByText('You')` confirms the voter-answer label.
 *   - For "neither answered" (case d), the OpinionQuestionInput is NOT
 *     rendered (per EntityOpinions.svelte:69 `{#if voterAnswer != null ||
 *     answer != null}`); instead the i18n message
 *     `questions.answers.bothHaventAnswered` renders ("Neither you nor X
 *     has answered this question").
 */
test.describe('voter-detail answer cases (E2E-05)', { tag: ['@voter'] }, () => {
  test('case (a) — both answered: voter row and entity row rendered', async ({
    answeredVoterPage: page
  }) => {
    // Card text format: "{first_name} {last_name}" → "CaseA Both" (space-joined),
    // not the external_id "test-candidate-CaseA-Both". Filter by last_name only
    // since it's unique across the 4 Case candidates.
    await page.getByTestId(testIds.voter.results.card).filter({ hasText: 'CaseA Both' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('tab', { name: /opinions/i }).click();
    const opinionsTab = dialog.getByTestId(testIds.voter.entityDetail.opinionsTab);

    // Marker question for case (a) = test-question-1 (first in sort order).
    // CaseA-Both candidate answers test-question-1='5'; voter (fixture) also
    // answered it = '5' → both rows render with the same selected choice.
    const firstInput = opinionsTab.getByTestId('opinion-question-input').first();

    // reason: 'entitySelected' is a CSS class set by OpinionQuestionInput;
    // no aria/role equivalent — see existing exemplar at line 98-106 for the
    // canonical inline justification.
    // eslint-disable-next-line playwright/no-raw-locators
    await expect(firstInput.locator('.entitySelected')).toHaveCount(1);
    await expect(firstInput.getByRole('radio', { checked: true })).toHaveCount(1);
    await expect(firstInput.getByText('You')).toBeAttached();
  });

  test('case (b) — voter answered, entity missing: voter row only', async ({
    answeredVoterPage: page
  }) => {
    // Card text: "CaseB VoterOnly" — see case (a) for card text format note.
    await page.getByTestId(testIds.voter.results.card).filter({ hasText: 'CaseB VoterOnly' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('tab', { name: /opinions/i }).click();
    const opinionsTab = dialog.getByTestId(testIds.voter.entityDetail.opinionsTab);

    // Marker question for case (b) = test-question-1 (first in sort order).
    // CaseB-VoterOnly candidate has NO answer for test-question-1; voter
    // (fixture) has answered → voter row renders, entity row absent.
    const firstInput = opinionsTab.getByTestId('opinion-question-input').first();

    await expect(firstInput.getByRole('radio', { checked: true })).toHaveCount(1);
    await expect(firstInput.getByText('You')).toBeAttached();
    // reason: same class-based contract as case (a); count=0 asserts entity
    // row absent (CaseB has no answer for the marker question).
    // eslint-disable-next-line playwright/no-raw-locators
    await expect(firstInput.locator('.entitySelected')).toHaveCount(0);
  });

  test('case (c) — voter missing, entity answered: entity row only', async ({
    answeredVoterPage: page
  }) => {
    // Card text: "CaseC EntityOnly" — see case (a) for card text format note.
    await page.getByTestId(testIds.voter.results.card).filter({ hasText: 'CaseC EntityOnly' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('tab', { name: /opinions/i }).click();
    const opinionsTab = dialog.getByTestId(testIds.voter.entityDetail.opinionsTab);

    // Marker question for case (c) = test-question-directional-1 (last in
    // sort order; sort_order 17 in the new test-category-directional).
    // CaseC-EntityOnly answers it; voter does NOT (fixture skips sort >= 17).
    // The OpinionQuestionInput for the directional question is the LAST in
    // the opinions tab — locate via .last().
    const lastInput = opinionsTab.getByTestId('opinion-question-input').last();

    // reason: class-based contract — entity's choice carries entitySelected;
    // no voter selection means no checked radio and no 'You' label.
    // eslint-disable-next-line playwright/no-raw-locators
    await expect(lastInput.locator('.entitySelected')).toHaveCount(1);
    await expect(lastInput.getByRole('radio', { checked: true })).toHaveCount(0);
    await expect(lastInput.getByText('You')).toHaveCount(0);
  });

  test('case (d) — both missing: "Neither has answered" message rendered', async ({
    answeredVoterPage: page
  }) => {
    // Card text: "CaseD Neither" — see case (a) for card text format note.
    await page.getByTestId(testIds.voter.results.card).filter({ hasText: 'CaseD Neither' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('tab', { name: /opinions/i }).click();
    const opinionsTab = dialog.getByTestId(testIds.voter.entityDetail.opinionsTab);

    // Marker question for case (d) = test-question-directional-1. Neither
    // voter nor CaseD-Neither has answered it. EntityOpinions.svelte:57-60
    // renders the i18n message `questions.answers.bothHaventAnswered`
    // ("Neither you nor {entity} has answered this question" in en) in
    // place of the OpinionQuestionInput → no `<input type="radio">` and no
    // `.entitySelected` class for the directional question's row.
    //
    // The message is interpolated with the candidate's shortName — assert
    // by matching the locale-invariant en literal prefix "Neither you nor"
    // followed by the rest of the localized template.
    await expect(
      opinionsTab.getByText(/Neither you nor .* has(?:n't| not)? answered/i)
    ).toBeVisible();
  });
});

/**
 * Phase 74 Plan 05 — E2E-07 per-category SubMatch coverage.
 *
 * REQUIREMENTS.md §E2E-07 + ROADMAP.md §"Phase 74" SC #7 both name BOTH
 * Manhattan AND directional metric paths. Phase 74 Plan 05 Task 1 extends
 * the e2e dev-seed template with 1 categorical question (sort 17) under a
 * new `test-category-directional` so the directional-metric SubMatch row
 * is testable here. Existing 4 ordinal categories (Economy / Social / Voter
 * Economy / Voter Social) cover the Manhattan path.
 *
 * SubMatch render anchor (SubMatches.svelte:28-32 + ScoreGauge.svelte:62-94):
 *   The SubMatches component renders 1 ScoreGauge per category. Each
 *   ScoreGauge contains a `<div role="meter" aria-labelledby="...">` whose
 *   accessible name resolves to the sibling `<label>` containing the
 *   category name. Locating via `getByRole('meter', { name: categoryName })`
 *   uses Playwright's role-based semantic locator (canonical per CONTEXT
 *   D-11 + Phase 73 `playwright/no-raw-locators` at `'error'`); no
 *   inline-style fallback required.
 *
 * Asserting that EACH category's meter renders proves both that the SubMatch
 * grid is populated AND that each category's ScoreGauge is a distinct
 * accessibility node — collapsing the directional category into the ordinal
 * tier would fail the `getByRole('meter', { name: 'Test Category:
 * Directional (E2E-07)' })` assertion.
 */
test.describe('voter-detail per-category SubMatches (E2E-07)', { tag: ['@voter'] }, () => {
  test('per-category SubMatch grid renders Manhattan + directional metric path categories', async ({
    answeredVoterPage: page
  }) => {
    // Open the alpha candidate's drawer (E2E_CANDIDATES[0] — alpha answers
    // 4 default ordinals AND test-question-directional-1 per Plan 05 Task 1
    // alpha extension). The Manhattan-path categories render from voter's 16
    // ordinal answers; the directional-path category renders from alpha's
    // directional answer (voter has no answer there, but the matching
    // algorithm still produces a SubMatch entry per category — see
    // packages/matching/src/algorithms/matchingAlgorithm.ts:105-110).
    await page.getByTestId(testIds.voter.results.card).filter({ hasText: alphaCandidate.last_name! }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Each SubMatch ScoreGauge renders as a <div role="meter" aria-labelledby="...">
    // alongside a sibling <label> containing the category name (see
    // ScoreGauge.svelte:62-94). Locate each per-category meter by its
    // accessible name (resolved via the aria-labelledby relationship from
    // the labelled `<label>` element). This is the canonical role-based
    // locator — no testId / inline-style fallback required.
    //
    // Manhattan-path categories: 4 ordinal question categories from the
    // e2e dev-seed template (packages/dev-seed/src/templates/e2e.ts
    // question_categories.fixed). singleChoiceOrdinal questions dispatch
    // through Manhattan distance per @openvaa/matching.
    for (const categoryName of [
      'Test Category: Economy',
      'Test Category: Social',
      'Test Voter Category: Economy',
      'Test Voter Category: Social'
    ]) {
      await expect(dialog.getByRole('meter', { name: categoryName })).toBeVisible();
    }

    // Directional-path category: the new test-category-directional from
    // Phase 74 Plan 05 Task 1. The singleChoiceCategorical question
    // (test-question-directional-1) dispatches through the directional
    // metric path per packages/data/src/objects/questions/variants/
    // singleChoiceCategoricalQuestion.ts:38-62 (categorical normalization
    // creates per-choice subdimensions distinct from ordinal Manhattan).
    await expect(
      dialog.getByRole('meter', { name: 'Test Category: Directional (E2E-07)' })
    ).toBeVisible();
  });

  test('directional-metric SubMatch row exists for a candidate who answered the categorical question', async ({
    answeredVoterPage: page
  }) => {
    // Secondary assertion isolating the directional path: alpha (who has an
    // answer on test-question-directional-1 per Plan 05 Task 1) opens to a
    // SubMatch grid with 5 distinct category-name meters — 4 ordinal +
    // 1 directional. Verifying all 5 meter names render guarantees the
    // directional row is a distinct ScoreGauge entry (not collapsed/merged
    // with the ordinal categories). Asserting via `getByRole('meter', { name })`
    // anchors the directional row to its own DOM element (a <div role="meter">
    // per ScoreGauge.svelte:73-78) — collapsing into an ordinal entry would
    // make this assertion fail.
    await page.getByTestId(testIds.voter.results.card).filter({ hasText: alphaCandidate.last_name! }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const orderedCategoryNames = [
      'Test Category: Economy',
      'Test Category: Social',
      'Test Voter Category: Economy',
      'Test Voter Category: Social',
      'Test Category: Directional (E2E-07)' // directional anchor — Plan 05 Task 1
    ];
    for (const name of orderedCategoryNames) {
      await expect(dialog.getByRole('meter', { name })).toBeVisible();
    }
  });
});
