import { getContestantAppNameKey } from '@openvaa/app-shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getContestantAppName } from './contestantAppName';
import type * as AppSharedModule from '@openvaa/app-shared';
import type { ContestantAppSettingsInput } from '@openvaa/app-shared';
import type { TranslationKey } from '$types';

/**
 * The name the Contestant App shows for itself is one of three whole catalogue messages, chosen by the entity types the project serves.
 *
 * The accessor of `@openvaa/app-shared` is wrapped in a spy that calls through, so the cases below run on the real rule and the last two can replace its answer to show that the helper asks the accessor and nothing else.
 */
vi.mock('@openvaa/app-shared', async (importOriginal) => {
  const actual = await importOriginal<typeof AppSharedModule>();
  return { ...actual, getContestantAppNameKey: vi.fn(actual.getContestantAppNameKey) };
});

/** A translation function that answers with a string naming the key it was asked for. */
function makeT() {
  return vi.fn((key: TranslationKey) => `translated:${key}`);
}

const CASES: Array<[string, ContestantAppSettingsInput, TranslationKey]> = [
  ['settings that declare nothing', {}, 'dynamic.contestantAppName.candidate'],
  [
    'candidates only',
    { contestantApp: { servedEntityTypes: { candidate: { registrationModes: [] } } } },
    'dynamic.contestantAppName.candidate'
  ],
  [
    'organizations only',
    { contestantApp: { servedEntityTypes: { organization: { registrationModes: [] } } } },
    'dynamic.contestantAppName.organization'
  ],
  [
    'both types, candidates first',
    {
      contestantApp: {
        servedEntityTypes: { candidate: { registrationModes: [] }, organization: { registrationModes: [] } }
      }
    },
    'dynamic.contestantAppName.candidateAndOrganization'
  ],
  [
    'both types, organizations first',
    {
      contestantApp: {
        servedEntityTypes: { organization: { registrationModes: [] }, candidate: { registrationModes: [] } }
      }
    },
    'dynamic.contestantAppName.candidateAndOrganization'
  ]
];

describe('getContestantAppName', () => {
  beforeEach(() => {
    vi.mocked(getContestantAppNameKey).mockClear();
  });

  it.each(CASES)('asks for the right name key for %s', (_label, appSettings, expectedKey) => {
    const t = makeT();
    getContestantAppName({ appSettings, t });
    expect(t.mock.calls).toEqual([[expectedKey]]);
  });

  it('returns what the translation function returns', () => {
    const t = vi.fn(() => 'Party app');
    expect(
      getContestantAppName({
        appSettings: { contestantApp: { servedEntityTypes: { organization: { registrationModes: [] } } } },
        t
      })
    ).toBe('Party app');
  });

  it('hands the settings it was given to the name-key accessor, once', () => {
    const appSettings: ContestantAppSettingsInput = {
      contestantApp: { servedEntityTypes: { candidate: { registrationModes: [] } } }
    };
    getContestantAppName({ appSettings, t: makeT() });
    expect(vi.mocked(getContestantAppNameKey).mock.calls).toEqual([[appSettings]]);
  });

  it('uses the key the accessor answers, whatever the settings say', () => {
    vi.mocked(getContestantAppNameKey).mockReturnValueOnce('organization');
    const t = makeT();
    getContestantAppName({
      appSettings: { contestantApp: { servedEntityTypes: { candidate: { registrationModes: [] } } } },
      t
    });
    expect(t.mock.calls).toEqual([['dynamic.contestantAppName.organization']]);
  });
});
