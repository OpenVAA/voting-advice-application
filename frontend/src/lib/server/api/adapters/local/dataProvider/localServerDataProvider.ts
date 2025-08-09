import { staticSettings } from '@openvaa/app-shared';
import {
  type AnyEntityVariantData,
  type AnyQuestionVariantData,
  type ConstituencyData,
  type ConstituencyGroupData,
  type ElectionData,
  type QuestionCategoryData,
  translate
} from '@openvaa/data';
import { json } from '@sveltejs/kit';
import { filterData } from '$lib/api/utils/filterData';
import { filterEntitiesByNomination } from '$lib/api/utils/filterEntitiesByNomination';
import { logDebugError } from '$lib/utils/logger';
import { LocalServerAdapter } from '../localServerAdapter';
import type { DataProvider } from '$lib/api/base/dataProvider.type';
import type {
  GetAppCustomizationOptions,
  GetConstituenciesOptions,
  GetDataOptionsBase,
  GetElectionsOptions,
  GetEntitiesOptions,
  GetFactorLoadingsOptions,
  GetNominationsOptions,
  GetQuestionsOptions
} from '$lib/api/base/getDataOptions.type';
import type { ReadPath } from '../localPaths';

export class LocalServerDataProvider extends LocalServerAdapter implements DataProvider<'server'> {
  /**
   * This is used for translations when the locale option is missing.
   */
  defaulLocale: string;

  constructor() {
    super();
    const locales = staticSettings.supportedLocales;
    this.defaulLocale = locales.find((l) => l.isDefault)?.code || locales[0].code || 'en';
  }

  async getAppSettings(): Promise<Response> {
    if (!(await this.exists('appSettings'))) return Promise.resolve(json({}));
    return this.readAndFilter('appSettings');
  }

  async getAppCustomization(options: GetAppCustomizationOptions = {}): Promise<Response> {
    if (!(await this.exists('appCustomization'))) return Promise.resolve(json({}));
    warnIfUnsupported(options);
    return this.readAndFilter('appCustomization');
  }

  getElectionData(options: GetElectionsOptions = {}): Promise<Response> {
    warnIfUnsupported(options);
    const { id, locale } = options;
    const filter = id ? (data: Array<ElectionData>) => filterData({ data, filters: { id } }) : undefined;
    return this.readAndFilter('elections', { filter, locale });
  }

  getConstituencyData(options: GetConstituenciesOptions = {}): Promise<Response> {
    warnIfUnsupported(options);
    const { id, locale } = options;
    const filter = id
      ? ({
          groups,
          constituencies
        }: {
          groups: Array<ConstituencyGroupData>;
          constituencies: Array<ConstituencyData>;
        }) => ({
          groups: filterData({ data: groups, filters: { id } }),
          // NB. We return all constituencies regardless of group filters because of possible `parent` relationships
          constituencies
        })
      : undefined;
    return this.readAndFilter('constituencies', { filter, locale });
  }

  async getNominationData(options: GetNominationsOptions = {}): Promise<Response> {
    warnIfUnsupported(options);
    const { constituencyId, electionId, locale = this.defaulLocale } = options;
    // Because nominations and entities are stored in separate files, we cannot use this.readAndFilter
    let [nominations, entities] = await Promise.all([this.read('nominations'), this.read('entities')]).then((data) =>
      data.map((d) => JSON.parse(d))
    );
    nominations = translate({ value: nominations, locale });
    entities = translate({ value: entities, locale });
    if (constituencyId || electionId)
      nominations = filterData({ data: nominations, filters: { constituencyId, electionId } });
    entities = filterEntitiesByNomination({ entities, nominations });
    return json({ entities, nominations });
  }

  getEntityData(options: GetEntitiesOptions = {}): Promise<Response> {
    warnIfUnsupported(options);
    const { id, entityType, locale } = options;
    if (id && !entityType) throw new Error('If id is defined entityType must also be defined.');
    const filter =
      id || entityType
        ? (data: Array<AnyEntityVariantData>) => filterData({ data, filters: { id, type: entityType } })
        : undefined;
    return this.readAndFilter('entities', { filter, locale });
  }

  getQuestionData(options: GetQuestionsOptions = {}): Promise<Response> {
    warnIfUnsupported(options);
    const { electionId, locale } = options;
    const filter = electionId
      ? ({
          categories,
          questions
        }: {
          categories: Array<QuestionCategoryData>;
          questions: Array<AnyQuestionVariantData>;
        }) => {
          // The possible `electionId` filter is applied such that any categories with the specified `electionId` or none at all are returned
          categories = filterData({
            data: categories,
            filters: { electionId: { value: electionId, includeMissing: true } }
          });
          const categoryId = categories.map((c) => c.id);
          questions = filterData({ data: questions, filters: { categoryId } });
          return { categories, questions };
        }
      : undefined;
    return this.readAndFilter('questions', { filter, locale });
  }

  getFactorLoadingData(options: GetFactorLoadingsOptions = {}): Promise<Response> {
    warnIfUnsupported(options);
    const { electionId } = options;
    const filter = electionId
      ? (data: LocalDataType['factorLoadings']) => {
          if (!data) return null;
          // If the election IDs match, return the data, otherwise null
          return data.election === electionId ? data : null;
        }
      : undefined;
    return this.readAndFilter('factorLoadings', filter);
  }

  /**
   * Reads the data from the endpoint, possibly filters it and handles wrapping the `Response` in a `Promise`.
   * @param endpoint - The endpoint from which to read the data.
   * @param filter - An optional function to filter the parsed and translated data.
   * @param locale - An optional locale to translate the data. Set to `null` to disable translation. @default this.defaulLocale
   */
  protected async readAndFilter<TPath extends ReadPath, TData>(
    endpoint: TPath,
    {
      filter,
      locale = this.defaulLocale
    }: {
      filter?: (data: TData) => TData;
      locale?: string | null;
    } = {}
  ): Promise<Response> {
    const data = await this.read(endpoint);
    // Parse the JSON data, filter it and serialize it back to a JSON response.
    let value = JSON.parse(data);
    if (locale) value = translate({ value, locale });
    return json(filter ? filter(value) : value);
  }
}

/**
 * Temporary utility for warning when unsupported options are used.
 * TODO: Remove when locale and includeUnconfirmed are supported.
 */
function warnIfUnsupported(options?: GetDataOptionsBase): void {
  if (!options) return;
  if ('includeUnconfirmed' in options)
    logDebugError('[LocalServerDataProvider] includeUnconfirmed is not yet supported. Ignoring it.');
}
