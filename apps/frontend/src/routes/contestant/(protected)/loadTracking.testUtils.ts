/**
 * Read-recording instruments for the guards that hold what the loads of the Contestant App's protected tree depend on.
 */

export type Untrack = <TValue>(fn: () => TValue) => TValue;

/** A `URL` whose property reads are logged unless they happen inside the returned `untrack`. */
export function recordingUrl(href: string): { url: URL; trackedReads: Array<string>; untrack: Untrack } {
  const real = new URL(href);
  const trackedReads: Array<string> = [];
  let untracked = 0;
  const url = new Proxy(real, {
    get(target, prop) {
      if (!untracked && typeof prop === 'string') trackedReads.push(prop);
      const value = Reflect.get(target, prop, target);
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });
  function untrack<TValue>(fn: () => TValue): TValue {
    untracked++;
    try {
      return fn();
    } finally {
      untracked--;
    }
  }
  return { url, trackedReads, untrack };
}

/** Route params whose every read is logged by name. */
export function recordingParams(values: Record<string, string>): {
  params: Record<string, string>;
  paramReads: Array<string>;
} {
  const paramReads: Array<string> = [];
  const params = new Proxy(values, {
    get(target, prop) {
      if (typeof prop === 'string') paramReads.push(prop);
      return Reflect.get(target, prop, target);
    }
  });
  return { params, paramReads };
}

/** A `route` object that throws on any read. */
export function forbiddenRoute(): { id: string } {
  return new Proxy(
    { id: '/contestant/(protected)' },
    {
      get(_target, prop) {
        throw new Error(`the load read route.${String(prop)}, which makes SvelteKit rerun it when the route changes`);
      }
    }
  );
}
