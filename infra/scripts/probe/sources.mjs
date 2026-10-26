/**
 * The probe's readers of a hosted project. Each source answers a preflight before any of its reads is made, so that a
 * source that is down gives one could-not-run line instead of a failing line for every check that reads it.
 *
 *   management   The Management API, with the access token in `SUPABASE_ACCESS_TOKEN` sent as a bearer token.
 *                Preflight: `GET /v1/projects/{ref}` answers 200. Reads: `GET /v1/projects/{ref}/postgrest`, of which
 *                only `max_rows` is kept. The base address is `PROBE_MANAGEMENT_API_URL` when set (a test seam
 *                pointed at a local stub) and `https://api.supabase.com` otherwise.
 *
 * A response body can hold secrets next to the compared fields (the PostgREST settings hold the JWT secret). Each body
 * is parsed, the named fields are copied out and the body is dropped at once; nothing keeps or prints a whole body. A
 * `SourceError` reason names the endpoint path and the status, never a body or a header.
 *
 * This module has no side effect on import.
 */

export const DEFAULT_MANAGEMENT_API_URL = 'https://api.supabase.com';

const REQUEST_TIMEOUT_MS = 30_000;

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
 * One GET whose answer must be 200. The body is read only when `fields` is given; then it is parsed as a JSON object and
 * only the named fields are returned.
 */
async function getJson({ source, base, endpoint, headers, fetchImpl, fields }) {
  let response;
  try {
    response = await fetchImpl(`${base}${endpoint}`, {
      method: 'GET',
      headers,
      redirect: 'manual',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
  } catch (error) {
    throw new SourceError(source, `GET ${endpoint} did not answer (${failureName(error)})`);
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
  if (body === null || typeof body !== 'object' || Array.isArray(body))
    throw new SourceError(source, `GET ${endpoint} answered 200 with a body that is not a JSON object`);
  const kept = {};
  for (const field of fields) {
    if (!Object.hasOwn(body, field)) throw new SourceError(source, `GET ${endpoint} answered 200 without ${field}`);
    kept[field] = body[field];
  }
  return kept;
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
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
      };
    },
    async preflight({ base, project, headers }, fetchImpl) {
      await getJson({ source: 'management', base, endpoint: project, headers, fetchImpl });
    },
    async read({ base, project, headers }, fetchImpl) {
      const postgrest = await getJson({
        source: 'management',
        base,
        endpoint: `${project}/postgrest`,
        headers,
        fetchImpl,
        fields: ['max_rows']
      });
      return { postgrest };
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
 * @returns `{ management: { postgrest: { max_rows } } }`, holding only the sources asked for.
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
