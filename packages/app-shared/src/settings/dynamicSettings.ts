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
    interactiveInfo: {
      enabled: false
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
  underMaintenance: false,
  llm: {
    prompt:
      '1. Read all the examples of election machine statements below, with which the user can either agree or disagree, as well as the related brief background information. 2. Create a short text of a few sentences for the statement that explains what the current state of the matter presented in the statement is. 4. If the statement contains terms that may be unclear to ordinary people, add a one-sentence explanation for each term. Add them under terms. 5. Present these texts according to the JSON format below. 6. Return only the JSON-formatted response. Answer only with a valid JSON-formatted response. Do not add formatting to the response. In the case of no ',
    answerFormat: `
    {
      "infoSections": [
        {
          "background": {
            "text": {
              "en": "Generated background here",
              "fi": "Generated background here suomeksi",
              "sv": "Generated background here in swedish"
            },
            "title": {
              "en": "Background"
            },
            "visible": true
          },
          "situation": {
            "text": {
              "en": "Generated situation summary here",
              "fi": "Generated situation summary here in Finnish",
              "sv": "Generated situation summary here in Swedish"
            },
            "title": {
              "en": "Current Situation",
              "fi": "Current Situation",
              "sv": "Current Situation"
            },
            "visible": true
          },
          "terms": [
            {
              "term": {
                "definition_en": "Explanation for term",
                "definition_fi": "Selitys termille",
                "definition_sv": "Förklaring av term"
              }
            }
          ]
        }
      ]
    }
    `
  }
};
