/**
 * The running-digest script, run against a stub of the AWS CLI.
 *
 * Each case writes an executable `aws` into a throwaway directory placed first on the child's `PATH`. The stub records its arguments and answers each call from the `STUB_*` variables of the case, so no account is read and no network is reached. The child gets a minimal environment, so no credential of the shell that runs the suite reaches it. The cases cover both forms of image a task definition can name, a digest and a tag, and every failure the script reports.
 */

import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, 'running-image-digest.sh');

const TASK_DEFINITION = 'arn:aws:ecs:eu-north-1:000000000000:task-definition/openvaa-staging-frontend:7';
const DIGEST = 'sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const COMMIT = '0123456789abcdef0123456789abcdef01234567';
const HOST = '000000000000.dkr.ecr.eu-north-1.amazonaws.com';

const STUB_AWS = `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$STUB_LOG"
fail() {
  echo "An error occurred ($1) when calling the operation: stub" >&2
  exit 254
}
case "$1 $2" in
  "ecs describe-services")
    [ -z "\${STUB_SERVICES_ERROR:-}" ] || fail "$STUB_SERVICES_ERROR"
    printf '%s\\n' "$STUB_TASK_DEFINITION"
    ;;
  "ecs describe-task-definition")
    [ -z "\${STUB_TASK_DEFINITION_ERROR:-}" ] || fail "$STUB_TASK_DEFINITION_ERROR"
    printf '%s\\n' "$STUB_IMAGE"
    printf 'STUB-ENVIRONMENT-VALUE-DO-NOT-PRINT\\n' >&2
    ;;
  "ecr describe-images")
    [ -z "\${STUB_IMAGES_ERROR:-}" ] || fail "$STUB_IMAGES_ERROR"
    printf '%s\\n' "$STUB_REGISTRY_DIGEST"
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
}

const dirs: Array<string> = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function run(args: Array<string>, stub: Record<string, string> = {}): RunResult {
  const dir = mkdtempSync(join(tmpdir(), 'running-image-digest-test-'));
  dirs.push(dir);
  writeFileSync(join(dir, 'aws'), STUB_AWS);
  chmodSync(join(dir, 'aws'), 0o755);
  const log = join(dir, 'aws.log');
  writeFileSync(log, '');
  const result = spawnSync('bash', [SCRIPT, ...args], {
    encoding: 'utf8',
    env: {
      PATH: `${dir}:${process.env.PATH ?? ''}`,
      HOME: process.env.HOME ?? '',
      TMPDIR: process.env.TMPDIR ?? '/tmp',
      AWS_CONFIG_FILE: '/dev/null',
      AWS_SHARED_CREDENTIALS_FILE: '/dev/null',
      STUB_LOG: log,
      STUB_TASK_DEFINITION: TASK_DEFINITION,
      STUB_IMAGE: `${HOST}/openvaa-frontend@${DIGEST}`,
      STUB_REGISTRY_DIGEST: DIGEST,
      ...stub
    },
    timeout: 30_000
  });
  const calls = readFileSync(log, 'utf8').split('\n').filter(Boolean);
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, calls };
}

const SERVICE_ARGS = ['--cluster', 'openvaa-staging', '--service', 'openvaa-staging-frontend'];

describe('running-image-digest.sh', () => {
  it('prints the digest a digest image names, with no registry call', () => {
    const { status, stdout, calls } = run(SERVICE_ARGS);
    expect(stdout).toBe(
      `running_task_definition=${TASK_DEFINITION}\nrunning_image_reference=digest\nrunning_image_digest=${DIGEST}\n`
    );
    expect(status).toBe(0);
    expect(calls).toHaveLength(2);
    expect(calls[0]).toContain(
      'ecs describe-services --region eu-north-1 --cluster openvaa-staging --services openvaa-staging-frontend'
    );
    expect(calls[1]).toContain(`ecs describe-task-definition --region eu-north-1 --task-definition ${TASK_DEFINITION}`);
    expect(calls.some((call) => call.startsWith('ecr '))).toBe(false);
  });

  it('reads the image field of the task definition alone', () => {
    const { calls, stdout, stderr } = run(SERVICE_ARGS);
    expect(calls[1]).toContain('--query taskDefinition.containerDefinitions[0].image --output text');
    expect(stdout + stderr).not.toContain('STUB-ENVIRONMENT-VALUE-DO-NOT-PRINT');
  });

  it('reads the digest of a tag image from the registry by its tag', () => {
    const { status, stdout, calls } = run(SERVICE_ARGS, { STUB_IMAGE: `${HOST}/openvaa-frontend:${COMMIT}` });
    expect(stdout).toBe(
      `running_task_definition=${TASK_DEFINITION}\nrunning_image_reference=tag\nrunning_image_digest=${DIGEST}\n`
    );
    expect(status).toBe(0);
    expect(calls).toHaveLength(3);
    expect(calls[2]).toContain(
      `ecr describe-images --region eu-north-1 --repository-name openvaa-frontend --image-ids imageTag=${COMMIT} --query imageDetails[0].imageDigest --output text`
    );
  });

  it('fails at describe-services when the service cannot be read', () => {
    const { status, stdout, stderr, calls } = run(SERVICE_ARGS, { STUB_SERVICES_ERROR: 'ClusterNotFoundException' });
    expect(stdout).toBe('failed=describe-services\n');
    expect(status).toBe(1);
    expect(stderr).toContain('ClusterNotFoundException');
    expect(calls).toHaveLength(1);
  });

  it('fails at describe-services when the service names no task definition', () => {
    const { status, stdout } = run(SERVICE_ARGS, { STUB_TASK_DEFINITION: 'None' });
    expect(stdout).toBe('failed=describe-services\n');
    expect(status).toBe(1);
  });

  it('fails at describe-task-definition when the definition cannot be read', () => {
    const { status, stdout } = run(SERVICE_ARGS, { STUB_TASK_DEFINITION_ERROR: 'AccessDeniedException' });
    expect(stdout).toBe(`running_task_definition=${TASK_DEFINITION}\nfailed=describe-task-definition\n`);
    expect(status).toBe(1);
  });

  it('fails at describe-images when the registry does not hold the tag', () => {
    const { status, stdout } = run(SERVICE_ARGS, {
      STUB_IMAGE: `${HOST}/openvaa-frontend:${COMMIT}`,
      STUB_REGISTRY_DIGEST: 'None'
    });
    expect(stdout).toBe(
      `running_task_definition=${TASK_DEFINITION}\nrunning_image_reference=tag\nfailed=describe-images\n`
    );
    expect(status).toBe(1);
  });

  it('fails at describe-images when the registry refuses the read', () => {
    const { status, stdout } = run(SERVICE_ARGS, {
      STUB_IMAGE: `${HOST}/openvaa-frontend:${COMMIT}`,
      STUB_IMAGES_ERROR: 'ImageNotFoundException'
    });
    expect(stdout).toBe(
      `running_task_definition=${TASK_DEFINITION}\nrunning_image_reference=tag\nfailed=describe-images\n`
    );
    expect(status).toBe(1);
  });

  it('fails at digest-form when the registry returns something that is not a digest', () => {
    const { status, stdout } = run(SERVICE_ARGS, {
      STUB_IMAGE: `${HOST}/openvaa-frontend:${COMMIT}`,
      STUB_REGISTRY_DIGEST: 'sha256:ABCDEF'
    });
    expect(stdout).toBe(
      `running_task_definition=${TASK_DEFINITION}\nrunning_image_reference=tag\nfailed=digest-form\n`
    );
    expect(status).toBe(1);
  });

  it('fails at digest-form when the task definition names a malformed digest', () => {
    const { status, stdout, calls } = run(SERVICE_ARGS, {
      STUB_IMAGE: `${HOST}/openvaa-frontend@sha256:${'A'.repeat(64)}`
    });
    expect(stdout).toBe(
      `running_task_definition=${TASK_DEFINITION}\nrunning_image_reference=digest\nfailed=digest-form\n`
    );
    expect(status).toBe(1);
    expect(calls.some((call) => call.startsWith('ecr '))).toBe(false);
  });

  it('fails at image-form when the image names neither a digest nor a tag', () => {
    const { status, stdout } = run(SERVICE_ARGS, { STUB_IMAGE: 'openvaa-frontend' });
    expect(stdout).toBe(`running_task_definition=${TASK_DEFINITION}\nfailed=image-form\n`);
    expect(status).toBe(1);
  });

  it('exits 2 without --cluster, without --service and on an unknown flag, before any call', () => {
    for (const args of [
      ['--service', 'openvaa-staging-frontend'],
      ['--cluster', 'openvaa-staging'],
      [...SERVICE_ARGS, '--bogus'],
      ['--cluster']
    ]) {
      const { status, stdout, calls } = run(args);
      expect(status).toBe(2);
      expect(stdout).toBe('');
      expect(calls).toEqual([]);
    }
  });

  it('prints its header and exits 0 on --help', () => {
    const { status, stdout, calls } = run(['--help']);
    expect(status).toBe(0);
    expect(stdout).toContain('running_image_digest=');
    expect(calls).toEqual([]);
  });
});
