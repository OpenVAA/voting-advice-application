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
    candidates?: Promise<Array<CandidateProps>>;
    categoryId?: string;
    election?: ElectionProps;
    entityId?: string;
    entityType?: EntityType;
    parties?: Promise<Array<PartyProps>>;
    questionId?: string;
    // `setQuestionAsFirst` will be set to `true` on the `/(voter)/questions/[questionId]` route if a `start` search param is present (regardless of its value)
    setQuestionAsFirst?: boolean;
    opinionQuestions?: Promise<Array<QuestionProps>>;
    // TODO: This is a temporary fix for the candidate app and will be corrected when this branc is merged into main
    opinionQuestionsSync?: Array<QuestionProps>;
    infoQuestions?: Promise<Array<QuestionProps>>;
    i18n: {
      currentLocale: string;
      preferredLocale?: string;
      route: string;
    };
  }
  // interface Error {}
  // interface Platform {}
}
