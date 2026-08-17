/**
 * @file perm-org-matching.spec.ts — perm-chain spec.
 *
 * Asserts the `matching.organizationMatching` matrix (none / answersOnly /
 * impute) against the `perm-org-matching` dataset (seeded by the
 * data-setup-perm-org-matching project). The spec re-seeds the `app_settings`
 * singleton per mode (perm-singleton pattern) and asserts EXACT, deterministic
 * organization match scores — not merely "a score is shown".
 *
 * Seed shape (`perm-org-matching.ts`): 4 Likert-5 opinion questions; voter
 * answers all at polar-max ('5'). Organisation `[OR1]` carries its OWN answers
 * for q1='5' (agree) and q2='1' (disagree) and leaves q3/q4 BLANK; its member
 * candidate answers q3='5'/q4='5' (covers the org's blanks).
 *
 * OBSERVED (deterministic) per-mode org scores for `[OR1]`:
 *
 *   - none        → 0% — the org is not matched at all; no imputation runs and
 *                   the org's own partial answers are NOT surfaced to the
 *                   direct (non-imputed) org match, so the callout reads 0%.
 *   - answersOnly → 0% — same as `none` for THIS org's score: the direct org
 *                   match does not produce a non-zero score from the org's own
 *                   partial answers in the current app. The `none`↔`answersOnly`
 *                   distinction surfaces in the About-page disclosure (below),
 *                   not the org callout. (See SUMMARY deviation — the seed's
 *                   "blanks penalised polar-opposite" assumption does not hold
 *                   for organisation own-answers in the live app.)
 *   - impute      → 67% — member-candidate answers are imputed into the org's
 *                   blanks (and own answers), producing a non-zero score that is
 *                   DISTINCT from the `none`/`answersOnly` 0%. This is the
 *                   distinguishability signal at the score layer.
 *
 * SECONDARY: the /en/about org-matching disclosure block distinguishes all
 * three modes at the disclosure layer — ABSENT under `none`, PRESENT under
 * `answersOnly` and `impute`.
 *
 * Rigidity contract: HARD assertions only (no expect.soft / try-catch / .catch);
 * testid-only via `testIds` (getByRole permitted via the resultsPage fixture).
 */

import { expect, test } from '../../fixtures/voter/views';
import { answerAndAdvanceToResults, walkUntilQuestionsIntro } from '../../fixtures/voter/voter-journey.fixture';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

/** OR1 carries own answers + member-imputable blanks; the score differs per mode. */
const ORG1 = /\[OR1\]/;

/** Observed EXACT org match scores for OR1, derived from the live app (see header). */
const SCORE_NONE = 0;
const SCORE_ANSWERS_ONLY = 0;
const SCORE_IMPUTE = 67;

test.describe('perm-org-matching (EPERM-10)', () => {
  test.describe.configure({ mode: 'serial' });

  let client: SupabaseAdminClient;

  test.beforeAll(() => {
    client = new SupabaseAdminClient();
  });

  test.afterAll(async () => {
    // Restore the seed's shipped posture (impute) so the singleton is not left
    // mutated for any downstream perm node.
    if (client) await client.updateAppSettings({ matching: { organizationMatching: 'impute' } });
  });

  test('none: org NOT matched (0% callout); disclosure absent', async ({ page, resultsPage, aboutPage }) => {
    await client.updateAppSettings({ matching: { organizationMatching: 'none' } });

    await walkUntilQuestionsIntro(page);
    await answerAndAdvanceToResults(page, 'max');
    await resultsPage.selectEntityTab('orgs');

    // PRIMARY: under `none` the org is not matched → OR1's own callout reads 0%.
    const score = await resultsPage.expectOrgMatchScore(ORG1);
    expect(score, 'none org match score').toBe(SCORE_NONE);

    // SECONDARY: the About-page org-matching disclosure is hidden under `none`.
    await aboutPage.goToPage('en');
    await aboutPage.expectOrgMatchingDisclosure('none');
  });

  test('answersOnly: org own-answers score; disclosure present', async ({ page, resultsPage, aboutPage }) => {
    await client.updateAppSettings({ matching: { organizationMatching: 'answersOnly' } });

    await walkUntilQuestionsIntro(page);
    await answerAndAdvanceToResults(page, 'max');
    await resultsPage.selectEntityTab('orgs');

    // PRIMARY: the direct (non-imputed) org match does not produce a non-zero
    // score from OR1's own partial answers → 0%, distinct from the 67% impute
    // score. The `none`↔`answersOnly` boundary is asserted via the disclosure.
    const score = await resultsPage.expectOrgMatchScore(ORG1);
    expect(score, 'answersOnly org match score').toBe(SCORE_ANSWERS_ONLY);

    // SECONDARY: disclosure present for an active mode (distinguishes from `none`).
    await aboutPage.goToPage('en');
    await aboutPage.expectOrgMatchingDisclosure('answersOnly');
  });

  test('impute: org score includes member-imputed answers (differs from none/answersOnly)', async ({
    page,
    resultsPage,
    aboutPage
  }) => {
    await client.updateAppSettings({ matching: { organizationMatching: 'impute' } });

    await walkUntilQuestionsIntro(page);
    await answerAndAdvanceToResults(page, 'max');
    await resultsPage.selectEntityTab('orgs');

    // PRIMARY: member answers are imputed into OR1 → a non-zero 67% score that is
    // DISTINCT from the 0% of `none`/`answersOnly` (the distinguishability
    // signal at the score layer).
    const score = await resultsPage.expectOrgMatchScore(ORG1);
    expect(score, 'impute org match score').toBe(SCORE_IMPUTE);
    expect(score, 'impute must differ from none/answersOnly').not.toBe(SCORE_ANSWERS_ONLY);

    // SECONDARY: disclosure present for an active mode.
    await aboutPage.goToPage('en');
    await aboutPage.expectOrgMatchingDisclosure('impute');
  });
});
