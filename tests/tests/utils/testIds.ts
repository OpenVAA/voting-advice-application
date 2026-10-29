/**
 * Central testId constants for all E2E tests.
 *
 * Every `data-testid` attribute used in the application must be defined here.
 * Tests import from this file to ensure testId strings are consistent between the Svelte components and Playwright locators.
 *
 * Structure: `testIds.<app>.<page>.<element>` Naming: kebab-case for values (matches existing conventions)
 */
export const testIds = {
  contestant: {
    login: {
      // The login screen's root. Carries data-register-offered and data-answers-locked, each "true" | "false".
      page: 'contestant-login',
      // The login screen's entry that leads to the sign-in screen.
      signInLink: 'login-sign-in-link',
      // The message under the login screen's title. Carries data-reason="loginFailed" | "authError".
      notice: 'login-notice',
      // The two links under the login screen's entries: the help page and the voter app.
      helpLink: 'login-help-link',
      voterAppLink: 'login-voter-app-link',
      // The sign-in screen's root. Carries data-sign-in-state="idle" | "submitting" | "failed".
      signInPage: 'contestant-sign-in',
      email: 'login-email',
      submit: 'login-submit',
      // The message of a refused sign-in. On the sign-in screen it carries data-status, the status the refusal was answered with.
      errorMessage: 'login-errorMessage',
      // The error of the sign-in form's email field, and of its password field.
      emailError: 'login-email-error',
      passwordError: 'login-password-error',
      // The sign-in screen's link to the forgot-password page.
      forgotPasswordLink: 'login-forgot-password-link',
      // The sign-in screen's link for a user without a password, to the same page. Absent where neither the email nor the identity-provider mode is allowed.
      noPasswordYetLink: 'login-no-password-yet-link',
      // The sign-in screen's way back to the login screen.
      return: 'login-return',
      // The sentence that says answers are locked, on the login screen and on the sign-in screen. Rendered only while they are.
      answersLockedInfo: 'login-answers-locked-info',
      // The login screen's entry that leads to the registration screen. Rendered only where a registration mode is listed.
      registerLink: 'login-register-link'
    },
    common: {
      // The note a page shows while answers are locked, on the four pages that show it: an entity's home, its profile, its questions list and the page of one question. Carries data-reason="answersLocked".
      answersLockedWarning: 'contestant-answers-locked-warning',
      // The ContactSupport button, wherever the block is rendered. Scope it inside the host page's own marker when a page could hold two.
      contactSupport: 'contestant-contact-support'
    },
    entitySelection: {
      // Wrapper of every group on the profile selection screen. Rendered by that screen alone: the reach marker of its axe entries.
      list: 'contestant-entity-selection-list',
      // One <section> per entity type; carries data-entity-type="candidate" | "organization".
      group: 'contestant-entity-selection-group',
      // The <h2> of a group; present only when both types are listed.
      groupHeading: 'contestant-entity-selection-group-heading'
    },
    nothingToEdit: {
      // The MainContent of the view shown to a signed-in user with nothing to edit.
      container: 'contestant-nothing-to-edit',
      // The <dd> holding the signed-in email.
      email: 'contestant-nothing-to-edit-email',
      // The view's own LogoutButton.
      logout: 'contestant-nothing-to-edit-logout',
      // The view's link to the settings page.
      settingsLink: 'contestant-nothing-to-edit-settings'
    },
    profile: {
      submit: 'profile-submit',
      // imageUpload is the image <Input>'s outermost container (its containerProps testid), and it doubles as the PARENT HANDLE for that Input's error message: the portrait-upload error is addressed as `shared.inputError` chained inside this id, so no element exists on the page purely to be selected. There is deliberately no profile-scoped error id here — the shared one plus this container is the whole contract.
      imageUpload: 'profile-image-upload',
      // The button that clears the entity's image, beside the image field.
      imageRemove: 'profile-image-remove',
      // testids supporting the contestantProfilePage fixture. Placement:
      //  - infoItem: per-question wrapper around each editable info question in the contestantCtx.infoQuestions loop (un-keyed; fixture filters by label text).
      infoItem: 'contestant-profile-info-item',
      // The identity <section>. Carries data-entity-type="candidate" | "organization", data-name-state="editable" | "locked-confirmed" | "locked-answers" and data-entity-loaded="true" | "false".
      identity: 'contestant-profile-identity',
      // The sentence that says whether the name can be changed. Absent in the locked-answers state.
      nameNote: 'contestant-profile-name-note',
      // The two person-name <input>s of a candidate.
      firstName: 'profile-first-name',
      lastName: 'profile-last-name',
      // The outermost containers of an organization's two multilingual fields. Rendered for an organization alone: `name` is the reach marker of the organization profile scans.
      name: 'profile-name',
      shortName: 'profile-short-name',
      // The colour field's outermost container (its containerProps testid) and its hex <input>. Rendered for an organization alone. The field's error message is addressed as `shared.inputError` chained inside `color`.
      color: 'profile-color',
      colorHex: 'profile-color-hex',
      // The always-present alert region above the Save button. Carries data-outcome="failed" | "name-refused" while it holds a message.
      saveMessage: 'profile-save-message',
      // The two buttons that leave the page: one discards the edits, the other is shown when there is nothing to save.
      cancel: 'profile-cancel',
      return: 'profile-return'
    },
    home: {
      statusMessage: 'contestant-home-status',
      logout: 'contestant-home-logout',
      // The <ol> of task rows. Carries data-task-state="pending" | "ready".
      tasks: 'contestant-home-tasks',
      // Each <li> of that list. Carries data-task="nomination" | "profile" | "questions" and data-status="complete" | "incomplete" | "blocked" | "pending".
      task: 'contestant-home-task',
      // The badge of a task row whose task is incomplete: the count of what is left, or a mark when there is nothing to count. Hidden from assistive technology.
      taskBadge: 'contestant-home-task-badge',
      // The three task buttons and the preview entry. The preview carries data-preview="open" | "closed".
      nomination: 'contestant-home-nomination',
      profile: 'contestant-home-profile',
      questions: 'contestant-home-questions',
      preview: 'contestant-home-preview',
      // The main action. Carries data-next-step="nomination" | "profile" | "questions" | "preview"; absent while the task state is pending.
      continue: 'contestant-home-continue',
      // The sentence that says why an entry is closed. Carries data-reason="noNomination" | "previewNotReady". Absent when nothing is closed.
      closedReason: 'contestant-home-closed-reason',
      // The tip shown once every task is complete.
      tip: 'contestant-home-tip',
      // The <li> of the email task: the first row of the task list, a link to the settings page whose label names the address awaiting its confirmation link. Absent unless the account's address is pending.
      emailPending: 'contestant-home-email-pending',
      // Switch profile, at the top of the home: a link to the app root. Absent unless the user edits several entities.
      switchProfile: 'contestant-home-switch-profile'
    },
    nominations: {
      // The nominations page. Carries data-nominations-state="listed" | "empty", data-nominations-locked="true" | "false" for whether the note is shown, and data-nominations-editable="true" | "false" for whether the page offers an entry to the editor.
      page: 'contestant-nominations',
      // The list of the entity's nominations.
      list: 'contestant-nominations-list',
      // One nomination's card. Carries data-confirmed="true" | "false".
      card: 'contestant-nomination',
      // The <dd>s of a card: read with a text assertion.
      election: 'nomination-election',
      constituency: 'nomination-constituency',
      parent: 'nomination-parent',
      electionSymbol: 'nomination-election-symbol',
      state: 'nomination-state',
      // The note under a card whose nomination is not confirmed.
      pendingNote: 'nomination-pending-note',
      // The empty-state sentence. Rendered only for a list known to be empty. Carries data-empty="define" | "locked" | "noElection".
      empty: 'contestant-nominations-empty',
      // The note shown while nominations cannot be edited. Carries data-reason="nominationsLocked" | "nominationsAnswersLocked".
      lockedNote: 'contestant-nominations-locked-note',
      // The page's one main button. Carries data-action="continue" | "return" | "define".
      continue: 'contestant-nominations-continue',
      // The link back to the entity's home, after a main button that leads elsewhere.
      return: 'contestant-nominations-return',
      // A card's Edit and Delete, on a card the editor manages while nominations can be edited.
      cardEdit: 'contestant-nomination-edit',
      cardDelete: 'contestant-nomination-delete',
      // The question a card asks after Delete, and its two buttons.
      deletePrompt: 'contestant-nomination-delete-prompt',
      deleteConfirm: 'contestant-nomination-delete-confirm',
      deleteCancel: 'contestant-nomination-delete-cancel',
      // What a confirmed delete came to: the alert of a refused one, which carries data-outcome, and the status of a done one.
      deleteMessage: 'contestant-nominations-delete-message',
      deleted: 'contestant-nominations-deleted',
      // The link to the editor's entry below the cards, while another nomination can be added.
      add: 'contestant-nominations-add',
      // The line under the parent value of a card whose parent is a name the user typed.
      requestedParent: 'nomination-requested-parent'
    },
    nominationEditor: {
      // The three pages.
      electionsPage: 'contestant-nomination-elections',
      electionsList: 'contestant-nomination-elections-list',
      // The sentence under the group while no election is chosen.
      electionsHint: 'contestant-nomination-elections-hint',
      electionsContinue: 'contestant-nomination-elections-continue',
      constituenciesPage: 'contestant-nomination-constituencies',
      constituenciesList: 'contestant-nomination-constituencies-list',
      // The section that stands in for a selector where the entity holds several nominations in one election.
      constituenciesKept: 'contestant-nomination-constituencies-kept',
      // The sentence shown when the chosen constituency holds no election the entity can stand in.
      constituenciesNoElection: 'contestant-nomination-constituencies-no-election',
      constituenciesContinue: 'contestant-nomination-constituencies-continue',
      // The details page. Carries data-editor-state="loading" | "ready" | "saving" | "error".
      detailsPage: 'contestant-nomination-details',
      changeSelection: 'contestant-nomination-change-selection',
      cards: 'contestant-nomination-details-list',
      // One card. Carries data-card-state="kept" | "new" | "removed", data-confirmed and data-moved, each "true" | "false".
      card: 'nomination-editor-card',
      cardElection: 'nomination-editor-election',
      cardConstituency: 'nomination-editor-constituency',
      cardPreviousConstituency: 'nomination-editor-previous-constituency',
      cardState: 'nomination-editor-state',
      confirmedNote: 'nomination-editor-confirmed-note',
      newNote: 'nomination-editor-new-note',
      // The symbol field's container, and its control.
      symbol: 'nomination-editor-symbol',
      symbolInput: 'nomination-editor-symbol-input',
      // The parent group of a card: the selector's root, under the id the page gives it.
      parent: 'nomination-editor-parent',
      // The name field of "Other": its container, and its control.
      other: 'nomination-editor-other',
      otherInput: 'nomination-editor-other-input',
      otherError: 'nomination-editor-other-error',
      remove: 'nomination-editor-remove',
      keep: 'nomination-editor-keep',
      removedNote: 'nomination-editor-removed-note',
      // The alert above the main button. Carries data-outcome="invalid" | "changed" | "hasCandidates" | "tooManyPending" | "failed".
      saveMessage: 'contestant-nomination-save-message',
      // The main button of the details page. Carries data-action="continue" | "return".
      submit: 'contestant-nomination-submit',
      // Cancel, on every step.
      cancel: 'contestant-nomination-cancel'
    },
    questions: {
      card: 'contestant-questions-card',
      cardAction: 'contestant-questions-card-action',
      list: 'contestant-questions-list',
      start: 'contestant-questions-start',
      answerInput: 'contestant-questions-answer',
      commentInput: 'contestant-questions-comment',
      saveButton: 'contestant-questions-save',
      // The sentence beside the Save button that says why it is disabled while the question is unanswered.
      saveReason: 'contestant-questions-save-reason',
      // testids supporting the candidate fixture library's strict locator surface. Placement:
      //  - categoryExpander: questions overview <Expander> wrapper (un-keyed, filtered by hasText per category in fixture).
      //  - hero: figure inside the {#snippet hero()} block on the question page (parity with voter-questions-hero).
      //  - intro: the empty-state intro <div> shown when no answers exist.
      categoryExpander: 'contestant-questions-category-expander',
      hero: 'contestant-questions-hero',
      intro: 'contestant-questions-intro',
      // The neutral page of an entity with no opinion questions, and its one button.
      none: 'contestant-questions-none',
      noneReturn: 'contestant-questions-none-return'
    },
    settings: {
      newPassword: 'settings-new-password',
      // The password confirmation input's id is `contestant.passwordSetter.confirm`, which PasswordSetter.svelte sets itself.
      updateButton: 'settings-update-password',
      // The locked control holding the account's address, or the pending address while it awaits its link.
      email: 'settings-email',
      // "Send again" for a pending address, the count at the end of its label and its polite status region.
      emailPendingResend: 'settings-email-pending-resend',
      emailPendingCountdown: 'settings-email-pending-countdown',
      emailPendingStatus: 'settings-email-pending-status',
      // "Use another email address": shows the address fields and the save button in its place.
      emailPendingChange: 'settings-email-pending-change',
      // The button that saves another address, and the alert of a save that failed for a reason other than the address.
      emailSave: 'settings-email-save',
      emailError: 'settings-email-error',
      // The page's way back to the app's root.
      return: 'settings-return'
    },
    preview: {
      container: 'contestant-preview-container',
      // The "shown beside its candidates as" line. Rendered for an organization alone: the reach marker of the organization preview scan.
      tag: 'contestant-preview-tag'
    },
    nav: {
      home: 'contestant-nav-home',
      profile: 'contestant-nav-profile',
      questions: 'contestant-nav-questions',
      settings: 'contestant-nav-settings',
      preview: 'contestant-nav-preview',
      nominations: 'contestant-nav-nominations',
      // The reason line under the menu's closed items. Carries the data-reason values of the home's closed-reason sentence.
      closedReason: 'contestant-nav-closed-reason',
      // The entity group's <section>; its heading names the selected entity.
      entityGroup: 'contestant-nav-entity-group',
      // The item that returns to the profile selection screen; rendered only for a user with several profiles.
      switchEntity: 'contestant-nav-switch-entity'
    },
    forgotPassword: {
      // The forgot-password page's root.
      page: 'contestant-forgot-password',
      email: 'forgot-password-email',
      submit: 'forgot-password-submit',
      // The error of the page's email field.
      emailError: 'forgot-password-email-error',
      // The page's way back to where sign-in is.
      return: 'forgot-password-return'
    },
    register: {
      // The registration screen's root. Carries data-modes (the listed modes, space-separated, in order), data-mode-selected and data-register-state="idle" | "checking".
      page: 'contestant-register',
      // One mode's option block, its radio and its open panel. Each carries data-mode.
      modeOption: 'register-mode-option',
      modeInput: 'register-mode-input',
      modePanel: 'register-mode-panel',
      // The error of the group of modes, shown when none is chosen.
      modesError: 'register-modes-error',
      // The identity provider's panel: a form whose Continue starts the provider's flow. Carries data-entity-types (the types it registers, space-separated, in order).
      identityProviderForm: 'register-identity-provider-form',
      // The group that asks which entity type to register, shown when the panel registers several; each of its radios, which carries data-entity-type; and its error, shown after Continue with none chosen.
      entityTypes: 'register-entity-types',
      entityTypeInput: 'register-entity-type-input',
      entityTypesError: 'register-entity-types-error',
      // The email control of the email mode's panel, and its error.
      email: 'register-email',
      emailError: 'register-email-error',
      // The code control and the registration screen's main button.
      code: 'register-code',
      submit: 'register-submit',
      // The error of the code field. Carries data-reason="required" | "unconfirmed".
      codeError: 'register-code-error',
      // The registration screen's link to the sign-in screen, and its way back to the login screen.
      loginLink: 'register-login-link',
      return: 'register-return',
      // The notice the registration screen shows a browser that has confirmed an address: its root, its links to the login and the forgot-password screens, and its Dismiss.
      registeredNotice: 'contestant-register-registered-notice',
      registeredNoticeLogin: 'contestant-register-registered-notice-login',
      registeredNoticeForgotPassword: 'contestant-register-registered-notice-forgot-password',
      registeredNoticeDismiss: 'contestant-register-registered-notice-dismiss',
      // The screen that asks for the address a valid code is registered with: its root, main button and way back.
      emailEntryPage: 'contestant-register-email',
      emailEntrySubmit: 'register-email-submit',
      emailEntryReturn: 'register-email-return',
      // The screen that signs in the holder of a used code: its root and main button. The root carries data-sign-in-state="idle" | "submitting" | "failed".
      signInPage: 'contestant-register-sign-in',
      signInSubmit: 'register-sign-in-submit',
      // That screen's refusal, its password field's error and its link to the forgot-password page.
      signInError: 'register-sign-in-error',
      signInPasswordError: 'register-sign-in-password-error',
      signInForgotPasswordLink: 'register-sign-in-forgot-password-link',
      // That screen's link for a user without a password, to the forgot-password page, and its way back. The link is absent where neither the email nor the identity-provider mode is allowed.
      signInNoPasswordYetLink: 'register-sign-in-no-password-yet-link',
      signInReturn: 'register-sign-in-return'
    },
    // The two fields of the email-entry component, the address and its confirmation, each with its error.
    emailEntry: {
      email: 'email-entry-email',
      confirmation: 'email-entry-confirmation',
      emailError: 'email-entry-email-error',
      confirmationError: 'email-entry-confirmation-error'
    },
    emailSent: {
      // The "email sent" screen's root. Carries data-wording="signIn" | "recovery" | "code", data-address="shown" | "none" and data-resend="waiting" | "ready".
      page: 'contestant-email-sent',
      // The screen's body: its sentences, the support sentence and "Send again".
      panel: 'email-sent-panel',
      // The screen's first sentence, which says that the email was sent.
      intro: 'email-sent-intro',
      // The sentence whose own words are the link to support.
      support: 'email-sent-support',
      // The address the request was made for, where one was typed: the bold text inside the first sentence.
      address: 'email-sent-address',
      // The button that repeats the request, and the count of the wait at the end of its label.
      resend: 'email-sent-resend',
      countdown: 'email-sent-countdown',
      // The polite status region.
      status: 'email-sent-status',
      // The sentence shown when this tab asked for the same address, or with the same code, before the wait had passed.
      askedAgain: 'email-sent-asked-again',
      // The link to the screen that asked for the address, and the way back.
      changeAddress: 'email-sent-change-address',
      return: 'email-sent-return'
    },
    setPasswordGate: {
      // The set-password view's root. Carries data-set-password-state="idle" | "saving" | "failed".
      container: 'contestant-set-password-gate',
      // The account's address, the message of a failed save, and the button that signs the user out.
      email: 'set-password-email',
      error: 'set-password-error',
      logout: 'set-password-logout'
    },
    identityProviderError: {
      // The identity provider's error screen. Carries data-error-class="cancelled" | "retry" | "noRetry".
      page: 'contestant-identity-provider-error',
      // The class's sentence.
      message: 'identity-provider-error-message',
      // The link to the registration page with the provider's option open, rendered while that mode is listed, and the way back to the login screen.
      tryAgain: 'identity-provider-error-try-again',
      return: 'identity-provider-error-return',
      // The sentence of the classes trying again may cure, whose own words are the link to support.
      support: 'contestant-identity-provider-error-support'
    },
    identityProviderGate: {
      // The identity provider's view, shown in place of a protected page. Carries data-variant="new" | "returning", data-address-state="none" | "pending" | "proved", data-asks (space-separated: "email", "name"; '' with no form) and data-gate-state="idle" | "saving" | "failed".
      container: 'contestant-identity-provider-gate',
      // The variant's sentence, and the address shown with its label when there is nothing to ask.
      lead: 'identity-provider-gate-lead',
      address: 'identity-provider-gate-address',
      // The party's name and abbreviation fields, and the name's error.
      name: 'identity-provider-gate-name',
      nameError: 'identity-provider-gate-name-error',
      shortName: 'identity-provider-gate-short-name',
      // The button that mails the link again, the count of its wait at the end of its label, and the polite status region.
      resend: 'identity-provider-gate-resend',
      countdown: 'identity-provider-gate-countdown',
      status: 'identity-provider-gate-status',
      // The button that gives another address in place of the pending one.
      changeAddress: 'identity-provider-gate-change-address',
      // The main button, the message of a failed save, and the button that signs the user out.
      submit: 'identity-provider-gate-submit',
      error: 'identity-provider-gate-error',
      logout: 'identity-provider-gate-logout'
    },
    passwordReset: {
      // The password-reset page's root.
      page: 'contestant-password-reset',
      // The account's address, and the message of a failed save. The page's main button is the password setter's `password.submit`.
      email: 'password-reset-email',
      error: 'password-reset-error'
    },
    terms: {
      checkbox: 'terms-checkbox',
      // The advance button of the terms-of-use view. It lives in the view itself (lib/contestant/gates/TermsOfUseGate.svelte), inside its {#snippet primaryActions()} block — NOT inside TermsOfUseForm.svelte, which renders only the checkbox.
      submit: 'terms-of-use-submit',
      // The box by which the user opts out of the collection of usage data (lib/contestant/components/termsOfUse/TrackingOptOut.svelte). The view renders it after the form, only while there is a consent choice to make.
      trackingOptOut: 'terms-tracking-opt-out'
    },
    help: {
      home: 'contestant-help-home'
    },
    privacy: {
      home: 'contestant-privacy-home'
    },
    password: {
      field: 'password-field',
      /** A shared test id for reset and register password setters */
      submit: 'set-password-submit'
    },
    passwordSetter: {
      password: 'password-setter-password',
      confirm: 'password-setter-confirmation',
      // The error of the password field, and of its confirmation.
      passwordError: 'password-setter-password-error',
      confirmationError: 'password-setter-confirmation-error'
    }
  },
  auth: {
    confirm: {
      // The confirm page's root, between a mailed link and its verification. Carries data-type, the link's type.
      page: 'auth-confirm-page',
      // The button that posts the form and verifies the link.
      continue: 'auth-confirm-continue',
      // The link back to the signed-in account's app. Rendered only while the browser is signed in.
      cancel: 'auth-confirm-cancel',
      // The sentence that says the browser is signed in and that continuing signs it out. Rendered only while it is.
      signedIn: 'auth-confirm-signed-in'
    }
  },
  voter: {
    home: {
      startButton: 'voter-home-start',
      // stable page-content load anchor on the home `MainContent` root <div> (apps/frontend/src/routes/(voters)/+page.svelte). Unlike `startButton` (an action that is HIDDEN under access.voterApp=false maintenance mode), this anchor confirms "the home page content loaded" so `voterHomePage.expectPageVisible()` checks page-load, not action presence.
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
    // Shown by (voters)/(located)/+layout.svelte when one or more selected elections lacks any nomination in the selected constituency — opens automatically on first /questions or /results entry after the layout's nomination-availability check settles.
    missingNominationsModal: 'voter-missing-nominations-modal',
    intro: {
      startButton: 'voter-intro-start',
      // stable page-content load anchor on the intro `MainContent` root <div> (apps/frontend/src/routes/(voters)/intro/+page.svelte). Confirms the intro page content loaded, independent of the action button.
      page: 'voter-intro'
    },
    questions: {
      answerOption: 'question-choice',
      heading: 'voter-questions-heading',
      nextButton: 'question-next',
      previousButton: 'question-previous',
      // Question-input locators, used by the answerNumberScale / answerMultiChoice fixtures, the MultipleText round-trip and the voter-journey answer walk. Values match the component-side data-testid strings:
      //  - numberSlider / numberValue: NumberScaleInput.svelte native range + live value label.
      //  - multipleText*: parts/MultipleTextPart.svelte row-list add/remove/reorder controls, candidate info-question input. One row field renders per displayed locale, so the row count still equals the row-list length while translations are hidden.
      //  - choiceHelper: QuestionChoices.svelte multi-select helper text (select-range / select-exact) rendered outside the choice grid.
      numberSlider: 'question-number-slider',
      numberValue: 'question-number-value',
      // NumberScaleInput.svelte root <div> (both answer + display modes). Scopes the dual-marker display-mode readout inside an entity-detail opinion block.
      numberScaleInput: 'number-scale-input',
      // NumberScaleInput.svelte display-mode answer markers, each encoding its value in a `left: {pct}%` inline style. The voter marker is also the single combined marker rendered when both answers are equal.
      numberScaleVoterMarker: 'number-scale-voter-marker',
      numberScaleEntityMarker: 'number-scale-entity-marker',
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
      // hero + info testids on the voter question page + the question-category intro page.
      hero: 'voter-questions-hero',
      categoryHero: 'voter-questions-category-hero',
      infoButton: 'voter-questions-info-button',
      // Extended-info / arguments / terms surface (consumed by the expectInfoMode / expectInfoSections / expectArguments readers).
      //  - popupInfoButton: the <Button> on QuestionExtendedInfoButton.svelte that opens the interactiveInfo modal/drawer (popup mode). Renders only when appSettings.questions.interactiveInfo.enabled && !customData.video.
      //  - popupInfoModal: the modal/drawer body (QuestionExtendedInfo root rendered inside the Drawer) so expectInfoMode(q,'popup') can assert the open modal.
      //  - infoSection: per-customData.infoSections section (keyed by index) on QuestionExtendedInfo.svelte so expectInfoSections([...]) can enumerate.
      //  - argumentsExpander: the collapsible Arguments block wrapper on QuestionExtendedInfo.svelte (sibling to the per-index infoSection blocks). Its content (the per-group blocks) mounts only when expanded, so expectArguments expands it before reading the group.
      //  - argumentGroup: per-argument group on QuestionArguments.svelte. For categorical questions the group is keyed by choiceId (mirrors the keyed feedback-rating-{value} pattern); non-categorical groups fall back to the argument type. So expectArguments(q,type) can target a group.
      //  - termTrigger: the in-text <Term> trigger span (QuestionHeading.svelte) and
      //  - termPopup: its definition popup (Term.svelte) — so the voter journey can hover/read the term affordance + definition.
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
      // The results list's OUTER container — the node ABOVE the deliberate `{#key}` remount in the results leaf `+page.svelte`. `list` beside it sits on `EntityListWithControls`, which that `{#key}` remounts ON PURPOSE when the `election:entityType` scope tuple changes, so per-scope filter UI state is discarded. A did-not-remount (node-identity) assertion across an ENTITY-TAB SWITCH must therefore target THIS id; aiming it at `list` produces a test that fails for a correct reason and then gets "fixed" by weakening it. For the entity open/close case `list` is the right node — nothing keys on the `entity`/`id` params.
      listContainer: 'voter-results-list-container',
      noNominationsWarning: 'voter-results-no-nominations-warning',
      card: 'entity-card',
      cardTitle: 'entity-card-title',
      // The card's type label, e.g. "candidate" or "party"; rendered only by a card that shows its type.
      cardType: 'entity-card-type',
      // The link or button a clickable card or card header is wrapped in.
      cardAction: 'entity-card-action',
      candidateSection: 'voter-results-candidate-section',
      partySection: 'voter-results-party-section',
      allianceSection: 'voter-results-alliance-section',
      entityTabs: 'voter-results-entity-tabs',
      ingress: 'voter-results-ingress',
      electionAccordion: 'voter-results-election-select',
      // testids for the resultsPage / entityFilters / entityDetails fixture surface.
      listControls: 'entity-list-controls',
      listSearch: 'entity-list-search',
      listWithControls: 'entity-list-with-controls',
      filterButton: 'entity-list-filter',
      entityDetails: 'entity-details',
      infoItem: 'info-item',
      // MatchScore.svelte list-card callout (the "<n>%" readout in the card header). Distinct from `scoreGauge` (`score-gauge`), which only renders inside the entity-details SubMatches drawer. Read scoped to a single org card to assert the exact per-mode organization score.
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
      // Renders only `{#if values.length > 3}` and its label flips selectAll/unselectAll via `allSelected` — it is ONE toggle, not two buttons. The entityFilters fixture clicks it to select-all when not-all-selected and to select-none when all-selected.
      filterSelectAllToggle: 'entity-filter-select-all-toggle'
    },
    entityDetail: {
      container: 'voter-entity-detail',
      infoTab: 'voter-entity-detail-info',
      opinionsTab: 'voter-entity-detail-opinions',
      childrenTab: 'voter-entity-detail-children',
      // Wraps a single opinion-question display block inside EntityOpinions.svelte (heading + optional missing-answer message + optional OpinionQuestionInput).
      // Consumed by the entityDetails fixture's expectQuestionDisplay.
      opinionQuestion: 'entity-opinion-question',
      // sr-only sibling marker on QuestionChoices.svelte's radio whose `otherSelected == id` (i.e. the entity's chosen answer in display mode).
      // Used by the voter-journey classifyVoterEntityRows helper.
      entitySelectedAnswer: 'entity-selected-answer',
      // testid on the QuestionOpenAnswer wrapper rendered inside EntityOpinions.svelte when the candidate has authored info AND customData.allowOpen is not false. Used by the perm-disable-allow-open voter-side assertion to verify Q1 info visible / Q2 info hidden.
      opinionOpenAnswer: 'entity-opinion-open-answer'
    },
    nav: {
      resultsLink: 'voter-nav-results'
    },
    about: {
      content: 'voter-about-content',
      returnButton: 'voter-about-return',
      // Dedicated testid on the about.organizationMatching disclosure block on the About page (rendered only when matching.organizationMatching !== 'none').
      // Tighter than the coarse voter-about-content anchor, so a spec can assert the org-matching disclosure specifically.
      organizationMatching: 'voter-about-organization-matching'
    },
    info: {
      content: 'voter-info-content',
      returnButton: 'voter-info-return',
      // Data-dependent anchor on the info page's `{#each ctx.dataRoot.elections}` election region (apps/frontend/src/routes/(voters)/info/+page.svelte).
      // Distinct from the static `voter-info-content` {@html} div — this region is EMPTY when dataRoot.elections is stale, so it is the correct cold-entry regression anchor.
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
    maintenancePage: 'maintenance-page',
    loading: 'loading-indicator',
    questionActions: 'question-actions',
    questionDelete: 'question-delete',
    navigation: {
      menu: 'nav-menu',
      menuItem: 'nav-menu-item',
      // Locale-independent open-menu anchor on the Header menu-toggle button (Header.svelte). Used by the voterNav fixture to open the drawer in any UI locale (the English-only /open menu/i regex fails on /fi).
      menuToggle: 'nav-menu-toggle'
    },
    // testids supporting the langSelectorFixture + multilingualTextFieldFixture function-fixtures.
    //  - langSelector: on the LanguageSelection.svelte NavGroup, gates on `locales.current.length > 1`. Absent when single-locale.
    //  - multilingualToggle: on the Input.svelte translation-toggle Button, gates on `multilingual && locales.length > 1`. Absent when `customData.disableMultilingual=true` OR single-locale.
    langSelector: 'lang-selector',
    multilingualToggle: 'multilingual-toggle',
    // testid on the inline ErrorMessage in Input.svelte. Shared across every input type, so selecting it page-wide is only safe when exactly one Input can be in error at that moment; otherwise chain it inside the owning Input's containerProps testid. Consumed unscoped by the contestant-journey invalidUrl step (single Input in error there) and chained inside `contestant.profile.imageUpload` by the contestantProfilePage fixture's portrait-upload assertion, where sibling Inputs can also carry errors.
    inputError: 'input-error',
    // testid on the root <span> of ElectionTag.svelte. Consumed by perm-hide-election-tags spec to assert absence when elections.showElectionTags=false.
    electionTag: 'election-tag',
    // testid on the root <span> of CategoryTag.svelte. Consumed by perm-hide-category-tags spec to assert absence when questions.showCategoryTags=false.
    categoryTag: 'category-tag',
    // testids on the feedback + help Buttons in Banner.svelte. Consumed by perm-header-show-feedback + perm-header-show-help specs to assert visibility when header.showFeedback / header.showHelp is true.
    header: {
      feedback: 'header-feedback',
      help: 'header-help'
    },
    entitySelector: {
      // The group. Carries data-selected-kind="entity" | "none" | "other" | "unlisted" | "".
      root: 'entity-selector',
      // One option's row. Carries data-option-kind="entity" | "none" | "other" | "unlisted" and data-option-value.
      option: 'entity-selector-option',
      optionInput: 'entity-selector-option-input',
      optionHint: 'entity-selector-option-hint',
      // The line shown when no entity is listed.
      empty: 'entity-selector-empty',
      error: 'entity-selector-error'
    },
    // Used in image-type Hero and necessary because the img tag cannot be located by role due to empty alt text
    image: 'image-img',
    // Generic Video component root <div> testid (Video.svelte). Shared between the voter + contestant apps. The element is class:hidden-not-destroyed (hidden when !hasContent), so expectVideo(true) asserts toBeVisible() and expectVideo(false) asserts not.toBeVisible() — NOT mount/unmount churn.
    video: 'video',
    // Distinct root testids on the results feedback + survey popups (FeedbackPopup / SurveyPopup Alert roots). Distinct so the dismiss-and-reload helper can assert each popup's dismiss-persistence independently.
    feedbackPopup: 'feedback-popup',
    surveyPopup: 'survey-popup',
    // Root <div> testid on SurveyBanner.svelte — the survey prompt rendered on the frontpage / entityDetails surfaces when survey.showIn includes that surface.
    // Consumed by the perm-show-feedback-survey showIn-surface audit.
    surveyBanner: 'survey-banner'
  }
} as const;
