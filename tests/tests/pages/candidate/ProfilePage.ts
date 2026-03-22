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
   * @param filePath - Absolute path to the image file to upload
   */
  async uploadImage(filePath: string): Promise<void> {
    // The image Input component wraps a hidden <input type="file"> inside a label.
    // Click the label to trigger the native file chooser, then set the files.
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    // Click the label text "Add an image" which triggers the file input
    await this.imageUpload.getByText(/add an image/i).click();
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
