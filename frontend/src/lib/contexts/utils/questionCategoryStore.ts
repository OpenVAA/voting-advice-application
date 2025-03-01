import {
  type Constituency,
  type DataRoot,
  type Election,
  QUESTION_CATEGORY_TYPE,
  type QuestionCategory
} from '@openvaa/data';
import { parsimoniusDerived } from './parsimoniusDerived';
import type { Readable } from 'svelte/store';

/**
 * Create a derived store containing all `QuestionCategory`s that apply to the selected elections and constituencies.
 */
export function questionCategoryStore({
  dataRoot,
  selectedElections,
  selectedConstituencies
}: {
  dataRoot: Readable<DataRoot>;
  selectedElections: Readable<Array<Election>>;
  selectedConstituencies: Readable<Array<Constituency>>;
}): Readable<Array<QuestionCategory>> {
  return parsimoniusDerived(
    [dataRoot, selectedElections, selectedConstituencies],
    ([dataRoot, elections, constituencies]) =>
      dataRoot.questionCategories?.filter(
        (c) =>
          c.appliesTo({ elections, constituencies }) &&
          c.getApplicableQuestions({ elections, constituencies }).length > 0
      ) ?? [],
    { initialValue: [] }
  );
}

/**
 * Create a store returning info, i.e. non-opinion, categories from the `questionCategoryStore` store.
 */
export function extractInfoCategories(
  questionCategories: Readable<Array<QuestionCategory>>
): Readable<Array<QuestionCategory>> {
  return parsimoniusDerived(questionCategories, (categories) =>
    categories.filter((qc) => qc.type !== QUESTION_CATEGORY_TYPE.Opinion)
  );
}

/**
 * Create a store returning opinion categories from the `questionCategoryStore` store.
 */
export function extractOpinionCategories(
  questionCategories: Readable<Array<QuestionCategory>>
): Readable<Array<QuestionCategory>> {
  return parsimoniusDerived(questionCategories, (categories) =>
    categories.filter((qc) => qc.type === QUESTION_CATEGORY_TYPE.Opinion)
  );
}
