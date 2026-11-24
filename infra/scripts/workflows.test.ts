/**
 * Guards that span the workflow files under `.github/workflows/`, rather than any one of them.
 *
 * Each workflow's own test holds the rules of that file. The rules here need more than one file to state:
 *
 * - **apply-root** — every Terraform `apply`, `destroy` or `plan -destroy` in any workflow names `-chdir=infra/envs/staging/aws`. The example roots are a forker's template and the other staging roots are applied by hand; a workflow that applied one of them would reach state no reviewer of the pipeline approved.
 * - **no-main-push** — no push branch pattern of `deploy.yml` or `destroy.yml` can match `main`. A merge to the default branch must deploy and destroy nothing.
 * - **shared-concurrency** — `deploy.yml` and `destroy.yml` share the group `staging-aws` and never cancel a running job, so no deploy and destroy write the one state at the same time and no apply is cut short holding its lock.
 * - **deploy-role-arn** — the deploy role ARN written literally in `infra-plan.yml` and `destroy.yml` is the one the bootstrap root's tfvars create. The wrong-subject job proves a refusal against that ARN, and a refusal by a role that does not exist would prove nothing.
 * - **environments** — `staging` is named by `deploy.yml` alone and `staging-destroy` by `destroy.yml` alone, and `infra-plan.yml` names none, since an environment's name is the subject the deploy role trusts.
 * - **arm-lock** — every root a job on an ARM runner initialises has a lock whose every provider carries one `h1:` hash per platform of `LOCK_PLATFORMS`. `init -lockfile=readonly` on that runner installs packages whose `h1:` hashes it cannot record, and the plan then refuses them. A hash does not name its platform, so the rule counts them. A job that initialises Terraform on a runner, or in a root, that the rule cannot read as a literal is a violation.
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
const BOOTSTRAP_TFVARS = join(REPO_ROOT, 'infra', 'bootstrap', 'terraform.tfvars');
const BOOTSTRAP_MAP = join(REPO_ROOT, 'infra', 'bootstrap', 'deployments.auto.tfvars.json');
const REPOSITORY_ID = '546467466';
const LOCK_FILE = '.terraform.lock.hcl';

/** The one root a workflow may apply or destroy. */
const APPLY_ROOT = 'infra/envs/staging/aws';
/** The concurrency the deploy and destroy workflows share. */
const SHARED_CONCURRENCY = { group: 'staging-aws', 'cancel-in-progress': false };
/** The environments each pipeline workflow names, and the files that may name none. */
const EXPECTED_ENVIRONMENTS: Record<string, Array<string>> = {
  'deploy.yml': ['staging'],
  'destroy.yml': ['staging-destroy'],
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

/** Every `run:` script of a workflow, with the scripts it calls, and where it stands. */
function runScripts(doc: WorkflowDocument): Array<{ where: string; script: string }> {
  return workflowJobs(doc).flatMap(([jobId, job]) =>
    jobSteps(job).flatMap((step, index) =>
      typeof step.run === 'string'
        ? [
            {
              where: `job ${jobId} step ${String(step.id ?? step.name ?? `#${index + 1}`)}`,
              script: withCalledScripts(step.run)
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

/** The mutating Terraform commands of every workflow, as `<file> <where>: <command>`. */
function mutatingCommands(files: Array<WorkflowFile>): Array<{ name: string; where: string; words: Array<string> }> {
  return files.flatMap(({ name, text }) =>
    runScripts(parseWorkflow(text)).flatMap(({ where, script }) =>
      terraformCommands(script)
        .filter(isMutating)
        .map((words) => ({ name, where, words }))
    )
  );
}

/** The violations of apply-root: a mutating Terraform command that does not name the staging AWS root. */
function applyRootViolations(files: Array<WorkflowFile>): Array<string> {
  return mutatingCommands(files)
    .filter(({ words }) => !words.includes(`-chdir=${APPLY_ROOT}`))
    .map(({ name, where, words }) => `apply-root: ${name} ${where} runs ${words.join(' ')}`);
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

/** The value of a top-level string assignment of the bootstrap tfvars, comment lines ignored. */
function bootstrapValue(text: string, name: string): string {
  const uncommented = text
    .split('\n')
    .filter((line) => !/^\s*#/.test(line))
    .join('\n');
  const value = new RegExp(`^${name}\\s*=\\s*"([^"]*)"\\s*$`, 'm').exec(uncommented)?.[1];
  if (value === undefined) throw new Error(`infra/bootstrap/terraform.tfvars assigns no ${name}`);
  return value;
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

/** The deploy role ARN the bootstrap root's account values and its deployment map imply. */
function expectedDeployRoleArn(tfvarsText: string, mapText: string): string {
  const account = bootstrapValue(tfvarsText, 'aws_account_id');
  const path = bootstrapValue(tfvarsText, 'iam_path');
  const prefix = bootstrapValue(tfvarsText, 'name_prefix');
  const key = ownedDeploymentKey(mapText);
  return `arn:aws:iam::${account}:role${path}${prefix}-${key}-deploy`;
}

/** The violations of deploy-role-arn in one workflow: no literal role ARN, or one other than `expected`. */
function deployRoleArnViolations(file: WorkflowFile, expected: string): Array<string> {
  const arns = [...file.text.matchAll(ROLE_ARN)].map(([arn]) => arn);
  if (arns.length === 0) return [`deploy-role-arn: ${file.name} writes no role ARN`];
  return arns.filter((arn) => arn !== expected).map((arn) => `deploy-role-arn: ${file.name} writes ${arn}`);
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
  return Object.entries(EXPECTED_ENVIRONMENTS).flatMap(([name, expected]) => {
    const actual = environmentNames(workflowFile(files, name));
    return JSON.stringify(actual) === JSON.stringify(expected)
      ? []
      : [`environments: ${name} names ${JSON.stringify(actual)}, not ${JSON.stringify(expected)}`];
  });
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

/**
 * Every `terraform init` of a `run:` step of every job of every workflow, the scripts it calls included. The root is the value of its `-chdir=` word with the quotes removed; else the step's `working-directory`; else the job's, then the workflow's, `defaults.run.working-directory`; else undefined.
 */
function terraformInits(files: Array<WorkflowFile>): Array<TerraformInit> {
  return files.flatMap(({ name, text }) => {
    const doc = parseWorkflow(text);
    return workflowJobs(doc).flatMap(([jobId, job]) =>
      jobSteps(job).flatMap((step) => {
        if (typeof step.run !== 'string') return [];
        const stepDirectory = typeof step['working-directory'] === 'string' ? step['working-directory'] : undefined;
        return terraformCommands(withCalledScripts(step.run))
          .filter((words) => terraformSubcommand(words) === 'init')
          .map((words) => {
            const chdir = words.find((word) => word.startsWith('-chdir='));
            const root =
              chdir !== undefined
                ? chdir.slice('-chdir='.length).replace(/["']/g, '')
                : (stepDirectory ?? defaultWorkingDirectory(job) ?? defaultWorkingDirectory(doc));
            return { name, jobId, runsOn: job['runs-on'], root: root?.replace(/\/+$/, ''), words };
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
function armLockViolations(files: Array<WorkflowFile>, readLock: (root: string) => string | undefined): Array<string> {
  const violations = terraformInits(files).flatMap(({ name, jobId, runsOn, root, words }) => {
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
const TFVARS_TEXT = readFileSync(BOOTSTRAP_TFVARS, 'utf8');
const MAP_TEXT = readFileSync(BOOTSTRAP_MAP, 'utf8');
const DEPLOY_ROLE_ARN = expectedDeployRoleArn(TFVARS_TEXT, MAP_TEXT);

describe('apply-root: no workflow applies or destroys anything but the staging AWS root', () => {
  it('reads every workflow file, the pipeline three among them', () => {
    const names = FILES.map((file) => file.name);
    expect(names).toEqual(expect.arrayContaining(['deploy.yml', 'destroy.yml', 'infra-plan.yml', 'main.yaml']));
  });

  it('finds the applies of deploy.yml and the destroy plans and applies of destroy.yml, so the rule is not vacuous', () => {
    const found = mutatingCommands(FILES).map(({ name, words }) => `${name}: ${words.slice(0, 3).join(' ')}`);
    expect(found).toEqual([
      `deploy.yml: terraform -chdir=${APPLY_ROOT} apply`,
      `destroy.yml: terraform -chdir=${APPLY_ROOT} plan`,
      `destroy.yml: terraform -chdir=${APPLY_ROOT} plan`,
      `destroy.yml: terraform -chdir=${APPLY_ROOT} apply`
    ]);
  });

  it('finds no violation in the real files', () => {
    expect(applyRootViolations(FILES)).toEqual([]);
  });

  it('does not count a Terraform command named inside an echo', () => {
    expect(terraformCommands('echo "::error::terraform apply exited $apply_exit."')).toEqual([]);
  });

  it.each([
    {
      fault: 'the deploy applies the example AWS root',
      name: 'deploy.yml',
      pattern: `terraform -chdir=${APPLY_ROOT} apply`,
      replacement: 'terraform -chdir=infra/envs/example/aws apply'
    },
    {
      fault: 'the destroy plans the destroy of the Supabase root',
      name: 'destroy.yml',
      pattern: `terraform -chdir=${APPLY_ROOT} plan -destroy`,
      replacement: 'terraform -chdir=infra/envs/staging/supabase plan -destroy'
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
  it.each(['deploy.yml', 'destroy.yml'])('finds no violation in %s', (name) => {
    expect(mainPushViolations(workflowFile(FILES, name))).toEqual([]);
  });

  it.each([
    {
      fault: 'deploy.yml adds main',
      name: 'deploy.yml',
      pattern: '      - "deploy/staging"\n',
      extra: '      - "main"\n'
    },
    {
      fault: 'destroy.yml adds main',
      name: 'destroy.yml',
      pattern: '      - "deploy-evidence/destroy-staging"\n',
      extra: '      - main\n'
    },
    {
      fault: 'deploy.yml adds a bare **',
      name: 'deploy.yml',
      pattern: '      - "deploy/staging"\n',
      extra: '      - "**"\n'
    },
    {
      fault: 'deploy.yml adds a pattern starting with *',
      name: 'deploy.yml',
      pattern: '      - "deploy/staging"\n',
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
      '  push:\n    branches:\n      - "deploy-evidence/destroy-staging"\n',
      '  push:\n'
    ).filter((f) => f.name === 'destroy.yml');
    expect(mainPushViolations(file)).toEqual(['no-main-push: destroy.yml pushes with no branch filter']);
  });
});

describe('shared-concurrency: deploy.yml and destroy.yml share staging-aws and never cancel a running job', () => {
  it.each(['deploy.yml', 'destroy.yml'])('finds no violation in %s', (name) => {
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
      fault: 'destroy.yml has a group of its own',
      name: 'destroy.yml',
      pattern: 'group: staging-aws',
      replacement: 'group: staging-destroy'
    }
  ])('reports a red copy in which $fault', ({ name, pattern, replacement }) => {
    const [file] = withMutation(FILES, name, pattern, replacement).filter((f) => f.name === name);
    expect(concurrencyViolations(file)).toHaveLength(1);
  });
});

describe('deploy-role-arn: the literal deploy role ARN is the one the bootstrap root creates', () => {
  it("derives the ARN from aws_account_id, iam_path, name_prefix and the key of this repository's deployment", () => {
    expect(DEPLOY_ROLE_ARN).toBe('arn:aws:iam::471112560111:role/openvaa/openvaa-staging-deploy');
  });

  it.each(['infra-plan.yml', 'destroy.yml'])('finds no violation in %s', (name) => {
    expect(deployRoleArnViolations(workflowFile(FILES, name), DEPLOY_ROLE_ARN)).toEqual([]);
  });

  it('reports a red copy of destroy.yml that assumes another role', () => {
    const [file] = withMutation(FILES, 'destroy.yml', '/openvaa-staging-deploy', '/openvaa-staging-deployer').filter(
      (f) => f.name === 'destroy.yml'
    );
    expect(deployRoleArnViolations(file, DEPLOY_ROLE_ARN)).toEqual([
      'deploy-role-arn: destroy.yml writes arn:aws:iam::471112560111:role/openvaa/openvaa-staging-deployer'
    ]);
  });

  it('reports a red copy of infra-plan.yml whose refusal names a role in another account', () => {
    const [file] = withMutation(
      FILES,
      'infra-plan.yml',
      'arn:aws:iam::471112560111:',
      'arn:aws:iam::111111111111:'
    ).filter((f) => f.name === 'infra-plan.yml');
    expect(deployRoleArnViolations(file, DEPLOY_ROLE_ARN)).toHaveLength(1);
  });

  it('reports a red map whose staging key is renamed, against the unchanged workflows', () => {
    const { deployments } = JSON.parse(MAP_TEXT) as { deployments: Record<string, unknown> };
    const { staging, ...others } = deployments;
    const changed = expectedDeployRoleArn(TFVARS_TEXT, JSON.stringify({ deployments: { ...others, prod: staging } }));
    expect(changed).toBe('arn:aws:iam::471112560111:role/openvaa/openvaa-prod-deploy');
    expect(deployRoleArnViolations(workflowFile(FILES, 'infra-plan.yml'), changed)).toHaveLength(1);
  });
});

describe('environments: staging in deploy.yml only, staging-destroy in destroy.yml only, none in infra-plan.yml', () => {
  it('finds no violation in the real files', () => {
    expect(environmentViolations(FILES)).toEqual([]);
  });

  it.each([
    {
      fault: 'the pull-request plan job names staging',
      name: 'infra-plan.yml',
      pattern: '  plan:\n    if:',
      replacement: '  plan:\n    environment: staging\n    if:'
    },
    {
      fault: 'the destroy apply job names staging',
      name: 'destroy.yml',
      pattern: /environment: staging-destroy(?![\s\S]*environment: staging-destroy)/,
      replacement: 'environment: staging'
    },
    {
      fault: 'the deploy job names staging-destroy',
      name: 'deploy.yml',
      pattern: 'name: staging\n',
      replacement: 'name: staging-destroy\n'
    }
  ])('reports a red copy in which $fault', ({ name, pattern, replacement }) => {
    expect(environmentViolations(withMutation(FILES, name, pattern, replacement))).toHaveLength(1);
  });
});

describe('arm-lock: every root a job on an ARM runner initialises has an h1 hash for each lock platform', () => {
  const STAGING_AWS_LOCK = readRepoLock(APPLY_ROOT) ?? '';

  it('finds the deploy job of deploy.yml initialising the staging AWS root on ubuntu-24.04-arm, so the rule is not vacuous', () => {
    expect(terraformInits(FILES)).toContainEqual(
      expect.objectContaining({ name: 'deploy.yml', jobId: 'deploy', runsOn: 'ubuntu-24.04-arm', root: APPLY_ROOT })
    );
  });

  it('reads the provider blocks of the staging AWS lock, and throws on a block with no hashes list', () => {
    expect(lockProviders(STAGING_AWS_LOCK).map(({ address }) => address)).toEqual([
      'registry.terraform.io/hashicorp/aws',
      'registry.terraform.io/hashicorp/random'
    ]);
    expect(() => lockProviders('provider "registry.terraform.io/hashicorp/aws" {\n  version = "6.68.0"\n}\n')).toThrow(
      /holds no hashes list/
    );
  });

  it('finds no violation in the real files', () => {
    expect(armLockViolations(FILES, readRepoLock)).toEqual([]);
  });

  it('reports a red copy of the staging AWS lock with one h1 hash removed', () => {
    const mutated = STAGING_AWS_LOCK.replace(/^\s*"h1:[^\n]*\n/m, '');
    expect(mutated).not.toBe(STAGING_AWS_LOCK);
    const [aws] = lockProviders(STAGING_AWS_LOCK);
    const violations = armLockViolations(FILES, (root) => (root === APPLY_ROOT ? mutated : readRepoLock(root)));
    expect(violations).toContain(
      `arm-lock: deploy.yml job deploy initialises ${APPLY_ROOT}, whose lock holds ${aws.h1.length - 1} h1 hashes of ${LOCK_PLATFORMS.length} for ${aws.address} ${aws.version}`
    );
  });

  it('reports a red copy of infra-plan.yml whose checks job runs on ubuntu-24.04-arm, naming a root it cannot read', () => {
    const files = withMutation(FILES, 'infra-plan.yml', 'runs-on: ubuntu-24.04\n', 'runs-on: ubuntu-24.04-arm\n');
    const violations = armLockViolations(files, readRepoLock).filter((v) => v.startsWith('arm-lock: infra-plan.yml '));
    expect(violations).toContainEqual(
      expect.stringMatching(
        /^arm-lock: infra-plan\.yml job checks initialises a root the rule cannot read: .*-chdir="\$root"/
      )
    );
  });

  it('reports a red copy of deploy.yml whose deploy job runs on a runner it cannot read', () => {
    const files = withMutation(FILES, 'deploy.yml', 'runs-on: ubuntu-24.04-arm', 'runs-on: ${{ vars.DEPLOY_RUNNER }}');
    expect(armLockViolations(files, readRepoLock)).toEqual([
      'arm-lock: deploy.yml job deploy runs on a runner the rule cannot read: "${{ vars.DEPLOY_RUNNER }}"'
    ]);
  });

  it('finds no violation in the "$root" inits of infra-plan.yml on ubuntu-24.04, as in the real file', () => {
    expect(armLockViolations([workflowFile(FILES, 'infra-plan.yml')], readRepoLock)).toEqual([]);
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

  it('finds the root locks under infra/, the staging AWS root among them and none under infra/modules/', () => {
    const paths = LOCKS.map(({ path }) => path);
    expect(paths).toContain(`${APPLY_ROOT}/${LOCK_FILE}`);
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
