import { ENTITY_TYPE, QUESTION_CATEGORY_TYPE } from '@openvaa/data';
import { error } from '@sveltejs/kit';
import type { CustomData } from '@openvaa/app-shared';
import type { AnyQuestionVariant, Constituency, Election, QuestionCategory } from '@openvaa/data';
import type { AppType } from '../app';

/**
 * Create a reactive value containing all `AnyQuestionVariant`s that apply to the selected elections and constituencies. For opinion questions, the value will ensure that they are matchable. It will also filter out hidden questions and those of the correct entity type based on `appType`.
 */
export function questionStore({
  categories,
  selectedElections,
  selectedConstituencies,
  appType
}: {
  categories: () => Array<QuestionCategory>;
  selectedElections: () => Array<Election>;
  selectedConstituencies: () => Array<Constituency>;
  appType: AppType;
}): { readonly value: Array<AnyQuestionVariant> } {
  const _value = $derived.by(() => {
    const cats = categories();
    const elections = selectedElections();
    const constituencies = selectedConstituencies();
    return cats.flatMap((c) => {
      const questions = c
        .getApplicableQuestions({
          elections,
          constituencies,
          entityType: appType === 'candidate' ? ENTITY_TYPE.Candidate : undefined
        })
        // Filter out hidden questions in the Voter App. Note that we need to also do this in `EntityDetails`
        .filter((q) => appType !== 'voter' || !(q.customData as CustomData['Question'])?.hidden);
      if (c.type === QUESTION_CATEGORY_TYPE.Opinion && questions.some((q) => !q.isMatchable))
        error(500, `Some opinion questions in category ${c.id} is not matchable.`);
      return questions;
    });
  });
  return {
    get value() {
      return _value;
    }
  };
}
