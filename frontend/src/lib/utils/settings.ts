import { mergeSettings } from '$lib/utils/merge';
import type { DeepPartial, DynamicSettings, StaticSettings } from '@openvaa/app-shared';

/**
 * A simple utility for merging settings.
 * NB. Settings objects are not replaced, but their contents are combined. This does not apply to Arrays, which are replaced completely.
 * @param target - The static settings or complete `AppSettings`
 * @param additional - The dynamic or complete settings to add
 * @returns Complete `AppSettings`
 */
export function mergeAppSettings(
  target: StaticSettings | AppSettings,
  additional: DeepPartial<AppSettings | DynamicSettings>
): AppSettings {
  return mergeSettings(target, additional) as AppSettings;
}
