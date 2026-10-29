import { describe, expect, test } from 'vitest';
import {
  getContestantAppNameKey,
  getEffectiveRegistrationModes,
  getServedEntityTypes,
  isAnyRegistrationAllowed,
  isRegistrationMode,
  isRegistrationModeAllowed,
  isRegistrationModeAllowedForAnyType,
  REGISTRATION_MODE,
  REGISTRATION_MODES,
  SERVED_ENTITY_TYPES
} from './contestantAppConfig';
import { dynamicSettings } from './dynamicSettings';
import type { ContestantAppConfigInput } from './contestantAppConfig';
import type { DynamicSettings } from './dynamicSettings.type';

/**
 * A value of an unknown shape, typed as the accessors' input. The accessors are total at run time on values the type does not admit, such as a list stored as a string.
 */
function untyped(value: unknown): ContestantAppConfigInput {
  return value as ContestantAppConfigInput;
}

describe('the vocabularies', () => {
  test('served entity types are candidate then organization', () => {
    expect(SERVED_ENTITY_TYPES).toEqual(['candidate', 'organization']);
  });

  test('registration modes are identity_provider, email, code, in that order', () => {
    expect(REGISTRATION_MODES).toEqual(['identity_provider', 'email', 'code']);
    expect(Object.values(REGISTRATION_MODE)).toEqual([...REGISTRATION_MODES]);
  });

  test('isRegistrationMode accepts the three modes and nothing else', () => {
    expect(REGISTRATION_MODES.every((mode) => isRegistrationMode(mode))).toBe(true);
    expect(isRegistrationMode('sms')).toBe(false);
    expect(isRegistrationMode(undefined)).toBe(false);
    expect(isRegistrationMode(0)).toBe(false);
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

describe('getServedEntityTypes', () => {
  test.each([
    ['undefined', undefined],
    ['null', null],
    ['an empty object', {}],
    ['a null root', { contestantApp: null }],
    ['a root without the member', { contestantApp: {} }],
    ['an empty list', { contestantApp: { entityTypes: [] } }]
  ] as Array<[string, ContestantAppConfigInput]>)('answers the shipped default for %s', (_, input) => {
    expect(getServedEntityTypes(input)).toEqual(['candidate']);
  });

  test('answers the shipped default when the member is not a list or names no known type', () => {
    expect(getServedEntityTypes(untyped({ contestantApp: { entityTypes: 'organization' } }))).toEqual(['candidate']);
    expect(getServedEntityTypes(untyped({ contestantApp: { entityTypes: ['faction'] } }))).toEqual(['candidate']);
  });

  test('answers in canonical order with no repeats', () => {
    expect(
      getServedEntityTypes({ contestantApp: { entityTypes: ['organization', 'candidate', 'candidate'] } })
    ).toEqual(['candidate', 'organization']);
  });

  test('answers a single declared type as declared', () => {
    expect(getServedEntityTypes({ contestantApp: { entityTypes: ['organization'] } })).toEqual(['organization']);
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

  test('has rows for served types only: a row declared for an unserved type is absent', () => {
    const input = {
      contestantApp: {
        entityTypes: ['candidate'],
        registrationModes: { candidate: ['email'], organization: ['email', 'code'] }
      }
    } satisfies ContestantAppConfigInput;
    const effective = getEffectiveRegistrationModes(input);
    expect(effective).toEqual({ candidate: ['email'] });
    expect(Object.keys(effective)).toEqual(['candidate']);
  });

  test('reads a missing row for a served type as an empty row', () => {
    expect(
      getEffectiveRegistrationModes({
        contestantApp: { entityTypes: ['candidate', 'organization'], registrationModes: { candidate: ['code'] } }
      })
    ).toEqual({ candidate: ['code'], organization: [] });
  });

  test('reads a wholly empty declared matrix as empty rows', () => {
    expect(
      getEffectiveRegistrationModes({
        contestantApp: { entityTypes: ['candidate', 'organization'], registrationModes: {} }
      })
    ).toEqual({ candidate: [], organization: [] });
  });

  test('answers each row in canonical order with no repeats', () => {
    expect(
      getEffectiveRegistrationModes({
        contestantApp: { registrationModes: { candidate: ['code', 'email', 'code', 'identity_provider'] } }
      })
    ).toEqual({ candidate: ['identity_provider', 'email', 'code'] });
  });

  test('reads a row that is not a list, and a mode outside the vocabulary, as nothing', () => {
    expect(
      getEffectiveRegistrationModes(untyped({ contestantApp: { registrationModes: { candidate: 'email' } } }))
    ).toEqual({ candidate: [] });
    expect(
      getEffectiveRegistrationModes(untyped({ contestantApp: { registrationModes: { candidate: ['sms', 'email'] } } }))
    ).toEqual({ candidate: ['email'] });
  });
});

describe('isRegistrationModeAllowed', () => {
  test('is true when the type is served and its row lists the mode', () => {
    const input = {
      contestantApp: { entityTypes: ['candidate'], registrationModes: { candidate: ['identity_provider'] } }
    } satisfies ContestantAppConfigInput;
    expect(isRegistrationModeAllowed(input, 'candidate', REGISTRATION_MODE.IdentityProvider)).toBe(true);
    expect(isRegistrationModeAllowed(input, 'candidate', REGISTRATION_MODE.Email)).toBe(false);
  });

  test('is false when the type is not served, even if its row lists the mode', () => {
    const input = {
      contestantApp: { entityTypes: ['candidate'], registrationModes: { organization: ['email'] } }
    } satisfies ContestantAppConfigInput;
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
            entityTypes: ['candidate', 'organization'],
            registrationModes: { candidate: [], organization: ['code'] }
          }
        },
        'code'
      )
    ).toBe(true);
  });

  test('is false when only an unserved row lists the mode', () => {
    expect(
      isRegistrationModeAllowedForAnyType(
        { contestantApp: { entityTypes: ['candidate'], registrationModes: { organization: ['code'] } } },
        'code'
      )
    ).toBe(false);
  });
});

describe('isAnyRegistrationAllowed', () => {
  test('is false when nothing is declared, for an empty matrix and for empty rows', () => {
    expect(isAnyRegistrationAllowed({})).toBe(false);
    expect(isAnyRegistrationAllowed({ contestantApp: { registrationModes: {} } })).toBe(false);
    expect(
      isAnyRegistrationAllowed({ contestantApp: { registrationModes: { candidate: [], organization: [] } } })
    ).toBe(false);
  });

  test('is false when the only non-empty row belongs to an unserved type', () => {
    expect(
      isAnyRegistrationAllowed({
        contestantApp: { entityTypes: ['candidate'], registrationModes: { organization: ['email'] } }
      })
    ).toBe(false);
  });

  test('is true when one served row is non-empty', () => {
    expect(isAnyRegistrationAllowed({ contestantApp: { registrationModes: { candidate: ['email'] } } })).toBe(true);
  });
});

describe('getContestantAppNameKey', () => {
  test('is `candidate` when only candidates are served, and when nothing is declared', () => {
    expect(getContestantAppNameKey({ contestantApp: { entityTypes: ['candidate'] } })).toBe('candidate');
    expect(getContestantAppNameKey({})).toBe('candidate');
  });

  test('is `organization` when only organizations are served', () => {
    expect(getContestantAppNameKey({ contestantApp: { entityTypes: ['organization'] } })).toBe('organization');
  });

  test('is `candidateAndOrganization` when both are served, in either stored order', () => {
    expect(getContestantAppNameKey({ contestantApp: { entityTypes: ['candidate', 'organization'] } })).toBe(
      'candidateAndOrganization'
    );
    expect(getContestantAppNameKey({ contestantApp: { entityTypes: ['organization', 'candidate'] } })).toBe(
      'candidateAndOrganization'
    );
  });
});
