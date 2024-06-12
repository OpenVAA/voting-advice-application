import { test, expect } from '@playwright/test';
// Import Route directly so that other imports are not bundled in
import { Route } from '../frontend/src/lib/utils/navigation/route';
import candidateAppTranslationsEn from '../frontend/src/lib/i18n/translations/en/candidateApp.json';
import candidateAppTranslationsFi from '../frontend/src/lib/i18n/translations/fi/candidateApp.json';
import headerTranslations from '../frontend/src/lib/i18n/translations/en/header.json';
import mockUser from '../backend/vaa-strapi/src/functions/mockData/mockUser.json';

const LOCALE_EN = 'en';
const LOCALE_FI = 'fi';

test.describe.serial('settings page should work expectedly', () => {
  test('should change app language', async ({ page, baseURL }) => {
    
    //Go to setting and change language to en
    await page.goto(`${baseURL}/${LOCALE_FI}/${Route.CandAppSettings}`);
    await page.getByLabel(candidateAppTranslationsFi.settings.fields.language, {exact: true}).selectOption(LOCALE_EN);
    await expect(page).toHaveURL(`${baseURL}/${LOCALE_EN}\/${Route.CandAppSettings}`);

    //Log out
    await page.getByLabel(candidateAppTranslationsEn.common.logOut, {exact: true}).click();

    //Change page language to fi
    await page.getByLabel(headerTranslations.openMenu, {exact: true}).click();
    await page.getByRole('link', { name: candidateAppTranslationsFi.languages.Finnish, exact: true }).click();

    await expect(page).toHaveURL(`${baseURL}/${LOCALE_FI}\/${Route.CandAppHome}`);

    //Sign in and expect language to automatically change to en
    await page.getByPlaceholder(candidateAppTranslationsFi.common.emailPlaceholder, {exact: true}).fill(mockUser.email);
    await page.getByPlaceholder(candidateAppTranslationsFi.common.passwordPlaceholder, {exact: true}).fill(mockUser.password);
    await page.getByRole('button', { name: candidateAppTranslationsFi.common.logIn, exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE_EN}\/${Route.CandAppHome}`);

  });

  test('should update password', async ({ page, baseURL }) => {
    
    //Go to settings and change password     
    await page.goto(`${baseURL}/${LOCALE_EN}/${Route.CandAppSettings}`);    
    await page.getByLabel(candidateAppTranslationsEn.settings.currentPassword, {exact: true}).fill(mockUser.password);
    const newPassword = 'Password1!';
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
  });
});
