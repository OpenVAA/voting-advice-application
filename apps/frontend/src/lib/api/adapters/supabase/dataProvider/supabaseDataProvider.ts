import { getLocalized, StoredCustomizationSchema, StoredSettingsSchema } from '@openvaa/app-shared';
import { ENTITY_TYPE } from '@openvaa/data';
import { UniversalDataProvider } from '$lib/api/base/universalDataProvider';
import { parseAnswers } from '$lib/api/utils/parseAnswers';
import { constants } from '$lib/utils/constants';
import { supabaseAdapterMixin } from '../supabaseAdapter';
import { convertFilterValue } from '../utils/convertFilterValue';
import { answersOf, imageOf, parseAnswersColumn, parseImageColumn } from '../utils/parseJsonbColumn';
import { parseWithPartialPreserve } from '../utils/parseOutcome';
import { parseStoredImage } from '../utils/storageUrl';
import { toDataObject } from '../utils/toDataObject';
import type { LocalizedChoice, StoredCustomization, StoredSettings } from '@openvaa/app-shared';
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
import type { Json, Tables } from '@openvaa/supabase-types';
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
import type { InternalFlatNomination } from './supabaseDataProvider.type';

type QuestionCategoryRow = Tables<'question_categories'>;
type QuestionRow = Tables<'questions'>;

/**
 * The single jsonb value the `get_questions` RPC returns. Both keys are always arrays — `[]` rather than `null` when empty — and each entry is a raw table row, because the function aggregates `to_jsonb(qc)` / `to_jsonb(q)` and therefore emits the same snake_case columns a `select('*')` returned.
 */
type GetQuestionsPayload = {
  categories: Array<QuestionCategoryRow>;
  questions: Array<QuestionRow>;
};

/**
 * Order merged rows the way `get_questions` orders each individual call's result: by `sort_order` with nulls last, then by id. A single-call read already arrives in this order; the fan-out's union has to reapply it so a multi-election read is not served in call order.
 */
function bySortOrderThenId(
  a: { id: string; sort_order: number | null },
  b: { id: string; sort_order: number | null }
): number {
  if (a.sort_order !== b.sort_order) {
    if (a.sort_order == null) return 1;
    if (b.sort_order == null) return -1;
    return a.sort_order - b.sort_order;
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * The event name a customization parse failure is reported under.
 *
 * A CONSTANT, never an interpolation: a downstream sink keys events on a stable message and every varying value belongs in the attribute bag instead (decision **C4** NOTE 1). It therefore has to be right once — changing it later is a breaking change for any sink that keyed on it.
 *
 * It deliberately makes no claim about what was or was not kept. Under decision **A2** the members zod flagged are removed and the remainder is re-parsed, so how much survived varies per value; the `preserved` attribute on the record carries that, and the message stays an event name.
 */
const CUSTOMIZATION_PARSE_FAILURE_MESSAGE = 'A stored app customization did not match its schema.';

/**
 * The event name a settings parse failure is reported under.
 *
 * Same contract as {@link CUSTOMIZATION_PARSE_FAILURE_MESSAGE}. The message this replaced said the read was falling back to empty settings, which under partial preserve is usually false — the members zod accepts are kept and only their malformed siblings go.
 */
const SETTINGS_PARSE_FAILURE_MESSAGE = 'Stored application settings did not match their schema.';

/**
 * Validate the stored `app_settings.customization` value, keeping the members zod accepts when one of the others is malformed.
 *
 * A plain whole-object `safeParse` would discard the publisher name over one bad image path, which is a visible regression for a column that is pure presentation. The retry that avoids this used to be implemented here, for this schema alone; decision **A2(a)** moved it into `parseWithPartialPreserve`, so this function is now a CALLER of the shared seam and every other read path inherits the same behaviour.
 *
 * Delegating also closed the hole this docstring used to record as a known limitation. zod reports an unrecognised TOP-LEVEL key at the empty path, so a rejected-member derivation that reads `issue.path[0]` names nothing and the retry re-parses an unchanged value; the shared helper reads the refused names off `issue.keys` instead, so such a key is dropped BY NAME and its valid siblings survive (decision **A2** NOTE, fact 3). Ledger row 2 measures that closure, blind and then catching.
 *
 * The failure branch never throws: the last resort is the empty customization the `PGRST116` branch already returns. The record is emitted by the shared helper at `error` (decision **C5(b)**) and carries the zod issue PATHS and the refused KEY NAMES, never the offending value (T-157-17).
 * @param raw - The unvalidated JSONB value read from the column.
 * @returns The stored customization, with any members the schema rejected removed.
 */
function parseStoredCustomization(raw: Json | undefined): StoredCustomization {
  const outcome = parseWithPartialPreserve<StoredCustomization>(
    StoredCustomizationSchema,
    raw,
    { column: 'app_settings.customization' },
    CUSTOMIZATION_PARSE_FAILURE_MESSAGE
  );
  // `absent` and a malformed value with nothing preserved both arrive here as no value, and both answer with the empty customization the no-rows branch returns. The distinction is not lost by the collapse — it was already reported on the record, and `_getAppCustomization` returns `AppCustomization`, which has no third state to carry it into.
  return outcome.value ?? {};
}

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
   * The `settings` JSONB column is validated through `parseWithPartialPreserve` before any field is read, so the members zod accepts survive a malformed sibling and one unrecognised key no longer takes every availability gate down with it (decision **A2**). A value with nothing to preserve still answers with the same `{}` the no-rows branch returns rather than throwing (T-157-04, T-157-06).
   *
   * The three-state outcome is INTERNAL to this method and the public return type is unchanged, deliberately: four voter loaders merge this result with no `instanceof Error` guard and no status guard (`(voters)/elections/+page.ts` and three siblings), so an outcome crossing the boundary would spread `status` and `issues` into the application settings object (pitfall P1).
   *
   * Notification title/content fields are localized before return, which is the one way the returned value diverges from the stored one.
   */
  protected async _getAppSettings(options?: GetDataOptionsBase): Promise<DPDataType['appSettings']> {
    const { data, error } = await this.supabase.from('app_settings').select('settings').limit(1).single();

    if (error) {
      if (error.code === 'PGRST116') return {}; // No rows -- return empty settings
      throw new Error(`getAppSettings: ${error.message}`);
    }

    const outcome = parseWithPartialPreserve<StoredSettings>(
      StoredSettingsSchema,
      data?.settings,
      { column: 'app_settings.settings' },
      SETTINGS_PARSE_FAILURE_MESSAGE
    );

    // The outcome is consumed HERE, inside the method that produced it. `absent` — the column held nothing — and a malformed value with nothing preserved both continue on the empty stored value, which is what the `PGRST116` branch above returns; the helper already emitted the record for the second of those and, correctly, none for the first.
    const stored: StoredSettings = outcome.value ?? {};
    const settings: Record<string, unknown> = { ...stored };
    const locale = options?.locale ?? this.locale;

    // Localize notification title and content fields.
    // The schema makes `notifications` optional rather than provably present, so this runtime guard is still doing work after the parse and is deliberately kept.
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

    // reason: class 4 — the declared return type is wrong in two ways this plan does not own. `Partial<DynamicSettings>` is a SHALLOW partial, but the column is a deep partial merged over the shipped defaults, and the localisation above replaces `notifications.*.title` and `.content` with plain strings that `NotificationData` types as `LocalizedString`. Aligning the declared type is an app-wide change to a published contract, so the divergence is bridged here and named rather than hidden.
    return settings as DPDataType['appSettings'];
  }

  /**
   * Fetch application customization from the `app_settings.customization` JSONB column.
   *
   * The column is validated against `StoredCustomizationSchema` before any field is read; see {@link parseStoredCustomization} for the per-member degradation the failure branch performs.
   * Every field below then DERIVES the application shape from the validated stored one: string fields are localized, storage image paths become absolute URLs, and translation overrides and FAQ entries are localized.
   */
  protected async _getAppCustomization(options?: GetAppCustomizationOptions): Promise<DPDataType['appCustomization']> {
    const { data, error } = await this.supabase.from('app_settings').select('customization').limit(1).single();

    if (error) {
      if (error.code === 'PGRST116') return {};
      throw new Error(`getAppCustomization: ${error.message}`);
    }

    // The raw value is handed over unsubstituted: a `null` column is `absent` rather than an empty object that happens to parse, which is the distinction requirement **D8** exists for and the reason no record is emitted for it.
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
      // reason: class 3 — `TranslationKey` is a generated frontend union while the stored keys are arbitrary strings, so this narrowing is not decidable at this seam and no schema can validate it.
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
    let query = this.supabase
      .from('elections')
      .select('*, election_constituency_groups(constituency_group_id)')
      .order('sort_order');

    if (options?.id) {
      query = Array.isArray(options.id) ? query.in('id', options.id) : query.eq('id', options.id);
    }

    const { data, error } = await query;
    if (error) throw new Error(`getElectionData: ${error.message}`);

    const locale = options?.locale ?? this.locale;
    const supabaseUrl = constants.PUBLIC_SUPABASE_URL;

    return (data ?? []).map((row) => {
      const obj = toDataObject(row as Record<string, unknown>, locale, this.defaultLocale);
      return {
        ...obj,
        date: row.election_date ? String(row.election_date) : undefined,
        round: row.current_round ?? undefined,
        subtype: row.election_type ?? row.subtype ?? undefined,
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
    let groupQuery = this.supabase
      .from('constituency_groups')
      .select('*, constituency_group_constituencies(constituency_id)')
      .order('sort_order');

    if (options?.id) {
      groupQuery = Array.isArray(options.id) ? groupQuery.in('id', options.id) : groupQuery.eq('id', options.id);
    }

    const { data: groupData, error: groupError } = await groupQuery;
    if (groupError) throw new Error(`getConstituencyData (groups): ${groupError.message}`);

    const groups = (groupData ?? []).map((row) => {
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
    const { data: constData, error: constError } = await this.supabase
      .from('constituencies')
      .select('*')
      .order('sort_order');

    if (constError) throw new Error(`getConstituencyData (constituencies): ${constError.message}`);

    const constituencies = (constData ?? []).map((row) => {
      const obj = toDataObject(row as Record<string, unknown>, locale, this.defaultLocale);
      // Keywords: localize then split by comma+optional whitespace.
      // reason: class 1 residual — a typed-JSONB read with no schema. `157-02` wrote schemas for the four columns criterion 1 names plus the send-email payload; `constituencies.keywords` is a bare locale object and was not among them, so it is asserted rather than validated until one exists.
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
   * Candidate entities include firstName, lastName, organizationId.
   */
  protected async _getNominationData(options?: GetNominationsOptions): Promise<DPDataType['nominations']> {
    const locale = options?.locale ?? this.locale;
    const supabaseUrl = constants.PUBLIC_SUPABASE_URL;

    // The `get_nominations` RPC accepts a single uuid per election/constituency.
    // When the caller passes arrays (multi-election voter flow — see `(voters)/(located)/+layout.ts` which threads URL `electionId` / `constituencyId` arrays through verbatim), fan out into one RPC per (election, constituency) pair and concatenate the results. Picking `[0]` only — the prior shape — silently dropped the other elections' nominations and broke the multi-election partial-coverage dialog gate. The spec that originally caught that regression no longer exists; its assertions were absorbed into the voter specs under `tests/tests/specs/voter/` and the two-election topologies under `tests/tests/specs/perm/` (`perm-2e-shared`, `perm-2e-asymmetric`), which is where a reintroduced `[0]` pick surfaces today.
    const electionIds = convertFilterValue(options?.electionId);
    const constituencyIds = convertFilterValue(options?.constituencyId);

    const includeUnconfirmed = options?.includeUnconfirmed ?? false;
    // The election round is a scalar rather than a `FilterValue`, so it adds no level to the fan-out and is passed through unchanged.
    const electionRound = options?.electionRound;
    const calls = electionIds.flatMap((eid) =>
      constituencyIds.map((cid) =>
        this.supabase.rpc('get_nominations', {
          // The regenerated RPC types both filters as `string | undefined`; the fan-out locals are `string | null`. Coercing null → undefined omits the key, applying the SQL DEFAULT NULL — semantically identical to passing null (behavior-neutral).
          p_election_id: eid ?? undefined,
          p_constituency_id: cid ?? undefined,
          p_include_unconfirmed: includeUnconfirmed,
          p_election_round: electionRound
        })
      )
    );
    const results = await Promise.all(calls);
    const firstError = results.find((r) => r.error)?.error;
    if (firstError) throw new Error(`getNominationData: ${firstError.message}`);
    const data = results.flatMap((r) => r.data ?? []);

    // Deduplicate entities using a Map keyed by entity_id; nominations have unique (election_id, constituency_id) keys so the fan-out cannot produce nomination duplicates, but guard with a Set to be safe.
    const entityMap = new Map<string, AnyEntityVariantData>();
    const nominations: Array<AnyNominationVariantPublicData> = [];
    const seenNominationIds = new Set<string>();

    // Build nomination_id → entity_type map for parent-type derivation.
    // The schema's `nominations` table stores `parent_nomination_id` but the parent's entity_type is not denormalized into the child row — it must be looked up from the parent. The Nomination base class (packages/data/src/objects/nominations/base/nomination.ts:38-45) throws if `parentNominationId` is set without a matching `parentNominationType`, so we must populate both. The `get_nominations` RPC returns ALL relevant nominations (parents and children) in the same fan-out, so this lookup is purely in-memory and adds no DB round-trips.
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

      // Enforce the Nomination "either both or neither" invariant (packages/data/src/objects/nominations/base/nomination.ts:38-45).
      // mapRow() doesn't synthesize parentNominationType (no column map entry); we set it here based on the in-memory parent lookup. If the parent's entity_type can't be resolved (parent not in this fan-out's result set — e.g., a cross-constituency parent that the RPC filtered out), we DROP parentNominationId so the constructor doesn't throw.
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

        // Explicitly-typed shared DataObject fields (localized name/short_name/info + mapped order/customData from toDataObject) plus the JSONB runtime guards for image and answers. Building a variant-specific object below lets the discriminated `AnyEntityVariantData` union resolve structurally — no union-suppressing cast.
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
          // `entity_first_name`/`entity_last_name` project `candidates` through a LEFT JOIN, so they are null on every organization/faction/alliance row and the RPC's return type is nullable. On THIS branch the join is proven to have resolved — `nominations.entity_type` is GENERATED from whichever FK is set under `CHECK (num_nonnulls(candidate_id, organization_id, faction_id, alliance_id) = 1)`, so an `entity_type` of candidate means the other three joins cannot match, and the RPC's own `COALESCE(c.id, o.id, f.id, a.id) IS NOT NULL` filter then guarantees the candidates row was visible. That chain lives in SQL where TypeScript cannot see it, so rather than assert it away we fall back to the data model's smart default for a missing name — the same `?? ''` used for the organization branch below — which keeps a broken invariant rendering as an empty name instead of the string "null".
          entity = {
            ...base,
            type: ENTITY_TYPE.Candidate,
            firstName: row.entity_first_name ?? '',
            lastName: row.entity_last_name ?? '',
            organizationId: row.entity_organization_id
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

    // Reverse-fill parent → children id arrays. The data layer's nomination constructors only auto-populate these when nominations arrive in the nested form (e.g. `org.data.candidates = [...]`). Our flat schema only sets the child→parent edge (`parent_nomination_id`); without the reverse fill, `OrganizationNomination.candidateNominationIds` is undefined, `hasCandidates` is false, and `nominationAndQuestionStore` filters every org out under the default `hideIfMissingAnswers.candidate` setting — surfaced as "parties tab is empty" during manual smoke. The full child→parent → grandparent walk also covers candidate→faction→organization→alliance and faction→organization edges.
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
      let query = this.supabase.from(table).select('*').order('sort_order');
      if (options?.id) {
        query = Array.isArray(options.id) ? query.in('id', options.id) : query.eq('id', options.id);
      }
      const { data, error } = await query;
      if (error) throw new Error(`getEntityData (${table}): ${error.message}`);

      for (const row of data ?? []) {
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

    // The `get_questions` RPC accepts a single uuid per election/constituency, so fan out into one call per (election, constituency) pair when the caller passes arrays, then union the payloads. Arrays are real here rather than hypothetical: `candidate/(protected)/+layout.server.ts` derives `electionId` from the candidate's own nominations, which spans two elections for any candidate nominated in both, and `(voters)/(located)/+layout.ts` threads the URL's multi-valued `electionId` through verbatim. Picking `[0]` would silently drop the other election's scoped questions — the exact regression the sibling nomination read at `_getNominationData` already had to undo.
    const electionIds = convertFilterValue(options?.electionId);
    const constituencyIds = convertFilterValue(options?.constituencyId);
    // The election round is a scalar rather than a `FilterValue`, so it adds no level to the fan-out and is passed through unchanged.
    const electionRound = options?.electionRound;

    const results = await Promise.all(
      electionIds.flatMap((eid) =>
        constituencyIds.map((cid) =>
          this.supabase.rpc('get_questions', {
            // The regenerated RPC types both filters as `string | undefined`; the fan-out locals are `string | null`. Coercing null → undefined omits the key, applying the SQL DEFAULT NULL — semantically identical to passing null (behavior-neutral).
            p_election_id: eid ?? undefined,
            p_constituency_id: cid ?? undefined,
            p_election_round: electionRound
          })
        )
      )
    );
    const firstError = results.find((r) => r.error)?.error;
    if (firstError) throw new Error(`getQuestionData: ${firstError.message}`);

    // Union the fan-out's payloads keyed by row id, so a row returned by several calls appears once. The union is what reproduces the OR-over-the-array semantics the previous client-side filter had.
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

    // The RPC filters categories and questions independently on their own columns, so an unscoped question under a scoped category outlives its category. `Question.category` resolves through `DataRoot.getQuestionCategory`, which throws `DataNotFoundError` when the category is absent, so such an orphan must be dropped here rather than handed to the data model. This restores the constraint the previous `.in('category_id', categoryIds)` narrowing carried, without its `length > 0` guard, which had inverted it into reading the entire questions table whenever the filtered category list came back empty.
    const questions = [...questionRows.values()]
      .filter((row) => categoryRows.has(row.category_id))
      .sort(bySortOrderThenId)
      .map((row) => {
        const obj = toDataObject(row, locale, this.defaultLocale);
        // Localize choice labels for choice-type questions.
        // reason: class 1 residual — a typed-JSONB read with no schema. `LocalizedChoice` is a published `@openvaa/app-shared` type but `157-02` wrote no `StoredChoices` schema for it, so this read is asserted rather than validated until one exists. The `Array.isArray` guard below is the runtime check that stands in for it.
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

        // The DB `allow_open` column maps to a top-level `allowOpen` via COLUMN_MAP, but every frontend consumer (candidate per-question editor, EntityOpinions) reads it from `customData.allowOpen` (per the CustomData type). Bridge the column into customData so the open-answer field actually renders; an explicit `custom_data.allowOpen` JSONB value takes precedence over the column.
        // The explicit annotation keeps the JSONB passthrough keys (min/max etc.) indexable as `unknown` — the inferred spread type collapses to just `{ allowOpen: boolean }` and rejects them.
        const customData: { allowOpen: boolean } & Record<string, unknown> = {
          allowOpen: (row.allow_open as boolean | null) ?? true,
          ...((obj.customData as Record<string, unknown> | undefined) ?? {})
        };

        // NumberQuestionData.min/max have no DB column — the authoring home for a number question's answer-value range is `custom_data.{ min, max }` (see numberQuestion.ts getters, which read this.data.min/this.data.max and gate isMatchable on the range). Lift those into top-level fields for number rows only, and only when they are actual numbers: non-numeric JSONB values are dropped rather than coerced (untrusted-JSONB tampering guard), and absent keys are omitted (spread-conditional) rather than set to undefined so NumberQuestion's zero-range check never fires on pass-through values.
        const numberRange =
          row.type === 'number'
            ? {
                ...(typeof customData.min === 'number' ? { min: customData.min } : {}),
                ...(typeof customData.max === 'number' ? { max: customData.max } : {})
              }
            : {};

        // Name the discriminant (`type`) plus the identity fields (`id`, `name`, `categoryId`) explicitly — drawn from the typed row / localized `obj` rather than relying on the opaque `...obj` spread — so the object structurally overlaps the discriminated `AnyQuestionVariantData` union . The `type` column is the question_type enum; localized `name` falls back to '' (the data model's smart default for a missing name).
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
