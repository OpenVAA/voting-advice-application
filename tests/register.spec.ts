import { test, expect } from "@playwright/test";
import { faker } from "@faker-js/faker";
import path from "path";
import { Route } from "../frontend/src/lib/utils/navigation/route";
import candidateAppTranslationsEn from "../frontend/src/lib/i18n/translations/en/candidateApp.json";
import candidateAppTranslationsFi from "../frontend/src/lib/i18n/translations/fi/candidateApp.json";
import ariaTranslations from "../frontend/src/lib/i18n/translations/en/aria.json";
import questionsTranslations from "../frontend/src/lib/i18n/translations/en/questions.json";
import mockQuestions from "../backend/vaa-strapi/src/functions/mockData/mockQuestions.json";
import commonTranslations from "../frontend/src/lib/i18n/translations/en/common.json";

const strapiPort = process.env.STRAPI_PORT || "1337";
const strapiURL = `http://localhost:${strapiPort}`;
const maildevPort = process.env.MAILDEV_PORT || "1080";
const maildevURL = `http://localhost:${maildevPort}/#/`;
const LOCALE = 'en';

//TODO: These need to be matched to mock data
const userFirstName = faker.person.firstName();
const userLastName = faker.person.lastName();
const userEmail = `${userFirstName}.${userLastName}@example.com`.toLowerCase();
const userPassword = "Password1!";
const userGender = "Male";
const userBirthday = "January 1"
const userManifesto =
  "Lorem ipsum dolor sit amet, consectetur adipisci elit, sed eiusmod tempor incidunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquid ex ea commodi consequat. Quis aute iure reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint obcaecat cupiditat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
const comment = "Lorem ipsum";
// These come from Strapi, not from translation files
const fullyAgree = "Fully agree";
const fullyDisagree = "Fully disagree";

test.describe.configure({ mode: 'serial' });

test("should log into Strapi and import candidates", async ({ page, baseURL }) => {
  await page.goto(`${strapiURL}/admin`);
  await page.getByLabel("Email*").fill("admin@example.com");
  await page.getByLabel("Password*").fill("admin");
  await page.getByRole("button", { name: "Login" }).click();
  
  await expect(page.getByText("Strapi Dashboard")).toBeVisible();
  
  // Navigate to the Parties in Content Manager
  await page.getByRole("link", { name: "Content Manager" }).click();
  await page.getByRole("link", { name: "Parties" }).click();
  const partyRow = page.getByRole("row").nth(1);
  const partyCell = partyRow.getByRole("gridcell").nth(1)
  const partyId = await partyCell.innerText()
  expect(partyId).not.toBeNull();

  // Navigate to the Elections in Content Manager
  await page.getByRole("link", { name: "Elections" }).click();
  const electionRow = page.getByRole("row").nth(1);
  const electionCell = electionRow.getByRole("gridcell").nth(1)
  const electionId = await electionCell.innerText()
  expect(electionId).not.toBeNull();

  // Navigate to the Constituencies in Content Manager
  await page.getByRole("link", { name: "Constituencies" }).click();
  const contituencyRow = page.getByRole("row").nth(1);
  const contituencyCell = contituencyRow.getByRole("gridcell").nth(1)
  const contituencyId = await contituencyCell.innerText()
  expect(contituencyId).not.toBeNull();
  
  page.on("filechooser", async (fileChooser) => {
    await fileChooser.setFiles(path.join(__dirname, "candidate-import.csv"));
  });
  
  // Navigate to the Candidates in Content Manager
  await page.getByRole("link", { name: "Candidates" }).click();
  await page.getByRole("button", { name: "Import" }).click();
  await page.locator("label").click();
  
  // Enter the CSV data
  await page.locator(".view-line").first().click();
  await page.getByLabel("Editor content;Press Alt+F1").fill(
    `firstName,lastName,party,email,published
    ${userFirstName},${userLastName},${partyId},${userEmail},true
    Bob,Bobsson,${partyId},bob@example.com,false
    Carol,Carolsson,${partyId},carol@example.com,false`,
  );
  await page
  .getByLabel("Import", { exact: true })
  .getByRole("button", { name: "Import" })
  .click();
  
  // Check that the import was successful
  await expect(
    page.getByText("Your data has been imported").first(),
  ).toBeVisible();
  await page
  .getByRole("button", { name: "Close", exact: true })
  .first()
  .click();
  
  // Reload the page to see the imported candidates (just in case)
  await page.reload();
  
  // Navigate to the Nominations in Content Manager
  await page.getByRole("link", { name: "Nominations" }).click();
  await page.getByRole("button", { name: "Import" }).click();
  await page.locator("label").click();
  
  // Enter the CSV data
  await page.locator(".view-line").first().click();
  await page.getByLabel("Editor content;Press Alt+F1").fill(
    `election,constituency,email,party,electionSymbol,published
    ${electionId},${contituencyId},${userEmail},${partyId},0,true`
  );
  await page
  .getByLabel("Import", { exact: true })
  .getByRole("button", { name: "Import" })
  .click();
  
  // Check that the import was successful
  await expect(
    page.getByText("Your data has been imported").first(),
  ).toBeVisible();
  await page
  .getByRole("button", { name: "Close", exact: true })
  .first()
  .click();

  // Navigate to the imported candidate
  await page.getByRole("link", { name: "Candidates" }).click();
  await page.getByLabel('Search', { exact: true }).click();
  await page.getByPlaceholder('Search').fill(userFirstName);
  await page.keyboard.press('Enter');
  await page.getByText(userEmail).first().click();

  // Send registration email
  await page.getByRole("button", { name: "Send registration email" }).click();
  await page.getByLabel("Email subject").fill("Subject");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await page.getByText("Registration email was sent").click();

  // Wait for 5 seconds to allow the email to be sent
  await page.waitForTimeout(5000);

  // Navigate to maildev and open registration link
  await page.goto(maildevURL);
  await page
    .getByRole("link", { name: `Subject To: ${userEmail}` })
    .first()
    .click();
  const link = await page
    .frameLocator("iframe >> nth=0")
    .getByRole("link", { name: `${baseURL}/${LOCALE}` })
    .getAttribute("href");
  if (!link) throw new Error("Link not found");
  await page.goto(link);

  // Complete the registration process
  // Check that the candidate name is correct
  await expect(
    page.getByRole("heading", { name: candidateAppTranslationsEn.setPassword.greeting.replace('{username}', userFirstName), exact: true }),
  ).toBeVisible({ timeout: 20000 });
  await page.locator("#password").fill(userPassword);
  await page.locator("#passwordConfirmation").fill("Password1!a");
  // Test password mismatch
  await page.getByRole("button", { name: candidateAppTranslationsEn.setPassword.setPassword, exact: true }).click();
  await expect(page.getByText(candidateAppTranslationsEn.setPassword.passwordsDontMatch, {exact: true})).toBeVisible();
  // Correct the password
  await page.locator("#passwordConfirmation").fill(userPassword);
  await page.getByRole("button", { name: candidateAppTranslationsEn.setPassword.setPassword, exact: true }).click();

  // Check that the password was set by logging in
  await expect(page.getByText(candidateAppTranslationsEn.setPassword.passwordSetSuccesfully, {exact: true})).toBeVisible();
  expect(await page.getByPlaceholder(candidateAppTranslationsEn.common.emailPlaceholder, {exact: true}).inputValue()).toBe(
    userEmail,
  );
  await page.getByPlaceholder(candidateAppTranslationsEn.common.passwordPlaceholder, {exact: true}).fill(userPassword);
  await page.getByRole("button", { name: candidateAppTranslationsEn.common.logIn, exact: true }).click();

  // Check that the login was successful
  await expect(page.getByText(candidateAppTranslationsEn.homePage.greeting.replace('{username}', userFirstName), {exact: true})).toBeVisible();
});

test.describe("when logged in with imported user", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    // Log the default user out
    await page.goto(`${baseURL}/${LOCALE}/${Route.CandAppHome}`);
    await page.getByLabel(candidateAppTranslationsEn.common.logOut, {exact: true}).click();

    // Log in with the imported user
    await page.getByPlaceholder(candidateAppTranslationsEn.common.emailPlaceholder, {exact: true}).fill(userEmail);
    await page.getByPlaceholder(candidateAppTranslationsEn.common.passwordPlaceholder, {exact: true}).fill(userPassword);
    await page.getByText(candidateAppTranslationsEn.common.logIn, {exact: true}).click();
  })

  test("should succesfully set basic info", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/${LOCALE}/${Route.CandAppProfile}`);
    await expect(page).toHaveURL(`${baseURL}/${LOCALE}/${Route.CandAppProfile}`);

    // Upload a profile picture
    page.on("filechooser", async (fileChooser) => {
      await fileChooser.setFiles(path.join(__dirname, "test_image_black.png"));
    });
    await page.getByText(candidateAppTranslationsEn.basicInfo.tapToAddPhoto, {exact: true}).click();
    await page.getByLabel(candidateAppTranslationsEn.basicInfo.fields.gender, {exact: true}).selectOption(userGender);
    await page.getByLabel(candidateAppTranslationsEn.basicInfo.fields.birthday, {exact: true}).fill("1990-01-01");

    const motherTongueField = page.getByLabel(candidateAppTranslationsEn.basicInfo.fields.motherTongue);

    const saveButton = page.locator("#submitButton");

    // Button should not be clickable with 0 languages picked and manifesto not set
    await expect(saveButton).toBeDisabled();

    // Fill manifesto
    await page.getByLabel(candidateAppTranslationsEn.basicInfo.electionManifesto, {exact: true}).fill(userManifesto);

    // Button should still be disabled because no language is set
    await expect(saveButton).toBeDisabled();

    await motherTongueField.selectOption(candidateAppTranslationsEn.languages.Finnish);

    // Button should now be visible with a language selected
    await expect(saveButton).toBeEnabled();

    // Also test the other languages
    const otherTonugesFieldSelectFirst = page.getByLabel(candidateAppTranslationsEn.basicInfo.selectFirst);
    await otherTonugesFieldSelectFirst.selectOption(candidateAppTranslationsEn.languages.Spanish);
    const otherTonguesFieldSelectAnother= page.getByLabel(candidateAppTranslationsEn.basicInfo.addAnother);
    await otherTonguesFieldSelectAnother.selectOption(candidateAppTranslationsEn.languages.English);

    await expect(
      page.locator("form div").filter({ hasText: candidateAppTranslationsEn.languages.Finnish }).nth(3),
    ).toBeVisible();
    await expect(
      page.locator("form div").filter({ hasText: candidateAppTranslationsEn.languages.English }).nth(3),
    ).toBeVisible();
    await expect(
      page.locator("form div").filter({ hasText: candidateAppTranslationsEn.languages.Spanish }).nth(3),
    ).toBeVisible();
    await page.getByLabel(candidateAppTranslationsEn.languages.English, {exact: true}).click();

    // Now submit the form
    await expect(saveButton).toBeVisible();
    await saveButton.click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE}/${Route.CandAppQuestions}`);
  });

  test("should succesfully answer opinion questions", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/${LOCALE}/${Route.CandAppQuestions}`);
    await page.reload(); //Reload to make sure correct data is loaded to page

    // Expect correct texts on questions page
    await expect(page.getByText(candidateAppTranslationsEn.questions.start, {exact: true})).toBeVisible();
    await page.getByRole("button", { name: candidateAppTranslationsEn.questions.continue, exact: true }).click();

    // Expect Read More expander to exist
    await expect(page.getByText(questionsTranslations.readMore, {exact: true})).toBeVisible();

    // Answer first question and give comments
    await page.getByLabel(fullyAgree).click();
    await page.getByLabel(candidateAppTranslationsEn.questions.commentOnThisIssue, {exact: true}).fill(comment);
    await page.getByRole("button", { name: candidateAppTranslationsEn.textarea.show, exact: true }).click();
    await page.getByLabel(candidateAppTranslationsFi.languages.Finnish, {exact: true}).fill("Lorem ipsum in Finnish");
    await page.getByRole("button", { name: candidateAppTranslationsEn.questions.saveAndContinue, exact: true }).click();
    await page.waitForTimeout(500); //Wait so that UI has time to change (otherwise doesn't work all the time)

    // Answer to all remaining questions
    while (await page.getByText(fullyDisagree).isVisible()) {
      await page.getByLabel(fullyAgree).click();
      await page.waitForTimeout(500); //Wait so that UI has time to change (otherwise doesn't work all the time)
      await page.getByRole("button", { name: candidateAppTranslationsEn.questions.saveAndContinue, exact: true }).click();
      await page.waitForTimeout(500); //Wait so that UI has time to change (otherwise doesn't work all the time)
    }

    // Expect to be at "You're Ready to Roll" page
    await expect(page).toHaveURL(`${baseURL}/${LOCALE}/${Route.CandAppHome}`);
    await expect(page.getByRole("heading", { name: candidateAppTranslationsEn.homePage.ready, exact: true })).toBeVisible();

    // Expect buttons to be visible and enabled
    await expect( page.getByRole("button", { name: candidateAppTranslationsEn.homePage.basicInfoButtonEdit, exact: true }) ).toBeEnabled();
    await expect(page.getByRole("button", { name: candidateAppTranslationsEn.homePage.questionsButtonEdit, exact: true })).toBeEnabled();
    await expect(page.getByRole("button", { name: candidateAppTranslationsEn.homePage.previewButton, exact: true }).first()).toBeEnabled();
    await expect(
      page
        .getByLabel(ariaTranslations.primaryActionsLabel, {exact: true})
        .getByRole("button", { name: candidateAppTranslationsEn.homePage.previewButton, exact: true }),
    ).toBeEnabled();
    await expect(
      page
        .getByLabel(ariaTranslations.primaryActionsLabel, {exact: true})
        .getByRole("button", { name: candidateAppTranslationsEn.common.logOut, exact: true }),
    ).toBeEnabled();

    // Check that buttons take to correct pages
    await page.getByRole("button", { name: candidateAppTranslationsEn.homePage.basicInfoButtonEdit, exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE}/${Route.CandAppProfile}`);
    const candidateUrl = `${baseURL}/${LOCALE}/${Route.CandAppHome}`;
    await page.goto(candidateUrl);

    await page.getByRole("button", { name: candidateAppTranslationsEn.homePage.questionsButtonEdit, exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE}/${Route.CandAppQuestions}`);
    await page.goto(candidateUrl);

    await page.getByRole("button", { name: candidateAppTranslationsEn.homePage.previewButton, exact: true }).first().click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE}/${Route.CandAppPreview}`);
    await page.goto(candidateUrl);

    await page
      .getByLabel(ariaTranslations.primaryActionsLabel, {exact: true})
      .getByRole("button", { name: candidateAppTranslationsEn.homePage.previewButton, exact: true })
      .click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE}/${Route.CandAppPreview}`);
    await page.goto(candidateUrl);

    await page
      .getByLabel(ariaTranslations.primaryActionsLabel, {exact: true})
      .getByRole("button", { name: candidateAppTranslationsEn.common.logOut, exact: true })
      .click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE}\/${Route.CandAppHome}`);
    await expect(page.getByText(candidateAppTranslationsEn.common.logIn, {exact: true})).toBeVisible();
  });

  test("your opinions page should work correctly", async ({ page, baseURL }) => {
    // Go to questions page
    await page.goto(`${baseURL}/${LOCALE}/${Route.CandAppQuestions}`);
    await page.reload(); //Reload to make sure correct data is loaded to page

    // Expect correct heading and no warning
    await expect( page.getByRole("heading", { name: candidateAppTranslationsEn.questions.title, exact: true }),).toBeVisible();
    await expect(page.getByText(candidateAppTranslationsEn.questions.warning.replace('{numUnansweredQuestions}', '0'))).toBeHidden();
    await expect( page.getByRole("button", { name: candidateAppTranslationsEn.questions.enterMissingAnswer, exact: true })).toBeHidden();

    // Open first category
    await page.getByRole("checkbox").first().click();

    // Expect correct answer and comment text to be shown
    await expect(page.getByText(questionsTranslations.yourAnswer, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(fullyAgree).first()).toBeVisible();
    await expect(page.getByText(comment)).toBeVisible();

    // Go edit answer
    await page
      .getByRole("button", { name: candidateAppTranslationsEn.questions.editYourAnswer, exact: true })
      .first()
      .click();

    // Expect correct data for first question
    await expect(page.getByRole("heading", { name: mockQuestions[0].en, exact: true })).toBeVisible();
    await expect(page.getByLabel(fullyAgree)).toBeChecked();

    // Check that button goes back to correct page
    await page.getByRole("button", { name: candidateAppTranslationsEn.questions.saveAndReturn, exact: true}).click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE}/${Route.CandAppQuestions}`);

    // Go back and test cancel button
    await page.getByRole("checkbox").first().click();
    await page
      .getByRole("button", { name: candidateAppTranslationsEn.questions.editYourAnswer, exact: true })
      .first()
      .click();

    // Change opinion and press cancel
    await page.waitForTimeout(500);
    await page.getByLabel(fullyDisagree).click();
    await page.getByRole("button", { name: candidateAppTranslationsEn.questions.cancel, exact: true }).click();

    // Expect button to go to correct page and opinion to be unchanged
    await expect(page).toHaveURL(`${baseURL}/${LOCALE}/${Route.CandAppQuestions}`);
    await page.getByRole("checkbox").first().click();
    await expect(page.getByText(fullyAgree).first()).toBeVisible();

    // Expect return button to go to correct page
    await page.getByRole("button", { name: candidateAppTranslationsEn.questions.return, exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE}/${Route.CandAppHome}`);
  });

  test("preview page should work correctly", async ({ page, baseURL }) => {
    // Go to preview page
    await page.goto(`${baseURL}/${LOCALE}/${Route.CandAppPreview}`);
    await page.reload(); //Reload to make sure correct data is loaded to page

    // Expect correct title and button
    await expect(page.getByText(candidateAppTranslationsEn.preview.tip, {exact: true})).toBeVisible();
    await expect(page.getByRole("button", { name: candidateAppTranslationsEn.preview.close, exact: true })).toBeEnabled();

    // Expect correct data for the candidate
    await expect(
      page.getByRole("heading", { name: `${userFirstName} ${userLastName}` }),
    ).toBeVisible();

    await expect(
      page.getByText(candidateAppTranslationsEn.languages.Finnish, {
        exact: true,
      })
    ).toBeVisible();
    await expect(
      page.getByText(`${candidateAppTranslationsEn.languages.Spanish}`, {exact: true})
    ).toBeVisible();


    await expect(
      page.getByText(userGender, {exact: true})
    ).toBeVisible();
    await expect(page.getByText(`${commonTranslations.unaffiliated} ${commonTranslations.answerNo}`, {exact: true})).toBeVisible();
    await expect(
      page.getByText(`${candidateAppTranslationsEn.basicInfo.electionManifesto} ${userManifesto}`, {exact: true})
    ).toBeVisible();
    await expect(page.getByText(userBirthday, {exact: true})).toBeVisible();

    // Expect close button to take to start page
    await page.getByRole("button", { name: candidateAppTranslationsEn.preview.close, exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/${LOCALE}/${Route.CandAppHome}`);
  });
});
