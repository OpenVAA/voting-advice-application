import { removeDuplicates } from '$lib/utils/removeDuplicates';
import { countAnswers } from './countAnswers';
import { Voter } from './voter';
import { parsimoniusDerived } from '../utils/parsimoniusDerived';
import type { EntityType } from '@openvaa/data';
import type { MatchingAlgorithm } from '@openvaa/matching';
import type { Readable } from 'svelte/store';
import type { AnswerStore } from './answerStore.type';
import type { NominationAndQuestionTree } from './nominationAndQuestionStore';
import type { SelectionTree } from './selectionTree.type';

/**
 * Create a readable store that contains `Match`es for each `Election` and each `EntityType` included in `entityTypes`.
 * NB. We use stores for `calcSubmatches` and `minAnswers` because these are based on settings contained in a store.
 * @param answers - The store containing Voter answers
 * @param nominationsAndQuestions - A store containing `Nomination`s, info and opinion `Question`s for each `Election` and each `EntityType`
 * @param algorithm - The matching algorithm
 * @param minAnswers - A store containing the minimum number of answers required to perform matching, default `1`
 * @param calcSubmatches - A store containing the `entityType`s for which to calculate submatches, default `[]`
 * @returns An array of `Match`es or unmatched `WrappedNomination` for each `Election` and each `EntityType`.
 */
export function matchStore({
  answers,
  nominationsAndQuestions,
  algorithm,
  minAnswers,
  calcSubmatches
}: {
  answers: AnswerStore;
  nominationsAndQuestions: Readable<NominationAndQuestionTree>;
  algorithm: MatchingAlgorithm;
  minAnswers: Readable<number>;
  calcSubmatches: Readable<Array<EntityType>>;
}): Readable<MatchTree> {
  return parsimoniusDerived(
    [answers, nominationsAndQuestions, minAnswers, calcSubmatches],
    ([answers, nominationsAndQuestions, minAnswers, calcSubmatches]) => {
      minAnswers ??= 1;
      calcSubmatches ??= [];

      const voter = new Voter(answers);
      const tree: Partial<MatchTree> = {};

      for (const [electionId, electionContent] of Object.entries(nominationsAndQuestions)) {
        tree[electionId] = Object.fromEntries(
          Object.entries(electionContent).map(([entityType, { nominations, opinionQuestions: questions }]) => {
            const numAnswers = countAnswers({ questions, answers });
            // If there are no applicable answers, just return the nominations.
            if (numAnswers < minAnswers) return [entityType, nominations];

            // Get question categories for submatches if necessary
            const questionGroups = calcSubmatches.includes(entityType as EntityType)
              ? removeDuplicates(questions.map((q) => q.category))
              : undefined;

            const matches = algorithm.match({
              questions,
              reference: voter,
              targets: nominations,
              options: { questionGroups }
            });
            return [entityType, matches];
          })
        );
      }
      return tree as MatchTree;
    },
    {}
  );
}

/**
 * Contains the matches for each `Election` and each `EntityType`.
 */
export type MatchTree = SelectionTree<Array<MaybeWrappedEntityVariant>>;
