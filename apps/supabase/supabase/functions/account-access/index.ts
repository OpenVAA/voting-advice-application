/**
 * Account-access Edge Function: the one endpoint an anonymous visitor meets the invitation model through, and the one that proves a typed address for an account an identity provider made.
 *
 * POST /functions/v1/account-access, JSON in and out. Every body carries `operation` and `project_id` (a uuid).
 *
 * - `check-code` with `code`: answers `{ status }`, one of `valid`, `used` and `unknown`.
 * - `request-link` with `email` and/or `code`, optionally `locale` and `witness`: answers `{ accepted: true }`, always, and does its work after the answer.
 * - `request-recovery` with `email`, optionally `locale`, `witness` and `app`: answers `{ accepted: true }`, always, and does its work after the answer. It mails a recovery link to an account that holds any global grant, an account grant on the project's account, or a grant on the project or one of its entities, the sign-in mail to an address that has only an invitation, and nothing to anyone else; it creates no account. `app` names the app the request was made in, from a closed set; the link of either mail then lands there.
 * - `code-sign-in` with `code` and `password`: answers `{ result: 'signed-in', access_token, refresh_token }` or `{ result: 'invalid-credentials' }`.
 * - `confirm-address` with `email`, optionally `locale`, and the caller's own access token in `Authorization`: answers `{ result: 'sent' }`, `{ result: 'in-use' }`, `{ result: 'invited' }` or `{ result: 'refused' }`, or 401 `{ error: 'unauthenticated' }` without a token the auth service accepts. It does its work before it answers. For an account whose app metadata names an identity provider and whose address is still the placeholder, it takes the account's and the address's slot, asks the auth service for the two links of a change of address, verifies the current address's link itself and mails the typed address's link. The typed address becomes the account's only when that link is opened and is never written to the account; the one admin update that carries an address puts the account's own placeholder back when verifying the current address's link completed the change alone, which the auth service does only with its secure change of address off.
 *
 * Before any work of the three operations a browser calls anonymously, `check-code`, `request-link` and `request-recovery`, the caller's address from `cf-connecting-ip` takes a slot of the per-caller limit, one bucket per caller per project across the three. A caller over the limit is answered HTTP 429 `{ error: 'too-many-requests' }` with `Retry-After`, the same for each of them, and a take that fails is answered 500 `{ error: 'internal' }`. The database trusts the address only on a deployment behind Cloudflare and otherwise admits every call. `code-sign-in` and `confirm-address` take no caller slot: the frontend server calls `code-sign-in`, so the address would be the server's, and `confirm-address` is answered only to a signed-in account.
 *
 * A `witness` names a completion record the service role opened, which the request's background work completes; it is a test instrument and is kept only on a request whose bearer is the service role's key. The record and its functions exist only in a database the test setup installed them in; where they are absent the request has no witness, and nothing is logged.
 *
 * No answer depends on whether an address, a code or an account exists, except the three words of the code check and the `in-use` and `invited` answers of `confirm-address`, which a signed-in caller gets about the address they typed for their own account, behind the account's and the address's slot. The function serves the deployment's one project, PUBLIC_PROJECT_ID, as send-email does: every link it mails lands on the one frontend SITE_URL names, which serves that project alone, so a request whose `project_id` names another project is refused with the bad-request answer before any operation is read. A request names no page, path or URL: every mailed link is built from SITE_URL, the locale and the token, and, for a recovery request that names an app from the closed set, the path the function takes for that app from its own constant map.
 *
 * Environment variables:
 * - PUBLIC_PROJECT_ID: the project the function serves (required; an unset value answers every request with the internal error)
 * - SITE_URL: the browser-facing site origin the mailed link points at (required; an unset value means no link is issued)
 * - SMTP_HOST, SMTP_PORT, SMTP_FROM: the mail transport and the sender (required; an unset value means no mail is sent and the slot is given back)
 * - SMTP_USER, SMTP_PASS: transport credentials (optional; without them the transport is the local mail catcher's)
 * - SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: set by the platform
 */

import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import nodemailer from 'npm:nodemailer@10.0.11';
import { actionLinkToken } from '../_shared/actionLink.ts';
import {
  bearerToken,
  callerTokenRefused,
  confirmAddress,
  identityProviderOf,
  isCompletedChange,
  isSingleConfirmation
} from './addressConfirmation.ts';
import {
  ACCEPTED_BODY,
  addressConfirmationAnswer,
  admitWitness,
  BAD_REQUEST_BODY,
  codeStatusBody,
  CORS_HEADERS,
  INTERNAL_ERROR_BODY,
  INVALID_CREDENTIALS_BODY,
  METHOD_NOT_ALLOWED_BODY,
  parseAccountAccessRequest,
  signedInBody,
  TOO_MANY_REQUESTS_BODY
} from './contract.ts';
import { callerAddress, retryAfterSeconds, takesCallerSlot } from './callerLimit.ts';
import {
  createExpiringPositive,
  isSignUpClosed,
  REDIRECT_CHECK_TTL_MS,
  SIGN_UP_CHECK_TTL_MS
} from './deploymentChecks.ts';
import { isDeploymentProject } from '../_shared/deploymentProject.ts';
import { requireEnv } from '../_shared/envConfig.ts';
import { configuredSender, smtpTransportConfig } from '../_shared/mailTransport.ts';
import { isPlaceholderEmail } from '../_shared/placeholderEmail.ts';
import {
  describeFailure,
  isMissingFunction,
  issueRecoveryLink,
  issueSignInLink,
  readRecoveryEligibility
} from './linkIssue.ts';
import { isRedirectAdmitted } from './signInLink.ts';
import type { AddressConfirmationDeps } from './addressConfirmation.ts';
import type {
  AddressConfirmationOutcome,
  AccountAccessRequest,
  CheckCodeRequest,
  CodeSignInRequest,
  ConfirmAddressRequest,
  RequestLinkRequest,
  RequestRecoveryRequest
} from './contract.ts';
import type { SmtpEnv } from '../_shared/mailTransport.ts';
import type { LinkIssueDeps, LogDetail, OutgoingMail } from './linkIssue.ts';

/** The background-task hook of the edge runtime: the promise is kept alive after the response has been returned. */
declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

const LOG_PREFIX = 'account-access:';

/** The key the sign-up answer is remembered under. There is one auth service per deployment, so one key. */
const SIGN_UP_KEY = 'sign-up';

/** A token no user holds. The redirect question is about where the auth service would send the browser, not about the token. */
const REDIRECT_QUESTION_TOKEN = 'account-access-redirect-question';

/** How long a request to the auth service may take before it counts as a failure. */
const AUTH_REQUEST_TIMEOUT_MS = 10000;

// A worker serves many requests, so these two outlive a request. Each remembers positive answers only and forgets one after its lifetime: a deployment whose sign-up is reopened stops being served links within a minute.
const signUpClosedMemory = createExpiringPositive(SIGN_UP_CHECK_TTL_MS, () => Date.now());
const redirectAdmittedMemory = createExpiringPositive(REDIRECT_CHECK_TTL_MS, () => Date.now());

/** The handler of every request: the method, the body, the operation, and the answer of that operation. */
async function handleRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: CORS_HEADERS });
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
  let served: boolean;
  try {
    served = servesProject(parsed);
  } catch (error) {
    log('PUBLIC_PROJECT_ID is not configured; nothing served', describeFailure(error));
    return answer(INTERNAL_ERROR_BODY, 500);
  }
  if (!served) return answer(BAD_REQUEST_BODY, 400);
  const authorization = req.headers.get('Authorization');
  // A completion witness is a test instrument, kept only on a request made with the service role's key.
  const request = admitWitness(parsed, authorization, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

  // The take comes before the work of every operation it limits, so that a refused caller causes no work and every one of them answers alike.
  if (takesCallerSlot(request.operation)) {
    const { data: retryAfter, error } = await createAdminClient().rpc('access_caller_take', {
      p_project_id: request.projectId,
      p_address: callerAddress(req.headers)
    });
    if (error) {
      log('the caller limit could not be read', describeFailure(error));
      return answer(INTERNAL_ERROR_BODY, 500);
    }
    const seconds = retryAfterSeconds(retryAfter);
    if (seconds !== null) return tooManyRequests(seconds);
  }

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
}

/** Whether a request names the deployment's project. Throws when PUBLIC_PROJECT_ID is unset. */
function servesProject(request: AccountAccessRequest): boolean {
  return isDeploymentProject(
    request.projectId,
    requireEnv('PUBLIC_PROJECT_ID', Deno.env.get('PUBLIC_PROJECT_ID')?.trim())
  );
}

/** A JSON answer with the CORS headers. */
function answer(body: unknown, status: number, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', ...extraHeaders }
  });
}

/** The answer to a caller over the per-caller limit, with the seconds until its window ends. */
function tooManyRequests(seconds: number): Response {
  return answer(TOO_MANY_REQUESTS_BODY, 429, { 'Retry-After': String(seconds) });
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

/**
 * Every failure of this operation is the one invalid-credentials answer, and the claimant's address never leaves the function.
 *
 * THE SIGN-IN BUDGET IS DEPLOYMENT-WIDE. The auth service keys its sign-in rate limit (`[auth.rate_limit] sign_in_sign_ups`) on the client address, and every code sign-in reaches it from this function's address, so all claimants of the deployment share one budget. Keying it per client would take `GOTRUE_RATE_LIMIT_HEADER`, which neither `config.toml` nor a hosted project can set, and a header the caller controls could be rotated to escape the limit. The per-code budget of `invitation_code_claimant_email` bounds the guesses against one code, not the shared budget.
 *
 * TODO: Check whether the deployment-wide budget is a risk: one claimant sending wrong passwords with a few used codes can exhaust it for every other claimant.
 */
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

    // A client of its own for this request, with the public key: the password is checked by the auth service as for any sign-in, and no session outlives the request inside the worker. The sign-in counts against the deployment-wide budget the function's header describes.
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

/** The answer of a code check: one of the three words, or the internal error when the database cannot answer. */
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

    async redirectAdmitted(confirmPageUrl) {
      if (redirectAdmittedMemory.isFresh(confirmPageUrl)) return true;
      const question = new URL(`${supabaseUrl}/auth/v1/verify`);
      question.searchParams.set('token', REDIRECT_QUESTION_TOKEN);
      question.searchParams.set('type', 'magiclink');
      question.searchParams.set('redirect_to', confirmPageUrl);
      const response = await fetch(question, {
        headers: { apikey: anonKey },
        redirect: 'manual',
        signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS)
      });
      await response.body?.cancel();
      const admitted = isRedirectAdmitted({ requested: confirmPageUrl, location: response.headers.get('location') });
      if (admitted) redirectAdmittedMemory.remember(confirmPageUrl);
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
      // A database the test setup did not install the witness in has no witness to complete.
      if (error && !isMissingFunction(error)) throw error;
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
        identityProvider: identityProviderOf(data.user.app_metadata)
      };
    },

    async takeSlot({ projectId, userId, email }) {
      const { data, error } = await admin().rpc('email_confirmation_request', {
        p_project_id: projectId,
        p_user_id: userId,
        p_email: email
      });
      if (error) throw error;
      return data === true;
    },

    async releaseSlot({ email }) {
      const { error } = await admin().rpc('email_confirmation_release', { p_email: email });
      if (error) throw error;
    },

    async emailInvitationHold({ projectId, email }) {
      const { data, error } = await admin().rpc('email_invitation_hold', {
        p_project_id: projectId,
        p_email: email
      });
      if (error) throw error;
      if (data !== 'allowed' && data !== 'held' && data !== 'none') {
        throw new Error('The invitation-hold check answered none of allowed, held and none.');
      }
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
      if (!isPlaceholderEmail(email)) throw new Error('Only a placeholder address is put back.');
      const { error } = await admin().auth.admin.updateUserById(userId, { email, email_confirm: true });
      if (error) throw error;
    },

    sendMail,

    log
  };
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
async function sendMail({ to, locale, subject, text, html }: OutgoingMail): Promise<void> {
  const smtp = smtpEnv();
  const transport = nodemailer.createTransport(smtpTransportConfig(smtp));
  await transport.sendMail({
    from: configuredSender(smtp),
    to,
    subject,
    text,
    html,
    headers: { 'Content-Language': locale }
  });
}

/** The five `SMTP_*` values of the environment. */
function smtpEnv(): SmtpEnv {
  return {
    host: Deno.env.get('SMTP_HOST'),
    port: Deno.env.get('SMTP_PORT'),
    // These two are optional and carry no default: the credentialed and the uncredentialed transport are both deliberate.
    user: Deno.env.get('SMTP_USER'),
    pass: Deno.env.get('SMTP_PASS'),
    sender: Deno.env.get('SMTP_FROM')
  };
}

/** The one place that writes a log line. A caller passes a fixed message and, at most, the name and code of a failure. */
function log(message: string, detail?: LogDetail): void {
  const suffix = detail && Object.keys(detail).length > 0 ? ` ${JSON.stringify(detail)}` : '';
  console.error(`${LOG_PREFIX} ${message}${suffix}`);
}

Deno.serve(handleRequest);
