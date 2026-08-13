import path from 'path';

/**
 * E2E SERVED-APPLICATION PREFLIGHT — Phase 137 (INTEG-04, INTEG-05).
 *
 * Asserts that whatever is listening on the port the specs are about to drive is
 * THIS checkout's Vite dev server — not a sibling checkout, not a container, not
 * a stale server from another branch. A false green produced by a foreign server
 * is undetectable after the fact, which is why this runs before any spec body.
 *
 * The assertion is composite (D-01):
 *
 *   (a) LIVENESS — the base URL answers 2xx after following redirects. Polled,
 *       because a just-started dev server needs a few seconds. Following
 *       redirects matters: a foreign checkout was measured answering `301 -> /sv/`
 *       with an empty body, which any content check would have read as
 *       "nothing to disagree with".
 *
 *   (b) IDENTITY (load-bearing) — a GET of Vite's `/@fs` endpoint plus the
 *       ABSOLUTE on-disk path of this checkout's root layout returns exactly 200,
 *       and the transformed body echoes that same absolute path back in Vite's
 *       HMR preamble. Absolute filesystem paths cannot collide between checkouts,
 *       so only a Vite dev server whose `server.fs.allow` root is this working
 *       tree can serve it. Evaluated ONCE — never polled (see `assertServedApp`).
 *
 *   (c) TITLE SANITY — added in a later task; explicitly subordinate to (b).
 *
 * Nothing here is hardcoded to a machine: the repo root is derived by the caller
 * and every compared value is read from this checkout at runtime (D-03). CI's
 * checkout path differs from any developer's, so a baked-in absolute path would
 * fail in CI outright.
 */

/**
 * The repo-relative path of the file clause (b) probes.
 *
 * This is the ONLY path fragment in the module; the absolute path is composed at
 * runtime as `path.join(repoRoot, PROBE_RELATIVE_PATH)` (D-03).
 *
 * The path is load-bearing and was chosen by measurement, not by taste.
 * SvelteKit REPLACES Vite's default `server.fs.allow` list with six entries of
 * its own, and the repo root is NOT among them: `/@fs<root>/package.json`,
 * `/yarn.lock`, `/.git/HEAD` and `/packages/**` all return 403 from OUR OWN
 * server. `apps/frontend/src/routes` is inside the allow list because it is
 * SvelteKit's `kit.files.routes`, and `+layout.svelte` is a committed source file
 * that cannot vanish (the app has no routes without it). Substituting a "more
 * obvious" root marker would make the preflight fail against a correct checkout
 * and block every E2E run in the repo.
 */
export const PROBE_RELATIVE_PATH = 'apps/frontend/src/routes/+layout.svelte';

/** Inputs to {@link assertServedApp}. */
export type PreflightOptions = {
  /**
   * The exact base URL the specs will use, read from the Playwright config —
   * never recomputed, and never rewritten. In particular the host string must be
   * passed through verbatim: under a wildcard shadow-bind (measured on macOS with
   * a container holding `*:<port>`) `localhost` and the numeric loopback address
   * reach DIFFERENT servers, so normalising one to the other would validate a
   * server the specs never touch.
   */
  baseURL: string;
  /** Absolute path of this checkout's root, derived at runtime by the caller. */
  repoRoot: string;
  /** Ceiling for the clause (a) liveness poll. */
  deadlineMs: number;
  /** Interval between liveness attempts. Defaults to {@link DEFAULT_POLL_INTERVAL_MS}. */
  pollIntervalMs?: number;
};

/**
 * Modest enough that a locally-fast server costs ~3 polls rather than a fixed
 * quantum, small enough not to dominate the deadline.
 */
const DEFAULT_POLL_INTERVAL_MS = 500;

/**
 * First line of every failure. Fixed, because the phase's verification commands
 * and the runbook both grep for it.
 */
const FAILURE_HEADLINE = 'E2E PREFLIGHT FAILED';

/** What clause (a) observed on the attempt that finally answered 2xx. */
type Liveness = {
  status: number;
  /** `res.url` — the FINAL url after redirects, which the failure message reports. */
  finalURL: string;
  body: string;
};

/** Result of the clause (a) poll: either a live 2xx response, or why there wasn't one. */
type LivenessOutcome = { live: Liveness } | { live: null; lastStatus: number | null; lastError: string | null };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Clause (a). Polls until something answers 2xx or the deadline elapses.
 *
 * A thrown fetch (connection refused while the dev server is still booting) is a
 * failed attempt, not a crash — that race is the whole reason this polls.
 */
async function pollForLiveness(baseURL: string, deadlineMs: number, pollIntervalMs: number): Promise<LivenessOutcome> {
  const giveUpAt = Date.now() + deadlineMs;
  let lastStatus: number | null = null;
  let lastError: string | null = null;

  for (;;) {
    try {
      const res = await fetch(baseURL, { redirect: 'follow' });
      const body = await res.text();
      lastStatus = res.status;
      lastError = null;
      if (res.ok) return { live: { status: res.status, finalURL: res.url, body } };
    } catch (e) {
      lastStatus = null;
      lastError = e instanceof Error ? e.message : String(e);
    }
    if (Date.now() + pollIntervalMs >= giveUpAt) return { live: null, lastStatus, lastError };
    await sleep(pollIntervalMs);
  }
}

/** Builds the operator-facing failure block. Expanded to the full diagnostic set in a later task. */
function buildFailureMessage(args: { reason: string; port: string; baseURL: string; repoRoot: string }): string {
  return [
    `${FAILURE_HEADLINE} — the server on port ${args.port} is not this checkout's dev server.`,
    `  reason:            ${args.reason}`,
    `  expected port:     ${args.port} (${args.baseURL})`,
    `  expected checkout: ${args.repoRoot}`
  ].join('\n');
}

/**
 * Asserts that the application served at `baseURL` came from `repoRoot`.
 *
 * Resolves on success; throws an `Error` carrying the operator-facing failure
 * block on any failing clause. The caller (Playwright's global setup) lets the
 * throw propagate: that aborts the run with exit code 1 before any spec body
 * executes, which is exactly what "cannot be skipped" means here.
 */
export async function assertServedApp(options: PreflightOptions): Promise<void> {
  const { baseURL, repoRoot, deadlineMs } = options;
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;

  // Parse rather than string-slice: a malformed base URL is rejected here by the
  // URL parser instead of silently producing a nonsense port downstream.
  const port = new URL(baseURL).port;
  const probeAbsolutePath = path.join(repoRoot, PROBE_RELATIVE_PATH);
  const origin = baseURL.replace(/\/+$/, '');

  function fail(reason: string): never {
    throw new Error(buildFailureMessage({ reason, port, baseURL, repoRoot }));
  }

  // --- Clause (a): liveness, polled ------------------------------------------
  const outcome = await pollForLiveness(baseURL, deadlineMs, pollIntervalMs);
  if (!outcome.live) {
    const observed =
      outcome.lastStatus !== null
        ? `last response was HTTP ${outcome.lastStatus}`
        : `nothing accepted a connection (${outcome.lastError ?? 'no response'})`;
    fail(`nothing answered 2xx on port ${port} within ${Math.round(deadlineMs / 1000)}s — ${observed}`);
  }

  // --- Clause (b): identity, evaluated EXACTLY ONCE ---------------------------
  //
  // Never inside the poll. Clause (b) is deterministic given a live server
  // (sub-millisecond, measured), so retrying it would convert a fast, correct
  // identity failure into a full-deadline stall before the identical failure.
  const probeURL = `${origin}/@fs${probeAbsolutePath}`;
  const probe = await fetch(probeURL);
  // Strictly 200. A not-equal-to-404 comparison would be wrong: a foreign server
  // whose serving root lies elsewhere answers 403, measured.
  if (probe.status !== 200) {
    fail(
      `the listener is not this checkout's Vite dev server (GET ${probeURL} returned ${probe.status}, expected 200)`
    );
  }
  const probeBody = await probe.text();
  if (!probeBody.includes(probeAbsolutePath)) {
    // The 200 body normally echoes the absolute path back inside Vite's
    // `__vite__createHotContext("…")` preamble, which upgrades the check from "a
    // server was willing to serve this path" to "a server transformed THIS file
    // and said so". Worded so that a future Vite dropping the preamble is
    // diagnosable rather than mistaken for a foreign server.
    fail(
      `the server answered 200 for ${probeURL} but its response did not echo the probed absolute path, ` +
        'so it did not demonstrably transform the file in this working tree (a foreign server, or a ' +
        'Vite version that no longer emits the HMR preamble)'
    );
  }
}
