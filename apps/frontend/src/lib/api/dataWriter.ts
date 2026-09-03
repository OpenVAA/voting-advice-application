import { SupabaseDataWriter } from './adapters/supabase/dataWriter/supabaseDataWriter';
import { resolveAdapterConfig } from './dataProvider';
import type { AdapterSource } from './dataProvider';

/**
 * Obtain a `DataWriter` for ONE request.
 *
 * Every call returns a FRESH instance. The writer carries a second shared field the provider does not — the request-scoped `fetch` — and it is live for a reason worth stating: `SupabaseDataWriter` inherits `clearIdToken`, `logout` and `exchangeCodeForIdToken` from `UniversalDataWriter` un-overridden, and those reach SAME-ORIGIN app routes, where the forwarded cookie really is the request's own session. The older justification — that the request-scoped fetch forwards cookies to Supabase — is false: Supabase is cross-origin and PostgREST authenticates on `Authorization`. Do not restore it.
 * @param source - Where this request's client comes from.
 * @returns A writer nothing else holds a reference to.
 */
export function createDataWriter(source: AdapterSource): SupabaseDataWriter {
  return new SupabaseDataWriter(resolveAdapterConfig(source));
}
