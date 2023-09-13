/**
 * Non-exhaustive specification of the data returned by the Strapi endpoint `election`.
 * Currently we're only interested in the appLabels id.
 */
export interface StrapiElectionData {
  id: string;
  attributes: {
    name: string;
    electionAppLabel: {
      data: StrapiAppLabelsData;
    };
  };
}

/**
 * Non-exhaustive specification of the app labels
 */
export interface StrapiAppLabelsData {
  id: string;
  attributes: {
    name: string;
    appTitle: string;
    actionLabels: Record<string, string>;
    viewTexts: Record<string, string>;
  };
}

/**
 * Non-exhaustive specification of the data returned by the Strapi endpoint `question-type`.
 */
export interface StrapiQuestionTypeData {
  id: number | string;
  attributes: {
    name: string;
    info: string;
    questions: {
      data: StrapiQuestionData[];
    };
    settings: {
      /**
       * Currently the only question type supported. Should match `QuestionType` in
       * `$lib/components/questions/Question.type`
       */
      type: 'Likert';
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
 * Non-exhaustive specification of the data returned by the Strapi endpoint `nomination`.
 */
export interface StrapiNominationData {
  id: number | string;
  attributes: {
    electionSymbol: string;
    electionRound: number;
    type?: string;
    candidate: {
      data: StrapiCandidateData;
    };
    constituency: {
      data: StrapiConstituencyData;
    };
    election: {
      data: StrapiElectionData;
    };
    party: {
      data: StrapiPartyData;
    };
  };
}

/**
 * Non-exhaustive specification of the data returned by the Strapi endpoint `constitucency`.
 */
export interface StrapiConstituencyData {
  id: number | string;
  attributes: {
    name: string;
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
      key: number;
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
