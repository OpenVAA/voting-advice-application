/**
 * The anon key of the Supabase stack the suite runs against, taken from the process environment the suite runs with.
 *
 * Call it inside a test body or a fixture, never at module load: it throws when no key is set, and a throw at module load fails `playwright test --list`, which needs no key.
 *
 * @returns `SUPABASE_ANON_KEY` when it is set, else `PUBLIC_SUPABASE_ANON_KEY`.
 * @throws Error naming both variables when neither is set.
 */
export function supabaseAnonKey(): string {
  const key = process.env.SUPABASE_ANON_KEY?.trim() || process.env.PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!key) {
    throw new Error(
      'Neither SUPABASE_ANON_KEY nor PUBLIC_SUPABASE_ANON_KEY is set. A spec that calls the auth service as an ' +
        'unauthenticated caller needs the anon key of the local stack in one of the two.'
    );
  }
  return key;
}
