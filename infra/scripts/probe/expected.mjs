/**
 * The values a hosted project is expected to serve, read from tracked files only. The probe holds no expected value of its own: every value here is read from the file that sets it for the deployment.
 *
 *   ref:                `project_ref` of the target root's `terraform.tfvars`, twenty lower-case letters
 *   publicOrigin:       `public_origin` of the root's `terraform.tfvars`
 *   hooks:              `{ accessToken, sendEmail }`: the root's `enable_access_token_hook` and `enable_send_email_hook`
 *   smtp:               the root's `smtp` object (`host`, `port`, `admin_email`, `sender_name`), or null when the root sets none
 *   maxRows:            `{ json, pageSize }`: `api.max_rows` of `infra/modules/supabase/hosted-settings.json` and `dataAdapter.pageSize` of `packages/app-shared/src/settings/staticSettings.ts`
 *   auth:               the `auth` group of the JSON
 *   authHook:           the `auth_hook` group of the JSON
 *   authSendEmailHook:  the `auth_send_email_hook` group of the JSON
 *   redirectPaths:      `redirect_callback_paths` of the JSON
 *   oauthServer:        `{ enabled, allow_dynamic_registration }` of `[auth.oauth_server]` in `apps/supabase/supabase/config.toml`
 *   api:                `{ db_schema, db_extra_search_path }` of the JSON's `api` group
 *   functions:          `[{ slug, verifyJwt }]`, sorted by slug: one entry per directory under `apps/supabase/supabase/functions/` that holds an `index.ts`, with `verify_jwt` of its `[functions.<slug>]` table in config.toml, or `true` when the table or the key is absent (the platform verifies a JWT unless told not to)
 *   publicProjectId:    `public_project_id` of the root's `terraform.tfvars`, a lower-case canonical uuid, or null when the root sets none: the project whose rows the public read asks for
 *   projectUrl:         `https://<ref>.supabase.co`, the project's own API
 *   buckets:            `[{ id, public }]`, sorted by id: one entry per `[storage.buckets.<id>]` table of config.toml
 *   anonTimeout:        the `statement_timeout` of the last `ALTER ROLE anon SET statement_timeout` among `apps/supabase/supabase/migrations/*.sql`, in filename order
 *   postgresMajor:      `major_version` of the `[db]` table of config.toml
 *   hookFunctions:      the signatures `<schema>.<name>(jsonb)` of the functions the JSON's two hook URIs name, the access-token hook first
 *
 * The reading rules are the hosted-settings parity guard's, and the config.toml, `pageSize` and tfvars string and boolean readers are its own, from `scripts/lib/config-toml.mjs`, `scripts/lib/static-settings.mjs` and `scripts/lib/tfvars.mjs`: the JSON is parsed whole, `pageSize` is a line read inside the `dataAdapter` block, a `terraform.tfvars` assignment is a line `name = value` with an optional trailing comment (the `smtp` object is written one attribute per line between `smtp = {` and `}`), and a `config.toml` table runs from its `[name]` header to the next header, holding lines `key = value` with an optional trailing comment. A file that cannot be read, or a value that is missing, written twice or malformed, throws a `ProbeInputError` whose message names the file and the value.
 *
 * This module has no side effect on import.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { plainHeaders, plainTableName, readConfig, TABLE_HEADER } from '../../../scripts/lib/config-toml.mjs';
import { readPageSize as readPageSizeLine } from '../../../scripts/lib/static-settings.mjs';
import { readTfvarsBool, readTfvarsString } from '../../../scripts/lib/tfvars.mjs';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

export const EXPECTED_PATHS = {
  config: 'apps/supabase/supabase/config.toml',
  functions: 'apps/supabase/supabase/functions',
  migrations: 'apps/supabase/supabase/migrations',
  settings: 'infra/modules/supabase/hosted-settings.json',
  staticSettings: 'packages/app-shared/src/settings/staticSettings.ts'
};

/**
 * The expected values for one target root.
 *
 * @param options.repoRoot - The repository root the tracked files are read from. Defaults to this checkout's.
 * @param options.root - The absolute path of the target Terraform root, which holds its `terraform.tfvars`.
 * @returns `{ ref, publicOrigin, hooks, smtp, maxRows, auth, authHook, authSendEmailHook, redirectPaths, api,
 *   oauthServer, functions, publicProjectId, projectUrl, buckets, anonTimeout, postgresMajor, hookFunctions }`.
 * @throws ProbeInputError naming the file and the value when an input cannot be read.
 */
export function readExpected({ repoRoot = REPO_ROOT, root }) {
  const tfvars = readText(repoRoot, path.join(root, 'terraform.tfvars'));
  const ref = tfvarsString(tfvars.file, tfvars.text, 'project_ref');
  if (ref === null) throw new ProbeInputError(tfvars.file, 'assigns no project_ref');
  if (!PROJECT_REF.test(ref)) throw new ProbeInputError(tfvars.file, 'project_ref is not twenty lower-case letters');
  const publicOrigin = tfvarsString(tfvars.file, tfvars.text, 'public_origin');
  if (publicOrigin === null) throw new ProbeInputError(tfvars.file, 'assigns no public_origin');
  const hooks = {};
  for (const [name, variable] of [
    ['accessToken', 'enable_access_token_hook'],
    ['sendEmail', 'enable_send_email_hook']
  ]) {
    const value = tfvarsBool(tfvars.file, tfvars.text, variable);
    if (value === null) throw new ProbeInputError(tfvars.file, `assigns no ${variable}`);
    hooks[name] = value;
  }
  const smtp = readTfvarsObject(tfvars.file, tfvars.text, 'smtp', SMTP_ATTRIBUTES);
  const publicProjectId = tfvarsString(tfvars.file, tfvars.text, 'public_project_id');
  if (publicProjectId !== null && !UUID.test(publicProjectId))
    throw new ProbeInputError(tfvars.file, 'public_project_id is not a lower-case canonical uuid');

  const settings = readText(repoRoot, path.join(repoRoot, EXPECTED_PATHS.settings));
  const staticSettings = readText(repoRoot, path.join(repoRoot, EXPECTED_PATHS.staticSettings));
  const config = readText(repoRoot, path.join(repoRoot, EXPECTED_PATHS.config));

  const groups = readSettingsGroups(settings.file, settings.text);

  return {
    ref,
    publicOrigin,
    hooks,
    smtp,
    maxRows: {
      json: readMaxRows(settings.file, settings.text),
      pageSize: readPageSize(staticSettings.file, staticSettings.text)
    },
    ...groups,
    oauthServer: readOauthServer(config.file, config.text),
    functions: readFunctions(repoRoot, config),
    publicProjectId,
    projectUrl: `https://${ref}.supabase.co`,
    buckets: readBuckets(config.file, config.text),
    anonTimeout: readAnonTimeout(repoRoot),
    postgresMajor: readPostgresMajor(config.file, config.text),
    hookFunctions: [
      hookSignature(settings.file, 'hook_custom_access_token_uri', groups.authHook.hook_custom_access_token_uri),
      hookSignature(settings.file, 'hook_send_email_uri', groups.authSendEmailHook.hook_send_email_uri)
    ]
  };
}

const PROJECT_REF = /^[a-z]{20}$/;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const SMTP_ATTRIBUTES = ['host', 'port', 'admin_email', 'sender_name'];

/** An input file that cannot be read, or a value in it that is missing or malformed. */
export class ProbeInputError extends Error {
  /**
   * @param file - The file, as displayed: relative to the repository root when inside it.
   * @param what - What is missing or malformed, naming the value.
   */
  constructor(file, what) {
    super(`${file}: ${what}`);
    this.name = 'ProbeInputError';
    this.file = file;
    this.what = what;
  }
}

function display(repoRoot, absolute) {
  const relative = path.relative(repoRoot, absolute);
  return relative.startsWith('..') || path.isAbsolute(relative) ? absolute : relative;
}

function readText(repoRoot, absolute) {
  const file = display(repoRoot, absolute);
  try {
    return { file, text: readFileSync(absolute, 'utf8') };
  } catch (error) {
    throw new ProbeInputError(file, `could not be read (${error.code ?? error.name})`);
  }
}

/**
 * One quoted string assignment of a `terraform.tfvars`, by the line read of `scripts/lib/tfvars.mjs`.
 *
 * @returns The value, or `null` when the file does not assign the name.
 * @throws ProbeInputError when the name is assigned more than once or a line assigning it cannot be read.
 */
function tfvarsString(file, text, name) {
  const read = readTfvarsString(text, name);
  if (!read.ok) throw new ProbeInputError(file, read.what);
  return read.value;
}

/**
 * One boolean assignment of a `terraform.tfvars`, by the line read of `scripts/lib/tfvars.mjs`.
 *
 * @returns The value, or `null` when the file does not assign the name.
 * @throws ProbeInputError when the name is assigned more than once or a line assigning it is not `true` or `false`.
 */
function tfvarsBool(file, text, name) {
  const read = readTfvarsBool(text, name);
  if (!read.ok) throw new ProbeInputError(file, read.what);
  return read.value;
}

/**
 * One object assignment of a `terraform.tfvars` whose attributes are quoted strings, written one attribute per line between `name = {` and a line holding only `}`. Blank lines and comment lines inside it are skipped.
 *
 * @param attributes - The attribute names the object must hold, and the only ones it may hold.
 * @returns The object, or `null` when the file does not assign the name or assigns it `null`.
 * @throws ProbeInputError when the object is written twice, is not closed, holds a line the line read cannot read, or
 *   lacks or adds an attribute.
 */
export function readTfvarsObject(file, text, name, attributes) {
  const lines = text.split('\n');
  const starts = lines.flatMap((line, index) => (new RegExp(`^\\s*${name}\\s*=`).test(line) ? [index] : []));
  if (starts.length === 0) return null;
  if (starts.length > 1) throw new ProbeInputError(file, `${name} is assigned ${starts.length} times`);
  const opening = lines[starts[0]];
  if (new RegExp(`^\\s*${name}\\s*=\\s*null\\s*(?:#.*)?$`).test(opening)) return null;
  if (!new RegExp(`^\\s*${name}\\s*=\\s*\\{\\s*(?:#.*)?$`).test(opening))
    throw new ProbeInputError(file, `the ${name} line does not open an object written one attribute per line`);
  const value = {};
  for (let i = starts[0] + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^\s*\}\s*(?:#.*)?$/.test(line)) {
      const missing = attributes.filter((a) => !Object.hasOwn(value, a));
      if (missing.length > 0) throw new ProbeInputError(file, `the ${name} object holds no ${missing.join(', ')}`);
      return value;
    }
    if (/^\s*(?:#.*)?$/.test(line)) continue;
    const m = /^\s*([a-z_][a-z0-9_]*)\s*=\s*"([^"\\]*)"\s*(?:#.*)?$/.exec(line);
    if (!m) throw new ProbeInputError(file, `a line of the ${name} object is not an attribute the line read can read`);
    if (!attributes.includes(m[1]))
      throw new ProbeInputError(file, `the ${name} object holds ${m[1]}, which is not one of its attributes`);
    if (Object.hasOwn(value, m[1])) throw new ProbeInputError(file, `the ${name} object sets ${m[1]} twice`);
    value[m[1]] = m[2];
  }
  throw new ProbeInputError(file, `the ${name} object is not closed by a line holding only }`);
}

/**
 * The groups of the hosted settings JSON that the auth and API checks compare with.
 *
 * @returns `{ auth, authHook, authSendEmailHook, redirectPaths, api: { db_schema, db_extra_search_path } }`.
 * @throws ProbeInputError when the text is not JSON, a group is missing or not an object of scalar values, or the
 *   redirect paths are not a non-empty array of strings.
 */
export function readSettingsGroups(file, text) {
  let settings;
  try {
    settings = JSON.parse(text);
  } catch {
    throw new ProbeInputError(file, 'is not JSON, so its groups cannot be read');
  }
  if (!isPlainObject(settings)) throw new ProbeInputError(file, 'is not a JSON object');
  const groups = {};
  for (const [name, group] of [
    ['auth', 'auth'],
    ['authHook', 'auth_hook'],
    ['authSendEmailHook', 'auth_send_email_hook']
  ]) {
    const value = settings[group];
    if (!isPlainObject(value)) throw new ProbeInputError(file, `holds no ${group} object`);
    if (!Object.values(value).every(isScalar))
      throw new ProbeInputError(file, `${group} holds a value that is not a string, a number, a boolean or null`);
    groups[name] = value;
  }
  const paths = settings.redirect_callback_paths;
  if (!Array.isArray(paths) || paths.length === 0 || !paths.every((p) => typeof p === 'string'))
    throw new ProbeInputError(file, 'redirect_callback_paths is not a non-empty array of strings');
  groups.redirectPaths = paths;
  const api = isPlainObject(settings.api) ? settings.api : {};
  groups.api = {};
  for (const key of ['db_schema', 'db_extra_search_path']) {
    if (typeof api[key] !== 'string') throw new ProbeInputError(file, `holds no string api.${key}`);
    groups.api[key] = api[key];
  }
  return groups;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isScalar(value) {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}

/**
 * `api.max_rows` of the hosted settings JSON.
 *
 * @throws ProbeInputError when the text is not JSON or the value is not a non-negative integer.
 */
export function readMaxRows(file, text) {
  let settings;
  try {
    settings = JSON.parse(text);
  } catch {
    throw new ProbeInputError(file, 'is not JSON, so api.max_rows cannot be read');
  }
  const api = settings !== null && typeof settings === 'object' ? settings.api : undefined;
  if (api === null || typeof api !== 'object' || !('max_rows' in api))
    throw new ProbeInputError(file, 'holds no api.max_rows');
  if (!Number.isInteger(api.max_rows) || api.max_rows < 0)
    throw new ProbeInputError(file, 'api.max_rows is not a non-negative integer');
  return api.max_rows;
}

/**
 * `dataAdapter.pageSize`, read as a line directly inside the `dataAdapter` block.
 *
 * @throws ProbeInputError when the block or the value is missing, unreadable or written twice.
 */
export function readPageSize(file, text) {
  const pageSize = readPageSizeLine(text);
  if (!pageSize.ok) throw new ProbeInputError(file, pageSize.what);
  return pageSize.value;
}

/**
 * `enabled` and `allow_dynamic_registration` of `[auth.oauth_server]`.
 *
 * @throws ProbeInputError when either is missing or is not a boolean.
 */
export function readOauthServer(file, text) {
  const keys = readConfigTables(text, (table) => table === 'auth.oauth_server');
  const flags = {};
  for (const key of ['enabled', 'allow_dynamic_registration']) {
    const value = keys.get(`auth.oauth_server/${key}`);
    if (typeof value !== 'boolean')
      throw new ProbeInputError(file, `[auth.oauth_server] sets ${key} to no boolean the line read can read, or twice`);
    flags[key] = value;
  }
  return flags;
}

/** The value `readConfigTables` records for a key whose value cannot be read, or that is written twice. */
export const UNREADABLE = Symbol('unreadable');

/**
 * The keys of the `config.toml` tables a predicate selects, read by `readConfig` after each table header is written in its plain form. A key that `readConfig` reports as a problem, such as one whose value form cannot be read exactly or one written twice in one table, is recorded as `UNREADABLE`, so that only a reader that needs that key fails on it.
 *
 * @param wanted - Whether a table, by its plain name, is read.
 * @returns A map from `<table>/<key>` to the value or `UNREADABLE`.
 */
export function readConfigTables(text, wanted) {
  const { keys, problems } = readConfig(plainHeaders(text).text, { inTables: wanted });
  for (const { id } of problems) keys.set(id, UNREADABLE);
  return keys;
}

/**
 * The functions of the repository: each directory of the functions directory that holds an `index.ts`, with the `verify_jwt` its `[functions.<slug>]` table of config.toml declares, `true` when the table or the key is absent.
 *
 * @returns `[{ slug, verifyJwt }]`, sorted by slug.
 * @throws ProbeInputError when the directory cannot be read or holds no function, or a declared `verify_jwt` is not a
 *   boolean.
 */
export function readFunctions(repoRoot, config) {
  const dir = path.join(repoRoot, EXPECTED_PATHS.functions);
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    throw new ProbeInputError(display(repoRoot, dir), `could not be read (${error.code ?? error.name})`);
  }
  const slugs = entries
    .filter((entry) => entry.isDirectory() && existsSync(path.join(dir, entry.name, 'index.ts')))
    .map((entry) => entry.name)
    .sort();
  if (slugs.length === 0) throw new ProbeInputError(display(repoRoot, dir), 'holds no directory with an index.ts');
  const declared = readConfigTables(config.text, (table) => table.startsWith('functions.'));
  return slugs.map((slug) => {
    const value = declared.get(`functions.${slug}/verify_jwt`);
    if (value !== undefined && typeof value !== 'boolean')
      throw new ProbeInputError(
        config.file,
        `[functions.${slug}] sets verify_jwt to no boolean the line read can read, or twice`
      );
    return { slug, verifyJwt: value ?? true };
  });
}

const BUCKET_TABLE = /^storage\.buckets\.([A-Za-z0-9_-]+)$/;

/**
 * The storage buckets config.toml declares: one per `[storage.buckets.<id>]` table, with its `public` flag.
 *
 * @returns `[{ id, public }]`, sorted by id.
 * @throws ProbeInputError when no bucket is declared or a bucket's `public` is not a boolean the line read can read.
 */
export function readBuckets(file, text) {
  const ids = new Set();
  for (const line of text.split('\n')) {
    const header = TABLE_HEADER.exec(line);
    const name = header ? plainTableName(header[1]) : null;
    const bucket = name === null ? null : BUCKET_TABLE.exec(name);
    if (bucket) ids.add(bucket[1]);
  }
  if (ids.size === 0) throw new ProbeInputError(file, 'declares no [storage.buckets.<id>] table');
  const keys = readConfigTables(text, (table) => BUCKET_TABLE.test(table));
  return [...ids].sort().map((id) => {
    const value = keys.get(`storage.buckets.${id}/public`);
    if (typeof value !== 'boolean')
      throw new ProbeInputError(file, `[storage.buckets.${id}] sets public to no boolean the line read can read`);
    return { id, public: value };
  });
}

const ANON_TIMEOUT = /ALTER ROLE anon SET statement_timeout (?:=|TO) '([^']*)'/gi;

/**
 * The `statement_timeout` the migrations set for `anon`: the value of the last `ALTER ROLE anon SET statement_timeout = '<value>'` among the migrations, read in filename order with whitespace collapsed, so that a statement written over several lines is found.
 *
 * @throws ProbeInputError when the directory cannot be read or no migration sets it.
 */
export function readAnonTimeout(repoRoot) {
  const dir = path.join(repoRoot, EXPECTED_PATHS.migrations);
  let files;
  try {
    files = readdirSync(dir)
      .filter((name) => name.endsWith('.sql'))
      .sort();
  } catch (error) {
    throw new ProbeInputError(display(repoRoot, dir), `could not be read (${error.code ?? error.name})`);
  }
  let value = null;
  for (const name of files) {
    const text = readText(repoRoot, path.join(dir, name)).text.replace(/\s+/g, ' ');
    for (const match of text.matchAll(ANON_TIMEOUT)) value = match[1];
  }
  if (value === null)
    throw new ProbeInputError(display(repoRoot, dir), 'no migration sets ALTER ROLE anon SET statement_timeout');
  return value;
}

/**
 * `major_version` of the `[db]` table of config.toml.
 *
 * @throws ProbeInputError when it is missing or is not an integer the line read can read.
 */
export function readPostgresMajor(file, text) {
  const value = readConfigTables(text, (table) => table === 'db').get('db/major_version');
  if (!Number.isInteger(value))
    throw new ProbeInputError(file, '[db] sets major_version to no integer the line read can read, or twice');
  return value;
}

const HOOK_URI = /^pg-functions:\/\/postgres\/([^/]+)\/([^/]+)$/;
const SQL_NAME = /^[a-z_][a-z0-9_]*$/;

/**
 * The signature `<schema>.<name>(jsonb)` of the database function a hook URI `pg-functions://postgres/<schema>/<name>` names. The schema and the name are written into SQL, so each must be a plain lower-case identifier.
 *
 * @throws ProbeInputError when the URI is not of that form.
 */
export function hookSignature(file, field, uri) {
  const match = typeof uri === 'string' ? HOOK_URI.exec(uri) : null;
  if (match === null || !SQL_NAME.test(match[1]) || !SQL_NAME.test(match[2]))
    throw new ProbeInputError(
      file,
      `${field} is not pg-functions://postgres/<schema>/<name> with a plain lower-case schema and name`
    );
  return `${match[1]}.${match[2]}(jsonb)`;
}
