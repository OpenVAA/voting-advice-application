/**
 * SPIKE 008 — Variant B: SSR-aware initialization.
 *
 * Reads `page.data.appSettingsData` SYNCHRONOUSLY at init time and folds it
 * into the initial `$state` value. The $effect then only handles the
 * "page.data changed after navigation" case — initial render does NOT depend
 * on $effect firing.
 *
 * SSR consequence: server-rendered HTML correctly reflects
 * staticSettings ∪ dynamicSettings ∪ page.data.appSettingsData (DB override).
 *
 * Client hydration: no re-render needed for the initial DB-override merge —
 * the value is already correct from SSR. The $effect tracks page.data for
 * subsequent navigations.
 */

import { dynamicSettings, staticSettings } from '@openvaa/app-shared';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { page } from '$app/state';
import type { DynamicSettings } from '@openvaa/app-shared';

// PURE merge — see Variant A for the rationale.
function pureMerge<T extends object, U extends object>(target: T, additional: U): T & U {
  const nonNull = Object.fromEntries(Object.entries(additional).filter(([, v]) => v != null));
  return { ...target, ...nonNull } as T & U;
}

const CONTEXT_KEY = Symbol('appSettingsVariantB');

export interface AppSettingsVariantB {
  readonly current: AppSettings;
  /** For instrumentation: did $effect ever fire? Should be false on server. */
  readonly effectFired: boolean;
  /** For instrumentation: did initial merge include DB data? */
  readonly initialMergeIncludedDbOverride: boolean;
}

export function getAppSettingsVariantB(): AppSettingsVariantB {
  if (!hasContext(CONTEXT_KEY))
    error(500, 'getAppSettingsVariantB() called before init');
  return getContext<AppSettingsVariantB>(CONTEXT_KEY);
}

export function initAppSettingsVariantB(): AppSettingsVariantB {
  if (hasContext(CONTEXT_KEY)) error(500, 'initAppSettingsVariantB() called twice');

  // Synchronous read at init — runs both server-side AND client-side.
  const initialDbData = page.data?.appSettingsData as DynamicSettings | Error | undefined;
  const _initialMergeIncludedDbOverride = !!(
    initialDbData && !(initialDbData instanceof Error)
  );

  let initial = pureMerge(staticSettings, dynamicSettings);
  if (_initialMergeIncludedDbOverride && initialDbData) {
    initial = pureMerge(initial, initialDbData as DynamicSettings);
  }
  let value = $state<AppSettings>(initial);
  let _effectFired = $state(false);

  // Now the $effect ONLY handles navigation cases (page.data changes after init).
  // It does NOT carry initial-merge responsibility.
  let prevData: DynamicSettings | Error | undefined = initialDbData;
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
    },
    get initialMergeIncludedDbOverride() {
      return _initialMergeIncludedDbOverride;
    }
  });
}
