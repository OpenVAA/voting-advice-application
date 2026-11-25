/**
 * Unit tests for reading the signed-in address from the session cookies `@supabase/ssr` writes.
 *
 * Run: yarn test:unit:tests sessionCookie
 */
import { describe, expect, it } from 'vitest';
import { sessionAddressOf } from './sessionCookie';

/** The cookie value `@supabase/ssr` writes for a session. */
function encodedSession(session: unknown): string {
  return `base64-${Buffer.from(JSON.stringify(session), 'utf8').toString('base64url')}`;
}

describe('sessionAddressOf', () => {
  it('reads the address from a session held in one cookie', () => {
    const cookies = [
      { name: 'PARAGLIDE_LOCALE', value: 'en' },
      { name: 'sb-127-auth-token', value: encodedSession({ user: { email: 'one@example.test' } }) }
    ];
    expect(sessionAddressOf(cookies)).toBe('one@example.test');
  });

  it('joins the chunks in the order of their index, whatever order the cookies come in', () => {
    const value = encodedSession({ access_token: 'x'.repeat(40), user: { email: 'chunked@example.test' } });
    const third = Math.ceil(value.length / 3);
    const cookies = [
      { name: 'sb-127-auth-token.2', value: value.slice(2 * third) },
      { name: 'sb-127-auth-token.0', value: value.slice(0, third) },
      { name: 'sb-127-auth-token.1', value: value.slice(third, 2 * third) }
    ];
    expect(sessionAddressOf(cookies)).toBe('chunked@example.test');
  });

  it('reads a URL-encoded value', () => {
    const cookies = [
      { name: 'sb-127-auth-token', value: encodeURIComponent(JSON.stringify({ user: { email: 'raw@example.test' } })) }
    ];
    expect(sessionAddressOf(cookies)).toBe('raw@example.test');
  });

  it('answers undefined when no session cookie is held, and ignores the code verifier', () => {
    expect(sessionAddressOf([])).toBeUndefined();
    expect(sessionAddressOf([{ name: 'sb-127-auth-token-code-verifier', value: 'verifier' }])).toBeUndefined();
  });

  it('answers undefined for a session whose user has no address', () => {
    expect(sessionAddressOf([{ name: 'sb-127-auth-token', value: encodedSession({ user: {} }) }])).toBeUndefined();
  });
});
