import {
  type AnyQuestionVariant,
  type Constituency,
  type Election,
  QUESTION_CATEGORY_TYPE,
  type QuestionCategory
} from '@openvaa/data';
import { error } from '@sveltejs/kit';
import { parsimoniusDerived } from './parsimoniusDerived';
import type { CustomData } from '@openvaa/app-shared';
import type { Readable } from 'svelte/store';
import type { AppType } from '../app';

/**
 * Create a derived store containing all `AnyQuestionVariant`s that apply to the selected elections and constituencies. For opinion questions, the store will ensure that they are matchable. It will also filter out hidden questions based on `appType`.
 */
export function questionStore({
  categories,
  selectedElections,
  selectedConstituencies,
  appType
}: {
  categories: Readable<Array<QuestionCategory>>;
  selectedElections: Readable<Array<Election>>;
  selectedConstituencies: Readable<Array<Constituency>>;
  appType: AppType;
}): Readable<Array<AnyQuestionVariant>> {
  return parsimoniusDerived(
    [categories, selectedElections, selectedConstituencies],
    ([categories, elections, constituencies]) =>
      categories.flatMap((c) => {
        const questions = c
          .getApplicableQuestions({ elections, constituencies })
          // Filter out hidden questions in the Voter App. Note that we need to also do this in `EntityDetails`
          .filter((q) => appType !== 'voter' || !(q.customData as CustomData['Question'])?.hidden);
        if (c.type === QUESTION_CATEGORY_TYPE.Opinion && questions.some((q) => !q.isMatchable))
          error(500, `Some opinion questions in category ${c.id} is not matchable.`);
        return questions;
      }),
    { initialValue: [] }
  );
}
