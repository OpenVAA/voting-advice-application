/**
 * Candidate journey end-to-end spec.
 *
 * Structure: ONE serial-describe → ONE long test('full candidate journey end-to-end', ...) → 22 named `test.step` segments, followed by short tests that sign the journey's candidate in again and go on from where the walk left it. The walk covers:
 *   1-2.  Public static pages (/contestant/help + /contestant/privacy) reachable while unauthenticated.
 *   3.    Seed an email invitation for the unregistered candidate that confirms it and states its one nomination unconfirmed, and ask the `account-access` function for a sign-in link — between the two, no account and no editor grant exists; then read the mailed link from Mailpit, assert its shape and move it to the run's origin.
 *   4.    Open the mailed link: the auth callback verifies it, claims the invitation and lands in the app, where a user with no password is shown the set-password view in place of the page; set initial password (PASSWORD_1).
 *   5.    The terms of use follow with no second sign-in; accept + advance.
 *   5.5.  The user's grants are exactly the one the invitation promised, and the invitation is claimed.
 *   6.    Candidate home lists its tasks: the nomination complete, the profile and the opinions open and incomplete, the preview closed.
 *   6.1.  The menu shows the closed preview with no reason, and shows why it is closed only when the preview is clicked.
 *   7.    Mid-flow logout exercises the TimedModal confirmation dialog
 *         (profile incomplete → modal opens), then re-attempted
 *         /contestant/profile navigation re-redirects to /contestant/login.
 *   8.    Forgot-password: ask for a recovery link, open the mailed link as received, set PASSWORD_2 on the password-reset page.
 *   9.    Sign-in on the sign-in screen: nothing typed (the email field's error), wrong password
 *         (PASSWORD_1 → error), correct password (PASSWORD_2 → home).
 *   10.   Return from a static page (/contestant/help) via the return button.
 *   11.   Candidate home lists the same tasks after signing in again.
 *   12.   The nominations view shows the invitation's nomination, unconfirmed, and its Return leads home; the profile renders static info + filtered questions partition + required badge on the required text question.
 *   13.   Portrait upload error paths (invalid file + oversize file) + valid upload + fill all info questions EXCEPT the required one and the first one + submit + assert the home's list as before: the required field is empty, so the profile is incomplete and the preview closed.
 *   14.   Revisit profile; fill the required field; submit → questions
 *         overview.
 *   15.   Questions overview shows intro message; clickStart → first
 *         opinion question.
 *   16.   First opinion question: hero emoji + continue-disabled + select choice + continue-enabled + enterInfo + clickContinue.
 *   17.   Return to overview: continue-prompt + Q1 answered (round-trip OPEN_ANSWER_1) + Q2 has answer button + category expander toggles.
 *   18.   Edit Q1: change choice + change info + clickContinue → overview
 *         shows updated values.
 *   19.   Walk remaining opinion questions (first choice, clickContinue) then the home lists three complete tasks + the preview open.
 *   20.   Overview shows completion message + no continue prompt.
 *   21.   Preview renders all info answers + portrait + opinion answers + NO voter-comparison messaging.
 *   22.   Final logout without dialog (post-completion path) → /contestant/login.
 *
 * Rigidity contract:
 *   - 0 try/catch wrapping expect()
 *   - 0 .catch(() => null) on assertion-bearing locator interactions
 *   - expect.soft is used, in the optional-page checks and the link field's error check, where a failure should not abort the remaining 20 steps of the walk. This spec is outside SOFT_ASSERTION_BUDGETS, which is deliberately scoped to voter-journey.spec.ts; see the note above that table in playwright.config.ts.
 *
 * After the walk:
 *   - The candidate removes the portrait uploaded in step 13 and saves; the profile shows no portrait afterwards, and the stored object stops being served.
 *   - With the answer to the first opinion question removed as an administrator would, the candidate writes its open answer before choosing an answer: Save stays disabled and says why until an answer is chosen, and then saves both.
 *
 * Starts UNAUTHENTICATED (test.use storageState empty-cookies).
 *
 * Registration goes through the invitation model: nothing in this walk creates the user or writes its grant. The password-reset step asks for a recovery link on the forgot-password page and opens the mailed link as received.
 *
 * Running:
 *   yarn test:e2e --project=contestant-journey --reporter=list
 *
 * Runs under the `data-setup-contestant-journey → contestant-journey → data-teardown-contestant-journey` chain, sequenced after voter-journey via `dependencies: ['voter-journey']` (shared 'test-' prefix race).
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '../../fixtures/contestant/contestant-journey';
import { createNavMenu } from '../../fixtures/shared/navMenu.fixture';
import { TIMEOUTS } from '../../helpers';
import {
  contestantAppRootUrlRe,
  contestantHomeUrlRe,
  contestantSettingsUrlRe,
  contestantUrlRe
} from '../../utils/contestantEntityUrl';
import {
  INFO_QUESTION_ANSWERS,
  MULTIPLE_TEXT_ANSWERS,
  OPEN_ANSWER_1,
  OPEN_ANSWER_1_EDITED,
  PASSWORD_1,
  PASSWORD_2,
  UNREGISTERED_CANDIDATE_EMAIL,
  UNREGISTERED_CANDIDATE_EXTERNAL_ID,
  UNREGISTERED_CANDIDATE_NOMINATION
} from '../../utils/contestantJourneyConstants';
import { SIGN_IN_LINK_EMAIL_SUBJECT } from '../../utils/invitationConstants';
import { assertSignInLinkShape, openMailedLink, runOriginFromEnv, toRunOrigin } from '../../utils/mailedLink';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';
import { TESTS_DIR } from '../../utils/testsDir';
import type { Locator, Page } from '@playwright/test';
import type { ContestantQuestionPageFixture } from '../../fixtures/contestant/contestantQuestionPage.fixture';
import type { EntityGrantTarget } from '../../utils/supabaseAdminClient';

// ====================================================================
// FILE-SCOPE CONSTANTS
//
// Timeout buckets are imported from the central helpers/timeouts.ts.
// testMax (90_000) equals the playwright.config global ceiling, so test.setTimeout(TIMEOUTS.testMax) keeps the full 90s budget for this walk.
// ====================================================================

/**
 * The candidate this walk registers, as the base dataset names it. The dataset seeds it unconfirmed and without a nomination; the walk's invitation confirms it and nominates it, unconfirmed, so voters never see it.
 */
const JOURNEY_CANDIDATE: EntityGrantTarget = Object.freeze({
  entityType: 'candidate',
  externalId: UNREGISTERED_CANDIDATE_EXTERNAL_ID
});

/**
 * The name the contestant app shows when the project serves candidates and organizations, as the base dataset declares. Read from the English message source rather than copied.
 */
const BASE_DATASET_APP_NAME: string = JSON.parse(
  fs.readFileSync(path.join(TESTS_DIR, '../../apps/frontend/messages/en/dynamic.json'), 'utf8')
).dynamic.contestantAppName.candidateAndOrganization;

// ====================================================================
// candidate nav-menu auth-state item sets
//
// Exact ordered accessible-name lists for the items the navMenu fixture's `items()` reader resolves (the `nav-menu-item` testid). Derived at build by reading the rendered candidate drawer on the e2e/base dataset (4 locales → the active `en` plus three language items Suomi / Svenska / English).
//
// NOTE: the AUTHENTICATED candidate nav group (Start / Nominations / Basic Information / Your Opinions / Preview / Settings) carries its OWN `contestant-nav-*` testids — NavItem.svelte spreads the caller's `data-testid` over its default `nav-menu-item`, so those items are invisible to the `nav-menu-item` reader and are asserted separately via `assertContestantAuthNavPresent`.
// ====================================================================

// The active-locale language item (`en`, since this walk runs on `/en`) is `disabled={loc === currentLocale}` in LanguageSelection.svelte. NavItem drops `href` and sets `aria-disabled` for a disabled link, so the current-locale item computes an EMPTY accessible name (`/^$/`) — the other languages are real links carrying their language name.
const CONTESTANT_NAV_LOGGED_OUT: ReadonlyArray<RegExp> = Object.freeze([
  /^Close menu$/,
  /^Sign in$/,
  /^Register$/,
  /^Forgot Password\?$/,
  /^Support$/,
  /^Privacy$/,
  /^Send feedback$/,
  /^$/, // active locale (English) — disabled, empty accessible name
  /^Suomi$/,
  /^Svenska$/
]);

const CONTESTANT_NAV_LOGGED_IN: ReadonlyArray<RegExp> = Object.freeze([
  /^Close menu$/,
  /^Support$/,
  /^Privacy$/,
  /^Send feedback$/,
  /^$/, // active locale (English) — disabled, empty accessible name
  /^Suomi$/,
  /^Svenska$/
]);

/**
 * Assert the authenticated candidate nav group is present in the open drawer with every item open: the home, nominations, profile, questions, preview and settings items, each a link into the entity the URL names. The profile, questions and preview items have a link target only while the entity can open their pages, so this is the menu of an entity that has a nomination and nothing left to answer.
 * These items carry their own `contestant-nav-*` testids (not `nav-menu-item`), so they're asserted directly rather than through the navMenu fixture's `items()` reader. Hoisted to module scope so the per-id `expect` runs outside the test body's flow (playwright/no-standalone-expect is satisfied by the test-body call site; the loop-free explicit list keeps each assert flat).
 */
async function assertContestantAuthNavPresent(menu: Locator): Promise<void> {
  await expect(menu.getByTestId('contestant-nav-home')).toBeVisible();
  await expect(menu.getByTestId('contestant-nav-nominations')).toBeVisible();
  await expect(menu.getByTestId('contestant-nav-profile')).toBeVisible();
  await expect(menu.getByTestId('contestant-nav-questions')).toBeVisible();
  await expect(menu.getByTestId('contestant-nav-preview')).toBeVisible();
  await expect(menu.getByTestId('contestant-nav-settings')).toBeVisible();
  // Every link of the group but settings leads into the entity the URL names: no item passes the entity itself, the route builder carries it from the current page. Settings leads to the user's own page at the app's root.
  await expect(menu.getByTestId('contestant-nav-home')).toHaveAttribute('href', contestantHomeUrlRe());
  await expect(menu.getByTestId('contestant-nav-nominations')).toHaveAttribute('href', contestantUrlRe('/nominations'));
  await expect(menu.getByTestId('contestant-nav-profile')).toHaveAttribute('href', contestantUrlRe('/profile'));
  await expect(menu.getByTestId('contestant-nav-questions')).toHaveAttribute('href', contestantUrlRe('/questions'));
  await expect(menu.getByTestId('contestant-nav-preview')).toHaveAttribute('href', contestantUrlRe('/preview'));
  await expect(menu.getByTestId('contestant-nav-settings')).toHaveAttribute('href', contestantSettingsUrlRe());
  // The logged-out-only items must be ABSENT from the authenticated menu.
  await expect(menu.getByTestId('nav-menu-item').filter({ hasText: /^Sign in$/ })).toHaveCount(0);
  await expect(menu.getByTestId('nav-menu-item').filter({ hasText: /^Register$/ })).toHaveCount(0);
}

/**
 * Assert the signed-in menu of a page whose URL names no entity: the home item leads to the app root, and the items of an entity are absent, because their links cannot be built without one.
 */
async function assertContestantEntityLessNav(menu: Locator): Promise<void> {
  await expect(menu.getByTestId('contestant-nav-home')).toHaveAttribute('href', contestantAppRootUrlRe());
  await expect(menu.getByTestId('contestant-nav-nominations')).toHaveCount(0);
  await expect(menu.getByTestId('contestant-nav-profile')).toHaveCount(0);
  await expect(menu.getByTestId('contestant-nav-questions')).toHaveCount(0);
  await expect(menu.getByTestId('contestant-nav-preview')).toHaveCount(0);
  await expect(menu.getByTestId('contestant-nav-settings')).toHaveCount(0);
}

/**
 * Valid portrait path — reuses the existing tests/tests/data/assets/test-poster.jpg fixture (passes Input.svelte's image-type check; well under the 20MB ceiling).
 */
const VALID_PORTRAIT_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../data/assets/test-poster.jpg'
);

/**
 * Invalid portrait path — the existing tests/tests/data/test-not-an-image.txt fixture (text file, fails the image-type check). Same fixture contestant-profile-validation.spec.ts uses for the invalid-file cell.
 */
const INVALID_PORTRAIT_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../data/test-not-an-image.txt'
);

/**
 * How long the database's deletion of a stored object, which is sent only after the writing transaction commits, gets before the object is called undeleted.
 */
const STORED_OBJECT_DELETE_POLL = { timeout: 30_000, intervals: [500, 1000, 2000] };

/**
 * The HTTP status of an anonymous GET of a public stored object. A deleted object answers 400.
 * @param url - The object's public address, as the page shows it.
 */
async function publicObjectStatus(url: string): Promise<number> {
  const response = await fetch(url);
  return response.status;
}

/**
 * The external id of the opinion question whose open answer is written before its answer, in the base dataset. It takes an open answer.
 */
const OPEN_ANSWER_QUESTION_EXTERNAL_ID = 'test-e2e-base-qu-opin-base-1-likert5';

/**
 * The open answer written before the question is answered.
 */
const OPEN_ANSWER_BEFORE_CHOICE = '[OPEN-ANSWER-FIRST] Written before the answer was chosen';

/**
 * Remove one answer, with its open answer, from the stored answers of the journey's candidate, as an administrator would.
 * @param client - An admin client of the suite's project.
 * @param questionExternalId - The external id of the question whose answer is removed.
 * @throws If the candidate or the question is not found once, or the write fails.
 */
async function removeStoredAnswer(client: SupabaseAdminClient, questionExternalId: string): Promise<void> {
  const candidates = await client.findData('candidates', { externalId: { $eq: UNREGISTERED_CANDIDATE_EXTERNAL_ID } });
  const questions = await client.findData('questions', { externalId: { $eq: questionExternalId } });
  const candidateRows = candidates.type === 'success' ? (candidates.data ?? []) : [];
  const questionRows = questions.type === 'success' ? (questions.data ?? []) : [];
  if (candidateRows.length !== 1) throw new Error('removeStoredAnswer: the journey candidate was not found once');
  if (questionRows.length !== 1)
    throw new Error(`removeStoredAnswer: the question ${questionExternalId} was not found once`);
  const [candidate] = candidateRows;
  const [question] = questionRows;
  const answers = { ...((candidate.answers as Record<string, unknown> | null) ?? {}) };
  delete answers[question.id as string];
  await client.update('candidates', candidate.id as string, { answers });
}

/**
 * Tmp-dir path for the runtime-generated oversized PNG. Built once per file in `test.beforeAll` to avoid committing a 21MB binary.
 */
const OVERSIZED_PNG_PATH = path.join(os.tmpdir(), 'contestant-journey-oversized.png');

/**
 * Subset of INFO_QUESTION_ANSWERS to fill in step 13 — excludes test-qu-info-text (the required field, deliberately left blank).
 * Pre-computed at module scope to avoid an `if` inside the test body (playwright/no-conditional-in-test).
 */
const STEP_13_INFO_FILL_ENTRIES: ReadonlyArray<readonly [string, string]> = Object.freeze(
  Object.entries(INFO_QUESTION_ANSWERS).filter(([externalId]) => externalId !== 'test-qu-info-text')
);

/**
 * Walk the per-question editor for the candidate opinion-question loop in step 19. At each /contestant/questions/{id} URL: select choice 0 + clickContinue. Loop until the URL leaves the per-question editor surface (the save of the last unanswered question leads to the entity's home, or to the profile while it is incomplete).
 *
 * The loop ceiling (`MAX_STEPS`) is a defensive guard against an infinite walk if the dispatch logic regresses; base currently exposes ~10 applicable opinion questions to the unregistered candidate (Base ×7 — incl. the number + multi-choice questions — + Opt-A ×1 + Opt-B ×1 + EL-Reg ×1), so 20 is a loose ceiling.
 *
 * Per-question answering is TYPE-AWARE: a number-scale question is answered via the native slider (focus + End); a multi-choice checkbox question via the smallest valid selection; every other
 * (radio) question via the first choice. Without per-type driving the number question has no choice to click and the multi-choice needs a selection inside its window, so Save would stay disabled and the walk would stall.
 *
 * Hoisted to module scope (mirrors voter-journey precedent) to satisfy `playwright/no-conditional-in-test` — the `if` inside is the walk's loop-exit condition, not a race mask.
 */
async function walkRemainingOpinionQuestions(
  page: Page,
  questionPage: ContestantQuestionPageFixture,
  timeoutMs: number
): Promise<void> {
  const MAX_STEPS = 20;
  const PER_QUESTION_URL_RE = contestantUrlRe('/questions', 'child');
  // The caller arrives here right after a SPA navigation (clickContinuePrompt's <a href> click), which is NOT reflected in page.url() synchronously. Wait for the first per-question editor to settle before reading the URL — otherwise the loop sees the stale overview URL and exits having answered nothing.
  await page.waitForURL(PER_QUESTION_URL_RE, { timeout: timeoutMs });
  for (let i = 0; i < MAX_STEPS; i++) {
    const current = page.url();
    if (!PER_QUESTION_URL_RE.test(current)) return;
    // Type-aware answer scoped to THIS question's id (from the URL), so a mid-transition read never clicks the outgoing question's stale choices.
    const currentId =
      current
        .replace(/[?#].*$/, '')
        .replace(/\/+$/, '')
        .split('/')
        .pop() ?? '';
    await questionPage.answerCurrentQuestion(currentId);
    await questionPage.expectContinueEnabled();
    await questionPage.clickContinue();
    // `clickContinue` (Save and Continue) saves then SPA-navigates to the next unanswered question — or, after the last one, away from the questions. Wait for the URL to actually leave the current question so the next iteration reads fresh state (and doesn't re-answer the same question on a stale URL read).
    await page.waitForURL((u) => u.toString() !== current, { timeout: timeoutMs });
  }
}

/**
 * Generate the oversized PNG fixture on disk. The handler at Input.svelte checks `file.type.startsWith('image/')` first (passes when the browser maps the `.png` extension to `image/png`), then checks `file.size > maxFilesize` (trips because 21MB > 20MB ceiling). A real PNG decode is NOT required — the rejection branch fires on size alone.
 */
function buildOversizedPng(): void {
  const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const TARGET_BYTES = 21 * 1024 * 1024;
  const buf = Buffer.concat([PNG_SIGNATURE, Buffer.alloc(TARGET_BYTES - PNG_SIGNATURE.length, 0)]);
  fs.writeFileSync(OVERSIZED_PNG_PATH, buf);
}

/**
 * Extract the internal question id from a settled per-question editor URL (`/contestant/questions/<id>`). The choice inputs carry `name="questionChoices-<id>"`, so this id scopes the type-specific choice locators below (mirrors contestantQuestionPage.answerCurrentQuestion's id-scoping idiom, so a mid-transition read never touches a stale question's choices).
 */
function currentQuestionId(page: Page): string {
  return (
    page
      .url()
      .replace(/[?#].*$/, '')
      .replace(/\/+$/, '')
      .split('/')
      .pop() ?? ''
  );
}

/**
 * Id-scoped `question-choice` inputs for the question currently in the editor.
 * The `name="questionChoices-<id>"` conjunction with the `question-choice` testid is not expressible via getByTestId, so a raw attribute locator is used (same idiom as contestantQuestionPage.answerCurrentQuestion).
 */
function scopedChoices(page: Page, questionId: string): Locator {
  // eslint-disable-next-line playwright/no-restricted-locators -- testid+name conjunction not expressible via getByTestId
  return page.locator(`[data-testid="question-choice"][name="questionChoices-${questionId}"]`);
}

/**
 * Id-scoped `question-choice` inputs further filtered by native input `type`.
 * The input `type` is the render discriminant asserted by the type-specific steps: multi-choice categorical → `checkbox` (QuestionChoices.svelte multi branch), single-choice categorical / boolean / ordinal → `radio`.
 */
function scopedChoicesByType(page: Page, questionId: string, inputType: 'checkbox' | 'radio'): Locator {
  // eslint-disable-next-line playwright/no-restricted-locators -- testid+name+type conjunction not expressible via getByTestId
  return page.locator(`[data-testid="question-choice"][name="questionChoices-${questionId}"][type="${inputType}"]`);
}

// Start every test in this file UNAUTHENTICATED.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('candidate journey', { tag: ['@candidate'] }, () => {
  test.describe.configure({ mode: 'serial' });

  // Build the oversized PNG once per file (used by step 13's portrait upload error-path assertions). Avoids committing a 21MB binary fixture.
  test.beforeAll(async () => {
    buildOversizedPng();
  });

  test.afterAll(async () => {
    // Best-effort cleanup of the tmp fixture; ignore ENOENT.
    fs.rmSync(OVERSIZED_PNG_PATH, { force: true });
  });

  test('full candidate journey end-to-end', async ({
    page,
    emailBucket,
    invitationFlow,
    contestantLoginPage,
    contestantTermsOfUsePage,
    contestantHomePage,
    contestantForgotPasswordPage,
    contestantPasswordResetPage,
    contestantSetPasswordGate,
    contestantProfilePage,
    contestantNominationsPage,
    contestantQuestionsOverviewPage,
    contestantQuestionPage,
    contestantPreviewPage,
    contestantLogoutButton
  }) => {
    test.setTimeout(TIMEOUTS.testMax);

    const client = new SupabaseAdminClient();

    // ============== Steps 1-2: public static pages =========================

    await test.step('1. static: /contestant/help reachable while unauthenticated', async () => {
      await page.goto('/en/contestant/help');
      // The help page renders a return-home button with testid `contestant-help-home`. Visibility proves the page rendered without the auth gate redirecting to /contestant/login.
      await expect.soft(page.getByTestId(testIds.contestant.help.home)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    });

    await test.step('2. static: /contestant/privacy reachable while unauthenticated', async () => {
      await page.goto('/en/contestant/privacy');
      await expect.soft(page.getByTestId(testIds.contestant.privacy.home)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    });

    // ============== Step 2.5: candidate nav-menu (logged-out) ====

    // candidate nav-menu logged-out vs logged-in.
    // Logged-out item set: the menu (still unauthenticated on the public /contestant/privacy page) renders the EXACT ordered list below. All ten are anchored on the `nav-menu-item` testid the navMenu fixture reads.
    // Labels derived at build by reading the rendered drawer on the e2e/base dataset (4 locales → 3 extra language items beyond the active `en`).
    await test.step('2.5. candidate nav-menu logged-out item set', async () => {
      await page.goto('/en/contestant/privacy');
      const navMenu = createNavMenu(page);
      await navMenu.openMobileNav();
      await navMenu.expectNavMenuItems([...CONTESTANT_NAV_LOGGED_OUT]);
      // Close the drawer so the subsequent registration flow starts clean.
      await page.keyboard.press('Escape');
    });

    // ============== Step 3: seed invitation + ask for link + read the mail ==

    let registrationUrl = '';

    await test.step('3. registration: seed an invitation + ask for a sign-in link + read the mailed link', async () => {
      // Self-heal: a user an interrupted run left behind would turn this first-time registration into a returning user's sign-in, which is not asked to set a password, and a nomination it left behind would meet the one this invitation creates.
      await client.unregisterCandidate(UNREGISTERED_CANDIDATE_EMAIL);
      await client.bulkDelete({ nominations: { external_ids: [UNREGISTERED_CANDIDATE_NOMINATION.externalId] } });

      // The invitation is seeded, and only then is the link asked for. Between the two, the seeding alone has created no account for the address and no editor of the candidate.
      // The one call confirms the candidate and states its only nomination unconfirmed, so voters never see the candidate: voter specs read this dataset's public rows while this walk runs.
      await client.inviteByEmail({
        ...JOURNEY_CANDIDATE,
        email: UNREGISTERED_CANDIDATE_EMAIL,
        locale: 'en',
        confirmEntity: true,
        nominations: [await client.invitationNomination({ ...UNREGISTERED_CANDIDATE_NOMINATION, confirmed: false })],
        afterSeeding: async (seeded) => {
          await invitationFlow.expectSeedingAloneCreatedNothing(JOURNEY_CANDIDATE, UNREGISTERED_CANDIDATE_EMAIL);
          expect(seeded.entity_confirmed, 'the invitation confirmed the candidate').toBe(true);
          // Party AA holds a nomination in this contest, so no parent nomination is created.
          expect(seeded.nominations).toEqual({ inserted: 1, updated: 0, unchanged: 0, parents_created: 0 });
        }
      });

      // The request has handed its mail over, so the newest mail with the sign-in subject is this request's.
      const links = await emailBucket.getLinksInEmail(SIGN_IN_LINK_EMAIL_SUBJECT);
      // Asserted as a number: the link holds the sign-in token, which must not reach the report.
      const linkCount = links.length;
      expect(linkCount, 'the sign-in mail holds exactly one link').toBe(1);
      // The link is opened as received: its path, parameters and type are asserted, and only its origin is replaced by the run's.
      assertSignInLinkShape(links[0], { locale: 'en' });
      registrationUrl = toRunOrigin(links[0], runOriginFromEnv());
    });

    // ============== Step 4: open the mailed link + set initial password ====

    await test.step('4. registration: open the mailed link + set initial password', async () => {
      await openMailedLink(page, registrationUrl);
      // Continue on the confirm page verifies the token, claims the invitation, refreshes the session and lands the user in the app. The user has no password, so the protected layout shows the set-password view in place of the page, naming the account it is for.
      await contestantSetPasswordGate.expectShown();
      await contestantSetPasswordGate.expectAddress(UNREGISTERED_CANDIDATE_EMAIL);
      await contestantSetPasswordGate.setPassword(PASSWORD_1);
    });

    // ============== Step 5: accept Terms of Use ===========================

    await test.step('5. ToU: accept and advance', async () => {
      // The saved password is read by the rerun load, and the user stays signed in: the terms-of-use view replaces the set-password view with no sign-in between them. The user registered through the invitation has no acceptance for the project.
      await contestantTermsOfUsePage.expectShown();
      await contestantSetPasswordGate.expectGone();
      // The replacement is no navigation, so the protected layout moves focus to the new view's heading itself.
      await contestantTermsOfUsePage.expectHeadingFocused();
      await contestantTermsOfUsePage.acceptAndAdvance();
      // Settle on the candidate home (status message visible), with focus on its heading.
      await expect(page.getByTestId(testIds.contestant.home.statusMessage)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
      await contestantHomePage.expectHeadingFocused();
    });

    // ============== Step 5.5: the claimed grant ===========================

    await test.step('5.5. registration: the user holds exactly the grant the invitation promised', async () => {
      // Read with the service role. Nothing in this walk writes a grant: the row is the one the claim wrote when the mailed link was opened.
      expect(await invitationFlow.grantRowsOf(UNREGISTERED_CANDIDATE_EMAIL)).toEqual([
        await invitationFlow.editorGrantOn(JOURNEY_CANDIDATE)
      ]);
      const invitations = await invitationFlow.invitationsAddressedTo(UNREGISTERED_CANDIDATE_EMAIL);
      expect(invitations).toHaveLength(1);
      expect(invitations[0].claimed_at, 'the invitation is claimed').not.toBeNull();
    });

    // ============== Step 6: home lists the tasks =========================

    await test.step('6. home: the nomination complete, the profile and the opinions open, the preview closed', async () => {
      // The candidate has a nomination and has filled in nothing: the profile and the opinions are both open and incomplete, and the preview stays closed until both are done.
      await contestantHomePage.expectTaskList({
        nomination: 'complete',
        profile: 'incomplete',
        questions: 'incomplete'
      });
      await contestantHomePage.expectPreview('closed');
    });

    await test.step('6.1. menu: the closed preview says why only when it is clicked', async () => {
      const navMenu = createNavMenu(page);
      await navMenu.openMobileNav();
      await navMenu.expectClosedItems(['preview']);
      await navMenu.expectNoReasonShown();
      await navMenu.expectClosedItemReason('preview', 'previewNotReady');
      await navMenu.closeNav();
    });

    // ============== Step 7: mid-flow logout with dialog ==================

    await test.step('7. logout: mid-flow with TimedModal dialog + re-attempted nav redirects to login', async () => {
      // Profile is incomplete (no answers + no portrait yet) so the logout button opens the TimedModal confirmation dialog.
      await contestantLogoutButton.clickWithDialog();
      // The logout lands on the login screen, at its bare address and with no notice.
      await contestantLoginPage.expectEndedOnEntry();
      // Navigate directly to /contestant/profile while unauthenticated: the visitor is sent to the login screen.
      await page.goto('/en/contestant/profile');
      await expect(page).toHaveURL(/\/contestant\/login/, { timeout: TIMEOUTS.slowPage });
      // The login screen reads the base dataset's contestant app settings from the readable row of an open project: candidates and organizations served, and a registration mode listed, so it offers Register beside the sign-in entry. Being sent here from a protected address is no reason for a notice.
      await contestantLoginPage.expectEntryShown();
      await contestantLoginPage.expectRegisterOffered(true);
      await contestantLoginPage.expectAnswersLocked(false);
      await contestantLoginPage.expectNoNotice();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(BASE_DATASET_APP_NAME);
    });

    // ============== Step 8: forgot-password reset flow ====================

    await test.step('8. forgot-password: ask for a recovery link + open the mailed link + set PASSWORD_2', async () => {
      // The address was mailed its sign-in link earlier in this walk, and the server sends one mail per address a minute: the address's slot is given back, so that this request sends.
      await invitationFlow.releaseLinkSlot(UNREGISTERED_CANDIDATE_EMAIL);
      await contestantForgotPasswordPage.open();
      // The page says nothing about the request: it leads to the screen that says an email was sent. The page's one request carries a completion witness, which says when its background work is over and what it did.
      const recovery = await invitationFlow.witnessPageRequest(page, async () => {
        await contestantForgotPasswordPage.submit(UNREGISTERED_CANDIDATE_EMAIL);
        await contestantForgotPasswordPage.expectLedToEmailSent(UNREGISTERED_CANDIDATE_EMAIL);
      });
      expect(recovery, 'the recovery request handed a mail over').toBe('sent');
      // The address is the same in every run, so the mail catcher can hold a recovery mail of an earlier run, whose link is spent. The request has handed its mail over, so the newest mail with the recovery subject is this request's.
      // The mailed recovery link is opened as received, on the run's origin, and confirmed on the confirm page, which signs the user in and lands on the password-reset page, which names the account.
      await openMailedLink(
        page,
        await invitationFlow.recoveryLinkToOpen(UNREGISTERED_CANDIDATE_EMAIL, { locale: 'en' })
      );
      await contestantPasswordResetPage.expectShown();
      await contestantPasswordResetPage.expectAddress(UNREGISTERED_CANDIDATE_EMAIL);
      await contestantPasswordResetPage.setPassword(PASSWORD_2);
      // A saved password leaves the user signed in and leads to the app root, which sends a user with one entity to that entity's home. The terms were accepted in step 5, so no other view comes first.
      await page.waitForURL(contestantHomeUrlRe(), { timeout: TIMEOUTS.slowPage });
      await expect(page.getByTestId(testIds.contestant.home.statusMessage)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    });

    // ============== Step 9: sign-in with nothing typed + wrong-pw ========

    await test.step('9. sign-in: nothing typed + wrong password + correct password', async () => {
      // First log out so that the sign-in screen is shown to this visitor. The logout ends with a navigation of its own, which has to have landed before another address is opened.
      await contestantLogoutButton.clickWithDialog();
      await contestantLoginPage.expectEndedOnEntry();
      await contestantLoginPage.goToPage();
      // The screen cancels a press with a field empty in its script, so the script has to have loaded first.
      await contestantLoginPage.signInScriptLoaded();
      // Nothing typed → nothing is sent, and the email field says what to enter.
      await contestantLoginPage.submit();
      await contestantLoginPage.expectEmailError();
      // Login with PASSWORD_1 (old, now wrong) → error message.
      await contestantLoginPage.login(UNREGISTERED_CANDIDATE_EMAIL, PASSWORD_1);
      await contestantLoginPage.expectErrorMessage();
      // Login with PASSWORD_2 (correct) → home (ToU already accepted, no re-acceptance prompt expected).
      await contestantLoginPage.enterPassword(PASSWORD_2);
      await contestantLoginPage.submit();
      await expect(page.getByTestId(testIds.contestant.home.statusMessage)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    });

    // ============== Step 10: return-from-static page =====================

    await test.step('10. static: help and privacy while signed in + return to the entity home', async () => {
      await page.goto('/en/contestant/help');
      // The button names the app root, which redirects a user with one entity to that entity's home.
      await page.getByTestId(testIds.contestant.help.home).click();
      await page.waitForURL(contestantHomeUrlRe(), { timeout: TIMEOUTS.slowPage });
      await expect(page.getByTestId(testIds.contestant.home.statusMessage)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
      // Privacy names no entity either. Its signed-in menu is asserted, and the menu's own home item is the way back.
      await page.goto('/en/contestant/privacy');
      const navMenu = createNavMenu(page);
      await navMenu.openMobileNav();
      await assertContestantEntityLessNav(navMenu.menu);
      await navMenu.menu.getByTestId('contestant-nav-home').click();
      await page.waitForURL(contestantHomeUrlRe(), { timeout: TIMEOUTS.slowPage });
      await expect(page.getByTestId(testIds.contestant.home.statusMessage)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    });

    // ============== Step 11: home lists the same tasks ===================

    await test.step('11. home: the same task list after signing in again', async () => {
      await contestantHomePage.expectTaskList({
        nomination: 'complete',
        profile: 'incomplete',
        questions: 'incomplete'
      });
      await contestantHomePage.expectPreview('closed');
    });

    // ============== Step 12: the nomination on its view + profile static info + filtered partition ====

    await test.step('12. nominations view: the nomination; profile: no nominations section + static info + filtered questions partition + required badge', async () => {
      // The nomination is read on the nominations view, opened by the address that names no entity. The journey's invitation nominated the candidate once, unconfirmed: under party AA in Region North of the regional election, with the election symbol "999".
      await contestantNominationsPage.openWithoutEntity();
      await contestantNominationsPage.expectCardCount(1);
      await contestantNominationsPage.expectCard(0, {
        election: '[el-reg] Regional Election',
        constituency: '[co-reg-n] Region North',
        symbol: '999',
        parent: '[or-aa] Party AA',
        confirmed: false
      });
      // Back on the home through the view's Return, beside its Continue to the profile; the profile is entered from the home through its task.
      await contestantNominationsPage.expectButton('continue');
      await contestantNominationsPage.expectReturnAction();
      await contestantNominationsPage.pressReturn();
      await page.waitForURL(contestantHomeUrlRe(), { timeout: TIMEOUTS.slowPage });
      await expect(page.getByTestId(testIds.contestant.home.statusMessage)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
      await contestantHomePage.clickTask('profile');
      await expect(page).toHaveURL(contestantUrlRe('/profile'), { timeout: TIMEOUTS.slowPage });
      // Static info: candidate first name visible. The profile shows nothing of the nomination.
      await contestantProfilePage.expectStaticInfo({ name: 'Unregistered' });
      await contestantProfilePage.expectNoNominationsSection();
      // Visible info questions: all of test-qg-info EXCEPT the mun-only (filtered by election) and the south-only (filtered by constituency). North-only IS visible (the candidate is in CO-Reg-N).
      // Match the full bracketed `[id]` token (not a bare substring) so each regex resolves to exactly one rendered question — e.g. `[qu-info-text]` must not also match `[qu-info-text-longText]` / `[qu-info-text-link]`.
      await contestantProfilePage.expectQuestionsVisible([
        /\[qu-info-multipleChoiceCategorical\]/,
        /\[qu-info-singleChoiceCategorical\]/,
        /\[qu-info-text\]/,
        /\[qu-info-text-longText\]/,
        /\[qu-info-text-link\]/,
        /\[qu-info-number\]/,
        /\[qu-info-boolean\]/,
        /\[qu-info-date\]/,
        // multipleText info question, rendered by the MultipleTextPart row-list inside Input.
        /\[qu-info-multipleText\]/,
        /\[qu-info-filt-co-reg-n\]/
      ]);
      await contestantProfilePage.expectQuestionsAbsent([/\[qu-info-filt-mun-only\]/, /\[qu-info-filt-co-reg-s\]/]);
      // Required badge on test-qu-info-text (only question with required:true in the info category of the base dataset).
      await contestantProfilePage.expectRequiredBadge(/\[qu-info-text\]/);
    });

    // ============== Step 13: portrait upload + partial profile fill ======

    await test.step('13. profile: portrait errors + valid upload + fill info except required + first + submit', async () => {
      // Invalid file format → invalidFile error.
      await contestantProfilePage.uploadPortrait({
        path: INVALID_PORTRAIT_PATH,
        expectError: 'invalidFile'
      });
      // Oversize file → oversizeFile error.
      await contestantProfilePage.uploadPortrait({
        path: OVERSIZED_PNG_PATH,
        expectError: 'oversizeFile'
      });
      // Valid image upload (no expectError → no assertion on error wrapper).
      await contestantProfilePage.uploadPortrait({ path: VALID_PORTRAIT_PATH });
      // Fill all info questions EXCEPT the required one (test-qu-info-text) AND the first one (the categorical-input questions are not in INFO_QUESTION_ANSWERS because the fillQuestion textbox helper can't fill them). Pre-filtered subset at module scope per playwright/no-conditional-in-test.
      for (const [externalId, value] of STEP_13_INFO_FILL_ENTRIES) {
        // The rendered question label is the base `name` (`[qu-info-…]`), which drops the `test-` prefix carried by the externalId. Strip it and wrap in the full bracketed `[id]` token so the label regex resolves to exactly one question (mirrors steps 12 + 13.5 + 14).
        const id = externalId.replace(/^test-/, '');
        await contestantProfilePage.fillQuestion(new RegExp(`\\[${id}\\]`), value);
      }
      // Fill the multipleText info question (a string[] row list, so it lives outside INFO_QUESTION_ANSWERS). required:false → this must NOT change the required-empty submit-disabled gate the step already asserts; the values are round-tripped in step 21 (candidate leg).
      await contestantProfilePage.fillMultipleTextQuestion(/\[qu-info-multipleText\]/, [...MULTIPLE_TEXT_ANSWERS]);
      // lock for `components.multipleTextInput.*`: with two rows filled, all four controls are in the DOM (move-up/move-down/remove render per row — only their `disabled` state is conditional — and add renders while the input is editable). Their accessible names come from the runtime Paraglide catalog, so a catalog regression would surface the raw dotted key here. Scoped to the multipleText question so a control elsewhere on the profile page cannot satisfy the assertion; located via testIds constants, never raw selector literals.
      const multiTextQuestion = contestantProfilePage.getQuestion(/\[qu-info-multipleText\]/).first();
      await expect(multiTextQuestion.getByTestId(testIds.voter.questions.multipleTextAdd)).toHaveAccessibleName(
        'Add item'
      );
      await expect(
        multiTextQuestion.getByTestId(testIds.voter.questions.multipleTextMoveUp).first()
      ).toHaveAccessibleName('Move up');
      await expect(
        multiTextQuestion.getByTestId(testIds.voter.questions.multipleTextMoveDown).first()
      ).toHaveAccessibleName('Move down');
      await expect(
        multiTextQuestion.getByTestId(testIds.voter.questions.multipleTextRemove).first()
      ).toHaveAccessibleName('Remove item');
      await contestantProfilePage.submit();
      // Post-submit lands on home. The required field is still empty, so the profile stays incomplete beside the open opinions, and the preview stays closed.
      await expect(page.getByTestId(testIds.contestant.home.statusMessage)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
      await contestantHomePage.expectTaskList({
        nomination: 'complete',
        profile: 'incomplete',
        questions: 'incomplete'
      });
      await contestantHomePage.expectPreview('closed');
    });

    // ============== Step 13.5: invalid URL → invalidUrl error ============

    await test.step('13.5. profile rejects an invalid URL in a link question with an inline error', async () => {
      // Step 13 submitted from profile → landed on home. Re-enter profile to exercise the Link-type URL validation on test-qu-info-text-link.
      // The base dataset already seeds this URL-type info question (subtype='link', settings.type='link').
      await contestantHomePage.clickTask('profile');
      await expect(page).toHaveURL(contestantUrlRe('/profile'), { timeout: TIMEOUTS.slowPage });
      // Fill the link question with a clearly invalid URL.
      await contestantProfilePage.fillQuestion(/\[qu-info-text-link\]/, 'not-a-url');
      // Scoped to the link question: another field's error, such as a still-empty required question's, must not satisfy or confuse the waits below.
      const linkFieldError = contestantProfilePage
        .getQuestion(/\[qu-info-text-link\]/)
        .first()
        .getByTestId(testIds.shared.inputError);
      // Trigger validation by blurring the field (Input.svelte's checkUrl runs on input change; tab off to force evaluation in headless mode).
      await page.keyboard.press('Tab');
      // Assert the inline ErrorMessage's input-error testid surfaces the invalidUrl error. The element renders the *translated value* (not the key), so the regex matches the actual en + fi strings for components.input.error.invalidUrl: en "The URL is not valid.", fi "Verkko-osoite ei ole kelvollinen."
      await expect.soft(linkFieldError).toContainText(/not valid|ei ole kelvollinen/i, { timeout: TIMEOUTS.element });
      // Clear the field so step 14 isn't blocked by validation when it re-submits the form with the required field filled.
      await contestantProfilePage.fillQuestion(/\[qu-info-text-link\]/, '');
      // Commit the cleared value before clicking Save: the field validates on blur, and the blur also removes the invalid-URL error above it. Blurring by the Save click itself would let that removal shift the button between mousedown and mouseup, and the click would be lost. So blur first and wait for the error to go.
      await page.keyboard.press('Tab');
      await expect(linkFieldError).toBeHidden({ timeout: TIMEOUTS.slowPage });
      // Return to home so step 14's clickTask('profile') re-navigates cleanly.
      await page.getByTestId(testIds.contestant.profile.submit).click();
      // Positively settle on the contestant-home route BEFORE asserting the home status message. With the required field still empty, the profile's save leads to the home of the entity in the URL. Asserting that exact destination makes a misroute (to login, an error page or another candidate sub-route) fail here and name the true destination.
      // The pattern matches the entity's home with or without a trailing slash, a query or a fragment (tolerating an optional locale prefix), but not the app root, which carries no entity, nor the profile page or any other sub-route.
      // The URL settle stays split from the element-visibility wait, so the status check runs against an already-navigated home route rather than a mid-transition DOM.
      await page.waitForURL(contestantHomeUrlRe(), { timeout: TIMEOUTS.slowPage });
      await expect(page.getByTestId(testIds.contestant.home.statusMessage)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    });

    // ============== Step 14: revisit profile + fill required + advance ===

    await test.step('14. profile: revisit + fill required + submit → questions overview', async () => {
      await contestantHomePage.clickTask('profile');
      await expect(page).toHaveURL(contestantUrlRe('/profile'), { timeout: TIMEOUTS.slowPage });
      // Fill the required test-qu-info-text field this time.
      await contestantProfilePage.fillQuestion(/\[qu-info-text\]/, INFO_QUESTION_ANSWERS['test-qu-info-text']);
      await contestantProfilePage.submit();
      // With the required field filled in and opinion questions unanswered, the profile's save leads to the questions overview.
      await expect(page).toHaveURL(contestantUrlRe('/questions', 'any'), { timeout: TIMEOUTS.slowPage });
    });

    // ============== Step 15: questions overview intro + clickStart =======

    await test.step('15. questions overview: intro message + clickStart → first opinion question', async () => {
      await contestantQuestionsOverviewPage.expectIntroMessage();
      await contestantQuestionsOverviewPage.clickStart();
      // Land on the per-question editor (URL contains /questions/{id}).
      await expect(page).toHaveURL(contestantUrlRe('/questions', 'child'), {
        timeout: TIMEOUTS.slowPage
      });
    });

    // ============== Step 16: first opinion question =====================

    await test.step('16. first opinion question: hero emoji + continue gate + select + info + continue', async () => {
      // Q1 (test-qu-opin-base-1-likert5) carries custom_data.hero = { emoji: '🗳️' } in the base dataset.
      await contestantQuestionPage.expectHeroVisible('emoji');
      // No choice selected yet → continue disabled.
      await contestantQuestionPage.expectContinueDisabled();
      // Select the first choice (answer all opinions with the first value).
      await contestantQuestionPage.selectChoice(0);
      // Continue is now enabled.
      await contestantQuestionPage.expectContinueEnabled();
      // Fill the open-answer textarea.
      await contestantQuestionPage.enterInfo(OPEN_ANSWER_1);
      await contestantQuestionPage.clickContinue();
    });

    // ============== Step 17: overview round-trip + expander toggle =======

    await test.step('17. overview: continue prompt + Q1 round-trip + Q2 answer button + expander toggle', async () => {
      // Navigation post-Q1 may land at next question; navigate back to overview explicitly.
      await page.goto('/en/contestant/questions');
      await expect(page).toHaveURL(contestantUrlRe('/questions'), {
        timeout: TIMEOUTS.slowPage
      });
      // Partial-completion shortcut is visible.
      await contestantQuestionsOverviewPage.expectContinuePrompt();
      // Q1 card round-trips OPEN_ANSWER_1.
      const q1Card = contestantQuestionsOverviewPage.getQuestionCard(/\[qu-opin-base-1-likert5\]/);
      await expect(q1Card.first()).toBeVisible();
      await expect(q1Card.first()).toContainText(OPEN_ANSWER_1);
      // Q2 card is visible and rendered as an answer-able question.
      const q2Card = contestantQuestionsOverviewPage.getQuestionCard(/\[qu-opin-base-2-likert4\]/);
      await expect(q2Card.first()).toBeVisible();
      // Category-expander toggle: collapse + re-expand. The Base category expander matches its name.
      const expander = contestantQuestionsOverviewPage.getCategoryExpander(/\[qg-opin-base\]/);
      // Track initial state, click to toggle, click again to restore.
      await expander.click();
      await expander.click();
    });

    // ============== Step 18: edit Q1 ====================================

    await test.step('18. edit Q1: change choice + change info + clickContinue → overview shows updates', async () => {
      await contestantQuestionsOverviewPage.clickEditQuestion(/\[qu-opin-base-1-likert5\]/);
      await expect(page).toHaveURL(contestantUrlRe('/questions', 'child'), {
        timeout: TIMEOUTS.slowPage
      });
      // Change choice to the second option + replace the info text.
      await contestantQuestionPage.selectChoice(1);
      await contestantQuestionPage.enterInfo(OPEN_ANSWER_1_EDITED);
      await contestantQuestionPage.clickContinue();
      // Return to overview and confirm round-trip of the edited values.
      await page.goto('/en/contestant/questions');
      const q1CardEdited = contestantQuestionsOverviewPage.getQuestionCard(/\[qu-opin-base-1-likert5\]/);
      await expect(q1CardEdited.first()).toContainText(OPEN_ANSWER_1_EDITED);
    });

    // ============== Step 18.5: multi-choice type-specific ========

    // candidate leg: the walk answers the multi-choice question generically; nothing asserts its type-specific input contract.
    // Assert here that the multi-choice opinion question renders CHECKBOX inputs (not radios), the min/max helper text, and Save gating on BOTH sides of the
    // 2..3 selection window (incl. the over-max 4th). Entry point is step 18's overview state; this pre-answers qu-opin-base-7-multichoice, which is compatible with the step-19 walk (it covers only REMAINING unanswered questions).
    await test.step('18.5. multi-choice opinion — type-specific input contract (checkboxes + helper + save gating)', async () => {
      // Navigate from the overview to the multi-choice question editor via its card action (goToQuestion expands every category then clicks the card's Answer/Edit affordance and awaits navigation off the overview).
      await contestantQuestionsOverviewPage.goToQuestion(/\[qu-opin-base-7-multichoice\]/);
      await expect(page).toHaveURL(contestantUrlRe('/questions', 'child'), { timeout: TIMEOUTS.slowPage });
      const qid = currentQuestionId(page);

      // Type-specific render: 4 CHECKBOX choices and ZERO radios (the categorical / likert questions render radios — the input type is the discriminant, mirroring contestantQuestionPage.answerCurrentQuestion's detection idiom).
      await expect(scopedChoicesByType(page, qid, 'checkbox')).toHaveCount(4);
      await expect(scopedChoicesByType(page, qid, 'radio')).toHaveCount(0);

      // The min/max helper text renders — it is a TYPE-SPECIFIC contract element: QuestionChoices.svelte only emits `question-choice-helper` for a multi-choice question carrying authored min/max constraints (`{#if mode === 'answer' && multiConstraints}`), so its mere presence discriminates multi-choice from the categorical/boolean radios below.
      //
      // The text assertion below is the lock for `questions.multiChoice.selectRange`: the question's effective 2..3 window renders the range variant ("Select 2 to 3 options." in en), so a runtime catalog regression that fell back to the raw key would fail here.
      const helper = page.getByTestId(testIds.voter.questions.choiceHelper);
      await expect(helper).toBeVisible();
      await expect(helper).toHaveText(/2.*3/);

      // save gating across the 2..3 window. QuestionChoices.svelte never disables unchecked boxes (its `handleToggle`); over/under-selection surfaces on the caller's Save button via `isMultiChoiceCountValid` in multiChoiceValidity.ts (valid iff the count is within [effectiveMin=2, effectiveMax=3]).
      const boxes = scopedChoices(page, qid);
      // 1 selected → below min → Save DISABLED.
      await boxes.nth(0).click();
      await expect(boxes.nth(0)).toBeChecked();
      await contestantQuestionPage.expectContinueDisabled();
      // 2 selected → in range → Save ENABLED (the min boundary).
      await boxes.nth(1).click();
      await expect(boxes.nth(1)).toBeChecked();
      await contestantQuestionPage.expectContinueEnabled();
      // 3 selected → in range (== max) → Save ENABLED.
      await boxes.nth(2).click();
      await expect(boxes.nth(2)).toBeChecked();
      await contestantQuestionPage.expectContinueEnabled();
      // 4 selected → over max → the 4th box still CHECKS (unchecked boxes are never disabled), but Save DISABLES (over-max is invalid: `isMultiChoiceCountValid` requires count <= effectiveMax).
      await boxes.nth(3).click();
      await expect(boxes.nth(3)).toBeChecked();
      await contestantQuestionPage.expectContinueDisabled();
      // Return to an in-range selection (uncheck the 4th → 3 selected) and save.
      await boxes.nth(3).click();
      await expect(boxes.nth(3)).not.toBeChecked();
      await contestantQuestionPage.expectContinueEnabled();
      await contestantQuestionPage.clickContinue();

      // Overview reflects the answered multi-choice: the card renders the display-mode answer (question-choice markup), which is emitted ONLY when the question is answered (+page.svelte gates the display on `answer != null`).
      // Mirror step 18's post-save overview re-read.
      await page.goto('/en/contestant/questions');
      const mcCard = contestantQuestionsOverviewPage.getQuestionCard(/\[qu-opin-base-7-multichoice\]/);
      await expect(mcCard.first()).toBeVisible();
      await expect(mcCard.first().getByTestId('question-choice').first()).toBeVisible();
    });

    // ============== Step 18.6: categorical + boolean type-specific ===

    // Type-specific input contracts for the categorical and boolean opinion questions, beside 18.5. Radio input `type` + exact choice count is the discriminant vs the multi-choice checkboxes above.
    await test.step('18.6. categorical + boolean opinion — type-specific input contracts', async () => {
      // Categorical (qu-opin-base-4): singleChoiceCategorical → 3 RADIO choices.
      await contestantQuestionsOverviewPage.goToQuestion(/\[qu-opin-base-4-categorical\]/);
      await expect(page).toHaveURL(contestantUrlRe('/questions', 'child'), { timeout: TIMEOUTS.slowPage });
      const catId = currentQuestionId(page);
      await expect(scopedChoicesByType(page, catId, 'radio')).toHaveCount(3);
      await expect(scopedChoicesByType(page, catId, 'checkbox')).toHaveCount(0);
      // Answer (first choice) + save; a single radio selection is immediately valid.
      await contestantQuestionPage.selectChoice(0);
      await contestantQuestionPage.expectContinueEnabled();
      await contestantQuestionPage.clickContinue();
      await page.goto('/en/contestant/questions');
      const catCard = contestantQuestionsOverviewPage.getQuestionCard(/\[qu-opin-base-4-categorical\]/);
      await expect(catCard.first()).toBeVisible();
      await expect(catCard.first().getByTestId('question-choice').first()).toBeVisible();

      // Boolean (qu-opin-base-5): boolean → exactly 2 RADIO choices.
      await contestantQuestionsOverviewPage.goToQuestion(/\[qu-opin-base-5-boolean\]/);
      await expect(page).toHaveURL(contestantUrlRe('/questions', 'child'), { timeout: TIMEOUTS.slowPage });
      const boolId = currentQuestionId(page);
      await expect(scopedChoicesByType(page, boolId, 'radio')).toHaveCount(2);
      await expect(scopedChoicesByType(page, boolId, 'checkbox')).toHaveCount(0);
      // OpinionQuestionInput synthesizes boolean choices as ['no'→false, 'yes'→true], so index 0 saves the FALSY value deliberately: the overview must still show a falsy answer as answered. If it did not, the card below would render no display markup and its action would read "Answer this question", so all three assertions would fail.
      await contestantQuestionPage.selectChoice(0);
      await contestantQuestionPage.expectContinueEnabled();
      await contestantQuestionPage.clickContinue();
      await page.goto('/en/contestant/questions');
      const boolCard = contestantQuestionsOverviewPage.getQuestionCard(/\[qu-opin-base-5-boolean\]/);
      await expect(boolCard.first()).toBeVisible();
      await expect(boolCard.first().getByTestId('question-choice').first()).toBeVisible();
      // Discriminating assertion: the card's call to action must be the EDIT label ("Edit Your Answer"), not the unanswered "Answer this question" — the card markup alone would render either way once the guard is right.
      await expect(boolCard.first().getByTestId(testIds.contestant.questions.cardAction)).toHaveText(/edit/i);
    });

    // ============== Step 19: walk remaining opinions ======================

    await test.step('19. walk remaining opinion questions → home lists three complete tasks + preview open', async () => {
      // Start from the continue-prompt shortcut.
      await contestantQuestionsOverviewPage.clickContinuePrompt();
      // Walk: at each /questions/{id} page, select first choice + continue.
      // Module-scope helper hoists the loop-exit condition out of the test body per playwright/no-conditional-in-test.
      await walkRemainingOpinionQuestions(page, contestantQuestionPage, TIMEOUTS.slowPage);
      // The save of the last opinion question leads to the entity's home, because nothing of the profile is left to fill in. No document is loaded: the list is read as the application holds it after the saves, with every task complete and the preview open.
      await expect(page).toHaveURL(contestantHomeUrlRe(), { timeout: TIMEOUTS.slowPage });
      await contestantHomePage.expectStatusMessage();
      await contestantHomePage.expectTaskList({
        nomination: 'complete',
        profile: 'complete',
        questions: 'complete'
      });
      await contestantHomePage.expectPreview('open');
    });

    // ============== Step 19.5: candidate nav-menu (logged-in) ===

    // candidate nav-menu logged-in item set, asserted to DIFFER from the logged-out set.
    //
    // Fixture-visibility note: the authenticated candidate nav group (Start / Nominations / Basic Information / Your Opinions / Preview / Settings) carries its OWN `contestant-nav-*` testids — `NavItem.svelte` spreads the caller's `data-testid` over its default `nav-menu-item`, so those items are NOT visible to the navMenu fixture's `items()` (`nav-menu-item`) reader. So the logged-in assertion has two halves:
    //   (a) the `nav-menu-item`-anchored set the fixture sees (the auth group has DROPPED login/register/forgot-password vs logged-out), and
    //   (b) the authenticated group is PRESENT via its `contestant-nav-*` ids.
    // login/register being gone (a) AND the contestant-nav-* group appearing (b) is the auth-state difference.
    await test.step('19.5. candidate nav-menu logged-in item set (differs from logged-out)', async () => {
      const navMenu = createNavMenu(page);
      await navMenu.openMobileNav();
      // (a) The `nav-menu-item` set: login / register / forgot-password GONE.
      await navMenu.expectNavMenuItems([...CONTESTANT_NAV_LOGGED_IN]);
      // (b) The authenticated nav group is present (own testids), every item open: each task is complete at this point of the walk. The nominations item is the group's second, after the home item.
      await assertContestantAuthNavPresent(navMenu.menu);
      await navMenu.expectNominationsItem();
      // The two `nav-menu-item` sets differ (logged-out had Sign in / Register / Forgot Password? which the authenticated menu drops). Compare by regex source so the inequality is a content check, not a reference check.
      expect(CONTESTANT_NAV_LOGGED_IN.map((r) => r.source)).not.toEqual(CONTESTANT_NAV_LOGGED_OUT.map((r) => r.source));
      await page.keyboard.press('Escape');
    });

    // ============== Step 20: overview completion message =================

    await test.step('20. overview: completion message + no continue prompt', async () => {
      await page.goto('/en/contestant/questions');
      await contestantQuestionsOverviewPage.expectCompletionMessage();
      // No partial-completion continue prompt (all questions answered).
      await expect(page.getByTestId('contestant-questions-continue')).toHaveCount(0);
    });

    // ============== Step 21: preview =====================================

    await test.step('21. preview: info + portrait + opinion answers + NO voter-comparison', async () => {
      await page.goto('/en/contestant/preview');
      await expect(page.getByTestId(testIds.contestant.preview.container)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
      // Portrait is rendered.
      await contestantPreviewPage.expectPortraitVisible();
      // Info answers round-trip (sample the required + the link + the number).
      await contestantPreviewPage.expectInfoAnswer(/\[qu-info-text\]/, INFO_QUESTION_ANSWERS['test-qu-info-text']);
      await contestantPreviewPage.expectInfoAnswer(/\[qu-info-number\]/, INFO_QUESTION_ANSWERS['test-qu-info-number']);
      // multipleText round-trip (candidate leg): both values filled in step 13 must appear verbatim in the multipleText info answer. Assert the distinct [MULTITEXT-1]/[MULTITEXT-2] marker tokens so no normalization / encoding mangling can silently pass.
      await contestantPreviewPage.expectInfoAnswer(/\[qu-info-multipleText\]/, /\[MULTITEXT-1\]/);
      await contestantPreviewPage.expectInfoAnswer(/\[qu-info-multipleText\]/, /\[MULTITEXT-2\]/);
      // Opinion answer round-trip: Q1 was edited to choice index 1 in step 18.
      await contestantPreviewPage.expectOpinionAnswer(/\[qu-opin-base-1-likert5\]/, 1);
      // No voter-comparison messaging — score-gauge + sub-matches absent.
      await contestantPreviewPage.expectNoVoterComparison();
    });

    // ============== Step 22: final logout WITHOUT dialog =================

    await test.step('22. final logout: no dialog → /contestant/login', async () => {
      // Return to home for the logout button.
      await page.goto('/en/contestant');
      await expect(page.getByTestId(testIds.contestant.home.statusMessage)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
      // Profile + opinions complete → logout dispatches without a confirmation dialog (the post-completion LogoutButton path).
      await contestantLogoutButton.clickWithoutDialog();
    });
  });

  test('a candidate removes their portrait, and its stored file is deleted', async ({
    contestantLoginPage,
    contestantHomePage,
    contestantProfilePage
  }) => {
    await contestantLoginPage.signInFromCold(UNREGISTERED_CANDIDATE_EMAIL, PASSWORD_2);
    await contestantHomePage.expectStatusMessage();
    await contestantProfilePage.open();
    const portraitUrl = await contestantProfilePage.shownImageUrl();
    expect(await publicObjectStatus(portraitUrl), 'the portrait is served before it is removed').toBe(200);

    await contestantProfilePage.removeImage();
    await contestantProfilePage.save({ expect: 'navigation' });

    await contestantProfilePage.open();
    await contestantProfilePage.expectNoImage();
    await expect
      .poll(() => publicObjectStatus(portraitUrl), {
        ...STORED_OBJECT_DELETE_POLL,
        message: 'the removed portrait must stop being served once the profile no longer names it'
      })
      .toBe(400);
  });

  test('an open answer can be written before the question is answered, and is saved with it', async ({
    page,
    contestantLoginPage,
    contestantHomePage,
    contestantQuestionsOverviewPage,
    contestantQuestionPage
  }) => {
    await removeStoredAnswer(new SupabaseAdminClient(), OPEN_ANSWER_QUESTION_EXTERNAL_ID);
    await contestantLoginPage.signInFromCold(UNREGISTERED_CANDIDATE_EMAIL, PASSWORD_2);
    await contestantHomePage.expectStatusMessage();
    await page.goto('/en/contestant/questions');
    await contestantQuestionsOverviewPage.goToQuestion(/\[qu-opin-base-1-likert5\]/);

    await contestantQuestionPage.expectInfoEditable();
    await contestantQuestionPage.expectContinueDisabled();
    await contestantQuestionPage.expectSaveReason(true);
    await contestantQuestionPage.commitInfo(OPEN_ANSWER_BEFORE_CHOICE);
    await contestantQuestionPage.expectContinueDisabled();

    await contestantQuestionPage.selectChoice(2);
    await contestantQuestionPage.expectContinueEnabled();
    await contestantQuestionPage.expectSaveReason(false);
    await contestantQuestionPage.saveAndLeave();

    // Every question is answered now, so the categories start collapsed; the card step expands them.
    await page.goto('/en/contestant/questions');
    await contestantQuestionsOverviewPage.expectCardText(/\[qu-opin-base-1-likert5\]/, OPEN_ANSWER_BEFORE_CHOICE);
    await expect(
      contestantQuestionsOverviewPage
        .getQuestionCard(/\[qu-opin-base-1-likert5\]/)
        .first()
        .getByTestId(testIds.contestant.questions.cardAction)
    ).toHaveText(/edit/i);
  });
});
