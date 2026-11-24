/**
 * Guards the trust inputs that a hand apply of the bootstrap root carries: staging's entry of the deployment map `infra/bootstrap/deployments.auto.tfvars.json` (the numeric ids of the repository and of its owner, the subjects each role trusts, the registry name and IAM prefix its live resources carry), that no entry of the map or of its example names an attribute the root's `deployments` type does not declare, which Terraform would drop without a word, that no two entries share a domain or a subject, and the plan role's permissions over the pipeline's state lock. A wrong id or subject makes a role unassumable, and nothing short of the first credentialed workflow run would show it, so the values are held here. The files are read as text; no Terraform runs and no account is reached.
 */

import { readdirSync, readFileSync } from 'node:fs';
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
const MODULE_DIR = join(REPO_ROOT, 'infra/modules/github-oidc');

const REPOSITORY = 'repo:OpenVAA/voting-advice-application';

/** The attributes the root's `deployments` object type declares. */
const DECLARED_ATTRIBUTES = [
  'github_repository_id',
  'github_repository_owner_id',
  'plan_subjects',
  'deploy_subjects',
  'deploy_branches',
  'hosted_zone_id',
  'domain',
  'environment',
  'destroy_environment',
  'registry_name',
  'iam_name_prefix'
];

/** One entry of the deployment map, as far as these tests read it. */
type Entry = Record<string, unknown> & {
  domain?: unknown;
  plan_subjects?: unknown;
  deploy_subjects?: unknown;
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

/** The tfvars file with every comment line removed, so a commented-out assignment counts as absent. */
function tfvars(): string {
  return readFileSync(TFVARS, 'utf8')
    .split('\n')
    .filter((line) => !/^\s*#/.test(line))
    .join('\n');
}

/** The value of a top-level string assignment, or `undefined` when the name is not assigned. */
function stringValue(name: string): string | undefined {
  return new RegExp(`^${name}\\s*=\\s*"([^"]*)"\\s*$`, 'm').exec(tfvars())?.[1];
}

/** Every `.tf` file of the github-oidc module, by file name. */
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

/** The domains and subjects that appear in more than one place across a map's entries. */
function duplicates(map: DeploymentMap): Array<string> {
  const entries = Object.values(map);
  const domains = entries.map((entry) => String(entry.domain));
  const subjects = entries.flatMap((entry) => [...strings(entry.plan_subjects), ...strings(entry.deploy_subjects)]);
  return [...repeated(domains).map((d) => `domain ${d}`), ...repeated(subjects).map((s) => `subject ${s}`)];
}

const MAP = readMap(MAP_FILE);
const EXAMPLE_MAP = readMap(EXAMPLE_MAP_FILE);

describe("the bootstrap root's deployment map and the github-oidc module", () => {
  const staging = MAP.staging;

  it('assigns the account values in terraform.tfvars, and no deployment value', () => {
    expect(stringValue('aws_account_id')).toBe('471112560111');
    expect(stringValue('name_prefix')).toBe('openvaa');
    expect(stringValue('iam_path')).toBe('/openvaa/');
    expect(tfvars()).not.toMatch(
      /^\s*(deployments|github_repository_id|plan_subjects|deploy_subjects|registry_name)\s*=/m
    );
  });

  it('holds an entry for staging', () => {
    expect(staging, `${MAP_FILE} has no staging entry`).toBeDefined();
  });

  it("gives staging's entry the numeric ids of the repository and of its owner", () => {
    expect(staging.github_repository_id).toBe('546467466');
    expect(staging.github_repository_owner_id).toBe('115159211');
  });

  it("lets staging's deploy role trust the staging and staging-destroy environments and nothing else", () => {
    expect(staging.deploy_subjects).toEqual([
      `${REPOSITORY}:environment:staging`,
      `${REPOSITORY}:environment:staging-destroy`
    ]);
  });

  it("lets staging's plan role trust pull requests and nothing else", () => {
    expect(staging.plan_subjects).toEqual([`${REPOSITORY}:pull_request`]);
  });

  it("keeps the registry name and IAM prefix staging's live resources carry", () => {
    expect(staging.registry_name).toBe('openvaa-frontend');
    expect(staging.iam_name_prefix).toBe('openvaa');
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
