import { createAdminWriter } from '$lib/api/adminWriter';
import { assertBrowser } from './prepareDataWriter';

/**
 * Build an `AdminWriter` for ONE browser write, over the tab's memoized Supabase client.
 * It lives in its own module, borrowing the guard from its sibling, because the root layout initialises the auth context on EVERY page: a shared module would put the admin writer on the module graph of the voter app, which never calls one. Measured — with both writer kinds in one module the root layout's chunk carried `insertJobResult`; with them split it does not.
 * @returns An admin writer nothing else holds a reference to.
 */
export function prepareAdminWriter(): ReturnType<typeof createAdminWriter> {
  assertBrowser();
  return createAdminWriter({ fetch, browser: true });
}
