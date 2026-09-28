import type { DynamicSettings, StaticSettings } from '@openvaa/app-shared';

/**
 * A simple utility for merging settings.
 *
 * NB! Settings are overwritten by root key unless the key is nullish.
 * TODO: Handle merging so that empty objects do not overwrite defaults
 * @param target - The static settings or complete `AppSettings`
 * @param additional - The dynamic or complete settings to add
 * @returns Complete `AppSettings`
 */
export function mergeAppSettings(
  target: StaticSettings | AppSettings,
  additional: AppSettings | DynamicSettings
): AppSettings {
  const nonNull = Object.fromEntries(Object.entries(additional).filter(([, v]) => v != null)) as
    | AppSettings
    | DynamicSettings;
  // Pure spread (Pattern 8): never mutate `target`. The previous in-place assign mutated the shared `staticSettings` module reference, polluting every other context that read it.
  return { ...target, ...nonNull };
}

/**
 * Build the INITIAL effective `AppSettings` value for `appContext`'s `$state`, folding in the DB override synchronously.
 *
 * This is the pure, server-and-client-safe init merge used at `$state` init so the server-rendered HTML already carries the DB override (no post-hydration default→override flash). The DB override is applied only when it exists and is not an `Error` (a failed loader result); otherwise the base static∪dynamic merge is returned unchanged.
 *
 * Internal helper (K1-compliant — not a renamed public symbol); it exists so the SSR-init merge can be unit-asserted without a running dev server.
 *
 * @param staticSettings - The static (hardcoded) settings
 * @param dynamicSettings - The dynamic (build-time) settings
 * @param dbData - The DB-sourced `page.data.appSettingsData` (or `Error`/`undefined`)
 * @returns The merged `AppSettings` including the DB override when present
 */
export function mergeInitialAppSettings(
  staticSettings: StaticSettings,
  dynamicSettings: DynamicSettings,
  dbData: DynamicSettings | Error | undefined
): AppSettings {
  const base = mergeAppSettings(staticSettings, dynamicSettings);
  if (dbData && !(dbData instanceof Error)) return mergeAppSettings(base, dbData);
  return base;
}
