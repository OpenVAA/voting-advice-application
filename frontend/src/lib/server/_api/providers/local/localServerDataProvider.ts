import {read} from '$app/server';
import type {
  DataProviderConfig,
  GetDataOptionsBase,
  GetNominatedCandidatesOptions,
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

  async getCandidatesData(
    options?: GetNominatedCandidatesOptions
  ): Promise<JsonString | DataProviderError> {
    console.info(
      '[debug] localServerDataProvider.ts: LocalServerDataProvider.getCandidatesData() called'
    );
    return this.readFile(DATA_PATHS.candidates, options).catch((e) => e);
  }

  protected async readFile(filePath: DataPath, options?: GetDataOptionsBase): Promise<JsonString> {
    const data = read(filePath);
    if (!data?.ok)
      throw new DataProviderError(
        `Error with readFile: Response: ${data.status} / ${data.statusText}`
      );
    // Only parse the json if we need to filter it somehow so because the api route will need to stringify it anyway
    // TODO: implement basic filtering (and locale-specifics) by simply dividing the data into separate files so we don't need to parse it. Only pass those options to `filter` that cannot be resolved this way.
    return (
      options && Object.keys(options).length > 0
        ? data.json().then((data) => JSON.stringify(filter(data, options)))
        : data.text()
    ).catch((e) => {
      throw new DataProviderError(`Error with readFile: ${e}`);
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
  console.info(`TODO: filter data with options: ${JSON.stringify(options)}`);
  return data;
}
