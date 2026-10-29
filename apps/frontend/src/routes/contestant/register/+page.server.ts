import { COOKIE } from '$lib/cookies';
import { refuseUnlessRegistrationOffered } from '$lib/server/contestant/registrationGuard';

/**
 * The registration page is served only where the project lists at least one registration mode, and leads to the login page otherwise.
 *
 * It also answers whether the request carries {@link COOKIE.registered}, which a browser receives once it has confirmed an address, so that the page can say that the user looks to be registered already. Nothing of the address bar is read for it.
 *
 * Tested in `page.server.test.ts`.
 */
export async function load(event) {
  await refuseUnlessRegistrationOffered(event, 'any');
  return { registered: event.cookies.get(COOKIE.registered) !== undefined };
}

export const actions = {
  /**
   * Remove {@link COOKIE.registered}, on the path it was set on, so that the notice it brings is not shown again. SvelteKit's origin check of a form action refuses a post another site makes.
   */
  dismissRegistered: async ({ cookies }) => {
    cookies.delete(COOKIE.registered, { path: '/' });
  }
};
