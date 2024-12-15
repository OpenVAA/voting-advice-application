import type { DynamicSettings } from './dynamicSettings.type';

export const dynamicSettings: DynamicSettings = {
  entityDetails: {
    contents: {
      candidate: ['info', 'opinions'],
      organization: ['info', 'candidates', 'opinions']
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
    }
  },
  matching: {
    minimumAnswers: 5,
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
    showResultsLink: true
  },
  results: {
    cardContents: {
      candidate: ['submatches'],
      organization: ['candidates']
    },
    showFeedbackPopup: 180,
    showSurveyPopup: 500,
    sections: ['candidate', 'organization']
  },
  elections: {
    disallowSelection: false
  },
  underMaintenance: false
};
