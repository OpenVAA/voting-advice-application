import { expect, test } from '@playwright/test';
import { buildRoute } from './utils/buildRoute';
import { TRANSLATIONS as T } from './utils/translations';
import mockUsers from '../../backend/vaa-strapi/src/functions/mockData/mockUsers.json' assert { type: 'json' };

const LOCALE_EN = 'en';
const LOCALE_FI = 'fi';

const mockUser = mockUsers[1];

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/${buildRoute({ route: 'CandAppHome', locale: LOCALE_EN })}`);
});

test.describe('when logged in with default user', async () => {
  test('should log out', async ({ page, baseURL }) => {
    await page.getByTitle(T.en['common.logout'], { exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${buildRoute({ route: 'CandAppHome', locale: LOCALE_EN })}`);
    await expect(page.getByRole('button', { name: T.en['common.login'], exact: true })).toBeVisible();
  });

  test('should change app language through nav', async ({ page, baseURL }) => {
    //Check that nav buttons change page to correct locale
    await page.getByLabel(T.en['common.openMenu'], { exact: true }).click();
    await page.getByRole('link', { name: T.fi['lang.fi'], exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${buildRoute({ route: 'CandAppHome', locale: LOCALE_FI })}`);

    await page.getByLabel(T.fi['common.openMenu'], { exact: true }).click();
    await page.getByRole('link', { name: T.en['lang.en'], exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${buildRoute({ route: 'CandAppHome', locale: LOCALE_EN })}`);
  });

  test('nav buttons should take to correct pages', async ({ page, baseURL }) => {
    //Check that nav links go to correct pages
    await page.getByLabel(T.en['common.openMenu'], { exact: true }).click();
    await page.getByRole('link', { name: T.en['candidateApp.questions.title'], exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${buildRoute({ route: 'CandAppQuestions', locale: LOCALE_EN })}`);

    await page.getByLabel(T.en['common.openMenu'], { exact: true }).click();
    await page.getByRole('link', { name: T.en['candidateApp.settings.title'], exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${buildRoute({ route: 'CandAppSettings', locale: LOCALE_EN })}`);

    await page.getByLabel(T.en['common.openMenu'], { exact: true }).click();
    await page.getByRole('link', { name: T.en['candidateApp.preview.title'], exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${buildRoute({ route: 'CandAppPreview', locale: LOCALE_EN })}`);

    await page.getByLabel(T.en['common.openMenu'], { exact: true }).click();
    await page.getByRole('link', { name: T.en['candidateApp.help.title'], exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${buildRoute({ route: 'CandAppHelp', locale: LOCALE_EN })}`);

    await page.getByLabel(T.en['common.openMenu'], { exact: true }).click();
    await page.getByRole('link', { name: T.en['candidateApp.common.home'], exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${buildRoute({ route: 'CandAppHome', locale: LOCALE_EN })}`);
  });

  // TODO: Re-implement language setting
  // test('should change app language in settings', async ({ page, baseURL }) => {
  //   //Go to setting and change language to en
  //   await page.goto(`${baseURL}/${buildRoute({ route: 'CandAppSettings', locale: LOCALE_FI })}`);
  //   await page.getByLabel(T.fi['candidateApp.settings.language'], { exact: true }).selectOption(LOCALE_EN);
  //   await expect(page).toHaveURL(`${baseURL}/${buildRoute({ route: 'CandAppSettings', locale: LOCALE_EN })}`);

  //   //Log out
  //   await page.getByLabel(T.en['common.logout'], { exact: true }).click();

  //   //Change page language to fi
  //   await page.getByLabel(T.en['common.openMenu'], { exact: true }).click();
  //   await page.getByRole('link', { name: T.fi['lang.fi'], exact: true }).click();

  //   await expect(page).toHaveURL(`${baseURL}/${buildRoute({ route: 'CandAppLogin', locale: LOCALE_FI })}`);

  //   //Sign in and expect language to automatically change to en
  //   await page.getByPlaceholder(T.fi['candidateApp.common.emailPlaceholder'], { exact: true }).fill(mockUser.email);
  //   await page.getByPlaceholder(T.fi['components.passwordInput.placeholder'], { exact: true }).fill(mockUser.password);
  //   await page.getByRole('button', { name: T.fi['common.login'], exact: true }).click();
  //   await expect(page).toHaveURL(`${baseURL}/${buildRoute('CandAppHome')}`);
  // });

  test('should update password in settings', async ({ page, baseURL }) => {
    //Go to settings and change password
    await page.goto(`${baseURL}/${buildRoute({ route: 'CandAppSettings', locale: LOCALE_EN })}`);
    await page.getByLabel(T.en['candidateApp.settings.password.current'], { exact: true }).fill(mockUser.password);
    const newPassword = 'Password2?';
    await page.getByLabel(T.en['common.password'], { exact: true }).fill(newPassword);
    await page.getByLabel(T.en['common.passwordConfirmation'], { exact: true }).fill(newPassword);
    await page.getByRole('button', { name: T.en['candidateApp.settings.password.update'], exact: true }).click();
    await expect(page.getByText(T.en['candidateApp.settings.password.updated'])).toBeVisible();

    //Logout
    await page.getByLabel(T.en['common.logout'], { exact: true }).click();

    //Should not login with old password
    await page.getByPlaceholder(T.en['candidateApp.common.emailPlaceholder'], { exact: true }).fill(mockUser.email);
    await page.getByPlaceholder(T.en['components.passwordInput.placeholder'], { exact: true }).fill(mockUser.password);
    await page.getByRole('button', { name: T.en['common.login'], exact: true }).click();
    await expect(page.getByText(T.en['candidateApp.login.wrongEmailOrPassword'])).toBeVisible();

    //Should login with new password
    await page.getByPlaceholder(T.en['components.passwordInput.placeholder'], { exact: true }).fill(newPassword);
    await page.getByRole('button', { name: T.en['common.login'], exact: true }).click();
    await expect(page.getByRole('heading', { name: T.en['candidateApp.home.ready'], exact: true })).toBeVisible();

    // Change password back to the default
    await page.goto(`${baseURL}/${buildRoute({ route: 'CandAppSettings', locale: LOCALE_EN })}`);
    await page.getByLabel(T.en['candidateApp.settings.password.current'], { exact: true }).fill(newPassword);
    await page.getByLabel(T.en['common.password'], { exact: true }).fill(mockUser.password);
    await page.getByLabel(T.en['common.passwordConfirmation'], { exact: true }).fill(mockUser.password);
    await page.getByRole('button', { name: T.en['candidateApp.settings.password.update'], exact: true }).click();
    await expect(page.getByText(T.en['candidateApp.settings.password.updated'])).toBeVisible();
  });
});
