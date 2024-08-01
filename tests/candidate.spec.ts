import { test, expect } from '@playwright/test';
// Import Route directly so that other imports are not bundled in
import { Route } from '../frontend/src/lib/utils/navigation/route';
import candidateAppTranslationsEn from '../frontend/src/lib/i18n/translations/en/candidateApp.json';
import candidateAppTranslationsFi from '../frontend/src/lib/i18n/translations/fi/candidateApp.json';
import headerTranslationsEn from '../frontend/src/lib/i18n/translations/en/header.json';
import headerTranslationsFi from '../frontend/src/lib/i18n/translations/fi/header.json';
import mockUsers from '../backend/vaa-strapi/src/functions/mockData/mockUser.json';

const LOCALE_EN = 'en';
const LOCALE_FI = 'fi';

const mockUser = mockUsers[1];

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/${Route.CandAppHome}`)
})

test.describe("when logged in with default user", async () => {
  test('should log out', async ({ page, baseURL }) => {
    await page.getByTitle(candidateAppTranslationsEn.common.logOut, {exact: true}).click();

    await expect(page).toHaveURL(`${baseURL}/${LOCALE_EN}/${Route.CandAppHome}`);
    await expect(page.getByText(candidateAppTranslationsEn.common.logIn, {exact: true})).toBeVisible();
  });

  test('should change app language through nav', async ({ page, baseURL }) => {
    //Check that nav buttons change page to correct locale
    await page.getByLabel(headerTranslationsEn.openMenu, {exact: true}).click();
    await page.getByRole('link', { name: candidateAppTranslationsFi.languages.Finnish, exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE_FI}/${Route.CandAppHome}`);

    await page.getByLabel(headerTranslationsFi.openMenu, {exact: true}).click();
    await page.getByRole('link', { name: candidateAppTranslationsEn.languages.English, exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE_EN}/${Route.CandAppHome}`);
  });

  test('nav buttons should take to correct pages', async ({ page, baseURL }) => {
    //Check that nav links go to correct pages
    await page.getByLabel(headerTranslationsEn.openMenu, {exact: true}).click();
    await page.getByRole('link', { name: candidateAppTranslationsEn.navbar.basicInfo, exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE_EN}/${Route.CandAppProfile}`);

    await page.getByLabel(headerTranslationsEn.openMenu, {exact: true}).click();
    await page.getByRole('link', { name: candidateAppTranslationsEn.navbar.yourOpinions, exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE_EN}/${Route.CandAppQuestions}`);

    await page.getByLabel(headerTranslationsEn.openMenu, {exact: true}).click();
    await page.getByRole('link', { name: candidateAppTranslationsEn.navbar.settings, exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE_EN}/${Route.CandAppSettings}`);

    await page.getByLabel(headerTranslationsEn.openMenu, {exact: true}).click();
    await page.getByRole('link', { name: candidateAppTranslationsEn.navbar.preview, exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE_EN}/${Route.CandAppPreview}`);

    await page.getByLabel(headerTranslationsEn.openMenu, {exact: true}).click();
    await page.getByRole('link', { name: candidateAppTranslationsEn.navbar.help, exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE_EN}/${Route.CandAppHelp}`);

    await page.getByLabel(headerTranslationsEn.openMenu, {exact: true}).click();
    await page.getByRole('link', { name: candidateAppTranslationsEn.navbar.start, exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE_EN}/${Route.CandAppHome}`);
  });

  test('should change app language in settings', async ({ page, baseURL }) => {
      
    //Go to setting and change language to en
    await page.goto(`${baseURL}/${LOCALE_FI}/${Route.CandAppSettings}`);
    await page.getByLabel(candidateAppTranslationsFi.settings.fields.language, {exact: true}).selectOption(LOCALE_EN);
    await expect(page).toHaveURL(`${baseURL}/${LOCALE_EN}\/${Route.CandAppSettings}`);

    //Log out
    await page.getByLabel(candidateAppTranslationsEn.common.logOut, {exact: true}).click();

    //Change page language to fi
    await page.getByLabel(headerTranslationsEn.openMenu, {exact: true}).click();
    await page.getByRole('link', { name: candidateAppTranslationsFi.languages.Finnish, exact: true }).click();

    await expect(page).toHaveURL(`${baseURL}/${LOCALE_FI}\/${Route.CandAppHome}`);

    //Sign in and expect language to automatically change to en
    await page.getByPlaceholder(candidateAppTranslationsFi.common.emailPlaceholder, {exact: true}).fill(mockUser.email);
    await page.getByPlaceholder(candidateAppTranslationsFi.common.passwordPlaceholder, {exact: true}).fill(mockUser.password);
    await page.getByRole('button', { name: candidateAppTranslationsFi.common.logIn, exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE_EN}\/${Route.CandAppHome}`);

  });

  test('should update password in settings', async ({ page, baseURL }) => {
    //Go to settings and change password     
    await page.goto(`${baseURL}/${LOCALE_EN}/${Route.CandAppSettings}`);    
    await page.getByLabel(candidateAppTranslationsEn.settings.currentPassword, {exact: true}).fill(mockUser.password);
    const newPassword = 'Password2?';
    await page.getByLabel(candidateAppTranslationsEn.settings.newPassword, { exact: true }).fill(newPassword);
    await page.getByLabel(candidateAppTranslationsEn.settings.newPasswordConfirmation, {exact: true}).fill(newPassword);
    await page.getByRole('button', { name: candidateAppTranslationsEn.settings.updatePassword, exact: true }).click();
    await expect(page.getByText(candidateAppTranslationsEn.settings.passwordUpdated, {exact: true})).toBeVisible();

    //Logout
    await page.getByLabel(candidateAppTranslationsEn.common.logOut, {exact: true}).click();

    //Should not login with old password
    await page.getByPlaceholder(candidateAppTranslationsEn.common.emailPlaceholder, {exact: true}).fill(mockUser.email);
    await page.getByPlaceholder(candidateAppTranslationsEn.common.passwordPlaceholder, {exact: true}).fill(mockUser.password);
    await page.getByRole('button', { name: candidateAppTranslationsEn.common.logIn, exact: true }).click();
    await expect(page.getByText(candidateAppTranslationsEn.common.wrongEmailOrPassword, {exact: true})).toBeVisible();

    //Should login with new password
    await page.getByPlaceholder(candidateAppTranslationsEn.common.passwordPlaceholder, {exact: true}).fill(newPassword);
    await page.getByRole('button', { name: candidateAppTranslationsEn.common.logIn, exact: true }).click();
    
    await expect(page.getByRole('heading', { name: candidateAppTranslationsEn.homePage.ready, exact: true })).toBeVisible();

    // Change password back to the default
    await page.goto(`${baseURL}/${LOCALE_EN}/${Route.CandAppSettings}`);    
    await page.getByLabel(candidateAppTranslationsEn.settings.currentPassword, {exact: true}).fill(newPassword);
    await page.getByLabel(candidateAppTranslationsEn.settings.newPassword, { exact: true }).fill(mockUser.password);
    await page.getByLabel(candidateAppTranslationsEn.settings.newPasswordConfirmation, {exact: true}).fill(mockUser.password);
    await page.getByRole('button', { name: candidateAppTranslationsEn.settings.updatePassword, exact: true }).click();
    await expect(page.getByText(candidateAppTranslationsEn.settings.passwordUpdated, {exact: true})).toBeVisible();
  });
});