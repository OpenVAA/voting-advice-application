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
      // testid on the <p> rendering t('candidateApp.login.answersLockedInfo')
      // when answersLocked is true. Used by the perm-answers-locked spec to
      // assert the read-only login surface (surface 1 of 3).
      answersLockedInfo: 'login-answers-locked-info'
    },
    // single canonical testid on the <Warning> element rendering
    // editingNotAllowed across /candidate, /candidate/profile,
    // /candidate/questions/[questionId].
    common: {
      answersLockedWarning: 'candidate-answers-locked-warning'
    },
    profile: {
      submit: 'profile-submit',
      imageUpload: 'profile-image-upload',
      // testids supporting the candidateProfilePage fixture. Placement:
      //  - imageError: portrait-upload error message landing site (added to
      //    profile/+page.svelte at the call-site wrapper around the image
      //    <Input>; the underlying <Input>'s shared <ErrorMessage> is not
      //    testid-specialised since it renders the same way for every input type).
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
      // testids supporting the candidate fixture library's strict locator
      // surface. Placement:
      //  - categoryExpander: questions overview <Expander> wrapper (un-keyed,
      //    filtered by hasText per category in fixture).
      //  - hero: figure inside the {#snippet hero()} block on the question
      //    page (parity with voter-questions-hero).
      //  - intro: the empty-state intro <div> shown when no answers exist.
      categoryExpander: 'candidate-questions-category-expander',
      hero: 'candidate-questions-hero',
      intro: 'candidate-questions-intro'
    },
    settings: {
      currentPassword: 'settings-current-password',
      newPassword: 'settings-new-password',
      // NB. the password confirmation input's live id is the component-hardcoded
      // `candidate.passwordSetter.confirm` (PasswordSetter.svelte:80) — the former
      // settings-scoped `confirmPassword` entry was dead (its prop fell into <form>
      // restProps and never rendered a usable id) and was removed (128-02).
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
    // The candidate /preregister bank-auth walk: entry button + the
    // post-auth election -> constituency -> email/ToU selection steps. Raw
    // strings verified in apps/frontend/src/routes/candidate/preregister/
    // (+page.svelte:140,163,167; (authenticated)/{elections,constituencies,email}/+page.svelte).
    // Driven by the EFLOW-10b candidate-preregister page-object (122-04/122-05).
    preregister: {
      start: 'preregister-start',
      continue: 'preregister-continue',
      return: 'preregister-return',
      electionsList: 'preregister-elections-list',
      // Ids owned by the SHARED ElectionSelector component
      // (`lib/components/electionSelector/ElectionSelector.svelte`), which the
      // preregister election step renders — the voter elections page renders
      // the same component, hence the route-agnostic names. `electionLabel` is
      // the <label> wrapping both the checkbox and the election name, so
      // filtering it by text and descending to `electionOption` selects an
      // election by IDENTITY rather than position (see phase 140 iter-3 CR-01).
      electionLabel: 'election-selector-option-label',
      electionOption: 'election-selector-option',
      electionsSubmit: 'preregister-elections-submit',
      constituenciesList: 'preregister-constituencies-list',
      constituenciesSubmit: 'preregister-constituencies-submit',
      emailInput: 'preregister-email-input',
      emailConfirm: 'preregister-email-confirm',
      emailSubmit: 'preregister-email-submit',
      // Success status page (preregister/status?code=success) — the
      // "Return" CTA that links to the candidate login. Its visibility is the
      // authenticated end-state proof for the Supabase bank-auth flow: it
      // renders only after preregister() returned `code=success`, i.e. the full
      // authorize→callback→exchange→decrypt→claims→create→session chain ran.
      statusReturn: 'preregister-status-return'
    },
    passwordReset: {
      submit: 'password-reset-submit'
    },
    terms: {
      checkbox: 'terms-checkbox',
      // the advance button on the candidate ToU page. The submit button lives
      // in the consuming layout (candidate/(protected)/+layout.svelte) inside
      // the {#snippet primaryActions()} block — NOT inside TermsOfUseForm.svelte
      // itself (the form component renders only the checkbox; the consuming page
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
      // stable page-content load anchor on the home `MainContent` root <div>
      // (apps/frontend/src/routes/(voters)/+page.svelte). Unlike `startButton`
      // (an action that is HIDDEN under access.voterApp=false maintenance mode),
      // this anchor confirms "the home page content loaded" so
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
      // stable page-content load anchor on the intro `MainContent` root <div>
      // (apps/frontend/src/routes/(voters)/intro/+page.svelte). Confirms the
      // intro page content loaded, independent of the action button.
      page: 'voter-intro'
    },
    questions: {
      answerOption: 'question-choice',
      heading: 'voter-questions-heading',
      nextButton: 'question-next',
      previousButton: 'question-previous',
      // Phase-129 question-input locators. These support the Phase-130
      // EQTYP fixtures (answerNumberScale / answerMultiChoice + the MultipleText
      // round-trip) and the Phase-129 voter-journey answer-walk extension. Values
      // byte-match the component-side data-testid strings shipped in plans 04/05/06:
      //  - numberSlider / numberValue: NumberScaleInput.svelte native range +
      //    live value label (plan 04).
      //  - multipleText*: MultipleTextInput.svelte row-list add/remove/reorder
      //    controls, candidate info-question input (plan 05).
      //  - choiceHelper: QuestionChoices.svelte multi-select helper text
      //    (select-range / select-exact) rendered outside the choice grid (plan 06).
      numberSlider: 'question-number-slider',
      numberValue: 'question-number-value',
      // NumberScaleInput.svelte root <div> (both answer + display modes). Scopes
      // the dual-marker display-mode readout (129) inside an entity-detail
      // opinion block. Byte-matches the existing component data-testid — NOT a
      // new product testid (see phase 130 is specs-only).
      numberScaleInput: 'number-scale-input',
      multipleTextRow: 'multiple-text-row',
      multipleTextAdd: 'multiple-text-add',
      multipleTextRemove: 'multiple-text-remove',
      multipleTextMoveUp: 'multiple-text-move-up',
      multipleTextMoveDown: 'multiple-text-move-down',
      choiceHelper: 'question-choice-helper',
      categoryIntro: 'voter-questions-category-intro',
      categoryList: 'voter-questions-category-list',
      categoryCheckbox: 'voter-questions-category-checkbox',
      startButton: 'voter-questions-start',
      categoryStart: 'voter-questions-category-start',
      categorySkip: 'voter-questions-category-skip',
      // hero + info testids on the voter question page + the question-category
      // intro page.
      hero: 'voter-questions-hero',
      categoryHero: 'voter-questions-category-hero',
      infoButton: 'voter-questions-info-button',
      // Phase-119 extended-info / arguments / terms surface (consumed by the
      // Phase-120 expectInfoMode / expectInfoSections / expectArguments readers).
      //  - popupInfoButton: the <Button> on QuestionExtendedInfoButton.svelte that
      //    opens the interactiveInfo modal/drawer (popup mode). Renders only when
      //    appSettings.questions.interactiveInfo.enabled && !customData.video.
      //  - popupInfoModal: the modal/drawer body (QuestionExtendedInfo root rendered
      //    inside the Drawer) so expectInfoMode(q,'popup') can assert the open modal.
      //  - infoSection: per-customData.infoSections section (keyed by index) on
      //    QuestionExtendedInfo.svelte so expectInfoSections([...]) can enumerate.
      //  - argumentsExpander: the collapsible Arguments block wrapper on
      //    QuestionExtendedInfo.svelte (sibling to the per-index infoSection
      //    blocks). Its content (the per-group blocks) mounts only when expanded,
      //    so expectArguments expands it before reading the group.
      //  - argumentGroup: per-argument group on QuestionArguments.svelte. For
      //    categorical questions the group is keyed by choiceId (mirrors the keyed
      //    feedback-rating-{value} pattern); non-categorical groups fall back to the
      //    argument type. So expectArguments(q,type) can target a group.
      //  - termTrigger: the in-text <Term> trigger span (QuestionHeading.svelte) and
      //  - termPopup: its definition popup (Term.svelte) — so the Phase-120 voter
      //    journey can hover/read the term affordance + definition.
      popupInfoButton: 'voter-questions-popup-info-button',
      popupInfoModal: 'voter-questions-popup-info-modal',
      infoSection: 'voter-questions-info-section',
      argumentsExpander: 'voter-questions-arguments',
      argumentGroup: 'voter-questions-argument-group',
      termTrigger: 'voter-questions-term-trigger',
      termPopup: 'voter-questions-term-popup'
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
      // testids for the resultsPage / entityFilters / entityDetails fixture
      // surface.
      listControls: 'entity-list-controls',
      listSearch: 'entity-list-search',
      listWithControls: 'entity-list-with-controls',
      filterButton: 'entity-list-filter',
      entityDetails: 'entity-details',
      infoItem: 'info-item',
      // MatchScore.svelte list-card callout (the "<n>%" readout in the card
      // header). Distinct from `scoreGauge` (`score-gauge`), which only renders
      // inside the entity-details SubMatches drawer. reads this scoped
      // to a single org card to assert the exact per-mode organization score.
      matchScore: 'match-score',
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
      cardSubcard: 'entity-card-subcard',
      // The single select-all/none toggle button on EnumeratedEntityFilter.svelte.
      // Renders only `{#if values.length > 3}` (threshold > 3 confirmed) and its
      // label flips selectAll/unselectAll via `allSelected` — it is ONE toggle, not
      // two buttons. The entityFilters fixture (Plan 07) clicks it to select-all when
      // not-all-selected and to select-none when all-selected.
      filterSelectAllToggle: 'entity-filter-select-all-toggle'
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
      // sr-only sibling marker on QuestionChoices.svelte's radio whose
      // `otherSelected == id` (i.e. the entity's chosen answer in display mode).
      // Used by the voter-journey classifyVoterEntityRows helper instead of a
      // raw `.entitySelected` locator.
      entitySelectedAnswer: 'entity-selected-answer',
      // testid on the QuestionOpenAnswer wrapper rendered inside
      // EntityOpinions.svelte when the candidate has authored info AND
      // customData.allowOpen is not false. Used by the perm-disable-allow-open
      // voter-side assertion to verify Q1 info visible / Q2 info hidden.
      opinionOpenAnswer: 'entity-opinion-open-answer'
    },
    nav: {
      resultsLink: 'voter-nav-results'
    },
    about: {
      content: 'voter-about-content',
      returnButton: 'voter-about-return',
      // Dedicated testid on the about.organizationMatching disclosure block on the
      // About page (rendered only when matching.organizationMatching !== 'none').
      // Tighter than the coarse voter-about-content anchor so can assert the
      // org-matching disclosure specifically.
      organizationMatching: 'voter-about-organization-matching'
    },
    info: {
      content: 'voter-info-content',
      returnButton: 'voter-info-return',
      // Data-dependent anchor on the info page's `{#each ctx.dataRoot.elections}`
      // election region (apps/frontend/src/routes/(voters)/info/+page.svelte).
      // Distinct from the static `voter-info-content` {@html} div — this region is
      // EMPTY when dataRoot.elections is stale, so it is the correct cold-entry
      // regression anchor (see phase 117).
      electionList: 'voter-info-election-list'
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
    // testids supporting the langSelectorFixture + multilingualTextFieldFixture
    // function-fixtures.
    //  - langSelector: on the LanguageSelection.svelte NavGroup, gates on
    //    `locales.length > 1`. Absent when single-locale (the negative-perm
    //    assertion target).
    //  - multilingualToggle: on the Input.svelte translation-toggle Button,
    //    gates on `multilingual && locales.length > 1`. Absent when
    //    `customData.disableMultilingual=true` OR single-locale.
    langSelector: 'lang-selector',
    multilingualToggle: 'multilingual-toggle',
    // testid on the inline ErrorMessage in Input.svelte. Consumed by the
    // candidate-journey invalidUrl step + future shared input-validation
    // assertions.
    inputError: 'input-error',
    // testid on the root <span> of ElectionTag.svelte. Consumed by
    // perm-hide-election-tags spec to assert absence when
    // elections.showElectionTags=false.
    electionTag: 'election-tag',
    // testid on the root <span> of CategoryTag.svelte. Consumed by
    // perm-hide-category-tags spec to assert absence when
    // questions.showCategoryTags=false.
    categoryTag: 'category-tag',
    // testids on the feedback + help Buttons in Banner.svelte. Consumed by
    // perm-header-show-feedback + perm-header-show-help specs to assert
    // visibility when header.showFeedback / header.showHelp is true.
    header: {
      feedback: 'header-feedback',
      help: 'header-help'
    },
    // Used in image-type Hero and necessary because the img tag cannot be located by role due to empty alt text
    image: 'image-img',
    // Generic Video component root <div> testid (Video.svelte). Shared between the
    // voter + candidate apps. The element is class:hidden-not-destroyed (hidden when
    // !hasContent), so expectVideo(true) asserts toBeVisible() and expectVideo(false)
    // asserts not.toBeVisible() — NOT mount/unmount churn.
    video: 'video',
    // Distinct root testids on the results feedback + survey popups (FeedbackPopup /
    // SurveyPopup Alert roots). Distinct so the dismiss-and-reload helper can assert
    // each popup's dismiss-persistence independently.
    feedbackPopup: 'feedback-popup',
    surveyPopup: 'survey-popup',
    // Root <div> testid on SurveyBanner.svelte — the survey prompt rendered on the
    // frontpage / entityDetails surfaces when survey.showIn includes that surface.
    // Consumed by the perm-show-feedback-survey showIn-surface audit.
    surveyBanner: 'survey-banner'
  }
} as const;
