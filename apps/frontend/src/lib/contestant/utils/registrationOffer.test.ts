import { isRegistrationModeAllowed } from '@openvaa/app-shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listedRegistrationModes, signInLinkOffered } from './registrationOffer';
import type * as AppSharedModule from '@openvaa/app-shared';
import type { RegistrationMode } from '@openvaa/app-shared';
import type { RegistrationOfferSettings } from './registrationOffer';

/**
 * What registration offers is one ordered list read from the stored settings, and the sign-in link's condition is a second reading of the same settings.
 *
 * The per-type accessor of `@openvaa/app-shared` is wrapped in a spy that calls through, so every case runs on the real rule and one case can show which entity type the identity provider's mode is asked for.
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
      []
    ],
    [
      'the identity provider for organizations and a code for candidates',
      {
        contestantApp: {
          entityTypes: ['candidate', 'organization'],
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

  it('asks for the identity provider’s mode for candidates and for no other entity type', () => {
    listedRegistrationModes(FULL);

    const asked = vi.mocked(isRegistrationModeAllowed).mock.calls.map(([, entityType, mode]) => [entityType, mode]);
    expect(asked).toStrictEqual([['candidate', 'identity_provider']]);
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
