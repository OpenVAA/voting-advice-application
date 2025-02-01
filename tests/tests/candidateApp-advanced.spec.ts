import { expect, request, test } from '@playwright/test';
import { load } from 'cheerio';
import { simpleParser } from 'mailparser';
import path from 'path';
import { TESTS_DIR } from './utils/testsDir';
import { TRANSLATIONS as T } from './utils/translations';
import mockCandidateForTesting from '../../backend/vaa-strapi/src/functions/mockData/mockCandidateForTesting.json' assert { type: 'json' };
import mockInfoQuestions from '../../backend/vaa-strapi/src/functions/mockData/mockInfoQuestions.json' assert { type: 'json' };
import mockQuestions from '../../backend/vaa-strapi/src/functions/mockData/mockQuestions.json' assert { type: 'json' };
import mockQuestionTypes from '../../backend/vaa-strapi/src/functions/mockData/mockQuestionTypes.json' assert { type: 'json' };
import { ROUTE } from '../../frontend/src/lib/utils/legacy-navigation/route';

type Email = {
  Id: string;
  Region: string;
  Source: string;
  RawData: string;
  Timestamp: string;
};

type Mailbox = {
  messages: Array<Email>;
};

const strapiPort = process.env.STRAPI_PORT || '1337';
const strapiURL = `http://localhost:${strapiPort}`;
const awsSesInboxURL = `${process.env.LOCALSTACK_ENDPOINT}/_aws/ses`;
const LOCALE = 'en';

// TODO: When importing works, use faker instead of the imported data
// const userFirstName = faker.person.firstName();
// const userLastName = faker.person.lastName();
// const userEmail = `${userFirstName}.${userLastName}@example.com`.toLowerCase();
// const userPassword = 'Password1!';
const userFirstName = mockCandidateForTesting.firstName;
const userLastName = mockCandidateForTesting.lastName;
const userEmail = mockCandidateForTesting.email;
const userPassword = 'Password1!';

const userGender = mockQuestionTypes.find(({ name }) => name === 'Gender')?.settings.values?.[0].label.en;
if (!userGender) throw new Error('Gender not found in mockQuestionTypes');

const userBirthday = 'January 1';
const userBirthdayInput = '1990-01-01'; // Must match the date above
const userManifesto =
  'Lorem ipsum dolor sit amet, consectetur adipisci elit, sed eiusmod tempor incidunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquid ex ea commodi consequat. Quis aute iure reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint obcaecat cupiditat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
const comment = 'Lorem ipsum';

// These come from Strapi mock data, not from translation files
const likertValues = mockQuestionTypes.find(({ name }) => name === 'Likert-5')?.settings.values;
if (!likertValues) throw new Error('Likert-5 not found in mockQuestionTypes');
const fullyDisagree = likertValues[0].label.en;
const fullyAgree = likertValues[4].label.en;
if (!fullyDisagree || !fullyAgree)
  throw new Error('Likert-5: fullyDisagree or fullyAgree labels not found in mockQuestionTypes');

const genderLabel = mockInfoQuestions.find(({ type }) => type === 'Gender')?.text.en;
if (!genderLabel) throw new Error('Question of type Gender not found in mockInfoQuestions');

const birthdayLabel = mockInfoQuestions.find(({ type }) => type === 'Date')?.text.en;
if (!birthdayLabel) throw new Error('Question of type Date not found in mockInfoQuestions');

const singleLangLabel = mockInfoQuestions.find(({ type }) => type === 'Language')?.text.en;
if (!singleLangLabel) throw new Error('Question of type Language not found in mockInfoQuestions');
const singleLangValues = mockQuestionTypes.find(({ name }) => name === 'Language')?.settings.values;
if (!singleLangValues) throw new Error('Language not found in mockQuestionTypes');
const selectedSingleLang = singleLangValues[0].label.en;

const multiLangLabel = mockInfoQuestions.find(({ type }) => type === 'MultiLanguage')?.text.en;
if (!multiLangLabel) throw new Error('Question of type MultiLanguage not found in mockInfoQuestions');
const multiLangValues = mockQuestionTypes.find(({ name }) => name === 'MultiLanguage')?.settings.values;
if (!multiLangValues) throw new Error('MultiLanguage not found in mockQuestionTypes');
const selectedMultiLang = [multiLangValues[1].label.en, multiLangValues[2].label.en];

const textQuestionLabel = mockInfoQuestions.find(({ type }) => type === 'Text')?.text.en;
if (!textQuestionLabel) throw new Error('Question of type Text not found in mockInfoQuestions');

test.describe.configure({ mode: 'serial' });

test('should log into Strapi and import candidates', async ({ page }) => {
  await page.goto(`${strapiURL}/admin`);
  await page.getByLabel('Email*').fill('admin@example.com');
  await page.getByLabel('Password*').fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByText('Strapi Dashboard')).toBeVisible();

  // The import functionality is currently unavailable
  // TODO: When importing works re-enable

  // Navigate to the Parties in Content Manager
  // await page.getByRole('link', { name: 'Content Manager' }).click();
  // await page.getByRole('link', { name: 'Parties' }).click();
  // const partyRow = page.getByRole('row').nth(1);
  // const partyCell = partyRow.getByRole('gridcell').nth(1);
  // const partyId = await partyCell.innerText();
  // expect(partyId).not.toBeNull();

  // // Navigate to the Elections in Content Manager
  // await page.getByRole('link', { name: 'Elections' }).click();
  // const electionRow = page.getByRole('row').nth(1);
  // const electionCell = electionRow.getByRole('gridcell').nth(1);
  // const electionId = await electionCell.innerText();
  // expect(electionId).not.toBeNull();

  // // Navigate to the Constituencies in Content Manager
  // await page.getByRole('link', { name: 'Constituencies' }).click();
  // const contituencyRow = page.getByRole('row').nth(1);
  // const contituencyCell = contituencyRow.getByRole('gridcell').nth(1);
  // const contituencyId = await contituencyCell.innerText();
  // expect(contituencyId).not.toBeNull();

  // page.on('filechooser', async (fileChooser) => {
  //   await fileChooser.setFiles(path.join(TESTS_DIR, 'candidate-import.csv'));
  // });

  // // Navigate to the Candidates in Content Manager
  // await page.getByRole('link', { name: 'Candidates' }).click();
  // await page.getByRole('button', { name: 'Import' }).click();
  // await page.locator('label').click();

  // // Enter the CSV data
  // await page.locator('.view-line').first().click();
  // await page.getByLabel('Editor content;Press Alt+F1').fill(
  //   `firstName,lastName,party,email,published
  //   ${userFirstName},${userLastName},${partyId},${userEmail},true
  //   Bob,Bobsson,${partyId},bob@example.com,false
  //   Carol,Carolsson,${partyId},carol@example.com,false`
  // );
  // await page.getByLabel('Import', { exact: true }).getByRole('button', { name: 'Import' }).click();

  // // Check that the import was successful
  // await expect(page.getByText('Your data has been imported').first()).toBeVisible();
  // await page.getByRole('button', { name: 'Close', exact: true }).first().click();

  // // Reload the page to see the imported candidates (just in case)
  // await page.reload();

  // // Navigate to the Nominations in Content Manager
  // await page.getByRole('link', { name: 'Nominations' }).click();
  // await page.getByRole('button', { name: 'Import' }).click();
  // await page.locator('label').click();

  // // Enter the CSV data
  // await page.locator('.view-line').first().click();
  // await page.getByLabel('Editor content;Press Alt+F1').fill(
  //   `election,constituency,email,party,electionSymbol,published
  //   ${electionId},${contituencyId},${userEmail},${partyId},0,true`
  // );
  // await page.getByLabel('Import', { exact: true }).getByRole('button', { name: 'Import' }).click();

  // // Check that the import was successful
  // await expect(page.getByText('Your data has been imported').first()).toBeVisible();
  // await page.getByRole('button', { name: 'Close', exact: true }).first().click();

  // Navigate to the imported candidate
  // await page.getByRole('link', { name: 'Candidates' }).click();
  // await page.getByLabel('Search', { exact: true }).click();
  // await page.getByPlaceholder('Search').fill(userFirstName);
  // await page.keyboard.press('Enter');
  // await page.getByText(userEmail).first().click();

  // Navigate to any candidate
  await page.getByRole('link', { name: 'Content Manager' }).click();
  await page.getByRole('link', { name: 'Candidates' }).click();
  await page.getByLabel('Search', { exact: true }).click();
  await page.getByPlaceholder('Search').fill(userFirstName);
  await page.keyboard.press('Enter');
  await page.getByText(userEmail).first().click();

  // Send registration email
  await page.getByRole('button', { name: 'Send registration email' }).click();
  await page.getByLabel('Email subject').fill('Subject');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await page.getByText('Registration email was sent').click();

  // Wait for 5 seconds to allow the email to be sent
  await page.waitForTimeout(5000);

  const req = await request.newContext();

  // Fetch emails from the local AWS SES mailbox
  const response = await req.fetch(awsSesInboxURL);
  const emails = await response.json().then((parsed: Mailbox) => parsed.messages);

  // Get HTML from the latest email
  const latestEmailData = emails.at(-1)?.RawData;
  const htmlContent = latestEmailData && (await simpleParser(latestEmailData)).textAsHtml;

  // Extract registration link from the HTML
  let registrationLink: string | undefined;

  if (htmlContent) {
    const $ = load(htmlContent);
    registrationLink = $($('a')[0]).attr('href');
  }

  if (!registrationLink) throw new Error('Link not found');

  // Logout from the previous session
  await page.context().clearCookies();

  await page.goto(registrationLink);

  // Complete the registration process
  // Check that the candidate name is correct
  await expect(
    page.getByRole('heading', {
      name: T.en['candidateApp.common.greeting'].replace('{username}', userFirstName),
      exact: true
    })
  ).toBeVisible({ timeout: 20000 });
  await page.locator('#password').fill(userPassword);
  await page.locator('#passwordConfirmation').fill(userPassword + 'FOO');
  // Test password mismatch
  await page.getByRole('button', { name: T.en['candidateApp.setPassword.setPassword'], exact: true }).click();
  await expect(page.getByText(T.en['candidateApp.setPassword.passwordsDontMatch'], { exact: true })).toBeVisible();
  // Correct the password
  await page.locator('#passwordConfirmation').fill(userPassword);
  await page.getByRole('button', { name: T.en['candidateApp.setPassword.setPassword'], exact: true }).click();

  // Check that the password was set by logging in
  await expect(page.getByText(T.en['candidateApp.setPassword.passwordSetSuccesfully'], { exact: true })).toBeVisible();
  expect(await page.getByPlaceholder(T.en['candidateApp.common.emailPlaceholder'], { exact: true }).inputValue()).toBe(
    userEmail
  );
  await page.getByPlaceholder(T.en['components.passwordInput.placeholder'], { exact: true }).fill(userPassword);
  await page.getByRole('button', { name: T.en['common.login'], exact: true }).click();

  // Check that the login was successful
  await expect(
    page.getByText(T.en['candidateApp.common.greeting'].replace('{username}', userFirstName), {
      exact: true
    })
  ).toBeVisible();
});

test.describe('when logged in with imported user', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    // Log the default user out
    await page.goto(`${baseURL}/${LOCALE}/${ROUTE.CandAppHome}`);
    await page.getByLabel(T.en['common.logout'], { exact: true }).click();

    // Log in with the imported user
    await page.getByPlaceholder(T.en['candidateApp.common.emailPlaceholder'], { exact: true }).fill(userEmail);
    await page.getByPlaceholder(T.en['components.passwordInput.placeholder'], { exact: true }).fill(userPassword);
    await page.getByText(T.en['common.login'], { exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE}/${ROUTE.CandAppHome}`);
  });

  test('should succesfully set basic info', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/${LOCALE}/${ROUTE.CandAppProfile}`);
    await expect(page).toHaveURL(`${baseURL}/${LOCALE}/${ROUTE.CandAppProfile}`);

    // Upload a profile picture
    page.on('filechooser', async (fileChooser) => {
      await fileChooser.setFiles(path.join(TESTS_DIR, 'test_image_black.png'));
    });

    await page.getByText(T.en['components.photoInput.tapToAddPhoto'], { exact: true }).click();
    await page.getByLabel(genderLabel, { exact: true }).selectOption(userGender);
    await page.getByLabel(birthdayLabel, { exact: true }).fill(userBirthdayInput);
    const singleLangInput = page.getByLabel(singleLangLabel, { exact: true });
    await expect(singleLangInput).toBeVisible();
    const multiLangInput = page.getByText(multiLangLabel, { exact: true }).locator('..').locator('select');
    await expect(multiLangInput).toBeVisible();
    const saveButton = page.locator('#submitButton');

    // Button should not be clickable with 0 languages picked and manifesto not set
    // TODO: Set this dynamically based on the number of required mockInfoQuestions
    await expect(saveButton).toBeDisabled();

    // Fill manifesto
    await page.getByLabel(textQuestionLabel, { exact: true }).fill(userManifesto);

    // Button should still be disabled because no language is set
    await expect(saveButton).toBeDisabled();

    await singleLangInput.selectOption(selectedSingleLang);

    // Button should now be visible with a language selected
    await expect(saveButton).toBeEnabled();

    // Also test the other languages
    await multiLangInput.selectOption(selectedMultiLang[0]);
    await multiLangInput.selectOption(selectedMultiLang[1]);

    await expect(page.locator('form div').filter({ hasText: selectedSingleLang }).nth(3)).toBeVisible();
    await expect(page.locator('form div').filter({ hasText: selectedMultiLang[0] }).nth(3)).toBeVisible();
    await expect(page.locator('form div').filter({ hasText: selectedMultiLang[1] }).nth(3)).toBeVisible();
    await page.getByLabel(selectedMultiLang[1], { exact: true }).click();

    // Now submit the form
    await expect(saveButton).toBeVisible();
    await saveButton.click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE}/${ROUTE.CandAppQuestions}`);
  });

  test('should succesfully answer opinion questions', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/${LOCALE}/${ROUTE.CandAppQuestions}`);
    await page.reload(); // Reload to make sure correct data is loaded to page

    // Expect correct texts on questions page
    await expect(page.getByText(T.en['candidateApp.questions.start'], { exact: true })).toBeVisible();
    await page.getByRole('button', { name: T.en['common.continue'], exact: true }).click();

    // Expect Read More expander to exist
    await expect(page.getByText(T.en['common.readMore'], { exact: true })).toBeVisible();

    // Answer first question and give comments
    await page.getByLabel(fullyAgree).click();
    await page.getByLabel(T.en['candidateApp.questions.openAnswerPrompt'], { exact: true }).fill(comment);
    await page.getByRole('button', { name: T.en['components.multiLangInput.show'], exact: true }).click();
    await page.getByLabel(T.fi['lang.fi'], { exact: true }).fill('Lorem ipsum in Finnish');
    await page.getByRole('button', { name: T.en['common.saveAndContinue'], exact: true }).click();
    await page.waitForTimeout(500); //Wait so that UI has time to change (otherwise doesn't work all the time)

    // Answer to all remaining questions
    while (await page.getByText(fullyDisagree).isVisible()) {
      await page.getByLabel(fullyAgree).click();
      await page.waitForTimeout(500); //Wait so that UI has time to change (otherwise doesn't work all the time)
      await page.getByRole('button', { name: T.en['common.saveAndContinue'], exact: true }).click();
      await page.waitForTimeout(500); //Wait so that UI has time to change (otherwise doesn't work all the time)
    }

    // Expect to be at "You're Ready to Roll" page
    await expect(page).toHaveURL(`${baseURL}/${LOCALE}/${ROUTE.CandAppHome}`);
    await expect(page.getByRole('heading', { name: T.en['candidateApp.home.ready'], exact: true })).toBeVisible();

    // Expect buttons to be visible and enabled
    await expect(
      page.getByRole('button', { name: T.en['candidateApp.home.basicInfo.edit'], exact: true })
    ).toBeEnabled();
    await expect(
      page.getByRole('button', { name: T.en['candidateApp.home.questions.edit'], exact: true })
    ).toBeEnabled();
    await expect(
      page.getByRole('button', { name: T.en['candidateApp.home.preview'], exact: true }).first()
    ).toBeEnabled();
    await expect(
      page
        .getByLabel(T.en['common.primaryActions'], { exact: true })
        .getByRole('button', { name: T.en['candidateApp.home.preview'], exact: true })
    ).toBeEnabled();
    await expect(
      page
        .getByLabel(T.en['common.primaryActions'], { exact: true })
        .getByRole('button', { name: T.en['common.logout'], exact: true })
    ).toBeEnabled();

    // Check that buttons take to correct pages
    await page.getByRole('button', { name: T.en['candidateApp.home.basicInfo.edit'], exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE}/${ROUTE.CandAppProfile}`);
    const candidateUrl = `${baseURL}/${LOCALE}/${ROUTE.CandAppHome}`;
    await page.goto(candidateUrl);

    await page.getByRole('button', { name: T.en['candidateApp.home.questions.edit'], exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE}/${ROUTE.CandAppQuestions}`);
    await page.goto(candidateUrl);

    await page.getByRole('button', { name: T.en['candidateApp.home.preview'], exact: true }).first().click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE}/${ROUTE.CandAppPreview}`);
    await page.goto(candidateUrl);

    await page
      .getByLabel(T.en['common.primaryActions'], { exact: true })
      .getByRole('button', { name: T.en['candidateApp.home.preview'], exact: true })
      .click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE}/${ROUTE.CandAppPreview}`);
    await page.goto(candidateUrl);

    await page
      .getByLabel(T.en['common.primaryActions'], { exact: true })
      .getByRole('button', { name: T.en['common.logout'], exact: true })
      .click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE}/${ROUTE.CandAppHome}`);
    await expect(page.getByText(T.en['common.login'], { exact: true })).toBeVisible();
  });

  test('your opinions page should work correctly', async ({ page, baseURL }) => {
    // Go to questions page
    await page.goto(`${baseURL}/${LOCALE}/${ROUTE.CandAppQuestions}`);
    await page.reload(); //Reload to make sure correct data is loaded to page

    // Expect correct heading and no warning
    await expect(page.getByRole('heading', { name: T.en['candidateApp.questions.title'], exact: true })).toBeVisible();
    await expect(
      page.getByText(T.en['candidateApp.questions.unansweredWarning'].replace('{numUnansweredQuestions}', '0'))
    ).toBeHidden();
    await expect(
      page.getByRole('button', {
        name: T.en['candidateApp.questions.enterMissingAnswer'],
        exact: true
      })
    ).toBeHidden();

    // Open first category
    await page.getByRole('checkbox').first().click();

    // Expect correct answer and comment text to be shown
    await expect(page.getByText(T.en['questions.answers.yourAnswer'], { exact: true }).first()).toBeVisible();
    await expect(page.getByText(fullyAgree).first()).toBeVisible();
    await expect(page.getByText(comment)).toBeVisible();

    // Go edit answer
    await page.getByRole('button', { name: T.en['candidateApp.questions.editAnswer'], exact: true }).first().click();

    // Expect correct data for first question
    await expect(page.getByRole('heading', { name: mockQuestions[0].en, exact: true })).toBeVisible();
    await expect(page.getByLabel(fullyAgree)).toBeChecked();

    // Check that button goes back to correct page
    await page.getByRole('button', { name: T.en['common.saveAndReturn'], exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE}/${ROUTE.CandAppQuestions}`);

    // Go back and test cancel button
    await page.getByRole('checkbox').first().click();
    await page.getByRole('button', { name: T.en['candidateApp.questions.editAnswer'], exact: true }).first().click();

    // Change opinion and press cancel
    await page.waitForTimeout(500);
    await page.getByLabel(fullyDisagree).click();
    await page.getByRole('button', { name: T.en['common.cancel'], exact: true }).click();

    // Expect button to go to correct page and opinion to be unchanged
    await expect(page).toHaveURL(`${baseURL}/${LOCALE}/${ROUTE.CandAppQuestions}`);
    await page.getByRole('checkbox').first().click();
    await expect(page.getByText(fullyAgree).first()).toBeVisible();

    // Expect return button to go to correct page
    await page.getByRole('button', { name: T.en['common.return'], exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE}/${ROUTE.CandAppHome}`);
  });

  test('preview page should work correctly', async ({ page, baseURL }) => {
    // Go to preview page
    await page.goto(`${baseURL}/${LOCALE}/${ROUTE.CandAppPreview}`);
    await page.reload(); //Reload to make sure correct data is loaded to page

    // Expect correct title and button
    await expect(page.getByText(T.en['candidateApp.preview.tip'], { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: T.en['candidateApp.preview.close'], exact: true })).toBeEnabled();

    // Expect correct data for the candidate
    await expect(page.getByRole('heading', { name: `${userFirstName} ${userLastName}` })).toBeVisible();

    for (const lang of [selectedSingleLang, selectedMultiLang[0]]) {
      await expect(
        page
          .getByText(lang, {
            exact: true
          })
          .first()
      ).toBeVisible();
    }

    await expect(page.getByText(userGender, { exact: true })).toBeVisible();

    // await expect(page.getByText(`${T.en['common.unaffiliated']} ${T.en['common.answer.no']}`, {exact: true})).toBeVisible();

    await expect(page.getByText(userManifesto, { exact: true })).toBeVisible();
    await expect(page.getByText(userBirthday, { exact: true })).toBeVisible();

    // Expect close button to take to start page
    await page.getByRole('button', { name: T.en['candidateApp.preview.close'], exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE}/${ROUTE.CandAppHome}`);
  });
});
