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
    const candidateUrlReFi = new RegExp(`(http[s]?:\/\/)?(.*)\/${LOCALE_FI}\/${Route.CandAppHome}`)
    await expect(page).toHaveURL(candidateUrlReFi);

    await page.getByLabel(headerTranslationsFi.openMenu, {exact: true}).click();
    await page.getByRole('link', { name: candidateAppTranslationsEn.languages.English, exact: true }).click();
    const candidateUrlReEn = new RegExp(`(http[s]?:\/\/)?(.*)\/${LOCALE_EN}\/${Route.CandAppHome}`)
    await expect(page).toHaveURL(candidateUrlReEn);

  });

  test('nav buttons should take to correct pages', async ({ page, baseURL }) => {

    await page.goto(`${baseURL}/${LOCALE_EN}/${Route.CandAppHome}`);

    //Check that nav links go to correct pages
    await page.getByLabel(headerTranslationsEn.openMenu, {exact: true}).click();
    await page.getByRole('link', { name: candidateAppTranslationsEn.navbar.basicInfo, exact: true }).click();
    const profileUrlRe = new RegExp(`(http[s]?:\/\/)?(.*)\/${LOCALE_EN}\/${Route.CandAppProfile}`);
    await expect(page).toHaveURL(profileUrlRe);

    await page.getByLabel(headerTranslationsEn.openMenu, {exact: true}).click();
    await page.getByRole('link', { name: candidateAppTranslationsEn.navbar.yourOpinions, exact: true }).click();
    const questionsUrlRe = new RegExp(`(http[s]?:\/\/)?(.*)\/${LOCALE_EN}\/${Route.CandAppQuestions}`);
    await expect(page).toHaveURL(questionsUrlRe);

    await page.getByLabel(headerTranslationsEn.openMenu, {exact: true}).click();
    await page.getByRole('link', { name: candidateAppTranslationsEn.navbar.settings, exact: true }).click();
    const settingsUrlRe = new RegExp(`(http[s]?:\/\/)?(.*)\/${LOCALE_EN}\/${Route.CandAppSettings}`);
    await expect(page).toHaveURL(settingsUrlRe);

    await page.getByLabel(headerTranslationsEn.openMenu, {exact: true}).click();
    await page.getByRole('link', { name: candidateAppTranslationsEn.navbar.preview, exact: true }).click();
    const previewUrlRe = new RegExp(`(http[s]?:\/\/)?(.*)\/${LOCALE_EN}\/${Route.CandAppPreview}`);
    await expect(page).toHaveURL(previewUrlRe);

    await page.getByLabel(headerTranslationsEn.openMenu, {exact: true}).click();
    await page.getByRole('link', { name: candidateAppTranslationsEn.navbar.help, exact: true }).click();
    const helpUrlRe = new RegExp(`(http[s]?:\/\/)?(.*)\/${LOCALE_EN}\/${Route.CandAppHelp}`);
    await expect(page).toHaveURL(helpUrlRe);

    await page.getByLabel(headerTranslationsEn.openMenu, {exact: true}).click();
    await page.getByRole('link', { name: candidateAppTranslationsEn.navbar.start, exact: true }).click();
    const candidateUrlRe = new RegExp(`(http[s]?:\/\/)?(.*)\/${LOCALE_EN}\/${Route.CandAppHome}`);
    await expect(page).toHaveURL(candidateUrlRe);

  });
});
