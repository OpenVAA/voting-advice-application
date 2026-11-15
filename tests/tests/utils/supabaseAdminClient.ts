/**
 * Supabase Admin Client for E2E test data management.
 *
 * Subclasses the bulk-write base from `@openvaa/dev-seed`. The base owns the bulk-write surface (bulkImport, bulkDelete, importAnswers, linkJoinTables, updateAppSettings). This subclass adds the auth/email + legacy E2E query helpers that tests/ needs but dev-seed does not — keeping the dev-seed surface narrow.
 *
 * `updateAppSettings` (inherited) usage policy:
 *   Baseline test-setup usage of `updateAppSettings` has migrated to the `@openvaa/dev-seed` e2e template's `app_settings.fixed[]` block.
 *
 *   `updateAppSettings` is RETAINED for per-test scenario mutations: specs may call it inside `beforeAll` / `afterAll` to test behavior-under-different-settings (e.g. perm-startfromcg.spec.ts resolves + writes startFromConstituencyGroup at runtime).
 *
 *   Do NOT use `updateAppSettings` from a `*.setup.ts` file for baseline settings — extend the appropriate template instead.
 *
 * Project default: this subclass defaults its project to the E2E project (`resolveE2eProjectId()`), while `DevSeedAdminClient` keeps defaulting to the default project. That single difference is what re-points every argument-less `new SupabaseAdminClient()` inside `tests/` at the suite's own project while leaving `yarn db:seed` and `yarn db:reset-with-data` filling the default one.
 *
 * Inherited from `DevSeedAdminClient`:
 *   - `protected client: SupabaseClient`
 *   - `protected projectId: string`
 *   - `public bulkImport(data)`
 *   - `public bulkDelete(collections)`
 *   - `public importAnswers(data)`
 *   - `public linkJoinTables(data)`
 *   - `public ensureProject(projectId?)` — idempotent project + `app_settings` bootstrap
 *   - `public updateAppSettings(partialSettings)` — see usage-policy note above
 *
 * Added by this subclass:
 *   - Auth helpers: `listAllUsers` and `findAuthUser` (private), `insertTermsOfUseAcceptance` (protected)
 *   - E2E query helpers: `findData`, `query`, `update`, `getAppSettings`, `countRowsByPrefix`
 *   - Identity lookups through candidate-editor grants: `candidateIdsForUser`, `userIdForCandidate`
 *   - Entity grants: `grantEntity`, `revokeEntityGrant`, `entityGrantCountForUser`
 *   - Auth actions: `setPassword`, `acceptTermsOfUse`, `forceRegister`, `forceRegisterUser`, `forceRegisterAdmin`, `unregisterCandidate`, `deleteAllTestUsers`
 *   - Invitations: `inviteByEmail` (seed one and ask the `account-access` function for a link), `invitationNomination` (a nomination an invitation states, resolved from external ids), `removeInvitations`, `releaseLinkSlot`, and the completion witness of a link request, `openLinkWitness` and `awaitLinkWitness`. Seeding itself is the inherited `createInvitations`
 *   - Reads of the auth users by prefix or address: `hasAuthUser`, `grantRowsForUser`, `countUsersByEmailPrefix`, `removeUsersByEmailPrefix`. Every read of the auth users in this file, these and the lookups behind the auth actions, pages through all of them and fails when the listing fails
 *
 * Existing call sites `new SupabaseAdminClient()` or `new SupabaseAdminClient(url, key, projectId)` keep the same signature — the constructor below only substitutes a different project default.
 *
 * @example
 * ```ts
 * const client = new SupabaseAdminClient();
 * await client.bulkImport({ elections: [...], candidates: [...] });   // inherited
 * await client.importAnswers({ candidates: [{ answersByExternalId: {...} }] });
 * await client.linkJoinTables({ elections: [...], constituency_groups: [...] });
 * await client.bulkDelete({ elections: { prefix: 'test-' } });
 * await client.forceRegister('cand-1', 'cand-1@example.com', 'pw');    // subclass
 * ```
 */

import {
  ALLOWED_TEARDOWN_TABLES,
  E2E_PROJECT_ID,
  resolveE2eProjectId,
  SupabaseAdminClient as DevSeedAdminClient,
  TEST_PROJECT_ID
} from '@openvaa/dev-seed';
import { PROPERTY_MAP, TABLE_MAP } from '@openvaa/supabase-types';
import { requestLink } from './accountAccessClient';
import { TIMEOUTS } from '../helpers/timeouts';
import type { FindDataResult, InvitationNominationSeed, SeededInvitation } from '@openvaa/dev-seed';
// Direct import, the same shape `buildRoute.ts` uses. Type-only: the constant is consumed as `typeof ADMIN_GRANTS` below, which is a compile-time read of the application's own declaration and needs no runtime binding.
import type { ADMIN_GRANTS } from '../../../apps/frontend/src/lib/auth/roles';
import type { GrantSpec } from './authApi';

// Re-exports for backward-compat with existing E2E imports.
// `tests/seed-test-data.ts` + all tests/tests/**/*.spec.ts files may import
// these from `./utils/supabaseAdminClient` — preserving the path + names.
export { TEST_PROJECT_ID };
// Re-exported beside `TEST_PROJECT_ID` so specs and setups can name the suite's own project without reaching into the dev-seed package for it.
export { E2E_PROJECT_ID, resolveE2eProjectId };
export type { FindDataResult };

/**
 * The admin grant shape `forceRegisterAdmin` mints.
 *
 * The annotation is the point: the type is `ADMIN_GRANTS`'s own element type, so this is a COMPILE-TIME membership check against the application's declaration rather than a pair chosen here. A shape removed from `ADMIN_GRANTS` reddens this line under `yarn typecheck:tests` instead of silently minting an identity the app's gates no longer accept.
 *
 * The project scope is the NARROWEST of the three — a project grant reaches its own project and nothing else, whereas an account grant reaches every project under an account and a global one reaches everything. A test identity should be no wider than the test needs.
 */
const TEST_ADMIN_GRANT: (typeof ADMIN_GRANTS)[number] = { scope: 'project', role: 'admin' };

/** How often {@link SupabaseAdminClient.awaitLinkWitness} reads a witness. */
const LINK_WITNESS_POLL_INTERVAL_MS = 250;

/**
 * How long {@link SupabaseAdminClient.awaitLinkWitness} reads a witness before it gives up.
 *
 * reason: three slow timeouts, not one. The function bounds each of its own requests to the auth service and each phase of its mail conversation at ten seconds, so a link request that ends as `not-sent` through a hung dependency finishes later than one slow timeout. This is a ceiling on a polled state, never a wait: a finished witness is returned by the next read.
 */
const LINK_WITNESS_CEILING_MS = TIMEOUTS.slowPage * 3;

/** Users read per page by the exact listing. */
const AUTH_USERS_PAGE_SIZE = 200;

/** The outcome a finished completion witness reads: whether the request's background work handed a mail over. */
export type LinkWitnessOutcome = 'sent' | 'not-sent';

/** One row of `public.grants` as its four specification columns: the shape the access token's `grants` claim states a grant in. */
export type GrantRow = GrantSpec;

/** An auth user as the listing returns it, narrowed to the fields this file reads. */
interface AuthUserRow {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
}

/**
 * An entity an editor grant names: its type and its `external_id` in the client's project.
 */
export interface EntityGrantTarget {
  /** The entity's type. Only the two types a contestant can edit are admitted. */
  entityType: 'candidate' | 'organization';
  /** The entity's `external_id`, looked up in the client's own project. */
  externalId: string;
}

/**
 * The table holding the entities of each type an editor grant can name.
 */
const ENTITY_GRANT_TABLES: Readonly<Record<EntityGrantTarget['entityType'], 'candidates' | 'organizations'>> =
  Object.freeze({
    candidate: 'candidates',
    organization: 'organizations'
  });

/**
 * Maps camelCase collection names to Supabase snake_case table names.
 * Extends TABLE_MAP with legacy/alias mappings for backward compatibility.
 *
 * Duplicated locally (mirrors the dev-seed base) so `findData` / `query` can translate camelCase collection names without re-exporting a private helper from the dev-seed package.
 */
const COLLECTION_MAP: Record<string, string> = {
  ...TABLE_MAP,
  // Legacy aliases
  parties: 'organizations',
  questionTypes: 'question_types'
};

/**
 * Maps camelCase filter field names to Supabase snake_case column names.
 * Extends PROPERTY_MAP with legacy/alias mappings.
 */
const FIELD_MAP: Record<string, string> = {
  ...PROPERTY_MAP,
  // Legacy aliases
  documentId: 'id'
};

/**
 * Resolve a collection name: if it matches a COLLECTION_MAP entry, use that; otherwise return as-is (already snake_case).
 */
function resolveCollectionName(collection: string): string {
  return COLLECTION_MAP[collection] ?? collection;
}

/**
 * Convert a camelCase field name to snake_case using FIELD_MAP, or fall through as-is if already snake_case.
 */
function resolveFieldName(field: string): string {
  return FIELD_MAP[field] ?? field;
}

export class SupabaseAdminClient extends DevSeedAdminClient {
  /**
   * Same signature as the base constructor; the only difference is the project it falls back to.
   *
   * An argument-less client here targets the E2E project, while the base class keeps targeting the default project — which is why `yarn db:seed` and `yarn db:reset-with-data` still fill the project a local development session reads.
   *
   * @param url - Supabase URL. Defaults to the base class's local-development value.
   * @param serviceRoleKey - Service-role key. Defaults to the base class's local-development value.
   * @param projectId - Explicit project. Defaults to the resolved E2E project.
   */
  constructor(url?: string, serviceRoleKey?: string, projectId?: string) {
    super(url, serviceRoleKey, projectId ?? resolveE2eProjectId());
  }

  /**
   * List every auth user, page by page, and fail when a page cannot be read.
   *
   * The one read of the auth users in this file. A listing that stopped at the first page, or that answered a failure with an empty list, would let "no such user" pass for a user who exists: a negative assertion would pass and a cleanup would remove nobody and report success.
   *
   * @param caller - Name of the public method making the call; it prefixes the error text.
   * @throws Error if any page fails.
   */
  private async listAllUsers(caller: string): Promise<Array<AuthUserRow>> {
    const all: Array<AuthUserRow> = [];
    for (let page = 1; ; page++) {
      const { data, error } = await this.client.auth.admin.listUsers({ page, perPage: AUTH_USERS_PAGE_SIZE });
      if (error) throw new Error(`${caller}: listing the auth users failed: ${error.message}`);
      all.push(...data.users.map((user) => ({ id: user.id, email: user.email, app_metadata: user.app_metadata })));
      if (data.users.length < AUTH_USERS_PAGE_SIZE) return all;
    }
  }

  /**
   * The auth user holding an address, looked up over every user.
   *
   * @param email - The address looked up, compared trimmed and lower-cased, as the auth service stores it.
   * @param caller - Name of the public method making the call; it prefixes the error text.
   * @returns The user, or `undefined` when no user holds the address.
   * @throws Error if the users cannot be listed; a failed listing is never read as "no such user".
   */
  private async findAuthUser(email: string, caller: string): Promise<AuthUserRow | undefined> {
    const address = email.trim().toLowerCase();
    return (await this.listAllUsers(caller)).find((user) => user.email?.toLowerCase() === address);
  }

  /**
   * Whether an auth user holds an address, decided over every user.
   *
   * @param email - The address looked up, compared trimmed and lower-cased.
   * @throws Error if the users cannot be listed; a failed listing is never read as "no such user".
   */
  async hasAuthUser(email: string): Promise<boolean> {
    return (await this.findAuthUser(email, 'hasAuthUser')) !== undefined;
  }

  /**
   * Every grant a user holds, each as its four specification columns.
   *
   * @param email - Address of the auth user whose grants are read.
   * @returns The user's rows of `public.grants`, in no particular order.
   * @throws Error if no auth user holds the address, or if a read fails.
   */
  async grantRowsForUser(email: string): Promise<Array<GrantRow>> {
    const user = await this.findAuthUser(email, 'grantRowsForUser');
    if (!user) throw new Error(`grantRowsForUser: no user found with email ${email}`);
    const { data, error } = await this.client
      .from('grants')
      .select('scope, target_type, target_id, role')
      .eq('user_id', user.id);
    if (error) throw new Error(`grantRowsForUser: ${error.message}`);
    return (data ?? []) as Array<GrantRow>;
  }

  /**
   * How many auth users have an address that begins with a prefix, counted over every user.
   *
   * @param prefix - The beginning of the addresses to count, compared without regard to case.
   * @throws Error if the users cannot be listed; a failed listing is never read as "none".
   */
  async countUsersByEmailPrefix(prefix: string): Promise<number> {
    const users = await this.listAllUsers('countUsersByEmailPrefix');
    return users.filter((user) => user.email?.toLowerCase().startsWith(prefix.toLowerCase())).length;
  }

  /**
   * Remove every auth user whose address begins with a prefix, with the user's grants and the user's invitations in this client's project.
   *
   * For a spec that invents its addresses under a prefix of its own: it clears what an interrupted run left, whichever addresses that run used.
   *
   * @param prefix - The beginning of the addresses to remove. At least eight characters, so that a slip cannot name half the suite's users.
   * @returns How many users were removed.
   * @throws Error if the prefix is too short, or if a listing or a removal fails.
   */
  async removeUsersByEmailPrefix(prefix: string): Promise<number> {
    if (prefix.length < 8) {
      throw new Error(`removeUsersByEmailPrefix: the prefix '${prefix}' is shorter than eight characters`);
    }
    const users = (await this.listAllUsers('removeUsersByEmailPrefix')).filter((user) =>
      user.email?.toLowerCase().startsWith(prefix.toLowerCase())
    );
    for (const user of users) {
      // The invitations go first: deleting the user alone leaves a claimed row claimed.
      await this.removeInvitations({ emails: user.email ? [user.email] : [], claimedByUserIds: [user.id] });
      const { error: grantError } = await this.client.from('grants').delete().eq('user_id', user.id);
      if (grantError) throw new Error(`removeUsersByEmailPrefix: delete grants failed: ${grantError.message}`);
      const { error: deleteError } = await this.client.auth.admin.deleteUser(user.id);
      if (deleteError) throw new Error(`removeUsersByEmailPrefix: deleteUser failed: ${deleteError.message}`);
    }
    return users.length;
  }

  // ---------------------------------------------------------------------------
  // Invitations
  // ---------------------------------------------------------------------------

  /**
   * Delete invitation rows of this client's project: those addressed to one of the addresses, as `email` or as the pending address of a code; those promising a grant on one of the targets; and those one of the users claimed. Claimed rows are deleted like open ones.
   *
   * The three criteria are alternatives: a row matching any one of them goes. With nothing given, nothing is deleted.
   *
   * A deleted row gives back the one-mail-per-address slot of each address it still holds. A claimed code row holds none, so its claimant's slot runs out by itself; see {@link releaseLinkSlot}.
   *
   * @param criteria.emails - Addresses, compared trimmed and lower-cased, as the table stores them.
   * @param criteria.targetIds - Ids of the promised targets: entities, or the project itself.
   * @param criteria.claimedByUserIds - Ids of the auth users whose claimed invitations go.
   * @returns How many rows were deleted.
   * @throws Error naming the failed step and the database error's code. The message holds no address.
   */
  async removeInvitations(
    criteria: {
      emails?: ReadonlyArray<string>;
      targetIds?: ReadonlyArray<string>;
      claimedByUserIds?: ReadonlyArray<string>;
    } = {}
  ): Promise<number> {
    const emails = (criteria.emails ?? []).map((email) => email.trim().toLowerCase()).filter((email) => email !== '');
    const steps: Array<{ column: string; values: ReadonlyArray<string> }> = [
      { column: 'email', values: emails },
      { column: 'pending_email', values: emails },
      { column: 'target_id', values: criteria.targetIds ?? [] },
      { column: 'claimed_by', values: criteria.claimedByUserIds ?? [] }
    ];
    let removed = 0;
    for (const { column, values } of steps) {
      if (values.length === 0) continue;
      const { data, error } = await this.client
        .from('invitations')
        .delete()
        .eq('project_id', this.projectId)
        .in(column, [...values])
        .select('id');
      if (error) {
        throw new Error(`removeInvitations: delete by ${column} failed with database error ${error.code}`);
      }
      removed += (data ?? []).length;
    }
    return removed;
  }

  /**
   * Give back the one-mail-per-address slot of an address in this client's project, so that the next link request for it is not answered by the interval.
   *
   * For a test that asks for a second mail to an address it already mailed, or that reuses an address across runs. With a code, the code's binding interval is given back too.
   *
   * @param email - The address whose slot is given back.
   * @param code - A code whose pending address is that address.
   * @throws Error naming the database error's code.
   */
  async releaseLinkSlot(email: string, code?: string): Promise<void> {
    const { error } = await this.client.rpc('invitation_link_release', {
      p_project_id: this.projectId,
      p_email: email,
      ...(code === undefined ? {} : { p_code: code })
    });
    if (error) throw new Error(`releaseLinkSlot failed with database error ${error.code}`);
  }

  /**
   * Seed one email invitation for an entity of this client's project and ask the `account-access` function to mail its address a sign-in link.
   *
   * It first removes any invitation for that address on that entity and gives the address's slot back, so a repeated call mails again instead of meeting a duplicate or the interval. It sends nothing itself and writes no grant: the mail is the function's, and the grant is written when the invited user claims.
   *
   * The function answers before it has mailed, so the request carries a completion witness and this method returns only once that witness reads `sent`. On return the mail has been handed over and the invited address has an auth user: the newest sign-in mail the catcher holds for the address is this request's, also for an address an earlier run mailed. A caller that asserts no mail was sent does not use this helper, and carries a witness of its own (see {@link openLinkWitness}).
   *
   * @param params.entityType - The entity's type.
   * @param params.externalId - The entity's `external_id` in this client's project.
   * @param params.email - The invited address.
   * @param params.locale - The locale of the mail and of the link's path.
   * @param params.confirmEntity - Whether the call confirms the entity when it has a name; it never unconfirms one.
   * @param params.nominations - Nominations of the entity the same call creates or updates; build each with {@link invitationNomination}.
   * @param params.afterSeeding - Awaited after the invitation is seeded and before the link is asked for: the place to assert what seeding alone did.
   * @returns The seeded invitation.
   * @throws Error if the entity is not found, if a database step fails, if the function does not answer 200, or if the request finishes without handing a mail over.
   */
  async inviteByEmail({
    entityType,
    externalId,
    email,
    locale,
    confirmEntity,
    nominations,
    afterSeeding
  }: {
    entityType: EntityGrantTarget['entityType'];
    externalId: string;
    email: string;
    locale?: string;
    confirmEntity: boolean;
    nominations?: ReadonlyArray<InvitationNominationSeed>;
    afterSeeding?: (seeded: SeededInvitation) => Promise<void>;
  }): Promise<SeededInvitation> {
    const address = email.trim().toLowerCase();
    const targetId = await this.entityIdForGrantTarget({ entityType, externalId }, 'inviteByEmail');

    const { error: deleteError } = await this.client
      .from('invitations')
      .delete()
      .eq('project_id', this.projectId)
      .eq('target_id', targetId)
      .eq('email', address);
    if (deleteError) {
      throw new Error(`inviteByEmail: removing the earlier invitation failed with database error ${deleteError.code}`);
    }
    await this.releaseLinkSlot(address);

    const [seeded] = await this.createInvitations(
      [{ target_type: entityType, target_id: targetId, email: address, ...(nominations ? { nominations } : {}) }],
      { confirmEntity }
    );
    if (!seeded) throw new Error('inviteByEmail: create_invitations returned no row');
    await afterSeeding?.(seeded);

    const witness = await this.openLinkWitness();
    const answer = await requestLink({ projectId: this.projectId, email: address, locale, witness });
    if (answer.status !== 200) throw new Error(`inviteByEmail: the link request answered status ${answer.status}`);
    const outcome = await this.awaitLinkWitness(witness);
    if (outcome !== 'sent') throw new Error('inviteByEmail: the link request finished without handing a mail over');
    return seeded;
  }

  /**
   * Open a completion witness for one link request.
   *
   * A link request is answered before its work is done, and the background work of two requests does not finish in the order the requests were made. A test therefore cannot conclude that no mail was sent from the answer, from elapsed time, or from a later request's mail. It opens a witness here, sends the id with the request, and waits with {@link awaitLinkWitness} for the end of THAT request's work before it looks at the mail catcher or at the accounts.
   *
   * @returns The id of a new open witness record.
   * @throws Error naming the database error's code, or if no id is returned.
   */
  async openLinkWitness(): Promise<string> {
    const { data, error } = await this.client.rpc('invitation_link_witness_open');
    if (error) throw new Error(`openLinkWitness failed with database error ${error.code}`);
    if (typeof data !== 'string' || data === '') throw new Error('openLinkWitness: no witness id was returned');
    return data;
  }

  /**
   * Wait until the link request that carried a witness has finished its background work, and return what it did.
   *
   * Polls the witness until it reads a finished outcome: `sent` when a mail was handed over, `not-sent` when none was, for whatever reason. An open witness reads null.
   *
   * @param id - The id {@link openLinkWitness} returned.
   * @returns The finished outcome.
   * @throws Error naming the id when the witness is still open at the ceiling, or naming the database error's code when a read fails.
   */
  async awaitLinkWitness(id: string): Promise<LinkWitnessOutcome> {
    const deadline = Date.now() + LINK_WITNESS_CEILING_MS;
    for (;;) {
      const { data, error } = await this.client.rpc('invitation_link_witness', { p_id: id });
      if (error) throw new Error(`awaitLinkWitness: reading witness ${id} failed with database error ${error.code}`);
      if (data === 'sent' || data === 'not-sent') return data;
      if (Date.now() >= deadline) {
        throw new Error(
          `awaitLinkWitness: witness ${id} read neither sent nor not-sent within ${LINK_WITNESS_CEILING_MS} ms`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, LINK_WITNESS_POLL_INTERVAL_MS));
    }
  }

  // ---------------------------------------------------------------------------
  // Data querying
  // ---------------------------------------------------------------------------

  /**
   * Find data in a collection with filters.
   *
   * Translates filter syntax `{ field: { $eq: value } }` to PostgREST `.eq(field, value)`. Adds `documentId: row.id` alias to each result row.
   *
   * @param collection - Collection name (camelCase or snake_case)
   * @param filters - Filter object with `{ field: { $eq: value } }` syntax
   * @returns FindDataResult with matching records
   */
  async findData(collection: string, filters: Record<string, unknown>): Promise<FindDataResult> {
    const tableName = resolveCollectionName(collection);
    let query = this.client.from(tableName).select('*');

    // Apply filters: translate { field: { $eq: value } } to .eq(field, value)
    for (const [key, filterValue] of Object.entries(filters)) {
      const snakeKey = resolveFieldName(key);

      if (typeof filterValue === 'object' && filterValue !== null && !Array.isArray(filterValue)) {
        const filterObj = filterValue as Record<string, unknown>;
        if ('$eq' in filterObj) {
          query = query.eq(snakeKey, filterObj.$eq as string);
        } else if ('$ne' in filterObj) {
          query = query.neq(snakeKey, filterObj.$ne as string);
        } else if ('$in' in filterObj) {
          query = query.in(snakeKey, filterObj.$in as Array<string>);
        } else if ('$like' in filterObj) {
          query = query.like(snakeKey, filterObj.$like as string);
        } else {
          // Direct equality if no operator
          query = query.eq(snakeKey, filterValue);
        }
      } else {
        // Direct equality
        query = query.eq(snakeKey, filterValue);
      }
    }

    // Scope to project (most tables have project_id) Skip for join tables and tables without project_id
    const tablesWithoutProjectId = new Set([
      'election_constituency_groups',
      'constituency_group_constituencies',
      'grants'
    ]);
    if (!tablesWithoutProjectId.has(tableName)) {
      query = query.eq('project_id', this.projectId);
    }

    const { data: rows, error } = await query;

    if (error) {
      return { type: 'failure', cause: error.message };
    }

    // Add documentId alias for backward compatibility
    const enrichedRows = (rows ?? []).map((row: Record<string, unknown>) => ({
      ...row,
      documentId: row.id
    }));

    return { type: 'success', data: enrichedRows };
  }

  /**
   * Generic PostgREST query builder for a collection.
   *
   * Returns the query builder for more complex queries that findData doesn't cover.
   *
   * @param collection - Collection name (camelCase or snake_case)
   * @returns PostgREST query builder scoped to this project
   */
  query(collection: string) {
    const tableName = resolveCollectionName(collection);
    return this.client.from(tableName).select('*').eq('project_id', this.projectId);
  }

  /**
   * Generic update for a single record by ID.
   *
   * @param collection - Collection name (camelCase or snake_case)
   * @param id - UUID of the record to update
   * @param data - Fields to update
   * @throws Error if the update fails
   */
  async update(collection: string, id: string, data: Record<string, unknown>): Promise<void> {
    const tableName = resolveCollectionName(collection);
    const { error } = await this.client.from(tableName).update(data).eq('id', id);
    if (error) throw new Error(`update(${tableName}, ${id}) failed: ${error.message}`);
  }

  /**
   * Post-seed read helper.
   *
   * Returns the current persisted `app_settings.settings` JSONB for this client's project, or `null` if the bootstrap row is missing.
   *
   * Consumed by `data.setup.ts` immediately after `writer.write(...)` to verify the dev-seed e2e template's `app_settings.fixed[]` block actually persisted via Pass-5 (`merge_jsonb_column`). Subset match (`expect(...).toMatchObject(expected)`) — `merge_jsonb_column` is additive, so stale keys from a prior run do not fail the assertion.
   *
   * Mirrors the read shape of the inherited `updateAppSettings` method (`packages/dev-seed/src/supabaseAdminClient.ts`) but selects `settings` instead of `id`.
   *
   * @returns the persisted settings object, or `null` when no row exists.
   * @throws Error if the underlying fetch fails.
   */
  async getAppSettings(): Promise<Record<string, unknown> | null> {
    const { data: row, error } = await this.client
      .from('app_settings')
      .select('settings')
      .eq('project_id', this.projectId)
      .single();
    if (error) {
      // PGRST116 = no rows; treat as null (the bootstrap row is missing, which a setup-file caller will surface as a clearer error).
      const code = (error as { code?: string }).code;
      if (code === 'PGRST116') return null;
      throw new Error(`getAppSettings: fetch failed: ${error.message}`);
    }
    return (row?.settings ?? null) as Record<string, unknown> | null;
  }

  /**
   * Exact row count across the ten teardown tables for a given `external_id` prefix.
   *
   * Iterates `ALLOWED_TEARDOWN_TABLES` imported from `@openvaa/dev-seed` — the SAME list `runTeardown`'s `bulkDelete` clears — so the probe cannot drift from the delete it measures.
   *
   * Uses a HEAD count query (`{ count: 'exact', head: true }`) and reads the returned `count`, never the length of a returned row array — that length is bounded by PostgREST's default page limit and would silently under-report a prefix matching more rows than one page.
   *
   * Read-only — returns integers only, no row content. Scoped by `project_id` and by `external_id LIKE '<prefix>%'`, matching the delete's own prefix semantics.
   *
   * Only `*` is rejected before the query runs. PostgREST's `like` filter (used here) maps a literal `*` in the input to SQL `%`, but `bulk_delete`'s raw SQL `external_id LIKE $2` (`00001_initial_schema.sql`) does not — a `*` in the prefix would therefore be counted under a DIFFERENT match set than `bulk_delete` actually deletes.
   *
   * `_` and `%` are NOT rejected: both PostgREST's `like` and the RPC's raw SQL `LIKE` treat `_` as a single-character wildcard and `%` as a multi-character wildcard identically on both sides, so the probe and the delete over-match the SAME extra rows — `rowsDeleted === rowsBefore` still holds; the prefix is merely imprecise, not mismeasured. Because this probe runs BEFORE the delete (`runTeardownAsserted`), rejecting `_`/`%` would make a teardown using such a prefix throw and delete NOTHING — turning an imprecise-but-correct delete into a silent full leak of the dataset. The dev-seed CLI's default `seed_` prefix (which contains `_`) is the case this guard must not break.
   *
   * @param prefix - `external_id` prefix, forwarded verbatim (no normalisation).
   * @returns total matching rows summed across the ten tables.
   * @throws Error if any per-table count query fails, or if `prefix` contains
   *   the LIKE metacharacter `*`.
   */
  async countRowsByPrefix(prefix: string): Promise<number> {
    if (prefix.includes('*')) {
      throw new Error(
        `countRowsByPrefix: prefix '${prefix}' contains '*'. PostgREST's \`like\` filter maps '*' to ` +
          "SQL '%', but bulk_delete's raw `external_id LIKE $2` does not — the probe would count a " +
          'wildcard match while the delete matched the literal, so the count would not measure the delete.'
      );
    }
    let total = 0;
    for (const table of ALLOWED_TEARDOWN_TABLES) {
      const { count, error } = await this.client
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('project_id', this.projectId)
        .like('external_id', `${prefix}%`);
      if (error) {
        throw new Error(`countRowsByPrefix failed: ${error.message}`);
      }
      total += count ?? 0;
    }
    return total;
  }

  // ---------------------------------------------------------------------------
  // Identity through candidate-editor grants
  // ---------------------------------------------------------------------------

  /**
   * The ids of the candidates in this client's project that the user edits.
   *
   * The `(entity, candidate, <id>, editor)` grant is the only link from an auth user to a candidate, so the ids come from the user's candidate-editor grants and are then narrowed to this project: grants carry no project of their own.
   *
   * @param userId - The auth user whose grants are read.
   * @returns The candidate ids, or an empty array when the user holds no candidate-editor grant on a candidate in this project.
   * @throws Error if either query fails.
   */
  async candidateIdsForUser(userId: string): Promise<Array<string>> {
    const { data: grants, error: grantError } = await this.client
      .from('grants')
      .select('target_id')
      .eq('user_id', userId)
      .eq('scope', 'entity')
      .eq('target_type', 'candidate')
      .eq('role', 'editor');
    if (grantError) throw new Error(`candidateIdsForUser: ${grantError.message}`);

    const grantedIds = (grants ?? []).map((grant) => grant.target_id as string);
    if (grantedIds.length === 0) return [];

    const { data: candidates, error: candidateError } = await this.client
      .from('candidates')
      .select('id')
      .in('id', grantedIds)
      .eq('project_id', this.projectId);
    if (candidateError) throw new Error(`candidateIdsForUser: ${candidateError.message}`);

    return (candidates ?? []).map((candidate) => candidate.id as string);
  }

  /**
   * The auth user holding the candidate-editor grant on a candidate, if any.
   *
   * At most one user can hold it: the schema admits one editor per candidate.
   *
   * @param candidateId - The candidate whose editor is looked up.
   * @returns The user id, or null when no grant names the candidate.
   * @throws Error if the query fails.
   */
  async userIdForCandidate(candidateId: string): Promise<string | null> {
    const { data: grant, error } = await this.client
      .from('grants')
      .select('user_id')
      .eq('scope', 'entity')
      .eq('target_type', 'candidate')
      .eq('target_id', candidateId)
      .eq('role', 'editor')
      .maybeSingle();
    if (error) throw new Error(`userIdForCandidate: ${error.message}`);
    const userId: unknown = grant?.user_id;
    return typeof userId === 'string' ? userId : null;
  }

  // ---------------------------------------------------------------------------
  // Entity-editor grants
  // ---------------------------------------------------------------------------

  /**
   * The id of the auth user holding an email address.
   *
   * @param email - The email address looked up.
   * @param caller - Name of the public method making the call; it prefixes the error text.
   * @throws Error if no auth user has that email, or if the users cannot be listed.
   */
  private async userIdForEmail(email: string, caller: string): Promise<string> {
    const user = await this.findAuthUser(email, caller);
    if (!user) throw new Error(`${caller}: no user found with email ${email}`);
    return user.id;
  }

  /**
   * The id of the entity a grant target names, read from the table of its type in this client's project.
   *
   * @param target - The entity's type and external id.
   * @param caller - Name of the public method making the call; it prefixes the error text.
   * @throws Error if the type is not one an editor grant can name, or if no such entity exists in this project.
   */
  private async entityIdForGrantTarget(target: EntityGrantTarget, caller: string): Promise<string> {
    // A lookup, not an index access: a type that is not an own key of the map throws by name instead of reading a table called `undefined`.
    const table = Object.hasOwn(ENTITY_GRANT_TABLES, target.entityType)
      ? ENTITY_GRANT_TABLES[target.entityType]
      : undefined;
    if (!table) throw new Error(`${caller}: entity type '${target.entityType}' cannot be granted to an editor`);
    return this.rowIdByExternalId(table, target.externalId, caller);
  }

  /**
   * The id of an election, a constituency, a candidate or an organization of this client's project, by its `external_id`.
   *
   * @param table - The table the row is read from.
   * @param externalId - The row's `external_id`.
   * @param caller - Name of the public method making the call; it prefixes the error text.
   * @throws Error if no such row exists in this project.
   */
  private async rowIdByExternalId(
    table: 'elections' | 'constituencies' | 'candidates' | 'organizations',
    externalId: string,
    caller: string
  ): Promise<string> {
    const { data: row, error } = await this.client
      .from(table)
      .select('id')
      .eq('external_id', externalId)
      .eq('project_id', this.projectId)
      .single();
    if (error) throw new Error(`${caller}: failed to find ${table} row ${externalId}: ${error.message}`);
    return row.id as string;
  }

  /**
   * A nomination of an invited entity, in the shape `inviteByEmail` and `createInvitations` take, from external ids of this client's project.
   *
   * @param params.election - The election's `external_id`.
   * @param params.constituency - The constituency's `external_id`.
   * @param params.parentOrganization - The parent organization's `external_id`; without one the nomination has no parent.
   * @param params.symbol - The nomination's election symbol.
   * @param params.externalId - The nomination's own `external_id`.
   * @param params.confirmed - Whether the nomination is confirmed.
   * @returns The nomination with the uuids the call takes.
   * @throws Error if the election, the constituency or the organization is not found in this project.
   */
  async invitationNomination({
    election,
    constituency,
    parentOrganization,
    symbol,
    externalId,
    confirmed
  }: {
    election: string;
    constituency: string;
    parentOrganization?: string;
    symbol?: string;
    externalId?: string;
    confirmed: boolean;
  }): Promise<InvitationNominationSeed> {
    const caller = 'invitationNomination';
    const [electionId, constituencyId, parentId] = await Promise.all([
      this.rowIdByExternalId('elections', election, caller),
      this.rowIdByExternalId('constituencies', constituency, caller),
      parentOrganization === undefined
        ? Promise.resolve(undefined)
        : this.rowIdByExternalId('organizations', parentOrganization, caller)
    ]);
    return {
      election_id: electionId,
      constituency_id: constituencyId,
      parent:
        parentId === undefined
          ? { kind: 'none' }
          : { kind: 'entity', entity_type: 'organization', entity_id: parentId },
      confirmed,
      ...(symbol === undefined ? {} : { election_symbol: symbol }),
      ...(externalId === undefined ? {} : { external_id: externalId })
    };
  }

  /**
   * The id of an entity of this client's project, by its type and `external_id`.
   *
   * For a spec or fixture that knows a seeded row by its external id and needs the id the application's URLs and writes carry.
   *
   * @param target - The entity's type and external id.
   * @throws Error if the type is not one an editor grant can name, or if no such entity exists in this project.
   */
  async entityId(target: EntityGrantTarget): Promise<string> {
    return this.entityIdForGrantTarget(target, 'entityId');
  }

  /**
   * Write one `(entity, <type>, <id>, editor)` grant for a user. The one place in this file that inserts an entity grant.
   *
   * The grant row is the only link from an identity to an entity, which is how the contestant app finds the user's own records, and `custom_access_token_hook` projects `public.grants` into the JWT on every token issue: a caller whose claim is an empty array is denied everything, so an identity minted without this row logs in and is then refused by policies, which reads as a product defect rather than as a fixture gap.
   *
   * A candidate admits one editor. Whether a candidate is free is decided here, at run time, against this client's project, and a candidate that already has an editor is refused by name before the insert; `idx_grants_one_candidate_editor` would refuse it too, with a message that names no candidate.
   *
   * @param userId - The auth user the grant is written for.
   * @param target - The entity's type and external id.
   * @param caller - Name of the public method making the call; it prefixes the error text.
   * @throws Error if the entity is not found, if a candidate already has an editor, or if the insert fails.
   */
  private async grantEntityToUser(userId: string, target: EntityGrantTarget, caller: string): Promise<void> {
    const entityId = await this.entityIdForGrantTarget(target, caller);

    if (target.entityType === 'candidate') {
      const editorId = await this.userIdForCandidate(entityId);
      if (editorId) {
        throw new Error(
          `${caller}: candidate ${target.externalId} already has an editor (user ${editorId}); a candidate admits one. ` +
            'Unregister that user first, or grant a candidate that no identity of the run edits.'
        );
      }
    }

    const { error } = await this.client.from('grants').insert({
      user_id: userId,
      scope: 'entity',
      target_type: target.entityType,
      target_id: entityId,
      role: 'editor'
    });
    if (error) throw new Error(`${caller}: insert grant failed: ${error.message}`);
  }

  /**
   * Make an existing user the editor of an entity of this client's project.
   *
   * The second half of {@link forceRegister} on its own: that method creates the user and then writes the user's first grant through the same code path this method uses. Which candidates are free is decided here, at run time, against the suite's project: a candidate that already has an editor is refused with an error naming it. An organization admits several editors.
   *
   * A grant written after the user's token was issued is not in that token. Write the grants before the user signs in when the session must carry them.
   *
   * @param email - Email address of the auth user the grant is written for.
   * @param target - The entity's type and external id.
   * @throws Error if no auth user has that email, if the entity is not found, if a candidate already has an editor, or if the insert fails.
   */
  async grantEntity(email: string, target: EntityGrantTarget): Promise<void> {
    const userId = await this.userIdForEmail(email, 'grantEntity');
    await this.grantEntityToUser(userId, target, 'grantEntity');
  }

  /**
   * Remove one user's editor grant on one entity. The inverse of {@link grantEntity}.
   *
   * Idempotent: a user who holds no such grant, or who does not exist, is left as they are. The user's other grants and the entity row are not touched. A token issued before the removal still carries the grant; the row-level policies read the table, so the entity is no longer listed or readable for that user.
   *
   * @param email - Email address of the auth user whose grant is removed.
   * @param target - The entity's type and external id.
   * @throws Error if the users cannot be listed, if the entity is not found or if the delete fails.
   */
  async revokeEntityGrant(email: string, target: EntityGrantTarget): Promise<void> {
    const user = await this.findAuthUser(email, 'revokeEntityGrant');
    if (!user) return;

    const entityId = await this.entityIdForGrantTarget(target, 'revokeEntityGrant');
    const { error } = await this.client
      .from('grants')
      .delete()
      .eq('user_id', user.id)
      .eq('scope', 'entity')
      .eq('target_type', target.entityType)
      .eq('target_id', entityId)
      .eq('role', 'editor');
    if (error) throw new Error(`revokeEntityGrant: delete grant failed: ${error.message}`);
  }

  /**
   * How many entity grants a user holds, whatever their type, role or project.
   *
   * @param email - Email address of the auth user whose grants are counted.
   * @returns The exact number of the user's entity-scope grant rows.
   * @throws Error if no auth user has that email, or if the count fails.
   */
  async entityGrantCountForUser(email: string): Promise<number> {
    const userId = await this.userIdForEmail(email, 'entityGrantCountForUser');
    const { count, error } = await this.client
      .from('grants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('scope', 'entity');
    if (error) throw new Error(`entityGrantCountForUser: ${error.message}`);
    return count ?? 0;
  }

  // ---------------------------------------------------------------------------
  // Auth user management
  // ---------------------------------------------------------------------------

  /**
   * Set a user's password by email address.
   *
   * Looks up the auth user by email, then updates their password via the Admin Auth API.
   *
   * @param email - Email address of the user
   * @param password - New password to set
   * @throws Error if the users cannot be listed, if the user is not found or if the update fails
   */
  async setPassword(email: string, password: string): Promise<void> {
    const user = await this.findAuthUser(email, 'setPassword');
    if (!user) throw new Error(`setPassword: no user found with email ${email}`);

    const { error } = await this.client.auth.admin.updateUserById(user.id, { password });
    if (error) throw new Error(`setPassword: updateUser failed: ${error.message}`);
  }

  /**
   * Record that a user accepts the terms of use of this client's project.
   *
   * The table holds one row per user and project. The write ignores a row that already exists, so recording the same acceptance again leaves that row as it is and raises nothing. The service role has no caller identity for the column default to read, so the user is stated explicitly.
   *
   * @param userId - The auth user the acceptance is recorded for.
   * @param caller - Name of the public method making the call; it prefixes the error text.
   * @throws Error if the write fails.
   */
  protected async insertTermsOfUseAcceptance(userId: string, caller: string): Promise<void> {
    const { error } = await this.client
      .from('terms_of_use_acceptances')
      .upsert(
        { user_id: userId, project_id: this.projectId },
        { onConflict: 'user_id,project_id', ignoreDuplicates: true }
      );
    if (error) throw new Error(`${caller}: record terms-of-use acceptance failed: ${error.message}`);
  }

  /**
   * Record a user's acceptance of the terms of use of this client's project, naming the user by email.
   *
   * For an identity a spec created by some other route than {@link forceRegister}, such as an email invitation, when meeting the acceptance gate is not what the spec is about. Safe to call twice: the second call changes nothing.
   *
   * @param email - Email address of the auth user the acceptance is recorded for.
   * @throws Error if the users cannot be listed, if no auth user has that email, or if the write fails.
   */
  async acceptTermsOfUse(email: string): Promise<void> {
    const user = await this.findAuthUser(email, 'acceptTermsOfUse');
    if (!user) throw new Error(`acceptTermsOfUse: no user found with email ${email}`);

    await this.insertTermsOfUseAcceptance(user.id, 'acceptTermsOfUse');
  }

  /**
   * Create an auth user, write the user's entity-editor grants, and record the user's acceptance of the terms of use of this client's project.
   *
   * The one mechanism behind {@link forceRegister} and {@link forceRegisterUser}. Every step after the account exists runs inside a compensating `auth.admin.deleteUser` rollback, so a failure never leaves a user without its intended grants: an orphan auth user would surface as "User already exists" on every later run and need manual cleanup.
   *
   * @param caller - Name of the public method making the call; it prefixes the error text.
   * @param email - Email address for the new auth user.
   * @param password - Password for the new auth user.
   * @param entityGrants - The entities the user is made the editor of, each through {@link grantEntity}'s code path.
   * @param acceptTermsOfUse - Whether to record the user's acceptance of the terms of use.
   * @throws Error if any step fails. On a failure after the account exists the account is rolled back and the original cause is re-thrown.
   */
  private async registerWithGrants(
    caller: string,
    email: string,
    password: string,
    entityGrants: ReadonlyArray<EntityGrantTarget>,
    acceptTermsOfUse: boolean
  ): Promise<void> {
    // 1. Create auth user with confirmed email
    const { data: createData, error: createError } = await this.client.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (createError) throw new Error(`${caller}: createUser failed: ${createError.message}`);
    const user = createData.user;

    try {
      // 2. Write the entity-editor grants, each the only link from the identity to that entity.
      for (const target of entityGrants) {
        await this.grantEntityToUser(user.id, target, caller);
      }

      // 3. Record the user's acceptance of the terms of use of this client's project, unless the caller opted out. The row belongs to the auth user, so the rollback below removes it with the user.
      if (acceptTermsOfUse) {
        await this.insertTermsOfUseAcceptance(user.id, caller);
      }
    } catch (mutationErr) {
      // reason: compensating rollback on partial failure prevents orphan auth users that cascade as "User already exists" errors across subsequent test runs. The rollback failure (if any) is logged but not re-thrown — we always re-throw the original mutationErr so the caller sees the real cause.
      await this.client.auth.admin.deleteUser(user.id).then(
        () => {},
        (rollbackErr) => {
          console.error(`[${caller}] rollback (auth.admin.deleteUser) failed:`, rollbackErr);
        }
      );
      throw mutationErr;
    }
  }

  /**
   * Force-register a candidate: create the auth user, write the candidate-editor grant that links it to the candidate record, and record the user's acceptance of the terms of use of this client's project.
   *
   * The grant is written through {@link grantEntity}'s code path, so a candidate that already has an editor is refused by name.
   *
   * @param candidateExternalId - External ID of the candidate to register
   * @param email - Email address for the new auth user
   * @param password - Password for the new auth user
   * @param options - Optional settings.
   * @param options.acceptTermsOfUse - Whether to record the user's acceptance of the terms of use. Defaults to recording it; pass `false` for an identity that must meet the acceptance gate.
   * @throws Error if any step fails
   */
  async forceRegister(
    candidateExternalId: string,
    email: string,
    password: string,
    options: { acceptTermsOfUse?: boolean } = {}
  ): Promise<void> {
    await this.registerWithGrants(
      'forceRegister',
      email,
      password,
      [{ entityType: 'candidate', externalId: candidateExternalId }],
      options.acceptTermsOfUse !== false
    );
  }

  /**
   * Force-register a user who is not, or not only, the editor of one candidate: create the auth user, write the entity-editor grants the caller lists, and record the user's acceptance of the terms of use of this client's project.
   *
   * For an identity whose first grant is an organization, or who edits several entities. With no `entityGrants` the user is registered with no entity grant at all; add grants afterwards with {@link grantEntity}. Listing them here instead puts them inside the registration's rollback, so a grant that fails leaves no user behind.
   *
   * @param email - Email address for the new auth user.
   * @param password - Password for the new auth user.
   * @param options - Optional settings.
   * @param options.entityGrants - The entities the user is made the editor of. Defaults to none.
   * @param options.acceptTermsOfUse - Whether to record the user's acceptance of the terms of use. Defaults to recording it; pass `false` for an identity that must meet the acceptance gate.
   * @throws Error if any step fails. On a failure after the account exists the account is rolled back.
   */
  async forceRegisterUser(
    email: string,
    password: string,
    options: { entityGrants?: ReadonlyArray<EntityGrantTarget>; acceptTermsOfUse?: boolean } = {}
  ): Promise<void> {
    await this.registerWithGrants(
      'forceRegisterUser',
      email,
      password,
      options.entityGrants ?? [],
      options.acceptTermsOfUse !== false
    );
  }

  /**
   * Force-register an ADMIN: create the auth user, then write ONE project-scoped admin grant row.
   *
   * The sibling of {@link forceRegister}, minus its candidate lookup — an admin identity is one account plus one grant row and nothing else (see `tests/tests/utils/adminCredentials.ts` for why the seed structurally cannot express it).
   *
   * Exactly two mutations. The second is wrapped in the SAME compensating rollback shape `forceRegister` uses, and for the same reason rather than as defensive style: a failure between minting the account and writing the grant leaves an orphan `auth.users` row that surfaces as "User already exists" on every subsequent run and needs manual cleanup.
   *
   * The shape is `TEST_ADMIN_GRANT` — a member of the application's own `ADMIN_GRANTS`, checked at compile time by that constant's declaration, not a pair picked here. The target is `TEST_PROJECT_ID`, because the RLS predicate guarding `admin_jobs` is `user_can('project', X, …)` and a project grant reaches only its own project. An admin scoped anywhere else logs in fine and then fails the job insert for a reason that has nothing to do with what a test is measuring.
   *
   * Removal is `unregisterCandidate(email)`, which is misnamed for this use but correct for it: it deletes the grant rows by `user_id` and the auth user itself, and reads or writes no candidate row.
   *
   * @param email - Email address for the new admin auth user.
   * @param password - Password for the new admin auth user.
   * @throws Error if account creation or the grant insert fails. On a grant-insert failure the account is rolled back and the ORIGINAL cause is re-thrown.
   */
  async forceRegisterAdmin(email: string, password: string): Promise<void> {
    // 1. Create auth user with confirmed email.
    const { data: createData, error: createError } = await this.client.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (createError) throw new Error(`forceRegisterAdmin: createUser failed: ${createError.message}`);
    const user = createData.user;

    try {
      // 2. Write the project-scoped admin grant. `target_type` is null on every non-entity row — the table's CHECK constraint requires exactly that — and `custom_access_token_hook` reads this row on every token issue to build the JWT's `grants` claim.
      const { error: grantError } = await this.client.from('grants').insert({
        user_id: user.id,
        scope: TEST_ADMIN_GRANT.scope,
        target_type: null,
        target_id: this.projectId,
        role: TEST_ADMIN_GRANT.role
      });
      if (grantError) throw new Error(`forceRegisterAdmin: insert grant failed: ${grantError.message}`);
    } catch (mutationErr) {
      // reason: compensating rollback on partial failure prevents orphan auth users that cascade as "User already exists" errors across subsequent test runs. The rollback failure (if any) is logged but not re-thrown — we always re-throw the original mutationErr so the caller sees the real cause.
      await this.client.auth.admin.deleteUser(user.id).then(
        () => {},
        (rollbackErr) => {
          console.error('[forceRegisterAdmin] rollback (auth.admin.deleteUser) failed:', rollbackErr);
        }
      );
      throw mutationErr;
    }
  }

  /**
   * Look up a bank-auth `auth.users` row by email via the admin list API, returning the narrowed fields the bank-auth journey's end-state assertion reads: `id` + the bank-auth identity `app_metadata` claims the identity-callback Edge Function stamped at create time.
   *
   * `auth.users` lives in the `auth` schema, NOT the `public` schema that `findData`/`query` target via PostgREST — so it must be read through the GoTrue admin API. Returns `undefined` when no user matches (idempotent).
   *
   * @param email - The auth user's email (for bank-auth: the identity-derived
   *   placeholder `${sub}@bank-auth.placeholder`).
   * @throws Error if the users cannot be listed; `undefined` always means that every user was read and none holds the address.
   */
  async getAuthUserByEmail(email: string): Promise<
    | {
        id: string;
        email?: string;
        app_metadata?: {
          identity_provider?: string;
          identity_match_prop?: string;
          identity_match_value?: string;
        };
      }
    | undefined
  > {
    const user = await this.findAuthUser(email, 'getAuthUserByEmail');
    if (!user) return undefined;
    return {
      id: user.id,
      email: user.email,
      app_metadata: (user.app_metadata ?? {}) as {
        identity_provider?: string;
        identity_match_prop?: string;
        identity_match_value?: string;
      }
    };
  }

  /**
   * Delete the bank-auth candidate the identity-callback Edge Function created for a given placeholder email, with the grants naming it.
   *
   * The bank-auth self-registration flow creates a fresh `candidates` row with no `external_id`, so `runTeardown`'s prefix delete misses it. The row is found through the candidate-editor grant held by the auth user the Edge Function created under the identity-derived placeholder email (`${sub}@bank-auth.placeholder`). Without this delete the bank-auth candidate rows would accumulate across repeated runs, because `unregisterCandidate` removes the user's grants and the auth user but never a candidate row.
   *
   * Call it BEFORE `unregisterCandidate`: the grant it reads the candidate through is deleted with the auth user. Idempotent — a no-op when no user or candidate matches.
   *
   * @param placeholderEmail - The `${sub}@bank-auth.placeholder` address the bank-auth auth user was created with.
   * @throws Error if the users cannot be listed, or if the lookup or a delete fails.
   */
  async deleteBankAuthCandidateBySub(placeholderEmail: string): Promise<void> {
    const user = await this.findAuthUser(placeholderEmail, 'deleteBankAuthCandidateBySub');
    if (!user) return; // Nothing created yet.

    const candidateIds = await this.candidateIdsForUser(user.id);
    for (const candidateId of candidateIds) {
      // Delete the grants naming the candidate, then the candidate. Deleting the candidate also removes them through `cleanup_grants_on_delete`; the explicit delete keeps every removal path in this file reading the same way, none of them depending on remembering which trigger or constraint does the work.
      const { error: grantError } = await this.client
        .from('grants')
        .delete()
        .eq('scope', 'entity')
        .eq('target_id', candidateId);
      if (grantError) {
        throw new Error(`deleteBankAuthCandidateBySub: delete grants failed: ${grantError.message}`);
      }
      const { error: candError } = await this.client
        .from('candidates')
        .delete()
        .eq('id', candidateId)
        .eq('project_id', this.projectId);
      if (candError) {
        throw new Error(`deleteBankAuthCandidateBySub: delete candidate failed: ${candError.message}`);
      }
    }
  }

  /**
   * Delete every `admin_jobs` row written by `author`, in this client's project.
   *
   * NOTHING ELSE IN THE SUITE CAN REACH THESE ROWS. `admin_jobs` is not in `ALLOWED_TEARDOWN_TABLES`, so `runTeardown`'s prefix delete never sees it; the table carries no `external_id` column for a prefix to match on in the first place; its `election_id` is `ON DELETE SET NULL` rather than cascading, so an election teardown leaves the row behind with a null reference; and its `project_id` cascades only from a `projects` row the seed bootstraps and nothing deletes. A job row this suite causes therefore accumulates forever unless it is deleted BY AUTHOR, which is what this method is for.
   *
   * Idempotent — deleting no rows is not an error. Read-back of what was deleted is deliberately not returned: the caller that needs a count reads it first through `query('admin_jobs')`.
   *
   * @param author - The `author` column value, i.e. the admin's email address.
   * @throws Error if the delete fails.
   */
  async deleteAdminJobsByAuthor(author: string): Promise<void> {
    const { error } = await this.client
      .from('admin_jobs')
      .delete()
      .eq('project_id', this.projectId)
      .eq('author', author);
    if (error) throw new Error(`deleteAdminJobsByAuthor: ${error.message}`);
  }

  /**
   * Unregister a candidate: delete the user's invitations in this client's project, the user's grants and the auth user.
   *
   * If the user doesn't exist (already unregistered), only the invitations addressed to the email are deleted. The candidate rows themselves are left in place. The user's terms-of-use acceptances go with the auth user, by the cascade on `terms_of_use_acceptances.user_id`.
   *
   * A failed listing of the users throws before anything is deleted: "no such user" is concluded only from a complete read, so a call that returns has removed the user if one held the address.
   *
   * @param email - Email address of the candidate to unregister
   * @throws Error if the users cannot be listed, or if deleting the invitations, the grants or the auth user fails.
   */
  async unregisterCandidate(email: string): Promise<void> {
    // 1. Find auth user by email
    const user = await this.findAuthUser(email, 'unregisterCandidate');

    // The invitations go before the user, and when no user exists too. Deleting the user alone leaves a claimed row claimed, so a later run would seed a duplicate of it; and an open row left for the address is claimed by the next user created with that address.
    await this.removeInvitations({ emails: [email], claimedByUserIds: user ? [user.id] : [] });

    if (!user) return; // Already unregistered

    // 2. Delete the identity's grants. Step 3 deletes the auth user and `grants.user_id` is `ON DELETE CASCADE`, so this is belt-and-braces rather than the load-bearing step — it is kept explicit so every removal path in this file reads the same way and none of them depends on remembering which constraint does the work.
    const { error: grantError } = await this.client.from('grants').delete().eq('user_id', user.id);
    if (grantError) throw new Error(`unregisterCandidate: delete grants failed: ${grantError.message}`);

    // 3. Delete auth user
    const { error: deleteError } = await this.client.auth.admin.deleteUser(user.id);
    if (deleteError) throw new Error(`unregisterCandidate: deleteUser failed: ${deleteError.message}`);
  }

  /**
   * Delete all test auth users (emails containing 'openvaa.org' or 'test').
   *
   * Used during teardown to clean up auth state. For each user, deletes the user's invitations in this client's project, the user's grants and the auth user, in the order `unregisterCandidate` uses and for the same reason.
   *
   * @throws Error if the users cannot be listed, before anything is deleted; or an error listing every per-user step that failed, after all users have been processed.
   */
  async deleteAllTestUsers(): Promise<void> {
    const users = await this.listAllUsers('deleteAllTestUsers');

    const testUsers = users.filter((u) => u.email && (u.email.includes('openvaa.org') || u.email.includes('test')));

    // Propagate per-user step errors instead of silently swallowing them.
    // Discarding PostgREST/admin-API errors on every step lets a teardown that fails mid-loop proceed against a corrupted state and produce confusing downstream failures. Collect errors and throw at the end with an aggregated message so partial deletions complete first.
    const errors: Array<{ user: string; step: string; error: unknown }> = [];

    for (const user of testUsers) {
      // The invitations go before the user: deleting the user alone leaves a claimed row claimed.
      await this.removeInvitations({ emails: user.email ? [user.email] : [], claimedByUserIds: [user.id] }).then(
        () => {},
        (invitationsError: unknown) => {
          errors.push({ user: user.id, step: 'delete-invitations', error: String(invitationsError) });
        }
      );

      // Delete the identity's grants. The auth-user deletion below cascades to them anyway; explicit for the same symmetry reason as `unregisterCandidate`.
      const { error: grantsError } = await this.client.from('grants').delete().eq('user_id', user.id);
      if (grantsError) errors.push({ user: user.id, step: 'delete-grants', error: grantsError });

      // Delete auth user
      const { error: deleteError } = await this.client.auth.admin.deleteUser(user.id);
      if (deleteError) errors.push({ user: user.id, step: 'delete-auth-user', error: deleteError });
    }

    if (errors.length > 0) {
      // reason: collect-and-throw at end so partial deletions complete first AND the caller sees the failures (matches `unregisterCandidate`'s throw-on-error pattern in this file).
      throw new Error(`deleteAllTestUsers: ${errors.length} failure(s) — ${JSON.stringify(errors)}`);
    }
  }
}
