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
    showFeedback: true,
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
    }
  },
  matching: {
    minimumAnswers: 1,
    organizationMatching: 'median'
  },
  questions: {
    categoryIntros: {
      allowSkip: true,
      show: true
    },
    questionsIntro: {
      allowCategorySelection: true,
      show: true
    },
    showCategoryTags: true,
    showResultsLink: false
  },
  results: {
    cardContents: {
      candidate: ['submatches'],
      organization: ['candidates']
    },
    showFeedbackPopup: 60,
    showSurveyPopup: 180,
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
    underMaintenance: false,
    answersLocked: false
  },
  notifications: {
    candidateApp: undefined,
    voterApp: undefined
  }
};
