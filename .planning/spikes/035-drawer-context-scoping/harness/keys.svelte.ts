import { createContext } from 'svelte';
export const ROOT_KEY = Symbol('root');
export const VOTER_KEY = Symbol('voter');
export const FILTER_KEY = Symbol('filter');
export const UNRELATED_KEY = Symbol('unrelated-ancestor');
export const [getTyped, setTyped] = createContext<{ label: string }>();

/** Module-level stand-in for `drawerHost.current`. */
export const host = $state<{ payload: null | { content: import('svelte').Snippet; contexts?: Map<unknown, unknown>; carriers?: Array<() => void> } }>({ payload: null });
export const log: Array<string> = [];
