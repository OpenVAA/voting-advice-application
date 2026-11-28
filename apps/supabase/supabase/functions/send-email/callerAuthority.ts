/**
 * The Edge Functions' authority gate: ask the DATABASE whether the caller may do a thing, never re-derive the answer here.
 *
 * `public.user_can(scope, target_id, permission, target_type)` is the single place the role x permission matrix is encoded, and no second copy of it may exist. A gate that hand-codes a subset of the matrix from the raw JWT `grants` claim diverges from it: resolving which account owns a project is a reach rule only the database holds, so a TypeScript copy admits an account admin of ANY account or refuses a role the matrix grants the permission to.
 *
 * The call goes through the CALLER'S OWN client, so `user_can` reads the caller's own `grants` claim from their token -- the same claim every RLS policy reads. A service-role client must never be passed here: its token carries no grants claim, and the answer would describe the service role rather than the caller.
 *
 * Fails CLOSED: an RPC error, a non-boolean answer, or an absent/blank target id is a denial.
 *
 * ONE FUNCTION, ONE DIRECTORY. `send-email` is the only Edge Function that gates on the caller's authority, so the module lives in `send-email/`. A second function that needs the gate moves it to `functions/_shared/` and imports it from there.
 *
 * Reaches no remote origin, so vitest can import it -- unlike `index.ts`, whose `npm:` specifiers only Deno resolves.
 */

/** The members of `public.grant_permission`, in the enum's order. `callerAuthority.test.ts` compares this list with the enum declared in `schema/000-enums.sql`. */
export const GRANT_PERMISSIONS = [
  'feedback.read',
  'feedback.manage',
  'account.edit_settings',
  'account.manage_projects',
  'account.manage_admins',
  'project.manage_editors',
  'project.edit_project_settings',
  'project.edit_app_settings',
  'project.edit_structure',
  'project.edit_questions',
  'project.read_structure',
  'project.edit_entities',
  'project.edit_nominations',
  'project.read_entities',
  'entity.edit_answers',
  'entity.read_answers',
  'entity.edit_confirmed_names',
  'entity.invite_children',
  'entity.confirm',
  'nomination.edit',
  'nomination.read',
  'nomination.confirm',
  'nomination.create_parent'
] as const;

/** A member of `public.grant_permission`: a permission `user_can` is asked about. */
export type GrantPermission = (typeof GRANT_PERMISSIONS)[number];

/** The arguments of a project-scope `public.user_can` question. */
export type UserCanArgs = {
  p_scope: 'project';
  p_target_id: string;
  p_permission: GrantPermission;
};

/** The slice of a supabase-js client this module uses: an awaitable `user_can` call. */
export interface RpcClient {
  rpc: (fn: 'user_can', args: UserCanArgs) => PromiseLike<{ data: unknown; error: unknown }>;
}

/**
 * Does the caller hold `permission` on project `projectId`, per `public.user_can`?
 *
 * @param callerClient - A client carrying the CALLER'S bearer token, never a service-role client.
 * @param projectId - The project the request acts on. Blank or absent denies without a round trip.
 * @param permission - The permission asked about, for example `project.edit_entities`.
 */
export async function callerMayOnProject(
  callerClient: RpcClient,
  projectId: string | null | undefined,
  permission: GrantPermission
): Promise<boolean> {
  // The type is checked at run time too, because the id usually comes from a parsed request body.
  if (typeof projectId !== 'string' || projectId.trim() === '') return false;
  return askUserCan(callerClient, { p_scope: 'project', p_target_id: projectId.trim(), p_permission: permission });
}

/** Puts one question to `public.user_can`; anything but a literal `true` is a denial. */
async function askUserCan(callerClient: RpcClient, args: UserCanArgs): Promise<boolean> {
  try {
    const { data, error } = await callerClient.rpc('user_can', args);
    return !error && data === true;
  } catch {
    return false;
  }
}
