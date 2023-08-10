// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types

import type {AppLabels} from '$lib/api/dataProvider.types';
import type {
  ElectionData,
  ConstituencyCategoryData,
  QuestionCategoryData,
  QuestionData
} from '$lib/api/dataObjects';

declare namespace App {
  interface PageData {
    appLabels?: AppLabels;
    appSettings?: AppSettings;
    electionsData?: ElectionData[];
    constituencyCategoriesData?: ConstituencyCategoryData[];
    questionCategoriesData?: QuestionCategoryData[];
    questionsData?: QuestionData[];
    selectedElectionIds?: string[];
    selectedConstituencyIds?: string[];
    selectedQuestionCategoryIds?: string[];
  }
  // interface Locals {}
  // interface Error {}
  // interface Platform {}
}
