import { SupabaseAdminWriter } from './adapters/supabase/adminWriter/supabaseAdminWriter';
import { resolveAdapterConfig } from './dataProvider';
import type { AdapterSource } from './dataProvider';

/**
 * Obtain an `AdminWriter` for ONE request — or, from `157.2-06`, for ONE job.
 *
 * Every call returns a FRESH instance. This adapter carried the worst-consequence instance of the shared-state defect: the two long-running admin features configured the module singleton once at job start and then ran for MINUTES, so a second admin starting a job rebound the first job's writer mid-run and the first job's remaining writes executed under the second admin's configuration. The rebind window was not the gap between two statements — it was the whole job. `157.2-06` gave each job its own writer and `157.2-07` deleted the singleton, so the window no longer exists.
 *
 * This module was also the one selector of the four left off `ADAPTER_BOUNDARY_ALLOWLIST`, and was measured firing `.supabase` where its three siblings were silent; `157.2-02` put it back with its siblings in the same commit that made it read a client.
 * @param source - Where this request's or job's client comes from.
 * @returns An admin writer nothing else holds a reference to.
 */
export function createAdminWriter(source: AdapterSource): SupabaseAdminWriter {
  return new SupabaseAdminWriter(resolveAdapterConfig(source));
}
