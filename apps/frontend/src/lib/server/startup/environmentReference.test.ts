/**
 * Specification for the environment-variable reference of the docs site, `developers-guide/configuration/environmental-variables/+page.md`: it lists, each as a whole token in backticks, every name of the frontend task's environment list `infra/modules/frontend-service/task-environment.json`, every name of `REQUIRED_ENV`, every name of `ANALYTICS_ENV` and every name `infra/scripts/bootstrap.sql` reads with `\getenv`. A name written without backticks, or inside a longer backticked text, does not count. An absent page, an absent or malformed list, or a bootstrap script without a `\getenv` line is a problem naming that file. Every problem found names the variable or the file it concerns.
 *
 * @vitest-environment node
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ANALYTICS_ENV } from '$lib/server/analytics/config';
import { REQUIRED_ENV } from './requiredEnv';

/** The repository root, six directories above this file. */
const REPOSITORY_ROOT = fileURLToPath(new URL('../../../../../../', import.meta.url));

/** The reference page, relative to the repository root. */
const PAGE_PATH = 'apps/docs/src/routes/(content)/developers-guide/configuration/environmental-variables/+page.md';

/** The frontend task's environment list, relative to the repository root. */
const TASK_ENVIRONMENT_PATH = 'infra/modules/frontend-service/task-environment.json';

/** The bootstrap script, relative to the repository root. */
const BOOTSTRAP_PATH = 'infra/scripts/bootstrap.sql';

/** The four required names, restated locally so the fixture cases assert against the contract rather than against the implementation's own export. */
const REQUIRED_NAMES: ReadonlyArray<string> = [
  'PUBLIC_SUPABASE_URL',
  'PUBLIC_SUPABASE_ANON_KEY',
  'PUBLIC_PROJECT_ID',
  'ORIGIN'
];

/** The analytics names, restated locally for the same reason. */
const ANALYTICS_NAMES: ReadonlyArray<string> = [
  'ANALYTICS_PROVIDER',
  'ANALYTICS_CONSENT_MODE',
  'ANALYTICS_VISIT_ID_MODE',
  'ANALYTICS_POSTHOG_KEY',
  'ANALYTICS_POSTHOG_HOST',
  'ANALYTICS_FLUSH_INTERVAL_MS'
];

/** What {@link environmentReferenceProblems} checks. A file that does not exist is `undefined`. */
type EnvironmentReferenceInput = {
  /** The text of the reference page. */
  page: string | undefined;
  /** The parsed task environment list, `unknown` because it comes from a JSON file. */
  taskEnvironment: unknown;
  /** The text of the bootstrap script. */
  bootstrap: string | undefined;
  /** The names the start-up check refuses to start without. */
  requiredNames: ReadonlyArray<string>;
  /** The names the analytics configuration is read from. */
  analyticsNames: ReadonlyArray<string>;
};

/**
 * Whether a value is a plain object, so its fields can be read.
 *
 * @param value - The value to test.
 * @returns `true` for a non-null, non-array object.
 */
function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The texts the page writes in backticks, each whole, on one line.
 *
 * @param page - The page's text.
 * @returns The texts between a pair of backticks.
 */
function backtickedTokens(page: string): Set<string> {
  return new Set(Array.from(page.matchAll(/`([^`\n]+)`/g), (match) => match[1]));
}

/**
 * The names of the task environment list's entries.
 *
 * @param taskEnvironment - The parsed list.
 * @returns The names, or `undefined` when the list has no `variables` array.
 */
function taskEnvironmentNames(taskEnvironment: unknown): Array<string> | undefined {
  if (!isRecord(taskEnvironment) || !Array.isArray(taskEnvironment.variables)) return undefined;
  const entries: ReadonlyArray<unknown> = taskEnvironment.variables;
  return entries.flatMap((entry) => (isRecord(entry) && typeof entry.name === 'string' ? [entry.name] : []));
}

/**
 * The environment variables the bootstrap script reads: the second argument of every `\getenv` line.
 *
 * @param bootstrap - The script's text.
 * @returns The names, in the order the script reads them.
 */
function bootstrapEnvironmentNames(bootstrap: string): Array<string> {
  return Array.from(
    bootstrap.matchAll(/^\s*\\getenv\s+[A-Za-z_][A-Za-z0-9_]*\s+([A-Za-z_][A-Za-z0-9_]*)\s*$/gm),
    (match) => match[1]
  );
}

/**
 * List every name the reference page must list and does not, and every file that could not be read. It reads nothing but its arguments.
 *
 * @param input - The page, the list and the script, and the name sets, see {@link EnvironmentReferenceInput}.
 * @returns One string per problem, each naming the variable or the file it concerns, or an empty array when the page lists every name.
 */
function environmentReferenceProblems({
  page,
  taskEnvironment,
  bootstrap,
  requiredNames,
  analyticsNames
}: EnvironmentReferenceInput): Array<string> {
  const problems: Array<string> = [];
  const taskNames = taskEnvironmentNames(taskEnvironment);
  if (taskEnvironment === undefined) problems.push(`${TASK_ENVIRONMENT_PATH}: is missing`);
  else if (taskNames === undefined) problems.push(`${TASK_ENVIRONMENT_PATH}: has no \`variables\` array`);
  const bootstrapNames = bootstrap === undefined ? [] : bootstrapEnvironmentNames(bootstrap);
  if (bootstrap === undefined) problems.push(`${BOOTSTRAP_PATH}: is missing`);
  else if (bootstrapNames.length === 0) problems.push(`${BOOTSTRAP_PATH}: has no \\getenv line`);
  if (page === undefined) return [`${PAGE_PATH}: is missing`, ...problems];

  const listed = backtickedTokens(page);
  const names = new Set([...requiredNames, ...(taskNames ?? []), ...analyticsNames, ...bootstrapNames]);
  for (const name of names) {
    if (!listed.has(name)) problems.push(`${name}: is not listed in backticks on ${PAGE_PATH}`);
  }
  return problems;
}

/** A sound fixture task environment list: the required names, the proxy names and the analytics names. */
const SOUND_TASK_ENVIRONMENT = {
  variables: [...REQUIRED_NAMES, 'ADDRESS_HEADER', 'XFF_DEPTH', ...ANALYTICS_NAMES].map((name) => ({ name }))
};

/** A sound fixture bootstrap script, with the shape of the real one's reads. */
const SOUND_BOOTSTRAP = [
  '-- A fixture bootstrap script.',
  '\\unset project_id',
  '\\getenv project_id PUBLIC_PROJECT_ID',
  '\\getenv storage_url BOOTSTRAP_STORAGE_URL',
  '  \\getenv open_for_voters BOOTSTRAP_OPEN_FOR_VOTERS',
  ''
].join('\n');

/** Every name the sound fixtures make the page list. */
const SOUND_NAMES: ReadonlyArray<string> = [
  ...REQUIRED_NAMES,
  'ADDRESS_HEADER',
  'XFF_DEPTH',
  ...ANALYTICS_NAMES,
  'BOOTSTRAP_STORAGE_URL',
  'BOOTSTRAP_OPEN_FOR_VOTERS'
];

/**
 * Build a fixture page listing the given names, one per line, under a heading of their own and between sections that list none.
 *
 * @param names - The names the page lists.
 * @returns The page text.
 */
function pageListing(names: ReadonlyArray<string>): string {
  return [
    '# Environment variables',
    '',
    '## Required at start',
    '',
    ...names.map((name) => `- \`${name}\`: the fixture description of the variable.`),
    '',
    '## Local only',
    ''
  ].join('\n');
}

/**
 * Check a fixture page against the sound fixture list and script, with any input replaced.
 *
 * @param overrides - The inputs to use instead of the sound ones.
 * @returns The problems found.
 */
function fixtureProblems(overrides: Partial<EnvironmentReferenceInput> = {}): Array<string> {
  return environmentReferenceProblems({
    page: pageListing(SOUND_NAMES),
    taskEnvironment: SOUND_TASK_ENVIRONMENT,
    bootstrap: SOUND_BOOTSTRAP,
    requiredNames: REQUIRED_NAMES,
    analyticsNames: ANALYTICS_NAMES,
    ...overrides
  });
}

describe('the local contract', () => {
  it('agrees with REQUIRED_ENV and ANALYTICS_ENV', () => {
    expect([...REQUIRED_ENV]).toEqual([...REQUIRED_NAMES]);
    expect(Object.values(ANALYTICS_ENV)).toEqual([...ANALYTICS_NAMES]);
  });
});

describe('environmentReferenceProblems', () => {
  it('finds nothing on a page that lists every name', () => {
    expect(fixtureProblems()).toEqual([]);
  });

  it('names XFF_DEPTH and the page when the page leaves it out', () => {
    const problems = fixtureProblems({ page: pageListing(SOUND_NAMES.filter((name) => name !== 'XFF_DEPTH')) });
    expect(problems).toEqual([expect.stringContaining('XFF_DEPTH')]);
    expect(problems[0]).toContain(PAGE_PATH);
  });

  it('names ORIGIN when a copy of the page has it removed', () => {
    const page = pageListing(SOUND_NAMES).replace('- `ORIGIN`: the fixture description of the variable.\n', '');
    expect(fixtureProblems({ page })).toEqual([expect.stringContaining('ORIGIN')]);
  });

  it('does not count a name written in prose without backticks', () => {
    const page = `${pageListing(SOUND_NAMES.filter((name) => name !== 'ORIGIN'))}\nThe ORIGIN variable is described in prose only.\n`;
    expect(fixtureProblems({ page })).toEqual([expect.stringContaining('ORIGIN')]);
  });

  it('counts a name only as a whole backticked token', () => {
    const others = SOUND_NAMES.filter((name) => name !== 'ANALYTICS_POSTHOG_HOST' && name !== 'XFF_DEPTH');
    const page = `${pageListing(others)}\nSet \`XFF_DEPTH=2\` behind two proxies.\n`;
    const problems = fixtureProblems({ page });
    expect(problems).toHaveLength(2);
    expect(problems).toEqual(
      expect.arrayContaining([expect.stringContaining('ANALYTICS_POSTHOG_HOST'), expect.stringContaining('XFF_DEPTH')])
    );
  });

  it('names a name the bootstrap script reads that the page leaves out', () => {
    const page = pageListing(SOUND_NAMES.filter((name) => name !== 'BOOTSTRAP_OPEN_FOR_VOTERS'));
    expect(fixtureProblems({ page })).toEqual([expect.stringContaining('BOOTSTRAP_OPEN_FOR_VOTERS')]);
  });

  it('names a name of the task list that is neither required nor analytics', () => {
    const taskEnvironment = { variables: [...SOUND_TASK_ENVIRONMENT.variables, { name: 'SHUTDOWN_TIMEOUT' }] };
    expect(fixtureProblems({ taskEnvironment })).toEqual([expect.stringContaining('SHUTDOWN_TIMEOUT')]);
  });

  it('reports an absent page, naming it', () => {
    expect(fixtureProblems({ page: undefined })).toEqual([`${PAGE_PATH}: is missing`]);
  });

  it('reports an absent or malformed task environment list, naming it', () => {
    expect(fixtureProblems({ taskEnvironment: undefined })).toEqual([`${TASK_ENVIRONMENT_PATH}: is missing`]);
    expect(fixtureProblems({ taskEnvironment: {} })).toEqual([`${TASK_ENVIRONMENT_PATH}: has no \`variables\` array`]);
  });

  it('reports an absent bootstrap script, or one without a \\getenv line, naming it', () => {
    expect(fixtureProblems({ bootstrap: undefined })).toEqual([`${BOOTSTRAP_PATH}: is missing`]);
    expect(fixtureProblems({ bootstrap: '-- \\getenv is named in a comment only.\n' })).toEqual([
      `${BOOTSTRAP_PATH}: has no \\getenv line`
    ]);
  });
});

/**
 * Read a repository file, or `undefined` when it does not exist.
 *
 * @param path - The path relative to the repository root.
 * @returns The file's text, or `undefined`.
 */
function readRepositoryFile(path: string): string | undefined {
  const absolute = `${REPOSITORY_ROOT}${path}`;
  return existsSync(absolute) ? readFileSync(absolute, 'utf8') : undefined;
}

describe('the environment-variable reference in the repository', () => {
  it('lists every variable of the task environment list, REQUIRED_ENV, ANALYTICS_ENV and the bootstrap script', () => {
    const taskEnvironment = readRepositoryFile(TASK_ENVIRONMENT_PATH);
    const problems = environmentReferenceProblems({
      page: readRepositoryFile(PAGE_PATH),
      taskEnvironment: taskEnvironment === undefined ? undefined : JSON.parse(taskEnvironment),
      bootstrap: readRepositoryFile(BOOTSTRAP_PATH),
      requiredNames: REQUIRED_ENV,
      analyticsNames: Object.values(ANALYTICS_ENV)
    });
    expect(problems).toEqual([]);
  });
});
