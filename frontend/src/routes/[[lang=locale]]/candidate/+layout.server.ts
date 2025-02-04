/**
 * # Candidate App outermost server loader
 *
 * Gets the jwt auth token from the cookie and adds it to page data from which it will be picked up by the `CandidateContext`.
 */

export async function load({ cookies }) {
  const token = cookies.get('token');
  return { token };
}
