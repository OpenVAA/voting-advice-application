import { DataRoot } from '@openvaa/data';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext, untrack } from 'svelte';
import { getI18nContext } from '../i18n';
import type { Readable, Subscriber, Unsubscriber } from 'svelte/store';
import type { DataContext } from './dataContext.type';

const CONTEXT_KEY = Symbol();

export function getDataContext(): DataContext {
  if (!hasContext(CONTEXT_KEY)) error(500, 'getDataContext() called before initDataContext()');
  return getContext<DataContext>(CONTEXT_KEY);
}

/**
 * Minimal hand-rolled `Readable<DataRoot>` bridge.
 *
 * Wave-1 obligation: `dataRoot` is consumed as `$dataRoot` (auto-subscribe) and
 * via a synchronous `get(store)` read in ~23 un-migrated `.svelte` callsites.
 * Those keep a store contract until the Wave 3/4 consumer codemod, so we expose a `Readable`
 * surface here — but WITHOUT the old store-constructor / store-derive helpers:
 *   - The old internal store-constructor workaround is gone; the rune-native
 *     context no longer needs it for its own reactivity (the `version` $state
 *     counter does that job).
 *   - A getter-derived store also short-circuits because DataRoot is a
 *     long-lived singleton — every update returns the SAME object reference with
 *     mutated internal state, which Svelte 5's getter-derive render-effect treats
 *     as "no change" and never re-emits. That was the documented infinite-loop /
 *     stale-bridge trap.
 *
 * This bridge is a plain subscriber set fed by an imperative `set` from
 * DataRoot's own `subscribe()` notification. It is deleted in Wave 3/4 once the
 * last `$dataRoot` consumer migrates to `reactiveDataRoot.current`.
 */
function createDataRootBridge(initial: DataRoot): Readable<DataRoot> & { set: (value: DataRoot) => void } {
  let value = initial;
  const subscribers = new Set<Subscriber<DataRoot>>();
  return {
    set(next: DataRoot): void {
      value = next;
      for (const run of subscribers) run(value);
    },
    subscribe(run: Subscriber<DataRoot>): Unsubscriber {
      subscribers.add(run);
      run(value);
      return () => subscribers.delete(run);
    }
  };
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

  // Temporary `Readable<DataRoot>` surface for un-migrated `$dataRoot` consumers
  // (removed in Wave 3/4). Fed imperatively from the subscribe callback below.
  const dataRootStore = createDataRootBridge(dataRoot);

  // Subscribe to DataRoot's imperative change notifications. DataRoot's
  // `Updatable.subscribe()` is the domain abstraction (transactional mutation
  // batching across nested `provide*`) and must stay intact.
  //
  // The callback both writes a $state (`version++`) and the bridge (`set`). It
  // runs from DataRoot's notification, not from inside a reactive read scope, so
  // it does not itself form a read-then-write cycle. We still wrap the write in
  // `untrack()` defensively (Pattern 3 / L-2): should this callback ever fire
  // synchronously within a producer effect's tracked scope, `untrack` isolates
  // the write so it cannot retrigger that effect (`effect_update_depth_exceeded`).
  dataRoot.subscribe(() => {
    untrack(() => {
      version++;
      dataRootStore.set(dataRoot);
    });
  });

  // Rune-native handle split (Pattern 2):
  //   - `current`  → reactive. Reads `version`, so $derived/$effect/template
  //                  consumers re-evaluate on every DataRoot update.
  //   - `instance` → non-reactive. Same object, but does NOT read `version`, so
  //                  producers/effects can mutate DataRoot without taking a
  //                  read-dependency on the counter (avoids the write-after-read
  //                  loop trap).
  const reactiveDataRoot = {
    get current() {
      void version;
      return dataRoot;
    },
    get instance() {
      return dataRoot;
    }
  };

  return setContext<DataContext>(CONTEXT_KEY, { dataRoot: dataRootStore, reactiveDataRoot });
}
