import { getContestantAppNameKey } from '@openvaa/app-shared';
import type { ContestantAppConfigInput } from '@openvaa/app-shared';
import type { TranslationKey } from '$types';

/**
 * The name the Contestant App shows for itself, which follows the entity types the project serves. Each locale holds three whole names under `dynamic.contestantAppName`, and this picks one of them.
 * @param appSettings - The settings that say which entity types the project serves.
 * @param t - The translation function.
 * @returns The translated name.
 */
export function getContestantAppName({
  appSettings,
  t
}: {
  appSettings: ContestantAppConfigInput;
  t: (key: TranslationKey) => string;
}): string {
  return t(`dynamic.contestantAppName.${getContestantAppNameKey(appSettings)}`);
}
