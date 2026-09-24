/**
 * - Check if the nominations route is available
 * - Load the data used by the route
 */

import { staticSettings } from '@openvaa/app-shared';
import { redirect } from '@sveltejs/kit';
import { createDataProvider } from '$lib/api/dataProvider';
import { getLocale } from '$lib/paraglide/runtime';
import { buildRoute } from '$lib/routes';
import { mergeAppSettings } from '$lib/utils/settings';

export async function load({ parent, fetch }) {
  const lang = getLocale();

  // 1. Check if the nominations route is available
  const { appSettingsData, supabaseClient } = await parent();
  const appSettings = mergeAppSettings(staticSettings, await appSettingsData);
  if (!appSettings.entities.showAllNominations) {
    redirect(
      307,
      buildRoute({
        route: 'Home',
        locale: lang
      })
    );
  }

  // 2. Load the data used by the route
  const dataProvider = createDataProvider({ fetch, client: supabaseClient });
  return {
    // Both promises below are returned UNAWAITED on purpose: they stream, and SvelteKit resolves them after this load returns. That is safe under per-request instancing because the promise captures THIS request's own adapter, which nothing else can rebind; do not "fix" it by awaiting.
    // Parity with the located layout loader: the all-nominations route is unscoped, so `getQuestionData` is called locale-only — `electionId` is optional in `GetQuestionsOptions`, and with none supplied all categories/questions are returned, which is correct for the unscoped all-nominations view.
    questionData: dataProvider
      .getQuestionData({
        locale: lang
      })
      .catch((e) => e),
    nominationData: dataProvider
      .getNominationData({
        locale: lang
      })
      .catch((e) => e)
  };
}
