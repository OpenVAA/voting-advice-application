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
import type { ReactiveHandle } from '../utils/reactiveHandle.type';
import type { AnswerState } from './answerState.type';
import type { NominationAndQuestionTree } from './nominationAndQuestionState.svelte';
import type { SelectionTree } from './selectionTree.type';

type MatchStateDeps = {
  /** The answer store (reactive via getter). */
  answers: AnswerState;
  /** A getter returning `Nomination`s, info and opinion `Question`s for each `Election` and each `EntityType`. */
  nominationsAndQuestions: () => NominationAndQuestionTree;
  /** The matching algorithm. */
  algorithm: MatchingAlgorithm;
  /** A getter returning the minimum number of answers required to perform matching, default `1`. */
  minAnswers: () => number;
  /** A getter returning the `entityType`s for which to calculate submatches, default `[]`. */
  calcSubmatches: () => Array<EntityType>;
  /** A getter returning the parent matching method. `'impute'` preimputes answers for `Nomination`s with children, `'answersOnly'` matches parents on their own answers, and `'none'` leaves organizations, factions and alliances unmatched: they are returned as plain nominations, without a score. */
  parentMatchingMethod: () => AppSettings['matching']['organizationMatching'];
};

/**
 * Create a reactive value that contains `Match`es for each `Election` and each `EntityType` included in `entityTypes`.
 * @param deps - The answers, the matching algorithm and the getters the matches are derived from.
 * @returns A reactive match tree handle.
 */
export function matchState(deps: MatchStateDeps): ReactiveHandle<MatchTree> {
  return new MatchStateImpl(deps);
}

/**
 * Contains the matches for each `Election` and each `EntityType`.
 */
export type MatchTree = SelectionTree<Array<MaybeWrappedEntityVariant>>;

class MatchStateImpl {
  #deps: MatchStateDeps;

  constructor(deps: MatchStateDeps) {
    this.#deps = deps;
  }

  #value = $derived.by(() => {
    const currentAnswers = this.#deps.answers.answers;
    const nq = this.#deps.nominationsAndQuestions();
    const minAns = this.#deps.minAnswers() ?? 1;
    const submatches = this.#deps.calcSubmatches() ?? [];
    const parentMethod = this.#deps.parentMatchingMethod();

    const voter = new Voter(currentAnswers);
    const tree: Partial<MatchTree> = {};

    for (const [electionId, electionContent] of Object.entries(nq)) {
      const electionMatches: Record<EntityType, Array<MaybeWrappedEntityVariant>> = {} as never;
      // Imputed organization proxies, read by the alliance branch as its children's answers.
      const orgProxiesById = new Map<Id, MatchingProxy<AnyNominationVariant>>();

      for (const [entityType, { nominations, opinionQuestions: questions }] of Object.entries(electionContent)) {
        const numAnswers = countAnswers({ questions, answers: currentAnswers });
        // If there are no applicable answers, just return the nominations.
        if (numAnswers < minAns) {
          electionMatches[entityType as EntityType] = nominations;
          continue;
        }

        // `none` means no party matching: parent entities are listed without a score, like any entity type before the voter has answered enough questions.
        if (
          parentMethod === 'none' &&
          (entityType === ENTITY_TYPE.Organization ||
            entityType === ENTITY_TYPE.Faction ||
            entityType === ENTITY_TYPE.Alliance)
        ) {
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
              // Cache org proxies for the Alliance branch.
              // Faction proxies are NOT cached — alliances aggregate at the organization level.
              if (entityType === ENTITY_TYPE.Organization) {
                for (const p of proxies) orgProxiesById.set(p.target.id, p);
              }
              break;
            case 'answersOnly':
              break;
            default:
              throw new Error(`Unsupported parent matching method: ${parentMethod}`);
          }
        } else if (entityType === ENTITY_TYPE.Alliance) {
          switch (parentMethod) {
            case 'impute': {
              const alliances = nominations as Array<AllianceNomination>;
              // Impute the member organizations not imputed by an organization section, whether that section comes later or is not shown at all.
              const missingOrgs = alliances
                .flatMap((a) => a.organizationNominations)
                .filter((o) => !orgProxiesById.has(o.id));
              for (const p of imputeParentAnswers({ nominations: missingOrgs, questions }))
                orgProxiesById.set(p.target.id, p);
              proxies = imputeParentAnswers({
                nominations: alliances,
                questions,
                childProxies: orgProxiesById
              });
              break;
            }
            case 'answersOnly':
              break;
            default:
              throw new Error(`Unsupported parent matching method: ${parentMethod}`);
          }
        }

        const matches = this.#deps.algorithm.match<AnyNominationVariant | MatchingProxy<AnyNominationVariant>>({
          questions,
          reference: voter,
          // Use proxies in matching if available
          targets: proxies ?? nominations,
          options: { questionGroups }
        });

        // If we used proxies, unwrap them
        electionMatches[entityType as EntityType] = (
          proxies ? matches.map((m) => unwrapProxiedMatch(m as Match<MatchingProxy<AnyNominationVariant>>)) : matches
        ) as Array<MaybeWrappedEntityVariant>;
      }
      tree[electionId] = electionMatches;
    }
    return tree as MatchTree;
  });

  get current(): MatchTree {
    return this.#value;
  }
}
