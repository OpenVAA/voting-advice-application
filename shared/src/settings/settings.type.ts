/**
 *  These settings can only be set by editing the `staticSettings.ts` file and they cannot, thus, change after initialisation.
 */
export type StaticSettings = {
  /**
   * Settings related to the administrative functions.
   */
  readonly admin: {
    /**
     * The admin email of the application. When errors occur, users may be asked to contact this address.
     */
    readonly email: string;
  };
  /**
   * Settings related to the version of the app and handling of saved user data.
   */
  readonly appVersion: {
    /**
     * The current version of the app.
     */
    readonly version: number;
    /**
     * If the app version in which user data is last saved is smaller than this, the data will be reset.
     */
    readonly requireUserDataVersion: number;
    /**
     * The url of the source code for the app.
     */
    readonly source: string;
  };
  /**
   * Settings defining the data provider to use, which may be a database interface or one using local files.
   */
  readonly dataProvider:
    | {
        readonly type: 'strapi';
        readonly supportsCandidateApp: true;
      }
    | {
        readonly type: 'local';
        readonly supportsCandidateApp: false;
      };
  /**
   * The main DaisyUI colors used by the application. These have to be defined separately for both the light (default) and dark themes. Only some of the named colors are used in the application: e.g., 'warning' is also used for 'error'.
   */
  readonly colors: {
    readonly light: {
      readonly primary: string;
      readonly secondary: string;
      readonly accent: string;
      readonly neutral: string;
      readonly 'base-100': string;
      readonly 'base-200': string;
      readonly 'base-300': string;
      readonly warning: string;
      readonly 'line-color': string;
    };
    readonly dark: {
      readonly primary: string;
      readonly secondary: string;
      readonly accent: string;
      readonly neutral: string;
      readonly 'base-100': string;
      readonly 'base-200': string;
      readonly 'base-300': string;
      readonly warning: string;
      readonly 'line-color': string;
    };
  };
  /**
   * The main font used in the application. Fallback sans-serif and emoji fonts will be added automatically.
   */
  readonly font: {
    /**
     * The name of the font. Be sure to escape any spaces or enclose the name in quotes. You must also supply the url property.
     */
    readonly name: string;
    /**
     * The download url of the font. This will be added to the <link> tag in the <head> section of the HTML.
     */
    readonly url: string;
    /**
     * The style of the font, i.e. 'sans' (the default) or 'serif', which will decide the fallback fonts to use.
     */
    readonly style?: 'sans' | 'serif';
  };
  /**
   * A list of the locales supported by the application.
   */
  readonly supportedLocales: ReadonlyArray<{
    /**
     * The ISO 639 locale code, e.g, 'en' or 'es-CO'.
     */
    readonly code: string;
    /**
     * The name of the language in the language itself, e.g. 'English' for locale 'en' or 'Suomi' for locale 'fi'.
     */
    readonly name: string;
    /**
     * Whether the language is the default language for the application. Only mark one language as the default language for the application.
     */
    readonly isDefault?: boolean;
  }>;
  /**
   * Settings related to data collection and other research or analytics use.
   */
  readonly analytics: {
    /**
     * Which platform, if any, to use for analytics. Remember to also check that the translations under the `privacy` key and the platform used are up to date.
     */
    readonly platform?: {
      /**
       * The name of the analytics platform.
       */
      readonly name: 'umami';
      /**
       * The tracking code or similar id for the platform.
       */
      readonly code: string;
      /**
       * The url for more information about the tracking platform.
       */
      readonly infoUrl: string;
    };
    /**
     * Whether to collect anonymous usage data about all UI actions, including answers to statements. This will only have an effect if the analytics platform is defined.
     */
    readonly trackEvents: boolean;
  };
};

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
      candidate: Array<'info' | 'opinions'>;
      /**
       * The content tabs to show for parties.
       */
      party: Array<'candidates' | 'info' | 'opinions'>;
    };
    /**
     * Whether to show a marker for missing election symbol in entity details, e.g. 'Election Symbol: --', or hide missing items completely. The marker, if shown, is defined in the translations.
     */
    showMissingElectionSymbol: {
      candidate: boolean;
      party: boolean;
    };
    /**
     * Whether to show a marker for missing answers in entity details as, e.g. 'Age: --', or hide missing items completely. The marker, if shown, is defined in the translations. This only applies to non-opinion questions.
     */
    showMissingAnswers: {
      candidate: boolean;
      party: boolean;
    };
  };
  /**
   * Settings related to the app header.
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
    partyMatching: 'none' | 'answersOnly' | 'mean' | 'median';
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
       * The additional contents of candidate cards. NB. the order of the items has currently no effect.
       */
      candidate: Array<
        | /**
         * The scores for question categories. If there's only one category, submatches are never computed. Applies to both the results list and entity details.
         */
        'submatches'
        | {
            /**
             * Show the entity's answer to a specific question. Only applies to the results list.
             *
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
          }
      >;
      /**
       * The additional contents of party cards. NB. the order of the items has currently no effect.
       */
      party: Array<
        | /**
         * The scores for question categories. If there's only one category, submatches are never computed. Applies to both the results list and entity details.
         */
        'submatches'
        /**
         * List party's the top 3 candidates within it's card. Only applies to the results list.
         */
        | 'candidates'
        | {
            /**
             * Show the entity's answer to a specific question. Only applies to the results list.
             *
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
          }
      >;
    };
    /**
     * Which entity types to show in the results view. There must be at least one.
     */
    sections: Array<'candidate' | 'party'>;
    /**
     * If defined, a feedback popup will be shown on the next page load, when the user has reached the results section and the number of seconds given by this value has passed. The popup will not be shown, if the user has already given some feedback.
     */
    showFeedbackPopup?: number;
    /**
     * The delay in seconds after which a survey popup will be shown on the next page load, when the user has reached the results section. The popup will only be shown if the relevant `analytics.survey` settings are defined and if the user has not already opened the survey.
     */
    showSurveyPopup?: number;
  };
  underMaintenance?: boolean;
};
