// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
  interface Locals {
    currentLocale: string;
    route: string;
    preferredLocale?: string;
  }
  interface PageData {
    // Most of these properties are required so we don't need unnecessary
    // null checks every time we use them. We'll initiliaze the Array types
    // as empty arrays in the global data load /+layout.server.ts
    appSettings?: Partial<AppSettings>;
    candidates?: Promise<Array<LegacyCandidateProps>>;
    categoryId?: string;
    election?: LegacyElectionProps;
    entityId?: string;
    entityType?: LegacyEntityType;
    parties?: Promise<Array<LegacyPartyProps>>;
    questionId?: string;
    // `setQuestionAsFirst` will be set to `true` on the `/(voter)/questions/[questionId]` route if a `start` search param is present (regardless of its value)
    setQuestionAsFirst?: boolean;
    opinionQuestions?: Promise<Array<LegacyQuestionProps>>;
    // TODO: This is a temporary fix for the candidate app and will be corrected when this branc is merged into main
    opinionQuestionsSync?: Array<LegacyQuestionProps>;
    infoQuestions?: Promise<Array<LegacyQuestionProps>>;
    i18n: {
      currentLocale: string;
      preferredLocale?: string;
      route: string;
    };
  }
  interface Error {
    message: string;
    description?: string;
    emoji?: string;
  }
  // interface Platform {}
}
