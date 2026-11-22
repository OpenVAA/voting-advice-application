/**
 * The build-and-push script, run against a throwaway repository: a copy of the script and its libraries committed to a clone whose origin is a bare repository, with `aws`, `docker`, `tar` and `git` on the PATH replaced by stubs. The AWS CLI and docker stubs record each call; `tar` and `git` run the real tools unless a case tells them to fail or to report another HEAD. The child gets a minimal environment, so no credential of the shell that runs the suite reaches it.
 *
 * The cases run in order, each changing the clone the next one sees.
 */

import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');
const SCRIPT = join(HERE, 'build-push-image.sh');

const ACCOUNT_ID = '471112560111';
const REGION = 'eu-north-1';
const REGISTRY = `${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com`;
const URL = `${REGISTRY}/openvaa-frontend`;
const PASSWORD = 'stub-registry-password-do-not-print-5e81';
const DIGEST = 'sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const HEX_40 = '0123456789abcdef0123456789abcdef01234567';

function run(...args: Array<string>): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync('bash', [SCRIPT, ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH ?? '',
      HOME: process.env.HOME ?? '',
      TMPDIR: process.env.TMPDIR ?? '/tmp',
      AWS_CONFIG_FILE: '/dev/null',
      AWS_SHARED_CREDENTIALS_FILE: '/dev/null'
    },
    timeout: 60_000
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe('build-push-image.sh arguments', () => {
  it('exits 2 on an unknown flag', () => {
    expect(run('--bogus').status).toBe(2);
  });

  it('exits 2 without a repository URL', () => {
    expect(run('--platform', 'linux/arm64').status).toBe(2);
  });
});

/** Resolves a tool on the PATH of the shell that runs the suite. */
function which(tool: string): string {
  const found = spawnSync('bash', ['-c', `command -v ${tool}`], { encoding: 'utf8' }).stdout.trim();
  if (found === '') throw new Error(`${tool} is not on the PATH`);
  return found;
}

describe('build-push-image.sh against a throwaway repository', () => {
  let root = '';
  let clone = '';
  let state = '';
  let work = '';
  let env: NodeJS.ProcessEnv = {};

  function git(...args: Array<string>): string {
    const result = spawnSync(
      'git',
      [
        '-C',
        clone,
        '-c',
        'user.name=test',
        '-c',
        'user.email=test@example.invalid',
        '-c',
        'commit.gpgsign=false',
        ...args
      ],
      { encoding: 'utf8', env }
    );
    if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${result.stderr}`);
    return result.stdout.trim();
  }

  function write(path: string, text: string): void {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
  }

  function log(name: 'aws' | 'docker'): string {
    return readFileSync(join(state, `${name}.log`), 'utf8');
  }

  /** Runs the clone's copy of the script, with fresh call logs. Standard output is trimmed of its final newline. */
  function deploy(): { status: number | null; out: string } {
    write(join(state, 'aws.log'), '');
    write(join(state, 'docker.log'), '');
    const result = spawnSync('bash', [join(clone, 'infra/scripts/build-push-image.sh'), '--repository-url', URL], {
      cwd: root,
      encoding: 'utf8',
      env,
      timeout: 60_000
    });
    return { status: result.status, out: result.stdout.replace(/\n$/, '') };
  }

  beforeAll(() => {
    root = realpathSync(mkdtempSync(join(tmpdir(), 'openvaa-build-push-test-')));
    clone = join(root, 'clone');
    state = join(root, 'state');
    work = join(root, 'tmp');
    const bin = join(root, 'bin');
    for (const dir of [state, work, bin]) mkdirSync(dir);

    // describe-images answers from state/describe.<n>, n counting the describe-images calls so far, this one included: a digest answers with it, any other word fails as that error code.
    write(
      join(bin, 'aws'),
      `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "${state}/aws.log"
case "$1 $2" in
  "sts get-caller-identity") cat "${state}/account" ;;
  "ecr describe-images")
    n="$(grep -c 'describe-images' "${state}/aws.log")"
    answer="$(cat "${state}/describe.$n" 2> /dev/null || echo AccessDeniedException)"
    case "$answer" in
      sha256:*) printf '%s\\n' "$answer" ;;
      *) echo "An error occurred ($answer) when calling the DescribeImages operation: stub" >&2; exit 254 ;;
    esac
    ;;
  "ecr get-login-password") printf '%s\\n' "${PASSWORD}" ;;
  *) exit 1 ;;
esac
`
    );
    // A build records the context it was given (its last argument) and what that context holds; it fails when state/build-fails exists.
    write(
      join(bin, 'docker'),
      `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "${state}/docker.log"
case "$1" in
  login)
    [ "$(cat)" != "${PASSWORD}" ] || echo "login-stdin=password" >> "${state}/docker.log"
    ;;
  buildx)
    context="\${!#}" ignored=no tracked=no
    [ ! -e "$context/planted-ignored.txt" ] || ignored=yes
    [ "$(cat "$context/file.txt" 2> /dev/null)" != "three" ] || tracked=yes
    printf 'context=%s\\ncontext-holds-ignored=%s\\ncontext-holds-tracked=%s\\n' "$context" "$ignored" "$tracked" >> "${state}/docker.log"
    [ ! -e "${state}/build-fails" ] || exit 1
    ;;
esac
exit 0
`
    );
    write(
      join(bin, 'tar'),
      `#!/usr/bin/env bash
[ ! -e "${state}/extract-fails" ] || exit 1
exec "${which('tar')}" "$@"
`
    );
    // HEAD as the script reads it is state/head when that file exists, printed without a trailing newline.
    write(
      join(bin, 'git'),
      `#!/usr/bin/env bash
if [ -e "${state}/head" ] && [ "$*" = "-C ${clone} rev-parse --verify --quiet HEAD" ]; then
  cat "${state}/head"
  exit 0
fi
exec "${which('git')}" "$@"
`
    );
    for (const tool of ['aws', 'docker', 'tar', 'git']) chmodSync(join(bin, tool), 0o755);

    env = {
      PATH: [bin, process.env.PATH ?? ''].join(delimiter),
      HOME: root,
      TMPDIR: work,
      GIT_CONFIG_NOSYSTEM: '1',
      GIT_CONFIG_GLOBAL: '/dev/null',
      AWS_CONFIG_FILE: '/dev/null',
      AWS_SHARED_CREDENTIALS_FILE: '/dev/null'
    };

    spawnSync('git', ['init', '-q', '--bare', join(root, 'origin.git')], { env });
    spawnSync('git', ['clone', '-q', join(root, 'origin.git'), clone], { env });
    for (const file of ['infra/scripts/build-push-image.sh', 'scripts/lib/cli.sh', 'scripts/lib/aws.sh']) {
      mkdirSync(dirname(join(clone, file)), { recursive: true });
      copyFileSync(join(REPO_ROOT, file), join(clone, file));
    }
    write(join(clone, 'file.txt'), 'one\n');
    git('add', '.');
    git('commit', '-q', '-m', 'one');
    git('push', '-q', 'origin', 'HEAD:refs/heads/main');
    write(join(state, 'account'), '000000000000\n');
  });

  afterAll(() => {
    if (root !== '') rmSync(root, { recursive: true, force: true });
  });

  it('refuses a HEAD that is not 40 lower-case hexadecimal characters, as a whole string', () => {
    try {
      for (const head of [
        HEX_40.toUpperCase(),
        HEX_40.slice(0, 39),
        `${HEX_40}${HEX_40.slice(0, 24)}`,
        `${HEX_40}\n `
      ]) {
        write(join(state, 'head'), head);
        expect(deploy()).toEqual({ status: 1, out: 'refused=not-a-commit-id' });
        expect(log('aws')).toBe('');
      }
    } finally {
      rmSync(join(state, 'head'));
    }
  });

  it('refuses a tree with an untracked file before any AWS call', () => {
    write(join(clone, 'untracked.txt'), 'two\n');
    expect(deploy()).toEqual({ status: 1, out: 'refused=dirty-tree' });
    expect(log('aws')).toBe('');
    rmSync(join(clone, 'untracked.txt'));
  });

  it('refuses a tree with a modified file', () => {
    write(join(clone, 'file.txt'), 'changed\n');
    expect(deploy()).toEqual({ status: 1, out: 'refused=dirty-tree' });
    git('checkout', '-q', '--', 'file.txt');
  });

  it('refuses a commit that origin does not hold, before any AWS call', () => {
    write(join(clone, 'file.txt'), 'three\n');
    git('commit', '-q', '-am', 'three');
    expect(deploy()).toEqual({ status: 1, out: 'refused=head-not-pushed' });
    expect(log('aws')).toBe('');
  });

  it('refuses a pushed commit whose tree holds .planning/, before any AWS call', () => {
    write(join(clone, '.planning/PLAN.md'), 'plan\n');
    git('add', '.planning/PLAN.md');
    git('commit', '-q', '-m', 'planning');
    git('push', '-q', 'origin', 'HEAD:refs/heads/main');
    expect(deploy()).toEqual({ status: 1, out: 'refused=planning-in-tree' });
    expect(log('aws')).toBe('');
  });

  it('refuses a caller in another account, stops at the caller and names only the expected account', () => {
    git('rm', '-q', '-r', '.planning');
    git('commit', '-q', '-m', 'no planning');
    write(join(clone, '.gitignore'), 'planted-ignored.txt\n');
    git('add', '.gitignore');
    git('commit', '-q', '-m', 'ignore');
    git('push', '-q', 'origin', 'HEAD:refs/heads/main');
    // Ignored, so the tree is still clean and every check passes with it in the working tree.
    write(join(clone, 'planted-ignored.txt'), 'local secret\n');

    const { status, out } = deploy();
    expect({ status, out }).toEqual({ status: 1, out: `refused=account expected_account=${ACCOUNT_ID}` });
    expect(out).not.toContain('000000000000');
    expect(log('aws')).toBe('sts get-caller-identity --query Account --output text\n');
    expect(log('docker')).toBe('');
  });

  it('exits 3 with the digest and builds nothing when the registry already holds the commit', () => {
    write(join(state, 'account'), `${ACCOUNT_ID}\n`);
    write(join(state, 'describe.1'), `${DIGEST}\n`);
    expect(deploy()).toEqual({ status: 3, out: `tag_exists=yes image_digest=${DIGEST}` });
    expect(log('docker')).toBe('');
    expect(log('aws')).toContain(`--image-ids imageTag=${git('rev-parse', 'HEAD')} `);
  });

  it('fails without docker when the registry cannot be read', () => {
    write(join(state, 'describe.1'), 'AccessDeniedException\n');
    expect(deploy()).toEqual({ status: 1, out: 'failed=describe-images' });
    expect(log('docker')).toBe('');
  });

  it('pushes nothing and signs out when the build fails', () => {
    write(join(state, 'describe.1'), 'ImageNotFoundException\n');
    write(join(state, 'describe.2'), `${DIGEST}\n`);
    write(join(state, 'build-fails'), '');
    expect(deploy()).toEqual({ status: 1, out: 'failed=build' });
    expect(log('docker')).not.toContain('push ');
    expect(log('docker')).toContain(`logout ${REGISTRY}`);
    rmSync(join(state, 'build-fails'));
  });

  it('builds and pushes nothing when the commit cannot be extracted into a context', () => {
    write(join(state, 'extract-fails'), '');
    expect(deploy()).toEqual({ status: 1, out: 'failed=context' });
    expect(log('docker')).not.toContain('buildx ');
    expect(log('docker')).not.toContain('push ');
    rmSync(join(state, 'extract-fails'));
  });

  it('builds the commit from a copy of its tree, pushes it and prints the tag and digest', () => {
    const sha = git('rev-parse', 'HEAD');
    const { status, out } = deploy();
    const aws = log('aws');
    const docker = log('docker');
    expect(status).toBe(0);
    expect(out).toBe(`image_tag=${sha}\nimage_digest=${DIGEST}`);

    expect(docker).toContain('login-stdin=password');
    expect(`${aws}\n${docker}`).not.toContain(PASSWORD);
    expect(out).not.toContain(PASSWORD);

    expect(docker).toContain('buildx build --platform linux/arm64 --target production ');
    expect(docker).toContain(`--build-arg BUILD_SHA=${sha} `);
    expect(docker).toContain(' --provenance=false ');
    expect(docker).toContain(' --sbom=false ');
    expect(docker).toContain(`-t ${URL}:${sha} --load /`);

    const context = /^context=(.*)$/m.exec(docker)?.[1] ?? '';
    expect(context).toMatch(new RegExp(`^${work}/openvaa-build-push\\.[^/]+/context$`));
    expect(`${context}/`.startsWith(`${clone}/`)).toBe(false);
    expect(docker).toContain('context-holds-ignored=no');
    expect(docker).toContain('context-holds-tracked=yes');
    expect(docker).toContain(`-f ${context}/apps/frontend/Dockerfile `);

    expect(docker).toContain(`push ${URL}:${sha}`);
    expect(docker).toContain(`logout ${REGISTRY}`);
  });
});
