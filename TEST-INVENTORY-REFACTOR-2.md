# New project "Voter: election and constituency permutations"

For each we'll need a minimal test dataset compiled from parts

## Dataset variant construction

- In addition to the specified data, only include the minimal amount of other data, unless specified otherwise, you may want to create a helper for constructing these datasets if possible

=> 1 election
=> 1 constituency group
=> 1 constituency
=> 2 question categories: info and opinion
=> 1 question in each category: text and Likert 5
=> no alliances
=> 2 organisations
=> 1 candidate for each organisation for each constituency

## Minimal settings as base

export const dynamicSettings: DynamicSettings = {
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
candidate: false
},
showAllNominations: true
},
matching: {
minimumAnswers: 1,
organizationMatching: 'impute'
},
questions: {
categoryIntros: {
allowSkip: true,
show: false
},
interactiveInfo: {
enabled: false
},
questionsIntro: {
allowCategorySelection: false,
show: false
},
showCategoryTags: true,
showResultsLink: true
},
results: {
cardContents: {
candidate: [],
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

## Tests and helpers

We need to check proper handling of each of these cases.

Helpers or fixtures needed, extract from voter-mega-journey to common if available.

bypassIntroAndExpect(page, expectation: async () => Pr<void>)

- click through start and intro pages and expect smth, used to compose the following ones

expectQuestion()
expectElectionSelector()
expeccConsituencySelector()

bypassIntroAndExpectQuestion()

- for no election or constituency selection

bypassIntroAndExpectElectionSelector(): Pr<Locator for election selector>

selectElectionAndAdvance()

bypassIntroAndExpectConsituencySelector(): Pr<Locator for const selectors>

selectConstituencyAndAdvance({ selectorText: string | RegEx, optionText: string | RegEx }): Pr<void>

### Implied elections and constituencies

Data: 1 EL - 1 CG - 1 CO
=> no election or constituency selection

Data: 2 EL - 1 shared CG - 1 CO
=> 1. user selects first election: no constituency selection
=> 2. user selects both elections: no constituency selection

Data:

- EL 1:
  - CG 1:
    - CO 1A
- EL 2:
  - CG 2 - CO 2A - CO 2B
    => 1. user selects both elections: show activce constituency selection for only EL 2 / CG 2 with CG 1 prefilled and not editable

### Start from constituency group

Data:

- EL 1:
  - CG 1
    - CO 1A
    - CO 1B
- EL 2:
  - CG 2 - CO 1A1 (parent CO 1A) - CO 1A2 (parent CO 1A) - CO 1B1 (parent CO 1B) - CO 1B2 (parent CO 1B) - CO 1C (no parent)
    Setting: startFromConstituencyGroup CG 2
    => 1. user selects CO 1A1: show election selector
    => 2. user selects CO 1C: don't show election selector

### Disjoint constituency groups

Data:

- EL 1:
  - CG 1
    - CO 1A
- EL 2:
  - CG 2 - CO 2A
    => 1. user selects first election: show constituency selection for only EL 1 / CG 1
    => 2. user selects both elections:
  - show 2 constituency selectors: CG 1 and CG 2
  - continue disabled until selection made for both

### Disable election selection

Data: 2 EL - 1 shared CG - 1 CO
Setting: disableElectionSelection true
=> no election or constituency selection

Data: 2 EL - 1 shared CG - 2 CO
Setting: disableElectionSelection true
=> no election selection, but show constituency selection

### Voter-not-located-redirect

Rebuild these tests using minimal data and the utils above.

Data: 2 EL - 2 disjoint CGS - 2 CO each

## 26.1 [CLEAN-02 voter-not-located deferred-target redirect — voter-not-located-redirect.spec.ts](tests/tests/specs/voter/voter-not-located-redirect.spec.ts)

### 26.1.1 [CLEAN-02 — direct link to /results route with no election picked bounces twice and resumes /results](tests/tests/specs/voter/voter-not-located-redirect.spec.ts:106)

### 26.1.2 [CLEAN-02 — multi-election multi-constituency bounces twice and resumes deferred target with query params preserved](tests/tests/specs/voter/voter-not-located-redirect.spec.ts:161)

### 26.1.3 [CLEAN-02 — election pre-selected via URL bounces only to constituency selector and resumes deferred target](tests/tests/specs/voter/voter-not-located-redirect.spec.ts:183)

### 26.1.4 [CLEAN-02 — refresh after localStorage clear mid-session resumes deferred target](tests/tests/specs/voter/voter-not-located-redirect.spec.ts:211)

### 26.1.5 [CLEAN-02 — open-redirect attempt to external URL is rejected by whitelist (defense-in-depth)](tests/tests/specs/voter/voter-not-located-redirect.spec.ts:241)

# THESE ARE NOT ORGANIZED YET (BUT SOME MAY BE DEPRECATED BY THE ONES ABOVE)

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

# 30. Project variant-hidden-required-voter

## 30.1 [SETTINGS-03 — voter-side hidden question filter — voter-visibility-required.spec.ts](tests/tests/specs/voter/voter-visibility-required.spec.ts)

### 30.1.1 [SETTINGS-03 hidden question absent from voter question flow](tests/tests/specs/voter/voter-visibility-required.spec.ts:77)

# 31. Project variant-hidden-required-candidate

## 31.1 [SETTINGS-03 — candidate-side required-info enforcement — candidate-required-info.spec.ts](tests/tests/specs/candidate/candidate-required-info.spec.ts)

### 31.1.1 [SETTINGS-03 unanswered required info question disables profile-dependent CTAs on CandAppHome](tests/tests/specs/candidate/candidate-required-info.spec.ts:99)

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

# 20. Setup data-setup-low-minimum-answers

## 20.1 [tests/tests/setup/variant-low-minimum-answers.setup.ts](tests/tests/setup/variant-low-minimum-answers.setup.ts)

### 20.1.1 [setup: 'import low-minimum-answers dataset'](tests/tests/setup/variant-low-minimum-answers.setup.ts:26)

# 21. Project variant-low-minimum-answers

## 21.1 [voter browse without match (E2E-02) — voter-browse-without-match.spec.ts](tests/tests/specs/voter/voter-browse-without-match.spec.ts)

### 21.1.1 [voter completes location, skips opinions, browses entity list without match scores](tests/tests/specs/voter/voter-browse-without-match.spec.ts:30)

# 22. Setup data-setup-1e-Nc

## 22.1 [tests/tests/setup/variant-1e-Nc.setup.ts](tests/tests/setup/variant-1e-Nc.setup.ts)

### 22.1.1 [setup: 'import 1e-Nc dataset'](tests/tests/setup/variant-1e-Nc.setup.ts:28)

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
