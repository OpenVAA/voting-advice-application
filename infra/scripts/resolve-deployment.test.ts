/**
 * The deployment resolver, run against fixture maps and against the repository's own map.
 *
 * Each fixture case builds a throwaway repository tree holding a copy of the script, `scripts/lib/cli.sh`, the real `infra/bootstrap/terraform.tfvars`, a fixture deployment map and the `infra/envs/<key>/{aws,supabase}` directories the case names, and runs the script there. The fixture entries carry the stand-in repository ids `111` and `222`. One case runs the real script on the real map and pins every value staging's workflows use. The child gets a minimal environment, so no credential of the shell that runs the suite reaches it.
 */

import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..');
const SCRIPT = join(HERE, 'resolve-deployment.sh');
const CLI = join(REPO_ROOT, 'scripts', 'lib', 'cli.sh');
const TFVARS = join(REPO_ROOT, 'infra', 'bootstrap', 'terraform.tfvars');

/** One entry of a fixture map, in the shape of `deployments.auto.tfvars.json`. */
type Entry = {
  github_repository_id: string;
  deploy_branches: Array<string>;
  domain: string;
  github_environment?: string;
  github_destroy_environment?: string;
  iam_name_prefix?: string;
  smoke?: boolean;
};

interface RunResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

const dirs: Array<string> = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** An entry of repository `id` listing `branches`, with both GitHub Environments named after `key`. */
function entry(id: string, key: string, branches: Array<string>): Entry {
  return {
    github_repository_id: id,
    deploy_branches: branches,
    domain: `${key}.example.org`,
    github_environment: key,
    github_destroy_environment: `${key}-destroy`
  };
}

/** The usual fixture: `alpha` owned by repository 111, `beta` owned by repository 222. */
const MAP = {
  deployments: {
    alpha: entry('111', 'alpha', ['deploy/alpha', 'deploy-evidence/*']),
    beta: entry('222', 'beta', ['deploy/beta'])
  }
};

/** A throwaway tree holding the script, `cli.sh`, the real account tfvars, `map` (written verbatim when a string) and the roots of `envKeys`. */
function makeRepo(map: unknown, envKeys: Array<string> = ['alpha', 'beta']): string {
  const root = mkdtempSync(join(tmpdir(), 'resolve-deployment-test-'));
  dirs.push(root);
  mkdirSync(join(root, 'infra', 'scripts'), { recursive: true });
  copyFileSync(SCRIPT, join(root, 'infra', 'scripts', 'resolve-deployment.sh'));
  mkdirSync(join(root, 'scripts', 'lib'), { recursive: true });
  copyFileSync(CLI, join(root, 'scripts', 'lib', 'cli.sh'));
  mkdirSync(join(root, 'infra', 'bootstrap'), { recursive: true });
  copyFileSync(TFVARS, join(root, 'infra', 'bootstrap', 'terraform.tfvars'));
  writeFileSync(
    join(root, 'infra', 'bootstrap', 'deployments.auto.tfvars.json'),
    typeof map === 'string' ? map : JSON.stringify(map, null, 2)
  );
  for (const key of envKeys) {
    mkdirSync(join(root, 'infra', 'envs', key, 'aws'), { recursive: true });
    mkdirSync(join(root, 'infra', 'envs', key, 'supabase'), { recursive: true });
  }
  return root;
}

function runIn(root: string, args: Array<string>): RunResult {
  const result = spawnSync('bash', [join(root, 'infra', 'scripts', 'resolve-deployment.sh'), ...args], {
    cwd: tmpdir(),
    encoding: 'utf8',
    env: { PATH: process.env.PATH ?? '', HOME: process.env.HOME ?? '' },
    timeout: 30_000
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

/** Resolve on a fresh tree of `map` and `envKeys`. */
function resolve(args: Array<string>, map: unknown = MAP, envKeys?: Array<string>): RunResult {
  return runIn(makeRepo(map, envKeys), args);
}

/** The `name=value` lines of a run, as a mapping. */
function lines(stdout: string): Record<string, string> {
  return Object.fromEntries(
    stdout
      .split('\n')
      .filter((line) => line.includes('='))
      .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)])
  );
}

function deploy(id: string, ref: string): Array<string> {
  return ['--mode', 'deploy', '--repository-id', id, '--ref', ref];
}

function destroy(id: string, ref: string, event: string): Array<string> {
  return ['--mode', 'destroy', '--repository-id', id, '--ref', ref, '--event', event];
}

function plan(id: string): Array<string> {
  return ['--mode', 'plan', '--repository-id', id];
}

const STAGING_LINES = [
  'key=staging',
  'github_environment=staging',
  'github_destroy_environment=staging-destroy',
  'domain=staging.openvaa.org',
  'smoke=true',
  'aws_account_id=471112560111',
  'aws_region=eu-north-1',
  'state_bucket=openvaa-tfstate-471112560111',
  'aws_root=infra/envs/staging/aws',
  'supabase_root=infra/envs/staging/supabase',
  'state_key=pipeline/staging/aws/terraform.tfstate',
  'supabase_state_key=hand/staging/supabase/terraform.tfstate',
  'deploy_role_arn=arn:aws:iam::471112560111:role/openvaa/openvaa-staging-deploy',
  'plan_role_arn=arn:aws:iam::471112560111:role/openvaa/openvaa-plan',
  'topic_arn=arn:aws:sns:eu-north-1:471112560111:openvaa-staging-frontend-deployments',
  'cluster_name=openvaa-staging',
  'service_name=openvaa-staging-frontend',
  'destroy_branch=deploy-evidence/destroy-staging',
  'destroy_confirm=destroy staging aws'
];

describe('resolve-deployment.sh on the repository map', () => {
  it('derives every name staging uses today from a push to deploy/staging', () => {
    const result = spawnSync('bash', [SCRIPT, ...deploy('546467466', 'deploy/staging')], {
      encoding: 'utf8',
      env: { PATH: process.env.PATH ?? '', HOME: process.env.HOME ?? '' },
      timeout: 30_000
    });
    expect(result.stdout).toBe(STAGING_LINES.map((line) => `${line}\n`).join(''));
    expect(result.status).toBe(0);
  });

  it('owns nothing for another repository id', () => {
    const result = spawnSync('bash', [SCRIPT, ...deploy('1468971368', 'deploy/nuorten-2027')], {
      encoding: 'utf8',
      env: { PATH: process.env.PATH ?? '', HOME: process.env.HOME ?? '' },
      timeout: 30_000
    });
    expect(result.stdout).toBe('failed=no_owned_entry\n');
    expect(result.status).toBe(1);
  });
});

describe('resolve-deployment.sh in deploy mode', () => {
  it('resolves the entry that lists the ref exactly, with derived names', () => {
    const { status, stdout } = resolve(deploy('111', 'deploy/alpha'));
    expect(lines(stdout)).toEqual({
      key: 'alpha',
      github_environment: 'alpha',
      github_destroy_environment: 'alpha-destroy',
      domain: 'alpha.example.org',
      smoke: 'false',
      aws_account_id: '471112560111',
      aws_region: 'eu-north-1',
      state_bucket: 'openvaa-tfstate-471112560111',
      aws_root: 'infra/envs/alpha/aws',
      supabase_root: 'infra/envs/alpha/supabase',
      state_key: 'pipeline/alpha/aws/terraform.tfstate',
      supabase_state_key: 'hand/alpha/supabase/terraform.tfstate',
      deploy_role_arn: 'arn:aws:iam::471112560111:role/openvaa/openvaa-alpha-deploy',
      plan_role_arn: 'arn:aws:iam::471112560111:role/openvaa/openvaa-alpha-plan',
      topic_arn: 'arn:aws:sns:eu-north-1:471112560111:openvaa-alpha-frontend-deployments',
      cluster_name: 'openvaa-alpha',
      service_name: 'openvaa-alpha-frontend',
      destroy_branch: 'deploy-evidence/destroy-alpha',
      destroy_confirm: 'destroy alpha aws'
    });
    expect(status).toBe(0);
  });

  it('takes the plan role name from iam_name_prefix when the entry sets it', () => {
    const map = { deployments: { alpha: { ...MAP.deployments.alpha, iam_name_prefix: 'shared' } } };
    const { status, stdout } = resolve(deploy('111', 'deploy/alpha'), map);
    expect(lines(stdout)).toMatchObject({
      plan_role_arn: 'arn:aws:iam::471112560111:role/openvaa/shared-plan',
      deploy_role_arn: 'arn:aws:iam::471112560111:role/openvaa/openvaa-alpha-deploy'
    });
    expect(status).toBe(0);
  });

  it('prints empty GitHub Environments for an entry that names none', () => {
    const { github_environment: _e, github_destroy_environment: _d, ...bare } = MAP.deployments.alpha;
    const { status, stdout } = resolve(deploy('111', 'deploy/alpha'), { deployments: { alpha: bare } });
    expect(stdout).toContain('\ngithub_environment=\ngithub_destroy_environment=\n');
    expect(status).toBe(0);
  });

  it('prints smoke=true only for an entry that sets smoke to true', () => {
    const on = resolve(deploy('111', 'deploy/alpha'), {
      deployments: { alpha: { ...MAP.deployments.alpha, smoke: true } }
    });
    expect(lines(on.stdout).smoke).toBe('true');
    expect(on.status).toBe(0);
    const off = resolve(deploy('111', 'deploy/alpha'), {
      deployments: { alpha: { ...MAP.deployments.alpha, smoke: false } }
    });
    expect(lines(off.stdout).smoke).toBe('false');
    expect(off.status).toBe(0);
  });

  it('refuses an entry whose smoke is not a boolean', () => {
    const { status, stdout } = resolve(deploy('111', 'deploy/alpha'), {
      deployments: { alpha: { ...MAP.deployments.alpha, smoke: 'yes' } }
    });
    expect(stdout).toBe('failed=bad_map\n');
    expect(status).toBe(1);
  });

  it('matches a one-segment pattern', () => {
    const { status, stdout } = resolve(deploy('111', 'deploy-evidence/run-1'));
    expect(lines(stdout).key).toBe('alpha');
    expect(status).toBe(0);
  });

  it.each([
    ['a ref two segments below a pattern', 'deploy-evidence/a/b'],
    ['the pattern prefix with an empty segment', 'deploy-evidence/'],
    ['a destroy branch, which never deploys', 'deploy-evidence/destroy-alpha'],
    ['a ref the owned entry does not list', 'deploy/other'],
    ["another repository's ref", 'deploy/beta']
  ])('refuses %s', (_title, ref) => {
    const { status, stdout } = resolve(deploy('111', ref));
    expect(stdout).toBe('failed=no_branch_match\n');
    expect(status).toBe(1);
  });

  it('refuses a repository id no entry carries', () => {
    const { status, stdout } = resolve(deploy('333', 'deploy/alpha'));
    expect(stdout).toBe('failed=no_owned_entry\n');
    expect(status).toBe(1);
  });

  it('refuses a ref two owned entries match, naming both', () => {
    const map = {
      deployments: {
        alpha: entry('111', 'alpha', ['deploy-evidence/*']),
        gamma: entry('111', 'gamma', ['deploy-evidence/*'])
      }
    };
    const { status, stdout, stderr } = resolve(deploy('111', 'deploy-evidence/run-1'), map, ['alpha', 'gamma']);
    expect(stdout).toBe('failed=ambiguous\n');
    expect(stderr).toContain('alpha');
    expect(stderr).toContain('gamma');
    expect(status).toBe(1);
  });

  it.each([
    ['an upper-case letter', 'Alpha'],
    ['a leading digit', '1alpha'],
    ['a dot', 'al.pha'],
    ['a newline', 'alpha\nbeta'],
    ['sixteen characters', 'abcdefghijklmnop']
  ])('refuses an owned key with %s', (_title, key) => {
    const map = { deployments: { [key]: entry('111', 'alpha', ['deploy/alpha']) } };
    const { status, stdout } = resolve(deploy('111', 'deploy/alpha'), map, []);
    expect(stdout).toBe('failed=bad_key\n');
    expect(status).toBe(1);
  });

  it('accepts a key of fifteen characters', () => {
    const key = 'abcdefghijklmno';
    const map = { deployments: { [key]: entry('111', key, ['deploy/long']) } };
    const { status, stdout } = resolve(deploy('111', 'deploy/long'), map, [key]);
    expect(lines(stdout).key).toBe(key);
    expect(status).toBe(0);
  });

  it.each([
    ['aws', 'supabase'],
    ['supabase', 'aws']
  ])('refuses a resolved key whose %s root is missing', (missing, present) => {
    const root = makeRepo(MAP, []);
    mkdirSync(join(root, 'infra', 'envs', 'alpha', present), { recursive: true });
    const { status, stdout, stderr } = runIn(root, deploy('111', 'deploy/alpha'));
    expect(stdout).toBe('failed=missing_root\n');
    expect(stderr).toContain(`infra/envs/alpha/${missing}`);
    expect(status).toBe(1);
  });

  it('appends the same lines to the --github-output file', () => {
    const root = makeRepo(MAP);
    const output = join(root, 'github-output');
    writeFileSync(output, 'earlier=1\n');
    const { status, stdout } = runIn(root, [...deploy('111', 'deploy/alpha'), '--github-output', output]);
    expect(status).toBe(0);
    expect(readFileSync(output, 'utf8')).toBe(`earlier=1\n${stdout}`);
  });

  it('writes nothing to the --github-output file on a refusal', () => {
    const root = makeRepo(MAP);
    const output = join(root, 'github-output');
    writeFileSync(output, '');
    const { status } = runIn(root, [...deploy('111', 'deploy/other'), '--github-output', output]);
    expect(status).toBe(1);
    expect(readFileSync(output, 'utf8')).toBe('');
  });
});

describe('resolve-deployment.sh in destroy mode', () => {
  it("resolves a push to an owned entry's destroy branch", () => {
    const { status, stdout } = resolve(destroy('111', 'deploy-evidence/destroy-alpha', 'push'));
    expect(lines(stdout)).toMatchObject({ key: 'alpha', github_destroy_environment: 'alpha-destroy' });
    expect(status).toBe(0);
  });

  it.each([
    ['a destroy branch no owned entry has', 'deploy-evidence/destroy-other'],
    ["another repository's destroy branch", 'deploy-evidence/destroy-beta'],
    ['a deploy branch', 'deploy/alpha']
  ])('refuses a push to %s', (_title, ref) => {
    const { status, stdout } = resolve(destroy('111', ref, 'push'));
    expect(stdout).toBe('failed=no_branch_match\n');
    expect(status).toBe(1);
  });

  it('resolves a dispatch from a deploy branch', () => {
    const { status, stdout } = resolve(destroy('111', 'deploy/alpha', 'workflow_dispatch'));
    expect(lines(stdout)).toMatchObject({ key: 'alpha', destroy_confirm: 'destroy alpha aws' });
    expect(status).toBe(0);
  });

  it('refuses a dispatch from a ref the owned entry does not list', () => {
    const { status, stdout } = resolve(destroy('111', 'main', 'workflow_dispatch'));
    expect(stdout).toBe('failed=no_branch_match\n');
    expect(status).toBe(1);
  });

  it('resolves staging on the repository map from its destroy branch', () => {
    const result = spawnSync('bash', [SCRIPT, ...destroy('546467466', 'deploy-evidence/destroy-staging', 'push')], {
      encoding: 'utf8',
      env: { PATH: process.env.PATH ?? '', HOME: process.env.HOME ?? '' },
      timeout: 30_000
    });
    expect(result.stdout).toBe(STAGING_LINES.map((line) => `${line}\n`).join(''));
    expect(result.status).toBe(0);
  });
});

describe('resolve-deployment.sh in plan mode', () => {
  it('lists the owned entries whose AWS root exists, sorted by key', () => {
    const map = {
      deployments: {
        zeta: { ...entry('111', 'zeta', ['deploy/zeta']), iam_name_prefix: 'shared' },
        alpha: entry('111', 'alpha', ['deploy/alpha']),
        gone: entry('111', 'gone', ['deploy/gone']),
        beta: entry('222', 'beta', ['deploy/beta'])
      }
    };
    const { status, stdout } = resolve(plan('111'), map, ['zeta', 'alpha', 'beta']);
    expect(stdout).toBe(
      `deployments=${JSON.stringify([
        {
          key: 'alpha',
          aws_root: 'infra/envs/alpha/aws',
          plan_role_arn: 'arn:aws:iam::471112560111:role/openvaa/openvaa-alpha-plan',
          deploy_role_arn: 'arn:aws:iam::471112560111:role/openvaa/openvaa-alpha-deploy',
          cluster_name: 'openvaa-alpha',
          service_name: 'openvaa-alpha-frontend'
        },
        {
          key: 'zeta',
          aws_root: 'infra/envs/zeta/aws',
          plan_role_arn: 'arn:aws:iam::471112560111:role/openvaa/shared-plan',
          deploy_role_arn: 'arn:aws:iam::471112560111:role/openvaa/openvaa-zeta-deploy',
          cluster_name: 'openvaa-zeta',
          service_name: 'openvaa-zeta-frontend'
        }
      ])}\n`
    );
    expect(status).toBe(0);
  });

  it('refuses when no owned entry has an AWS root', () => {
    const { status, stdout } = resolve(plan('111'), MAP, ['beta']);
    expect(stdout).toBe('failed=no_owned_entry\n');
    expect(status).toBe(1);
  });

  it('refuses a repository id no entry carries', () => {
    const { status, stdout } = resolve(plan('333'));
    expect(stdout).toBe('failed=no_owned_entry\n');
    expect(status).toBe(1);
  });

  it('appends the deployments line to the --github-output file', () => {
    const root = makeRepo(MAP);
    const output = join(root, 'github-output');
    const { status, stdout } = runIn(root, [...plan('111'), '--github-output', output]);
    expect(status).toBe(0);
    expect(readFileSync(output, 'utf8')).toBe(stdout);
  });

  it('lists staging alone on the repository map', () => {
    const result = spawnSync('bash', [SCRIPT, ...plan('546467466')], {
      encoding: 'utf8',
      env: { PATH: process.env.PATH ?? '', HOME: process.env.HOME ?? '' },
      timeout: 30_000
    });
    const list = JSON.parse(lines(result.stdout).deployments) as Array<{ key: string; plan_role_arn: string }>;
    expect(list.map(({ key, plan_role_arn }) => [key, plan_role_arn])).toEqual([
      ['staging', 'arn:aws:iam::471112560111:role/openvaa/openvaa-plan']
    ]);
    expect(result.status).toBe(0);
  });
});

describe('resolve-deployment.sh refuses a broken map', () => {
  it('refuses a map that is not JSON without printing its text', () => {
    const { status, stdout, stderr } = resolve(deploy('111', 'deploy/alpha'), '{"deployments": SECRET-LOOKING');
    expect(stdout).toBe('failed=bad_map\n');
    expect(stderr).not.toContain('SECRET-LOOKING');
    expect(status).toBe(1);
  });

  it.each([
    ['no deployments object', { other: {} }],
    ['an entry that is not an object', { deployments: { alpha: 'x' } }],
    ['a domain holding a newline', { deployments: { alpha: { ...MAP.deployments.alpha, domain: 'a\nkey=b' } } }]
  ])('refuses a map with %s', (_title, map) => {
    const { status, stdout } = resolve(deploy('111', 'deploy/alpha'), map);
    expect(stdout).toBe('failed=bad_map\n');
    expect(status).toBe(1);
  });

  it('refuses account tfvars that lack a value', () => {
    const root = makeRepo(MAP);
    const tfvars = join(root, 'infra', 'bootstrap', 'terraform.tfvars');
    writeFileSync(tfvars, readFileSync(tfvars, 'utf8').replace(/^iam_path .*$/m, ''));
    const { status, stdout } = runIn(root, deploy('111', 'deploy/alpha'));
    expect(stdout).toBe('failed=bad_map\n');
    expect(status).toBe(1);
  });
});

describe('resolve-deployment.sh usage', () => {
  it.each([
    ['no --mode', ['--repository-id', '111', '--ref', 'deploy/alpha']],
    ['an unknown --mode', ['--mode', 'apply', '--repository-id', '111', '--ref', 'deploy/alpha']],
    ['no --repository-id', ['--mode', 'deploy', '--ref', 'deploy/alpha']],
    ['a non-digit --repository-id', ['--mode', 'deploy', '--repository-id', '11a', '--ref', 'deploy/alpha']],
    ['no --ref in deploy mode', ['--mode', 'deploy', '--repository-id', '111']],
    ['no --event in destroy mode', ['--mode', 'destroy', '--repository-id', '111', '--ref', 'deploy/alpha']],
    ['an unknown --event', ['--mode', 'destroy', '--repository-id', '111', '--ref', 'deploy/alpha', '--event', 'pr']],
    ['a --ref in plan mode', ['--mode', 'plan', '--repository-id', '111', '--ref', 'deploy/alpha']],
    ['a value-taking flag given last', ['--mode', 'deploy', '--repository-id', '111', '--ref']],
    ['an unknown argument', ['--mode', 'plan', '--repository-id', '111', '--map', 'x']]
  ])('exits 2 on %s', (_title, args) => {
    const { status, stdout } = resolve(args);
    expect(stdout).toBe('');
    expect(status).toBe(2);
  });

  it('prints its header on --help and exits 0', () => {
    const { status, stdout } = resolve(['--help']);
    expect(stdout).toContain('resolve-deployment.sh');
    expect(stdout).toContain('deploy_role_arn=');
    expect(status).toBe(0);
  });
});
