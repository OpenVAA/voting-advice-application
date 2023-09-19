// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
  // interface Locals {}
  interface PageData {
    // Most of these properties are required so we don't need unnecessary
    // null checks every time we use them. We'll initiliaze the Array types
    // as empty arrays in the global data load /+layout.server.ts
    appLabels: AppLabels;
    candidate?: CandidateProps;
    candidates: CandidateProps[];
    election: ElectionProps;
    parties: PartyProps[];
    party?: PartyProps;
    questions: QuestionProps[];
  }
  // interface Error {}
  // interface Platform {}
}
