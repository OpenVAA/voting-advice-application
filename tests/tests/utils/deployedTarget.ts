import fs from 'fs';
import path from 'path';
import { CALLER_LIMIT } from './callerLimitProbe';
import { describeServedProject, SERVED_PROJECT_PLACEHOLDER } from '../support/servedProject';

export { extractServedProjectId } from '../support/servedProject';

/**
 * The deployed-target gate: the identity checks a smoke run against a deployed application must pass before any spec runs.
 *
 * The module is pure. It reads no process environment of its own and has no top-level side effect: the caller passes the environment, the target address and the repository root in. The deployment is chosen by its key, `SMOKE_DEPLOYMENT`, which defaults to `staging`. The expected Supabase ref and project id, the one origin the contestant's credentials may be sent to, and the target when `SMOKE_BASE_URL` is unset, are read only from the committed Supabase tfvars of that deployment, so no input can name a target its tfvars does not.
 */

/** The deployment a smoke run targets when `SMOKE_DEPLOYMENT` is unset or blank. */
export const DEFAULT_SMOKE_DEPLOYMENT = 'staging';

/** The name of the one Playwright project the deployed smoke configuration may hold. */
export const SMOKE_PROJECT_NAME = 'deployed-smoke';

/** The first words of every gate failure message. */
export const DEPLOYED_GATE_HEADLINE = 'DEPLOYED SMOKE GATE FAILED';

/** Environment variables whose non-blank value fails the gate: a smoke run holds no privileged key, no Management API token and no database password. */
export const FORBIDDEN_KEY_VARIABLES = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SECRET_KEY',
  'SUPABASE_ACCESS_TOKEN',
  'SUPABASE_DB_PASSWORD',
  'TF_VAR_database_password',
  'PGPASSWORD'
] as const;

/** The gate's checks, in the order they are evaluated and reported. */
export const GATE_CHECK_ORDER = ['service-role-key-absent', 'origin', 'sha', 'ref', 'project-id'] as const;

/** The environment the gate reads, passed in by the caller. */
export type GateEnv = Readonly<Record<string, string | undefined>>;

/** The name of one gate check. */
export type GateCheckName = (typeof GATE_CHECK_ORDER)[number];

/** One evaluated check: whether it passed, what was observed and what was expected. */
export type GateCheck = {
  name: GateCheckName;
  pass: boolean;
  observed: string;
  expected: string;
};

/** The identity of the dedicated Supabase project, as the committed tfvars names it. */
export type DedicatedTarget = {
  projectRef: string;
  publicProjectId: string;
};

/** A fetched document: its status, its body and the URL that answered after any redirect, or the reason the request failed. */
export type FetchedDocument = { status: number; body: string; url: string } | { error: string };

/**
 * Reads the key of the deployment a smoke run targets, `SMOKE_DEPLOYMENT`.
 *
 * @param env - The environment to read.
 * @returns The trimmed key, or {@link DEFAULT_SMOKE_DEPLOYMENT} when the variable is unset or blank.
 * @throws `SMOKE INPUT INVALID: SMOKE_DEPLOYMENT must be a deployment key …` unless the value is a lower-case letter followed by lower-case letters, digits and hyphens, at most 15 characters in all.
 */
export function readSmokeDeployment(env: GateEnv): string {
  const value = (env.SMOKE_DEPLOYMENT ?? '').trim();
  if (value === '') return DEFAULT_SMOKE_DEPLOYMENT;
  if (!DEPLOYMENT_KEY_PATTERN.test(value) || value.length > DEPLOYMENT_KEY_MAX_LENGTH) {
    throw new Error(
      `SMOKE INPUT INVALID: SMOKE_DEPLOYMENT must be a deployment key of lower-case letters, digits and hyphens, at most ${DEPLOYMENT_KEY_MAX_LENGTH} characters, got ${JSON.stringify(value)}`
    );
  }
  return value;
}

/**
 * Names the committed tfvars of a deployment's Supabase project.
 *
 * @param key - The deployment key, as {@link readSmokeDeployment} returns it.
 * @returns The path relative to the repository root, `infra/envs/<key>/supabase/terraform.tfvars`.
 */
export function dedicatedSupabaseTfvars(key: string): string {
  return `infra/envs/${key}/supabase/terraform.tfvars`;
}

/**
 * The address a smoke run targets.
 *
 * @param env - The environment to read: `SMOKE_BASE_URL` and `SMOKE_DEPLOYMENT`.
 * @param repoRoot - The repository root, under which the deployment's tfvars is read.
 * @returns `SMOKE_BASE_URL` when it is set and not blank, otherwise `public_origin` of the Supabase tfvars of the deployment `SMOKE_DEPLOYMENT` names.
 * @throws When the deployment key is invalid, or when its tfvars is missing or names no https `public_origin`.
 */
export function smokeBaseUrl(env: GateEnv, repoRoot: string): string {
  const deployment = readSmokeDeployment(env);
  const baseURL = env.SMOKE_BASE_URL ?? '';
  if (baseURL.trim() !== '') return baseURL;
  const tfvarsPath = dedicatedSupabaseTfvars(deployment);
  return readPublicOrigin(readDeploymentTfvars(repoRoot, tfvarsPath), tfvarsPath);
}

/** The outcome of one gate run. */
export type GateResult = {
  /** Every check, in {@link GATE_CHECK_ORDER}. */
  checks: Array<GateCheck>;
  /** One line per check, as {@link formatGateLine} writes it. */
  lines: Array<string>;
  /** The number of failed checks. */
  failed: number;
  /** The identity the checks were evaluated against. */
  dedicated: DedicatedTarget;
};

/**
 * Runs the gate against a deployed target.
 *
 * It reads the dedicated identity from the Supabase tfvars of `deployment` under `repoRoot`, requests `/api/health` and `/` of `baseURL` and evaluates every check. A refused connection or a timed-out request becomes a FAIL line for each check that needed it. A base URL that does not parse, or that carries user info, is not requested at all, and every check that needed it fails. It writes nothing and requests no other path.
 *
 * @param options - `env`, the environment to read; `baseURL`, the target; `repoRoot`, the repository root; `deployment`, the deployment key, by default the one `SMOKE_DEPLOYMENT` of `env` names; `fetchImpl`, the fetch to use; `timeoutMs`, the timeout of each request.
 * @returns The checks, their lines, the number of failures and the dedicated identity.
 * @throws When the deployment key is invalid, or when its tfvars cannot be read or does not name a valid identity.
 */
export async function runDeployedGate({
  env,
  baseURL,
  repoRoot,
  deployment = readSmokeDeployment(env),
  fetchImpl = globalThis.fetch,
  timeoutMs = 30_000
}: {
  env: GateEnv;
  baseURL: string;
  repoRoot: string;
  deployment?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): Promise<GateResult> {
  const tfvarsPath = dedicatedSupabaseTfvars(deployment);
  const dedicated = readDedicatedTarget(readDeploymentTfvars(repoRoot, tfvarsPath), tfvarsPath);
  const { url } = readTarget(baseURL);
  const [health, page]: Array<FetchedDocument> =
    url === null
      ? [{ error: NOT_REQUESTED }, { error: NOT_REQUESTED }]
      : await Promise.all([
          fetchDocument(fetchImpl, new URL('/api/health', url), timeoutMs),
          fetchDocument(fetchImpl, new URL('/', url), timeoutMs)
        ]);
  const checks = evaluateGate({ env, baseURL, health, page, dedicated });
  return {
    checks,
    lines: checks.map(formatGateLine),
    failed: checks.filter((check) => !check.pass).length,
    dedicated
  };
}

/**
 * Evaluates all five checks, in {@link GATE_CHECK_ORDER}.
 *
 * The page body is read whatever its status, so a server's error page still shows its identity. A document answered from another origin than the base URL's fails the origin check and every check that read it.
 *
 * @param input - The environment, the base URL, the fetched health answer and page, and the dedicated identity.
 * @returns The five checks.
 */
export function evaluateGate({
  env,
  baseURL,
  health,
  page,
  dedicated
}: {
  env: GateEnv;
  baseURL: string;
  health: FetchedDocument;
  page: FetchedDocument;
  dedicated: DedicatedTarget;
}): Array<GateCheck> {
  const target = readTarget(baseURL);
  const targetPage = fromTarget(page, target);
  return [
    serviceRoleKeyCheck(env),
    originCheck(target, health, page),
    shaCheck(env, fromTarget(health, target)),
    refCheck(targetPage, dedicated),
    projectIdCheck(targetPage, dedicated)
  ];
}

/**
 * Writes the message a failed gate run throws.
 *
 * @param result - The gate run.
 * @returns The headline with the failure count, each FAIL line indented by two spaces, and a pointer to the runbook.
 */
export function gateFailureMessage(result: GateResult): string {
  const failLines = result.checks.filter((check) => !check.pass).map((check) => `  ${formatGateLine(check)}`);
  return [
    `${DEPLOYED_GATE_HEADLINE} — ${result.failed} of ${result.checks.length} checks failed`,
    ...failLines,
    'See tests/README.md § Deployed smoke run.'
  ].join('\n');
}

/**
 * Writes one check as a line.
 *
 * @param check - The evaluated check.
 * @returns `PASS <name>` or `FAIL <name>: observed <observed>, expected <expected>`.
 */
export function formatGateLine(check: GateCheck): string {
  return check.pass
    ? `PASS ${check.name}`
    : `FAIL ${check.name}: observed ${check.observed}, expected ${check.expected}`;
}

function serviceRoleKeyCheck(env: GateEnv): GateCheck {
  const set = FORBIDDEN_KEY_VARIABLES.filter((name) => (env[name] ?? '').trim() !== '');
  return {
    name: 'service-role-key-absent',
    pass: set.length === 0,
    observed: set.length === 0 ? 'unset' : set.map((name) => `${name} is set (value withheld)`).join(', '),
    expected: 'unset'
  };
}

function originCheck(target: TargetReading, health: FetchedDocument, page: FetchedDocument): GateCheck {
  const strays = (
    [
      ['/api/health', health],
      ['/', page]
    ] as const
  ).flatMap(([requested, document]) => {
    const answered = foreignOrigin(document, target);
    return answered === null ? [] : [`${requested} answered from ${answered}`];
  });
  const head = target.refusal ?? target.url?.origin ?? '(no base URL)';
  return {
    name: 'origin',
    pass: target.refusal === null && strays.length === 0,
    observed: [head, ...strays].join('; '),
    expected: ORIGIN_EXPECTED
  };
}

function shaCheck(env: GateEnv, health: FetchedDocument): GateCheck {
  const expectedSha = env.SMOKE_EXPECTED_SHA;
  const expectedValid = typeof expectedSha === 'string' && SHA_PATTERN.test(expectedSha);
  const { build, observed } = servedBuild(health);
  return {
    name: 'sha',
    pass: expectedValid && build !== null && build === expectedSha,
    observed,
    expected: expectedValid ? expectedSha : '(SMOKE_EXPECTED_SHA is not a full 40-hex commit id)'
  };
}

function refCheck(page: FetchedDocument, dedicated: DedicatedTarget): GateCheck {
  const expected = `${dedicated.projectRef} (https://${dedicated.projectRef}${SUPABASE_HOST_SUFFIX})`;
  if ('error' in page) {
    return { name: 'ref', pass: false, observed: `(request to / failed: ${page.error})`, expected };
  }
  const { ref, observed } = servedSupabaseRef(extractServedEnv(page.body));
  return { name: 'ref', pass: ref !== null && ref === dedicated.projectRef, observed, expected };
}

function projectIdCheck(page: FetchedDocument, dedicated: DedicatedTarget): GateCheck {
  const expected = dedicated.publicProjectId;
  if ('error' in page) {
    return { name: 'project-id', pass: false, observed: `(request to / failed: ${page.error})`, expected };
  }
  const reading = describeServedProject(page.body);
  const observed =
    reading.kind === 'absent'
      ? '(attribute absent)'
      : reading.kind === 'placeholder'
        ? `(unsubstituted ${SERVED_PROJECT_PLACEHOLDER} placeholder)`
        : reading.projectId;
  return { name: 'project-id', pass: reading.kind === 'served' && reading.projectId === expected, observed, expected };
}

/**
 * Reads the dedicated project's identity from the text of a deployment's Supabase tfvars.
 *
 * A key counts only on a line whose first non-blank characters are the key, followed by `=` and a double-quoted value; a commented-out line does not count.
 *
 * @param tfvarsText - The text of the tfvars file.
 * @param tfvarsPath - The file's path relative to the repository root, named in every error.
 * @returns The project ref and the public project id.
 * @throws When either key is missing or repeated, when `project_ref` is not 20 lower-case letters, or when `public_project_id` is not a canonical lower-case uuid.
 */
export function readDedicatedTarget(tfvarsText: string, tfvarsPath: string): DedicatedTarget {
  const projectRef = readTfvarsValue(tfvarsText, 'project_ref', tfvarsPath);
  const publicProjectId = readTfvarsValue(tfvarsText, 'public_project_id', tfvarsPath);
  if (!PROJECT_REF_PATTERN.test(projectRef)) {
    throw new Error(`project_ref in ${tfvarsPath} is not 20 lower-case letters: ${projectRef}`);
  }
  if (!CANONICAL_UUID_PATTERN.test(publicProjectId)) {
    throw new Error(`public_project_id in ${tfvarsPath} is not a canonical lower-case uuid: ${publicProjectId}`);
  }
  return { projectRef, publicProjectId };
}

/**
 * Reads the origin a deployment is served at from the text of its Supabase tfvars.
 *
 * @param tfvarsText - The text of the tfvars file.
 * @param tfvarsPath - The file's path relative to the repository root, named in every error.
 * @returns `public_origin`, an https origin.
 * @throws When the key is missing or repeated, or when its value is not `https://` followed by a host and an optional port alone.
 */
export function readPublicOrigin(tfvarsText: string, tfvarsPath: string): string {
  const publicOrigin = readTfvarsValue(tfvarsText, 'public_origin', tfvarsPath);
  if (!PUBLIC_ORIGIN_PATTERN.test(publicOrigin)) {
    throw new Error(`public_origin in ${tfvarsPath} is not an https origin: ${publicOrigin}`);
  }
  return new URL(publicOrigin).origin;
}

/**
 * Extracts the public environment SvelteKit serves inline with a page.
 *
 * @param html - The served document.
 * @returns The parsed `env` object, or `null` when the document has no `env:` line, the line is `env: null`, its value is not JSON or is not a plain object.
 */
export function extractServedEnv(html: string): Record<string, unknown> | null {
  const match = ENV_LINE_PATTERN.exec(html);
  if (!match) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(match[1]);
  } catch {
    return null;
  }
  return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : null;
}

/**
 * Reads the Supabase ref the served environment points at.
 *
 * @param env - The served environment, as {@link extractServedEnv} returns it.
 * @returns `ref`, non-null only when `PUBLIC_SUPABASE_URL` is exactly `https://<one label>.supabase.co` with an empty or `/` path, and `observed`, the URL as read or a parenthesised reason it could not be.
 */
export function servedSupabaseRef(env: Record<string, unknown> | null): { ref: string | null; observed: string } {
  if (env === null) return { ref: null, observed: '(no env block in the served document)' };
  if (!('PUBLIC_SUPABASE_URL' in env))
    return { ref: null, observed: '(PUBLIC_SUPABASE_URL absent from the env block)' };
  const value = env.PUBLIC_SUPABASE_URL;
  if (typeof value !== 'string') return { ref: null, observed: '(PUBLIC_SUPABASE_URL is not a string)' };
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ref: null, observed: `(unparsable URL: ${value})` };
  }
  const refused = { ref: null, observed: `${value} (not https://<ref>.supabase.co)` };
  if (url.protocol !== 'https:') return refused;
  if (url.port !== '' || url.username !== '' || url.password !== '' || url.search !== '' || url.hash !== '') {
    return refused;
  }
  if (url.pathname !== '' && url.pathname !== '/') return refused;
  if (!url.hostname.endsWith(SUPABASE_HOST_SUFFIX)) return refused;
  const label = url.hostname.slice(0, -SUPABASE_HOST_SUFFIX.length);
  if (!DNS_LABEL_PATTERN.test(label)) return refused;
  return { ref: label, observed: value };
}

function servedBuild(health: FetchedDocument): { build: string | null; observed: string } {
  if ('error' in health) return { build: null, observed: `(request to /api/health failed: ${health.error})` };
  if (health.status !== 200) return { build: null, observed: `(status ${health.status})` };
  let parsed: unknown;
  try {
    parsed = JSON.parse(health.body);
  } catch {
    return { build: null, observed: '(body is not JSON)' };
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { build: null, observed: '(body is not JSON)' };
  }
  const build = (parsed as Record<string, unknown>).build;
  if (typeof build !== 'string') return { build: null, observed: '(no build field)' };
  return { build, observed: build };
}

/**
 * The line global setup prints before the gate's check lines, naming the target with its user info withheld.
 *
 * @param baseURL - The target the gate is about to check.
 * @returns `DEPLOYED SMOKE GATE <baseURL>`. A URL with user info is printed without it and with a note, and a value that is not an absolute URL is not printed.
 */
export function gateTargetLine(baseURL: string): string {
  const url = parseURL(baseURL);
  if (url === null) return 'DEPLOYED SMOKE GATE (not an absolute URL, value withheld)';
  if (url.username === '' && url.password === '') return `DEPLOYED SMOKE GATE ${baseURL}`;
  url.username = '';
  url.password = '';
  return `DEPLOYED SMOKE GATE ${url.href} (user info withheld)`;
}

/**
 * Refuses to send the contestant's credentials to any origin but the dedicated deployment's.
 *
 * The gate accepts any https target that serves the dedicated identity, which a proxy in front of that deployment can do too. The contestant spec therefore calls this before any page action.
 *
 * @param baseURL - The target the spec drives.
 * @param repoRoot - The repository root, under which the deployment's Supabase tfvars is read.
 * @param deployment - The deployment key, as {@link readSmokeDeployment} returns it.
 * @throws `SMOKE TARGET REFUSED: …`, naming `public_origin`, its tfvars and the base URL's origin without its user info, unless the two origins are equal; or when the tfvars is missing or names no https `public_origin`.
 */
export function requireCredentialOrigin(baseURL: string | undefined, repoRoot: string, deployment: string): void {
  const tfvarsPath = dedicatedSupabaseTfvars(deployment);
  const publicOrigin = readPublicOrigin(readDeploymentTfvars(repoRoot, tfvarsPath), tfvarsPath);
  const origin = baseURL === undefined ? '(none)' : (parseURL(baseURL)?.origin ?? '(not an absolute URL)');
  if (origin !== publicOrigin) {
    throw new Error(
      `SMOKE TARGET REFUSED: the contestant's credentials are sent only to ${publicOrigin}, public_origin of ${tfvarsPath}; the base URL's origin is ${origin}`
    );
  }
}

/** The parts of a resolved Playwright project entry the smoke configuration's shape check reads. */
export type SmokeProjectShape = {
  name?: string;
  dependencies?: ReadonlyArray<string>;
  teardown?: string;
  testMatch?: string | RegExp | ReadonlyArray<string | RegExp>;
};

/**
 * Refuses a deployed smoke configuration whose projects could run anything but the read-mostly smoke specs.
 *
 * It reads the project entries only. The configuration's own `testDir` and `testMatch`, which decide the files collected, are pinned by `deployedSmokeGuards.test.ts`.
 *
 * @param projects - The resolved project entries of the configuration.
 * @throws `DEPLOYED SMOKE CONFIG REFUSED: <reason>`, naming the offending project, unless there is exactly one project, named {@link SMOKE_PROJECT_NAME}, with no dependencies, no teardown, and neither its name nor its `testMatch` mentioning setup or teardown.
 */
export function assertSmokeProjects(projects: ReadonlyArray<SmokeProjectShape>): void {
  const refuse = (reason: string): never => {
    throw new Error(`DEPLOYED SMOKE CONFIG REFUSED: ${reason}`);
  };
  if (projects.length !== 1) {
    const names = projects.map((project) => project.name ?? '(unnamed)').join(', ');
    refuse(
      `expected exactly one project named ${SMOKE_PROJECT_NAME}, found ${projects.length}${names ? ` (${names})` : ''}`
    );
  }
  const [project] = projects;
  const name = project.name ?? '(unnamed)';
  if (/setup|teardown/i.test(name)) refuse(`project ${name} names a setup or teardown`);
  if (project.testMatch !== undefined && /setup|teardown/i.test(String(project.testMatch))) {
    refuse(`project ${name} matches setup or teardown files: ${String(project.testMatch)}`);
  }
  if (name !== SMOKE_PROJECT_NAME) refuse(`project ${name} is not named ${SMOKE_PROJECT_NAME}`);
  if (project.dependencies !== undefined && project.dependencies.length > 0) {
    refuse(`project ${name} has dependencies: ${project.dependencies.join(', ')}`);
  }
  if (project.teardown !== undefined && project.teardown !== '') {
    refuse(`project ${name} has a teardown: ${project.teardown}`);
  }
}

/**
 * Reads named inputs of a smoke spec from the environment.
 *
 * @param names - The variable names, in the order a missing-input message lists them.
 * @param env - The environment to read.
 * @returns A record of each name and its value.
 * @throws `SMOKE INPUT MISSING: <names> (read from the environment only, never printed)`, naming every unset or blank variable and holding no value.
 */
export function requireSmokeInputs(names: ReadonlyArray<string>, env: GateEnv): Record<string, string> {
  const missing = names.filter((name) => (env[name] ?? '').trim() === '');
  if (missing.length > 0) {
    throw new Error(`SMOKE INPUT MISSING: ${missing.join(', ')} (read from the environment only, never printed)`);
  }
  return Object.fromEntries(names.map((name) => [name, env[name] ?? '']));
}
/**
 * Reads the per-caller limit the deployed project is expected to enforce, `SMOKE_ACCESS_CALLER_MAX`. The smoke cannot read `private.deployment_settings.access_caller_max` over the public API, so a deployment that sets it away from its default names the same value here.
 *
 * @param env - The environment to read.
 * @returns The value as a number, or {@link CALLER_LIMIT} when the variable is unset or blank.
 * @throws `SMOKE INPUT INVALID: SMOKE_ACCESS_CALLER_MAX must be a whole number of at least 1, got <value>` for any other value.
 */
export function readSmokeAccessCallerMax(env: GateEnv): number {
  const value = (env.SMOKE_ACCESS_CALLER_MAX ?? '').trim();
  if (value === '') return CALLER_LIMIT;
  if (!/^[1-9][0-9]*$/.test(value) || !Number.isSafeInteger(Number(value))) {
    throw new Error(
      `SMOKE INPUT INVALID: SMOKE_ACCESS_CALLER_MAX must be a whole number of at least 1, got ${JSON.stringify(value)}`
    );
  }
  return Number(value);
}

/** Escapes a string for use inside a regular expression. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** The single double-quoted value of `key` in the tfvars text, or a thrown Error naming the key and the file. */
function readTfvarsValue(tfvarsText: string, key: string, tfvarsPath: string): string {
  const pattern = new RegExp(`^[ \\t]*${escapeRegExp(key)}[ \\t]*=[ \\t]*"([^"]*)"`, 'gm');
  const values = [...tfvarsText.matchAll(pattern)].map((match) => match[1]);
  if (values.length !== 1) {
    throw new Error(`${key} must occur exactly once in ${tfvarsPath}, found ${values.length} occurrence(s)`);
  }
  return values[0];
}

/** The text of a deployment's tfvars under `repoRoot`, or a thrown Error naming its path. */
function readDeploymentTfvars(repoRoot: string, tfvarsPath: string): string {
  try {
    return fs.readFileSync(path.join(repoRoot, tfvarsPath), 'utf8');
  } catch (error) {
    throw new Error(`the deployment's Supabase tfvars ${tfvarsPath} cannot be read: ${describeRequestError(error)}`, {
      cause: error
    });
  }
}

/** The parsed URL, or `null` when the value is not an absolute URL. */
function parseURL(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/** The base URL as the gate reads it: the parsed URL when requests may be made to it, and why the origin check refuses it, if it does. */
type TargetReading = { url: URL | null; refusal: string | null };

function readTarget(baseURL: string): TargetReading {
  const url = parseURL(baseURL);
  if (url === null) return { url: null, refusal: `(not an absolute URL: ${baseURL})` };
  if (url.username !== '' || url.password !== '') {
    return { url: null, refusal: '(the base URL carries user info, value withheld)' };
  }
  if (url.protocol === 'https:' || (url.protocol === 'http:' && LOOPBACK_HOSTS.has(url.hostname))) {
    return { url, refusal: null };
  }
  return { url, refusal: `${url.origin} (not https, and not http on a loopback host)` };
}

/** The origin a fetched document was answered from when it differs from the target's, else `null`. */
function foreignOrigin(document: FetchedDocument, target: TargetReading): string | null {
  if ('error' in document || target.url === null) return null;
  const answered = parseURL(document.url)?.origin ?? `(unreadable response URL: ${document.url})`;
  return answered === target.url.origin ? null : answered;
}

/** The document a check reads: the fetched one, or a failed request when it was answered from another origin. */
function fromTarget(document: FetchedDocument, target: TargetReading): FetchedDocument {
  const answered = foreignOrigin(document, target);
  return answered === null ? document : { error: `answered from another origin, ${answered}` };
}

/** The reason a request failed, with the underlying system error code when there is one. */
function describeRequestError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const cause = (error as Error & { cause?: unknown }).cause;
  const code =
    typeof cause === 'object' && cause !== null && 'code' in cause && typeof cause.code === 'string'
      ? cause.code
      : null;
  return code === null ? error.message : `${error.message} (${code})`;
}

async function fetchDocument(fetchImpl: typeof fetch, url: URL, timeoutMs: number): Promise<FetchedDocument> {
  try {
    const response = await fetchImpl(url, { redirect: 'follow', signal: AbortSignal.timeout(timeoutMs) });
    if (response.url === '') return { error: 'the response names no URL' };
    return { status: response.status, body: await response.text(), url: response.url };
  } catch (error) {
    return { error: describeRequestError(error) };
  }
}

const SHA_PATTERN = /^[0-9a-f]{40}$/;
const DEPLOYMENT_KEY_PATTERN = /^[a-z][a-z0-9-]*$/;
const DEPLOYMENT_KEY_MAX_LENGTH = 15;
const PROJECT_REF_PATTERN = /^[a-z]{20}$/;
const CANONICAL_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const DNS_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const SUPABASE_HOST_SUFFIX = '.supabase.co';
const ENV_LINE_PATTERN = /^[ \t]*env: (.*\})[ \t]*,?[ \t\r]*$/m;
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
const PUBLIC_ORIGIN_PATTERN = /^https:\/\/[^/?#\s]+$/;
const ORIGIN_EXPECTED =
  'an https origin, or http on a loopback host, with no user info, that answers /api/health and / itself';
const NOT_REQUESTED = 'not requested, the origin check refused the base URL';
