import {getContext, setContext} from 'svelte';
import {writable, type Writable} from 'svelte/store';

interface TopBarSettings {
  imageSrc?: string;
  hideProgressBar: boolean;
}

export const DEFAULT_SETTINGS: TopBarSettings = {
  hideProgressBar: true
};

/**
 * Initialise top bar context.
 */
export function setTopBarContext() {
  setContext('topBar', writable<TopBarSettings>({...DEFAULT_SETTINGS}));
}

/**
 * Reset top bar context to defaults with possible overrides.
 */
export function resetTopBarContext(override: Partial<TopBarSettings> = {}) {
  const ctx = getTopBarContext();
  ctx.set({...DEFAULT_SETTINGS, ...override});
}

/**
 * Get top bar context.
 */
export function getTopBarContext() {
  return getContext<Writable<TopBarSettings>>('topBar');
}
