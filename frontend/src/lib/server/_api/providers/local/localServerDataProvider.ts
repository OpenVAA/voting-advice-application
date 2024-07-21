import {read} from '$app/server';
import type {
  DataProviderConfig,
  GetDataOptions,
  GetDataOptionsBase,
  GetDataReturnType,
  JsonString
} from '$lib/_api/dataProvider.type';
import {DataProviderError} from '$lib/_api/dataProviderError';
import type {DataObjectData} from '$lib/_vaa-data/dataObject.type';
import type {ServerDataProvider} from '../../serverDataProvider.type';
import {DATA_PATHS, type DataPath} from './dataPaths';

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
    return this.readData(DATA_PATHS.elections, options).catch((e) => e);
  }

  async getConstituenciesData(
    options: GetDataOptions['constituencies'] = {}
  ): GetDataReturnType<'constituencies', 'server'> {
    console.info(
      '[debug] localServerDataProvider.ts: LocalServerDataProvider.getConstituenciesData() called'
    );
    return this.readData(DATA_PATHS.constituencies, options).catch((e) => e);
  }

  async getNominationsData(
    options: GetDataOptions['nominations'] = {}
  ): GetDataReturnType<'nominations', 'server'> {
    console.info(
      '[debug] localServerDataProvider.ts: LocalServerDataProvider.getNominationsData() called'
    );
    return this.readData(DATA_PATHS.nominations, options).catch((e) => e);
  }

  async getCandidatesData(
    options: GetDataOptions['candidates'] = {}
  ): GetDataReturnType<'candidates', 'server'> {
    console.info(
      '[debug] localServerDataProvider.ts: LocalServerDataProvider.getCandidatesData() called'
    );
    return this.readData(DATA_PATHS.candidates, options).catch((e) => e);
  }

  protected async readFile(filePath: DataPath): Promise<Response> {
    const data = read(filePath);
    if (!data?.ok)
      throw new DataProviderError(
        `Error with readData: Response: ${data.status} / ${data.statusText}`
      );
    return data;
  }

  protected async readData(filePath: DataPath, options?: GetDataOptionsBase): Promise<JsonString> {
    const data = await this.readFile(filePath).catch((e) => {
      throw e;
    });
    // Only parse the json if we need to filter it somehow so because the api route will need to stringify it anyway
    // TODO: implement basic filtering (and locale-specifics) by simply dividing the data into separate files (such as nominations by constituency and even candidates although in that case they might be duplicated in multiple constituencies, and all files by locale, which again results and duplicated data) so we don't need to parse it. Only pass those options to `filter` that cannot be resolved this way.
    return (
      options && Object.keys(options).length > 0
        ? data.json().then((data) => JSON.stringify(filter(data, options)))
        : data.text()
    ).catch((e) => {
      throw new DataProviderError(`Error with readData: ${e}`);
    });
  }
}

export const serverDataProvider = new LocalServerDataProvider();

/**
 * A temporary placeholder for filtering functions.
 */
function filter<TData extends DataObjectData>(
  data: TData[],
  options?: GetDataOptionsBase
): TData[] {
  if (!options) return data;
  console.info(`TODO: filter data with options: ${JSON.stringify(options)}`);
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
      if (Array.isArray(itemValue)) return itemValue.includes(value);
      return itemValue === value;
    }
    return true;
  });
}
