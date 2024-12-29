import {
  type AnyNominationVariant,
  type AnyQuestionVariant,
  type Constituency,
  type DataRoot,
  type Election,
  ENTITY_TYPE,
  type EntityType,
  QUESTION_CATEGORY_TYPE
} from '@openvaa/data';
import { derived, type Readable } from 'svelte/store';
import type { SelectionTree } from './selectionTree.type';

/**
 * Create a readable store that contains `Nomination`s, info and opinion `Question`s for each `Election` and each `EntityType` included in `entityTypes`. It is used internally by the `VoterContext`.
 *
 * NB. We use stores for `entityTypes` because they are based on settings contained in a store.
 *
 * @param dataRoot - The store containing the data root. NB. Having it as an argument ensure that we always update the matches.
 * @param constituencies - The store containing the selected constituencies
 * @param elections - The store containing the selected elections
 * @param entityTypes - A store containing the entity types to include in the matches defaulting to all entity types
 * @returns An array of `Nomination`s for each `Election` and each `EntityType`.
 */
export function nominationAndQuestionStore({
  dataRoot,
  constituencies,
  elections,
  entityTypes
}: {
  dataRoot: Readable<DataRoot>;
  constituencies: Readable<Array<Constituency> | undefined>;
  elections: Readable<Array<Election> | undefined>;
  entityTypes: Readable<Array<EntityType>>;
}): Readable<NominationAndQuestionTree> {
  return derived(
    [dataRoot, constituencies, elections, entityTypes],
    ([dataRoot, constituencies, elections, entityTypes]) => {
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
