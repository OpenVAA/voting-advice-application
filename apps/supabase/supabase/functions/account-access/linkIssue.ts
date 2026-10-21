/**
 * The order of a link issue: the deployment checks, the eligibility question, the issue, the mail, the release of a slot nothing was mailed for, and the completion witness.
 *
 * Two requests are issued in that one order. A link request asks the database whether a sign-in mail may go to an address or to the holder of a code. A recovery request asks it which mail, if any, an address earns: the recovery mail for an account that holds a grant, the sign-in mail for an address that has only an invitation. They differ in the eligibility question alone; everything before and after it is one function of this module.
 *
 * Every effect is a dependency passed in, so each path through the order is a unit test. The module has no Deno imports, no URL imports, no reference to the Deno global and no client.
 *
 * THE ORDER IS THE CONTRACT. Both deployment checks come before the database is asked about the address, so a deployment that must not issue links takes no slot. For a sign-in mail the user is created without a password before the token is minted, so nobody is given a password they did not choose. For a recovery mail no user is created at all: the token is minted for the account the database named. A slot that was taken and then mailed nothing is given back, so the address is not locked out for its interval with no mail.
 */

import { renderRecoveryMail, renderSignInMail, resolveMailLocale } from './mailTemplates.ts';
import { buildSignInLink, callbackUrl } from './signInLink.ts';
import type { RequestLinkRequest, RequestRecoveryRequest } from './contract.ts';

/** Whether a mail was handed to the transport. */
export type LinkIssueOutcome = 'sent' | 'not-sent';

/** Which of the two mails an address earns. */
export type MailKind = 'recovery' | 'sign-in';

/** What the database answers a recovery request it lets through: the address to mail, and which mail. */
export interface RecoveryEligibility {
  address: string;
  mail: MailKind;
}

/** What a log line may carry about a failure: the error's name and its code, and nothing else. */
export interface LogDetail {
  name?: string;
  code?: string;
}

/** A mail ready for the transport. */
export interface OutgoingMail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/** Every effect a link issue has. */
export interface LinkIssueDeps {
  /** The configured site origin the mailed link points at. */
  siteUrl: string;
  /** Whether the served auth settings say public sign-up is disabled and addresses are confirmed by mail only. */
  signUpClosed(): Promise<boolean>;
  /** Whether the auth service admits the callback URL as a redirect target. */
  redirectAdmitted(callbackUrl: string): Promise<boolean>;
  /** The address a sign-in mail may go to, or null for "do nothing". A non-null answer has taken the address's slot. */
  requestEligibility(request: { projectId: string; email: string | null; code: string | null }): Promise<string | null>;
  /** The address a recovery request's mail may go to and which mail it is, or null for "do nothing". A non-null answer has taken the address's slot. */
  recoveryEligibility(request: { projectId: string; email: string }): Promise<RecoveryEligibility | null>;
  /** Make sure a user exists for the address, created without a password when there was none. */
  createPasswordlessUser(address: string): Promise<void>;
  /** Mint a single-use sign-in token for the address and return its hash. */
  mintToken(address: string): Promise<string>;
  /** Mint a single-use recovery token for the existing account of the address and return its hash. It creates no account. */
  mintRecoveryToken(address: string): Promise<string>;
  /** Hand one mail to the transport. Resolves once the transport has accepted it. */
  sendMail(mail: OutgoingMail): Promise<void>;
  /** Give back the slot the eligibility answer took. */
  release(slot: { projectId: string; address: string; code: string | null }): Promise<void>;
  /** Record the outcome on a completion record the service role opened. */
  completeWitness(id: string, outcome: LinkIssueOutcome): Promise<void>;
  /** Write one log line. It never receives an address, a code, a token hash, a link, a locale or a request. */
  log(message: string, detail?: LogDetail): void;
}

/** What the two requests have in common: where the work is done for, in which locale, and whose record says it ended. */
type IssueRequest = Pick<RequestLinkRequest, 'projectId' | 'locale' | 'witness'>;

/** Whom a mail goes to, which mail it is, and the code the address's slot is given back with. */
interface Recipient extends RecoveryEligibility {
  code: string | null;
}

const SAFE_LOG_TOKEN = /^[A-Za-z0-9_.:-]{1,64}$/;

/**
 * What a log line may say about a thrown value.
 *
 * A failure's message can quote the address or the code it failed on, so it is never logged. The name and the code are kept only when each is a short run of letters, digits and `_ . : -`, which an address cannot be.
 *
 * @param error - Whatever was thrown or returned as an error
 * @returns The error's name and code, each present only when it is such a token
 */
export function describeFailure(error: unknown): LogDetail {
  const detail: LogDetail = {};
  if (typeof error !== 'object' || error === null) return detail;
  const { name, code } = error as { name?: unknown; code?: unknown };
  if (typeof name === 'string' && SAFE_LOG_TOKEN.test(name)) detail.name = name;
  if (typeof code === 'string' && SAFE_LOG_TOKEN.test(code)) detail.code = code;
  return detail;
}

/** An eligibility answer as the two things it must be, or null: an address that is a non-empty string and one of the two kinds of mail. */
function eligibility(address: unknown, mail: unknown): RecoveryEligibility | null {
  if (typeof address !== 'string' || address === '') return null;
  if (mail !== 'recovery' && mail !== 'sign-in') return null;
  return { address, mail };
}

/**
 * Read the database's answer to a recovery request.
 *
 * @param answer - What `recovery_link_request` returned, of any shape
 * @returns The address and the kind of mail when the answer is an object whose `email` is a non-empty string and whose `mail` is exactly `recovery` or `sign-in`, and null for anything else
 */
export function readRecoveryEligibility(answer: unknown): RecoveryEligibility | null {
  if (typeof answer !== 'object' || answer === null) return null;
  const { email, mail } = answer as { email?: unknown; mail?: unknown };
  return eligibility(email, mail);
}

/** Write one log line. A logger that throws cannot turn an outcome into a rejection. */
function say(deps: LinkIssueDeps, message: string, detail?: LogDetail): void {
  try {
    if (detail === undefined) deps.log(message);
    else deps.log(message, detail);
  } catch {
    // Nothing can be done about a logger that fails, and the outcome does not depend on it.
  }
}

/** The steps up to and including the mail. Rejects only for a failure before a slot is known to be taken. */
async function attempt(
  request: IssueRequest,
  deps: LinkIssueDeps,
  settle: () => Promise<Recipient | null>
): Promise<LinkIssueOutcome> {
  if ((await deps.signUpClosed()) !== true) {
    say(deps, 'public sign-up is not disabled on this deployment; no link issued');
    return 'not-sent';
  }

  const locale = resolveMailLocale(request.locale);
  const callback = callbackUrl({ siteUrl: deps.siteUrl, locale });
  if ((await deps.redirectAdmitted(callback)) !== true) {
    say(deps, 'SITE_URL is not admitted by the auth redirect allowlist; no link issued');
    return 'not-sent';
  }

  const recipient = await settle();
  if (recipient === null) return 'not-sent';
  const { address, mail, code } = recipient;

  try {
    let tokenHash: string;
    if (mail === 'recovery') {
      tokenHash = await deps.mintRecoveryToken(address);
    } else {
      await deps.createPasswordlessUser(address);
      tokenHash = await deps.mintToken(address);
    }
    if (typeof tokenHash !== 'string' || tokenHash === '') throw new Error('The auth service issued no token hash.');
    const link = buildSignInLink({
      siteUrl: deps.siteUrl,
      locale,
      tokenHash,
      type: mail === 'recovery' ? 'recovery' : 'magiclink'
    });
    const { subject, text, html } =
      mail === 'recovery' ? renderRecoveryMail(locale, link) : renderSignInMail(locale, link);
    await deps.sendMail({ to: address, subject, text, html });
    return 'sent';
  } catch (error) {
    say(deps, 'a link could not be issued or mailed; its slot is given back', describeFailure(error));
    try {
      await deps.release({ projectId: request.projectId, address, code });
    } catch (releaseError) {
      say(deps, 'the slot could not be given back', describeFailure(releaseError));
    }
    return 'not-sent';
  }
}

/** One issue from its first check to its witness. Never rejects: a failure is logged by its name and code and is an outcome. */
async function issue(
  request: IssueRequest,
  deps: LinkIssueDeps,
  settle: () => Promise<Recipient | null>
): Promise<LinkIssueOutcome> {
  let outcome: LinkIssueOutcome = 'not-sent';
  try {
    outcome = await attempt(request, deps, settle);
  } catch (error) {
    say(deps, 'the link issue ended before eligibility was settled; no link issued', describeFailure(error));
  } finally {
    if (request.witness !== null) {
      try {
        await deps.completeWitness(request.witness, outcome);
      } catch (witnessError) {
        say(deps, 'the completion witness could not be written', describeFailure(witnessError));
      }
    }
  }
  return outcome;
}

/**
 * Issue a sign-in link for a parsed link request, if the deployment and the database both allow it.
 *
 * The order: (a) the sign-up check, (b) the locale, the callback URL and the redirect check, (c) the eligibility question, whose null answer ends the work silently, (d) the passwordless user, the token, the link, the mail, (e) on any failure in (d) the release of the slot, (f) on every path the completion of the request's witness, when it names one.
 *
 * @param request - The parsed `request-link` body
 * @param deps - Every effect, injected
 * @returns `'sent'` when a mail was handed to the transport, `'not-sent'` otherwise. Never rejects: a failure is logged by its name and code and is an outcome.
 */
export async function issueSignInLink(request: RequestLinkRequest, deps: LinkIssueDeps): Promise<LinkIssueOutcome> {
  return issue(request, deps, async () => {
    const address = await deps.requestEligibility({
      projectId: request.projectId,
      email: request.email,
      code: request.code
    });
    const settled = eligibility(address, 'sign-in');
    return settled === null ? null : { ...settled, code: request.code };
  });
}

/**
 * Issue the mail a parsed recovery request earns, if the deployment and the database both allow it.
 *
 * The order is that of {@link issueSignInLink}, with the recovery question in the place of (c). For an answer of `recovery`, (d) is a recovery token minted for the account that exists, a link of the type `recovery` and the recovery mail, and no user is created. For an answer of `sign-in`, (d) is what a link request does. The slot is given back with the address alone: a recovery request names no code.
 *
 * @param request - The parsed `request-recovery` body
 * @param deps - Every effect, injected
 * @returns `'sent'` when a mail was handed to the transport, `'not-sent'` otherwise. Never rejects: a failure is logged by its name and code and is an outcome.
 */
export async function issueRecoveryLink(
  request: RequestRecoveryRequest,
  deps: LinkIssueDeps
): Promise<LinkIssueOutcome> {
  return issue(request, deps, async () => {
    const answer = await deps.recoveryEligibility({ projectId: request.projectId, email: request.email });
    const settled = typeof answer === 'object' && answer !== null ? eligibility(answer.address, answer.mail) : null;
    return settled === null ? null : { ...settled, code: null };
  });
}
