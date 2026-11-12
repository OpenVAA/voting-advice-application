/**
 * Specification for the frontend task's environment list, `infra/modules/frontend-service/task-environment.json`: one entry per variable, each with a unique name, a source of `value` (set by the root) or `parameter` (read from the parameter store), a boolean `required` and a non-empty description. Its required entries are exactly `REQUIRED_ENV`, it holds every name of `ANALYTICS_ENV`, and every name it holds appears in the root `.env.example`, on a live or a commented line. No name contains `SERVICE_ROLE`, because the service-role key must reach the task in no form, and every name ending in `KEY`, `SECRET`, `PASSWORD` or `TOKEN` has source `parameter`, so no secret is ever a tracked value. Every problem found names the variable it concerns.
 *
 * @vitest-environment node
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ANALYTICS_ENV } from '$lib/server/analytics/config';
import { REQUIRED_ENV } from './requiredEnv';

/** The sources an entry may name: `value` is set by the root, `parameter` is read from the parameter store. */
const SOURCES: ReadonlyArray<string> = ['value', 'parameter'];

/** The suffixes that mark a variable as a secret, which must come from the parameter store. */
const SECRET_SUFFIXES: ReadonlyArray<string> = ['KEY', 'SECRET', 'PASSWORD', 'TOKEN'];

/** The fragment no variable of the task may contain. */
const FORBIDDEN_FRAGMENT = 'SERVICE_ROLE';

/** The repository root, six directories above this file. */
const REPOSITORY_ROOT = fileURLToPath(new URL('../../../../../../', import.meta.url));

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
  'ANALYTICS_POSTHOG_HOST'
];

/** The runbook whose environment section lists every name of the list, relative to the repository root. */
const RUNBOOK_PATH = 'infra/envs/staging/aws/README.md';

/** The variable file of every AWS root, each of which sets every `value` entry of the list, relative to the repository root. */
const AWS_ROOT_TFVARS_PATHS: ReadonlyArray<string> = [
  'infra/envs/staging/aws/terraform.tfvars',
  'infra/envs/example/aws/terraform.tfvars'
];

/** One root's variable file: where it is, so a problem can name it, and its text. */
type TfvarsFile = {
  /** The file's path, as a problem names it. */
  path: string;
  /** The file's text. */
  text: string;
};

/** What {@link taskEnvironmentProblems} checks: the parsed list, the texts it must agree with, and the name sets the list must agree with. */
type TaskEnvironmentInput = {
  /** The parsed list, `unknown` because it comes from a JSON file. */
  spec: unknown;
  /** The text of the env example file. */
  envExample: string;
  /** The text of the runbook whose environment section lists every name. */
  runbook: string;
  /** The variable file of every AWS root. */
  tfvars: ReadonlyArray<TfvarsFile>;
  /** The names the start-up check refuses to start without. */
  requiredNames: ReadonlyArray<string>;
  /** The names the analytics configuration is read from. */
  analyticsNames: ReadonlyArray<string>;
};

/** One entry of the list as read, before its fields are checked. */
type RawEntry = Readonly<Record<string, unknown>>;

/**
 * Whether a value is a plain object, so its fields can be read.
 *
 * @param value - The value to test.
 * @returns `true` for a non-null, non-array object.
 */
function isRecord(value: unknown): value is RawEntry {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Whether `.env.example` lists a name, on a line that starts, after optional spaces, with `NAME=` or with `#`, optional spaces and `NAME=`.
 *
 * @param envExample - The text of the env example file.
 * @param name - The variable's name.
 * @returns `true` when such a line exists.
 */
function envExampleLists(envExample: string, name: string): boolean {
  return envExample.split('\n').some((line) => {
    const start = line.trimStart();
    const uncommented = start.startsWith('#') ? start.slice(1).trimStart() : start;
    return uncommented.startsWith(`${name}=`);
  });
}

/**
 * List every way the task's environment list breaks its contract. It reads nothing but its arguments.
 *
 * @param input - The list, the env example text and the name sets, see {@link TaskEnvironmentInput}.
 * @returns One string per problem, each naming the variable it concerns, or an empty array when the list is sound.
 */
function taskEnvironmentProblems({
  spec,
  envExample,
  requiredNames,
  analyticsNames
}: TaskEnvironmentInput): Array<string> {
  if (!isRecord(spec) || !Array.isArray(spec.variables)) return ['the list has no `variables` array'];
  const problems: Array<string> = [];
  const entries: ReadonlyArray<unknown> = spec.variables;
  const seen = new Set<string>();
  const requiredInList = new Set<string>();

  entries.forEach((entry, index) => {
    if (!isRecord(entry) || typeof entry.name !== 'string' || entry.name.trim() === '') {
      problems.push(`entry ${index}: has no name`);
      return;
    }
    const { name, source, required, description } = entry;

    if (seen.has(name)) problems.push(`${name}: listed more than once`);
    seen.add(name);
    if (typeof source !== 'string' || !SOURCES.includes(source))
      problems.push(`${name}: source must be one of ${SOURCES.join(', ')}`);
    if (typeof required !== 'boolean') problems.push(`${name}: required must be a boolean`);
    if (required === true) requiredInList.add(name);
    if (typeof description !== 'string' || description.trim() === '') problems.push(`${name}: has no description`);
    if (name.includes(FORBIDDEN_FRAGMENT)) problems.push(`${name}: must not reach the task in any form`);
    if (SECRET_SUFFIXES.some((suffix) => name.endsWith(suffix)) && source !== 'parameter')
      problems.push(`${name}: is a secret, so its source must be parameter`);
    if (!envExampleLists(envExample, name)) problems.push(`${name}: is not listed in .env.example`);
  });

  for (const name of requiredNames) {
    if (!seen.has(name)) problems.push(`${name}: is required by the start-up check but missing from the list`);
    else if (!requiredInList.has(name))
      problems.push(`${name}: is required by the start-up check but not marked required`);
  }
  for (const name of requiredInList) {
    if (!requiredNames.includes(name))
      problems.push(`${name}: is marked required but the start-up check does not require it`);
  }
  for (const name of analyticsNames) {
    if (!seen.has(name)) problems.push(`${name}: is read by the analytics configuration but missing from the list`);
  }
  return problems;
}

/** One entry of a fixture list. */
type FixtureEntry = { name: string; source: string; required: boolean; description: string };

/**
 * Build a fixture entry.
 *
 * @param name - The variable's name.
 * @param source - Its source.
 * @param required - Whether the start-up check requires it.
 * @returns The entry, with a description of its own.
 */
function entry(name: string, source: string, required: boolean): FixtureEntry {
  return { name, source, required, description: `The fixture description of ${name}.` };
}

/** A sound fixture list: the required names, then the analytics names, with the secret-named ones from the parameter store. */
const SOUND_ENTRIES: ReadonlyArray<FixtureEntry> = [
  entry('PUBLIC_SUPABASE_URL', 'value', true),
  entry('PUBLIC_SUPABASE_ANON_KEY', 'parameter', true),
  entry('PUBLIC_PROJECT_ID', 'value', true),
  entry('ORIGIN', 'value', true),
  entry('ANALYTICS_PROVIDER', 'value', false),
  entry('ANALYTICS_CONSENT_MODE', 'value', false),
  entry('ANALYTICS_VISIT_ID_MODE', 'value', false),
  entry('ANALYTICS_POSTHOG_KEY', 'parameter', false),
  entry('ANALYTICS_POSTHOG_HOST', 'value', false)
];

/** A fixture env example listing every sound entry, alternating live and commented lines. */
const SOUND_ENV_EXAMPLE = SOUND_ENTRIES.map(({ name }, index) => (index % 2 === 0 ? `${name}=x` : `# ${name}=x`)).join(
  '\n'
);

/**
 * Build a fixture runbook whose environment section lists the given names in a table, between other sections that list none.
 *
 * @param names - The names the section lists.
 * @returns The runbook text.
 */
function runbookListing(names: ReadonlyArray<string>): string {
  return [
    '# A fixture runbook',
    '',
    "## The task's environment",
    '',
    '| Name | Source |',
    '| ---- | ------ |',
    ...names.map((name) => `| \`${name}\` | value |`),
    '',
    '## Flow overview',
    ''
  ].join('\n');
}

/**
 * Build a fixture variable file whose `environment_values` block sets the given names, with a comment line inside the block.
 *
 * @param names - The names the block sets.
 * @returns The variable file's text.
 */
function tfvarsSetting(names: ReadonlyArray<string>): string {
  return [
    'aws_region = "eu-north-1"',
    '',
    'environment_values = {',
    '  # A comment inside the block.',
    ...names.map((name) => `  ${name} = "x"`),
    '}',
    ''
  ].join('\n');
}

/**
 * The texts a sound fixture list agrees with: a runbook that lists every entry, and two root variable files that each set every `value` entry.
 *
 * @param entries - The fixture entries.
 * @returns The runbook text and the two variable files.
 */
function soundTexts(entries: ReadonlyArray<FixtureEntry>): Pick<TaskEnvironmentInput, 'runbook' | 'tfvars'> {
  const valueNames = entries.filter(({ source }) => source === 'value').map(({ name }) => name);
  return {
    runbook: runbookListing(entries.map(({ name }) => name)),
    tfvars: AWS_ROOT_TFVARS_PATHS.map((path) => ({ path, text: tfvarsSetting(valueNames) }))
  };
}

/**
 * Check a fixture list against the fixture env example, the fixture runbook and variable files, and the local name sets.
 *
 * @param entries - The fixture entries.
 * @param envExample - The env example text, {@link SOUND_ENV_EXAMPLE} by default.
 * @param texts - A runbook or variable files to use instead of the sound ones {@link soundTexts} builds from the entries.
 * @returns The problems found.
 */
function fixtureProblems(
  entries: ReadonlyArray<FixtureEntry>,
  envExample: string = SOUND_ENV_EXAMPLE,
  texts: Partial<Pick<TaskEnvironmentInput, 'runbook' | 'tfvars'>> = {}
): Array<string> {
  return taskEnvironmentProblems({
    spec: { variables: entries },
    envExample,
    ...soundTexts(entries),
    ...texts,
    requiredNames: REQUIRED_NAMES,
    analyticsNames: ANALYTICS_NAMES
  });
}

/** The names of the sound fixture list's `value` entries. */
const SOUND_VALUE_NAMES = SOUND_ENTRIES.filter(({ source }) => source === 'value').map(({ name }) => name);

/**
 * Two fixture variable files: the first as given, the second sound.
 *
 * @param text - The first file's text.
 * @returns The two files.
 */
function tfvarsWithFirst(text: string): Array<TfvarsFile> {
  const [first, second] = AWS_ROOT_TFVARS_PATHS;
  return [
    { path: first, text },
    { path: second, text: tfvarsSetting(SOUND_VALUE_NAMES) }
  ];
}

describe('taskEnvironmentProblems', () => {
  it('finds nothing in a sound list', () => {
    expect(fixtureProblems(SOUND_ENTRIES)).toEqual([]);
  });

  it('names ORIGIN when the list leaves it out', () => {
    const problems = fixtureProblems(SOUND_ENTRIES.filter(({ name }) => name !== 'ORIGIN'));
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('ORIGIN');
  });

  it('names a required variable that is not marked required', () => {
    const problems = fixtureProblems(
      SOUND_ENTRIES.map((e) => (e.name === 'PUBLIC_PROJECT_ID' ? { ...e, required: false } : e))
    );
    expect(problems).toEqual([expect.stringContaining('PUBLIC_PROJECT_ID')]);
  });

  it('names a variable marked required that the start-up check does not require', () => {
    const problems = fixtureProblems(
      SOUND_ENTRIES.map((e) => (e.name === 'ANALYTICS_PROVIDER' ? { ...e, required: true } : e))
    );
    expect(problems).toEqual([expect.stringContaining('ANALYTICS_PROVIDER')]);
  });

  it('names an analytics variable the list leaves out', () => {
    const problems = fixtureProblems(SOUND_ENTRIES.filter(({ name }) => name !== 'ANALYTICS_VISIT_ID_MODE'));
    expect(problems).toEqual([expect.stringContaining('ANALYTICS_VISIT_ID_MODE')]);
  });

  it('names SUPABASE_SERVICE_ROLE_KEY when the list holds it, whatever its source', () => {
    const name = 'SUPABASE_SERVICE_ROLE_KEY';
    const problems = fixtureProblems(
      [...SOUND_ENTRIES, entry(name, 'parameter', false)],
      `${SOUND_ENV_EXAMPLE}\n${name}=x`
    );
    expect(problems).toEqual([expect.stringContaining(name)]);
  });

  it('names any variable whose name contains SERVICE_ROLE', () => {
    const name = 'SERVICE_ROLE_JWT';
    const problems = fixtureProblems(
      [...SOUND_ENTRIES, entry(name, 'value', false)],
      `${SOUND_ENV_EXAMPLE}\n${name}=x`
    );
    expect(problems).toEqual([expect.stringContaining(name)]);
  });

  it('names ANALYTICS_POSTHOG_KEY when its source is value', () => {
    const problems = fixtureProblems(
      SOUND_ENTRIES.map((e) => (e.name === 'ANALYTICS_POSTHOG_KEY' ? { ...e, source: 'value' } : e))
    );
    expect(problems).toEqual([expect.stringContaining('ANALYTICS_POSTHOG_KEY')]);
  });

  it.each(['SOME_SECRET', 'SOME_PASSWORD', 'SOME_TOKEN'])('names %s when its source is value', (name) => {
    const problems = fixtureProblems(
      [...SOUND_ENTRIES, entry(name, 'value', false)],
      `${SOUND_ENV_EXAMPLE}\n${name}=x`
    );
    expect(problems).toEqual([expect.stringContaining(name)]);
  });

  it('names a variable .env.example does not list', () => {
    const text = SOUND_ENV_EXAMPLE.split('\n')
      .filter((line) => !line.includes('ANALYTICS_CONSENT_MODE'))
      .join('\n');
    expect(fixtureProblems(SOUND_ENTRIES, text)).toEqual([expect.stringContaining('ANALYTICS_CONSENT_MODE')]);
  });

  it('counts a commented line as listing a name, with or without spaces around the hash, and nothing else', () => {
    expect(envExampleLists('# ORIGIN=https://example.org\n', 'ORIGIN')).toBe(true);
    expect(envExampleLists('  #ORIGIN=\n', 'ORIGIN')).toBe(true);
    expect(envExampleLists('ORIGIN=\n', 'ORIGIN')).toBe(true);
    expect(envExampleLists('# ORIGIN is the public origin\n', 'ORIGIN')).toBe(false);
    expect(envExampleLists('NOT_ORIGIN=\n', 'ORIGIN')).toBe(false);
    expect(envExampleLists('# The ORIGIN=x example\n', 'ORIGIN')).toBe(false);
  });

  it('names a duplicated variable', () => {
    const problems = fixtureProblems([...SOUND_ENTRIES, entry('ORIGIN', 'value', true)]);
    expect(problems).toEqual([expect.stringContaining('ORIGIN')]);
  });

  it('names a variable with an unknown source, a non-boolean required or an empty description', () => {
    const problems = taskEnvironmentProblems({
      spec: {
        variables: [
          ...SOUND_ENTRIES.filter(({ name }) => name !== 'ANALYTICS_PROVIDER'),
          { name: 'ANALYTICS_PROVIDER', source: 'tfvars', required: 'no', description: ' ' }
        ]
      },
      envExample: SOUND_ENV_EXAMPLE,
      ...soundTexts(SOUND_ENTRIES),
      requiredNames: REQUIRED_NAMES,
      analyticsNames: ANALYTICS_NAMES
    });
    expect(problems).toHaveLength(3);
    for (const problem of problems) expect(problem).toContain('ANALYTICS_PROVIDER');
  });

  it('reports a list without a variables array, and an entry without a name', () => {
    expect(fixtureProblemsOf({})).toEqual(['the list has no `variables` array']);
    expect(fixtureProblemsOf({ variables: [...SOUND_ENTRIES, { source: 'value' }] })).toEqual([
      `entry ${SOUND_ENTRIES.length}: has no name`
    ]);
  });
});

describe('taskEnvironmentProblems against the runbook and the AWS roots', () => {
  it("names a variable the runbook's environment section does not list", () => {
    const runbook = runbookListing(
      SOUND_ENTRIES.map(({ name }) => name).filter((name) => name !== 'ANALYTICS_CONSENT_MODE')
    );
    const problems = fixtureProblems(SOUND_ENTRIES, SOUND_ENV_EXAMPLE, { runbook });
    expect(problems).toEqual([expect.stringContaining('ANALYTICS_CONSENT_MODE')]);
    expect(problems[0]).toContain('runbook');
  });

  it('counts a name as listed only in backticks inside the section that begins with ## The task', () => {
    const others = SOUND_ENTRIES.map(({ name }) => name).filter((name) => name !== 'ORIGIN');
    const runbook = [
      '# A fixture runbook',
      '',
      'The lines before the section name `ORIGIN`.',
      '',
      runbookListing(others)
        .replace('# A fixture runbook\n', '')
        .replace('| Name | Source |', 'ORIGIN is named here without backticks.\n\n| Name | Source |'),
      'The section after it names `ORIGIN` too.'
    ].join('\n');
    const problems = fixtureProblems(SOUND_ENTRIES, SOUND_ENV_EXAMPLE, { runbook });
    expect(problems).toEqual([expect.stringContaining('ORIGIN')]);
  });

  it('reports a runbook without the environment section', () => {
    const problems = fixtureProblems(SOUND_ENTRIES, SOUND_ENV_EXAMPLE, {
      runbook: '# A runbook\n\n## Flow overview\n'
    });
    expect(problems).toEqual([expect.stringContaining('## The task')]);
  });

  it("names a value variable an AWS root's variable file does not set, and the file", () => {
    const tfvars = tfvarsWithFirst(tfvarsSetting(SOUND_VALUE_NAMES.filter((name) => name !== 'ORIGIN')));
    const problems = fixtureProblems(SOUND_ENTRIES, SOUND_ENV_EXAMPLE, { tfvars });
    expect(problems).toEqual([expect.stringContaining('ORIGIN')]);
    expect(problems[0]).toContain(AWS_ROOT_TFVARS_PATHS[0]);
  });

  it("names a parameter variable an AWS root's variable file sets", () => {
    const tfvars = tfvarsWithFirst(tfvarsSetting([...SOUND_VALUE_NAMES, 'ANALYTICS_POSTHOG_KEY']));
    const problems = fixtureProblems(SOUND_ENTRIES, SOUND_ENV_EXAMPLE, { tfvars });
    expect(problems).toEqual([expect.stringContaining('ANALYTICS_POSTHOG_KEY')]);
    expect(problems[0]).toContain(AWS_ROOT_TFVARS_PATHS[0]);
  });

  it("names a name an AWS root's variable file sets that the list does not hold", () => {
    const tfvars = tfvarsWithFirst(tfvarsSetting([...SOUND_VALUE_NAMES, 'NOT_IN_THE_LIST']));
    const problems = fixtureProblems(SOUND_ENTRIES, SOUND_ENV_EXAMPLE, { tfvars });
    expect(problems).toEqual([expect.stringContaining('NOT_IN_THE_LIST')]);
  });

  it('reads the keys of the block only, up to the first line that begins with a closing brace', () => {
    const text = `${tfvarsSetting(SOUND_VALUE_NAMES.filter((name) => name !== 'ORIGIN'))}ORIGIN = "x"\n`;
    const problems = fixtureProblems(SOUND_ENTRIES, SOUND_ENV_EXAMPLE, { tfvars: tfvarsWithFirst(text) });
    expect(problems).toEqual([expect.stringContaining('ORIGIN')]);
  });

  it('reports a variable file without an environment_values block', () => {
    const problems = fixtureProblems(SOUND_ENTRIES, SOUND_ENV_EXAMPLE, {
      tfvars: tfvarsWithFirst('aws_region = "eu-north-1"\n')
    });
    expect(problems).toEqual([expect.stringContaining(AWS_ROOT_TFVARS_PATHS[0])]);
  });
});

/**
 * Check an arbitrary parsed value as the list, against the sound fixture env example, runbook and variable files.
 *
 * @param spec - The parsed value.
 * @returns The problems found.
 */
function fixtureProblemsOf(spec: unknown): Array<string> {
  return taskEnvironmentProblems({
    spec,
    envExample: SOUND_ENV_EXAMPLE,
    ...soundTexts(SOUND_ENTRIES),
    requiredNames: REQUIRED_NAMES,
    analyticsNames: ANALYTICS_NAMES
  });
}

describe('the task environment list in the repository', () => {
  // `TASK_ENVIRONMENT_SPEC` points the check at another copy of the list, so a planted fault can be seen failing it.
  const specPath =
    process.env.TASK_ENVIRONMENT_SPEC ?? `${REPOSITORY_ROOT}infra/modules/frontend-service/task-environment.json`;
  const envExamplePath = `${REPOSITORY_ROOT}.env.example`;

  it("agrees with REQUIRED_ENV, ANALYTICS_ENV, .env.example, the runbook and every AWS root's variable file", () => {
    expect(existsSync(specPath), `the list is expected at ${specPath}`).toBe(true);
    const problems = taskEnvironmentProblems({
      spec: JSON.parse(readFileSync(specPath, 'utf8')),
      envExample: readFileSync(envExamplePath, 'utf8'),
      runbook: readFileSync(`${REPOSITORY_ROOT}${RUNBOOK_PATH}`, 'utf8'),
      tfvars: AWS_ROOT_TFVARS_PATHS.map((path) => ({ path, text: readFileSync(`${REPOSITORY_ROOT}${path}`, 'utf8') })),
      requiredNames: REQUIRED_ENV,
      analyticsNames: Object.values(ANALYTICS_ENV)
    });
    expect(problems).toEqual([]);
  });
});
