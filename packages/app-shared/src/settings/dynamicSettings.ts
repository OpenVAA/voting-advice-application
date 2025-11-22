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
    showAllNominations: false
  },
  matching: {
    minimumAnswers: 3,
    organizationMatching: 'answersOnly',
    questionWeights: 'half-normal-double'
  },
  questions: {
    categoryIntros: {
      allowSkip: false,
      show: false
    },
    interactiveInfo: {
      enabled: false
    },
    questionsIntro: {
      allowCategorySelection: false,
      show: true
    },
    resultsPreview: {
      enabled: true,
      entityType: 'organization',
      numResults: 6,
      hideLabel: true
    },
    showCategoryTags: false,
    showResultsLink: true
  },
  results: {
    cardContents: {
      candidate: ['submatches'],
      organization: []
    },
    showFeedbackPopup: 30,
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
    underMaintenance: false,
    answersLocked: false
  },
  notifications: {
    candidateApp: null,
    voterApp: null
  },
  testConditions: {
    control: {
      questions: {
        resultsPreview: {
          enabled: false
        }
      }
    }
  }
};
