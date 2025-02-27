import { browser } from '$app/environment';
import type { UniversalDataWriter } from '$lib/api/base/universalDataWriter';

/**
 * Init and return a `DataWriter` instance from the provided promised import from `$lib/api/dataWriter`.
 */
export async function prepareDataWriter(dataWriterPromise: Promise<UniversalDataWriter>): Promise<UniversalDataWriter> {
  if (!browser) throw new Error('DataWriter methods in CandidateContext can only be called in a browser environment');
  const dataWriter = await dataWriterPromise;
  dataWriter.init({ fetch });
  return dataWriter;
}
