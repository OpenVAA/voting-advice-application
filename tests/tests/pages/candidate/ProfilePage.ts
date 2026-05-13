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
    // Phase 83 DETERM-06 D-01b escalation: 500ms pre-filechooser settle delay
    // (per CONTEXT D-01b + Phase 76 P01 mitigation pattern). D-01a's selector
    // fix alone was not sufficient to unblock the filechooser TIMEOUT in
    // cold-start — the 1-run smoke at post-fix/smoke-output.txt reproduced
    // the cascade even after switching from raw-locator to getByRole('button').
    // The settle delay lets the page hydrate the click-target's onclick
    // handler before Playwright registers the filechooser listener; without
    // it the click can land before the handler is wired and `fileInput?.click()`
    // never fires.
    // reason: there is no public hydration signal on the image-upload button
    // (no testId-marked hydration sentinel, no aria-busy attribute on the
    // imageUpload container); a small timeout is the canonical pattern per
    // Phase 76 P01 for filechooser-trigger races.
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await this.page.waitForTimeout(500);
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
