import {getContext, setContext} from 'svelte';
import {type Writable} from 'svelte/store';
import {type Tweened} from 'svelte/motion';

interface Progress {
  current: Tweened<number>;
  max: Writable<number>;
}

/**
 * Initialise context with progress stores.
 */
export function setTopBarProgressContext(progress: Progress) {
  setContext('progress', progress);
}

/**
 * Get context with progress stores.
 */
export function getTopBarProgressContext() {
  return getContext<Progress>('progress');
}
