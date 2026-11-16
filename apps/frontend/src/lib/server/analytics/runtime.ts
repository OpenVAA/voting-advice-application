/**
 * The analytics runtime of this server process: the one provider and the one queue, built once from the resolved configuration, and the handler the usage endpoint calls.
 *
 * This is the only analytics module that touches the process's own output stream and the global `fetch`; the provider and the queue take them from here. With provider `none` nothing is built at all, so no timer runs and no shutdown listener is attached.
 */
import { analyticsConfig } from './env';
import { createProvider } from './providers';
import { createQueue, registerShutdownFlush } from './queue';
import { relay } from './relay';
import type { AnalyticsEvent } from '$lib/analytics/analyticsEvent.type';

/** Puts events in the queue without waiting and returns how many were kept. */
type Enqueue = (events: ReadonlyArray<AnalyticsEvent>) => number;

/**
 * Build the process's provider and queue, and attach the queue's flush to the server's shutdown.
 *
 * @returns The queue's `enqueue`, or one that keeps nothing when the provider is `none`.
 */
function createEnqueue(): Enqueue {
  if (analyticsConfig.provider === 'none') return () => 0;
  const provider = createProvider(analyticsConfig, {
    fetch: globalThis.fetch.bind(globalThis),
    write: (line) => {
      process.stdout.write(line);
    },
    randomId: () => crypto.randomUUID()
  });
  const queue = createQueue({ provider });
  registerShutdownFlush(queue);
  return queue.enqueue;
}

const enqueue = createEnqueue();

/**
 * Judge one usage request with the relay and queue what it carries.
 *
 * @param request - The incoming request; its body is read by the relay, never before.
 * @param origin - The server's own origin.
 * @returns The status the endpoint answers with.
 */
export async function handleUsageRequest(request: Request, origin: string): Promise<number> {
  return relay({ request, origin }, { config: analyticsConfig, enqueue });
}
