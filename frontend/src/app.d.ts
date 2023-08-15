// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types

import type {AppLabels} from '$lib/vaa-data/data.types';
import type {
  ElectionData,
  ConstituencyCategoryData,
  QuestionCategoryData,
  QuestionData
} from '$lib/vaa-data/dataObjects';

declare namespace App {
  interface PageData {
    appLabels?: AppLabels;
    appSettings?: AppSettings;
    electionData?: ElectionData[];
    constituencyCategoryData?: ConstituencyCategoryData[];
    questionCategoryData?: QuestionCategoryData[];
    questionData?: QuestionData[];
    selectedElectionIds?: string[];
    selectedConstituencyIds?: string[];
    selectedQuestionCategoryIds?: string[];
  }
  // interface Locals {}
  // interface Error {}
  // interface Platform {}
}
