/**
 * The probe's readers of a hosted project. Each source answers a preflight before any of its reads is made, so that a
 * source that is down gives one could-not-run line instead of a failing line for every check that reads it.
 *
 *   management   The Management API, with the access token in `SUPABASE_ACCESS_TOKEN` sent as a bearer token.
 *                Preflight: `GET /v1/projects/{ref}` answers 200. Reads:
 *                  `GET /v1/projects/{ref}/postgrest`     `max_rows`, `db_schema`, `db_extra_search_path`
 *                  `GET /v1/projects/{ref}/config/auth`   the fields of `AUTH_FIELDS`, every key of the JSON's `auth`,
 *                                                         `auth_hook` and `auth_send_email_hook` groups, and of the
 *                                                         SMTP user name only whether it is a non-empty string
 *                  `GET /v1/projects/{ref}/functions`     `slug`, `status` and `verify_jwt` of each function
 *                  `GET /v1/projects/{ref}/storage/buckets`  `id` (or `name` when an entry has no `id`) and
 *                                                         `public` of each bucket
 *                The key model is read last, for a note that is not a check: `type` and `name` of each entry of
 *                `GET /v1/projects/{ref}/api-keys?reveal=false`, and `enabled` of `GET /v1/projects/{ref}/api-keys/legacy`,
 *                where a 404 means the endpoint is gone. A failure of either read is recorded in the note, never thrown,
 *                so the key model never changes what the probe reports or how it exits.
 *                The base address is `PROBE_MANAGEMENT_API_URL` when set (a test seam pointed at a local stub) and
 *                `https://api.supabase.com` otherwise.
 *
 *   public       The project's own API, with the key in `SUPABASE_ANON_KEY` only. Before any request the key is
 *                inspected: an unset key, a secret key (`sb_secret_`) and a JWT whose role is `service_role` are
 *                refused, because the probe never takes the service-role key. Preflight: `GET /auth/v1/settings`
 *                with the `apikey` header answers 200. Each read sends `apikey` and
 *                `Authorization: Bearer <anon key>`, the call shape of the frontend, except where stated:
 *                  `GET /auth/v1/settings`                `disable_signup`, `mailer_autoconfirm`
 *                  `GET /rest/v1/nominations?select=id&project_id=eq.<public_project_id>` with
 *                                                         `Prefer: count=exact`: the status, the `Content-Range`
 *                                                         header and the number of rows in the body
 *                  `POST /functions/v1/account-access`    a `check-code` of a random code: the status and the kind
 *                                                         of body
 *                  `GET /functions/v1/send-email`         the status and the kind of body
 *                  `GET` and `POST {}` of `/functions/v1/identity-callback`, with no `apikey` and no
 *                                                         `Authorization`, as the identity provider's browser redirect
 *                                                         arrives: the status and the kind of body of each
 *                A kind of body is one of the two fixed bodies the functions write, a JSON object with a `status`
 *                member, other JSON, or not JSON (`bodyKind`); no body of this source is kept. Neither POST
 *                writes: a `check-code` reads, and `identity-callback` without a provider configured refuses
 *                before it reads its body. The base address is `PROBE_PROJECT_URL` when set (a test seam) and
 *                `https://<ref>.supabase.co` otherwise.
 *
 *   catalog      The database over psql (`PROBE_PSQL` when set, a test seam, else `psql`), with the connection in the
 *                PG* variables only: no argument carries an address, and the `SUPABASE_*` variables are not passed
 *                on. Before psql is called the connection must name the root's project: PGHOST `db.<ref>.supabase.co`,
 *                or a session pooler host with PGUSER ending in `.<ref>`; PGPORT not 6543; PGHOSTADDR and PGSERVICE
 *                unset. Preflight: one query (`-X -A -t -v ON_ERROR_STOP=1 -c`) answers a JSON object of the server's
 *                major version, the `rolconfig` of `anon`, whether each hook function resolves with
 *                `to_regprocedure`, the current role and its `rolbypassrls`; a role that does not bypass row-level
 *                security is refused, because the seed check would read no rows under it. Read: `psql -X -f
 *                infra/scripts/check-seed.sql`, whose status is the verdict: 0 clean, 3 a finding, of whose message
 *                only the class words `seed user`, `local address` and `demo key` are kept, and any other status
 *                could not run.
 *
 * A response body can hold secrets next to the compared fields: the PostgREST settings hold the JWT secret, the auth
 * settings hold the SMTP credentials, and the key list holds the keys themselves. Each body is parsed, the named fields are copied out and the body is dropped
 * at once; nothing keeps or prints a whole body. A `SourceError` reason names the endpoint path and the status, never a
 * body or a header.
 *
 * This module has no side effect on import.
 */

import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const DEFAULT_MANAGEMENT_API_URL = 'https://api.supabase.com';

const REQUEST_TIMEOUT_MS = 30_000;

/** The fields of the auth settings the checks compare, besides the keys of the JSON groups the module sends. */
const AUTH_FIELDS = [
  'site_url',
  'uri_allow_list',
  'disable_signup',
  'mailer_autoconfirm',
  'hook_custom_access_token_enabled',
  'hook_custom_access_token_uri',
  'hook_send_email_enabled',
  'hook_send_email_uri',
  'smtp_host',
  'smtp_port',
  'smtp_admin_email',
  'smtp_sender_name',
  'oauth_server_enabled',
  'oauth_server_allow_dynamic_registration'
];

/** A source that did not answer its preflight or one of its reads as expected. */
export class SourceError extends Error {
  /**
   * @param source - The source's name, such as `management`.
   * @param reason - One line naming the endpoint path and the status, never a body.
   */
  constructor(source, reason) {
    super(`${source}: ${reason}`);
    this.name = 'SourceError';
    this.source = source;
    this.reason = reason;
  }
}

/** A network failure's system code when it has one, else the error's class name; never its message. */
function failureName(error) {
  const code = error?.cause?.code ?? error?.code;
  if (typeof code === 'string' && /^[A-Z][A-Z0-9_]*$/.test(code)) return code;
  if (error?.name === 'TimeoutError') return `no answer within ${REQUEST_TIMEOUT_MS / 1000} s`;
  return typeof error?.name === 'string' && /^[A-Za-z]+$/.test(error.name) ? error.name : 'network error';
}

/**
 * The named fields of one JSON object, each of which it must hold. For each entry `name: [a, b]` of `firstOf` the
 * result holds `name`, the value of the first of `a` and `b` that the object holds.
 */
function pick(source, endpoint, object, fields, firstOf = {}) {
  const kept = {};
  for (const field of fields) {
    if (!Object.hasOwn(object, field)) throw new SourceError(source, `GET ${endpoint} answered 200 without ${field}`);
    kept[field] = object[field];
  }
  for (const [name, candidates] of Object.entries(firstOf)) {
    const field = candidates.find((candidate) => Object.hasOwn(object, candidate));
    if (field === undefined)
      throw new SourceError(source, `GET ${endpoint} answered 200 without ${candidates.join(' or ')}`);
    kept[name] = object[field];
  }
  return kept;
}

/**
 * One GET whose answer must be 200. The body is read only when `fields` is given; then it is parsed as JSON and only the
 * named fields are returned:
 *
 *   - by default the body is an object, and the result holds its named fields and, for each name in `presence`,
 *     `<name>_present`: whether the body holds a non-empty string there. The value of a `presence` field is never kept;
 *   - with `each`, the body is an array of objects, and the result holds the named fields of each.
 *
 * `firstOf` names fields of which the first present one is kept, as `pick` describes.
 *
 * `query` is appended to the address and named in no reason. With `notFound`, a 404 returns `null`.
 */
async function getJson({
  source,
  base,
  endpoint,
  query = '',
  headers,
  fetchImpl,
  fields,
  presence = [],
  each = false,
  notFound = false,
  firstOf = {}
}) {
  let response;
  try {
    response = await fetchImpl(`${base}${endpoint}${query}`, {
      method: 'GET',
      headers,
      redirect: 'manual',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
  } catch (error) {
    throw new SourceError(source, `GET ${endpoint} did not answer (${failureName(error)})`);
  }
  if (notFound && response.status === 404) {
    await response.body?.cancel();
    return null;
  }
  if (response.status !== 200) {
    await response.body?.cancel();
    throw new SourceError(source, `GET ${endpoint} answered ${response.status}`);
  }
  if (fields === undefined) {
    await response.body?.cancel();
    return {};
  }
  let body;
  try {
    body = JSON.parse(await response.text());
  } catch {
    throw new SourceError(source, `GET ${endpoint} answered 200 with a body that is not JSON`);
  }
  if (each) {
    if (
      !Array.isArray(body) ||
      !body.every((entry) => entry !== null && typeof entry === 'object' && !Array.isArray(entry))
    )
      throw new SourceError(source, `GET ${endpoint} answered 200 with a body that is not a JSON array of objects`);
    return body.map((entry) => pick(source, endpoint, entry, fields, firstOf));
  }
  if (body === null || typeof body !== 'object' || Array.isArray(body))
    throw new SourceError(source, `GET ${endpoint} answered 200 with a body that is not a JSON object`);
  const kept = pick(source, endpoint, body, fields, firstOf);
  for (const field of presence) kept[`${field}_present`] = typeof body[field] === 'string' && body[field] !== '';
  return kept;
}

/**
 * The key model: the type and name of each issued key, and whether the legacy keys are enabled. A read that fails is
 * recorded as `issuedError` or `legacyError` instead of thrown.
 *
 * @returns `{ issued: [{ type, name }] | null, issuedError?, legacy: 'enabled' | 'disabled' | 'gone' | null,
 *   legacyError? }`.
 */
async function readKeyModel(get) {
  const model = { issued: null, legacy: null };
  try {
    model.issued = await get('/api-keys', { query: '?reveal=false', fields: ['type', 'name'], each: true });
  } catch (error) {
    if (!(error instanceof SourceError)) throw error;
    model.issuedError = error.reason;
  }
  try {
    const legacy = await get('/api-keys/legacy', { fields: ['enabled'], notFound: true });
    if (legacy === null) model.legacy = 'gone';
    else if (typeof legacy.enabled === 'boolean') model.legacy = legacy.enabled ? 'enabled' : 'disabled';
    else model.legacyError = 'the served enabled is not a boolean';
  } catch (error) {
    if (!(error instanceof SourceError)) throw error;
    model.legacyError = error.reason;
  }
  return model;
}

/** One request whose failure to answer is a `SourceError`; the caller reads the response. */
async function send(source, base, { method, endpoint, query = '', headers, body }, fetchImpl) {
  try {
    return await fetchImpl(`${base}${endpoint}${query}`, {
      method,
      headers,
      body,
      redirect: 'manual',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
  } catch (error) {
    throw new SourceError(source, `${method} ${endpoint} did not answer (${failureName(error)})`);
  }
}

/** The two bodies the functions write themselves, which an answer of the gateway never equals. */
const FUNCTION_BODIES = {
  'method-not-allowed': { error: 'Method not allowed' },
  'internal-server-error': { error: 'Internal server error' }
};

function sameFlatObject(value, fixed) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length === Object.keys(fixed).length &&
    Object.entries(fixed).every(([k, v]) => value[k] === v)
  );
}

/**
 * Which known body an answer holds, so that the body itself is never kept.
 *
 * @returns `method-not-allowed` or `internal-server-error` for the functions' own fixed bodies, `status-object` for
 *   a JSON object with a `status` member, `other` for any other JSON and `not-json` for a body that is not JSON.
 */
export function bodyKind(text) {
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return 'not-json';
  }
  for (const [kind, fixed] of Object.entries(FUNCTION_BODIES)) if (sameFlatObject(body, fixed)) return kind;
  if (body !== null && typeof body === 'object' && !Array.isArray(body) && Object.hasOwn(body, 'status'))
    return 'status-object';
  return 'other';
}

/** One call of a function, kept as its status and the kind of its body. */
async function callFunction(base, request, fetchImpl) {
  const response = await send('public', base, request, fetchImpl);
  let text;
  try {
    text = await response.text();
  } catch (error) {
    throw new SourceError('public', `${request.method} ${request.endpoint} did not answer (${failureName(error)})`);
  }
  return { status: response.status, kind: bodyKind(text) };
}

/**
 * The nominations read: every nomination of the project in one request, with the total asked for.
 *
 * @returns `{ status, contentRange, rows }`: the status, the `Content-Range` header or null, and the number of rows in
 *   the body, or null when the read was refused or the body is not an array.
 */
async function readRows(base, headers, projectId, fetchImpl) {
  const endpoint = '/rest/v1/nominations';
  const response = await send(
    'public',
    base,
    {
      method: 'GET',
      endpoint,
      query: `?select=id&project_id=eq.${projectId}`,
      headers: { ...headers, Prefer: 'count=exact' }
    },
    fetchImpl
  );
  const kept = { status: response.status, contentRange: response.headers.get('content-range'), rows: null };
  if (response.status !== 200 && response.status !== 206) {
    await response.body?.cancel();
    return kept;
  }
  let body;
  try {
    body = JSON.parse(await response.text());
  } catch {
    throw new SourceError('public', `GET ${endpoint} answered ${response.status} with a body that is not JSON`);
  }
  if (Array.isArray(body)) kept.rows = body.length;
  return kept;
}

const NEVER_SERVICE_ROLE = 'the probe never takes the service-role key';

/**
 * The anon key from `SUPABASE_ANON_KEY`, refused before any request when it is a key that bypasses row-level
 * security: a secret key (`sb_secret_`), or a JWT whose role is `service_role`. A JWT whose payload cannot be read is
 * refused too, since its role cannot be checked.
 */
function anonKey(env) {
  const key = env.SUPABASE_ANON_KEY;
  if (typeof key !== 'string' || key === '') throw new SourceError('public', 'SUPABASE_ANON_KEY is not set');
  if (key.startsWith('sb_secret_'))
    throw new SourceError('public', `SUPABASE_ANON_KEY holds a secret key, and ${NEVER_SERVICE_ROLE}`);
  const segments = key.split('.');
  if (segments.length === 3) {
    let payload;
    try {
      payload = JSON.parse(Buffer.from(segments[1], 'base64url').toString('utf8'));
    } catch {
      payload = null;
    }
    if (payload === null || typeof payload !== 'object' || Array.isArray(payload))
      throw new SourceError(
        'public',
        `SUPABASE_ANON_KEY is a JWT whose payload cannot be read, so its role cannot be checked, and ${NEVER_SERVICE_ROLE}`
      );
    if (payload.role === 'service_role')
      throw new SourceError(
        'public',
        `SUPABASE_ANON_KEY holds a JWT whose role is service_role, and ${NEVER_SERVICE_ROLE}`
      );
  }
  return key;
}

/** The seed check, run as a script of its own so that its exit status is the verdict. */
const CHECK_SEED = fileURLToPath(new URL('../check-seed.sql', import.meta.url));

const PSQL_TIMEOUT_MS = 120_000;
const DEFAULT_CONNECT_TIMEOUT = '15';

/** The finding classes check-seed names, the only words of its message the probe keeps. */
const SEED_CLASSES = ['seed user', 'local address', 'demo key'];

/**
 * One psql run, with the connection in the PG* variables of `env` and no address on its command line. The variables
 * named `SUPABASE_*` are not passed on.
 *
 * @returns `{ status, stdout, stderr }`, where `status` is null when psql was stopped by a signal.
 */
function runPsql(psql, args, env) {
  const childEnv = Object.fromEntries(Object.entries(env).filter(([name]) => !name.startsWith('SUPABASE_')));
  childEnv.PGCONNECT_TIMEOUT ||= DEFAULT_CONNECT_TIMEOUT;
  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawn(psql, args, { env: childEnv, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (error) {
      reject(new SourceError('catalog', `psql could not be started (${failureName(error)})`));
      return;
    }
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => child.kill('SIGTERM'), PSQL_TIMEOUT_MS);
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(new SourceError('catalog', `psql could not be started (${failureName(error)})`));
    });
    child.on('close', (status) => {
      clearTimeout(timer);
      resolve({ status, stdout, stderr });
    });
  });
}

/**
 * Refuses, before psql is called, a connection that may not reach the root's project: PGHOST must be
 * `db.<ref>.supabase.co`, or a session pooler host `<name>.pooler.supabase.com` with PGUSER ending in `.<ref>`;
 * PGPORT must not be 6543, the transaction pooler, which loses a session's settings between transactions; and
 * neither PGHOSTADDR nor PGSERVICE may be set, since either can send psql to another address than PGHOST.
 */
function assertCatalogTarget(env, ref) {
  for (const name of ['PGHOSTADDR', 'PGSERVICE'])
    if (env[name])
      throw new SourceError('catalog', `${name} is set, and it can send psql to another address than PGHOST`);
  const host = (env.PGHOST ?? '').toLowerCase();
  if (host === '')
    throw new SourceError('catalog', `PGHOST is not set; it must be db.${ref}.supabase.co or a session pooler host`);
  if (host.endsWith('.pooler.supabase.com')) {
    if (!(env.PGUSER ?? '').endsWith(`.${ref}`))
      throw new SourceError(
        'catalog',
        `PGHOST is a pooler host, but PGUSER does not end in .${ref}, so the connection may reach another project`
      );
  } else if (host !== `db.${ref}.supabase.co`)
    throw new SourceError('catalog', `PGHOST names neither db.${ref}.supabase.co nor a session pooler host`);
  if ((env.PGPORT ?? '').trim() === '6543')
    throw new SourceError(
      'catalog',
      'PGPORT is 6543, the transaction pooler, which loses the session settings between transactions'
    );
}

const SIGNATURE = /^[a-z_][a-z0-9_]*\.[a-z_][a-z0-9_]*\(jsonb\)$/;

/**
 * The one catalog query: a JSON object of the server's major version, the `rolconfig` of `anon`, whether each hook
 * signature resolves, the current role and whether it bypasses row-level security (a superuser does too).
 */
function catalogQuery(signatures) {
  for (const signature of signatures)
    if (!SIGNATURE.test(signature)) throw new SourceError('catalog', 'a hook signature is not a plain identifier');
  const hooks = signatures.map((s) => `'${s}', to_regprocedure('${s}') IS NOT NULL`).join(', ');
  return [
    'SELECT json_build_object(',
    "  'major', current_setting('server_version_num')::int / 10000,",
    "  'anon_config', (SELECT rolconfig FROM pg_roles WHERE rolname = 'anon'),",
    `  'hooks', json_build_object(${hooks}),`,
    "  'role', current_user,",
    "  'bypassrls', (SELECT rolsuper OR rolbypassrls FROM pg_roles WHERE rolname = current_user)",
    ')'
  ].join('\n');
}

function isCatalogAnswer(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    Number.isInteger(value.major) &&
    (value.anon_config === null ||
      (Array.isArray(value.anon_config) && value.anon_config.every((e) => typeof e === 'string'))) &&
    value.hooks !== null &&
    typeof value.hooks === 'object' &&
    Object.values(value.hooks).every((v) => typeof v === 'boolean') &&
    typeof value.role === 'string' &&
    typeof value.bypassrls === 'boolean'
  );
}

/** A role name as a reason may name it. */
function plainRole(role) {
  return /^[A-Za-z0-9_.-]{1,63}$/.test(role) ? role : 'the connecting role';
}

/**
 * The seed check's verdict: clean, or the finding classes its message names. Only the class words are kept; every
 * other word of the message, which names addresses and URLs, is dropped.
 */
function seedVerdict({ status, stderr }) {
  if (status === 0) return { clean: true };
  if (status === 3 && stderr.includes('check-seed:')) {
    const classes = [];
    for (const line of stderr.split('\n')) {
      const match = /^\s*-\s*([a-z ]+):/.exec(line);
      if (match && SEED_CLASSES.includes(match[1]) && !classes.includes(match[1])) classes.push(match[1]);
    }
    return { clean: false, classes };
  }
  if (status === null) throw new SourceError('catalog', 'check-seed was stopped before it finished');
  throw new SourceError('catalog', `check-seed exited ${status}`);
}

const SOURCES = {
  management: {
    setup({ expected, env }) {
      const token = env.SUPABASE_ACCESS_TOKEN;
      if (typeof token !== 'string' || token === '')
        throw new SourceError('management', 'SUPABASE_ACCESS_TOKEN is not set');
      const base = (env.PROBE_MANAGEMENT_API_URL || DEFAULT_MANAGEMENT_API_URL).replace(/\/+$/, '');
      return {
        base,
        project: `/v1/projects/${expected.ref}`,
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        authFields: [
          ...new Set([
            ...AUTH_FIELDS,
            ...Object.keys(expected.auth),
            ...Object.keys(expected.authHook),
            ...Object.keys(expected.authSendEmailHook)
          ])
        ]
      };
    },
    async preflight({ base, project, headers }, fetchImpl) {
      await getJson({ source: 'management', base, endpoint: project, headers, fetchImpl });
    },
    async read({ base, project, headers, authFields }, fetchImpl) {
      function get(endpoint, options) {
        return getJson({
          source: 'management',
          base,
          endpoint: `${project}${endpoint}`,
          headers,
          fetchImpl,
          ...options
        });
      }
      const postgrest = await get('/postgrest', { fields: ['max_rows', 'db_schema', 'db_extra_search_path'] });
      const auth = await get('/config/auth', { fields: authFields, presence: ['smtp_user'] });
      const functions = await get('/functions', { fields: ['slug', 'status', 'verify_jwt'], each: true });
      const buckets = await get('/storage/buckets', {
        fields: ['public'],
        firstOf: { id: ['id', 'name'] },
        each: true
      });
      const keys = await readKeyModel(get);
      return { postgrest, auth, functions, buckets, keys };
    }
  },
  public: {
    setup({ expected, env }) {
      const key = anonKey(env);
      if (expected.publicProjectId === null)
        throw new SourceError(
          'public',
          "the root's terraform.tfvars sets no public_project_id, so the rows read names no project"
        );
      const base = (env.PROBE_PROJECT_URL || expected.projectUrl).replace(/\/+$/, '');
      return { base, key, projectId: expected.publicProjectId };
    },
    async preflight({ base, key }, fetchImpl) {
      const headers = { apikey: key, Accept: 'application/json' };
      await getJson({ source: 'public', base, endpoint: '/auth/v1/settings', headers, fetchImpl });
    },
    async read({ base, key, projectId }, fetchImpl) {
      // A publishable key in `apikey` passes the gateway's JWT check, so the identity-callback calls carry no key.
      const unverified = { Accept: 'application/json' };
      const headers = { apikey: key, Accept: 'application/json', Authorization: `Bearer ${key}` };
      const json = { 'Content-Type': 'application/json' };
      const settings = await getJson({
        source: 'public',
        base,
        endpoint: '/auth/v1/settings',
        headers,
        fetchImpl,
        fields: ['disable_signup', 'mailer_autoconfirm']
      });
      const rows = await readRows(base, headers, projectId, fetchImpl);
      const checkCode = {
        operation: 'check-code',
        project_id: projectId,
        code: randomBytes(9).toString('base64url')
      };
      const accountAccess = await callFunction(
        base,
        {
          method: 'POST',
          endpoint: '/functions/v1/account-access',
          headers: { ...headers, ...json },
          body: JSON.stringify(checkCode)
        },
        fetchImpl
      );
      const sendEmail = await callFunction(
        base,
        { method: 'GET', endpoint: '/functions/v1/send-email', headers },
        fetchImpl
      );
      const identityCallbackGet = await callFunction(
        base,
        { method: 'GET', endpoint: '/functions/v1/identity-callback', headers: unverified },
        fetchImpl
      );
      const identityCallbackPost = await callFunction(
        base,
        {
          method: 'POST',
          endpoint: '/functions/v1/identity-callback',
          headers: { ...unverified, ...json },
          body: '{}'
        },
        fetchImpl
      );
      return {
        settings,
        rows,
        functions: { accountAccess, sendEmail, identityCallbackGet, identityCallbackPost }
      };
    }
  },
  catalog: {
    setup({ expected, env }) {
      assertCatalogTarget(env, expected.ref);
      return { psql: env.PROBE_PSQL || 'psql', env, query: catalogQuery(expected.hookFunctions), answer: null };
    },
    async preflight(context) {
      const { status, stdout } = await runPsql(
        context.psql,
        ['-X', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-c', context.query],
        context.env
      );
      if (status !== 0)
        throw new SourceError(
          'catalog',
          status === null
            ? 'psql was stopped before the catalog query answered'
            : `psql exited ${status} on the catalog query`
        );
      let answer;
      try {
        answer = JSON.parse(stdout.trim());
      } catch {
        answer = null;
      }
      if (!isCatalogAnswer(answer))
        throw new SourceError('catalog', 'the catalog query answered with no JSON object of the expected shape');
      if (!answer.bypassrls)
        throw new SourceError(
          'catalog',
          `${plainRole(answer.role)} does not bypass row-level security, so check-seed would read no rows and report false findings`
        );
      context.answer = answer;
    },
    async read(context) {
      const seed = seedVerdict(await runPsql(context.psql, ['-X', '-f', CHECK_SEED], context.env));
      const { major, anon_config: anonConfig, hooks, role, bypassrls } = context.answer;
      return { major, anonConfig, hooks, role, bypassrls, seed };
    }
  }
};

/** The names of the sources this module can read. */
export const SOURCE_NAMES = Object.keys(SOURCES);

/**
 * Preflights every named source, then reads each one.
 *
 * @param options.sources - The names of the sources to read, as the registered checks name them.
 * @param options.expected - The expected values; `expected.ref` names the project.
 * @param options.env - The environment the token and the test seams are read from.
 * @param options.fetchImpl - The `fetch` to use. Defaults to the global one.
 * @returns `{ management: { postgrest, auth, functions, buckets, keys }, public: { settings, rows, functions },
 *   catalog: { major, anonConfig, hooks, role, bypassrls, seed } }`, holding only the sources asked for.
 * @throws SourceError for the first source that is not configured, fails its preflight or fails a read.
 */
export async function collect({ sources, expected, env = process.env, fetchImpl = globalThis.fetch }) {
  const prepared = [];
  for (const name of sources) {
    const source = SOURCES[name];
    if (source === undefined) throw new SourceError(name, 'is not a source the probe can read');
    prepared.push({ name, source, context: source.setup({ expected, env }) });
  }
  for (const { source, context } of prepared) await source.preflight(context, fetchImpl);
  const responses = {};
  for (const { name, source, context } of prepared) responses[name] = await source.read(context, fetchImpl);
  return responses;
}
