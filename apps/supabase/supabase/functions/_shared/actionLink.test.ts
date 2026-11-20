/**
 * The token of a generated action link: its `token` parameter, and an empty string for anything that carries none.
 */

import { describe, expect, it } from 'vitest';
import { actionLinkToken } from './actionLink.ts';

describe('actionLinkToken', () => {
  it('reads the token parameter of an action link, not its token hash', () => {
    const link = 'http://127.0.0.1:54321/auth/v1/verify?token=abc123&type=email_change&redirect_to=http://x.example';
    expect(actionLinkToken(link)).toBe('abc123');
  });

  it('reads the token of a magic link', () => {
    expect(actionLinkToken('http://127.0.0.1:54321/auth/v1/verify?token=m4g1c&type=magiclink')).toBe('m4g1c');
  });

  it.each([[''], ['not a url'], ['http://x.example/verify?type=email_change'], [undefined], [null], [7]])(
    'reads an empty token from %j',
    (link) => {
      expect(actionLinkToken(link)).toBe('');
    }
  );
});
