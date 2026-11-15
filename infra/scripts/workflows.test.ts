/**
 * Guards that span the workflow files under `.github/workflows/`, rather than any one of them.
 *
 * Each workflow's own test holds the rules of that file. The rules here need more than one file to state:
 *
 * - **apply-root** — every Terraform `apply`, `destroy` or `plan -destroy` in any workflow names
 *   `-chdir=infra/envs/staging/aws`. The example roots are a forker's template and the other staging roots are applied
 *   by hand; a workflow that applied one of them would reach state no reviewer of the pipeline approved.
 * - **no-main-push** — no push branch pattern of `deploy.yml` or `destroy.yml` can match `main`. A merge to the default
 *   branch must deploy and destroy nothing.
 * - **shared-concurrency** — `deploy.yml` and `destroy.yml` share the group `staging-aws` and never cancel a running
 *   job, so no deploy and destroy write the one state at the same time and no apply is cut short holding its lock.
 * - **deploy-role-arn** — the deploy role ARN written literally in `infra-plan.yml` and `destroy.yml` is the one the
 *   bootstrap root's tfvars create. The wrong-subject job proves a refusal against that ARN, and a refusal by a role
 *   that does not exist would prove nothing.
 * - **environments** — `staging` is named by `deploy.yml` alone and `staging-destroy` by `destroy.yml` alone, and
 *   `infra-plan.yml` names none, since an environment's name is the subject the deploy role trusts.
 *
 * Each rule is shown red on a mutated in-memory copy, so that its green result on the real files means something.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { jobSteps, parseWorkflow, workflowJobs } from './workflowGuards';
import type { WorkflowDocument } from './workflowGuards';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');
const WORKFLOW_DIR = join(REPO_ROOT, '.github', 'workflows');
const BOOTSTRAP_TFVARS = join(REPO_ROOT, 'infra', 'bootstrap', 'terraform.tfvars');

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

/** Every `run:` script of a workflow, with where it stands. */
function runScripts(doc: WorkflowDocument): Array<{ where: string; script: string }> {
  return workflowJobs(doc).flatMap(([jobId, job]) =>
    jobSteps(job).flatMap((step, index) =>
      typeof step.run === 'string'
        ? [{ where: `job ${jobId} step ${String(step.id ?? step.name ?? `#${index + 1}`)}`, script: step.run }]
        : []
    )
  );
}

/**
 * The Terraform commands of a script, each as its words. Continued lines are joined, a line is split at `&&`, `||`,
 * `;`, `|` and `$(`, and a piece counts only when `terraform` is its command word, so an `echo` that names a Terraform
 * command is not one.
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

/** Whether a Terraform command's words change infrastructure: `apply`, `destroy` or `plan -destroy`. */
function isMutating(words: Array<string>): boolean {
  const subcommand = words.slice(1).find((word) => !word.startsWith('-'));
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

/** The deploy role ARN the bootstrap root's tfvars imply. */
function expectedDeployRoleArn(tfvarsText: string): string {
  const account = bootstrapValue(tfvarsText, 'aws_account_id');
  const path = bootstrapValue(tfvarsText, 'iam_path');
  const prefix = bootstrapValue(tfvarsText, 'name_prefix');
  const environment = bootstrapValue(tfvarsText, 'deploy_environment');
  return `arn:aws:iam::${account}:role${path}${prefix}-${environment}-deploy`;
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

const FILES = workflowFiles();
const TFVARS_TEXT = readFileSync(BOOTSTRAP_TFVARS, 'utf8');
const DEPLOY_ROLE_ARN = expectedDeployRoleArn(TFVARS_TEXT);

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
      pattern: 'terraform -chdir="$root" validate -no-color',
      replacement: 'terraform -chdir="$root" destroy -auto-approve'
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
  it('derives the ARN from aws_account_id, iam_path, name_prefix and deploy_environment', () => {
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

  it('reports a red tfvars whose deploy_environment changed, against the unchanged workflows', () => {
    const changed = expectedDeployRoleArn(
      TFVARS_TEXT.replace('deploy_environment = "staging"', 'deploy_environment = "prod"')
    );
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
