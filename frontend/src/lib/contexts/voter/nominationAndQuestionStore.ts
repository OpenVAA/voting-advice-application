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
import { type Readable } from 'svelte/store';
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
 * @param hideIfMissingAnswers - A store defining which the `EntityType`s to hide if any of their opininion question answers are missing.
 * @returns An array of `Nomination`s for each `Election` and each `EntityType`.
 */
export function nominationAndQuestionStore({
  dataRoot,
  constituencies,
  elections,
  entityTypes,
  hideIfMissingAnswers
}: {
  dataRoot: Readable<DataRoot>;
  constituencies: Readable<Array<Constituency> | undefined>;
  elections: Readable<Array<Election> | undefined>;
  entityTypes: Readable<Array<EntityType>>;
  hideIfMissingAnswers: Readable<AppSettings['entities']['hideIfMissingAnswers']>;
}): Readable<NominationAndQuestionTree> {
  return parsimoniusDerived(
    [dataRoot, constituencies, elections, entityTypes, hideIfMissingAnswers],
    ([dataRoot, constituencies, elections, entityTypes, hideIfMissingAnswers]) => {
      if (!dataRoot || !elections || !constituencies) return {};
      if (!entityTypes?.length) entityTypes = Object.values(ENTITY_TYPE);
      const tree: Partial<NominationAndQuestionTree> = {};
      for (const election of elections) {
        const constituency = election.getApplicableConstituency(constituencies);
        if (!constituency) continue;

        // let candidateNominationsWithMissingAnswers: Set<Id> | undefined;

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
              // TODO: Extend this behaviour to other entityTypes as well
              if (entityType === ENTITY_TYPE.Candidate && hideIfMissingAnswers?.candidate) {
                nominations = nominations.filter((n) => {
                  const hasAllAnswers = opinionQuestions.every((q) => n.entity.getAnswer(q) != null);
                  // if (!hasAllAnswers) {
                  //   candidateNominationsWithMissingAnswers ??= new Set();
                  //   candidateNominationsWithMissingAnswers.add(n.id);
                  // }
                  return hasAllAnswers;
                });
              }
              // We should purge child nomination ids from the data if they don't have answers to all opinion questions and remove any OrganizationNominations that are bereft of their children in this way - but ONLY if they had children to begin with, i.e. that they were not pure OrganizationNominations. However, there's no way to perform this reliably because editing object data does not work. The commented code below will still return all parents on the next reload, because candidateNominationIds will be empty for those purged on the first go!
              // TODO[supabase]: Perform this complex logic and the one above already on the server!
              // if (
              //   (entityType === ENTITY_TYPE.Organization || entityType === ENTITY_TYPE.Faction) &&
              //   candidateNominationsWithMissingAnswers?.size
              // ) {
              //   const toPurge = new Set<OrganizationNomination | FactionNomination>();
              //   for (const parent of nominations as Array<OrganizationNomination | FactionNomination>) {
              //     // A pure OrganizationNomination, don't care about children
              //     if (!parent.data.candidateNominationIds?.length) continue;
              //     // Has candidates
              //     parent.data.candidateNominationIds = parent.data.candidateNominationIds?.filter(
              //       (id) => !candidateNominationsWithMissingAnswers?.has(id)
              //     );
              //     // If there are no candidates after filtering, purge the parent as well
              //     if (!parent.data.candidateNominationIds.length) toPurge.add(parent);
              //   }
              //   // Filter out nominations to purge
              //   nominations = (nominations as Array<OrganizationNomination | FactionNomination>).filter(
              //     (n) => !toPurge.has(n)
              //   );
              // }

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
