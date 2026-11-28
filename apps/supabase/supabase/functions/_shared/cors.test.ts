/**
 * The base CORS headers: any origin and the Supabase client's request headers, and nothing else; and the JSON answer built with them.
 */

import { describe, expect, it } from 'vitest';
import { BASE_CORS_HEADERS, jsonAnswer } from './cors.ts';

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

describe('jsonAnswer', () => {
  it('answers the body as JSON, with the status and the base CORS headers', async () => {
    const response = jsonAnswer({ error: 'Not here' }, 404);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Not here' });
    expect(Object.fromEntries(response.headers)).toEqual({
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
      'content-type': 'application/json'
    });
  });

  it('answers with the headers it is given, and a JSON content type over any other', () => {
    const response = jsonAnswer({}, 429, { 'Retry-After': '42', 'Content-Type': 'text/plain' });
    expect(Object.fromEntries(response.headers)).toEqual({
      'retry-after': '42',
      'content-type': 'application/json'
    });
  });
});
