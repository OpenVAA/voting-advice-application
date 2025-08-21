/**
 * # Candidate App outermost server loader
 *
 * Gets the jwt auth token from the cookie and adds it to page data from which it will be picked up by the `CandidateContext`.
 */

import { AUTH_TOKEN_KEY } from '$lib/server/auth';

export async function load({ cookies }) {
  const token = cookies.get(AUTH_TOKEN_KEY);
  return { token };
}
