#!/usr/bin/env node

/**
 * CHECK THAT THE BUILT SERVER EXITS BY ITSELF AFTER ITS DRAIN.
 *
 * adapter-node never calls `process.exit`. On SIGTERM it stops listening, lets the requests in flight finish, closes
 * every connection at `SHUTDOWN_TIMEOUT` at the latest, and then relies on the event loop running empty. Anything that
 * keeps the loop alive, such as a timer without `unref()`, turns every stop of a container into a kill at the
 * orchestrator's stop timeout. This check starts `apps/frontend/build/index.js` and observes the exit.
 *
 * Three legs, each on a fresh server listening on 127.0.0.1 with a free port and `SHUTDOWN_TIMEOUT=3`:
 *
 *   idle      SIGTERM with nothing in flight; the process must exit 0 within 2 s.
 *   in-flight `GET /` is started and SIGTERM follows 300 ms later. The request must receive a complete response (any
 *             status, never a reset) that took at least the stub's delay, and the process must then exit 0 within
 *             `SHUTDOWN_TIMEOUT` plus 2 s. A response faster than the delay means the request was not in flight at the
 *             signal, and the leg could not run.
 *   control   the server starts with a module that keeps an interval alive, loaded through `NODE_OPTIONS=--import`. It
 *             must still be running `SHUTDOWN_TIMEOUT` plus 2 s after SIGTERM, which shows that the check sees a held
 *             loop. It is then killed.
 *
 * `PUBLIC_SUPABASE_URL` points at a stub on a loopback port that answers every request with `[]` and the
 * `access-control-allow-origin: *` PostgREST sends; SvelteKit's server-side fetch refuses a cross-origin response
 * without it. The in-flight leg arms the stub to hold its next request for 1500 ms, so the server-rendered page waits
 * on it. Only that one request is held: the page's loads call the stub in sequence, and holding each would keep the
 * request open past `SHUTDOWN_TIMEOUT`. The server gets an environment built from nothing but `PATH`, `HOME` and the
 * variables it needs; no value of the caller's environment reaches it.
 *
 * `SHUTDOWN_CHECK_KEEPALIVE_ALL=1` loads the keep-alive module into the idle and in-flight legs as well. It exists only
 * to show the check red: with it, both legs fail.
 *
 * Every child is killed on every way out.
 *
 * Usage:
 *   node scripts/check-shutdown-exit.mjs        # or: yarn check:shutdown-exit, after the frontend build
 *
 * Output: one `name=value` line per measurement, then `shutdown_check=pass` or `shutdown_check=fail`.
 *
 * Exit codes:
 *   0 - every leg passed
 *   1 - a leg failed; each failing leg is named on standard error
 *   2 - the check could not run: no build, a server that did not become healthy, or a request that was not in flight
 */

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = join(REPO_ROOT, 'apps/frontend/build/index.js');
const LOOPBACK = '127.0.0.1';
const SHUTDOWN_TIMEOUT_SECONDS = 3;
const MARGIN_MS = 2000;
const IDLE_BOUND_MS = 2000;
const STUB_DELAY_MS = 1500;
const SIGNAL_AFTER_MS = 300;
const HEALTH_DEADLINE_MS = 30_000;
const KEEPALIVE_ALL = process.env.SHUTDOWN_CHECK_KEEPALIVE_ALL === '1';

/** Raised when a leg cannot produce a verdict; the check then exits 2. */
class CouldNotRun extends Error {}

/** @type {Set<import('node:child_process').ChildProcess>} */
const children = new Set();
/** @type {Array<() => void>} */
const cleanups = [];

function killChildren() {
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
  }
  children.clear();
}

function cleanUp() {
  killChildren();
  for (const cleanup of cleanups.splice(0)) cleanup();
}

process.on('exit', cleanUp);
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => {
    cleanUp();
    process.exit(2);
  });
}

/** @param {string} line */
function report(line) {
  process.stdout.write(`${line}\n`);
}

/** @returns {Promise<number>} a port that was free on the loopback a moment ago */
function freePort() {
  return new Promise((resolvePort, reject) => {
    const probe = net.createServer();
    probe.once('error', reject);
    probe.listen(0, LOOPBACK, () => {
      const { port } = /** @type {import('node:net').AddressInfo} */ (probe.address());
      probe.close(() => resolvePort(port));
    });
  });
}

/** @returns {Promise<{ url: string, requests: () => number, holdNext: () => void }>} the stub standing in for Supabase */
async function startStub() {
  let requests = 0;
  let hold = false;
  const stub = http.createServer((request, response) => {
    requests++;
    request.resume();
    const delay = hold ? STUB_DELAY_MS : 0;
    hold = false;
    const timer = setTimeout(() => {
      response.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
      response.end('[]');
    }, delay);
    response.on('close', () => clearTimeout(timer));
  });
  await new Promise((resolveListen, reject) => {
    stub.once('error', reject);
    stub.listen(0, LOOPBACK, resolveListen);
  });
  cleanups.push(() => {
    stub.closeAllConnections();
    stub.close();
  });
  const { port } = /** @type {import('node:net').AddressInfo} */ (stub.address());
  return {
    url: `http://${LOOPBACK}:${port}`,
    requests: () => requests,
    holdNext: () => {
      hold = true;
    }
  };
}

/** @returns {string} the URL of a one-line module that keeps the event loop alive */
function writeKeepAliveModule() {
  const directory = mkdtempSync(join(tmpdir(), 'check-shutdown-exit-'));
  cleanups.push(() => rmSync(directory, { recursive: true, force: true }));
  const file = join(directory, 'keep-alive.mjs');
  writeFileSync(file, 'setInterval(() => {}, 1000);\n');
  return pathToFileURL(file).href;
}

/**
 * @param {{ stubUrl: string, keepAliveUrl?: string }} options
 * @returns {Promise<{ child: import('node:child_process').ChildProcess, port: number, output: () => string }>}
 */
async function startServer({ stubUrl, keepAliveUrl }) {
  const port = await freePort();
  /** @type {Record<string, string>} */
  const env = {
    PATH: process.env.PATH ?? '',
    HOME: process.env.HOME ?? '',
    HOST: LOOPBACK,
    PORT: String(port),
    ORIGIN: `http://${LOOPBACK}:${port}`,
    PUBLIC_SUPABASE_URL: stubUrl,
    PUBLIC_SUPABASE_ANON_KEY: 'shutdown-check',
    PUBLIC_PROJECT_ID: '00000000-0000-0000-0000-000000000001',
    SHUTDOWN_TIMEOUT: String(SHUTDOWN_TIMEOUT_SECONDS)
  };
  if (keepAliveUrl) env.NODE_OPTIONS = `--import=${keepAliveUrl}`;
  const child = spawn(process.execPath, [BUILD], { cwd: REPO_ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });
  children.add(child);
  let output = '';
  child.stdout.on('data', (chunk) => (output += chunk));
  child.stderr.on('data', (chunk) => (output += chunk));
  await waitHealthy(child, port, () => output);
  return { child, port, output: () => output };
}

/**
 * @param {string} url
 * @returns {Promise<{ status: number, ms: number }>} a complete response; rejects on a reset or a timeout
 */
function get(url, timeoutMs) {
  return new Promise((resolveGet, reject) => {
    const started = Date.now();
    const request = http.get(url, { agent: false, timeout: timeoutMs }, (response) => {
      response.resume();
      response.once('error', reject);
      response.once('aborted', () => reject(new Error('response aborted')));
      response.once('end', () => {
        if (response.complete) resolveGet({ status: response.statusCode ?? 0, ms: Date.now() - started });
        else reject(new Error('response incomplete'));
      });
    });
    request.once('timeout', () => request.destroy(new Error(`no response within ${timeoutMs} ms`)));
    request.once('error', reject);
  });
}

/**
 * @param {import('node:child_process').ChildProcess} child
 * @param {number} port
 * @param {() => string} output
 */
async function waitHealthy(child, port, output) {
  const deadline = Date.now() + HEALTH_DEADLINE_MS;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new CouldNotRun(
        `the server exited (${child.exitCode ?? child.signalCode}) before it was healthy:\n${output()}`
      );
    }
    try {
      const { status } = await get(`http://${LOOPBACK}:${port}/api/health`, 2000);
      if (status === 200) return;
    } catch {
      // Not listening yet.
    }
    await sleep(200);
  }
  throw new CouldNotRun(`/api/health did not answer 200 within ${HEALTH_DEADLINE_MS / 1000} s:\n${output()}`);
}

/** @param {number} ms */
function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

/**
 * @param {import('node:child_process').ChildProcess} child
 * @param {number} withinMs counted from `since`
 * @param {number} since the moment the seconds are counted from, normally the signal
 * @returns {Promise<{ exit: number | string, seconds: number } | null>} the exit, or null when the process is still running
 */
function waitExit(child, withinMs, since = Date.now()) {
  return new Promise((resolveExit) => {
    /** @type {NodeJS.Timeout | undefined} */
    let timer;
    function done() {
      clearTimeout(timer);
      resolveExit({ exit: child.exitCode ?? child.signalCode ?? 'unknown', seconds: (Date.now() - since) / 1000 });
    }
    if (child.exitCode !== null || child.signalCode !== null) return done();
    timer = setTimeout(
      () => {
        child.off('exit', done);
        resolveExit(null);
      },
      Math.max(0, since + withinMs - Date.now())
    );
    child.once('exit', done);
  });
}

/** @param {import('node:child_process').ChildProcess} child */
async function stop(child) {
  if (child.exitCode === null && child.signalCode === null) {
    child.kill('SIGKILL');
    await waitExit(child, 5000);
  }
  children.delete(child);
}

/** @param {number} seconds */
function formatSeconds(seconds) {
  return seconds.toFixed(2);
}

/**
 * @param {{ stubUrl: string, keepAliveUrl: string }} context
 * @returns {Promise<string | null>} the failure, or null on a pass
 */
async function idleLeg({ stubUrl, keepAliveUrl }) {
  const { child } = await startServer({ stubUrl, keepAliveUrl: KEEPALIVE_ALL ? keepAliveUrl : undefined });
  child.kill('SIGTERM');
  const exited = await waitExit(child, IDLE_BOUND_MS);
  await stop(child);
  report(`shutdown_idle_exit=${exited ? exited.exit : 'running'}`);
  report(`shutdown_idle_seconds=${exited ? formatSeconds(exited.seconds) : `>${IDLE_BOUND_MS / 1000}`}`);
  if (!exited) return `idle: still running ${IDLE_BOUND_MS / 1000} s after SIGTERM`;
  if (exited.exit !== 0) return `idle: exited ${exited.exit}, not 0`;
  return null;
}

/**
 * @param {{ stubUrl: string, keepAliveUrl: string, stubRequests: () => number, holdNextStubRequest: () => void }} context
 * @returns {Promise<string | null>} the failure, or null on a pass
 */
async function inFlightLeg({ stubUrl, keepAliveUrl, stubRequests, holdNextStubRequest }) {
  const { child, port } = await startServer({ stubUrl, keepAliveUrl: KEEPALIVE_ALL ? keepAliveUrl : undefined });
  const boundMs = SHUTDOWN_TIMEOUT_SECONDS * 1000 + MARGIN_MS;
  const requestsBefore = stubRequests();
  holdNextStubRequest();
  const response = get(`http://${LOOPBACK}:${port}/`, boundMs + SIGNAL_AFTER_MS).then(
    (value) => ({ ok: /** @type {const} */ (true), ...value }),
    (error) => ({ ok: /** @type {const} */ (false), error: /** @type {Error} */ (error) })
  );
  await sleep(SIGNAL_AFTER_MS);
  child.kill('SIGTERM');
  const signalledAt = Date.now();
  const result = await response;
  const exited = await waitExit(child, boundMs, signalledAt);
  await stop(child);
  report(`shutdown_inflight_status=${result.ok ? result.status : `error: ${result.error.message}`}`);
  report(`shutdown_inflight_ms=${result.ok ? result.ms : 'none'}`);
  report(`shutdown_inflight_exit=${exited ? exited.exit : 'running'}`);
  report(`shutdown_inflight_seconds=${exited ? formatSeconds(exited.seconds) : `>${boundMs / 1000}`}`);
  process.stderr.write(
    `check-shutdown-exit: the in-flight request reached the stub ${stubRequests() - requestsBefore} time(s)\n`
  );
  if (!result.ok) return `in-flight: the request got no complete response (${result.error.message})`;
  if (result.ms < STUB_DELAY_MS) {
    throw new CouldNotRun(
      `the request took ${result.ms} ms, under the stub's ${STUB_DELAY_MS} ms, so it was not in flight at the signal`
    );
  }
  if (!exited) return `in-flight: still running ${boundMs / 1000} s after SIGTERM`;
  if (exited.exit !== 0) return `in-flight: exited ${exited.exit}, not 0`;
  return null;
}

/**
 * @param {{ stubUrl: string, keepAliveUrl: string }} context
 * @returns {Promise<string | null>} the failure, or null on a pass
 */
async function controlLeg({ stubUrl, keepAliveUrl }) {
  const { child } = await startServer({ stubUrl, keepAliveUrl });
  const boundMs = SHUTDOWN_TIMEOUT_SECONDS * 1000 + MARGIN_MS;
  child.kill('SIGTERM');
  const exited = await waitExit(child, boundMs);
  await stop(child);
  if (exited) {
    report(`shutdown_control_exited_after_seconds=${formatSeconds(exited.seconds)}`);
    return `control: a server holding an interval exited ${exited.exit} after SIGTERM, so the check cannot see a held loop`;
  }
  report(`shutdown_control_alive_after_seconds=${boundMs / 1000}`);
  return null;
}

async function main() {
  if (!existsSync(BUILD)) {
    process.stderr.write(
      `check-shutdown-exit: ${BUILD} does not exist; run yarn workspace @openvaa/frontend build first\n`
    );
    return 2;
  }
  const stub = await startStub();
  const context = {
    stubUrl: stub.url,
    keepAliveUrl: writeKeepAliveModule(),
    stubRequests: stub.requests,
    holdNextStubRequest: stub.holdNext
  };
  const failures = [];
  for (const leg of [idleLeg, inFlightLeg, controlLeg]) {
    const failure = await leg(context);
    if (failure) failures.push(failure);
  }
  for (const failure of failures) process.stderr.write(`check-shutdown-exit: FAIL ${failure}\n`);
  report(`shutdown_check=${failures.length === 0 ? 'pass' : 'fail'}`);
  return failures.length === 0 ? 0 : 1;
}

let status;
try {
  status = await main();
} catch (error) {
  const message = error instanceof CouldNotRun ? error.message : /** @type {Error} */ (error).stack;
  process.stderr.write(`check-shutdown-exit: could not run: ${message}\n`);
  status = 2;
}
cleanUp();
process.exit(status);
