import {dataProvider} from '$lib/_api/dataProvider';

export async function load({fetch}) {
  const provider = await dataProvider;
  provider.init({fetch});
  return {
    candidatesData: provider.getCandidatesData()
  };
}
