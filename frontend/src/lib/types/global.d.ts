export {};

declare global {
  /**
   * Non-exhaustive specification of the app labels.
   * TODO: Comletely specify available labels here and convert all $_
   * calls that depend on i18n/en.json to using AppLabels instead.
   */
  interface AppLabels {
    name: string;
    appTitle: string;
    locale: string;
    actionLabels: {
      id: string;
      startButton: string;
      electionInfo: string;
      howItWorks: string;
      help: string;
      searchMunicipality: string;
      startQuestions: string;
      selectCategories: string;
      previous: string;
      answerCategoryQuestions: string;
      readMore: string;
      skip: string;
      filter: string;
      alphaOrder: string;
      bestMatchOrder: string;
      addToList: string;
      candidateBasicInfo: string;
      candidateOpinions: string;
      home: string;
      constituency: string;
      opinions: string;
      results: string;
      yourList: string;
    };
    viewTexts: {
      id: string;
      toolTitle: string;
      toolDescription: string;
      publishedBy: string;
      madeWith: string;
      selectMunicipalityTitle: string;
      selectMunicipalityDescription: string;
      yourConstituency: string;
      yourOpinionsTitle: string;
      yourOpinionsDescription: string;
      questionsTip: string;
      yourCandidatesTitle: string;
      yourCandidatesDescription: string;
      yourPartiesTitle: string;
      yourPartiesDescription: string;
    };
  }

  /**
   * The properties of a Candidate object that can be passed onto the
   * related components.
   * TODO: This may be deprecated later by the `vaa-data` module.
   */
  interface CandidateProps {
    answers: {
      questionId: string;
      answer: number;
      openAnswer?: string;
    }[];
    candidateNumber: string | number;
    electionRound: number;
    electionSymbol: string;
    firstName: string;
    id: string;
    lastName: string;
    motherTongues: string[];
    otherLanguages: string[];
    party: {
      name: string;
      shortName: string;
    };
    // photo
    politicalExperience: string;
  }

  /**
   * The properties of an Election object
   */
  interface ElectionProps {
    electionDate: string;
    id: string;
    locale: string;
    name: string;
    shortName: string;
    type: string;
  }

  /**
   * Supported types of Questions.
   * TODO: This may be deprecated later by the `vaa-data` module.
   */
  type QuestionType = 'Likert';

  /**
   * The properties of a Question object that can be passed onto the
   * related components.
   * TODO: This may be deprecated later by the `vaa-data` module.
   */
  interface QuestionProps {
    id: string;
    text: string;
    type: QuestionType;
    options: {key: number; label: string}[];
    category?: string;
    info?: string;
  }

  /**
   * These conform to `vaa-matching.Match`
   */
  interface RankingProps {
    // distance: number;
    // entity: {
    //   id: string;
    // }
    score: number;
    subMatches?: {
      // distance: number;
      score: number;
      questionGroup: {
        label?: string;
      };
    }[];
  }
}
