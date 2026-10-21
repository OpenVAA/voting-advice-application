/**
 * @file relayProxy fixture.
 *
 * A recording HTTP forward proxy for one browser context, which sees the usage-event batches a page sends while it is being left, and the relay's answer to each.
 *
 * ## Why a proxy
 *
 * A batch the application sends at page hide (the tab becoming hidden, or the document being left) is a `keepalive` request that outlives its document. Chromium hands such a request to the browser process, and Playwright reports it neither as a context `request` event nor to a `context.route` handler, and a raw CDP session on the page does not see it either; the relay receives it all the same. `createRelayCapture` therefore never sees a page-hide batch. A proxy sits on the network path the browser process uses, so it sees that batch and the status the relay answers it with.
 *
 * ## Arming
 *
 * Start the proxy, then create the context with `proxy: { server: proxy.server }` and navigate. Playwright proxies loopback hosts too, so a dev server on `localhost` is reached through it. Close the proxy after the context.
 *
 * ## What it does
 *
 * Every plain HTTP request is forwarded to its target unchanged and the answer is passed back unchanged; a `CONNECT` request (a WebSocket, such as the dev server's live reload) is tunnelled. Only a `POST` to `RELAY_PATH` is recorded: its body, and the status the relay answered with. The proxy never stubs, blocks, delays or answers a request itself, except with 502 when the target cannot be reached.
 *
 * ## Surface
 *  - `server`         — the proxy's URL, for the context's `proxy.server`.
 *  - `getExchanges()` — each relay request in the order its answer arrived: the body and the status, or the error that stopped it.
 *  - `close()`        — stop listening and end every open connection.
 *
 * **Rigidity contract**: every assertion is hard — no soft assertion, no `try/catch` wrapping `expect(...)`, no `.catch(() => null)` on assertion-bearing interactions.
 * This fixture performs no assertions itself (it is a capture seam) — the consuming spec asserts against what it returns.
 */

import http from 'node:http';
import net from 'node:net';
import { RELAY_PATH } from '../../../../apps/frontend/src/lib/analytics/constants';
import type { AddressInfo, Socket } from 'node:net';

/** One relay request the proxy forwarded, with the relay's answer. */
export interface ProxiedRelayExchange {
  /** The request body as sent. */
  body: string;
  /** The status the relay answered with, or a text saying why no answer came. */
  status: number | string;
}

export interface RelayRecordingProxy {
  /** The proxy's URL, for the browser context's `proxy.server`. */
  readonly server: string;
  /** The relay requests forwarded so far, in the order their answers arrived. */
  getExchanges(): Array<ProxiedRelayExchange>;
  /** Stop listening and end every open connection. */
  close(): Promise<void>;
}

/** Headers that belong to the hop between the browser and the proxy, not to the request. */
const HOP_HEADERS = new Set(['proxy-connection', 'proxy-authorization', 'keep-alive']);

/** The request's headers without the proxy hop's own. */
function forwardedHeaders(headers: http.IncomingHttpHeaders): http.OutgoingHttpHeaders {
  return Object.fromEntries(Object.entries(headers).filter(([name]) => !HOP_HEADERS.has(name.toLowerCase())));
}

/** A URL's host name as a socket accepts it: an IPv6 literal loses its brackets. */
function socketHost(hostname: string): string {
  return hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname;
}

/**
 * Start a recording proxy on a free loopback port.
 * @returns The proxy, listening.
 */
export async function startRelayRecordingProxy(): Promise<RelayRecordingProxy> {
  const exchanges: Array<ProxiedRelayExchange> = [];
  const tunnels = new Set<Socket>();

  const proxy = http.createServer((request, response) => {
    let target: URL;
    try {
      target = new URL(request.url ?? '');
    } catch {
      response.writeHead(400).end();
      return;
    }
    const isRelay = request.method === 'POST' && target.pathname === RELAY_PATH;
    const chunks: Array<Buffer> = [];
    request.on('data', (chunk: Buffer) => chunks.push(chunk));
    request.on('end', () => {
      const body = Buffer.concat(chunks);
      const upstream = http.request(
        {
          host: socketHost(target.hostname),
          port: target.port || 80,
          method: request.method,
          path: `${target.pathname}${target.search}`,
          headers: forwardedHeaders(request.headers)
        },
        (upstreamResponse) => {
          if (isRelay) exchanges.push({ body: body.toString('utf8'), status: upstreamResponse.statusCode ?? 0 });
          response.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.headers);
          upstreamResponse.pipe(response);
        }
      );
      upstream.on('error', (error) => {
        if (isRelay) exchanges.push({ body: body.toString('utf8'), status: `no answer: ${error.message}` });
        if (!response.headersSent) response.writeHead(502);
        response.end();
      });
      upstream.end(body);
    });
  });

  // A WebSocket, and any other tunnelled connection, asks for a raw tunnel to its host.
  proxy.on('connect', (request: http.IncomingMessage, client: Socket, head: Buffer) => {
    const separator = (request.url ?? '').lastIndexOf(':');
    const host = socketHost((request.url ?? '').slice(0, separator));
    const port = Number((request.url ?? '').slice(separator + 1));
    const upstream = net.connect(port, host, () => {
      client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      if (head.length > 0) upstream.write(head);
      upstream.pipe(client);
      client.pipe(upstream);
    });
    tunnels.add(client).add(upstream);
    const end = (): void => {
      client.destroy();
      upstream.destroy();
      tunnels.delete(client);
      tunnels.delete(upstream);
    };
    client.on('error', end).on('close', end);
    upstream.on('error', end).on('close', end);
  });

  await new Promise<void>((resolve) => proxy.listen(0, '127.0.0.1', resolve));
  const { port } = proxy.address() as AddressInfo;

  return {
    server: `http://127.0.0.1:${port}`,
    getExchanges: () => [...exchanges],
    close: () =>
      new Promise<void>((resolve) => {
        for (const socket of tunnels) socket.destroy();
        proxy.closeAllConnections();
        proxy.close(() => resolve());
      })
  };
}
