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
    entityTypes: ['candidate', 'organization'],
    registrationModes: { candidate: EVERY_MODE, organization: EVERY_MODE }
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
      'a matrix whose rows are empty',
      { contestantApp: { registrationModes: { candidate: [], organization: [] } } },
      []
    ],
    ['both types served with every mode', FULL, ['identity_provider', 'email', 'code']],
    [
      'candidates with the code mode alone',
      { contestantApp: { registrationModes: { candidate: ['code'] } } },
      ['code']
    ],
    [
      'candidates with the email mode alone',
      { contestantApp: { registrationModes: { candidate: ['email'] } } },
      ['email']
    ],
    [
      'the identity provider for candidates alone',
      { contestantApp: { registrationModes: { candidate: ['identity_provider'] } } },
      ['identity_provider']
    ],
    [
      'the identity provider for organizations alone',
      {
        contestantApp: {
          entityTypes: ['candidate', 'organization'],
          registrationModes: { candidate: [], organization: ['identity_provider'] }
        }
      },
      ['identity_provider']
    ],
    [
      'the identity provider for organizations and a code for candidates',
      {
        contestantApp: {
          entityTypes: ['candidate', 'organization'],
          registrationModes: { candidate: ['code'], organization: ['identity_provider'] }
        }
      },
      ['identity_provider', 'code']
    ],
    [
      'the identity provider stored for an entity type the project does not serve',
      {
        contestantApp: {
          entityTypes: ['candidate'],
          registrationModes: { candidate: ['code'], organization: ['identity_provider'] }
        }
      },
      ['code']
    ],
    [
      'the email and code modes for organizations alone',
      {
        contestantApp: {
          entityTypes: ['candidate', 'organization'],
          registrationModes: { candidate: [], organization: ['code', 'email'] }
        }
      },
      ['email', 'code']
    ],
    [
      'a mode stored twice and the modes stored in another order',
      {
        contestantApp: {
          entityTypes: ['organization', 'candidate'],
          registrationModes: {
            candidate: ['code', 'email', 'code', 'identity_provider'],
            organization: ['email', 'code', 'email']
          }
        }
      },
      ['identity_provider', 'email', 'code']
    ],
    [
      'a row stored for an entity type the project does not serve',
      {
        contestantApp: {
          entityTypes: ['candidate'],
          registrationModes: { candidate: [], organization: ['email', 'code'] }
        }
      },
      []
    ],
    ['a full matrix while answers are locked', { ...FULL, access: { answersLocked: true } }, []],
    [
      'a full matrix while answers are not locked',
      { ...FULL, access: { answersLocked: false } },
      ['identity_provider', 'email', 'code']
    ],
    ['a full matrix with no stored lock', { ...FULL, access: null }, ['identity_provider', 'email', 'code']]
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
      { contestantApp: { registrationModes: { candidate: ['identity_provider'] } } },
      ['candidate']
    ],
    [
      'the identity provider for organizations alone',
      {
        contestantApp: {
          entityTypes: ['candidate', 'organization'],
          registrationModes: { candidate: ['email', 'code'], organization: ['identity_provider'] }
        }
      },
      ['organization']
    ],
    [
      'the types and the modes stored in another order',
      {
        contestantApp: {
          entityTypes: ['organization', 'candidate'],
          registrationModes: {
            organization: ['code', 'identity_provider'],
            candidate: ['identity_provider', 'identity_provider']
          }
        }
      },
      ['candidate', 'organization']
    ],
    [
      'the identity provider stored for an entity type the project does not serve',
      {
        contestantApp: {
          entityTypes: ['candidate'],
          registrationModes: { candidate: ['email'], organization: ['identity_provider'] }
        }
      },
      []
    ],
    [
      'every mode but the identity provider',
      {
        contestantApp: {
          entityTypes: ['candidate', 'organization'],
          registrationModes: { candidate: ['email', 'code'], organization: ['email', 'code'] }
        }
      },
      []
    ],
    ['a full matrix while answers are locked', { ...FULL, access: { answersLocked: true } }, []],
    [
      'a full matrix while answers are not locked',
      { ...FULL, access: { answersLocked: false } },
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
    contestantApp: { registrationModes: { candidate: ['identity_provider'] } }
  };
  const CASES: Array<[string, RegistrationOfferSettings, unknown, ServedEntityType | undefined]> = [
    ['a named type the list holds', FULL, 'organization', 'organization'],
    ['a named type the list does not hold', CANDIDATES_ALONE, 'organization', undefined],
    ['a name that is no type', FULL, 'constructor', undefined],
    ['a name that is not a string', FULL, 1, undefined],
    ['no type, with one type in the list', CANDIDATES_ALONE, undefined, 'candidate'],
    ['no type, with two types in the list', FULL, undefined, undefined],
    ['no type, with none in the list', {}, undefined, undefined],
    ['a named type while answers are locked', { ...FULL, access: { answersLocked: true } }, 'candidate', undefined],
    ['no type while answers are locked', { ...CANDIDATES_ALONE, access: { answersLocked: true } }, undefined, undefined]
  ];

  it.each(CASES)('answers %s', (_name, settings, named, expected) => {
    expect(identityProviderEntityType(settings, named)).toBe(expected);
  });
});

describe('signInLinkOffered', () => {
  const CASES: Array<[string, RegistrationOfferSettings, boolean]> = [
    ['undefined settings', undefined, false],
    ['settings that store nothing', {}, false],
    ['the code mode alone', { contestantApp: { registrationModes: { candidate: ['code'] } } }, false],
    ['the email mode for candidates', { contestantApp: { registrationModes: { candidate: ['email'] } } }, true],
    [
      'the email mode for organizations alone',
      {
        contestantApp: {
          entityTypes: ['candidate', 'organization'],
          registrationModes: { candidate: ['code'], organization: ['email'] }
        }
      },
      true
    ],
    [
      'the identity provider for candidates',
      { contestantApp: { registrationModes: { candidate: ['identity_provider'] } } },
      true
    ],
    [
      'the identity provider for organizations alone',
      {
        contestantApp: {
          entityTypes: ['candidate', 'organization'],
          registrationModes: { candidate: [], organization: ['identity_provider'] }
        }
      },
      true
    ],
    ['both the email mode and the identity provider', FULL, true],
    [
      'the email mode stored for an entity type the project does not serve',
      {
        contestantApp: {
          entityTypes: ['candidate'],
          registrationModes: { candidate: ['code'], organization: ['email', 'identity_provider'] }
        }
      },
      false
    ],
    ['the email mode while answers are locked', { ...FULL, access: { answersLocked: true } }, true],
    [
      'the code mode alone while answers are locked',
      { contestantApp: { registrationModes: { candidate: ['code'] } }, access: { answersLocked: true } },
      false
    ]
  ];

  it.each(CASES)('answers for %s', (_name, settings, expected) => {
    expect(signInLinkOffered(settings)).toBe(expected);
  });
});
