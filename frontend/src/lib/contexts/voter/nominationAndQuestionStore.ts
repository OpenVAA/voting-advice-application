import {
  type AnyNominationVariant,
  type AnyQuestionVariant,
  type Constituency,
  type DataRoot,
  type Election,
  ENTITY_TYPE,
  type EntityType,
  FactionNomination,
  OrganizationNomination,
  QUESTION_CATEGORY_TYPE
} from '@openvaa/data';
import { type Readable } from 'svelte/store';
import { imputeParentAnswers } from '$lib/utils/matching';
import { parsimoniusDerived } from '../utils/parsimoniusDerived';
import type { Id } from '@openvaa/core';
import type { SelectionTree } from './selectionTree.type';

/**
 * Create a readable store that contains `Nomination`s, info and opinion `Question`s for each `Election` and each `EntityType` included in `entityTypes`. It is used internally by the `VoterContext`.
 *
 * NB. We use this store temporarily to preimpute `Organization` and `Faction` answers, but this will moved elsewhere in the future.
 * NB. We use stores for `entityTypes` and `parentMatchingMethod` because they are based on settings contained in a store.
 *
 * @param dataRoot - The store containing the data root. NB. Having it as an argument ensure that we always update the matches.
 * @param constituencies - The store containing the selected constituencies
 * @param elections - The store containing the selected elections
 * @param entityTypes - A store containing the entity types to include in the matches defaulting to all entity types
 * @param parentMatchingMethod - A store containing the parent matching method. This is used to preimpute answers for `Entity`s with children.
 * @param hideIfMissingAnswers - A store defining which the `EntityType`s to hide if any of their opininion question answers are missing.
 * @returns An array of `Nomination`s for each `Election` and each `EntityType`.
 */
export function nominationAndQuestionStore({
  dataRoot,
  constituencies,
  elections,
  entityTypes,
  parentMatchingMethod,
  hideIfMissingAnswers
}: {
  dataRoot: Readable<DataRoot>;
  constituencies: Readable<Array<Constituency> | undefined>;
  elections: Readable<Array<Election> | undefined>;
  entityTypes: Readable<Array<EntityType>>;
  parentMatchingMethod: Readable<AppSettings['matching']['organizationMatching']>;
  hideIfMissingAnswers: Readable<AppSettings['entities']['hideIfMissingAnswers']>;
}): Readable<NominationAndQuestionTree> {
  return parsimoniusDerived(
    [dataRoot, constituencies, elections, entityTypes, parentMatchingMethod, hideIfMissingAnswers],
    ([dataRoot, constituencies, elections, entityTypes, parentMatchingMethod, hideIfMissingAnswers]) => {
      if (!dataRoot || !elections || !constituencies) return {};
      if (!entityTypes?.length) entityTypes = Object.values(ENTITY_TYPE);
      const tree: Partial<NominationAndQuestionTree> = {};
      for (const election of elections) {
        const constituency = election.getApplicableConstituency(constituencies);
        if (!constituency) continue;

        let candidateNominationsWithMissingAnswers: Set<Id> | undefined;

        tree[election.id] = Object.fromEntries(
          entityTypes
            .sort((a) => (a === ENTITY_TYPE.Candidate ? -1 : 0))
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
              if (entityType === ENTITY_TYPE.Candidate && hideIfMissingAnswers?.candidate) {
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
                if (entityType === ENTITY_TYPE.Organization && hideIfMissingAnswers?.candidate) {
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

                // TODO: Replace this temporary solution with a more robust solution
                // Possibly impute parent entity answers
                switch (parentMatchingMethod) {
                  case 'impute':
                    imputeParentAnswers({
                      nominations: nominations as Array<OrganizationNomination | FactionNomination>,
                      questions: opinionQuestions
                    });
                    break;
                  case 'answersOnly':
                  case 'none':
                    break;
                  default:
                    throw new Error(`Unsupported parent matching method: ${parentMatchingMethod}`);
                }
              }
              return [entityType, { nominations, infoQuestions, opinionQuestions }];
            })
            .filter(([, value]) => value)
        );
      }
      return tree as NominationAndQuestionTree;
    },
    {}
  );
}

/**
 * Contains the nominations, info and opinion questions for each `Election` and each `EntityType`.
 */
export type NominationAndQuestionTree = SelectionTree<{
  infoQuestions: Array<AnyQuestionVariant>;
  opinionQuestions: Array<AnyQuestionVariant>;
  nominations: Array<AnyNominationVariant>;
}>;
