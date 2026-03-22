import { SupabaseDataWriter } from './supabaseDataWriter';

export const dataWriter = new SupabaseDataWriter();

/**
 * Create a fresh DataWriter instance for server-side use.
 * Each server request should use its own instance to avoid the singleton
 * race condition where concurrent requests overwrite each other's
 * Supabase client via init().
 */
export function createDataWriter(): SupabaseDataWriter {
  return new SupabaseDataWriter();
}
