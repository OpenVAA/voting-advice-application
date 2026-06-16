/**
 * @file perm-org-matching.spec.ts — EPERM-10 perm-chain spec.
 *
 * Asserts the `matching.organizationMatching` matrix (none / answersOnly /
 * impute) against the `perm-org-matching` dataset (seeded by the
 * data-setup-perm-org-matching project). The spec re-seeds the `app_settings`
 * singleton per mode (perm-singleton pattern) and asserts DISTINGUISHABLE,
 * EXACT organization match scores — not merely "a score is shown".
 *
 * Seed shape (`perm-org-matching.ts`): 4 Likert-5 opinion questions; voter
 * answers all at polar-max ('5'). Organisation `[OR1]` carries its OWN answers
 * for q1='5' (agree) and q2='1' (disagree) and leaves q3/q4 BLANK; its member
 * candidate answers q3='5'/q4='5' (covers the org's blanks).
 *
 *   - none        → the org card renders WITHOUT a match-score callout.
 *   - answersOnly → score from OR1's own answers only; the blanks q3/q4 are
 *                   penalised as the polar opposite of the voter. Voter = [5,5,5,5],
 *                   OR1 effective = [5,1,1,1] → mean normalised distance 0.75 →
 *                   25% match (PRIMARY exact value).
 *   - impute      → member answers fill the org's blanks: OR1 effective =
 *                   [5,1,5,5] → mean normalised distance 0.25 → 75% match. This
 *                   DIFFERS from answersOnly (member-imputed), satisfying the
 *                   EPERM-10 distinguishability requirement.
 *
 * SECONDARY: the /en/about org-matching disclosure block is present for the
 * active modes (answersOnly/impute) and absent for `none`.
 *
 * Rigidity contract: HARD assertions only (no expect.soft / try-catch / .catch);
 * testid-only via `testIds` (getByRole permitted via the resultsPage fixture).
 */

import { expect, test } from '../../fixtures/voter/views';
import { answerAndAdvanceToResults, walkUntilQuestionsIntro } from '../../fixtures/voter/voter-journey.fixture';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

/** OR1 carries own answers + member-imputable blanks; the score differs per mode. */
const ORG1 = /\[OR1\]/;

/** Expected EXACT org match scores derived from the seeded dataset (see file header). */
const EXPECTED_ANSWERS_ONLY = 25;
const EXPECTED_IMPUTE = 75;

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

  test('none: org card renders with NO match score; disclosure absent', async ({ page, resultsPage, aboutPage }) => {
    await client.updateAppSettings({ matching: { organizationMatching: 'none' } });

    await walkUntilQuestionsIntro(page);
    await answerAndAdvanceToResults(page, 'max');
    await resultsPage.selectEntityTab('orgs');

    // PRIMARY: under `none` the org renders but carries no computed match callout.
    await resultsPage.expectNoOrgMatchScore(ORG1);

    // SECONDARY: the About-page org-matching disclosure is hidden under `none`.
    await aboutPage.goToPage('en');
    await aboutPage.expectOrgMatchingDisclosure('none');
  });

  test('answersOnly: org score from own answers only (blanks polar-opposite)', async ({
    page,
    resultsPage,
    aboutPage
  }) => {
    await client.updateAppSettings({ matching: { organizationMatching: 'answersOnly' } });

    await walkUntilQuestionsIntro(page);
    await answerAndAdvanceToResults(page, 'max');
    await resultsPage.selectEntityTab('orgs');

    // PRIMARY: OR1 = [5,1, blank, blank]; blanks penalised polar-opposite vs the
    // polar-max voter → 25% exact.
    const score = await resultsPage.expectOrgMatchScore(ORG1);
    expect(score, 'answersOnly org match score').toBe(EXPECTED_ANSWERS_ONLY);

    // SECONDARY: disclosure present for an active mode.
    await aboutPage.goToPage('en');
    await aboutPage.expectOrgMatchingDisclosure('answersOnly');
  });

  test('impute: org score includes member-imputed blanks (differs from answersOnly)', async ({
    page,
    resultsPage,
    aboutPage
  }) => {
    await client.updateAppSettings({ matching: { organizationMatching: 'impute' } });

    await walkUntilQuestionsIntro(page);
    await answerAndAdvanceToResults(page, 'max');
    await resultsPage.selectEntityTab('orgs');

    // PRIMARY: member answers fill q3/q4='5' → OR1 effective [5,1,5,5] → 75%
    // exact, and DIFFERS from the answersOnly score.
    const score = await resultsPage.expectOrgMatchScore(ORG1);
    expect(score, 'impute org match score').toBe(EXPECTED_IMPUTE);
    expect(score, 'impute must differ from answersOnly').not.toBe(EXPECTED_ANSWERS_ONLY);

    // SECONDARY: disclosure present for an active mode.
    await aboutPage.goToPage('en');
    await aboutPage.expectOrgMatchingDisclosure('impute');
  });
});
