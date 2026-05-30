# Candidate App tests refactoring

## General

Apply the same conventions as used in the voter journey and the permutations:

- strict tests, no fallbacks or soft assertions
- use fixtures for all common view tasks
- [id] desc format for text contents
- serial only to minimise db leakage issues
- minimal data for permutations

Rewrite the tests from scratch using these principles. You can use the old tests as guidance but be sceptical about the issues and solutions flagged in them and their comments because some have turned out to be invalid. They have a lot of questionable back-and-forth.

# New tests in voter mega journey

## Extend basev1 data

- Add hero content emoji to 1st base question
- Add hero content image to 2nd base question
- Add hero content image to base question category
- Add (fanning out translations) info content to 1st question

## Test for these at the start of the journey

> Extend fixtures as needed

- Expect correct hero content to be visible for the questions can categories
- Expect the Info button to be visible for the 1st question
  - Click and expect the info content to be visible
- Expect no Info button for the 2nd question

# New permutations

Add these settings-based permutations, but only take the gist of from the existing test and rewrite to be concise and STRICT.

### 7.1.3 [should show maintenance page when underMaintenance is true](tests/tests/specs/candidate/candidate-settings.spec.ts:200)

- expect unavailable: /, /candidate, /elections

NEW: should show maintenance page when voterApp is disabled

- expect unavailable: /, /elections
- expect available: /candidate

### 7.1.2 [should show maintenance page when candidateApp is disabled](tests/tests/specs/candidate/candidate-settings.spec.ts:166)

- expect unavailable: /candidate
- expect available: /, /elections

### 7.1.4 [should display notification popup when enabled](tests/tests/specs/candidate/candidate-settings.spec.ts:242)

- add different notifications for candidate and voter apps
- expect each but not the other on /candidate and / routes

# Candidate mega journey

## New fixtures/utils to add to the catalogue

- emailBucket
  - expectEmail(subject)
  - getEmail(subject | nth)
  - getLinksInEmail(subject | nth)
- candidateLoginPage
  - enterEmail
  - enterPassword
  - submit
  - login(email, password)
- candidateTermsOfUsePage
  - acceptAndAdvance
- candidateHomePage
- candidateForgotPasswordPage
  - fillEmailAndAdvance
- candidatePasswordSetter
- candidateProfilePage
  - methods for getting questions, static info (name, nominations), submitting and checking the submit message
- candidateQuestionsOverviewPage
- candidateQuestionPage
- candidatePreviewPage (entityDetails)
- candidateLogoutButton (in header)

## Data

Same baseV1 data as in the voter journey.

Extend that data by adding an unregistered candidate that we'll use for registration:

- has name and email
- has party AA
- has nomination in the Reg election and the same North const we use in the voter journey and with an election symbol "999"

Make info question external_id: 'test-qu-info-text' required

Add info question to filtered out, all of the test type:

- one for only the municipal election
- one for only the north constituency (in which the candidate stands and the voter selects)
- one for only the south constituency
- also edit the voter mega journey candidate details info test to check that only the 2nd of these is visible

## Test steps

> Save passwords and info question answers in consts
> Answer all opinions with first value

Should show public static pages correctly

- help
- privacy

Should send registration email and extract link

- use supabase admin client
- wait for email and get link

Should complete registration via email link

- set password
- expect terms of use
  - accept
- expect candidateHomePage

Should logout

- candidateLogoutButton
  - expect dialog
  - logout
- expect candidateLoginPage
- try to navigate to /candidate/profile
  - expect candidateLoginPage

Should complete forgot-password and reset flow via Inbucket email

- candidateForgotPasswordPage
  - fillEmailAndAdvance
  - expect success message
- wait for email and get link
- follow link
  - set new password
  - expect correct view

Should login with password

- candidateLoginPage
  - expect submit disabled when not email or password
  - enterEmail
  - enterPassword USE old password
  - submit
  - expect error message
  - enterPassword USE new password
  - submit
  - expect candidateHomePage NOT ToU

Should return to logged-in home from static pages

- go to help
  - click return button
  - expect candidateHomePage

Should show correct message on candidateHomePage

- candidateHomePage
  - expect to see three tasks with filling out the profile active
  - expect to see the other not enabled

Should show correct info questions

- candidateProfilePage
  - expect to see the candidate name and nomination (and not editable)
  - expect to see all of the info questions except the filtered out ones (municipal, south const)
  - expect to see required badge on the required text q

Should fill info profile and advance correctly

- candidateProfilePage
  - fill portrait and test that it errors on wrong format or size
  - fill all other questions except:
    - the required one
    - the first one
  - submit
  - expect to go to candidateHomePage
    - expect to see opinions step not enabled
  - go to candidateProfilePage
    - expect to see filled answers
    - fill the required question
    - submit
    - expect to go to candidateQuestionsOverviewPage

Should show sequence of questions on first go

- candidateQuestionsOverviewPage
  - expect intro message
  - click continue
- expect candidateQuestionPage with first opinion question

Should answer first opinion question

- expect candidateQuestionPage with first opinion question
  - expect hero emoji/image accordingly
  - expect continue to be disabled
  - select choice
  - expect continue to be enabled
  - enter info
  - continue

Should show correct questions overview

- go to candidateQuestionsOverviewPage
  - expect prompt for continuing answering
  - expect answer for 1st question to be correct
  - expect info for 1st q
  - expect 2nd q to not be answered and have answer button
  - expect to see category expanders
  - expect 1st cat expander to collapse on click and expand on next click

Should edit answered question

- candidateQuestionsOverviewPage
  - click on edit 1st question
  - expect candidateQuestionPage with 1st question answered and info
  - change answer
  - change info
  - continue
- go to candidateQuestionsOverviewPage
  - expect answer and info for 1st question to be correct

Should answer opinion questions correctly

- candidateQuestionsOverviewPage
  - click prompt for continuing answering
  - expect candidateQuestionPage with 2nd question
- move through all questions (applicable to regional/north)
  - strictly expect each question
  - select choice for each
  - after last expect candidateHomePage
    - expect completed message
    - expect preview to be enabled

Should show completed questions overview

- go to candidateQuestionsOverviewPage
  - expect completion message
  - expect no prompt for continuing answering

Should show candidate preview correctly

- go to candidatePreviewPage
  - expect to see all info questions with entered answers
  - expect to see portrait
  - expect to see all opinion questions with entered answers
  - expect not to see "You and X disagree"-type messages for voter answers

Should log out with no confirmation when ready

- logout
  - expect candidateLoginPage
