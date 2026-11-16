/**
 * The Edge Functions' authority gate: ask the DATABASE whether the caller may do a thing, never re-derive the answer here.
 *
 * `public.user_can(scope, target_id, permission, target_type)` is the single place the role x permission matrix is encoded, and no second copy of it may exist. A gate that hand-codes a subset of the matrix from the raw JWT `grants` claim diverges from it: resolving which account owns a project is a reach rule only the database holds, so a TypeScript copy admits an account admin of ANY account or refuses a role the matrix grants the permission to.
 *
 * The call goes through the CALLER'S OWN client, so `user_can` reads the caller's own `grants` claim from their token -- the same claim every RLS policy reads. A service-role client must never be passed here: its token carries no grants claim, and the answer would describe the service role rather than the caller.
 *
 * Fails CLOSED: an RPC error, a non-boolean answer, or an absent/blank target id is a denial.
 *
 * ONE COPY. `send-email` is the only Edge Function that gates on the caller's authority. Supabase deploys each top-level function directory as its own unit and this repository has no shared module directory for Edge Functions, so a second function that needs this gate holds a byte-identical copy, and `DUPLICATED_MODULES` in `scripts/assert-edge-env-defaults.mjs` names the module so that the copies cannot drift (the `envConfig.ts` precedent).
 *
 * Reaches no remote origin, so vitest can import it -- unlike `index.ts`, whose `npm:` specifiers only Deno resolves.
 */

/** The slice of a supabase-js client this module uses: an awaitable `rpc` call. */
export interface RpcClient {
  rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }>;
}

/** The members of `public.entity_type`. */
export type EntityType = 'candidate' | 'organization' | 'faction' | 'alliance';

const ENTITY_TYPES: ReadonlyArray<string> = ['candidate', 'organization', 'faction', 'alliance'];

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
  return askUserCan(callerClient, { p_scope: 'project', p_target_id: projectId.trim(), p_permission: permission });
}

/**
 * Does the caller hold `permission` on the entity of type `entityType` with id `entityId`, per `public.user_can`?
 *
 * Ask every entity-scope question through this helper. `user_can`'s `p_target_type` is optional so that project-scope callers can pass three arguments, which lets an entity-scope call without a type compile; the database then denies it, and nothing says why. Here the type is a required parameter.
 *
 * @param callerClient - A client carrying the CALLER'S bearer token, never a service-role client.
 * @param entityType - The entity's table type. A value outside `public.entity_type` denies without a round trip.
 * @param entityId - The entity's id. Blank or absent denies without a round trip.
 * @param permission - A member of `public.grant_permission`, for example `entity.edit_answers`.
 */
export async function callerMayOnEntity(
  callerClient: RpcClient,
  entityType: EntityType,
  entityId: unknown,
  permission: string
): Promise<boolean> {
  if (!ENTITY_TYPES.includes(entityType)) return false;
  if (typeof entityId !== 'string' || entityId.trim() === '') return false;
  return askUserCan(callerClient, {
    p_scope: 'entity',
    p_target_id: entityId.trim(),
    p_permission: permission,
    p_target_type: entityType
  });
}

/** Puts one question to `public.user_can`; anything but a literal `true` is a denial. */
async function askUserCan(callerClient: RpcClient, args: Record<string, unknown>): Promise<boolean> {
  try {
    const { data, error } = await callerClient.rpc('user_can', args);
    return !error && data === true;
  } catch {
    return false;
  }
}
