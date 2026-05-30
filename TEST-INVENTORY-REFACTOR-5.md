# New Permutations

## General

Apply the same conventions as used in the voter journey and the permutations:

- strict tests, no fallbacks or soft assertions
- use fixtures for all common view tasks
- [id] desc format for text contents
- serial only to minimise db leakage issues
- minimal data for permutations

Rewrite the tests from scratch using these principles. You can use the old tests as guidance but be sceptical about the issues and solutions flagged in them and their comments because some have turned out to be invalid. They have a lot of questionable back-and-forth.

## Missing nominations warning

Make minimal dataset like in other perms with
2 elections
shared cg with 1 co
1 org
1 cand
1 nomination in el 1 but none in el 2

select both elections
expect to see nominations warning for 1 election

## Localisation: Negative assertion

Make minimal dataset with
1 el 1 cg 1 co 1 org 1 can 1 nom
2 q cats

- info
  - text q1
  - text q2 with customData.disableMultilingual true
- opinion
  - Likert5 q3
  - Likert5 q4 with customData.disableMultilingual true
    Candidate has ToU accepted and answers to all questions
    One supportedLanguage

expect no language selector in navigation
login as candidate
goto profile page
expect neither q1 or q2 to show translation options
goto opinionQuestions
edit 1st question
expect no show translation options
edit 2nd question
expect no show translation options

## Localisation: Positive assertions

Same dataset as above but with two supported languages

> Add fixture for lang selection
> Add fixture for multilingual text field

expect language selector w the two languages (en, fi) in navigation
switch language to fi
expect ui texts to change
switch back to en
expect ui texts to change
login as candidate
goto profile page
get q1

- should have text "[en-answer-q1]" or so
- expect to show translation options
- open translations
- add text to Finnish "[fi-answer-q1]" or so
- close translations
- expect Finnish to be hidden
  get q2
- expect not to show translation options
  save
  goto opinionQuestions
  edit 1st question
- should have text "[en-answer-q3]" or so
- expect to show translation options
- open translations
- add text to Finnish "[fi-answer-q3]" or so
- close translations
- expect Finnish to be hidden
  edit 2nd question
- expect no show translation options
  logout

go to voter results
open candidate details
expect to see candidate's info answers in english
expect to see candidate's opinion answers in english
switch language to Finnish
expect to see candidate's info answers in finnish for q1
expect to see candidate's opinion answers in finnish for q3
