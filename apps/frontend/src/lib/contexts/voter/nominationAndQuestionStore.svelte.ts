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
 * Create a reactive value that contains `Nomination`s, info and opinion `Question`s for each `Election` and each `EntityType` included in `entityTypes`. It is used internally by the `VoterContext`.
 *
 * @param dataRoot - A getter returning the data root.
 * @param constituencies - A getter returning the selected constituencies.
 * @param elections - A getter returning the selected elections.
 * @param entityTypes - A getter returning the entity types to include.
 * @param hideIfMissingAnswers - A getter defining which `EntityType`s to hide if any of their opinion question answers are missing.
 * @returns A reactive nomination and question tree value.
 */
export function nominationAndQuestionStore({
  dataRoot,
  constituencies,
  elections,
  entityTypes,
  hideIfMissingAnswers
}: {
  dataRoot: () => DataRoot;
  constituencies: () => Array<Constituency> | undefined;
  elections: () => Array<Election> | undefined;
  entityTypes: () => Array<EntityType>;
  hideIfMissingAnswers: () => AppSettings['entities']['hideIfMissingAnswers'];
}): { readonly value: NominationAndQuestionTree } {
  const _value = $derived.by(() => {
    const dr = dataRoot();
    const constits = constituencies();
    const elecs = elections();
    let types = entityTypes();
    const hideIfMissing = hideIfMissingAnswers();

    if (!dr || !elecs || !constits) return {} as NominationAndQuestionTree;
    if (!types?.length) types = Object.values(ENTITY_TYPE);
    const tree: Partial<NominationAndQuestionTree> = {};
    for (const election of elecs) {
      const constituency = election.getApplicableConstituency(constits);
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

  return {
    get value() {
      return _value;
    }
  };
}

/**
 * Contains the nominations, info and opinion questions for each `Election` and each `EntityType`.
 */
export type NominationAndQuestionTree = SelectionTree<{
  infoQuestions: Array<AnyQuestionVariant>;
  opinionQuestions: Array<AnyQuestionVariant>;
  nominations: Array<AnyNominationVariant>;
}>;
