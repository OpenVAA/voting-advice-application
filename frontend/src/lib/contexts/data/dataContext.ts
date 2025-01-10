import { DataRoot } from '@openvaa/data';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { readable } from 'svelte/store';
import { browser } from '$app/environment';
import { getI18nContext } from '../i18n';
import { paramStore } from '../utils/paramStore';
import type { DataContext } from './dataContext.type';

const CONTEXT_KEY = Symbol();

export function getDataContext(): DataContext {
  if (!hasContext(CONTEXT_KEY)) error(500, 'getDataContext() called before initDataContext()');
  return getContext<DataContext>(CONTEXT_KEY);
}

/**
 * Initialize and return the context. This must be called before `getGlobalContext()` and cannot be called twice.
 * @returns The context object
 */
export function initDataContext(): DataContext {
  console.info('[debug] initDataContext()');
  if (hasContext(CONTEXT_KEY)) error(500, 'initDataContext() called for a second time');
  const { locale, t } = getI18nContext();

  const dataRoot = new DataRoot({ locale: locale.get() });

  // Override some dataRoot formatters
  function setFormatters(root: DataRoot): void {
    root.setFormatter('booleanAnswer', ({ value }) => t.get(value ? 'common.answer.yes' : 'common.answer.no'));
    root.setFormatter('missingAnswer', () => t.get('common.missingAnswer'));
  }
  setFormatters(dataRoot);

  const dataRootStore = readable<DataRoot>(dataRoot, (set) => {
    // We use this temporarily to collect all unsubscribers from the dataRoot. It is needed as long as we need to create a new DataRoot when the locale changes. TODO[Svelte 5][i18n]: remove when possible
    const unsubscribers = new Array<() => unknown>();

    // Reassign `dataRoot` when its contents change to trigger update of `dataRootStore`
    unsubscribers.push(dataRoot.subscribe((value) => set(value)));

    // Recreate `dataRoot` when the locale changes, because all data need to be provided again
    paramStore('lang').subscribe((value) => {
      if (dataRoot.locale === value) return;

      console.info(
        '[debug] DataContext: dataRoot: reset due to `lang` route param change.',
        dataRoot.locale,
        browser,
        value
      );

      // Reset all existing subscriptions
      while (true) {
        const unsubscribe = unsubscribers.pop();
        if (!unsubscribe) break;
        unsubscribe();
      }
      // Create a new dataRoot with the new locale and subscribe to its updates
      const newRoot = new DataRoot({ locale: value });
      setFormatters(newRoot);

      unsubscribers.push(newRoot.subscribe((value) => set(value)));
    });

    return () => unsubscribers.forEach((f) => f());
  });

  return setContext<DataContext>(CONTEXT_KEY, { dataRoot: dataRootStore });
}
