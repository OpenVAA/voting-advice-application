import { QUESTION_CATEGORY_TYPE } from '@openvaa/data';
import type { Constituency, DataRoot, Election, EntityType, FilterValue, QuestionCategory } from '@openvaa/data';

/**
 * Create a reactive value containing all `QuestionCategory`s that apply to the selected elections and constituencies as well as possible entity types.
 */
export function questionCategoryStore({
  dataRoot,
  selectedElections,
  selectedConstituencies,
  entityType
}: {
  dataRoot: () => DataRoot;
  selectedElections: () => Array<Election>;
  selectedConstituencies: () => Array<Constituency>;
  entityType?: FilterValue<EntityType>;
}): { readonly value: Array<QuestionCategory> } {
  const _value = $derived.by(() => {
    const dr = dataRoot();
    const elections = selectedElections();
    const constituencies = selectedConstituencies();
    return (
      dr.questionCategories?.filter(
        (c) =>
          c.appliesTo({ elections, constituencies, entityType }) &&
          c.getApplicableQuestions({ elections, constituencies, entityType }).length > 0
      ) ?? []
    );
  });
  return {
    get value() {
      return _value;
    }
  };
}

/**
 * Create a reactive value returning info, i.e. non-opinion, categories from the `questionCategoryStore` value.
 */
export function extractInfoCategories(
  questionCategories: () => Array<QuestionCategory>
): { readonly value: Array<QuestionCategory> } {
  const _value = $derived(questionCategories().filter((qc) => qc.type !== QUESTION_CATEGORY_TYPE.Opinion));
  return {
    get value() {
      return _value;
    }
  };
}

/**
 * Create a reactive value returning opinion categories from the `questionCategoryStore` value.
 */
export function extractOpinionCategories(
  questionCategories: () => Array<QuestionCategory>
): { readonly value: Array<QuestionCategory> } {
  const _value = $derived(questionCategories().filter((qc) => qc.type === QUESTION_CATEGORY_TYPE.Opinion));
  return {
    get value() {
      return _value;
    }
  };
}
