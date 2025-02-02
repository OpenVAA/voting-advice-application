import {
  type AnyQuestionVariant,
  type Constituency,
  type Election,
  QUESTION_CATEGORY_TYPE,
  type QuestionCategory
} from '@openvaa/data';
import { error } from '@sveltejs/kit';
import { derived, type Readable } from 'svelte/store';

/**
 * Create a derived store containing all `AnyQuestionVariant`s that apply to the selected elections and constituencies.
 * For opinion questions, the store will ensure that they are matchable.
 */
export function questionStore({
  categories,
  selectedElections,
  selectedConstituencies
}: {
  categories: Readable<Array<QuestionCategory>>;
  selectedElections: Readable<Array<Election>>;
  selectedConstituencies: Readable<Array<Constituency>>;
}): Readable<Array<AnyQuestionVariant>> {
  return derived(
    [categories, selectedElections, selectedConstituencies],
    ([categories, elections, constituencies]) =>
      categories.flatMap((c) => {
        const questions = c.getApplicableQuestions({ elections, constituencies });
        if (c.type === QUESTION_CATEGORY_TYPE.Opinion && questions.some((q) => !q.isMatchable))
          error(500, `Some opinion questions in category ${c.id} is not matchable.`);
        return questions;
      }),
    []
  );
}
