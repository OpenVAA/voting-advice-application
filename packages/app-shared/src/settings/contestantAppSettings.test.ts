import { describe, expect, test } from 'vitest';
import {
  canonicalMembersOf,
  getContestantAppNameKey,
  getEffectiveRegistrationModes,
  getServedEntityTypes,
  isRegistrationModeAllowed,
  isRegistrationModeAllowedForAnyType,
  REGISTRATION_MODE,
  REGISTRATION_MODES,
  SERVED_ENTITY_TYPES
} from './contestantAppSettings';
import { dynamicSettings } from './dynamicSettings';
import type { ContestantAppSettingsInput } from './contestantAppSettings';
import type { DynamicSettings } from './dynamicSettings.type';

describe('the vocabularies', () => {
  test('the ordered list of registration modes names every mode', () => {
    expect(Object.values(REGISTRATION_MODE)).toEqual([...REGISTRATION_MODES]);
  });
});

describe('the accepted inputs', () => {
  test('the shipped settings, a deep partial of them and an empty object need no cast', () => {
    const merged: DynamicSettings = dynamicSettings;
    const partial: Partial<DynamicSettings> = { contestantApp: dynamicSettings.contestantApp };
    expect(getServedEntityTypes(merged)).toEqual(['candidate']);
    expect(getServedEntityTypes(partial)).toEqual(['candidate']);
    expect(getServedEntityTypes({})).toEqual(['candidate']);
  });
});

describe('canonicalMembersOf', () => {
  test('answers the listed members in vocabulary order without repeats', () => {
    expect(canonicalMembersOf(REGISTRATION_MODES, ['code', 'email', 'code', 'identity_provider'])).toEqual([
      'identity_provider',
      'email',
      'code'
    ]);
  });

  test('reads an absent list as an empty one', () => {
    expect(canonicalMembersOf(REGISTRATION_MODES, undefined)).toEqual([]);
  });
});

describe('getServedEntityTypes', () => {
  test.each([
    ['undefined', undefined],
    ['null', null],
    ['an empty object', {}],
    ['a null root', { contestantApp: null }],
    ['a root without the member', { contestantApp: {} }],
    ['a member with no key', { contestantApp: { servedEntityTypes: {} } }]
  ] as Array<[string, ContestantAppSettingsInput]>)('answers the shipped default for %s', (_, input) => {
    expect(getServedEntityTypes(input)).toEqual(['candidate']);
  });

  test('answers the keys in canonical order', () => {
    expect(
      getServedEntityTypes({
        contestantApp: {
          servedEntityTypes: { organization: { registrationModes: [] }, candidate: { registrationModes: [] } }
        }
      })
    ).toEqual(['candidate', 'organization']);
  });

  test('answers a single served type as declared', () => {
    expect(
      getServedEntityTypes({ contestantApp: { servedEntityTypes: { organization: { registrationModes: [] } } } })
    ).toEqual(['organization']);
  });

  test('answers a fresh list on every call, never the shipped one', () => {
    const first = getServedEntityTypes({});
    first.push('organization');
    expect(getServedEntityTypes({})).toEqual(['candidate']);
    expect(getServedEntityTypes(dynamicSettings)).toEqual(['candidate']);
  });
});

describe('getEffectiveRegistrationModes', () => {
  test('answers one empty row for the one served type when nothing is declared', () => {
    expect(getEffectiveRegistrationModes({})).toEqual({ candidate: [] });
    expect(getEffectiveRegistrationModes(undefined)).toEqual({ candidate: [] });
  });

  test('has a row for each served type and no other', () => {
    const effective = getEffectiveRegistrationModes({
      contestantApp: { servedEntityTypes: { organization: { registrationModes: ['email', 'code'] } } }
    });
    expect(effective).toEqual({ organization: ['email', 'code'] });
    expect(Object.keys(effective)).toEqual(['organization']);
  });

  test('reads an entry with no modes as an empty row', () => {
    expect(
      getEffectiveRegistrationModes({
        contestantApp: { servedEntityTypes: { candidate: { registrationModes: ['code'] }, organization: {} } }
      })
    ).toEqual({ candidate: ['code'], organization: [] });
  });

  test('answers each row in canonical order with no repeats', () => {
    expect(
      getEffectiveRegistrationModes({
        contestantApp: {
          servedEntityTypes: { candidate: { registrationModes: ['code', 'email', 'code', 'identity_provider'] } }
        }
      })
    ).toEqual({ candidate: ['identity_provider', 'email', 'code'] });
  });
});

describe('isRegistrationModeAllowed', () => {
  test('is true when the type is served and its row lists the mode', () => {
    const input = {
      contestantApp: { servedEntityTypes: { candidate: { registrationModes: ['identity_provider'] } } }
    } satisfies ContestantAppSettingsInput;
    expect(isRegistrationModeAllowed(input, 'candidate', REGISTRATION_MODE.IdentityProvider)).toBe(true);
    expect(isRegistrationModeAllowed(input, 'candidate', REGISTRATION_MODE.Email)).toBe(false);
  });

  test('is false when the type is not served', () => {
    const input = {
      contestantApp: { servedEntityTypes: { candidate: { registrationModes: ['email'] } } }
    } satisfies ContestantAppSettingsInput;
    expect(isRegistrationModeAllowed(input, 'organization', 'email')).toBe(false);
  });

  test('is false for every cell when nothing is declared', () => {
    for (const type of SERVED_ENTITY_TYPES)
      for (const mode of REGISTRATION_MODES) expect(isRegistrationModeAllowed({}, type, mode)).toBe(false);
  });
});

describe('isRegistrationModeAllowedForAnyType', () => {
  test('is true when one served row lists the mode', () => {
    expect(
      isRegistrationModeAllowedForAnyType(
        {
          contestantApp: {
            servedEntityTypes: { candidate: { registrationModes: [] }, organization: { registrationModes: ['code'] } }
          }
        },
        'code'
      )
    ).toBe(true);
  });

  test('is false when no served row lists the mode', () => {
    expect(
      isRegistrationModeAllowedForAnyType(
        { contestantApp: { servedEntityTypes: { candidate: { registrationModes: ['email'] } } } },
        'code'
      )
    ).toBe(false);
  });
});

describe('getContestantAppNameKey', () => {
  test('is `candidate` when only candidates are served, and when nothing is declared', () => {
    expect(
      getContestantAppNameKey({ contestantApp: { servedEntityTypes: { candidate: { registrationModes: [] } } } })
    ).toBe('candidate');
    expect(getContestantAppNameKey({})).toBe('candidate');
  });

  test('is `organization` when only organizations are served', () => {
    expect(
      getContestantAppNameKey({ contestantApp: { servedEntityTypes: { organization: { registrationModes: [] } } } })
    ).toBe('organization');
  });

  test('is `candidateAndOrganization` when both are served', () => {
    expect(
      getContestantAppNameKey({
        contestantApp: {
          servedEntityTypes: { organization: { registrationModes: [] }, candidate: { registrationModes: [] } }
        }
      })
    ).toBe('candidateAndOrganization');
  });
});
