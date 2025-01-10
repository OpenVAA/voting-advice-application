import type { DynamicSettings, StaticSettings } from '@openvaa/app-shared';

/**
 * A simple utility for merging settings.
 *
 * NB! Settings are overwritten by root key.
 * TODO: Handle merging so that empty objects do not overwrite defaults
 * @param target - The static settings or complete `AppSettings`
 * @param additional - The dynamic or complete settings to add
 * @returns Complete `AppSettings`
 */
export function mergeAppSettings(
  target: StaticSettings | AppSettings,
  additional: AppSettings | DynamicSettings
): AppSettings {
  return Object.assign(target, additional);
}
