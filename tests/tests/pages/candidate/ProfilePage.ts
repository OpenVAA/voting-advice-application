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
   * Upload an image file via the file chooser triggered by clicking the image upload element.
   *
   * The Input component for type="image" puts data-testid on the outer container (via
   * containerProps). The actual clickable element is an inner <label tabindex="0"> that
   * triggers the hidden file input.
   *
   * @param filePath - Absolute path to the image file to upload
   */
  async uploadImage(filePath: string): Promise<void> {
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    // Click the inner interactive label, not the outer container
    await this.imageUpload.locator('label[tabindex="0"]').click();
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
