import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decodeJwtSegment } from './jwtSegment.ts';
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
    const { firstName, lastName, email, projectId, organizationId } = body as {
      firstName?: string;
      lastName?: string;
      email?: string;
      projectId?: string;
      organizationId?: string;
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
    // 2. Verify caller is admin
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

    // Decode JWT to check roles from claims (Custom Access Token Hook). The segment is base64url per RFC 7515 section 2, not plain base64, so it goes through `decodeJwtSegment` -- REVIEW-EDGE-01. The two alphabets differ in only two characters, which is why the previous expression survived review: it threw only on a token whose payload happened to encode a `-` or `_`, and a throw here turns an authorisation check into an opaque 500.
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(decodeJwtSegment(token.split('.')[1]));
    const userRoles: Array<{ role: string; scope_type: string; scope_id: string }> = payload.user_roles || [];

    const isAdmin = userRoles.some(
      (r) =>
        r.role === 'super_admin' ||
        r.role === 'account_admin' ||
        (r.role === 'project_admin' && r.scope_type === 'project' && r.scope_id === projectId)
    );

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: caller does not have admin role for this project' }), {
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
    if (organizationId) {
      candidateInsert.organization_id = organizationId;
    }

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
    // This read used to fall back to the Supabase API host, which is a wrong-host default rather than a degraded one: an unset SITE_URL addressed the invite link at the API origin, so the recipient followed a link that could not complete their registration, and nothing in the deployment reported a problem -- REVIEW-EDGE-02.
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
    // 6. Create role assignment
    // -------------------------------------------------------------------------
    const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
      user_id: inviteData.user.id,
      role: 'candidate',
      scope_type: 'candidate',
      scope_id: candidate.id
    });

    if (roleError) {
      // Log but don't fail -- invite email already sent, user can still complete registration.
      // The role can be assigned manually later if needed.
      console.error('Failed to create role assignment:', roleError.message);
    }

    // -------------------------------------------------------------------------
    // 7. Link auth user to candidate record
    // -------------------------------------------------------------------------
    const { error: linkError } = await supabaseAdmin
      .from('candidates')
      .update({ auth_user_id: inviteData.user.id })
      .eq('id', candidate.id);

    if (linkError) {
      // Log but don't fail -- the link can be established later
      console.error('Failed to link auth user to candidate:', linkError.message);
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
    // Logged, never returned. This arm now catches the ERR_ENV_UNCONFIGURED throw above, whose message names an environment variable; echoing it would hand a caller the deployment's configuration surface in exchange for a misconfiguration. Matches the identity-callback convention.
    console.error('invite-candidate error:', err);

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
