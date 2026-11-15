import { refuseUnlessRegistrationOffered } from '$lib/server/contestant/registrationGuard';

/**
 * The registration page is served only where the project lists at least one registration mode, and leads to the login page otherwise.
 */
export async function load(event) {
  await refuseUnlessRegistrationOffered(event, 'any');
}
