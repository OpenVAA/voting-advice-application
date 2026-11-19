#!/usr/bin/env node

/**
 * Turn the network entries of a Playwright trace into a journey file for `voter-journey.js`.
 *
 * Usage:
 *
 *   unzip -p <trace.zip> '*.network' | node infra/scripts/load-check/journey-from-trace.mjs \
 *     --base https://staging.openvaa.org --supabase https://<ref>.supabase.co [--resources <dir>] \
 *     [--route-id <route id>] [--locale <locale>] > <journey.json>
 *
 * It reads JSON lines on standard input and keeps the `resource-snapshot` lines whose request it can replay:
 *
 *   - a GET or HEAD to the base origin, as `kind: page`;
 *   - a GET or HEAD to the Supabase origin, as `kind: data`;
 *   - a POST to the Supabase origin's `/rest/v1/rpc/`, as `kind: data`, with the request body text.
 *
 * Every other request is dropped: another origin (a websocket among them), a path under `/_app/immutable/`,
 * `/auth/v1/` or `/functions/v1/`, the relay at `/api/usage` (the load script posts its own batches), and any other
 * method, so no write is replayed. Of a kept request it copies the method, the URL with its query and, for an RPC, the
 * body; never a header, a cookie or a response. The requests are ordered by their start time.
 *
 * An RPC body a trace stores as a resource (`postData._sha1`) is read from `--resources <dir>`, the `resources`
 * directory of the unzipped trace.
 *
 * It writes the journey, `{ base, routeId, locale, requests }`, as JSON on standard output, and
 * `journey_requests=<n>` on standard error. `--route-id` (default `/(voters)`) and `--locale` (default `en`) are the
 * route id and locale the load script's relay batches carry.
 *
 * Exit codes: 0 when the journey was written; 1 when the trace yields no request (`journey_requests=0`) or an RPC
 * body could not be read (`journey_bodies_missing=<n>`); 2 on a usage error.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const DROPPED_PATHS = ['/_app/immutable/', '/auth/v1/', '/functions/v1/', '/api/usage'];
const READ_METHODS = ['GET', 'HEAD'];
const RPC_PATH = '/rest/v1/rpc/';

function usage(message) {
  process.stderr.write(`journey-from-trace.mjs: ${message}\n`);
  process.stderr.write(
    'usage: journey-from-trace.mjs --base <origin> --supabase <origin> [--resources <dir>] [--route-id <id>] [--locale <locale>]\n'
  );
  process.exit(2);
}

function parseArgs(args) {
  const flags = { routeId: '/(voters)', locale: 'en' };
  const names = {
    '--base': 'base',
    '--supabase': 'supabase',
    '--resources': 'resources',
    '--route-id': 'routeId',
    '--locale': 'locale'
  };
  for (let i = 0; i < args.length; i += 2) {
    const name = names[args[i]];
    if (name === undefined) usage(`unknown argument: ${args[i]}`);
    if (args[i + 1] === undefined) usage(`${args[i]} requires a value`);
    flags[name] = args[i + 1];
  }
  for (const name of ['base', 'supabase']) {
    if (flags[name] === undefined) usage(`--${name} is required`);
    let url;
    try {
      url = new URL(flags[name]);
    } catch {
      usage(`--${name} is not a URL`);
    }
    if (url.origin !== flags[name]) usage(`--${name} must be an origin, with no path`);
  }
  return flags;
}

/** The request of a trace line, or `undefined` for a line that is not a resource snapshot. */
function requestOf(line) {
  if (line.trim() === '') return undefined;
  let entry;
  try {
    entry = JSON.parse(line);
  } catch {
    return undefined;
  }
  if (entry?.type !== 'resource-snapshot') return undefined;
  const { snapshot } = entry;
  const request = snapshot?.request;
  if (typeof request?.method !== 'string' || typeof request?.url !== 'string') return undefined;
  const started =
    typeof snapshot._monotonicTime === 'number' ? snapshot._monotonicTime : Date.parse(snapshot.startedDateTime);
  return {
    started: Number.isFinite(started) ? started : 0,
    method: request.method.toUpperCase(),
    url: request.url,
    postData: request.postData
  };
}

/** The journey entry of a request, `null` when its body cannot be read, or `undefined` when it is dropped. */
function entryOf(request, flags) {
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return undefined;
  }
  if (DROPPED_PATHS.some((path) => url.pathname.startsWith(path))) return undefined;
  const target = { method: request.method, url: request.url };
  if (url.origin === flags.base) {
    return READ_METHODS.includes(request.method) ? { ...target, kind: 'page' } : undefined;
  }
  if (url.origin !== flags.supabase) return undefined;
  if (READ_METHODS.includes(request.method)) return { ...target, kind: 'data' };
  if (request.method !== 'POST' || !url.pathname.startsWith(RPC_PATH)) return undefined;
  const body = bodyOf(request.postData, flags.resources);
  return body === undefined ? null : { ...target, kind: 'data', body };
}

function bodyOf(postData, resources) {
  if (typeof postData?.text === 'string') return postData.text;
  if (typeof postData?._sha1 !== 'string' || resources === undefined || postData._sha1.includes('/')) return undefined;
  try {
    return readFileSync(join(resources, postData._sha1), 'utf8');
  } catch {
    return undefined;
  }
}

function main(args) {
  const flags = parseArgs(args);
  const requests = readFileSync(0, 'utf8')
    .split('\n')
    .map(requestOf)
    .filter((request) => request !== undefined)
    .map((request, index) => ({ ...request, index }))
    .sort((a, b) => a.started - b.started || a.index - b.index);

  const journey = [];
  let bodiesMissing = 0;
  for (const request of requests) {
    const entry = entryOf(request, flags);
    if (entry === null) bodiesMissing++;
    else if (entry !== undefined) journey.push(entry);
  }

  process.stderr.write(`journey_requests=${journey.length}\n`);
  if (bodiesMissing > 0) {
    process.stderr.write(`journey_bodies_missing=${bodiesMissing}\n`);
    process.exit(1);
  }
  if (journey.length === 0) process.exit(1);
  const output = { base: flags.base, routeId: flags.routeId, locale: flags.locale, requests: journey };
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

main(process.argv.slice(2));
