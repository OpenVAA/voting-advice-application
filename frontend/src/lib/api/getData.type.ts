import type {QuestionType} from '$lib/components/questions';

/**
 * Non-exhaustive specification of the data returned by the Strapi endpoint `question-type`.
 */
export interface StrapiQuestionTypeData {
  id: number | string;
  attributes: {
    name: string;
    info: string;
    questions: {
      // To get StrapiQuestionData.category property populated, we need a more specific call
      data: StrapiQuestionData[];
    };
    settings: {
      type: QuestionType;
      values: {
        key: number;
        label: string;
      }[];
    };
  };
}

/**
 * Non-exhaustive specification of the data returned by the Strapi endpoint `question`.
 */
export interface StrapiQuestionData {
  id: number | string;
  attributes: {
    text: string;
    info: string;
    questionCategory: {
      data: {
        attributes: {
          name: string;
        };
      };
    };
  };
}

/**
 * Non-exhaustive specification of the data returned by the Strapi endpoint `candidate`.
 */
export interface StrapiCandidateData {
  id: number | string;
  attributes: {
    answers: {
      data: StrapiAnswerData[];
    };
    // TODO: Change
    candidateNumber: string;
    firstName: string;
    lastName: string;
    motherTongues: {
      data: StrapiLanguageData[];
    };
    otherLanguages: {
      data: StrapiLanguageData[];
    };
    party: {
      data: StrapiPartyData;
    };
    photo: {
      data?: string;
    };
    politicalExperience: string;
  };
}

export interface StrapiAnswerData {
  id: number | string;
  attributes: {
    answer: {
      // TODO: Change to match new specs {type: string, values: [{key: number, label: string}]}
      data: {
        key: number;
      };
    };
    question: {
      data: {
        // There are more properties here, but not relations unless they are explicitly populated
        // We're, however, only interested in the ids (although we could actually load all of the
        // question data at the same time...)
        id: number | string;
      };
    };
  };
}

export interface StrapiLanguageData {
  id: number | string;
  attributes: {
    localisationCode: string;
    name: string;
  };
}

export interface StrapiPartyData {
  id: number | string;
  attributes: {
    mainColor: string;
    info: string;
    name: string;
    shortName: string;
  };
}
