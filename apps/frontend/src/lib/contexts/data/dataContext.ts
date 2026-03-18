import { DataRoot } from '@openvaa/data';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { get } from 'svelte/store';
import { getI18nContext } from '../i18n';
import type { Readable, Subscriber, Unsubscriber, Writable } from 'svelte/store';
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
  if (hasContext(CONTEXT_KEY)) error(500, 'initDataContext() called for a second time');
  const { locale, t } = getI18nContext();

  const dataRoot = new DataRoot({ locale: get(locale) });

  // Override some dataRoot formatters
  function setFormatters(root: DataRoot): void {
    root.setFormatter('booleanAnswer', ({ value }) => t(value ? 'common.answer.yes' : 'common.answer.no'));
    root.setFormatter('missingAnswer', () => t('common.missingAnswer'));
  }
  setFormatters(dataRoot);

  // Create a store that always notifies subscribers, even when the value is
  // the same object reference. Svelte 5's built-in writable uses Object.is()
  // for equality, which skips notifications for same-reference objects. Since
  // DataRoot is mutated in-place and fires onUpdate() to signal changes, we
  // need a store that bypasses this equality check.
  const store = alwaysNotifyStore<DataRoot>(dataRoot);

  function forceSetDataRoot(value: DataRoot): void {
    store.set(value);
  }

  // Re-notify subscribers when the DataRoot's contents change
  dataRoot.subscribe(() => forceSetDataRoot(get(store)));

  const dataRootStore: Readable<DataRoot> = { subscribe: store.subscribe };

  return setContext<DataContext>(CONTEXT_KEY, { dataRoot: dataRootStore });
}

/**
 * A writable store that always notifies subscribers on `set()`, even when the
 * new value is the same reference as the old value. This is needed because
 * Svelte 5's built-in writable uses `Object.is()` for equality checking,
 * which skips notification for same-reference objects. For mutable objects
 * like DataRoot that signal changes via callbacks, we need every `set()` call
 * to propagate through derived chains.
 *
 * TODO[Svelte 5]: Replace with Svelte 5 native reactivity ($state / $derived).
 * The underlying issue is that DataRoot is mutated in-place and relies on an
 * imperative onUpdate() callback, which conflicts with Svelte 5's signal-based
 * equality checks. A proper fix would make the DataRoot store integration use
 * Svelte 5 runes directly, eliminating the need for this workaround.
 */
function alwaysNotifyStore<TValue>(initialValue: TValue): Writable<TValue> {
  let value = initialValue;
  const subscribers = new Set<Subscriber<TValue>>();

  function set(newValue: TValue): void {
    value = newValue;
    for (const subscriber of subscribers) {
      subscriber(value);
    }
  }

  function update(fn: (value: TValue) => TValue): void {
    set(fn(value));
  }

  function subscribe(run: Subscriber<TValue>): Unsubscriber {
    subscribers.add(run);
    run(value);
    return () => {
      subscribers.delete(run);
    };
  }

  return { set, update, subscribe };
}
