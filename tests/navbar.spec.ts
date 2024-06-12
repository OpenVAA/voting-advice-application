import { test, expect } from '@playwright/test';
// Import Route directly so that other imports are not bundled in
import { Route } from '../frontend/src/lib/utils/navigation/route';
import candidateAppTranslationsEn from '../frontend/src/lib/i18n/translations/en/candidateApp.json';
import candidateAppTranslationsFi from '../frontend/src/lib/i18n/translations/fi/candidateApp.json';
import headerTranslationsEn from '../frontend/src/lib/i18n/translations/en/header.json';
import headerTranslationsFi from '../frontend/src/lib/i18n/translations/fi/header.json';

const LOCALE_EN = 'en';
const LOCALE_FI = 'fi';

test.describe.serial('nav bar buttons should work expectedly', () => {
  test('should change app language through nav', async ({ page, baseURL }) => {

    await page.goto(`${baseURL}/${LOCALE_EN}/${Route.CandAppHome}`);

    //Check that nav buttons change page to correct locale
    await page.getByLabel(headerTranslationsEn.openMenu, {exact: true}).click();
    await page.getByRole('link', { name: candidateAppTranslationsFi.languages.Finnish, exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE_FI}/${Route.CandAppHome}`);

    await page.getByLabel(headerTranslationsFi.openMenu, {exact: true}).click();
    await page.getByRole('link', { name: candidateAppTranslationsEn.languages.English, exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE_EN}/${Route.CandAppHome}`);

  });

  test('nav buttons should take to correct pages', async ({ page, baseURL }) => {

    await page.goto(`${baseURL}/${LOCALE_EN}/${Route.CandAppHome}`);

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
});
