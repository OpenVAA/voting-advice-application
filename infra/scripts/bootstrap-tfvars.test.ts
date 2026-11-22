/**
 * Guards the trust inputs that a hand apply of the bootstrap root carries: staging's entry of the deployment map `infra/bootstrap/deployments.auto.tfvars.json` (the numeric ids of the repository and of its owner, the subject prefix and GitHub Environments the roles' trusts derive from, the registry name and IAM prefix its live resources carry), that no entry of the map or of its example names an attribute the root's `deployments` type does not declare, which Terraform would drop without a word, that no two entries share a domain or a derived subject, the plan role's permissions over the pipeline's state lock, and that each deployment's AWS root names its resources as the bootstrap root scopes the deploy role to them. A wrong id or subject makes a role unassumable, and nothing short of the first credentialed workflow run would show it, so the values are held here. The files are read as text; no Terraform runs and no account is reached.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');
const BOOTSTRAP_DIR = join(REPO_ROOT, 'infra/bootstrap');
const MAP_FILE = 'infra/bootstrap/deployments.auto.tfvars.json';
const EXAMPLE_MAP_FILE = 'infra/bootstrap/example-deployments.json';
const TFVARS = join(BOOTSTRAP_DIR, 'terraform.tfvars');
const VARIABLES_FILE = join(BOOTSTRAP_DIR, 'variables.tf');
const MODULE_DIR = join(REPO_ROOT, 'infra/modules/pipeline-roles');

const REPOSITORY = 'repo:OpenVAA/voting-advice-application';

/** The attributes the root's `deployments` object type declares. */
const DECLARED_ATTRIBUTES = [
  'github_repository_id',
  'github_repository_owner_id',
  'subject_prefix',
  'deploy_branches',
  'hosted_zone_id',
  'domain',
  'github_environment',
  'github_destroy_environment',
  'registry_name',
  'iam_name_prefix',
  'smoke'
];

/** One entry of the deployment map, as far as these tests read it. */
type Entry = Record<string, unknown> & {
  domain?: unknown;
  subject_prefix?: unknown;
  deploy_branches?: unknown;
  github_environment?: unknown;
  github_destroy_environment?: unknown;
};

type DeploymentMap = Record<string, Entry>;

/**
 * Reads a deployment map file's `deployments` object.
 *
 * @param path - The file, relative to the repository root.
 * @returns The map, keyed by deployment.
 * @throws When the file is not valid JSON or holds no `deployments` object.
 */
function readMap(path: string): DeploymentMap {
  const text = readFileSync(join(REPO_ROOT, path), 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`${path}: is not valid JSON`);
  }
  const deployments = (parsed as { deployments?: unknown } | null)?.deployments;
  if (typeof deployments !== 'object' || deployments === null || Array.isArray(deployments)) {
    throw new Error(`${path}: holds no deployments object`);
  }
  return deployments as DeploymentMap;
}

/** A tfvars file with every comment line removed, so a commented-out assignment counts as absent. */
function tfvars(path = TFVARS): string {
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter((line) => !/^\s*#/.test(line))
    .join('\n');
}

/** The value of a top-level string assignment in a tfvars file, or `undefined` when the name is not assigned. */
function stringValue(name: string, path = TFVARS): string | undefined {
  return new RegExp(`^${name}\\s*=\\s*"([^"]*)"\\s*$`, 'm').exec(tfvars(path))?.[1];
}

/** Every `.tf` file of the pipeline-roles module, by file name. */
function moduleFiles(): Map<string, string> {
  return new Map(
    readdirSync(MODULE_DIR)
      .filter((name) => name.endsWith('.tf'))
      .map((name) => [name, readFileSync(join(MODULE_DIR, name), 'utf8')])
  );
}

/** The text of one top-level block, from its header line to the closing brace at column 0. */
function block(source: string, header: string): string | undefined {
  const start = source.indexOf(`${header} {\n`);
  if (start < 0) return undefined;
  const end = source.indexOf('\n}\n', start);
  return source.slice(start, end < 0 ? undefined : end + 2);
}

/** The attribute names of the `object({ ... })` type of `variable "deployments"` in the root's variables.tf. */
function declaredAttributes(): Array<string> {
  const variable = block(readFileSync(VARIABLES_FILE, 'utf8'), 'variable "deployments"') ?? '';
  const object = /type\s*=\s*map\(object\(\{\n([\s\S]*?)\n\s*\}\)\)/.exec(variable)?.[1] ?? '';
  return [...object.matchAll(/^\s+(\w+)\s+=/gm)].map((m) => m[1]);
}

/** The entry attributes of a map that its root does not declare, as `<key>.<attribute>`. */
function undeclaredAttributes(map: DeploymentMap, declared: Array<string>): Array<string> {
  return Object.entries(map).flatMap(([key, entry]) =>
    Object.keys(entry)
      .filter((name) => !declared.includes(name))
      .map((name) => `${key}.${name}`)
  );
}

/** The strings of a list-valued entry attribute, or none when it is not a list of strings. */
function strings(value: unknown): Array<string> {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

/** The values that appear more than once in a list, each once. */
function repeated(values: Array<string>): Array<string> {
  return [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
}

/**
 * The OIDC subjects an entry's plan and deploy roles trust, derived as `local.plan_subjects` and `local.deploy_subjects` of the bootstrap root derive them.
 *
 * @param entry - One entry of a deployment map.
 * @returns The plan subject, then the deploy subjects.
 */
function derivedSubjects(entry: Entry): Array<string> {
  const prefix = String(entry.subject_prefix);
  const environments = [entry.github_environment, entry.github_destroy_environment].filter(
    (name): name is string => typeof name === 'string'
  );
  const deploy =
    typeof entry.github_environment === 'string'
      ? environments.map((name) => `${prefix}:environment:${name}`)
      : strings(entry.deploy_branches).map((branch) => `${prefix}:ref:refs/heads/${branch}`);
  return [`${prefix}:pull_request`, ...deploy];
}

/** The domains and derived subjects that appear in more than one place across a map's entries. */
function duplicates(map: DeploymentMap): Array<string> {
  const entries = Object.values(map);
  const domains = entries.map((entry) => String(entry.domain));
  const subjects = entries.flatMap(derivedSubjects);
  return [...repeated(domains).map((d) => `domain ${d}`), ...repeated(subjects).map((s) => `subject ${s}`)];
}

const MAP = readMap(MAP_FILE);
const EXAMPLE_MAP = readMap(EXAMPLE_MAP_FILE);

describe("the bootstrap root's deployment map and the pipeline-roles module", () => {
  const staging = MAP.staging;

  it('assigns the account values in terraform.tfvars, and no deployment value', () => {
    expect(stringValue('aws_account_id')).toBe('471112560111');
    expect(stringValue('name_prefix')).toBe('openvaa');
    expect(stringValue('iam_path')).toBe('/openvaa/');
    expect(tfvars()).not.toMatch(/^\s*(deployments|github_repository_id|subject_prefix|registry_name)\s*=/m);
  });

  it('holds an entry for staging', () => {
    expect(staging, `${MAP_FILE} has no staging entry`).toBeDefined();
  });

  it("gives staging's entry the numeric ids of the repository and of its owner", () => {
    expect(staging.github_repository_id).toBe('546467466');
    expect(staging.github_repository_owner_id).toBe('115159211');
  });

  it("gives staging's entry the repository's name-based subject prefix", () => {
    expect(staging.subject_prefix).toBe(REPOSITORY);
  });

  it("runs staging's deploy and destroy jobs in the staging and staging-destroy GitHub Environments", () => {
    expect(staging.github_environment).toBe('staging');
    expect(staging.github_destroy_environment).toBe('staging-destroy');
  });

  it("lets staging's roles trust pull requests and the staging and staging-destroy environments, and nothing else", () => {
    expect(derivedSubjects(staging)).toEqual([
      `${REPOSITORY}:pull_request`,
      `${REPOSITORY}:environment:staging`,
      `${REPOSITORY}:environment:staging-destroy`
    ]);
  });

  it("keeps the registry name and IAM prefix staging's live resources carry", () => {
    expect(staging.registry_name).toBe('openvaa-frontend');
    expect(staging.iam_name_prefix).toBe('openvaa');
  });

  it("turns the deployed smoke run on for staging's entry", () => {
    expect(staging.smoke).toBe(true);
  });

  it("reads every attribute of the root's deployments type from variables.tf", () => {
    expect(declaredAttributes()).toEqual(DECLARED_ATTRIBUTES);
  });

  it.each([
    [MAP_FILE, MAP],
    [EXAMPLE_MAP_FILE, EXAMPLE_MAP]
  ])('names in %s only attributes the deployments type declares', (_path, map) => {
    expect(undeclaredAttributes(map, declaredAttributes())).toEqual([]);
  });

  it('reports a red copy of the map whose staging entry misspells registry_name', () => {
    const { registry_name, ...rest } = staging;
    const misspelled: DeploymentMap = { ...MAP, staging: { ...rest, registy_name: registry_name } };
    expect(undeclaredAttributes(misspelled, declaredAttributes())).toEqual(['staging.registy_name']);
  });

  it.each([
    [MAP_FILE, MAP],
    [EXAMPLE_MAP_FILE, EXAMPLE_MAP]
  ])('shares no domain and no subject between the entries of %s', (_path, map) => {
    expect(duplicates(map)).toEqual([]);
  });

  it('reports a red copy of the map that repeats staging under a second key', () => {
    const repeated: DeploymentMap = { ...MAP, 'staging-two': staging };
    expect(duplicates(repeated)).toEqual([
      'domain staging.openvaa.org',
      `subject ${REPOSITORY}:pull_request`,
      `subject ${REPOSITORY}:environment:staging`,
      `subject ${REPOSITORY}:environment:staging-destroy`
    ]);
  });

  it('pins neither trust to a workflow', () => {
    for (const [name, source] of moduleFiles()) {
      expect(source, name).not.toContain('job_workflow_ref');
    }
  });

  it('gives the plan role no policy that names the state lock', () => {
    for (const [name, source] of moduleFiles()) {
      expect(source, name).not.toContain('plan_lock');
    }
  });

  it('attaches to the plan role the read-only policy and its deny, and nothing else', () => {
    const attached = [...moduleFiles().values()].flatMap((source) =>
      [
        ...source.matchAll(
          /resource "aws_iam_role_policy_attachment" "\w+" \{\s*role\s*=\s*aws_iam_role\.plan\.name\s*policy_arn\s*=\s*(\S+)/g
        )
      ].map((m) => m[1])
    );
    expect(attached.sort()).toEqual(['"arn:aws:iam::aws:policy/ReadOnlyAccess"', 'aws_iam_policy.plan_deny.arn']);
  });

  it("keeps the deploy role's lock statement on the pipeline's lock object", () => {
    const policies = moduleFiles().get('policies.tf') ?? '';
    expect(policies).toMatch(
      /^\s*pipeline_lock_arn\s*=\s*"\$\{var\.state_bucket_arn\}\/\$\{var\.pipeline_state_key\}\.tflock"$/m
    );
    const document = block(policies, 'data "aws_iam_policy_document" "tfstate_pipeline"') ?? '';
    const lock = /statement \{\s*sid\s*=\s*"StateLock"([\s\S]*?)\n {2}\}/.exec(document)?.[1] ?? '';
    expect(lock).toMatch(/actions\s*=\s*\["s3:GetObject", "s3:PutObject", "s3:DeleteObject"\]/);
    expect(lock).toMatch(/resources\s*=\s*\[local\.pipeline_lock_arn\]/);
  });
});

/** The deployments of the map that have an AWS root, with the path of its tfvars file relative to the repository root. */
const AWS_ROOTS = Object.keys(MAP)
  .map((key) => ({ key, path: `infra/envs/${key}/aws/terraform.tfvars` }))
  .filter(({ path }) => existsSync(join(REPO_ROOT, path)));

/** The value of a top-level string assignment in the text of a tfvars file, comment lines left out. */
function assigned(text: string, name: string): string | undefined {
  const body = text
    .split('\n')
    .filter((line) => !/^\s*#/.test(line))
    .join('\n');
  return new RegExp(`^${name}\\s*=\\s*"([^"]*)"\\s*$`, 'm').exec(body)?.[1];
}

/**
 * The values of a deployment's AWS root tfvars that differ from the names the bootstrap root scopes the deploy role and the execution role to. The deploy role may change only resources named `<name_prefix>-<key>…`, tagged `Environment=<key>` and under `/openvaa/<key>/`, so a root that names its resources otherwise is denied at apply.
 *
 * @param key - The deployment key.
 * @param path - The tfvars file, relative to the repository root, for the messages.
 * @param text - The file's text.
 * @returns One message per differing value, naming the file, the key and both values.
 */
function awsRootMismatches(key: string, path: string, text: string): Array<string> {
  const entry = MAP[key];
  const account = stringValue('aws_account_id');
  const namePrefix = stringValue('name_prefix');
  const registryName = typeof entry.registry_name === 'string' ? entry.registry_name : `${namePrefix}-${key}-frontend`;
  const expected: Record<string, string | undefined> = {
    environment: key,
    name_prefix: namePrefix,
    aws_account_id: account,
    aws_region: stringValue('aws_region'),
    execution_role_arn: `arn:aws:iam::${account}:role${stringValue('iam_path')}${namePrefix}-${key}-frontend-execution`,
    parameter_path: `/openvaa/${key}/frontend`
  };
  const mismatches = Object.entries(expected)
    .filter(([name, value]) => assigned(text, name) !== value)
    .map(
      ([name, value]) =>
        `${path}: ${name} of deployment ${key} is ${JSON.stringify(assigned(text, name))}, not "${value}"`
    );
  const registryUrl = assigned(text, 'registry_url');
  if (!registryUrl?.endsWith(`/${registryName}`)) {
    mismatches.push(
      `${path}: registry_url of deployment ${key} is ${JSON.stringify(registryUrl)}, which does not end in /${registryName}`
    );
  }
  return mismatches;
}

describe("each deployment's AWS root against the bootstrap root that scopes its roles", () => {
  it('reaches at least the staging AWS root', () => {
    expect(AWS_ROOTS.map(({ key }) => key)).toContain('staging');
  });

  it.each(AWS_ROOTS)(
    'names in infra/envs/$key/aws the environment, prefix, account, region, execution role, parameter path and registry the bootstrap root derives',
    ({ key, path }) => {
      expect(awsRootMismatches(key, path, readFileSync(join(REPO_ROOT, path), 'utf8'))).toEqual([]);
    }
  );

  it('reports a red copy of the staging AWS root that keeps the example environment and parameter path', () => {
    const path = 'infra/envs/staging/aws/terraform.tfvars';
    const text = readFileSync(join(REPO_ROOT, path), 'utf8')
      .replace(/^environment\s*=\s*"staging"$/m, 'environment = "example"')
      .replace(/^parameter_path\s*=\s*"[^"]*"$/m, 'parameter_path = "/openvaa/example/frontend"');
    expect(awsRootMismatches('staging', path, text)).toEqual([
      `${path}: environment of deployment staging is "example", not "staging"`,
      `${path}: parameter_path of deployment staging is "/openvaa/example/frontend", not "/openvaa/staging/frontend"`
    ]);
  });
});
