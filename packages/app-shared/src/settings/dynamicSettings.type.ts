import type { ENTITY_TYPE, EntityType } from '@openvaa/data';

/**
 * These settings can be set either by editing the `dynamicSettings.ts` file or overwritten with settings loaded by the `DataProvider`.
 */
export type DynamicSettings = {
  /**
   * Settings related to a user survey. If not defined, no survey will be shown.
   */
  survey?: {
    /**
     * The link to the survey. This is passed to the translation function, which will replace `{sessionId}` with the URL-encoded session id if available or an empty string otherwise.
     */
    linkTemplate: string;
    /**
     * Where the survey prompt should be shown. The `resultsPopup` option means that the survey will be shown in a popup after a timeout starting when the user reaches the results page. Use `results.showSurveyPopup` to set the delay.
     */
    showIn: Array<'frontpage' | 'entityDetails' | 'navigation' | 'resultsPopup'>;
  };
  /**
   * Settings related to the entity details view, i.e. the pages for individual candidates and parties.
   */
  entityDetails: {
    /**
     * Which content tabs to show.
     */
    contents: {
      /**
       * The content tabs to show for candidates.
       */
      [ENTITY_TYPE.Candidate]: Array<EntityDetailsContent>;
      /**
       * The content tabs to show for parties.
       */
      [ENTITY_TYPE.Organization]: Array<EntityDetailsContent | OrganizationDetailsContent>;
    };
    /**
     * Whether to show a marker for missing election symbol in entity details, e.g. 'Election Symbol: --', or hide missing items completely. The marker, if shown, is defined in the translations.
     */
    showMissingElectionSymbol: Partial<Record<EntityType, boolean>>;
    /**
     * Whether to show a marker for missing answers in entity details as, e.g. 'Age: --', or hide missing items completely. The marker, if shown, is defined in the translations. This only applies to non-opinion questions.
     */
    showMissingAnswers: Partial<Record<EntityType, boolean>>;
  };
  /**
   * Settings related to the actions in the app header.
   */
  header: {
    /**
     * Whether to show the feedback icon by default in the header.
     */
    showFeedback: boolean;
    /**
     * Whether to show the help icon by default in the header.
     */
    showHelp: boolean;
  };
  /**
   * Settings related to app header styling
   */
  headerStyle: {
    dark: {
      bgColor?: string;
      overImgBgColor?: string;
    };
    light: {
      bgColor?: string;
      overImgBgColor?: string;
    };
    imgSize?: string;
    imgPosition?: string;
  };
  /**
   * Settings controlling which entities are shown in the app.
   */
  entities: {
    /**
     * Settings controlling whether entites with missing answers should be shown. This is currently only supported for candidates.
     */
    hideIfMissingAnswers: {
      /**
       * Whether to hide candidates with missing answers in the app.
       */
      [ENTITY_TYPE.Candidate]: boolean;
    };
  };
  /**
   * Settings related to the matching algorithm.
   */
  matching: {
    /**
     * The minimum number of voter answers needed before matching results are available.
     */
    minimumAnswers: number;
    /**
     * The method with which parties are matched. • None: no party matching is done • answersOnly: matching is only performed on the parties explicit answers • Mean/Median: missing party answers are replaced with the mean, median or mode of the party's candidates' answers. Nb. Mode is not yet implemented because of difficulty of handling multiple modes when the counts are tied.
     */
    organizationMatching: 'none' | 'answersOnly' | 'mean' | 'median';
  };
  /**
   * Settings related to the question view.
   */
  questions: {
    /**
     * Settings related to the optional category intro pages.
     */
    categoryIntros?: {
      /**
       * Whether to allow the user to skip the whole category.
       */
      allowSkip?: boolean;
      /**
       * Whether to show category intro pages before the first question of each category.
       */
      show: boolean;
    };
    /**
     * Settings related to the optional questions intro page, shown before going to questions.
     */
    questionsIntro: {
      /**
       * Whether to allow the user to select which categories to answer if there are more than one.
       * NB. If the app has multiple elections with different question applicable to each, category selection may result in cases where the user does not select enough questions to get any results for one or more elections, regardless of the minimum number of answers required. In such cases, consider setting this to `false`.
       */
      allowCategorySelection?: boolean;
      /**
       * Whether to show the questions intro page.
       */
      show: boolean;
    };
    /**
     * Whether to show the category tag along the question text.
     */
    showCategoryTags: boolean;
    /**
     * Whether to the link to results in the header when answering questions if enough answers are provided.
     */
    showResultsLink?: boolean;
  };
  /**
   * Settings related to the results view.
   */
  results: {
    /**
     * Settings related to the contents of the entity cards in the results list and entity details.
     */
    cardContents: {
      /**
       * The additional contents of [ENTITY_TYPE.Candidate] cards. NB. the order of the items has currently no effect.
       */
      [ENTITY_TYPE.Candidate]: Array<
        | 'submatches'
        /**
         * Show the entity's answer to a specific question. Only applies to the results list.
         */
        | QuestionInCardContent
      >;
      /**
       * The additional contents of party cards. NB. the order of the items has currently no effect.
       */
      [ENTITY_TYPE.Organization]: Array<
        | 'submatches'
        /**
         * List party's the top 3 candidates within it's card. Only applies to the results list.
         */
        | 'candidates'
        /**
         * Show the entity's answer to a specific question. Only applies to the results list.
         */
        | QuestionInCardContent
      >;
    };
    /**
     * Which entity types to show in the results view. There must be at least one.
     */
    sections: Array<typeof ENTITY_TYPE.Candidate | typeof ENTITY_TYPE.Organization>;
    /**
     * If defined, a feedback popup will be shown on the next page load, when the user has reached the results section and the number of seconds given by this value has passed. The popup will not be shown, if the user has already given some feedback.
     */
    showFeedbackPopup?: number;
    /**
     * The delay in seconds after which a survey popup will be shown on the next page load, when the user has reached the results section. The popup will only be shown if the relevant `analytics.survey` settings are defined and if the user has not already opened the survey.
     */
    showSurveyPopup?: number;
  };
  /**
   * Settings related to election selection in VAAs with multiple candidates. These have no effect if there is just one election.
   */
  elections?: {
    /**
     * If `true` all elections are selected by default.
     */
    disallowSelection?: boolean;
  };
  underMaintenance?: boolean;
};

/**
 * Used to show the entity's answer to a specific question. Only applies to the results list.
 */
export type QuestionInCardContent = {
  /**
   * The question's id.
   */
  question: string;
  /**
   * Whether to hide the question label in the card.
   */
  hideLabel?: boolean;
  /**
   * How to format the answer. • Default: use the same format as in EntityDetails. • Tag: format the answers as a pill or tag.
   */
  format?: 'default' | 'tag';
};

/**
 * The possible content tabs to show for all entities.
 */
export type EntityDetailsContent = 'info' | 'opinions';

/**
 * The possible content tabs to show for `Organization`s.
 */
export type OrganizationDetailsContent = 'candidates';
