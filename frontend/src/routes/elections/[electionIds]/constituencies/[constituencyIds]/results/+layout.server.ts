import type {LayoutServerLoad} from './$types';
import {getDataProvider} from '$lib/server/config';
import {EntityType, filterItems} from '$lib/vaa-data';

export const load: LayoutServerLoad = (async ({parent}) => {
  // Get constituency ids
  const {selectedElectionIds, selectedConstituencyIds} = await parent();
  // Get data provider
  const dataProvider = getDataProvider();
  // Load data
  const nominationData = await dataProvider.getNominationData({
    electionId: selectedElectionIds,
    constituencyId: selectedConstituencyIds
  });
  const personIds = filterItems(nominationData, {entityType: EntityType.Person}).map(
    (n) => n.entityId
  );
  return {
    nominationData,
    personData: await dataProvider.getPersonData({id: personIds}),
    // NB. We do not filter organizationData because a Person may belong to an Organization that has
    // no OrganizationNominations in the same Constituency
    organizationData: await dataProvider.getOrganizationData(),
    // Also load the relevant answer data
    answerData: [
      ...(await dataProvider.getAnswerData({entityType: EntityType.Person, entityId: personIds})),
      ...(await dataProvider.getAnswerData({entityType: EntityType.Organization}))
    ]
  };
}) satisfies LayoutServerLoad;
