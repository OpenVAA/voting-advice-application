import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { DarkMode } from './darkMode.svelte';
import { getI18nContext } from '../i18n';
import type { ComponentContext } from './componentContext.type';
import type { I18nContext } from '../i18n';

const CONTEXT_KEY = Symbol();

/**
 * Svelte 5 class implementation of the component context (Phase 107 CLASS-02). It
 * is a leaf COMPOSING context: it forwards the i18n surface and owns the
 * `DarkMode` helper.
 *
 * Spread-safety (load-bearing): `appContext` does `{ ...componentCtx }` (line
 * ~297), and an object spread copies only OWN-enumerable properties — Svelte 5
 * compiles `$state`/`$derived` class fields to private backing + PROTOTYPE
 * accessors, which the spread silently drops (107-01 verified fact). The i18n
 * members (`locale`/`locales`/`t`/`translate`) are therefore copied as OWN
 * properties in the constructor via `Object.assign(this, getI18nContext())`.
 * They are STABLE references (CLAUDE.md): `locale` is constant within a page
 * lifecycle and `t`/`translate`/`locales` are plain values, so a one-time
 * own-property copy reproduces the prior behavior byte-identically.
 *
 * `darkMode` is a delegation GETTER over a private `new DarkMode()` field (§17
 * Group G). A prototype getter is SAFE here because `appContext` reads it via
 * DIRECT property access (`componentCtx.darkMode`, lines ~292/356) and OVERRIDES
 * it after the spread with its own `{ current }` handle — the spread never needs
 * to carry `darkMode`. This is the "no `{ current }` handle re-export" criterion:
 * the `DarkMode` class is composed directly and forwarded via the getter.
 */
export class ComponentContextProvider implements ComponentContext {
  // i18n surface — declared with definite-assignment; populated as OWN properties
  // in the constructor (spread-safe) via `Object.assign(this, getI18nContext())`.
  locale!: string;
  locales!: ReadonlyArray<string>;
  t!: I18nContext['t'];
  translate!: I18nContext['translate'];

  #darkMode = new DarkMode();

  constructor() {
    // Copy the i18n members as OWN properties so `{ ...componentCtx }` carries them.
    Object.assign(this, getI18nContext());
  }

  get darkMode(): boolean {
    return this.#darkMode.current;
  }
}

export function getComponentContext() {
  if (!hasContext(CONTEXT_KEY)) error(500, 'GetComponentsContext() called before initComponentContext()');
  return getContext<ComponentContext>(CONTEXT_KEY);
}

/**
 * Initialize and return the context. This must be called before `getComponentContext()` and cannot be called twice.
 * @returns The context object
 */
export function initComponentContext(): ComponentContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'InitComponentsContext() called for a second time');

  return setContext<ComponentContext>(CONTEXT_KEY, new ComponentContextProvider());
}
