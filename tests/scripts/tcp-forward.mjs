#!/usr/bin/env node

/**
 * tcp-forward.mjs -- A dependency-free, dual-stack TCP relay that makes the HOST's dev server and local Supabase reachable from inside the Playwright container under the name `localhost`, on the same port numbers.
 *
 * Why this exists at all. Both of the suite's endpoint literals hardcode `localhost`: `tests/playwright.config.ts` derives `baseURL` as `http://localhost:${FRONTEND_PORT}`, and `tests/tests/utils/supabaseAdminClient.ts` defaults `SUPABASE_URL` to `http://localhost:54321`. The candidate `storageState` cookie is minted for the origin `localhost:<port>`. So the container must see the host's services on its OWN loopback, under that name, byte-identically to the host -- and `--network host` is not a reliable answer on macOS Docker Desktop, where it maps to the Linux VM rather than to the macOS host.
 *
 * Why not socat. `socat` is NOT installed in `mcr.microsoft.com/playwright:v1.58.2-noble` (measured: `command -v socat` returns nothing in the pinned image, while `curl`, `npx` and `node` are all present). The earlier prose recipe's forwarding step therefore cannot run as written. Installing socat via `apt-get` is kept as a documented fallback, but it must NEVER be baked into a derived image: a mutated image changes the digest, and same-image/same-digest comparability is the entire reason the original injection is reused rather than rebuilt.
 *
 * Usage:
 *   node tests/scripts/tcp-forward.mjs <listenPort>:<upstreamHost>:<upstreamPort> [...]
 *
 *   # The invocation `tests/scripts/visual-container.sh` issues inside the container:
 *   node tests/scripts/tcp-forward.mjs \
 *     "5173:host.docker.internal:5173" \ "54321:host.docker.internal:54321" \ "54324:host.docker.internal:54324"
 *
 * Handshake -- the caller waits on stdout rather than sleeping:
 *   tcp-forward.mjs: READY <listenPort> -> <upstreamHost>:<upstreamPort>   (one per listener)
 *   tcp-forward.mjs: ALL READY <n>                                        (once, after all of them)
 *
 * Shutdown: SIGTERM or SIGINT closes every listener and exits 0. A forwarder killed by the wrapper at end of run must not turn a green Playwright run into a non-zero script exit.
 *
 * Exit codes -- the caller must be able to branch on the status alone:
 *   0 - clean shutdown (SIGTERM/SIGINT received, every listener closed) 2 - usage error (no arguments, or an argument that is not <listenPort>:<host>:<port>) 5 - a listener failed to bind
 *
 * These three numbers are shared with `tests/scripts/visual-container.sh`'s exit-code table and must stay in agreement with it.
 *
 * ## Why the upstream dial retries
 *
 * On this host (macOS 26.5.1, arm64, Docker Desktop 29.7.2) a container's OUTBOUND path to `host.docker.internal` intermittently DROPS the TCP SYN. Nothing is broken, nothing is refused -- the connection simply waits out Linux's exponential SYN-retransmission backoff before it establishes. It is NOT an artefact of the suite's `--platform linux/amd64` emulation: a NATIVE arm64 container running the same probe concurrently stalls too, so do not "fix" this by changing the pinned image. Measured, with `dns` and `firstByte` both under 6 ms on every single one of them, the `connect` leg alone lands in unmistakable backoff buckets:
 *
 *     1.0 s x6   2.0 s x4   4.1 s x2   5.1 s x3   ~35.8 s x24   ~68.2 s x3
 *
 * i.e. 42 stalled connects in 3 289 (1.28 %), of which 27 (0.82 %) were >= 35 s. Those are the 1, 1+2, 1+2+4+8+16 and 1+2+4+8+16+32 second SYN-retry sums. The upstream server is blameless: once the SYN finally lands it answers in about a millisecond.
 *
 * A suite run opens hundreds of fresh connections, so at 0.8 % a >= 35 s stall per run is the expectation, not the exception. When one lands on a request the app under test is BLOCKED on -- a SvelteKit route-node module, or the hydration entry `app.js` -- the page cannot advance and the run fails somewhere far away from the cause.
 *
 * The relay owns the connection, so the relay is where this is fixed: give the dial a short deadline and, when it expires, throw the socket away and re-dial. A fresh SYN from a fresh ephemeral port almost always lands immediately, which turns a 36-68 s stall into a hiccup of `TCP_FORWARD_CONNECT_TIMEOUT_MS`.
 *
 * SAFETY -- why a retry cannot duplicate a request. The relay does NOT pipe the downstream socket into the upstream until the upstream has CONNECTED, so at the moment a dial is abandoned exactly zero application bytes have crossed it. A re-dial therefore cannot replay a non-idempotent HTTP request; it can only establish the connection the client is still waiting to use. Node sockets are paused until piped, and the client's bytes sit in the kernel receive buffer until then, so nothing is lost either.
 *
 * This is NOT a raised timeout. It shortens the time spent waiting on a connection that is not coming, and it is bounded: after `TCP_FORWARD_CONNECT_ATTEMPTS` dials the relay gives up and destroys the downstream, which surfaces as a connection error the caller can see rather than as a silent multi-minute hang.
 */

import net from 'node:net';
import process from 'node:process';

const SELF = 'tcp-forward.mjs';

/**
 * Per-dial deadline. Deliberately well ABOVE a healthy dial and well BELOW the first painful backoff bucket, so a healthy connection is never interrupted and a dropped SYN is abandoned long before Linux's 1 s -> 2 s -> 4 s ladder becomes expensive.
 *
 * Margin, measured on this path: 3 000 container dials through this relay under no load gave p50 2.9 ms, p99 61 ms, max 123 ms. 1 000 ms is therefore roughly 8x the worst healthy dial ever observed, which is the headroom that keeps this from firing on a merely busy host.
 */
const CONNECT_TIMEOUT_MS = Number(process.env.TCP_FORWARD_CONNECT_TIMEOUT_MS ?? 1000);

/**
 * Bounded number of dials per downstream connection, the first one included.
 *
 * The bound is chosen against the budget it must not blow: `TIMEOUTS.slowPage` is 10 000 ms and is the shortest wait in the suite that a stalled asset can expire. 8 x 1 000 ms = 8 s worst case, which stays under it.
 *
 * The depth is chosen against the measured ladder. Across 82 dropped-SYN events observed under suite load after this fix landed, the connection was established on dial 2 in 66 cases, dial 3 in 11, dial 4 in 4 and dial 5 in 1 -- so drops do come in short bursts and a single retry would NOT have been enough. 8 leaves three dials of headroom over the deepest ladder ever seen, and no connection has yet been given up on.
 */
const CONNECT_ATTEMPTS = Number(process.env.TCP_FORWARD_CONNECT_ATTEMPTS ?? 8);

/** Counters reported on shutdown so a run's `forwarder.log` carries the evidence. */
let totalConnections = 0;
let retriedDials = 0;
let exhaustedConnections = 0;

// Every stdout line below uses `console.info`, not `console.log`. In Node the two are the same stream (stdout), so the READY/ALL READY handshake the shell greps for is unaffected -- but this repo's shared eslint config allows only `warn`/`error`/`info` under `no-console`, and `yarn lint:check` covers `tests/`. Do not "simplify" these back to `console.log`: it reddens the lint gate without changing behaviour.

function usage() {
  return [
    `${SELF} -- relay container-local TCP ports to a host upstream.`,
    '',
    'Usage:',
    `  node tests/scripts/${SELF} <listenPort>:<upstreamHost>:<upstreamPort> [...]`,
    '',
    'Each positional argument is one forwarded port, written as the triple',
    '<listenPort>:<upstreamHost>:<upstreamPort>. At least one is required.',
    '',
    'Example:',
    `  node tests/scripts/${SELF} 5173:host.docker.internal:5173 54321:host.docker.internal:54321`,
    '',
    'Exit codes: 0 clean shutdown - 2 usage error - 5 a listener failed to bind.'
  ].join('\n');
}

function fail(message, code) {
  console.error(`${SELF}: FATAL -- ${message}`);
  process.exit(code);
}

/**
 * Parse one `<listenPort>:<upstreamHost>:<upstreamPort>` triple. The host sits in the middle so a bare IPv6 literal would be ambiguous; upstreams here are always a DNS name (`host.docker.internal`) or a v4 literal, which is all the container needs.
 */
function parseTriple(arg) {
  const parts = arg.split(':');
  if (parts.length !== 3) return null;
  const [listenPort, upstreamHost, upstreamPort] = parts;
  if (!/^\d+$/.test(listenPort) || !/^\d+$/.test(upstreamPort) || upstreamHost.length === 0) return null;
  const listen = Number(listenPort);
  const upstream = Number(upstreamPort);
  if (listen < 1 || listen > 65535 || upstream < 1 || upstream > 65535) return null;
  return { listenPort: listen, upstreamHost, upstreamPort: upstream };
}

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error(`${SELF}: at least one <listenPort>:<upstreamHost>:<upstreamPort> argument is required`);
  console.error(usage());
  process.exit(2);
}

if (args.includes('-h') || args.includes('--help')) {
  console.info(usage());
  process.exit(0);
}

const routes = [];
for (const arg of args) {
  const route = parseTriple(arg);
  if (!route) {
    console.error(`${SELF}: unparsable argument '${arg}' -- expected <listenPort>:<upstreamHost>:<upstreamPort>`);
    console.error(usage());
    process.exit(2);
  }
  routes.push(route);
}

const servers = [];
let readyCount = 0;

for (const { listenPort, upstreamHost, upstreamPort } of routes) {
  // One flag per listener: only the FIRST upstream connect failure is reported, with a named cause. A generic per-connection timeout here is the exact symptom that gets misread as a Playwright failure.
  let upstreamFailureReported = false;

  const server = net.createServer((downstream) => {
    // A per-connection error must never take the process down: the relay outlives every socket that crosses it, and a half-open connection must not leak either, so each side destroys its peer on both `close` and `error`.
    downstream.on('error', () => downstream.destroy());

    totalConnections += 1;

    /** Set once an upstream dial has CONNECTED and the two sockets have been piped. */
    let relaying = false;
    /** Set once the downstream has gone away, so an in-flight dial must be abandoned. */
    let abandoned = false;
    /** The dial currently in flight; destroyed if the downstream closes under it. */
    let pending = null;
    /** Timer for a scheduled re-dial, cleared if the downstream closes before it fires. */
    let retryTimer = null;
    let attempt = 0;

    downstream.on('close', () => {
      abandoned = true;
      pending?.destroy();
      if (retryTimer) clearTimeout(retryTimer);
    });

    function reportTerminalFailure(reason) {
      if (upstreamFailureReported) return;
      upstreamFailureReported = true;
      console.error(
        `${SELF}: upstream connect to ${upstreamHost}:${upstreamPort} failed (${reason}) ` +
          `while relaying port ${listenPort}.`
      );
      console.error(
        `${SELF}: the most likely cause is that the HOST service is bound to loopback only. ` +
          'Vite declares no `host`, so it binds 127.0.0.1 unless started as ' +
          '`yarn workspace @openvaa/frontend dev --host 0.0.0.0` -- note that ' +
          '`yarn dev --host 0.0.0.0` does NOT forward the flag to vite (research N-10).'
      );
    }

    // One dial. Abandoned and retried on deadline expiry (the dropped-SYN case documented in the module header); retried on a transient error too, since a connection that was never established has, by construction, carried no application bytes.
    function dial() {
      if (abandoned) return;
      attempt += 1;
      const dialStartedAt = Date.now();
      const upstream = net.connect({ host: upstreamHost, port: upstreamPort });
      pending = upstream;

      /**
       * Give up, or schedule the next dial.
       *
       * The next dial is scheduled at the END of this dial's deadline window, never sooner.
       * That matters for the FAST-FAILURE case: an upstream that REFUSES instantly -- a loopback RST, or the host service briefly down between restarts -- returns ECONNREFUSED in microseconds, so an immediate re-dial would burn the whole attempt ladder before the upstream had any chance to come back, making `attempts x timeout` a bound in name only. Pacing every attempt to a full window makes the ladder mean the same thing whether a dial died on the clock or on a reset.
       */
      function giveUpOrRetry(reason, detail) {
        if (relaying || abandoned) return;
        upstream.destroy();
        if (attempt >= CONNECT_ATTEMPTS) {
          exhaustedConnections += 1;
          reportTerminalFailure(reason);
          downstream.destroy();
          return;
        }
        retriedDials += 1;
        console.error(
          `${SELF}: dial ${attempt}/${CONNECT_ATTEMPTS} to ${upstreamHost}:${upstreamPort} ` +
            `(port ${listenPort}) ${detail} -- re-dialling. ` +
            'No bytes have crossed this dial, so the retry cannot replay a request.'
        );
        retryTimer = setTimeout(
          () => {
            retryTimer = null;
            dial();
          },
          Math.max(0, CONNECT_TIMEOUT_MS - (Date.now() - dialStartedAt))
        );
      }

      // NOT `socket.setTimeout`: that is an IDLE timer that would keep firing for the whole life of an established relay. This one is armed for the dial only and cleared the moment the connection is up or fails.
      const deadline = setTimeout(() => {
        giveUpOrRetry(
          `no connection after ${CONNECT_ATTEMPTS} dials of ${CONNECT_TIMEOUT_MS} ms`,
          `did not connect within ${CONNECT_TIMEOUT_MS} ms (presumed dropped SYN on the container egress path)`
        );
      }, CONNECT_TIMEOUT_MS);

      upstream.once('connect', () => {
        clearTimeout(deadline);
        if (abandoned) {
          upstream.destroy();
          return;
        }
        relaying = true;
        pending = null;
        // Peer teardown, installed only now: before this point `downstream.on('close')` above owns the abandoned dial, and an abandoned dial must NOT take the downstream with it.
        upstream.on('close', () => downstream.destroy());
        downstream.on('close', () => upstream.destroy());
        // Piping only AFTER connect is what makes the retry above safe -- see the module header's SAFETY note. Do not hoist these two lines.
        downstream.pipe(upstream);
        upstream.pipe(downstream);
      });

      upstream.on('error', (err) => {
        clearTimeout(deadline);
        if (relaying) {
          // The relay was live; this is an ordinary mid-connection reset, not a dial failure.
          upstream.destroy();
          downstream.destroy();
          return;
        }
        giveUpOrRetry(err.code ?? err.message, `failed with ${err.code ?? err.message}`);
      });
    }

    dial();
  });

  server.on('error', (err) => {
    fail(`could not bind port ${listenPort}: ${err.code ?? err.message}`, 5);
  });

  server.on('listening', () => {
    console.info(`${SELF}: READY ${listenPort} -> ${upstreamHost}:${upstreamPort}`);
    readyCount += 1;
    if (readyCount === routes.length) {
      console.info(`${SELF}: ALL READY ${routes.length}`);
    }
  });

  // NO host argument, deliberately. `server.listen(port)` binds `::` with dual-stack enabled, so a container that resolves `localhost` to `::1` only AND a container that resolves it to `127.0.0.1` both connect. That is exactly the property the earlier "dual-stack socat" setup had. Passing '0.0.0.0' or '127.0.0.1' here would bind v4 only and surface as a *connection refused* that mimics the v4-only bind bug -- a MEDIUM-risk failure mode recorded in advance.
  //
  // The unauthenticated listener is safe ONLY because of one mitigation: `tests/scripts/visual-container.sh` passes no `-p`/`--publish`/`--publish-all`/ `--network host`/`--privileged`, so every listener created here stays inside the `--rm` container's own network namespace and is unreachable from outside it. Do not publish a port to "make debugging easier" without re-reading that threat entry.
  server.listen(listenPort);
  servers.push(server);
}

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.info(`${SELF}: ${signal} received -- closing ${servers.length} listener(s)`);
  // Leave the dial statistics in the run's `forwarder.log`. A non-zero `re-dialled` count is the container-egress dropped-SYN condition documented in the module header, caught and absorbed; a non-zero `gave-up` count means it was NOT absorbed and the run's failures should be read in that light.
  console.info(`${SELF}: connections=${totalConnections} re-dialled=${retriedDials} gave-up=${exhaustedConnections}`);
  for (const server of servers) server.close();
  // `close()` waits for open connections; the relay is torn down at end of run, so exit once the listeners are shut rather than waiting on sockets the caller has abandoned.
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
