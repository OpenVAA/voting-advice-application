# New and updated tests

## Perm: should show read-only warning when answers are locked

Minimal 1 each dataset
lock answers in settings

Login candidate
Expect to see warning
Go to profile
Expect to see question input to be disabled/locked
Go to opinions
Open 1st question
Expect the choice radio buttons to be disabled

## Edit: candidate journey

Step: url-format rejection surfaces invalidUrl error

On profile page:
Try to enter invalid url in the Link-type question

## Perm: should hide hero in candidate app when hideHero is enabled

Minimal 1 each dataset
The question has a hero emoji

Login
Go to opinions
Open 1st question
Expect hero to be hidden

## Edit: voter journey

### New step: should show feedback form

> Add fixture: feedbackDialog

mainNav

- click(feedback)
  expect feedbackDialog
- expect send button disabled
- enter star rating
- expect send button enabled
- enter text to further comments
- cancel
  mainNav
- click(feedback)
  feedbackDialog
- expect same star rating and comment text
- submit
- expect success message
  mainNav
- click(feedback)
  feedbackDialog
- expect no rating or comment text
- enter comment text
- expect send button enabled
- submit
- expect success message

### New step: all nominations route

go to nominations
expect to see list of all candidate nominations (match count)

## Perm: header.showFeedback

Minimal dataset

- setting header.showFeedback

Go to intro
Expect feedback button in header
Click
Expect feedbackDialog

## Perm: header.showHelp

Minimal dataset

- setting header.showHelp

Go to intro
Expect help button in header
Click
Expect url getRoute.current('Help')

### Perm: entities.showAllNominations = false

go to nominations
expect to Home page

### Perm: entities.hideIfMissingAnswers.candidate

Minimal dataset with 2 candidates and 2 opinion questions
Cand 1 has answered both
Cand 2 has answered only first

Go to results
Expect to see Cand 1 but not Cand 2

### Perm: elections.showElectionTags = false

Minimal dataset with 2 elections, shared cg w 1 co

Go to questions
Expect not to see election tags

### Perm: questions.showCategoryTags = false

Go to questions
Expect not to see question category tag

### Perm: questions.showCategoryTags = false

Go to questions
Expect not to see question category tag

### Perm: question.customData.allowOpen = false

Minimal dataset with
2 opinion questions
Q1 has no customData
Q2 has customData.allowOpen = false
1 candidate
!has info in answers to BOTH questions

Login as candidate
Go to opinions
Go to 1st q

- expect to see info input
  Go to 2nd q
- expect no info input
  Logout

Go to voter results
Open candidate details
Open opinions
Expect to see info for q1 but no info for q2

# Refactor these old tests where necesssary to use the new fixtures, data and strict expectations

### 34.1.1 [Voter Results - Desktop @visual screenshot matches baseline](tests/tests/specs/visual/visual-regression.spec.ts:28)

### 34.1.2 [Voter Results - Mobile @visual screenshot matches baseline](tests/tests/specs/visual/visual-regression.spec.ts:44)

### 34.1.3 [Candidate Preview - Desktop @visual screenshot matches baseline](tests/tests/specs/visual/visual-regression.spec.ts:60)

### 34.1.4 [Candidate Preview - Mobile @visual screenshot matches baseline](tests/tests/specs/visual/visual-regression.spec.ts:82)

### 35.1.1 [voter results page loads within budget](tests/tests/specs/perf/performance-budget.spec.ts:33)

### 36.1.1 [A11Y-04 axe smoke — home](tests/tests/specs/a11y/a11y-smoke.spec.ts:165)

### 36.1.2 [A11Y-04 axe smoke — elections-selector](tests/tests/specs/a11y/a11y-smoke.spec.ts:165)

### 36.1.3 [A11Y-04 axe smoke — constituencies-selector](tests/tests/specs/a11y/a11y-smoke.spec.ts:165)

### 36.1.4 [A11Y-04 axe smoke — questions](tests/tests/specs/a11y/a11y-smoke.spec.ts:194)

### 36.1.5 [A11Y-04 axe smoke — results](tests/tests/specs/a11y/a11y-smoke.spec.ts:194)

### 36.1.6 [A11Y-04 axe smoke — voter-detail-drawer](tests/tests/specs/a11y/a11y-smoke.spec.ts:194)

### 37.1.1 [should create candidate via identity-callback Edge Function (keys configured path)](tests/tests/specs/candidate/candidate-bank-auth.spec.ts:203)

### 37.1.2 [should return structured error from identity-callback when Edge Function keys are not configured](tests/tests/specs/candidate/candidate-bank-auth.spec.ts:239)

### 37.1.3 [should return session with magic link when candidate is created](tests/tests/specs/candidate/candidate-bank-auth.spec.ts:259)

### 37.1.4 [should handle CORS preflight correctly](tests/tests/specs/candidate/candidate-bank-auth.spec.ts:299)

### 37.1.5 [should reject requests without id_token](tests/tests/specs/candidate/candidate-bank-auth.spec.ts:312)

### 37.1.6 [should reject invalid tokens](tests/tests/specs/candidate/candidate-bank-auth.spec.ts:327)
