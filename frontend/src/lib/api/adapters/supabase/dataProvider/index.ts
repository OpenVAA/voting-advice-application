import { SupabaseDataProvider } from './supabaseDataProvider';

export const dataProvider = new SupabaseDataProvider();

/**
 * Create a fresh DataProvider instance for server-side use.
 * Each server request should use its own instance to avoid the singleton
 * race condition where concurrent requests overwrite each other's
 * Supabase client via init().
 */
export function createDataProvider(): SupabaseDataProvider {
  return new SupabaseDataProvider();
}
