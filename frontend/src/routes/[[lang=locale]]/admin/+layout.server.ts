/**
 * # Admin App outermost server loader
 *
 * Gets Supabase session data and passes it to page data for AuthContext.
 */

export async function load({ locals }) {
  const { session, user } = await locals.safeGetSession();
  return { session, user };
}
