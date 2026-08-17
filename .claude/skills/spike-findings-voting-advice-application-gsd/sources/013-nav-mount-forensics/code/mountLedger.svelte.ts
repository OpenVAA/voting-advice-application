/**
 * Spike 013 — Mount/Destroy Ledger
 *
 * Global ring buffer that records every mount and destroy event from
 * instrumented components. Each entry carries an ISO timestamp, the event
 * type, a stable component name (string), and a per-instance UUID so we can
 * tell which mounts pair with which destroys.
 *
 * The ledger is module-scoped — a single shared instance across all
 * components in the spike — so the order of events from the FULL route tree
 * is preserved in a single readable timeline.
 *
 * Not for production: this leaks a global; the whole point is to observe
 * SvelteKit's layout-persistence behavior on the production routing pattern
 * (root → voters → located → questions → [questionId] etc.).
 */

import { onDestroy } from 'svelte';

export type LedgerEvent = {
  ts: string;
  event: 'mount' | 'destroy';
  name: string;
  instanceId: string;
  url?: string;
};

const RING_SIZE = 500;

const events = $state<Array<LedgerEvent>>([]);

function record(event: LedgerEvent): void {
  events.push(event);
  if (events.length > RING_SIZE) events.shift();
}

/**
 * Instrument a component. Call at the top of `<script>` and pass a stable
 * descriptive name (the component's role in the tree, NOT a label tied to
 * route params — that would make the ledger unreadable). The returned object
 * is reactive — bind `data-mount-id={ledger.instanceId}` on the root element
 * to make the mount-identity visible in DOM (so devtools can confirm the
 * SAME element across re-renders).
 *
 * Example:
 *   const ledger = trackMount('QuestionsLayout');
 *   <div data-mount-id={ledger.instanceId}>...</div>
 */
export function trackMount(name: string): { instanceId: string } {
  const instanceId = crypto.randomUUID().slice(0, 8);
  const url = typeof window !== 'undefined' ? window.location.pathname + window.location.search : undefined;
  record({ ts: new Date().toISOString(), event: 'mount', name, instanceId, url });
  onDestroy(() => {
    const destroyUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : undefined;
    record({ ts: new Date().toISOString(), event: 'destroy', name, instanceId, url: destroyUrl });
  });
  return { instanceId };
}

/**
 * Read-only ledger handle for the UI panel.
 */
export function getLedger(): { readonly events: ReadonlyArray<LedgerEvent> } {
  return {
    get events() {
      return events;
    }
  };
}

/**
 * Snapshot the ledger into a JSON-export shape. Reads through `$state` so
 * the snapshot is a plain array, not a proxy.
 */
export function exportLedger(): Array<LedgerEvent> {
  return events.map((e) => ({ ...e }));
}

/**
 * Clear the ledger. Useful for isolating a single navigation in the panel.
 */
export function clearLedger(): void {
  events.length = 0;
}

/**
 * Summarize current state: count of currently-mounted instances per name.
 * Useful for the panel header and for assertions like "exactly 1 instance
 * of QuestionsLayout across the session."
 */
export function summarizeLedger(): {
  totalEvents: number;
  liveByName: Record<string, number>;
  mountsByName: Record<string, number>;
  destroysByName: Record<string, number>;
} {
  const liveByName: Record<string, number> = {};
  const mountsByName: Record<string, number> = {};
  const destroysByName: Record<string, number> = {};
  for (const e of events) {
    if (e.event === 'mount') {
      liveByName[e.name] = (liveByName[e.name] ?? 0) + 1;
      mountsByName[e.name] = (mountsByName[e.name] ?? 0) + 1;
    } else {
      liveByName[e.name] = (liveByName[e.name] ?? 0) - 1;
      destroysByName[e.name] = (destroysByName[e.name] ?? 0) + 1;
    }
  }
  return { totalEvents: events.length, liveByName, mountsByName, destroysByName };
}
