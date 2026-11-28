/**
 * The destroy-plan script of both destroy jobs, run against a stub of Terraform and the real guard beside it.
 *
 * Each case writes an executable `terraform` into a throwaway directory placed first on the child's `PATH`. The stub records its arguments and the alert address it was given, and answers `state list`, `plan -destroy`, `show -json` and `show -no-color` from the `STUB_*` variables of the case, so no plan is made and no account is read. The child gets a minimal environment, so no credential of the shell that runs the suite reaches it.
 */

import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, 'plan-destroy.sh');

const STATE = ['module.frontend.aws_ecs_cluster.this', 'module.frontend.aws_ecs_service.frontend'];
const PLACEHOLDER_DIGEST = `sha256:${'0'.repeat(64)}`;
const PRINTED_PLAN = 'Plan: 0 to add, 0 to change, 2 to destroy.';

/** A plan document deleting `addresses`, shaped as `terraform show -json` prints it. */
function planJson(addresses: Array<string>): string {
  return JSON.stringify({
    format_version: '1.2',
    resource_changes: addresses.map((address) => ({
      address,
      mode: 'managed',
      change: { actions: ['delete'], before: { id: 'fixture' }, after: null }
    }))
  });
}

const STUB_TERRAFORM = `#!/usr/bin/env bash
printf '%s alert=%s\\n' "$*" "\${TF_VAR_alert_email:-}" >> "$STUB_LOG"
shift
case "$1" in
  state)
    [ -z "\${STUB_STATE_FAIL:-}" ] || exit 1
    printf '%s' "$STUB_STATE"
    ;;
  plan)
    echo "STUB-PLAN-OUTPUT"
    [ -z "\${STUB_PLAN_FAIL:-}" ] || exit 1
    for argument in "$@"; do
      case "$argument" in -out=*) printf 'saved plan' > "\${argument#-out=}" ;; esac
    done
    ;;
  show)
    if [ "$2" = -json ]; then
      [ -z "\${STUB_EXPORT_FAIL:-}" ] || exit 1
      printf '%s' "$STUB_PLAN_JSON"
    else
      echo "$STUB_PRINTED_PLAN"
    fi
    ;;
  *)
    exit 1
    ;;
esac
`;

interface RunResult {
  status: number | null;
  stdout: string;
  stderr: string;
  calls: Array<string>;
  out: string;
}

const dirs: Array<string> = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function run(args: Array<string> | null, stub: Record<string, string> = {}): RunResult {
  const dir = mkdtempSync(join(tmpdir(), 'plan-destroy-test-'));
  dirs.push(dir);
  writeFileSync(join(dir, 'terraform'), STUB_TERRAFORM);
  chmodSync(join(dir, 'terraform'), 0o755);
  const root = join(dir, 'root');
  mkdirSync(root);
  const out = join(dir, 'out');
  const log = join(dir, 'terraform.log');
  writeFileSync(log, '');
  const result = spawnSync('bash', [SCRIPT, ...(args ?? ['--root', root, '--out-dir', out])], {
    encoding: 'utf8',
    env: {
      PATH: `${dir}:${process.env.PATH ?? ''}`,
      HOME: process.env.HOME ?? '',
      STUB_LOG: log,
      STUB_STATE: STATE.map((line) => `${line}\n`).join(''),
      STUB_PLAN_JSON: planJson(STATE),
      STUB_PRINTED_PLAN: PRINTED_PLAN,
      ...stub
    },
    timeout: 30_000
  });
  const calls = readFileSync(log, 'utf8').split('\n').filter(Boolean);
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, calls, out };
}

/** The `*_exit=` lines a run printed, in order. */
function exitLines(stdout: string): Array<string> {
  return stdout.split('\n').filter((line) => /^[a-z_]+_exit=/.test(line));
}

describe('plan-destroy.sh', () => {
  it('lists the state, plans the destroy, exports it, passes the guard and writes the printed plan, exiting 0', () => {
    const { status, stdout, calls, out } = run(null);
    expect(exitLines(stdout)).toEqual([
      'state_list_exit=0',
      'plan_exit=0',
      'export_exit=0',
      'guard_exit=0',
      'show_exit=0'
    ]);
    expect(stdout).toContain('destroy_guard=pass');
    expect(status).toBe(0);
    expect(calls.map((call) => call.split(' ')[1])).toEqual(['state', 'plan', 'show', 'show']);
    expect(readFileSync(join(out, 'destroy-plan.txt'), 'utf8')).toContain(PRINTED_PLAN);
    expect(existsSync(join(out, 'destroy.tfplan'))).toBe(true);
  });

  it('plans with the placeholder digest and alert address, and prints nothing of a plan that succeeds', () => {
    const { stdout, calls } = run(null);
    const plan = calls.find((call) => call.split(' ')[1] === 'plan') ?? '';
    expect(plan).toContain(`plan -destroy -input=false -no-color -var image_digest=${PLACEHOLDER_DIGEST}`);
    expect(plan).toContain('alert=destroy-plan@example.invalid');
    expect(stdout).not.toContain('STUB-PLAN-OUTPUT');
    expect(stdout).not.toContain(PRINTED_PLAN);
  });

  it('writes the JSON plan readable by its owner alone', () => {
    const { out } = run(null);
    expect(statSync(join(out, 'destroy.json')).mode & 0o077).toBe(0);
    expect(statSync(out).mode & 0o077).toBe(0);
  });

  it('stops at the state list when it fails, before any plan', () => {
    const { status, stdout, calls } = run(null, { STUB_STATE_FAIL: '1' });
    expect(exitLines(stdout)).toEqual(['state_list_exit=1']);
    expect(status).toBe(1);
    expect(calls).toHaveLength(1);
  });

  it('prints the plan log and stops when the plan fails', () => {
    const { status, stdout, calls } = run(null, { STUB_PLAN_FAIL: '1' });
    expect(exitLines(stdout)).toEqual(['state_list_exit=0', 'plan_exit=1']);
    expect(stdout).toContain('STUB-PLAN-OUTPUT');
    expect(status).toBe(1);
    expect(calls).toHaveLength(2);
  });

  it('stops when the export fails, before the guard', () => {
    const { status, stdout } = run(null, { STUB_EXPORT_FAIL: '1' });
    expect(exitLines(stdout)).toEqual(['state_list_exit=0', 'plan_exit=0', 'export_exit=1']);
    expect(stdout).not.toContain('destroy_guard=');
    expect(status).toBe(1);
  });

  it('writes no printed plan and exits 1 when the guard refuses a plan that misses part of the stack', () => {
    const { status, stdout, calls, out } = run(null, { STUB_PLAN_JSON: planJson(STATE.slice(0, 1)) });
    expect(exitLines(stdout)).toEqual(['state_list_exit=0', 'plan_exit=0', 'export_exit=0', 'guard_exit=1']);
    expect(stdout).toContain('destroy_guard=fail');
    expect(status).toBe(1);
    expect(calls.filter((call) => call.includes('show -no-color'))).toEqual([]);
    expect(existsSync(join(out, 'destroy-plan.txt'))).toBe(false);
  });

  it('exits 2 without --root, without --out-dir, on a root that is not a directory and on an unknown flag, before any call', () => {
    for (const args of [
      ['--out-dir', '/tmp/x'],
      ['--root', HERE],
      ['--root', join(HERE, 'no-such-root'), '--out-dir', '/tmp/x'],
      ['--root', HERE, '--out-dir', '/tmp/x', '--bogus'],
      ['--root']
    ]) {
      const { status, calls } = run(args);
      expect(status, args.join(' ')).toBe(2);
      expect(calls).toEqual([]);
    }
  });
});
