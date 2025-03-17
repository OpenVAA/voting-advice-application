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
 * @returns An array of `Nomination`s for each `Election` and each `EntityType`.
 */
export function nominationAndQuestionStore({
  dataRoot,
  constituencies,
  elections,
  entityTypes,
  parentMatchingMethod
}: {
  dataRoot: Readable<DataRoot>;
  constituencies: Readable<Array<Constituency> | undefined>;
  elections: Readable<Array<Election> | undefined>;
  entityTypes: Readable<Array<EntityType>>;
  parentMatchingMethod: Readable<AppSettings['matching']['organizationMatching']>;
}): Readable<NominationAndQuestionTree> {
  return parsimoniusDerived(
    [dataRoot, constituencies, elections, entityTypes, parentMatchingMethod],
    ([dataRoot, constituencies, elections, entityTypes, parentMatchingMethod]) => {
      if (!dataRoot || !elections || !constituencies) return {};
      if (!entityTypes?.length) entityTypes = Object.values(ENTITY_TYPE);
      const tree: Partial<NominationAndQuestionTree> = {};
      for (const election of elections) {
        const constituency = election.getApplicableConstituency(constituencies);
        if (!constituency) continue;

        tree[election.id] = Object.fromEntries(
          entityTypes
            .map((entityType) => {
              const nominations = election.getNominations(entityType, constituency);
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
              if (entityType === ENTITY_TYPE.Organization || entityType === ENTITY_TYPE.Faction) {
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
