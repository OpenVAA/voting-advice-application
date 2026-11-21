import { redirect } from '@sveltejs/kit';
import { getLocale } from '$lib/paraglide/runtime';
import { buildRoute } from '$lib/routes';
import type { Route } from '$lib/routes';

/**
 * Build the universal load of an app's "email sent" page, which answers a document request for the page with a redirect to the app's login screen.
 *
 * The link request the page shows is held in the tab's memory alone (see `EntryFlowHolder`), so a document request, as a reload or a visit by address makes, always finds the entry flow empty, and the page would only lead on to the login screen. The server says so at once, before any of the page is sent: the login screen's own gate then sends a signed-in user to the app's home in the same chain of redirects, and the visitor never waits for the page to hydrate. In the browser the load does nothing: a client-side navigation to the page comes from a screen that has just made a request, and the page's own effect leads to the login screen when none is held.
 *
 * Tested in `emailSentLoad.test.ts`.
 *
 * @param options.loginRoute - The app's login screen, as a key of the `ROUTE` map.
 * @param options.inBrowser - Whether the load runs in the browser: `browser` of `$app/environment`, read on each call.
 * @returns The page's load.
 */
export function emailSentLoad({ loginRoute, inBrowser }: { loginRoute: Route; inBrowser: () => boolean }) {
  return function load() {
    if (!inBrowser()) redirect(307, buildRoute({ route: loginRoute, locale: getLocale() }));
  };
}
