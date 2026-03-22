/**
 * # Admin App outermost server loader
 *
 * Checks Supabase session and provides session data to downstream loaders.
 */

export async function load({ locals }) {
  const { session } = await locals.safeGetSession();
  return { session };
}
