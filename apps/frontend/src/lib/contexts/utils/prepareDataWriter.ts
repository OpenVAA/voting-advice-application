import { staticSettings } from '@openvaa/app-shared';
import { browser } from '$app/environment';
import type { UniversalDataWriter } from '$lib/api/base/universalDataWriter';

/**
 * The browser invariant the context writer sites share, asserted in one place rather than at each of the nineteen call sites.
 * It is what makes the `browser` arm's client source a fact: the factories take the tab's memoized Supabase client because the caller has already proven it is running in a tab, so no adapter has to sniff its own environment.
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
