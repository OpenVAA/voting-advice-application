import { createStorageContext, type StorageContextContent } from '$lib/utils/context';

/**
 * The contents for a context object that contais session-persisted values needed for displaying the questions.
 * NB. In the actual context object, the values are contained in stores.
 */
interface QuestionsContextContent extends StorageContextContent {
  /**
   * The first question id if not the default one.
   */
  firstQuestionId: string | null;
  /**
   * The ids of the categories the user has possibly selected.
   */
  selectedCategories: Array<string> | null;
}

const { get } = createStorageContext<QuestionsContextContent>(
  'vaa-questions',
  {
    firstQuestionId: null,
    selectedCategories: null
  },
  'sessionStorage'
);

/**
 * Get a context object that contais session-persisted stores needed for displaying the questions.
 */
export const getQuestionsContext = get;
