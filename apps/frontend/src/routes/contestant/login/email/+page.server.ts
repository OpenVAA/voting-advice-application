/**
 * # The sign-in screen's server load and action
 *
 * The load returns no data: it is what brings a client-side navigation to this page to the request hook.
 *
 * The action is the apps' shared password sign-in action with the Contestant App's grant shapes, home and log label.
 *
 * Tested in `page.server.test.ts`.
 */

import { CONTESTANT_GRANTS } from '$lib/auth';
import { passwordLoginAction } from '$lib/server/auth/passwordLoginAction';

/**
 * Returns no data. It exists so that a client-side navigation to this page sends a request the request hook sees, which sends a caller with a session to the app's home; see `appGates.ts`.
 *
 * @returns An empty object.
 */
export function load(): Record<string, never> {
  return {};
}

export const actions = {
  default: passwordLoginAction({
    allowedGrants: CONTESTANT_GRANTS,
    home: 'ContestantAppHome',
    logLabel: 'Contestant sign-in'
  })
};
