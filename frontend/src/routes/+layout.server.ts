import type {LayoutServerLoad} from './$types';
import appConfig from '$lib/server/config/appConfig';

export const load: LayoutServerLoad = (async () => {
  return {
    appLabels: await appConfig.getAppLabels()
  };
}) satisfies LayoutServerLoad;
