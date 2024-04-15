import { test, expect } from '@playwright/test';

test.describe.serial('settings page should work expectedly', () => {
  test('should change app language', async ({ page }) => {
    
    //Go to setting and change language to en
    await page.goto('http://localhost:5173/fi/candidate/settings');
    await page.getByLabel('Sovelluksen kieli').selectOption('en');
    await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/en\/candidate\/settings/);

    //Log out
    await page.getByLabel('Logout').click();

    //Change page language to fi
    await page.getByLabel('Open menu').click();
    await page.getByRole('link', { name: 'Suomi' }).click();
    await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/fi\/candidate/);
    await page.locator('.drawer-overlay').click();

    //Sign in and expect language to automatically change to en
    await page.getByPlaceholder('example@email.com').fill('first.last@example.com');
    await page.getByPlaceholder('Esim. CP23-174a-f4%&-aHAB').fill('password');
    await page.getByRole('button', { name: 'FI - Sign in' }).click();
    await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/en\/candidate/);

  });

  test('should update password', async ({ page }) => {
    
    //Go to settings and change password 
    await page.goto('http://localhost:5173/en/candidate/settings');    
    await page.getByLabel('Current Password').fill('password');
    await page.getByLabel('New Password', { exact: true }).fill('Password1!');
    await page.getByLabel('New Password Confirmation').fill('Password1!');
    await page.getByRole('button', { name: 'Update Password' }).click();
    await expect(page.getByText('The password has been updated!')).toBeVisible();

    //Logout
    await page.getByLabel('Logout').click();

    //Should not login with old password
    await page.getByPlaceholder('example@email.com').fill('first.last@example.com');
    await page.getByPlaceholder('E.g. CP23-174a-f4%&-aHAB').fill('password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Wrong email or password')).toBeVisible();

    //Should login with new password
    await page.getByPlaceholder('E.g. CP23-174a-f4%&-aHAB').fill('Password1!');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('heading', { name: 'You\'re Ready to Roll!' })).toBeVisible();

  });
});
