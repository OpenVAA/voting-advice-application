import { isRegistrationModeAllowed } from '@openvaa/app-shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  identityProviderEntityType,
  identityProviderEntityTypes,
  listedRegistrationModes,
  signInLinkOffered
} from './registrationOffer';
import type * as AppSharedModule from '@openvaa/app-shared';
import type { RegistrationMode, ServedEntityType } from '@openvaa/app-shared';
import type { RegistrationOfferSettings } from './registrationOffer';

/**
 * What registration offers is one ordered list read from the stored settings, the entity types the identity provider's mode registers are a second reading of the same matrix, and the sign-in link's condition is a third.
 *
 * The per-type accessor of `@openvaa/app-shared` is wrapped in a spy that calls through, so every case runs on the real rule and one case can show which entity types the identity provider's mode is asked for.
 */
vi.mock('@openvaa/app-shared', async (importOriginal) => {
  const actual = await importOriginal<typeof AppSharedModule>();
  return { ...actual, isRegistrationModeAllowed: vi.fn(actual.isRegistrationModeAllowed) };
});

const EVERY_MODE: Array<RegistrationMode> = ['identity_provider', 'email', 'code'];

/** Settings that serve both entity types and allow every mode for each. */
const FULL: NonNullable<RegistrationOfferSettings> = {
  contestantApp: {
    servedEntityTypes: { candidate: { registrationModes: EVERY_MODE }, organization: { registrationModes: EVERY_MODE } }
  }
};

beforeEach(() => {
  vi.mocked(isRegistrationModeAllowed).mockClear();
});

describe('listedRegistrationModes', () => {
  const CASES: Array<[string, RegistrationOfferSettings, Array<RegistrationMode>]> = [
    ['undefined settings', undefined, []],
    ['null settings', null, []],
    ['settings that store nothing', {}, []],
    [
      'a served type with no mode',
      { contestantApp: { servedEntityTypes: { candidate: { registrationModes: [] } } } },
      []
    ],
    ['both types served with every mode', FULL, ['identity_provider', 'email', 'code']],
    [
      'candidates with the code mode alone',
      { contestantApp: { servedEntityTypes: { candidate: { registrationModes: ['code'] } } } },
      ['code']
    ],
    [
      'candidates with the email mode alone',
      { contestantApp: { servedEntityTypes: { candidate: { registrationModes: ['email'] } } } },
      ['email']
    ],
    [
      'the identity provider for candidates alone',
      { contestantApp: { servedEntityTypes: { candidate: { registrationModes: ['identity_provider'] } } } },
      ['identity_provider']
    ],
    [
      'the identity provider for organizations alone',
      {
        contestantApp: {
          servedEntityTypes: {
            candidate: { registrationModes: [] },
            organization: { registrationModes: ['identity_provider'] }
          }
        }
      },
      ['identity_provider']
    ],
    [
      'the identity provider for organizations and a code for candidates',
      {
        contestantApp: {
          servedEntityTypes: {
            candidate: { registrationModes: ['code'] },
            organization: { registrationModes: ['identity_provider'] }
          }
        }
      },
      ['identity_provider', 'code']
    ],
    [
      'the email and code modes for organizations alone',
      {
        contestantApp: {
          servedEntityTypes: {
            candidate: { registrationModes: [] },
            organization: { registrationModes: ['code', 'email'] }
          }
        }
      },
      ['email', 'code']
    ],
    [
      'a mode stored twice and the modes stored in another order',
      {
        contestantApp: {
          servedEntityTypes: {
            organization: { registrationModes: ['email', 'code', 'email'] },
            candidate: { registrationModes: ['code', 'email', 'code', 'identity_provider'] }
          }
        }
      },
      ['identity_provider', 'email', 'code']
    ],
    ['a full matrix while answers are locked', { ...FULL, access: { contestantEditing: 'locked' } }, []],
    [
      'a full matrix while answers are not locked',
      { ...FULL, access: { contestantEditing: 'open' } },
      ['identity_provider', 'email', 'code']
    ],
    ['a full matrix with no stored lock', { ...FULL, access: null }, ['identity_provider', 'email', 'code']],
    ['a full matrix while the Contestant App is closed', { ...FULL, access: { contestantApp: false } }, []],
    [
      'a full matrix while the Contestant App is open',
      { ...FULL, access: { contestantApp: true } },
      ['identity_provider', 'email', 'code']
    ],
    [
      'a full matrix with no stored Contestant App switch',
      { ...FULL, access: { contestantApp: null } },
      ['identity_provider', 'email', 'code']
    ]
  ];

  it.each(CASES)('lists the offered modes for %s', (_name, settings, expected) => {
    expect(listedRegistrationModes(settings)).toStrictEqual(expected);
  });

  it('lists a mode allowed for both served types once', () => {
    const listed = listedRegistrationModes(FULL);

    expect(new Set(listed).size).toBe(listed.length);
    expect(listed).toHaveLength(3);
  });

  it('answers with none, one or several modes', () => {
    const lengths = CASES.map(([, settings]) => listedRegistrationModes(settings).length);

    expect(lengths).toContain(0);
    expect(lengths).toContain(1);
    expect(lengths).toContain(3);
  });

  it('lists the identity provider’s mode exactly when it registers at least one entity type', () => {
    const settingsOfEveryCase = CASES.map(([, settings]) => settings);
    for (const settings of settingsOfEveryCase) {
      expect(listedRegistrationModes(settings).includes('identity_provider')).toBe(
        identityProviderEntityTypes(settings).length > 0
      );
    }
  });
});

describe('identityProviderEntityTypes', () => {
  const CASES: Array<[string, RegistrationOfferSettings, Array<ServedEntityType>]> = [
    ['undefined settings', undefined, []],
    ['null settings', null, []],
    ['settings that store nothing', {}, []],
    ['both types served with every mode', FULL, ['candidate', 'organization']],
    [
      'the identity provider for candidates alone',
      { contestantApp: { servedEntityTypes: { candidate: { registrationModes: ['identity_provider'] } } } },
      ['candidate']
    ],
    [
      'the identity provider for organizations alone',
      {
        contestantApp: {
          servedEntityTypes: {
            candidate: { registrationModes: ['email', 'code'] },
            organization: { registrationModes: ['identity_provider'] }
          }
        }
      },
      ['organization']
    ],
    [
      'the types and the modes stored in another order',
      {
        contestantApp: {
          servedEntityTypes: {
            organization: { registrationModes: ['code', 'identity_provider'] },
            candidate: { registrationModes: ['identity_provider', 'identity_provider'] }
          }
        }
      },
      ['candidate', 'organization']
    ],
    [
      'every mode but the identity provider',
      {
        contestantApp: {
          servedEntityTypes: {
            candidate: { registrationModes: ['email', 'code'] },
            organization: { registrationModes: ['email', 'code'] }
          }
        }
      },
      []
    ],
    ['a full matrix while answers are locked', { ...FULL, access: { contestantEditing: 'locked' } }, []],
    [
      'a full matrix while answers are not locked',
      { ...FULL, access: { contestantEditing: 'open' } },
      ['candidate', 'organization']
    ],
    ['a full matrix while the Contestant App is closed', { ...FULL, access: { contestantApp: false } }, []],
    [
      'a full matrix while the Contestant App is open',
      { ...FULL, access: { contestantApp: true } },
      ['candidate', 'organization']
    ]
  ];

  it.each(CASES)('answers the registered types for %s', (_name, settings, expected) => {
    expect(identityProviderEntityTypes(settings)).toStrictEqual(expected);
  });

  it('asks each served entity type for the identity provider’s mode, in the order candidate, organization', () => {
    identityProviderEntityTypes(FULL);

    const asked = vi.mocked(isRegistrationModeAllowed).mock.calls.map(([, entityType, mode]) => [entityType, mode]);
    expect(asked).toStrictEqual([
      ['candidate', 'identity_provider'],
      ['organization', 'identity_provider']
    ]);
  });

  it('answers with none, one or two types', () => {
    const lengths = CASES.map(([, settings]) => identityProviderEntityTypes(settings).length);

    expect(lengths).toContain(0);
    expect(lengths).toContain(1);
    expect(lengths).toContain(2);
  });
});

describe('identityProviderEntityType', () => {
  const CANDIDATES_ALONE: RegistrationOfferSettings = {
    contestantApp: { servedEntityTypes: { candidate: { registrationModes: ['identity_provider'] } } }
  };
  const CASES: Array<[string, RegistrationOfferSettings, unknown, ServedEntityType | undefined]> = [
    ['a named type the list holds', FULL, 'organization', 'organization'],
    ['a named type the list does not hold', CANDIDATES_ALONE, 'organization', undefined],
    ['a name that is no type', FULL, 'constructor', undefined],
    ['a name that is not a string', FULL, 1, undefined],
    ['no type, with one type in the list', CANDIDATES_ALONE, undefined, 'candidate'],
    ['no type, with two types in the list', FULL, undefined, undefined],
    ['no type, with none in the list', {}, undefined, undefined],
    [
      'a named type while answers are locked',
      { ...FULL, access: { contestantEditing: 'locked' } },
      'candidate',
      undefined
    ],
    [
      'a named type while the Contestant App is closed',
      { ...FULL, access: { contestantApp: false } },
      'candidate',
      undefined
    ],
    [
      'no type while answers are locked',
      { ...CANDIDATES_ALONE, access: { contestantEditing: 'locked' } },
      undefined,
      undefined
    ]
  ];

  it.each(CASES)('answers %s', (_name, settings, named, expected) => {
    expect(identityProviderEntityType(settings, named)).toBe(expected);
  });
});

describe('signInLinkOffered', () => {
  const CASES: Array<[string, RegistrationOfferSettings, boolean]> = [
    ['undefined settings', undefined, false],
    ['settings that store nothing', {}, false],
    [
      'the code mode alone',
      { contestantApp: { servedEntityTypes: { candidate: { registrationModes: ['code'] } } } },
      false
    ],
    [
      'the email mode for candidates',
      { contestantApp: { servedEntityTypes: { candidate: { registrationModes: ['email'] } } } },
      true
    ],
    [
      'the email mode for organizations alone',
      {
        contestantApp: {
          servedEntityTypes: {
            candidate: { registrationModes: ['code'] },
            organization: { registrationModes: ['email'] }
          }
        }
      },
      true
    ],
    [
      'the identity provider for candidates',
      { contestantApp: { servedEntityTypes: { candidate: { registrationModes: ['identity_provider'] } } } },
      true
    ],
    [
      'the identity provider for organizations alone',
      {
        contestantApp: {
          servedEntityTypes: {
            candidate: { registrationModes: [] },
            organization: { registrationModes: ['identity_provider'] }
          }
        }
      },
      true
    ],
    ['both the email mode and the identity provider', FULL, true],
    ['the email mode while answers are locked', { ...FULL, access: { contestantEditing: 'locked' } }, true],
    [
      'the code mode alone while answers are locked',
      {
        contestantApp: { servedEntityTypes: { candidate: { registrationModes: ['code'] } } },
        access: { contestantEditing: 'locked' }
      },
      false
    ]
  ];

  it.each(CASES)('answers for %s', (_name, settings, expected) => {
    expect(signInLinkOffered(settings)).toBe(expected);
  });
});
