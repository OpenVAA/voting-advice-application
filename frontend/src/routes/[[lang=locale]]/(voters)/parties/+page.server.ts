import {getNominatingParties} from '$lib/api/getData';
import type {PageServerLoad} from './$types';

export const load = (async ({parent}) => {
  const locale = (await parent()).i18n.currentLocale;
  return {
    parties: await getNominatingParties({locale})
  };
}) satisfies PageServerLoad;
