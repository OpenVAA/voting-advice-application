import {read} from '$app/server';
import type {DataCollectionTypes} from '$lib/_api/dataCollections';
import type {
  DataContent,
  DataProviderConfig,
  GetDataOptions,
  GetDataOptionsBase,
  GetDataReturnType,
  JsonString
} from '$lib/_api/dataProvider.type';
import {DataProviderError} from '$lib/_api/dataProviderError';
import type {DataObjectData} from '$lib/_vaa-data/dataObject.type';
import type {ServerDataProvider} from '$lib/server/_api/serverDataProvider.type';
import {DATA_PATHS, type DataPath} from '../dataPaths';

console.info('[debug] localServerDataProvider.ts: module loaded');

export class LocalServerDataProvider implements ServerDataProvider {
  public fetch: typeof fetch | undefined;

  constructor() {
    console.info('[debug] localServerDataProvider.ts: LocalServerDataProvider constructor called');
  }

  init(config: DataProviderConfig): void {
    this.fetch = config.fetch;
  }

  async getElectionsData(
    options: GetDataOptions['elections'] = {}
  ): GetDataReturnType<'elections', 'server'> {
    console.info(
      '[debug] localServerDataProvider.ts: LocalServerDataProvider.getElectionsData() called'
    );
    return this.readData('elections', options).catch((e) => e);
  }

  async getConstituenciesData(
    options: GetDataOptions['constituencies'] = {}
  ): GetDataReturnType<'constituencies', 'server'> {
    console.info(
      '[debug] localServerDataProvider.ts: LocalServerDataProvider.getConstituenciesData() called'
    );
    return this.readData('constituencies', options).catch((e) => e);
  }

  async getNominationsData(
    options: GetDataOptions['nominations'] = {}
  ): GetDataReturnType<'nominations', 'server'> {
    console.info(
      '[debug] localServerDataProvider.ts: LocalServerDataProvider.getNominationsData() called'
    );
    const {electionId, constituencyId, loadAllEntities, loadAnswers, locale} = options;
    let {
      loadCandidates
      // loadParties,
    } = options;
    loadCandidates ||= loadAllEntities;
    // loadParties ||= loadAllEntities;

    // If we're just loading the nominations, we don't need to parse the JSON string
    if (!loadCandidates)
      return this.readData('nominations', options)
        .then((jsonString) => `{"nominations": ${jsonString}}`)
        .catch((e) => e);

    return Promise.all([
      this.readData('nominations', {electionId, constituencyId, locale}, true).catch(
        (e: Error) => e
      ),
      this.readData('candidates', {loadAnswers, locale}, true).catch((e: Error) => e)
      // this.readData('parties', options, true).catch((e: Error) => e),
    ]).then(([nominations, candidates]) => {
      if (nominations instanceof Error) return nominations;
      if (candidates instanceof Error) return candidates;
      const candidateIds = nominations.map((n) => n.candidateId).filter((id) => id != null);
      const result: DataContent<'nominations'> = {
        nominations,
        candidates: candidates.filter((c) => candidateIds.includes(c.id))
      };
      return JSON.stringify(result);
    });
  }

  async getCandidatesData(
    options: GetDataOptions['candidates'] = {}
  ): GetDataReturnType<'candidates', 'server'> {
    console.info(
      '[debug] localServerDataProvider.ts: LocalServerDataProvider.getCandidatesData() called'
    );
    return this.readData('candidates', options).catch((e) => e);
  }

  /**
   * Read the data for `collection` with the given `GetDataOptions`. The data is normally returned by the API route so it is either left as a JSON string or parsed and then stringified if `options` are present. For internal use, `dontStringify` can be set to `true` to avoid unnecessary re-parsing.
   * @param collection The name of the data collection.
   * @param options The `GetDataOptions` applicable to the collection.
   * @param dontStringify If `true`, the data will not be stringified. @default false
   */
  protected async readData<TCollection extends keyof DataCollectionTypes>(
    collection: TCollection,
    options: GetDataOptions[TCollection],
    dontStringify?: false
  ): Promise<JsonString>;
  protected async readData<TCollection extends keyof DataCollectionTypes>(
    collection: TCollection,
    options: GetDataOptions[TCollection],
    dontStringify: true
  ): Promise<Array<DataCollectionTypes[TCollection]>>;
  protected async readData<TCollection extends keyof DataCollectionTypes>(
    collection: TCollection,
    options: GetDataOptions[TCollection] = {},
    dontStringify?: boolean
  ): Promise<Array<DataCollectionTypes[TCollection]> | JsonString> {
    const data = await this.readFile(DATA_PATHS[collection]).catch(handleError);
    // Only parse the json if we need to filter it somehow so because the api route will need to stringify it anyway
    // TODO: implement basic filtering (and locale-specifics) by simply dividing the data into separate files (such as nominations by constituency and even candidates although in that case they might be duplicated in multiple constituencies, and all files by locale, which again results and duplicated data) so we don't need to parse it. Only pass those options to `filter` that cannot be resolved this way.
    if (dontStringify === true)
      return data
        .json()
        .then((data: Array<DataCollectionTypes[TCollection]>) => filter(data, options))
        .catch(handleError);
    if (!Object.keys(options).length && !dontStringify) return data.text().catch(handleError);
    return data
      .json()
      .then((data) => JSON.stringify(filter(data, options)))
      .catch(handleError);

    function handleError(e: Error): never {
      throw new DataProviderError(`Error with readData: ${e.message}`);
    }
  }

  protected async readFile(filePath: DataPath): Promise<Response> {
    const data = read(filePath);
    if (!data?.ok)
      throw new DataProviderError(
        `Error with readData: Response: ${data.status} / ${data.statusText}`
      );
    return data;
  }
}

export const serverDataProvider = new LocalServerDataProvider();

/**
 * A temporary placeholder for filtering functions.
 * TODO: Implement fully
 */
function filter<TData extends DataObjectData>(
  data: Array<TData>,
  options?: GetDataOptionsBase
): Array<TData> {
  if (!options) return data;
  console.info(
    `TODO: implement proper filter • now called with options: ${JSON.stringify(options)}`
  );
  const idFilters = Object.entries(options).filter(([key, value]) => {
    if ((key === 'id' || key.endsWith('Id')) && value != null) {
      if (typeof value !== 'string') throw new Error(`Invalid filter value for ${key}: ${value}`);
      return true;
    }
    return false;
  });
  return data.filter((item) => {
    for (const [key, value] of idFilters) {
      const itemValue = item[key as keyof TData];
      if (itemValue == null) return false;
      if (Array.isArray(itemValue)) {
        if (!itemValue.includes(value)) return false;
      } else if (itemValue !== value) {
        return false;
      }
    }
    return true;
  });
}
