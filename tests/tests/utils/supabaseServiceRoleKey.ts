/**
 * The service role's key of the Supabase stack the suite runs against, taken from the process environment the suite runs with.
 *
 * The `account-access` function keeps a request's completion witness only when the request carries this key as its bearer, so a step that witnesses a request sends it. Call it inside a test body or a fixture, never at module load: it throws when no key is set, and a throw at module load fails `playwright test --list`, which needs no key.
 *
 * @returns `SUPABASE_SERVICE_ROLE_KEY`.
 * @throws Error naming the variable when it is not set.
 */
export function supabaseServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. A step that gives a request to the account-access function a completion ' +
        "witness needs the local stack's service role key."
    );
  }
  return key;
}
