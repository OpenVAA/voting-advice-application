/**
 * SPIKE 008 — Variant A: $effect-only merge (production today + Spike 001 shape).
 *
 * Initial $state is set synchronously from staticSettings ∪ dynamicSettings.
 * The DB-override merge from `page.data.appSettingsData` happens inside a
 * `$effect`. `$effect` does NOT run during SSR — so the server-rendered HTML
 * will show only the static∪dynamic merge, NOT the DB override.
 *
 * After client mount, the $effect fires and the value updates → re-render.
 */

import { dynamicSettings, staticSettings } from '@openvaa/app-shared';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { page } from '$app/state';
import type { DynamicSettings } from '@openvaa/app-shared';

// PURE merge — production `mergeAppSettings` uses `Object.assign` which
// MUTATES the target. For the variant comparison we need each variant to have
// its own private value, so we use a spread-based merge here.
//
// Spike 008 finding: production mergeAppSettings being mutative is itself a
// fragility risk — confirmed by initial verification where Variant B's
// page.data merge polluted Variant A's $state through the shared staticSettings
// reference. Migration phase should consider tightening this helper.
function pureMerge<T extends object, U extends object>(target: T, additional: U): T & U {
  const nonNull = Object.fromEntries(Object.entries(additional).filter(([, v]) => v != null));
  return { ...target, ...nonNull } as T & U;
}

const CONTEXT_KEY = Symbol('appSettingsVariantA');

export interface AppSettingsVariantA {
  readonly current: AppSettings;
  /** For instrumentation: did $effect ever fire? */
  readonly effectFired: boolean;
}

export function getAppSettingsVariantA(): AppSettingsVariantA {
  if (!hasContext(CONTEXT_KEY))
    error(500, 'getAppSettingsVariantA() called before init');
  return getContext<AppSettingsVariantA>(CONTEXT_KEY);
}

export function initAppSettingsVariantA(): AppSettingsVariantA {
  if (hasContext(CONTEXT_KEY)) error(500, 'initAppSettingsVariantA() called twice');

  let value = $state<AppSettings>(pureMerge(staticSettings, dynamicSettings));
  let _effectFired = $state(false);

  let prevData: DynamicSettings | Error | undefined;
  $effect(() => {
    _effectFired = true;
    const data = page.data?.appSettingsData as DynamicSettings | Error | undefined;
    if (data === prevData) return;
    prevData = data;
    if (!data || data instanceof Error) return;
    value = pureMerge(value, data);
  });

  return setContext(CONTEXT_KEY, {
    get current() {
      return value;
    },
    get effectFired() {
      return _effectFired;
    }
  });
}
