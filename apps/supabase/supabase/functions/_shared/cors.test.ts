/**
 * The base CORS headers: any origin and the Supabase client's request headers, and nothing else.
 */

import { describe, expect, it } from 'vitest';
import { BASE_CORS_HEADERS } from './cors.ts';

describe('BASE_CORS_HEADERS', () => {
  it('admits any origin and the headers the Supabase client sends', () => {
    expect(BASE_CORS_HEADERS).toEqual({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
    });
  });

  it('is frozen, so no function can change what the others answer with', () => {
    expect(Object.isFrozen(BASE_CORS_HEADERS)).toBe(true);
  });
});
