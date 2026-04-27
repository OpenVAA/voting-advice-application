import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@openvaa/supabase-types';
import type { AdapterConfig } from '$lib/api/base/universalAdapter.type';

/**
 * Configuration for Supabase adapter initialization.
 * Extends the base AdapterConfig with locale and optional server client.
 */
export interface SupabaseAdapterConfig extends AdapterConfig {
  /** Current locale for JSONB localization extraction. */
  locale?: string;
  /** Default locale fallback (from projects.default_locale). */
  defaultLocale?: string;
  /** Pre-built server-side SupabaseClient (e.g., from hooks.server.ts). When provided, skips createClient(). */
  serverClient?: SupabaseClient<Database>;
}

/**
 * Interface provided by supabaseAdapterMixin to all Supabase adapter classes.
 */
export interface SupabaseAdapter {
  /** The typed Supabase client instance. */
  readonly supabase: SupabaseClient<Database>;
  /** The current locale for data extraction. */
  readonly locale: string;
  /** The default locale for fallback. */
  readonly defaultLocale: string;
}
