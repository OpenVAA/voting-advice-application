import { expect, chromium, FullConfig } from '@playwright/test';
// Import Route directly so that other imports are not bundled in
import { Route } from '../frontend/src/lib/utils/navigation/route';
import { TRANSLATIONS as T } from './utils/translations';
import mockUsers from '../backend/vaa-strapi/src/functions/mockData/mockUser.json';
import { STORAGE_STATE } from '../playwright.config';

const mockUser = mockUsers[1];
/** The setup report must be stored in a separate directory from `playwright-report` because the latter will be overwritten after the setup */
const SETUP_REPORT_DIR = './playwright-setup-report';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {

    await context.tracing.start({ screenshots: true, snapshots: true });
    await page.goto(`${baseURL!}/${Route.CandAppHome}`);
    await page.getByLabel(T.en['candidateApp.common.email'], { exact: true }).fill(mockUser.email);
    await page.getByLabel(T.en['components.passwordInput.password'], { exact: true }).fill(mockUser.password);
    await page.getByText(T.en['common.login'], { exact: true }).click();
    // Wait until the page actually signs in.
    await expect(
      page.getByText(T.en['candidateApp.home.ready'], 
      {exact: true}), 
      'The start page for a logged-in candidate should be visible. If this fails, make sure that the database actually contains the user with the email and password used. Also, because we’re checking for a specific intro message, the user should have all their answers filled.'
    ).toBeVisible();
    await context.tracing.stop({
      path: `${SETUP_REPORT_DIR}/setup-trace.zip`,
    });
    await context.storageState({ path: STORAGE_STATE });

  } catch (error) {

    // The setup report must be stored in a separate directory from `playwright-report` because the latter will be overwritten after the setup
    await context.tracing.stop({
      path: `${SETUP_REPORT_DIR}/failed-setup-trace.zip`,
    });
    await browser.close();
    throw error;
  }
}

export default globalSetup;
