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
 * DataContext re-expressed as a Svelte 5 CLASS (class-conversion proof, Spikes
 * 020-023; see `.planning/spikes/CONTEXT-MEMBER-AUDIT.md` + CONVENTIONS §17-22).
 * The documented Svelte 5 idiom is "use classes with `$state` fields to share
 * reactivity between components, instead of using stores" — here the reactive core
 * is the private `#version` `$state` FIELD.
 *
 * This is the Group-C §22 "version-bridge" class (the dataRoot pattern, NOT wholesale
 * replacement): `DataRoot` has a STABLE identity and is mutated in place; `#version`
 * is bumped (untracked) on every `DataRoot.update()` notification, bridging
 * `Updatable.subscribe()` to `$derived` reactivity. Per §22 this version-bridge is
 * KEPT verbatim — it does NOT simplify away (Spike 022; the bridge is intrinsic to
 * wrapping a non-rune object).
 *
 * Two deliberate shape choices, both spike-derived:
 *
 * 1. Own-property handles — spread-safe (appContext `{ ...dataCtx }`). The public
 *    `dataRoot` handle and the `setDataRoot` writer are exposed as OWN properties
 *    (instance fields), NOT prototype getters. appContext re-exposes this context via
 *    `{ ...dataCtx }`, and spreading a class INSTANCE copies only own-enumerable
 *    properties — prototype accessors would be silently dropped (Spike 020 finding;
 *    CONVENTIONS "Spread-of-context"). (Phase 113 FLATTEN-01 collapsed the duplicate
 *    read-only mirror + its non-reactive producer-read split into this single
 *    reactive `dataRoot` handle; the one producer-write consumer moved to
 *    `setDataRoot`.)
 *
 * 2. §18 arrow-function field — survives detach. `setDataRoot` is an ARROW-FUNCTION
 *    field, not a method, so it survives being destructured/detached
 *    (`const { setDataRoot } = ctx`) with `this` intact (CONVENTIONS §18; Spike 020
 *    Group E). It internalizes the `untrack` that producers previously hand-wrote at
 *    the call site, so the old `.instance` handle + hand-written `untrack` collapse to
 *    a single write path (Spike 017/022).
 *
 * NB (§22 silent-loop caveat). With a class private `#version`, a producer that reads
 * the REACTIVE getter then mutates self-perpetuates SILENTLY (no
 * `effect_update_depth_exceeded` throw, unlike the plain-`let` version — Spike 022).
 * Producers MUST go through `setDataRoot`.
 */
class DataContextProvider implements DataContext {
  readonly #dataRoot: DataRoot;
  #version = $state(0);

  // Bare own-enumerable reactive accessor — spread-safe (appContext `{ ...dataCtx }`).
  // Installed via `Object.defineProperty(this, 'dataRoot', { enumerable: true })` in
  // the constructor so the accessor survives the spread (own-enumerable, unlike a
  // prototype getter) AND its getter can close over `this` for the private `#version`
  // read. (Phase 113 FLATTEN-02: dropped the `.current` wrapper — consumers read
  // `ctx.dataRoot` bare; the `void #version` reactive re-read is preserved inside.)
  readonly dataRoot!: DataRoot;

  constructor(dataRoot: DataRoot) {
    this.#dataRoot = dataRoot;

    // Subscribe to DataRoot's imperative change notifications and bump `#version`.
    // The write is wrapped in `untrack()` (Pattern 3 / L-2): should this callback
    // ever fire synchronously within a producer effect's tracked scope, `untrack`
    // isolates the write so it cannot retrigger that effect.
    dataRoot.subscribe(() => {
      untrack(() => {
        this.#version++;
      });
    });

    // `self` lets the accessor reach the class-private `#version`
    // (private-field access is legal anywhere lexically inside the class body).
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
   * The write runs inside `untrack`, so a producer `$effect` calling this takes NO
   * dependency on `#version` and cannot self-loop. Replaces the previous
   * former non-reactive producer-read + hand-written `untrack` idiom (Spike 017/022).
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
