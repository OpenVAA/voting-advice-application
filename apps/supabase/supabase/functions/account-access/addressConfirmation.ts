/**
 * The address confirmation: a signed-in account that an identity provider made, still on its placeholder address, asks for an address it typed to be proved, and the holder of that address is mailed a link that proves it.
 *
 * Pure functions with no Deno imports, no URL imports, no reference to the Deno global and no client: every effect is a dependency passed in, so each path is a unit test.
 *
 * THE ADDRESS CHANGES ONLY WHEN THE MAILED LINK IS OPENED. The auth service is asked for the two links of a change of address, from the account's current address to the typed one. The current address's link is verified here at once, which leaves the typed address pending on the account and changes nothing else; the typed address's link is mailed. Only opening that link makes the typed address the account's. The typed address is never written to the account, and the placeholder is never mailed.
 *
 * THE ONE ADDRESS WRITTEN IS THE PLACEHOLDER, PUT BACK. The recipe needs the auth service's secure change of address ("Secure email change", `double_confirm_changes`), under which the current address's link only records the first of two confirmations. Without it, verifying that link completes the change at once and answers with a session, and the typed address would stay on the account unproved. So a verification that answers with a session is undone: the account's own placeholder, which it held before the request, is put back, nothing is mailed and the request is refused.
 *
 * Every request repeats all three steps, because a new link for the typed address replaces the one before it and resets what the current address's link did. So the newest mail is the one that works.
 *
 * THE ORDER IS THE CONTRACT. The caller is read from their own access token before anything else; an account that may not ask and an address on the placeholder domain take no slot, and the database takes none for a project the account registered no entity in. The slot, one per account and one per address, neither of them per project, is taken before the database is asked whether an open invitation of the project holds the address and before the auth service is asked about the address, because each answer says whether the address is spoken for. A slot that was taken and then mailed nothing is given back for the address.
 *
 * AN INVITED ADDRESS IS ANSWERED `invited`. An account an identity provider made claims no invitation, so an address that an open invitation of the project holds is not proved for it. When the project would honour that invitation, the answer tells the caller to sign in by email with it instead, and an admin can remove the entity the identity provider's registration made. When it would not, because the invitation's registration mode is off, the address stays reserved for the invitation and is answered `in-use`, so the caller is not sent to a sign-in that mails nothing.
 *
 * WHY THE PROJECT MUST BE THE ACCOUNT'S. The mail and the change of address are the same whatever project a request names, so a project the caller could choose freely would bound nothing. `public.email_confirmation_request` takes the slot only for a project the account's identity registration names, and keys neither slot on the project; a request for any other project is answered `refused`.
 */

import { isPlainObject } from '../_shared/guards.ts';
import { isPlaceholderEmail } from '../_shared/placeholderEmail.ts';
import { describeFailure } from './linkIssue.ts';
import { renderAddressConfirmationMail, resolveMailLocale } from './mailTemplates.ts';
import { buildSignInLink, confirmPageUrl } from './signInLink.ts';
import type { AddressConfirmationOutcome, ConfirmAddressRequest } from './contract.ts';
import type { LogDetail, OutgoingMail } from './linkIssue.ts';

/** What the operation reads of the account the caller's access token names. */
export interface CallerAccount {
  /** The account's user id. */
  id: string;
  /** The account's current address, or null when it has none. */
  email: string | null;
  /** The identity provider the account's app metadata names, or null when it names none. */
  identityProvider: string | null;
}

/** Which hold an open invitation has on an address, as `public.email_invitation_hold` answers it. */
export type InvitationHold = 'allowed' | 'held' | 'none';

/** Which of the two links of a change of address: the one for the current address, or the one for the new address. */
export type EmailChangeKind = 'current' | 'new';

/** The two tokens the auth service answers a link of a change of address with. */
export interface EmailChangeTokens {
  /** The `hashed_token` of the answer. */
  hashedToken: string;
  /** The `token` parameter of the answer's `action_link`. */
  actionLinkToken: string;
}

/** Every effect an address confirmation has. */
export interface AddressConfirmationDeps {
  /** The configured site origin the mailed link points at. */
  siteUrl: string;
  /** The account a caller's access token names, or null when the auth service refuses the token. Rejects for any other failure. */
  callerAccount(token: string): Promise<CallerAccount | null>;
  /** Take the account's slot and then the address's slot, neither of them per project. True only when both were taken; false, with nothing taken, for a project the account's identity registration does not name. */
  takeSlot(slot: { projectId: string; userId: string; email: string }): Promise<boolean>;
  /** Give the address's slot back. The account's slot is never given back. */
  releaseSlot(slot: { email: string }): Promise<void>;
  /** Which hold an open invitation of the project, unclaimed and unexpired, has on the address as its address or as the pending address of its code: `allowed` when the project would honour one such invitation, `held` when it would honour none, `none` when no such invitation holds it. Rejects when the database cannot answer or answers something else. */
  emailInvitationHold(query: { projectId: string; email: string }): Promise<InvitationHold>;
  /** Ask the auth service for one link of a change of address. Answers `'email-exists'` when another account holds the new address. */
  generateEmailChange(
    kind: EmailChangeKind,
    addresses: { currentEmail: string; newEmail: string }
  ): Promise<EmailChangeTokens | 'email-exists'>;
  /** Verify the current address's token. Answers `'confirmed'` when the auth service accepted it without issuing a session, and `'completed'` when it issued one, which means the change of address completed without the mailed link. Rejects for anything else. */
  verifyCurrent(tokenHash: string): Promise<'confirmed' | 'completed'>;
  /** Put an account's own placeholder address back, confirmed, after a change of address that completed without the mailed link. */
  restoreAddress(restoration: { userId: string; email: string }): Promise<void>;
  /** Hand one mail to the transport. Resolves once the transport has accepted it. */
  sendMail(mail: OutgoingMail): Promise<void>;
  /** Write one log line. It never receives an address, a token, a token hash, a link, a locale or a user id. */
  log(message: string, detail?: LogDetail): void;
}

/**
 * Prove a typed address for the signed-in account of an identity provider.
 *
 * The order: (a) the caller read from their own token, (b) the account and the typed address judged, (c) the slot, which the database does not take for a project the account registered no entity in, (d) which hold an open invitation of the project has on the address, (e) the current address's link, (f) the new address's link, (g) the current token verified, (h) the new link mailed to the typed address. An invitation the project would honour at (d) gives the address's slot back and is `invited`, and one it would not gives it back and is `in-use`; an answer that the address exists at (e) or (f) gives it back and is `in-use`; a verification at (g) that completed the change puts the placeholder back and is `refused`; any failure after (c), an answer at (d) that is none of the three included, gives the slot back and is `refused`.
 *
 * @param request - The parsed `confirm-address` body
 * @param callerToken - The access token of the request's `Authorization` header, or null when it carried none
 * @param deps - Every effect, injected
 * @returns `'sent'`, `'in-use'`, `'invited'`, `'refused'` or `'unauthenticated'`. Never rejects: a failure is logged by its name and code and is an outcome.
 */
export async function confirmAddress(
  request: ConfirmAddressRequest,
  callerToken: string | null,
  deps: AddressConfirmationDeps
): Promise<AddressConfirmationOutcome> {
  if (typeof callerToken !== 'string' || callerToken === '') return 'unauthenticated';

  let account: CallerAccount | null;
  try {
    account = await deps.callerAccount(callerToken);
  } catch (error) {
    say(deps, 'the caller could not be read; nothing changed', describeFailure(error));
    return 'refused';
  }
  if (account === null) return 'unauthenticated';
  if (!mayAsk(account)) return 'refused';
  const currentEmail = account.email as string;

  const typed = request.email.trim();
  if (isPlaceholderEmail(typed)) return 'refused';

  const locale = resolveMailLocale(request.locale);
  try {
    confirmPageUrl({ siteUrl: deps.siteUrl, locale });
  } catch (error) {
    say(deps, 'SITE_URL cannot carry a link; nothing changed', describeFailure(error));
    return 'refused';
  }

  let taken: boolean;
  try {
    taken = await deps.takeSlot({ projectId: request.projectId, userId: account.id, email: typed });
  } catch (error) {
    say(deps, 'the slot could not be taken; nothing changed', describeFailure(error));
    return 'refused';
  }
  if (taken !== true) return 'refused';

  const slot = { email: typed };
  try {
    const hold = await deps.emailInvitationHold({ projectId: request.projectId, email: typed });
    if (hold === 'allowed') return giveBack(deps, slot, 'invited');
    if (hold === 'held') return giveBack(deps, slot, 'in-use');
    if (hold !== 'none') throw new Error('The invitation-hold check answered none of allowed, held and none.');

    const addresses = { currentEmail, newEmail: typed };
    const current = await deps.generateEmailChange('current', addresses);
    if (current === 'email-exists') return giveBack(deps, slot, 'in-use');
    const next = await deps.generateEmailChange('new', addresses);
    if (next === 'email-exists') return giveBack(deps, slot, 'in-use');

    // The current address's link is verified by the hash the auth service answered; the new address's link works only by the token of its action link.
    const verification = await deps.verifyCurrent(tokenOf(current.hashedToken));
    if (verification !== 'confirmed') {
      return undoCompletedChange(deps, { userId: account.id, email: currentEmail }, slot);
    }
    const link = buildSignInLink({
      siteUrl: deps.siteUrl,
      locale,
      tokenHash: tokenOf(next.actionLinkToken),
      type: 'email_change',
      app: 'contestant'
    });
    await deps.sendMail({ to: typed, ...renderAddressConfirmationMail(locale, link) });
    return 'sent';
  } catch (error) {
    say(deps, 'an address confirmation could not be issued or mailed; its slot is given back', describeFailure(error));
    return giveBack(deps, slot, 'refused');
  }
}

/** Write one log line. A logger that throws cannot turn an outcome into a rejection. */
function say(deps: AddressConfirmationDeps, message: string, detail?: LogDetail): void {
  try {
    if (detail === undefined) deps.log(message);
    else deps.log(message, detail);
  } catch {
    // Nothing can be done about a logger that fails, and the outcome does not depend on it.
  }
}

/** Whether an account may ask: an identity provider made it, and its address is still the placeholder. */
function mayAsk(account: CallerAccount): boolean {
  return (
    typeof account.identityProvider === 'string' && account.identityProvider !== '' && isPlaceholderEmail(account.email)
  );
}

/** Give the address's slot back, logging a failure, and answer the outcome unchanged. */
async function giveBack(
  deps: AddressConfirmationDeps,
  slot: { email: string },
  outcome: AddressConfirmationOutcome
): Promise<AddressConfirmationOutcome> {
  try {
    await deps.releaseSlot(slot);
  } catch (releaseError) {
    say(deps, 'the address slot could not be given back', describeFailure(releaseError));
  }
  return outcome;
}

/** A token the auth service answered, as a non-empty string. */
function tokenOf(value: unknown): string {
  if (typeof value !== 'string' || value === '') throw new Error('The auth service issued no token.');
  return value;
}

/** Undo a change of address that the current address's link completed alone: put the placeholder back, give the address's slot back, and refuse. */
async function undoCompletedChange(
  deps: AddressConfirmationDeps,
  restoration: { userId: string; email: string },
  slot: { email: string }
): Promise<AddressConfirmationOutcome> {
  say(deps, 'the current address’s link completed the change of address alone; the placeholder is put back');
  try {
    await deps.restoreAddress(restoration);
  } catch (error) {
    say(deps, 'the placeholder could not be put back', describeFailure(error));
  }
  return giveBack(deps, slot, 'refused');
}

const BEARER = /^Bearer ([^\s]+)$/i;

/**
 * The access token of an `Authorization` header.
 *
 * @param header - The header's value, or null when the request carried none
 * @returns The token of a `Bearer` header with exactly one token, and null for anything else
 */
export function bearerToken(header: string | null | undefined): string | null {
  if (typeof header !== 'string') return null;
  return BEARER.exec(header)?.[1] ?? null;
}

/**
 * Whether the auth service's failure to read a caller says the token itself was refused.
 *
 * @param error - What reading the caller failed with
 * @returns True only for an answer of the auth service with the status 401 or 403; false for an outage, a timeout or anything else
 */
export function callerTokenRefused(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const { status } = error as { status?: unknown };
  return status === 401 || status === 403;
}

/**
 * The identity provider an account's app metadata names.
 *
 * @param appMetadata - The account's `app_metadata`, of any shape
 * @returns The own `identity_provider` key when it is a non-empty string, and null otherwise
 */
export function identityProviderOf(appMetadata: unknown): string | null {
  if (!isPlainObject(appMetadata) || !Object.prototype.hasOwnProperty.call(appMetadata, 'identity_provider'))
    return null;
  const provider = appMetadata.identity_provider;
  return typeof provider === 'string' && provider !== '' ? provider : null;
}

/**
 * Whether a verification of the current address's token completed the change of address: accepted, with a session. That is the answer of an auth service whose secure change of address is off.
 *
 * @param status - The HTTP status of the verification
 * @param body - Its decoded body, of any shape
 * @returns True only for status 200 and an object body that carries an access token
 */
export function isCompletedChange(status: number, body: unknown): boolean {
  if (status !== 200 || typeof body !== 'object' || body === null) return false;
  return 'access_token' in body;
}

/**
 * Whether a verification of the current address's token was the single confirmation the recipe expects: accepted, with no session. A session would mean the change of address had completed without the mailed link.
 *
 * @param status - The HTTP status of the verification
 * @param body - Its decoded body, of any shape
 * @returns True only for status 200 and an object body that carries no access token
 */
export function isSingleConfirmation(status: number, body: unknown): boolean {
  if (status !== 200 || typeof body !== 'object' || body === null) return false;
  return !('access_token' in body);
}
