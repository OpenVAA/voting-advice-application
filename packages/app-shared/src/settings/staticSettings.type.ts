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
   * Settings defining the data adapters to use, which may be a database interface or one using local files.
   */
  readonly dataAdapter:
    | {
        readonly type: 'strapi';
        // TODO: [DataWriter] remove this setting and replace with null test on import { dataWriter } from '$lib/api/dataWriter'
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
