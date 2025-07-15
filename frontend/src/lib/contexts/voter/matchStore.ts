import { type AnyNominationVariant, ENTITY_TYPE, type EntityType } from '@openvaa/data';
import { imputeParentAnswers, unwrapProxiedMatch } from '$lib/utils/matching';
import { removeDuplicates } from '$lib/utils/removeDuplicates';
import { countAnswers } from './countAnswers';
import { Voter } from './voter';
import { parsimoniusDerived } from '../utils/parsimoniusDerived';
import type { FactionNomination, OrganizationNomination } from '@openvaa/data';
import type { Match, MatchingAlgorithm } from '@openvaa/matching';
import type { Readable } from 'svelte/store';
import type { MatchingProxy } from '$lib/utils/matching';
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
 * @param parentMatchingMethod - A store containing the parent matching method. This is used to preimpute answers for `Nomination`s with children.
 * @returns An array of `Match`es or unmatched `WrappedNomination` for each `Election` and each `EntityType`.
 */
export function matchStore({
  answers,
  nominationsAndQuestions,
  algorithm,
  minAnswers,
  calcSubmatches,
  parentMatchingMethod
}: {
  answers: AnswerStore;
  nominationsAndQuestions: Readable<NominationAndQuestionTree>;
  algorithm: MatchingAlgorithm;
  minAnswers: Readable<number>;
  calcSubmatches: Readable<Array<EntityType>>;
  parentMatchingMethod: Readable<AppSettings['matching']['organizationMatching']>;
}): Readable<MatchTree> {
  return parsimoniusDerived(
    [answers, nominationsAndQuestions, minAnswers, calcSubmatches, parentMatchingMethod],
    ([answers, nominationsAndQuestions, minAnswers, calcSubmatches, parentMatchingMethod]) => {
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

            // Possibly impute parent entity answers
            let proxies: Array<MatchingProxy<AnyNominationVariant>> | undefined;
            if (entityType === ENTITY_TYPE.Organization || entityType === ENTITY_TYPE.Faction) {
              switch (parentMatchingMethod) {
                case 'impute':
                  proxies = imputeParentAnswers({
                    nominations: nominations as Array<OrganizationNomination | FactionNomination>,
                    questions
                  });
                  break;
                case 'answersOnly':
                case 'none':
                  break;
                default:
                  throw new Error(`Unsupported parent matching method: ${parentMatchingMethod}`);
              }
            }

            const matches = algorithm.match<AnyNominationVariant | MatchingProxy<AnyNominationVariant>>({
              questions,
              reference: voter,
              // Use proxies in matching if available
              targets: proxies ?? nominations,
              options: { questionGroups }
            });

            return [
              entityType,
              // If we used proxies, unwrap them
              proxies
                ? matches.map((m) => unwrapProxiedMatch(m as Match<MatchingProxy<AnyNominationVariant>>))
                : matches
            ];
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
