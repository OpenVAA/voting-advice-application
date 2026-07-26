import type { DynamicSettings } from './dynamicSettings.type';

export const dynamicSettings: DynamicSettings = {
  entityDetails: {
    contents: {
      candidate: ['info', 'opinions'],
      organization: ['opinions', 'info']
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
    showFeedback: false,
    showHelp: false
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
    showAllNominations: false
  },
  matching: {
    minimumAnswers: 5,
    organizationMatching: 'answersOnly'
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
      candidate: ['submatches'],
      organization: ['submatches']
    },
    showFeedbackPopup: 180,
    showSurveyPopup: 500,
    sections: ['organization']
  },
  elections: {
    disallowSelection: false,
    showElectionTags: true,
    startFromConstituencyGroup: undefined
  },
  access: {
    candidateApp: false,
    voterApp: true,
    adminApp: false,
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
