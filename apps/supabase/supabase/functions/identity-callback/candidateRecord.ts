/**
 * Existing-candidate lookup, creation and deletion for the identity-callback Edge Function.
 *
 * Extracted from the Edge Function entry point for testability. This module reaches the Deno runtime global nowhere and imports from a remote origin nowhere -- no environment read, no server registration, no URL import -- so it can be imported by both the Edge Function and vitest. The client is a parameter and the project id is a parameter for that reason: the caller reads the environment, and this module holds only the query shape, which is the half worth asserting.
 *
 * WHY THE LOOKUP GOES THROUGH THE GRANT. The `(entity, candidate, <id>, editor)` grant is the only link from an auth user to the candidate it edits, so the lookup reads the user's candidate-editor grants first and the candidates they name second. `grants.target_id` carries no foreign key, because a grant may target any of several tables, so PostgREST cannot embed the join and the lookup is two queries.
 *
 * WHY THE PROJECT FILTER IS PART OF THE LOOKUP RATHER THAN OF THE CALLER. Grants carry no project, and one identity may legitimately be a candidate in several projects, so the project term lives in the candidates query. The queries run on the service-role client, which bypasses row-level security entirely, so no policy supplies the missing term and a lookup without it would return a candidate belonging to a project this deployment does not serve, then adopt it.
 *
 * WHY THE ERROR IS READ RATHER THAN DISCARDED. `maybeSingle()` answers a zero-row read as `{ data: null, error: null }` and populates `error` for a transport failure and for two or more matching rows alike. Discarding `error` collapses all three into one value, and the caller reads that value as "no candidate here" and creates one -- a second candidate for an identity that already has one. `maybeSingle()` is still the right call, because zero rows is the ordinary first-registration case and must stay a null return; what makes it safe is that everything else is a throw. The grants query is read the same way for the same reason.
 */

/** What an awaited grants query resolves to. */
export interface GrantTargetsResult {
  data: Array<{ target_id: string }> | null;
  error: { message: string } | null;
}

/** What `maybeSingle()` on the candidates query resolves to. */
export interface CandidateRowResult {
  data: { id: string } | null;
  error: { message: string } | null;
}

/**
 * The filter builder both lookup queries chain on.
 *
 * Awaited directly it resolves the grants query; `maybeSingle()` ends the candidates query. One shape serves both chains so the client below can be a single `from(...).select(...)` entry.
 */
export interface CandidateLookupFilter extends PromiseLike<GrantTargetsResult> {
  eq(column: string, value: string): CandidateLookupFilter;
  in(column: string, values: Array<string>): CandidateLookupFilter;
  maybeSingle(): PromiseLike<CandidateRowResult>;
}

/**
 * The narrow slice of the Supabase client the lookup uses.
 *
 * Declared locally rather than imported so the module needs no import at all, which is what keeps it free of the remote specifier the Edge Function entry point holds.
 */
export interface CandidateLookupClient {
  from(table: string): {
    select(columns: string): CandidateLookupFilter;
  };
}

/**
 * An `ERR_CANDIDATE_LOOKUP_FAILED` error carrying the client-reported text only.
 *
 * @param message - The message the client reported.
 * @returns The error to throw.
 */
function lookupFailed(message: string): Error & { code: string } {
  return Object.assign(new Error(`Candidate lookup failed: ${message}`), { code: 'ERR_CANDIDATE_LOOKUP_FAILED' });
}

/**
 * Find the candidate this identity edits in this project, or null when it edits none.
 *
 * @param client - A Supabase client; normally the service-role admin client.
 * @param scope - The project this deployment serves and the authenticated user to look up.
 * @returns The candidate row's id, or null when the user holds no candidate-editor grant on a candidate in this project.
 * @throws {Error & { code: string }} `ERR_CANDIDATE_LOOKUP_FAILED` when either query failed, including when two granted candidates sit in this project. The message carries the client-reported text only: this function is served without JWT verification, so no project id, no user id and no configuration value goes into it.
 */
export async function findExistingCandidate(
  client: CandidateLookupClient,
  { projectId, authUserId }: { projectId: string; authUserId: string }
): Promise<{ id: string } | null> {
  const { data: grants, error: grantError } = await client
    .from('grants')
    .select('target_id')
    .eq('user_id', authUserId)
    .eq('scope', 'entity')
    .eq('target_type', 'candidate')
    .eq('role', 'editor');

  if (grantError) throw lookupFailed(grantError.message);

  const ids = (grants ?? []).map((grant) => grant.target_id);
  if (ids.length === 0) return null;

  const { data, error } = await client
    .from('candidates')
    .select('id')
    .eq('project_id', projectId)
    .in('id', ids)
    .maybeSingle();

  if (error) throw lookupFailed(error.message);

  return data;
}

/**
 * The narrow slice of the Supabase client the creation below uses.
 *
 * Declared locally, and separately from {@link CandidateLookupClient}, for the same reason that one is: this module needs no import at all, which is what keeps it free of the remote specifier the Edge Function entry point holds. The two shapes are different chains and modelling them as one would mean declaring methods neither call makes.
 */
export interface CandidateCreateClient {
  from(table: string): {
    insert(row: Record<string, unknown>): {
      select(columns: string): {
        single(): Promise<{ data: { id: string } | null; error: { message: string } | null }>;
      };
    };
  };
}

/**
 * Create the candidate row for an identity that edits none in this project.
 *
 * WHY THE ROW IS WRITTEN CONFIRMED. `candidates.confirmed` defaults to the unconfirmed direction, which is the right answer for a row nobody has vouched for. This entry point is the one automatic path where somebody has: a strong identity check has completed by the time this runs, the caller has verified the identity provider's assertion, and the name written below came from that assertion rather than from anything the user typed.
 *
 * WHY THE ENTITY TYPE IS NOT A PARAMETER. This entry point creates candidates only. Only the grant write beside this one is generalised; adding a second entity kind later is a second function rather than a branch here.
 *
 * WHY A FAILED INSERT IS A THROW rather than a null return. A caller that read a null as "no candidate" would go on to hand a session to an identity with no entity row and no grant, and the failure would surface later as an unexplained wall of denials instead of as an error anyone can attribute. The lookup above returns null for the ordinary zero-row case; this function has no such case.
 *
 * @param client - A Supabase client; normally the service-role admin client, which bypasses row-level security.
 * @param candidate - The project this deployment serves and the two name parts taken from the provider's assertion.
 * @returns The created candidate row's id.
 * @throws {Error & { code: string }} `ERR_CANDIDATE_CREATE_FAILED` when the insert failed, or when it reported no error and returned no row. The message carries the client-reported text only: this function is served without JWT verification, so no project id, no user id and no configuration value goes into it.
 */
export async function createCandidate(
  client: CandidateCreateClient,
  { projectId, firstName, lastName }: { projectId: string; firstName: string; lastName: string }
): Promise<{ id: string }> {
  const { data, error } = await client
    .from('candidates')
    .insert({
      first_name: firstName,
      last_name: lastName,
      project_id: projectId,
      confirmed: true
    })
    .select('id')
    .single();

  if (error || !data) {
    throw Object.assign(new Error(`Failed to create candidate record: ${error?.message ?? 'no row returned'}`), {
      code: 'ERR_CANDIDATE_CREATE_FAILED'
    });
  }

  return data;
}

/** The filter builder the deletion below chains on; awaited, it resolves the delete. */
export interface CandidateDeleteFilter extends PromiseLike<{ error: { message: string } | null }> {
  eq(column: string, value: string): CandidateDeleteFilter;
}

/**
 * The narrow slice of the Supabase client the deletion below uses.
 *
 * Declared locally, and separately from the other two, for the reason they are: no import, and no methods this chain does not call.
 */
export interface CandidateDeleteClient {
  from(table: string): {
    delete(): CandidateDeleteFilter;
  };
}

/**
 * Delete a candidate this request has just created, when the grant naming it could not be written.
 *
 * A candidate no grant names can never be found again by {@link findExistingCandidate}, so leaving it would make the next login create a second one. Deleting the candidate also removes any grant naming it, through the `cleanup_grants_on_delete` trigger, which covers a grant whose write committed but whose response was lost.
 *
 * @param client - A Supabase client; normally the service-role admin client, which bypasses row-level security.
 * @param candidate - The project this deployment serves and the id of the candidate to delete.
 * @throws {Error & { code: string }} `ERR_CANDIDATE_DELETE_FAILED` when the delete failed. The message carries the client-reported text only: this function is served without JWT verification, so no project id, no user id and no configuration value goes into it.
 */
export async function deleteCandidate(
  client: CandidateDeleteClient,
  { projectId, candidateId }: { projectId: string; candidateId: string }
): Promise<void> {
  const { error } = await client.from('candidates').delete().eq('id', candidateId).eq('project_id', projectId);

  if (error) {
    throw Object.assign(new Error(`Candidate delete failed: ${error.message}`), {
      code: 'ERR_CANDIDATE_DELETE_FAILED'
    });
  }
}
