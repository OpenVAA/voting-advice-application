/**
 * SPIKE 001 — appSettings as a fully idiomatic Svelte 5 rune context.
 *
 * Goal: replace the current hybrid pattern in
 * `apps/frontend/src/lib/contexts/app/appContext.svelte.ts:74-100`
 * (which uses `$state` internally but exposes via `toStore()` for `$store.X`
 * template auto-subscribe) with a pure-runes context — no `svelte/store`
 * imports anywhere.
 *
 * Consumer contract:
 *   const ctx = getAppSettingsRuneContext();
 *   // template:        {ctx.current.publisher.name}
 *   // .ts $derived:    const platform = $derived(ctx.current.analytics?.platform);
 *   // .ts $effect:     $effect(() => { console.log(ctx.current); });
 *
 * No `$appSettings` auto-subscribe. No `get(appSettings)`. No `toStore`.
 */

import { dynamicSettings, staticSettings } from '@openvaa/app-shared';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { page } from '$app/state';
import { mergeAppSettings } from '$lib/utils/settings';
import type { DynamicSettings } from '@openvaa/app-shared';

const CONTEXT_KEY = Symbol('appSettingsRune');

export interface AppSettingsRuneContext {
  /** Reactive read — invoke at the call site to track. */
  readonly current: AppSettings;
}

export function getAppSettingsRuneContext(): AppSettingsRuneContext {
  if (!hasContext(CONTEXT_KEY)) error(500, 'getAppSettingsRuneContext() called before initAppSettingsRuneContext()');
  return getContext<AppSettingsRuneContext>(CONTEXT_KEY);
}

export function initAppSettingsRuneContext(): AppSettingsRuneContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'initAppSettingsRuneContext() called twice');

  // Initial: static ∪ default-dynamic. Mirrors production line 74.
  let value = $state<AppSettings>(mergeAppSettings(staticSettings, dynamicSettings));

  // Reactive DB-override merge. Reference-equality guard prevents redundant
  // merges when SvelteKit returns the same loader payload across navigations
  // (same trap that production guards at appContext.svelte.ts:93-100).
  let prevData: DynamicSettings | Error | undefined;
  $effect(() => {
    const data = page.data?.appSettingsData as DynamicSettings | Error | undefined;
    if (data === prevData) return;
    prevData = data;
    if (!data || data instanceof Error) return;
    value = mergeAppSettings(value, data);
  });

  const ctx: AppSettingsRuneContext = {
    get current() {
      return value;
    }
  };

  return setContext(CONTEXT_KEY, ctx);
}
