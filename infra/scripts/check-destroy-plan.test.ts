/**
 * The destroy-plan guard, run against fixture plans.
 *
 * Each case writes a small plan in the form of `terraform show -json` and a state list in the form of `terraform state list` into a throwaway directory, and runs the script on them. No plan is made and no account is read. The child gets a minimal environment, so no credential of the shell that runs the suite reaches it.
 */

import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, 'check-destroy-plan.sh');

/** One entry of a plan's `resource_changes`. */
type ResourceChange = {
  address: string;
  mode: 'managed' | 'data';
  actions: Array<string>;
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
    resource_changes: changes.map(({ address, mode, actions }) => ({
      address,
      mode,
      type: address.split('.').at(-2),
      name: address.split('.').at(-1),
      change: { actions, before: { id: 'fixture' }, after: null }
    }))
  });
}

/** A managed delete of `address`. */
function deleteOf(address: string): ResourceChange {
  return { address, mode: 'managed', actions: ['delete'] };
}

function run(args: Array<string>): RunResult {
  const result = spawnSync('bash', [SCRIPT, ...args], {
    encoding: 'utf8',
    env: { PATH: process.env.PATH ?? '', HOME: process.env.HOME ?? '' },
    timeout: 30_000
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

/** Run the guard on a plan of `changes` and a state list of `state`, written into a fresh directory. */
function guard(changes: Array<ResourceChange>, state: Array<string>): RunResult {
  const dir = mkdtempSync(join(tmpdir(), 'check-destroy-plan-test-'));
  dirs.push(dir);
  const plan = join(dir, 'destroy.json');
  const list = join(dir, 'state.txt');
  writeFileSync(plan, planJson(changes));
  writeFileSync(list, state.map((line) => `${line}\n`).join(''));
  return run(['--plan-json', plan, '--state-list', list]);
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

const BUCKET = 'module.frontend.aws_s3_bucket.logs';
const SERVICE = 'module.frontend.aws_ecs_service.this';
const POLICY_DOCUMENT = 'module.frontend.data.aws_iam_policy_document.execution';

describe('check-destroy-plan.sh', () => {
  it('passes a plan that deletes every managed resource of the state, all under module.frontend', () => {
    const { status, stdout } = guard([deleteOf(BUCKET), deleteOf(SERVICE)], [BUCKET, POLICY_DOCUMENT, SERVICE]);
    expect(stdout).toBe(
      'destroy_planned=2\ndestroy_state_resources=2\ndestroy_outside_module=0\ndestroy_other_actions=0\ndestroy_unmatched=0\ndestroy_guard=pass\n'
    );
    expect(status).toBe(0);
  });

  it('ignores the data sources of the plan and of the state', () => {
    const { status, stdout } = guard(
      [
        deleteOf(BUCKET),
        { address: POLICY_DOCUMENT, mode: 'data', actions: ['read'] },
        { address: 'data.aws_caller_identity.current', mode: 'data', actions: ['read'] }
      ],
      [BUCKET, POLICY_DOCUMENT, 'data.aws_caller_identity.current', 'module.frontend.data.aws_region.current']
    );
    expect(lines(stdout)).toMatchObject({ destroy_planned: '1', destroy_state_resources: '1', destroy_guard: 'pass' });
    expect(status).toBe(0);
  });

  it('counts a managed resource whose index key holds data. as a managed resource', () => {
    const keyed = 'module.frontend.aws_ssm_parameter.this["data.example"]';
    const { status, stdout } = guard([deleteOf(keyed)], [keyed]);
    expect(lines(stdout)).toMatchObject({ destroy_planned: '1', destroy_state_resources: '1', destroy_guard: 'pass' });
    expect(status).toBe(0);
  });

  it('fails a delete of an address outside module.frontend', () => {
    const outside = 'aws_s3_bucket.other';
    const { status, stdout } = guard([deleteOf(BUCKET), deleteOf(outside)], [BUCKET, outside]);
    expect(lines(stdout)).toMatchObject({
      destroy_planned: '2',
      destroy_state_resources: '2',
      destroy_outside_module: '1',
      destroy_other_actions: '0',
      destroy_guard: 'fail'
    });
    expect(status).toBe(1);
  });

  it('fails an address that only begins like module.frontend', () => {
    const lookalike = 'module.frontend_other.aws_s3_bucket.logs';
    const { status, stdout } = guard([deleteOf(lookalike)], [lookalike]);
    expect(lines(stdout)).toMatchObject({ destroy_outside_module: '1', destroy_guard: 'fail' });
    expect(status).toBe(1);
  });

  it('fails a plan that deletes fewer resources than the state holds', () => {
    const { status, stdout } = guard([deleteOf(BUCKET)], [BUCKET, SERVICE]);
    expect(lines(stdout)).toMatchObject({
      destroy_planned: '1',
      destroy_state_resources: '2',
      destroy_outside_module: '0',
      destroy_other_actions: '0',
      destroy_guard: 'fail'
    });
    expect(status).toBe(1);
  });

  it('fails a plan that deletes more resources than the state holds', () => {
    const { status, stdout } = guard([deleteOf(BUCKET), deleteOf(SERVICE)], [BUCKET]);
    expect(lines(stdout)).toMatchObject({ destroy_planned: '2', destroy_state_resources: '1', destroy_guard: 'fail' });
    expect(status).toBe(1);
  });

  it.each([
    ['an update', ['update']],
    ['a create', ['create']],
    ['a replacement', ['delete', 'create']],
    ['a forget', ['forget']]
  ])('fails %s anywhere in the plan', (_name, actions) => {
    const { status, stdout } = guard(
      [deleteOf(BUCKET), { address: SERVICE, mode: 'managed', actions }],
      [BUCKET, SERVICE]
    );
    expect(lines(stdout)).toMatchObject({ destroy_other_actions: '1', destroy_guard: 'fail' });
    expect(status).toBe(1);
  });

  it('lets a no-op pass the action check and still fails the count it leaves short', () => {
    const { status, stdout } = guard(
      [deleteOf(BUCKET), { address: SERVICE, mode: 'managed', actions: ['no-op'] }],
      [BUCKET, SERVICE]
    );
    expect(lines(stdout)).toMatchObject({
      destroy_planned: '1',
      destroy_other_actions: '0',
      destroy_outside_module: '0',
      destroy_guard: 'fail'
    });
    expect(status).toBe(1);
  });

  it('fails an empty plan against an empty state, which destroys nothing', () => {
    const { status, stdout } = guard([], []);
    expect(stdout).toBe(
      'destroy_planned=0\ndestroy_state_resources=0\ndestroy_outside_module=0\ndestroy_other_actions=0\ndestroy_unmatched=0\ndestroy_guard=fail\n'
    );
    expect(status).toBe(1);
  });

  it('fails a plan with no resource_changes key, as not a plan document', () => {
    const dir = mkdtempSync(join(tmpdir(), 'check-destroy-plan-test-'));
    dirs.push(dir);
    writeFileSync(join(dir, 'destroy.json'), JSON.stringify({ format_version: '1.2' }));
    writeFileSync(join(dir, 'state.txt'), '');
    const { status, stdout } = run(['--plan-json', join(dir, 'destroy.json'), '--state-list', join(dir, 'state.txt')]);
    expect(stdout).toBe('destroy_guard=fail\n');
    expect(status).toBe(1);
  });

  it('fails a plan whose deletes match the state in number but not in address', () => {
    const other = 'module.frontend.aws_vpc.other';
    const { status, stdout } = guard([deleteOf(other)], ['module.frontend.aws_ecs_cluster.this']);
    expect(lines(stdout)).toMatchObject({
      destroy_planned: '1',
      destroy_state_resources: '1',
      destroy_outside_module: '0',
      destroy_other_actions: '0',
      destroy_unmatched: '2',
      destroy_guard: 'fail'
    });
    expect(status).toBe(1);
  });

  it('matches index keys and data-looking keys by their full address', () => {
    const keyed = 'module.frontend.aws_ssm_parameter.this["data.example"]';
    const { status, stdout } = guard(
      [deleteOf(keyed), deleteOf(SERVICE)],
      [SERVICE, keyed, 'module.frontend.data.aws_region.current']
    );
    expect(lines(stdout)).toMatchObject({
      destroy_state_resources: '2',
      destroy_unmatched: '0',
      destroy_guard: 'pass'
    });
    expect(status).toBe(0);
  });

  it('fails a plan file that is not JSON, without printing its content', () => {
    const dir = mkdtempSync(join(tmpdir(), 'check-destroy-plan-test-'));
    dirs.push(dir);
    writeFileSync(join(dir, 'destroy.json'), 'PLAN-CONTENT-DO-NOT-PRINT {');
    writeFileSync(join(dir, 'state.txt'), `${BUCKET}\n`);
    const { status, stdout, stderr } = run([
      '--plan-json',
      join(dir, 'destroy.json'),
      '--state-list',
      join(dir, 'state.txt')
    ]);
    expect(lines(stdout)).toMatchObject({ destroy_guard: 'fail' });
    expect(stdout + stderr).not.toContain('PLAN-CONTENT-DO-NOT-PRINT');
    expect(status).toBe(1);
  });

  it.each([
    ['both files missing', ['--plan-json', '/nonexistent/destroy.json', '--state-list', '/nonexistent/state.txt']],
    ['no --state-list', ['--plan-json', '/nonexistent/destroy.json']],
    ['no --plan-json', ['--state-list', '/nonexistent/state.txt']],
    ['a flag without a value', ['--plan-json']],
    ['an unknown flag', ['--plan', '/nonexistent/destroy.json']],
    ['no argument', []]
  ])('exits 2 on a usage error: %s', (_name, args) => {
    const { status, stdout } = run(args);
    expect(status).toBe(2);
    expect(stdout).not.toContain('destroy_guard=pass');
  });

  it('prints its header for --help and exits 0', () => {
    const { status, stdout } = run(['--help']);
    expect(status).toBe(0);
    expect(stdout).toContain('check-destroy-plan.sh');
    expect(stdout).toContain('module.frontend.');
  });
});
