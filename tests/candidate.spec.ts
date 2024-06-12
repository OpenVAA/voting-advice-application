import { test, expect } from '@playwright/test';
// Import Route directly so that other imports are not bundled in
import { Route } from '../frontend/src/lib/utils/navigation/route';
import candidateAppTranslations from '../frontend/src/lib/i18n/translations/en/candidateApp.json';
import headerTranslations from '../frontend/src/lib/i18n/translations/en/header.json';

const LOCALE = 'en';

test.beforeEach(async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/${LOCALE}/${Route.CandAppHome}`);
});

test('should log out', async ({ page, baseURL }) => {
  await expect(page).toHaveURL(`${baseURL}/${LOCALE}/${Route.CandAppHome}`);

  await page.getByTitle(candidateAppTranslations.common.logOut, {exact: true}).click();

  // TODO: Handle the logout dialog
  /*
  await expect(page.getByRole('banner').getByRole('heading', { name: 'Some of Your Data Is Still' })).toBeVisible();
  await expect(page.getByRole('banner').getByRole('button', { name: 'Continue Entering Data' })).toBeVisible();

  const logoutButton = page.getByRole('banner').getByRole('dialog').getByRole('button', { name: 'Logout' });
  await expect(logoutButton).toBeVisible();
  await logoutButton.click();
  */

  await expect(page).toHaveURL(`${baseURL}/${LOCALE}/${Route.CandAppHome}`);
  await expect(page.getByText(candidateAppTranslations.common.logIn, {exact: true})).toBeVisible();
});

test('should navigate', async ({ page, baseURL }) => {
  await expect(page).toHaveURL(`${baseURL}/${LOCALE}/${Route.CandAppHome}`);
  await expect(page.getByRole('button', { name: headerTranslations.closeMenu, exact: true })).not.toBeVisible();
  await page.getByLabel(headerTranslations.openMenu).click();
  await expect(page.getByRole('button', { name: headerTranslations.closeMenu, exact: true })).toBeVisible();
  await page.getByRole('link', { name: candidateAppTranslations.navbar.basicInfo, exact: true }).click();
  await expect(page).toHaveURL(`${baseURL}/${LOCALE}/${Route.CandAppProfile}`);
  await expect(page.getByRole('button', { name: headerTranslations.closeMenu, exact: true })).not.toBeVisible();
  await expect(page.getByRole('heading', { name: candidateAppTranslations.basicInfo.title, exact: true })).toBeVisible();
});