import {error} from '@sveltejs/kit';
import {setContext, getContext, hasContext} from 'svelte';
import {readable, type Readable} from 'svelte/store';
import {DataRoot} from '$lib/_vaa-data';
import {getI18nContext} from './i18n';

export const VAA_DATA_CONTEXT_NAME = 'vaa-data';

export function getVaaDataContext(): VaaDataContext {
  if (!hasContext(VAA_DATA_CONTEXT_NAME))
    error(500, 'getVaaDataContext() called before initVaaDataContext()');
  return getContext<VaaDataContext>(VAA_DATA_CONTEXT_NAME);
}

/**
 * Initialize and return the context. This must be called before `getGlobalContext()` and cannot be called twice.
 * @returns The context object
 */
export function initVaaDataContext(): VaaDataContext {
  console.info('[debug] initVaaDataContext()');
  if (hasContext(VAA_DATA_CONTEXT_NAME))
    error(500, 'initVaaDataContext() called for a second time');
  const {locale} = getI18nContext();
  const dataRoot = new DataRoot();
  locale.subscribe((value) => {
    console.info('[debug] vaaDataContext: dataRoot: reset due to locale change.', value);
    dataRoot.reset();
  });
  const dataRootStore = readable<DataRoot>(dataRoot, (set) => {
    // Reassign `dataRoot` when its contents change to trigger update of `dataRootStore`
    const unsubscribe = dataRoot.subscribe((value) => {
      console.info('[debug] dataRootStore: update due to object change.');
      set(value);
    });
    return unsubscribe;
  });
  return setContext<VaaDataContext>(VAA_DATA_CONTEXT_NAME, {dataRoot: dataRootStore});
}

export type VaaDataContext = {
  dataRoot: Readable<DataRoot>;
};
