import {writable} from 'svelte/store';

/**
 * The currently active tab in the results. We want this to persist between opening entity details and returning to the results.
 */
export const activeTab = writable(0);

export const resultsVideoSeen = writable(false);
