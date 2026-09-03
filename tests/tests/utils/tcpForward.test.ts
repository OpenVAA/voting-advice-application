import { spawn } from 'child_process';
import crypto from 'crypto';
import { createServer as createHttpServer, request as httpRequest } from 'http';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import { afterEach, describe, expect, it } from 'vitest';
import type { ChildProcess } from 'child_process';
import type { Server } from 'http';
import type { AddressInfo } from 'net';

/**
 * Regression tests for `tests/scripts/tcp-forward.mjs`'s upstream-dial contract.
 *
 * ## The defect these guard
 *
 * The relay used to dial the upstream ONCE, with no deadline, and pipe the downstream into it immediately. On this arm64 macOS host the emulated `linux/amd64` container's egress to `host.docker.internal` intermittently drops the TCP SYN, so that single dial sat through Linux's exponential SYN-retransmission backoff — measured at 35.6–36.1 s and 68.0–68.4 s, on 0.82 % of connections. Every HTTP request that needed a fresh connection at that moment stalled for the whole backoff, and when one landed on an asset the app under test was blocked on (a SvelteKit route-node module, or the hydration entry `app.js`) the E2E run failed far away from the cause.
 *
 * The fix gives each dial a deadline and re-dials on expiry, bounded by an attempt count.
 *
 * ## Oracle
 *
 * DERIVED, not implicit — every assertion below is against the relay's stated contract (documented in the module header), not merely against "it did not crash":
 *   - bytes crossing the relay are delivered EXACTLY, which is the non-regression guard on the restructure that stopped piping before `connect`;
 *   - a dial that cannot connect is retried and RECOVERS when the upstream becomes reachable — the old code destroyed the downstream on the first failure;
 *   - the retry ladder is BOUNDED, so an unreachable upstream fails in `attempts x timeout`, not in Linux's multi-minute backoff.
 *
 * These run against a real relay process and real loopback sockets rather than mocks: the defect lived in socket lifecycle ordering, which a mock would have to reimplement to express.
 *
 * They live in `tests/utils/` because that is the repo's wired-up vitest location — see the note at the top of `preflight.test.ts`. Run with:
 *
 *   yarn vitest run --config tests/vitest.config.ts
 */

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const FORWARDER = path.join(REPO_ROOT, 'tests', 'scripts', 'tcp-forward.mjs');

/**
 * Short per-dial deadline so the bounded-give-up case finishes in well under a second.
 * The production defaults (1 000 ms x 6) are reasoned about in the module header; what is under test here is the BEHAVIOUR, which must hold for any setting.
 */
const TEST_CONNECT_TIMEOUT_MS = 200;
const TEST_CONNECT_ATTEMPTS = 3;

/**
 * TEST-NET-2 (RFC 5737). Guaranteed never to be assigned to a real host, so a dial to it cannot connect and cannot be refused — it is silently dropped, which is precisely the dropped-SYN shape this fix exists for, without having to induce packet loss.
 */
const BLACKHOLE_HOST = '198.51.100.1';

const started: Array<ChildProcess> = [];
const servers: Array<Server | net.Server> = [];

afterEach(async () => {
  for (const child of started.splice(0)) child.kill('SIGKILL');
  for (const server of servers.splice(0)) await new Promise((resolve) => server.close(() => resolve(null)));
});

/** Reserve a currently-free loopback port. */
async function freePort(): Promise<number> {
  const probe = net.createServer();
  await new Promise((resolve) => probe.listen(0, '127.0.0.1', () => resolve(null)));
  const { port } = probe.address() as AddressInfo;
  await new Promise((resolve) => probe.close(() => resolve(null)));
  return port;
}

/** An echo server that returns the exact request body it was sent. */
async function startEchoUpstream(port: number): Promise<Server> {
  const server = createHttpServer((req, res) => {
    const chunks: Array<Buffer> = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
      res.end(body);
    });
  });
  await new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(null)));
  servers.push(server);
  return server;
}

/** Spawn the relay and resolve once it reports ALL READY. Collects its output for assertions. */
async function startRelay(routes: Array<string>): Promise<{ output: () => string; child: ChildProcess }> {
  const child = spawn('node', [FORWARDER, ...routes], {
    env: {
      ...process.env,
      TCP_FORWARD_CONNECT_TIMEOUT_MS: String(TEST_CONNECT_TIMEOUT_MS),
      TCP_FORWARD_CONNECT_ATTEMPTS: String(TEST_CONNECT_ATTEMPTS)
    }
  });
  started.push(child);
  let output = '';
  child.stdout?.on('data', (d) => (output += String(d)));
  child.stderr?.on('data', (d) => (output += String(d)));
  await new Promise<void>((resolve, reject) => {
    const deadline = setTimeout(() => reject(new Error(`relay never reported ALL READY; output:\n${output}`)), 10_000);
    const poll = setInterval(() => {
      if (output.includes('ALL READY')) {
        clearInterval(poll);
        clearTimeout(deadline);
        resolve();
      }
    }, 25);
  });
  return { output: () => output, child };
}

/** POST `body` through the relay on `port`, resolving the echoed bytes. */
function postThroughRelay(port: number, body: Buffer, timeoutMs = 15_000): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const req = httpRequest(
      {
        host: '127.0.0.1',
        port,
        method: 'POST',
        path: '/echo',
        agent: false,
        headers: { Connection: 'close', 'Content-Length': body.length }
      },
      (res) => {
        const chunks: Array<Buffer> = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }
    );
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error('client timeout')));
    req.end(body);
  });
}

const sha = (b: Buffer): string => crypto.createHash('sha256').update(b).digest('hex');

describe('tcp-forward.mjs — upstream dial contract (answer-surface-wait-timeout regression)', () => {
  // Boundary neighbours around the payload-size equivalence class the "pipe only after connect" restructure could have broken: the empty body, the single byte, and a payload large enough to span many TCP segments and exercise stream backpressure.
  it.each([
    { label: 'empty body (0 bytes)', size: 0 },
    { label: 'single byte', size: 1 },
    { label: 'one segment boundary', size: 1460 },
    { label: 'multi-segment payload', size: 1_000_000 }
  ])('relays $label byte-for-byte', async ({ size }) => {
    const upstreamPort = await freePort();
    const relayPort = await freePort();
    await startEchoUpstream(upstreamPort);
    await startRelay([`${relayPort}:127.0.0.1:${upstreamPort}`]);

    const body = crypto.randomBytes(size);
    const echoed = await postThroughRelay(relayPort, body);

    expect(echoed).toHaveLength(size);
    expect(sha(echoed)).toBe(sha(body));
  });

  it('re-dials and RECOVERS when the upstream is not yet accepting', async () => {
    // The old relay destroyed the downstream on the first upstream failure, so this request could never succeed. The upstream starts listening only AFTER the first dial has already failed, which is exactly the "the connection is retryable, the request is not lost" property the fix adds.
    const upstreamPort = await freePort();
    const relayPort = await freePort();
    const relay = await startRelay([`${relayPort}:127.0.0.1:${upstreamPort}`]);

    const body = Buffer.from('recovered');
    const inFlight = postThroughRelay(relayPort, body);
    await new Promise((resolve) => setTimeout(resolve, TEST_CONNECT_TIMEOUT_MS + 50));
    await startEchoUpstream(upstreamPort);

    expect(sha(await inFlight)).toBe(sha(body));
    // The recovery must have gone through the retry path, not through a lucky first dial.
    expect(relay.output()).toMatch(/re-dialling|dial \d+\/\d+/);
  });

  it('gives up on an unreachable upstream in BOUNDED time rather than hanging', async () => {
    // Without the deadline this dial sits in Linux SYN backoff for minutes — the defect.
    // With it, the ladder is attempts x timeout and then the downstream is destroyed.
    const relayPort = await freePort();
    await startRelay([`${relayPort}:${BLACKHOLE_HOST}:9`]);

    const startedAt = Date.now();
    await expect(postThroughRelay(relayPort, Buffer.from('x'), 30_000)).rejects.toThrow();
    const elapsed = Date.now() - startedAt;

    const bound = TEST_CONNECT_ATTEMPTS * TEST_CONNECT_TIMEOUT_MS;
    expect(elapsed).toBeGreaterThanOrEqual(bound - 50);
    // Generous slack for process scheduling, but far below the multi-second first backoff bucket (1 s) the unbounded dial would have reached, and orders below its 36 s one.
    expect(elapsed).toBeLessThan(bound + 2_000);
  });

  it('reports dial statistics on shutdown so a run log carries the evidence', async () => {
    const relayPort = await freePort();
    const relay = await startRelay([`${relayPort}:${BLACKHOLE_HOST}:9`]);
    await postThroughRelay(relayPort, Buffer.from('x'), 30_000).catch(() => null);

    relay.child.kill('SIGTERM');
    await new Promise((resolve) => setTimeout(resolve, 400));

    const summary = relay.output().match(/connections=(\d+) re-dialled=(\d+) gave-up=(\d+)/);
    expect(summary, `no statistics line in relay output:\n${relay.output()}`).not.toBeNull();
    expect(Number(summary?.[1])).toBeGreaterThanOrEqual(1);
    // One connection, TEST_CONNECT_ATTEMPTS dials: the last one gives up rather than re-dialling.
    expect(Number(summary?.[2])).toBe(TEST_CONNECT_ATTEMPTS - 1);
    expect(Number(summary?.[3])).toBe(1);
  });
});
