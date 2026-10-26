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
 *                The key model is read last, for a note that is not a check: `type` and `name` of each entry of
 *                `GET /v1/projects/{ref}/api-keys?reveal=false`, and `enabled` of `GET /v1/projects/{ref}/api-keys/legacy`,
 *                where a 404 means the endpoint is gone. A failure of either read is recorded in the note, never thrown,
 *                so the key model never changes what the probe reports or how it exits.
 *                The base address is `PROBE_MANAGEMENT_API_URL` when set (a test seam pointed at a local stub) and
 *                `https://api.supabase.com` otherwise.
 *
 * A response body can hold secrets next to the compared fields: the PostgREST settings hold the JWT secret, the auth
 * settings hold the SMTP credentials, and the key list holds the keys themselves. Each body is parsed, the named fields are copied out and the body is dropped
 * at once; nothing keeps or prints a whole body. A `SourceError` reason names the endpoint path and the status, never a
 * body or a header.
 *
 * This module has no side effect on import.
 */

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

/** The named fields of one JSON object, each of which it must hold. */
function pick(source, endpoint, object, fields) {
  const kept = {};
  for (const field of fields) {
    if (!Object.hasOwn(object, field)) throw new SourceError(source, `GET ${endpoint} answered 200 without ${field}`);
    kept[field] = object[field];
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
  notFound = false
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
    return body.map((entry) => pick(source, endpoint, entry, fields));
  }
  if (body === null || typeof body !== 'object' || Array.isArray(body))
    throw new SourceError(source, `GET ${endpoint} answered 200 with a body that is not a JSON object`);
  const kept = pick(source, endpoint, body, fields);
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
      const keys = await readKeyModel(get);
      return { postgrest, auth, functions, keys };
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
 * @returns `{ management: { postgrest, auth, functions, keys } }`, holding only the sources asked for.
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
