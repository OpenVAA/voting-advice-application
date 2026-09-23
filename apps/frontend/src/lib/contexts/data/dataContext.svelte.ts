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
 * DataContext as a Svelte 5 CLASS.
 * The documented Svelte 5 idiom is "use classes with `$state` fields to share reactivity between components, instead of using stores" — here the reactive core is the private `#version` `$state` FIELD.
 *
 * This is a "version-bridge" class (the dataRoot pattern, NOT wholesale replacement): `DataRoot` has a STABLE identity and is mutated in place; `#version` is bumped (untracked) on every `DataRoot.update()` notification, bridging `Updatable.subscribe()` to `$derived` reactivity. The version-bridge does NOT simplify away — it is intrinsic to wrapping a non-rune object.
 *
 * Two deliberate shape choices:
 *
 * 1. Own-property handles — spread-safe (appContext `{ ...dataCtx }`). The public
 *    `dataRoot` handle and the `setDataRoot` writer are exposed as OWN properties (instance fields), NOT prototype getters. appContext re-exposes this context via `{ ...dataCtx }`, and spreading a class INSTANCE copies only own-enumerable properties — prototype accessors would be silently dropped by the spread.
 *    There is deliberately ONE reactive `dataRoot` handle and no read-only mirror beside it; every producer write goes through `setDataRoot`.
 *
 * 2. arrow-function field — survives detach. `setDataRoot` is an ARROW-FUNCTION
 *    field, not a method, so it survives being destructured/detached (`const { setDataRoot } = ctx`) with `this` intact. It internalizes the `untrack` that a producer would otherwise have to hand-write at the call site, so there is a single write path rather than a raw handle plus a hand-written `untrack`.
 *
 * NB (silent-loop caveat). With a class private `#version`, a producer that reads the REACTIVE getter then mutates self-perpetuates SILENTLY (no `effect_update_depth_exceeded` throw that a plain-`let` version would raise).
 * Producers MUST go through `setDataRoot`.
 */
class DataContextProvider implements DataContext {
  readonly #dataRoot: DataRoot;
  #version = $state(0);

  // Bare own-enumerable reactive accessor — spread-safe (appContext `{ ...dataCtx }`).
  // Installed via `Object.defineProperty(this, 'dataRoot', { enumerable: true })` in the constructor so the accessor survives the spread (own-enumerable, unlike a prototype getter) AND its getter can close over `this` for the private `#version` read. There is no `.current` wrapper — consumers read `ctx.dataRoot` bare; the `void #version` reactive re-read happens inside the getter.
  readonly dataRoot!: DataRoot;

  constructor(dataRoot: DataRoot) {
    this.#dataRoot = dataRoot;

    // Subscribe to DataRoot's imperative change notifications and bump `#version`.
    // The write is wrapped in `untrack()`: should this callback ever fire synchronously within a producer effect's tracked scope, `untrack` isolates the write so it cannot retrigger that effect.
    dataRoot.subscribe(() => {
      untrack(() => {
        this.#version++;
      });
    });

    // `self` lets the accessor reach the class-private `#version` (private-field access is legal anywhere lexically inside the class body).
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- the defineProperty getter below has its own `this`; `self` captures the instance to reach the private `#version` reactive backing (the spread-safe class pattern).
    const self = this;
    Object.defineProperty(this, 'dataRoot', {
      get(): DataRoot {
        void self.#version; // reactive: re-evaluates on every DataRoot update
        return dataRoot;
      },
      enumerable: true,
      configurable: true
    });
  }

  /**
   * Mutate the DataRoot. Pass an `updater` that calls `dr.update(() => dr.provide*(...))`.
   * The write runs inside `untrack`, so a producer `$effect` calling this takes NO dependency on `#version` and cannot self-loop. This is the single write path; a producer must never read the reactive getter and then mutate in place.
   */
  setDataRoot = (updater: (dataRoot: DataRoot) => void): void => {
    untrack(() => updater(this.#dataRoot));
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
  dataRoot.setFormatter('booleanAnswer', ({ value }) => t(value ? 'common.answer.yes' : 'common.answer.no'));
  dataRoot.setFormatter('missingAnswer', () => t('common.missingAnswer'));

  return setContext<DataContext>(CONTEXT_KEY, new DataContextProvider(dataRoot));
}
