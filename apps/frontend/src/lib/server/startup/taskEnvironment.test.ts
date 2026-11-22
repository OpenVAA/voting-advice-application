/**
 * Specification for the frontend task's environment list, `infra/modules/frontend-service/task-environment.json`: one entry per variable, each with a unique name, a source of `value` (set by the root) or `parameter` (read from the parameter store), a boolean `required` and a non-empty description. An entry of bank authentication also carries `identity_providers`, a non-empty list of the provider types that need it, and is never required: the task receives it only from a root whose `identity_provider_type` is one of them. Its required entries are exactly the names the start-up check reports for an empty environment, it holds every name of `ANALYTICS_ENV`, and every name it holds appears in the root `.env.example`, on a live or a commented line. No name contains `SERVICE_ROLE`, because the service-role key must reach the task in no form, and every name ending in `KEY`, `SECRET`, `PASSWORD`, `TOKEN` or `JWKS` has source `parameter`, so no secret is ever a tracked value. The `environment_values` block of every AWS root's `terraform.tfvars` sets every `value` name the root's task receives, sets no `parameter` name, no identity-provider name its `identity_provider_type` does not select and never `PUBLIC_IDENTITY_PROVIDER_TYPE`, which the module sets from that type, and sets no name the list does not hold. Each AWS root agrees with the `terraform.tfvars` of its sibling Supabase root, `infra/envs/<env>/supabase/`: its `PUBLIC_PROJECT_ID` is that root's `public_project_id`, its `ORIGIN` is that root's `public_origin`, and its `PUBLIC_SUPABASE_URL` is `https://`, that root's `project_ref` and `.supabase.co`. Both roots turn bank authentication on or neither does: an AWS root that sets `identity_provider_type` has a sibling that sets the `identity_provider` object, whose `type` is that type and whose `client_id`, `jwks_uri` and `issuer` are the AWS root's `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID`, `IDENTITY_PROVIDER_JWKS_URI` and `IDENTITY_PROVIDER_ISSUER`; a commented-out block or line sets nothing. Every problem found names the variable or the file it concerns.
 *
 * @vitest-environment node
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ANALYTICS_ENV } from '$lib/server/analytics/config';
import { missingRequiredEnv } from './requiredEnv';

/** The sources an entry may name: `value` is set by the root, `parameter` is read from the parameter store. */
const SOURCES: ReadonlyArray<string> = ['value', 'parameter'];

/** The suffixes that mark a variable as a secret, which must come from the parameter store. */
const SECRET_SUFFIXES: ReadonlyArray<string> = ['KEY', 'SECRET', 'PASSWORD', 'TOKEN', 'JWKS'];

/** The identity-provider types an entry's `identity_providers` may name, the values of a root's `identity_provider_type`. */
const IDENTITY_PROVIDERS: ReadonlyArray<string> = ['signicat-ftn', 'idura-ftn'];

/** The names the module sets itself, which a root's `environment_values` never gives. */
const DERIVED_NAMES: ReadonlyArray<string> = ['PUBLIC_IDENTITY_PROVIDER_TYPE'];

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
  'ANALYTICS_POSTHOG_HOST',
  'ANALYTICS_FLUSH_INTERVAL_MS'
];

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

/** An AWS root's variable file, with the variable file of its sibling Supabase root. */
type AwsTfvarsFile = TfvarsFile & {
  /** The sibling Supabase root's variable file, its text `undefined` when the file does not exist. */
  sibling: { path: string; text: string | undefined };
};

/**
 * The path of the variable file of an AWS root's sibling Supabase root, `infra/envs/<env>/supabase/terraform.tfvars`.
 *
 * @param awsPath - The AWS root's variable file, `infra/envs/<env>/aws/terraform.tfvars`.
 * @returns The sibling's path.
 */
function supabaseSiblingPath(awsPath: string): string {
  return awsPath.replace(/\/aws\/terraform\.tfvars$/, '/supabase/terraform.tfvars');
}

/** What {@link taskEnvironmentProblems} checks: the parsed list, the texts it must agree with, and the name sets the list must agree with. */
type TaskEnvironmentInput = {
  /** The parsed list, `unknown` because it comes from a JSON file. */
  spec: unknown;
  /** The text of the env example file. */
  envExample: string;
  /** The variable file of every AWS root, each with its sibling Supabase root's. */
  tfvars: ReadonlyArray<AwsTfvarsFile>;
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
 * The names a root's variable file sets in `environment_values`, with their values: every `NAME =` line between the line `environment_values = {` and the next line that begins with `}`. Comment lines are skipped.
 *
 * @param text - The variable file's text.
 * @returns Each name mapped to its double-quoted value, or to `undefined` when the value is not one double-quoted string; `undefined` when the file has no such block.
 */
function tfvarsEnvironmentValues(text: string): Map<string, string | undefined> | undefined {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => /^environment_values\s*=\s*\{\s*$/.test(line));
  if (start < 0) return undefined;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith('}'));
  if (end < 0) return undefined;
  return new Map(
    rest.slice(0, end).flatMap((line) => {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:"([^"\n]*)")?/.exec(line);
      return match ? [[match[1], match[2]] as const] : [];
    })
  );
}

/**
 * The double-quoted value a variable file gives a top-level key, on a line that begins with `key =`.
 *
 * @param text - The variable file's text.
 * @param key - The key.
 * @returns The value, or `undefined` when no such line gives one double-quoted string.
 */
function tfvarsTopLevelString(text: string, key: string): string | undefined {
  return new RegExp(`^${key}\\s*=\\s*"([^"\\n]*)"`, 'm').exec(text)?.[1];
}

/**
 * The task variables an AWS root sets that its sibling Supabase root restates, each with the value the Supabase root's variable file implies for it.
 *
 * @param sibling - The Supabase root's variable file's text.
 * @returns Each task variable with the Supabase key it is read from and the value that key implies, `undefined` when the file gives the key no value.
 */
function supabaseImpliedValues(sibling: string): Array<{ name: string; key: string; implied: string | undefined }> {
  const ref = tfvarsTopLevelString(sibling, 'project_ref');
  return [
    {
      name: 'PUBLIC_PROJECT_ID',
      key: 'public_project_id',
      implied: tfvarsTopLevelString(sibling, 'public_project_id')
    },
    { name: 'ORIGIN', key: 'public_origin', implied: tfvarsTopLevelString(sibling, 'public_origin') },
    {
      name: 'PUBLIC_SUPABASE_URL',
      key: 'project_ref',
      implied: ref === undefined ? undefined : `https://${ref}.supabase.co`
    }
  ];
}

/**
 * List every way an AWS root disagrees with its sibling Supabase root about the project, the origin and the Supabase project. A variable the AWS root does not set is left to the check of the list.
 *
 * @param path - The AWS root's variable file.
 * @param setValues - The values its `environment_values` block sets.
 * @param sibling - The sibling Supabase root's variable file.
 * @returns One string per problem, each naming the variable and both files, or the absent file.
 */
function siblingProblems(
  path: string,
  setValues: ReadonlyMap<string, string | undefined>,
  sibling: AwsTfvarsFile['sibling']
): Array<string> {
  if (sibling.text === undefined) return [`${sibling.path}: is missing, so ${path} cannot be compared with it`];
  const problems: Array<string> = [];
  for (const { name, key, implied } of supabaseImpliedValues(sibling.text)) {
    if (!setValues.has(name)) continue;
    const value = setValues.get(name);
    if (implied === undefined)
      problems.push(`${name}: ${sibling.path} gives ${key} no quoted value to compare with ${path}`);
    else if (value !== implied)
      problems.push(
        `${name}: is ${JSON.stringify(value ?? null)} in ${path}, and ${sibling.path} implies ${JSON.stringify(implied)} by its ${key}`
      );
  }
  return problems;
}

/**
 * The double-quoted attributes of a top-level object a variable file gives a key, written one attribute per line between the line `key = {` and the next line that begins with `}`. A commented-out block is not read.
 *
 * @param text - The variable file's text.
 * @param key - The key.
 * @returns Each attribute mapped to its double-quoted value, `undefined` when the file has no such block.
 */
function tfvarsObject(text: string, key: string): Map<string, string> | undefined {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => new RegExp(`^${key}\\s*=\\s*\\{\\s*$`).test(line));
  if (start < 0) return undefined;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith('}'));
  if (end < 0) return undefined;
  return new Map(
    rest.slice(0, end).flatMap((line) => {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"([^"\n]*)"/.exec(line);
      return match ? [[match[1], match[2]] as const] : [];
    })
  );
}

/** The task variables of bank authentication that the Supabase root restates, each with the attribute of its `identity_provider` that must equal it. */
const IDENTITY_PROVIDER_PAIRS: ReadonlyArray<{ name: string; attribute: string }> = [
  { name: 'PUBLIC_IDENTITY_PROVIDER_CLIENT_ID', attribute: 'client_id' },
  { name: 'IDENTITY_PROVIDER_JWKS_URI', attribute: 'jwks_uri' },
  { name: 'IDENTITY_PROVIDER_ISSUER', attribute: 'issuer' }
];

/**
 * List every way an AWS root disagrees with its sibling Supabase root about bank authentication: one of them turns it on and the other does not, or a setting both give differs. The AWS root's `identity_provider_type` is compared with `identity_provider.type`, and each other setting, when its `environment_values` sets it, with the attribute of that name. A setting the AWS root does not set is left to the check of the list.
 *
 * @param path - The AWS root's variable file.
 * @param text - Its text.
 * @param setValues - The values its `environment_values` block sets.
 * @param sibling - The sibling Supabase root's variable file and its text.
 * @returns One string per problem, each naming the setting and both files.
 */
function identityProviderProblems(
  path: string,
  text: string,
  setValues: ReadonlyMap<string, string | undefined>,
  sibling: { path: string; text: string }
): Array<string> {
  const providerType = tfvarsTopLevelString(text, 'identity_provider_type');
  const provider = tfvarsObject(sibling.text, 'identity_provider');
  if (providerType === undefined && provider === undefined) return [];
  if (providerType === undefined)
    return [`identity_provider: is set in ${sibling.path}, but ${path} sets no identity_provider_type`];
  if (provider === undefined)
    return [`identity_provider_type: is set in ${path}, but ${sibling.path} sets no identity_provider`];
  const pairs = [
    { name: 'identity_provider_type', attribute: 'type', value: providerType },
    ...IDENTITY_PROVIDER_PAIRS.filter(({ name }) => setValues.has(name)).map((pair) => ({
      ...pair,
      value: setValues.get(pair.name)
    }))
  ];
  return pairs.flatMap(({ name, attribute, value }) => {
    const implied = provider.get(attribute);
    return value === implied
      ? []
      : [
          `${name}: is ${JSON.stringify(value ?? null)} in ${path}, and ${sibling.path} gives identity_provider.${attribute} ${JSON.stringify(implied ?? null)}`
        ];
  });
}

/**
 * Whether a root's task receives an entry.
 *
 * @param providers - The entry's `identity_providers`, `undefined` for an entry that names none.
 * @param providerType - The root's `identity_provider_type`, `undefined` when it sets none.
 * @returns `true` for an entry that names no provider, or one that names the root's.
 */
function receivedWith(providers: ReadonlyArray<string> | undefined, providerType: string | undefined): boolean {
  return providers === undefined || (providerType !== undefined && providers.includes(providerType));
}

/**
 * List every way the task's environment list breaks its contract. It reads nothing but its arguments.
 *
 * @param input - The list, the env example and variable file texts, and the name sets, see {@link TaskEnvironmentInput}.
 * @returns One string per problem, each naming the variable or the file it concerns, or an empty array when the list is sound.
 */
function taskEnvironmentProblems({
  spec,
  envExample,
  tfvars,
  requiredNames,
  analyticsNames
}: TaskEnvironmentInput): Array<string> {
  if (!isRecord(spec) || !Array.isArray(spec.variables)) return ['the list has no `variables` array'];
  const problems: Array<string> = [];
  const entries: ReadonlyArray<unknown> = spec.variables;
  const seen = new Set<string>();
  const requiredInList = new Set<string>();
  const valueNames: Array<string> = [];
  const parameterNames: Array<string> = [];
  const providersOf = new Map<string, ReadonlyArray<string>>();

  entries.forEach((entry, index) => {
    if (!isRecord(entry) || typeof entry.name !== 'string' || entry.name.trim() === '') {
      problems.push(`entry ${index}: has no name`);
      return;
    }
    const { name, source, required, description, identity_providers: providers } = entry;

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
    if (providers !== undefined) {
      if (
        !Array.isArray(providers) ||
        providers.length === 0 ||
        providers.some((provider) => typeof provider !== 'string' || !IDENTITY_PROVIDERS.includes(provider))
      )
        problems.push(`${name}: identity_providers must be a non-empty list of ${IDENTITY_PROVIDERS.join(', ')}`);
      else providersOf.set(name, providers);
      if (required === true) problems.push(`${name}: names identity providers, so it cannot be required`);
    }
    if (source === 'value') valueNames.push(name);
    if (source === 'parameter') parameterNames.push(name);
  });

  for (const { path, text, sibling } of tfvars) {
    const setValues = tfvarsEnvironmentValues(text);
    if (setValues === undefined) {
      problems.push(`${path}: has no environment_values block closed by a line that begins with }`);
      continue;
    }
    const setNames = new Set(setValues.keys());
    const providerType = tfvarsTopLevelString(text, 'identity_provider_type');
    for (const name of valueNames) {
      if (DERIVED_NAMES.includes(name)) {
        if (setNames.has(name))
          problems.push(`${name}: is set by the module from identity_provider_type, not in ${path}`);
      } else if (!receivedWith(providersOf.get(name), providerType)) {
        if (setNames.has(name))
          problems.push(`${name}: is set in ${path}, whose identity_provider_type does not select it`);
      } else if (!setNames.has(name)) problems.push(`${name}: has source value but no value in ${path}`);
    }
    for (const name of parameterNames) {
      if (setNames.has(name)) problems.push(`${name}: has source parameter but a value in ${path}`);
    }
    for (const name of setNames) {
      if (!seen.has(name)) problems.push(`${name}: is set in ${path} but is not in the list`);
    }
    problems.push(...siblingProblems(path, setValues, sibling));
    if (sibling.text !== undefined)
      problems.push(...identityProviderProblems(path, text, setValues, { path: sibling.path, text: sibling.text }));
  }

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
type FixtureEntry = {
  name: string;
  source: string;
  required: boolean;
  description: string;
  identity_providers?: ReadonlyArray<string>;
};

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
  entry('ANALYTICS_POSTHOG_HOST', 'value', false),
  entry('ANALYTICS_FLUSH_INTERVAL_MS', 'value', false)
];

/** A fixture env example listing every sound entry, alternating live and commented lines. */
const SOUND_ENV_EXAMPLE = SOUND_ENTRIES.map(({ name }, index) => (index % 2 === 0 ? `${name}=x` : `# ${name}=x`)).join(
  '\n'
);

/** The values the fixture AWS roots set for the three variables the Supabase root restates. */
const SIBLING_VALUES: Readonly<Record<string, string>> = {
  PUBLIC_PROJECT_ID: '00000000-0000-0000-0000-000000000001',
  ORIGIN: 'https://vaa.example.org',
  PUBLIC_SUPABASE_URL: 'https://fixtureref.supabase.co'
};

/**
 * Build a fixture Supabase root variable file that agrees with {@link SIBLING_VALUES}, with any of its three keys replaced or, given `undefined`, left out.
 *
 * @param overrides - The keys to replace or leave out.
 * @returns The variable file's text.
 */
function supabaseTfvars(overrides: Readonly<Record<string, string | undefined>> = {}): string {
  const keys: Record<string, string | undefined> = {
    project_ref: 'fixtureref',
    public_origin: SIBLING_VALUES.ORIGIN,
    public_project_id: SIBLING_VALUES.PUBLIC_PROJECT_ID,
    ...overrides
  };
  return [
    '# A fixture Supabase root.',
    ...Object.entries(keys).flatMap(([key, value]) => (value === undefined ? [] : [`${key} = "${value}"`])),
    ''
  ].join('\n');
}

/**
 * A fixture Supabase root variable file that agrees with {@link SIBLING_VALUES} and sets the `identity_provider` object.
 *
 * @param attributes - The object's attributes, one line each.
 * @returns The variable file's text.
 */
function supabaseTfvarsWithProvider(attributes: Readonly<Record<string, string>>): string {
  return [
    supabaseTfvars(),
    'identity_provider = {',
    ...Object.entries(attributes).map(([key, value]) => `  ${key} = "${value}"`),
    '}',
    ''
  ].join('\n');
}

/**
 * A fixture AWS root variable file paired with a sound sibling Supabase root.
 *
 * @param path - The AWS root's variable file.
 * @param text - Its text.
 * @param sibling - The sibling's text, a sound one by default.
 * @returns The pair.
 */
function awsTfvars(path: string, text: string, sibling: string | undefined = supabaseTfvars()): AwsTfvarsFile {
  return { path, text, sibling: { path: supabaseSiblingPath(path), text: sibling } };
}

/**
 * Build a fixture AWS root variable file whose `environment_values` block sets the given names, with a comment line inside the block.
 *
 * @param names - The names the block sets.
 * @param values - The value of each name, `x` for a name not in it; by default the values {@link supabaseTfvars} agrees with.
 * @returns The variable file's text.
 */
function tfvarsSetting(
  names: ReadonlyArray<string>,
  values: Readonly<Record<string, string>> = SIBLING_VALUES
): string {
  return [
    'aws_region = "eu-north-1"',
    '',
    'environment_values = {',
    '  # A comment inside the block.',
    ...names.map((name) => `  ${name} = "${values[name] ?? 'x'}"`),
    '}',
    ''
  ].join('\n');
}

/**
 * The variable files a sound fixture list agrees with: two AWS roots that each set every `value` entry, each with a sibling Supabase root that agrees with it.
 *
 * @param entries - The fixture entries.
 * @returns The two variable files.
 */
function soundTexts(entries: ReadonlyArray<FixtureEntry>): Pick<TaskEnvironmentInput, 'tfvars'> {
  const valueNames = entries.filter(({ source }) => source === 'value').map(({ name }) => name);
  return { tfvars: AWS_ROOT_TFVARS_PATHS.map((path) => awsTfvars(path, tfvarsSetting(valueNames))) };
}

/**
 * Check a fixture list against the fixture env example, the fixture variable files and the local name sets.
 *
 * @param entries - The fixture entries.
 * @param envExample - The env example text, {@link SOUND_ENV_EXAMPLE} by default.
 * @param texts - Variable files to use instead of the sound ones {@link soundTexts} builds from the entries.
 * @returns The problems found.
 */
function fixtureProblems(
  entries: ReadonlyArray<FixtureEntry>,
  envExample: string = SOUND_ENV_EXAMPLE,
  texts: Partial<Pick<TaskEnvironmentInput, 'tfvars'>> = {}
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
 * Two fixture AWS root variable files: the first as given, the second sound, each with a sibling Supabase root.
 *
 * @param text - The first file's text.
 * @param sibling - The first file's sibling's text, a sound one by default.
 * @returns The two files.
 */
function tfvarsWithFirst(text: string, sibling?: string): Array<AwsTfvarsFile> {
  const [first, second] = AWS_ROOT_TFVARS_PATHS;
  return [awsTfvars(first, text, sibling), awsTfvars(second, tfvarsSetting(SOUND_VALUE_NAMES))];
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

describe('taskEnvironmentProblems against the AWS roots and their Supabase siblings', () => {
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

  it.each([
    ['PUBLIC_PROJECT_ID', { public_project_id: '00000000-0000-0000-0000-000000000002' }],
    ['ORIGIN', { public_origin: 'https://other.example.org' }],
    ['PUBLIC_SUPABASE_URL', { project_ref: 'otherref' }]
  ])('names %s when the sibling Supabase root disagrees, and both files', (name, overrides) => {
    const tfvars = tfvarsWithFirst(tfvarsSetting(SOUND_VALUE_NAMES), supabaseTfvars(overrides));
    const problems = fixtureProblems(SOUND_ENTRIES, SOUND_ENV_EXAMPLE, { tfvars });
    expect(problems).toEqual([expect.stringContaining(name)]);
    expect(problems[0]).toContain(AWS_ROOT_TFVARS_PATHS[0]);
    expect(problems[0]).toContain(supabaseSiblingPath(AWS_ROOT_TFVARS_PATHS[0]));
  });

  it('names PUBLIC_SUPABASE_URL when it is not https, the ref and .supabase.co exactly', () => {
    const text = tfvarsSetting(SOUND_VALUE_NAMES, {
      ...SIBLING_VALUES,
      PUBLIC_SUPABASE_URL: 'https://fixtureref.supabase.co/'
    });
    const problems = fixtureProblems(SOUND_ENTRIES, SOUND_ENV_EXAMPLE, { tfvars: tfvarsWithFirst(text) });
    expect(problems).toEqual([expect.stringContaining('PUBLIC_SUPABASE_URL')]);
  });

  it('reports a sibling Supabase root that gives a compared key no value, and one that is missing', () => {
    const withoutRef = fixtureProblems(SOUND_ENTRIES, SOUND_ENV_EXAMPLE, {
      tfvars: tfvarsWithFirst(tfvarsSetting(SOUND_VALUE_NAMES), supabaseTfvars({ project_ref: undefined }))
    });
    expect(withoutRef).toEqual([expect.stringContaining('project_ref')]);
    const missing = fixtureProblems(SOUND_ENTRIES, SOUND_ENV_EXAMPLE, {
      tfvars: [
        {
          ...awsTfvars(AWS_ROOT_TFVARS_PATHS[0], tfvarsSetting(SOUND_VALUE_NAMES)),
          sibling: { path: 'x/supabase/terraform.tfvars', text: undefined }
        },
        awsTfvars(AWS_ROOT_TFVARS_PATHS[1], tfvarsSetting(SOUND_VALUE_NAMES))
      ]
    });
    expect(missing).toEqual([expect.stringContaining('x/supabase/terraform.tfvars')]);
  });
});

describe('taskEnvironmentProblems for the identity-provider entries', () => {
  const both = ['signicat-ftn', 'idura-ftn'];
  const providerEntries: ReadonlyArray<FixtureEntry> = [
    { ...entry('PUBLIC_IDENTITY_PROVIDER_TYPE', 'value', false), identity_providers: both },
    { ...entry('PUBLIC_IDENTITY_PROVIDER_CLIENT_ID', 'value', false), identity_providers: both },
    { ...entry('IDENTITY_CALLBACK_SERVER_SECRET', 'parameter', false), identity_providers: both },
    { ...entry('IDENTITY_PROVIDER_TOKEN_ENDPOINT', 'value', false), identity_providers: ['signicat-ftn'] },
    { ...entry('IDURA_DOMAIN', 'value', false), identity_providers: ['idura-ftn'] },
    { ...entry('IDURA_SIGNING_JWKS', 'parameter', false), identity_providers: ['idura-ftn'] }
  ];
  const entries = [...SOUND_ENTRIES, ...providerEntries];
  const envExample = `${SOUND_ENV_EXAMPLE}\n${providerEntries.map(({ name }) => `${name}=x`).join('\n')}`;

  /**
   * Check the fixture list against two AWS roots: the first as given, the second with no identity provider.
   *
   * @param first - The first root's variable file.
   * @param list - The list, the fixture entries with the identity-provider ones by default.
   * @param sibling - The first root's sibling Supabase root's text, a sound one without `identity_provider` by default.
   * @returns The problems found.
   */
  function problemsWith(first: string, list: ReadonlyArray<FixtureEntry> = entries, sibling?: string): Array<string> {
    return fixtureProblems(list, envExample, { tfvars: tfvarsWithFirst(first, sibling) });
  }

  /** A sibling Supabase root that turns on Idura with the client id the fixture AWS roots set. */
  const iduraSibling = supabaseTfvarsWithProvider({ type: 'idura-ftn', client_id: 'x' });

  it('asks a root without identity_provider_type for none of them', () => {
    expect(problemsWith(tfvarsSetting(SOUND_VALUE_NAMES))).toEqual([]);
  });

  it("asks a root with identity_provider_type for exactly its provider's values, and not for the type", () => {
    const text = `identity_provider_type = "idura-ftn"\n${tfvarsSetting([...SOUND_VALUE_NAMES, 'PUBLIC_IDENTITY_PROVIDER_CLIENT_ID', 'IDURA_DOMAIN'])}`;
    expect(problemsWith(text, entries, iduraSibling)).toEqual([]);
    const missing = `identity_provider_type = "idura-ftn"\n${tfvarsSetting([...SOUND_VALUE_NAMES, 'PUBLIC_IDENTITY_PROVIDER_CLIENT_ID'])}`;
    expect(problemsWith(missing, entries, iduraSibling)).toEqual([expect.stringContaining('IDURA_DOMAIN')]);
  });

  it('names a value set by a root whose identity_provider_type does not select it, and PUBLIC_IDENTITY_PROVIDER_TYPE whenever it is set', () => {
    const text = `identity_provider_type = "idura-ftn"\n${tfvarsSetting([...SOUND_VALUE_NAMES, 'PUBLIC_IDENTITY_PROVIDER_CLIENT_ID', 'IDURA_DOMAIN', 'IDENTITY_PROVIDER_TOKEN_ENDPOINT', 'PUBLIC_IDENTITY_PROVIDER_TYPE'])}`;
    expect(problemsWith(text, entries, iduraSibling)).toEqual([
      expect.stringContaining('PUBLIC_IDENTITY_PROVIDER_TYPE'),
      expect.stringContaining('IDENTITY_PROVIDER_TOKEN_ENDPOINT')
    ]);
    expect(problemsWith(tfvarsSetting([...SOUND_VALUE_NAMES, 'IDURA_DOMAIN']))).toEqual([
      expect.stringContaining('IDURA_DOMAIN')
    ]);
  });

  it('names an entry with an unknown provider, an empty list, or required true, and a JWKS entry from value', () => {
    const list = entries.map((e) =>
      e.name === 'IDURA_DOMAIN'
        ? { ...e, identity_providers: ['bankid'] }
        : e.name === 'IDENTITY_PROVIDER_TOKEN_ENDPOINT'
          ? { ...e, identity_providers: [] }
          : e.name === 'PUBLIC_IDENTITY_PROVIDER_CLIENT_ID'
            ? { ...e, required: true }
            : e.name === 'IDURA_SIGNING_JWKS'
              ? { ...e, source: 'value' }
              : e
    );
    const problems = problemsWith(tfvarsSetting(SOUND_VALUE_NAMES), list);
    for (const name of [
      'IDURA_DOMAIN',
      'IDENTITY_PROVIDER_TOKEN_ENDPOINT',
      'PUBLIC_IDENTITY_PROVIDER_CLIENT_ID',
      'IDURA_SIGNING_JWKS'
    ])
      expect(
        problems.some((problem) => problem.startsWith(`${name}:`)),
        name
      ).toBe(true);
  });

  /** An AWS root that turns on Idura and sets the settings the Supabase root restates. */
  const iduraRoot = `identity_provider_type = "idura-ftn"\n${tfvarsSetting(
    [
      ...SOUND_VALUE_NAMES,
      'PUBLIC_IDENTITY_PROVIDER_CLIENT_ID',
      'IDENTITY_PROVIDER_JWKS_URI',
      'IDENTITY_PROVIDER_ISSUER',
      'IDURA_DOMAIN'
    ],
    {
      ...SIBLING_VALUES,
      PUBLIC_IDENTITY_PROVIDER_CLIENT_ID: 'client',
      IDENTITY_PROVIDER_JWKS_URI: 'https://idp.example.org/jwks',
      IDENTITY_PROVIDER_ISSUER: 'https://idp.example.org'
    }
  )}`;
  const iduraProvider = {
    type: 'idura-ftn',
    client_id: 'client',
    jwks_uri: 'https://idp.example.org/jwks',
    issuer: 'https://idp.example.org'
  };
  const listWithIssuer = [
    ...entries,
    { ...entry('IDENTITY_PROVIDER_JWKS_URI', 'value', false), identity_providers: both },
    { ...entry('IDENTITY_PROVIDER_ISSUER', 'value', false), identity_providers: both }
  ];
  const envWithIssuer = `${envExample}\nIDENTITY_PROVIDER_JWKS_URI=x\nIDENTITY_PROVIDER_ISSUER=x`;

  it('finds nothing when the sibling Supabase root sets identity_provider with the same values', () => {
    const tfvars = tfvarsWithFirst(iduraRoot, supabaseTfvarsWithProvider(iduraProvider));
    expect(fixtureProblems(listWithIssuer, envWithIssuer, { tfvars })).toEqual([]);
  });

  it.each([
    ['identity_provider_type', { type: 'signicat-ftn' }],
    ['PUBLIC_IDENTITY_PROVIDER_CLIENT_ID', { client_id: 'other' }],
    ['IDENTITY_PROVIDER_JWKS_URI', { jwks_uri: 'https://other.example.org/jwks' }],
    ['IDENTITY_PROVIDER_ISSUER', { issuer: 'https://other.example.org' }]
  ])('names %s when the sibling Supabase root disagrees, and both files', (name, override) => {
    const tfvars = tfvarsWithFirst(iduraRoot, supabaseTfvarsWithProvider({ ...iduraProvider, ...override }));
    const problems = fixtureProblems(listWithIssuer, envWithIssuer, { tfvars });
    expect(problems).toEqual([expect.stringContaining(name)]);
    expect(problems[0]).toContain(AWS_ROOT_TFVARS_PATHS[0]);
    expect(problems[0]).toContain(supabaseSiblingPath(AWS_ROOT_TFVARS_PATHS[0]));
  });

  it('names a root pair where only one side turns bank authentication on, and reads no commented-out block', () => {
    const awsOnly = fixtureProblems(listWithIssuer, envWithIssuer, { tfvars: tfvarsWithFirst(iduraRoot) });
    expect(awsOnly).toEqual([expect.stringContaining('identity_provider_type')]);
    const commented = supabaseTfvarsWithProvider(iduraProvider)
      .split('\n')
      .map((line) =>
        line.startsWith('identity_provider') || line.startsWith('  ') || line === '}' ? `# ${line}` : line
      )
      .join('\n');
    expect(fixtureProblems(listWithIssuer, envWithIssuer, { tfvars: tfvarsWithFirst(iduraRoot, commented) })).toEqual([
      expect.stringContaining('identity_provider_type')
    ]);
    const supabaseOnly = fixtureProblems(listWithIssuer, envWithIssuer, {
      tfvars: tfvarsWithFirst(tfvarsSetting(SOUND_VALUE_NAMES), supabaseTfvarsWithProvider(iduraProvider))
    });
    expect(supabaseOnly).toEqual([expect.stringContaining('identity_provider:')]);
  });
});

/**
 * Check an arbitrary parsed value as the list, against the sound fixture env example and variable files.
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

  it("agrees with the start-up check, ANALYTICS_ENV, .env.example, and every AWS root's variable file and its Supabase sibling's", () => {
    expect(existsSync(specPath), `the list is expected at ${specPath}`).toBe(true);
    const problems = taskEnvironmentProblems({
      spec: JSON.parse(readFileSync(specPath, 'utf8')),
      envExample: readFileSync(envExamplePath, 'utf8'),
      tfvars: AWS_ROOT_TFVARS_PATHS.map((path) => {
        const siblingFile = `${REPOSITORY_ROOT}${supabaseSiblingPath(path)}`;
        return {
          path,
          text: readFileSync(`${REPOSITORY_ROOT}${path}`, 'utf8'),
          sibling: {
            path: supabaseSiblingPath(path),
            text: existsSync(siblingFile) ? readFileSync(siblingFile, 'utf8') : undefined
          }
        };
      }),
      requiredNames: missingRequiredEnv({}),
      analyticsNames: Object.values(ANALYTICS_ENV)
    });
    expect(problems).toEqual([]);
  });
});
