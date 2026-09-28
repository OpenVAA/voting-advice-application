import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callerMayOnProject } from './callerAuthority.ts';
import { writeEntityGrant } from './entityGrant.ts';
import { requireEnv } from './envConfig.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // -------------------------------------------------------------------------
    // 1. Parse and validate request body
    // -------------------------------------------------------------------------
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid or missing request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    // The body carries no organization field: a candidate's nominating organization is the `parent_nomination_id` edge on the nomination created for them, not a field on the invitation.
    const { firstName, lastName, email, projectId } = body as {
      firstName?: string;
      lastName?: string;
      email?: string;
      projectId?: string;
    };

    if (!firstName || !lastName || !email || !projectId) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: firstName, lastName, email, and projectId are required'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // -------------------------------------------------------------------------
    // 2. Verify the caller may create entities in this project
    // -------------------------------------------------------------------------
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // First, verify the token is valid server-side via getUser()
    const callerClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const {
      data: { user: callerUser },
      error: userError
    } = await callerClient.auth.getUser();

    if (userError || !callerUser) {
      return new Response(JSON.stringify({ error: 'Invalid or expired authentication token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // THE AUTHORITY DECISION IS THE DATABASE'S, asked through the caller's own token. This function creates a candidate in `projectId`, writes that candidate's entity grant and sends an invitation, all through the service-role client below -- so this is the only check standing between a caller and another tenant's project. `user_can` holds the reach rules, including the project-to-account hop; a TypeScript re-derivation of the matrix over the raw `grants` claim would be a second copy that can drift from it.
    //
    // The permission is `project.edit_entities`: inviting a candidate creates an entity in the project. A caller with no grants claim, or a claim the hook did not write, is denied by `user_can` itself.
    const mayInvite = await callerMayOnProject(callerClient, projectId, 'project.edit_entities');

    if (!mayInvite) {
      return new Response(JSON.stringify({ error: 'Forbidden: caller may not create candidates in this project' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // -------------------------------------------------------------------------
    // 3. Create admin client (service_role)
    // -------------------------------------------------------------------------
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // -------------------------------------------------------------------------
    // 4. Create candidate record
    // -------------------------------------------------------------------------
    const candidateInsert: Record<string, unknown> = {
      first_name: firstName,
      last_name: lastName,
      project_id: projectId
    };

    const { data: candidate, error: candidateError } = await supabaseAdmin
      .from('candidates')
      .insert(candidateInsert)
      .select()
      .single();

    if (candidateError || !candidate) {
      return new Response(
        JSON.stringify({ error: 'Failed to create candidate record', details: candidateError?.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // -------------------------------------------------------------------------
    // 5. Send invite email
    // -------------------------------------------------------------------------
    // SITE_URL is required rather than defaulted: a fallback to the Supabase API host would address the invite link at the API origin, where the recipient cannot complete their registration, and nothing in the deployment would report a problem.
    const siteUrl = requireEnv('SITE_URL', Deno.env.get('SITE_URL'));
    const redirectTo = `${siteUrl}/candidate/complete-registration`;

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { candidate_id: candidate.id, project_id: projectId },
      redirectTo
    });

    if (inviteError || !inviteData?.user) {
      // Rollback: delete candidate record since invite failed
      await supabaseAdmin.from('candidates').delete().eq('id', candidate.id);

      return new Response(JSON.stringify({ error: 'Failed to send invite email', details: inviteError?.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // -------------------------------------------------------------------------
    // 6. Write the grant that makes the invited identity able to act
    // -------------------------------------------------------------------------
    // THIS FAILURE ABORTS even though the invite email has already been sent. An identity holding no grant row can do nothing at all -- the access-token hook projects the grant table and the claim it builds for a grant-less user answers false for every permission -- so reporting success here would hand a candidate an invite into an application that refuses them everything, with no error anywhere to attribute it to.
    //
    // The rollback undoes EVERYTHING this request created: the invited auth user as well as the candidate row. Deleting only the candidate would leave the invited `auth.users` row behind, so a retry would fail with "already registered" while the invitee held a live invite link to an account with no authority. Deleting the auth user also removes any grant row it holds (`grants.user_id` is ON DELETE CASCADE).
    //
    // The entity type is named HERE and nowhere else in this function: the grant write itself is entity-type parameterised, so adding a second entity kind later is a second call site rather than a change to the write.
    try {
      await writeEntityGrant(supabaseAdmin, {
        userId: inviteData.user.id,
        entityType: 'candidate',
        entityId: candidate.id
      });
    } catch (grantErr) {
      await rollbackInvite(supabaseAdmin, { candidateId: candidate.id, userId: inviteData.user.id });

      return new Response(
        JSON.stringify({
          error: 'Failed to grant the invited candidate access to their own record',
          details: grantErr instanceof Error ? grantErr.message : String(grantErr)
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // -------------------------------------------------------------------------
    // 7. Link auth user to candidate record
    // -------------------------------------------------------------------------
    const { error: linkError } = await supabaseAdmin
      .from('candidates')
      .update({ auth_user_id: inviteData.user.id })
      .eq('id', candidate.id);

    // FATAL, with the same full rollback. `get_candidate_user_data` resolves the candidate's own row by `auth_user_id`, so an unlinked candidate holds a grant yet can never load their own record -- the invite would "succeed" into an account that cannot work, and nothing later establishes the link.
    if (linkError) {
      await rollbackInvite(supabaseAdmin, { candidateId: candidate.id, userId: inviteData.user.id });

      return new Response(
        JSON.stringify({
          error: 'Failed to link the invited user to the candidate record',
          details: linkError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // -------------------------------------------------------------------------
    // 8. Return success response
    // -------------------------------------------------------------------------
    return new Response(
      JSON.stringify({
        success: true,
        candidateId: candidate.id,
        userId: inviteData.user.id
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    // Logged, never returned. This arm also catches the ERR_ENV_UNCONFIGURED throw above, whose message names an environment variable; echoing it would hand a caller the deployment's configuration surface in exchange for a misconfiguration. Matches the identity-callback convention.
    console.error('invite-candidate error:', err);

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

/**
 * Undo an invitation that failed after the invite was sent: delete the invited auth user -- which also removes any grant row it holds, because `grants.user_id` is ON DELETE CASCADE -- and the candidate row this request created.
 *
 * Best effort by design: a rollback step that fails is logged and the next one still runs, because the caller is already returning a failure and a throw here would replace that failure's message with the rollback's.
 * @param supabaseAdmin - The service-role client.
 * @param ids.candidateId - The candidate row this request inserted.
 * @param ids.userId - The auth user this request invited.
 */
async function rollbackInvite(
  supabaseAdmin: ReturnType<typeof createClient>,
  { candidateId, userId }: { candidateId: string; userId: string }
): Promise<void> {
  const { error: userError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (userError) console.error('invite-candidate rollback: failed to delete the invited auth user:', userError.message);
  const { error: candidateError } = await supabaseAdmin.from('candidates').delete().eq('id', candidateId);
  if (candidateError)
    console.error('invite-candidate rollback: failed to delete the candidate row:', candidateError.message);
}
