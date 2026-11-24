/**
 * The account's `app_metadata` as the identity-callback function writes it.
 *
 * `app_metadata` is carried in every access token, so whatever the builder answers is readable wherever the token is. These cases state the builder's whole answer by content, and hand it a provider's personal identity code, a birth date and a registered-entities record to show that none of them gets through.
 */

import { describe, expect, it } from 'vitest';
import { identityAppMetadata, REMOVED_CLAIM_KEYS } from './appMetadata';

const PROJECT_ID = '00000000-0000-0000-0000-0000000000aa';
const ENTITY_ID = '22222222-2222-2222-2222-222222222222';
const MATCH_VALUE = 'subject-fixture-value';
const HETU_VALUE = 'hetu-fixture-value';
const BIRTHDATE_VALUE = 'birthdate-fixture-value';

describe('REMOVED_CLAIM_KEYS', () => {
  it('names the personal identity code and the birth date', () => {
    expect(REMOVED_CLAIM_KEYS).toEqual(['hetu', 'birthdate']);
  });
});

describe('identityAppMetadata', () => {
  it('answers exactly the provider, the match property, the match value and a null for each removed claim', () => {
    expect(identityAppMetadata({ providerType: 'idura-ftn', matchProp: 'sub', matchValue: MATCH_VALUE })).toEqual({
      identity_provider: 'idura-ftn',
      identity_match_prop: 'sub',
      identity_match_value: MATCH_VALUE,
      hetu: null,
      birthdate: null
    });
  });

  it("carries no value of the provider's other claims and no record, even when they are handed to it", () => {
    const handed = {
      hetu: HETU_VALUE,
      birthdate: BIRTHDATE_VALUE,
      registeredEntities: { [PROJECT_ID]: { candidate: ENTITY_ID } }
    };

    const metadata = identityAppMetadata({
      providerType: 'idura-ftn',
      matchProp: 'sub',
      matchValue: MATCH_VALUE,
      ...handed
    } as Parameters<typeof identityAppMetadata>[0]);

    const serialized = JSON.stringify(metadata);
    expect(serialized).not.toContain(HETU_VALUE);
    expect(serialized).not.toContain(BIRTHDATE_VALUE);
    expect(serialized).not.toContain(ENTITY_ID);
    expect(metadata.hetu).toBeNull();
    expect(metadata.birthdate).toBeNull();
    expect(Object.keys(metadata).sort()).toEqual(
      ['birthdate', 'hetu', 'identity_match_prop', 'identity_match_value', 'identity_provider'].sort()
    );
  });
});
