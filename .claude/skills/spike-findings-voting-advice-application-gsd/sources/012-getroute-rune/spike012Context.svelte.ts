/**
 * SPIKE 012 — variant bundle context.
 *
 * Initializes the four candidate `getRoute` shapes ONCE at the layout's
 * mount and exposes them via a Symbol-keyed context. Child pages consume
 * the same instances so variant A's mount-time snapshot is observable
 * across client-side route hops.
 */
import { getContext, setContext } from 'svelte';
import {
  getRouteVariantA_snapshot,
  getRouteVariantB_perCall,
  getRouteVariantC_derivedBy,
  getRouteVariantD_derivedByPlusAfterNavigate
} from './getRouteRuneStore.svelte';
import type { RouteBuilder } from './getRouteRuneStore.svelte';

export type Spike012VariantBundle = {
  a: { readonly current: RouteBuilder };
  b: { readonly current: RouteBuilder };
  c: { readonly current: RouteBuilder };
  d: { readonly current: RouteBuilder; readonly navCount: number };
};

const KEY = Symbol.for('spike-012:getroute-rune-variants');

export function initSpike012Variants(): Spike012VariantBundle {
  return setContext<Spike012VariantBundle>(KEY, {
    a: getRouteVariantA_snapshot(),
    b: getRouteVariantB_perCall(),
    c: getRouteVariantC_derivedBy(),
    d: getRouteVariantD_derivedByPlusAfterNavigate()
  });
}

export function getSpike012Variants(): Spike012VariantBundle {
  return getContext<Spike012VariantBundle>(KEY);
}
