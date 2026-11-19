/**
 * The voter-journey load script, for k6 2.4.0. It is run by `infra/scripts/load-check.sh`, never by Node: `k6/http`
 * resolves only inside k6.
 *
 * One iteration is one journey: every request of the journey file in its order, and after each page request one relay
 * post of a valid batch. The run is a series of steps, one `constant-arrival-rate` scenario each, started one after the
 * other and tagged `step: <index from 1>`, so every request carries the step it was made in and the thresholds below
 * can be read per step. The method, and how the figure is read from the summary, are in `README.md` beside this file.
 *
 * Inputs, from the environment only:
 *   STEPS              Comma-separated arrival rates, in journeys per minute, one per step, rising strictly, e.g.
 *                      `5,10,20`.
 *   STEP_SECONDS       The length of every step, in seconds.
 *   BASE_URL           The origin the pages and the relay posts are requested from.
 *   JOURNEY            The path of the journey file inside the container.
 *   SUPABASE_ANON_KEY  The anon key, sent as `apikey` and `Authorization: Bearer` to the journey's Supabase host only.
 *                      Required only when the journey holds a data request.
 *
 * The summary is written to `/out/summary.json`: k6's own summary data with one added member, `load_check`, which holds
 * the step rates and the step length the figure is computed with.
 */

import http from 'k6/http';

/** The page p95, in milliseconds, a step must stay under. */
const PAGE_P95_MS = 1000;
/** The relay p95, in milliseconds, a step must stay under. */
const RELAY_P95_MS = 300;
/** The error rate a step must stay under. */
const STEP_ERROR_RATE = 0.01;
/** The error rate over the whole run that aborts it, once it has held for `ABORT_DELAY`. */
const ABORT_ERROR_RATE = 0.05;
const ABORT_DELAY = '1m';
/**
 * The bound of the data requests' per-step p95, in milliseconds: never reached, so it fails no step. It makes k6 keep
 * that sub-metric in the summary, where it shows whether the Supabase project slowed at a step.
 */
const DATA_P95_OBSERVED_MS = 3600000;
/** The relay path, the same as `RELAY_PATH` of the frontend. */
const RELAY_PATH = '/api/usage';
/** Paths no journey may request: Supabase Auth, Edge Functions (`account-access` among them), and the relay itself. */
const REFUSED_PATHS = ['/auth/v1/', '/functions/v1/', RELAY_PATH];
const SUPABASE_HOST = /^[a-z0-9]+\.supabase\.co$/;

function fail(message) {
  throw new Error(`voter-journey: ${message}`);
}

function parseSteps(value) {
  const steps = String(value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '');
  if (steps.length === 0) fail('STEPS is empty');
  const rates = steps.map((entry) => {
    if (!/^[1-9][0-9]*$/.test(entry)) fail(`STEPS holds ${entry}, not a positive whole number`);
    return Number(entry);
  });
  rates.forEach((rate, index) => {
    if (index > 0 && rate <= rates[index - 1]) fail('STEPS does not rise strictly');
  });
  return rates;
}

function parseOrigin(url) {
  const match = /^(https?):\/\/([^/?#:]+)(:[0-9]+)?(\/[^?#]*)?/.exec(url);
  if (match === null) fail(`not an absolute http(s) URL: ${url}`);
  return { origin: `${match[1]}://${match[2]}${match[3] ?? ''}`, host: match[2], path: match[4] ?? '/' };
}

const STEPS = parseSteps(__ENV.STEPS);
const STEP_SECONDS = Number(__ENV.STEP_SECONDS);
if (!Number.isInteger(STEP_SECONDS) || STEP_SECONDS < 1) fail('STEP_SECONDS is not a positive whole number');
const BASE_URL = String(__ENV.BASE_URL ?? '').replace(/\/$/, '');
const BASE = parseOrigin(BASE_URL);
const ANON_KEY = __ENV.SUPABASE_ANON_KEY ?? '';

const JOURNEY = JSON.parse(open(__ENV.JOURNEY));
if (JOURNEY.base !== BASE_URL) fail('the journey base is not BASE_URL');
if (typeof JOURNEY.routeId !== 'string' || typeof JOURNEY.locale !== 'string')
  fail('the journey lacks routeId or locale');
if (!Array.isArray(JOURNEY.requests) || JOURNEY.requests.length === 0) fail('the journey holds no request');

const REQUESTS = JOURNEY.requests.map((entry, index) => {
  const { origin, host, path } = parseOrigin(entry.url);
  if (REFUSED_PATHS.some((refused) => path.startsWith(refused))) fail(`request ${index} asks a refused path`);
  if (entry.kind === 'page') {
    if (origin !== BASE.origin) fail(`page request ${index} is not on the base origin`);
  } else if (entry.kind === 'data') {
    if (!origin.startsWith('https://') || !SUPABASE_HOST.test(host))
      fail(`data request ${index} is not on a Supabase host`);
    if (ANON_KEY === '') fail('the journey holds a data request and SUPABASE_ANON_KEY is empty');
  } else {
    fail(`request ${index} has kind ${entry.kind}, not page or data`);
  }
  if (!['GET', 'HEAD', 'POST'].includes(entry.method)) fail(`request ${index} has method ${entry.method}`);
  return { method: entry.method, url: entry.url, kind: entry.kind, body: entry.body ?? null };
});
const PAGE_COUNT = REQUESTS.filter((entry) => entry.kind === 'page').length;

/**
 * Enough virtual users for each step's rate: the journeys that start in one minute, times a journey's request count
 * at an assumed second each, doubled, so a slower answer does not leave the executor short of users.
 */
function vusFor(rate) {
  const perJourneySeconds = REQUESTS.length + PAGE_COUNT;
  const preAllocated = Math.max(2, Math.ceil(((rate * perJourneySeconds) / 60) * 2));
  return { preAllocatedVUs: preAllocated, maxVUs: preAllocated * 4 };
}

const scenarios = {};
const thresholds = {
  http_req_failed: [{ threshold: `rate<${ABORT_ERROR_RATE}`, abortOnFail: true, delayAbortEval: ABORT_DELAY }]
};
STEPS.forEach((rate, index) => {
  const step = index + 1;
  scenarios[`step_${step}`] = {
    executor: 'constant-arrival-rate',
    rate,
    timeUnit: '1m',
    duration: `${STEP_SECONDS}s`,
    startTime: `${index * STEP_SECONDS}s`,
    gracefulStop: '10s',
    tags: { step: String(step) },
    ...vusFor(rate)
  };
  thresholds[`http_req_duration{kind:page,step:${step}}`] = [`p(95)<${PAGE_P95_MS}`];
  thresholds[`http_req_duration{kind:relay,step:${step}}`] = [`p(95)<${RELAY_P95_MS}`];
  thresholds[`http_req_failed{step:${step}}`] = [`rate<${STEP_ERROR_RATE}`];
  // k6 tags a dropped iteration with its scenario, not with the scenario's own tags.
  thresholds[`dropped_iterations{scenario:step_${step}}`] = ['count<1'];
  thresholds[`http_req_duration{kind:data,step:${step}}`] = [`p(95)<${DATA_P95_OBSERVED_MS}`];
});

export const options = {
  discardResponseBodies: true,
  // A single client reaches few of the edge's addresses; a random pick per lookup spreads the requests over them.
  dns: { ttl: '1m', select: 'random', policy: 'preferIPv4' },
  scenarios,
  thresholds
};

/** A UUIDv7 stamped with the current time, the form the relay requires of a visit id. */
function visitId() {
  let remaining = Date.now();
  const bytes = new Array(16);
  for (let i = 5; i >= 0; i--) {
    bytes[i] = remaining % 256;
    remaining = Math.floor(remaining / 256);
  }
  for (let i = 6; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = 0x70 | (bytes[6] & 0x0f);
  bytes[8] = 0x80 | (bytes[8] & 0x3f);
  const hex = bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function relayBody(id) {
  return JSON.stringify({
    routeId: JOURNEY.routeId,
    locale: JOURNEY.locale,
    events: [{ name: 'answer', ago: 0, id, attributes: { questionId: 'load-check', value: 1 } }]
  });
}

function send(entry) {
  const headers = {};
  if (entry.kind === 'data') {
    headers.apikey = ANON_KEY;
    headers.Authorization = `Bearer ${ANON_KEY}`;
    if (entry.body !== null) headers['Content-Type'] = 'application/json';
  }
  http.request(entry.method, entry.url, entry.body, { headers, tags: { kind: entry.kind } });
}

export default function () {
  const id = visitId();
  for (const entry of REQUESTS) {
    send(entry);
    if (entry.kind === 'page') {
      http.post(`${BASE_URL}${RELAY_PATH}`, relayBody(id), {
        headers: { 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-origin' },
        tags: { kind: 'relay' }
      });
    }
  }
}

export function handleSummary(data) {
  const summary = { ...data, load_check: { steps: STEPS, step_seconds: STEP_SECONDS } };
  return { '/out/summary.json': JSON.stringify(summary, null, 2) };
}
