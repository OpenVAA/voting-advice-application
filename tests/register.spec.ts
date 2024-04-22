import { test, expect } from '@playwright/test';
import path from 'path';

const strapiURL = process.env.STRAPI_URL || 'http://localhost:1337';

const userFirstName = 'Alice';
const userLastName= 'Alisson';
const userEmail = 'alice@example.com';
const userPassword = 'Password1!';
const userGender = 'Male';
const userManifesto = 'Lorem ipsum dolor sit amet, consectetur adipisci elit, sed eiusmod tempor incidunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquid ex ea commodi consequat. Quis aute iure reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint obcaecat cupiditat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

test.describe.serial('should complete the registration process', () => {
  test('logout', async ({ page }) => {
    await page.goto(`http://localhost:5173/en/candidate`);
    await page.getByLabel('Logout').click();
  });

  test('should log into Strapi and import candidates', async ({ page }) => {
    await page.goto(`${strapiURL}/admin`);
    await page.getByLabel('Email*').fill('admin@example.com');
    await page.getByLabel('Password*').fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByText('Strapi Dashboard')).toBeVisible();

    // Navigate to the Parties in Content Manager
    await page.getByRole('link', { name: 'Content Manager' }).click();
    await page.getByRole('link', { name: 'Parties' }).click();
    const idLabelElement = page.getByRole('gridcell', {
      name: 'id',
      exact: true,
    });
    const partyIdElement = idLabelElement.locator(
      'xpath=../../../tbody/tr[1]/td[2]/span'
    );
    const partyId = await partyIdElement.innerText();
    expect(partyId).not.toBeNull();
    console.log(partyId);

    page.on('filechooser', async (fileChooser) => {
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
    ${userFirstName},${userLastName},${partyId},${userEmail},true
    Bob,Bobsson,${partyId},bob@example.com,false
    Carol,Carolsson,${partyId},carol@example.com,false`
    );
    await page
      .getByLabel('Import', { exact: true })
      .getByRole('button', { name: 'Import' })
      .click();

    // Check that the import was successful
    await expect(
      page.getByText('Your data has been imported').first()
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Close', exact: true })
      .first()
      .click();

    // Reload the page to see the imported candidates (just in case)
    await page.reload();

    // Navigate to the imported candidate and assign a nomination to it
    await page.getByText(userEmail).first().click();
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
    await page
      .getByRole('link', { name: `Subject To: ${userEmail}` })
      .first()
      .click();
    const link = await page
      .frameLocator('iframe >> nth=0')
      .getByRole('link', { name: 'http://localhost:5173/en/' })
      .getAttribute('href');
    if (!link) throw new Error('Link not found');
    await page.goto(link);

    // Complete the registration process
    // Check that the candidate name is correct
    await expect(
      page.getByRole('heading', { name: `Hello, ${userFirstName}!` })
    ).toBeVisible({ timeout: 20000 });
    await page.locator('#password').fill(userPassword);
    await page.locator('#passwordConfirmation').fill('Password1!a');
    // Test password mismatch
    await page.getByRole('button', { name: 'Set password' }).click();
    await expect(page.getByText("Passwords don't match")).toBeVisible();
    // Correct the password
    await page.locator('#passwordConfirmation').fill(userPassword);
    await page.getByRole('button', { name: 'Set password' }).click();

    // Check that the password was set by logging in
    await expect(page.getByText('Your password is now set!')).toBeVisible();
    expect(await page.getByPlaceholder('example@email.com').inputValue()).toBe(userEmail);
    await page.getByPlaceholder('E.g. CP23-174a-f4%&-aHAB').fill(userPassword);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Check that the login was successful
    await expect(page.getByText(`Hello, ${userFirstName}!`)).toBeVisible();
  });

  test('should succesfully set basic info', async ({ page, baseURL }) => {
    // Log the default user out
    await page.goto(`http://localhost:5173/en/candidate`);
    await page.getByLabel('Logout').click();

    // Log in with the created user Alice
    await page.getByLabel('Email').fill(userEmail);
    await page.getByLabel(/^Password$/).fill(userPassword);
    await page.getByText('Sign in').click();

    await page.goto(`${baseURL}/en/candidate/profile`);
    await expect(page).toHaveURL(
      /(http[s]?:\/\/)?(.*)\/en\/candidate\/profile/
    );

    // Upload a profile picture
    page.on('filechooser', async (fileChooser) => {
      await fileChooser.setFiles(path.join(__dirname, 'test_image_black.png'));
    });
    await page.getByText('Tap to add photo').click();
    await page.getByLabel('Gender').selectOption(userGender);
    await page.getByLabel('Birthday').fill('1990-01-01');

    const motherTongueField = page.getByTestId('motherTongue');
    const saveButton = page.getByTestId('submitButton');

    // Button should not be clickable with 0 languages picked and manifesto not set
    await expect(saveButton).toBeDisabled();

    // Fill manifesto
    await page.getByLabel('election manifesto').fill(userManifesto);

    // Button should still be disabled because no language is set
    await expect(saveButton).toBeDisabled();

    await motherTongueField.selectOption('Finnish');

    // Button should now be visible with a language selected
    await expect(saveButton).toBeEnabled();

    // Also test the other languages
    await motherTongueField.selectOption('Spanish');
    await motherTongueField.selectOption('English');

    await expect(
      page.locator('form div').filter({ hasText: 'Finnish' }).nth(3)
    ).toBeVisible();
    await expect(
      page.locator('form div').filter({ hasText: 'English' }).nth(3)
    ).toBeVisible();
    await expect(
      page.locator('form div').filter({ hasText: 'Spanish' }).nth(3)
    ).toBeVisible();
    await page.getByLabel('English').click();

    // Now submit the form
    await expect(saveButton).toBeVisible();
    await saveButton.click();
    await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/en\/candidate\/questions/);
  });

  test('should succesfully answer opinion questions', async ({ page }) => {

    // Log the default user out
    await page.goto(`http://localhost:5173/en/candidate`);
    await page.getByLabel('Logout').click();

    // Log in with the created user Alice
    await page.getByLabel('Email').fill(userEmail);
    await page.getByLabel(/^Password$/).fill(userPassword);
    await page.getByText('Sign in').click();

    await page.goto(`http://localhost:5173/en/candidate/questions`); 
    await page.reload(); //Reload to make sure correct data is loaded to page

    // Expect correct texts on questions page
    await expect(page.getByText('Enter your opinions')).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Expect correct url for first question
    await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/en\/candidate\/questions\/1/);

    // Expect Read More expander to exist
    await expect(page.getByLabel('open $Read More')).toBeVisible();

    // Answer first question and give comments
    await page.getByLabel('Fully agree').click();
    await page.getByLabel('Comment on this issue').fill('Lorem ipsum');
    await page.getByRole('button', { name: 'Show translations for this' }).click();
    await page.getByLabel('Suomi').fill('Lorem ipsum in Finnish');
    await page.getByLabel('Español (Colombia)').fill('Lorem ipsum in Spanish');
    await page.getByRole('button', { name: 'Save and Continue' }).click();

    // Answer to all remaining questions
    while (await page.getByText('Fully disagree').isVisible()) {
      await page.getByLabel('Fully agree').click();
      await page.waitForTimeout(500); //Wait so that UI has time to change (otherwise doesn't work all the time)
      await page.getByRole('button', { name: 'Save and Continue' }).click();
      await page.waitForTimeout(100); //Wait so that UI has time to change (otherwise doesn't work all the time)
    }

    // Expect to be at "You're Ready to Roll" page
    await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/en\/candidate/);
    await expect(page.getByRole('heading', { name: 'You\'re Ready to Roll!' })).toBeVisible();

    // Expect buttons to be visible and enabled
    await expect(page.getByRole('button', { name: 'Edit your basic information' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Edit your opinions' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Preview your profile' }).first()).toBeEnabled();
    await expect(page.getByLabel('Primary actions').getByRole('button', { name: 'Preview your profile' })).toBeEnabled();
    await expect(page.getByLabel('Primary actions').getByRole('button', { name: 'Log Out' })).toBeEnabled();

    // Check that buttons take to correct pages
    await page.getByRole('button', { name: 'Edit your basic information' }).click();
    await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/en\/candidate\/profile/);
    await page.goto(`http://localhost:5173/en/candidate`);

    await page.getByRole('button', { name: 'Edit your opinions' }).click();
    await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/en\/candidate\/questions/);
    await page.goto(`http://localhost:5173/en/candidate`);

    await page.getByRole('button', { name: 'Preview your profile' }).first().click();
    await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/en\/candidate\/preview/);
    await page.goto(`http://localhost:5173/en/candidate`);

    await page.getByLabel('Primary actions').getByRole('button', { name: 'Preview your profile' }).click();
    await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/en\/candidate\/preview/);
    await page.goto(`http://localhost:5173/en/candidate`);

    await page.getByLabel('Primary actions').getByRole('button', { name: 'Log Out' }).click();
    await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/en\/candidate/);
    await expect(page.getByText('Sign in')).toBeVisible();
  });

  test('your opinions page should work correctly', async ({ page }) => {

    // Log the default user out
    await page.goto(`http://localhost:5173/en/candidate`);
    await page.getByLabel('Logout').click();

    // Log in with the created user Alice
    await page.getByLabel('Email').fill(userEmail);
    await page.getByLabel(/^Password$/).fill(userPassword);
    await page.getByText('Sign in').click();

    // Go to questions page
    await page.goto(`http://localhost:5173/en/candidate/questions`);
    await page.reload(); //Reload to make sure correct data is loaded to page

    // Expect correct heading and no warning
    await expect(page.getByRole('heading', { name: 'Your opinions' })).toBeVisible();
    await expect(page.getByText('You still have ')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Enter Missing Answers' })).toBeHidden();
    
    // Open immigration category
    await page.getByLabel('open $Immigration').click();

    // Expect correct answer and comment text to be shown
    await expect(page.getByText('You', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Fully agree').first()).toBeVisible();
    await expect(page.getByText('Lorem ipsum')).toBeVisible();

    // Go edit answer
    await page.getByRole('button', { name: 'Edit Your Answer' }).first().click();

    // Expect correct data for first question
    await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/en\/candidate\/questions\/edit\/1/);
    await expect(page.getByRole('heading', { name: 'The state should preferably' })).toBeVisible();
    await expect(page.getByLabel('Fully agree')).toBeChecked();

    // Check that button goes back to correct page
    await page.getByRole('button', { name: 'Save and Return' }).click();
    await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/en\/candidate\/questions/);

    // Go back and test cancel button
    await page.getByLabel('open $Immigration').click();
    await page.getByRole('button', { name: 'Edit Your Answer' }).first().click();

    // Change opinion and press cancel
    await page.getByLabel('Fully disagree').click();
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Expect button to go to correct page and opinion to be unchanged
    await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/en\/candidate\/questions/);
    await page.getByLabel('open $Immigration').click();
    await expect(page.getByText('Fully agree').first()).toBeVisible();
  });

  test('preview page should work correctly', async ({ page }) => {

    // Log the default user out
    await page.goto(`http://localhost:5173/en/candidate`);
    await page.getByLabel('Logout').click();

    // Log in with the created user Alice
    await page.getByLabel('Email').fill(userEmail);
    await page.getByLabel(/^Password$/).fill(userPassword);
    await page.getByText('Sign in').click();

    // Go to preview page
    await page.goto(`http://localhost:5173/en/candidate/preview`);
    await page.reload(); //Reload to make sure correct data is loaded to page

    // Expect correct title and button
    await expect(page.getByText('This is a preview of how your')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close preview' })).toBeEnabled();

    // Expect correct data for the candidate 
    await expect(page.getByRole('heading', { name: `${userFirstName} ${userLastName}` })).toBeVisible();
    await expect(page.getByText('Mother Tongues Finnish • Spanish')).toBeVisible();
    await expect(page.getByText(`Gender ${userGender}`)).toBeVisible();
    await expect(page.getByText('Unaffiliated No')).toBeVisible();
    await expect(page.getByText(`Election Manifesto ${userManifesto}`)).toBeVisible();
    await expect(page.getByText('Birthday Mon Jan 01 1990')).toBeVisible();

    // Go to opinions tab
    await page.getByRole('tab', { name: 'Opinions' }).click();

    // Expect correct opinion and comment to show
    await expect(page.getByLabel('Immigration The state should').getByText(`${userFirstName[0]}. ${userLastName}`)).toBeVisible();
    await expect(page.getByLabel('Immigration The state should').getByText('Fully agree')).toBeVisible();
    await expect(page.getByText('Lorem ipsum')).toBeVisible();

    // Expect close button to take to start page
    await page.getByRole('button', { name: 'Close preview' }).click();
    await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/en\/candidate/);
  });

});