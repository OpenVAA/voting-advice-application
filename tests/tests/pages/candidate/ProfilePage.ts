import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

export class ProfilePage {
  readonly page: Page;
  readonly imageUpload: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.imageUpload = page.getByTestId(testIds.candidate.profile.imageUpload);
    this.submitButton = page.getByTestId(testIds.candidate.profile.submit);
  }

  /**
   * Upload an image file via the file chooser triggered by clicking the image upload button.
   *
   * Per the Phase 70 P03 refactor of `apps/frontend/src/lib/components/input/Input.svelte:532-557`,
   * the Input component for `type="image"` renders the click target as a
   * `<button type="button" id="{id}-image-label">` whose `onclick` handler
   * programmatically opens the hidden `<input type="file">` via
   * `fileInput?.click()`. Accessible-name composition lives on the file input
   * itself via `aria-labelledby="{id}-label {id}-image-label"` at
   * `Input.svelte:563`, so the button satisfies the WCAG button-name contract
   * through its rendered children (`addImage` / `changeImage` / `noImage`
   * label text + Icon).
   *
   * The role-based locator below (`button`, first match scoped to the
   * imageUpload testId container) is the canonical Playwright semantic locator —
   * aligns with
   * `playwright/no-raw-locators` lint policy (no eslint-disable needed). The
   * Phase 76 P01 / Phase 83 D-01a fix closes the selector-drift loop opened by
   * Phase 70 P03's `<label tabindex="0">` → `<button>` refactor.
   *
   * @param filePath - Absolute path to the image file to upload
   */
  async uploadImage(filePath: string): Promise<void> {
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await this.imageUpload.getByRole('button').first().click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);
  }

  /**
   * Click the submit/save button on the profile page.
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
