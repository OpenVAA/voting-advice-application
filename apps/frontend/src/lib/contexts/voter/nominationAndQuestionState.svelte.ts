import { ENTITY_TYPE, QUESTION_CATEGORY_TYPE } from '@openvaa/data';
import type { Id } from '@openvaa/core';
import type {
  AnyNominationVariant,
  AnyQuestionVariant,
  Constituency,
  DataRoot,
  Election,
  EntityType,
  OrganizationNomination
} from '@openvaa/data';
import type { SelectionTree } from './selectionTree.type';

/**
 * What the nomination and question state reads, each through a getter so that a change reaches the tree.
 */
type NominationAndQuestionStateDeps = {
  /** The data root. */
  dataRoot: () => DataRoot;
  /** The selected constituencies. */
  constituencies: () => Array<Constituency> | undefined;
  /** The selected elections. */
  elections: () => Array<Election> | undefined;
  /** The entity types to include. Every type is included when the list is empty. */
  entityTypes: () => Array<EntityType>;
  /** The setting that names, by entity type, whose nominations are hidden while the entity lacks an answer to an opinion question asked of its type. The candidate key also removes such a candidate from its organization and hides an organization left with none. The organization key hides an organization for its own missing answers and decides nothing else. */
  hideIfMissingAnswers: () => AppSettings['entities']['hideIfMissingAnswers'];
};

class NominationAndQuestionStateImpl {
  #deps: NominationAndQuestionStateDeps;

  constructor(deps: NominationAndQuestionStateDeps) {
    this.#deps = deps;
  }

  #value = $derived.by(() => {
    const dr = this.#deps.dataRoot();
    const constits = this.#deps.constituencies();
    const elecs = this.#deps.elections();
    let types = this.#deps.entityTypes();
    const hideIfMissing = this.#deps.hideIfMissingAnswers();

    if (!dr || !elecs || !constits) return {} as NominationAndQuestionTree;
    if (!types?.length) types = Object.values(ENTITY_TYPE);
    const tree: Partial<NominationAndQuestionTree> = {};
    for (const election of elecs) {
      // `getApplicableConstituency` throws when more than one constituency matches the election's groups (hierarchical selection — a municipality and its parent region both end up in the selected list for an election whose cgs include both Regions and Municipalities). Pick the FIRST match deterministically (earlier in the array — the selector pushes the implied parent ahead of the child) so the election's nomination tree still resolves (variant-startfromcg.spec.ts:145 hierarchy edge case).
      let constituency: Constituency | undefined;
      try {
        constituency = election.getApplicableConstituency(constits);
      } catch {
        constituency = constits.find(({ id }) =>
          election.constituencyGroups.some((group) => group.data.constituencyIds.includes(id))
        );
      }
      if (!constituency) continue;

      let candidateNominationsWithMissingAnswers: Set<Id> | undefined;

      tree[election.id] = Object.fromEntries(
        types
          .map((entityType) => {
            let nominations = election.getNominations(entityType, constituency);
            // If there are no nominations for this entityType, we leave the whole leaf undefined
            if (!nominations.length) return [entityType, undefined];
            const infoQuestions = election.getQuestions({
              constituency,
              entityType,
              type: QUESTION_CATEGORY_TYPE.Info
            });
            const opinionQuestions = election.getQuestions({
              constituency,
              entityType,
              type: QUESTION_CATEGORY_TYPE.Opinion
            });
            // Check that the entities have answers to all opinion questions
            if (entityType === ENTITY_TYPE.Candidate && hideIfMissing?.candidate) {
              nominations = nominations.filter((n) => {
                const hasAllAnswers = opinionQuestions.every((q) => n.entity.getAnswer(q) != null);
                if (!hasAllAnswers) {
                  candidateNominationsWithMissingAnswers ??= new Set();
                  candidateNominationsWithMissingAnswers.add(n.id);
                }
                return hasAllAnswers;
              });
            }
            if (entityType === ENTITY_TYPE.Organization && hideIfMissing?.organization) {
              nominations = nominations.filter((n) => opinionQuestions.every((q) => n.entity.getAnswer(q) != null));
            }
            if (entityType === ENTITY_TYPE.Organization || entityType === ENTITY_TYPE.Faction) {
              // We need to also purge child nomination ids from the data if they don't have answers to all opinion questions
              if (entityType === ENTITY_TYPE.Organization && hideIfMissing?.candidate) {
                for (const organization of nominations as Array<OrganizationNomination>) {
                  organization.data.candidateNominationIds = organization.data.candidateNominationIds?.filter(
                    (id) => !candidateNominationsWithMissingAnswers?.has(id)
                  );
                }
                // And finally filter out orgs with no children left
                nominations = nominations.filter(
                  (n) => (n as OrganizationNomination).data.candidateNominationIds?.length
                );
              }
            }
            return [entityType, { nominations, infoQuestions, opinionQuestions }];
          })
          .filter(([, value]) => value)
      );
    }
    return tree as NominationAndQuestionTree;
  });

  get value(): NominationAndQuestionTree {
    return this.#value;
  }
}

/**
 * Create a reactive value that contains `Nomination`s, info and opinion `Question`s for each `Election` and each `EntityType` included in `entityTypes`. A nomination whose entity lacks an answer to an opinion question asked of its type is left out when `hideIfMissingAnswers` holds that type's key. It is used internally by the `VoterContext`.
 *
 * @param deps - The getters the tree is derived from: the data root, the selected constituencies and elections, the entity types to include and the `hideIfMissingAnswers` setting.
 * @returns A reactive nomination and question tree value.
 */
export function nominationAndQuestionState(deps: NominationAndQuestionStateDeps): {
  readonly value: NominationAndQuestionTree;
} {
  return new NominationAndQuestionStateImpl(deps);
}

/**
 * Contains the nominations, info and opinion questions for each `Election` and each `EntityType`.
 */
export type NominationAndQuestionTree = SelectionTree<{
  infoQuestions: Array<AnyQuestionVariant>;
  opinionQuestions: Array<AnyQuestionVariant>;
  nominations: Array<AnyNominationVariant>;
}>;
