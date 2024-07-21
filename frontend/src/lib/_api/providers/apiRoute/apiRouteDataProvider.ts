import {optionsToUrlParams} from '../../utils/optionsToUrlParams';
import type {
  DataProvider,
  DataProviderConfig,
  GetDataOptions,
  GetDataOptionsBase,
  GetDataReturnType
} from '../../dataProvider.type';
import {API_ROUTES, type ApiRoute} from './apiRoutes';
import {DataProviderError} from '$lib/_api/dataProviderError';
import type {DataCollectionTypes} from '$lib/_api/dataCollections';

console.info('[debug] apiRouteDataProvider.ts: module loaded');

export class ApiRouteDataProvider implements DataProvider {
  public fetch: typeof fetch | undefined;

  constructor() {
    console.info('[debug] apiRouteDataProvider.ts: ApiRouteDataProvider constructor called');
  }

  init(config: DataProviderConfig): void {
    this.fetch = config.fetch;
  }

  async getElectionsData(
    options: GetDataOptions['elections'] = {}
  ): GetDataReturnType<'elections'> {
    console.info('[debug] apiRouteDataProvider.ts: ApiRouteDataProvider.getElectionsData() called');
    return this.getData<DataCollectionTypes['elections']>(API_ROUTES.elections, options).catch(
      (e) => e
    );
  }

  async getConstituenciesData(
    options: GetDataOptions['constituencies'] = {}
  ): GetDataReturnType<'constituencies'> {
    console.info(
      '[debug] apiRouteDataProvider.ts: ApiRouteDataProvider.getConstituenciesData() called'
    );
    return this.getData<DataCollectionTypes['constituencies']>(
      API_ROUTES.constituencies,
      options
    ).catch((e) => e);
  }

  async getNominationsData(
    options: GetDataOptions['nominations'] = {}
  ): GetDataReturnType<'nominations'> {
    console.info(
      '[debug] apiRouteDataProvider.ts: ApiRouteDataProvider.getNominationsData() called'
    );
    return this.getData<DataCollectionTypes['nominations']>(API_ROUTES.nominations, options).catch(
      (e) => e
    );
  }

  async getCandidatesData(
    options: GetDataOptions['candidates'] = {}
  ): GetDataReturnType<'candidates'> {
    console.info(
      '[debug] apiRouteDataProvider.ts: ApiRouteDataProvider.getCandidatesData() called'
    );
    return this.getData<DataCollectionTypes['candidates']>(API_ROUTES.candidates, options).catch(
      (e) => e
    );
  }

  // TODO: This now requires the data always to be an array. Check if we should relax this requirement.
  protected async getData<TData extends DataCollectionTypes[keyof DataCollectionTypes]>(
    route: ApiRoute,
    options?: GetDataOptionsBase
  ): Promise<TData[]> {
    if (!this.fetch)
      throw new Error('You must provide a fetch function before calling any get methods.');
    if (options) route += `?${optionsToUrlParams(options)}`;
    return this.fetch(route)
      .then((response) => {
        if (!response.ok) throw new Error(`Response: ${response.status} / ${response.statusText}`);
        return response.json();
      })
      .catch((e) => {
        throw new DataProviderError(`Error with getData: ${e}`);
      });
  }
}

export const dataProvider = new ApiRouteDataProvider();
