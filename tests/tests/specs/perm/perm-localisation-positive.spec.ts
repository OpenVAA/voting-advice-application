/**
 * Multi-locale (en/fi/sv) candidate authoring walk plus a voter-side cross-check.
 *
 * Topology: 1 election / 1 CG / 1 CO / 1 organisation / 1 candidate / 1 nomination + 2 question categories (qc-info + qc-opin) × 2 questions:
 *   - q1 (text)
 *   - q2 (text + customData.disableMultilingual)
 *   - q3 (singleChoiceOrdinal + allow_open=true)
 *   - q4 (singleChoiceOrdinal + allow_open=true + customData.disableMultilingual)
 *
 * Settings: operates against the 3-locale `staticSettings.supportedLocales` base (`[en, fi, sv]`) directly — NO runtime override. The langSelector assertion expects 3 user-facing locales (en/fi/sv); the en↔fi authoring walk is structurally the same regardless.
 *
 * Walk (strict):
 *  1. Voter root /en: langSelector visible with [en, fi, sv].
 *  2. switchTo('fi') → URL is /fi/, voter-home start button shows non-English
 *     text ('Aloita' for Finnish); switchTo('en') → URL is /en/, voter-home
 *     start button shows English again ('Start').
 *  3. Inbucket-driven candidate registration → ToU is already accepted (the
 *     seeded candidate carries terms_of_use_accepted), so login lands on the candidate home directly.
 *  4. Profile q1 ('[Q1]'): textbox value contains '[en-answer-q1]'; expectTranslationOptions(scope, true).
 *  5. openTranslations(q1) → setLocaleValue(fi, '[fi-answer-q1]') →
 *     closeTranslations → expectLocaleHidden(fi).
 *  6. Profile q2 ('[Q2]'): expectTranslationOptions(scope, false).
 *  7. Save profile via candidateProfilePage.submit().
 *  8. q3 + q4 opinion-editor: navigate to questions overview, start; on q3:
 *       - assert comment textarea contains '[en-answer-q3]';
 *       - expectTranslationOptions(commentScope, true);
 *       - openTranslations → setLocaleValue(fi, '[fi-answer-q3]') →
 *         closeTranslations → expectLocaleHidden(fi).
 *     Save and continue to q4. On q4:
 *       - expectTranslationOptions(commentScope, false).
 *  9. Logout.
 * 10. Voter cross-check:
 *      - /en/results → click candidate card → assert info-tab contains
 *        '[en-answer-q1]'; opinions-tab contains '[en-answer-q3]'.
 *      - langSelector.switchTo('fi') → full-reload to /fi/...
 *      - Re-open candidate details if the switch landed off the detail dialog (switchTo preserves the path so usually no re-navigation is needed, but the dialog state may not survive the reload; if the dialog closed, click the card again).
 *      - assert info-tab contains '[fi-answer-q1]'; opinions-tab contains '[fi-answer-q3]'.
 *
 * Candidate login: seeded candidate has ToU pre-accepted but NO auth.users row (dev-seed excludes auth.users by design). Spec drives Inbucket registration via SupabaseAdminClient.sendEmail — mirrors the candidate-journey registration chain.
 *
 * Per-perm recipientEmail: 'candidate-l10n-pos-aa@test.openvaa.local' — unique per perm prevents cross-perm Inbucket pollution.
 *
 * Rigidity contract: every assertion is HARD — no expect.soft, no try/catch wrapping expect(), no .catch fallbacks.
 */

import { expect, test } from '../../fixtures/candidate/perm-l10n';
import { toCallbackUrl } from '../../fixtures/shared/emailBucket.fixture';
import { answerAndAdvanceToResults, walkUntilQuestionsIntro } from '../../fixtures/voter/voter-journey.fixture';
import { PASSWORD_1, REGISTRATION_EMAIL_SUBJECT_REGEX } from '../../utils/candidateJourneyConstants';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

// reason: l10n positive spec runs a full multi-locale (en/fi/sv) candidate register → login → profile → questions walk PLUS a voter-side cross-check.
// Both timeouts exceed the central TIMEOUTS buckets and stay inline as documented exceptions:
//   - L10N_SLOW_PAGE (15s) > TIMEOUTS.slowPage (10s): the candidate-card / dialog l10n content waits need extra cold-start + locale-switch headroom.
//   - L10N_TEST_MAX (180s) > TIMEOUTS.testMax (90s): the multi-locale walk does not fit in the 90s global ceiling. APPLIED via test.setTimeout below — it MUST keep passing this value, NOT TIMEOUTS.testMax, or the test would start timing out at 90s.
const L10N_SLOW_PAGE = 15_000;
const L10N_TEST_MAX = 180_000;

// Per-perm recipient prevents Inbucket cross-perm pollution.
const RECIPIENT_EMAIL = 'candidate-l10n-pos-aa@test.openvaa.local';
// Candidate row external_id (BARE form) — writer prepends the perm prefix at seed time so the row's actual external_id is `e2e-perm-l10n-pos-ca-1-1a`.
const CANDIDATE_EXTERNAL_ID = 'e2e-perm-l10n-pos-ca-1-1a';

test.use({
  recipientEmail: RECIPIENT_EMAIL,
  // Start UNAUTHENTICATED — the candidate login flow drives auth from scratch.
  storageState: { cookies: [], origins: [] }
});

// in-flight answer/selection-state preserved across fi→en→fi.
//
// Module-scope helper so the per-switch assertions live OUTSIDE the test body's loop (playwright/no-standalone-expect + no-conditional-in-test): asserts the voter is STILL in the in-flight located+answered state after a full-reload locale switch. Two independent persistence channels are proven:
//   (1) SELECTIONS — the located layout resolves the selected election from the URL (routes/(voters)/(located)/+layout.ts); the constituency is IMPLIED for this single-election/single-CG dataset (getImpliedConstituencyIds).
//       The resolved electionId may be carried EITHER as a `?electionId=…` query param (pre-switch shape) OR as the `[[electionTab]]` path segment (`/results/<electionId>`, the canonical shape SvelteKit re-resolves to after the full-reload re-navigation). Paraglide's switchTo preserves the selection across the reload, so the SAME electionId MUST appear somewhere in the post-switch URL AND the located guard MUST resolve a constituency (else it redirects to the selector and the results list never renders).
//       The rendered results list is therefore the constituency-resolution proof.
//   (2) ANSWERS — the given opinion answer persists in versioned localStorage (`VoterContext-answerStore`, contexts/voter/answerState.svelte.ts) and survives the reload. The candidate card's MatchScore (`match-score`, EntityCard.svelte:280-286) only renders when a match exists, and its value is a pure function of the persisted answer set. Asserting the SAME score readout after the switch proves the answer carried through — not merely that the UI re-localised.
async function expectInFlightStatePreserved(
  page: Page,
  expectedLocale: string,
  expectedElectionId: string,
  expectedMatchScore: string
): Promise<void> {
  // URL re-localised to the target locale AND still carrying the selected election (query-param OR path-segment form) — proves selection survived.
  const localePrefix = expectedLocale === 'en' ? '(?!(fi|sv|da|et|fr|lb)(/|$))' : `${expectedLocale}(/|$)`;
  await expect(page).toHaveURL(new RegExp(`^https?://[^/]+/${localePrefix}`));
  await expect(page).toHaveURL(new RegExp(expectedElectionId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

  // Results list rendered (not the selector / no-answers gate) → located+answered (the located guard resolved BOTH the URL election AND the implied constituency).
  await expect(page.getByTestId(testIds.voter.results.list)).toBeVisible({ timeout: L10N_SLOW_PAGE });

  // The candidate card + its match score survive (proves the persisted answer still drives the computed match identically post-reload).
  const card = page.getByTestId(testIds.voter.results.candidateSection).getByTestId(testIds.voter.results.card).first();
  await expect(card).toBeVisible({ timeout: L10N_SLOW_PAGE });
  const matchScore = card.getByTestId(testIds.voter.results.matchScore);
  await expect(matchScore).toBeVisible();
  await expect(matchScore).toHaveText(expectedMatchScore);
}

test.describe('perm-localisation-positive', () => {
  test('localisation walk across en/fi/sv with voter-side cross-check', async ({
    page,
    emailBucket,
    candidatePasswordSetter,
    candidateProfilePage,
    candidateQuestionsOverviewPage,
    candidateQuestionPage,
    candidateLogoutButton,
    langSelector,
    multilingualTextField,
    voterNav,
    voterHomePage,
    resultsPage
  }) => {
    test.setTimeout(L10N_TEST_MAX);

    const client = new SupabaseAdminClient();

    // ============== Step 1: voter root — langSelector visible (en + fi + sv) === With the 3-locale staticSettings base [en, fi, sv] active, the LanguageSelection NavGroup at LanguageSelection.svelte:32 renders (locales.length > 1 gate evaluates true). The selector exposes one NavItem per locale.

    await voterHomePage.goToPage('en');
    // The LanguageSelection NavGroup renders only inside the voter nav drawer (closed by default) — open it before reading the selector.
    await voterNav.open();
    await langSelector.expectVisible(['en', 'fi', 'sv']);
    // Close the drawer — its overlay covers the home start button read below.
    await voterNav.close();

    // ============== Step 2: switchTo('fi') → UI re-localises → switchTo('en') The voter-home start button label is driven by the `dynamic.frontPage.startButton` i18n key; in English it resolves to 'Start' (or similar), in Finnish to 'Aloita'. We assert on the English-vs-Finnish word stems that are stable across Paraglide bundle updates (the source strings in apps/frontend/messages/en.json + .../fi.json).

    const startButton = page.getByTestId(testIds.voter.home.startButton);

    // Capture the English-locale start button text BEFORE switching, then assert it changes after the switch. This avoids hard-coding the literal English string (which can drift across i18n-bundle edits) while still proving the locale switch took effect.
    await expect(startButton).toBeVisible();
    const englishLabel = (await startButton.innerText()).trim();
    expect(englishLabel.length, 'English-locale start button text must be non-empty').toBeGreaterThan(0);

    // Re-open the drawer to reach the language selector. No close needed — switchTo triggers a full page reload that tears down the drawer.
    await voterNav.open();
    await langSelector.switchTo('fi');
    await expect(page).toHaveURL(/\/fi(\/|$)/);
    // Post-switch the start button is in Finnish — its rendered text is different from the English label captured above.
    const finnishStartButton = page.getByTestId(testIds.voter.home.startButton);
    await expect(finnishStartButton).toBeVisible();
    const finnishLabel = (await finnishStartButton.innerText()).trim();
    expect(finnishLabel.length, 'Finnish-locale start button text must be non-empty').toBeGreaterThan(0);
    expect(
      finnishLabel,
      'Finnish start button text must differ from English text (locale switch must take effect)'
    ).not.toBe(englishLabel);

    // Page is on /fi — the locale-independent menuToggle testid opens the drawer regardless of UI locale. No close needed — switchTo reloads.
    await voterNav.open();
    await langSelector.switchTo('en');
    // baseLocale: served from `/` with NO `/en/` prefix per Paraglide's urlPatterns table (see langSelectorFixture.fixture.ts switchTo()).
    await expect(page).not.toHaveURL(/\/(fi|sv|da|et|fr|lb)(\/|$)/);
    const reEnglishStartButton = page.getByTestId(testIds.voter.home.startButton);
    await expect(reEnglishStartButton).toBeVisible();
    const reEnglishLabel = (await reEnglishStartButton.innerText()).trim();
    expect(reEnglishLabel, 'Post-switch-back English label must match the originally captured English label').toBe(
      englishLabel
    );

    // ============== Step 3: candidate registration via Inbucket =========== The seeded candidate has no auth.users row. Drive registration via sendEmail (which calls inviteUserByEmail under the hood).

    // Defensive self-heal: if a PRIOR run crashed before its teardown ran, the invited auth user leaks and inviteUserByEmail below fails with "already registered". Clear any stale row first (idempotent no-op when absent).
    // Normal-path cleanup lives in perm-localisation-positive.teardown.ts.
    await client.unregisterCandidate(RECIPIENT_EMAIL);

    await client.sendEmail({
      candidateExternalId: CANDIDATE_EXTERNAL_ID,
      email: RECIPIENT_EMAIL,
      subject: 'Registration',
      content: 'Click here to register: {LINK}'
    });

    await emailBucket.expectEmail(REGISTRATION_EMAIL_SUBJECT_REGEX);
    const links = await emailBucket.getLinksInEmail(REGISTRATION_EMAIL_SUBJECT_REGEX);
    expect(links.length, 'registration email should contain at least one link').toBeGreaterThan(0);
    const registrationCallbackUrl = toCallbackUrl(links[0]);

    // ============== Step 4: navigate callback + set initial password ======

    // reason: OIDC/Inbucket registration-callback URL — an external auth-callback goto, not a named voter-page navigation; no voter goToPage applies.
    await page.goto(registrationCallbackUrl);
    await candidatePasswordSetter.setPassword(PASSWORD_1);
    // The password setter automatically logins
    await candidatePasswordSetter.expectNotVisible();

    // ============== Step 5: profile q1 — English answer + Finnish authoring Navigate to the EDITABLE info-question section (NOT the locked section — that one uses a route-level disableMultilingual prop, a different mechanism).

    // reason: candidate-route navigation — out of voter-fixture scope.
    await page.goto('/en/candidate/profile');
    await candidateProfilePage.expectQuestionsVisible([/\[Q1\]/, /\[Q2\]/]);

    const q1Scope = candidateProfilePage.getQuestion(/\[Q1\]/);

    // Assert the default-locale (English) input value shows '[en-answer-q1]'.
    // The Input renders one editable textbox for the default locale; assert that textbox carries the seeded English answer.
    const q1DefaultTextbox = q1Scope.getByRole('textbox').first();
    await expect(q1DefaultTextbox).toHaveValue(/\[en-answer-q1\]/);
    await multilingualTextField.expectTranslationOptions(q1Scope, true);

    // Finnish authoring on q1.
    await multilingualTextField.openTranslations(q1Scope);
    await multilingualTextField.setLocaleValue(q1Scope, 'fi', '[fi-answer-q1]');
    await multilingualTextField.closeTranslations(q1Scope);
    await multilingualTextField.expectLocaleHidden(q1Scope, 'fi');

    // ============== Step 6: profile q2 — no translation options =========== q2 carries customData.disableMultilingual=true so even with locales.length > 1 the toggle is fully absent.

    const q2Scope = candidateProfilePage.getQuestion(/\[Q2\]/);
    await multilingualTextField.expectTranslationOptions(q2Scope, false);

    // ============== Step 7: save profile ================================= The candidate already has all required answers seeded; submitting navigates away from /profile (per profile/+page.svelte:104-116 canSubmit branch).

    await candidateProfilePage.submit();
    await candidateProfilePage.expectSubmitMessage();

    // ============== Step 8: opinion-editor q3 + q4 — comment multilingual Navigate to the questions overview → open q3.
    //
    // The seeded candidate already carries answers to BOTH opinion questions (q3 value '3' + comment '[en-answer-q3]', q4 value '3'), so the overview renders the COMPLETED ("full") variant — NOT the empty state. The `candidate-questions-start` button only exists in the empty branch (questions/+page.svelte:86-99), so it never appears here. Instead the opinion category renders inside a collapsed Expander (defaultExpanded gates on there being unanswered questions in the category — there are none). Expand the category, then open q3 via its per-card edit action.

    await candidateQuestionsOverviewPage.goToPage();
    const opinionCategory = candidateQuestionsOverviewPage.getCategoryExpander(/\[QC-OPIN\]/);
    await opinionCategory.click();
    await opinionCategory.expectExpanded(true);
    await candidateQuestionsOverviewPage.clickEditQuestion(/\[Q3\]/);
    await candidateQuestionPage.expectQuestionText(/\[Q3\]/);

    // q3 — comment carries '[en-answer-q3]' (seeded), translation-options visible. Author Finnish via setLocaleValue.
    //
    // Scope note: `candidate-questions-comment` is forwarded by Input.svelte onto the open-answer <textarea> ITSELF (restProps spread, not a wrapper) — so the testid element IS the textbox, and the multilingual toggle + per-locale fields are SIBLINGS, not descendants. Assert the seeded value directly on the textarea, but scope the multilingual fixture to <main> (the only textbox inside <main> is this comment; the hidden feedback-widget textarea lives outside <main>), which contains the toggle and the per-locale fields the fixture needs.
    const q3Comment = page.getByTestId(testIds.candidate.questions.commentInput);
    const commentMultilingualScope = page.getByRole('main');
    await expect(q3Comment).toBeVisible();
    await expect(q3Comment).toHaveValue(/\[en-answer-q3\]/);
    await multilingualTextField.expectTranslationOptions(commentMultilingualScope, true);
    await multilingualTextField.openTranslations(commentMultilingualScope);
    await multilingualTextField.setLocaleValue(commentMultilingualScope, 'fi', '[fi-answer-q3]');
    await multilingualTextField.closeTranslations(commentMultilingualScope);
    await multilingualTextField.expectLocaleHidden(commentMultilingualScope, 'fi');

    // Save q3. NOTE: because the seeded candidate has ALREADY answered every opinion question, `unansweredOpinionQuestions` is empty, so the editor's save action routes back to the questions OVERVIEW (submitRoute = CandAppQuestions) rather than advancing linearly to the next question (questions/[questionId]/+page.svelte:121-136). Reach q4 the same way as q3: from the overview's expanded opinion category.
    await candidateQuestionPage.expectContinueEnabled();
    await candidateQuestionPage.clickContinue();

    await page.waitForURL(/\/candidate\/questions(\/?$|\?)/, { timeout: L10N_SLOW_PAGE });
    const opinionCategoryQ4 = candidateQuestionsOverviewPage.getCategoryExpander(/\[QC-OPIN\]/);
    await opinionCategoryQ4.click();
    await opinionCategoryQ4.expectExpanded(true);
    await candidateQuestionsOverviewPage.clickEditQuestion(/\[Q4\]/);
    await candidateQuestionPage.expectQuestionText(/\[Q4\]/);

    // q4 — customData.disableMultilingual=true → comment has NO toggle.
    // Same scoping rationale as q3: assert the comment field exists, then assert NO multilingual toggle anywhere in <main> (disableMultilingual suppresses it).
    const q4Comment = page.getByTestId(testIds.candidate.questions.commentInput);
    await expect(q4Comment).toBeVisible();
    await multilingualTextField.expectTranslationOptions(page.getByRole('main'), false);

    // Leave q4 — the seeded answer is already persisted and q4 has no Finnish authoring to commit (disableMultilingual). The save button routes back to the overview; clicking it simply navigates away without mutation.
    await candidateQuestionPage.expectContinueEnabled();
    await candidateQuestionPage.clickContinue();

    // ============== Step 9: logout ======================================= Navigate to candidate home first; LogoutButton is in the home nav.
    // Since all required answers are seeded + persisted, logout is direct (no confirmation dialog).

    // reason: candidate-route navigation — out of voter-fixture scope.
    await page.goto('/en/candidate');
    await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible({
      timeout: L10N_SLOW_PAGE
    });
    await candidateLogoutButton.clickWithoutDialog();

    // ============== Step 10: voter cross-check ================= Open candidate-details on results, assert English answers; switch to Finnish, assert Finnish answers reflect.

    await resultsPage.goToPage('en');
    const candidateCard = page
      .getByTestId(testIds.voter.results.candidateSection)
      .getByTestId(testIds.voter.results.card)
      .first();
    await expect(candidateCard).toBeVisible({ timeout: L10N_SLOW_PAGE });
    await candidateCard.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: L10N_SLOW_PAGE });

    // voter-side cross-check assertions: the entity-details panel testid surface is `voter-entity-detail-info` (info tab) and `voter-entity-detail-opinions` (opinions tab), as defined at apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte lines 150 + 152 and centralised in testIds.voter.entityDetail.infoTab / .opinionsTab.
    const infoTabEn = dialog.getByTestId(testIds.voter.entityDetail.infoTab);
    await expect(infoTabEn).toBeVisible();
    await expect(infoTabEn).toContainText('[en-answer-q1]');

    // Only the ACTIVE tab's panel is mounted (EntityDetails.svelte:149-153 is an {#if}/{:else if} chain), and the dialog opens on the info tab (activeIndex=0). Switch to the opinions tab (index 1 for a candidate's ['info','opinions'] tab set) before asserting on its panel.
    await dialog.getByTestId('tab-1').click();
    const opinionsTabEn = dialog.getByTestId(testIds.voter.entityDetail.opinionsTab);
    await expect(opinionsTabEn).toBeVisible();
    await expect(opinionsTabEn).toContainText('[en-answer-q3]');

    // The entity-details dialog covers the header, so the menu-toggle is not clickable. Close the dialog first (Escape), then open the nav drawer to reach the language selector. The spec re-navigates to /fi/results and re-opens the card below, so tearing down the dialog here is acceptable.
    // No drawer close needed — switchTo reloads.
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await voterNav.open();
    // langSelector switchTo full-reload; the dialog state may not survive — re-open the candidate card if the dialog closed.
    await langSelector.switchTo('fi');
    await expect(page).toHaveURL(/\/fi(\/|$)/);

    // Re-establish the candidate-details dialog if it is no longer visible post-reload. A full-page reload typically tears down the modal-driven dialog state, so re-clicking the card is the expected path. We assert the path explicitly: navigate to /fi/results (the switchTo target preserved the segment after locale, but to be robust we re-navigate) and re-open.
    await resultsPage.goToPage('fi');
    const candidateCardFi = page
      .getByTestId(testIds.voter.results.candidateSection)
      .getByTestId(testIds.voter.results.card)
      .first();
    await expect(candidateCardFi).toBeVisible({ timeout: L10N_SLOW_PAGE });
    await candidateCardFi.click();

    const dialogFi = page.getByRole('dialog');
    await expect(dialogFi).toBeVisible({ timeout: L10N_SLOW_PAGE });

    const infoTabFi = dialogFi.getByTestId(testIds.voter.entityDetail.infoTab);
    await expect(infoTabFi).toBeVisible();
    await expect(infoTabFi).toContainText('[fi-answer-q1]');

    // Same tab-switch as the en block — activate the opinions tab (index 1) before asserting on its panel.
    await dialogFi.getByTestId('tab-1').click();
    const opinionsTabFi = dialogFi.getByTestId(testIds.voter.entityDetail.opinionsTab);
    await expect(opinionsTabFi).toBeVisible();
    await expect(opinionsTabFi).toContainText('[fi-answer-q3]');
  });

  // in-flight answer/selection-state preserved across fi→en→fi.
  //
  // The pre-answer home-page locale switch above (Step 2) only proves UI STRINGS re-localise. The net-new coverage here is the IN-FLIGHT state-preservation slice: reach a located+answered voter state (election + constituency selected AND ≥1 opinion question answered), then round-trip the locale fi→en→fi and assert the SELECTIONS and ANSWERS survive each full-reload switch (not just the displayed strings). See expectInFlightStatePreserved (module scope) for the two persistence channels.
  //
  // Runs UNAUTHENTICATED (file-scope storageState) — a pure voter walk; no candidate auth needed. Composes the in-flight state via the exported voter-journey walk helpers (walkUntilQuestionsIntro + a capped answerAndAdvanceToResults(page,'max',1)) so it reaches a deterministic single-answer in-flight state regardless of viewport.
  test('in-flight selections + answers survive fi→en→fi locale switch (EFLOW-06)', async ({
    page,
    voterNav,
    langSelector
  }) => {
    test.setTimeout(L10N_TEST_MAX);

    // 1. Reach an in-flight located+answered state: Home → Intro → Elections →
    //    Constituencies → /questions, then answer EXACTLY ONE opinion question
    //    and advance to /results. Answering ≥1 question satisfies the perm seed's matching.minimumAnswers=1, so /results renders the candidate list with a computed match. This walk starts on the base locale (en).
    await walkUntilQuestionsIntro(page);
    await answerAndAdvanceToResults(page, 'max', 1);

    // 2. Capture the in-flight baseline ON the en results page: the candidate
    //    card's match score (a pure function of the single persisted answer).
    //    This is the value that MUST stay identical across every locale switch — if the answer were dropped on reload the match would change/vanish.
    await expect(page.getByTestId(testIds.voter.results.list)).toBeVisible({ timeout: L10N_SLOW_PAGE });
    await expect(page).toHaveURL(/[?&]electionId=/);
    // Extract the resolved electionId — it is the value the post-switch URL must still carry (in query OR path form) to prove the selection persisted.
    const expectedElectionId = new URL(page.url()).searchParams.get('electionId') ?? '';
    expect(expectedElectionId.length, 'in-flight baseline electionId must be non-empty').toBeGreaterThan(0);
    const baselineCard = page
      .getByTestId(testIds.voter.results.candidateSection)
      .getByTestId(testIds.voter.results.card)
      .first();
    await expect(baselineCard).toBeVisible({ timeout: L10N_SLOW_PAGE });
    const baselineMatchScore = baselineCard.getByTestId(testIds.voter.results.matchScore);
    await expect(baselineMatchScore).toBeVisible();
    const expectedMatchScore = (await baselineMatchScore.innerText()).trim();
    expect(expectedMatchScore.length, 'in-flight baseline match score must be non-empty').toBeGreaterThan(0);

    // 3. fi: switch to Finnish (full reload) and assert the in-flight selection
    //    + answer survived (election in URL + identical match score).
    await voterNav.open();
    await langSelector.switchTo('fi');
    await expectInFlightStatePreserved(page, 'fi', expectedElectionId, expectedMatchScore);

    // 4. en: switch back to English (full reload) — state still preserved.
    await voterNav.open();
    await langSelector.switchTo('en');
    await expectInFlightStatePreserved(page, 'en', expectedElectionId, expectedMatchScore);

    // 5. fi: switch to Finnish once more — completing the fi→en→fi round trip;
    //    state still preserved AND the answers carry through to /results.
    await voterNav.open();
    await langSelector.switchTo('fi');
    await expectInFlightStatePreserved(page, 'fi', expectedElectionId, expectedMatchScore);
  });
});
