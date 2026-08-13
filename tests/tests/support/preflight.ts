import { execFileSync } from 'child_process';
import fs from 'fs';
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
 *   (c) TITLE SANITY — the served `<title>` is one of the `appName` values in
 *       this checkout's message catalogue. Explicitly subordinate to (b): a
 *       six-line adversary can serve a byte-identical title, and one was measured
 *       doing exactly that. Skipped when the document carries no title, because
 *       maintenance mode legitimately replaces it.
 *
 * Nothing here is hardcoded to a machine: the repo root is derived by the caller
 * and every compared value is read from this checkout at runtime (D-03). CI's
 * checkout path differs from any developer's, so a baked-in absolute path would
 * fail in CI outright.
 */

/**
 * The repo-relative path of the file clause (b) probes.
 *
 * Repo-relative and nothing more: the absolute path is composed at runtime as
 * `path.join(repoRoot, PROBE_RELATIVE_PATH)` (D-03).
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
 * Repo-relative location of the message catalogue clause (c) derives its accepted
 * title set from. Enumerated at runtime — the locale set grows, and hardcoding
 * either the locales or the names is exactly what D-03 forbids.
 */
const MESSAGES_RELATIVE_PATH = 'apps/frontend/messages';

/**
 * Modest enough that a locally-fast server costs ~3 polls rather than a fixed
 * quantum, small enough not to dominate the deadline.
 */
const DEFAULT_POLL_INTERVAL_MS = 500;

/** Rendered in place of the served module root when the HTML carries no reference to one. */
const MODULE_ROOT_NOT_FOUND = '(not found)';

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

/**
 * Clause (c)'s accepted title set, read from this checkout's message catalogue.
 *
 * The key is NESTED: the value lives at `.dynamic.appName`, and a top-level
 * `.appName` read returns undefined for every locale. Locales are enumerated from
 * the directory rather than listed, and a locale whose file is missing or whose
 * value is not a non-empty string is skipped rather than thrown on — a broken
 * catalogue entry must not take down a run.
 */
function readAppNames(repoRoot: string): Set<string> {
  const names = new Set<string>();
  const messagesDir = path.join(repoRoot, MESSAGES_RELATIVE_PATH);
  let locales: Array<string>;
  try {
    locales = fs.readdirSync(messagesDir);
  } catch {
    return names;
  }
  for (const locale of locales) {
    try {
      const raw = fs.readFileSync(path.join(messagesDir, locale, 'dynamic.json'), 'utf8');
      const parsed = JSON.parse(raw) as { dynamic?: { appName?: unknown } };
      const appName = parsed.dynamic === undefined ? undefined : parsed.dynamic.appName;
      if (typeof appName === 'string' && appName.trim().length > 0) names.add(appName.trim());
    } catch {
      // Missing or unparsable locale file — skip it.
    }
  }
  return names;
}

/** Extracts `<title>` from served HTML. `null` means the document has none — clause (c) then skips. */
function extractTitle(html: string): string | null {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (!match) return null;
  const title = match[1].trim();
  return title.length > 0 ? title : null;
}

/**
 * Extracts the absolute root of the checkout that actually served the HTML, from
 * the `/@fs…/.svelte-kit/…` module reference SvelteKit emits into the document.
 *
 * This is the single most diagnostic line in a failure ("the server that answered
 * is rooted at /opt/frontend"). It costs nothing — the HTML was already fetched
 * for clause (a) — and it must degrade rather than throw: a minimal adversary has
 * no `.svelte-kit` at all.
 */
function extractServedModuleRoot(html: string): string {
  const match = /\/@fs([^"']*?)\/\.svelte-kit/.exec(html);
  return match ? match[1] : MODULE_ROOT_NOT_FOUND;
}

/** What the server that answered actually looked like — reported back to the operator on failure. */
type Observed = {
  status: number | null;
  finalURL: string | null;
  title: string | null;
  servedModuleRoot: string;
};

/**
 * Best-effort identification of whatever holds the port. Returns `null` on ANY
 * error, which omits one line of decoration and nothing else.
 *
 * `execFileSync` with an argv array, never its shell-interpolating sibling: the
 * port is interpolated into an argument, and a shell-free call has no injection
 * surface even if `baseURL` were attacker-influenced. `-sTCP:LISTEN` is required
 * — without it the output also lists ESTABLISHED client sockets and becomes
 * noise. The timeout exists because `lsof` can block (a stale network mount, for
 * instance) and a hung diagnostic must never outlive the failure it decorates.
 */
function findListeningProcess(port: string): string | null {
  try {
    const output = execFileSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN'], {
      encoding: 'utf8',
      timeout: 5000
    }).trim();
    return output.length > 0 ? output : null;
  } catch {
    // No lsof on this platform, nothing listening, or the call timed out. All
    // three degrade to omitting the section — never to masking the real reason.
    return null;
  }
}

/**
 * Builds the operator-facing failure block (D-09).
 *
 * Front-loaded on purpose: Playwright appends a source code frame and a stack
 * trace immediately after this text, and the operator reads roughly the first ten
 * lines. The reason and both remedies therefore live in the message body rather
 * than in a trailing hint.
 *
 * Interpolates ONLY the extracted title, the extracted module root, the HTTP
 * status, the final URL, the port, the repo root, and the `lsof` output. Never
 * the raw response body — a hostile or merely enormous foreign response would
 * otherwise be dumped into CI logs — and never any `process.env` value.
 *
 * Localisation does not apply: this is developer-facing tooling output, not
 * application UI, so the project's localisation rule is not in scope here.
 */
function buildFailureMessage(args: {
  reason: string;
  port: string;
  baseURL: string;
  repoRoot: string;
  observed: Observed;
}): string {
  const { observed } = args;
  const observedLine = [
    observed.status === null ? 'no response' : `HTTP ${observed.status}`,
    ` -> ${observed.finalURL ?? args.baseURL}`,
    `; <title>${observed.title ?? '(none)'}</title>`,
    `; served module root: ${observed.servedModuleRoot}`
  ].join('');

  const lines = [
    `${FAILURE_HEADLINE} — the server on port ${args.port} is not this checkout's dev server.`,
    `  reason:            ${args.reason}`,
    `  expected port:     ${args.port} (${args.baseURL})`,
    `  expected checkout: ${args.repoRoot}`,
    `  observed:          ${observedLine}`
  ];

  const listening = findListeningProcess(args.port);
  if (listening !== null) {
    lines.push('  listening process:');
    for (const line of listening.split('\n')) lines.push(`    ${line}`);
  }

  lines.push(
    '  remedies:',
    `    - stop the other server occupying port ${args.port}, then start this repo's \`yarn dev\`; or`,
    '    - re-run with FRONTEND_PORT=<port your server is actually on>'
  );

  return lines.join('\n');
}

/**
 * Failure of the preflight itself rather than of the server under test.
 *
 * Deliberately worded so it cannot be misread as "the server is foreign": if the
 * probe target is not on disk, the guard is broken and must say so. This is the
 * difference between a guard that fails correctly and one that fails confusingly.
 */
function buildBrokenPreflightMessage(args: { probeAbsolutePath: string; repoRoot: string }): string {
  return [
    `${FAILURE_HEADLINE} — the preflight itself is broken; this says nothing about the server.`,
    `  reason:            its probe target is not on disk: ${args.probeAbsolutePath}`,
    `  expected checkout: ${args.repoRoot}`,
    '  fix:               restore the file, or update PROBE_RELATIVE_PATH in tests/tests/support/preflight.ts'
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

  const observed: Observed = { status: null, finalURL: null, title: null, servedModuleRoot: MODULE_ROOT_NOT_FOUND };

  function fail(reason: string): never {
    throw new Error(buildFailureMessage({ reason, port, baseURL, repoRoot, observed }));
  }

  // --- On-disk sanity, BEFORE any network work --------------------------------
  //
  // If the file clause (b) probes is not in this working tree, the preflight is
  // broken and every server would "fail" it. Say that, do not blame the server.
  if (!fs.existsSync(probeAbsolutePath)) {
    throw new Error(buildBrokenPreflightMessage({ probeAbsolutePath, repoRoot }));
  }

  // --- Clause (a): liveness, polled ------------------------------------------
  const outcome = await pollForLiveness(baseURL, deadlineMs, pollIntervalMs);
  if (!outcome.live) {
    observed.status = outcome.lastStatus;
    const lastSeen =
      outcome.lastStatus !== null
        ? `last response was HTTP ${outcome.lastStatus}`
        : `nothing accepted a connection (${outcome.lastError ?? 'no response'})`;
    fail(`nothing answered 2xx on port ${port} within ${Math.round(deadlineMs / 1000)}s — ${lastSeen}`);
  }

  // Everything the failure message reports about the server comes from this one
  // response: the FINAL url after redirects (which closes the measured
  // `301 -> /sv/` empty-body hole), the title, and the serving checkout's own
  // module root. The raw body itself is never reported — only these extracts.
  observed.status = outcome.live.status;
  observed.finalURL = outcome.live.finalURL;
  observed.title = extractTitle(outcome.live.body);
  observed.servedModuleRoot = extractServedModuleRoot(outcome.live.body);

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

  // --- Clause (c): title sanity, subordinate to (b) ---------------------------
  //
  // A sanity check, never the proof: the staged adversary in this phase's
  // negative control PASSES this clause with a byte-identical title and is caught
  // by clause (b) alone. Absence of a title is NOT a failure — maintenance mode
  // and backend translationOverrides legitimately replace it.
  if (observed.title !== null) {
    const appNames = readAppNames(repoRoot);
    if (appNames.size > 0 && !appNames.has(observed.title)) {
      fail(
        `the served <title> "${observed.title}" is not one of the app names in this checkout's ` +
          `message catalogue (${MESSAGES_RELATIVE_PATH})`
      );
    }
  }
}
