/**
 * Shared helpers for the live-database tiers of the dev-seed specs.
 */

/** Local `supabase start` API port. Authority: `apps/supabase/supabase/config.toml` `[api] port`. */
export const LOCAL_SUPABASE_API_PORT = 54321;

/**
 * Whether anything answers on the Supabase API, at `SUPABASE_URL` or at the local default port.
 *
 * @returns `true` on any HTTP answer, `false` only on a transport failure (connection refused or timeout).
 */
export async function localSupabaseIsReachable(): Promise<boolean> {
  const url = process.env.SUPABASE_URL ?? `http://127.0.0.1:${LOCAL_SUPABASE_API_PORT}`;
  try {
    // Kong answers here without credentials, and any status proves something is listening.
    await fetch(`${url}/rest/v1/`, { signal: AbortSignal.timeout(1500) });
    return true;
  } catch {
    return false;
  }
}

/**
 * Fail collection when a live tier would skip in the `dev-seed-integration` CI job.
 *
 * That job sets `DEV_SEED_INTEGRATION_REQUIRED=1` to declare that every live tier must run there, so a lost Supabase wiring turns the job red instead of leaving it green over skipped tiers.
 *
 * @param reachable - whether the tier can reach its database.
 * @param label - the tier, as the error names it.
 * @throws Error when `DEV_SEED_INTEGRATION_REQUIRED` is `1` and the tier cannot reach its database.
 */
export function assertLiveTierAllowedToSkip(reachable: boolean, label: string): void {
  if (process.env.DEV_SEED_INTEGRATION_REQUIRED === '1' && !reachable) {
    throw new Error(
      'DEV_SEED_INTEGRATION_REQUIRED=1 but no local Supabase answered; ' +
        label +
        ' must run in the dev-seed-integration job.'
    );
  }
}
