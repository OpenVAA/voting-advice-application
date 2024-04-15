import { test, expect } from '@playwright/test';
import path from 'path';

const strapiURL = process.env.STRAPI_URL || 'http://localhost:1337';

test.describe.serial('should complete the registration process', () => {
  test('should log into Strapi and import candidates', async ({ page }) => {
    await page.goto(`${strapiURL}/admin`);
    await page.getByLabel('Email*').fill('admin@example.com');
    await page.getByLabel('Password*').fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByText('Strapi Dashboard')).toBeVisible();

    // Navigate to the Parties in Content Manager
    await page.getByRole('link', { name: 'Content Manager' }).click();
    await page.getByRole('link', { name: 'Parties' }).click();
    const idLabelElement = page.getByRole('gridcell', { name: 'id', exact: true });
    const partyIdElement = idLabelElement.locator('xpath=../../../tbody/tr[1]/td[2]/span');
    const partyId = await partyIdElement.innerText();
    expect(partyId).not.toBeNull();
    console.log(partyId);

    page.on('filechooser', async fileChooser => {
      await fileChooser.setFiles(path.join(__dirname, 'candidate-import.csv'));
    });

    // Navigate to the Candidates in Content Manager
    await page.getByRole('link', { name: 'Candidates' }).click();
    await page.getByRole('button', { name: 'Import' }).click();
    await page.locator('label').click();

    // Enter the CSV data
    await page.locator('.view-line').first().click();
    await page.getByLabel('Editor content;Press Alt+F1').fill(
`firstName,lastName,party,email,published
Alice,Alisson,${partyId},alice@example.com,true
Bob,Bobsson,${partyId},bob@example.com,false
Carol,Carolsson,${partyId},carol@example.com,false`
    );
    await page.getByLabel('Import', { exact: true }).getByRole('button', { name: 'Import' }).click();

    // Check that the import was successful
    await expect(page.getByText('Your data has been imported').first()).toBeVisible();
    await page.getByRole('button', { name: 'Close', exact: true }).first().click();

    // Reload the page to see the imported candidates (just in case)
    await page.reload();

    // Navigate to the imported candidate and assign a nomination to it
    await page.getByText('alice@example.com').first().click();
    await page.getByLabel('nomination').click();
    await page.getByLabel('2').click();
    await page.getByRole('button', { name: 'Save' }).click();

    // Send registration email
    await page.getByRole('button', { name: 'Send registration email' }).click();
    await page.getByLabel('Email subject').fill('Subject');
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await page.getByText('Registration email was sent').click();

    // Wait for 5 seconds to allow the email to be sent
    await page.waitForTimeout(5000);

    // Navigate to maildev and open registration link
    await page.goto('http://localhost:1080/#/');
    await page.getByRole('link', { name: 'Subject To: alice@example.com' }).first().click();
    const link = await page.frameLocator('iframe >> nth=0').getByRole('link', { name: 'http://localhost:5173/en/' }).getAttribute('href');
    if (!link) throw new Error('Link not found');
    await page.goto(link);

    // Complete the registration process
    // Check that the candidate name is correct
    await expect(page.getByRole('heading', { name: 'Hello, Alice!' })).toBeVisible({ timeout: 20000 });
    await page.locator('#password').fill('Password1!');
    await page.locator('#passwordConfirmation').fill('Password1!a');
    // Test password mismatch
    await page.getByRole('button', { name: 'Set password' }).click();
    await expect(page.getByText('Passwords don\'t match')).toBeVisible();
    // Correct the password
    await page.locator('#passwordConfirmation').fill('Password1!');
    await page.getByRole('button', { name: 'Set password' }).click();

    // Check that the password was set by logging in
    await expect(page.getByText('Your password is now set!')).toBeVisible();
    expect(await page.getByPlaceholder('example@email.com').inputValue()).toBe('alice@example.com');
    await page.getByPlaceholder('E.g. CP23-174a-f4%&-aHAB').fill('Password1!');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Check that the login was successful
    await expect(page.getByText('Hello, Alice!')).toBeVisible();
  });
});
