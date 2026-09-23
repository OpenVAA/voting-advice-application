/**
 * Existing-candidate lookup AND creation for the identity-callback Edge Function.
 *
 * Extracted from the Edge Function entry point for testability. This module reaches the Deno runtime global nowhere and imports from a remote origin nowhere -- no environment read, no server registration, no URL import -- so it can be imported by both the Edge Function and vitest. The client is a parameter and the project id is a parameter for that reason: the caller reads the environment, and this module holds only the query shape, which is the half worth asserting.
 *
 * WHY THE PROJECT FILTER IS PART OF THE LOOKUP RATHER THAN OF THE CALLER. The `candidates` table carries a project foreign key, and an auth user id is unique within Supabase auth but a candidates row carrying it is not unique across projects: one identity may legitimately be a candidate in several projects. The query runs on the service-role client, which bypasses row-level security entirely, so no policy supplies the missing term and a lookup filtered only on the user would return a row belonging to a project this deployment does not serve, then adopt it.
 *
 * WHY THE ERROR IS READ RATHER THAN DISCARDED. `maybeSingle()` answers a zero-row read as `{ data: null, error: null }` and populates `error` for a transport failure and for two or more matching rows alike. Discarding `error` collapses all three into one value, and the caller reads that value as "no candidate here" and creates one -- a second candidates row and a second role assignment for an identity that already has both. `maybeSingle()` is still the right call, because zero rows is the ordinary first-registration case and must stay a null return; what makes it safe is that everything else is a throw.
 */

/**
 * The narrow slice of the Supabase client this module uses.
 *
 * Declared locally rather than imported so the module needs no import at all, which is what keeps it free of the remote specifier the Edge Function entry point holds.
 */
export interface CandidateLookupClient {
  from(table: string): {
    select(columns: string): {
      eq(
        column: string,
        value: string
      ): {
        eq(
          column: string,
          value: string
        ): {
          maybeSingle(): Promise<{ data: { id: string } | null; error: { message: string } | null }>;
        };
      };
    };
  };
}

/**
 * Find the candidate row this identity already owns in this project, or null when it owns none.
 *
 * @param client - A Supabase client; normally the service-role admin client.
 * @param scope - The project this deployment serves and the authenticated user to look up.
 * @returns The candidate row's id, or null when the project holds no candidate for this user.
 * @throws {Error & { code: string }} `ERR_CANDIDATE_LOOKUP_FAILED` when the lookup itself failed. The message carries the client-reported text only: this function is served without JWT verification, so no project id, no user id and no configuration value goes into it.
 */
export async function findExistingCandidate(
  client: CandidateLookupClient,
  { projectId, authUserId }: { projectId: string; authUserId: string }
): Promise<{ id: string } | null> {
  const { data, error } = await client
    .from('candidates')
    .select('id')
    .eq('project_id', projectId)
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error) {
    throw Object.assign(new Error(`Candidate lookup failed: ${error.message}`), {
      code: 'ERR_CANDIDATE_LOOKUP_FAILED'
    });
  }

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
 * Create the candidate row for an identity that owns none in this project.
 *
 * WHY THE ROW IS WRITTEN CONFIRMED. `candidates.confirmed` defaults to the unconfirmed direction, which is the right answer for a row nobody has vouched for -- and this is the one runtime path in 162 where somebody has. A strong identity check has already completed by the time this runs: the caller has verified the identity provider's assertion, and the name written below came from that assertion rather than from anything the user typed. D-10 names this entry point as the ONLY automatic setter of the column that 162 ships, and 162-06 recorded that the wiring belongs to the plan that creates the column. Section 11.2's other routes to the flag need columns brief section 6.1 owns and are not built here.
 *
 * WHY THE ENTITY TYPE IS NOT A PARAMETER. Entity-type SELECTION at the identity entry point, and the creation paths for the other three entity tables, are the sign-up phase's scope by name. Only the grant write beside this one is generalised; this function writes a candidate, and adding a second entity kind later is a second function rather than a branch here.
 *
 * WHY A FAILED INSERT IS A THROW rather than a null return. A caller that read a null as "no candidate" would go on to hand a session to an identity with no entity row and no grant, and the failure would surface later as an unexplained wall of denials instead of as an error anyone can attribute. The lookup above returns null for the ordinary zero-row case; this function has no such case.
 *
 * @param client - A Supabase client; normally the service-role admin client, which bypasses row-level security.
 * @param candidate - The project this deployment serves, the authenticated user the row belongs to, and the two name parts taken from the provider's assertion.
 * @returns The created candidate row's id.
 * @throws {Error & { code: string }} `ERR_CANDIDATE_CREATE_FAILED` when the insert failed, or when it reported no error and returned no row. The message carries the client-reported text only: this function is served without JWT verification, so no project id, no user id and no configuration value goes into it.
 */
export async function createCandidate(
  client: CandidateCreateClient,
  {
    projectId,
    authUserId,
    firstName,
    lastName
  }: { projectId: string; authUserId: string; firstName: string; lastName: string }
): Promise<{ id: string }> {
  const { data, error } = await client
    .from('candidates')
    .insert({
      first_name: firstName,
      last_name: lastName,
      project_id: projectId,
      auth_user_id: authUserId,
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
