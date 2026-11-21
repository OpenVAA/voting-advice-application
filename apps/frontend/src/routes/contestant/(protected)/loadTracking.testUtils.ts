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

/** What a recording request event is built from. */
export interface RecordingEventOptions {
  /** The URL of the request. */
  href: string;
  /** The route params the URL carries. */
  params?: Record<string, string>;
  /** The event's `parent`. When it is left out, `parent` rejects. */
  parent?: () => Promise<unknown>;
  /** Any further members of the event, such as `cookies`, `fetch` or `locals`. */
  extra?: Record<string, unknown>;
}

/**
 * A request event that is itself a recording Proxy, whose `url`, `params` and `route` are the instruments above and whose own member reads are logged by name.
 * @param options - The URL, params, parent and further members of the event.
 * @returns The event, typed as the load's own event, and what its instruments recorded.
 */
export function recordingEvent<TEvent>({ href, params: routeParams = {}, parent, extra = {} }: RecordingEventOptions): {
  event: TEvent;
  eventReads: Array<string>;
  paramReads: Array<string>;
  trackedReads: Array<string>;
} {
  const { url, trackedReads, untrack } = recordingUrl(href);
  const { params, paramReads } = recordingParams(routeParams);
  const eventReads: Array<string> = [];
  const event = new Proxy(
    {
      ...extra,
      params,
      parent: parent ?? (() => Promise.reject(new Error('the load must not await a parent'))),
      route: forbiddenRoute(),
      untrack,
      url
    },
    {
      get(target, prop) {
        if (typeof prop === 'string') eventReads.push(prop);
        return Reflect.get(target, prop, target);
      }
    }
  );
  return { event: event as unknown as TEvent, eventReads, paramReads, trackedReads };
}
