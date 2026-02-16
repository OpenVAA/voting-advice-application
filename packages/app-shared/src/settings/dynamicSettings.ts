import type { DynamicSettings } from './dynamicSettings.type';

export const dynamicSettings: DynamicSettings = {
  entityDetails: {
    contents: {
      candidate: ['info', 'opinions'],
      organization: ['info', 'candidates']
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
      allowCategorySelection: true,
      show: false
    },
    showCategoryTags: true,
    showResultsLink: false
  },
  results: {
    cardContents: {
      candidate: [],
      organization: ['candidates']
    },
    showFeedbackPopup: undefined,
    showSurveyPopup: undefined,
    sections: ['organization', 'candidate']
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
