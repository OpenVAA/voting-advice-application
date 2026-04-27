/**
 * # Candidate App outermost server loader
 *
 * Gets the Supabase session from event.locals and adds it to page data
 * from which it will be picked up by the auth context's `isAuthenticated`
 * derived store and by the protected layout guard.
 */

export async function load({ locals }) {
  const { session } = await locals.safeGetSession();
  return { session };
}
