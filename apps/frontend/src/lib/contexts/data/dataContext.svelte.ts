import { DataRoot } from '@openvaa/data';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { writable } from 'svelte/store';
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

  // Plain Svelte writable for `$dataRoot` auto-subscribe in .svelte components.
  // Updated imperatively in the dataRoot.subscribe callback below.
  //
  // Why not `toStore(() => dataRootReactive)`? Svelte 5's `toStore` wraps a
  // getter in an internal `render_effect` whose `set(value)` short-circuits
  // when the getter returns the same object reference across runs (the writable's
  // `safe_not_equal` does fire, but the render_effect's tracking does not
  // re-schedule a `set` call when the derived's identity is stable). DataRoot
  // is a long-lived singleton — every update returns the same object reference
  // with mutated internal state, which is exactly the pattern that breaks
  // toStore's propagation. Imperative `dataRootStore.set(dataRoot)` from the
  // dataRoot.subscribe callback bypasses the bridge and reliably notifies all
  // `$dataRoot` subscribers.
  const dataRootStore: Readable<DataRoot> = writable(dataRoot);

  // Subscribe to DataRoot's imperative change notifications
  dataRoot.subscribe(() => {
    version++;
    (dataRootStore as { set: (v: DataRoot) => void }).set(dataRoot);
  });

  // Direct reactive access object for $derived/$state consumers
  // (VoterContext, CandidateContext effects) — reads `version` to track changes.
  const reactiveDataRoot = {
    get current() {
      void version;
      return dataRoot;
    }
  };

  return setContext<DataContext>(CONTEXT_KEY, { dataRoot: dataRootStore, reactiveDataRoot });
}
