/**
 * Provider-Agnostic Identity Callback Edge Function
 *
 * Handles identity provider (Signicat or Idura) bank authentication callbacks by:
 * 1. Accepting a JWE-encrypted (or plain JWT) id_token from the OIDC callback
 * 2. Decrypting JWE tokens using the private JWKS from environment
 * 3. Verifying the inner JWT signature against the provider's public JWKS
 * 4. Extracting identity claims based on provider configuration
 * 5. Finding or creating a Supabase auth user matched by identity claim value
 * 6. Creating a candidate record and role assignment for new users
 * 7. Returning a session for immediate login
 *
 * POST /functions/v1/identity-callback
 * Body: { id_token: string, project_id?: string }
 *
 * Environment variables (set via Supabase secrets):
 * - IDENTITY_PROVIDER_TYPE: Provider type ('signicat' or 'idura', defaults to 'signicat')
 * - IDENTITY_PROVIDER_DECRYPTION_JWKS: JSON string array of private JWK objects for JWE decryption
 * - IDENTITY_PROVIDER_JWKS_URI: URL to the provider's public JWKS endpoint for JWT signature verification
 * - IDENTITY_PROVIDER_CLIENT_ID: Expected audience in the JWT
 * - DEFAULT_PROJECT_ID: Project to assign self-registered candidates to
 * - SUPABASE_URL: Supabase project URL (auto-set by Supabase)
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key for admin operations (auto-set by Supabase)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as jose from 'https://deno.land/x/jose@v5.9.6/index.ts';
import { PROVIDER_CONFIGS, extractIdentityClaims } from './claimConfig.ts';

const DEFAULT_SEED_PROJECT_ID = '00000000-0000-0000-0000-000000000001';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

/**
 * Determine whether a compact-serialization token is JWE (5 parts) or JWS/JWT (3 parts).
 * JWE compact serialization: header.encryptedKey.iv.ciphertext.tag (5 dot-separated parts)
 * JWS compact serialization: header.payload.signature (3 dot-separated parts)
 */
function isJweToken(token: string): boolean {
  return token.split('.').length === 5;
}

/**
 * Decrypt a JWE-encrypted id_token using the private JWKS from environment.
 * Returns the inner JWT string (compact serialization).
 */
async function decryptJweToken(jweToken: string): Promise<string> {
  const privateJWKSet: jose.JWK[] = JSON.parse(Deno.env.get('IDENTITY_PROVIDER_DECRYPTION_JWKS')!);

  const header = jose.decodeProtectedHeader(jweToken);
  const privateKey = privateJWKSet.find((jwk: jose.JWK) => jwk.kid === header.kid);

  if (!privateKey) {
    throw new Error(`No matching decryption key found for kid=${header.kid}`);
  }

  const { plaintext } = await jose.compactDecrypt(
    jweToken,
    await jose.importJWK(privateKey, header.alg || 'RSA-OAEP')
  );

  return new TextDecoder().decode(plaintext);
}

/**
 * Verify a signed JWT against the provider's public JWKS and return the payload.
 */
async function verifyJwt(jwt: string): Promise<jose.JWTPayload> {
  const jwksUri = Deno.env.get('IDENTITY_PROVIDER_JWKS_URI')!;
  const clientId = Deno.env.get('IDENTITY_PROVIDER_CLIENT_ID');

  const verifyOptions: jose.JWTVerifyOptions = {};
  if (clientId) {
    verifyOptions.audience = clientId;
  }

  const { payload } = await jose.jwtVerify(
    jwt,
    jose.createRemoteJWKSet(new URL(jwksUri)),
    verifyOptions
  );

  return payload;
}

// extractIdentityClaims is imported from claimConfig.ts (pure function, no Deno deps)

/**
 * Find an existing auth user by identity_match_value in app_metadata.
 * Returns the user ID if found, null otherwise.
 */
async function findUserByIdentityMatch(
  // deno-lint-ignore no-explicit-any
  supabaseAdmin: any,
  identityMatchValue: string
): Promise<string | null> {
  // listUsers returns paginated results; iterate through pages
  let page = 1;
  const perPage = 1000;

  while (true) {
    const {
      data: { users },
      error
    } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }

    if (!users || users.length === 0) {
      break;
    }

    const matchingUser = users.find(
      // deno-lint-ignore no-explicit-any
      (u: any) => u.app_metadata?.identity_match_value === identityMatchValue
    );

    if (matchingUser) {
      return matchingUser.id;
    }

    // If we got fewer results than perPage, we have reached the last page
    if (users.length < perPage) {
      break;
    }

    page++;
  }

  return null;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Resolve provider configuration
    const providerType = Deno.env.get('IDENTITY_PROVIDER_TYPE') ?? 'signicat';
    const config = PROVIDER_CONFIGS[providerType];
    if (!config) {
      return new Response(
        JSON.stringify({ error: `Unknown identity provider type: ${providerType}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 1. Parse request body
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid or missing request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const { id_token, project_id } = body;

    if (!id_token || typeof id_token !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid id_token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const projectId = project_id || Deno.env.get('DEFAULT_PROJECT_ID') || DEFAULT_SEED_PROJECT_ID;

    // 2. Process the token -- handle both JWE (5-part) and plain JWT (3-part)
    let innerJwt: string;

    if (isJweToken(id_token)) {
      // JWE-encrypted token: decrypt first, then verify
      try {
        innerJwt = await decryptJweToken(id_token);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'JWE decryption failed';
        return new Response(JSON.stringify({ error: 'Token decryption failed', details: message }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else {
      // Plain JWT: use directly
      innerJwt = id_token;
    }

    // 3. Verify the JWT signature against the provider's public JWKS
    let payload: jose.JWTPayload;
    try {
      payload = await verifyJwt(innerJwt);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'JWT verification failed';
      return new Response(JSON.stringify({ error: 'Token verification failed', details: message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. Extract identity claims based on provider configuration
    let claimResult: {
      matchValue: string;
      firstName: string;
      lastName: string;
      extraClaims: Record<string, unknown>;
    };
    try {
      claimResult = extractIdentityClaims(payload, config);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Missing identity claims';
      return new Response(JSON.stringify({ error: 'Invalid identity claims', details: message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { firstName, lastName, matchValue: identityMatchValue, extraClaims: extractedClaims } = claimResult;

    // 5. Create admin Supabase client for user/candidate operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 6. Find or create auth user by identity_match_value
    let userId = await findUserByIdentityMatch(supabaseAdmin, identityMatchValue);
    let isNewUser = false;

    if (!userId) {
      // Create new auth user (no email -- candidate will be prompted to add one after login)
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email_confirm: true,
        app_metadata: {
          identity_provider: providerType,
          identity_match_prop: config.identityMatchProp,
          identity_match_value: identityMatchValue,
          ...extractedClaims
        },
        user_metadata: {
          given_name: firstName,
          family_name: lastName
        }
      });

      if (createError) {
        throw new Error(`Failed to create auth user: ${createError.message}`);
      }

      userId = newUser.user.id;
      isNewUser = true;
    }

    // 7. Find or create candidate record
    const { data: existingCandidate } = await supabaseAdmin
      .from('candidates')
      .select('id')
      .eq('auth_user_id', userId)
      .maybeSingle();

    let candidateId: string;

    if (existingCandidate) {
      candidateId = existingCandidate.id;
    } else {
      // Create new candidate record
      const { data: candidate, error: candidateError } = await supabaseAdmin
        .from('candidates')
        .insert({
          first_name: firstName,
          last_name: lastName,
          project_id: projectId,
          auth_user_id: userId
        })
        .select('id')
        .single();

      if (candidateError) {
        throw new Error(`Failed to create candidate record: ${candidateError.message}`);
      }

      candidateId = candidate.id;

      // Create role assignment for the new candidate
      const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
        user_id: userId,
        role: 'candidate',
        scope_type: 'candidate',
        scope_id: candidateId
      });

      if (roleError) {
        throw new Error(`Failed to create role assignment: ${roleError.message}`);
      }
    }

    // 8. Generate session for immediate login
    // Use generateLink with magiclink type to create a login URL.
    // Since the user may not have an email yet, we use the user's ID-based
    // placeholder email. The admin generateLink API works with any email
    // that matches the user record.
    const siteUrl = Deno.env.get('SUPABASE_URL')!.replace(/\/+$/, '');

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: `${userId}@bank-auth.placeholder`,
      options: {
        redirectTo: `${Deno.env.get('SITE_URL') || 'http://127.0.0.1:5173'}/candidate`
      }
    });

    if (linkError) {
      // Fallback: if generateLink fails (e.g., requires real email), return user info
      // and let the frontend establish the session via a different mechanism.
      // The frontend can use supabase.auth.admin methods or prompt for email first.
      return new Response(
        JSON.stringify({
          success: true,
          user_id: userId,
          candidate_id: candidateId,
          is_new_user: isNewUser,
          session: null,
          message: 'User created/found but magic link generation failed. Frontend should prompt for email.',
          given_name: firstName,
          family_name: lastName
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Return the session data with the magic link properties
    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        candidate_id: candidateId,
        is_new_user: isNewUser,
        session: {
          action_link: linkData.properties?.action_link,
          hashed_token: linkData.properties?.hashed_token,
          verification_type: linkData.properties?.verification_type,
          redirect_to: linkData.properties?.redirect_to
        },
        given_name: firstName,
        family_name: lastName
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    console.error('identity-callback error:', e);

    return new Response(JSON.stringify({ error: 'Internal server error', details: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
