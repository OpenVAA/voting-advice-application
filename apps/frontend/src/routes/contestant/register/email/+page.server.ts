import { refuseUnlessRegistrationOffered } from '$lib/server/contestant/registrationGuard';

/**
 * The screen that takes an email address for a registration code is served only where the project lists the code mode, and leads to the login page otherwise.
 */
export async function load(event) {
  await refuseUnlessRegistrationOffered(event, 'code');
}
