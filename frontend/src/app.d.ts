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
    candidate?: CandidateProps;
    candidateId?: string;
    candidates: CandidateProps[];
    election: ElectionProps;
    parties: PartyProps[];
    party?: PartyProps;
    questionId?: string;
    questions: QuestionProps[];
    infoQuestions: QuestionProps[];
    i18n: {
      currentLocale: string;
      preferredLocale?: string;
      route: string;
    };
  }
  // interface Error {}
  // interface Platform {}
}
