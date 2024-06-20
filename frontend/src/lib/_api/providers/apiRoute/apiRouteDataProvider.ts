import {optionsToUrlParams} from '../../utils/optionsToUrlParams';
import type {CandidateData} from '$lib/_vaa-data/candidate.type';
import type {
  DataProvider,
  DataProviderConfig,
  GetDataOptionsBase,
  GetNominatedCandidatesOptions
} from '../../dataProvider.type';
import {API_ROUTES, type ApiRoute} from './apiRoutes';
import type {DataObjectData} from '$lib/_vaa-data/dataObject.type';
import {DataProviderError} from '$lib/_api/dataProviderError';

console.info('[debug] apiRouteDataProvider.ts: module loaded');

export class ApiRouteDataProvider implements DataProvider {
  public fetch: typeof fetch | undefined;

  constructor() {
    console.info('[debug] apiRouteDataProvider.ts: ApiRouteDataProvider constructor called');
  }

  init(config: DataProviderConfig): void {
    this.fetch = config.fetch;
  }

  async getCandidatesData(
    options?: GetNominatedCandidatesOptions
  ): Promise<CandidateData[] | DataProviderError> {
    console.info(
      '[debug] apiRouteDataProvider.ts: ApiRouteDataProvider.getCandidatesData() called'
    );
    return this.getData<CandidateData>(API_ROUTES.candidates, options).catch((e) => e);
  }

  // TODO: This now requires the data always to be an array. Check if we should relax this requirement.
  protected async getData<TData extends DataObjectData>(
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
