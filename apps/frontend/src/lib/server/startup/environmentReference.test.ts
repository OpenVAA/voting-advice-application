/**
 * Specification for the environment-variable reference of the docs site, `developers-guide/configuration/environmental-variables/+page.md`: it lists, each as a whole token in backticks, every name of the frontend task's environment list `infra/modules/frontend-service/task-environment.json`, every name of `REQUIRED_ENV`, every name of `ANALYTICS_ENV`, every key of the `constants` objects of `$lib/utils/constants` and `$lib/server/constants`, and every name `infra/scripts/bootstrap.sql` reads with `\getenv`. A name written without backticks, or inside a longer backticked text, does not count. In the other direction, every variable-shaped backticked token in a table row or a list item of the page is a name one of those sources, an Edge Function's `Deno.env.get` read, the root `.env.example` or the Edge Functions' `.env.example` declares, so a row for a variable nothing reads any more is a problem; while a source is absent that direction is not checked. An absent page, list or template, a malformed list, a bootstrap script without a `\getenv` line, or a line that begins with `\getenv` and is not exactly `\getenv <psql variable> <name>`, is a problem naming that file. Every problem found names the variable or the file it concerns.
 *
 * @vitest-environment node
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ANALYTICS_ENV } from '$lib/server/analytics/config';
import { constants as privateConstants } from '$lib/server/constants';
import { constants as publicConstants } from '$lib/utils/constants';
import { REQUIRED_ENV } from './requiredEnv';

/** The repository root, six directories above this file. */
const REPOSITORY_ROOT = fileURLToPath(new URL('../../../../../../', import.meta.url));

/** The reference page, relative to the repository root. */
const PAGE_PATH = 'apps/docs/src/routes/(content)/developers-guide/configuration/environmental-variables/+page.md';

/** The frontend task's environment list, relative to the repository root. */
const TASK_ENVIRONMENT_PATH = 'infra/modules/frontend-service/task-environment.json';

/** The bootstrap script, relative to the repository root. */
const BOOTSTRAP_PATH = 'infra/scripts/bootstrap.sql';

/** The root environment template, relative to the repository root. */
const ROOT_TEMPLATE_PATH = '.env.example';

/** The Edge Functions' directory, relative to the repository root. */
const FUNCTIONS_PATH = 'apps/supabase/supabase/functions';

/** The Edge Functions' environment template, relative to the repository root. */
const FUNCTIONS_TEMPLATE_PATH = `${FUNCTIONS_PATH}/.env.example`;

/** A backticked token that has the shape of an environment variable's name. A prefix such as `PUBLIC_` is not one. */
const VARIABLE_TOKEN = /^[A-Z][A-Z0-9_]*[A-Z0-9]$/;

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
  /** The keys of the frontend's two `constants` objects. */
  constantsNames: ReadonlyArray<string>;
  /** The text of the root environment template. */
  rootTemplate: string | undefined;
  /** The text of the Edge Functions' environment template. */
  functionsTemplate: string | undefined;
  /** The texts of the Edge Functions' source modules, tests excluded. */
  functionsSources: ReadonlyArray<string>;
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
 * The variable-shaped tokens the page writes in backticks in a table row or a list item, where the page lists its variables.
 *
 * @param page - The page's text.
 * @returns The tokens, each once.
 */
function listedVariableTokens(page: string): Set<string> {
  const rows = page.split('\n').filter((line) => /^\s*(?:\||[-*] )/.test(line));
  return new Set([...backtickedTokens(rows.join('\n'))].filter((token) => VARIABLE_TOKEN.test(token)));
}

/**
 * The names an environment template declares: every `NAME=` line, commented out or not.
 *
 * @param template - The template's text.
 * @returns The names.
 */
function templateNames(template: string): Array<string> {
  return Array.from(template.matchAll(/^#?\s*([A-Z][A-Z0-9_]*)=/gm), (match) => match[1]);
}

/**
 * The names an Edge Function module reads with `Deno.env.get` and a literal name.
 *
 * @param source - The module's text.
 * @returns The names.
 */
function functionEnvironmentNames(source: string): Array<string> {
  return Array.from(source.matchAll(/Deno\.env\.get\(\s*['"]([A-Z][A-Z0-9_]*)['"]/g), (match) => match[1]);
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
 * @returns The names, in the order the script reads them, and each line that begins with `\getenv` without being one plain `\getenv <psql variable> <name>`, with its line number.
 */
function bootstrapEnvironmentNames(bootstrap: string): { names: Array<string>; unread: Array<string> } {
  const names: Array<string> = [];
  const unread: Array<string> = [];
  bootstrap.split('\n').forEach((line, index) => {
    if (!/^\s*\\getenv\b/.test(line)) return;
    const name = /^\s*\\getenv\s+[A-Za-z_][A-Za-z0-9_]*\s+([A-Za-z_][A-Za-z0-9_]*)\s*$/.exec(line)?.[1];
    if (name === undefined) unread.push(`line ${index + 1}, "${line.trim()}"`);
    else names.push(name);
  });
  return { names, unread };
}

/**
 * List every name the reference page must list and does not, every variable it lists that no source declares, and every file that could not be read. It reads nothing but its arguments.
 *
 * @param input - The page, the list, the script, the templates and the name sets, see {@link EnvironmentReferenceInput}.
 * @returns One string per problem, each naming the variable or the file it concerns, or an empty array when the page and the sources agree.
 */
function environmentReferenceProblems({
  page,
  taskEnvironment,
  bootstrap,
  requiredNames,
  analyticsNames,
  constantsNames,
  rootTemplate,
  functionsTemplate,
  functionsSources
}: EnvironmentReferenceInput): Array<string> {
  const problems: Array<string> = [];
  const taskNames = taskEnvironmentNames(taskEnvironment);
  if (taskEnvironment === undefined) problems.push(`${TASK_ENVIRONMENT_PATH}: is missing`);
  else if (taskNames === undefined) problems.push(`${TASK_ENVIRONMENT_PATH}: has no \`variables\` array`);
  const { names: bootstrapNames, unread } =
    bootstrap === undefined ? { names: [], unread: [] } : bootstrapEnvironmentNames(bootstrap);
  if (bootstrap === undefined) problems.push(`${BOOTSTRAP_PATH}: is missing`);
  else if (bootstrapNames.length === 0 && unread.length === 0) problems.push(`${BOOTSTRAP_PATH}: has no \\getenv line`);
  for (const line of unread) {
    problems.push(`${BOOTSTRAP_PATH}: ${line} reads a variable in a form this check cannot parse`);
  }
  if (rootTemplate === undefined) problems.push(`${ROOT_TEMPLATE_PATH}: is missing`);
  if (functionsTemplate === undefined) problems.push(`${FUNCTIONS_TEMPLATE_PATH}: is missing`);
  const sourcesReadable = problems.length === 0;
  if (page === undefined) return [`${PAGE_PATH}: is missing`, ...problems];

  const listed = backtickedTokens(page);
  const names = new Set([
    ...requiredNames,
    ...(taskNames ?? []),
    ...analyticsNames,
    ...constantsNames,
    ...bootstrapNames
  ]);
  for (const name of names) {
    if (!listed.has(name)) problems.push(`${name}: is not listed in backticks on ${PAGE_PATH}`);
  }
  if (!sourcesReadable) return problems;
  const declared = new Set([
    ...names,
    ...functionsSources.flatMap(functionEnvironmentNames),
    ...templateNames(rootTemplate ?? ''),
    ...templateNames(functionsTemplate ?? '')
  ]);
  for (const token of listedVariableTokens(page)) {
    if (!declared.has(token)) {
      problems.push(`${token}: is listed on ${PAGE_PATH}, and no source or environment template declares it`);
    }
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

/** Fixture keys of the two `constants` objects. */
const SOUND_CONSTANTS_NAMES: ReadonlyArray<string> = ['PUBLIC_DEBUG', 'IDURA_DOMAIN'];

/** A sound fixture root template: one twin and one name only the tooling reads, which stays commented out. */
const SOUND_ROOT_TEMPLATE = [
  '# A fixture template.',
  'SUPABASE_URL=http://127.0.0.1:54321',
  '# FRONTEND_PORT=5173',
  ''
].join('\n');

/** A sound fixture Edge Functions template. */
const SOUND_FUNCTIONS_TEMPLATE = ['# The functions read these.', 'SITE_URL=http://localhost:5173', ''].join('\n');

/** A sound fixture Edge Function module. */
const SOUND_FUNCTIONS_SOURCES: ReadonlyArray<string> = ["const smtpUser = Deno.env.get('SMTP_USER');\n"];

/** Every name the sound fixtures make the page list. */
const SOUND_NAMES: ReadonlyArray<string> = [
  ...REQUIRED_NAMES,
  'ADDRESS_HEADER',
  'XFF_DEPTH',
  ...ANALYTICS_NAMES,
  ...SOUND_CONSTANTS_NAMES,
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
    constantsNames: SOUND_CONSTANTS_NAMES,
    rootTemplate: SOUND_ROOT_TEMPLATE,
    functionsTemplate: SOUND_FUNCTIONS_TEMPLATE,
    functionsSources: SOUND_FUNCTIONS_SOURCES,
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

  it('names a key of a constants object that the page leaves out', () => {
    const page = pageListing(SOUND_NAMES.filter((name) => name !== 'IDURA_DOMAIN'));
    expect(fixtureProblems({ page })).toEqual([expect.stringContaining('IDURA_DOMAIN')]);
  });

  it('names PUBLIC_BROWSER_FRONTEND_URL when the page lists a variable nothing reads', () => {
    const problems = fixtureProblems({ page: pageListing([...SOUND_NAMES, 'PUBLIC_BROWSER_FRONTEND_URL']) });
    expect(problems).toEqual([expect.stringContaining('PUBLIC_BROWSER_FRONTEND_URL')]);
    expect(problems[0]).toContain(PAGE_PATH);
  });

  it('names a variable nothing reads in the first cell of a table row', () => {
    const page = `${pageListing(SOUND_NAMES)}\n| Variable | What it does |\n| --- | --- |\n| \`PUBLIC_SERVER_FRONTEND_URL\` | Gone. |\n`;
    expect(fixtureProblems({ page })).toEqual([expect.stringContaining('PUBLIC_SERVER_FRONTEND_URL')]);
  });

  it('accepts a listed name that only an environment template declares, commented out or not', () => {
    const page = pageListing([...SOUND_NAMES, 'SUPABASE_URL', 'FRONTEND_PORT', 'SITE_URL']);
    expect(fixtureProblems({ page })).toEqual([]);
  });

  it('accepts a listed name that an Edge Function reads, and names it once no function does', () => {
    const page = pageListing([...SOUND_NAMES, 'SMTP_USER']);
    expect(fixtureProblems({ page })).toEqual([]);
    expect(fixtureProblems({ page, functionsSources: [] })).toEqual([expect.stringContaining('SMTP_USER')]);
  });

  it('does not take a prefix such as PUBLIC_ for a variable', () => {
    const page = `${pageListing(SOUND_NAMES)}\n- Only \`PUBLIC_\`-prefixed variables reach the browser.\n`;
    expect(fixtureProblems({ page })).toEqual([]);
  });

  it('does not hold a variable-shaped token in prose to the reverse check', () => {
    const page = `${pageListing(SOUND_NAMES)}\nIt connects through the libpq variable \`PGHOST\` and the \`ABSENT_NAME\` token.\n`;
    expect(fixtureProblems({ page })).toEqual([]);
  });

  it('reports an absent page, naming it', () => {
    expect(fixtureProblems({ page: undefined })).toEqual([`${PAGE_PATH}: is missing`]);
  });

  it('reports an absent or malformed task environment list, naming it', () => {
    expect(fixtureProblems({ taskEnvironment: undefined })).toEqual([`${TASK_ENVIRONMENT_PATH}: is missing`]);
    expect(fixtureProblems({ taskEnvironment: {} })).toEqual([`${TASK_ENVIRONMENT_PATH}: has no \`variables\` array`]);
  });

  it('reports an absent environment template, naming it', () => {
    expect(fixtureProblems({ rootTemplate: undefined })).toEqual([`${ROOT_TEMPLATE_PATH}: is missing`]);
    expect(fixtureProblems({ functionsTemplate: undefined })).toEqual([`${FUNCTIONS_TEMPLATE_PATH}: is missing`]);
  });

  it.each([
    ["\\getenv default_locale 'BOOTSTRAP_DEFAULT_LOCALE'"],
    ['\\getenv default_locale BOOTSTRAP_DEFAULT_LOCALE \\echo read'],
    ['\\getenv default_locale']
  ])('names a \\getenv line it cannot parse, %s, with its line number', (line) => {
    const problems = fixtureProblems({ bootstrap: `${SOUND_BOOTSTRAP}${line}\n` });
    expect(problems).toEqual([
      `${BOOTSTRAP_PATH}: line 6, "${line}" reads a variable in a form this check cannot parse`
    ]);
  });

  it('reports an absent bootstrap script, or one without a \\getenv line, naming it', () => {
    expect(fixtureProblems({ bootstrap: undefined })).toEqual([`${BOOTSTRAP_PATH}: is missing`]);
    expect(fixtureProblems({ bootstrap: '-- \\getenv is named in a comment only.\n' })).toEqual([
      `${BOOTSTRAP_PATH}: has no \\getenv line`
    ]);
  });
});

/**
 * The texts of the Edge Functions' source modules, their tests excluded.
 *
 * @returns One text per module.
 */
function readFunctionsSources(): Array<string> {
  return readdirSync(`${REPOSITORY_ROOT}${FUNCTIONS_PATH}`, { recursive: true, encoding: 'utf8' })
    .filter((path) => path.endsWith('.ts') && !path.endsWith('.test.ts') && !path.split('/').includes('node_modules'))
    .map((path) => readFileSync(`${REPOSITORY_ROOT}${FUNCTIONS_PATH}/${path}`, 'utf8'));
}

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
  it('lists every variable of the task environment list, REQUIRED_ENV, ANALYTICS_ENV, the constants objects and the bootstrap script, and no other', () => {
    const taskEnvironment = readRepositoryFile(TASK_ENVIRONMENT_PATH);
    const problems = environmentReferenceProblems({
      page: readRepositoryFile(PAGE_PATH),
      taskEnvironment: taskEnvironment === undefined ? undefined : JSON.parse(taskEnvironment),
      bootstrap: readRepositoryFile(BOOTSTRAP_PATH),
      requiredNames: REQUIRED_ENV,
      analyticsNames: Object.values(ANALYTICS_ENV),
      constantsNames: [...Object.keys(publicConstants), ...Object.keys(privateConstants)],
      rootTemplate: readRepositoryFile(ROOT_TEMPLATE_PATH),
      functionsTemplate: readRepositoryFile(FUNCTIONS_TEMPLATE_PATH),
      functionsSources: readFunctionsSources()
    });
    expect(problems).toEqual([]);
  });
});
