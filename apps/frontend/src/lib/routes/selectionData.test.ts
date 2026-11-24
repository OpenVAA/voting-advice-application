/**
 * The settings and the temporary data root `selectionDataOf` builds from the root load's data: no answer when one of the three reads failed, a data root holding the elections and constituencies given, and the settings merged the way the caller asks, by default over the static and the build-time settings.
 */

import { dynamicSettings, staticSettings } from '@openvaa/app-shared';
import { describe, expect, it } from 'vitest';
import { mergeAppSettings, mergeInitialAppSettings } from '$lib/utils/settings';
import { selectionDataOf } from './selectionData';
import type { DynamicSettings } from '@openvaa/app-shared';
import type { RootSelectionData } from './selectionData';

const ROOT_DATA: RootSelectionData = {
  appSettingsData: { elections: { disallowSelection: true } } as DynamicSettings,
  electionData: [{ id: 'election-1', name: 'Election 1', constituencyGroupIds: ['regions'] }],
  constituencyData: {
    groups: [{ id: 'regions', constituencyIds: ['region-1', 'region-2'] }],
    constituencies: [
      { id: 'region-1', name: 'Region 1' },
      { id: 'region-2', name: 'Region 2' }
    ]
  }
};

describe('selectionDataOf', () => {
  it('builds a data root holding the elections and constituencies given', () => {
    const selectionData = selectionDataOf(ROOT_DATA);

    expect(selectionData?.dataRoot.elections.map(({ id }) => id)).toEqual(['election-1']);
    expect(
      selectionData?.dataRoot.getElection('election-1').constituencyGroups[0].constituencies.map(({ id }) => id)
    ).toEqual(['region-1', 'region-2']);
  });

  it('builds a fresh data root on every call', () => {
    expect(selectionDataOf(ROOT_DATA)?.dataRoot).not.toBe(selectionDataOf(ROOT_DATA)?.dataRoot);
  });

  it('merges the settings over the static and the build-time settings by default', () => {
    expect(selectionDataOf(ROOT_DATA)?.appSettings).toEqual(
      mergeInitialAppSettings(staticSettings, dynamicSettings, ROOT_DATA.appSettingsData)
    );
  });

  it('merges the settings the way the caller asks', () => {
    const selectionData = selectionDataOf({
      ...ROOT_DATA,
      mergeSettings: (data) => mergeAppSettings(staticSettings, data)
    });

    expect(selectionData?.appSettings).toEqual(
      mergeAppSettings(staticSettings, ROOT_DATA.appSettingsData as DynamicSettings)
    );
    expect(selectionData?.appSettings.elections.disallowSelection).toBe(true);
  });

  it.each(['appSettingsData', 'electionData', 'constituencyData'] as const)(
    'answers undefined when the read of %s failed',
    (member) => {
      expect(selectionDataOf({ ...ROOT_DATA, [member]: new Error('read failed') })).toBeUndefined();
    }
  );
});
