import { SupabaseAdminWriter } from './adapters/supabase/adminWriter/supabaseAdminWriter';
import { resolveAdapterConfig } from './dataProvider';
import type { AdapterSource } from './dataProvider';

/**
 * Obtain an `AdminWriter` for one request or one admin job. Every call returns a fresh instance, so a long-running job keeps its own writer for its whole run.
 * @param source - Where this request's or job's client comes from.
 * @returns An admin writer nothing else holds a reference to.
 */
export function createAdminWriter(source: AdapterSource): SupabaseAdminWriter {
  return new SupabaseAdminWriter(resolveAdapterConfig(source));
}
