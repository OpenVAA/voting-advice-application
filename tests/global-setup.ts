import { expect, chromium, FullConfig } from '@playwright/test';
import { STORAGE_STATE } from '../playwright.config';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${baseURL!}/candidate`);
  await page.getByLabel('Email').fill('first.last@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByText('Sign in').click();

  // Wait until the page actually signs in.
  await expect(page.getByText('Welcome to the Candidate App')).toBeVisible();

  await page.context().storageState({ path: STORAGE_STATE });
};

export default globalSetup;
