import type { Database } from '@openvaa/supabase-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdapterConfig } from '$lib/api/base/universalAdapter.type';

/**
 * What a Supabase adapter is constructed from.
 * Extends the base AdapterConfig with the client this adapter speaks to Supabase through, and with the locales it extracts JSONB in.
 */
export interface SupabaseAdapterConfig extends AdapterConfig {
  /** The Supabase client every read and write of this adapter goes through. Required, and it belongs to one request. */
  client: SupabaseClient<Database>;
  /** Current locale for JSONB localization extraction, and the fallback behind each read method's own `options.locale`. Forwarded from `AdapterSource` by `resolveAdapterConfig`, so a caller that knows the request's language sets it once at construction. */
  locale?: string;
  /** Default locale fallback (from projects.default_locale). */
  defaultLocale?: string;
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
