/**
 * Central testId constants for all E2E tests.
 *
 * Every `data-testid` attribute used in the application must be defined here.
 * Tests import from this file to ensure testId strings are consistent between
 * the Svelte components and Playwright locators.
 *
 * Structure: `testIds.<app>.<page>.<element>`
 * Naming: kebab-case for values (matches existing conventions)
 */
export const testIds = {
  candidate: {
    login: {
      email: 'login-email',
      submit: 'login-submit',
      errorMessage: 'login-errorMessage',
      // Phase 91 Plan 02 (TIR6:3-14 — D-91-PD-05 A1): testid on the <p>
      // rendering t('candidateApp.login.answersLockedInfo') when
      // answersLocked is true. Used by the perm-answers-locked spec to
      // assert the read-only login surface (Surface 1 of the 3-surface
      // CONTEXT contract).
      answersLockedInfo: 'login-answers-locked-info'
    },
    // Phase 91 Plan 02 (TIR6:3-14 — A1 surfaces 2+3): single canonical
    // testid on the <Warning> element rendering editingNotAllowed across
    // /candidate, /candidate/profile, /candidate/questions/[questionId].
    common: {
      answersLockedWarning: 'candidate-answers-locked-warning'
    },
    profile: {
      submit: 'profile-submit',
      imageUpload: 'profile-image-upload',
      // Phase 89 Plan 02 (TIR4:75-76 + 166-188): testids supporting the new
      // candidateProfilePage fixture. Placement:
      //  - imageError: portrait-upload error message landing site (added to
      //    profile/+page.svelte at the call-site wrapper around the image
      //    <Input>; the underlying <Input>'s shared <ErrorMessage> at
      //    Input.svelte:640-642 is not testid-specialised since it renders
      //    the same way for every input type).
      //  - nominations: <section> wrapping the immutable-nominations list.
      //  - infoItem: per-question wrapper around each editable info question
      //    in the candCtx.infoQuestions loop (un-keyed; fixture filters by
      //    label text).
      imageError: 'profile-image-error',
      nominations: 'candidate-profile-nominations',
      infoItem: 'candidate-profile-info-item'
    },
    home: {
      statusMessage: 'candidate-home-status',
      logout: 'candidate-home-logout',
      questions: 'candidate-home-questions'
    },
    questions: {
      card: 'candidate-questions-card',
      cardAction: 'candidate-questions-card-action',
      list: 'candidate-questions-list',
      start: 'candidate-questions-start',
      answerInput: 'candidate-questions-answer',
      commentInput: 'candidate-questions-comment',
      saveButton: 'candidate-questions-save',
      // Phase 89 Plan 02 (TIR4:58-80): testids added to support the new
      // candidate fixture library's strict locator surface. Placement:
      //  - categoryExpander: questions overview <Expander> wrapper (un-keyed,
      //    filtered by hasText per category in fixture).
      //  - hero: figure inside the {#snippet hero()} block on the question
      //    page (parity with voter-questions-hero from Plan 89-01).
      //  - intro: the empty-state intro <div> shown when no answers exist.
      categoryExpander: 'candidate-questions-category-expander',
      hero: 'candidate-questions-hero',
      intro: 'candidate-questions-intro'
    },
    settings: {
      currentPassword: 'settings-current-password',
      newPassword: 'settings-new-password',
      confirmPassword: 'settings-confirm-password',
      updateButton: 'settings-update-password'
    },
    preview: {
      container: 'candidate-preview-container'
    },
    nav: {
      home: 'candidate-nav-home',
      profile: 'candidate-nav-profile',
      questions: 'candidate-nav-questions',
      settings: 'candidate-nav-settings',
      preview: 'candidate-nav-preview'
    },
    forgotPassword: {
      email: 'forgot-password-email',
      submit: 'forgot-password-submit'
    },
    register: {
      submit: 'register-submit'
    },
    passwordReset: {
      submit: 'password-reset-submit'
    },
    terms: {
      checkbox: 'terms-checkbox',
      // Phase 89 Plan 02 (TIR4:69-70): the advance button on the candidate
      // ToU page. The submit button lives in the consuming layout
      // (candidate/(protected)/+layout.svelte) inside the {#snippet
      // primaryActions()} block — NOT inside TermsOfUseForm.svelte itself
      // (the form component renders only the checkbox; the consuming page
      // owns the Continue button).
      submit: 'terms-of-use-submit'
    },
    help: {
      home: 'candidate-help-home',
      contactSupport: 'candidate-help-contact-support'
    },
    privacy: {
      home: 'candidate-privacy-home'
    },
    password: {
      field: 'password-field',
      /** A shared test id for reset and register password setters */
      submit: 'set-password-submit'
    },
    passwordSetter: {
      password: 'password-setter-password',
      confirm: 'password-setter-confirmation'
    }
  },
  voter: {
    home: {
      startButton: 'voter-home-start',
      // Phase 92 Plan 03 (D-06/D-07): stable page-content load anchor on the
      // home `MainContent` root <div> (apps/frontend/src/routes/(voters)/+page.svelte).
      // Unlike `startButton` (an action that is HIDDEN under access.voterApp=false
      // maintenance mode), this anchor confirms "the home page content loaded" so
      // `voterHomePage.expectPageVisible()` checks page-load, not action presence.
      page: 'voter-home'
    },
    elections: {
      list: 'voter-elections-list',
      selector: 'election-selector',
      label: 'election-selector-option-label',
      option: 'election-selector-option',
      continue: 'voter-elections-continue'
    },
    constituencies: {
      list: 'voter-constituencies-list',
      selector: 'constituency-selector',
      continue: 'voter-constituencies-continue'
    },
    // Shown by (voters)/(located)/+layout.svelte when one or more selected
    // elections lacks any nomination in the selected constituency — opens
    // automatically on first /questions or /results entry after the layout's
    // nomination-availability check settles.
    missingNominationsModal: 'voter-missing-nominations-modal',
    intro: {
      startButton: 'voter-intro-start',
      // Phase 92 Plan 03 (D-06/D-07): stable page-content load anchor on the
      // intro `MainContent` root <div> (apps/frontend/src/routes/(voters)/intro/+page.svelte).
      // Confirms the intro page content loaded, independent of the action button.
      page: 'voter-intro'
    },
    questions: {
      answerOption: 'question-choice',
      heading: 'voter-questions-heading',
      nextButton: 'question-next',
      previousButton: 'question-previous',
      categoryIntro: 'voter-questions-category-intro',
      categoryList: 'voter-questions-category-list',
      categoryCheckbox: 'voter-questions-category-checkbox',
      startButton: 'voter-questions-start',
      categoryStart: 'voter-questions-category-start',
      categorySkip: 'voter-questions-category-skip',
      // Phase 89 Plan 01 (TIR4:25-32 + TIR4:30): hero + info testids on
      // the voter question page + the question-category intro page.
      hero: 'voter-questions-hero',
      categoryHero: 'voter-questions-category-hero',
      infoButton: 'voter-questions-info-button'
    },
    results: {
      list: 'voter-results-list',
      noNominationsWarning: 'voter-results-no-nominations-warning',
      card: 'entity-card',
      cardTitle: 'entity-card-title',
      candidateSection: 'voter-results-candidate-section',
      partySection: 'voter-results-party-section',
      allianceSection: 'voter-results-alliance-section',
      entityTabs: 'voter-results-entity-tabs',
      ingress: 'voter-results-ingress',
      electionAccordion: 'voter-results-election-select',
      // Phase 88 Plan 04 Wave 1.5 — testids added by Task 5 for the
      // resultsPage / entityFilters / entityDetails fixture surface.
      // See 88-04-RESEARCH.md R-2 for placement decisions and the related
      // 88-04-WAVE0-PROBES.txt for the Modal/Expander restProps verification.
      listControls: 'entity-list-controls',
      listSearch: 'entity-list-search',
      listWithControls: 'entity-list-with-controls',
      filterButton: 'entity-list-filter',
      entityDetails: 'entity-details',
      infoItem: 'info-item',
      scoreGauge: 'score-gauge',
      subMatches: 'sub-matches',
      electionSymbol: 'election-symbol',
      filterRow: 'entity-filter-row',
      filterOption: 'entity-filter-option',
      filterNumericMin: 'entity-filter-numeric-min',
      filterNumericMax: 'entity-filter-numeric-max',
      filterDialog: 'entity-filter-dialog',
      filterDialogReset: 'entity-filter-dialog-reset',
      filterDialogApply: 'entity-filter-dialog-apply',
      cardSubcard: 'entity-card-subcard'
    },
    entityDetail: {
      container: 'voter-entity-detail',
      infoTab: 'voter-entity-detail-info',
      opinionsTab: 'voter-entity-detail-opinions',
      childrenTab: 'voter-entity-detail-children',
      // Wraps a single opinion-question display block inside EntityOpinions.svelte
      // (heading + optional missing-answer message + optional OpinionQuestionInput).
      // Consumed by voter-journey.spec.ts → expectQuestionDisplayToHave.
      opinionQuestion: 'entity-opinion-question',
      // 260524-l1t D6: sr-only sibling marker on QuestionChoices.svelte's
      // radio whose `otherSelected == id` (i.e. the entity's chosen answer
      // in display mode). Replaces the `.entitySelected` raw-locator
      // suppression used by the voter-journey classifyVoterEntityRows helper.
      entitySelectedAnswer: 'entity-selected-answer',
      // Phase 91 Plan 02 (TIR6:121-142 — D-91-PD-05 A9): testid on the
      // QuestionOpenAnswer wrapper rendered inside EntityOpinions.svelte
      // when the candidate has authored info AND customData.allowOpen
      // is not false. Used by the perm-disable-allow-open voter-side
      // assertion to verify Q1 info visible / Q2 info hidden.
      opinionOpenAnswer: 'entity-opinion-open-answer'
    },
    nav: {
      resultsLink: 'voter-nav-results'
    },
    about: {
      content: 'voter-about-content',
      returnButton: 'voter-about-return'
    },
    info: {
      content: 'voter-info-content',
      returnButton: 'voter-info-return'
    },
    privacy: {
      content: 'voter-privacy-content',
      returnButton: 'voter-privacy-return'
    },
    nominations: {
      list: 'voter-nominations-list',
      controls: 'voter-nominations-controls'
    },
    banner: {
      results: 'voter-banner-results'
    }
  },
  shared: {
    errorMessage: 'error-message',
    loading: 'loading-indicator',
    questionActions: 'question-actions',
    questionDelete: 'question-delete',
    navigation: {
      menu: 'nav-menu',
      menuItem: 'nav-menu-item',
      // Locale-independent open-menu anchor on the Header menu-toggle button
      // (Header.svelte). Used by the voterNav fixture to open the drawer in
      // any UI locale (the English-only /open menu/i regex fails on /fi).
      menuToggle: 'nav-menu-toggle'
    },
    // Phase 90 Plan 03 (TIR5:28-50 + D-90-06): testids supporting the new
    // langSelectorFixture + multilingualTextFieldFixture function-fixtures.
    //  - langSelector: on the LanguageSelection.svelte NavGroup (line 33),
    //    gates on `locales.length > 1`. Absent when single-locale (the
    //    negative-perm assertion target).
    //  - multilingualToggle: on the Input.svelte translation-toggle Button
    //    (lines 653-660), gates on `multilingual && locales.length > 1`.
    //    Absent when `customData.disableMultilingual=true` OR single-locale.
    langSelector: 'lang-selector',
    multilingualToggle: 'multilingual-toggle',
    // Phase 91 Plan 03 (TIR6:16-22 — D-91-MJ-01 B1): testid on the inline
    // ErrorMessage in Input.svelte:641. Consumed by the candidate-journey
    // invalidUrl step + future shared input-validation assertions.
    inputError: 'input-error',
    // Phase 91 Plan 02 (TIR6:104-108 — D-91-PD-05 A7): testid on the root
    // <span> of ElectionTag.svelte. Consumed by perm-hide-election-tags
    // spec to assert absence when elections.showElectionTags=false.
    electionTag: 'election-tag',
    // Phase 91 Plan 02 (TIR6:111-115 — D-91-PD-05 A8): testid on the root
    // <span> of CategoryTag.svelte. Consumed by perm-hide-category-tags
    // spec to assert absence when questions.showCategoryTags=false.
    categoryTag: 'category-tag',
    // Phase 91 Plan 02 (TIR6:68-88 — D-91-PD-05 A3/A4): testids on the
    // feedback + help Buttons in Banner.svelte. Consumed by perm-header-
    // show-feedback + perm-header-show-help specs to assert visibility
    // when header.showFeedback / header.showHelp is true.
    header: {
      feedback: 'header-feedback',
      help: 'header-help'
    },
    // Used in image-type Hero and necessary because the img tag cannot be located by role due to empty alt text
    image: 'image-img'
  }
} as const;
