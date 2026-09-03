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
 * POST /functions/v1/identity-callback Body: { id_token: string, project_id?: string }
 *
 * Environment variables (set via Supabase secrets):
 * - IDENTITY_PROVIDER_TYPE: Provider type; required, and one of 'signicat' or 'idura' (there is no default -- an unset value throws)
 * - IDENTITY_PROVIDER_DECRYPTION_JWKS: JSON string array of private JWK objects for JWE decryption
 * - IDENTITY_PROVIDER_JWKS_URI: URL to the provider's public JWKS endpoint for JWT signature verification
 * - IDENTITY_PROVIDER_CLIENT_ID: Expected audience in the JWT (required; verification throws when unset)
 * - IDENTITY_PROVIDER_ISSUER: Expected issuer of the JWT (required; verification throws when unset)
 * - DEFAULT_PROJECT_ID: Project to assign self-registered candidates to (required; an unset value throws, and the request body's project_id takes precedence when supplied)
 * - SITE_URL: Browser-facing site origin the post-login magic link redirects to (required; an unset value throws)
 * - SUPABASE_URL: Supabase project URL (auto-set by Supabase)
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key for admin operations (auto-set by Supabase)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as jose from 'https://deno.land/x/jose@v5.9.6/index.ts';
import { PROVIDER_CONFIGS, extractIdentityClaims } from './claimConfig.ts';
import { requireEnv } from './envConfig.ts';
import { requireVerifyClaimBinding } from './verifyConfig.ts';

const DEFAULT_SEED_PROJECT_ID = '00000000-0000-0000-0000-000000000001';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

/**
 * Determine whether a compact-serialization token is JWE (5 parts) or JWS/JWT (3 parts).
 * JWE compact serialization: header.encryptedKey.iv.ciphertext.tag (5 dot-separated parts) JWS compact serialization: header.payload.signature (3 dot-separated parts)
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

  const { plaintext } = await jose.compactDecrypt(jweToken, await jose.importJWK(privateKey, header.alg || 'RSA-OAEP'));

  return new TextDecoder().decode(plaintext);
}

/**
 * Verify a signed JWT against the provider's public JWKS and return the payload.
 */
async function verifyJwt(jwt: string): Promise<jose.JWTPayload> {
  const jwksUri = Deno.env.get('IDENTITY_PROVIDER_JWKS_URI')!;

  // Both claims are bound on every verification, never conditionally. The audience and the issuer are what tie a signature-valid token to THIS relying party and THIS provider; without them the check reduces to "signed by some key in the configured JWK set", which a token minted elsewhere for someone else also satisfies. A deployment that has not configured either variable now fails loudly here instead of verifying for anybody. Both variables are documented in `.env.example` and in `tests/IDURA-TEST-RUNBOOK.md`.
  // The guard sits on the path to `jose.jwtVerify` rather than beside a single environment read, so the binding is structural rather than positional -- every caller gets it, whatever route reaches this function.
  const { audience, issuer } = requireVerifyClaimBinding(
    Deno.env.get('IDENTITY_PROVIDER_CLIENT_ID'),
    Deno.env.get('IDENTITY_PROVIDER_ISSUER')
  );

  const { payload } = await jose.jwtVerify(jwt, jose.createRemoteJWKSet(new URL(jwksUri)), { audience, issuer });

  return payload;
}

// extractIdentityClaims is imported from claimConfig.ts (pure function, no Deno deps)

/**
 * Find an existing auth user by identity_match_value in app_metadata.
 * Returns the user ID if found, null otherwise.
 */
async function findUserByIdentityMatch(
  // reason: the supabase-js client is imported from an esm.sh URL at runtime and the Deno type-check has no local declaration for SupabaseClient<Database> to narrow to. Only `.auth.admin.listUsers` is used, and its result is destructured and guarded below.
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
      // reason: `users` comes from the untyped admin client above, so its element type is unavailable here. Only `app_metadata.identity_match_value` is read, via optional chaining.
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
    // Resolve provider configuration. Unset and unrecognised are ONE story told in two places, and the split is deliberate. An unset variable is a configuration error: the deployment never chose which provider to trust, and the choice decides which provider's claim map is applied to a verified token, so it throws here naming IDENTITY_PROVIDER_TYPE rather than being handed a provider silently. A value that is set but not in PROVIDER_CONFIGS is an operator typo the operator can act on, so it keeps falling through to the existing 500 below, which names the value it was given. The throw's message names the variable and nothing else, and it is caught by the outer handler, which logs the real error and answers with a fixed opaque string -- so neither the variable name nor its value leaves this function by that route.
    const providerType = requireEnv('IDENTITY_PROVIDER_TYPE', Deno.env.get('IDENTITY_PROVIDER_TYPE'));
    const config = PROVIDER_CONFIGS[providerType];
    if (!config) {
      return new Response(JSON.stringify({ error: `Unknown identity provider type: ${providerType}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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

    // The request body's project_id first, then the configured project, then a throw naming DEFAULT_PROJECT_ID. What was removed is the third operand, a hard-coded seed-tenant id: an unset variable used to write self-registered candidates into the seed tenant silently, which is a tenant assignment nobody chose. The constant that supplied it is deliberately left declared and unreferenced above -- Phase 161 owns its fate together with the DEFAULT_PROJECT_ID naming, and this phase's job is only to make the site fail loudly first.
    const projectId = project_id || requireEnv('DEFAULT_PROJECT_ID', Deno.env.get('DEFAULT_PROJECT_ID'));

    // 2. Process the token -- handle both JWE (5-part) and plain JWT (3-part)
    let innerJwt: string;

    if (isJweToken(id_token)) {
      // JWE-encrypted token: decrypt first, then verify
      try {
        innerJwt = await decryptJweToken(id_token);
      } catch (e) {
        // Logged, NEVER returned. This endpoint is served --no-verify-jwt and is reachable with the public anon key, so echoing the caught message back turns it into a step-by-step verification oracle: jose's own wording tells an unauthenticated caller whether the kid matched, whether decryption succeeded, whether the signature verified and whether iss/aud bound. The outer `error` string stays fixed and opaque, so the HTTP contract is unchanged.
        console.error('[identity-callback] token decryption failed:', e);
        return new Response(JSON.stringify({ error: 'Token decryption failed' }), {
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
      // Logged, never returned -- see the decryption arm above. jose's claim-validation messages name the offending claim ("unexpected \"iss\" claim value"), which is exactly the discrimination the oracle needs.
      console.error('[identity-callback] token verification failed:', e);
      return new Response(JSON.stringify({ error: 'Token verification failed' }), {
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
      // Logged, never returned -- see the decryption arm above. The claim-extraction message enumerates which configured claim names were present or missing, which discloses the provider's claim mapping to an unauthenticated caller.
      console.error('[identity-callback] identity claim extraction failed:', e);
      return new Response(JSON.stringify({ error: 'Invalid identity claims' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { firstName, lastName, matchValue: identityMatchValue, extraClaims: extractedClaims } = claimResult;

    // 5. Create admin Supabase client for user/candidate operations
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // 6. Find or create auth user by identity_match_value
    let userId = await findUserByIdentityMatch(supabaseAdmin, identityMatchValue);
    let isNewUser = false;

    // Bank-auth identities carry no real email at sign-in (the candidate is prompted to add one after login). GoTrue still requires an email or phone, so derive a stable placeholder from the persistent identity match value (`sub` for both providers, per PROVIDER_CONFIGS). The same value is reused for the magic-link generation below so user creation and login resolve to a single user record.
    //
    // This line is why `PROVIDER_CONFIGS[*].identityMatchProp` must name a claim that is unique per person: two candidates whose claim values are equal get the SAME placeholder email and the same `identity_match_value`, so the second to authenticate is matched to the first one's account above and handed a session for it below. Keying on `birthdate` -- a non-identifier claim -- would put that collision a shared birthday away rather than an attack.
    const placeholderEmail = `${identityMatchValue}@bank-auth.placeholder`;

    if (!userId) {
      // Create new auth user with the identity-derived placeholder email (candidate will be prompted to add a real one after login).
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: placeholderEmail,
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

    // 8. Generate session for immediate login Use generateLink with magiclink type to create a login URL, addressed to the same identity-derived placeholder email the user record was created with above so the admin generateLink API resolves to the existing user.
    const siteUrl = Deno.env.get('SUPABASE_URL')!.replace(/\/+$/, '');

    // A DIFFERENT value from `siteUrl` on the line above, which holds the trimmed Supabase API origin; this one is the browser-facing site origin the candidate lands on after the magic link is consumed. The two names are kept distinct on purpose, because the removed fallback was a hard-coded loopback origin with a hard-coded dev-server port: a production deployment that never set SITE_URL addressed its own login redirect to a developer's machine.
    const redirectSiteUrl = requireEnv('SITE_URL', Deno.env.get('SITE_URL'));

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: placeholderEmail,
      options: {
        redirectTo: `${redirectSiteUrl}/candidate`
      }
    });

    if (linkError) {
      // Fallback: if generateLink fails (e.g., requires real email), return user info and let the frontend establish the session via a different mechanism.
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
    // Logged, never returned. This arm catches the Supabase admin-API failures thrown above ("Failed to create auth user: ...", "Failed to list users: ..."), whose messages carry Postgres error text and schema detail. It ALSO catches the three ERR_ENV_UNCONFIGURED throws for IDENTITY_PROVIDER_TYPE, DEFAULT_PROJECT_ID and SITE_URL: this endpoint is served --no-verify-jwt, so a message naming an unset variable would tell an unauthenticated caller which parts of the deployment are unconfigured. The returned string below is a fixed literal with nothing interpolated into it, which is what keeps that true for every throw that reaches here, present and future.
    console.error('identity-callback error:', e);

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
