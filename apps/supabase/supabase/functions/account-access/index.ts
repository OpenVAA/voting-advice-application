/**
 * Account-access Edge Function: the one endpoint an anonymous visitor meets the invitation model through, and the one that proves a typed address for an account an identity provider made.
 *
 * POST /functions/v1/account-access, JSON in and out. Every body carries `operation` and `project_id` (a uuid).
 *
 * - `check-code` with `code`: answers `{ status }`, one of `valid`, `used` and `unknown`.
 * - `request-link` with `email` and/or `code`, optionally `locale` and `witness`: answers `{ accepted: true }`, always, and does its work after the answer.
 * - `request-recovery` with `email`, optionally `locale` and `witness`: answers `{ accepted: true }`, always, and does its work after the answer. It mails a recovery link to an account that holds a grant in the project, the sign-in mail to an address that has only an invitation, and nothing to anyone else; it creates no account.
 * - `code-sign-in` with `code` and `password`: answers `{ result: 'signed-in', access_token, refresh_token }` or `{ result: 'invalid-credentials' }`.
 * - `confirm-address` with `email`, optionally `locale`, and the caller's own access token in `Authorization`: answers `{ result: 'sent' }`, `{ result: 'in-use' }` or `{ result: 'refused' }`, or 401 `{ error: 'unauthenticated' }` without a token the auth service accepts. It does its work before it answers. For an account whose app metadata names an identity provider and whose address is still the placeholder, it takes the account's and the address's slot, asks the auth service for the two links of a change of address, verifies the current address's link itself and mails the typed address's link. The typed address becomes the account's only when that link is opened and is never written to the account; the one admin update that carries an address puts the account's own placeholder back when verifying the current address's link completed the change alone, which the auth service does only with its secure change of address off.
 *
 * A `witness` names a completion record the service role opened, which the request's background work completes; it is a test instrument and is kept only on a request whose bearer is the service role's key.
 *
 * No answer depends on whether an address, a code or an account exists, except the three words of the code check and the `in-use` answer of `confirm-address`, which a signed-in caller gets about the address they typed for their own account, behind the account's and the address's slot. The project comes from the request; the function serves any project of the deployment and reads none from its environment. A request names no page, path or URL: every mailed link is built from SITE_URL, the locale and the token.
 *
 * Environment variables:
 * - SITE_URL: the browser-facing site origin the mailed link points at (required; an unset value means no link is issued)
 * - SMTP_HOST, SMTP_PORT, SMTP_FROM: the mail transport and the sender (required; an unset value means no mail is sent and the slot is given back)
 * - SMTP_USER, SMTP_PASS: transport credentials (optional; without them the transport is the local mail catcher's)
 * - SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: set by the platform
 */

import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import nodemailer from 'npm:nodemailer@10.0.11';
import {
  actionLinkToken,
  bearerToken,
  callerTokenRefused,
  confirmAddress,
  identityProviderOf,
  isCompletedChange,
  isSingleConfirmation,
  registeredProjectsOf
} from './addressConfirmation.ts';
import {
  ACCEPTED_BODY,
  addressConfirmationAnswer,
  admitWitness,
  BAD_REQUEST_BODY,
  codeStatusBody,
  INTERNAL_ERROR_BODY,
  INVALID_CREDENTIALS_BODY,
  METHOD_NOT_ALLOWED_BODY,
  parseAccountAccessRequest,
  signedInBody
} from './contract.ts';
import {
  createExpiringPositive,
  isSignUpClosed,
  REDIRECT_CHECK_TTL_MS,
  SIGN_UP_CHECK_TTL_MS
} from './deploymentChecks.ts';
import { requireEnv } from './envConfig.ts';
import { describeFailure, issueRecoveryLink, issueSignInLink, readRecoveryEligibility } from './linkIssue.ts';
import { isPlaceholderAddress } from './placeholderAddress.ts';
import { isRedirectAdmitted } from './signInLink.ts';
import type { AddressConfirmationDeps } from './addressConfirmation.ts';
import type {
  AddressConfirmationOutcome,
  CheckCodeRequest,
  CodeSignInRequest,
  ConfirmAddressRequest,
  RequestLinkRequest,
  RequestRecoveryRequest
} from './contract.ts';
import type { LinkIssueDeps, LogDetail, OutgoingMail } from './linkIssue.ts';

/** The background-task hook of the edge runtime: the promise is kept alive after the response has been returned. */
declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

const corsHeaders = Object.freeze({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
});

const LOG_PREFIX = 'account-access:';

/** The key the sign-up answer is remembered under. There is one auth service per deployment, so one key. */
const SIGN_UP_KEY = 'sign-up';

/** A token no user holds. The redirect question is about where the auth service would send the browser, not about the token. */
const REDIRECT_QUESTION_TOKEN = 'account-access-redirect-question';

/** How long a request to the auth service may take before it counts as a failure. */
const AUTH_REQUEST_TIMEOUT_MS = 10000;

/** How long each phase of the SMTP conversation may take before the send counts as failed. */
const SMTP_TIMEOUT_MS = 10000;

// A worker serves many requests, so these two outlive a request. Each remembers positive answers only and forgets one after its lifetime: a deployment whose sign-up is reopened stops being served links within a minute.
const signUpClosedMemory = createExpiringPositive(SIGN_UP_CHECK_TTL_MS, () => Date.now());
const redirectAdmittedMemory = createExpiringPositive(REDIRECT_CHECK_TTL_MS, () => Date.now());

function answer(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/** The one place that writes a log line. A caller passes a fixed message and, at most, the name and code of a failure. */
function log(message: string, detail?: LogDetail): void {
  const suffix = detail && Object.keys(detail).length > 0 ? ` ${JSON.stringify(detail)}` : '';
  console.error(`${LOG_PREFIX} ${message}${suffix}`);
}

/** A client holding the service role, made for one request and keeping no session. */
function createAdminClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

/** The site origin every mailed link points at. It comes from configuration only: nothing a request carries reaches it. */
function configuredSiteUrl(): string {
  return requireEnv('SITE_URL', Deno.env.get('SITE_URL'));
}

/** Hand one mail to the configured transport. Resolves once the transport has accepted it. */
async function sendMail({ to, subject, text, html }: OutgoingMail): Promise<void> {
  const smtpHost = requireEnv('SMTP_HOST', Deno.env.get('SMTP_HOST'));
  const smtpPort = parseInt(requireEnv('SMTP_PORT', Deno.env.get('SMTP_PORT')), 10);
  // These two are optional and carry no default: the credentialed and the uncredentialed branch below are both deliberate.
  const smtpUser = Deno.env.get('SMTP_USER');
  const smtpPass = Deno.env.get('SMTP_PASS');

  const transportConfig: Record<string, unknown> = {
    host: smtpHost,
    port: smtpPort,
    secure: false,
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS
  };
  if (smtpUser && smtpPass) {
    transportConfig.auth = { user: smtpUser, pass: smtpPass };
  } else {
    // The local mail catcher serves a self-signed certificate and takes no credentials. Certificate verification is not relaxed on the credentialed path.
    transportConfig.tls = { rejectUnauthorized: false };
  }

  const transport = nodemailer.createTransport(transportConfig);
  await transport.sendMail({
    from: requireEnv('SMTP_FROM', Deno.env.get('SMTP_FROM')),
    to,
    subject,
    text,
    html
  });
}

/** The effects of one link issue, each wired to the database, the auth service or the mail transport. */
function linkIssueDeps(): LinkIssueDeps {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const admin = createAdminClient();

  return {
    siteUrl: configuredSiteUrl(),

    async signUpClosed() {
      if (signUpClosedMemory.isFresh(SIGN_UP_KEY)) return true;
      const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: { apikey: anonKey },
        signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS)
      });
      if (!response.ok) {
        await response.body?.cancel();
        return false;
      }
      const closed = isSignUpClosed(await response.json());
      if (closed) signUpClosedMemory.remember(SIGN_UP_KEY);
      return closed;
    },

    async redirectAdmitted(callbackUrl) {
      if (redirectAdmittedMemory.isFresh(callbackUrl)) return true;
      const question = new URL(`${supabaseUrl}/auth/v1/verify`);
      question.searchParams.set('token', REDIRECT_QUESTION_TOKEN);
      question.searchParams.set('type', 'magiclink');
      question.searchParams.set('redirect_to', callbackUrl);
      const response = await fetch(question, {
        headers: { apikey: anonKey },
        redirect: 'manual',
        signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS)
      });
      await response.body?.cancel();
      const admitted = isRedirectAdmitted({ requested: callbackUrl, location: response.headers.get('location') });
      if (admitted) redirectAdmittedMemory.remember(callbackUrl);
      return admitted;
    },

    async requestEligibility({ projectId, email, code }) {
      // The argument names are the SQL function's parameter names: PostgREST resolves a function by its named arguments.
      const { data, error } = await admin.rpc('invitation_link_request', {
        p_project_id: projectId,
        p_email: email,
        p_code: code
      });
      if (error) throw error;
      return typeof data === 'string' && data !== '' ? data : null;
    },

    async recoveryEligibility({ projectId, email }) {
      const { data, error } = await admin.rpc('recovery_link_request', {
        p_project_id: projectId,
        p_email: email
      });
      if (error) throw error;
      return readRecoveryEligibility(data);
    },

    async createPasswordlessUser(recipient) {
      // An invite creates the user with no password. Its token is discarded: the token that is mailed is minted next, as a magiclink, which leaves the password unset when it is verified.
      const { error } = await admin.auth.admin.generateLink({ type: 'invite', email: recipient });
      // A confirmed user already exists for the address. That is the one answer that is not a failure here.
      if (error && error.code !== 'email_exists') throw error;
    },

    async mintToken(recipient) {
      const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: recipient });
      if (error) throw error;
      return data.properties.hashed_token;
    },

    async mintRecoveryToken(recipient) {
      // A recovery link is minted for an account that exists. For an address with none the auth service answers an error, which the link issue treats as any other failure: it stays in the background work.
      const { data, error } = await admin.auth.admin.generateLink({ type: 'recovery', email: recipient });
      if (error) throw error;
      return data.properties.hashed_token;
    },

    sendMail,

    async release({ projectId, address, code }) {
      const { error } = await admin.rpc('invitation_link_release', {
        p_project_id: projectId,
        p_email: address,
        p_code: code
      });
      if (error) throw error;
    },

    async completeWitness(id, outcome) {
      const { error } = await admin.rpc('invitation_link_witness', { p_id: id, p_outcome: outcome });
      if (error) throw error;
    },

    log
  };
}

/**
 * The effects of one address confirmation, each wired to the auth service, the database or the mail transport.
 *
 * The caller is read with the public key. The service-role client is made by the first effect that needs it, and `confirmAddress` asks for none before the caller's token is accepted.
 */
function addressConfirmationDeps(): AddressConfirmationDeps {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  let adminClient: ReturnType<typeof createAdminClient> | null = null;
  const admin = () => (adminClient ??= createAdminClient());

  return {
    siteUrl: configuredSiteUrl(),

    async callerAccount(token) {
      const visitor = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data, error } = await visitor.auth.getUser(token);
      if (error) {
        if (callerTokenRefused(error)) return null;
        throw error;
      }
      return {
        id: data.user.id,
        email: data.user.email ?? null,
        identityProvider: identityProviderOf(data.user.app_metadata),
        registeredProjects: registeredProjectsOf(data.user.app_metadata)
      };
    },

    async takeSlot({ projectId, userId, email }) {
      const { data, error } = await admin().rpc('address_confirmation_request', {
        p_project_id: projectId,
        p_user_id: userId,
        p_email: email
      });
      if (error) throw error;
      return data === true;
    },

    async releaseSlot({ email }) {
      const { error } = await admin().rpc('address_confirmation_release', { p_email: email });
      if (error) throw error;
    },

    async addressHoldsOpenInvitation({ projectId, email }) {
      const { data, error } = await admin().rpc('address_holds_open_invitation', {
        p_project_id: projectId,
        p_email: email
      });
      if (error) throw error;
      if (typeof data !== 'boolean') throw new Error('The open-invitation check answered no boolean.');
      return data;
    },

    async generateEmailChange(kind, { currentEmail, newEmail }) {
      // Neither call sends a mail or changes the account's address: each stores a token and the pending address.
      const type = kind === 'current' ? 'email_change_current' : 'email_change_new';
      const { data, error } = await admin().auth.admin.generateLink({ type, email: currentEmail, newEmail });
      if (error) {
        if (error.code === 'email_exists') return 'email-exists';
        throw error;
      }
      return {
        hashedToken: data.properties.hashed_token,
        actionLinkToken: actionLinkToken(data.properties.action_link)
      };
    },

    async verifyCurrent(tokenHash) {
      const response = await fetch(`${supabaseUrl}/auth/v1/verify`, {
        method: 'POST',
        headers: { apikey: anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'email_change', token_hash: tokenHash }),
        signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS)
      });
      const verified = await response.json().catch(() => null);
      if (isCompletedChange(response.status, verified)) return 'completed';
      if (!isSingleConfirmation(response.status, verified)) {
        throw new Error('The current address was not confirmed alone.');
      }
      return 'confirmed';
    },

    async restoreAddress({ userId, email }) {
      // The one admin update of this function that carries an address, and the address is the account's own placeholder, never one a caller typed.
      if (!isPlaceholderAddress(email)) throw new Error('Only a placeholder address is put back.');
      const { error } = await admin().auth.admin.updateUserById(userId, { email, email_confirm: true });
      if (error) throw error;
    },

    sendMail,

    log
  };
}

/** The whole work of a link request. The handler does not wait for it, and it never rejects: a deployment whose configuration is incomplete logs that and issues nothing. */
async function issueInBackground(request: RequestLinkRequest): Promise<void> {
  try {
    await issueSignInLink(request, linkIssueDeps());
  } catch (error) {
    log('the link issue could not start; no link issued', describeFailure(error));
  }
}

/** The whole work of a recovery request. The handler does not wait for it, and it never rejects: a deployment whose configuration is incomplete logs that and issues nothing. */
async function issueRecoveryInBackground(request: RequestRecoveryRequest): Promise<void> {
  try {
    await issueRecoveryLink(request, linkIssueDeps());
  } catch (error) {
    log('the recovery issue could not start; no link issued', describeFailure(error));
  }
}

/** The answer of an address confirmation, given after its work. A deployment whose configuration is incomplete logs that and answers the refusal. */
async function answerAddressConfirmation(
  request: ConfirmAddressRequest,
  callerToken: string | null
): Promise<Response> {
  let outcome: AddressConfirmationOutcome = 'refused';
  try {
    outcome = await confirmAddress(request, callerToken, addressConfirmationDeps());
  } catch (error) {
    log('the address confirmation could not start; nothing changed', describeFailure(error));
  }
  const { status, body } = addressConfirmationAnswer(outcome);
  return answer(body, status);
}

async function checkCode(request: CheckCodeRequest): Promise<Response> {
  const { data, error } = await createAdminClient().rpc('invitation_code_status', {
    p_project_id: request.projectId,
    p_code: request.code
  });
  if (error) {
    log('the code check failed', describeFailure(error));
    return answer(INTERNAL_ERROR_BODY, 500);
  }
  return answer(codeStatusBody(data), 200);
}

/** Every failure of this operation is the one invalid-credentials answer, and the claimant's address never leaves the function. */
async function codeSignIn(request: CodeSignInRequest): Promise<Response> {
  try {
    const { data: claimant, error: lookupError } = await createAdminClient().rpc('invitation_code_claimant_email', {
      p_project_id: request.projectId,
      p_code: request.code
    });
    if (lookupError) {
      log('the claimant look-up failed', describeFailure(lookupError));
      return answer(INVALID_CREDENTIALS_BODY, 200);
    }
    if (typeof claimant !== 'string' || claimant === '') return answer(INVALID_CREDENTIALS_BODY, 200);

    // A client of its own for this request, with the public key: the password is checked by the auth service as for any sign-in, and no session outlives the request inside the worker. The auth service sees this function's address, not the caller's, so every code sign-in of the deployment counts against one per-address sign-in budget (`[auth.rate_limit] sign_in_sign_ups`): wrong passwords sent with a few used codes can use it up for everyone. The per-code budget of invitation_code_claimant_email does not prevent that.
    const visitor = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: signedIn, error: signInError } = await visitor.auth.signInWithPassword({
      email: claimant,
      password: request.password
    });
    const session = signInError ? null : signedIn.session;
    if (!session) return answer(INVALID_CREDENTIALS_BODY, 200);

    return answer(signedInBody(session), 200);
  } catch (error) {
    log('the code sign-in failed', describeFailure(error));
    return answer(INVALID_CREDENTIALS_BODY, 200);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }
  if (req.method !== 'POST') return answer(METHOD_NOT_ALLOWED_BODY, 405);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return answer(BAD_REQUEST_BODY, 400);
  }
  const parsed = parseAccountAccessRequest(body);
  if (parsed === null) return answer(BAD_REQUEST_BODY, 400);
  const authorization = req.headers.get('Authorization');
  // A completion witness is a test instrument, kept only on a request made with the service role's key.
  const request = admitWitness(parsed, authorization, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

  if (request.operation === 'request-link') {
    // The answer is built before any work and returned without waiting for any of it, so neither its body nor its timing says anything about the address or the code.
    const accepted = answer(ACCEPTED_BODY, 200);
    EdgeRuntime.waitUntil(issueInBackground(request));
    return accepted;
  }

  if (request.operation === 'request-recovery') {
    // The same answer as a link request, built before any work and returned without waiting for any of it: its status, its body and its timing say nothing about the address, and what the database or the auth service said of it stays in the background work.
    const accepted = answer(ACCEPTED_BODY, 200);
    EdgeRuntime.waitUntil(issueRecoveryInBackground(request));
    return accepted;
  }

  if (request.operation === 'code-sign-in') return codeSignIn(request);

  if (request.operation === 'confirm-address') {
    // The caller is the account their own access token names. The body names no user.
    return answerAddressConfirmation(request, bearerToken(authorization));
  }

  try {
    return await checkCode(request);
  } catch (error) {
    log('the code check failed', describeFailure(error));
    return answer(INTERNAL_ERROR_BODY, 500);
  }
});
