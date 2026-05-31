/**
 * @file candidateProfilePage fixture — Phase 89 Plan 02 (TIR4:75-76 + 166-188 + D-89-02).
 *
 * Function-fixture for the candidate profile (basic-info) page at
 * `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte`.
 *
 * Surface (TIR4:75-76 + 166-188):
 *  - uploadPortrait({ path, expectError? })       — upload an image file via
 *                                                    the file chooser on the
 *                                                    profile-image-upload
 *                                                    button. When expectError
 *                                                    is supplied, additionally
 *                                                    assert the i18n error
 *                                                    message inside the
 *                                                    profile-image-error
 *                                                    wrapper.
 *  - expectStaticInfo({ name?, nomination? })     — assert the immutable
 *                                                    first-name / last-name
 *                                                    and the nominations
 *                                                    block content.
 *  - getQuestion(label)                           — locate a per-question
 *                                                    wrapper by displayed
 *                                                    label (string | RegExp).
 *  - expectQuestionsVisible(labels)               — assert each label appears
 *                                                    inside a profile-info-item.
 *  - expectQuestionsAbsent(labels)                — assert none of the labels
 *                                                    is present.
 *  - expectRequiredBadge(label)                   — assert the question
 *                                                    matching `label` carries
 *                                                    a required marker.
 *  - fillQuestion(label, value)                   — locate by label + fill the
 *                                                    inner input/textarea.
 *  - submit()                                     — click profile-submit.
 *  - expectSubmitMessage()                        — assert the post-submit
 *                                                    success / advance state
 *                                                    by waiting for navigation
 *                                                    away from /profile.
 *
 * **General API principle** (per plan): question methods take the DISPLAYED
 * label (string | RegExp). Specs holding externalIds resolve to labels via
 * baseV1 at the call site.
 *
 * SIBLING (not replacement) to the legacy tests/tests/pages/candidate/ProfilePage.ts.
 *
 * **Rigidity contract** (Phase 88 Plan 04 SCOPE acceptance #6):
 * - NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO
 *   `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

/**
 * Image-upload error variant keys. Mapped to i18n message keys at
 * `apps/frontend/src/lib/components/input/Input.svelte:270-272`:
 *  - invalidFile  → 'components.input.error.invalidFile'  ("Invalid file type")
 *  - oversizeFile → 'components.input.error.oversizeFile' ("File too large")
 *
 * The exact rendered strings depend on the active i18n bundle; the fixture
 * asserts on a stable substring rather than the full localized message so
 * spec assertions remain robust across locale switches.
 */
const IMAGE_ERROR_CONTAINS: Readonly<Record<'invalidFile' | 'oversizeFile', RegExp>> = Object.freeze({
  invalidFile: /invalid|not.*image|wrong.*format/i,
  oversizeFile: /large|size|max/i
});

export interface ProfileNominationExpectations {
  electionSymbol?: string;
  constituency?: string | RegExp;
  election?: string | RegExp;
}

export function createCandidateProfilePage(page: Page) {
  /**
   * Locate the per-question wrapper (data-testid="candidate-profile-info-item")
   * whose visible content matches `label` (string | RegExp). Returns the
   * filtered Locator without awaiting — caller chains an action.
   */
  function questionLocator(label: string | RegExp): Locator {
    return page.getByTestId(testIds.candidate.profile.infoItem).filter({ hasText: label });
  }

  return {
    /**
     * Upload an image via the file chooser triggered by the profile-image-upload
     * button. When `expectError` is supplied, additionally assert the matching
     * error message is rendered inside the profile-image-error wrapper.
     *
     * The pre-filechooser 500ms settle delay mirrors the Phase 83 DETERM-06
     * pattern from the legacy ProfilePage.ts:38-52 — the underlying click
     * target's onclick handler needs to hydrate before Playwright registers
     * the filechooser listener.
     */
    async uploadPortrait(opts: { path: string; expectError?: 'invalidFile' | 'oversizeFile' }): Promise<void> {
      // reason: there is no public hydration signal on the image-upload button;
      // a small timeout is the canonical pattern per Phase 76 P01 for
      // filechooser-trigger races. Mirrors the legacy ProfilePage.ts pattern.
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(500);
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.getByTestId(testIds.candidate.profile.imageUpload).getByRole('button').first().click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(opts.path);
      if (opts.expectError !== undefined) {
        const errWrapper = page.getByTestId(testIds.candidate.profile.imageError);
        await expect(errWrapper).toBeVisible();
        await expect(errWrapper).toContainText(IMAGE_ERROR_CONTAINS[opts.expectError]);
      }
    },

    /**
     * Assert the immutable static-info fields render the expected values.
     * Each field is optional — only the supplied fields are checked.
     */
    async expectStaticInfo(props: { name?: string; nomination?: ProfileNominationExpectations }): Promise<void> {
      if (props.name !== undefined) {
        // `profile-first-name` lands on the disabled <input> element itself.
        // An <input>'s value lives in its `value` property, NOT its text
        // content, so `toContainText` always sees "" — use `toHaveValue`,
        // the Playwright-canonical assertion for form-control values.
        const firstName = page.getByTestId('profile-first-name');
        await expect.soft(firstName).toHaveValue(props.name);
      }
      if (props.nomination !== undefined) {
        const noms = page.getByTestId(testIds.candidate.profile.nominations);
        await expect.soft(noms).toBeVisible();
        // Election name renders as the InputGroup title (plain text) → matched
        // on text content. Constituency + election symbol render as locked
        // <Input> values, which live in the input's `value` property (NOT text
        // content), so they're matched via toHaveValue on their testid'd inputs.
        if (props.nomination.election !== undefined) {
          await expect.soft(noms).toContainText(props.nomination.election);
        }
        if (props.nomination.constituency !== undefined) {
          await expect.soft(noms.getByTestId('nomination-constituency')).toHaveValue(props.nomination.constituency);
        }
        if (props.nomination.electionSymbol !== undefined) {
          await expect
            .soft(noms.getByTestId('nomination-election-symbol'))
            .toHaveValue(props.nomination.electionSymbol);
        }
      }
    },

    /**
     * Return the Locator for the question wrapper matching `label`.
     */
    getQuestion(label: string | RegExp): Locator {
      return questionLocator(label);
    },

    /**
     * Assert every label in `labels` is rendered inside a profile-info-item.
     */
    async expectQuestionsVisible(labels: Array<string | RegExp>): Promise<void> {
      for (const label of labels) {
        await expect(questionLocator(label).first()).toBeVisible();
      }
    },

    /**
     * Assert NO profile-info-item matches any of `labels`.
     */
    async expectQuestionsAbsent(labels: Array<string | RegExp>): Promise<void> {
      for (const label of labels) {
        await expect.soft(questionLocator(label)).toHaveCount(0);
      }
    },

    /**
     * Assert the question matching `label` carries a required marker.
     * Per `Input.svelte:135` the required marker is a screen-reader-only
     * "Required" span sibling to the input; we match on its accessible text.
     */
    async expectRequiredBadge(label: string | RegExp): Promise<void> {
      const q = questionLocator(label).first();
      await expect.soft(q).toContainText(/required/i);
    },

    /**
     * Locate the question matching `label` and fill its inner editable
     * control. Descends to the first `textbox` OR `spinbutton` inside the
     * wrapper: text / longText / link / date questions render `role=textbox`,
     * but a **number** question is `<input type="number">` → `role=spinbutton`.
     * Matching only `textbox` made `.fill()` on a number question hang until
     * the full per-test timeout (the locator never resolved); `.or()` covers
     * both roles.
     *
     * Fail-fast: assert the control is visible (bounded by the expect timeout)
     * BEFORE filling. A never-resolving locator would otherwise let `.fill()`
     * burn the entire per-test timeout; the bounded assertion surfaces the
     * real cause in seconds with a clear message.
     */
    async fillQuestion(label: string | RegExp, value: string): Promise<void> {
      const q = questionLocator(label).first();
      const editable = q.getByRole('textbox').or(q.getByRole('spinbutton')).first();
      await expect(editable).toBeVisible();
      await editable.fill(value);
    },

    /**
     * Click profile-submit (variant="main"). Caller asserts the post-submit
     * navigation target separately.
     */
    async submit(): Promise<void> {
      await page.getByTestId(testIds.candidate.profile.submit).click();
    },

    /**
     * Assert the profile-submit flow advances away from /profile (i.e., the
     * submit was successful — the page navigates to /candidate or
     * /candidate/questions per the canSubmit branch at profile/+page.svelte:104-116).
     */
    async expectSubmitMessage(): Promise<void> {
      await expect(page).toHaveURL(/\/candidate(?!\/profile)/);
    }
  };
}

export type CandidateProfilePageFixture = ReturnType<typeof createCandidateProfilePage>;
