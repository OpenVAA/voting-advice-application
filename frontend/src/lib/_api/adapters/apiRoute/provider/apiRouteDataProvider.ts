import {optionsToUrlParams} from '../../../utils/optionsToUrlParams';
import type {
  DataContent,
  DataProvider,
  DataProviderConfig,
  GetDataOptions,
  GetDataOptionsBase,
  GetDataReturnType
} from '../../../dataProvider.type';
import {API_ROUTES} from '../apiRoutes';
import {DataProviderError} from '$lib/_api/dataProviderError';
import type {DataCollectionTypes} from '$lib/_api/dataCollections';

export class ApiRouteDataProvider implements DataProvider {
  public fetch: typeof fetch | undefined;

  init(config: DataProviderConfig): void {
    this.fetch = config.fetch;
  }

  async getElectionsData(
    options: GetDataOptions['elections'] = {}
  ): GetDataReturnType<'elections'> {
    console.info('[debug] apiRouteDataProvider.ts: ApiRouteDataProvider.getElectionsData() called');
    return this.getData('elections', options).catch((e) => e);
  }

  async getConstituenciesData(
    options: GetDataOptions['constituencies'] = {}
  ): GetDataReturnType<'constituencies'> {
    console.info(
      '[debug] apiRouteDataProvider.ts: ApiRouteDataProvider.getConstituenciesData() called'
    );
    return this.getData('constituencies', options).catch((e) => e);
  }

  async getNominationsData(
    options: GetDataOptions['nominations'] = {}
  ): GetDataReturnType<'nominations'> {
    console.info(
      '[debug] apiRouteDataProvider.ts: ApiRouteDataProvider.getNominationsData() called'
    );
    return this.getData('nominations', options).catch((e) => e);
  }

  async getCandidatesData(
    options: GetDataOptions['candidates'] = {}
  ): GetDataReturnType<'candidates'> {
    console.info(
      '[debug] apiRouteDataProvider.ts: ApiRouteDataProvider.getCandidatesData() called'
    );
    return this.getData('candidates', options).catch((e) => e);
  }

  protected async getData<TCollection extends keyof DataCollectionTypes>(
    collection: TCollection,
    options?: GetDataOptionsBase
  ): Promise<DataContent<TCollection>> {
    if (!this.fetch)
      throw new Error('You must provide a fetch function before calling any get methods.');
    let route = API_ROUTES[collection];
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
