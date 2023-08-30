import type {AppLabels} from '$types';
import type {CandidateProps} from '$lib/components/candidates';
import type {QuestionProps} from '$lib/components/questions';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
  // interface Locals {}
  interface PageData {
    appLabels?: AppLabels;
    candidates?: CandidateProps[];
    questions?: QuestionProps[];
  }
  // interface Error {}
  // interface Platform {}
}
