/**
 * answersLocked read-only behaviour across three surfaces:
 *   Surface 1 (UNAUTHENTICATED): the login screen says that answers are locked and offers sign-in alone, the sign-in screen it leads to says the same, and the registration page and the two screens a registration code leads to each end on that login screen.
 *   Surface 2 (AUTHENTICATED): /en/contestant/profile renders the contestant-answers-locked-warning note + every visible <input>/<textarea>/<select> is disabled.
 *   Surface 3 (AUTHENTICATED): /en/contestant/questions/[questionId] renders the same note + the question-choices radios are
 *     disabled (OpinionQuestionInput display-mode → mode !== 'answer').
 *   The note (AUTHENTICATED): the home, the profile, the questions list and a question page each render the note with the answers-locked reason and exactly one Contact support button.
 *
 * Rigidity contract: every assertion is HARD — no soft assertions, no try/catch around assertion calls, no `.catch` fallbacks on assertion-bearing locators.
 *
 * Selector discipline: testid-driven only. No `t('...')` locale-text matching. The login and the sign-in screen are asserted through their page object.
 */

import { expect, test } from '@playwright/test';
import path from 'path';
import { createContestantLoginPage } from '../../fixtures/contestant/contestantLoginPage.fixture';
import { createContestantQuestionsOverviewPage } from '../../fixtures/contestant/contestantQuestionsOverviewPage.fixture';
import { createNotEditableNote } from '../../fixtures/contestant/notEditableNote.fixture';
import { TIMEOUTS } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { contestantHomeUrlRe } from '../../utils/contestantEntityUrl';
import { testIds } from '../../utils/testIds';
import { TESTS_DIR } from '../../utils/testsDir';

const STORAGE_STATE_PATH = path.join(TESTS_DIR, '../playwright/.auth/perm-answers-locked.json');

/** The registration page and the two screens a registration code leads to. The dataset allows candidates the email and the code mode, so the answers lock is the one thing that closes them. */
const REGISTRATION_ROUTES = [
  'ContestantAppRegister',
  'ContestantAppRegisterEmail',
  'ContestantAppRegisterSignIn'
] as const;

/** A settled address on the contestant login page, whatever search parameters it carries. */
const LOGIN_URL = new RegExp(`${buildRoute({ route: 'ContestantAppLogin', locale: 'en' })}(?:[?#]|$)`);

test.describe('perm-answers-locked (surface 1 — unauthenticated)', () => {
  test('login: answersLocked surfaces login-answers-locked-info on /en/contestant', async ({ page }) => {
    const loginPage = createContestantLoginPage(page);

    // The login screen says that answers are locked, and offers sign-in alone although the dataset allows two registration modes.
    await page.goto('/en/contestant');
    await loginPage.expectEntryShown();
    await loginPage.expectAnswersLocked(true);
    await loginPage.expectRegisterOffered(false);

    // The sign-in screen its entry leads to says the same.
    await loginPage.followSignIn();
    await loginPage.expectSignInShown();
    await loginPage.expectSignInAnswersLocked();
  });

  test('registration: every registration address leads to the login page while answers are locked', async ({
    page
  }) => {
    const loginPage = createContestantLoginPage(page);
    for (const route of REGISTRATION_ROUTES) {
      await page.goto(buildRoute({ route, locale: 'en' }));
      await expect(page).toHaveURL(LOGIN_URL, { timeout: TIMEOUTS.slowPage });
      await loginPage.expectEntryShown();
      await loginPage.expectAnswersLocked(true);
    }
  });
});

test.describe('perm-answers-locked (surfaces 2 + 3 — authenticated)', () => {
  test.use({ storageState: STORAGE_STATE_PATH });

  test('profile: contestant-answers-locked-warning visible + every visible input disabled', async ({ page }) => {
    await page.goto('/en/contestant/profile');
    await expect(page.getByTestId(testIds.contestant.common.answersLockedWarning)).toBeVisible();

    // Every interactive form control on the profile page must be disabled when answersLocked=true. Build a role union (textbox covers text/email inputs + textareas; combobox covers selects; spinbutton covers number inputs; checkbox/radio cover QuestionInput choices) — getByRole only matches accessibility-tree (i.e. visible) elements, so no `:visible` filter is needed. Iterate and assert .toBeDisabled() on each.
    const inputs = page
      .getByRole('textbox')
      .or(page.getByRole('combobox'))
      .or(page.getByRole('spinbutton'))
      .or(page.getByRole('checkbox'))
      .or(page.getByRole('radio'));
    const count = await inputs.count();
    expect(count, 'profile page must render at least one visible input').toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(inputs.nth(i)).toBeDisabled();
    }
  });

  test('opinion question: answersLockedWarning visible + every question-choices radio disabled', async ({ page }) => {
    // The per-question URL is keyed on the INTERNAL question id, not the seed external_id, so `page.goto('/en/contestant/questions/<external_id>')` is impossible. Click through the overview instead: goToQuestion expands every category, clicks the matching card's action, and awaits navigation onto the per-question route. Match by the question's displayed label (`[QU-OPIN-L5-1]`), seeded by buildMinimal.
    const questionsOverview = createContestantQuestionsOverviewPage(page);
    await questionsOverview.goToPage();
    await questionsOverview.goToQuestion(/\[QU-OPIN-L5-1\]/);

    await expect(page.getByTestId(testIds.contestant.common.answersLockedWarning)).toBeVisible();

    // The candidate question page tags its OpinionQuestionInput with `contestant-questions-answer` (testIds.contestant.questions.answerInput).
    // That prop flows through restProps onto the inner QuestionChoices <fieldset> and OVERRIDES its own `question-choices` testid (the spread sits after it). So on the candidate page the radio container is `contestant-questions-answer`, NOT `question-choices` (the latter is the voter-app fieldset testid). Scope to the registered container constant — same pattern as contestantQuestionPage.fixture's selectChoice.
    const answerContainer = page.getByTestId(testIds.contestant.questions.answerInput);
    const radios = answerContainer.getByRole('radio');
    const count = await radios.count();
    expect(count, 'contestant-questions-answer must render at least one radio').toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(radios.nth(i)).toBeDisabled();
    }
  });

  test('note: each page that says editing is closed offers one way to contact support', async ({ page }) => {
    const note = createNotEditableNote(page);
    const questionsOverview = createContestantQuestionsOverviewPage(page);

    // The app's root leads a user who edits one entity to that entity's home.
    await page.goto('/en/contestant');
    await expect(page).toHaveURL(contestantHomeUrlRe());
    await note.expectNote('answersLocked');
    await note.expectSupportButtons(1);

    await page.goto('/en/contestant/profile');
    await note.expectNote('answersLocked');
    await note.expectSupportButtons(1);

    await questionsOverview.goToPage();
    await note.expectNote('answersLocked');
    await note.expectSupportButtons(1);

    await questionsOverview.goToQuestion(/\[QU-OPIN-L5-1\]/);
    await expect(page.getByTestId(testIds.contestant.questions.answerInput)).toBeVisible();
    await note.expectNote('answersLocked');
    await note.expectSupportButtons(1);
  });
});
