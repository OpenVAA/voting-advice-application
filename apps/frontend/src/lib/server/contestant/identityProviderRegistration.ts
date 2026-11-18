import { log } from '@openvaa/app-shared';
import { hasDefaultLocaleName, ownOrganizationId } from '$lib/contestant/utils/identityProviderAccount';
import type { LocalizedString } from '@openvaa/app-shared';
import type {
  AddressConfirmationResult,
  BasicUserData,
  RequestAddressConfirmationOptions,
  SetPropertiesOptions,
  UpdateEntityPropertiesResult,
  UserEntity
} from '$lib/api/base/dataWriter.type';

/**
 * # What a signed-in identity-provider account saves after it arrives
 *
 * The one server endpoint behind the identity provider's success view and the settings page. A request names one intent:
 *
 * - `save` — the names of the organization the identity registered, an address to prove, or both. The names are written to that organization alone, found by the record `identity-callback` keeps in the account's `app_metadata` and never by an id the request names, and only while the organization is unconfirmed, the project's answers are not locked and the name has text in the default locale. The address is handed to the address-confirmation operation of `account-access`, which mails it a link; it becomes the account's address only when that link is opened, and the request is refused unless the account has no proved address yet. The names are saved before the address is asked for, so a later failure leaves them saved. A save that succeeds clears the arrival marker.
 * - `resend` — the link for the pending address, mailed again.
 * - `acknowledge` — the arrival marker cleared, and nothing else.
 *
 * Each request is answered with one of {@link IDENTITY_PROVIDER_REGISTRATION_RESULT}. No answer carries an address, a name or an id, and no answer tells why a request failed.
 *
 * Only a signed-in caller is served (401 otherwise), and only a JSON request from the endpoint's own origin (403 otherwise), so another site cannot make a signed-in browser save anything. Every effect is a dependency, so the decision is tested without a server.
 *
 * Tested in `identityProviderRegistration.test.ts`.
 */

/** Every answer of the endpoint. */
export const IDENTITY_PROVIDER_REGISTRATION_RESULT = Object.freeze({
  saved: 'saved',
  inUse: 'in-use',
  failed: 'failed',
  sent: 'sent',
  acknowledged: 'acknowledged'
} as const);

/** One answer of the endpoint. */
export type IdentityProviderRegistrationResult =
  (typeof IDENTITY_PROVIDER_REGISTRATION_RESULT)[keyof typeof IDENTITY_PROVIDER_REGISTRATION_RESULT];

/** What the handler answers: the HTTP status and the body, which holds the result alone. */
export type IdentityProviderRegistrationReply = {
  status: 200 | 400 | 401 | 403;
  body: { result: IdentityProviderRegistrationResult };
};

/** The verified user, as far as the handler reads it. */
export type VerifiedRegistrationUser = {
  /** The user's `app_metadata`, which holds the record of the entity the identity registered. */
  appMetadata: unknown;
};

/** The effects and facts of one request. */
export interface IdentityProviderRegistrationDeps {
  /** The endpoint's own origin, which a request's `Origin` header must equal. */
  origin: string;
  /** The project the application serves. */
  projectId: string;
  /** The locale a name must have text in. */
  defaultLocale: string;
  /** The locale a confirmation mail is written in. */
  locale: string;
  /** The locales a name may have text in. */
  supportedLocales: ReadonlyArray<string>;
  /** The verified user, or `null` when no one is signed in. */
  getVerifiedUser: () => Promise<VerifiedRegistrationUser | null>;
  /** Whether the project's answers are locked, which closes the names to their editor. */
  getAnswersLocked: () => Promise<boolean>;
  /** The user-level data of the signed-in user. */
  getBasicUserData: () => Promise<BasicUserData>;
  /** The entities the signed-in user edits. */
  getUserEntities: () => Promise<Array<UserEntity>>;
  /** The writer's write of an entity's properties. */
  updateEntityProperties: (opts: SetPropertiesOptions) => Promise<UpdateEntityPropertiesResult>;
  /** The writer's request for an address to be proved. */
  requestAddressConfirmation: (opts: RequestAddressConfirmationOptions) => Promise<AddressConfirmationResult>;
  /** Clear the arrival marker. */
  deleteArrivalMarker: () => void;
}

/** A request's intent, with what it carries. */
type RegistrationIntent =
  | { intent: 'save'; name?: LocalizedString; shortName?: LocalizedString | null; email?: string }
  | { intent: 'resend' }
  | { intent: 'acknowledge' };

/** The longest address the endpoint passes on, as the address-confirmation operation bounds it. */
const MAX_EMAIL_LENGTH = 254;

/** The longest text a name may have in one locale. */
const MAX_NAME_LENGTH = 200;

function reply(status: IdentityProviderRegistrationReply['status'], result: IdentityProviderRegistrationResult) {
  return { status, body: { result } };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Whether a value is a name the endpoint passes on: an object of texts, each in a supported locale and no longer than {@link MAX_NAME_LENGTH}.
 * @param value - The value.
 * @param supportedLocales - The locales a text may be in.
 * @returns `true` when it is.
 */
function isBoundedName(value: unknown, supportedLocales: ReadonlyArray<string>): value is LocalizedString {
  return (
    isObject(value) &&
    Object.entries(value).every(
      ([locale, text]) =>
        supportedLocales.includes(locale) && typeof text === 'string' && text.length <= MAX_NAME_LENGTH
    )
  );
}

/**
 * Read the request's intent. Anything else, including a member of the wrong type, a name in a locale the application does not support or longer than a name may be, or a save that carries nothing, is no intent.
 * @param body - The parsed body.
 * @param supportedLocales - The locales a name may have text in.
 * @returns The intent, or `null`.
 */
function parseIntent(body: unknown, supportedLocales: ReadonlyArray<string>): RegistrationIntent | null {
  if (!isObject(body)) return null;
  if (body.intent === 'resend' || body.intent === 'acknowledge') return { intent: body.intent };
  if (body.intent !== 'save') return null;

  const intent: RegistrationIntent = { intent: 'save' };
  if (body.name !== undefined) {
    if (!isBoundedName(body.name, supportedLocales)) return null;
    intent.name = body.name;
  }
  if (body.shortName !== undefined) {
    if (body.shortName !== null && !isBoundedName(body.shortName, supportedLocales)) return null;
    if (intent.name === undefined) return null;
    intent.shortName = body.shortName;
  }
  if (body.email !== undefined) {
    if (typeof body.email !== 'string') return null;
    const email = body.email.trim();
    if (email === '' || email.length > MAX_EMAIL_LENGTH) return null;
    intent.email = email;
  }
  return intent.name === undefined && intent.email === undefined ? null : intent;
}

/**
 * Whether a request may be served at all: JSON, from the endpoint's own origin.
 * @param request - The request.
 * @param origin - The endpoint's own origin.
 * @returns `true` when both hold.
 */
function isSameOriginJson(request: Request, origin: string): boolean {
  const contentType = request.headers.get('content-type') ?? '';
  return (
    request.headers.get('origin') === origin && contentType.split(';')[0].trim().toLowerCase() === 'application/json'
  );
}

/**
 * Save the names of the identity's own organization.
 * @returns `true` when they were stored.
 */
async function saveNames(
  deps: IdentityProviderRegistrationDeps,
  appMetadata: unknown,
  name: LocalizedString,
  shortName: LocalizedString | null | undefined
): Promise<boolean> {
  const ownId = ownOrganizationId(appMetadata, deps.projectId);
  if (ownId === null || !hasDefaultLocaleName(name, deps.defaultLocale)) return false;
  if (await deps.getAnswersLocked()) return false;
  const own = (await deps.getUserEntities()).find((entity) => entity.type === 'organization' && entity.id === ownId);
  if (!own || own.confirmed !== false) return false;

  const properties: SetPropertiesOptions['properties'] = { name };
  if (shortName !== undefined) properties.shortName = shortName;
  const saved = await deps.updateEntityProperties({ target: { type: 'organization', id: ownId }, properties });
  return saved.type === 'saved';
}

/**
 * Serve one request of the endpoint.
 *
 * Never rejects: a read or write that throws is logged by its message alone and answered `failed`.
 * @param request - The request.
 * @param deps - The request's effects and facts.
 * @returns The status and the body to answer with.
 */
export async function handleIdentityProviderRegistration(
  request: Request,
  deps: IdentityProviderRegistrationDeps
): Promise<IdentityProviderRegistrationReply> {
  const { saved, inUse, failed, sent, acknowledged } = IDENTITY_PROVIDER_REGISTRATION_RESULT;
  try {
    const verified = await deps.getVerifiedUser();
    if (!verified) return reply(401, failed);
    if (!isSameOriginJson(request, deps.origin)) return reply(403, failed);

    const intent = parseIntent(await request.json().catch(() => undefined), deps.supportedLocales);
    if (!intent) return reply(400, failed);

    if (intent.intent === 'acknowledge') {
      deps.deleteArrivalMarker();
      return reply(200, acknowledged);
    }

    const user = await deps.getBasicUserData();

    if (intent.intent === 'resend') {
      if (user.addressState !== 'pending' || !user.pendingEmail) return reply(200, failed);
      const outcome = await deps.requestAddressConfirmation({ email: user.pendingEmail, locale: deps.locale });
      return reply(200, outcome === 'sent' ? sent : failed);
    }

    if (intent.email !== undefined && user.addressState === 'proved') return reply(200, failed);
    if (intent.name !== undefined && !(await saveNames(deps, verified.appMetadata, intent.name, intent.shortName)))
      return reply(200, failed);
    if (intent.email !== undefined) {
      const outcome = await deps.requestAddressConfirmation({ email: intent.email, locale: deps.locale });
      if (outcome === 'in-use') return reply(200, inUse);
      if (outcome !== 'sent') return reply(200, failed);
    }
    deps.deleteArrivalMarker();
    return reply(200, saved);
  } catch (e) {
    log.error(`Identity-provider registration failed: ${e instanceof Error ? e.message : 'No error message'}`);
    return reply(200, failed);
  }
}
