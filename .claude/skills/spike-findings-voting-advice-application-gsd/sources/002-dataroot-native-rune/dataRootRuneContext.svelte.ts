/**
 * SPIKE 002 — dataRoot as a fully idiomatic Svelte 5 rune context.
 *
 * Goal: replace the hybrid pattern in
 * `apps/frontend/src/lib/contexts/data/dataContext.svelte.ts`
 * (which holds DataRoot + a `version` $state, but ALSO maintains a
 * `writable(dataRoot)` bridge for `$dataRoot.X` auto-subscribe AND a
 * `get(dataRootStore)` workaround for the write-side infinite-loop trap at
 * `routes/+layout.svelte:110-135`).
 *
 * Approach A (this attempt): keep DataRoot's existing `Updatable` API
 * (subscribe/update — a domain abstraction, not a Svelte store), bridge
 * notifications to a `$state` version counter, expose TWO handles:
 *
 *   - `current`  → reactive getter. Consumers use this in $derived / $effect /
 *                  templates. Reads bump the version-counter dependency.
 *   - `instance` → raw, non-reactive handle. Producers use this for mutations
 *                  inside untrack() to avoid the read-write loop trap.
 *
 * If Approach A produces gnarly consumer code, the spike pivots to:
 *   - Approach B: functional updates (new DataRoot instance per provide* —
 *     identity change drives reactivity natively, no version counter)
 *   - Approach C: structured $state collections in the context, DataRoot
 *     reduced to a transient builder
 */

import { DataRoot } from '@openvaa/data';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';

const CONTEXT_KEY = Symbol('dataRootRune');

export interface DataRootRuneContext {
  /**
   * Reactive read — invocation tracks the version-counter dependency. Use in
   * $derived / $effect / templates. Returns the same DataRoot instance every
   * time; the dependency edge is the implicit `version` $state.
   */
  readonly current: DataRoot;
  /**
   * Non-reactive handle. Same object as `current` but reads do NOT establish
   * a reactive dependency. Use inside `untrack(() => ctx.instance.provide*(…))`
   * from producer $effects, or for one-shot reads where you do not want the
   * caller to re-run on DataRoot updates.
   */
  readonly instance: DataRoot;
}

export function getDataRootRuneContext(): DataRootRuneContext {
  if (!hasContext(CONTEXT_KEY)) error(500, 'getDataRootRuneContext() called before initDataRootRuneContext()');
  return getContext<DataRootRuneContext>(CONTEXT_KEY);
}

export function initDataRootRuneContext(): DataRootRuneContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'initDataRootRuneContext() called twice');

  const root = new DataRoot();

  // Version counter: bumped on every Updatable.subscribe notification. Acts as
  // the implicit reactive dependency for `current`. We intentionally don't
  // expose `version` itself — consumers should read via `current` so the
  // dependency is established at the same call site as the value read.
  let version = $state(0);

  root.subscribe(() => {
    version++;
  });

  const ctx: DataRootRuneContext = {
    get current() {
      void version; // establish dependency
      return root;
    },
    get instance() {
      return root; // no version read — non-reactive on purpose
    }
  };

  return setContext(CONTEXT_KEY, ctx);
}
