/**
 * Edge Function claim configuration and extraction tests.
 *
 * Tests the pure functions extracted from the identity-callback Edge Function.
 * Covers PROVIDER_CONFIGS for both Signicat and Idura, and extractIdentityClaims
 * behavior with various payloads (D-07 from 48-CONTEXT.md).
 *
 * No mocks needed -- claimConfig.ts has no external dependencies.
 */

import { describe, it, expect } from 'vitest';
import { PROVIDER_CONFIGS, extractIdentityClaims } from './claimConfig';

describe('PROVIDER_CONFIGS', () => {
  describe('signicat', () => {
    it('uses birthdate for identity matching', () => {
      expect(PROVIDER_CONFIGS.signicat.identityMatchProp).toBe('birthdate');
    });

    it('uses given_name for first name', () => {
      expect(PROVIDER_CONFIGS.signicat.firstNameProp).toBe('given_name');
    });

    it('uses family_name for last name', () => {
      expect(PROVIDER_CONFIGS.signicat.lastNameProp).toBe('family_name');
    });

    it('has empty extractClaims array (no extra metadata)', () => {
      expect(PROVIDER_CONFIGS.signicat.extractClaims).toEqual([]);
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

  it('extracts matchValue from signicat identityMatchProp (birthdate)', () => {
    const result = extractIdentityClaims(testPayload, PROVIDER_CONFIGS.signicat);

    expect(result.matchValue).toBe('1985-06-15');
    expect(result.firstName).toBe('Matti');
    expect(result.lastName).toBe('Virtanen');
  });

  it('extracts matchValue from idura identityMatchProp (sub)', () => {
    const result = extractIdentityClaims(testPayload, PROVIDER_CONFIGS.idura);

    expect(result.matchValue).toBe('some-uuid-1234');
    expect(result.firstName).toBe('Matti');
    expect(result.lastName).toBe('Virtanen');
  });

  it('signicat extraClaims is empty (no extra metadata saved)', () => {
    const result = extractIdentityClaims(testPayload, PROVIDER_CONFIGS.signicat);

    expect(result.extraClaims).toEqual({});
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
    expect(() => extractIdentityClaims(payloadWithoutSub, PROVIDER_CONFIGS.idura)).toThrow(
      /sub=missing/
    );
  });

  it('throws when required first name claim is missing', () => {
    const payloadWithoutFirstName = {
      family_name: 'User',
      sub: 'test-sub',
      birthdate: '2000-01-01'
      // no given_name
    };

    expect(() => extractIdentityClaims(payloadWithoutFirstName, PROVIDER_CONFIGS.idura)).toThrow(
      /given_name=missing/
    );
  });

  it('throws when required last name claim is missing', () => {
    const payloadWithoutLastName = {
      given_name: 'Test',
      sub: 'test-sub',
      birthdate: '2000-01-01'
      // no family_name
    };

    expect(() => extractIdentityClaims(payloadWithoutLastName, PROVIDER_CONFIGS.idura)).toThrow(
      /family_name=missing/
    );
  });
});
