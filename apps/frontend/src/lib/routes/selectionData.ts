import { dynamicSettings, staticSettings } from '@openvaa/app-shared';
import { DataRoot } from '@openvaa/data';
import { mergeInitialAppSettings } from '$lib/utils/settings';
import type { DynamicSettings } from '@openvaa/app-shared';
import type { DPDataType } from '$lib/api/base/dataTypes';

/** The members of the root load's data the selection of elections and constituencies is decided from. Each is the error itself when its read failed. */
export type RootSelectionData = {
  appSettingsData: DynamicSettings | Error;
  electionData: DPDataType['elections'] | Error;
  constituencyData: DPDataType['constituencies'] | Error;
};

/** The settings and the elections a load decides the selection from. */
export type SelectionData = {
  /** The settings the load decides from: the root load's settings merged over the shipped ones. */
  appSettings: AppSettings;
  /** A data root of the load's own, holding the root load's elections and constituencies. */
  dataRoot: DataRoot;
};

/**
 * The settings and a temporary data root, built from the root load's data. The data root serves the decision of the load that asked and is handed to no page, which reads the context's data root instead.
 * @param rootData - The root load's settings, elections and constituencies.
 * @param mergeSettings - How the root load's settings are merged over the shipped ones. By default over the static and the build-time settings, as the application context does.
 * @returns The two, or `undefined` when one of the three reads failed.
 */
export function selectionDataOf({
  appSettingsData,
  electionData,
  constituencyData,
  mergeSettings = mergeOverBuildTimeSettings
}: RootSelectionData & {
  mergeSettings?: (appSettingsData: DynamicSettings) => AppSettings;
}): SelectionData | undefined {
  if (appSettingsData instanceof Error || electionData instanceof Error || constituencyData instanceof Error)
    return undefined;
  const dataRoot = new DataRoot();
  dataRoot.provideElectionData(electionData);
  dataRoot.provideConstituencyData(constituencyData);
  return { appSettings: mergeSettings(appSettingsData), dataRoot };
}

/** The root load's settings merged over the static and the build-time settings. */
function mergeOverBuildTimeSettings(appSettingsData: DynamicSettings): AppSettings {
  return mergeInitialAppSettings(staticSettings, dynamicSettings, appSettingsData);
}
