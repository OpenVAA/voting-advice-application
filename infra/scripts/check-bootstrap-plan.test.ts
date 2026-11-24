/**
 * The bootstrap-plan guard, run against fixture plans.
 *
 * Each case writes a small plan in the form of `terraform show -json` into a throwaway directory and runs the script on it. No plan is made and no account is read. The child gets a minimal environment, PATH and HOME only, so no credential of the shell that runs the suite reaches it.
 */

import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, 'check-bootstrap-plan.sh');

/** One entry of a plan's `resource_changes`. */
type ResourceChange = {
  address: string;
  mode: 'managed' | 'data';
  actions: Array<string>;
  previous_address?: string;
  replace_paths?: Array<Array<string>>;
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

/** A plan document holding the given changes, shaped as `terraform show -json` prints it. */
function planJson(changes: Array<ResourceChange>): string {
  return JSON.stringify({
    format_version: '1.2',
    terraform_version: '1.16.5',
    resource_changes: changes.map(({ address, mode, actions, previous_address, replace_paths }) => ({
      address,
      ...(previous_address === undefined ? {} : { previous_address }),
      mode,
      type: address.split('.').at(-2),
      name: address.split('.').at(-1),
      change: {
        actions,
        before: { id: 'fixture' },
        after: { id: 'fixture' },
        ...(replace_paths === undefined ? {} : { replace_paths })
      }
    }))
  });
}

/** A managed change of `address` with `actions`. */
function change(address: string, actions: Array<string>, extra: Partial<ResourceChange> = {}): ResourceChange {
  return { address, mode: 'managed', actions, ...extra };
}

/** Write `content` as a plan file into a fresh directory and return its path. */
function planFile(content: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'check-bootstrap-plan-test-'));
  dirs.push(dir);
  const plan = join(dir, 'plan.json');
  writeFileSync(plan, content);
  return plan;
}

/** Run the script with `args` in a minimal environment. */
function run(args: Array<string>): RunResult {
  const result = spawnSync('bash', [SCRIPT, ...args], {
    encoding: 'utf8',
    env: { PATH: process.env.PATH ?? '', HOME: process.env.HOME ?? '' },
    timeout: 30_000
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

/** Run the guard on a plan of `changes` with the extra flags `args`. */
function guard(changes: Array<ResourceChange>, args: Array<string> = []): RunResult {
  return run(['--plan-json', planFile(planJson(changes)), ...args]);
}

/** The `key=value` result lines of a run, as a mapping. */
function lines(stdout: string): Record<string, string> {
  return Object.fromEntries(
    stdout
      .split('\n')
      .filter((line) => line.includes('='))
      .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)])
  );
}

const ROLE = 'module.github_oidc["staging"].aws_iam_role.deploy';
const ROLE_BEFORE = 'module.github_oidc.aws_iam_role.deploy';
const REPOSITORY = 'module.registry["staging"].aws_ecr_repository.frontend';
const REPOSITORY_BEFORE = 'module.registry.aws_ecr_repository.frontend';
const OTHER_REPOSITORY = 'module.registry["other"].aws_ecr_repository.frontend';
const PROVIDER = 'module.github_oidc_provider.aws_iam_openid_connect_provider.github';
const BUCKET = 'module.state_bucket.aws_s3_bucket.this';

describe('check-bootstrap-plan.sh', () => {
  it('passes a plan whose every change is a no-op, moved or not, and prints every count', () => {
    const { status, stdout } = guard([
      change(ROLE, ['no-op'], { previous_address: ROLE_BEFORE }),
      change(REPOSITORY, ['no-op'], { previous_address: REPOSITORY_BEFORE }),
      change(BUCKET, ['no-op'])
    ]);
    expect(stdout).toBe(
      'bootstrap_plan_delete=0\nbootstrap_plan_replace=0\nbootstrap_plan_moved=2\nbootstrap_plan_failed_move=0\nbootstrap_plan_update=0\nbootstrap_plan_create=0\nbootstrap_plan_unexpected_create=0\nbootstrap_plan_guard=pass\n'
    );
    expect(status).toBe(0);
  });

  it('passes the no-op plan under --pure-move too', () => {
    const { status, stdout } = guard([change(ROLE, ['no-op'], { previous_address: ROLE_BEFORE })], ['--pure-move']);
    expect(lines(stdout)).toMatchObject({ bootstrap_plan_moved: '1', bootstrap_plan_guard: 'pass' });
    expect(status).toBe(0);
  });

  it('passes a plan with no resource_changes key, which is a plan with no change', () => {
    const { status, stdout } = run(['--plan-json', planFile(JSON.stringify({ format_version: '1.2' })), '--pure-move']);
    expect(lines(stdout)).toMatchObject({ bootstrap_plan_moved: '0', bootstrap_plan_guard: 'pass' });
    expect(status).toBe(0);
  });

  it('fails a replacement named by its actions and its replace_paths', () => {
    const { status, stdout } = guard([change(ROLE, ['delete', 'create'], { replace_paths: [['name']] })]);
    expect(lines(stdout)).toMatchObject({
      bootstrap_plan_delete: '0',
      bootstrap_plan_replace: '1',
      bootstrap_plan_guard: 'fail'
    });
    expect(status).toBe(1);
  });

  it('fails a create-before-destroy replacement', () => {
    const { status, stdout } = guard([change(ROLE, ['create', 'delete'])]);
    expect(lines(stdout)).toMatchObject({ bootstrap_plan_replace: '1', bootstrap_plan_guard: 'fail' });
    expect(status).toBe(1);
  });

  it('fails an update that carries a non-empty replace_paths', () => {
    const { status, stdout } = guard([change(ROLE, ['update'], { replace_paths: [['path']] })]);
    expect(lines(stdout)).toMatchObject({ bootstrap_plan_replace: '1', bootstrap_plan_guard: 'fail' });
    expect(status).toBe(1);
  });

  it('fails a delete', () => {
    const { status, stdout } = guard([change(REPOSITORY, ['delete'])]);
    expect(lines(stdout)).toMatchObject({
      bootstrap_plan_delete: '1',
      bootstrap_plan_replace: '0',
      bootstrap_plan_guard: 'fail'
    });
    expect(status).toBe(1);
  });

  it('fails a create under a deployment key that is not named', () => {
    const { status, stdout } = guard([change(OTHER_REPOSITORY, ['create'])]);
    expect(lines(stdout)).toMatchObject({
      bootstrap_plan_create: '1',
      bootstrap_plan_unexpected_create: '1',
      bootstrap_plan_guard: 'fail'
    });
    expect(status).toBe(1);
  });

  it('passes the same create when its key is named with --new-key', () => {
    const { status, stdout } = guard([change(OTHER_REPOSITORY, ['create'])], ['--new-key', 'other']);
    expect(lines(stdout)).toMatchObject({
      bootstrap_plan_create: '1',
      bootstrap_plan_unexpected_create: '0',
      bootstrap_plan_guard: 'pass'
    });
    expect(status).toBe(0);
  });

  it('accepts several --new-key flags', () => {
    const { status, stdout } = guard(
      [change(OTHER_REPOSITORY, ['create']), change('module.registry["third"].aws_ecr_repository.frontend', ['create'])],
      ['--new-key', 'other', '--new-key', 'third']
    );
    expect(lines(stdout)).toMatchObject({ bootstrap_plan_unexpected_create: '0', bootstrap_plan_guard: 'pass' });
    expect(status).toBe(0);
  });

  it('fails a create outside any keyed index even with --new-key', () => {
    const { status, stdout } = guard([change(PROVIDER, ['create'])], ['--new-key', 'other']);
    expect(lines(stdout)).toMatchObject({ bootstrap_plan_unexpected_create: '1', bootstrap_plan_guard: 'fail' });
    expect(status).toBe(1);
  });

  it('does not take a key that only begins like the named one', () => {
    const { status, stdout } = guard(
      [change('module.registry["other-two"].aws_ecr_repository.frontend', ['create'])],
      ['--new-key', 'other']
    );
    expect(lines(stdout)).toMatchObject({ bootstrap_plan_unexpected_create: '1', bootstrap_plan_guard: 'fail' });
    expect(status).toBe(1);
  });

  it('fails a named create under --pure-move', () => {
    const { status, stdout } = guard([change(OTHER_REPOSITORY, ['create'])], ['--new-key', 'other', '--pure-move']);
    expect(lines(stdout)).toMatchObject({ bootstrap_plan_unexpected_create: '0', bootstrap_plan_guard: 'fail' });
    expect(status).toBe(1);
  });

  it('passes an update by default', () => {
    const { status, stdout } = guard([change(ROLE, ['update'], { previous_address: ROLE_BEFORE })]);
    expect(lines(stdout)).toMatchObject({
      bootstrap_plan_moved: '1',
      bootstrap_plan_failed_move: '0',
      bootstrap_plan_update: '1',
      bootstrap_plan_guard: 'pass'
    });
    expect(status).toBe(0);
  });

  it('fails an update under --pure-move', () => {
    const { status, stdout } = guard([change(ROLE, ['update'])], ['--pure-move']);
    expect(lines(stdout)).toMatchObject({ bootstrap_plan_update: '1', bootstrap_plan_guard: 'fail' });
    expect(status).toBe(1);
  });

  it.each([
    ['a create', ['create']],
    ['a forget', ['forget']],
    ['a read', ['read']]
  ])('counts a moved address planned as %s as a failed move', (_name, actions) => {
    const { status, stdout } = guard([change(ROLE, actions, { previous_address: ROLE_BEFORE })], ['--new-key', 'staging']);
    expect(lines(stdout)).toMatchObject({
      bootstrap_plan_moved: '1',
      bootstrap_plan_failed_move: '1',
      bootstrap_plan_guard: 'fail'
    });
    expect(status).toBe(1);
  });

  it('does not count a previous_address equal to the address as a move', () => {
    const { status, stdout } = guard([change(ROLE, ['no-op'], { previous_address: ROLE })]);
    expect(lines(stdout)).toMatchObject({ bootstrap_plan_moved: '0', bootstrap_plan_guard: 'pass' });
    expect(status).toBe(0);
  });

  it('ignores data sources in every count', () => {
    const { status, stdout } = guard(
      [
        change(ROLE, ['no-op']),
        { address: 'module.frontend_task_role.data.aws_kms_alias.ssm', mode: 'data', actions: ['delete'] },
        { address: 'data.aws_caller_identity.current', mode: 'data', actions: ['create'] },
        { address: 'data.aws_iam_policy_document.x', mode: 'data', actions: ['read'], previous_address: 'data.y' }
      ],
      ['--pure-move']
    );
    expect(stdout).toBe(
      'bootstrap_plan_delete=0\nbootstrap_plan_replace=0\nbootstrap_plan_moved=0\nbootstrap_plan_failed_move=0\nbootstrap_plan_update=0\nbootstrap_plan_create=0\nbootstrap_plan_unexpected_create=0\nbootstrap_plan_guard=pass\n'
    );
    expect(status).toBe(0);
  });

  it('fails a plan file that is not JSON, without printing its content', () => {
    const { status, stdout, stderr } = run(['--plan-json', planFile('PLAN-CONTENT-DO-NOT-PRINT {')]);
    expect(stdout).toBe('bootstrap_plan_guard=fail\n');
    expect(stdout + stderr).not.toContain('PLAN-CONTENT-DO-NOT-PRINT');
    expect(status).toBe(1);
  });

  it.each([
    ['a JSON array', '["PLAN-CONTENT-DO-NOT-PRINT"]'],
    ['resource_changes that is not a list', '{"resource_changes":"PLAN-CONTENT-DO-NOT-PRINT"}']
  ])('fails %s as not a plan document', (_name, content) => {
    const { status, stdout, stderr } = run(['--plan-json', planFile(content)]);
    expect(stdout).toBe('bootstrap_plan_guard=fail\n');
    expect(stdout + stderr).not.toContain('PLAN-CONTENT-DO-NOT-PRINT');
    expect(status).toBe(1);
  });

  it.each([
    ['no argument', []],
    ['a missing plan file', ['--plan-json', '/nonexistent/plan.json']],
    ['a flag without a value', ['--plan-json']],
    ['--new-key without a value', ['--plan-json', '/nonexistent/plan.json', '--new-key']],
    ['an unknown flag', ['--plan', '/nonexistent/plan.json']],
    ['a --new-key with an upper-case letter', ['--new-key', 'Other']],
    ['a --new-key holding a quote', ['--new-key', 'a"]']],
    ['a --new-key starting with a digit', ['--new-key', '1st']],
    ['an empty --new-key', ['--new-key', '']]
  ])('exits 2 on a usage error: %s', (_name, args) => {
    const plan = planFile(planJson([]));
    const full = args.includes('--plan-json') || args.length === 0 ? args : ['--plan-json', plan, ...args];
    const { status, stdout } = run(full);
    expect(status).toBe(2);
    expect(stdout).not.toContain('bootstrap_plan_guard=pass');
  });

  it('prints its header for --help and exits 0', () => {
    const { status, stdout } = run(['--help']);
    expect(status).toBe(0);
    expect(stdout).toContain('check-bootstrap-plan.sh');
    expect(stdout).toContain('bootstrap_plan_guard=');
  });
});
