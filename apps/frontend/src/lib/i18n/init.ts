import { isLocalizedObject, staticSettings } from '@openvaa/app-shared';
import { error } from '@sveltejs/kit';
import { getLocale, locales as paraglideLocales, setLocale } from '$lib/paraglide/runtime';
import { logDebugError } from '$lib/utils/logger';
import { matchLocale } from './utils';
import type { DynamicSettings, LocalizedString } from '@openvaa/app-shared';

export { clearOverrides, setOverrides } from './overrides';
export { t } from './wrapper';
export { getLocale, setLocale };

/////////////////////////////////////////////////////
// 1. Runtime supportedLocales override surface
//    (Phase 90 Plan 01 — Stage A / D-90-10 / TIR5:28-50)
/////////////////////////////////////////////////////

/**
 * Locale config row — mirrors `staticSettings.supportedLocales[]` and
 * `DynamicSettings.i18n.supportedLocales[]`. Local alias so the helper
 * signatures don't repeat the inline object literal.
 */
type LocaleConfig = {
  readonly code: string;
  readonly name: string;
  readonly isDefault?: boolean;
};

/**
 * Module-level mutable holding the runtime override (if any). Written by
 * `applyDynamicOverride()` from `+layout.ts` BEFORE any consumer reads
 * the `locales` / `defaultLocale` exports. Empty arrays count as "no
 * override" (fall back to static default) — this guards against perm
 * templates that ship an empty array by accident.
 */
let _dynamicOverride: ReadonlyArray<LocaleConfig> | undefined;

/**
 * Apply (or clear) the runtime `supportedLocales` override read from
 * `dynamicSettings.i18n.supportedLocales`. Pass `undefined` (or a
 * settings object without `i18n.supportedLocales`) to clear the override
 * and fall back to `staticSettings.supportedLocales`.
 *
 * IMPORTANT — boot ordering: call this from `+layout.ts`'s `load()`
 * BEFORE any module reads `locales` / `defaultLocale` (e.g. before
 * `initI18nContext()` runs in `+layout.svelte`). On any change to the
 * override, the cached derivations are recomputed and the live ESM
 * bindings (`defaultLocale`, `locales`, `langNames`) are republished —
 * downstream consumers automatically see the new values.
 *
 * Backwards compatibility: when no override is supplied, behaviour is
 * unchanged from the pre-Stage-A static read of `staticSettings`.
 */
export function applyDynamicOverride(dynamic: DynamicSettings | undefined): void {
  const next = dynamic?.i18n?.supportedLocales;
  const normalised =
    next && Array.isArray(next) && next.length > 0 ? (next as ReadonlyArray<LocaleConfig>) : undefined;
  if (normalised === _dynamicOverride) return;
  _dynamicOverride = normalised;
  recomputeDerivations();
}

/**
 * Resolve the EFFECTIVE supported-locales list: the override when present
 * AND non-empty, else the static default. Always returns a non-empty
 * array (guarded by the `error(500, ...)` boot check in
 * `recomputeDerivations`).
 */
function getEffectiveSupportedLocales(): ReadonlyArray<LocaleConfig> {
  if (_dynamicOverride && _dynamicOverride.length > 0) return _dynamicOverride;
  return staticSettings.supportedLocales;
}

/////////////////////////////////////////////////////
// 2. Derivations driven by the effective list
/////////////////////////////////////////////////////

/**
 * Language names for translations. Keyed by locale code, value is the
 * language name in the language itself. Republished by
 * `recomputeDerivations()` when the override changes.
 *
 * NOT `export const` — `let` exposes a LIVE ESM binding so consumers
 * always see the post-`applyDynamicOverride()` value.
 */
export let langNames: Record<string, string> = {};

/**
 * The default locale code for the application. Resolved from the runtime
 * override when present, else from `staticSettings.supportedLocales`.
 * Live ESM binding (see `langNames` above).
 */
export let defaultLocale: string = '';

/**
 * Supported locale codes — the Paraglide compile-time superset by default,
 * filtered to the override codes when `applyDynamicOverride()` has been
 * called with a non-empty `i18n.supportedLocales`. Live ESM binding.
 *
 * Phase 90 Plan 01 (Stage A / TIR5:28-50): perm templates can ship
 * `app_settings.settings.i18n.supportedLocales: [{code:'en', ...}]` to
 * drop the user-facing locale list to one entry, which gates
 * `LanguageSelection.svelte`'s render via `locales.length > 1` WITHOUT
 * mutating Paraglide compile-time bundles (translations remain available
 * for forward compatibility).
 */
export let locales: ReadonlyArray<string> = paraglideLocales;

function recomputeDerivations(): void {
  const effective = getEffectiveSupportedLocales();
  if (!effective?.length) error(500, 'Could not load supported locales from settings');

  const nextLangNames: Record<string, string> = {};
  let nextDefault = '';
  for (const { code, name, isDefault } of effective) {
    if (code == undefined || typeof code !== 'string')
      error(500, `Invalid locale code in supported locales settings: ${code}`);
    nextLangNames[code] = name;
    if (isDefault) nextDefault = code;
  }
  if (!nextDefault) {
    logDebugError(
      `[/lib/i18n/init] Using the first locale as default because no locale has isDefault set: ${effective[0].code}`
    );
    nextDefault = effective[0].code;
  }

  // Filter Paraglide compile-time superset to the override codes when active.
  // No override: pass through verbatim (preserves backwards compatibility).
  const codes = new Set(effective.map((l) => l.code));
  const nextLocales: ReadonlyArray<string> = _dynamicOverride
    ? (paraglideLocales as ReadonlyArray<string>).filter((c) => codes.has(c))
    : (paraglideLocales as ReadonlyArray<string>);

  langNames = nextLangNames;
  defaultLocale = nextDefault;
  locales = nextLocales;
}

// Module-load derivation: populate exports from staticSettings (no override
// active yet — `applyDynamicOverride()` runs later from +layout.ts load).
recomputeDerivations();

/////////////////////////////////////////////////////
// 3. Utility function exports
/////////////////////////////////////////////////////

/**
 * Return the correct string for the locale using soft-matching from the supplied LocalizedString object.
 */
export function translate(strings: LocalizedString | string | undefined | null, locale?: string | null): string {
  return typeof strings === 'string' ? strings : ((translateObject(strings, locale) as string) ?? '');
}

/**
 * Return the correct property for the locale using soft-matching from the supplied localized object.
 * NB. Empty strings and nullish values are replaced by the fallback locale.
 */
export function translateObject<
  TObject extends Record<string, unknown> | null | undefined,
  TValue = TObject extends Record<string, infer V> ? V : never
>(obj: TObject, targetLocale?: string | null): TValue | undefined {
  if (!isLocalizedObject(obj)) return undefined;
  targetLocale ??= getLocale();
  let key: string | undefined;
  const nonEmptyKeys = Object.entries(obj)
    .filter(([, v]) => v != null && (typeof v !== 'string' || v !== ''))
    .map(([k]) => k);
  if (!nonEmptyKeys.length) return undefined;
  key = nonEmptyKeys.includes(targetLocale) ? targetLocale : matchLocale(targetLocale, nonEmptyKeys);
  key ??= nonEmptyKeys.includes(defaultLocale) ? defaultLocale : nonEmptyKeys[0];
  return (obj[key] ?? undefined) as TValue | undefined;
}
