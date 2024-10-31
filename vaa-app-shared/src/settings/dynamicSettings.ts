import type {DynamicSettings} from '../';

export const dynamicSettings: DynamicSettings = {
  entityDetails: {
    contents: {
      candidate: ['info', 'opinions'],
      party: ['info', 'candidates', 'opinions']
    },
    showMissingElectionSymbol: {
      candidate: true,
      party: false
    },
    showMissingAnswers: {
      candidate: true,
      party: true
    }
  },
  header: {
    showFeedback: true,
    showHelp: true,
  },
  headerStyle: {
    dark: {
      overImgBgColor: "transparent"
    },
    light: {
      overImgBgColor: "transparent",
    },
    imgSize: "cover",
    imgPosition: "center"
  },
  entities: {
    hideIfMissingAnswers: {
      candidate: true
    }
  },
  matching: {
    minimumAnswers: 5,
    partyMatching: 'median'
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
      party: ['candidates']
    },
    showFeedbackPopup: 180,
    showSurveyPopup: 500,
    sections: ['candidate', 'party']
  },
  underMaintenance: false
};
