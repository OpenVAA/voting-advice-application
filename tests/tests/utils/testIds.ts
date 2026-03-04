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
      password: 'password-field',
      submit: 'login-submit',
      errorMessage: 'login-errorMessage'
    },
    profile: {
      submit: 'profile-submit',
      imageUpload: 'profile-image-upload'
    },
    home: {
      statusMessage: 'candidate-home-status'
    },
    questions: {
      card: 'candidate-questions-card',
      answerInput: 'candidate-questions-answer',
      commentInput: 'candidate-questions-comment',
      saveButton: 'candidate-questions-save',
      nextButton: 'candidate-questions-next',
      previousButton: 'candidate-questions-previous'
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
      password: 'register-password',
      confirmPassword: 'register-confirm-password',
      submit: 'register-submit'
    }
  },
  voter: {
    home: {
      startButton: 'voter-home-start'
    },
    elections: {
      list: 'voter-elections-list',
      card: 'election-selector-option'
    },
    constituencies: {
      list: 'voter-constituencies-list',
      item: 'voter-constituencies-item'
    },
    intro: {
      startButton: 'voter-intro-start'
    },
    questions: {
      card: 'voter-questions-card',
      answerOption: 'question-choice',
      nextButton: 'question-next',
      previousButton: 'question-previous',
      categoryIntro: 'voter-questions-category-intro'
    },
    results: {
      list: 'voter-results-list',
      card: 'entity-card',
      candidateSection: 'voter-results-candidate-section',
      partySection: 'voter-results-party-section'
    },
    entityDetail: {
      container: 'voter-entity-detail',
      infoTab: 'voter-entity-detail-info',
      opinionsTab: 'voter-entity-detail-opinions',
      submatchesTab: 'voter-entity-detail-submatches'
    },
    nav: {
      resultsLink: 'voter-nav-results'
    }
  },
  shared: {
    errorMessage: 'error-message',
    loading: 'loading-indicator',
    questionActions: 'question-actions',
    questionDelete: 'question-delete',
    navigation: {
      menu: 'nav-menu',
      menuItem: 'nav-menu-item'
    }
  }
} as const;
