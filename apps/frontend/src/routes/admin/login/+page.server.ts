/**
 * # Admin App login page's server load and action
 *
 * The load is the apps' shared `signedOutReasonLoad`: it brings a client-side navigation to this page to the request hook, and answers why the visitor was sent here when the hook has just ended the session at the end of a logout count.
 *
 * The action is the apps' shared password sign-in action with the Admin App's grant shapes, home and log label. The grants the gate admits are read for this project, so it admits an admin grant on this project, on its account or at global scope, or an editor grant on this project, and refuses an admin of another project only.
 */

import { ADMIN_GRANTS } from '$lib/auth';
import { signedOutReasonLoad } from '$lib/server/auth/accountLoads';
import { passwordLoginAction } from '$lib/server/auth/passwordLoginAction';

export const load = signedOutReasonLoad;

export const actions = {
  default: passwordLoginAction({ allowedGrants: ADMIN_GRANTS, home: 'AdminAppHome', logLabel: 'Admin login' })
};
