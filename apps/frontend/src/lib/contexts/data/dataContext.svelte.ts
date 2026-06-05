import { DataRoot } from '@openvaa/data';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext, untrack } from 'svelte';
import { getI18nContext } from '../i18n';
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

  // Subscribe to DataRoot's imperative change notifications. DataRoot's
  // `Updatable.subscribe()` is the domain abstraction (transactional mutation
  // batching across nested `provide*`) and must stay intact.
  //
  // The callback writes a $state (`version++`). It runs from DataRoot's
  // notification, not from inside a reactive read scope, so it does not itself
  // form a read-then-write cycle. We still wrap the write in `untrack()`
  // defensively (Pattern 3 / L-2): should this callback ever fire synchronously
  // within a producer effect's tracked scope, `untrack` isolates the write so it
  // cannot retrigger that effect (`effect_update_depth_exceeded`).
  dataRoot.subscribe(() => {
    untrack(() => {
      version++;
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

  // Exported `dataRoot` is now a plain rune handle exposing a reactive `.current`
  // getter (the Wave-3 codemod target). The legacy `Readable<DataRoot>` store
  // bridge was removed in Wave 4 (Phase 98) once the last `$dataRoot` / `get(store)`
  // consumers migrated to `reactiveDataRoot.instance`. The getter body reuses the
  // SAME `version` $state as `reactiveDataRoot.current` — single source of truth.
  const dataRootExport = {
    get current() {
      void version;
      return dataRoot;
    }
  };

  return setContext<DataContext>(CONTEXT_KEY, { dataRoot: dataRootExport, reactiveDataRoot });
}
