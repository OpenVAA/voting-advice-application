/**
 * Edge Function claim configuration and extraction tests.
 *
 * Tests the pure functions extracted from the identity-callback Edge Function.
 * Covers PROVIDER_CONFIGS for both Signicat and Idura, and extractIdentityClaims behavior across complete, partial and missing-claim payloads.
 *
 * No mocks needed -- claimConfig.ts has no external dependencies.
 */

import { describe, it, expect } from 'vitest';
import { PROVIDER_CONFIGS, extractIdentityClaims } from './claimConfig';

describe('PROVIDER_CONFIGS', () => {
  describe('signicat', () => {
    it('uses sub for identity matching (stable OIDC subject)', () => {
      // NOT `birthdate`. See the collision test at the bottom of this file for why: `identityMatchProp`'s value is the account key, so a non-identifier claim merges distinct people into one auth user.
      expect(PROVIDER_CONFIGS.signicat.identityMatchProp).toBe('sub');
    });

    it('uses given_name for first name', () => {
      expect(PROVIDER_CONFIGS.signicat.firstNameProp).toBe('given_name');
    });

    it('uses family_name for last name', () => {
      expect(PROVIDER_CONFIGS.signicat.lastNameProp).toBe('family_name');
    });

    it('still captures birthdate, as metadata rather than as the key', () => {
      // Re-keying to `sub` must not LOSE the claim -- it moves it from the account key to app_metadata.
      expect(PROVIDER_CONFIGS.signicat.extractClaims).toEqual(['birthdate']);
    });
  });

  describe('idura', () => {
    it('uses sub for identity matching (persistent pseudonym)', () => {
      expect(PROVIDER_CONFIGS.idura.identityMatchProp).toBe('sub');
    });

    it('uses given_name for first name', () => {
      expect(PROVIDER_CONFIGS.idura.firstNameProp).toBe('given_name');
    });

    it('uses family_name for last name', () => {
      expect(PROVIDER_CONFIGS.idura.lastNameProp).toBe('family_name');
    });

    it('extractClaims includes birthdate and hetu', () => {
      expect(PROVIDER_CONFIGS.idura.extractClaims).toContain('birthdate');
      expect(PROVIDER_CONFIGS.idura.extractClaims).toContain('hetu');
    });
  });
});

describe('extractIdentityClaims', () => {
  const testPayload = {
    given_name: 'Matti',
    family_name: 'Virtanen',
    birthdate: '1985-06-15',
    sub: 'some-uuid-1234',
    hetu: '150685-1234'
  };

  it('extracts matchValue from signicat identityMatchProp (sub)', () => {
    const result = extractIdentityClaims(testPayload, PROVIDER_CONFIGS.signicat);

    // The subject, NOT the birthdate that also sits in this payload -- which is what makes the assertion able to see a regression back to birthdate keying.
    expect(result.matchValue).toBe('some-uuid-1234');
    expect(result.firstName).toBe('Matti');
    expect(result.lastName).toBe('Virtanen');
  });

  it('extracts matchValue from idura identityMatchProp (sub)', () => {
    const result = extractIdentityClaims(testPayload, PROVIDER_CONFIGS.idura);

    expect(result.matchValue).toBe('some-uuid-1234');
    expect(result.firstName).toBe('Matti');
    expect(result.lastName).toBe('Virtanen');
  });

  it('signicat extraClaims carries the birthdate it no longer keys on', () => {
    const result = extractIdentityClaims(testPayload, PROVIDER_CONFIGS.signicat);

    expect(result.extraClaims).toEqual({ birthdate: '1985-06-15' });
  });

  it('idura extraClaims includes birthdate and hetu values', () => {
    const result = extractIdentityClaims(testPayload, PROVIDER_CONFIGS.idura);

    expect(result.extraClaims).toEqual({
      birthdate: '1985-06-15',
      hetu: '150685-1234'
    });
  });

  it('idura extraClaims omits undefined claims gracefully', () => {
    const payloadWithoutHetu = {
      given_name: 'Liisa',
      family_name: 'Korhonen',
      sub: 'other-uuid',
      birthdate: '1990-01-01'
      // no hetu
    };

    const result = extractIdentityClaims(payloadWithoutHetu, PROVIDER_CONFIGS.idura);

    expect(result.extraClaims).toEqual({
      birthdate: '1990-01-01'
      // hetu is not present -- omitted rather than set to undefined
    });
    expect(result.extraClaims).not.toHaveProperty('hetu');
  });

  it('throws when required identity match claim is missing', () => {
    const payloadWithoutSub = {
      given_name: 'Test',
      family_name: 'User',
      birthdate: '2000-01-01'
      // no sub
    };

    expect(() => extractIdentityClaims(payloadWithoutSub, PROVIDER_CONFIGS.idura)).toThrow(
      /Missing required identity claims/
    );
    expect(() => extractIdentityClaims(payloadWithoutSub, PROVIDER_CONFIGS.idura)).toThrow(/sub=missing/);
  });

  it('throws when required first name claim is missing', () => {
    const payloadWithoutFirstName = {
      family_name: 'User',
      sub: 'test-sub',
      birthdate: '2000-01-01'
      // no given_name
    };

    expect(() => extractIdentityClaims(payloadWithoutFirstName, PROVIDER_CONFIGS.idura)).toThrow(/given_name=missing/);
  });

  it('throws when required last name claim is missing', () => {
    const payloadWithoutLastName = {
      given_name: 'Test',
      sub: 'test-sub',
      birthdate: '2000-01-01'
      // no family_name
    };

    expect(() => extractIdentityClaims(payloadWithoutLastName, PROVIDER_CONFIGS.idura)).toThrow(/family_name=missing/);
  });
});

/**
 * The identity-key collision regression test.
 *
 * `matchValue` is not a display field: the Edge Function writes it to `app_metadata.identity_match_value` (the key `findUserByIdentityMatch` looks up) and interpolates it into `${matchValue}@bank-auth.placeholder` (the email the auth user is created with, and the address the magic link is issued to). So two people whose `matchValue` is equal are ONE Supabase account: the second to bank-authenticate is matched to the first one's user id, finds the first one's candidate row, and is handed a session for it. Under `identityMatchProp: 'birthdate'` that needed nothing more than a shared date of birth.
 *
 * Each case therefore asserts DISTINCTNESS across two payloads that differ in exactly one claim. Do not weaken either to asserting one payload's value: a single-payload check passes just as happily when every payload maps to the same key, which is the whole defect.
 */
describe('identity key uniqueness', () => {
  const twinA = {
    given_name: 'Matti',
    family_name: 'Virtanen',
    birthdate: '1985-06-15',
    sub: 'subject-aaaa',
    hetu: '150685-1234'
  };
  // Differs from twinA in `sub` ALONE -- same names, same birthdate, same everything the old key was derived from. Two unrelated candidates who happen to share a birthday.
  const twinB = { ...twinA, sub: 'subject-bbbb' };

  for (const provider of ['signicat', 'idura'] as const) {
    it(`${provider}: payloads differing only in sub produce different match values`, () => {
      const a = extractIdentityClaims(twinA, PROVIDER_CONFIGS[provider]);
      const b = extractIdentityClaims(twinB, PROVIDER_CONFIGS[provider]);

      expect(a.matchValue).not.toBe(b.matchValue);
      // And the derived account key, which is the thing that actually collided.
      expect(`${a.matchValue}@bank-auth.placeholder`).not.toBe(`${b.matchValue}@bank-auth.placeholder`);
    });

    it(`${provider}: a shared birthdate does NOT merge two candidates`, () => {
      const a = extractIdentityClaims(twinA, PROVIDER_CONFIGS[provider]);
      const b = extractIdentityClaims(twinB, PROVIDER_CONFIGS[provider]);

      expect(a.matchValue).not.toBe(twinA.birthdate);
      expect(b.matchValue).not.toBe(twinB.birthdate);
    });
  }
});
