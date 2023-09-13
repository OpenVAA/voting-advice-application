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
    actionLabels: Record<string, string>;
    viewTexts: Record<string, string>;
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
