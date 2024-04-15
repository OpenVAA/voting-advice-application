import { test, expect } from '@playwright/test';

test.describe.serial('nav bar buttons should work expectedly', () => {
  test('should change app language through nav', async ({ page }) => {

    await page.goto('http://localhost:5173/en/candidate');

    //Check that nav buttons change page to correct locale
    await page.getByLabel('Open menu').click();
    await page.getByRole('link', { name: 'Suomi' }).click();
    await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/fi\/candidate/);

    await page.getByRole('link', { name: 'English' }).click();
    await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/en\/candidate/);

    await page.getByRole('link', { name: 'Español (Colombia)' }).click();
    await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/es-CO\/candidate/);

  });

  test('nav buttons should take to correct pages', async ({ page }) => {

    await page.goto('http://localhost:5173/en/candidate');

    //Check that nav links go to correct pages
    await page.getByLabel('Open menu').click();
    await page.getByRole('link', { name: 'Basic Info' }).click();
    await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/en\/candidate\/profile/);

    await page.getByLabel('Open menu').click();
    await page.getByRole('link', { name: 'Your Opinions' }).click();
    await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/en\/candidate\/questions/);

    await page.getByLabel('Open menu').click();
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/en\/candidate\/settings/);

    await page.getByLabel('Open menu').click();
    await page.getByRole('link', { name: 'Preview' }).click();
    await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/en\/candidate\/preview/);

    await page.getByLabel('Open menu').click();
    await page.getByRole('link', { name: 'Help' }).click();
    await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/en\/candidate\/help/);

    await page.getByLabel('Open menu').click();
    await page.getByRole('link', { name: 'Start' }).click();
    await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/en\/candidate/);

  });
});
