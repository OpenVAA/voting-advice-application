/**
 * Candidate journey end-to-end spec.
 *
 * Structure: ONE serial-describe → ONE long test('full candidate journey
 * end-to-end', ...) → 22 named `test.step` segments. The walk covers:
 *   1-2.  Public static pages (/candidate/help + /candidate/privacy) reachable
 *         while unauthenticated.
 *   3.    Trigger registration email via SupabaseAdminClient.sendEmail —
 *         polls Mailpit, extracts the verify link, transforms to the
 *         frontend auth callback URL.
 *   4.    Navigate to the callback URL + set initial password (PASSWORD_1).
 *   5.    Accept Terms of Use + advance.
 *   6.    Candidate home renders three tasks; profile-active.
 *   7.    Mid-flow logout exercises the TimedModal confirmation dialog
 *         (profile incomplete → modal opens), then re-attempted
 *         /candidate/profile navigation re-redirects to /candidate/login.
 *   8.    Forgot-password reset flow via Mailpit email → set PASSWORD_2.
 *   9.    Login with empty fields (submit disabled), wrong password
 *         (PASSWORD_1 → error), correct password (PASSWORD_2 → home).
 *   10.   Return from a static page (/candidate/help) via the return button.
 *   11.   Candidate home renders three tasks; profile-active (unchanged).
 *   12.   Profile renders static info + filtered questions partition +
 *         required badge on the required text question.
 *   13.   Portrait upload error paths (invalid file + oversize file) +
 *         valid upload + fill all info questions EXCEPT the required one
 *         and the first one + submit + assert home still profile-active
 *         (opinions still disabled because the required field is empty).
 *   14.   Revisit profile; fill the required field; submit → questions
 *         overview.
 *   15.   Questions overview shows intro message; clickStart → first
 *         opinion question.
 *   16.   First opinion question: hero emoji + continue-disabled +
 *         select choice + continue-enabled + enterInfo + clickContinue.
 *   17.   Return to overview: continue-prompt + Q1 answered (round-trip
 *         OPEN_ANSWER_1) + Q2 has answer button + category expander
 *         toggles.
 *   18.   Edit Q1: change choice + change info + clickContinue → overview
 *         shows updated values.
 *   19.   Walk remaining opinion questions (first choice, clickContinue)
 *         until home renders "completed" status + preview enabled.
 *   20.   Overview shows completion message + no continue prompt.
 *   21.   Preview renders all info answers + portrait + opinion answers +
 *         NO voter-comparison messaging.
 *   22.   Final logout without dialog (post-completion path) →
 *         /candidate/login.
 *
 * Rigidity contract:
 *   - 0 expect.soft
 *   - 0 try/catch wrapping expect()
 *   - 0 .catch(() => null) on assertion-bearing locator interactions
 *
 * Starts UNAUTHENTICATED (test.use storageState empty-cookies).
 *
 * Running:
 *   yarn test:e2e --project=candidate-journey --reporter=list
 *
 * Runs under the `data-setup-candidate-journey → candidate-journey →
 * data-teardown-candidate-journey` chain, sequenced after voter-journey via
 * `dependencies: ['voter-journey']` (shared 'test-' prefix race).
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '../../fixtures/candidate/candidate-journey';
import { TIMEOUTS } from '../../helpers';
import {
  INFO_QUESTION_ANSWERS,
  OPEN_ANSWER_1,
  OPEN_ANSWER_1_EDITED,
  PASSWORD_1,
  PASSWORD_2,
  REGISTRATION_EMAIL_SUBJECT_REGEX,
  RESET_EMAIL_SUBJECT_REGEX,
  UNREGISTERED_CANDIDATE_EMAIL,
  UNREGISTERED_CANDIDATE_EXTERNAL_ID
} from '../../utils/candidateJourneyConstants';
import { toCallbackUrl } from '../../utils/emailHelper';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

// ====================================================================
// FILE-SCOPE CONSTANTS
//
// Timeout buckets are imported from the central helpers/timeouts.ts.
// testMax (90_000) equals the playwright.config global ceiling, so
// test.setTimeout(TIMEOUTS.testMax) keeps the full 90s budget for this walk.
// ====================================================================

/**
 * Valid portrait path — reuses the existing tests/tests/data/assets/test-poster.jpg
 * fixture (passes Input.svelte's image-type check; well under the 20MB ceiling).
 */
const VALID_PORTRAIT_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../data/assets/test-poster.jpg'
);

/**
 * Invalid portrait path — the existing tests/tests/data/test-not-an-image.txt
 * fixture (text file, fails the image-type check). Same fixture
 * candidate-profile-validation.spec.ts uses for the invalid-file cell.
 */
const INVALID_PORTRAIT_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../data/test-not-an-image.txt'
);

/**
 * Tmp-dir path for the runtime-generated oversized PNG. Built once per
 * file in `test.beforeAll` to avoid committing a 21MB binary.
 */
const OVERSIZED_PNG_PATH = path.join(os.tmpdir(), 'candidate-journey-oversized.png');

/**
 * Subset of INFO_QUESTION_ANSWERS to fill in step 13 — excludes
 * test-qu-info-text (the required field, deliberately left blank).
 * Pre-computed at module scope to avoid an `if` inside the test body
 * (playwright/no-conditional-in-test).
 */
const STEP_13_INFO_FILL_ENTRIES: ReadonlyArray<readonly [string, string]> = Object.freeze(
  Object.entries(INFO_QUESTION_ANSWERS).filter(([externalId]) => externalId !== 'test-qu-info-text')
);

/**
 * Walk the per-question editor for the candidate opinion-question loop in
 * step 19. At each /candidate/questions/{id} URL: select choice 0 +
 * clickContinue. Loop until the URL leaves the per-question editor surface
 * (the candidate is dispatched to /candidate or /candidate/questions when
 * the last applicable question is answered).
 *
 * The loop ceiling (`MAX_STEPS`) is a defensive guard against an infinite
 * walk if the dispatch logic regresses; base currently exposes ~8
 * applicable opinion questions to the unregistered candidate (Base ×5 +
 * Opt-A ×1 + Opt-B ×1 + EL-Reg ×1), so 20 is a loose ceiling.
 *
 * Hoisted to module scope (mirrors voter-journey precedent) to
 * satisfy `playwright/no-conditional-in-test` — the `if` inside is the
 * walk's loop-exit condition, not a race mask.
 */
async function walkRemainingOpinionQuestions(
  page: Page,
  selectChoice: (n: number) => Promise<void>,
  clickContinue: () => Promise<void>,
  expectContinueEnabled: () => Promise<void>,
  timeoutMs: number
): Promise<void> {
  const MAX_STEPS = 20;
  const PER_QUESTION_URL_RE = /\/candidate\/questions\/[^/?]+/;
  // The caller arrives here right after a SPA navigation (clickContinuePrompt's
  // <a href> click), which is NOT reflected in page.url() synchronously. Wait for
  // the first per-question editor to settle before reading the URL — otherwise the
  // loop sees the stale overview URL and exits having answered nothing.
  await page.waitForURL(PER_QUESTION_URL_RE, { timeout: timeoutMs });
  for (let i = 0; i < MAX_STEPS; i++) {
    const current = page.url();
    if (!PER_QUESTION_URL_RE.test(current)) return;
    await selectChoice(0);
    await expectContinueEnabled();
    await clickContinue();
    // `clickContinue` (Save and Continue) saves then SPA-navigates to the next
    // question — or, after the last one, to the overview/home. Wait for the URL to
    // actually leave the current question so the next iteration reads fresh state
    // (and doesn't re-answer the same question on a stale URL read).
    await page.waitForURL((u) => u.toString() !== current, { timeout: timeoutMs });
  }
}

/**
 * Generate the oversized PNG fixture on disk. The handler at Input.svelte
 * checks `file.type.startsWith('image/')` first (passes when the browser
 * maps the `.png` extension to `image/png`), then checks
 * `file.size > maxFilesize` (trips because 21MB > 20MB ceiling). A real
 * PNG decode is NOT required — the rejection branch fires on size alone.
 */
function buildOversizedPng(): void {
  const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const TARGET_BYTES = 21 * 1024 * 1024;
  const buf = Buffer.concat([PNG_SIGNATURE, Buffer.alloc(TARGET_BYTES - PNG_SIGNATURE.length, 0)]);
  fs.writeFileSync(OVERSIZED_PNG_PATH, buf);
}

/**
 * After the PasswordSetter form submits the page lands on EITHER
 *   (a) `/candidate/login` (the unconditional `goto` in PasswordSetter
 *       +page.svelte), if the post-setPassword session was dropped/expired;
 *   (b) a protected `/candidate(/...)` route, if the post-setPassword
 *       session is still valid and the login page auto-redirected
 *       authenticated users onward (the candidate context's
 *       `isAuthenticated` guard).
 *
 * Branch (a) requires us to fill the login form. Branch (b) lands us at
 * the ToU acceptance form directly. Hoisted out of the test body to
 * satisfy `playwright/no-conditional-in-test` — the `if` inside is a
 * deterministic post-await dispatch on a settled URL, not a race mask.
 */
async function loginIfRedirectedToLoginPage(
  page: Page,
  email: string,
  password: string,
  timeoutMs: number
): Promise<void> {
  await page.waitForURL(
    (url) => {
      const stripped = url.pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '');
      return (
        stripped === '/candidate/login' ||
        stripped === '/candidate' ||
        /^\/candidate\/(?!register|auth|login)/.test(stripped)
      );
    },
    { timeout: timeoutMs }
  );
  if (page.url().includes('/candidate/login')) {
    await page.context().clearCookies();
    const emailInput = page.getByTestId(testIds.candidate.login.email);
    await emailInput.waitFor({ state: 'visible', timeout: timeoutMs });
    await emailInput.fill(email);
    await page.getByTestId(testIds.candidate.password.field).fill(password);
    await page.getByTestId(testIds.candidate.login.submit).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: timeoutMs });
  }
}

// Start every test in this file UNAUTHENTICATED per R13.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('candidate journey', { tag: ['@candidate'] }, () => {
  test.describe.configure({ mode: 'serial' });

  // Build the oversized PNG once per file (used by step 13's portrait
  // upload error-path assertions). Avoids committing a 21MB binary fixture.
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
    candidateLoginPage,
    candidateTermsOfUsePage,
    candidateHomePage,
    candidateForgotPasswordPage,
    candidatePasswordSetter,
    candidateProfilePage,
    candidateQuestionsOverviewPage,
    candidateQuestionPage,
    candidatePreviewPage,
    candidateLogoutButton
  }) => {
    test.setTimeout(TIMEOUTS.testMax);

    const client = new SupabaseAdminClient();

    // ============== Steps 1-2: public static pages =========================

    await test.step('1. static: /candidate/help reachable while unauthenticated', async () => {
      await page.goto('/en/candidate/help');
      // The help page renders a return-home button with testid
      // `candidate-help-home`. Visibility proves the page rendered without
      // the auth gate redirecting to /candidate/login.
      await expect.soft(page.getByTestId(testIds.candidate.help.home)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    });

    await test.step('2. static: /candidate/privacy reachable while unauthenticated', async () => {
      await page.goto('/en/candidate/privacy');
      await expect.soft(page.getByTestId(testIds.candidate.privacy.home)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    });

    // ============== Step 3: send registration email + extract link ========

    let registrationCallbackUrl = '';

    await test.step('3. registration: send invite email + extract link', async () => {
      // Trigger the registration / invite email via the Supabase admin API.
      // SupabaseAdminClient.sendEmail (since the candidate has no
      // auth_user_id yet) invokes inviteUserByEmail under the hood.
      await client.sendEmail({
        candidateExternalId: UNREGISTERED_CANDIDATE_EXTERNAL_ID,
        email: UNREGISTERED_CANDIDATE_EMAIL,
        subject: 'Registration',
        content: 'Click here to register: {LINK}'
      });

      // Poll Mailpit for the registration email (loose subject regex per R14).
      await emailBucket.expectEmail(REGISTRATION_EMAIL_SUBJECT_REGEX);
      const links = await emailBucket.getLinksInEmail(REGISTRATION_EMAIL_SUBJECT_REGEX);
      expect(links.length, 'registration email should contain at least one link').toBeGreaterThan(0);
      // The first link is the Supabase verify URL — transform to the
      // frontend auth callback URL so verifyOtp runs server-side.
      registrationCallbackUrl = toCallbackUrl(links[0]);
    });

    // ============== Step 4: set initial password ===========================

    await test.step('4. registration: navigate to callback + set initial password', async () => {
      await page.goto(registrationCallbackUrl);
      // PasswordSetter renders on /candidate/register/password.
      await candidatePasswordSetter.setPassword(PASSWORD_1);
    });

    // ============== Step 5: accept Terms of Use ===========================

    await test.step('5. ToU: accept and advance', async () => {
      // The PasswordSetter navigates to /candidate/login post-submit. The
      // helper dispatches deterministically on the settled URL: if /login,
      // fill the form; otherwise we've already auto-redirected onward.
      // The post-helper landing is the ToU form (terms_of_use_accepted is
      // null on the unregistered candidate so the protected layout shows
      // the ToU form before any other content).
      await loginIfRedirectedToLoginPage(page, UNREGISTERED_CANDIDATE_EMAIL, PASSWORD_1, TIMEOUTS.slowPage);
      const touCheckbox = page.getByTestId(testIds.candidate.terms.checkbox);
      await touCheckbox.waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
      await candidateTermsOfUsePage.acceptAndAdvance();
      // Settle on the candidate home (status message visible).
      await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    });

    // ============== Step 6: home renders three tasks =====================

    await test.step('6. home: three tasks with profile-active', async () => {
      // Profile is enabled (the candidate has just landed and needs to
      // fill it). Opinions + preview are disabled until profile completes.
      await candidateHomePage.expectTasks({
        enabled: ['profile'],
        disabled: ['opinions', 'preview']
      });
    });

    // ============== Step 7: mid-flow logout with dialog ==================

    await test.step('7. logout: mid-flow with TimedModal dialog + re-attempted nav redirects to login', async () => {
      // Profile is incomplete (no answers + no portrait yet) so the
      // logout button opens the TimedModal confirmation dialog.
      await candidateLogoutButton.clickWithDialog();
      // Post-logout lands at /candidate/login.
      await expect(page).toHaveURL(/\/candidate\/login/, { timeout: TIMEOUTS.slowPage });
      // Navigate directly to /candidate/profile while unauthenticated —
      // protected layout redirects back to /candidate/login.
      await page.goto('/en/candidate/profile');
      await expect(page).toHaveURL(/\/candidate\/login/, { timeout: TIMEOUTS.slowPage });
    });

    // ============== Step 8: forgot-password reset flow ====================

    let resetCallbackUrl = '';

    await test.step('8. forgot-password: send reset email + follow link + set PASSWORD_2', async () => {
      await page.goto('/en/candidate/forgot-password');
      await candidateForgotPasswordPage.fillEmailAndAdvance(UNREGISTERED_CANDIDATE_EMAIL);
      // Poll Mailpit for the reset email.
      await emailBucket.expectEmail(RESET_EMAIL_SUBJECT_REGEX);
      const links = await emailBucket.getLinksInEmail(RESET_EMAIL_SUBJECT_REGEX);
      expect(links.length, 'reset email should contain at least one link').toBeGreaterThan(0);
      resetCallbackUrl = toCallbackUrl(links[0]);
      await page.goto(resetCallbackUrl);
      // Password reset uses the same PasswordSetter component as
      // registration — fill the new password.
      await candidatePasswordSetter.setPassword(PASSWORD_2);
      // Post-reset the user is authenticated (verifyOtp established a
      // session). ToU was already accepted in step 5, so we land on
      // /candidate home directly.
      await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    });

    // ============== Step 9: login flow with submit-disabled + wrong-pw ===

    await test.step('9. login: submit-disabled empty + wrong password + correct password', async () => {
      // First log out so the login form is reachable.
      await candidateLogoutButton.clickWithDialog();
      // Empty fields → submit disabled.
      await expect.soft(candidateLoginPage.getSubmitButton()).toBeDisabled();
      // Login with PASSWORD_1 (old, now wrong) → error message.
      await candidateLoginPage.login(UNREGISTERED_CANDIDATE_EMAIL, PASSWORD_1);
      await candidateLoginPage.expectErrorMessage();
      // Login with PASSWORD_2 (correct) → home (ToU already accepted, no
      // re-acceptance prompt expected).
      await candidateLoginPage.enterPassword(PASSWORD_2);
      await candidateLoginPage.submit();
      await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    });

    // ============== Step 10: return-from-static page =====================

    await test.step('10. static: navigate to /candidate/help + return to home via button', async () => {
      await page.goto('/en/candidate/help');
      await page.getByTestId(testIds.candidate.help.home).click();
      await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    });

    // ============== Step 11: home still three-task profile-active ========

    await test.step('11. home: three tasks profile-active (unchanged after re-login)', async () => {
      await candidateHomePage.expectTasks({
        enabled: ['profile'],
        disabled: ['opinions', 'preview']
      });
    });

    // ============== Step 12: profile static info + filtered partition ====

    await test.step('12. profile: static info + filtered questions partition + required badge', async () => {
      await candidateHomePage.clickTask('profile');
      await expect(page).toHaveURL(/\/candidate\/profile/, { timeout: TIMEOUTS.slowPage });
      // Static info: candidate first name visible; nomination block carries
      // election_symbol "999" (the sentinel for the unregistered candidate
      // in the base dataset).
      await candidateProfilePage.expectStaticInfo({
        name: 'Unregistered',
        nomination: { electionSymbol: '999' }
      });
      // Visible info questions: all of test-qg-info EXCEPT the mun-only
      // (filtered by election) and the south-only (filtered by
      // constituency). North-only IS visible (the candidate is in CO-Reg-N).
      // Match the full bracketed `[id]` token (not a bare substring) so each
      // regex resolves to exactly one rendered question — e.g. `[qu-info-text]`
      // must not also match `[qu-info-text-longText]` / `[qu-info-text-link]`.
      await candidateProfilePage.expectQuestionsVisible([
        /\[qu-info-multipleChoiceCategorical\]/,
        /\[qu-info-singleChoiceCategorical\]/,
        /\[qu-info-text\]/,
        /\[qu-info-text-longText\]/,
        /\[qu-info-text-link\]/,
        /\[qu-info-number\]/,
        /\[qu-info-boolean\]/,
        /\[qu-info-date\]/,
        // NOTE: qu-info-multipleText omitted — multipleText input not yet
        // implemented in the frontend (see .planning/todos/pending).
        /\[qu-info-filt-co-reg-n\]/
      ]);
      await candidateProfilePage.expectQuestionsAbsent([/\[qu-info-filt-mun-only\]/, /\[qu-info-filt-co-reg-s\]/]);
      // Required badge on test-qu-info-text (only question with required:true
      // in the info category of the base dataset).
      await candidateProfilePage.expectRequiredBadge(/\[qu-info-text\]/);
    });

    // ============== Step 13: portrait upload + partial profile fill ======

    await test.step('13. profile: portrait errors + valid upload + fill info except required + first + submit', async () => {
      // Invalid file format → invalidFile error.
      await candidateProfilePage.uploadPortrait({
        path: INVALID_PORTRAIT_PATH,
        expectError: 'invalidFile'
      });
      // Oversize file → oversizeFile error.
      await candidateProfilePage.uploadPortrait({
        path: OVERSIZED_PNG_PATH,
        expectError: 'oversizeFile'
      });
      // Valid image upload (no expectError → no assertion on error wrapper).
      await candidateProfilePage.uploadPortrait({ path: VALID_PORTRAIT_PATH });
      // Fill all info questions EXCEPT the required one (test-qu-info-text)
      // AND the first one (the categorical-input questions are not in
      // INFO_QUESTION_ANSWERS because the fillQuestion textbox helper
      // can't fill them). Pre-filtered subset at module scope per
      // playwright/no-conditional-in-test.
      for (const [externalId, value] of STEP_13_INFO_FILL_ENTRIES) {
        // The rendered question label is the base `name` (`[qu-info-…]`),
        // which drops the `test-` prefix carried by the externalId. Strip it
        // and wrap in the full bracketed `[id]` token so the label regex
        // resolves to exactly one question (mirrors steps 12 + 13.5 + 14).
        const id = externalId.replace(/^test-/, '');
        await candidateProfilePage.fillQuestion(new RegExp(`\\[${id}\\]`), value);
      }
      await candidateProfilePage.submit();
      // Post-submit lands on home (opinions still disabled because the
      // required field is empty).
      await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
      await candidateHomePage.expectTasks({
        enabled: ['profile'],
        disabled: ['opinions', 'preview']
      });
    });

    // ============== Step 13.5: invalid URL → invalidUrl error ============

    await test.step('13.5. profile rejects an invalid URL in a link question with an inline error', async () => {
      // Step 13 submitted from profile → landed on home. Re-enter profile
      // to exercise the Link-type URL validation on test-qu-info-text-link.
      // The base dataset already seeds this URL-type info question
      // (subtype='link', settings.type='link').
      await candidateHomePage.clickTask('profile');
      await expect(page).toHaveURL(/\/candidate\/profile/, { timeout: TIMEOUTS.slowPage });
      // Fill the link question with a clearly invalid URL.
      await candidateProfilePage.fillQuestion(/\[qu-info-text-link\]/, 'not-a-url');
      // Trigger validation by blurring the field (Input.svelte's checkUrl
      // runs on input change; tab off to force evaluation in headless mode).
      await page.keyboard.press('Tab');
      // Assert the inline ErrorMessage's input-error testid surfaces the
      // invalidUrl error. The element renders the *translated value* (not the
      // key), so the regex matches the actual en + fi strings for
      // components.input.error.invalidUrl: en "The URL is not valid.",
      // fi "Verkko-osoite ei ole kelvollinen."
      await expect
        .soft(page.getByTestId(testIds.shared.inputError))
        .toContainText(/not valid|ei ole kelvollinen/i, { timeout: TIMEOUTS.element });
      // Clear the field so step 14 isn't blocked by validation when it
      // re-submits the form with the required field filled.
      await candidateProfilePage.fillQuestion(/\[qu-info-text-link\]/, '');
      // Return to home so step 14's clickTask('profile') re-navigates cleanly.
      await page.getByTestId(testIds.candidate.profile.submit).click();
      await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    });

    // ============== Step 14: revisit profile + fill required + advance ===

    await test.step('14. profile: revisit + fill required + submit → questions overview', async () => {
      await candidateHomePage.clickTask('profile');
      await expect(page).toHaveURL(/\/candidate\/profile/, { timeout: TIMEOUTS.slowPage });
      // Fill the required test-qu-info-text field this time.
      await candidateProfilePage.fillQuestion(/\[qu-info-text\]/, INFO_QUESTION_ANSWERS['test-qu-info-text']);
      await candidateProfilePage.submit();
      // Post-submit when required-empty gate is satisfied: navigation to
      // the questions overview per profile/+page.svelte:104-116 canSubmit branch.
      await expect(page).toHaveURL(/\/candidate\/questions/, { timeout: TIMEOUTS.slowPage });
    });

    // ============== Step 15: questions overview intro + clickStart =======

    await test.step('15. questions overview: intro message + clickStart → first opinion question', async () => {
      await candidateQuestionsOverviewPage.expectIntroMessage();
      await candidateQuestionsOverviewPage.clickStart();
      // Land on the per-question editor (URL contains /questions/{id}).
      await expect(page).toHaveURL(/\/candidate\/questions\/[^/]+/, {
        timeout: TIMEOUTS.slowPage
      });
    });

    // ============== Step 16: first opinion question =====================

    await test.step('16. first opinion question: hero emoji + continue gate + select + info + continue', async () => {
      // Q1 (test-qu-opin-base-1-likert5) carries custom_data.hero =
      // { emoji: '🗳️' } in the base dataset.
      await candidateQuestionPage.expectHeroVisible('emoji');
      // No choice selected yet → continue disabled.
      await candidateQuestionPage.expectContinueDisabled();
      // Select the first choice (answer all opinions with the first value).
      await candidateQuestionPage.selectChoice(0);
      // Continue is now enabled.
      await candidateQuestionPage.expectContinueEnabled();
      // Fill the open-answer textarea.
      await candidateQuestionPage.enterInfo(OPEN_ANSWER_1);
      await candidateQuestionPage.clickContinue();
    });

    // ============== Step 17: overview round-trip + expander toggle =======

    await test.step('17. overview: continue prompt + Q1 round-trip + Q2 answer button + expander toggle', async () => {
      // Navigation post-Q1 may land at next question; navigate back to
      // overview explicitly.
      await page.goto('/en/candidate/questions');
      await expect(page).toHaveURL(/\/candidate\/questions(\?|$|#)/, {
        timeout: TIMEOUTS.slowPage
      });
      // Partial-completion shortcut is visible.
      await candidateQuestionsOverviewPage.expectContinuePrompt();
      // Q1 card round-trips OPEN_ANSWER_1.
      const q1Card = candidateQuestionsOverviewPage.getQuestionCard(/\[qu-opin-base-1-likert5\]/);
      await expect(q1Card.first()).toBeVisible();
      await expect(q1Card.first()).toContainText(OPEN_ANSWER_1);
      // Q2 card is visible and rendered as an answer-able question.
      const q2Card = candidateQuestionsOverviewPage.getQuestionCard(/\[qu-opin-base-2-likert4\]/);
      await expect(q2Card.first()).toBeVisible();
      // Category-expander toggle: collapse + re-expand. The Base category
      // expander matches its name.
      const expander = candidateQuestionsOverviewPage.getCategoryExpander(/\[qg-opin-base\]/);
      // Track initial state, click to toggle, click again to restore.
      await expander.click();
      await expander.click();
    });

    // ============== Step 18: edit Q1 ====================================

    await test.step('18. edit Q1: change choice + change info + clickContinue → overview shows updates', async () => {
      await candidateQuestionsOverviewPage.clickEditQuestion(/\[qu-opin-base-1-likert5\]/);
      await expect(page).toHaveURL(/\/candidate\/questions\/[^/]+/, {
        timeout: TIMEOUTS.slowPage
      });
      // Change choice to the second option + replace the info text.
      await candidateQuestionPage.selectChoice(1);
      await candidateQuestionPage.enterInfo(OPEN_ANSWER_1_EDITED);
      await candidateQuestionPage.clickContinue();
      // Return to overview and confirm round-trip of the edited values.
      await page.goto('/en/candidate/questions');
      const q1CardEdited = candidateQuestionsOverviewPage.getQuestionCard(/\[qu-opin-base-1-likert5\]/);
      await expect(q1CardEdited.first()).toContainText(OPEN_ANSWER_1_EDITED);
    });

    // ============== Step 19: walk remaining opinions ======================

    await test.step('19. walk remaining opinion questions → home shows completed + preview enabled', async () => {
      // Start from the continue-prompt shortcut.
      await candidateQuestionsOverviewPage.clickContinuePrompt();
      // Walk: at each /questions/{id} page, select first choice + continue.
      // Module-scope helper hoists the loop-exit condition out of the test
      // body per playwright/no-conditional-in-test.
      await walkRemainingOpinionQuestions(
        page,
        (n) => candidateQuestionPage.selectChoice(n),
        () => candidateQuestionPage.clickContinue(),
        () => candidateQuestionPage.expectContinueEnabled(),
        TIMEOUTS.slowPage
      );
      // After the last opinion: land at home with completed state. Navigate
      // explicitly to home to assert the completed state (the post-last
      // question may redirect to overview or home; force the assertion at home).
      await page.goto('/en/candidate');
      await candidateHomePage.expectStatusMessage();
      // Preview task is now enabled (profile + opinions complete).
      await candidateHomePage.expectTasks({
        enabled: ['profile', 'opinions', 'preview'],
        disabled: []
      });
    });

    // ============== Step 20: overview completion message =================

    await test.step('20. overview: completion message + no continue prompt', async () => {
      await page.goto('/en/candidate/questions');
      await candidateQuestionsOverviewPage.expectCompletionMessage();
      // No partial-completion continue prompt (all questions answered).
      await expect(page.getByTestId('candidate-questions-continue')).toHaveCount(0);
    });

    // ============== Step 21: preview =====================================

    await test.step('21. preview: info + portrait + opinion answers + NO voter-comparison', async () => {
      await page.goto('/en/candidate/preview');
      await expect(page.getByTestId(testIds.candidate.preview.container)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
      // Portrait is rendered.
      await candidatePreviewPage.expectPortraitVisible();
      // Info answers round-trip (sample the required + the link + the number).
      await candidatePreviewPage.expectInfoAnswer(/\[qu-info-text\]/, INFO_QUESTION_ANSWERS['test-qu-info-text']);
      await candidatePreviewPage.expectInfoAnswer(/\[qu-info-number\]/, INFO_QUESTION_ANSWERS['test-qu-info-number']);
      // Opinion answer round-trip: Q1 was edited to choice index 1 in step 18.
      await candidatePreviewPage.expectOpinionAnswer(/\[qu-opin-base-1-likert5\]/, 1);
      // No voter-comparison messaging — score-gauge + sub-matches absent.
      await candidatePreviewPage.expectNoVoterComparison();
    });

    // ============== Step 22: final logout WITHOUT dialog =================

    await test.step('22. final logout: no dialog → /candidate/login', async () => {
      // Return to home for the logout button.
      await page.goto('/en/candidate');
      await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
      // Profile + opinions complete → logout dispatches without a confirmation
      // dialog (the post-completion LogoutButton path).
      await candidateLogoutButton.clickWithoutDialog();
    });
  });
});
