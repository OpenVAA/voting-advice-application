import { UniversalDataProvider } from '$lib/api/base/universalDataProvider';
import { supabaseAdapterMixin } from '../supabaseAdapter';
import { getLocalized } from '../utils/getLocalized';
import { toDataObject } from '../utils/toDataObject';
import { parseStoredImage } from '../utils/storageUrl';
import { parseAnswers } from '$lib/api/utils/parseAnswers';
import { constants } from '$lib/utils/constants';
import { ENTITY_TYPE } from '@openvaa/data';
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
import type { DynamicSettings } from '@openvaa/app-shared';
import type {
  AnyEntityVariantData,
  AnyNominationVariantPublicData,
  AnyQuestionVariantData,
  ConstituencyData,
  ConstituencyGroupData,
  ElectionData,
  QuestionCategoryData
} from '@openvaa/data';
import type { TranslationKey } from '$types';

/**
 * Supabase implementation of the DataProvider.
 * Implements read methods that query Supabase PostgREST and transform
 * the raw database rows into the domain types expected by DataRoot.
 */
export class SupabaseDataProvider extends supabaseAdapterMixin(UniversalDataProvider) {
  /**
   * Fetch application settings from the `app_settings` table.
   * The `settings` JSONB column holds a `Partial<DynamicSettings>`.
   * Notification title/content fields are localized before return.
   */
  protected async _getAppSettings(options?: GetDataOptionsBase): Promise<DPDataType['appSettings']> {
    const { data, error } = await this.supabase.from('app_settings').select('settings').limit(1).single();

    if (error) {
      if (error.code === 'PGRST116') return {}; // No rows -- return empty settings
      throw new Error(`getAppSettings: ${error.message}`);
    }

    const settings = (data?.settings ?? {}) as Record<string, unknown>;
    const locale = options?.locale ?? this.locale;

    // Localize notification title and content fields
    if (settings.notifications && typeof settings.notifications === 'object') {
      const notifications = { ...(settings.notifications as Record<string, unknown>) };
      for (const key of ['candidateApp', 'voterApp']) {
        const notif = notifications[key];
        if (notif && typeof notif === 'object') {
          const n = notif as Record<string, unknown>;
          notifications[key] = {
            ...n,
            title: getLocalized(n.title as Record<string, string> | null, locale, this.defaultLocale),
            content: getLocalized(n.content as Record<string, string> | null, locale, this.defaultLocale)
          };
        }
      }
      settings.notifications = notifications;
    }

    return settings as Partial<DynamicSettings>;
  }

  /**
   * Fetch application customization from the `app_settings.customization` JSONB column.
   * Localizes string fields, converts storage image paths to absolute URLs,
   * localizes translation overrides and FAQ entries.
   */
  protected async _getAppCustomization(
    options?: GetAppCustomizationOptions
  ): Promise<DPDataType['appCustomization']> {
    const { data, error } = await this.supabase.from('app_settings').select('customization').limit(1).single();

    if (error) {
      if (error.code === 'PGRST116') return {} as AppCustomization;
      throw new Error(`getAppCustomization: ${error.message}`);
    }

    const raw = (data?.customization ?? {}) as Record<string, unknown>;
    const locale = options?.locale ?? this.locale;
    const supabaseUrl = constants.PUBLIC_SUPABASE_URL;

    const result: AppCustomization = {};

    // Localize string fields
    if (raw.publisherName) {
      result.publisherName =
        getLocalized(raw.publisherName as Record<string, string>, locale, this.defaultLocale) ?? undefined;
    }

    // Convert image storage paths to URLs
    result.publisherLogo = parseStoredImage(raw.publisherLogo as any, supabaseUrl);
    result.poster = parseStoredImage(raw.poster as any, supabaseUrl);
    result.candPoster = parseStoredImage(raw.candPoster as any, supabaseUrl);

    // Localize translation overrides (each value is a LocalizedString)
    if (raw.translationOverrides && typeof raw.translationOverrides === 'object') {
      const overrides = raw.translationOverrides as Record<string, Record<string, string>>;
      const localized: Record<string, string> = {};
      for (const [key, val] of Object.entries(overrides)) {
        const resolved = getLocalized(val, locale, this.defaultLocale);
        if (resolved != null) localized[key] = resolved;
      }
      result.translationOverrides = localized as Record<TranslationKey, string>;
    }

    // Localize FAQ entries
    if (Array.isArray(raw.candidateAppFAQ)) {
      result.candidateAppFAQ = raw.candidateAppFAQ.map((faq: Record<string, unknown>) => ({
        question: getLocalized(faq.question as Record<string, string> | null, locale, this.defaultLocale) ?? '',
        answer: getLocalized(faq.answer as Record<string, string> | null, locale, this.defaultLocale) ?? ''
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
        image: parseStoredImage(row.image as any, supabaseUrl),
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
  protected async _getConstituencyData(
    options?: GetConstituenciesOptions
  ): Promise<DPDataType['constituencies']> {
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
        image: parseStoredImage(row.image as any, supabaseUrl),
        constituencyIds: (
          (row.constituency_group_constituencies as Array<{ constituency_id: string }>) ?? []
        ).map((jt) => jt.constituency_id)
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
      // Keywords: localize then split by comma+optional whitespace
      const rawKeywords = row.keywords as Record<string, string> | null;
      const localizedKeywords = getLocalized(rawKeywords, locale, this.defaultLocale);
      const keywords = localizedKeywords ? localizedKeywords.split(/,\s*/).filter(Boolean) : undefined;
      return {
        ...obj,
        image: parseStoredImage(row.image as any, supabaseUrl),
        keywords
      } as ConstituencyData;
    });

    return { groups, constituencies };
  }

  /**
   * Fetch nominations via the `get_nominations` RPC which joins nominations with
   * all 4 entity tables. Deduplicates entities client-side using a Map keyed by entity_id.
   * Candidate entities include firstName, lastName, organizationId.
   */
  protected async _getNominationData(
    options?: GetNominationsOptions
  ): Promise<DPDataType['nominations']> {
    const locale = options?.locale ?? this.locale;
    const supabaseUrl = constants.PUBLIC_SUPABASE_URL;

    const { data, error } = await this.supabase.rpc('get_nominations', {
      p_election_id: options?.electionId
        ? Array.isArray(options.electionId)
          ? options.electionId[0]
          : options.electionId
        : null,
      p_constituency_id: options?.constituencyId
        ? Array.isArray(options.constituencyId)
          ? options.constituencyId[0]
          : options.constituencyId
        : null,
      p_include_unconfirmed: options?.includeUnconfirmed ?? false
    });
    if (error) throw new Error(`getNominationData: ${error.message}`);

    // Deduplicate entities using a Map keyed by entity_id
    const entityMap = new Map<string, AnyEntityVariantData>();
    const nominations: AnyNominationVariantPublicData[] = [];

    for (const row of data ?? []) {
      // Build nomination object from nomination-level columns
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
        parent_nomination_id: row.parent_nomination_id
      };
      const nomObj = toDataObject(nomRow as Record<string, unknown>, locale, this.defaultLocale);

      nominations.push({
        ...nomObj,
        entityType: row.entity_type,
        entityId: row.entity_id,
        image: parseStoredImage(row.image as any, supabaseUrl)
      } as AnyNominationVariantPublicData);

      // Extract and deduplicate entity
      const entityId = row.entity_id as string;
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
        const entityObj = toDataObject(entityRow as Record<string, unknown>, locale, this.defaultLocale);
        const entityType = row.entity_type as string;

        const entity: Record<string, unknown> = {
          ...entityObj,
          type: entityType,
          image: parseStoredImage(row.entity_image as any, supabaseUrl),
          answers: parseAnswers(row.entity_answers as any, locale)
        };

        // Candidate-specific fields
        if (entityType === ENTITY_TYPE.Candidate) {
          entity.firstName = row.entity_first_name;
          entity.lastName = row.entity_last_name;
          entity.organizationId = row.entity_organization_id;
        }

        entityMap.set(entityId, entity as AnyEntityVariantData);
      }
    }

    return {
      nominations,
      entities: Array.from(entityMap.values())
    };
  }

  /**
   * Fetch entity data (candidates and/or organizations) from their respective tables.
   * Sets the `type` field based on entity table, processes answers through parseAnswers,
   * and converts storage image paths to absolute URLs.
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

    const results: AnyEntityVariantData[] = [];

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
          image: parseStoredImage(row.image as any, supabaseUrl),
          answers: parseAnswers(row.answers as any, locale)
        } as AnyEntityVariantData);
      }
    }

    return results;
  }

  /**
   * Fetch question categories and questions. Localizes choice labels for
   * choice-type questions, maps category_type to type on categories,
   * and filters categories by electionId when specified.
   */
  protected async _getQuestionData(options?: GetQuestionsOptions): Promise<DPDataType['questions']> {
    const locale = options?.locale ?? this.locale;
    const supabaseUrl = constants.PUBLIC_SUPABASE_URL;

    // 1. Fetch categories
    const { data: catData, error: catError } = await this.supabase
      .from('question_categories')
      .select('*')
      .order('sort_order');
    if (catError) throw new Error(`getQuestionData (categories): ${catError.message}`);

    let categories = (catData ?? []).map((row) => {
      const obj = toDataObject(row as Record<string, unknown>, locale, this.defaultLocale);
      return {
        ...obj,
        // QuestionCategoryData uses 'type' not 'categoryType'
        type: row.category_type ?? 'opinion',
        image: parseStoredImage(row.image as any, supabaseUrl)
      } as QuestionCategoryData;
    });

    // Client-side filter by electionId if specified
    if (options?.electionId) {
      const filterElectionId = Array.isArray(options.electionId) ? options.electionId : [options.electionId];
      categories = categories.filter((cat) => {
        const catElectionIds = (cat as any).electionIds as string[] | null;
        // Include categories with no electionIds (applicable to all) or matching
        return (
          !catElectionIds ||
          catElectionIds.length === 0 ||
          catElectionIds.some((eid: string) => filterElectionId.includes(eid))
        );
      });
    }

    // 2. Fetch questions belonging to the filtered categories
    const categoryIds = categories.map((c) => c.id);
    let qQuery = this.supabase.from('questions').select('*').order('sort_order');
    if (categoryIds.length > 0) {
      qQuery = qQuery.in('category_id', categoryIds);
    }
    const { data: qData, error: qError } = await qQuery;
    if (qError) throw new Error(`getQuestionData (questions): ${qError.message}`);

    const questions = (qData ?? []).map((row) => {
      const obj = toDataObject(row as Record<string, unknown>, locale, this.defaultLocale);
      // Localize choice labels for choice-type questions
      let choices = row.choices as Array<{
        id: number;
        label: Record<string, string> | string;
        [k: string]: unknown;
      }> | null;
      if (choices && Array.isArray(choices)) {
        choices = choices.map((choice) => ({
          ...choice,
          label:
            typeof choice.label === 'object' && choice.label !== null
              ? (getLocalized(choice.label as Record<string, string>, locale, this.defaultLocale) ?? '')
              : choice.label
        }));
      }

      return {
        ...obj,
        type: row.type, // question_type enum passes through as-is
        choices,
        image: parseStoredImage(row.image as any, supabaseUrl)
      } as AnyQuestionVariantData;
    });

    return { categories, questions };
  }
}
