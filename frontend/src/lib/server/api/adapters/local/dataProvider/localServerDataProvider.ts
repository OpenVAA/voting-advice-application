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
import type { LocalDataType, ReadPath } from '../localPaths';

export class LocalServerDataProvider extends LocalServerAdapter implements DataProvider<'server'> {
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
    const { id } = options;
    const filter = id ? (data: LocalDataType['elections']) => filterData({ data, filters: { id } }) : undefined;
    return this.readAndFilter('elections', filter);
  }

  getConstituencyData(options: GetConstituenciesOptions = {}): Promise<Response> {
    warnIfUnsupported(options);
    const { id } = options;
    const filter = id
      ? ({ groups, constituencies }: LocalDataType['constituencies']) => ({
          groups: filterData({ data: groups, filters: { id } }),
          // NB. We return all constituencies regardless of group filters because of possible `parent` relationships
          constituencies
        })
      : undefined;
    return this.readAndFilter('constituencies', filter);
  }

  async getNominationData(options: GetNominationsOptions = {}): Promise<Response> {
    warnIfUnsupported(options);
    const { constituencyId, electionId } = options;
    // Because nominations and entities are stored in separate files, we cannot use this.readAndFilter
    let [nominations, entities] = await Promise.all([this.read('nominations').json(), this.read('entities').json()]);
    if (constituencyId || electionId)
      nominations = filterData({ data: nominations, filters: { constituencyId, electionId } });
    entities = filterEntitiesByNomination({ entities, nominations });
    return json({ entities, nominations });
  }

  getEntityData(options: GetEntitiesOptions = {}): Promise<Response> {
    warnIfUnsupported(options);
    const { id, entityType } = options;
    if (id && !entityType) throw new Error('If id is defined entityType must also be defined.');
    const filter =
      id || entityType
        ? (data: LocalDataType['entities']) => filterData({ data, filters: { id, type: entityType } })
        : undefined;
    return this.readAndFilter('entities', filter);
  }

  getQuestionData(options: GetQuestionsOptions = {}): Promise<Response> {
    warnIfUnsupported(options);
    const { electionId } = options;
    const filter = electionId
      ? ({ categories, questions }: LocalDataType['questions']) => {
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
    return this.readAndFilter('questions', filter);
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
   * @param filterFn - An optional function to filter the parsed data.
   */
  protected async readAndFilter<TPath extends ReadPath>(
    endpoint: TPath,
    filterFn?: (data: LocalDataType[TPath]) => LocalDataType[TPath]
  ): Promise<Response> {
    const response = this.read(endpoint);
    if (!filterFn) return Promise.resolve(response);
    // Parse the JSON data, filter it and serialize it back to a JSON response.
    const parsed = await response.json();
    return json(filterFn(parsed));
  }
}

/**
 * Temporary utility for warning when unsupported options are used.
 * TODO: Remove when locale is supported.
 */
function warnIfUnsupported(options?: GetDataOptionsBase): void {
  if (options?.locale) logDebugError('[LocalServerDataProvider] Locale is not yet supported. Ignoring it.');
}
