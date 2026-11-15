import fs from 'fs';
import path from 'path';

/**
 * The deployed-target gate: the identity checks a smoke run against a deployed application must pass before any spec runs.
 *
 * The module is pure. It reads no process environment of its own and has no top-level side effect: the caller passes the environment, the target address and the repository root in. The expected Supabase ref and project id are read only from the committed tfvars of the dedicated project, so no input can name another target.
 */

/** Path, relative to the repository root, of the committed tfvars that names the dedicated Supabase project. */
export const DEDICATED_SUPABASE_TFVARS = 'infra/envs/staging/supabase/terraform.tfvars';

/** The deployed application a smoke run targets when no other address is given. */
export const DEFAULT_SMOKE_BASE_URL = 'https://staging.openvaa.org';

/** The name of the one Playwright project the deployed smoke configuration may hold. */
export const SMOKE_PROJECT_NAME = 'deployed-smoke';

/** The first words of every gate failure message. */
export const DEPLOYED_GATE_HEADLINE = 'DEPLOYED SMOKE GATE FAILED';

/** Environment variables whose non-blank value fails the gate: a smoke run holds no privileged key. */
export const FORBIDDEN_KEY_VARIABLES = ['SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY'] as const;

/** The gate's checks, in the order they are evaluated and reported. */
export const GATE_CHECK_ORDER = ['service-role-key-absent', 'sha', 'ref', 'project-id'] as const;

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

/** A fetched document: its status and body, or the reason the request failed. */
export type FetchedDocument = { status: number; body: string } | { error: string };

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

const SHA_PATTERN = /^[0-9a-f]{40}$/;
const PROJECT_REF_PATTERN = /^[a-z]{20}$/;
const CANONICAL_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const DNS_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const SUPABASE_HOST_SUFFIX = '.supabase.co';
const SERVED_PROJECT_ATTRIBUTE = 'data-project-id';
const SERVED_PROJECT_PLACEHOLDER = '%projectId%';
const ENV_LINE_PATTERN = /^[ \t]*env: (.*\})[ \t]*,?[ \t\r]*$/m;

/** Escapes a string for use inside a regular expression. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** The single double-quoted value of `key` in the tfvars text, or a thrown Error naming the key and the file. */
function readTfvarsValue(tfvarsText: string, key: string): string {
  const pattern = new RegExp(`^[ \\t]*${escapeRegExp(key)}[ \\t]*=[ \\t]*"([^"]*)"`, 'gm');
  const values = [...tfvarsText.matchAll(pattern)].map((match) => match[1]);
  if (values.length !== 1) {
    throw new Error(
      `${key} must occur exactly once in ${DEDICATED_SUPABASE_TFVARS}, found ${values.length} occurrence(s)`
    );
  }
  return values[0];
}

/**
 * Reads the dedicated project's identity from the text of {@link DEDICATED_SUPABASE_TFVARS}.
 *
 * A key counts only on a line whose first non-blank characters are the key, followed by `=` and a double-quoted value; a commented-out line does not count.
 *
 * @param tfvarsText - The text of the tfvars file.
 * @returns The project ref and the public project id.
 * @throws When either key is missing or repeated, when `project_ref` is not 20 lower-case letters, or when `public_project_id` is not a canonical lower-case uuid.
 */
export function readDedicatedTarget(tfvarsText: string): DedicatedTarget {
  const projectRef = readTfvarsValue(tfvarsText, 'project_ref');
  const publicProjectId = readTfvarsValue(tfvarsText, 'public_project_id');
  if (!PROJECT_REF_PATTERN.test(projectRef)) {
    throw new Error(`project_ref in ${DEDICATED_SUPABASE_TFVARS} is not 20 lower-case letters: ${projectRef}`);
  }
  if (!CANONICAL_UUID_PATTERN.test(publicProjectId)) {
    throw new Error(
      `public_project_id in ${DEDICATED_SUPABASE_TFVARS} is not a canonical lower-case uuid: ${publicProjectId}`
    );
  }
  return { projectRef, publicProjectId };
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

/**
 * Extracts the served project id from the `data-project-id` attribute.
 *
 * @param html - The served document.
 * @returns The attribute value, trimmed and lower-cased, or `null` when the document carries no such attribute.
 */
export function extractServedProjectId(html: string): string | null {
  const match = new RegExp(`${SERVED_PROJECT_ATTRIBUTE}="([^"]*)"`).exec(html);
  return match ? match[1].trim().toLowerCase() : null;
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
  const served = extractServedProjectId(page.body);
  const observed =
    served === null
      ? '(attribute absent)'
      : served === SERVED_PROJECT_PLACEHOLDER.toLowerCase()
        ? `(unsubstituted ${SERVED_PROJECT_PLACEHOLDER} placeholder)`
        : served;
  return { name: 'project-id', pass: served === expected, observed, expected };
}

/**
 * Evaluates all four checks, in {@link GATE_CHECK_ORDER}, none conditional on another.
 *
 * The page body is read whatever its status, so a server's error page still shows its identity.
 *
 * @param input - The environment, the fetched health answer and page, and the dedicated identity.
 * @returns The four checks.
 */
export function evaluateGate({
  env,
  health,
  page,
  dedicated
}: {
  env: GateEnv;
  health: FetchedDocument;
  page: FetchedDocument;
  dedicated: DedicatedTarget;
}): Array<GateCheck> {
  return [serviceRoleKeyCheck(env), shaCheck(env, health), refCheck(page, dedicated), projectIdCheck(page, dedicated)];
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
    return { status: response.status, body: await response.text() };
  } catch (error) {
    return { error: describeRequestError(error) };
  }
}

/**
 * Runs the gate against a deployed target.
 *
 * It reads the dedicated identity from {@link DEDICATED_SUPABASE_TFVARS} under `repoRoot`, requests `/api/health` and `/` of `baseURL` and evaluates every check. A refused connection or a timed-out request becomes a FAIL line for each check that needed it. It writes nothing and requests no other path.
 *
 * @param options - `env`, the environment to read; `baseURL`, the target; `repoRoot`, the repository root; `fetchImpl`, the fetch to use; `timeoutMs`, the timeout of each request.
 * @returns The checks, their lines, the number of failures and the dedicated identity.
 * @throws When the tfvars cannot be read or does not name a valid identity.
 */
export async function runDeployedGate({
  env,
  baseURL,
  repoRoot,
  fetchImpl = globalThis.fetch,
  timeoutMs = 30_000
}: {
  env: GateEnv;
  baseURL: string;
  repoRoot: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): Promise<GateResult> {
  const dedicated = readDedicatedTarget(fs.readFileSync(path.join(repoRoot, DEDICATED_SUPABASE_TFVARS), 'utf8'));
  const [health, page] = await Promise.all([
    fetchDocument(fetchImpl, new URL('/api/health', baseURL), timeoutMs),
    fetchDocument(fetchImpl, new URL('/', baseURL), timeoutMs)
  ]);
  const checks = evaluateGate({ env, health, page, dedicated });
  return {
    checks,
    lines: checks.map(formatGateLine),
    failed: checks.filter((check) => !check.pass).length,
    dedicated
  };
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
