import { expect, chromium, FullConfig } from '@playwright/test';
// Import Route directly so that other imports are not bundled in
import { Route } from '../frontend/src/lib/utils/navigation/route';
import candidateAppTranslations from '../frontend/src/lib/i18n/translations/en/candidateApp.json';
import mockUsers from '../backend/vaa-strapi/src/functions/mockData/mockUser.json';

import { STORAGE_STATE } from '../playwright.config';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${baseURL!}/${Route.CandAppHome}`);
  await page.getByLabel(candidateAppTranslations.common.email, {exact: true}).fill(mockUsers[1].email);
  await page.getByLabel(candidateAppTranslations.common.password, {exact: true}).fill(mockUsers[1].password);
  await page.getByText(candidateAppTranslations.common.logIn, {exact: true}).click();

  // Wait until the page actually signs in.
  await expect(page.getByText(candidateAppTranslations.homePage.ready, {exact: true})).toBeVisible();

  await page.context().storageState({ path: STORAGE_STATE });
}

export default globalSetup;
