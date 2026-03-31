import { DataRoot } from '@openvaa/data';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { toStore } from 'svelte/store';
import { getI18nContext } from '../i18n';
import type { Readable } from 'svelte/store';
import type { DataContext } from './dataContext.type';

const CONTEXT_KEY = Symbol();

export function getDataContext(): DataContext {
  if (!hasContext(CONTEXT_KEY)) error(500, 'getDataContext() called before initDataContext()');
  return getContext<DataContext>(CONTEXT_KEY);
}

/**
 * Initialize and return the context. This must be called before `getDataContext()` and cannot be called twice.
 * @returns The context object
 */
export function initDataContext(): DataContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'initDataContext() called for a second time');
  const { locale, t } = getI18nContext();

  const dataRoot = new DataRoot({ locale });

  // Override some dataRoot formatters
  dataRoot.setFormatter('booleanAnswer', ({ value }) =>
    t(value ? 'common.answer.yes' : 'common.answer.no')
  );
  dataRoot.setFormatter('missingAnswer', () => t('common.missingAnswer'));

  // Version counter: $state incremented on every DataRoot update.
  // This bridges DataRoot's imperative subscribe() notifications to $derived reactivity.
  let version = $state(0);

  // Subscribe to DataRoot's imperative change notifications
  dataRoot.subscribe(() => {
    version++;
  });

  // Derived value that re-evaluates when version changes
  const dataRootReactive = $derived.by(() => {
    void version; // Read version to create dependency
    return dataRoot;
  });

  // Expose as store for .svelte file $dataRoot usage
  const dataRootStore: Readable<DataRoot> = toStore(() => dataRootReactive);

  // Direct reactive access object — bypasses toStore/fromStore bridge.
  // Contexts (VoterContext, CandidateContext) should use this instead of
  // fromStore(dataRoot) to avoid async propagation delays.
  const reactiveDataRoot = {
    get current() {
      void version;
      return dataRoot;
    }
  };

  return setContext<DataContext>(CONTEXT_KEY, { dataRoot: dataRootStore, reactiveDataRoot });
}
