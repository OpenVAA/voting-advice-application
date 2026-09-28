/**
 * Test stub for $env/dynamic/public.
 *
 * `PUBLIC_PROJECT_ID` is seeded because the Supabase adapter mixin resolves it at construction and throws when it is absent. Without a seeded value every spec that builds an adapter would have to pass one explicitly, and the failure would read as a missing project rather than as a missing stub value.
 */
export const env: Record<string, string> = {
  PUBLIC_PROJECT_ID: '00000000-0000-0000-0000-000000000001'
};
