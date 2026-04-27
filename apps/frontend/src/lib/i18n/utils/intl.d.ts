declare namespace Intl {
  /**
   * This function is missing from the typescript defs but does exist
   * in the Intl object. See https://github.com/microsoft/TypeScript/issues/29129
   */
  function getCanonicalLocales(locales: string | Array<string>): Array<string>;
}
