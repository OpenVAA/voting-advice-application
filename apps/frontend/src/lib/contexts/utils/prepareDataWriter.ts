import { staticSettings } from '@openvaa/app-shared';
import { browser } from '$app/environment';
import type { UniversalDataWriter } from '$lib/api/base/universalDataWriter';

/**
 * Init and return the synchronous `DataWriter` instance imported from `$lib/api/dataWriter`.
 */
export async function prepareDataWriter(dataWriter: UniversalDataWriter): Promise<UniversalDataWriter> {
  if (!browser) throw new Error('DataWriter methods in contexts can only be called in a browser environment');
  if (!dataWriter)
    throw new Error(
      `Failed to initialize DataWriter. Perhaps the adapter (${staticSettings.dataAdapter.type}) does not support dataWriter?`
    );
  dataWriter.init({ fetch });
  return dataWriter;
}
