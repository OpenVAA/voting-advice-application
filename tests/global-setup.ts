import { expect, chromium, FullConfig } from '@playwright/test';
// Import Route directly so that other imports are not bundled in
import { Route } from '../frontend/src/lib/utils/navigation/route';
import { TRANSLATIONS as T } from './utils/translations';
import mockUsers from '../backend/vaa-strapi/src/functions/mockData/mockUser.json';
import { STORAGE_STATE } from '../playwright.config';

const mockUser = mockUsers[1];

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${baseURL!}/${Route.CandAppHome}`);
  await page.getByLabel(T.en['candidateApp.common.email'], {exact: true}).fill(mockUser.email);
  await page.getByLabel(T.en['components.passwordInput.password'], {exact: true}).fill(mockUser.password);
  await page.getByText(T.en['common.login'], {exact: true}).click();

  // Wait until the page actually signs in.
  await expect(page.getByText(T.en['candidateApp.home.ready'], {exact: true})).toBeVisible();

  await page.context().storageState({ path: STORAGE_STATE });
}

export default globalSetup;
