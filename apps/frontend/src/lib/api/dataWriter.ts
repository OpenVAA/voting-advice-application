import { SupabaseDataWriter } from './adapters/supabase/dataWriter/supabaseDataWriter';
import { resolveAdapterConfig } from './dataProvider';
import type { AdapterSource } from './dataProvider';

/**
 * Obtain a `DataWriter` for one request. Every call returns a fresh writer over the client `source` names: the request's own client on the server, or the tab's memoised client in the browser.
 *
 * The writer also carries the request-scoped `fetch`, which `clearIdToken`, `logout` and `exchangeCodeForIdToken`, inherited from `UniversalDataWriter`, use to reach same-origin app routes with the request's own session cookie.
 * @param source - Where this request's client comes from.
 * @returns A new writer.
 */
export function createDataWriter(source: AdapterSource): SupabaseDataWriter {
  return new SupabaseDataWriter(resolveAdapterConfig(source));
}
