import { UniversalDataProvider } from '$lib/api/base/universalDataProvider';
import { supabaseAdapterMixin } from '../supabaseAdapter';
import { getLocalized } from '../utils/getLocalized';
import { toDataObject } from '../utils/toDataObject';
import { parseStoredImage } from '../utils/storageUrl';
import { constants } from '$lib/utils/constants';
import type { DPDataType } from '$lib/api/base/dataTypes';
import type {
  GetAppCustomizationOptions,
  GetConstituenciesOptions,
  GetDataOptionsBase,
  GetElectionsOptions
} from '$lib/api/base/getDataOptions.type';
import type { AppCustomization } from '$lib/contexts/app';
import type { DynamicSettings } from '@openvaa/app-shared';
import type { ConstituencyData, ConstituencyGroupData, ElectionData } from '@openvaa/data';
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

  protected _getNominationData() {
    throw new Error('SupabaseDataProvider._getNominationData not implemented');
  }
  protected _getEntityData() {
    throw new Error('SupabaseDataProvider._getEntityData not implemented');
  }
  protected _getQuestionData() {
    throw new Error('SupabaseDataProvider._getQuestionData not implemented');
  }
}
