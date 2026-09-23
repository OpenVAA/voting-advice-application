/**
 * The Edge Functions' authority gate: ask the DATABASE whether the caller may do a thing, never re-derive the answer here.
 *
 * `public.user_can(scope, target_id, permission)` is the single place the role x permission matrix is encoded (SPEC section 5), and SPEC section 9 forbids a second copy of it. The two gates this replaced -- one in `invite-candidate`, one in `send-email` -- each hand-coded a subset of the matrix from the raw JWT `grants` claim, and they had already diverged from the matrix and from each other: both admitted an account admin of ANY account, because resolving which account owns the project is a reach rule only the database holds, and one refused a ProjectEditor that the matrix grants `project.edit_entities` (162-REVIEW CR-05, WR-09).
 *
 * The call goes through the CALLER'S OWN client, so `user_can` reads the caller's own `grants` claim from their token -- the same claim every RLS policy reads. A service-role client must never be passed here: its token carries no grants claim, and the answer would describe the service role rather than the caller.
 *
 * Fails CLOSED: an RPC error, a non-boolean answer, or an absent/blank project id is a denial.
 *
 * ⚠ BYTE-IDENTICAL COPIES live in `invite-candidate/` and `send-email/`, because Supabase deploys each top-level function directory as its own unit and this repository has no shared module directory for Edge Functions (the `envConfig.ts` precedent). `scripts/assert-edge-env-defaults.mjs` (a `yarn lint:check` link) fails when the two copies differ. Edit both or neither.
 *
 * Reaches no remote origin, so vitest can import it -- unlike `index.ts`, which resolves an `https://esm.sh` specifier.
 */

/** The slice of a supabase-js client this module uses: an awaitable `rpc` call. */
export interface RpcClient {
  rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }>;
}

/**
 * Does the caller hold `permission` on project `projectId`, per `public.user_can`?
 *
 * @param callerClient - A client carrying the CALLER'S bearer token, never a service-role client.
 * @param projectId - The project the request acts on. Blank or absent denies without a round trip.
 * @param permission - A member of `public.grant_permission`, for example `project.edit_entities`.
 */
export async function callerMayOnProject(
  callerClient: RpcClient,
  projectId: unknown,
  permission: string
): Promise<boolean> {
  if (typeof projectId !== 'string' || projectId.trim() === '') return false;
  try {
    const { data, error } = await callerClient.rpc('user_can', {
      p_scope: 'project',
      p_target_id: projectId.trim(),
      p_permission: permission
    });
    return !error && data === true;
  } catch {
    return false;
  }
}
