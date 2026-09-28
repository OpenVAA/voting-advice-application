import { dynamicSettings, getLocalized, staticSettings, StoredSettingsSchema } from '@openvaa/app-shared';
import { ENTITY_TYPE } from '@openvaa/data';
import { UniversalDataProvider } from '$lib/api/base/universalDataProvider';
import { parseAnswers } from '$lib/api/utils/parseAnswers';
import { constants } from '$lib/utils/constants';
import { supabaseAdapterMixin } from '../supabaseAdapter';
import { bySortOrderThenId } from '../utils/bySortOrderThenId';
import { convertFilterValue } from '../utils/convertFilterValue';
import { fetchAllRows } from '../utils/fetchAllRows';
import { SETTINGS_PARSE_FAILURE_MESSAGE } from '../utils/parseFailureMessages';
import { answersOf, imageOf, parseAnswersColumn, parseImageColumn } from '../utils/parseJsonbColumn';
import { parseWithPartialPreserve } from '../utils/parseOutcome';
import { parseStoredCustomization } from '../utils/parseStoredCustomization';
import { parseStoredImage } from '../utils/storageUrl';
import { toDataObject } from '../utils/toDataObject';
import type { LocalizedChoice, StoredSettings } from '@openvaa/app-shared';
import type {
  AnyEntityVariantData,
  AnyNominationVariantPublicData,
  AnyQuestionVariantData,
  Colors,
  ConstituencyData,
  ConstituencyGroupData,
  ElectionData,
  QuestionCategoryData
} from '@openvaa/data';
import type { DPDataType } from '$lib/api/base/dataTypes';
import type {
  GetAppCustomizationOptions,
  GetConstituenciesOptions,
  GetDataOptionsBase,
  GetElectionsOptions,
  GetEntitiesOptions,
  GetNominationsOptions,
  GetQuestionsOptions
} from '$lib/api/base/getDataOptions.type';
import type { AppCustomization } from '$lib/contexts/app';
import type { TranslationKey } from '$types';
import type { SupabaseAdapterConfig } from '../supabaseAdapter.type';
import type {
  GetQuestionsPayload,
  InternalFlatNomination,
  QuestionCategoryRow,
  QuestionRow
} from './supabaseDataProvider.type';

/**
 * Supabase implementation of the DataProvider.
 * Implements read methods that query Supabase PostgREST and transform the raw database rows into the domain types expected by DataRoot.
 */
export class SupabaseDataProvider extends supabaseAdapterMixin(UniversalDataProvider) {
  /**
   * @param config - This request's own client, its `fetch` and the locales it extracts JSONB in.
   *
   * Declared explicitly rather than inherited: the mixin's construct signature erases its parameter types, so without this signature an adapter built from any argument at all would typecheck.
   */
  constructor(config: SupabaseAdapterConfig) {
    super(config);
  }

  /**
   * Fetch application settings from the `app_settings` table.
   *
   * The row is read with `maybeSingle`, so zero rows is a value rather than an error. A readable row is parsed and returned. Zero rows asks `project_open_for_voters` for this provider's project: `false` returns the shipped `access` defaults with `voterApp: false`, which `(voters)/+layout.svelte` renders as MaintenancePage, and `true` returns `{}`. An RPC error or a non-boolean answer throws. The RPC decides rather than the missing row because nothing creates a settings row for a project, so an open project may have none.
   *
   * Preview is decided by RLS, not by a role check. `authenticated_select_app_settings` returns the row to any grant holder of the project, so a signed-in admin or candidate gets the real voter app; anon, or a signed-in user with no grant, reads zero rows and gets the maintenance page.
   *
   * Limitation: while a project is closed, anon cannot read `app_settings`, so the stored `access.candidateApp` and `access.underMaintenance` are not honoured on the anon candidate and admin login pages. The shipped defaults apply there.
   *
   * The `settings` column is validated with `parseWithPartialPreserve`, so the members the schema accepts survive a malformed sibling, and a value with nothing to preserve answers `{}`. The parse outcome stays inside this method: the voter loaders (for example `(voters)/elections/+page.ts`) merge the result with no status guard, so an outcome object would put `status` and `issues` into the settings.
   *
   * Notification titles and contents are localized before return.
   */
  protected async _getAppSettings(options?: GetDataOptionsBase): Promise<DPDataType['appSettings']> {
    const { data, error } = await this.scopedFrom('app_settings').select('settings').maybeSingle();

    if (error) throw new Error(`getAppSettings: ${error.message}`);

    if (!data) {
      const { data: open, error: rpcError } = await this.supabase.rpc('project_open_for_voters', {
        p_project_id: this.projectId
      });
      if (rpcError) throw new Error(`getAppSettings: ${rpcError.message}`);
      if (open === true) return {};
      if (open === false) {
        // The whole `access` object, because the app context's `mergeAppSettings` replaces settings by root key: a bare `{ voterApp: false }` would drop `candidateApp` and close the candidate app too.
        // reason: `Partial<DynamicSettings>` is a shallow partial, so a partial `access` object does not satisfy it, although the value is merged over the shipped defaults.
        return { access: { ...dynamicSettings.access, voterApp: false } } as DPDataType['appSettings'];
      }
      throw new Error('getAppSettings: project_open_for_voters returned a non-boolean');
    }

    const outcome = parseWithPartialPreserve<StoredSettings>(
      StoredSettingsSchema,
      data?.settings,
      { column: 'app_settings.settings' },
      SETTINGS_PARSE_FAILURE_MESSAGE
    );

    // An absent column and a malformed value with nothing preserved both continue as the empty stored value. The helper has already reported the malformed case.
    const stored: StoredSettings = outcome.value ?? {};
    const settings: Record<string, unknown> = { ...stored };
    const locale = options?.locale ?? this.locale;

    // Localize notification titles and contents.
    // `notifications` is optional in the schema, so this guard is still needed after the parse.
    if (settings.notifications && typeof settings.notifications === 'object') {
      const notifications: Record<string, unknown> = { ...stored.notifications };
      for (const key of ['candidateApp', 'voterApp'] as const) {
        const notif = stored.notifications?.[key];
        if (notif && typeof notif === 'object') {
          notifications[key] = {
            ...notif,
            title: getLocalized(notif.title, locale, this.defaultLocale),
            content: getLocalized(notif.content, locale, this.defaultLocale)
          };
        }
      }
      settings.notifications = notifications;
    }

    // reason: the declared type is wrong in two ways. `Partial<DynamicSettings>` is a shallow partial while the column is a deep partial merged over the shipped defaults, and the localisation above turns `notifications.*.title` and `.content` into plain strings where `NotificationData` declares `LocalizedString`. Aligning it would change a published app-wide contract, so the cast bridges the difference.
    return settings as DPDataType['appSettings'];
  }

  /**
   * Fetch application customization from the `app_settings.customization` JSONB column.
   *
   * The column is validated by {@link parseStoredCustomization}, which drops only the members the schema rejects. The application shape is then derived from the validated value: string fields, translation overrides and FAQ entries are localized, and storage image paths become absolute URLs.
   */
  protected async _getAppCustomization(options?: GetAppCustomizationOptions): Promise<DPDataType['appCustomization']> {
    const { data, error } = await this.scopedFrom('app_settings').select('customization').maybeSingle();

    if (error) throw new Error(`getAppCustomization: ${error.message}`);
    if (!data) return {};

    // The raw value is passed unchanged, so a `null` column parses as absent and emits no failure record.
    const stored = parseStoredCustomization(data?.customization);
    const locale = options?.locale ?? this.locale;
    const supabaseUrl = constants.PUBLIC_SUPABASE_URL;

    const result: AppCustomization = {};

    // Localize string fields
    if (stored.publisherName) {
      result.publisherName = getLocalized(stored.publisherName, locale, this.defaultLocale) ?? undefined;
    }

    // Convert image storage paths to URLs. The images are already validated members of the parsed value, so `parseStoredImage` receives its declared type with no cast.
    result.publisherLogo = parseStoredImage(stored.publisherLogo, supabaseUrl);
    result.poster = parseStoredImage(stored.poster, supabaseUrl);
    result.candPoster = parseStoredImage(stored.candPoster, supabaseUrl);

    // Localize translation overrides (each value is a LocalizedString)
    if (stored.translationOverrides) {
      const localized: Record<string, string> = {};
      for (const [key, val] of Object.entries(stored.translationOverrides)) {
        const resolved = getLocalized(val, locale, this.defaultLocale);
        if (resolved != null) localized[key] = resolved;
      }
      // reason: `TranslationKey` is a generated frontend union while the stored keys are arbitrary strings, so this narrowing cannot be decided here and no schema can validate it.
      result.translationOverrides = localized as Record<TranslationKey, string>;
    }

    // Localize FAQ entries
    if (stored.candidateAppFAQ) {
      result.candidateAppFAQ = stored.candidateAppFAQ.map((faq) => ({
        question: getLocalized(faq.question, locale, this.defaultLocale) ?? '',
        answer: getLocalized(faq.answer, locale, this.defaultLocale) ?? ''
      }));
    }

    return result;
  }

  /**
   * Fetch elections with their constituency group join data.
   * Maps DB columns to ElectionData properties (date, round, subtype).
   */
  protected async _getElectionData(options?: GetElectionsOptions): Promise<DPDataType['elections']> {
    const data = await fetchAllRows(
      (from, to) => {
        let query = this.scopedFrom('elections')
          .select('*, election_constituency_groups(constituency_group_id)')
          .order('sort_order')
          .order('id');
        if (options?.id) {
          query = Array.isArray(options.id) ? query.in('id', options.id) : query.eq('id', options.id);
        }
        return query.range(from, to);
      },
      { pageSize: staticSettings.dataAdapter.pageSize, label: 'getElectionData' }
    );

    const locale = options?.locale ?? this.locale;
    const supabaseUrl = constants.PUBLIC_SUPABASE_URL;

    return data.map((row) => {
      const obj = toDataObject(row as Record<string, unknown>, locale, this.defaultLocale);
      return {
        ...obj,
        date: row.election_date ? String(row.election_date) : undefined,
        round: row.current_round ?? undefined,
        // `subtype` is read from the `subtype` column only. `election_type` holds the nomination shape, which is a separate axis.
        subtype: row.subtype ?? undefined,
        image: imageOf(parseImageColumn(row.image, supabaseUrl, { column: 'elections.image', id: row.id })),
        constituencyGroupIds: (
          (row.election_constituency_groups as Array<{ constituency_group_id: string }>) ?? []
        ).map((jt) => jt.constituency_group_id)
      } as ElectionData;
    });
  }

  /**
   * Fetch constituency groups (with their member constituency IDs) and all constituencies.
   * Keywords are localized and split by comma into string arrays.
   */
  protected async _getConstituencyData(options?: GetConstituenciesOptions): Promise<DPDataType['constituencies']> {
    const locale = options?.locale ?? this.locale;
    const supabaseUrl = constants.PUBLIC_SUPABASE_URL;

    // 1. Fetch constituency groups with their constituency join rows
    const groupData = await fetchAllRows(
      (from, to) => {
        let groupQuery = this.scopedFrom('constituency_groups')
          .select('*, constituency_group_constituencies(constituency_id)')
          .order('sort_order')
          .order('id');
        if (options?.id) {
          groupQuery = Array.isArray(options.id) ? groupQuery.in('id', options.id) : groupQuery.eq('id', options.id);
        }
        return groupQuery.range(from, to);
      },
      { pageSize: staticSettings.dataAdapter.pageSize, label: 'getConstituencyData (groups)' }
    );

    const groups = groupData.map((row) => {
      const obj = toDataObject(row as Record<string, unknown>, locale, this.defaultLocale);
      return {
        ...obj,
        image: imageOf(parseImageColumn(row.image, supabaseUrl, { column: 'constituency_groups.image', id: row.id })),
        constituencyIds: ((row.constituency_group_constituencies as Array<{ constituency_id: string }>) ?? []).map(
          (jt) => jt.constituency_id
        )
      } as ConstituencyGroupData;
    });

    // 2. Fetch all constituencies (not filtered by id -- may belong to groups via parent chains)
    const constData = await fetchAllRows(
      (from, to) => this.scopedFrom('constituencies').select('*').order('sort_order').order('id').range(from, to),
      { pageSize: staticSettings.dataAdapter.pageSize, label: 'getConstituencyData (constituencies)' }
    );

    const constituencies = constData.map((row) => {
      const obj = toDataObject(row as Record<string, unknown>, locale, this.defaultLocale);
      // Keywords: localize then split by comma+optional whitespace.
      // reason: `constituencies.keywords` is a bare locale object with no stored schema, so it is asserted rather than validated.
      const rawKeywords = row.keywords as Record<string, string> | null;
      const localizedKeywords = getLocalized(rawKeywords, locale, this.defaultLocale);
      const keywords = localizedKeywords ? localizedKeywords.split(/,\s*/).filter(Boolean) : undefined;
      return {
        ...obj,
        image: imageOf(parseImageColumn(row.image, supabaseUrl, { column: 'constituencies.image', id: row.id })),
        keywords
      } as ConstituencyData;
    });

    return { groups, constituencies };
  }

  /**
   * Fetch nominations via the `get_nominations` RPC which joins nominations with all 4 entity tables. Deduplicates entities client-side using a Map keyed by entity_id.
   * Candidate entities include `firstName` and `lastName` but no `organizationId`: a candidate's organization is stated only by the `parent_nomination_id` edge, which the reverse fill in this method walks.
   */
  protected async _getNominationData(options?: GetNominationsOptions): Promise<DPDataType['nominations']> {
    const locale = options?.locale ?? this.locale;
    const supabaseUrl = constants.PUBLIC_SUPABASE_URL;

    // The `get_nominations` RPC accepts a single uuid per election and constituency.
    // When the caller passes arrays (the multi-election voter flow in `(voters)/(located)/+layout.ts` threads the URL's `electionId` and `constituencyId` arrays through), fan out into one call per (election, constituency) pair and concatenate the results. Reading only the first id would drop the other elections' nominations and break the multi-election partial-coverage dialog. The two-election topologies under `tests/tests/specs/perm/` (`perm-2e-shared`, `perm-2e-asymmetric`) cover this.
    const electionIds = convertFilterValue(options?.electionId);
    const constituencyIds = convertFilterValue(options?.constituencyId);

    const includeUnconfirmed = options?.includeUnconfirmed ?? false;
    // The election round is a scalar rather than a `FilterValue`, so it adds no level to the fan-out and is passed through unchanged.
    const electionRound = options?.electionRound;
    // Each call of the fan-out is paged on its own. No `.order()` is added: the RPC already orders by `sort_order NULLS LAST, id`, a unique key, so its page boundaries are stable. The helper throws on the first failing page with the `getNominationData` prefix, which `Promise.all` propagates.
    const calls = electionIds.flatMap((eid) =>
      constituencyIds.map((cid) =>
        fetchAllRows(
          (from, to) =>
            this.supabase
              .rpc('get_nominations', {
                // `p_project_id` is required and has no SQL default, so every call passes it, including the unfiltered one.
                p_project_id: this.projectId,
                // The RPC types both filters as `string | undefined`, so null becomes undefined: omitting the key applies the SQL `DEFAULT NULL`, the same as passing null.
                p_election_id: eid ?? undefined,
                p_constituency_id: cid ?? undefined,
                p_include_unconfirmed: includeUnconfirmed,
                p_election_round: electionRound
              })
              .range(from, to),
          { pageSize: staticSettings.dataAdapter.pageSize, label: 'getNominationData' }
        )
      )
    );
    const results = await Promise.all(calls);
    const data = results.flat();

    // Deduplicate entities by `entity_id`. Nominations have unique (election_id, constituency_id) keys, so the fan-out cannot duplicate them; the Set guards against it anyway.
    const entityMap = new Map<string, AnyEntityVariantData>();
    const nominations: Array<AnyNominationVariantPublicData> = [];
    const seenNominationIds = new Set<string>();

    // Build nomination_id → entity_type map for parent-type derivation.
    // `nominations` stores `parent_nomination_id` but not the parent's entity type, so it is looked up from the parent. The `Nomination` constructor in `@openvaa/data` throws when `parentNominationId` is set without `parentNominationType`, so both must be set. `get_nominations` returns parents and children in the same fan-out, so the lookup is in memory.
    const nominationTypeById = new Map<string, string>();
    for (const row of data) {
      nominationTypeById.set(row.id, row.entity_type);
    }

    for (const row of data) {
      if (seenNominationIds.has(row.id)) continue;
      seenNominationIds.add(row.id);
      // Build nomination object from nomination-level columns
      const parentNominationId = row.parent_nomination_id;
      const parentNominationType =
        parentNominationId != null ? (nominationTypeById.get(parentNominationId) ?? null) : null;
      const nomRow = {
        id: row.id,
        name: row.name,
        short_name: row.short_name,
        info: row.info,
        color: row.color,
        image: row.image,
        sort_order: row.sort_order,
        subtype: row.subtype,
        custom_data: row.custom_data,
        election_id: row.election_id,
        constituency_id: row.constituency_id,
        election_round: row.election_round,
        election_symbol: row.election_symbol,
        parent_nomination_id: parentNominationId ?? null
      };
      const nomObj = toDataObject(nomRow, locale, this.defaultLocale);

      // Enforce the `Nomination` invariant that `parentNominationId` and `parentNominationType` are both set or both absent.
      // `mapRow` has no column for `parentNominationType`, so it is set here from the in-memory lookup. A parent outside this fan-out's result (for example a cross-constituency parent the RPC filtered out) cannot be resolved, so its id is dropped and the constructor does not throw.
      const nominationOut: Record<string, unknown> = {
        ...nomObj,
        entityType: row.entity_type,
        entityId: row.entity_id,
        image: imageOf(parseImageColumn(row.image, supabaseUrl, { column: 'nominations.image', id: row.id }))
      };
      if (parentNominationId != null && parentNominationType != null) {
        nominationOut.parentNominationType = parentNominationType;
      } else {
        // Either no parent (default) or unresolvable parent — clear the id to keep the invariant intact.
        nominationOut.parentNominationId = null;
      }
      nominations.push(nominationOut as AnyNominationVariantPublicData);

      // Extract and deduplicate entity
      const entityId = row.entity_id;
      if (entityId && !entityMap.has(entityId)) {
        const entityRow = {
          id: entityId,
          name: row.entity_name,
          short_name: row.entity_short_name,
          info: row.entity_info,
          color: row.entity_color,
          image: row.entity_image,
          sort_order: row.entity_sort_order,
          subtype: row.entity_subtype,
          custom_data: row.entity_custom_data
        };
        const entityObj = toDataObject(entityRow, locale, this.defaultLocale);
        const entityType = row.entity_type;

        // The shared DataObject fields, typed explicitly, plus the JSONB runtime guards for image and answers. Building a variant-specific object below lets the discriminated `AnyEntityVariantData` union resolve structurally, with no cast.
        const base = {
          id: entityId,
          name: entityObj.name as string | null | undefined,
          shortName: entityObj.shortName as string | null | undefined,
          info: entityObj.info as string | null | undefined,
          color: entityObj.color as Colors | null | undefined,
          order: entityObj.order as number | null | undefined,
          subtype: entityObj.subtype as string | null | undefined,
          customData: entityObj.customData as object | null | undefined,
          image: imageOf(
            parseImageColumn(row.entity_image, supabaseUrl, {
              column: 'get_nominations.entity_image',
              id: entityId
            })
          ),
          answers: parseAnswers(
            answersOf(
              parseAnswersColumn(row.entity_answers, { column: 'get_nominations.entity_answers', id: entityId })
            ) ?? null,
            locale
          )
        };

        let entity: AnyEntityVariantData;
        if (entityType === ENTITY_TYPE.Candidate) {
          // `entity_first_name` and `entity_last_name` come through a LEFT JOIN, so their type is nullable. On a candidate row they are set: `nominations.entity_type` is generated from the one entity FK that is set, and `get_nominations` filters out rows whose entity is not visible. TypeScript cannot see that, so a missing name falls back to the data model's default `''` rather than rendering "null".
          entity = {
            ...base,
            type: ENTITY_TYPE.Candidate,
            firstName: row.entity_first_name ?? '',
            lastName: row.entity_last_name ?? ''
          };
        } else if (entityType === ENTITY_TYPE.Organization) {
          entity = { ...base, type: ENTITY_TYPE.Organization, name: base.name ?? '' };
        } else if (entityType === ENTITY_TYPE.Faction) {
          entity = { ...base, type: ENTITY_TYPE.Faction };
        } else {
          entity = { ...base, type: ENTITY_TYPE.Alliance };
        }

        entityMap.set(entityId, entity);
      }
    }

    // Reverse-fill the parent → children id arrays. The nomination constructors populate these only for nested input (e.g. `org.data.candidates = [...]`), while the flat schema sets only the child → parent edge (`parent_nomination_id`). Without the fill, `OrganizationNomination.candidateNominationIds` is undefined, `hasCandidates` is false, and the default `hideIfMissingAnswers.candidate` setting hides every organization. Every edge type is filled: candidates of organizations and factions, factions of organizations, and organizations of alliances.
    const childIdsByParentAndType = new Map<string, Map<string, Array<string>>>();
    for (const child of nominations as Array<InternalFlatNomination>) {
      if (!child.parentNominationId) continue;
      let typeMap = childIdsByParentAndType.get(child.parentNominationId);
      if (!typeMap) {
        typeMap = new Map();
        childIdsByParentAndType.set(child.parentNominationId, typeMap);
      }
      let ids = typeMap.get(child.entityType);
      if (!ids) {
        ids = [];
        typeMap.set(child.entityType, ids);
      }
      ids.push(child.id);
    }
    for (const parent of nominations as Array<InternalFlatNomination>) {
      const typeMap = childIdsByParentAndType.get(parent.id);
      if (!typeMap) continue;
      const candIds = typeMap.get(ENTITY_TYPE.Candidate);
      const factionIds = typeMap.get(ENTITY_TYPE.Faction);
      const orgIds = typeMap.get(ENTITY_TYPE.Organization);
      if (candIds && (parent.entityType === ENTITY_TYPE.Organization || parent.entityType === ENTITY_TYPE.Faction)) {
        parent.candidateNominationIds = candIds;
      }
      if (factionIds && parent.entityType === ENTITY_TYPE.Organization) {
        parent.factionNominationIds = factionIds;
      }
      if (orgIds && parent.entityType === ENTITY_TYPE.Alliance) {
        parent.organizationNominationIds = orgIds;
      }
    }

    return {
      nominations,
      entities: Array.from(entityMap.values())
    };
  }

  /**
   * Fetch entity data (candidates and/or organizations) from their respective tables.
   * Sets the `type` field based on entity table, processes answers through parseAnswers, and converts storage image paths to absolute URLs.
   */
  protected async _getEntityData(options?: GetEntitiesOptions): Promise<DPDataType['entities']> {
    const locale = options?.locale ?? this.locale;
    const supabaseUrl = constants.PUBLIC_SUPABASE_URL;

    // Determine which entity tables to query based on entityType filter
    const types: Array<{ table: 'candidates' | 'organizations'; entityType: string }> = [];
    if (!options?.entityType || options.entityType === ENTITY_TYPE.Candidate) {
      types.push({ table: 'candidates', entityType: ENTITY_TYPE.Candidate });
    }
    if (!options?.entityType || options.entityType === ENTITY_TYPE.Organization) {
      types.push({ table: 'organizations', entityType: ENTITY_TYPE.Organization });
    }

    const results: Array<AnyEntityVariantData> = [];

    for (const { table, entityType } of types) {
      const data = await fetchAllRows(
        (from, to) => {
          let query = this.scopedFrom(table).select('*').order('sort_order').order('id');
          if (options?.id) {
            query = Array.isArray(options.id) ? query.in('id', options.id) : query.eq('id', options.id);
          }
          return query.range(from, to);
        },
        { pageSize: staticSettings.dataAdapter.pageSize, label: `getEntityData (${table})` }
      );

      for (const row of data) {
        const obj = toDataObject(row as Record<string, unknown>, locale, this.defaultLocale);
        results.push({
          ...obj,
          type: entityType,
          image: imageOf(parseImageColumn(row.image, supabaseUrl, { column: `${table}.image`, id: row.id })),
          answers: parseAnswers(
            answersOf(parseAnswersColumn(row.answers, { column: `${table}.answers`, id: row.id })) ?? null,
            locale
          )
        } as AnyEntityVariantData);
      }
    }

    return results;
  }

  /**
   * Fetch question categories and questions via the `get_questions` RPC, which returns both result sets in one jsonb payload already filtered by election, constituency and election round in SQL. Localizes choice labels for choice-type questions and maps `category_type` to `type` on categories.
   */
  protected async _getQuestionData(options?: GetQuestionsOptions): Promise<DPDataType['questions']> {
    const locale = options?.locale ?? this.locale;
    const supabaseUrl = constants.PUBLIC_SUPABASE_URL;

    // The `get_questions` RPC accepts a single uuid per election and constituency, so arrays from the caller fan out into one call per (election, constituency) pair and the payloads are merged. Arrays do reach this read: `candidate/(protected)/+layout.server.ts` derives `electionId` from the candidate's own nominations, which span two elections for a candidate nominated in both, and `(voters)/(located)/+layout.ts` threads the URL's multi-valued `electionId` through. Reading only the first id would drop the other election's scoped questions.
    const electionIds = convertFilterValue(options?.electionId);
    const constituencyIds = convertFilterValue(options?.constituencyId);
    // The election round is a scalar rather than a `FilterValue`, so it adds no level to the fan-out and is passed through unchanged.
    const electionRound = options?.electionRound;

    // Not paged: `get_questions` returns one aggregated jsonb row per call, so a row cap cannot truncate it.
    const results = await Promise.all(
      electionIds.flatMap((eid) =>
        constituencyIds.map((cid) =>
          this.supabase.rpc('get_questions', {
            // `p_project_id` is required and has no SQL default, so every call passes it, including the unfiltered one.
            p_project_id: this.projectId,
            // The RPC types both filters as `string | undefined`, so null becomes undefined: omitting the key applies the SQL `DEFAULT NULL`, the same as passing null.
            p_election_id: eid ?? undefined,
            p_constituency_id: cid ?? undefined,
            p_election_round: electionRound
          })
        )
      )
    );
    const firstError = results.find((r) => r.error)?.error;
    if (firstError) throw new Error(`getQuestionData: ${firstError.message}`);

    // Union the payloads keyed by row id, so a row returned by several calls appears once. This gives OR semantics over the id arrays.
    const categoryRows = new Map<string, QuestionCategoryRow>();
    const questionRows = new Map<string, QuestionRow>();
    for (const { data } of results) {
      // reason: the RPC is declared `RETURNS jsonb`, so its generated type is the opaque `Json`; this single narrowing is the adapter's trust boundary for the payload.
      const payload = data as GetQuestionsPayload | null;
      for (const row of payload?.categories ?? []) categoryRows.set(row.id, row);
      for (const row of payload?.questions ?? []) questionRows.set(row.id, row);
    }

    const categories = [...categoryRows.values()].sort(bySortOrderThenId).map((row) => {
      const obj = toDataObject(row, locale, this.defaultLocale);
      return {
        ...obj,
        // QuestionCategoryData uses 'type' not 'categoryType'
        type: row.category_type ?? 'opinion',
        image: imageOf(parseImageColumn(row.image, supabaseUrl, { column: 'question_categories.image', id: row.id }))
      } as QuestionCategoryData;
    });

    // The RPC filters categories and questions independently on their own columns, so an unscoped question under a scoped category outlives its category. `Question.category` resolves through `DataRoot.getQuestionCategory`, which throws `DataNotFoundError` when the category is absent, so such an orphan is dropped here.
    const questions = [...questionRows.values()]
      .filter((row) => categoryRows.has(row.category_id))
      .sort(bySortOrderThenId)
      .map((row) => {
        const obj = toDataObject(row, locale, this.defaultLocale);
        // Localize choice labels for choice-type questions.
        // reason: `choices` has no stored schema, so the published `LocalizedChoice` shape is asserted; the `Array.isArray` guard is the runtime check.
        let choices = row.choices as Array<LocalizedChoice> | null;
        if (choices && Array.isArray(choices)) {
          choices = choices.map((choice) => ({
            ...choice,
            label:
              typeof choice.label === 'object' && choice.label !== null
                ? (getLocalized(choice.label, locale, this.defaultLocale) ?? '')
                : choice.label
          }));
        }

        // `allow_open` maps to a top-level `allowOpen`, but frontend consumers (the candidate question editor, EntityOpinions) read `customData.allowOpen`, so the column is bridged into customData. An explicit `custom_data.allowOpen` value takes precedence over the column.
        // The annotation keeps the passthrough keys (min, max and others) indexable as `unknown`; the inferred spread type would be only `{ allowOpen: boolean }`.
        const customData: { allowOpen: boolean } & Record<string, unknown> = {
          allowOpen: (row.allow_open as boolean | null) ?? true,
          ...((obj.customData as Record<string, unknown> | undefined) ?? {})
        };

        // `NumberQuestionData.min` and `max` have no column: a number question's range is authored in `custom_data.{ min, max }`, which the `NumberQuestion` getters read and which gates `isMatchable`. They are lifted to top-level fields for number rows only, and only when they are numbers: other JSONB values are dropped rather than coerced, and absent keys are omitted rather than set to undefined, so the zero-range check never fires on them.
        const numberRange =
          row.type === 'number'
            ? {
                ...(typeof customData.min === 'number' ? { min: customData.min } : {}),
                ...(typeof customData.max === 'number' ? { max: customData.max } : {})
              }
            : {};

        // The discriminant (`type`) and the identity fields (`id`, `name`, `categoryId`) are named explicitly from the typed row and the localized `obj`, rather than left to the opaque `...obj` spread, so the object overlaps the discriminated `AnyQuestionVariantData` union. `type` is the question_type enum, and a missing localized `name` falls back to the data model's default `''`.
        return {
          ...obj,
          id: obj.id as string,
          type: row.type,
          name: (obj.name as string | null) ?? '',
          categoryId: obj.categoryId as string,
          choices,
          customData,
          ...numberRange,
          image: imageOf(parseImageColumn(row.image, supabaseUrl, { column: 'questions.image', id: row.id }))
        } as AnyQuestionVariantData;
      });

    return { categories, questions };
  }
}
