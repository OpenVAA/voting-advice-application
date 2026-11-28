/**
 * Status-reading steps of the pipeline workflows, run the way a GitHub-hosted runner runs a `run:` step that names no `shell:`: as `bash -e <script file>`, against stub commands.
 *
 * Under `bash -e` a command that fails ends the step unless it stands in an `||` list, so a step that reads a status with `$?` on the line after its command would end before it prints its own diagnosis. These cases take each step's script from the parsed workflow and run it in a temporary root whose `PATH` holds only stub commands and links to local file utilities, with an environment built from nothing, so no host credential and no network command reaches the script.
 */

import { spawnSync } from 'node:child_process';
import {
  accessSync,
  chmodSync,
  constants,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { jobSteps, loadWorkflow, workflowJobs } from './workflowGuards';
import type { WorkflowStep } from './workflowGuards';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');
const WORKFLOWS = join(REPO_ROOT, '.github', 'workflows');

/** The local utilities a step's script may reach through `utils/`. Each reads or writes local files only. */
const LOCAL_UTILITIES = [
  'sed',
  'cat',
  'grep',
  'awk',
  'find',
  'rm',
  'mkdir',
  'ln',
  'wc',
  'sort',
  'basename',
  'base64',
  'jq',
  'env',
  'tr',
  'head',
  'cut'
] as const;

/** The absolute path of `bash`, from the test process's own `PATH`. */
const BASH = findOnPath('bash');

/**
 * Every distinct executable of each local utility's name on the test process's `PATH`, in `PATH` order, resolved once with `type -ap`. The first is the one a step runs; the later ones stay reachable behind it, because a host may put a wrapper first that hands over to the next utility of its name on `PATH`, as a session's `rm` guard does.
 */
const UTILITY_CHAINS: Record<string, Array<string>> = Object.fromEntries(
  LOCAL_UTILITIES.map((name) => [name, resolveUtility(name)])
);

/** The absolute path of each local utility a step runs: the first of its chain. */
const UTILITY_PATHS: Record<string, string> = Object.fromEntries(
  Object.entries(UTILITY_CHAINS).map(([name, chain]) => [name, chain[0]])
);

/** How many `utils` directories a run puts on `PATH`: one for each place in the longest chain. */
const UTILITY_TIERS = Math.max(...Object.values(UTILITY_CHAINS).map((chain) => chain.length));

/** The first executable `name` on the test process's `PATH`; throws naming it when there is none. */
function findOnPath(name: string): string {
  for (const directory of (process.env.PATH ?? '').split(delimiter)) {
    if (!directory) continue;
    const candidate = join(directory, name);
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      // not in this directory
    }
  }
  throw new Error(`${name} is not on the test process's PATH`);
}

/** The absolute paths `type -ap` gives for a utility, one per distinct file; throws naming the utility when it cannot be resolved. */
function resolveUtility(name: string): Array<string> {
  const result = spawnSync(BASH, ['-c', 'type -ap "$1"', '_', name], {
    encoding: 'utf8',
    env: { PATH: process.env.PATH ?? '' }
  });
  const seen = new Set<string>();
  const chain: Array<string> = [];
  for (const path of result.stdout.split('\n')) {
    if (!path.startsWith('/')) continue;
    const real = realpathSync(path);
    if (seen.has(real)) continue;
    seen.add(real);
    chain.push(path);
  }
  if (result.status !== 0 || chain.length === 0) throw new Error(`the utility ${name} could not be resolved`);
  return chain;
}

/** A file put into the case's working directory; an executable one is a stub, run by the absolute `bash`. */
type WorkspaceFile = { content: string; executable?: boolean };

/** What one run of a step's script gets: stub commands by name, files of its working directory, its variables. */
type RunnerShellOptions = {
  stubs?: Record<string, string>;
  files?: Record<string, WorkspaceFile>;
  env?: Record<string, string>;
};

/** The outcome of one run, plus what the step wrote to the runner's files. */
type RunnerShellResult = {
  status: number | null;
  stdout: string;
  stderr: string;
  githubOutput: string;
  stepSummary: string;
};

/**
 * The `run` string of one step of a workflow under `.github/workflows/`.
 *
 * @param file - The workflow's file name, such as `infra-plan.yml`.
 * @param jobId - The job's id.
 * @param stepName - The step's name.
 * @returns The step's script.
 * @throws Naming the file, the job and the step when the step or its script is absent.
 */
function stepScript(file: string, jobId: string, stepName: string): string {
  const { run } = findStep(file, jobId, stepName);
  if (typeof run !== 'string')
    throw new Error(`${file} job ${jobId} step ${JSON.stringify(stepName)} has no run script`);
  return run;
}

/** A stub's file text: the absolute `bash` as its interpreter, then its body. */
function stubText(body: string): string {
  return `#!${BASH}\n${body}\n`;
}

/** A stub that prints `stub <name> failed` to standard error and exits 1. */
function failingStub(name: string): string {
  return `echo "stub ${name} failed" >&2\nexit 1`;
}

/**
 * A stub with a local utility's name that fails, printing `stub <name> failed`, when one of its arguments contains `text`, and otherwise runs the real utility by the path resolved for `utils/`.
 */
function selectiveStub(name: (typeof LOCAL_UTILITIES)[number], text: string): string {
  return [
    'for argument in "$@"; do',
    '  case "$argument" in',
    `    *'${text}'*) echo "stub ${name} failed" >&2; exit 1 ;;`,
    '  esac',
    'done',
    `exec '${UTILITY_PATHS[name]}' "$@"`
  ].join('\n');
}

/** The variables the harness sets itself, which a case never replaces with a stand-in. */
const HARNESS_VARIABLES = new Set([
  'PATH',
  'HOME',
  'RUNNER_TEMP',
  'GITHUB_WORKSPACE',
  'GITHUB_OUTPUT',
  'GITHUB_ENV',
  'GITHUB_STEP_SUMMARY'
]);

/** The deployment whose resolver outputs stand in for the resolve job's: the one `deploy/<key>` deploys. */
const STAND_IN_DEPLOYMENT = 'staging';

/** The resolver's outputs for `STAND_IN_DEPLOYMENT`, by name, from a run of the resolver on this repository's files. */
const RESOLVED_STAND_INS: Record<string, string> = resolvedStandIns();

function resolvedStandIns(): Record<string, string> {
  const map = JSON.parse(
    readFileSync(join(REPO_ROOT, 'infra', 'bootstrap', 'deployments.auto.tfvars.json'), 'utf8')
  ) as {
    deployments: Record<string, { github_repository_id: string }>;
  };
  const repositoryId = map.deployments[STAND_IN_DEPLOYMENT].github_repository_id;
  const result = spawnSync(
    BASH,
    [
      join(REPO_ROOT, 'infra', 'scripts', 'resolve-deployment.sh'),
      '--mode',
      'deploy',
      '--repository-id',
      repositoryId,
      '--ref',
      `deploy/${STAND_IN_DEPLOYMENT}`
    ],
    { encoding: 'utf8', env: { PATH: process.env.PATH ?? '' } }
  );
  if (result.status !== 0)
    throw new Error(`resolve-deployment.sh exited ${result.status}: ${result.stdout}${result.stderr}`);
  return Object.fromEntries(
    result.stdout
      .split('\n')
      .filter((line) => line.includes('='))
      .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)])
  );
}

/** A step `env:` value read from the resolve job, `${{ needs.resolve.outputs.<name> }}`; group 1 is the name. */
const RESOLVED_OUTPUT = /^\$\{\{ needs\.resolve\.outputs\.([a-z_]+) \}\}$/;

/**
 * A stand-in value for every key of a step's `env:`, and for every upper-case variable its script reads as `$NAME` or `${NAME}` that the harness does not set, because the scripts run with `-u`. A key bound to a resolve job output gets that output's value for `STAND_IN_DEPLOYMENT`, so a step that reads a file of its resolved root reads the repository's own.
 */
function standInEnv(step: WorkflowStep, script: string): Record<string, string> {
  const env = isRecord(step.env) ? step.env : {};
  const names = new Set(Object.keys(env));
  for (const [, name] of script.matchAll(/\$\{?([A-Z_][A-Z0-9_]*)/g)) names.add(name);
  return Object.fromEntries(
    [...names]
      .filter((name) => !HARNESS_VARIABLES.has(name))
      .map((name) => {
        const output = RESOLVED_OUTPUT.exec(String(env[name] ?? ''))?.[1];
        return [name, output !== undefined && output in RESOLVED_STAND_INS ? RESOLVED_STAND_INS[output] : 'standin'];
      })
  );
}

/** The AWS root a case names in `AWS_ROOT`, a directory of the case's working directory only. */
const HARNESS_AWS_ROOT = 'harness/envs/case/aws';

/** The tfvars a case copies into `HARNESS_AWS_ROOT`: those of the stand-in deployment's AWS root. */
const STAND_IN_TFVARS = `${RESOLVED_STAND_INS.aws_root}/terraform.tfvars`;

/** The three pipeline workflows. */
const PIPELINE_WORKFLOWS = ['deploy.yml', 'destroy.yml', 'infra-plan.yml'] as const;

/** One step of one of the three pipeline workflows, with where it stands. */
type PipelineStep = { file: string; jobId: string; name: string; step: WorkflowStep; script: string };

/** The steps of the pipeline workflows whose `run` reads `$?`, found in the parsed workflows. */
function statusReadingSteps(): Array<PipelineStep> {
  return PIPELINE_WORKFLOWS.flatMap((file) =>
    workflowJobs(loadWorkflow(join(WORKFLOWS, file)).doc).flatMap(([jobId, job]) =>
      jobSteps(job).flatMap((step) =>
        typeof step.run === 'string' && step.run.includes('$?')
          ? [{ file, jobId, name: String(step.name), step, script: step.run }]
          : []
      )
    )
  );
}

/** The commands a sweep case replaces with a stub that fails: each reaches the network, a package or privileges. */
const SWEEP_STUBS = [
  'terraform',
  'aws',
  'curl',
  'sudo',
  'apt-get',
  'yarn',
  'psql',
  'docker',
  'gh',
  'git',
  'node',
  'npx',
  'supabase'
] as const;

/**
 * The working directory of a sweep case: a failing stub at every `infra/scripts/<name>.sh` and `node_modules/.bin/<name>` the script names, and a copy of every other file of this repository under `infra/` or `apps/` it names, a path written with a variable of `env` read with that variable's value.
 */
function sweepFiles(rawScript: string, env: Record<string, string>): Record<string, WorkspaceFile> {
  const script = rawScript.replace(/\$\{?([A-Z_][A-Z0-9_]*)\}?/g, (written, name: string) => env[name] ?? written);
  const files: Record<string, WorkspaceFile> = {};
  for (const [path] of script.matchAll(/(?:infra\/scripts\/[A-Za-z0-9_-]+\.sh|node_modules\/\.bin\/[A-Za-z0-9_-]+)/g)) {
    files[path] = { content: failingStub(path), executable: true };
  }
  for (const [match] of script.matchAll(/(?:infra|apps)\/[A-Za-z0-9_./-]+/g)) {
    const path = match.replace(/\.+$/, '');
    if (path in files || !isRepositoryFile(path)) continue;
    files[path] = { content: readFileSync(join(REPO_ROOT, path), 'utf8') };
  }
  return files;
}

/** Whether a relative path names a file of this repository. */
function isRepositoryFile(path: string): boolean {
  try {
    return statSync(join(REPO_ROOT, path)).isFile();
  } catch {
    return false;
  }
}

/** The step named `name` of job `jobId` in `file`, from the status-reading steps or the parsed workflow. */
function pipelineStep(file: string, jobId: string, name: string): PipelineStep {
  return { file, jobId, name, step: findStep(file, jobId, name), script: stepScript(file, jobId, name) };
}

/** The parsed step; throws naming the file, the job and the step when it is absent. */
function findStep(file: string, jobId: string, name: string): WorkflowStep {
  const job = workflowJobs(loadWorkflow(join(WORKFLOWS, file)).doc).find(([id]) => id === jobId)?.[1];
  const step = job ? jobSteps(job).find((candidate) => candidate.name === name) : undefined;
  if (!step) throw new Error(`${file} has no job ${jobId} with a step named ${JSON.stringify(name)}`);
  return step;
}

/** `script` with `+e` added to its first `set -uo pipefail` line, which turns errexit off for the copy. */
function withErrexitOff(script: string): string {
  return mutateAll(script, /^([ \t]*)set -uo pipefail$/m, '$1set +e -uo pipefail');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A copy of every shell library of this repository a script sources from the checkout root, as `. scripts/lib/<name>.sh`: it defines functions only, so a case runs it as the runner would. */
function sourcedLibraries(script: string): Record<string, WorkspaceFile> {
  return Object.fromEntries(
    [...script.matchAll(/^[ \t]*\. (scripts\/lib\/[A-Za-z0-9_-]+\.sh)$/gm)].map(([, path]) => [
      path,
      { content: readFileSync(join(REPO_ROOT, path), 'utf8') }
    ])
  );
}

/**
 * Run a step's script as a GitHub-hosted runner runs a `run:` step with no `shell:`, as `bash -e <file>`.
 *
 * The run gets a temporary root holding `ws/` (its working directory and `GITHUB_WORKSPACE`), `runner-temp/` (`RUNNER_TEMP`, which also holds `GITHUB_OUTPUT`, `GITHUB_ENV` and `GITHUB_STEP_SUMMARY`), `stubs/` and the `utils` directories. `ws/` holds the case's files and a copy of each shell library the script sources; `utils/` links the first executable of each local utility's name, and `utils-2/` onwards the later ones of its chain. Its `PATH` names `stubs/` and those directories only, in that order, and its environment holds nothing else of the host's. The root is removed when the run ends.
 *
 * @param script - The step's script.
 * @param options - The stubs, the working directory's files and the case's own variables.
 * @returns The exit status, both output streams, and the contents of `GITHUB_OUTPUT` and `GITHUB_STEP_SUMMARY`.
 */
function runUnderRunnerShell(script: string, options: RunnerShellOptions = {}): RunnerShellResult {
  const root = mkdtempSync(join(tmpdir(), 'workflow-errexit-'));
  try {
    const ws = join(root, 'ws');
    const runnerTemp = join(root, 'runner-temp');
    const stubs = join(root, 'stubs');
    const utils = Array.from({ length: UTILITY_TIERS }, (_, tier) =>
      join(root, tier === 0 ? 'utils' : `utils-${tier + 1}`)
    );
    for (const directory of [ws, runnerTemp, stubs, ...utils]) mkdirSync(directory);
    for (const [name, chain] of Object.entries(UTILITY_CHAINS))
      chain.forEach((path, tier) => symlinkSync(path, join(utils[tier], name)));
    for (const [name, body] of Object.entries(options.stubs ?? {})) {
      writeFileSync(join(stubs, name), stubText(body));
      chmodSync(join(stubs, name), 0o755);
    }
    const files = { ...sourcedLibraries(script), ...options.files };
    for (const [relative, file] of Object.entries(files)) {
      const target = join(ws, relative);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, file.executable ? stubText(file.content) : file.content);
      if (file.executable) chmodSync(target, 0o755);
    }
    const githubOutput = join(runnerTemp, 'github-output');
    const githubEnv = join(runnerTemp, 'github-env');
    const stepSummary = join(runnerTemp, 'step-summary');
    for (const file of [githubOutput, githubEnv, stepSummary]) writeFileSync(file, '');
    const scriptFile = join(root, 'step.sh');
    writeFileSync(scriptFile, script);

    const result = spawnSync(BASH, ['-e', scriptFile], {
      cwd: ws,
      encoding: 'utf8',
      timeout: 30_000,
      env: {
        PATH: [stubs, ...utils].join(':'),
        HOME: root,
        RUNNER_TEMP: runnerTemp,
        GITHUB_WORKSPACE: ws,
        GITHUB_OUTPUT: githubOutput,
        GITHUB_ENV: githubEnv,
        GITHUB_STEP_SUMMARY: stepSummary,
        ...options.env
      }
    });
    return {
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      githubOutput: readFileSync(githubOutput, 'utf8'),
      stepSummary: readFileSync(stepSummary, 'utf8')
    };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

/** `source` with every match of `pattern` replaced; throws when nothing matched, so a copy is never the original. */
function mutateAll(source: string, pattern: RegExp, replacement: string): string {
  const mutated = source.replace(pattern, replacement);
  if (mutated === source) throw new Error(`the mutation found nothing to replace: ${String(pattern)}`);
  return mutated;
}

/** Every ` || <name>=$?` capture of a script. */
const STATUS_CAPTURE = / \|\| [A-Za-z_][A-Za-z0-9_]*=\$\?/g;

/** The lines a run printed to standard output. */
function lines(output: string): Array<string> {
  return output.split('\n');
}

describe('the wrong-subject step of infra-plan.yml under bash -e', () => {
  const script = stepScript(
    'infra-plan.yml',
    'wrong-subject',
    'Ask STS for the deploy role and the plan role with the branch subject'
  );
  const subject = 'repo:OpenVAA/voting-advice-application:ref:refs/heads/deploy-evidence/harness';
  const token = [
    Buffer.from('{"alg":"RS256"}').toString('base64url'),
    Buffer.from(JSON.stringify({ sub: subject })).toString('base64url'),
    'signature'
  ].join('.');
  const curl = [
    'out=',
    'while [ "$#" -gt 0 ]; do',
    '  if [ "$1" = -o ]; then out="$2"; shift; fi',
    '  shift',
    'done',
    `printf '%s' '{"value":"${token}"}' > "$out"`
  ].join('\n');
  const refusingAws = [
    "echo 'An error occurred (AccessDenied) when calling the AssumeRoleWithWebIdentity operation: Not authorized to perform sts:AssumeRoleWithWebIdentity' >&2",
    'exit 254'
  ].join('\n');
  const env = {
    DEPLOY_ROLE_ARN: 'arn:aws:iam::000000000000:role/harness-deploy',
    PLAN_ROLE_ARN: 'arn:aws:iam::000000000000:role/harness-plan',
    ACTIONS_ID_TOKEN_REQUEST_URL: 'https://token.invalid/?a=b',
    ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'harness'
  };
  const refusalLines = [
    `token_subject=${subject}`,
    'deploy_role_assume_status=254',
    'deploy_role_error=AccessDenied',
    'plan_role_assume_status=254',
    'plan_role_error=AccessDenied'
  ];

  it('prints the subject and both refusals and exits 0 when both roles refuse with AccessDenied', () => {
    const run = runUnderRunnerShell(script, { stubs: { curl, aws: refusingAws }, env });
    for (const line of refusalLines) expect(lines(run.stdout)).toContain(line);
    expect(run.status).toBe(0);
  });

  it('exits 1 with its own error line when a role accepts the subject', () => {
    const run = runUnderRunnerShell(script, { stubs: { curl, aws: 'exit 0' }, env });
    expect(lines(run.stdout).some((line) => line.startsWith('::error::A role did not refuse'))).toBe(true);
    expect(run.status).toBe(1);
  });

  it('is red under bash -e when its statuses are not read in an || list', () => {
    const run = runUnderRunnerShell(mutateAll(script, STATUS_CAPTURE, ''), { stubs: { curl, aws: refusingAws }, env });
    for (const line of refusalLines) expect(lines(run.stdout)).not.toContain(line);
    expect(run.status).not.toBe(0);
  });
});

describe('every status-reading step of the pipeline workflows under bash -e', () => {
  const population = statusReadingSteps();

  it('finds status-reading steps in the three workflows', () => {
    expect(population.length).toBeGreaterThan(0);
  });

  for (const { file, jobId, name, step, script } of population) {
    it(`${file} ${jobId} ${name}`, () => {
      const env = standInEnv(step, script);
      const run = runUnderRunnerShell(script, {
        stubs: Object.fromEntries(SWEEP_STUBS.map((stub) => [stub, failingStub(stub)])),
        files: sweepFiles(script, env),
        env
      });
      expect(lines(run.stdout).filter((line) => line.startsWith('::error::'))).not.toEqual([]);
      expect(run.status).not.toBe(0);
    });
  }
});

describe('the build step of deploy.yml under bash -e', () => {
  const { step, script } = pipelineStep('deploy.yml', 'deploy', 'Build and push the image');
  const digest = `sha256:${'0123456789abcdef'.repeat(4)}`;

  function runWithBuildScript(body: string): RunnerShellResult {
    return runUnderRunnerShell(script, {
      files: {
        [`${HARNESS_AWS_ROOT}/terraform.tfvars`]: { content: readFileSync(join(REPO_ROOT, STAND_IN_TFVARS), 'utf8') },
        'infra/scripts/build-push-image.sh': { content: body, executable: true }
      },
      env: { ...standInEnv(step, script), AWS_ROOT: HARNESS_AWS_ROOT }
    });
  }

  it('stops before the build when the root AWS_ROOT names holds no tfvars', () => {
    const run = runUnderRunnerShell(script, {
      files: { 'infra/scripts/build-push-image.sh': { content: 'exit 0', executable: true } },
      env: { ...standInEnv(step, script), AWS_ROOT: HARNESS_AWS_ROOT }
    });
    expect(run.status).not.toBe(0);
    expect(run.stdout).not.toContain('build_exit=');
  });

  it('prints failed=build and its own error line and exits 1 when the build fails', () => {
    const run = runWithBuildScript('echo failed=build\nexit 1');
    for (const line of ['failed=build', 'build_exit=1', '::error::build-push-image.sh exited 1.']) {
      expect(lines(run.stdout)).toContain(line);
    }
    expect(run.status).toBe(1);
  });

  it('goes on to the digest when the registry already holds the image, status 3', () => {
    const run = runWithBuildScript(`echo 'tag_exists=yes image_digest=${digest}'\nexit 3`);
    expect(lines(run.stdout)).toContain('build_exit=3');
    expect(lines(run.stdout)).toContain(`digest=${digest}`);
    expect(lines(run.githubOutput)).toContain(`digest=${digest}`);
    expect(run.status).toBe(0);
  });
});

describe('the plan step of infra-plan.yml under bash -e', () => {
  const { step, script } = pipelineStep('infra-plan.yml', 'plan', 'Plan the AWS root');

  it('accepts plan status 2, a plan with changes', () => {
    const run = runUnderRunnerShell(script, {
      stubs: { terraform: 'exit 2' },
      env: { ...standInEnv(step, script), AWS_ROOT: HARNESS_AWS_ROOT }
    });
    expect(lines(run.stdout)).toContain('plan_exit=2');
    expect(run.status).toBe(0);
  });

  it('fails with its own error line on plan status 1', () => {
    const run = runUnderRunnerShell(script, {
      stubs: { terraform: 'exit 1' },
      env: { ...standInEnv(step, script), AWS_ROOT: HARNESS_AWS_ROOT }
    });
    expect(lines(run.stdout)).toContain('::error::terraform plan exited 1.');
    expect(run.status).toBe(1);
  });
});

describe('the Supabase-root step of destroy.yml under bash -e', () => {
  const { step, script } = pipelineStep(
    'destroy.yml',
    'plan-destroy',
    "Show the Supabase root's state is out of reach"
  );
  const refusingAws = [
    "echo 'An error occurred (403) when calling the HeadObject operation: Forbidden' >&2",
    'exit 254'
  ].join('\n');
  const env = {
    ...standInEnv(step, script),
    SUPABASE_ROOT: RESOLVED_STAND_INS.supabase_root,
    STATE_BUCKET: RESOLVED_STAND_INS.state_bucket,
    SUPABASE_STATE_KEY: RESOLVED_STAND_INS.supabase_state_key
  };

  it('passes on the two expected refusals', () => {
    const run = runUnderRunnerShell(script, {
      stubs: {
        terraform: "echo 'Error refreshing state: AccessDenied: Access Denied, status code: 403'\nexit 1",
        aws: refusingAws
      },
      env
    });
    for (const line of ['supabase_root_init_status=1', 'supabase_state_head_status=254', 'supabase_root_refused=yes']) {
      expect(lines(run.stdout)).toContain(line);
    }
    expect(run.status).toBe(0);
  });

  it('fails when the init of the Supabase root succeeds', () => {
    const run = runUnderRunnerShell(script, {
      stubs: { terraform: 'exit 0', aws: refusingAws },
      env
    });
    expect(lines(run.stdout)).toContain('supabase_root_refused=no');
    expect(run.status).toBe(1);
  });
});

describe('the functions step of deploy.yml under bash -e', () => {
  const { step, script } = pipelineStep('deploy.yml', 'deploy', 'Deploy the functions');

  /** A run with the deploy passing and the probe answering with `probe`, a stub body for `node`. */
  function runWithProbe(probe: string): RunnerShellResult {
    return runUnderRunnerShell(script, {
      stubs: { node: probe },
      files: { 'node_modules/.bin/supabase': { content: 'exit 0', executable: true } },
      env: standInEnv(step, script)
    });
  }

  it('passes when the probe passes both function checks', () => {
    const run = runWithProbe("echo 'PASS functions.deployed'\necho 'PASS functions.verify-jwt'\nexit 0");
    expect(lines(run.stdout)).toContain('functions_probe_exit=0');
    expect(run.status).toBe(0);
  });

  it('prints the finding and its own error line and exits 1 when a function check fails', () => {
    const run = runWithProbe("echo 'FAIL functions.deployed: not deployed: send-email'\nexit 1");
    for (const line of [
      'FAIL functions.deployed: not deployed: send-email',
      'functions_probe_exit=1',
      '::error::probe-hosted.mjs exited 1.'
    ]) {
      expect(lines(run.stdout)).toContain(line);
    }
    expect(run.status).toBe(1);
  });

  it('exits 1 when the probe cannot read config.toml, never taking a verify_jwt as given', () => {
    const run = runWithProbe("echo 'COULD NOT RUN expected: config.toml could not be read'\nexit 2");
    expect(lines(run.stdout)).toContain('functions_probe_exit=2');
    expect(lines(run.stdout)).toContain('::error::probe-hosted.mjs exited 2.');
    expect(run.status).toBe(1);
  });
});

describe('a command whose status a step does not read still ends the step under bash -e', () => {
  describe('the plan print of deploy.yml, when the printed plan cannot be read', () => {
    const { step, script } = pipelineStep('deploy.yml', 'deploy', 'Show the plan');
    const heading = `### Plan of ${HARNESS_AWS_ROOT}`;
    const options = {
      stubs: {
        terraform: "echo 'Plan: 0 to add, 1 to change, 0 to destroy.'\nexit 0",
        cat: selectiveStub('cat', 'tfplan.txt')
      },
      env: { ...standInEnv(step, script), AWS_ROOT: HARNESS_AWS_ROOT }
    };

    it('stops at the failed print and writes no plan to the step summary', () => {
      const run = runUnderRunnerShell(script, options);
      expect(run.stepSummary).not.toContain(heading);
      expect(run.status).not.toBe(0);
    });

    it('would write the plan heading and exit 0 if errexit were off, the control', () => {
      const run = runUnderRunnerShell(withErrexitOff(script), options);
      expect(run.stepSummary).toContain(heading);
      expect(run.status).toBe(0);
    });
  });
});

describe('the alert step of deploy.yml under bash -e', () => {
  const { step, script } = pipelineStep('deploy.yml', 'deploy', 'Alert the operator');
  const topic = RESOLVED_STAND_INS.topic_arn;

  /** A run with the build failed, `TOPIC_ARN` and `DEPLOYMENT_KEY` set, and the arguments `aws` saw, one per line. */
  function runAlert(deploymentKey: string): { run: RunnerShellResult; awsArguments: Array<string> } {
    const record = mkdtempSync(join(tmpdir(), 'workflow-errexit-alert-'));
    try {
      const argumentsFile = join(record, 'aws-arguments');
      const run = runUnderRunnerShell(script, {
        stubs: {
          aws: `printf '%s\\n' "$@" > '${argumentsFile}'\necho harness-message-id`,
          rm: 'exit 0'
        },
        env: {
          ...standInEnv(step, script),
          TOPIC_ARN: topic,
          DEPLOYMENT_KEY: deploymentKey,
          BUILD_OUTCOME: 'failure',
          JOB_STATUS: 'failure'
        }
      });
      return { run, awsArguments: lines(readFileSync(argumentsFile, 'utf8')) };
    } finally {
      rmSync(record, { recursive: true, force: true });
    }
  }

  /** The argument after `flag` in the arguments `aws` saw. */
  function argumentAfter(awsArguments: Array<string>, flag: string): string | undefined {
    const index = awsArguments.indexOf(flag);
    return index < 0 ? undefined : awsArguments[index + 1];
  }

  it('publishes the staging subject and text, byte for byte, to the resolved topic for DEPLOYMENT_KEY=staging', () => {
    const { run, awsArguments } = runAlert('staging');
    expect(run.status).toBe(0);
    expect(lines(run.stdout)).toContain('alert_stage=build');
    expect(lines(run.stdout)).toContain('alert_message_id=harness-message-id');
    expect(argumentAfter(awsArguments, '--topic-arn')).toBe(topic);
    expect(argumentAfter(awsArguments, '--subject')).toBe('openvaa staging deploy failed at build');
    expect(argumentAfter(awsArguments, '--message')).toBe('The staging deploy failed at build.');
  });

  it('names another deployment by its key', () => {
    const { awsArguments } = runAlert('other');
    expect(argumentAfter(awsArguments, '--subject')).toBe('openvaa other deploy failed at build');
    expect(argumentAfter(awsArguments, '--message')).toBe('The other deploy failed at build.');
  });
});

describe('the stable step of deploy.yml under bash -e', () => {
  const { step, script } = pipelineStep('deploy.yml', 'deploy', 'Check the rollout is stable');
  const applied = 'arn:aws:ecs:eu-north-1:000000000000:task-definition/harness-frontend:2';
  const other = 'arn:aws:ecs:eu-north-1:000000000000:task-definition/harness-frontend:1';
  const stubs = {
    terraform: [
      'case "$*" in',
      `  *'output -raw task_definition_arn') printf '%s' '${applied}' ;;`,
      "  *'output -raw cluster_name') printf '%s' harness ;;",
      "  *'output -raw service_name') printf '%s' harness-frontend ;;",
      '  *) echo "stub terraform failed" >&2; exit 1 ;;',
      'esac'
    ].join('\n'),
    aws: [
      'n=1',
      'if [ -f "$HOME/aws-calls" ]; then read -r n < "$HOME/aws-calls"; n=$((n + 1)); fi',
      'echo "$n" > "$HOME/aws-calls"',
      'echo "stub aws $n" >&2',
      'if [ -f "describe/$n.json" ]; then cat "describe/$n.json"; else cat describe/last.json; fi'
    ].join('\n'),
    sleep: 'echo "stub sleep $*" >&2'
  };

  /** One `describe-services` answer: a service of one desired task whose only deployment is the primary one. */
  function answer(taskDefinition: string, rolloutState: string, runningCount: number): string {
    return JSON.stringify({
      services: [{ desiredCount: 1, deployments: [{ status: 'PRIMARY', taskDefinition, rolloutState, runningCount }] }]
    });
  }

  /** The step's literal `name=<digits>` line; throws naming it when the script has none. */
  function literalNumber(name: string): number {
    const match = new RegExp(`^[ \\t]*${name}=([0-9]+)$`, 'm').exec(script);
    if (!match) throw new Error(`the stable step has no line ${name}=<digits>`);
    return Number(match[1]);
  }

  /** A run in which the n-th `describe-services` call gets the n-th answer, and every later call the last one. */
  function runWithAnswers(answers: Array<string>): RunnerShellResult {
    return runUnderRunnerShell(script, {
      stubs,
      files: {
        [`${HARNESS_AWS_ROOT}/terraform.tfvars`]: { content: readFileSync(join(REPO_ROOT, STAND_IN_TFVARS), 'utf8') },
        ...Object.fromEntries(answers.map((content, index) => [`describe/${index + 1}.json`, { content }])),
        'describe/last.json': { content: answers[answers.length - 1] }
      },
      env: { ...standInEnv(step, script), AWS_ROOT: HARNESS_AWS_ROOT }
    });
  }

  /** The `stable_poll=` lines of a run. */
  function polls(run: RunnerShellResult): Array<string> {
    return lines(run.stdout).filter((line) => line.startsWith('stable_poll='));
  }

  /** The lines the `sleep` stub wrote. */
  function sleeps(run: RunnerShellResult): Array<string> {
    return lines(run.stderr).filter((line) => line.startsWith('stub sleep'));
  }

  /** The error lines of a run. */
  function errors(run: RunnerShellResult): Array<string> {
    return lines(run.stdout).filter((line) => line.startsWith('::error::'));
  }

  const mismatch = '::error::The primary deployment does not run the applied task definition';

  it('reads again while the rollout is IN_PROGRESS and passes once it is COMPLETED at the floor', () => {
    const run = runWithAnswers([
      answer(applied, 'IN_PROGRESS', 1),
      answer(applied, 'IN_PROGRESS', 1),
      answer(applied, 'COMPLETED', 1)
    ]);
    expect(run.status).toBe(0);
    const interval = literalNumber('interval');
    expect(polls(run)).toEqual(['stable_poll=1', 'stable_poll=2', 'stable_poll=3']);
    expect(
      lines(run.stdout)
        .filter((line) => line.startsWith('stable_rollout_state='))
        .at(-1)
    ).toBe('stable_rollout_state=COMPLETED');
    expect(sleeps(run)).toEqual([`stub sleep ${interval}`, `stub sleep ${interval}`]);
    expect(errors(run)).toEqual([]);
  });

  it('fails with its error line when the rollout goes from IN_PROGRESS to FAILED', () => {
    const run = runWithAnswers([answer(applied, 'IN_PROGRESS', 1), answer(applied, 'FAILED', 0)]);
    expect(polls(run)).toEqual(['stable_poll=1', 'stable_poll=2']);
    expect(sleeps(run)).toHaveLength(1);
    expect(lines(run.stdout)).toContain('stable_rollout_state=FAILED');
    expect(errors(run).some((line) => line.startsWith(mismatch))).toBe(true);
    expect(run.status).toBe(1);
  });

  it('fails with its own error line at the last read when the rollout stays IN_PROGRESS', () => {
    const limit = literalNumber('polls');
    const run = runWithAnswers([answer(applied, 'IN_PROGRESS', 1)]);
    expect(polls(run)).toHaveLength(limit);
    expect(polls(run).at(-1)).toBe(`stable_poll=${limit}`);
    expect(lines(run.stderr).filter((line) => line.startsWith('stub aws'))).toHaveLength(limit);
    expect(sleeps(run)).toHaveLength(limit - 1);
    expect(
      errors(run).some((line) =>
        line.startsWith("::error::The primary deployment's rollout is still IN_PROGRESS after")
      )
    ).toBe(true);
    expect(run.status).toBe(1);
  }, 30_000);

  it('fails at the first read, without waiting, when the primary deployment runs another task definition', () => {
    const run = runWithAnswers([answer(other, 'IN_PROGRESS', 1)]);
    expect(polls(run)).toEqual(['stable_poll=1']);
    expect(sleeps(run)).toEqual([]);
    expect(lines(run.stdout)).toContain('stable_task_definition_matches=no');
    expect(errors(run).some((line) => line.startsWith(mismatch))).toBe(true);
    expect(run.status).toBe(1);
  });

  it('fails at the first read, without waiting, when a completed rollout runs fewer tasks than the floor', () => {
    const run = runWithAnswers([answer(applied, 'COMPLETED', 0)]);
    expect(polls(run)).toEqual(['stable_poll=1']);
    expect(sleeps(run)).toEqual([]);
    expect(lines(run.stdout)).toContain('stable_running=0');
    expect(errors(run).some((line) => line.startsWith(mismatch))).toBe(true);
    expect(run.status).toBe(1);
  });
});
