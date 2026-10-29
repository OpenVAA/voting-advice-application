/**
 * Provider-Agnostic Identity Callback Edge Function
 *
 * Turns an identity provider's ID token (Signicat or Idura) into an account, the entity the identity registered, and a sign-in token, in this order:
 * 0. Refuse every caller but the frontend server, which proves itself with the secret it sends in the `x-identity-callback-secret` header.
 * 1. Read the request: the ID token, the project, and the entity type asked for.
 * 2. Decrypt the token when it is a JWE, and verify its signature, audience and issuer against the configured provider.
 * 3. Read the provider's persistent subject identifier and the two name parts from the verified claims, a name sent all in capitals smart-cased.
 * 4. Decide the entity type from the project's stored registration-mode matrix, before any account or row is touched. This function is the authority on that decision: a caller's own check only selects, and a type the matrix does not allow for the identity provider's mode is refused here whoever asks.
 * 5. Find the account by the subject identifier, or create it without a password: an invite for its placeholder address.
 * 6. Find or create the entity with one call of `public.identity_entity_find_or_create`, then write the account's `app_metadata`, with the placeholder's confirmation for an account this identity has not finished yet. The call finds the entity the account's record names for the project and type, confirmed by a live editor grant, or creates the entity, its grant and the record. A candidate is written confirmed with the provider's names; an organization unconfirmed and without a name.
 * 7. Generate a sign-in link for the account's current address and answer with its token.
 *
 * The entity, its grant and the record are written before the link is generated, so the session the caller obtains already carries the grant.
 *
 * SIGN-INS THAT ARRIVE TOGETHER. Several first sign-ins of one identity can reach the function at once, from tabs or retries. The invites race for the one placeholder address and all but one fail, so a failed invite is followed by a look-up of the account on the address. The entity is found or created in one transaction under a lock on the account, so the requests make one entity between them. Every `app_metadata` write is made after that call: the auth service writes the whole of `app_metadata` from the copy it read when the update began, so a write begun before another request's call had committed could put back a record without that request's entity.
 *
 * WHY THE FUNCTION ANSWERS THE FRONTEND SERVER ALONE. The function turns a verified ID token into a sign-in token for the identity's account. It is reachable directly at its public address, so without the server's secret anyone holding a stolen or replayed ID token could present it here and sign in as its holder, bypassing the frontend's binding of the token to the browser that started the flow. A request without the header is refused before anything else is read, so an anonymous caller makes the function do no work and learns nothing about its configuration.
 *
 * POST /functions/v1/identity-callback Header: x-identity-callback-secret. Body: { id_token: string, project_id: uuid, entity_type?: 'candidate' | 'organization' }
 *
 * The project is the one the request names; the function reads none from its environment. A request that names no entity type is for the one served type whose matrix row allows the identity provider's mode; with none or several such types it is refused.
 *
 * Every answer is one result of the closed set in `requestContract.ts`, built by `resultBody` and sent with `resultStatus`: `created`, `found` and `no_entity` (200) carry the sign-in token; `refused` (401), `mode_not_allowed` (403), `invalid_token` (401), `bad_request` (400), `configuration` (500) and `unavailable` (503) carry nothing else. No caught message leaves the function.
 *
 * Environment variables (set via Supabase secrets):
 * - IDENTITY_PROVIDER_TYPE: Provider type; required, and one of 'signicat-ftn' or 'idura-ftn' (there is no default -- an unset value throws)
 * - IDENTITY_PROVIDER_DECRYPTION_JWKS: JSON string array of private JWK objects for JWE decryption (required; an unset value throws)
 * - IDENTITY_PROVIDER_JWKS_URI: URL to the provider's public JWKS endpoint for JWT signature verification (required; an unset value throws)
 * - IDENTITY_PROVIDER_CLIENT_ID: Expected audience in the JWT (required; verification throws when unset)
 * - IDENTITY_PROVIDER_ISSUER: Expected issuer of the JWT (required; verification throws when unset)
 * - IDENTITY_CALLBACK_SERVER_SECRET: The secret the frontend server sends in the credential header (required; read only for a request that carries the header, and an unset value then throws)
 * - SUPABASE_URL: Supabase project URL (auto-set by Supabase)
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key for admin operations (auto-set by Supabase)
 */

import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import * as jose from 'npm:jose@6.2.12';
import { identityAppMetadata } from './appMetadata.ts';
import { extractIdentityClaims, resolveProviderConfig } from './claimConfig.ts';
import { requireEnv } from './envConfig.ts';
import { findOrCreateOutcome } from './ownEntity.ts';
import { existingAccountSetup, holdsPlaceholderAddress } from './placeholderAccount.ts';
import { placeholderAddressFor } from './placeholderAddress.ts';
import { resolveEntityType } from './registrationMatrix.ts';
import { IDENTITY_CALLBACK_RESULT, parseIdentityCallbackRequest, resultBody, resultStatus } from './requestContract.ts';
import type { IdentityCallbackResult } from './requestContract.ts';
import { presentsServerCredential, SERVER_CREDENTIAL_HEADER } from './serverCredential.ts';
import { requireVerifyClaimBinding } from './verifyConfig.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

/** The error codes that mean the deployment is not configured, answered as `configuration` rather than as an outage. */
const CONFIGURATION_FAILURE_CODES: ReadonlyArray<string> = [
  'ERR_ENV_UNCONFIGURED',
  'ERR_AUDIENCE_UNCONFIGURED',
  'ERR_ISSUER_UNCONFIGURED'
];

/** The account fields this function reads from the auth service's admin answers. */
interface AuthAccount {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
}

/**
 * The answer for one result, its body built by `resultBody` alone.
 *
 * @param result - The result.
 * @param token - The sign-in token, for a success.
 */
function respond(result: IdentityCallbackResult, token?: string): Response {
  return new Response(JSON.stringify(resultBody(result, token)), {
    status: resultStatus(result),
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/** Whether a caught error is a configuration failure, read by its `code` alone. */
function isConfigurationFailure(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === 'string' && CONFIGURATION_FAILURE_CODES.includes(code);
}

/** An error carrying a code and the client-reported text only: no address, no user id, no project id. */
function failure(code: string, message: string): Error & { code: string } {
  return Object.assign(new Error(message), { code });
}

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
  // Read through requireEnv rather than a non-null assertion so an unset value throws ERR_ENV_UNCONFIGURED naming the variable, the way the other required reads in this function do. Unchecked, `JSON.parse(undefined)` would throw a bare SyntaxError ('unexpected token u') that names neither the variable nor configuration as the cause.
  const privateJWKSet: jose.JWK[] = JSON.parse(
    requireEnv('IDENTITY_PROVIDER_DECRYPTION_JWKS', Deno.env.get('IDENTITY_PROVIDER_DECRYPTION_JWKS')?.trim())
  );

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
  // Same reason as the decryption JWKS above: unchecked, an unset value would reach `new URL(undefined)` and throw a TypeError about an invalid URL rather than naming the missing variable.
  const jwksUri = requireEnv('IDENTITY_PROVIDER_JWKS_URI', Deno.env.get('IDENTITY_PROVIDER_JWKS_URI')?.trim());

  // Both claims are bound on every verification, never conditionally. The audience and the issuer are what tie a signature-valid token to THIS relying party and THIS provider; without them the check reduces to "signed by some key in the configured JWK set", which a token minted elsewhere for someone else also satisfies. A deployment that has not configured either variable fails loudly here rather than verifying for anybody. Both variables are documented in `.env.example` and in `tests/IDURA-TEST-RUNBOOK.md`.
  // The guard sits on the path to `jose.jwtVerify` rather than beside a single environment read, so the binding is structural rather than positional -- every caller gets it, whatever route reaches this function.
  const { audience, issuer } = requireVerifyClaimBinding(
    Deno.env.get('IDENTITY_PROVIDER_CLIENT_ID'),
    Deno.env.get('IDENTITY_PROVIDER_ISSUER')
  );

  const { payload } = await jose.jwtVerify(jwt, jose.createRemoteJWKSet(new URL(jwksUri)), { audience, issuer });

  return payload;
}

/**
 * The first account, page by page, that a predicate accepts, or null when none does.
 *
 * @param supabaseAdmin - The service-role client.
 * @param matches - The predicate.
 * @throws {Error & { code: string }} `ERR_ACCOUNT_LOOKUP_FAILED` when a page cannot be listed.
 */
async function findUser(
  // reason: this function has no generated `Database` type to parameterise `SupabaseClient` with, and nothing type-checks this file (no `deno check` runs, and vitest reads it only as source text), so a client type here would go unchecked. Only `.auth.admin.listUsers` is used, and its result is destructured and guarded below.
  // deno-lint-ignore no-explicit-any
  supabaseAdmin: any,
  matches: (user: AuthAccount) => boolean
): Promise<AuthAccount | null> {
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw failure('ERR_ACCOUNT_LOOKUP_FAILED', `Failed to list users: ${error.message}`);

    const users: Array<AuthAccount> = data?.users ?? [];
    const matching = users.find(matches);
    if (matching) return matching;

    // A page shorter than perPage is the last one.
    if (users.length < perPage) return null;
    page++;
  }
}

/** The account whose `app_metadata` holds the identity's match value, or null. */
function findUserByIdentityMatch(
  // deno-lint-ignore no-explicit-any
  supabaseAdmin: any,
  identityMatchValue: string
): Promise<AuthAccount | null> {
  return findUser(supabaseAdmin, (user) => user.app_metadata?.identity_match_value === identityMatchValue);
}

/** The account whose address is the given placeholder, compared without case, or null. */
function findUserByPlaceholderAddress(
  // deno-lint-ignore no-explicit-any
  supabaseAdmin: any,
  placeholderAddress: string
): Promise<AuthAccount | null> {
  return findUser(supabaseAdmin, (user) => holdsPlaceholderAddress(user, placeholderAddress));
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return respond(IDENTITY_CALLBACK_RESULT.bad_request);
  }

  try {
    // 0. The caller. A request without the header is refused before the configured secret is read; an unset secret throws and is answered as `configuration`, never as an open door.
    const presentedCredential = req.headers.get(SERVER_CREDENTIAL_HEADER);
    if (!presentedCredential) return respond(IDENTITY_CALLBACK_RESULT.refused);
    const secret = requireEnv('IDENTITY_CALLBACK_SERVER_SECRET', Deno.env.get('IDENTITY_CALLBACK_SERVER_SECRET'));
    if (!presentsServerCredential(presentedCredential, secret)) {
      return respond(IDENTITY_CALLBACK_RESULT.refused);
    }

    // An unset IDENTITY_PROVIDER_TYPE throws and is answered as `configuration` by the catch below. A value that is set but unknown is logged here, because the operator can act on it, and answered the same way.
    const providerType = requireEnv('IDENTITY_PROVIDER_TYPE', Deno.env.get('IDENTITY_PROVIDER_TYPE'));
    const config = resolveProviderConfig(providerType);
    if (!config) {
      console.error(`identity-callback: unknown identity provider type: ${providerType}`);
      return respond(IDENTITY_CALLBACK_RESULT.configuration);
    }

    // 1. The request.
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return respond(IDENTITY_CALLBACK_RESULT.bad_request);
    }
    const request = parseIdentityCallbackRequest(body);
    if (!request) return respond(IDENTITY_CALLBACK_RESULT.bad_request);

    const projectId = request.projectId;

    // 2. The token -- both JWE (5-part) and plain JWT (3-part). A configuration failure inside either step is rethrown, so it is answered as `configuration` and not as a bad token.
    let innerJwt: string;

    if (isJweToken(request.idToken)) {
      try {
        innerJwt = await decryptJweToken(request.idToken);
      } catch (e) {
        if (isConfigurationFailure(e)) throw e;
        // Logged, NEVER returned. This endpoint is served --no-verify-jwt, so echoing the caught message back would turn it into a step-by-step verification oracle for anyone who obtains the server's credential: jose's own wording tells the caller whether the kid matched, whether decryption succeeded, whether the signature verified and whether iss/aud bound.
        console.error('[identity-callback] token decryption failed:', e);
        return respond(IDENTITY_CALLBACK_RESULT.invalid_token);
      }
    } else {
      innerJwt = request.idToken;
    }

    let payload: jose.JWTPayload;
    try {
      payload = await verifyJwt(innerJwt);
    } catch (e) {
      if (isConfigurationFailure(e)) throw e;
      // Logged, never returned -- see the decryption arm above. jose's claim-validation messages name the offending claim ("unexpected \"iss\" claim value"), which is exactly the discrimination the oracle needs.
      //
      // FIELDS, NOT THE ERROR OBJECT. Deno serialises an error's own enumerable properties, and for `JWTClaimValidationFailed` those include `payload`, the ENTIRE DECODED ID TOKEN. Passing `e` to `console.error` would put `hetu` (a national identity number), the holder's full name and their date of birth into the container log in plaintext, on a path that fires for any `aud`/`iss` misconfiguration, so an ordinary config error would leave a durable record of a real person's identity claims.
      //
      // The three fields below carry all of the error's diagnostic value: `claim` and `reason` are what jose's own message interpolates, and `code` is the failure class. None of them is derived from the token's subject. `payload` is deliberately absent and must stay absent -- if a future change needs to know something about the claims, log the KEYS (`Object.keys(payload)`), never a value.
      const claimFailure = e as { code?: unknown; claim?: unknown; reason?: unknown };
      console.error(
        `[identity-callback] token verification failed: code=${String(claimFailure.code ?? 'none')} claim=${String(claimFailure.claim ?? 'none')} reason=${String(claimFailure.reason ?? 'none')}`
      );
      return respond(IDENTITY_CALLBACK_RESULT.invalid_token);
    }

    // 3. The subject identifier and the names. Nothing else of the token is kept.
    let claims: { matchValue: string; firstName: string; lastName: string };
    try {
      claims = extractIdentityClaims(payload, config);
    } catch (e) {
      // Logged, never returned -- see the decryption arm above. The claim-extraction message enumerates which configured claim names were present or missing, which discloses the provider's claim mapping to an unauthenticated caller.
      console.error('[identity-callback] identity claim extraction failed:', e);
      return respond(IDENTITY_CALLBACK_RESULT.invalid_token);
    }
    const { firstName, lastName, matchValue } = claims;

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // 4. The entity type, decided by the project's stored matrix. A failed read throws and is answered as `unavailable`; it is never read as settings that allow something.
    const { data: settingsRow, error: settingsError } = await supabaseAdmin
      .from('app_settings')
      .select('settings')
      .eq('project_id', projectId)
      .maybeSingle();
    if (settingsError) throw failure('ERR_SETTINGS_READ_FAILED', `Settings read failed: ${settingsError.message}`);

    const decision = resolveEntityType(settingsRow?.settings ?? {}, request.entityType);
    if ('refused' in decision) return respond(IDENTITY_CALLBACK_RESULT.mode_not_allowed);
    const entityType = decision.entityType;

    // 5. The account. The placeholder address is derived from the subject identifier, which is unique per person, so one identity always has one placeholder.
    let account = await findUserByIdentityMatch(supabaseAdmin, matchValue);
    let initialise = false;

    if (!account) {
      const placeholderAddress = placeholderAddressFor(matchValue);

      // An invite creates the account with no password. Its token is discarded: the token answered is minted at the end, as a magic link, which leaves the password unset when it is verified. When the invite fails, the account may still be on the address: the auth service answers `email_exists` for a confirmed account, and fails an invite that loses the race to create the account to another request for this identity.
      const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'invite',
        email: placeholderAddress,
        options: { data: { given_name: firstName, family_name: lastName } }
      });
      account = inviteError ? await findUserByPlaceholderAddress(supabaseAdmin, placeholderAddress) : invited?.user;
      if (inviteError && !account) {
        throw failure('ERR_ACCOUNT_CREATE_FAILED', `Failed to create auth user: ${inviteError.message}`);
      }
      if (!account?.id) throw failure('ERR_ACCOUNT_CREATE_FAILED', 'The auth service answered no user.');

      // An account found on the address may have been finished by another request for this identity; one of another identity is never taken over. An account that holds no match value yet is finished by this request, after the entity step.
      const setup = inviteError
        ? existingAccountSetup(account.app_metadata, matchValue)
        : { kind: 'initialise' as const };
      if (setup.kind === 'refuse') {
        throw failure('ERR_ACCOUNT_CREATE_FAILED', 'The placeholder address belongs to another identity.');
      }
      initialise = setup.kind === 'initialise';
    }
    const userId = account.id;

    // 6. The entity, found or created by one database call: it takes a lock on the account, reads the account's record inside it, and for a first sign-in writes the entity, its editor grant and the record in the same transaction, so sign-ins of one identity that arrive together make one entity, and a failed write leaves none behind. A record whose grant or row is gone answers `no_entity`, and nothing is created for it.
    const { data: entityAnswer, error: entityError } = await supabaseAdmin.rpc('identity_entity_find_or_create', {
      p_user_id: userId,
      p_project_id: projectId,
      p_entity_type: entityType,
      p_first_name: firstName,
      p_last_name: lastName
    });
    if (entityError) throw failure('ERR_ENTITY_RESOLVE_FAILED', `Entity find-or-create failed: ${entityError.message}`);
    const { result } = findOrCreateOutcome(entityAnswer, projectId, entityType);

    // The account's `app_metadata`, before the link, written whole on every branch, which also removes the provider's claims an older account still holds. The record is the database call's and is not sent. The placeholder's confirmation is the only one this function makes, for an account this identity has not finished yet.
    const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: identityAppMetadata({
        providerType,
        matchProp: config.identityMatchProp,
        matchValue
      }),
      ...(initialise ? { email_confirm: true } : {})
    });
    if (metadataError) throw failure('ERR_RECORD_WRITE_FAILED', `Metadata write failed: ${metadataError.message}`);

    // 7. The sign-in link, for the account's current address: once the person has proved an address of their own, the placeholder belongs to no account, and a link for it would create a stray one.
    const { data: current, error: currentError } = await supabaseAdmin.auth.admin.getUserById(userId);
    const currentAddress = current?.user?.email;
    if (currentError || typeof currentAddress !== 'string' || currentAddress === '') {
      throw failure('ERR_ACCOUNT_LOOKUP_FAILED', 'The account has no current address.');
    }

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: currentAddress
    });
    if (linkError) throw failure('ERR_LINK_FAILED', `Sign-in link failed: ${linkError.message}`);

    const actionLink = linkData?.properties?.action_link;
    const token = typeof actionLink === 'string' ? new URL(actionLink).searchParams.get('token') : null;
    if (!token) throw failure('ERR_LINK_FAILED', 'The sign-in link carries no token.');

    return respond(result, token);
  } catch (e) {
    // Logged, never returned. This arm catches the auth service's and the database's failures, whose messages carry Postgres error text and schema detail, and the four ERR_ENV_UNCONFIGURED throws for IDENTITY_CALLBACK_SERVER_SECRET, IDENTITY_PROVIDER_TYPE, IDENTITY_PROVIDER_DECRYPTION_JWKS and IDENTITY_PROVIDER_JWKS_URI, with the two claim-binding throws. A configuration failure is told from an outage by its code alone, and the answer is one result with nothing interpolated into it.
    console.error('identity-callback error:', e);
    return respond(
      isConfigurationFailure(e) ? IDENTITY_CALLBACK_RESULT.configuration : IDENTITY_CALLBACK_RESULT.unavailable
    );
  }
});
