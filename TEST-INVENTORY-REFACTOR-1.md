# General changes

- We'll deprecate likert only filter
- Remove separate setup files and add a generic setup helper that takes in the template as argument and performs the basic steps
  - teardown
  - seed
  - seed check
  - returns a cleanup function to be run afterAll if necessary
- Create a new base dataset which can be used for more tests
  - Make the answering func robust so that the answer mode is 'min' or 'max' (first or last option, or min/max in numbers)
- Move any repeated setup to beforeEach

## Base dataset

- Elections (EL) + Constituency Groups (CG) + Constituencies (CO)
  - EL-Reg: Regional
    - CG-Reg: Regions -> EL-Reg
      - CO-Reg-N: Region North
      - CO-Reg-S: Region South
  - EL-Mun: Municipal
    - CG-Mun: Municipalities -> EL-Mun -> Fully hierarchical with CG-Reg as parent
      - CO-Mun-NE: Municipality North-East -> parent CO-Reg-N
      - CO-Mun-NW: Municipality North-West -> parent CO-Reg-N
      - CO-Mun-SE: Municipality South-East -> parent CO-Reg-S
      - CO-Mun-SW: Municipality South-West -> parent CO-Reg-S
- Question Categories (QG) + Questions (QU)
  - QG-Info: Info Questions, type: info
    - QU-Info-{Type} for each
      - MultipleChoiceCategorical: 'multipleChoiceCategorical', filterable: true
      - SingleChoiceCategorical: 'singleChoiceCategorical', filterable: false!
      - Text: 'text'
      - Text: 'text', customData.longText: true
      - Text: 'text', settings type: 'link'
      - Number: 'number', filterable: true
      - Boolean: 'boolean', filterable: true
      - Date: 'date',
      - MultipleText: 'multipleText'
  - QG-Opin-Base: Base Opinion Questions, type: opinion
    - QU-Opin-Base-{index}-{Type} for each
      - Likert5
      - Likert4
      - Likert7
      - Categorical
      - Boolean
  - QG-Opin-Base-B: Base Opinion Questions B, type: opinion (used for testing category intros and selection)
    - QU-Opin-Base-B-1 (Likert5)
  - QG-Opin-Base-C: Base Opinion Questions C, type: opinion (used for filtering out)
    - QU-Opin-Base-C-1 (Likert5)
  - QG-Opin-EL-Reg: Opinion Questions for Regional Elections Only, type: opinion, election_ids: EL-Reg
    - QU-Opin-EL-Reg-1 (Likert5)
  - QG-Opin-CO-Mun-SE-SW: Opinion Questions for Municipalities SE and SW Only, type: opinion, constituency_ids: CO-Mun-SE, CO-Mun-SW
    - QU-Opin-CO-Mun-SE-SW-1 (Likert5)
  - QG-Opin-Filt-A: Opinion Questions for Filtered per Question NE, type: opinion
    - QU-Open-Filt-Mun-NE (Likert5), constituency_ids: CO-Mun-NE
  - QG-Opin-Filt-B: Opinion Questions for Filtered per Question SE, type: opinion
    - QU-Open-Filt-Mun-SE (Likert5), constituency_ids: CO-Mun-SE
- Alliances (AL) and Organizations (OR)
  - AL-A: Alliance A
    - OR-AA: Party AA
    - OR-AB: Party AB
  - AL-B: Alliance B
    - OR-BA: Party BA
    - OR-BB: Party BB
  - (none)
    - OR-C: Party C
- Candidates (CA) and Nominations (NO-[constituency exid w/o prefix]-[AL/OR/CA]-[entity exid])
  - EL-Reg
    - CO-Reg-N: Region North (used to test most result permutations)
      - AL-A
        - OR-AA
          - CA-AA-Special
          - CA-AA-Hidden (no ToU accepted)
          * 4 generic candidates
        - OR-AB
          - 1 candidate
      - AL-B
        - OR-BA
          - 2 candidates
        - OR-BB
          - 2 candidates
      - OR-C
        - 2 candidates
      - CA-Independent (no organization nomination)
    - CO-Reg-S: Region South (used to test that the orgs are not always allied)
      - OR-AA
        - 1 candidate
      - OR-AB
        - 1 candidate
      - AL-B
        - OR-BA
          - 1 candidate
        - OR-BB
          - 1 candidate
      - (no OR-C)
  - EL-Mun
    - CG-Mun
      - CO-Mun-NE
        - OR-AA
          - CA-AA-Special (also nominated here)
          * 1 generic candidate
        * 1 candidate for each party
      - CO-Mun-NW
        - CA-Independent (only candidate here)
      - CO-Mun-SE
        - OR-AA -- BB each with 1 candidate
      - CO-Mun-SW
        - OR-AA and BA each with 1 candidate

## Base settings

{
entityDetails: {
contents: {
candidate: ['info', 'opinions'],
organization: ['info', 'children', 'opinions'],
alliance: ['info', 'children']
},
showMissingElectionSymbol: {
candidate: true,
organization: false
},
showMissingAnswers: {
candidate: true,
organization: true
}
},
header: {
showFeedback: true,
showHelp: true
},
headerStyle: {
dark: {
bgColor: 'oklch(var(--b3))',
overImgBgColor: 'transparent'
},
light: {
bgColor: 'oklch(var(--b3))',
overImgBgColor: 'transparent'
},
imgSize: 'cover',
imgPosition: 'center'
},
entities: {
hideIfMissingAnswers: {
candidate: true
},
showAllNominations: true
},
matching: {
minimumAnswers: 5,
organizationMatching: 'impute'
},
questions: {
categoryIntros: {
allowSkip: true,
show: true
},
interactiveInfo: {
enabled: false
},
questionsIntro: {
allowCategorySelection: true,
show: true
},
showCategoryTags: true,
showResultsLink: true
},
results: {
cardContents: {
candidate: ['submatches'],
organization: ['children'],
alliance: ['children']
},
showFeedbackPopup: 180,
showSurveyPopup: 500,
sections: ['candidate', 'organization']
},
elections: {
disallowSelection: false,
showElectionTags: true,
startFromConstituencyGroup: undefined
},
access: {
candidateApp: true,
voterApp: true,
adminApp: true,
underMaintenance: false,
answersLocked: false
},
notifications: {
candidateApp: null,
voterApp: null
},
candidateApp: {
questions: {
hideHero: false,
hideVideo: false
}
}
};

---

# Combined Full Voter Journey

## 9.1 [voter journey — voter-journey.spec.ts](tests/tests/specs/voter/voter-journey.spec.ts)

### 9.1.1 [should load home page and display start button](tests/tests/specs/voter/voter-journey.spec.ts:110)

### 9.9.1 [about page renders correctly](tests/tests/specs/voter/voter-static-pages.spec.ts:32)

NEW/MOVE: should back button and go to home page

### 9.9.2 [info page renders correctly](tests/tests/specs/voter/voter-static-pages.spec.ts:45)

### 9.9.3 [privacy page renders correctly](tests/tests/specs/voter/voter-static-pages.spec.ts:58)

(only now continue)

NEW/MOVE: should show intro page with correct steps (select election, select const, etc.) and continue button

NEW/MOVE: should show election selector
should disable continue button when no election selected
(select both elections)

NEW/MOVE: should show constituency selector with combined hierarchical constituency groups (only show municipalities)
should disable continue button when no constituency selected
(select NE)

### 9.1.3 [should show questions intro page with start button](tests/tests/specs/voter/voter-journey.spec.ts:140)

NEW/MOVE/REPLACE 9.1.3:

- should show category checkboxes
- should not show filtered-out category QG-Opin-CO-Mun-SE-SW checkbox
- should not show category QG-Opin-Filt-B whose all questions are filtered out
- should show total questions count
- should disable continue button when selected questions < settings.minimumAnswers = 5
  (uncheck QG-Opin-Base-C)
  (continue)

NEW/MOVE: should show category intro for QG-Opin-Base with continue button

- should show skip button
  (continue)

NEW/MOVE: should show correctly and answer Likert 5

- for each of these ensure: correct options displayed, skip button enabled, previous button shown
  NEW/MOVE: should show category tag and index of question in category (roughly 1 of 4)
  NEW/MOVE: should show correctly and answer Likert 4

### 9.3.2 [browser-back preserves answer state across navigation](tests/tests/specs/voter/voter-navigation.spec.ts:252)

- Edit this to only do one back()
  NEW/MOVE: should show correctly and answer Likert 7
  NEW/MOVE: should show correctly and answer Categorical
  NEW/MOVE: should show correctly and answer Boolean question
  NEW/MOVE: should show results link enabled when minimum answers reached (bc we have now 5 answers)

NEW/MOVE: should move to next category and show category intro
(expect category intro for QG-Opin-Base-B with continue button)
(continue)

NEW/MOVE: should go back to Boolean question with previous button
NEW/MOVE: should delete answer with delete button
NEW/MOVE: should show results link enabled when minimum answers not reached (bc we have now 4 answers)
NEW/MOVE: should reanswer Boolean question
NEW/MOVE: should reshow results link enabled when minimum answers re-reached

NEW/MOVE: should skip category QG-Opin-Base-B with skip button
(expect never to see QU-Opin-Base-B-1 but see category intro for QG-Opin-EL-Reg)
NEW/MOVE: should not show deselected category QG-Opin-Base-C
(expect never to see QG-Opin-Base-C but see category intro for QG-Opin-EL-Reg)

NEW/MOVE: should show election tag (Regional) for QU-Opin-EL-Reg-1
NEW/MOVE: should skip question with skip button
NEW/MOVE: should not show filtered-out category QG-Opin-CO-Mun-SE-SW or its questions
(expect never to see the cat intro nor QU-Opin-CO-Mun-SE-SW-1)

NEW/MOVE: should not show filtered-out category QG-Opin-CO-Mun-SE-SW or its questions
(expect never to see the cat intro nor QU-Opin-CO-Mun-SE-SW-1)

NEW/MOVE: should show filtered-in question QU-Open-Filt-Mun-NE
(expect cat intro and the questions)
(skip this question too for later use)

NEW/MOVE: should not show category QG-Opin-Filt-B whose all questions are filtered out
(expect to not see the intro or a question)

NEW/MOVE: should show results
NEW/MOVE: should show election selector (both elections)
NEW/MOVE: should select election and see entity type selector (cands and orgs)
(select Reg)

### 9.5.2 [should display entity type tabs for switching between candidates and organizations](tests/tests/specs/voter/voter-results.spec.ts:118)

### 9.5.3 [should switch to organizations/parties section and back](tests/tests/specs/voter/voter-results.spec.ts:131)

NEW/MOVE:

- should show candidates section with result cards
  - (the result cards should have portrait, election symbol, organization, mathc score)
- should show submatches in candidate cards
- should show independent candidate
- should show organizations section with result cards
  (### 9.5.1 [should display candidates section with result cards](tests/tests/specs/voter/voter-results.spec.ts:100))
  - (the result cards should have abbreviation, match, score)
- should show first 3 candidates for organization and should expand to see all (OR-AA has more than 3 cands in Reg)
- should show candidates in organization cards
- should switch election (select Mun)
- should show correct number of entities for all elections (select entity types 1-by-1 and then election back to Reg and check both entity types – all must match counts in data)
  (return to Reg / Candidates)
- should show alliance information for organisations (check all shown next to org name in both cand and org cards, must match data)

### 9.4.5 [should NOT show hidden candidate (no termsOfUseAccepted)](tests/tests/specs/voter/voter-matching.spec.ts:280)

- use the new hidden cand

## 9.4 [matching algorithm verification — voter-matching.spec.ts](tests/tests/specs/voter/voter-matching.spec.ts)

### 9.4.1 [should display candidates in correct match ranking order](tests/tests/specs/voter/voter-matching.spec.ts:214)

### 9.4.2 [should show perfect match candidate as top result](tests/tests/specs/voter/voter-matching.spec.ts:240)

### 9.4.3 [should show worst match candidate as last result](tests/tests/specs/voter/voter-matching.spec.ts:247)

### 9.4.4 [should show partial-answer candidate in results with valid score](tests/tests/specs/voter/voter-matching.spec.ts:265)

## 9.6 [voter entity detail — voter-detail.spec.ts](tests/tests/specs/voter/voter-detail.spec.ts)

### 9.6.1 [should open candidate detail drawer when clicking a result card](tests/tests/specs/voter/voter-detail.spec.ts:40)

### 9.6.2 [should display candidate info and opinions tabs](tests/tests/specs/voter/voter-detail.spec.ts:52)

### 9.6.3 [should display candidate answers correctly in info and opinions tabs](tests/tests/specs/voter/voter-detail.spec.ts:76)

- NEW/MOVE: should show info question and answer correctly for:
  - MultipleChoiceCategorical: 'multipleChoiceCategorical'
  - SingleChoiceCategorical: 'singleChoiceCategorical'
  - Text: 'text'
  - Text: 'text', customData.longText: true
  - Text: 'text', settings type: 'link'
  - Number: 'number',
  - Boolean: 'boolean',
  - Date: 'date',
  - MultipleText: 'multipleText'

### 9.6.5 [case (a) — both answered: voter row and entity row rendered](tests/tests/specs/voter/voter-detail.spec.ts:231)

### 9.6.6 [case (b) — voter answered, entity missing: voter row only](tests/tests/specs/voter/voter-detail.spec.ts:255)

### 9.6.7 [case (c) — voter missing, entity answered: entity row only](tests/tests/specs/voter/voter-detail.spec.ts:276)

### 9.6.8 [case (d) — both missing: "Neither has answered" message rendered](tests/tests/specs/voter/voter-detail.spec.ts:299)

### 9.6.4 [should open party detail drawer with info, candidates, and opinions tabs](tests/tests/specs/voter/voter-detail.spec.ts:125)

- NEW/MOVE: should show correct filters for candidates (all filterable info questions plus organisation)

### 9.5.5 [filter toggle narrows list without effect_update_depth_exceeded (RESULTS-01 + RESULTS-02)](tests/tests/specs/voter/voter-results.spec.ts:173)

### 9.5.6 [filter state resets on plural tab switch (D-14)](tests/tests/specs/voter/voter-results.spec.ts:273)

### 9.5.7 [filter state survives drawer open/close (D-15)](tests/tests/specs/voter/voter-results.spec.ts:331)

### 9.5.10 [Browser Back steps through tab+drawer changes (D-13)](tests/tests/specs/voter/voter-results.spec.ts:439)

### 9.5.14 [SETTINGS-01 wave B — NumberFilter](tests/tests/specs/voter/voter-results.spec.ts:613)

### 9.5.15 [SETTINGS-01 wave B — TextFilter](tests/tests/specs/voter/voter-results.spec.ts:672)

### 9.5.16 [SETTINGS-01 wave B — ChoiceQuestionFilter (categorical)](tests/tests/specs/voter/voter-results.spec.ts:731)

### 9.5.17 [SETTINGS-01 wave B — FilterGroup AND](tests/tests/specs/voter/voter-results.spec.ts:797)

### 9.5.18 [SETTINGS-01 wave B — MISSING_FILTER_VALUE](tests/tests/specs/voter/voter-results.spec.ts:889)

===

# THESE ARE NOT ORGANIZED YET (BUT SOME MAY BE DEPRECATED BY THE ONES ABOVE)

### 9.1.2 [should auto-imply election and constituency](tests/tests/specs/voter/voter-journey.spec.ts:124)

## 9.5 [voter results — voter-results.spec.ts](tests/tests/specs/voter/voter-results.spec.ts)

### 9.5.4 [canonical URL: /results redirects to /results/candidates (RESEARCH A3)](tests/tests/specs/voter/voter-results.spec.ts:158)

### 9.5.8 [deeplink list+drawer URL renders both (RESULTS-03, D-08 shape 3)](tests/tests/specs/voter/voter-results.spec.ts:400)

### 9.5.9 [deeplink edge case: organizations list + candidate drawer (D-08 shape 4)](tests/tests/specs/voter/voter-results.spec.ts:419)

### 9.5.11 [invalid plural matcher returns 404 (D-11)](tests/tests/specs/voter/voter-results.spec.ts:454)

### 9.5.12 [coupling-rule redirect: singular without id → list view (D-11)](tests/tests/specs/voter/voter-results.spec.ts:461)

### 9.5.13 [drawer paints before list on cold deeplink (D-10 source-order + content-visibility)](tests/tests/specs/voter/voter-results.spec.ts:470)

### 9.6.9 [per-category SubMatch grid renders Manhattan + directional metric path categories](tests/tests/specs/voter/voter-detail.spec.ts:364)

### 9.6.10 [directional-metric SubMatch row exists for a candidate who answered the categorical question](tests/tests/specs/voter/voter-detail.spec.ts:407)

## 9.7 [feedback persistence (E2E-03) — voter-feedback-persistence.spec.ts](tests/tests/specs/voter/voter-feedback-persistence.spec.ts)

### ~~9.7.1~~ [feedback text persists across dismiss and resets after send (SKIPPED — Phase 86.3-03 SKIP-FALLBACK: upstream answeredVoterPage fixture race blocks H2/H3 disambiguation; /questions Loading… despite seeded data; v2.11+ deferred)](tests/tests/specs/voter/voter-feedback-persistence.spec.ts:84)

## 9.8 [voter locale switching (E2E-08) — voter-locale-switching.spec.ts](tests/tests/specs/voter/voter-locale-switching.spec.ts)

### 9.8.1 [locale switches via route prefix](tests/tests/specs/voter/voter-locale-switching.spec.ts:54)

### 9.8.2 [locale switches via LanguageSelection widget (when present)](tests/tests/specs/voter/voter-locale-switching.spec.ts:86)

## 9.9 [static pages (VOTE-18) / nominations page (VOTE-19) — voter-static-pages.spec.ts](tests/tests/specs/voter/voter-static-pages.spec.ts)

### 9.9.4 [should render nominations page with entries](tests/tests/specs/voter/voter-static-pages.spec.ts:98)

### 9.9.5 [should redirect to home when showAllNominations is false](tests/tests/specs/voter/voter-static-pages.spec.ts:158)

## 9.10 [setTimeout popup on full page load (LAYOUT-03 regression gate) — voter-popup-hydration.spec.ts](tests/tests/specs/voter/voter-popup-hydration.spec.ts)

### 9.10.1 [popup appears on /results after navigation-from-home (LAYOUT-03 hydration path)](tests/tests/specs/voter/voter-popup-hydration.spec.ts:89)

# 10. Project voter-app-settings

## 10.1 [voter settings & configuration-driven features — voter-settings.spec.ts](tests/tests/specs/voter/voter-settings.spec.ts)

### 10.1.2 [should filter questions to selected categories](tests/tests/specs/voter/voter-settings.spec.ts:277)

### 10.1.3 [should show category intro page before each category](tests/tests/specs/voter/voter-settings.spec.ts:337)

### 10.1.4 [should skip category when skip button clicked](tests/tests/specs/voter/voter-settings.spec.ts:377)

### 10.1.5 [should show question intro page when questionsIntro.show enabled](tests/tests/specs/voter/voter-settings.spec.ts:432)

### 10.1.6 [should enforce minimum answers before results available](tests/tests/specs/voter/voter-settings.spec.ts:481)

### 10.1.7 [should hide results link when showResultsLink is false](tests/tests/specs/voter/voter-settings.spec.ts:549)

# 11. Project voter-app-popups

## 11.1 [voter popups (VOTE-15 / VOTE-16 / disabled) — voter-popups.spec.ts](tests/tests/specs/voter/voter-popups.spec.ts)

### 11.1.1 [should show feedback popup after delay on results page](tests/tests/specs/voter/voter-popups.spec.ts:92)

### 11.1.2 [should remember dismissal after page reload](tests/tests/specs/voter/voter-popups.spec.ts:109)

### 11.1.3 [should show survey popup after delay on results page](tests/tests/specs/voter/voter-popups.spec.ts:176)

### 11.1.4 [should not show any popup when disabled](tests/tests/specs/voter/voter-popups.spec.ts:218)

# 29. Setup data-setup-hidden-required

## 29.1 [tests/tests/setup/variant-hidden-required.setup.ts](tests/tests/setup/variant-hidden-required.setup.ts)

### 29.1.1 [setup: 'import hidden-required dataset'](tests/tests/setup/variant-hidden-required.setup.ts:42)

# 30. Project variant-hidden-required-voter

## 30.1 [SETTINGS-03 — voter-side hidden question filter — voter-visibility-required.spec.ts](tests/tests/specs/voter/voter-visibility-required.spec.ts)

### 30.1.1 [SETTINGS-03 hidden question absent from voter question flow](tests/tests/specs/voter/voter-visibility-required.spec.ts:77)

# 31. Project variant-hidden-required-candidate

## 31.1 [SETTINGS-03 — candidate-side required-info enforcement — candidate-required-info.spec.ts](tests/tests/specs/candidate/candidate-required-info.spec.ts)

### 31.1.1 [SETTINGS-03 unanswered required info question disables profile-dependent CTAs on CandAppHome](tests/tests/specs/candidate/candidate-required-info.spec.ts:99)

# 12. Setup data-setup-multi-election

## 12.1 [tests/tests/setup/variant-multi-election.setup.ts](tests/tests/setup/variant-multi-election.setup.ts)

### 12.1.1 [setup: 'import multi-election dataset'](tests/tests/setup/variant-multi-election.setup.ts:30)

# 13. Project variant-multi-election

## 13.1 [multi-election voter journey / disallowSelection / matrix Ne×1c — multi-election.spec.ts](tests/tests/specs/variants/multi-election.spec.ts)

### 13.1.1 [should show election selection page with 2 elections](tests/tests/specs/variants/multi-election.spec.ts:227)

### 13.1.2 [should display questions and reach results](tests/tests/specs/variants/multi-election.spec.ts:250)

### 13.1.3 [should show election accordion and results after selecting election](tests/tests/specs/variants/multi-election.spec.ts:265)

### 13.1.4 [should display election-specific questions](tests/tests/specs/variants/multi-election.spec.ts:281)

### 13.1.5 [should bypass election selection when disallowSelection is true](tests/tests/specs/variants/multi-election.spec.ts:337)

### 13.1.6 [Ne × 1c — election selector shown; constituency auto-implied (single)](tests/tests/specs/variants/multi-election.spec.ts:397)

# 14. Setup data-setup-results-sections

## 14.1 [tests/tests/setup/variant-multi-election.setup.ts](tests/tests/setup/variant-multi-election.setup.ts) — RE-USED

# 15. Project variant-results-sections

## 15.1 [Results section variants — results-sections.spec.ts](tests/tests/specs/variants/results-sections.spec.ts)

### 15.1.1 [should show only candidates when sections is ["candidate"]](tests/tests/specs/variants/results-sections.spec.ts:310)

### 15.1.2 [should show only organizations when sections is ["organization"]](tests/tests/specs/variants/results-sections.spec.ts:337)

### 15.1.3 [should show both sections with tabs when sections is ["candidate", "organization"]](tests/tests/specs/variants/results-sections.spec.ts:364)

# 16. Setup data-setup-constituency

## 16.1 [tests/tests/setup/variant-constituency.setup.ts](tests/tests/setup/variant-constituency.setup.ts)

### 16.1.1 [setup: 'import constituency dataset'](tests/tests/setup/variant-constituency.setup.ts:28)

# 17. Project variant-constituency

## 17.1 [Constituency selection variant (CONF-03) — constituency.spec.ts](tests/tests/specs/variants/constituency.spec.ts)

### 17.1.1 [should show constituency selection page after election selection](tests/tests/specs/variants/constituency.spec.ts:210)

### 17.1.2 [should allow constituency selection and proceed to questions](tests/tests/specs/variants/constituency.spec.ts:245)

### 17.1.3 [should answer questions and reach results](tests/tests/specs/variants/constituency.spec.ts:284)

### 17.1.4 [should show election accordion in multi-election results](tests/tests/specs/variants/constituency.spec.ts:326)

### 17.1.5 [should display constituency-filtered results](tests/tests/specs/variants/constituency.spec.ts:333)

### 17.1.6 [should show missing nominations warning for partial-coverage constituency](tests/tests/specs/variants/constituency.spec.ts:376)

# 18. Setup data-setup-startfromcg

## 18.1 [tests/tests/setup/variant-startfromcg.setup.ts](tests/tests/setup/variant-startfromcg.setup.ts)

### 18.1.1 [setup: 'import startfromcg dataset'](tests/tests/setup/variant-startfromcg.setup.ts:31)

# 19. Project variant-startfromcg

## 19.1 [startFromConstituencyGroup variant / matrix E2E-04 cell 5 — startfromcg.spec.ts](tests/tests/specs/variants/startfromcg.spec.ts)

### 19.1.1 [reversed flow: constituency selector first; elections page bypassed](tests/tests/specs/variants/startfromcg.spec.ts:187)

### 19.1.2 [orphan municipality → only Election 2026 (E2) in Results election selector](tests/tests/specs/variants/startfromcg.spec.ts:211)

### 19.1.3 [non-orphan municipality → both Election 2025 (E1) + Election 2026 (E2) in Results election selector](tests/tests/specs/variants/startfromcg.spec.ts:244)

### 19.1.4 [startFromConstituency — constituency selector shown first; elections list hidden; constituency URL segment present](tests/tests/specs/variants/startfromcg.spec.ts:365)

# 20. Setup data-setup-low-minimum-answers

## 20.1 [tests/tests/setup/variant-low-minimum-answers.setup.ts](tests/tests/setup/variant-low-minimum-answers.setup.ts)

### 20.1.1 [setup: 'import low-minimum-answers dataset'](tests/tests/setup/variant-low-minimum-answers.setup.ts:26)

# 21. Project variant-low-minimum-answers

## 21.1 [voter browse without match (E2E-02) — voter-browse-without-match.spec.ts](tests/tests/specs/voter/voter-browse-without-match.spec.ts)

### 21.1.1 [voter completes location, skips opinions, browses entity list without match scores](tests/tests/specs/voter/voter-browse-without-match.spec.ts:30)

# 22. Setup data-setup-1e-Nc

## 22.1 [tests/tests/setup/variant-1e-Nc.setup.ts](tests/tests/setup/variant-1e-Nc.setup.ts)

### 22.1.1 [setup: 'import 1e-Nc dataset'](tests/tests/setup/variant-1e-Nc.setup.ts:28)

# 23. Project variant-1e-Nc

## 23.1 [1e × Nc selector matrix (E2E-04 cell 2) — 1e-Nc.spec.ts](tests/tests/specs/variants/1e-Nc.spec.ts)

### 23.1.1 [1e × Nc — election selection bypassed; constituency selector shown with 3 options](tests/tests/specs/variants/1e-Nc.spec.ts:37)

# 24. Setup data-setup-Ne-Nc

## 24.1 [tests/tests/setup/variant-Ne-Nc.setup.ts](tests/tests/setup/variant-Ne-Nc.setup.ts)

### 24.1.1 [setup: 'import Ne-Nc dataset'](tests/tests/setup/variant-Ne-Nc.setup.ts:30)

# 25. Project variant-Ne-Nc

## 25.1 [Ne × Nc selector matrix (E2E-04 cell 4) — Ne-Nc.spec.ts](tests/tests/specs/variants/Ne-Nc.spec.ts)

### 25.1.1 [Ne × Nc — both selectors shown; constituency dropdown filters by selected election (no cross-bleed)](tests/tests/specs/variants/Ne-Nc.spec.ts:40)

# 26. Project voter-not-located-redirect

## 26.1 [CLEAN-02 voter-not-located deferred-target redirect — voter-not-located-redirect.spec.ts](tests/tests/specs/voter/voter-not-located-redirect.spec.ts)

### 26.1.1 [CLEAN-02 — direct link to /results route with no election picked bounces twice and resumes /results](tests/tests/specs/voter/voter-not-located-redirect.spec.ts:106)

### 26.1.2 [CLEAN-02 — multi-election multi-constituency bounces twice and resumes deferred target with query params preserved](tests/tests/specs/voter/voter-not-located-redirect.spec.ts:161)

### 26.1.3 [CLEAN-02 — election pre-selected via URL bounces only to constituency selector and resumes deferred target](tests/tests/specs/voter/voter-not-located-redirect.spec.ts:183)

### 26.1.4 [CLEAN-02 — refresh after localStorage clear mid-session resumes deferred target](tests/tests/specs/voter/voter-not-located-redirect.spec.ts:211)

### 26.1.5 [CLEAN-02 — open-redirect attempt to external URL is rejected by whitelist (defense-in-depth)](tests/tests/specs/voter/voter-not-located-redirect.spec.ts:241)

---

# 0. Fixtures

## 0.1 [tests/tests/fixtures/index.ts](tests/tests/fixtures/index.ts)

## 0.2 [tests/tests/fixtures/voter.fixture.ts](tests/tests/fixtures/voter.fixture.ts)

# 1. Setup data-setup

## 1.1 [tests/tests/setup/data.setup.ts](tests/tests/setup/data.setup.ts)

### 1.1.1 [setup: 'import test dataset'](tests/tests/setup/data.setup.ts:76)

# 2. Setup auth-setup

## 2.1 [tests/tests/setup/auth.setup.ts](tests/tests/setup/auth.setup.ts)

### 2.1.1 [setup: 'authenticate as candidate'](tests/tests/setup/auth.setup.ts:66)

# 3. Project candidate-app

## 3.1 [candidate authentication — candidate-auth.spec.ts](tests/tests/specs/candidate/candidate-auth.spec.ts)

### 3.1.1 [should login with valid credentials](tests/tests/specs/candidate/candidate-auth.spec.ts:19)

### 3.1.2 [should show error on invalid credentials](tests/tests/specs/candidate/candidate-auth.spec.ts:33)

## 3.2 [candidate opinion questions / candidate preview — candidate-questions.spec.ts](tests/tests/specs/candidate/candidate-questions.spec.ts)

### 3.2.1 [should display question cards organized by category (CAND-05)](tests/tests/specs/candidate/candidate-questions.spec.ts:27)

### 3.2.2 [should answer a Likert opinion question and save (CAND-04)](tests/tests/specs/candidate/candidate-questions.spec.ts:55)

### 3.2.3 [should navigate between categories (CAND-05)](tests/tests/specs/candidate/candidate-questions.spec.ts:88)

### 3.2.4 [should edit a previously answered question (CAND-05)](tests/tests/specs/candidate/candidate-questions.spec.ts:117)

### 3.2.5 [should persist question answers after page reload (CAND-12)](tests/tests/specs/candidate/candidate-questions.spec.ts:154)

### 3.2.6 [should persist comment text on a question after page reload (CAND-12)](tests/tests/specs/candidate/candidate-questions.spec.ts:192)

### 3.2.7 [should display entered profile and opinion data on preview page (CAND-06)](tests/tests/specs/candidate/candidate-questions.spec.ts:239)

### 3.2.8 [should show specific candidate data (name or answered question) in preview (CAND-06)](tests/tests/specs/candidate/candidate-questions.spec.ts:262)

## 3.3 [candidate translation surface (E2E-01) — candidate-translation.spec.ts](tests/tests/specs/candidate/candidate-translation.spec.ts)

### 3.3.1 [multilocale candidate authors a translation and the value persists across reload](tests/tests/specs/candidate/candidate-translation.spec.ts:27)

# 4. Project candidate-app-mutation

## 4.1 [candidate registration via email / candidate password reset — candidate-registration.spec.ts](tests/tests/specs/candidate/candidate-registration.spec.ts)

### 4.1.1 [should send registration email and extract link](tests/tests/specs/candidate/candidate-registration.spec.ts:84)

### 4.1.2 [should complete registration via email link](tests/tests/specs/candidate/candidate-registration.spec.ts:116)

### 4.1.3 [should complete forgot-password and reset flow via Inbucket email](tests/tests/specs/candidate/candidate-registration.spec.ts:175)

## 4.2 [candidate profile (fresh candidate) — candidate-profile.spec.ts](tests/tests/specs/candidate/candidate-profile.spec.ts)

### 4.2.1 [should register the fresh candidate via email link](tests/tests/specs/candidate/candidate-profile.spec.ts:130)

### 4.2.2 [should upload a profile image (CAND-03)](tests/tests/specs/candidate/candidate-profile.spec.ts:210)

### 4.2.3 [should show editable info fields on profile page (CAND-03)](tests/tests/specs/candidate/candidate-profile.spec.ts:258)

### 4.2.4 [should persist profile image after page reload (CAND-12)](tests/tests/specs/candidate/candidate-profile.spec.ts:272)

### 4.2.5 [A11Y-02 should persist display name after page reload](tests/tests/specs/candidate/candidate-profile.spec.ts:295)

### 4.2.6 [A11Y-02 should persist bio after page reload](tests/tests/specs/candidate/candidate-profile.spec.ts:332)

### 4.2.7 [A11Y-02 should persist social link after page reload](tests/tests/specs/candidate/candidate-profile.spec.ts:358)

# 5. Project candidate-app-validation

## 5.1 [A11Y-01 candidate profile validation — candidate-profile-validation.spec.ts](tests/tests/specs/candidate/candidate-profile-validation.spec.ts)

### 5.1.1 [A11Y-01 image-type rejection surfaces invalidFile error](tests/tests/specs/candidate/candidate-profile-validation.spec.ts:196)

### 5.1.2 [A11Y-01 image-size rejection surfaces oversizeFile error](tests/tests/specs/candidate/candidate-profile-validation.spec.ts:196)

### 5.1.3 [A11Y-01 name-too-long caps input value at maxlength=50 on display-name](tests/tests/specs/candidate/candidate-profile-validation.spec.ts:271)

### 5.1.4 [A11Y-01 A11Y-05 email-format rejection surfaces invalidEmail error](tests/tests/specs/candidate/candidate-profile-validation.spec.ts:314)

### 5.1.5 [A11Y-01 A11Y-06 url-format rejection surfaces invalidUrl error](tests/tests/specs/candidate/candidate-profile-validation.spec.ts:314)

### 5.1.6 [A11Y-01 A11Y-07 required-empty disables submit button via canSubmit gate](tests/tests/specs/candidate/candidate-profile-validation.spec.ts:364)

# 6. Setup re-auth-setup

## 6.1 [tests/tests/setup/re-auth.setup.ts](tests/tests/setup/re-auth.setup.ts)

### 6.1.1 [setup: 're-authenticate as candidate'](tests/tests/setup/re-auth.setup.ts:20)

# 7. Project candidate-app-settings

## 7.1 [candidate settings & app modes — candidate-settings.spec.ts](tests/tests/specs/candidate/candidate-settings.spec.ts)

### 7.1.1 [should show read-only warning when answers are locked](tests/tests/specs/candidate/candidate-settings.spec.ts:117)

### 7.1.2 [should show maintenance page when candidateApp is disabled](tests/tests/specs/candidate/candidate-settings.spec.ts:166)

### 7.1.3 [should show maintenance page when underMaintenance is true](tests/tests/specs/candidate/candidate-settings.spec.ts:200)

### 7.1.4 [should display notification popup when enabled](tests/tests/specs/candidate/candidate-settings.spec.ts:242)

### 7.1.5 [should render help page correctly](tests/tests/specs/candidate/candidate-settings.spec.ts:278)

### 7.1.6 [should render privacy page correctly](tests/tests/specs/candidate/candidate-settings.spec.ts:289)

### 7.1.7 [should hide hero when hideHero is enabled](tests/tests/specs/candidate/candidate-settings.spec.ts:312)

### 7.1.8 [should show hero when hideHero is disabled](tests/tests/specs/candidate/candidate-settings.spec.ts:343)

### 7.1.9 [SETTINGS-01 wave A — access.voterApp](tests/tests/specs/candidate/candidate-settings.spec.ts:762)

### 7.1.10 [SETTINGS-01 wave A — header.showFeedback](tests/tests/specs/candidate/candidate-settings.spec.ts:762)

### 7.1.11 [SETTINGS-01 wave A — header.showHelp](tests/tests/specs/candidate/candidate-settings.spec.ts:762)

### ~~7.1.12~~ [SETTINGS-01 wave A — notifications.voterApp (SKIPPED — Phase 77 PASS-WITH-DEFERRAL: onMount reads $appSettings.notifications.voterApp before appContext $effect merges page.data overlay; v2.11+ deferred)](tests/tests/specs/candidate/candidate-settings.spec.ts:762)

### 7.1.13 [SETTINGS-01 wave A — entities.showAllNominations](tests/tests/specs/candidate/candidate-settings.spec.ts:762)

### 7.1.14 [SETTINGS-01 wave A — entities.hideIfMissingAnswers.candidate](tests/tests/specs/candidate/candidate-settings.spec.ts:762)

### 7.1.15 [SETTINGS-01 wave A — elections.showElectionTags](tests/tests/specs/candidate/candidate-settings.spec.ts:762)

### 7.1.16 [SETTINGS-01 wave A — questions.showCategoryTags](tests/tests/specs/candidate/candidate-settings.spec.ts:762)

### 7.1.17 [SETTINGS-01 wave A — questions.showResultsLink](tests/tests/specs/candidate/candidate-settings.spec.ts:762)

### 7.1.18 [SETTINGS-01 wave A — results.sections](tests/tests/specs/candidate/candidate-settings.spec.ts:762)

# 8. Project candidate-app-password

## 8.1 [candidate password change / candidate logout — candidate-password.spec.ts](tests/tests/specs/candidate/candidate-password.spec.ts)

### 8.1.1 [should change password and login with new password](tests/tests/specs/candidate/candidate-password.spec.ts:44)

### 8.1.2 [should logout and return to login page](tests/tests/specs/candidate/candidate-password.spec.ts:85)

# 27. Setup data-setup-allowopen

## 27.1 [tests/tests/setup/variant-allowopen.setup.ts](tests/tests/setup/variant-allowopen.setup.ts)

### 27.1.1 [setup: 'import allowopen dataset'](tests/tests/setup/variant-allowopen.setup.ts:33)

# 28. Project variant-allowopen

## 28.1 [SETTINGS-02 — entity comment display surface — voter-allowopen.spec.ts](tests/tests/specs/voter/voter-allowopen.spec.ts)

### 28.1.1 [SETTINGS-02 entity comment surface renders for allowOpen-true questions](tests/tests/specs/voter/voter-allowopen.spec.ts:67)

### 28.1.2 [SETTINGS-02 entity comment surface present even when allowOpen flipped after authoring](tests/tests/specs/voter/voter-allowopen.spec.ts:95)

### 28.1.3 [SETTINGS-02 entity comment surface is absent when entity has no answer.info](tests/tests/specs/voter/voter-allowopen.spec.ts:128)

# 32. Teardown data-teardown

## 32.1 [tests/tests/setup/data.teardown.ts](tests/tests/setup/data.teardown.ts)

### 32.1.1 [teardown: 'delete test dataset'](tests/tests/setup/data.teardown.ts:17)

# 33. Teardown data-teardown-variants

## 33.1 [tests/tests/setup/variant-data.teardown.ts](tests/tests/setup/variant-data.teardown.ts)

### 33.1.1 [teardown: 'delete variant test dataset'](tests/tests/setup/variant-data.teardown.ts:12)

# 34. Project visual-regression (opt-in, PLAYWRIGHT_VISUAL=1)

## 34.1 [Visual regression for key pages — visual-regression.spec.ts](tests/tests/specs/visual/visual-regression.spec.ts)

### 34.1.1 [Voter Results - Desktop @visual screenshot matches baseline](tests/tests/specs/visual/visual-regression.spec.ts:28)

### 34.1.2 [Voter Results - Mobile @visual screenshot matches baseline](tests/tests/specs/visual/visual-regression.spec.ts:44)

### 34.1.3 [Candidate Preview - Desktop @visual screenshot matches baseline](tests/tests/specs/visual/visual-regression.spec.ts:60)

### 34.1.4 [Candidate Preview - Mobile @visual screenshot matches baseline](tests/tests/specs/visual/visual-regression.spec.ts:82)

# 35. Project performance (opt-in, PLAYWRIGHT_PERF=1)

## 35.1 [Performance budgets — performance-budget.spec.ts](tests/tests/specs/perf/performance-budget.spec.ts)

### 35.1.1 [voter results page loads within budget](tests/tests/specs/perf/performance-budget.spec.ts:33)

# 36. Project a11y-smoke (opt-in, PLAYWRIGHT_A11Y=1)

## 36.1 [A11Y-04 axe smoke — a11y-smoke.spec.ts](tests/tests/specs/a11y/a11y-smoke.spec.ts)

### 36.1.1 [A11Y-04 axe smoke — home](tests/tests/specs/a11y/a11y-smoke.spec.ts:165)

### 36.1.2 [A11Y-04 axe smoke — elections-selector](tests/tests/specs/a11y/a11y-smoke.spec.ts:165)

### 36.1.3 [A11Y-04 axe smoke — constituencies-selector](tests/tests/specs/a11y/a11y-smoke.spec.ts:165)

### 36.1.4 [A11Y-04 axe smoke — questions](tests/tests/specs/a11y/a11y-smoke.spec.ts:194)

### 36.1.5 [A11Y-04 axe smoke — results](tests/tests/specs/a11y/a11y-smoke.spec.ts:194)

### 36.1.6 [A11Y-04 axe smoke — voter-detail-drawer](tests/tests/specs/a11y/a11y-smoke.spec.ts:194)

# 37. Project bank-auth (opt-in, PLAYWRIGHT_BANK_AUTH=1)

## 37.1 [candidate bank authentication — candidate-bank-auth.spec.ts](tests/tests/specs/candidate/candidate-bank-auth.spec.ts)

### 37.1.1 [should create candidate via identity-callback Edge Function (keys configured path)](tests/tests/specs/candidate/candidate-bank-auth.spec.ts:203)

### 37.1.2 [should return structured error from identity-callback when Edge Function keys are not configured](tests/tests/specs/candidate/candidate-bank-auth.spec.ts:239)

### 37.1.3 [should return session with magic link when candidate is created](tests/tests/specs/candidate/candidate-bank-auth.spec.ts:259)

### 37.1.4 [should handle CORS preflight correctly](tests/tests/specs/candidate/candidate-bank-auth.spec.ts:299)

### 37.1.5 [should reject requests without id_token](tests/tests/specs/candidate/candidate-bank-auth.spec.ts:312)

### 37.1.6 [should reject invalid tokens](tests/tests/specs/candidate/candidate-bank-auth.spec.ts:327)
