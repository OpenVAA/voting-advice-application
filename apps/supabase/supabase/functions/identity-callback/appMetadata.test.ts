/**
 * The account's `app_metadata` as the identity-callback function writes it.
 *
 * `app_metadata` is carried in every access token, so whatever the builder answers is readable wherever the token is. These cases state the builder's whole answer by content, and hand it a provider's personal identity code and birth date to show that neither value gets through.
 */

import { describe, expect, it } from 'vitest';
import { identityAppMetadata, REMOVED_CLAIM_KEYS } from './appMetadata';
import { REGISTERED_ENTITIES_KEY } from './ownEntity';

const PROJECT_ID = '00000000-0000-0000-0000-0000000000aa';
const ENTITY_ID = '22222222-2222-2222-2222-222222222222';
const MATCH_VALUE = 'subject-fixture-value';
const HETU_VALUE = 'hetu-fixture-value';
const BIRTHDATE_VALUE = 'birthdate-fixture-value';

const REGISTERED = { [PROJECT_ID]: { candidate: ENTITY_ID } };

describe('REMOVED_CLAIM_KEYS', () => {
  it('names the personal identity code and the birth date', () => {
    expect(REMOVED_CLAIM_KEYS).toEqual(['hetu', 'birthdate']);
  });
});

describe('identityAppMetadata', () => {
  it('answers exactly the provider, the match property, the match value, the record and a null for each removed claim', () => {
    expect(
      identityAppMetadata({
        providerType: 'idura-ftn',
        matchProp: 'sub',
        matchValue: MATCH_VALUE,
        registeredEntities: REGISTERED
      })
    ).toEqual({
      identity_provider: 'idura-ftn',
      identity_match_prop: 'sub',
      identity_match_value: MATCH_VALUE,
      [REGISTERED_ENTITIES_KEY]: REGISTERED,
      hetu: null,
      birthdate: null
    });
  });

  it("carries no value of the provider's other claims, even when they are handed to it", () => {
    const providerClaims = { hetu: HETU_VALUE, birthdate: BIRTHDATE_VALUE };

    const metadata = identityAppMetadata({
      providerType: 'idura-ftn',
      matchProp: 'sub',
      matchValue: MATCH_VALUE,
      registeredEntities: REGISTERED,
      ...providerClaims
    } as Parameters<typeof identityAppMetadata>[0]);

    const serialized = JSON.stringify(metadata);
    expect(serialized).not.toContain(HETU_VALUE);
    expect(serialized).not.toContain(BIRTHDATE_VALUE);
    expect(metadata.hetu).toBeNull();
    expect(metadata.birthdate).toBeNull();
    expect(Object.keys(metadata).sort()).toEqual(
      [
        'birthdate',
        'hetu',
        'identity_match_prop',
        'identity_match_value',
        'identity_provider',
        REGISTERED_ENTITIES_KEY
      ].sort()
    );
  });

  it('holds no record key when no record is given, so the write leaves the stored record as it is', () => {
    const metadata = identityAppMetadata({ providerType: 'idura-ftn', matchProp: 'sub', matchValue: MATCH_VALUE });

    expect(Object.hasOwn(metadata, REGISTERED_ENTITIES_KEY)).toBe(false);
    expect(metadata).toEqual({
      identity_provider: 'idura-ftn',
      identity_match_prop: 'sub',
      identity_match_value: MATCH_VALUE,
      hetu: null,
      birthdate: null
    });
  });

  it('carries the record it is given unchanged, with every project and type', () => {
    const record = { ...REGISTERED, '00000000-0000-0000-0000-0000000000bb': { organization: ENTITY_ID } };

    expect(
      identityAppMetadata({
        providerType: 'signicat-ftn',
        matchProp: 'sub',
        matchValue: MATCH_VALUE,
        registeredEntities: record
      })[REGISTERED_ENTITIES_KEY]
    ).toEqual(record);
  });
});
