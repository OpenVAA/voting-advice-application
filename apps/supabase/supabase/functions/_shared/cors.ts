/**
 * The CORS headers every Edge Function answers with. Each function adds the headers only it needs.
 *
 * Constants with no Deno imports, no URL imports and no reference to the Deno global, so the module can be imported by both the Edge Functions and vitest.
 *
 * SHARED. The module lives in `functions/_shared/`, the directory for modules more than one function uses. Each function imports it by relative path (`../_shared/cors.ts`).
 */

/** The origin and request headers every function admits: any origin, and the headers the Supabase client sends. */
export const BASE_CORS_HEADERS = Object.freeze({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
} as const);
