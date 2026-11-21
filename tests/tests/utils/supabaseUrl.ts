/**
 * The URL of the Supabase stack the suite runs against, taken from the process environment the suite runs with.
 *
 * It never throws, so it may be read at module load as well as inside a test body or a fixture.
 *
 * @returns `SUPABASE_URL` when it is set, else the local stack's default, the fallback the tests' admin client uses.
 */
export function supabaseUrl(): string {
  return process.env.SUPABASE_URL?.trim() || 'http://localhost:54321';
}
