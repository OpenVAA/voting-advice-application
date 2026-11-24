/**
 * Guards that span the workflow files under `.github/workflows/`, rather than any one of them.
 *
 * Each workflow's own test holds the rules of that file. The rules here need more than one file to state:
 *
 * - **apply-root** — every Terraform `apply`, `destroy` or `plan -destroy` in any workflow names `-chdir="$AWS_ROOT"`, in a step whose `env.AWS_ROOT` is the resolve job's `aws_root` output. That output is the AWS root of the one deployment the run resolved from the deployment map; the example roots are a forker's template and the other roots are applied by hand, so a workflow that applied one of them would reach state no reviewer of the pipeline approved.
 * - **no-main-push** — no push branch pattern of `deploy.yml` or `destroy.yml` can match `main`. A merge to the default branch must deploy and destroy nothing.
 * - **shared-concurrency** — `deploy.yml` and `destroy.yml` share the one constant group `aws-pipeline` and never cancel a running job, so no deploy and destroy of the repository write AWS state at the same time and no apply is cut short holding its lock.
 * - **deploy-role-arn** — no workflow file holds a literal IAM role ARN. Every role `deploy.yml` and `destroy.yml` assume is the resolve job's `deploy_role_arn` output, and every role `infra-plan.yml` assumes is the `plan_role_arn` of its matrix entry, so each role comes from the deployment map through the resolver, whose derivation `resolve-deployment.test.ts` pins against the real map. A role read from a repository variable could name a role of another deployment, or one that does not exist.
 * - **environments** — the deploy job of `deploy.yml` names the resolve job's `environment` output, in the object form with a `url`, and the jobs of `destroy.yml` name its `destroy_environment` output; `infra-plan.yml` names none and no job of the three names a literal environment, since an environment's name is the subject the deploy role trusts.
 * - **needs-resolve** — `deploy.yml` and `destroy.yml` each have a job `resolve`, and every other job of theirs lists it in `needs`, so a run whose ref matches no deployment of the map ends at that job, before any job names an environment or assumes a role.
 * - **arm-lock** — every root a job on an ARM runner initialises has a lock whose every provider carries one `h1:` hash per platform of `LOCK_PLATFORMS`. `init -lockfile=readonly` on that runner installs packages whose `h1:` hashes it cannot record, and the plan then refuses them. A hash does not name its platform, so the rule counts them. A root written `"$AWS_ROOT"` in a step that binds `AWS_ROOT` to the resolve job's `aws_root` output, or to `matrix.deployment.aws_root` in a job whose matrix is the resolve job's `deployments` list, stands for the AWS root of every deployment of the map that has one. A job that initialises Terraform on a runner, or in a root, that the rule cannot read is a violation.
 * - **lock-platforms** — every root lock under `infra/` carries one `h1:` hash per platform of `LOCK_PLATFORMS` for each provider, and locks that select the same provider version carry the same hashes, so a lock written for other platforms differs from its siblings. The module directories are left out: the one tracked module lock, `infra/modules/supabase`'s, is read only by that module's test init.
 *
 * A `run:` script is read together with every `infra/scripts/*.sh` of the repository it names, so a Terraform command moved from a step into such a script stays under these rules.
 *
 * Each rule is shown red on a mutated in-memory copy, so that its green result on the real files means something.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { jobSteps, parseWorkflow, workflowJobs } from './workflowGuards';
import type { WorkflowDocument } from './workflowGuards';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');
const WORKFLOW_DIR = join(REPO_ROOT, '.github', 'workflows');
const BOOTSTRAP_MAP = join(REPO_ROOT, 'infra', 'bootstrap', 'deployments.auto.tfvars.json');
const REPOSITORY_ID = '546467466';
const LOCK_FILE = '.terraform.lock.hcl';

/** The resolve job's output naming the AWS root of the resolved deployment. */
const RESOLVED_AWS_ROOT = '${{ needs.resolve.outputs.aws_root }}';
/** A matrix entry's AWS root, in a job that runs once per deployment the resolve job lists. */
const MATRIX_AWS_ROOT = '${{ matrix.deployment.aws_root }}';
/** The matrix of a job that runs once per deployment the resolve job lists. */
const OWNED_DEPLOYMENTS = '${{ fromJSON(needs.resolve.outputs.deployments) }}';
/** The one `-chdir` word a mutating Terraform command may carry. */
const APPLY_CHDIR = '-chdir="$AWS_ROOT"';
/** The resolve job's output naming the deploy role of the resolved deployment. */
const RESOLVED_DEPLOY_ROLE_ARN = '${{ needs.resolve.outputs.deploy_role_arn }}';
/** A matrix entry's plan role, the only role `infra-plan.yml` assumes. */
const MATRIX_PLAN_ROLE_ARN = '${{ matrix.deployment.plan_role_arn }}';
/** The role every `role-to-assume` of each pipeline workflow names. */
const EXPECTED_ROLES: Record<string, string> = {
  'deploy.yml': RESOLVED_DEPLOY_ROLE_ARN,
  'destroy.yml': RESOLVED_DEPLOY_ROLE_ARN,
  'infra-plan.yml': MATRIX_PLAN_ROLE_ARN
};
/** A role ARN of the form the bootstrap root creates, for red copies. */
const SOME_ROLE_ARN = 'arn:aws:iam::111111111111:role/openvaa/openvaa-example-deploy';
/** The id of the credential-free first job of the deploy and destroy workflows. */
const RESOLVE_JOB = 'resolve';
/** The workflows that write AWS state, each routed through the resolve job. */
const WRITING_WORKFLOWS = ['deploy.yml', 'destroy.yml'] as const;
/** The concurrency the deploy and destroy workflows share. */
const SHARED_CONCURRENCY = { group: 'aws-pipeline', 'cancel-in-progress': false };
/** The environments each pipeline workflow names, and the files that may name none. */
const EXPECTED_ENVIRONMENTS: Record<string, Array<string>> = {
  'deploy.yml': ['${{ needs.resolve.outputs.environment }}'],
  'destroy.yml': ['${{ needs.resolve.outputs.destroy_environment }}'],
  'infra-plan.yml': []
};
/** A literal IAM role ARN. */
const ROLE_ARN = /arn:aws:iam::\d{12}:role\/[\w+=,.@/-]+/g;
/**
 * The platforms every provider lock is written for. Each lock is written by `terraform providers lock` with one `-platform=` flag for each, in this order.
 */
const LOCK_PLATFORMS = ['linux_amd64', 'linux_arm64', 'darwin_arm64', 'darwin_amd64'] as const;
/** A root path the rules can read as a literal. */
const READABLE_ROOT = /^[A-Za-z0-9_./-]+$/;
/** Shell words that may stand before a command on its line. */
const COMMAND_PREFIXES = new Set(['if', 'then', 'else', 'elif', 'do', '!', 'time', 'exec', 'env']);

/** A workflow file: its name under `.github/workflows/` and its text. */
type WorkflowFile = { name: string; text: string };

/** Every workflow file of the repository, by name. */
function workflowFiles(): Array<WorkflowFile> {
  return readdirSync(WORKFLOW_DIR)
    .filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'))
    .sort()
    .map((name) => ({ name, text: readFileSync(join(WORKFLOW_DIR, name), 'utf8') }));
}

/** The workflow file `name`; fails the test when it is absent. */
function workflowFile(files: Array<WorkflowFile>, name: string): WorkflowFile {
  const found = files.find((file) => file.name === name);
  if (!found) throw new Error(`.github/workflows has no ${name}`);
  return found;
}

/** `files` with the first match of `pattern` in `name` replaced; fails when nothing matched, so a mutation is never a no-op. */
function withMutation(
  files: Array<WorkflowFile>,
  name: string,
  pattern: string | RegExp,
  replacement: string
): Array<WorkflowFile> {
  const original = workflowFile(files, name).text;
  const mutated = original.replace(pattern, replacement);
  if (mutated === original) throw new Error(`the mutation of ${name} found nothing to replace: ${String(pattern)}`);
  return files.map((file) => (file.name === name ? { name, text: mutated } : file));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** `script` followed by the text of every `infra/scripts/*.sh` of the repository it names. */
function withCalledScripts(script: string): string {
  const called = [...new Set(script.match(/infra\/scripts\/[A-Za-z0-9_-]+\.sh/g) ?? [])];
  return [
    script,
    ...called
      .filter((path) => existsSync(join(REPO_ROOT, path)))
      .map((path) => readFileSync(join(REPO_ROOT, path), 'utf8'))
  ].join('\n');
}

/** The `env` mapping of a step, or an empty one. */
function stepEnv(step: Record<string, unknown>): Record<string, unknown> {
  return isRecord(step.env) ? step.env : {};
}

/** Every `run:` script of a workflow, with the scripts it calls, where it stands and its step's `env`. */
function runScripts(doc: WorkflowDocument): Array<{ where: string; script: string; env: Record<string, unknown> }> {
  return workflowJobs(doc).flatMap(([jobId, job]) =>
    jobSteps(job).flatMap((step, index) =>
      typeof step.run === 'string'
        ? [
            {
              where: `job ${jobId} step ${String(step.id ?? step.name ?? `#${index + 1}`)}`,
              script: withCalledScripts(step.run),
              env: stepEnv(step)
            }
          ]
        : []
    )
  );
}

/**
 * The Terraform commands of a script, each as its words. Continued lines are joined, a line is split at `&&`, `||`, `;`, `|` and `$(`, and a piece counts only when `terraform` is its command word, so an `echo` that names a Terraform command is not one.
 */
function terraformCommands(script: string): Array<Array<string>> {
  const logicalLines = script.replace(/\\\n/g, ' ').split('\n');
  const commands: Array<Array<string>> = [];
  for (const line of logicalLines) {
    for (const piece of line.split(/&&|\|\||;|\||\$\(/)) {
      const words = piece.trim().split(/\s+/).filter(Boolean);
      while (words.length > 0 && (COMMAND_PREFIXES.has(words[0]) || /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[0]))) {
        words.shift();
      }
      if (words[0] === 'terraform') commands.push(words);
    }
  }
  return commands;
}

/** The subcommand of a Terraform command's words: the first word after `terraform` that does not begin with `-`. */
function terraformSubcommand(words: Array<string>): string | undefined {
  return words.slice(1).find((word) => !word.startsWith('-'));
}

/** Whether a Terraform command's words change infrastructure: `apply`, `destroy` or `plan -destroy`. */
function isMutating(words: Array<string>): boolean {
  const subcommand = terraformSubcommand(words);
  if (subcommand === 'apply' || subcommand === 'destroy') return true;
  return subcommand === 'plan' && words.includes('-destroy');
}

/** A mutating Terraform command of a workflow: where it stands, its words and its step's `env`. */
type MutatingCommand = { name: string; where: string; words: Array<string>; env: Record<string, unknown> };

/** The mutating Terraform commands of every workflow. */
function mutatingCommands(files: Array<WorkflowFile>): Array<MutatingCommand> {
  return files.flatMap(({ name, text }) =>
    runScripts(parseWorkflow(text)).flatMap(({ where, script, env }) =>
      terraformCommands(script)
        .filter(isMutating)
        .map((words) => ({ name, where, words, env }))
    )
  );
}

/** The violations of apply-root: a mutating Terraform command not run in the resolved AWS root. */
function applyRootViolations(files: Array<WorkflowFile>): Array<string> {
  return mutatingCommands(files).flatMap(({ name, where, words, env }) => {
    const at = `apply-root: ${name} ${where} runs ${words.join(' ')}`;
    if (!words.includes(APPLY_CHDIR)) return [at];
    if (env.AWS_ROOT !== RESOLVED_AWS_ROOT) return [`${at} with AWS_ROOT ${JSON.stringify(env.AWS_ROOT)}`];
    return [];
  });
}

/** The violations of no-main-push in one workflow: a push trigger or branch pattern that can match `main`. */
function mainPushViolations(file: WorkflowFile): Array<string> {
  const doc = parseWorkflow(file.text);
  const on = doc.on;
  if (on === 'push' || (Array.isArray(on) && on.includes('push'))) {
    return [`no-main-push: ${file.name} pushes on every branch`];
  }
  if (!isRecord(on) || !('push' in on)) return [];
  const push = isRecord(on.push) ? on.push : {};
  if ('branches-ignore' in push) return [`no-main-push: ${file.name} filters its push with branches-ignore`];
  if (!Array.isArray(push.branches)) return [`no-main-push: ${file.name} pushes with no branch filter`];
  return push.branches.flatMap((pattern: unknown) => {
    if (typeof pattern !== 'string') return [`no-main-push: ${file.name} has a branch pattern that is not a string`];
    if (pattern.startsWith('!')) return [];
    if (pattern.includes('main') || pattern === '*' || pattern === '**' || pattern.startsWith('*')) {
      return [`no-main-push: ${file.name} pushes on ${pattern}`];
    }
    return [];
  });
}

/** The violations of shared-concurrency in one workflow. */
function concurrencyViolations(file: WorkflowFile): Array<string> {
  const { concurrency } = parseWorkflow(file.text);
  const group = isRecord(concurrency) ? concurrency.group : concurrency;
  const cancel = isRecord(concurrency) ? concurrency['cancel-in-progress'] : undefined;
  const violations: Array<string> = [];
  if (group !== SHARED_CONCURRENCY.group) {
    violations.push(`shared-concurrency: ${file.name} has the group ${JSON.stringify(group)}`);
  }
  if (cancel !== false) {
    violations.push(`shared-concurrency: ${file.name} sets cancel-in-progress ${JSON.stringify(cancel)}`);
  }
  return violations;
}

/** The key of the one entry of the deployment map whose `github_repository_id` is this repository's. */
function ownedDeploymentKey(mapText: string): string {
  const deployments = (JSON.parse(mapText) as { deployments?: Record<string, { github_repository_id?: unknown }> })
    .deployments;
  const owned = Object.entries(deployments ?? {})
    .filter(([, entry]) => entry.github_repository_id === REPOSITORY_ID)
    .map(([key]) => key);
  if (owned.length !== 1) {
    throw new Error(`infra/bootstrap/deployments.auto.tfvars.json has ${owned.length} entries for ${REPOSITORY_ID}`);
  }
  return owned[0];
}

/** Every `role-to-assume` of a workflow, by the job that assumes it. */
function assumedRoles(file: WorkflowFile): Array<{ jobId: string; role: unknown }> {
  return workflowJobs(parseWorkflow(file.text)).flatMap(([jobId, job]) =>
    jobSteps(job).flatMap((step) =>
      isRecord(step.with) && 'role-to-assume' in step.with ? [{ jobId, role: step.with['role-to-assume'] }] : []
    )
  );
}

/** The violations of deploy-role-arn across `files`: a literal role ARN anywhere, or a pipeline role other than its expected one. */
function roleArnViolations(files: Array<WorkflowFile>): Array<string> {
  return files.flatMap((file) => {
    const literal = [...file.text.matchAll(ROLE_ARN)].map(([arn]) => `deploy-role-arn: ${file.name} writes ${arn}`);
    const expected = EXPECTED_ROLES[file.name];
    if (expected === undefined) return literal;
    const roles = assumedRoles(file);
    if (roles.length === 0) return [...literal, `deploy-role-arn: ${file.name} assumes no role`];
    const unexpected = roles
      .filter(({ role }) => role !== expected)
      .map(({ jobId, role }) => `deploy-role-arn: ${file.name} job ${jobId} assumes ${JSON.stringify(role)}`);
    return [...literal, ...unexpected];
  });
}

/** The ids a job's `needs` lists, a single string read as a list of one. */
function jobNeeds(job: Record<string, unknown>): Array<string> {
  const { needs } = job;
  if (typeof needs === 'string') return [needs];
  return Array.isArray(needs) ? needs.filter((id): id is string => typeof id === 'string') : [];
}

/** The violations of needs-resolve in one writing workflow. */
function needsResolveViolations(file: WorkflowFile): Array<string> {
  const jobs = workflowJobs(parseWorkflow(file.text));
  if (!jobs.some(([jobId]) => jobId === RESOLVE_JOB)) return [`needs-resolve: ${file.name} has no job ${RESOLVE_JOB}`];
  return jobs
    .filter(([jobId, job]) => jobId !== RESOLVE_JOB && !jobNeeds(job).includes(RESOLVE_JOB))
    .map(([jobId]) => `needs-resolve: ${file.name} job ${jobId} does not need ${RESOLVE_JOB}`);
}

/** The environment names the jobs of a workflow name, in job order, each once. */
function environmentNames(file: WorkflowFile): Array<string> {
  const names = workflowJobs(parseWorkflow(file.text)).flatMap(([, job]) => {
    const environment = job.environment;
    if (typeof environment === 'string') return [environment];
    if (isRecord(environment) && typeof environment.name === 'string') return [environment.name];
    return environment === undefined ? [] : [JSON.stringify(environment)];
  });
  return [...new Set(names)];
}

/** The violations of environments across the pipeline's three workflows. */
function environmentViolations(files: Array<WorkflowFile>): Array<string> {
  const named = Object.entries(EXPECTED_ENVIRONMENTS).flatMap(([name, expected]) => {
    const actual = environmentNames(workflowFile(files, name));
    return JSON.stringify(actual) === JSON.stringify(expected)
      ? []
      : [`environments: ${name} names ${JSON.stringify(actual)}, not ${JSON.stringify(expected)}`];
  });
  const deploy = workflowJobs(parseWorkflow(workflowFile(files, 'deploy.yml').text)).find(([id]) => id === 'deploy');
  const environment = deploy?.[1].environment;
  const form =
    isRecord(environment) && typeof environment.url === 'string'
      ? []
      : [`environments: deploy.yml job deploy names its environment without a url: ${JSON.stringify(environment)}`];
  return [...named, ...form];
}

/** One provider block of a dependency lock: its address, the version it selects and its hashes by scheme. */
type LockProvider = { address: string; version: string; h1: Array<string>; zh: Array<string> };

/** The provider blocks of a `.terraform.lock.hcl` text; throws when a block holds no `hashes` list. */
function lockProviders(text: string): Array<LockProvider> {
  return [...text.matchAll(/^provider "([^"]+)" \{\n([\s\S]*?)^\}/gm)].map(([, address, body]) => {
    const version = /^\s*version\s*=\s*"([^"]*)"/m.exec(body)?.[1] ?? '';
    const list = /^\s*hashes\s*=\s*\[([\s\S]*?)\]/m.exec(body)?.[1];
    if (list === undefined) throw new Error(`the lock's provider ${address} holds no hashes list`);
    const hashes = [...list.matchAll(/"([^"]+)"/g)].map(([, hash]) => hash);
    return {
      address,
      version,
      h1: hashes.filter((hash) => hash.startsWith('h1:')),
      zh: hashes.filter((hash) => hash.startsWith('zh:'))
    };
  });
}

/** A `terraform init` of a workflow job: where it stands, the job's `runs-on` as parsed, and the root it initialises. */
type TerraformInit = { name: string; jobId: string; runsOn: unknown; root: string | undefined; words: Array<string> };

/** The `working-directory` of a `defaults.run` mapping, when it is a string. */
function defaultWorkingDirectory(owner: Record<string, unknown>): string | undefined {
  const defaults = owner.defaults;
  if (!isRecord(defaults) || !isRecord(defaults.run)) return undefined;
  const directory = defaults.run['working-directory'];
  return typeof directory === 'string' ? directory : undefined;
}

/** The AWS root `infra/envs/<key>/aws` of every deployment of the map that has one, by key. */
function mapAwsRoots(mapText: string): Array<string> {
  const deployments = (JSON.parse(mapText) as { deployments?: Record<string, unknown> }).deployments;
  return Object.keys(deployments ?? {})
    .sort()
    .map((key) => `infra/envs/${key}/aws`)
    .filter((root) => existsSync(join(REPO_ROOT, root)));
}

/** Whether a job runs once per deployment the resolve job lists: its matrix's one dimension is that list. */
function runsPerOwnedDeployment(job: Record<string, unknown>): boolean {
  const { strategy } = job;
  if (!isRecord(strategy) || !isRecord(strategy.matrix)) return false;
  const keys = Object.keys(strategy.matrix);
  return keys.length === 1 && strategy.matrix.deployment === OWNED_DEPLOYMENTS;
}

/** Whether a step of `job` binds `AWS_ROOT` to a value that stands for every AWS root of the map. */
function bindsMapAwsRoot(job: Record<string, unknown>, step: Record<string, unknown>): boolean {
  const bound = stepEnv(step).AWS_ROOT;
  return bound === RESOLVED_AWS_ROOT || (bound === MATRIX_AWS_ROOT && runsPerOwnedDeployment(job));
}

/**
 * Every `terraform init` of a `run:` step of every job of every workflow, the scripts it calls included. The root is the value of its `-chdir=` word with the quotes removed; else the step's `working-directory`; else the job's, then the workflow's, `defaults.run.working-directory`; else undefined. A `-chdir="$AWS_ROOT"` in a step that binds `AWS_ROOT` to the resolve job's `aws_root` output, or to `matrix.deployment.aws_root` in a job whose matrix is the resolve job's `deployments` list, yields one init for each root of `mapAwsRoots`; an `$AWS_ROOT` bound to anything else stays as it is written.
 */
function terraformInits(files: Array<WorkflowFile>, mapText: string): Array<TerraformInit> {
  return files.flatMap(({ name, text }) => {
    const doc = parseWorkflow(text);
    return workflowJobs(doc).flatMap(([jobId, job]) =>
      jobSteps(job).flatMap((step) => {
        if (typeof step.run !== 'string') return [];
        const stepDirectory = typeof step['working-directory'] === 'string' ? step['working-directory'] : undefined;
        const resolved = bindsMapAwsRoot(job, step);
        return terraformCommands(withCalledScripts(step.run))
          .filter((words) => terraformSubcommand(words) === 'init')
          .flatMap((words) => {
            const chdir = words.find((word) => word.startsWith('-chdir='));
            const root =
              chdir !== undefined
                ? chdir.slice('-chdir='.length).replace(/["']/g, '')
                : (stepDirectory ?? defaultWorkingDirectory(job) ?? defaultWorkingDirectory(doc));
            const roots = chdir === APPLY_CHDIR && resolved ? mapAwsRoots(mapText) : [root];
            return roots.map((each) => ({
              name,
              jobId,
              runsOn: job['runs-on'],
              root: each?.replace(/\/+$/, ''),
              words
            }));
          });
      })
    );
  });
}

/** The labels of a job's `runs-on`, or undefined when it is not a literal string, list of strings or `labels` mapping. */
function runnerLabels(runsOn: unknown): Array<string> | undefined {
  const value = isRecord(runsOn) ? runsOn.labels : runsOn;
  const labels = typeof value === 'string' ? [value] : value;
  if (!Array.isArray(labels) || labels.length === 0) return undefined;
  if (!labels.every((label): label is string => typeof label === 'string' && !label.includes('${{'))) return undefined;
  return labels;
}

/** Whether a runner label names an ARM runner. */
function isArmLabel(label: string): boolean {
  return label.endsWith('-arm') || label.toLowerCase() === 'arm64';
}

/** The text of `<root>/.terraform.lock.hcl` in the repository, or undefined when it has none. */
function readRepoLock(root: string): string | undefined {
  const path = join(REPO_ROOT, root, LOCK_FILE);
  return existsSync(path) ? readFileSync(path, 'utf8') : undefined;
}

/** The violations of arm-lock, each lock read through `readLock(root)`. */
function armLockViolations(
  files: Array<WorkflowFile>,
  readLock: (root: string) => string | undefined,
  mapText: string
): Array<string> {
  const violations = terraformInits(files, mapText).flatMap(({ name, jobId, runsOn, root, words }) => {
    const at = `arm-lock: ${name} job ${jobId}`;
    const labels = runnerLabels(runsOn);
    if (labels === undefined) return [`${at} runs on a runner the rule cannot read: ${JSON.stringify(runsOn)}`];
    if (!labels.some(isArmLabel)) return [];
    if (root === undefined || !READABLE_ROOT.test(root)) {
      return [`${at} initialises a root the rule cannot read: ${words.join(' ')}`];
    }
    const text = readLock(root);
    if (text === undefined) return [`${at} initialises ${root}, which has no ${LOCK_FILE}`];
    return lockProviders(text)
      .filter(({ h1 }) => h1.length !== LOCK_PLATFORMS.length)
      .map(
        ({ address, version, h1 }) =>
          `${at} initialises ${root}, whose lock holds ${h1.length} h1 hashes of ${LOCK_PLATFORMS.length} for ${address} ${version}`
      );
  });
  return [...new Set(violations)];
}

/** A root lock: its path from the repository root and its text. */
type RootLock = { path: string; text: string };

/** Every `.terraform.lock.hcl` under `infra/`, outside `infra/modules/` and every `.terraform` directory, by path. */
function rootLockFiles(): Array<RootLock> {
  const found: Array<RootLock> = [];
  function walk(directory: string): void {
    for (const entry of readdirSync(join(REPO_ROOT, directory), { withFileTypes: true })) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) {
        if (entry.name !== '.terraform' && path !== 'infra/modules') walk(path);
      } else if (entry.name === LOCK_FILE) {
        found.push({ path, text: readFileSync(join(REPO_ROOT, path), 'utf8') });
      }
    }
  }
  walk('infra');
  return found.sort((a, b) => a.path.localeCompare(b.path));
}

/** The violations of lock-platforms across `locks`. */
function lockPlatformViolations(locks: Array<RootLock>): Array<string> {
  const violations: Array<string> = [];
  const listsByProvider = new Map<string, Map<string, Array<string>>>();
  for (const { path, text } of locks) {
    for (const { address, version, h1, zh } of lockProviders(text)) {
      if (h1.length !== LOCK_PLATFORMS.length) {
        violations.push(
          `lock-platforms: ${path} holds ${h1.length} h1 hashes of ${LOCK_PLATFORMS.length} for ${address} ${version}`
        );
      }
      const provider = `${address} ${version}`;
      const lists = listsByProvider.get(provider) ?? new Map<string, Array<string>>();
      const list = JSON.stringify([...h1, ...zh].sort());
      lists.set(list, [...(lists.get(list) ?? []), path]);
      listsByProvider.set(provider, lists);
    }
  }
  for (const [provider, lists] of listsByProvider) {
    if (lists.size > 1) {
      const groups = [...lists.values()].map((paths) => `[${paths.join(', ')}]`).join(' and ');
      violations.push(`lock-platforms: ${provider} has different hashes in ${groups}`);
    }
  }
  return violations;
}

const FILES = workflowFiles();
const MAP_TEXT = readFileSync(BOOTSTRAP_MAP, 'utf8');
/** The AWS root of this repository's own deployment. */
const OWNED_AWS_ROOT = `infra/envs/${ownedDeploymentKey(MAP_TEXT)}/aws`;

/** A `(id: <id>\n env:\n )AWS_ROOT: <resolved>` match in a step, the `$1` group ending before `AWS_ROOT`. */
function awsRootBinding(id: string): RegExp {
  return new RegExp(
    `(id: ${id}\n {8}env:\n(?: {10}.*\n)*? {10})AWS_ROOT: \\$\\{\\{ needs\\.resolve\\.outputs\\.aws_root \\}\\}`
  );
}

describe('apply-root: no workflow applies or destroys anything but the resolved AWS root', () => {
  it('reads every workflow file, the pipeline three among them', () => {
    const names = FILES.map((file) => file.name);
    expect(names).toEqual(expect.arrayContaining(['deploy.yml', 'destroy.yml', 'infra-plan.yml', 'main.yaml']));
  });

  it('finds the applies of deploy.yml and the destroy plans and applies of destroy.yml, so the rule is not vacuous', () => {
    const found = mutatingCommands(FILES).map(({ name, words }) => `${name}: ${words.slice(0, 3).join(' ')}`);
    expect(found).toEqual([
      `deploy.yml: terraform ${APPLY_CHDIR} apply`,
      `destroy.yml: terraform ${APPLY_CHDIR} plan`,
      `destroy.yml: terraform ${APPLY_CHDIR} plan`,
      `destroy.yml: terraform ${APPLY_CHDIR} apply`
    ]);
    for (const { env } of mutatingCommands(FILES)) expect(env.AWS_ROOT).toBe(RESOLVED_AWS_ROOT);
  });

  it('finds no violation in the real files', () => {
    expect(applyRootViolations(FILES)).toEqual([]);
  });

  it('does not count a Terraform command named inside an echo', () => {
    expect(terraformCommands('echo "::error::terraform apply exited $apply_exit."')).toEqual([]);
  });

  it.each([
    {
      fault: 'the deploy applies a literal example AWS root',
      name: 'deploy.yml',
      pattern: `terraform ${APPLY_CHDIR} apply`,
      replacement: 'terraform -chdir=infra/envs/example/aws apply'
    },
    {
      fault: 'the destroy plans the destroy of the Supabase root',
      name: 'destroy.yml',
      pattern: `terraform ${APPLY_CHDIR} plan -destroy`,
      replacement: 'terraform -chdir="$SUPABASE_ROOT" plan -destroy'
    },
    {
      fault: "the destroy's apply binds AWS_ROOT to the Supabase root output",
      name: 'destroy.yml',
      pattern: awsRootBinding('apply'),
      replacement: '$1AWS_ROOT: ${{ needs.resolve.outputs.supabase_root }}'
    },
    {
      fault: "the deploy's apply binds AWS_ROOT to a repository variable",
      name: 'deploy.yml',
      pattern: awsRootBinding('apply'),
      replacement: '$1AWS_ROOT: ${{ vars.AWS_ROOT }}'
    },
    {
      fault: 'a check job applies after a cd, with no -chdir',
      name: 'infra-plan.yml',
      pattern: 'run: terraform fmt -check -recursive -diff infra',
      replacement: 'run: cd infra/envs/example/aws && terraform apply -auto-approve'
    },
    {
      fault: 'main.yaml runs terraform destroy in a loop over every root',
      name: 'main.yaml',
      pattern: 'run: infra/scripts/terraform-checks.sh validate',
      replacement: 'run: for root in infra/envs/*/*/; do terraform -chdir="$root" destroy -auto-approve; done'
    }
  ])('reports a red copy in which $fault', ({ name, pattern, replacement }) => {
    const violations = applyRootViolations(withMutation(FILES, name, pattern, replacement));
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatch(new RegExp(`^apply-root: ${name.replace('.', '\\.')} `));
  });
});

describe('no-main-push: neither deploy.yml nor destroy.yml deploys or destroys on a push to main', () => {
  it.each(WRITING_WORKFLOWS)('finds no violation in %s', (name) => {
    expect(mainPushViolations(workflowFile(FILES, name))).toEqual([]);
  });

  it.each([
    {
      fault: 'deploy.yml adds main',
      name: 'deploy.yml',
      pattern: '      - "deploy/*"\n',
      extra: '      - "main"\n'
    },
    {
      fault: 'destroy.yml adds main',
      name: 'destroy.yml',
      pattern: '      - "deploy-evidence/destroy-*"\n',
      extra: '      - main\n'
    },
    {
      fault: 'deploy.yml adds a bare **',
      name: 'deploy.yml',
      pattern: '      - "deploy/*"\n',
      extra: '      - "**"\n'
    },
    {
      fault: 'deploy.yml adds a pattern starting with *',
      name: 'deploy.yml',
      pattern: '      - "deploy/*"\n',
      extra: '      - "*/staging"\n'
    }
  ])('reports a red copy in which $fault', ({ name, pattern, extra }) => {
    const [file] = withMutation(FILES, name, pattern, `${pattern}${extra}`).filter((f) => f.name === name);
    expect(mainPushViolations(file)).toHaveLength(1);
  });

  it('reports a red copy of destroy.yml whose push has no branch filter', () => {
    const [file] = withMutation(
      FILES,
      'destroy.yml',
      '  push:\n    branches:\n      - "deploy-evidence/destroy-*"\n',
      '  push:\n'
    ).filter((f) => f.name === 'destroy.yml');
    expect(mainPushViolations(file)).toEqual(['no-main-push: destroy.yml pushes with no branch filter']);
  });
});

describe('shared-concurrency: deploy.yml and destroy.yml share aws-pipeline and never cancel a running job', () => {
  it.each(WRITING_WORKFLOWS)('finds no violation in %s', (name) => {
    expect(concurrencyViolations(workflowFile(FILES, name))).toEqual([]);
  });

  it.each([
    {
      fault: 'deploy.yml cancels in progress',
      name: 'deploy.yml',
      pattern: 'cancel-in-progress: false',
      replacement: 'cancel-in-progress: true'
    },
    {
      fault: 'destroy.yml is back on a group of one deployment',
      name: 'destroy.yml',
      pattern: 'group: aws-pipeline',
      replacement: 'group: staging-aws'
    },
    {
      fault: 'deploy.yml has a group per ref',
      name: 'deploy.yml',
      pattern: 'group: aws-pipeline',
      replacement: 'group: aws-pipeline-${{ github.ref_name }}'
    }
  ])('reports a red copy in which $fault', ({ name, pattern, replacement }) => {
    const [file] = withMutation(FILES, name, pattern, replacement).filter((f) => f.name === name);
    expect(concurrencyViolations(file)).toHaveLength(1);
  });
});

describe('deploy-role-arn: no workflow names a role literally, and every pipeline role comes from the resolver', () => {
  it('finds no violation in the real files', () => {
    expect(roleArnViolations(FILES)).toEqual([]);
  });

  it.each(Object.keys(EXPECTED_ROLES))('finds %s assuming a role, so the rule is not vacuous', (name) => {
    expect(assumedRoles(workflowFile(FILES, name)).length).toBeGreaterThan(0);
  });

  it.each([
    {
      fault: 'destroy.yml assumes the role by a literal ARN',
      name: 'destroy.yml',
      pattern: `role-to-assume: ${RESOLVED_DEPLOY_ROLE_ARN}`,
      replacement: `role-to-assume: ${SOME_ROLE_ARN}`
    },
    {
      fault: 'deploy.yml assumes the role named by the environment variable',
      name: 'deploy.yml',
      pattern: `role-to-assume: ${RESOLVED_DEPLOY_ROLE_ARN}`,
      replacement: 'role-to-assume: ${{ vars.AWS_DEPLOY_ROLE_ARN }}'
    },
    {
      fault: 'deploy.yml assumes the plan role output',
      name: 'deploy.yml',
      pattern: `role-to-assume: ${RESOLVED_DEPLOY_ROLE_ARN}`,
      replacement: 'role-to-assume: ${{ needs.resolve.outputs.plan_role_arn }}'
    },
    {
      fault: 'infra-plan.yml assumes the plan role named by a repository variable',
      name: 'infra-plan.yml',
      pattern: `role-to-assume: ${MATRIX_PLAN_ROLE_ARN}`,
      replacement: 'role-to-assume: ${{ vars.AWS_PLAN_ROLE_ARN }}'
    },
    {
      fault: "infra-plan.yml assumes the matrix entry's deploy role",
      name: 'infra-plan.yml',
      pattern: `role-to-assume: ${MATRIX_PLAN_ROLE_ARN}`,
      replacement: 'role-to-assume: ${{ matrix.deployment.deploy_role_arn }}'
    },
    {
      fault: "infra-plan.yml's wrong-subject job names a literal deploy role ARN",
      name: 'infra-plan.yml',
      pattern: 'DEPLOY_ROLE_ARN: ${{ matrix.deployment.deploy_role_arn }}',
      replacement: `DEPLOY_ROLE_ARN: ${SOME_ROLE_ARN}`
    },
    {
      fault: 'deploy.yml writes a literal ARN in a comment',
      name: 'deploy.yml',
      pattern: 'permissions: {}\n',
      replacement: `# ${SOME_ROLE_ARN}\npermissions: {}\n`
    }
  ])('reports a red copy in which $fault', ({ name, pattern, replacement }) => {
    const violations = roleArnViolations(withMutation(FILES, name, pattern, replacement));
    expect(violations.length).toBeGreaterThan(0);
    expect(violations.every((violation) => violation.startsWith(`deploy-role-arn: ${name} `))).toBe(true);
  });

  it('reports a literal ARN in a workflow outside the pipeline', () => {
    const extra = { name: 'other.yml', text: `env:\n  ROLE: ${SOME_ROLE_ARN}\n` };
    expect(roleArnViolations([...FILES, extra])).toEqual([`deploy-role-arn: other.yml writes ${SOME_ROLE_ARN}`]);
  });
});

describe('environments: the resolved environment in deploy.yml, the resolved destroy environment in destroy.yml, none in infra-plan.yml', () => {
  it('finds no violation in the real files', () => {
    expect(environmentViolations(FILES)).toEqual([]);
  });

  it.each([
    {
      fault: 'the pull-request plan job names staging',
      name: 'infra-plan.yml',
      pattern: '  plan:\n    needs: resolve\n',
      replacement: '  plan:\n    needs: resolve\n    environment: staging\n'
    },
    {
      fault: 'the destroy apply job names a literal staging-destroy',
      name: 'destroy.yml',
      pattern: /environment: \$\{\{ needs\.resolve\.outputs\.destroy_environment \}\}(?![\s\S]*environment: \$\{\{)/,
      replacement: 'environment: staging-destroy'
    },
    {
      fault: 'the deploy job names a literal staging',
      name: 'deploy.yml',
      pattern: 'name: ${{ needs.resolve.outputs.environment }}\n',
      replacement: 'name: staging\n'
    },
    {
      fault: 'the deploy job names the destroy environment output',
      name: 'deploy.yml',
      pattern: 'name: ${{ needs.resolve.outputs.environment }}\n',
      replacement: 'name: ${{ needs.resolve.outputs.destroy_environment }}\n'
    },
    {
      fault: 'the deploy job names its environment without a url',
      name: 'deploy.yml',
      pattern: /\n {6}url: https:\/\/\$\{\{ needs\.resolve\.outputs\.domain \}\}/,
      replacement: ''
    }
  ])('reports a red copy in which $fault', ({ name, pattern, replacement }) => {
    expect(environmentViolations(withMutation(FILES, name, pattern, replacement))).toHaveLength(1);
  });
});

describe('needs-resolve: every job of deploy.yml and destroy.yml but resolve needs resolve', () => {
  it.each(WRITING_WORKFLOWS)('finds no violation in %s', (name) => {
    expect(needsResolveViolations(workflowFile(FILES, name))).toEqual([]);
  });

  it.each([
    {
      fault: 'the deploy job needs the checks job only',
      name: 'deploy.yml',
      pattern: 'needs: [resolve, checks]',
      replacement: 'needs: checks'
    },
    {
      fault: 'the plan-destroy job needs nothing',
      name: 'destroy.yml',
      pattern: '  plan-destroy:\n    needs: resolve\n',
      replacement: '  plan-destroy:\n'
    },
    {
      fault: 'the resolve job is renamed',
      name: 'deploy.yml',
      pattern: '  resolve:\n',
      replacement: '  resolver:\n'
    }
  ])('reports a red copy in which $fault', ({ name, pattern, replacement }) => {
    const [file] = withMutation(FILES, name, pattern, replacement).filter((f) => f.name === name);
    expect(needsResolveViolations(file)).toHaveLength(1);
  });
});

describe('arm-lock: every root a job on an ARM runner initialises has an h1 hash for each lock platform', () => {
  const OWNED_AWS_LOCK = readRepoLock(OWNED_AWS_ROOT) ?? '';

  it('finds the deploy job of deploy.yml initialising the AWS root of this repository on ubuntu-24.04-arm, so the rule is not vacuous', () => {
    expect(terraformInits(FILES, MAP_TEXT)).toContainEqual(
      expect.objectContaining({ name: 'deploy.yml', jobId: 'deploy', runsOn: 'ubuntu-24.04-arm', root: OWNED_AWS_ROOT })
    );
  });

  it('reads "$AWS_ROOT" bound to the resolved root as every AWS root of the map that exists', () => {
    const { deployments } = JSON.parse(MAP_TEXT) as { deployments: Record<string, unknown> };
    const wider = JSON.stringify({ deployments: { ...deployments, example: {}, nowhere: {} } });
    expect(mapAwsRoots(MAP_TEXT)).toEqual([OWNED_AWS_ROOT]);
    expect(mapAwsRoots(wider)).toEqual(['infra/envs/example/aws', OWNED_AWS_ROOT].sort());
    const roots = terraformInits(FILES, wider)
      .filter(({ name, jobId }) => name === 'deploy.yml' && jobId === 'deploy')
      .map(({ root }) => root);
    expect(new Set(roots)).toEqual(new Set(['infra/envs/example/aws', OWNED_AWS_ROOT]));
  });

  it('reads the provider blocks of the AWS root lock, and throws on a block with no hashes list', () => {
    expect(lockProviders(OWNED_AWS_LOCK).map(({ address }) => address)).toEqual([
      'registry.terraform.io/hashicorp/aws',
      'registry.terraform.io/hashicorp/random'
    ]);
    expect(() => lockProviders('provider "registry.terraform.io/hashicorp/aws" {\n  version = "6.68.0"\n}\n')).toThrow(
      /holds no hashes list/
    );
  });

  it('finds no violation in the real files', () => {
    expect(armLockViolations(FILES, readRepoLock, MAP_TEXT)).toEqual([]);
  });

  it('reports a red copy of the AWS root lock with one h1 hash removed, through the resolved root', () => {
    const mutated = OWNED_AWS_LOCK.replace(/^\s*"h1:[^\n]*\n/m, '');
    expect(mutated).not.toBe(OWNED_AWS_LOCK);
    const [aws] = lockProviders(OWNED_AWS_LOCK);
    const violations = armLockViolations(
      FILES,
      (root) => (root === OWNED_AWS_ROOT ? mutated : readRepoLock(root)),
      MAP_TEXT
    );
    expect(violations).toContain(
      `arm-lock: deploy.yml job deploy initialises ${OWNED_AWS_ROOT}, whose lock holds ${aws.h1.length - 1} h1 hashes of ${LOCK_PLATFORMS.length} for ${aws.address} ${aws.version}`
    );
  });

  it('reports a red copy of deploy.yml whose init binds AWS_ROOT to something other than the resolved root', () => {
    const files = withMutation(FILES, 'deploy.yml', awsRootBinding('init'), '$1AWS_ROOT: ${{ vars.AWS_ROOT }}');
    expect(armLockViolations(files, readRepoLock, MAP_TEXT)).toEqual([
      'arm-lock: deploy.yml job deploy initialises a root the rule cannot read: terraform -chdir="$AWS_ROOT" init -input=false -no-color -lockfile=readonly'
    ]);
  });

  it('reports a red copy of infra-plan.yml whose checks job runs on ubuntu-24.04-arm, naming a root it cannot read', () => {
    const files = withMutation(
      FILES,
      'infra-plan.yml',
      '  checks:\n    runs-on: ubuntu-24.04\n',
      '  checks:\n    runs-on: ubuntu-24.04-arm\n'
    );
    const violations = armLockViolations(files, readRepoLock, MAP_TEXT).filter((v) =>
      v.startsWith('arm-lock: infra-plan.yml ')
    );
    expect(violations).toContainEqual(
      expect.stringMatching(
        /^arm-lock: infra-plan\.yml job checks initialises a root the rule cannot read: .*-chdir="\$root"/
      )
    );
  });

  it('reports a red copy of deploy.yml whose deploy job runs on a runner it cannot read', () => {
    const files = withMutation(FILES, 'deploy.yml', 'runs-on: ubuntu-24.04-arm', 'runs-on: ${{ vars.DEPLOY_RUNNER }}');
    expect(armLockViolations(files, readRepoLock, MAP_TEXT)).toEqual([
      'arm-lock: deploy.yml job deploy runs on a runner the rule cannot read: "${{ vars.DEPLOY_RUNNER }}"'
    ]);
  });

  it('reads "$AWS_ROOT" bound to the matrix entry\'s root, in a job over the resolve job\'s list, as every AWS root of the map', () => {
    const { deployments } = JSON.parse(MAP_TEXT) as { deployments: Record<string, unknown> };
    const wider = JSON.stringify({ deployments: { ...deployments, example: {} } });
    const roots = (mapText: string): Set<string | undefined> =>
      new Set(
        terraformInits(FILES, mapText)
          .filter(({ name, jobId }) => name === 'infra-plan.yml' && jobId === 'plan')
          .map(({ root }) => root)
      );
    expect(roots(MAP_TEXT)).toEqual(new Set([OWNED_AWS_ROOT]));
    expect(roots(wider)).toEqual(new Set(['infra/envs/example/aws', OWNED_AWS_ROOT]));
  });

  it("finds no violation in a red copy of infra-plan.yml whose plan job runs on ubuntu-24.04-arm, the map's locks being complete", () => {
    const files = withMutation(
      FILES,
      'infra-plan.yml',
      /( {2}plan:\n(?: {4}.*\n)*? {4})runs-on: ubuntu-24\.04\n/,
      '$1runs-on: ubuntu-24.04-arm\n'
    );
    expect(armLockViolations(files, readRepoLock, MAP_TEXT)).toEqual([]);
  });

  it.each([
    {
      fault: 'the matrix is a literal list',
      pattern: /( {2}plan:\n[\s\S]*? {8}deployment: )\$\{\{ fromJSON\(needs\.resolve\.outputs\.deployments\) \}\}/,
      replacement: '$1[{ aws_root: somewhere }]'
    },
    {
      fault: 'the job has no matrix',
      pattern:
        /( {2}plan:\n[\s\S]*?) {4}strategy:\n {6}fail-fast: false\n {6}matrix:\n {8}deployment: \$\{\{ fromJSON\(needs\.resolve\.outputs\.deployments\) \}\}\n/,
      replacement: '$1'
    }
  ])(
    "reports a red copy of infra-plan.yml's plan job on ubuntu-24.04-arm in which $fault, naming a root it cannot read",
    ({ pattern, replacement }) => {
      const arm = withMutation(
        FILES,
        'infra-plan.yml',
        /( {2}plan:\n(?: {4}.*\n)*? {4})runs-on: ubuntu-24\.04\n/,
        '$1runs-on: ubuntu-24.04-arm\n'
      );
      const files = withMutation(arm, 'infra-plan.yml', pattern, replacement);
      expect(armLockViolations(files, readRepoLock, MAP_TEXT)).toEqual([
        'arm-lock: infra-plan.yml job plan initialises a root the rule cannot read: terraform -chdir="$AWS_ROOT" init -input=false -no-color -lockfile=readonly'
      ]);
    }
  );

  it('finds no violation in the "$root" inits of infra-plan.yml on ubuntu-24.04, as in the real file', () => {
    expect(armLockViolations([workflowFile(FILES, 'infra-plan.yml')], readRepoLock, MAP_TEXT)).toEqual([]);
  });
});

describe('lock-platforms: every root lock has an h1 hash for each lock platform, the same across roots', () => {
  const LOCKS = rootLockFiles();
  function lockAt(path: string): RootLock {
    const found = LOCKS.find((lock) => lock.path === path);
    if (!found) throw new Error(`no root lock at ${path}`);
    return found;
  }
  function withLock(path: string, text: string): Array<RootLock> {
    if (text === lockAt(path).text) throw new Error(`the mutation of ${path} changed nothing`);
    return LOCKS.map((lock) => (lock.path === path ? { path, text } : lock));
  }

  it('finds the root locks under infra/, the AWS root of this repository among them and none under infra/modules/', () => {
    const paths = LOCKS.map(({ path }) => path);
    expect(paths).toContain(`${OWNED_AWS_ROOT}/${LOCK_FILE}`);
    expect(paths.filter((path) => path.startsWith('infra/modules/'))).toEqual([]);
    expect(paths.filter((path) => path.includes('/.terraform/'))).toEqual([]);
  });

  it('finds no violation in the real files', () => {
    expect(lockPlatformViolations(LOCKS)).toEqual([]);
  });

  it('reports a red copy of the bootstrap lock with one h1 hash removed', () => {
    const path = `infra/bootstrap/${LOCK_FILE}`;
    const violations = lockPlatformViolations(withLock(path, lockAt(path).text.replace(/^\s*"h1:[^\n]*\n/m, '')));
    expect(violations).toContainEqual(expect.stringMatching(new RegExp(`^lock-platforms: ${path} holds `)));
  });

  it('reports a red copy of the example AWS lock with one h1 hash replaced by another, its count unchanged', () => {
    const path = `infra/envs/example/aws/${LOCK_FILE}`;
    const mutated = lockAt(path).text.replace(/"h1:[A-Za-z0-9+/]{43}="/, `"h1:${'A'.repeat(43)}="`);
    const violations = lockPlatformViolations(withLock(path, mutated));
    expect(violations).toContainEqual(
      expect.stringMatching(
        /^lock-platforms: registry\.terraform\.io\/hashicorp\/aws 6\.68\.0 has different hashes in /
      )
    );
    expect(violations.filter((violation) => violation.includes(' holds '))).toEqual(
      lockPlatformViolations(LOCKS).filter((violation) => violation.includes(' holds '))
    );
  });
});
