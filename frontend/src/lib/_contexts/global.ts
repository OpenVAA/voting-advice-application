import {setContext, getContext} from 'svelte';
import {writable, type Writable} from 'svelte/store';
import {DataRoot} from '$lib/_vaa-data';

export const GLOBAL_CONTEXT_NAME = 'global';

const dataRoot = new DataRoot();
const dataRootStore = writable<DataRoot>(dataRoot);
dataRoot.subscribe((dataRoot) => dataRootStore.set(dataRoot));

/**
 * Get the global context and initialize it if necessary.
 */
export function getGlobalContext() {
  let context = getContext<GlobalContext>(GLOBAL_CONTEXT_NAME);
  if (context == null) {
    context = {
      vaaData: dataRootStore
    };
    setContext<GlobalContext>(GLOBAL_CONTEXT_NAME, context);
  }
  return context;
}

export type GlobalContext = {
  vaaData: Writable<DataRoot>;
};
