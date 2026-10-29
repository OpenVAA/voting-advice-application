import { getLocalized, log, SERVED_ENTITY_TYPES } from '@openvaa/app-shared';
import { PROPERTY_MAP } from '@openvaa/supabase-types';
import { AnswersLockedError } from '$lib/api/base/answersLockedError';
import { UniversalDataWriter, UNVERIFIED_ANSWERS } from '$lib/api/base/universalDataWriter';
// Imported from the module rather than the `$lib/auth` barrel on purpose: the barrel also re-exports `getUserData`, which reaches `$lib/api/dataWriter` and back to this file.
import { ADMIN_GRANTS, CONTESTANT_GRANTS, hasAnyGrant, readGrants } from '$lib/auth/roles';
import {
  addressStateOf,
  hasDefaultLocaleName,
  isPlaceholderAddress,
  ownOrganizationId
} from '$lib/contestant/utils/identityProviderAccount';
import { ROUTE } from '$lib/routes';
import { ensureColors } from '$lib/utils/color/ensureColors';
import { toHexColor } from '$lib/utils/color/toHexColor';
import { constants } from '$lib/utils/constants';
import { normalizeLocalizedName } from '$lib/utils/localizedText';
import { supabaseAdapterMixin } from '../supabaseAdapter';
import { parseEntityNominations } from '../utils/entityNominations';
import {
  parseAddressConfirmationAnswer,
  parseCodeSignIn,
  parseInvitationClaim,
  parseInvitationCodeStatus,
  parsePasswordRecoveryRequest,
  parseSignInLinkRequest
} from '../utils/invitationAccess';
import { localizeRow } from '../utils/localizeRow';
import { parseNominationParentOptions } from '../utils/nominationParentOptions';
import {
  answersOf,
  colorOf,
  imageOf,
  localizedStringOf,
  parseAnswersColumn,
  parseColorColumn,
  parseImageColumn,
  parseLocalizedStringColumn,
  STORED_HEX_COLOR
} from '../utils/parseJsonbColumn';
import { parseSetEntityNominationsAnswer } from '../utils/setEntityNominationsAnswer';
import { toDataObject } from '../utils/toDataObject';
import { parseCallerPasswordSet, parseCallerPendingEmailTaken, parseUserEntities } from '../utils/userEntities';
import type { LocalizedString, ServedEntityType } from '@openvaa/app-shared';
import type { Colors, EntityType } from '@openvaa/data';
import type { Json } from '@openvaa/supabase-types';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type {
  AddressConfirmationResult,
  BasicUserData,
  ContestantUserData,
  DesiredNomination,
  DWReturnType,
  EditableEntityColor,
  EditableEntityProps,
  EntityNomination,
  GetEntityUserDataOptions,
  GetNominationParentOptionsOptions,
  GetUserEntitiesOptions,
  InvitationClaimResult,
  InvitationCodeStatus,
  LocalizedEntityData,
  LocalizedEntityNames,
  NominationParentChoice,
  NominationParentOption,
  RequestAddressConfirmationOptions,
  RequestPasswordRecoveryOptions,
  RequestSignInLinkOptions,
  SavedEntityProps,
  SetAnswersOptions,
  SetAnswersResult,
  SetEntityNominationsOptions,
  SetEntityNominationsResult,
  SetPropertiesOptions,
  UpdateEntityPropertiesResult,
  UserEntity,
  UserRole
} from '$lib/api/base/dataWriter.type';
import type { SupabaseAdapterConfig } from '../supabaseAdapter.type';
import type { EntityNominationRow } from '../utils/entityNominations';
import type { NominationParentOptionRow } from '../utils/nominationParentOptions';
import type { ParseSource } from '../utils/parseOutcome.type';

/**
 * The file extensions an entity's upload may end up carrying in its Storage object path.
 *
 * ## Why a whitelist rather than the uploader's own suffix
 *
 * `file.name` is fully controlled by the uploader. Its suffix, `file.name.split('.').pop()`, cannot yield a `..` segment, because it contains no dot by construction, but it CAN contain a `/`: a file named `a.b/c/d` yields `"/d"` and a path of `…/<uuid>./d`, which would let the uploader place objects at chosen sub-paths inside the prefix. It can also be arbitrarily long, or carry control characters, `%`, `?`, `#` or non-ASCII, any of which can confuse a Storage RLS policy or a later parser written against the expected `<project>/<table>/<id>/<uuid>.<ext>` shape. The extension is also copied verbatim into the stored `{ path }`, which `parseImageColumn`/`storageUrl` later turn into a public URL.
 *
 * Deriving the extension from a fixed set makes the produced path a member of a small, known language regardless of what was uploaded.
 */
const ALLOWED_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']);

/**
 * The table that holds the rows of each entity type the application serves.
 *
 * The one place a served entity type is turned into a table name. The table a write goes to, the folder an upload is stored under and the labels of the parse reports are all read from it, so the three cannot disagree. Storage's own policy maps the folder back to the entity type.
 */
const ENTITY_TABLES = {
  candidate: 'candidates',
  organization: 'organizations'
} as const satisfies Record<ServedEntityType, string>;

/** A table an entity of a served type is stored in. */
type EntityTable = (typeof ENTITY_TABLES)[ServedEntityType];

/**
 * The properties an entity's editor may write through `updateEntityProperties`, for each entity type the application serves, each with the column it is stored in.
 *
 * It is the application's side of the column grant. The database grants every signed-in caller one column list for each entity table, and that list admits columns no editor writes from the application: `subtype`, `info`, `custom_data`, `answers` and `confirmed`. This map is the narrower list: a property that is not in the target type's entry is refused by name before any request is made, so nothing a caller hands the writer can reach those columns.
 *
 * A column whose name differs from its property is read from the shared property-to-column map. `image`, `name` and `color` are stored under their own names, which that map does not hold.
 */
const ENTITY_PROPERTY_COLUMNS = {
  candidate: {
    image: 'image',
    firstName: PROPERTY_MAP.firstName,
    lastName: PROPERTY_MAP.lastName
  },
  organization: {
    image: 'image',
    name: 'name',
    shortName: PROPERTY_MAP.shortName,
    color: 'color'
  }
} as const satisfies Record<ServedEntityType, Partial<Record<keyof EditableEntityProps, string>>>;

/**
 * The served entity types whose name and short name are localized columns, read with the entity as names by locale. A candidate's name is its first and last name, which are not localized. Whether an editor may write the names is the separate fact of {@link ENTITY_PROPERTY_COLUMNS}.
 */
const LOCALIZED_NAME_TYPES: ReadonlySet<ServedEntityType> = new Set(['organization']);

/**
 * How the database's refusal of a changed name begins. The text is raised by `public.enforce_entity_immutability` in `apps/supabase/supabase/schema/011-validation-functions.sql`, for every column it freezes on a confirmed entity, the short name and a candidate's first and last name included. What follows the prefix names the column, the row and both values.
 */
const NAME_REFUSAL_PREFIX = 'Entity name is immutable once confirmed: column ';

/**
 * The SQLSTATE of an exception a database function raises without naming a code, which is how the refusal of a changed name is raised.
 */
const RAISED_EXCEPTION_CODE = 'P0001';

/**
 * How the database's refusal of a write ends while the project's answers are locked. The text is raised by `public.upsert_answers` and `public.set_entity_nominations` in `apps/supabase/supabase/schema/503-entity-rpcs.sql`, each after its own name, for a caller who may not edit the project's entities while its `access.answersLocked` setting is on.
 */
const ANSWERS_LOCKED_REFUSAL = 'answers are locked in this project';

/**
 * The SQLSTATE of a refused privilege, which is how the refusal of a write while answers are locked is raised.
 */
const INSUFFICIENT_PRIVILEGE_CODE = '42501';

/**
 * The SQLSTATE of a foreign-key violation.
 */
const FOREIGN_KEY_VIOLATION_CODE = '23503';

/**
 * The foreign key that holds a nomination to the nomination it is listed under: `parent_nomination_id` of `public.nominations`, declared in `apps/supabase/supabase/schema/104-nominations.sql`. It takes no action on a delete, so the database refuses to remove a nomination that others are listed under, and names this key in the refusal. `public.set_entity_nominations` in `apps/supabase/supabase/schema/503-entity-rpcs.sql` meets it when it removes a nomination, and when it moves one to another constituency, which it does by removing it.
 */
const PARENT_NOMINATION_FOREIGN_KEY = 'nominations_parent_nomination_id_fkey';

/**
 * How the database's refusal of one more unconfirmed parent nomination begins. The text is raised by `public.enforce_nomination_confirmation` in `apps/supabase/supabase/schema/011-validation-functions.sql`, without naming a code, when a caller who already holds the most unconfirmed parent nominations a caller may creates another. What follows the prefix states the limit and the caller's count.
 */
const PENDING_CAP_REFUSAL_PREFIX = 'A caller may originate at most ';

/**
 * The SQLSTATE `public.set_entity_nominations` raises when the nominations a set was computed from are no longer those stored. It is also the SQLSTATE of any serialization failure, so the refusal is recognised together with its message.
 */
const CHANGED_REFUSAL_CODE = '40001';

/**
 * The whole text of that refusal, raised by `public.set_entity_nominations` in `apps/supabase/supabase/schema/503-entity-rpcs.sql`.
 */
const CHANGED_REFUSAL_MESSAGE = 'set_entity_nominations: the nominations have changed since they were read';

/**
 * Narrow an entity type to one the application serves.
 * @param type - Any entity type.
 * @returns The same type, known to be served.
 * @throws Error naming the type when the application does not serve it.
 */
function servedEntityType(type: EntityType): ServedEntityType {
  const served = SERVED_ENTITY_TYPES.find((candidate) => candidate === type);
  if (!served) throw new Error(`Unsupported entity type: ${type}`);
  return served;
}

/**
 * The table an entity of the given type is stored in.
 * @param type - Any entity type.
 * @returns The table's name, which is also the entity's folder segment in Storage.
 * @throws Error naming the type when the application does not serve it.
 */
function entityTableOf(type: EntityType): EntityTable {
  return ENTITY_TABLES[servedEntityType(type)];
}

/**
 * The column each given property of an entity is stored in.
 * @param type - The served type of the target entity.
 * @param properties - The properties of a write. A member that is `undefined` is not given.
 * @returns The given properties with their columns, in the order of the type's entry in {@link ENTITY_PROPERTY_COLUMNS}.
 * @throws Error naming the property and the entity type when a given property is not one the type's editor may write.
 */
function writableColumnsOf(
  type: ServedEntityType,
  properties: EditableEntityProps
): Map<keyof EditableEntityProps, string> {
  const writable: Partial<Record<keyof EditableEntityProps, string>> = ENTITY_PROPERTY_COLUMNS[type];
  const given = Object.entries(properties)
    .filter(([, value]) => value !== undefined)
    .map(([property]) => property);
  for (const property of given)
    if (!Object.hasOwn(writable, property))
      throw new Error(
        `updateEntityProperties: the property '${property}' cannot be written for an entity of type '${type}'`
      );
  const columns = new Map<keyof EditableEntityProps, string>();
  for (const [property, column] of Object.entries(writable))
    if (given.includes(property)) columns.set(property as keyof EditableEntityProps, column);
  return columns;
}

/**
 * The form a locale-keyed name is stored in.
 * @param property - The name of the property, for the error.
 * @param value - The name by locale, or `null`.
 * @returns The name with its entries trimmed and its blank entries left out, or `null` when no entry is left.
 * @throws Error naming the property when the value is neither `null` nor an object of entries.
 */
function storedNameOf(property: string, value: LocalizedString | null | undefined): LocalizedString | null {
  if (value != null && (typeof value !== 'object' || Array.isArray(value)))
    throw new Error(`updateEntityProperties: the property '${property}' must be an object of texts by locale, or null`);
  return normalizeLocalizedName(value);
}

/**
 * The form a person's name is stored in.
 * @param property - The name of the property, for the error.
 * @param value - The name.
 * @returns The name without surrounding whitespace.
 * @throws Error naming the property when the value is not text.
 */
function storedPersonNameOf(property: string, value: string | undefined): string {
  if (typeof value !== 'string') throw new Error(`updateEntityProperties: the property '${property}' must be text`);
  return value.trim();
}

/**
 * The form an entity's colour is stored in: the one colour as lowercase `#rrggbb` under `normal`, and nothing else.
 * @param value - The colour, or `null` to clear it.
 * @returns The colour to store, or `null`.
 * @throws Error naming the property when the value is neither `null` nor an object holding a hex colour under `normal` alone.
 */
function storedColorOf(value: EditableEntityColor | null | undefined): EditableEntityColor | null {
  if (value == null) return null;
  const normal: unknown = typeof value === 'object' ? value.normal : undefined;
  const hex = typeof normal === 'string' && STORED_HEX_COLOR.test(normal) ? toHexColor(normal) : undefined;
  if (!hex || Object.keys(value).length !== 1)
    throw new Error(
      "updateEntityProperties: the property 'color' must be null or hold a hex colour, '#' and three or six hexadecimal digits, under 'normal' alone"
    );
  return { normal: hex };
}

/**
 * Whether a failed write was refused because it changes a name of a confirmed entity. The refusal is recognised by its SQLSTATE together with the start of its message, since a function that raises without a code shares the SQLSTATE with every other such function.
 * @param error - The error the write answered with.
 * @returns `true` for that refusal and for no other failure.
 */
function isNameRefusal(error: { code?: string; message: string }): boolean {
  return error.code === RAISED_EXCEPTION_CODE && error.message.startsWith(NAME_REFUSAL_PREFIX);
}

/**
 * Whether a failed write was refused because the project's answers are locked. The refusal is recognised by its SQLSTATE together with the end of its message, since every refused privilege shares the SQLSTATE and the message begins with the name of the function that raised it.
 * @param error - The error the write answered with.
 * @returns `true` for that refusal and for no other failure.
 */
function isAnswersLockedRefusal(error: { code?: string; message: string }): boolean {
  return error.code === INSUFFICIENT_PRIVILEGE_CODE && error.message.endsWith(ANSWERS_LOCKED_REFUSAL);
}

/**
 * Whether a failed write of an entity's nominations was refused because a nomination it removes has other nominations listed under it. The refusal is recognised by its SQLSTATE together with the name of the foreign key, since every foreign key of the table shares the SQLSTATE.
 * @param error - The error the write answered with.
 * @returns `true` for that refusal and for no other failure.
 */
function isListedUnderRefusal(error: { code?: string; message: string }): boolean {
  return error.code === FOREIGN_KEY_VIOLATION_CODE && error.message.includes(PARENT_NOMINATION_FOREIGN_KEY);
}

/**
 * Whether a failed write of an entity's nominations was refused because the caller holds too many unconfirmed parent nominations. The refusal is recognised by its SQLSTATE together with the start of its message, as {@link isNameRefusal} recognises its own.
 * @param error - The error the write answered with.
 * @returns `true` for that refusal and for no other failure.
 */
function isPendingCapRefusal(error: { code?: string; message: string }): boolean {
  return error.code === RAISED_EXCEPTION_CODE && error.message.startsWith(PENDING_CAP_REFUSAL_PREFIX);
}

/**
 * Whether a failed write of an entity's nominations was refused because the nominations the set was computed from have changed since they were read.
 * @param error - The error the write answered with.
 * @returns `true` for that refusal and for no other failure.
 */
function isChangedRefusal(error: { code?: string; message: string }): boolean {
  return error.code === CHANGED_REFUSAL_CODE && error.message === CHANGED_REFUSAL_MESSAGE;
}

/**
 * What one nomination stands under, in the keys `public.set_entity_nominations` reads a parent in.
 * @param parent - The choice.
 * @returns The object to send. Only a parent that names an entity or a typed name carries more than its kind.
 */
function parentArgumentOf(parent: NominationParentChoice): Record<string, string> {
  if (parent.kind === 'entity')
    return { kind: parent.kind, entity_type: parent.entityType, entity_id: parent.entityId };
  if (parent.kind === 'other') return { kind: parent.kind, name: parent.name };
  return { kind: parent.kind };
}

/**
 * One nomination an entity is to have, in the keys `public.set_entity_nominations` reads an object of its set in.
 * @param nomination - The nomination.
 * @returns The object to send. It carries an `id` only for a nomination that has one, because the function refuses an `id` that is stated and is no id.
 */
function nominationArgumentOf(nomination: DesiredNomination): Record<string, string | Record<string, string>> {
  return {
    ...(nomination.id !== undefined && { id: nomination.id }),
    election_id: nomination.electionId,
    constituency_id: nomination.constituencyId,
    election_symbol: nomination.electionSymbol,
    parent: parentArgumentOf(nomination.parent)
  };
}

/**
 * The colours an entity is shown in, from its stored colour: parsed and adjusted for contrast, as the public data's are.
 * @param stored - The unvalidated value of the entity's colour.
 * @param source - The column and row the value came from, for the failure record.
 * @returns The colours, or nothing for an entity with no colour and for a stored value that is not a colour.
 */
function shownColorsOf(stored: Json, source: ParseSource): Colors | undefined {
  const storedColor = colorOf(parseColorColumn(stored, source));
  const color = storedColor ? ensureColors(storedColor) : undefined;
  return color?.normal ? color : undefined;
}

/**
 * One entity a nomination may be placed under, as the entity data a `DataRoot` is given, from the row the options read states it in.
 * @param row - The narrowed row.
 * @param locale - The locale the entity's names are translated to.
 * @param defaultLocale - The locale a name is read in when it has no entry for `locale`.
 * @returns The option. A name no locale holds is empty, and a short name, a colour and an image that are not stored are left out.
 */
function nominationParentOptionOf(
  row: NominationParentOptionRow,
  locale: string,
  defaultLocale: string
): NominationParentOption {
  const names = localizeRow(row, ['name', 'short_name'], locale, defaultLocale);
  const image = imageOf(
    parseImageColumn(row.image, constants.PUBLIC_SUPABASE_URL, {
      column: 'get_nomination_parent_options.image',
      id: row.id
    })
  );
  const color = shownColorsOf(row.color, { column: 'get_nomination_parent_options.color', id: row.id });
  return {
    entity: {
      type: row.entity_type,
      id: row.id,
      name: typeof names.name === 'string' ? names.name : '',
      ...(typeof names.short_name === 'string' && { shortName: names.short_name }),
      ...(image && { image }),
      ...(color && { color })
    },
    nominatedIn: row.nominated.map((contest) => ({
      electionId: contest.election_id,
      constituencyId: contest.constituency_id
    }))
  };
}

/**
 * One nomination of an entity in the form its editor is shown it, from the row the nominations read states it in.
 * @param row - The narrowed row.
 * @param locale - The locale the election's, the constituency's and the parent's names are translated to.
 * @param defaultLocale - The locale a name is read in when it has no entry for `locale`.
 * @returns The nomination. A name no locale holds is empty, a round that is not stored is 1, a symbol that is not stored is empty, and custom data that is not an object is `null`.
 */
function entityNominationOf(row: EntityNominationRow, locale: string, defaultLocale: string): EntityNomination {
  const names = localizeRow(row, ['election_name', 'constituency_name'], locale, defaultLocale);
  const parentNames = row.parent ? localizeRow(row.parent, ['name', 'short_name'], locale, defaultLocale) : undefined;
  const customData = row.custom_data;
  return {
    id: row.id,
    electionId: row.election_id,
    electionName: typeof names.election_name === 'string' ? names.election_name : '',
    constituencyId: row.constituency_id,
    constituencyName: typeof names.constituency_name === 'string' ? names.constituency_name : '',
    electionRound: row.election_round ?? 1,
    electionSymbol: row.election_symbol ?? '',
    confirmed: row.confirmed,
    customData: typeof customData === 'object' && customData !== null && !Array.isArray(customData) ? customData : null,
    updatedAt: row.updated_at,
    ...(row.parent &&
      parentNames && {
        parent: {
          entityType: row.parent.entity_type,
          entityId: row.parent.entity_id,
          name: typeof parentNames.name === 'string' ? parentNames.name : '',
          ...(typeof parentNames.short_name === 'string' && { shortName: parentNames.short_name })
        }
      })
  };
}

/**
 * Supabase implementation of the DataWriter.
 * Auth methods use Supabase GoTrue via `this.supabase.auth`.
 * Cookie-based sessions are used -- the Supabase client attaches the session JWT automatically.
 */
export class SupabaseDataWriter extends supabaseAdapterMixin(UniversalDataWriter) {
  /**
   * @param config - This request's own client, its `fetch` and the locales it extracts JSONB in.
   *
   * Declared explicitly rather than inherited: the mixin's construct signature erases its parameter types, so without this signature an adapter built from any argument at all would typecheck.
   */
  constructor(config: SupabaseAdapterConfig) {
    super(config);
  }

  ////////////////////////////////////////////////////////////////////
  // AUTH METHODS
  ////////////////////////////////////////////////////////////////////

  protected async _login({ username, password }: { username: string; password: string }) {
    const { error } = await this.supabase.auth.signInWithPassword({
      email: username,
      password
    });
    if (error) throw new Error(error.message);
    return { type: 'success' as const };
  }

  protected async _logout() {
    // In the browser, call the server-side logout endpoint to clear httpOnly cookies.
    // Client-side signOut alone cannot remove httpOnly cookies set by createServerClient.
    if (typeof window !== 'undefined') {
      // reason: the endpoint is named by route key, never assembled from the current URL. Reading the locale off `window.location.pathname` returns 'contestant' for an unprefixed candidate route and yields a doubled path; a constant cannot go wrong that way. The endpoint clears cookies and returns json, so it carries no locale prefix.
      const response = await fetch(ROUTE.AuthLogout, { method: 'POST' });
      // The cookies may still hold the session, so the browser's own session is kept as well: the user stays signed in on both sides rather than on one.
      if (!response.ok) throw new Error(`The logout endpoint answered ${response.status}.`);
    }
    const { error } = await this.supabase.auth.signOut({ scope: 'local' });
    if (error) throw new Error(error.message);
    return { type: 'success' as const };
  }

  /**
   * Override the public `logout` to skip UniversalDataWriter's dual POST+backendLogout pattern.
   * Supabase handles everything via `signOut` -- no separate client-side POST is needed.
   */
  async logout(): DWReturnType<DataApiActionResult> {
    return this._logout();
  }

  protected async _setPassword({ password }: { password: string }) {
    const { error } = await this.supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
    // `auth.updateUser({ password })` leaves the session's access token as it is: the auth service answers with the user and issues no new token, and a read made with the same token straight afterwards sees the account's password as set.
    // No `refreshSession()` follows for that reason. It would cost a network round-trip on every password set, and an expired refresh token would turn a working password set into a thrown error.
    return { type: 'success' as const };
  }

  protected async _acceptTermsOfUse() {
    // The payload states nothing: the scoped helper supplies the project, and the database supplies who accepts and when. No row is read back, because an acceptance that already exists returns none.
    const { error } = await this.scopedFrom('terms_of_use_acceptances').upsert({});
    if (error) throw new Error(`acceptTermsOfUse: ${error.message}`);
    return { type: 'success' as const };
  }

  ////////////////////////////////////////////////////////////////////
  // INVITATION METHODS
  ////////////////////////////////////////////////////////////////////

  /**
   * Call one operation of the `account-access` Edge Function for this adapter's project.
   *
   * The one site that invokes the function, so every operation names its project the same way. `operation` and `project_id` are written after the operation's own fields, so no field can replace either.
   * @param operation - The operation to call.
   * @param fields - The operation's own fields.
   * @returns The function's answer, not yet validated.
   * @throws Error naming the operation when the function cannot be reached or answers with an error status.
   */
  async #accountAccess(
    operation: 'check-code' | 'request-link' | 'code-sign-in' | 'request-recovery' | 'confirm-address',
    fields: Record<string, string>
  ): Promise<unknown> {
    const { data, error } = await this.supabase.functions.invoke('account-access', {
      body: { ...fields, operation, project_id: this.projectId }
    });
    if (error) throw new Error(`account-access ${operation}: ${error.message}`);
    return data;
  }

  protected async _checkInvitationCode({ code }: { code: string }): DWReturnType<InvitationCodeStatus> {
    return parseInvitationCodeStatus(await this.#accountAccess('check-code', { code }));
  }

  protected async _requestSignInLink({ email, code, locale }: RequestSignInLinkOptions) {
    // An absent member is left out of the body rather than sent as `undefined`, so the body states exactly what the caller gave.
    const fields: Record<string, string> = { locale };
    if (email !== undefined) fields.email = email;
    if (code !== undefined) fields.code = code;
    parseSignInLinkRequest(await this.#accountAccess('request-link', fields));
    return { type: 'success' as const };
  }

  protected async _requestPasswordRecovery({ email, locale }: RequestPasswordRecoveryOptions) {
    parsePasswordRecoveryRequest(await this.#accountAccess('request-recovery', { email, locale }));
    return { type: 'success' as const };
  }

  protected async _requestAddressConfirmation({
    email,
    locale
  }: RequestAddressConfirmationOptions): Promise<AddressConfirmationResult> {
    // The operation reads the caller from the access token this client sends, so it asks only about the signed-in user's own account. A refused session, an outage and a body of any other shape all mean nothing was mailed, so each is `refused`; the log names the failure and never the address.
    try {
      return parseAddressConfirmationAnswer(await this.#accountAccess('confirm-address', { email, locale }));
    } catch (e) {
      log.error(`requestAddressConfirmation: ${e instanceof Error ? e.message : 'No error message'}`);
      return 'refused';
    }
  }

  protected async _signInWithInvitationCode({ code, password }: { code: string; password: string }) {
    const answer = parseCodeSignIn(await this.#accountAccess('code-sign-in', { code, password }));
    if (answer.result !== 'signed-in') return { type: 'failure' as const };
    // The two tokens are a session's credentials. They go to this adapter's own auth client, which stores the session where the client keeps it, and to nothing else: no field holds them, no log line names them and the result carries neither.
    const { error } = await this.supabase.auth.setSession({
      access_token: answer.access_token,
      refresh_token: answer.refresh_token
    });
    if (error) throw new Error(`signInWithInvitationCode: ${error.message}`);
    return { type: 'success' as const };
  }

  protected async _claimInvitations(): DWReturnType<InvitationClaimResult> {
    // The project is the call's only argument. The database reads the user and their confirmed address from the session, so nothing sent from here can point the claim at someone else's invitation.
    const { data, error } = await this.supabase.rpc('claim_invitations', { p_project_id: this.projectId });
    if (error) throw new Error(`claimInvitations: ${error.message}`);
    return parseInvitationClaim(data);
  }

  ////////////////////////////////////////////////////////////////////
  // USER DATA METHODS
  ////////////////////////////////////////////////////////////////////

  protected async _getBasicUserData(): DWReturnType<BasicUserData> {
    // THE VERIFYING ROUND-TRIP, AND IT COMES FIRST. `getSession()` alone reads the session straight out of the configured storage — the request's `sb-*` cookies — and checks only its SELF-REPORTED `expires_at`; `@supabase/auth-js` wraps the `user` it returns in an insecure-use proxy for exactly that reason. Nothing on that path checks a signature, so the authority claim decoded below is attacker-suppliable unless the token it is decoded from has been verified first. `getUser()` is that check: it sends the stored access token to Supabase Auth, which validates it, so a session that survives this call is one whose access token is genuine.
    //
    // The ORDER — verify, then read — is the same one `hooks.server.ts`'s `safeGetSession` uses, and it is what lets `requireVerifiedAdmin` gate the `/api/admin/jobs/**` endpoints on a role rather than on a claim. `user` is taken from HERE rather than from `session.user` so the returned identity is the verified one and never the proxy.
    const {
      data: { user },
      error: userError
    } = await this.supabase.auth.getUser();
    if (userError || !user) throw new Error('No active session');

    const {
      data: { session },
      error
    } = await this.supabase.auth.getSession();
    if (error || !session) throw new Error('No active session');

    // Read the VERIFIED access token's grant claim through the shared reader rather than decoding it here: `readGrants` is the single place a token's authority claim is parsed, and it fails closed on every malformed shape.
    const grants = readGrants(session.access_token);

    // Determine the coarse role from the grant shapes, against the one declaration of each entry-point set that the two login gates also read, so a shape added to a set reaches every reader.
    //
    // The admin arm is tested first, so an admin grant is never masked: an identity holding both an admin grant and an entity editor grant is an administrator who also maintains an entity, and the Admin App admits the `'admin'` role alone. The Contestant App decides what a user may edit from the list of their entities, not from this role.
    let role: UserRole | null = null;
    if (hasAnyGrant(grants, ADMIN_GRANTS)) {
      role = 'admin';
    } else if (hasAnyGrant(grants, CONTESTANT_GRANTS)) {
      role = 'contestant';
    }

    // Language from user_metadata or default
    const language = (user.user_metadata?.language as string) ?? 'en';

    // At most one row comes back: row-level security returns only the caller's own rows, the scoped helper adds this adapter's project, and the user and project pair is the table's primary key.
    const { data: acceptance, error: acceptanceError } = await this.scopedFrom('terms_of_use_acceptances')
      .select('accepted_at')
      .maybeSingle();
    // A failed read is thrown and never turned into a value: it is neither "accepted" nor "not accepted". Read as not accepted, it would show the gate again after every acceptance for as long as the read keeps failing.
    if (acceptanceError)
      throw new Error(`getBasicUserData: could not read the terms-of-use acceptance: ${acceptanceError.message}`);
    const termsOfUseAccepted = acceptance?.accepted_at ?? null;

    // Whether the account has a password, which the database answers for the caller alone. Like the acceptance read above, a failed or malformed read is thrown and never turned into a value: it is neither "has a password" nor "has none", and whoever decides on the member must not be handed a guess.
    const { data: listed, error: passwordError } = await this.supabase.rpc('get_user_entities', {
      p_project_id: this.projectId
    });
    if (passwordError) throw new Error(`getBasicUserData: could not read the password fact: ${passwordError.message}`);
    const passwordSet = parseCallerPasswordSet(listed);
    // The same answer says, for the caller alone, whether the address the account is changing to is now another account's. Malformed, it is thrown like the password fact.
    const pendingTaken = parseCallerPendingEmailTaken(listed);

    // The address state, from the verified user alone: the provider its app metadata names, its address and its pending address. A pending address another account now holds can no longer be proved, so it reads as no address, and the holder is asked for one again.
    const stated = addressStateOf({
      email: user.email,
      newEmail: user.new_email,
      identityProvider: user.app_metadata?.identity_provider
    });
    const pendingEmailTaken = stated === 'pending' && pendingTaken;
    const addressState = pendingEmailTaken ? 'none' : stated;
    // A placeholder address is an identifier derived from the provider's persistent id, so it is never handed on as the account's address.
    const email = isPlaceholderAddress(user.email) ? '' : (user.email ?? '');

    return {
      id: user.id,
      email,
      username: email,
      role,
      termsOfUseAccepted,
      passwordSet,
      addressState,
      pendingEmail: addressState === 'pending' ? (user.new_email ?? null) : null,
      ownOrganizationUnnamed: this.#ownOrganizationUnnamed(user.app_metadata, listed),
      pendingEmailTaken,
      settings: { language }
    };
  }

  /**
   * Whether the organization the identity registered in this project is among the listed entities and has no name with text in the default locale.
   *
   * The list is narrowed only when the account's record names an organization of this project, so an account with no record is never failed by it; when it is narrowed, a malformed list throws like any failed read. An organization the user edits by any other grant is not named by the record and is never asked about.
   * @param appMetadata - The verified user's `app_metadata`.
   * @param listed - The answer of `get_user_entities`.
   * @returns `true` when the own organization is listed and unnamed in the default locale.
   * @throws Error when the record names an organization and the list does not have the expected shape.
   */
  #ownOrganizationUnnamed(appMetadata: unknown, listed: Json | undefined): boolean {
    const ownId = ownOrganizationId(appMetadata, this.projectId);
    if (ownId === null) return false;
    const own = parseUserEntities(listed).find((entry) => entry.entity_type === 'organization' && entry.id === ownId);
    return own?.entity_type === 'organization' && !hasDefaultLocaleName(own.name, this.defaultLocale);
  }

  protected async _getUserEntities({ locale }: GetUserEntitiesOptions): DWReturnType<Array<UserEntity>> {
    const { data: listed, error } = await this.supabase.rpc('get_user_entities', {
      p_project_id: this.projectId
    });
    if (error) throw new Error(`Failed to list the user's entities: ${error.message}`);

    const effectiveLocale = locale ?? this.defaultLocale;
    // A malformed answer throws inside the narrowing, so it is a failed read and never an empty list.
    return parseUserEntities(listed).map((entry) => {
      const localized = localizeRow(entry, ['name', 'short_name'], effectiveLocale, this.defaultLocale);
      const table = ENTITY_TABLES[entry.entity_type];
      // The listed colour is painted by the entity list, so it is handed on as the public data's colours are: parsed, adjusted for contrast, and left out when it is not a colour.
      const color = shownColorsOf(entry.color, { column: `${table}.color`, id: entry.id });
      const shared = {
        id: entry.id,
        shortName: typeof localized.short_name === 'string' ? localized.short_name : undefined,
        image: imageOf(
          parseImageColumn(entry.image, constants.PUBLIC_SUPABASE_URL, { column: `${table}.image`, id: entry.id })
        ),
        color,
        confirmed: entry.confirmed
      };
      return entry.entity_type === 'candidate'
        ? { ...shared, type: entry.entity_type, firstName: entry.first_name, lastName: entry.last_name }
        : {
            ...shared,
            type: entry.entity_type,
            name: typeof localized.name === 'string' ? localized.name : ''
          };
    });
  }

  protected async _getEntityUserData<TNominations extends boolean | undefined>({
    type,
    id,
    loadNominations,
    locale
  }: GetEntityUserDataOptions<TNominations>): DWReturnType<ContestantUserData<TNominations> | undefined> {
    const served = servedEntityType(type);
    const table = ENTITY_TABLES[served];

    // The read answers with no row, and no error, for an entity that is not the caller's. That is a different fact from a failed read, so it resolves with no value rather than rejecting.
    const { data: entityRow, error } = await this.supabase
      .rpc('get_entity_user_data', {
        p_project_id: this.projectId,
        p_entity_type: type,
        p_entity_id: id
      })
      .maybeSingle();
    if (error) throw new Error(`Failed to load entity data: ${error.message}`);
    if (!entityRow) return undefined;

    // The RPC takes this adapter's project as a required `p_project_id` and answers only for entities the caller holds an editor grant on in it. The returned row's own `project_id` is still compared here, as defence in depth: a mismatch stops the read rather than rendering another project's entity.
    //
    // Neither uuid is interpolated. The message names the condition, which is what an operator needs to act on; the pair of ids is exactly what a deployment in this state should not be putting into logs and error reporters.
    if (entityRow.project_id !== this.projectId)
      throw new Error(
        'getEntityUserData: the authenticated entity belongs to a different project than this deployment is configured for. Check PUBLIC_PROJECT_ID against the account this session was issued for.'
      );

    const effectiveLocale = locale ?? this.defaultLocale;
    const mapped = toDataObject(entityRow as Record<string, unknown>, effectiveLocale, this.defaultLocale);

    const entity = {
      ...mapped,
      type,
      id: entityRow.id,
      // The entity's editor reading their OWN stored answers collapses malformed to empty here, deliberately, unlike the post-RPC read-back below: branching on `.status` here would be a UI decision. The collapse loses little, because partial preserve keeps the valid question ids and drops only the offending ones, and `parseAnswersColumn` reports the degradation at `error`.
      answers: answersOf(parseAnswersColumn(entityRow.answers, { column: `${table}.answers`, id: entityRow.id })) ?? {},
      // Parsed as the read-back after a write parses it, so the store compares and stages only a validated colour.
      color: colorOf(parseColorColumn(entityRow.color, { column: `${table}.color`, id: entityRow.id })),
      image: imageOf(
        parseImageColumn(entityRow.image, constants.PUBLIC_SUPABASE_URL, {
          column: `${table}.image`,
          id: entityRow.id
        })
      )
    } as LocalizedEntityData;

    // The names by locale, read from the same row for an entity type whose name is a localized column. The mapping above has already reduced each to one locale's text.
    const localizedNames: LocalizedEntityNames | undefined = LOCALIZED_NAME_TYPES.has(served)
      ? {
          name: localizedStringOf(
            parseLocalizedStringColumn(entityRow.name, { column: `${table}.name`, id: entityRow.id })
          ),
          shortName: localizedStringOf(
            parseLocalizedStringColumn(entityRow.short_name, { column: `${table}.short_name`, id: entityRow.id })
          )
        }
      : undefined;

    let nominations: Array<EntityNomination> | undefined;
    if (loadNominations) {
      // The one read of an entity's nominations. It takes this adapter's project, and answers for an entity the caller edits in it and for no other.
      const { data: listed, error: nominationsError } = await this.supabase.rpc('get_entity_nominations', {
        p_project_id: this.projectId,
        p_entity_type: served,
        p_entity_id: entityRow.id
      });
      if (nominationsError) throw new Error(`Failed to load nominations: ${nominationsError.message}`);

      // A malformed answer throws inside the narrowing, so it is a failed read and never an empty list.
      const rows = parseEntityNominations(listed);
      // A refused nominations read and a missing entity row are one outcome: the backend holds no such entity for this user. An empty list would say instead that the user's own entity has no nomination.
      if (rows === null) return undefined;
      nominations = rows.map((row) => entityNominationOf(row, effectiveLocale, this.defaultLocale));
    }

    return { entity, ...(localizedNames && { localizedNames }), nominations } as ContestantUserData<TNominations>;
  }

  ////////////////////////////////////////////////////////////////////
  // ANSWER/PROPERTY METHODS
  ////////////////////////////////////////////////////////////////////

  /**
   * Upload one file supplied by an entity's editor to the `public-assets` bucket and return the object path it was stored at.
   *
   * ONE helper for BOTH upload sites, `_setAnswers` and `_updateEntityProperties`, so the path sanitizing cannot drift between them. The extension is chosen from {@link ALLOWED_IMAGE_EXTENSIONS} rather than taken from the upload, so the returned path is always `<project>/<table>/<id>/<uuid>.<known-ext>` no matter what the uploader named their file.
   * @param options.projectId - The project the object is written under, which is this adapter's configured project.
   * @param options.table - The entity's table, which is its folder segment.
   * @param options.id - The entity's id.
   * @param options.file - The uploaded file. Its `name` is attacker-controlled and is used only to CHOOSE from the whitelist.
   * @returns The Storage object path, safe to persist in an image column.
   */
  async #uploadEntityFile({
    projectId,
    table,
    id,
    file
  }: {
    projectId: string;
    table: EntityTable;
    id: string;
    file: File;
  }): Promise<string> {
    const suffix = file.name.split('.').pop()?.toLowerCase() ?? '';
    const ext = ALLOWED_IMAGE_EXTENSIONS.has(suffix) ? suffix : 'jpg';
    const storagePath = `${projectId}/${table}/${id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await this.supabase.storage
      .from('public-assets')
      .upload(storagePath, file, { cacheControl: '3600', upsert: true });
    if (error) throw new Error(`Image upload failed: ${error.message}`);
    return storagePath;
  }

  protected async _setAnswers({
    target: { type, id },
    answers,
    overwrite
  }: SetAnswersOptions & { overwrite: boolean }): DWReturnType<SetAnswersResult> {
    const table = entityTableOf(type);

    // Process answers: detect File objects and upload to Storage
    const processedAnswers: Record<string, unknown> = {};

    for (const [questionId, answer] of Object.entries(answers)) {
      if (answer === null) {
        processedAnswers[questionId] = null;
        continue;
      }
      // Check if answer value contains a File object (SSR-safe guard)
      if (answer?.value != null && typeof File !== 'undefined' && answer.value instanceof File) {
        const storagePath = await this.#uploadEntityFile({
          projectId: this.projectId,
          table,
          id,
          file: answer.value as File
        });
        // Replace File with StoredImage-compatible path object
        processedAnswers[questionId] = { ...answer, value: { path: storagePath } };
      } else {
        processedAnswers[questionId] = answer;
      }
    }

    // The RPC writes only the table the entity type names.
    const { data, error } = await this.supabase.rpc('upsert_answers', {
      p_entity_type: type,
      p_entity_id: id,
      // reason: processedAnswers is jsonb-safe at runtime (File values already replaced with { path } in the loop above); LocalizedAnswer.value's static AnswerValue/File union can't be expressed as Json without a runtime transform.
      p_answers: processedAnswers as Json,
      p_overwrite: overwrite
    });
    if (error) {
      // The lock's refusal is an error of its own, which a page shows as the lock. Its raised text names the function and is not passed on.
      if (isAnswersLockedRefusal(error)) throw new AnswersLockedError();
      throw new Error(`setAnswers: ${error.message}`);
    }
    // The RPC hands back the whole answers blob it just wrote, which is the same unvalidated jsonb shape a read returns, so it is validated on the way back in rather than asserted.
    //
    // A status BRANCH, not a collapse. Coalescing the outcome's value to an empty object would turn a malformed read-back into an empty answers map — TRUTHY, and therefore indistinguishable from an entity that legitimately has no answers. That map would pass the store's nullish guard and be merged, and the candidate's edit buffer would be cleared on the strength of a state that was never verified.
    //
    // `absent` joins `malformed` deliberately. From the caller's point of view they are the same fact — the adapter cannot confirm what was stored — and only `ok` licenses a caller to treat the write as verified. `answersOf` is NOT used here for that reason: this site acts on `.status` rather than collapsing it.
    //
    // The `error` record naming the column, the row id and the issue paths is emitted inside `parseAnswersColumn`, so nothing is logged here; a second record would double-report one failure.
    const readBack = parseAnswersColumn(data, { column: 'upsert_answers.result', id });
    if (readBack.status === 'ok') return readBack.value;
    return UNVERIFIED_ANSWERS;
  }

  protected async _updateEntityProperties({
    target: { type, id },
    properties,
    locale
  }: SetPropertiesOptions): DWReturnType<UpdateEntityPropertiesResult> {
    const served = servedEntityType(type);
    const table = ENTITY_TABLES[served];
    // Every given property is checked against the target type's list, and every value is brought to its stored form, before anything is sent: a refused call uploads nothing.
    const columns = writableColumnsOf(served, properties);
    const updateFields: Record<string, unknown> = {};
    for (const [property, column] of columns) {
      switch (property) {
        case 'name':
        case 'shortName':
          updateFields[column] = storedNameOf(property, properties[property]);
          break;
        case 'color':
          updateFields[column] = storedColorOf(properties.color);
          break;
        case 'firstName':
        case 'lastName':
          updateFields[column] = storedPersonNameOf(property, properties[property]);
          break;
      }
    }

    // `null` clears the image column, and the database then deletes the stored file the row no longer names. Any other image is a new file: it is uploaded to Storage through the same helper `_setAnswers` uses, and the column stores the path. A stored image is never written back here. An image whose file is not a `File` is refused before anything is uploaded or written.
    const { image } = properties;
    const imageColumn = columns.get('image');
    if (image === null && imageColumn) {
      updateFields[imageColumn] = null;
    } else if (image && imageColumn) {
      const file = typeof File !== 'undefined' && image.file instanceof File ? image.file : undefined;
      if (!file) throw new Error('updateEntityProperties: the image carries no file');
      updateFields[imageColumn] = {
        path: await this.#uploadEntityFile({ projectId: this.projectId, table, id, file })
      };
    }

    // One statement writes every column given, and the same columns are read back: the caller merges the result into the entity it holds, so the result must be what is stored and never a fabricated value.
    const readBack = [...columns.values()].join(', ');
    const { data, error } = await this.scopedFrom(table)
      .update(updateFields)
      .eq('id', id)
      .select(readBack)
      .single<Partial<Record<string, Json>>>();
    if (error) {
      // The refusal is a result the caller shows in its own words. The raised text names the row and both values, and is not returned.
      if (isNameRefusal(error)) return { type: 'nameRefused' };
      throw new Error(`updateEntityProperties: ${error.message}`);
    }

    const effectiveLocale = locale ?? this.defaultLocale;
    const saved: SavedEntityProps = {};
    const localizedNames: Partial<LocalizedEntityNames> = {};
    for (const [property, column] of columns) {
      const stored = data[column];
      const source = { column: `${table}.${column}`, id };
      switch (property) {
        case 'image':
          saved.image = imageOf(parseImageColumn(stored, constants.PUBLIC_SUPABASE_URL, source)) ?? null;
          break;
        case 'name':
          localizedNames.name = localizedStringOf(parseLocalizedStringColumn(stored, source));
          saved.name = getLocalized(localizedNames.name, effectiveLocale, this.defaultLocale) ?? '';
          break;
        case 'shortName':
          localizedNames.shortName = localizedStringOf(parseLocalizedStringColumn(stored, source));
          saved.shortName = getLocalized(localizedNames.shortName, effectiveLocale, this.defaultLocale);
          break;
        case 'color':
          saved.color = colorOf(parseColorColumn(stored, source));
          break;
        case 'firstName':
        case 'lastName':
          saved[property] = typeof stored === 'string' ? stored : '';
          break;
      }
    }
    return { type: 'saved', properties: saved, localizedNames };
  }

  protected async _setEntityNominations({
    target: { type, id },
    nominations,
    readFrom
  }: SetEntityNominationsOptions): DWReturnType<SetEntityNominationsResult> {
    const served = servedEntityType(type);
    // The one statement of the write. The function applies the whole set in one transaction under the caller's own row-level security, so nothing is written to the nominations table from here. It compares the stored nominations with the ones the set was computed from before it writes anything.
    const { data, error } = await this.supabase.rpc('set_entity_nominations', {
      p_entity_type: served,
      p_entity_id: id,
      p_nominations: nominations.map(nominationArgumentOf),
      p_expected_reach: Object.fromEntries(readFrom.map((nomination) => [nomination.id, nomination.updatedAt]))
    });
    if (error) {
      // Each of the four refusals is a result the caller shows in its own words. The raised text names a function, a table and a constraint, or a limit and the caller's count, and is not returned.
      if (isAnswersLockedRefusal(error)) return { type: 'refused', reason: 'answersLocked' };
      if (isChangedRefusal(error)) return { type: 'refused', reason: 'changed' };
      if (isListedUnderRefusal(error)) return { type: 'refused', reason: 'hasCandidates' };
      if (isPendingCapRefusal(error)) return { type: 'refused', reason: 'tooManyPending' };
      throw new Error(`setEntityNominations: ${error.message}`);
    }
    // An answer that cannot be read throws inside the narrowing: the counts are never made up.
    const counts = parseSetEntityNominationsAnswer(data);
    return {
      type: 'saved',
      inserted: counts.inserted,
      updated: counts.updated,
      deleted: counts.deleted,
      unchanged: counts.unchanged,
      parentsCreated: counts.parents_created
    };
  }

  protected async _getNominationParentOptions({
    target: { type, id },
    contests,
    locale
  }: GetNominationParentOptionsOptions): DWReturnType<Array<NominationParentOption> | undefined> {
    const served = servedEntityType(type);
    // The one read of the options. It takes this adapter's project, and answers for an entity the caller edits in it and for no other.
    const { data, error } = await this.supabase.rpc('get_nomination_parent_options', {
      p_project_id: this.projectId,
      p_entity_type: served,
      p_entity_id: id,
      p_contests: contests.map(({ electionId, constituencyId }) => ({
        election_id: electionId,
        constituency_id: constituencyId
      }))
    });
    if (error) throw new Error(`getNominationParentOptions: ${error.message}`);

    // A malformed answer throws inside the narrowing, so it is a failed read and never an empty list.
    const rows = parseNominationParentOptions(data);
    // A refused read is not an empty list: an empty list says that the project lists nothing the entity may be nominated under.
    if (rows === null) return undefined;
    return rows.map((row) => nominationParentOptionOf(row, locale, this.defaultLocale));
  }
}
