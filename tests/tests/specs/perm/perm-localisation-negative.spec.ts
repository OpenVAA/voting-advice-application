/**
 * perm-localisation-negative — Phase 90 Plan 03 (TIR5:28-50).
 *
 * Topology: 1 election / 1 CG / 1 CO / 1 organisation / 1 candidate /
 * 1 nomination + 2 question categories (qc-info + qc-opin) × 2 questions:
 *   - q1 (text)
 *   - q2 (text + customData.disableMultilingual)
 *   - q3 (singleChoiceOrdinal + allow_open=true)
 *   - q4 (singleChoiceOrdinal + allow_open=true + customData.disableMultilingual)
 *
 * Settings: i18n.supportedLocales overridden to single-locale `[en]` via
 * Plan 90-01's Stage A runtime override.
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-5.md:28-50.
 *
 * Assertions (strict — rigidity contract per TIR5:5-13):
 *  1. PERM-L10N-NEG-01 — language selector hidden on voter root.
 *  2. PERM-L10N-NEG-02 — translation-options toggle absent on profile q1+q2.
 *  3. PERM-L10N-NEG-03 — translation-options toggle absent on opinion-editor
 *     q3 comment + q4 comment (q3/q4 carry allow_open=true so the
 *     `candidate-questions-comment` textarea-multilingual renders).
 *
 * Candidate login: seeded candidate has ToU pre-accepted but NO auth.users
 * row (dev-seed excludes auth.users by design). Spec drives Inbucket
 * registration via SupabaseAdminClient.sendEmail per Pitfall 3 — mirrors
 * the candidate-mega-journey.spec.ts:298-310 chain.
 *
 * Per-perm recipientEmail: 'candidate-l10n-neg-aa@test.openvaa.local' —
 * unique per perm prevents cross-perm Inbucket pollution (Open Question 4
 * RESOLVED + candidate-mega.ts:87 recipient-filter contract).
 *
 * Rigidity contract: every assertion HARD — no expect.soft, no try/catch
 * wrapping expect(), no .catch fallbacks.
 */

import { expect, test } from '../../fixtures/candidate/perm-l10n';
import {
  PASSWORD_1,
  REGISTRATION_EMAIL_SUBJECT_REGEX
} from '../../utils/candidateMegaConstants';
import { toCallbackUrl } from '../../utils/emailHelper';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';

const TIMEOUT = {
  slowPage: 15_000,
  testMax: 120_000
} as const;

// Per-perm recipient prevents Inbucket cross-perm pollution.
const RECIPIENT_EMAIL = 'candidate-l10n-neg-aa@test.openvaa.local';
// Candidate row external_id (BARE form) — writer prepends the perm prefix
// at seed time so the row's actual external_id is `e2e-perm-l10n-neg-ca-1-1a`.
const CANDIDATE_EXTERNAL_ID = 'e2e-perm-l10n-neg-ca-1-1a';

test.use({
  recipientEmail: RECIPIENT_EMAIL,
  // Start UNAUTHENTICATED — the candidate login flow drives auth from scratch.
  storageState: { cookies: [], origins: [] }
});

test.describe('perm-localisation-negative', () => {
  test('locales.length=1: no lang selector, no translation toggles on q1/q2/q3-comment/q4-comment', async ({
    page,
    emailBucket,
    candidatePasswordSetter,
    candidateLoginPage,
    candidateProfilePage,
    candidateQuestionPage,
    langSelector,
    multilingualTextField
  }) => {
    test.setTimeout(TIMEOUT.testMax);

    const client = new SupabaseAdminClient();

    // ============== Step 1: voter root — no language selector =============
    // PERM-L10N-NEG-01: With the Stage A override active and
    // supportedLocales=[en], the LanguageSelection NavGroup at
    // LanguageSelection.svelte:32 does NOT render (locales.length > 1 gate
    // evaluates false). The `lang-selector` testid is absent from the DOM.

    await page.goto('/en');
    await langSelector.expectHidden();

    // ============== Step 2: candidate registration via Inbucket ===========
    // Pitfall 3: seeded candidate has no auth.users row. Drive registration
    // via sendEmail (which calls inviteUserByEmail under the hood).

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

    // ============== Step 3: navigate callback + set initial password ======

    await page.goto(registrationCallbackUrl);
    await candidatePasswordSetter.setPassword(PASSWORD_1);

    // PasswordSetter navigates to /candidate/login post-submit; perform the
    // login (the seeded candidate has terms_of_use_accepted set, so the
    // post-login landing is the candidate home directly — no ToU prompt).
    await page.waitForURL(/\/candidate\/login/, { timeout: TIMEOUT.slowPage });
    await candidateLoginPage.login(RECIPIENT_EMAIL, PASSWORD_1);
    await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible({
      timeout: TIMEOUT.slowPage
    });

    // ============== Step 4: profile — q1 + q2 no translation options ======
    // PERM-L10N-NEG-02: navigate to the EDITABLE info-question section per
    // Pitfall 4 (NOT the locked section at lines 220-230 — that one uses a
    // route-level disableMultilingual prop, which is a different mechanism).

    await page.goto('/en/candidate/profile');
    await candidateProfilePage.expectQuestionsVisible([/\[Q1\]/, /\[Q2\]/]);

    const q1Scope = candidateProfilePage.getQuestion(/\[Q1\]/);
    await multilingualTextField.expectTranslationOptions(q1Scope, false);

    const q2Scope = candidateProfilePage.getQuestion(/\[Q2\]/);
    await multilingualTextField.expectTranslationOptions(q2Scope, false);

    // ============== Step 5: opinion-editor q3 + q4 comment ================
    // PERM-L10N-NEG-03: navigate to each opinion question's editor and
    // assert the OPEN-ANSWER COMMENT multilingual surface is suppressed.
    // q3 + q4 both carry allow_open=true so the `candidate-questions-comment`
    // textarea renders. The translation-options toggle inside the comment
    // wrapper is gated on `multilingual && locales.length > 1` — with the
    // override active and locales.length === 1, the toggle is fully absent.

    // Walk q3 first: navigate via the questions overview to the q3 editor.
    await page.goto('/en/candidate/questions');
    await page.getByTestId(testIds.candidate.questions.start).click();
    await candidateQuestionPage.expectQuestionText(/\[Q3\]/);

    const q3CommentScope = page.getByTestId(testIds.candidate.questions.commentInput);
    await expect(q3CommentScope).toBeVisible();
    await multilingualTextField.expectTranslationOptions(q3CommentScope, false);

    // Walk to q4 via the save/continue chain. Since q3 carries a pre-seeded
    // answer (value=3 + info), the save button should be enabled — clicking
    // it advances to q4.
    await candidateQuestionPage.expectContinueEnabled();
    await candidateQuestionPage.clickContinue();
    await candidateQuestionPage.expectQuestionText(/\[Q4\]/);

    const q4CommentScope = page.getByTestId(testIds.candidate.questions.commentInput);
    await expect(q4CommentScope).toBeVisible();
    await multilingualTextField.expectTranslationOptions(q4CommentScope, false);
  });
});
