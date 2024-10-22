import {getContext, setContext} from 'svelte';
import {writable, type Writable} from 'svelte/store';

type TopBarActionsVisibility = {
  [action in TopBarAction]: 'hide' | 'show';
};

type TopBarAction = 'return' | 'help' | 'feedback' | 'results';

interface TopBarActionsSettings extends TopBarActionsVisibility {
  returnButtonLabel: string;
  returnButtonCallback?: () => void;
}

export const DEFAULT_SETTINGS: TopBarActionsSettings = {
  return: 'show',
  help: 'show',
  feedback: 'show',
  results: 'show',
  returnButtonLabel: ''
};

/**
 * Initialise top bar actions context.
 */
export function setTopBarActionsConext() {
  setContext('topBarActions', writable<TopBarActionsSettings>({...DEFAULT_SETTINGS}));
}

/**
 * Reset top bar actions context to defaults with possible overrides.
 */
export function resetTopBarActionsContext(override: Partial<TopBarActionsSettings> = {}) {
  const ctx = getTopBarActionsContext();
  ctx.set({...DEFAULT_SETTINGS, ...override});
}

/**
 * Get context for top action bar actions.
 */
export function getTopBarActionsContext() {
  return getContext<Writable<TopBarActionsSettings>>('topBarActions');
}
