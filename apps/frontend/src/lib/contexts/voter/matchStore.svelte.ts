import { ENTITY_TYPE } from '@openvaa/data';
import { imputeParentAnswers, unwrapProxiedMatch } from '$lib/utils/matching';
import { removeDuplicates } from '$lib/utils/removeDuplicates';
import { countAnswers } from './countAnswers';
import { Voter } from './voter';
import type { Id } from '@openvaa/core';
import type {
  AllianceNomination,
  AnyNominationVariant,
  EntityType,
  FactionNomination,
  OrganizationNomination
} from '@openvaa/data';
import type { Match, MatchingAlgorithm } from '@openvaa/matching';
import type { MatchingProxy } from '$lib/utils/matching';
import type { AnswerStore } from './answerStore.type';
import type { NominationAndQuestionTree } from './nominationAndQuestionStore.svelte';
import type { SelectionTree } from './selectionTree.type';

/**
 * Create a reactive value that contains `Match`es for each `Election` and each `EntityType` included in `entityTypes`.
 * @param answers - The answer store (reactive via getter)
 * @param nominationsAndQuestions - A getter returning `Nomination`s, info and opinion `Question`s for each `Election` and each `EntityType`
 * @param algorithm - The matching algorithm
 * @param minAnswers - A getter returning the minimum number of answers required to perform matching, default `1`
 * @param calcSubmatches - A getter returning the `entityType`s for which to calculate submatches, default `[]`
 * @param parentMatchingMethod - A getter returning the parent matching method. This is used to preimpute answers for `Nomination`s with children.
 * @returns A reactive match tree value.
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
  nominationsAndQuestions: () => NominationAndQuestionTree;
  algorithm: MatchingAlgorithm;
  minAnswers: () => number;
  calcSubmatches: () => Array<EntityType>;
  parentMatchingMethod: () => AppSettings['matching']['organizationMatching'];
}): { readonly value: MatchTree } {
  const _value = $derived.by(() => {
    const currentAnswers = answers.answers;
    const nq = nominationsAndQuestions();
    const minAns = minAnswers() ?? 1;
    const submatches = calcSubmatches() ?? [];
    const parentMethod = parentMatchingMethod();

    const voter = new Voter(currentAnswers);
    const tree: Partial<MatchTree> = {};

    for (const [electionId, electionContent] of Object.entries(nq)) {
      const electionMatches: Record<EntityType, Array<MaybeWrappedEntityVariant>> = {} as never;
      // Phase 69 D-06: cross-iteration org-proxy cache. Populated by the Org branch
      // in Pass 1; consumed by the Alliance branch in Pass 2 via the imputeParentAnswers
      // childProxies arg. Per the Org-first invariant documented in imputeParentAnswers.ts.
      const orgProxiesById = new Map<Id, MatchingProxy<AnyNominationVariant>>();

      for (const [entityType, { nominations, opinionQuestions: questions }] of Object.entries(electionContent)) {
        const numAnswers = countAnswers({ questions, answers: currentAnswers });
        // If there are no applicable answers, just return the nominations.
        if (numAnswers < minAns) {
          electionMatches[entityType as EntityType] = nominations;
          continue;
        }

        // If there are no nominations, return an empty array
        if (!nominations.length) {
          electionMatches[entityType as EntityType] = [];
          continue;
        }

        // Get question categories for submatches if necessary
        const questionGroups = submatches.includes(entityType as EntityType)
          ? removeDuplicates(questions.map((q) => q.category))
          : undefined;

        // Possibly impute parent entity answers
        let proxies: Array<MatchingProxy<AnyNominationVariant>> | undefined;
        if (entityType === ENTITY_TYPE.Organization || entityType === ENTITY_TYPE.Faction) {
          switch (parentMethod) {
            case 'impute':
              proxies = imputeParentAnswers({
                nominations: nominations as Array<OrganizationNomination | FactionNomination>,
                questions
              });
              // Phase 69 D-06: cache org proxies for the Alliance branch.
              // Faction proxies are NOT cached — alliances aggregate at the organization level.
              if (entityType === ENTITY_TYPE.Organization) {
                for (const p of proxies) orgProxiesById.set(p.target.id, p);
              }
              break;
            case 'answersOnly':
            case 'none':
              break;
            default:
              throw new Error(`Unsupported parent matching method: ${parentMethod}`);
          }
        } else if (entityType === ENTITY_TYPE.Alliance) {
          // Org-first invariant: this branch reads orgProxiesById which is populated by the
          // Organization branch above. The default seed orders sections ['candidate',
          // 'organization', 'alliance'] so Org runs before Alliance within each electionContent
          // iteration. A customer override that listed alliance first would result in an empty
          // orgProxiesById Map; the alliance pass would then fall back to entity-answer reads
          // (which are null for alliances → no impute → match scores degrade silently).
          // See JSDoc on imputeParentAnswers for the broader cascading-proxy pattern.
          switch (parentMethod) {
            case 'impute':
              proxies = imputeParentAnswers({
                nominations: nominations as Array<AllianceNomination>,
                questions,
                childProxies: orgProxiesById
              });
              break;
            case 'answersOnly':
            case 'none':
              break;
            default:
              throw new Error(`Unsupported parent matching method: ${parentMethod}`);
          }
        }

        const matches = algorithm.match<AnyNominationVariant | MatchingProxy<AnyNominationVariant>>({
          questions,
          reference: voter,
          // Use proxies in matching if available
          targets: proxies ?? nominations,
          options: { questionGroups }
        });

        // If we used proxies, unwrap them
        electionMatches[entityType as EntityType] = (
          proxies
            ? matches.map((m) => unwrapProxiedMatch(m as Match<MatchingProxy<AnyNominationVariant>>))
            : matches
        ) as Array<MaybeWrappedEntityVariant>;
      }
      tree[electionId] = electionMatches;
    }
    return tree as MatchTree;
  });

  return {
    get value() {
      return _value;
    }
  };
}

/**
 * Contains the matches for each `Election` and each `EntityType`.
 */
export type MatchTree = SelectionTree<Array<MaybeWrappedEntityVariant>>;
